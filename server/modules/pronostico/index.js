import { Router } from 'express'
import { requiereNegocio } from '../../middleware/auth.js'
import { hoy } from '../../util/fechas.js'
import * as repo from '../persistencia/repo.js'
import { pronosticar } from './calcular.js'

export async function pronosticoDe(negocioId) {
  const [ventas, productos] = await Promise.all(['ventas', 'productos'].map((c) => repo.listar(negocioId, c)))
  return pronosticar(ventas, productos.filter((p) => p.activo), hoy())
}

const router = Router()
router.get('/', requiereNegocio, async (req, res) => res.json(await pronosticoDe(req.negocioId)))

export default { ruta: '/api/pronostico', router }
