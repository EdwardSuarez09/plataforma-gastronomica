import { Router } from 'express'
import { firmarToken, requiereNegocio, requiereSesion } from '../../middleware/auth.js'
import { exigir } from '../../middleware/errores.js'
import * as repo from '../persistencia/repo.js'
import { crearSlug, validarNegocio } from './validar.js'

const router = Router()
const campos = ({ nombre, tipo, ciudad, moneda, telefono = '', descripcion = '' }) =>
  ({ nombre: nombre.trim(), tipo, ciudad: ciudad.trim(), moneda, telefono, descripcion })

router.get('/', requiereNegocio, async (req, res) =>
  res.json(await repo.obtener('global', 'negocios', req.negocioId)))

router.post('/', requiereSesion, async (req, res) => {
  const error = validarNegocio(req.body)
  exigir(!error, error)
  const { usuarioId, rol } = req.sesion
  const usuario = await repo.obtener('global', 'usuarios', usuarioId)
  exigir(!usuario.negocioId, 'Ya tienes un negocio configurado', 409)

  const existentes = new Set((await repo.listar('global', 'negocios')).map((n) => n.slug))
  const base = crearSlug(req.body.nombre) || 'tienda'
  let slug = base
  for (let i = 2; existentes.has(slug); i++) slug = `${base}-${i}`

  const negocio = await repo.crear('global', 'negocios', { ...campos(req.body), slug, propietarioId: usuarioId })
  await repo.transformar('global', 'usuarios', (lista) => {
    lista.find((u) => u.id === usuarioId).negocioId = negocio.id
  })
  // Token nuevo: a partir de aquí la sesión queda atada a este negocio.
  res.status(201).json({ negocio, token: firmarToken({ usuarioId, negocioId: negocio.id, rol }) })
})

router.put('/', requiereNegocio, async (req, res) => {
  const error = validarNegocio(req.body)
  exigir(!error, error)
  res.json(await repo.editar('global', 'negocios', req.negocioId, campos(req.body)))
})

export default { ruta: '/api/negocio', router, orden: 2 }
