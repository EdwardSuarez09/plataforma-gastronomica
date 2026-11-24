import { Router } from 'express'
import { requiereNegocio } from '../../middleware/auth.js'
import { exigir } from '../../middleware/errores.js'
import { esFecha, hoy, sumarDias } from '../../util/fechas.js'
import * as repo from '../persistencia/repo.js'
import { compararPronostico, resumir } from './calcular.js'

const COLECCIONES = ['ventas', 'compras', 'insumos', 'pedidos', 'movimientos']
const router = Router()

router.get('/', requiereNegocio, async (req, res) => {
  const { desde = sumarDias(hoy(), -6), hasta = hoy() } = req.query
  exigir(esFecha(desde) && esFecha(hasta) && desde <= hasta, 'El rango de fechas no es válido')
  exigir(hasta <= sumarDias(desde, 366), 'El rango máximo es de un año')
  const listas = await Promise.all(COLECCIONES.map((c) => repo.listar(req.negocioId, c)))
  const datos = Object.fromEntries(COLECCIONES.map((c, i) => [c, listas[i]]))
  res.json({ ...resumir(datos, { desde, hasta }), comparacion: compararPronostico(datos.ventas, hoy()) })
})

export default { ruta: '/api/panel', router }
