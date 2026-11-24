import { Router } from 'express'
import { requiereNegocio } from '../../middleware/auth.js'
import { exigir } from '../../middleware/errores.js'
import * as repo from '../persistencia/repo.js'
import { validarProducto } from './validar.js'

const router = Router()
router.use(requiereNegocio)

async function validado(req, actual = {}) {
  const datos = { ...actual, ...req.body }
  const { nombre, precio, masaId, extras = [], descripcion = '', categoria = 'General', activo = true } = datos
  const [masas, insumos] = await Promise.all(['masas', 'insumos'].map((c) => repo.listar(req.negocioId, c)))
  const error = validarProducto({ nombre, precio, masaId, extras }, masas, insumos)
  exigir(!error, error)
  const { unidadesPorLote } = req.body
  exigir(
    unidadesPorLote === undefined || (Number.isInteger(unidadesPorLote) && unidadesPorLote > 0),
    'Las unidades por lote deben ser un entero mayor que 0',
  )
  return {
    nombre: nombre.trim(),
    precio,
    masaId,
    extras: extras.map(({ insumoId, cantidad }) => ({ insumoId, cantidad })),
    descripcion,
    categoria: categoria.trim() || 'General',
    activo: Boolean(activo),
  }
}

// El rendimiento vive en la masa; aquí se actualiza junto con el producto.
async function guardarRendimiento(negocioId, producto, unidades) {
  if (unidades === undefined) return
  await repo.transformar(negocioId, 'masas', (masas) => {
    for (const m of masas) {
      m.rendimiento = (m.rendimiento ?? []).filter((r) => r.productoId !== producto.id)
      if (m.id === producto.masaId) m.rendimiento.push({ productoId: producto.id, unidades })
    }
  })
}

router.post('/', async (req, res) => {
  const datos = await validado(req)
  const producto = await repo.transaccion(async () => {
    const creado = await repo.crear(req.negocioId, 'productos', datos)
    await guardarRendimiento(req.negocioId, creado, req.body.unidadesPorLote)
    return creado
  })
  res.status(201).json(producto)
})

router.put('/:id', async (req, res) => {
  const actual = await repo.obtener(req.negocioId, 'productos', req.params.id)
  const datos = await validado(req, actual)
  res.json(await repo.transaccion(async () => {
    const editado = await repo.editar(req.negocioId, 'productos', actual.id, datos)
    await guardarRendimiento(req.negocioId, editado, req.body.unidadesPorLote)
    return editado
  }))
})

// Un producto nunca se borra: se desactiva y así se conserva el historial de ventas.
router.delete('/:id', async (req, res) =>
  res.json(await repo.editar(req.negocioId, 'productos', req.params.id, { activo: false })))

export default { ruta: '/api/productos', router }
