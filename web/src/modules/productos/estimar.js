const MARGEN_SUGERIDO = 0.5

// Costo aproximado mientras se llena la ficha, con la misma fórmula del servidor (HU-08).
export function estimar({ id, precio, masaId, unidadesPorLote, extras }, masas, insumos) {
  const masa = masas.find((m) => m.id === masaId)
  const unidades = Number(unidadesPorLote)
  if (!masa || !(unidades > 0)) return null
  const otras = (masa.rendimiento ?? []).filter((r) => r.productoId !== id).reduce((s, r) => s + r.unidades, 0)
  const costoExtras = extras.reduce(
    (s, e) => s + Number(e.cantidad || 0) * (insumos.find((i) => i.id === e.insumoId)?.precio ?? 0), 0)
  const costo = masa.costoLote / (otras + unidades) + costoExtras
  const venta = Number(precio)
  return {
    costo,
    margen: venta > 0 ? (venta - costo) / venta : null,
    sugerido: Math.ceil(costo / (1 - MARGEN_SUGERIDO) / 100) * 100,
  }
}
