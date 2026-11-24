import { Router } from 'express'
import { requiereNegocio } from '../../middleware/auth.js'
import { exigir } from '../../middleware/errores.js'
import { registrar } from '../inventario/libro.js'
import * as repo from '../persistencia/repo.js'
import { precioUnitario, validarCompra } from './validar.js'

const router = Router()
router.use(requiereNegocio)

// Compra y movimiento van en la misma transacción: se guardan los dos o ninguno.
router.post('/', async (req, res) => {
  const { insumoId, fecha, cantidad, valorTotal, proveedor = '' } = req.body
  const error = validarCompra({ fecha, cantidad, valorTotal })
  exigir(!error, error)
  const resultado = await repo.transaccion(async () => {
    await repo.obtener(req.negocioId, 'insumos', insumoId)
    const compra = await repo.crear(req.negocioId, 'compras', {
      insumoId, fecha, cantidad, valorTotal, proveedor, estado: 'confirmada', precioUnitario: precioUnitario(valorTotal, cantidad),
    })
    await registrar(req.negocioId, [{ insumoId, tipo: 'compra', cantidad }], {
      fecha, usuarioId: req.sesion.usuarioId, origen: { tipo: 'compra', id: compra.id },
    })
    return { compra, insumo: await repo.obtener(req.negocioId, 'insumos', insumoId) }
  })
  res.status(201).json(resultado)
})

router.post('/:id/anular', async (req, res) => {
  const compra = await repo.transaccion(async () => {
    const c = await repo.obtener(req.negocioId, 'compras', req.params.id)
    exigir(c.estado !== 'anulada', 'La compra ya estaba anulada')
    await registrar(req.negocioId, [{ insumoId: c.insumoId, tipo: 'anulacion', cantidad: -c.cantidad, motivo: 'Compra anulada' }], {
      usuarioId: req.sesion.usuarioId, origen: { tipo: 'compra', id: c.id },
    })
    return repo.editar(req.negocioId, 'compras', c.id, { estado: 'anulada' })
  })
  res.json({ compra })
})

export default { ruta: '/api/compras', router }
