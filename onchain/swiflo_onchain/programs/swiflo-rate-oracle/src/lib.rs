use anchor_lang::prelude::*;

declare_id!("AxbYcPE2L99uruyDN9RcsTpwui4JUvVGMsT1nupVazLC");

// 133.5 NPR per USD, scaled 10^6
const DEFAULT_NPR_PER_USD: u64 = 133_500_000;
// Rate lock validity: 5 minutes
const RATE_LOCK_VALIDITY_SECONDS: i64 = 300;

#[program]
pub mod swiflo_rate_oracle {
    use super::*;

    pub fn initialize_oracle(ctx: Context<InitializeOracle>) -> Result<()> {
        let oracle = &mut ctx.accounts.oracle;
        oracle.authority = ctx.accounts.authority.key();
        oracle.npr_per_usd = DEFAULT_NPR_PER_USD;
        oracle.last_updated = Clock::get()?.unix_timestamp;
        oracle.bump = ctx.bumps.oracle;
        Ok(())
    }

    pub fn update_rate(ctx: Context<UpdateRate>, npr_per_usd: u64) -> Result<()> {
        require!(npr_per_usd > 0, OracleError::InvalidRate);
        let oracle = &mut ctx.accounts.oracle;
        oracle.npr_per_usd = npr_per_usd;
        oracle.last_updated = Clock::get()?.unix_timestamp;

        emit!(RateUpdated {
            npr_per_usd,
            updated_at: oracle.last_updated,
        });

        Ok(())
    }

    pub fn lock_rate(ctx: Context<LockRate>, transfer_id: u64) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let oracle = &ctx.accounts.oracle;

        // Stale rate guard (5-minute freshness)
        require!(
            now - oracle.last_updated <= RATE_LOCK_VALIDITY_SECONDS,
            OracleError::StaleRate
        );

        let locked = &mut ctx.accounts.locked_rate;
        locked.transfer_id = transfer_id;
        locked.npr_per_usd = oracle.npr_per_usd;
        locked.locked_at = now;
        locked.bump = ctx.bumps.locked_rate;

        emit!(RateLocked {
            transfer_id,
            npr_per_usd: locked.npr_per_usd,
            locked_at: locked.locked_at,
        });

        Ok(())
    }
}

// ─── Accounts ────────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializeOracle<'info> {
    #[account(
        init,
        payer = authority,
        space = OracleState::LEN,
        seeds = [b"oracle"],
        bump,
    )]
    pub oracle: Account<'info, OracleState>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateRate<'info> {
    #[account(
        mut,
        seeds = [b"oracle"],
        bump = oracle.bump,
        has_one = authority,
    )]
    pub oracle: Account<'info, OracleState>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(transfer_id: u64)]
pub struct LockRate<'info> {
    #[account(seeds = [b"oracle"], bump = oracle.bump)]
    pub oracle: Account<'info, OracleState>,

    #[account(
        init,
        payer = requester,
        space = LockedRate::LEN,
        seeds = [b"locked_rate", transfer_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub locked_rate: Account<'info, LockedRate>,

    #[account(mut)]
    pub requester: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// ─── State ───────────────────────────────────────────────────────────────────

#[account]
pub struct OracleState {
    pub authority: Pubkey,
    pub npr_per_usd: u64,    // scaled 10^6
    pub last_updated: i64,
    pub bump: u8,
}

impl OracleState {
    pub const LEN: usize = 8 + 32 + 8 + 8 + 1;
}

#[account]
pub struct LockedRate {
    pub transfer_id: u64,
    pub npr_per_usd: u64,
    pub locked_at: i64,
    pub bump: u8,
}

impl LockedRate {
    pub const LEN: usize = 8 + 8 + 8 + 8 + 1;
}

// ─── Events ──────────────────────────────────────────────────────────────────

#[event]
pub struct RateUpdated {
    pub npr_per_usd: u64,
    pub updated_at: i64,
}

#[event]
pub struct RateLocked {
    pub transfer_id: u64,
    pub npr_per_usd: u64,
    pub locked_at: i64,
}

// ─── Errors ──────────────────────────────────────────────────────────────────

#[error_code]
pub enum OracleError {
    #[msg("Invalid rate value")]
    InvalidRate,
    #[msg("Rate is stale — update before locking")]
    StaleRate,
}
