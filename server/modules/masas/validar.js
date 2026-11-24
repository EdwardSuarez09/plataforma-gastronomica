export const TIPOS_MASA = ['tradicional', 'yuca', 'plátano', 'otro']

// Regla común para los ingredientes de una masa y los extras de un producto.
export function validarIngredientes(ingredientes, insumos) {
  const ids = ingredientes.map((i) => i.insumoId)
  if (ids.some((id) => !insumos.some((i) => i.id === id))) return 'Hay un insumo que no existe'
  if (new Set(ids).size !== ids.length) return 'No se puede repetir el mismo insumo'
  if (ingredientes.some((i) => !(i.cantidad > 0))) return 'La cantidad debe ser mayor que 0'
  return null
}

export function validarMasa({ nombre, tipo, ingredientes = [] }, insumos) {
  if (!nombre?.trim()) return 'El nombre es obligatorio'
  if (!TIPOS_MASA.includes(tipo)) return 'El tipo de masa no es válido'
  if (ingredientes.length === 0) return 'Agrega al menos un ingrediente'
  return validarIngredientes(ingredientes, insumos)
}

export function validarRendimiento(rendimiento, productos) {
  if (rendimiento.some((r) => !productos.some((p) => p.id === r.productoId))) return 'Hay un producto que no existe'
  if (rendimiento.some((r) => !Number.isInteger(r.unidades) || r.unidades <= 0)) {
    return 'El rendimiento debe ser un entero mayor que 0'
  }
  return null
}

const precioDe = (insumos, id) => insumos.find((i) => i.id === id)?.precio ?? 0

// Suma de cantidad × precio vigente. Sirve para masas y para los extras de un producto.
export const costoIngredientes = (ingredientes = [], insumos) =>
  ingredientes.reduce((total, i) => total + i.cantidad * precioDe(insumos, i.insumoId), 0)
