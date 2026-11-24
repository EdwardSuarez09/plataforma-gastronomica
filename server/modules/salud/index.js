import { Router } from 'express'

const router = Router()
router.get('/', (_req, res) => res.json({ estado: 'ok' }))

export default { ruta: '/api/salud', router, orden: 0 }
