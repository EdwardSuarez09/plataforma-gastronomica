import { Router } from 'express'
import { requiereNegocio } from '../../middleware/auth.js'
import { exigir } from '../../middleware/errores.js'
import * as repo from '../persistencia/repo.js'
import { validarProducto } from './validar.js'

const router = Router()
router.use(requiereNegocio)

async function validado(req, actual = {}) {
  const { nombre, precio, masaId, extras = [], descripcion = '', activo = true } = { ...actual, ...req.body }
  const [masas, insumos] = await Promise.all(['masas', 'insumos'].map((c) => repo.listar(req.negocioId, c)))
  const error = validarProducto({ nombre, precio, masaId, extras }, masas, insumos)
  exigir(!error, error)
  return {
    nombre: nombre.trim(),
    precio,
    masaId,
    extras: extras.map(({ insumoId, cantidad }) => ({ insumoId, cantidad })),
    descripcion,
    activo: Boolean(activo),
  }
}

router.post('/', async (req, res) =>
  res.status(201).json(await repo.crear(req.negocioId, 'productos', await validado(req))))

router.put('/:id', async (req, res) => {
  const actual = await repo.obtener(req.negocioId, 'productos', req.params.id)
  res.json(await repo.editar(req.negocioId, 'productos', actual.id, await validado(req, actual)))
})

// Un producto nunca se borra: se desactiva y así se conserva el historial de ventas.
router.delete('/:id', async (req, res) =>
  res.json(await repo.editar(req.negocioId, 'productos', req.params.id, { activo: false })))

export default { ruta: '/api/productos', router }
