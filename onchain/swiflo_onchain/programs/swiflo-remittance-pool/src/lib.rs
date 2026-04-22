use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("GKWPTDkKS2jDrE3gkWWoTtbHnwaiqZwc8iM47QGsJ9mJ");

#[program]
pub mod swiflo_remittance_pool {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, fee_bps: u16) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.authority = ctx.accounts.authority.key();
        pool.mto_authority = ctx.accounts.mto_authority.key();
        pool.fee_bps = fee_bps;
        pool.total_transfers = 0;
        pool.total_volume_usdc = 0;
        pool.is_paused = false;
        pool.bump = ctx.bumps.pool;
        Ok(())
    }

    pub fn set_paused(ctx: Context<AdminOnly>, paused: bool) -> Result<()> {
        ctx.accounts.pool.is_paused = paused;
        Ok(())
    }

    pub fn initiate_transfer(
        ctx: Context<InitiateTransfer>,
        amount_usdc: u64,
        recipient_hash: [u8; 32],
        locked_rate: u64,
    ) -> Result<()> {
        require!(!ctx.accounts.pool.is_paused, SwifloError::Paused);
        require!(amount_usdc > 0, SwifloError::InvalidAmount);
        require!(locked_rate > 0, SwifloError::InvalidRate);

        let transfer_id = ctx.accounts.pool.total_transfers;

        // Transfer USDC from sender to pool escrow
        let cpi_accounts = Transfer {
            from: ctx.accounts.sender_usdc.to_account_info(),
            to: ctx.accounts.pool_usdc.to_account_info(),
            authority: ctx.accounts.sender.to_account_info(),
        };
        token::transfer(
            CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts),
            amount_usdc,
        )?;

        let transfer = &mut ctx.accounts.transfer;
        transfer.transfer_id = transfer_id;
        transfer.sender = ctx.accounts.sender.key();
        transfer.amount_usdc = amount_usdc;
        transfer.recipient_hash = recipient_hash;
        transfer.locked_rate = locked_rate;
        transfer.status = TransferStatus::Initiated;
        transfer.created_at = Clock::get()?.unix_timestamp;
        transfer.disbursed_at = 0;
        transfer.settled_at = 0;
        transfer.bump = ctx.bumps.transfer;

        let pool = &mut ctx.accounts.pool;
        pool.total_transfers += 1;
        pool.total_volume_usdc += amount_usdc;

        emit!(TransferInitiated {
            transfer_id,
            sender: transfer.sender,
            amount_usdc: transfer.amount_usdc,
            recipient_hash: transfer.recipient_hash,
            locked_rate: transfer.locked_rate,
        });

        Ok(())
    }

    pub fn confirm_disbursement(
        ctx: Context<ConfirmDisbursement>,
        _transfer_id: u64,
        mto_reference: String,
    ) -> Result<()> {
        require!(
            ctx.accounts.transfer.status == TransferStatus::Initiated,
            SwifloError::InvalidStatus
        );
        require!(mto_reference.len() <= 64, SwifloError::InvalidInput);

        let transfer = &mut ctx.accounts.transfer;
        transfer.status = TransferStatus::Disbursed;
        transfer.disbursed_at = Clock::get()?.unix_timestamp;
        transfer.mto_reference = mto_reference;

        emit!(TransferDisbursed {
            transfer_id: transfer.transfer_id,
            disbursed_at: transfer.disbursed_at,
        });

        Ok(())
    }

    pub fn settle_transfer(
        ctx: Context<SettleTransfer>,
        _transfer_id: u64,
    ) -> Result<()> {
        require!(
            ctx.accounts.transfer.status == TransferStatus::Disbursed,
            SwifloError::InvalidStatus
        );

        let amount = ctx.accounts.transfer.amount_usdc;
        let bump = ctx.accounts.pool.bump;
        let seeds = &[b"pool".as_ref(), &[bump]];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.pool_usdc.to_account_info(),
            to: ctx.accounts.vault_usdc.to_account_info(),
            authority: ctx.accounts.pool.to_account_info(),
        };
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                cpi_accounts,
                signer,
            ),
            amount,
        )?;

        let transfer = &mut ctx.accounts.transfer;
        transfer.status = TransferStatus::Settled;
        transfer.settled_at = Clock::get()?.unix_timestamp;

        emit!(TransferSettled {
            transfer_id: transfer.transfer_id,
            settled_at: transfer.settled_at,
        });

        Ok(())
    }
}

