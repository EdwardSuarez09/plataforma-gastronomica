import { randomBytes } from 'node:crypto'
import { Router } from 'express'
import { requiereNegocio } from '../../middleware/auth.js'
import { exigir } from '../../middleware/errores.js'
import { limitar } from '../../middleware/limite.js'
import { hoy } from '../../util/fechas.js'
import * as repo from '../persistencia/repo.js'
import { negocioPorSlug } from '../tienda/index.js'
import { armarDetalle } from '../ventas/armar.js'
import { validarCambio, validarCliente } from './estados.js'

const router = Router()
const freno = limitar({ maximo: 30, minutos: 5, mensaje: 'Demasiados pedidos seguidos. Espera unos minutos.' })
const paso = (estado, usuarioId = null, motivo = '') =>
  ({ estado, usuarioId, motivo, fecha: new Date().toISOString() })

// Cliente invitado: no necesita cuenta.
router.post('/publico/:slug/pedidos', freno, async (req, res) => {
  const negocio = await negocioPorSlug(req.params.slug)
  const { cliente, items, nota = '' } = req.body
  const error = validarCliente(cliente)
  exigir(!error, error)
  const detalle = armarDetalle(items, await repo.listar(negocio.id, 'productos'))
  const pedido = await repo.crear(negocio.id, 'pedidos', {
    ...detalle,
    codigo: randomBytes(4).toString('hex').toUpperCase(),
    cliente: { nombre: cliente.nombre.trim(), telefono: String(cliente.telefono) },
    nota: String(nota).slice(0, 200),
    fecha: hoy(),
    estado: 'recibido',
    historial: [paso('recibido')],
  })
  res.status(201).json({ codigo: pedido.codigo, total: pedido.total, estado: pedido.estado })
})

router.get('/publico/:slug/pedidos/:codigo', async (req, res) => {
  const negocio = await negocioPorSlug(req.params.slug)
  const pedido = (await repo.listar(negocio.id, 'pedidos')).find((p) => p.codigo === req.params.codigo)
  exigir(pedido, 'Pedido no encontrado', 404)
  const { codigo, items, total, estado, fecha } = pedido
  res.json({ codigo, items, total, estado, fecha })
})

router.patch('/pedidos/:id/estado', requiereNegocio, async (req, res) => {
  const { estado, motivo } = req.body
  const pedido = await repo.transaccion(async () => {
    const actualizado = await repo.transformar(req.negocioId, 'pedidos', (lista) => {
      const p = lista.find((x) => x.id === req.params.id)
      exigir(p, 'Pedido no encontrado', 404)
      const error = validarCambio(p.estado, estado, motivo)
      exigir(!error, error)
      p.estado = estado
      p.historial.push(paso(estado, req.sesion.usuarioId, motivo))
      return p
    })
    if (estado === 'entregado') {
      const { items, total, id } = actualizado
      await repo.crear(req.negocioId, 'ventas', {
        items, total, pedidoId: id, fecha: hoy(), origen: 'pedido_digital', estado: 'registrada',
      })
    }
    return actualizado
  })
  res.json(pedido)
})

export default { ruta: '/api', router, orden: 4 }
