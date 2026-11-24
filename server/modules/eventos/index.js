import { Router } from 'express'
import { requiereNegocio } from '../../middleware/auth.js'
import { cambios } from '../persistencia/repo.js'

const router = Router()

router.get('/', requiereNegocio, (req, res) => {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform' })
  res.write(': conectado\n\n')
  const avisar = ({ ambito, colecciones }) => {
    if (ambito === req.negocioId) res.write(`data: ${JSON.stringify(colecciones)}\n\n`)
  }
  const latido = setInterval(() => res.write(': latido\n\n'), 25_000)
  cambios.on('cambio', avisar)
  res.on('close', () => {
    clearInterval(latido)
    cambios.off('cambio', avisar)
  })
})

export default { ruta: '/api/eventos', router }
