const CLAVE = 'sesion'

export function leerSesion() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE))
  } catch {
    return null
  }
}

export const guardarSesion = (sesion) => localStorage.setItem(CLAVE, JSON.stringify(sesion))
export const cerrarSesion = () => localStorage.removeItem(CLAVE)
