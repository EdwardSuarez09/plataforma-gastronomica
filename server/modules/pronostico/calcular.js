import { diaSemana, NOMBRES_DIA, sumarDias } from '../../util/fechas.js'

export const DIAS_MINIMOS = 14
const SEMANAS = 4 // se miran las últimas 4 repeticiones del mismo día

// { 'AAAA-MM-DD': { productoId: unidades } } sin ventas anuladas.
export function ventasPorDia(ventas) {
  const dias = {}
  for (const v of ventas) {
    if (v.estado === 'anulada') continue
    const dia = (dias[v.fecha] ??= {})
    for (const { productoId, cantidad } of v.items) dia[productoId] = (dia[productoId] ?? 0) + cantidad
  }
  return dias
}

// Promedio ponderado: el dato más reciente pesa más (4, 3, 2, 1).
export function promedioPonderado(valores) {
  const n = valores.length
  if (n === 0) return 0
  const pesos = valores.map((_, i) => n - i)
  const suma = valores.reduce((total, v, i) => total + v * pesos[i], 0)
  return suma / pesos.reduce((a, b) => a + b, 0)
}

export function predecir(dias, productoId, fecha) {
  // Antes de su primera venta el producto no existía: esos días no cuentan como cero.
  const primera = Object.keys(dias).filter((f) => dias[f][productoId] > 0).sort()[0]
  const iguales = Object.keys(dias)
    .filter((f) => f >= primera && f < fecha && diaSemana(f) === diaSemana(fecha))
    .sort()
    .reverse()
    .slice(0, SEMANAS)
  return Math.round(promedioPonderado(iguales.map((f) => dias[f][productoId] ?? 0)))
}

// Compara lo pronosticado con lo que de verdad se vendió en la última semana.
export function medirError(dias, productoIds) {
  const fechas = Object.keys(dias).sort()
  const ultima = fechas.at(-1)
  const prueba = fechas.filter((f) => f > sumarDias(ultima, -7))
  const pasado = Object.fromEntries(Object.entries(dias).filter(([f]) => !prueba.includes(f)))
  let diferencia = 0
  let real = 0
  for (const f of prueba) {
    for (const id of productoIds) {
      const vendido = dias[f][id] ?? 0
      diferencia += Math.abs(vendido - predecir(pasado, id, f))
      real += vendido
    }
  }
  return real > 0 ? diferencia / real : null
}

// Hoy no cuenta: el día no ha terminado y bajaría el promedio.
export function pronosticar(ventas, productos, hoy) {
  const dias = ventasPorDia(ventas.filter((v) => v.fecha < hoy))
  const diasConDatos = Object.keys(dias).length
  if (diasConDatos < DIAS_MINIMOS) return { suficiente: false, diasConDatos, diasMinimos: DIAS_MINIMOS }

  const fechas = Array.from({ length: 7 }, (_, i) => sumarDias(hoy, i + 1))
  return {
    suficiente: true,
    diasConDatos,
    diasMinimos: DIAS_MINIMOS,
    error: medirError(dias, productos.map((p) => p.id)),
    dias: fechas.map((fecha) => ({ fecha, nombre: NOMBRES_DIA[diaSemana(fecha)] })),
    productos: productos.map((p) => ({
      productoId: p.id,
      nombre: p.nombre,
      valores: fechas.map((f) => predecir(dias, p.id, f)),
    })),
  }
}
