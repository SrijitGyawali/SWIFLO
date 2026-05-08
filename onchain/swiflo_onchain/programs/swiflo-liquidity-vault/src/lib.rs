use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Burn, Token, TokenAccount, Transfer};

declare_id!("13BEbXJJ2aLQ6yMQA9QdtwguL2rDKdzsVBZNEbATwBhN");

const BASE_APR_BPS: u64 = 800;      // 8% base
const MAX_APR_BPS: u64 = 2000;      // 20% max
const UTIL_MULTIPLIER: u64 = 120;   // APR increases by 12% for every 100% utilization

#[program]
pub mod swiflo_liquidity_vault {
    use super::*;

    pub fn initialize_vault(ctx: Context<InitializeVault>, initial_apr_bps: u16) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.authority = ctx.accounts.authority.key();
        vault.pool_program = ctx.accounts.pool_program.key();
        vault.lp_mint = ctx.accounts.lp_mint.key();
        vault.total_liquidity = 0;
        vault.active_advances = 0;
        vault.total_yield_paid = 0;
        vault.current_apr_bps = initial_apr_bps;
        vault.bump = ctx.bumps.vault;
        Ok(())
    }

    pub fn deposit_liquidity(ctx: Context<DepositLiquidity>, amount: u64) -> Result<()> {
        require!(amount > 0, VaultError::InvalidAmount);

        // Snapshot pre-transfer state for share price calculation
        let vault_balance_before = ctx.accounts.vault_usdc.amount;
        let lp_supply_before     = ctx.accounts.lp_mint.supply;

        // Transfer USDC from LP to vault token account
        let cpi_accounts = Transfer {
            from: ctx.accounts.lp_usdc.to_account_info(),
            to: ctx.accounts.vault_usdc.to_account_info(),
            authority: ctx.accounts.lp.to_account_info(),
        };
        token::transfer(
            CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts),
            amount,
        )?;

        // Mint LP tokens 1:1 with deposited amount. This simplifies UX so
        // each deposited unit of USDC mints one LP token unit.
        // The proportional withdrawal math still works because burns use
        // the on-chain vault_balance / lp_supply ratio.
        let lp_to_mint: u64 = amount;
        require!(lp_to_mint > 0, VaultError::InvalidAmount);

        let bump = ctx.accounts.vault.bump;
        let seeds = &[b"vault".as_ref(), &[bump]];
        let signer = &[&seeds[..]];

        let cpi_accounts = MintTo {
            mint: ctx.accounts.lp_mint.to_account_info(),
            to: ctx.accounts.lp_token_account.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        };
        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                cpi_accounts,
                signer,
            ),
            lp_to_mint,
        )?;

        let vault = &mut ctx.accounts.vault;
        vault.total_liquidity += amount;
        vault.update_apr();

        emit!(LiquidityDeposited {
            lp: ctx.accounts.lp.key(),
            amount_usdc: amount,
            lp_tokens_minted: lp_to_mint,
        });

        Ok(())
    }

    pub fn advance_to_mto(ctx: Context<AdvanceToMto>, transfer_id: u64, amount: u64) -> Result<()> {
        require!(amount > 0, VaultError::InvalidAmount);
        require!(
            ctx.accounts.vault.total_liquidity >= ctx.accounts.vault.active_advances + amount,
            VaultError::InsufficientLiquidity
        );

        let bump = ctx.accounts.vault.bump;
        let seeds = &[b"vault".as_ref(), &[bump]];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_usdc.to_account_info(),
            to: ctx.accounts.mto_usdc.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        };
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                cpi_accounts,
                signer,
            ),
            amount,
        )?;

        let vault = &mut ctx.accounts.vault;
        vault.active_advances += amount;
        vault.update_apr();

        emit!(AdvancedToMto {
            transfer_id,
            amount_usdc: amount,
        });

        Ok(())
    }

    pub fn replenish_vault(ctx: Context<ReplenishVault>, transfer_id: u64, amount: u64) -> Result<()> {
        // Pool sends back USDC + fee after settlement
        let cpi_accounts = Transfer {
            from: ctx.accounts.pool_usdc.to_account_info(),
            to: ctx.accounts.vault_usdc.to_account_info(),
            authority: ctx.accounts.pool_authority.to_account_info(),
        };
        token::transfer(
            CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts),
            amount,
        )?;

        let vault = &mut ctx.accounts.vault;
        vault.active_advances = vault.active_advances.saturating_sub(amount);
        vault.update_apr();

        emit!(VaultReplenished {
            transfer_id,
            amount_usdc: amount,
        });

        Ok(())
    }

    pub fn claim_yield(ctx: Context<ClaimYield>, lp_tokens: u64) -> Result<()> {
        require!(lp_tokens > 0, VaultError::InvalidAmount);

        // Snapshot pre-burn state for share price calculation
        let vault_balance = ctx.accounts.vault_usdc.amount;
        let lp_supply     = ctx.accounts.lp_mint.supply;
        require!(lp_supply > 0, VaultError::InvalidAmount);

        // usdc_to_return = lp_tokens * vault_balance / lp_supply
        // When fee income has accrued in vault_usdc, this is > lp_tokens (yield captured)
        let usdc_to_return = (lp_tokens as u128 * vault_balance as u128 / lp_supply as u128) as u64;
        require!(usdc_to_return > 0, VaultError::InvalidAmount);

        // Burn LP tokens first
        let cpi_accounts = Burn {
            mint: ctx.accounts.lp_mint.to_account_info(),
            from: ctx.accounts.lp_token_account.to_account_info(),
            authority: ctx.accounts.lp.to_account_info(),
        };
        token::burn(
            CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts),
            lp_tokens,
        )?;

        // Return proportional USDC to LP
        let bump = ctx.accounts.vault.bump;
        let seeds = &[b"vault".as_ref(), &[bump]];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_usdc.to_account_info(),
            to: ctx.accounts.lp_usdc.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        };
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                cpi_accounts,
                signer,
            ),
            usdc_to_return,
        )?;

        let vault = &mut ctx.accounts.vault;
        vault.total_liquidity   = vault.total_liquidity.saturating_sub(usdc_to_return);
        vault.total_yield_paid += usdc_to_return;
        vault.update_apr();

        emit!(YieldClaimed {
            lp: ctx.accounts.lp.key(),
            lp_tokens_burned: lp_tokens,
            usdc_returned: usdc_to_return,
        });

        Ok(())
    }

    /// Sweeps fee income from vault_usdc to the Swiflo treasury wallet.
    /// Called by the settler after each settlement (30 bps of transfer amount).
    /// Only callable by vault.authority.
    pub fn collect_fees(ctx: Context<CollectFees>, amount: u64) -> Result<()> {
        require!(amount > 0, VaultError::InvalidAmount);

        let bump = ctx.accounts.vault.bump;
        let seeds = &[b"vault".as_ref(), &[bump]];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_usdc.to_account_info(),
            to:   ctx.accounts.treasury_usdc.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        };
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                cpi_accounts,
                signer,
            ),
            amount,
        )?;

        emit!(FeesCollected { amount });

        Ok(())
    }
}

