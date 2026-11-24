import { ErrorApi } from '../../middleware/errores.js'

function linea({ productoId, cantidad }, productos) {
  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    throw new ErrorApi(400, 'La cantidad debe ser un entero mayor que 0')
  }
  const producto = productos.find((p) => p.id === productoId && p.activo)
  if (!producto) throw new ErrorApi(400, 'El producto no está disponible')
  return { productoId, nombre: producto.nombre, cantidad, precioUnitario: producto.precio }
}

// El precio se toma del servidor y queda congelado en cada línea.
export function armarDetalle(items, productos) {
  if (!items?.length) throw new ErrorApi(400, 'Agrega al menos un producto')
  const detalle = items.map((item) => linea(item, productos))
  const total = detalle.reduce((suma, d) => suma + d.cantidad * d.precioUnitario, 0)
  return { items: detalle, total }
}
