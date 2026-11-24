import { Router } from 'express'
import { requiereNegocio } from '../../middleware/auth.js'
import { exigir } from '../../middleware/errores.js'
import * as repo from '../persistencia/repo.js'
import { precioUnitario, validarCompra } from './validar.js'

const router = Router()

router.post('/', requiereNegocio, async (req, res) => {
  const { insumoId, fecha, cantidad, valorTotal } = req.body
  const error = validarCompra({ fecha, cantidad, valorTotal })
  exigir(!error, error)
  await repo.obtener(req.negocioId, 'insumos', insumoId)

  const compra = await repo.crear(req.negocioId, 'compras', {
    insumoId, fecha, cantidad, valorTotal, precioUnitario: precioUnitario(valorTotal, cantidad),
  })
  // El stock se suma dentro de la cola de escritura: dos compras seguidas no se pisan.
  const insumo = await repo.transformar(req.negocioId, 'insumos', (lista) => {
    const i = lista.find((x) => x.id === insumoId)
    i.stock += cantidad
    return i
  })
  res.status(201).json({ compra, insumo })
})

export default { ruta: '/api/compras', router }
