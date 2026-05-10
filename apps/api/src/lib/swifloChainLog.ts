/** One format for every Solana tx the demo cares about (matches initiateTransfer line). */
export function swifloApiChainLog(instructionCamel: string, signature: string): void {
  console.log(`[swiflo-api] ${instructionCamel} on-chain: ${signature}`)
}
