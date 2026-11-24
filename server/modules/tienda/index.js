import { Router } from 'express'
import { exigir } from '../../middleware/errores.js'
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
  const productos = (await repo.listar(negocio.id, 'productos'))
    .filter((p) => p.activo)
    .map(({ id, nombre, precio, descripcion, categoria }) => ({ id, nombre, precio, descripcion, categoria }))
  res.json({ negocio: publico(negocio), productos })
})

export default { ruta: '/api/publico', router, orden: 3 }
