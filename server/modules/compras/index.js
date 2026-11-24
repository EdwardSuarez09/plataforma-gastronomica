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

  const resultado = await repo.transaccion(async () => {
    await repo.obtener(req.negocioId, 'insumos', insumoId)
    const compra = await repo.crear(req.negocioId, 'compras', {
      insumoId, fecha, cantidad, valorTotal, precioUnitario: precioUnitario(valorTotal, cantidad),
    })
    const insumo = await repo.transformar(req.negocioId, 'insumos', (lista) => {
      const i = lista.find((x) => x.id === insumoId)
      i.stock += cantidad
      return i
    })
    return { compra, insumo }
  })
  res.status(201).json(resultado)
})

export default { ruta: '/api/compras', router }
