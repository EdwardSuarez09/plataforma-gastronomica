import request from 'supertest'
import { beforeAll, describe, expect, test } from 'vitest'
import app from '../app.js'
import { firmarToken } from '../middleware/auth.js'
import { precioUnitario, validarCompra } from '../modules/compras/validar.js'
import { hoy, sumarDias } from '../util/fechas.js'

const compra = { fecha: hoy(), cantidad: 10, valorTotal: 32000 }

describe('HU-05 reglas (unitarias)', () => {
  test('CA-3: precio unitario = valor ÷ cantidad', () => expect(precioUnitario(32000, 10)).toBe(3200))

  test.each([
    [{ cantidad: 0 }, /cantidad/],
    [{ valorTotal: -1 }, /valor/],
    [{ fecha: sumarDias(hoy(), 1) }, /futura/],
    [{ fecha: '' }, /fecha/],
  ])('CA-2: rechaza %o', (cambio, mensaje) =>
    expect(validarCompra({ ...compra, ...cambio })).toMatch(mensaje))

  test('CA-1: acepta una compra válida', () => expect(validarCompra(compra)).toBeNull())
})

describe('HU-05 API', () => {
  const api = (metodo, ruta) =>
    request(app)[metodo](`/api${ruta}`)
      .set('Authorization', `Bearer ${firmarToken({ usuarioId: 'u', negocioId: 'n1' })}`)
  let insumo

  beforeAll(async () => {
    insumo = (await api('post', '/insumos').send({ nombre: 'Harina', unidad: 'kg', precio: 3000, stock: 5 })).body
  })

  test('CA-4 y CA-5: suma el stock y no cambia el precio por su cuenta', async () => {
    const res = await api('post', '/compras').send({ ...compra, insumoId: insumo.id })
    expect(res.status).toBe(201)
    expect(res.body.compra.precioUnitario).toBe(3200)
    expect((await api('get', `/insumos/${insumo.id}`)).body).toMatchObject({ stock: 15, precio: 3000 })
  })

  test('dos compras simultáneas suman ambas', async () => {
    await Promise.all([1, 2].map(() => api('post', '/compras').send({ ...compra, insumoId: insumo.id })))
    expect((await api('get', `/insumos/${insumo.id}`)).body.stock).toBe(35)
  })

  test('rechaza un insumo que no existe', async () =>
    expect((await api('post', '/compras').send({ ...compra, insumoId: 'x' })).status).toBe(404))
})
