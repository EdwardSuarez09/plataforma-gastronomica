export function filtrarVentas(ventas, filtro = {}) {
  const resultado = []
  for (const v of ventas) {
    if (v.estado === 'anulada') continue
    if (filtro.desde && v.fecha < filtro.desde) continue
    if (filtro.hasta && v.fecha > filtro.hasta) continue
    for (const item of v.items) {
      if (filtro.productoId && item.productoId !== filtro.productoId) continue
      resultado.push({
        ...item,
        id: `${v.id}-${item.productoId}`,
        fecha: v.fecha,
        origen: v.origen,
        total: item.cantidad * item.precioUnitario,
      })
    }
  }
  resultado.sort((a, b) => b.fecha.localeCompare(a.fecha))
  return resultado
}

export function totales(lineas) {
  let unidades = 0
  let dinero = 0
  for (const l of lineas) {
    unidades = unidades + l.cantidad
    dinero = dinero + l.total
  }
  return { unidades, dinero }
}
