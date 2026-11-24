import { pedir } from '../../services/apiClient.js'
import { guardarSesion } from '../../services/sesion.js'

async function entrar(ruta, datos) {
  const sesion = await pedir(ruta, { metodo: 'POST', datos })
  guardarSesion(sesion)
  return sesion
}

export const iniciarSesion = (datos) => entrar('/auth/login', datos)
export const registrarse = (datos) => entrar('/auth/registro', datos)
