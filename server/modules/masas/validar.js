export const TIPOS_MASA = ['tradicional', 'yuca', 'plátano', 'otro']

export function validarIngredientes(ingredientes, insumos) {
  const vistos = []
  for (const ingrediente of ingredientes) {
    let existe = false
    for (const insumo of insumos) if (insumo.id === ingrediente.insumoId) existe = true
    if (!existe) return 'Hay un insumo que no existe'
    if (vistos.includes(ingrediente.insumoId)) return 'No se puede repetir el mismo insumo'
    if (!(ingrediente.cantidad > 0)) return 'La cantidad debe ser mayor que 0'
    vistos.push(ingrediente.insumoId)
  }
  return null
}

export function validarMasa({ nombre, tipo, ingredientes = [] }, insumos) {
  if (!nombre?.trim()) return 'El nombre es obligatorio'
  if (!TIPOS_MASA.includes(tipo)) return 'El tipo de masa no es válido'
  if (ingredientes.length === 0) return 'Agrega al menos un ingrediente'
  return validarIngredientes(ingredientes, insumos)
}

export function validarRendimiento(rendimiento, productos) {
  for (const r of rendimiento) {
    if (!productos.some((p) => p.id === r.productoId)) return 'Hay un producto que no existe'
    if (!Number.isInteger(r.unidades) || r.unidades <= 0) return 'El rendimiento debe ser un entero mayor que 0'
  }
  return null
}

export function costoIngredientes(ingredientes = [], insumos) {
  let total = 0
  for (const ingrediente of ingredientes) {
    for (const insumo of insumos) {
      if (insumo.id === ingrediente.insumoId) total = total + ingrediente.cantidad * insumo.precio
    }
  }
  return total
}
