import { costoIngredientes } from '../masas/validar.js'

// Insumos que lleva UNA unidad: su parte de la masa más sus extras.
export function recetaPorUnidad(producto, masas) {
  const masa = masas.find((m) => m.id === producto.masaId)
  const unidades = (masa?.rendimiento ?? []).reduce((suma, r) => suma + r.unidades, 0)
  const receta = new Map()
  const agregar = (insumoId, cantidad) => receta.set(insumoId, (receta.get(insumoId) ?? 0) + cantidad)
  if (unidades > 0) masa.ingredientes.forEach((i) => agregar(i.insumoId, i.cantidad / unidades))
  for (const e of producto.extras ?? []) agregar(e.insumoId, e.cantidad)
  return [...receta].map(([insumoId, cantidad]) => ({ insumoId, cantidad }))
}

// El lote se reparte entre todas las unidades que rinde, igual que en la versión Python.
export function costoMasaUnidad(masa, insumos) {
  const unidades = (masa?.rendimiento ?? []).reduce((suma, r) => suma + r.unidades, 0)
  return unidades > 0 ? costoIngredientes(masa.ingredientes, insumos) / unidades : 0
}

export function costoProducto(producto, masas, insumos) {
  const masa = masas.find((m) => m.id === producto.masaId)
  const costoMasa = costoMasaUnidad(masa, insumos)
  const costoExtras = costoIngredientes(producto.extras, insumos)
  const costo = costoMasa + costoExtras
  const ganancia = producto.precio - costo
  return {
    productoId: producto.id,
    nombre: producto.nombre,
    precio: producto.precio,
    costoMasa,
    costoExtras,
    costo,
    ganancia,
    margen: ganancia / producto.precio,
    sinRendimiento: !masa?.rendimiento?.some((r) => r.productoId === producto.id),
  }
}

export const costosDe = (productos, masas, insumos) =>
  productos.filter((p) => p.activo).map((p) => costoProducto(p, masas, insumos))
