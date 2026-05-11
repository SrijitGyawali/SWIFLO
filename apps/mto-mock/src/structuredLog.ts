type LogValue = string | number | bigint | boolean | null | undefined

export function logBox(scope: string, title: string, fields: Record<string, LogValue> = {}): void {
  const rows = Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => [key, String(value)] as const)

  const keyWidth = rows.reduce((max, [key]) => Math.max(max, key.length), 0)
  const lines = [
    `${scope} :: ${title}`,
    ...rows.map(([key, value]) => `${key.padEnd(keyWidth)} : ${value}`),
  ]

  const width = lines.reduce((max, line) => Math.max(max, line.length), 0)
  const border = `+${'-'.repeat(width + 2)}+`
  const body = lines.map(line => `| ${line.padEnd(width)} |`)

  console.log([border, ...body, border].join('\n'))
}
