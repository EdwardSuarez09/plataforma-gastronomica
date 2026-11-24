import { cerrarSesion, leerSesion } from './sesion.js'

// Único punto de acceso a la API: las pantallas nunca usan fetch directamente.
export async function pedir(ruta, { metodo = 'GET', datos } = {}) {
  const token = leerSesion()?.token
  const res = await fetch(`/api${ruta}`, {
    method: metodo,
    headers: {
      ...(datos && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: datos && JSON.stringify(datos),
  })
  if (res.status === 204) return null
  const cuerpo = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 401 && token) cerrarSesion()
    throw new Error(cuerpo.error ?? 'No se pudo conectar con el servidor')
  }
  return cuerpo
}

export const listar = (coleccion) => pedir(`/${coleccion}`)
export const obtener = (coleccion, id) => pedir(`/${coleccion}/${id}`)
export const crear = (coleccion, datos) => pedir(`/${coleccion}`, { metodo: 'POST', datos })
export const editar = (coleccion, id, datos) => pedir(`/${coleccion}/${id}`, { metodo: 'PUT', datos })
export const eliminar = (coleccion, id) => pedir(`/${coleccion}/${id}`, { metodo: 'DELETE' })
