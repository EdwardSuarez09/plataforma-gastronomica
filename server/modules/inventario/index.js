import { Router } from 'express'
import { requiereNegocio } from '../../middleware/auth.js'
import { hoy } from '../../util/fechas.js'
import * as repo from '../persistencia/repo.js'
import { prepararAjuste, registrar } from './libro.js'

const router = Router()
router.use(requiereNegocio)

router.get('/', async (req, res) => {
  const insumos = await repo.listar(req.negocioId, 'insumos')
  res.json(insumos.map((i) => ({ ...i, valor: i.stock * i.precio, bajo: i.stockMinimo > 0 && i.stock <= i.stockMinimo })))
})

router.post('/ajustes', async (req, res) => {
  const { insumoId, ...datos } = req.body
  const insumo = await repo.transaccion(async () => {
    const ajuste = prepararAjuste(datos, await repo.obtener(req.negocioId, 'insumos', insumoId))
    await registrar(req.negocioId, [ajuste], { usuarioId: req.sesion.usuarioId })
    // Solo un conteo físico confirma lo que de verdad hay en la despensa.
    return repo.editar(req.negocioId, 'insumos', insumoId, datos.tipo === 'conteo' ? { verificadoEn: hoy() } : {})
  })
  res.status(201).json(insumo)
})

export default { ruta: '/api/inventario', router }
