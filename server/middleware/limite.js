export function limitar({ maximo, minutos, mensaje }) {
  const duracion = minutos * 60_000
  const ventanas = new Map()
  let solicitudes = 0

  return (req, res, next) => {
    const ahora = Date.now()
    const clave = req.ip ?? req.socket.remoteAddress
    let ventana = ventanas.get(clave)

    if (!ventana || ventana.vence <= ahora) {
      ventana = { cantidad: 0, vence: ahora + duracion }
      ventanas.set(clave, ventana)
    }

    if (ventana.cantidad >= maximo) {
      res.set('Retry-After', String(Math.ceil((ventana.vence - ahora) / 1000)))
      return res.status(429).json({ error: mensaje })
    }

    ventana.cantidad += 1
    solicitudes += 1
    if (solicitudes % 100 === 0) {
      for (const [ip, registro] of ventanas) {
        if (registro.vence <= ahora) ventanas.delete(ip)
      }
    }
    next()
  }
}
