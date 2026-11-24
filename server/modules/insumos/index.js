import { Router } from 'express'
import { requiereNegocio } from '../../middleware/auth.js'
import { exigir } from '../../middleware/errores.js'
import * as repo from '../persistencia/repo.js'
import { insumoEnUso, validarInsumo } from './validar.js'

const router = Router()
router.use(requiereNegocio)

router.post('/', async (req, res) => {
  const { nombre, unidad, precio, stock = 0 } = req.body
  const datos = { nombre, unidad, precio, stock }
  const error = validarInsumo(datos, await repo.listar(req.negocioId, 'insumos'))
  exigir(!error, error)
  res.status(201).json(await repo.crear(req.negocioId, 'insumos', { ...datos, nombre: nombre.trim() }))
})

router.put('/:id', async (req, res) => {
  const actual = await repo.obtener(req.negocioId, 'insumos', req.params.id)
  const { nombre, unidad, precio, stock } = { ...actual, ...req.body }
  const datos = { nombre, unidad, precio, stock }
  const error = validarInsumo({ ...datos, id: actual.id }, await repo.listar(req.negocioId, 'insumos'))
  exigir(!error, error)
  res.json(await repo.editar(req.negocioId, 'insumos', actual.id, datos))
})

router.delete('/:id', async (req, res) => {
  const [masas, productos] = await Promise.all(
    ['masas', 'productos'].map((c) => repo.listar(req.negocioId, c)),
  )
  exigir(
    !insumoEnUso(req.params.id, masas, productos),
    'No se puede eliminar: el insumo está en uso en una masa o producto',
    409,
  )
  await repo.eliminar(req.negocioId, 'insumos', req.params.id)
  res.status(204).end()
})

export default { ruta: '/api/insumos', router }
