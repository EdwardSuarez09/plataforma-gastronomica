import request from 'supertest'
import { beforeAll, describe, expect, test } from 'vitest'
import app from '../app.js'
import { firmarToken } from '../middleware/auth.js'
import { costoIngredientes, validarMasa, validarRendimiento } from '../modules/masas/validar.js'
import { validarProducto } from '../modules/productos/validar.js'

const insumos = [{ id: 'h', precio: 3000 }, { id: 'a', precio: 8000 }]
const masa = { nombre: 'Tradicional', tipo: 'tradicional', ingredientes: [{ insumoId: 'h', cantidad: 10 }] }

describe('HU-04 reglas (unitarias)', () => {
  test('CA-2: costo del lote = suma de cantidad × precio', () => {
    const ingredientes = [{ insumoId: 'h', cantidad: 10 }, { insumoId: 'a', cantidad: 2 }]
    expect(costoIngredientes(ingredientes, insumos)).toBe(46000)
  })

  test('CA-2: el costo cambia cuando cambia el precio del insumo', () =>
    expect(costoIngredientes(masa.ingredientes, [{ id: 'h', precio: 3500 }])).toBe(35000))

  test.each([
    [{ ingredientes: [{ insumoId: 'h', cantidad: 0 }] }, /mayor que 0/],
    [{ ingredientes: [{ insumoId: 'h', cantidad: 1 }, { insumoId: 'h', cantidad: 2 }] }, /repetir/],
    [{ ingredientes: [] }, /al menos un ingrediente/],
    [{ tipo: 'invisible' }, /tipo/],
  ])('CA-1 y CA-3: la masa rechaza %o', (cambio, mensaje) =>
    expect(validarMasa({ ...masa, ...cambio }, insumos)).toMatch(mensaje))

  test.each([0, -5, 2.5])('CA-4: el rendimiento rechaza %d', (unidades) =>
    expect(validarRendimiento([{ productoId: 'p', unidades }], [{ id: 'p' }])).toMatch(/entero/))

  test('CA-5: el producto exige precio mayor que 0 y una masa', () => {
    const producto = { nombre: 'Empanada', precio: 2500, masaId: 'm', extras: [] }
    expect(validarProducto(producto, [{ id: 'm' }], insumos)).toBeNull()
    expect(validarProducto({ ...producto, precio: 0 }, [{ id: 'm' }], insumos)).toMatch(/precio/)
    expect(validarProducto({ ...producto, masaId: 'x' }, [{ id: 'm' }], insumos)).toMatch(/masa/)
  })
})

describe('HU-04 API', () => {
  const api = (metodo, ruta) =>
    request(app)[metodo](`/api${ruta}`)
      .set('Authorization', `Bearer ${firmarToken({ usuarioId: 'u', negocioId: 'n1' })}`)
  let insumo, lote, producto

  beforeAll(async () => {
    insumo = (await api('post', '/insumos').send({ nombre: 'Harina', unidad: 'kg', precio: 3000 })).body
    const ingredientes = [{ insumoId: insumo.id, cantidad: 10 }]
    lote = (await api('post', '/masas').send({ ...masa, ingredientes })).body
    producto = (await api('post', '/productos').send({
      nombre: 'Empanada', precio: 2500, masaId: lote.id, extras: [{ insumoId: insumo.id, cantidad: 0.1 }],
    })).body
  })

  test('CA-2: la lista de masas muestra el costo del lote', async () =>
    expect((await api('get', '/masas')).body[0].costoLote).toBe(30000))

  test('CA-4: guarda el rendimiento', async () => {
    const res = await api('put', `/masas/${lote.id}/rendimiento`)
      .send({ rendimiento: [{ productoId: producto.id, unidades: 80 }] })
    expect(res.body.rendimiento).toEqual([{ productoId: producto.id, unidades: 80 }])
  })

  test('CA-7: editar un producto conserva los demás datos', async () => {
    const res = await api('put', `/productos/${producto.id}`).send({ precio: 2800 })
    expect(res.body).toMatchObject({ nombre: 'Empanada', precio: 2800, masaId: lote.id })
  })

  test('CA-8: un producto se desactiva, no se borra', async () => {
    await api('delete', `/productos/${producto.id}`)
    expect((await api('get', `/productos/${producto.id}`)).body.activo).toBe(false)
  })

  test('CA-9: el mismo insumo en masa y producto no se duplica', async () =>
    expect((await api('get', '/insumos')).body).toHaveLength(1))
})
