import { Router } from 'express'
import { requiereNegocio } from '../../middleware/auth.js'
import { exigir } from '../../middleware/errores.js'
import { esFecha, hoy } from '../../util/fechas.js'
import { crearVenta, devolverConsumo } from '../consumo/servicio.js'
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
  res.status(201).json(
    await crearVenta(req.negocioId, { ...detalle, fecha, metodoPago, origen: 'presencial' }, req.sesion.usuarioId),
  )
})

// Anular conserva el registro, devuelve los insumos y, si venía de un pedido, lo marca.
router.post('/:id/anular', async (req, res) => {
  const { negocioId, sesion } = req
  res.json(await repo.transaccion(async () => {
    const venta = await repo.obtener(negocioId, 'ventas', req.params.id)
    exigir(venta.estado !== 'anulada', 'La venta ya estaba anulada')
    await devolverConsumo(negocioId, venta, sesion.usuarioId)
    if (venta.pedidoId) await repo.editar(negocioId, 'pedidos', venta.pedidoId, { estado: 'anulado' })
    return repo.editar(negocioId, 'ventas', venta.id, { estado: 'anulada' })
  }))
})

export default { ruta: '/api/ventas', router }
