import { esFecha, hoy } from '../../util/fechas.js'

export function validarCompra({ fecha, cantidad, valorTotal }) {
  if (!esFecha(fecha)) return 'La fecha no es válida'
  if (fecha > hoy()) return 'La fecha no puede ser futura'
  if (!(cantidad > 0)) return 'La cantidad debe ser mayor que 0'
  if (!(valorTotal > 0)) return 'El valor debe ser mayor que 0'
  return null
}

export const precioUnitario = (valorTotal, cantidad) => Math.round(valorTotal / cantidad)
