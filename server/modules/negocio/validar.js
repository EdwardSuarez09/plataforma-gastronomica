export function validarNegocio({ nombre, tipo, ciudad, moneda } = {}) {
  if (!nombre?.trim()) return 'El nombre del negocio es obligatorio'
  if (!tipo?.trim()) return 'El tipo de negocio es obligatorio'
  if (!ciudad?.trim()) return 'La ciudad es obligatoria'
  if (!moneda?.trim()) return 'La moneda es obligatoria'
  return null
}

// "Fritos Doña Ana" -> "fritos-dona-ana": dirección pública de la tienda.
export const crearSlug = (nombre) =>
  nombre
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
