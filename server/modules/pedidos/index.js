import { randomBytes } from 'node:crypto'
import { Router } from 'express'
import { requiereNegocio } from '../../middleware/auth.js'
import { exigir } from '../../middleware/errores.js'
import { limitar } from '../../middleware/limite.js'
import { hoy } from '../../util/fechas.js'
import { calcularDisponible, consumoDe, unidadesPosibles } from '../consumo/calcular.js'
import { cargar, crearVenta } from '../consumo/servicio.js'
import * as repo from '../persistencia/repo.js'
import { negocioPorSlug } from '../tienda/index.js'
import { armarDetalle } from '../ventas/armar.js'
import { validarCambio, validarCliente } from './estados.js'

const router = Router()
const freno = limitar({ maximo: 30, minutos: 5, mensaje: 'Demasiados pedidos seguidos. Espera unos minutos.' })
const paso = (estado, usuarioId = null, motivo = '') =>
  ({ estado, usuarioId, motivo, fecha: new Date().toISOString() })

// Revisa el pedido completo: dos productos pueden compartir el mismo insumo.
function exigirInsumos(items, datos) {
  const disponible = calcularDisponible(datos)
  for (const item of items) {
    const producto = datos.productos.find((p) => p.id === item.productoId)
    const otros = consumoDe(items.filter((i) => i !== item), datos.productos, datos.masas)
    const libre = Object.fromEntries(Object.entries(disponible).map(([id, n]) => [id, n - (otros[id] ?? 0)]))
    const maximo = unidadesPosibles(producto, datos.masas, libre)
    exigir(maximo === null || item.cantidad <= maximo, `Por ahora solo quedan ${maximo} de ${producto.nombre}`, 409)
  }
}

// Cliente invitado: no necesita cuenta.
router.post('/publico/:slug/pedidos', freno, async (req, res) => {
  const negocio = await negocioPorSlug(req.params.slug)
  const { cliente, items, nota = '' } = req.body
  const error = validarCliente(cliente)
  exigir(!error, error)
  const pedido = await repo.transaccion(async () => {
    const datos = await cargar(negocio.id)
    const detalle = armarDetalle(items, datos.productos)
    exigirInsumos(detalle.items, datos)
    return repo.crear(negocio.id, 'pedidos', {
      ...detalle,
      codigo: randomBytes(4).toString('hex').toUpperCase(),
      cliente: { nombre: cliente.nombre.trim(), telefono: String(cliente.telefono) },
      nota: String(nota).slice(0, 200),
      fecha: hoy(),
      estado: 'recibido',
      historial: [paso('recibido')],
    })
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
  const { usuarioId } = req.sesion
  const pedido = await repo.transaccion(async () => {
    const actual = await repo.obtener(req.negocioId, 'pedidos', req.params.id)
    const error = validarCambio(actual.estado, estado, motivo)
    exigir(!error, error)
    if (estado === 'confirmado') exigirInsumos(actual.items, await cargar(req.negocioId))
    const historial = [...actual.historial, paso(estado, usuarioId, motivo)]
    const editado = await repo.editar(req.negocioId, 'pedidos', actual.id, { estado, historial })
    // Un pedido entregado se convierte en venta: descuenta insumos y alimenta el pronóstico.
    if (estado === 'entregado') {
      const { items, total, id } = editado
      await crearVenta(req.negocioId, { items, total, pedidoId: id, fecha: hoy(), origen: 'pedido_digital' }, usuarioId)
    }
    return editado
  })
  res.json(pedido)
})

export default { ruta: '/api', router, orden: 4 }
