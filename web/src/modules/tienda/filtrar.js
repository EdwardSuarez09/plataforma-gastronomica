const plano = (texto) => String(texto ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

export const opcionesDe = (tiendas, campo) => [...new Set(tiendas.map((t) => t[campo]).filter(Boolean))].sort((a, b) => a.localeCompare(b))

const ORDENES = {
  nombre: (a, b) => a.nombre.localeCompare(b.nombre),
  precio: (a, b) => (a.desde ?? Infinity) - (b.desde ?? Infinity),
  menu: (a, b) => (b.productos ?? 0) - (a.productos ?? 0),
}

// Busca por negocio, descripción, categoría o producto, sin importar tildes ni mayúsculas.
export function filtrarTiendas(tiendas, { texto = '', tipo = '', ciudad = '', orden = 'nombre' } = {}) {
  const buscado = plano(texto.trim())
  return tiendas
    .filter((t) => (!tipo || t.tipo === tipo) && (!ciudad || t.ciudad === ciudad))
    .filter((t) => plano([t.nombre, t.tipo, t.ciudad, t.descripcion, ...(t.categorias ?? []), ...(t.menu ?? [])].join(' ')).includes(buscado))
    .sort(ORDENES[orden])
}