// ─── Accounts ────────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = authority,
        space = Vault::LEN,
        seeds = [b"vault"],
        bump,
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        init,
        payer = authority,
        mint::decimals = 6,
        mint::authority = vault,
    )]
    pub lp_mint: Account<'info, Mint>,

    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: program ID stored for CPI authorization
    pub pool_program: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct DepositLiquidity<'info> {
    #[account(mut, seeds = [b"vault"], bump = vault.bump)]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub lp_mint: Account<'info, Mint>,

    #[account(mut)]
    pub lp: Signer<'info>,

    #[account(mut, constraint = lp_usdc.owner == lp.key())]
    pub lp_usdc: Account<'info, TokenAccount>,

    #[account(mut)]
    pub vault_usdc: Account<'info, TokenAccount>,

    #[account(mut)]
    pub lp_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct AdvanceToMto<'info> {
    #[account(mut, seeds = [b"vault"], bump = vault.bump, has_one = authority)]
    pub vault: Account<'info, Vault>,

    pub authority: Signer<'info>,

    #[account(mut)]
    pub vault_usdc: Account<'info, TokenAccount>,

    #[account(mut)]
    pub mto_usdc: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ReplenishVault<'info> {
    #[account(mut, seeds = [b"vault"], bump = vault.bump)]
    pub vault: Account<'info, Vault>,

    pub pool_authority: Signer<'info>,

    #[account(mut)]
    pub pool_usdc: Account<'info, TokenAccount>,

    #[account(mut)]
    pub vault_usdc: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimYield<'info> {
    #[account(mut, seeds = [b"vault"], bump = vault.bump)]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub lp_mint: Account<'info, Mint>,

    #[account(mut)]
    pub lp: Signer<'info>,

    #[account(mut)]
    pub lp_usdc: Account<'info, TokenAccount>,

    #[account(mut)]
    pub vault_usdc: Account<'info, TokenAccount>,

    #[account(mut, constraint = lp_token_account.owner == lp.key())]
    pub lp_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CollectFees<'info> {
    #[account(mut, seeds = [b"vault"], bump = vault.bump, has_one = authority)]
    pub vault: Account<'info, Vault>,

    pub authority: Signer<'info>,

    #[account(mut)]
    pub vault_usdc: Account<'info, TokenAccount>,

    #[account(mut)]
    pub treasury_usdc: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

// ─── State ───────────────────────────────────────────────────────────────────

#[account]
pub struct Vault {
    pub authority: Pubkey,
    pub pool_program: Pubkey,
    pub lp_mint: Pubkey,
    pub total_liquidity: u64,
    pub active_advances: u64,
    pub total_yield_paid: u64,
    pub current_apr_bps: u16,
    pub bump: u8,
}

impl Vault {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 8 + 8 + 8 + 2 + 1;

    pub fn update_apr(&mut self) {
        if self.total_liquidity == 0 {
            self.current_apr_bps = BASE_APR_BPS as u16;
            return;
        }
        let utilization_bps =
            (self.active_advances * 10_000) / self.total_liquidity;
        let bonus = (utilization_bps * UTIL_MULTIPLIER) / 10_000;
        let apr = (BASE_APR_BPS + bonus).min(MAX_APR_BPS);
        self.current_apr_bps = apr as u16;
    }
}

// ─── Events ──────────────────────────────────────────────────────────────────

#[event]
pub struct LiquidityDeposited {
    pub lp: Pubkey,
    pub amount_usdc: u64,
    pub lp_tokens_minted: u64,
}

#[event]
pub struct AdvancedToMto {
    pub transfer_id: u64,
    pub amount_usdc: u64,
}

#[event]
pub struct VaultReplenished {
    pub transfer_id: u64,
    pub amount_usdc: u64,
}

#[event]
pub struct YieldClaimed {
    pub lp: Pubkey,
    pub lp_tokens_burned: u64,
    pub usdc_returned: u64,
}

#[event]
pub struct FeesCollected {
    pub amount: u64,
}

// ─── Errors ──────────────────────────────────────────────────────────────────

#[error_code]
pub enum VaultError {
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Insufficient vault liquidity for this advance")]
    InsufficientLiquidity,
}
