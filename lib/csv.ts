// Convierte un array de objetos a texto CSV. Maneja comas, comillas y saltos
// de línea dentro de los valores, y serializa fechas/objetos anidados como texto.
export function toCSV(rows: any[]): string {
    if (rows.length === 0) return ''
  
    const headers = Object.keys(rows[0])
  
    const escape = (val: any): string => {
      if (val === null || val === undefined) return ''
      if (val instanceof Date) return val.toISOString()
      const str = typeof val === 'object' ? JSON.stringify(val) : String(val)
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }
  
    const headerLine = headers.join(',')
    const lines = rows.map((row) => headers.map((h) => escape(row[h])).join(','))
    return [headerLine, ...lines].join('\n')
  }