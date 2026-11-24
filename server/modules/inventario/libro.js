import { ErrorApi } from '../../middleware/errores.js'
import { hoy } from '../../util/fechas.js'
import * as repo from '../persistencia/repo.js'

const redondear = (n) => Math.round(n * 10000) / 10000

// Libro de movimientos: ÚNICA forma de cambiar el stock. Cada entrada o salida deja rastro.
// movimientos: [{ insumoId, tipo, cantidad (+ entra, - sale), motivo? }]
export function registrar(negocioId, movimientos, { usuarioId = null, fecha = hoy(), origen = null } = {}) {
  return repo.transaccion(async () => {
    const listos = await repo.transformar(negocioId, 'insumos', (insumos) =>
      movimientos.flatMap((m) => {
        const insumo = insumos.find((i) => i.id === m.insumoId)
        if (!insumo || m.cantidad === 0) return []
        insumo.stock = redondear(insumo.stock + m.cantidad)
        return [{ motivo: '', ...m, cantidad: redondear(m.cantidad), nombre: insumo.nombre, saldo: insumo.stock, precio: insumo.precio }]
      }))
    for (const m of listos) await repo.crear(negocioId, 'movimientos', { ...m, usuarioId, fecha, origen })
    return listos
  })
}

export function prepararAjuste({ tipo, cantidad, motivo }, insumo) {
  if (!['conteo', 'desperdicio'].includes(tipo)) throw new ErrorApi(400, 'El tipo de ajuste no es válido')
  const valida = Number.isFinite(cantidad) && (tipo === 'conteo' ? cantidad >= 0 : cantidad > 0)
  if (!valida) throw new ErrorApi(400, 'La cantidad no es válida')
  if (!motivo?.trim()) throw new ErrorApi(400, 'Escribe el motivo')
  return {
    insumoId: insumo.id,
    tipo,
    motivo: motivo.trim(),
    cantidad: redondear(tipo === 'conteo' ? cantidad - insumo.stock : -cantidad),
  }
}
