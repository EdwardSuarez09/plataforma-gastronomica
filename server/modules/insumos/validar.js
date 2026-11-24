export const UNIDADES = ['kg', 'g', 'lb', 'L', 'ml', 'unidad']

export function validarInsumo(datos, existentes = []) {
  if (!datos.nombre || datos.nombre.trim() === '') return 'El nombre es obligatorio'
  if (!UNIDADES.includes(datos.unidad)) return 'La unidad no es válida'
  if (typeof datos.precio !== 'number' || !Number.isFinite(datos.precio) || datos.precio <= 0) {
    return 'El precio debe ser un número mayor que 0'
  }
  if (typeof datos.stock !== 'number' || !Number.isFinite(datos.stock) || datos.stock < 0) {
    return 'El stock no puede ser negativo'
  }
  for (const i of existentes) {
    if (i.id !== datos.id && i.nombre.trim().toLowerCase() === datos.nombre.trim().toLowerCase()) {
      return 'Ya existe un insumo con ese nombre'
    }
  }
  return null
}

export function insumoEnUso(insumoId, masas, productos) {
  for (const m of masas) {
    for (const i of m.ingredientes ?? []) if (i.insumoId === insumoId) return true
  }
  for (const p of productos) {
    for (const i of p.extras ?? []) if (i.insumoId === insumoId) return true
  }
  return false
}
