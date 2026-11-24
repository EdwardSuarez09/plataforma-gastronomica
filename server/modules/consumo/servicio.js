import { costoProducto } from '../costos/calcular.js'
import { registrar } from '../inventario/libro.js'
import * as repo from '../persistencia/repo.js'
import { calcularDisponible, consumoDe } from './calcular.js'

export async function cargar(negocioId) {
  const nombres = ['productos', 'masas', 'insumos', 'movimientos', 'pedidos']
  const listas = await Promise.all(nombres.map((c) => repo.listar(negocioId, c)))
  return Object.fromEntries(nombres.map((c, i) => [c, listas[i]]))
}

export const disponibleDe = async (negocioId) => calcularDisponible(await cargar(negocioId))

// Crea la venta, congela su costo y descuenta los insumos en una sola transacción.
export function crearVenta(negocioId, datos, usuarioId) {
  return repo.transaccion(async () => {
    const registros = await cargar(negocioId)
    const { productos, masas, insumos } = registros
    const disponible = calcularDisponible(registros)
    const items = datos.items.map((i) => {
      const producto = productos.find((p) => p.id === i.productoId)
      return { ...i, costoUnitario: Math.round(costoProducto(producto, masas, insumos).costo) }
    })
    const consumo = consumoDe(items, productos, masas)
    const venta = await repo.crear(negocioId, 'ventas', { ...datos, items, consumo, estado: 'registrada' })
    await registrar(negocioId, aMovimientos(consumo, 'consumo', -1), {
      usuarioId, fecha: datos.fecha, origen: { tipo: 'venta', id: venta.id },
    })
    const faltantes = insumos
      .filter((i) => i.id in disponible && disponible[i.id] - (consumo[i.id] ?? 0) < 0)
      .map((i) => i.nombre)
    return { ...venta, faltantes }
  })
}

// Devuelve exactamente lo que se gastó, aunque la receta haya cambiado después.
export function devolverConsumo(negocioId, venta, usuarioId) {
  return registrar(negocioId, aMovimientos(venta.consumo ?? {}, 'devolucion', 1), {
    usuarioId, origen: { tipo: 'venta', id: venta.id },
  })
}

const aMovimientos = (consumo, tipo, signo) =>
  Object.entries(consumo).map(([insumoId, cantidad]) => ({ insumoId, tipo, cantidad: signo * cantidad }))
