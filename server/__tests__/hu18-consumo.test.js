import request from 'supertest'
import { beforeAll, describe, expect, test } from 'vitest'
import app from '../app.js'
import { firmarToken } from '../middleware/auth.js'
import { consumoDe, unidadesPosibles } from '../modules/consumo/calcular.js'
import * as repo from '../modules/persistencia/repo.js'

const masa = { id: 'm', ingredientes: [{ insumoId: 'h', cantidad: 10 }], rendimiento: [{ productoId: 'e', unidades: 100 }] }
const empanada = { id: 'e', masaId: 'm', extras: [{ insumoId: 'c', cantidad: 0.02 }] }

describe('HU-18 reglas (unitarias)', () => {
  test('CA-1: consumo = masa por unidad + extras', () =>
    expect(consumoDe([{ productoId: 'e', cantidad: 5 }], [empanada], [masa])).toEqual({ h: 0.5, c: 0.1 }))

  test('CA-4: el insumo más escaso limita las unidades', () =>
    expect(unidadesPosibles(empanada, [masa], { h: 10, c: 0.2 })).toBe(10))

  test('CA-4: un insumo sin control de inventario no limita', () => {
    expect(unidadesPosibles(empanada, [masa], { h: 1 })).toBe(10)
    expect(unidadesPosibles(empanada, [masa], {})).toBeNull()
  })
})

describe('HU-18 API: todo queda vinculado', () => {
  let negocio, token, harina, producto
  const api = (metodo, ruta) => request(app)[metodo](`/api${ruta}`).set('Authorization', token)
  const stock = async () => (await api('get', `/insumos/${harina.id}`)).body.stock
  const vender = (cantidad) => api('post', '/ventas').send({ items: [{ productoId: producto.id, cantidad }] })
  const pedir = (cantidad) => request(app).post('/api/publico/fritos/pedidos')
    .send({ cliente: { nombre: 'Luis', telefono: '3001234567' }, items: [{ productoId: producto.id, cantidad }] })
  const pasar = async (estado, motivo) => {
    const { id } = (await api('get', '/pedidos')).body.at(-1)
    return api('patch', `/pedidos/${id}/estado`).send({ estado, motivo })
  }

  beforeAll(async () => {
    negocio = await repo.crear('global', 'negocios', { nombre: 'Fritos', slug: 'fritos' })
    token = `Bearer ${firmarToken({ usuarioId: 'u1', negocioId: negocio.id })}`
    harina = (await api('post', '/insumos').send({ nombre: 'Harina', unidad: 'kg', precio: 3000, stock: 10 })).body
    const lote = (await api('post', '/masas')
      .send({ nombre: 'Base', tipo: 'otro', ingredientes: [{ insumoId: harina.id, cantidad: 10 }] })).body
    producto = (await api('post', '/productos')
      .send({ nombre: 'Empanada', precio: 2500, masaId: lote.id, unidadesPorLote: 100 })).body
  })

  test('CA-2: la venta descuenta insumos y congela el costo', async () => {
    const res = await vender(10)
    expect(res.body.items[0].costoUnitario).toBe(300)
    expect(await stock()).toBe(9)
  })

  test('CA-3: anular devuelve los insumos una sola vez', async () => {
    const venta = (await vender(20)).body
    expect(await stock()).toBe(7)
    await api('post', `/ventas/${venta.id}/anular`)
    expect(await stock()).toBe(9)
    expect((await api('post', `/ventas/${venta.id}/anular`)).status).toBe(400)
  })

  test('CA-5: la tienda no deja pedir más de lo que se puede preparar', async () => {
    const res = await pedir(91)
    expect(res.status).toBe(409)
    expect(res.body.error).toBe('Por ahora solo quedan 90 de Empanada')
  })

  test('CA-6: confirmar reserva, cancelar libera', async () => {
    await pedir(80)
    await pasar('confirmado')
    expect((await pedir(20)).status).toBe(409)
    expect(await stock()).toBe(9)
    await pasar('cancelado', 'El cliente no vino')
    expect((await pedir(20)).status).toBe(201)
  })

  test('CA-7: entregar descuenta, y anular esa venta marca el pedido', async () => {
    for (const e of ['confirmado', 'en_preparacion', 'listo', 'entregado']) await pasar(e)
    expect(await stock()).toBe(7)
    const venta = (await api('get', '/ventas')).body.find((v) => v.pedidoId)
    await api('post', `/ventas/${venta.id}/anular`)
    expect((await api('get', '/pedidos')).body.at(-1).estado).toBe('anulado')
    expect(await stock()).toBe(9)
  })

  test('CA-8: en mostrador avisa si no alcanza, pero permite vender', async () => {
    const res = await vender(100)
    expect(res.status).toBe(201)
    expect(res.body.faltantes).toEqual(['Harina'])
  })

  test('CA-9: la tienda muestra el producto agotado', async () => {
    const menu = (await request(app).get('/api/publico/fritos/menu')).body
    expect(menu.productos[0].agotado).toBe(true)
  })

  test('CA-10: el stock sigue siendo la suma del libro', async () => {
    const libro = (await api('get', '/movimientos')).body
    expect(libro.reduce((suma, m) => suma + m.cantidad, 0)).toBeCloseTo(await stock(), 6)
  })
})
