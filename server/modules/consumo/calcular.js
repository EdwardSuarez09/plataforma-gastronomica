import { recetaPorUnidad } from '../costos/calcular.js'

const redondear = (n) => Math.round(n * 10000) / 10000

// Insumos que gasta una venta: { insumoId: cantidad }
export function consumoDe(items, productos, masas) {
  const total = {}
  for (const { productoId, cantidad } of items) {
    const producto = productos.find((p) => p.id === productoId)
    if (!producto) continue
    for (const r of recetaPorUnidad(producto, masas)) {
      total[r.insumoId] = redondear((total[r.insumoId] ?? 0) + r.cantidad * cantidad)
    }
  }
  return total
}

// disponible: { insumoId: cantidad } solo con los insumos controlados. null = sin límite.
export function unidadesPosibles(producto, masas, disponible) {
  const limites = recetaPorUnidad(producto, masas)
    .filter((r) => r.insumoId in disponible && r.cantidad > 0)
    .map((r) => Math.floor(Math.max(0, disponible[r.insumoId]) / r.cantidad + 1e-6))
  return limites.length ? Math.min(...limites) : null
}

const RESERVAN = ['confirmado', 'en_preparacion', 'listo']

// Stock menos lo reservado por pedidos confirmados. Un insumo se controla cuando ya tiene movimientos.
export function calcularDisponible({ insumos, movimientos, pedidos, productos, masas }) {
  const controlados = new Set(movimientos.map((m) => m.insumoId))
  const reservado = consumoDe(pedidos.filter((p) => RESERVAN.includes(p.estado)).flatMap((p) => p.items), productos, masas)
  return Object.fromEntries(
    insumos.filter((i) => controlados.has(i.id)).map((i) => [i.id, redondear(i.stock - (reservado[i.id] ?? 0))]),
  )
}
