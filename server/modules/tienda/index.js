import { Router } from 'express'
import { exigir } from '../../middleware/errores.js'
import { calcularDisponible, unidadesPosibles } from '../consumo/calcular.js'
import { cargar } from '../consumo/servicio.js'
import * as repo from '../persistencia/repo.js'

const publico = ({ nombre, slug, tipo, ciudad, moneda, telefono, descripcion }) =>
  ({ nombre, slug, tipo, ciudad, moneda, telefono, descripcion })

export async function negocioPorSlug(slug) {
  const negocio = (await repo.listar('global', 'negocios')).find((n) => n.slug === slug)
  exigir(negocio, 'Esta tienda no existe', 404)
  return negocio
}

const router = Router()

router.get('/tiendas', async (_req, res) =>
  res.json((await repo.listar('global', 'negocios')).map(publico)))

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