// ─── Accounts ────────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = Pool::LEN,
        seeds = [b"pool"],
        bump,
    )]
    pub pool: Account<'info, Pool>,

    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: stored for future authorization checks only
    pub mto_authority: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AdminOnly<'info> {
    #[account(
        mut,
        seeds = [b"pool"],
        bump = pool.bump,
        has_one = authority,
    )]
    pub pool: Account<'info, Pool>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct InitiateTransfer<'info> {
    #[account(
        mut,
        seeds = [b"pool"],
        bump = pool.bump,
    )]
    pub pool: Account<'info, Pool>,

    #[account(
        init,
        payer = sender,
        space = TransferRecord::LEN,
        seeds = [b"transfer", pool.total_transfers.to_le_bytes().as_ref()],
        bump,
    )]
    pub transfer: Account<'info, TransferRecord>,

    #[account(mut)]
    pub sender: Signer<'info>,

    #[account(mut, constraint = sender_usdc.owner == sender.key())]
    pub sender_usdc: Account<'info, TokenAccount>,

    #[account(mut)]
    pub pool_usdc: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(transfer_id: u64)]
pub struct ConfirmDisbursement<'info> {
    #[account(seeds = [b"pool"], bump = pool.bump)]
    pub pool: Account<'info, Pool>,

    #[account(
        mut,
        seeds = [b"transfer", transfer_id.to_le_bytes().as_ref()],
        bump = transfer.bump,
    )]
    pub transfer: Account<'info, TransferRecord>,

    #[account(constraint = mto_authority.key() == pool.mto_authority @ SwifloError::UnauthorizedMTO)]
    pub mto_authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(transfer_id: u64)]
pub struct SettleTransfer<'info> {
    #[account(seeds = [b"pool"], bump = pool.bump, has_one = authority)]
    pub pool: Account<'info, Pool>,

    #[account(
        mut,
        seeds = [b"transfer", transfer_id.to_le_bytes().as_ref()],
        bump = transfer.bump,
    )]
    pub transfer: Account<'info, TransferRecord>,

    pub authority: Signer<'info>,

    #[account(mut)]
    pub pool_usdc: Account<'info, TokenAccount>,

    #[account(mut)]
    pub vault_usdc: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

// ─── State ───────────────────────────────────────────────────────────────────

#[account]
pub struct Pool {
    pub authority: Pubkey,
    pub mto_authority: Pubkey,
    pub fee_bps: u16,
    pub total_transfers: u64,
    pub total_volume_usdc: u64,
    pub is_paused: bool,
    pub bump: u8,
}

impl Pool {
    pub const LEN: usize = 8 + 32 + 32 + 2 + 8 + 8 + 1 + 1;
}

#[account]
pub struct TransferRecord {
    pub transfer_id: u64,
    pub sender: Pubkey,
    pub amount_usdc: u64,
    pub recipient_hash: [u8; 32],
    pub locked_rate: u64,
    pub status: TransferStatus,
    pub mto_reference: String,
    pub created_at: i64,
    pub disbursed_at: i64,
    pub settled_at: i64,
    pub bump: u8,
}

impl TransferRecord {
    pub const LEN: usize = 8 + 8 + 32 + 8 + 32 + 8 + 1 + (4 + 64) + 8 + 8 + 8 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum TransferStatus {
    Initiated,
    Disbursed,
    Settled,
    Cancelled,
}

// ─── Events ──────────────────────────────────────────────────────────────────

#[event]
pub struct TransferInitiated {
    pub transfer_id: u64,
    pub sender: Pubkey,
    pub amount_usdc: u64,
    pub recipient_hash: [u8; 32],
    pub locked_rate: u64,
}

#[event]
pub struct TransferDisbursed {
    pub transfer_id: u64,
    pub disbursed_at: i64,
}

#[event]
pub struct TransferSettled {
    pub transfer_id: u64,
    pub settled_at: i64,
}

// ─── Errors ──────────────────────────────────────────────────────────────────

#[error_code]
pub enum SwifloError {
    #[msg("Pool is paused")]
    Paused,
    #[msg("Invalid transfer amount")]
    InvalidAmount,
    #[msg("Invalid exchange rate")]
    InvalidRate,
    #[msg("Invalid transfer status for this action")]
    InvalidStatus,
    #[msg("Unauthorized MTO signature")]
    UnauthorizedMTO,
    #[msg("Invalid input data")]
    InvalidInput,
}
