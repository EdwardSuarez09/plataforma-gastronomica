import request from 'supertest'
import { beforeAll, describe, expect, test } from 'vitest'
import app from '../app.js'
import { firmarToken } from '../middleware/auth.js'

describe('HU-22 Ficha del producto', () => {
  const api = (metodo, ruta) =>
    request(app)[metodo](`/api${ruta}`)
      .set('Authorization', `Bearer ${firmarToken({ usuarioId: 'u', negocioId: 'n1' })}`)
  const masas = async () => (await api('get', '/masas')).body
  let m1, m2, producto

  beforeAll(async () => {
    const insumo = (await api('post', '/insumos').send({ nombre: 'Harina', unidad: 'kg', precio: 3000 })).body
    const masa = (nombre) => api('post', '/masas')
      .send({ nombre, tipo: 'otro', ingredientes: [{ insumoId: insumo.id, cantidad: 1 }] })
    m1 = (await masa('Una')).body
    m2 = (await masa('Dos')).body
  })

  test('CA-1: el rendimiento se guarda junto con el producto', async () => {
    producto = (await api('post', '/productos').send({
      nombre: 'Empanada', precio: 2500, masaId: m1.id, categoria: 'Empanadas', unidadesPorLote: 80,
    })).body
    expect(producto.categoria).toBe('Empanadas')
    expect((await masas())[0].rendimiento).toEqual([{ productoId: producto.id, unidades: 80 }])
  })

  test('CA-2: el rendimiento debe ser un entero mayor que 0', async () => {
    const res = await api('put', `/productos/${producto.id}`).send({ unidadesPorLote: 1.5 })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/entero/)
  })

  test('CA-3: al cambiar de masa, el rendimiento se mueve con el producto', async () => {
    await api('put', `/productos/${producto.id}`).send({ masaId: m2.id, unidadesPorLote: 40 })
    const [una, dos] = await masas()
    expect(una.rendimiento).toEqual([])
    expect(dos.rendimiento).toEqual([{ productoId: producto.id, unidades: 40 }])
  })
})
