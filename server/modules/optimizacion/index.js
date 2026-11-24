import { Router } from 'express'
import { requiereNegocio } from '../../middleware/auth.js'
import { exigir } from '../../middleware/errores.js'
import { costosDe } from '../costos/calcular.js'
import * as repo from '../persistencia/repo.js'
import { pronosticoDe } from '../pronostico/index.js'
import { compararEscenarios, planSemanal } from './modelo.js'

const router = Router()

router.post('/optimizar', requiereNegocio, async (req, res) => {
  const { presupuesto, factorMin = 0.5, factorMax = 1.2, variacion = 0.1 } = req.body
  exigir(presupuesto > 0, 'El presupuesto diario debe ser mayor que 0')
  exigir(factorMin >= 0 && factorMax >= 1 && factorMin <= factorMax, 'Los límites de demanda no son válidos')
  exigir(variacion >= 0 && variacion < 1, 'La variación de costos no es válida')

  const pronostico = await pronosticoDe(req.negocioId)
  exigir(
    pronostico.suficiente,
    `Faltan ventas: hay ${pronostico.diasConDatos} días y se necesitan ${pronostico.diasMinimos}`,
  )
  const [productos, masas, insumos] = await Promise.all(
    ['productos', 'masas', 'insumos'].map((c) => repo.listar(req.negocioId, c)),
  )
  // Sin rendimiento no hay costo real: ese producto no entra al plan.
  const costos = costosDe(productos, masas, insumos).filter((c) => !c.sinRendimiento)
  const sirven = new Set(costos.map((c) => c.productoId))
  pronostico.productos = pronostico.productos.filter((p) => sirven.has(p.productoId))
  const datos = { pronostico, costos, presupuesto, factorMin, factorMax }
  res.json({
    productos: pronostico.productos.map(({ productoId, nombre }) => ({ productoId, nombre })),
    plan: planSemanal(datos),
    escenarios: compararEscenarios(datos, variacion),
  })
})

export default { ruta: '/api/produccion', router }
