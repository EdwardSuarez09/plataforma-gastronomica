import { Router } from 'express'
import { requiereNegocio } from '../../middleware/auth.js'
import { exigir } from '../../middleware/errores.js'
import { costosDe, recetaPorUnidad } from '../costos/calcular.js'
import * as repo from '../persistencia/repo.js'
import { pronosticoDe } from '../pronostico/index.js'
import { compararEscenarios, listaCompras, planSemanal, presupuestoSugerido } from './modelo.js'

const router = Router()
router.use(requiereNegocio)

// Reúne pronóstico, costos, recetas y stock. Sin rendimiento no hay costo real: no entra al plan.
async function preparar(negocioId) {
  const pronostico = await pronosticoDe(negocioId)
  exigir(
    pronostico.suficiente,
    `Faltan ventas: hay ${pronostico.diasConDatos} días y se necesitan ${pronostico.diasMinimos}`,
  )
  const [productos, masas, insumos] = await Promise.all(
    ['productos', 'masas', 'insumos'].map((c) => repo.listar(negocioId, c)),
  )
  const costos = costosDe(productos, masas, insumos)
  const sirven = new Set(costos.filter((c) => !c.sinRendimiento).map((c) => c.productoId))
  return {
    insumos,
    costos,
    recetas: Object.fromEntries(productos.map((p) => [p.id, recetaPorUnidad(p, masas)])),
    excluidos: costos.filter((c) => c.sinRendimiento).map((c) => c.nombre),
    pronostico: { ...pronostico, productos: pronostico.productos.filter((p) => sirven.has(p.productoId)) },
  }
}

router.get('/sugerencia', async (req, res) => {
  const { pronostico, costos } = await preparar(req.negocioId)
  res.json({ presupuesto: presupuestoSugerido(pronostico, costos) })
})

router.post('/optimizar', async (req, res) => {
  const { presupuesto, factorMin = 0.5, factorMax = 1.2, variacion = 0.1, soloStock = false } = req.body
  exigir(presupuesto > 0, 'El presupuesto diario debe ser mayor que 0')
  exigir(factorMin >= 0 && factorMax >= 1 && factorMin <= factorMax, 'Los límites de demanda no son válidos')
  exigir(variacion >= 0 && variacion < 1, 'La variación de costos no es válida')

  const { pronostico, costos, recetas, insumos, excluidos } = await preparar(req.negocioId)
  const stock = soloStock ? Object.fromEntries(insumos.map((i) => [i.id, i.stock])) : undefined
  const datos = { pronostico, costos, presupuesto, factorMin, factorMax, recetas, stock }
  const plan = planSemanal(datos)
  res.json({
    productos: pronostico.productos.map(({ productoId, nombre }) => ({ productoId, nombre })),
    plan,
    excluidos,
    escenarios: compararEscenarios(datos, variacion),
    compras: listaCompras(plan, recetas, insumos),
  })
})

export default { ruta: '/api/produccion', router }
