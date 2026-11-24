import { Router } from 'express'
import { requiereNegocio } from '../../middleware/auth.js'
import { exigir } from '../../middleware/errores.js'
import { esFecha, hoy } from '../../util/fechas.js'
import * as repo from '../persistencia/repo.js'
import { armarDetalle } from './armar.js'

const METODOS = ['efectivo', 'transferencia']

const router = Router()
router.use(requiereNegocio)

router.post('/', async (req, res) => {
  const { items, fecha = hoy(), metodoPago = 'efectivo' } = req.body
  exigir(esFecha(fecha), 'La fecha no es válida')
  exigir(fecha <= hoy(), 'La fecha no puede ser futura')
  exigir(METODOS.includes(metodoPago), 'El medio de pago no es válido')
  const detalle = armarDetalle(items, await repo.listar(req.negocioId, 'productos'))
  res.status(201).json(await repo.crear(req.negocioId, 'ventas', {
    ...detalle, fecha, metodoPago, origen: 'presencial', estado: 'registrada',
  }))
})

// Anular conserva el registro, pero lo saca del historial y de los pronósticos.
router.post('/:id/anular', async (req, res) =>
  res.json(await repo.editar(req.negocioId, 'ventas', req.params.id, { estado: 'anulada' })))

export default { ruta: '/api/ventas', router }
