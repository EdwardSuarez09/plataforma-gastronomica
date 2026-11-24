const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validarRegistro({ nombre, correo, contrasena } = {}) {
  if (!nombre?.trim()) return 'El nombre es obligatorio'
  if (!CORREO.test(correo ?? '')) return 'El correo no es válido'
  if ((contrasena ?? '').length < 8) return 'La contraseña debe tener mínimo 8 caracteres'
  return null
}
