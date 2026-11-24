export const NIVELES = ['muy corta', 'débil', 'aceptable', 'buena', 'fuerte']

// Solo orienta a quien escribe: la regla (mínimo 8) la sigue validando el servidor.
export function fuerza(clave = '') {
  if (clave.length < 8) return 0
  const variedad = [/[a-záéíóúñ]/, /[A-ZÁÉÍÓÚÑ]/, /\d/, /[^\p{L}\d]/u].filter((regla) => regla.test(clave)).length
  return Math.min(4, variedad + (clave.length >= 14 ? 1 : 0))
}

export const correoValido = (correo) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)
