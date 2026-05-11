import { logBox } from './structuredLog'

/** One format for every Solana tx the demo cares about. */
export function swifloApiChainLog(instructionCamel: string, signature: string): void {
  logBox('SWIFLO API', 'ON-CHAIN TRANSACTION', {
    instruction: instructionCamel,
    signature,
  })
}
