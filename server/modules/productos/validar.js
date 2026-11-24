import { validarIngredientes } from '../masas/validar.js'

export function validarProducto({ nombre, precio, masaId, extras = [] }, masas, insumos) {
  if (!nombre?.trim()) return 'El nombre es obligatorio'
  if (!(typeof precio === 'number' && precio > 0)) return 'El precio debe ser un número mayor que 0'
  if (!masas.some((m) => m.id === masaId)) return 'Elige una masa'
  return validarIngredientes(extras, insumos)
}
