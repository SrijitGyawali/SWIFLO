export function formatUsdc(lamports: number | bigint): string {
  return (Number(lamports) / 1_000_000).toFixed(2)
}

export function formatNpr(value: number | bigint): string {
  return 'Rs ' + Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

export function truncateAddress(addr: string, chars = 4): string {
  return `${addr.slice(0, chars)}...${addr.slice(-chars)}`
}

export function maskPhone(phone: string): string {
  if (phone.length < 6) return phone
  return phone.slice(0, 6) + 'XXXX' + phone.slice(-2)
}

export function formatTimeAgo(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}
