import jwt from 'jsonwebtoken'
import { ErrorApi } from './errores.js'

const secreto = () => process.env.JWT_SECRET || 'solo-para-demo-local'

export const firmarToken = (datos) => jwt.sign(datos, secreto(), { expiresIn: '8h' })

export function requiereSesion(req, _res, next) {
  const token = (req.headers.authorization ?? '').replace('Bearer ', '')
  try {
    req.sesion = jwt.verify(token, secreto())
  } catch {
    throw new ErrorApi(401, 'Debes iniciar sesión')
  }
  next()
}

// RN-01: el negocio sale SIEMPRE del token, nunca de la URL ni del cuerpo.
export function requiereNegocio(req, res, next) {
  requiereSesion(req, res, () => {
    if (!req.sesion.negocioId) throw new ErrorApi(403, 'Primero configura tu negocio')
    req.negocioId = req.sesion.negocioId
    next()
  })
}
