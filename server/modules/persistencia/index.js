import { Router } from 'express'
import { requiereNegocio } from '../../middleware/auth.js'
import { exigir } from '../../middleware/errores.js'
import * as repo from './repo.js'

const COLECCIONES = ['insumos', 'masas', 'productos', 'compras', 'ventas', 'pedidos']
// Compras, ventas y pedidos tienen reglas propias: la API genérica solo los lee.
const SOLO_LECTURA = ['compras', 'ventas', 'pedidos']

const router = Router()

router.get('/respaldo', requiereNegocio, async (req, res) => {
  const copia = {}
  for (const c of COLECCIONES) copia[c] = await repo.listar(req.negocioId, c)
  res.json(copia)
})

router.param('coleccion', (_req, _res, next, coleccion) => {
  exigir(COLECCIONES.includes(coleccion), 'Ruta no encontrada', 404)
  next()
})

const permiteEscribir = (req, _res, next) => {
  exigir(!SOLO_LECTURA.includes(req.params.coleccion), 'Operación no permitida', 405)
  next()
}

router.get('/:coleccion', requiereNegocio, async (req, res) =>
  res.json(await repo.listar(req.negocioId, req.params.coleccion)))

router.get('/:coleccion/:id', requiereNegocio, async (req, res) =>
  res.json(await repo.obtener(req.negocioId, req.params.coleccion, req.params.id)))

router.post('/:coleccion', requiereNegocio, permiteEscribir, async (req, res) =>
  res.status(201).json(await repo.crear(req.negocioId, req.params.coleccion, req.body)))

router.put('/:coleccion/:id', requiereNegocio, permiteEscribir, async (req, res) =>
  res.json(await repo.editar(req.negocioId, req.params.coleccion, req.params.id, req.body)))

router.delete('/:coleccion/:id', requiereNegocio, permiteEscribir, async (req, res) => {
  await repo.eliminar(req.negocioId, req.params.coleccion, req.params.id)
  res.status(204).end()
})

// orden 99: las rutas con reglas propias se registran antes.
export default { ruta: '/api', router, orden: 99 }
