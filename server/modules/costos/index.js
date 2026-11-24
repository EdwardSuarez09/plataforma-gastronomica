import { Router } from 'express'
import { requiereNegocio } from '../../middleware/auth.js'
import * as repo from '../persistencia/repo.js'
import { costosDe } from './calcular.js'

const router = Router()

router.get('/', requiereNegocio, async (req, res) => {
  const [productos, masas, insumos] = await Promise.all(
    ['productos', 'masas', 'insumos'].map((c) => repo.listar(req.negocioId, c)),
  )
  res.json(costosDe(productos, masas, insumos))
})

export default { ruta: '/api/costos', router }
