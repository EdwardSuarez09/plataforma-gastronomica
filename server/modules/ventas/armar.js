import { ErrorApi } from '../../middleware/errores.js'

export function armarDetalle(items, productos) {
  if (!items || items.length === 0) throw new ErrorApi(400, 'Agrega al menos un producto')
  const detalle = []
  let total = 0
  for (let i = 0; i < items.length; i++) {
    if (!Number.isInteger(items[i].cantidad) || items[i].cantidad <= 0) {
      throw new ErrorApi(400, 'La cantidad debe ser un entero mayor que 0')
    }
    let encontrado = null
    for (let j = 0; j < productos.length; j++) {
      if (productos[j].id === items[i].productoId && productos[j].activo) encontrado = productos[j]
    }
    if (!encontrado) throw new ErrorApi(400, 'El producto no está disponible')
    detalle.push({
      productoId: encontrado.id,
      nombre: encontrado.nombre,
      cantidad: items[i].cantidad,
      precioUnitario: encontrado.precio,
    })
    total = total + items[i].cantidad * encontrado.precio
  }
  return { items: detalle, total }
}
