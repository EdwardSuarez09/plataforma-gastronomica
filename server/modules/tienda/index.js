import { Router } from 'express'
import { exigir } from '../../middleware/errores.js'
import { calcularDisponible, unidadesPosibles } from '../consumo/calcular.js'
import { cargar } from '../consumo/servicio.js'
import * as repo from '../persistencia/repo.js'

const publico = ({ nombre, slug, tipo, ciudad, moneda, telefono, descripcion }) =>
  ({ nombre, slug, tipo, ciudad, moneda, telefono, descripcion })

// Lo que la vitrina cuenta de cada menú: cuánto hay, desde qué precio y de qué tipo.
export function resumirMenu(productos) {
  const activos = productos.filter((p) => p.activo)
  return {
    productos: activos.length,
    desde: activos.length ? Math.min(...activos.map((p) => p.precio)) : null,
    categorias: [...new Set(activos.map((p) => p.categoria).filter(Boolean))],
    menu: activos.map((p) => p.nombre),
  }
}

export async function negocioPorSlug(slug) {
  const negocio = (await repo.listar('global', 'negocios')).find((n) => n.slug === slug)
  exigir(negocio, 'Esta tienda no existe', 404)
  return negocio
}

const router = Router()

router.get('/tiendas', async (_req, res) => {
  const tiendas = []
  for (const n of await repo.listar('global', 'negocios')) {
    tiendas.push({ ...publico(n), ...resumirMenu(await repo.listar(n.id, 'productos')) })
  }
  res.json(tiendas)
})

// Solo datos para el cliente: nunca costos, insumos ni ventas.
router.get('/:slug/menu', async (req, res) => {
  const negocio = await negocioPorSlug(req.params.slug)
  const datos = await cargar(negocio.id)
  const disponible = calcularDisponible(datos)
  const productos = datos.productos.filter((p) => p.activo).map((p) => ({
    id: p.id,
    nombre: p.nombre,
    precio: p.precio,
    descripcion: p.descripcion,
    categoria: p.categoria,
    agotado: unidadesPosibles(p, datos.masas, disponible) === 0,
  }))
  res.json({ negocio: publico(negocio), productos })
})

export default { ruta: '/api/publico', router, orden: 3 }
