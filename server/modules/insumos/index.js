import { Router } from 'express'
import { requiereNegocio } from '../../middleware/auth.js'
import { exigir } from '../../middleware/errores.js'
import { registrar } from '../inventario/libro.js'
import * as repo from '../persistencia/repo.js'
import { insumoEnUso, validarInsumo } from './validar.js'

const router = Router()
router.use(requiereNegocio)

router.post('/', async (req, res) => {
  const { nombre, unidad, precio, stock = 0, stockMinimo = 0 } = req.body
  const datos = { nombre, unidad, precio, stock, stockMinimo }
  const error = validarInsumo(datos, await repo.listar(req.negocioId, 'insumos'))
  exigir(!error, error)
  const insumo = await repo.transaccion(async () => {
    const creado = await repo.crear(req.negocioId, 'insumos', { ...datos, nombre: nombre.trim(), stock: 0 })
    await registrar(req.negocioId, [{ insumoId: creado.id, tipo: 'inicial', cantidad: stock }], { usuarioId: req.sesion.usuarioId })
    return repo.obtener(req.negocioId, 'insumos', creado.id)
  })
  res.status(201).json(insumo)
})

// El stock no se edita aquí: solo cambia con movimientos del libro.
router.put('/:id', async (req, res) => {
  const actual = await repo.obtener(req.negocioId, 'insumos', req.params.id)
  const { nombre, unidad, precio, stockMinimo = 0 } = { ...actual, ...req.body }
  const datos = { nombre, unidad, precio, stockMinimo }
  const lista = await repo.listar(req.negocioId, 'insumos')
  const error = validarInsumo({ ...datos, stock: 0, id: actual.id }, lista)
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
