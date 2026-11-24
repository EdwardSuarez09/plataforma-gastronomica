import request from 'supertest'
import { beforeAll, describe, expect, test } from 'vitest'
import app from '../app.js'
import { firmarToken } from '../middleware/auth.js'
import { prepararAjuste } from '../modules/inventario/libro.js'
import { hoy } from '../util/fechas.js'

describe('HU-09 reglas (unitarias)', () => {
  const harina = { id: 'h', stock: 10 }
  const ajuste = (tipo, cantidad, motivo = 'Conteo del día') => prepararAjuste({ tipo, cantidad, motivo }, harina)

  test('CA-2: un conteo físico registra la diferencia', () => {
    expect(ajuste('conteo', 7).cantidad).toBe(-3)
    expect(ajuste('conteo', 12).cantidad).toBe(2)
  })

  test('CA-3: un desperdicio resta', () => expect(ajuste('desperdicio', 2).cantidad).toBe(-2))

  test.each([
    ['conteo', -1, 'x', /cantidad/],
    ['desperdicio', 0, 'x', /cantidad/],
    ['desperdicio', 2, ' ', /motivo/],
    ['magia', 1, 'x', /tipo/],
  ])('CA-4: rechaza %s %d "%s"', (tipo, cantidad, motivo, error) =>
    expect(() => ajuste(tipo, cantidad, motivo)).toThrow(error))
})

describe('HU-09 API', () => {
  const api = (metodo, ruta) =>
    request(app)[metodo](`/api${ruta}`)
      .set('Authorization', `Bearer ${firmarToken({ usuarioId: 'u1', negocioId: 'n1' })}`)
  const stock = async () => (await api('get', `/insumos/${insumo.id}`)).body.stock
  const libro = async () => (await api('get', '/movimientos')).body
  let insumo, compra

  beforeAll(async () => {
    insumo = (await api('post', '/insumos')
      .send({ nombre: 'Harina', unidad: 'kg', precio: 3000, stock: 5, stockMinimo: 4 })).body
  })

  test('CA-1: el stock inicial y la compra quedan en el libro', async () => {
    compra = (await api('post', '/compras').send({ insumoId: insumo.id, fecha: hoy(), cantidad: 10, valorTotal: 30000 })).body.compra
    expect((await libro()).map((m) => [m.tipo, m.cantidad, m.saldo])).toEqual([['inicial', 5, 5], ['compra', 10, 15]])
  })

  test('CA-5: anular la compra crea el movimiento inverso, una sola vez', async () => {
    expect((await api('post', `/compras/${compra.id}/anular`)).body.compra.estado).toBe('anulada')
    expect(await stock()).toBe(5)
    expect((await api('post', `/compras/${compra.id}/anular`)).status).toBe(400)
  })

  test('CA-2 y CA-4: el conteo deja motivo, usuario y fecha', async () => {
    await api('post', '/inventario/ajustes')
      .send({ insumoId: insumo.id, tipo: 'conteo', cantidad: 3, motivo: 'Conteo de cierre' })
    expect(await stock()).toBe(3)
    expect((await libro()).at(-1)).toMatchObject({ motivo: 'Conteo de cierre', usuarioId: 'u1', fecha: hoy(), cantidad: -2 })
  })

  test('CA-6: el stock ya no se edita a mano', async () => {
    await api('put', `/insumos/${insumo.id}`).send({ stock: 999, precio: 3100 })
    expect((await api('get', `/insumos/${insumo.id}`)).body).toMatchObject({ stock: 3, precio: 3100 })
  })

  test('CA-7: el stock siempre es la suma de los movimientos', async () =>
    expect((await libro()).reduce((suma, m) => suma + m.cantidad, 0)).toBe(await stock()))

  test('CA-8: avisa los insumos bajo el mínimo y valora el inventario', async () => {
    const [fila] = (await api('get', '/inventario')).body
    expect(fila).toMatchObject({ bajo: true, valor: 3 * 3100, verificadoEn: hoy() })
  })
})
