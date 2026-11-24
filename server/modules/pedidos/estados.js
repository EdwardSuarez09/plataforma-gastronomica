export const TRANSICIONES = {
  recibido: ['confirmado', 'rechazado'],
  confirmado: ['en_preparacion', 'cancelado'],
  en_preparacion: ['listo', 'cancelado'],
  listo: ['entregado'],
}

const EXIGEN_MOTIVO = ['rechazado', 'cancelado']

export function validarCambio(actual, nuevo, motivo) {
  if (!TRANSICIONES[actual]?.includes(nuevo)) return `No se puede pasar de "${actual}" a "${nuevo}"`
  if (EXIGEN_MOTIVO.includes(nuevo) && !motivo?.trim()) return 'Indica el motivo'
  return null
}

export function validarCliente(cliente = {}) {
  const { nombre, telefono } = cliente ?? {}
  if (typeof nombre !== 'string' || !nombre.trim()) return 'Escribe tu nombre'
  if (!/^\d{7,10}$/.test(String(telefono ?? '').replace(/\s/g, ''))) return 'Escribe un teléfono válido'
  return null
}
