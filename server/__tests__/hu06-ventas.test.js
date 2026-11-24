import request from 'supertest'
import { beforeAll, describe, expect, test } from 'vitest'
import app from '../app.js'
import { firmarToken } from '../middleware/auth.js'
import * as repo from '../modules/persistencia/repo.js'
import { armarDetalle } from '../modules/ventas/armar.js'
import { hoy, sumarDias } from '../util/fechas.js'

const productos = [
  { id: 'e', nombre: 'Empanada', precio: 2500, activo: true },
  { id: 'p', nombre: 'Papa', precio: 3500, activo: true },
  { id: 'x', nombre: 'Viejo', precio: 1000, activo: false },
]

describe('HU-06 reglas (unitarias)', () => {
  test('CA-2: suma varios productos', () => {
    const r = armarDetalle([{ productoId: 'e', cantidad: 2 }, { productoId: 'p', cantidad: 1 }], productos)
    expect(r.total).toBe(8500)
    expect(r.items).toHaveLength(2)
  })

  test('CA-3: toma el precio del servidor, no el que envíe el navegador', () => {
    const r = armarDetalle([{ productoId: 'e', cantidad: 1, precioUnitario: 1 }], productos)
    expect(r.items[0].precioUnitario).toBe(2500)
  })

  test('CA-5: rechaza un producto desactivado', () =>
    expect(() => armarDetalle([{ productoId: 'x', cantidad: 1 }], productos)).toThrow(/disponible/))

  test.each([0, -1, 1.5, '', undefined])('CA-6: rechaza la cantidad %s', (cantidad) =>
    expect(() => armarDetalle([{ productoId: 'e', cantidad }], productos)).toThrow(/entero/))

  test('rechaza una venta vacía', () => expect(() => armarDetalle([], productos)).toThrow(/al menos/))
})

describe('HU-06 API', () => {
  const api = (metodo, ruta) =>
    request(app)[metodo](`/api${ruta}`)
      .set('Authorization', `Bearer ${firmarToken({ usuarioId: 'u', negocioId: 'n1' })}`)
  let producto
  const vender = (extra = {}) => api('post', '/ventas').send({ items: [{ productoId: producto.id, cantidad: 2 }], ...extra })

  beforeAll(async () => {
    producto = await repo.crear('n1', 'productos', { nombre: 'Empanada', precio: 2500, activo: true })
  })

  test('CA-1: registra con la fecha del día', async () => {
    const res = await vender()
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ fecha: hoy(), total: 5000, estado: 'registrada' })
  })

  test('CA-3: cambiar el precio no altera la venta anterior', async () => {
    const venta = (await vender()).body
    await repo.editar('n1', 'productos', producto.id, { precio: 9000 })
    expect((await api('get', `/ventas/${venta.id}`)).body.total).toBe(5000)
  })

  test('CA-4: acepta una fecha anterior y rechaza una futura', async () => {
    expect((await vender({ fecha: sumarDias(hoy(), -3) })).status).toBe(201)
    expect((await vender({ fecha: sumarDias(hoy(), 1) })).status).toBe(400)
  })

  test('CA-7: anular marca la venta', async () => {
    const venta = (await vender()).body
    expect((await api('post', `/ventas/${venta.id}/anular`)).body.estado).toBe('anulada')
  })
})
