export function parseGuests(csv: string) {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i]
    if (quoted && ch === '"' && csv[i + 1] === '"') { field += '"'; i++ }
    else if (ch === '"') quoted = !quoted
    else if (!quoted && ch === ',') { row.push(field.trim()); field = '' }
    else if (!quoted && (ch === '\n' || ch === '\r')) {
      if (ch === '\r' && csv[i + 1] === '\n') i++
      row.push(field.trim()); rows.push(row); row = []; field = ''
    } else field += ch
  }
  if (quoted) throw new Error('The CSV contains an unclosed quoted field.')
  row.push(field.trim()); rows.push(row)
  const records = rows.filter(columns => columns.some(Boolean))
  if (records[0]?.[0]?.toLowerCase() === 'name' && records[0]?.[1]?.toLowerCase() === 'email') records.shift()
  if (!records.length || records.some(columns => columns.length !== 2 || !columns.every(Boolean))) throw new Error('Use a CSV with two columns, name and email.')
  if (records.length > 250) throw new Error('Import up to 250 guests at a time.')
  return records.map(([name, email]) => ({ name, email }))
}
