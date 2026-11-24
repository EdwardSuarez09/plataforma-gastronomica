const aLineas = (venta) =>
  venta.items.map((item) => ({
    ...item,
    id: `${venta.id}-${item.productoId}`,
    fecha: venta.fecha,
    origen: venta.origen,
    total: item.cantidad * item.precioUnitario,
  }))

// Una línea por producto vendido, de la más reciente a la más antigua.
export function filtrarVentas(ventas, { desde, hasta, productoId } = {}) {
  return ventas
    .filter((v) => v.estado !== 'anulada')
    .filter((v) => (!desde || v.fecha >= desde) && (!hasta || v.fecha <= hasta))
    .flatMap(aLineas)
    .filter((l) => !productoId || l.productoId === productoId)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
}

export const totales = (lineas) => ({
  unidades: lineas.reduce((suma, l) => suma + l.cantidad, 0),
  dinero: lineas.reduce((suma, l) => suma + l.total, 0),
})
