const formato = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' })

export const hoy = () => formato.format(new Date()) // AAAA-MM-DD en hora de Bogotá

export const esFecha = (f) =>
  /^\d{4}-\d{2}-\d{2}$/.test(f ?? '') && !Number.isNaN(Date.parse(`${f}T00:00:00Z`))

export function sumarDias(fecha, dias) {
  const d = new Date(`${fecha}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

export const diaSemana = (fecha) => new Date(`${fecha}T00:00:00Z`).getUTCDay() // 0 = domingo

export const NOMBRES_DIA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
