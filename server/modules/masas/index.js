import { Router } from 'express'
import { requiereNegocio } from '../../middleware/auth.js'
import { exigir } from '../../middleware/errores.js'
import * as repo from '../persistencia/repo.js'
import { costoIngredientes, validarMasa, validarRendimiento } from './validar.js'

const router = Router()
router.use(requiereNegocio)

const campos = ({ nombre, tipo, ingredientes = [] }) => ({
  nombre: nombre?.trim(),
  tipo,
  ingredientes: ingredientes.map(({ insumoId, cantidad }) => ({ insumoId, cantidad })),
})

async function validada(req, actual = {}) {
  const datos = campos({ ...actual, ...req.body })
  const error = validarMasa(datos, await repo.listar(req.negocioId, 'insumos'))
  exigir(!error, error)
  return datos
}

router.get('/', async (req, res) => {
  const insumos = await repo.listar(req.negocioId, 'insumos')
  const masas = await repo.listar(req.negocioId, 'masas')
  res.json(masas.map((m) => ({ ...m, costoLote: costoIngredientes(m.ingredientes, insumos) })))
})

router.post('/', async (req, res) => {
  const datos = await validada(req)
  res.status(201).json(await repo.crear(req.negocioId, 'masas', { ...datos, rendimiento: [] }))
})

router.put('/:id', async (req, res) => {
  const actual = await repo.obtener(req.negocioId, 'masas', req.params.id)
  res.json(await repo.editar(req.negocioId, 'masas', actual.id, await validada(req, actual)))
})

router.put('/:id/rendimiento', async (req, res) => {
  const rendimiento = (req.body.rendimiento ?? []).map(({ productoId, unidades }) => ({ productoId, unidades }))
  const error = validarRendimiento(rendimiento, await repo.listar(req.negocioId, 'productos'))
  exigir(!error, error)
  res.json(await repo.editar(req.negocioId, 'masas', req.params.id, { rendimiento }))
})

router.delete('/:id', async (req, res) => {
  const productos = await repo.listar(req.negocioId, 'productos')
  exigir(!productos.some((p) => p.masaId === req.params.id), 'La masa está en uso por un producto', 409)
  await repo.eliminar(req.negocioId, 'masas', req.params.id)
  res.status(204).end()
})

export default { ruta: '/api/masas', router }
