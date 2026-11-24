import request from 'supertest'
import { beforeAll, describe, expect, test } from 'vitest'
import app from '../app.js'
import { firmarToken } from '../middleware/auth.js'
import { validarCambio, validarCliente } from '../modules/pedidos/estados.js'
import * as repo from '../modules/persistencia/repo.js'

describe('HU-11 reglas (unitarias)', () => {
  test('CA-4: solo permite transiciones válidas', () => {
    expect(validarCambio('recibido', 'confirmado')).toBeNull()
    expect(validarCambio('recibido', 'entregado')).toMatch(/No se puede/)
    expect(validarCambio('entregado', 'recibido')).toMatch(/No se puede/)
  })

  test('CA-5: cancelar o rechazar exige motivo', () => {
    expect(validarCambio('recibido', 'rechazado')).toBe('Indica el motivo')
    expect(validarCambio('confirmado', 'cancelado', 'Sin insumos')).toBeNull()
  })

  test('CA-2: el cliente invitado da nombre y teléfono', () => {
    expect(validarCliente({ nombre: 'Luis', telefono: '300 123 4567' })).toBeNull()
    expect(validarCliente({ nombre: '', telefono: '3001234567' })).toMatch(/nombre/)
    expect(validarCliente({ nombre: 'Luis', telefono: 'abc' })).toMatch(/teléfono/)
  })
})

describe('HU-11 API', () => {
  let negocio, producto, pedido
  const cliente = { nombre: 'Luis', telefono: '3001234567' }
  const con = (id) => ['Authorization', `Bearer ${firmarToken({ usuarioId: 'u1', negocioId: id })}`]
  const pasar = (estado, id = negocio.id) =>
    request(app).patch(`/api/pedidos/${pedido.id}/estado`).set(...con(id)).send({ estado })

  beforeAll(async () => {
    negocio = await repo.crear('global', 'negocios', { nombre: 'Fritos A', slug: 'fritos-a' })
    producto = await repo.crear(negocio.id, 'productos', { nombre: 'Empanada', precio: 2500, activo: true })
  })

  test('CA-1 y CA-3: crea el pedido y el servidor calcula el total', async () => {
    const res = await request(app).post('/api/publico/fritos-a/pedidos')
      .send({ cliente, total: 1, items: [{ productoId: producto.id, cantidad: 3, precioUnitario: 1 }] })
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ total: 7500, estado: 'recibido' })
    pedido = (await repo.listar(negocio.id, 'pedidos'))[0]
  })

  test('CA-6: el cliente consulta su pedido con el código, sin datos personales', async () => {
    const res = await request(app).get(`/api/publico/fritos-a/pedidos/${pedido.codigo}`)
    expect(res.body.estado).toBe('recibido')
    expect(res.text).not.toContain('3001234567')
  })

  test('CA-8: otro negocio no ve ni cambia el pedido', async () => {
    expect((await request(app).get('/api/pedidos').set(...con('otro'))).body).toEqual([])
    expect((await pasar('confirmado', 'otro')).status).toBe(404)
  })

  test('CA-7: al entregarlo se convierte en una sola venta', async () => {
    for (const e of ['confirmado', 'en_preparacion', 'listo', 'entregado']) {
      expect((await pasar(e)).status).toBe(200)
    }
    expect((await pasar('entregado')).status).toBe(400)
    const ventas = await repo.listar(negocio.id, 'ventas')
    expect(ventas).toHaveLength(1)
    expect(ventas[0]).toMatchObject({ total: 7500, origen: 'pedido_digital', pedidoId: pedido.id })
  })
})
