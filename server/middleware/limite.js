import { ErrorApi } from './errores.js'

// Limita cuántas veces se puede llamar una ruta desde la misma dirección (en memoria).
export function limitar({ maximo, minutos, mensaje }) {
  const intentos = new Map()
  return (req, _res, next) => {
    const ahora = Date.now()
    const previos = (intentos.get(req.ip) ?? []).filter((t) => ahora - t < minutos * 60_000)
    if (previos.length >= maximo) throw new ErrorApi(429, mensaje)
    intentos.set(req.ip, [...previos, ahora])
    next()
  }
}
