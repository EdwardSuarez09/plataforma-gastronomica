import request from 'supertest'
import { beforeAll, describe, expect, test } from 'vitest'
import app from '../app.js'
import * as repo from '../modules/persistencia/repo.js'
import { resumirMenu } from '../modules/tienda/index.js'

describe('HU-29 resumen del menú (unitarias)', () => {
  test('CA-1: cuenta los productos activos y el precio más bajo', () => {
    const menu = [
      { nombre: 'Papa', precio: 3500, categoria: 'Papas', activo: true },
      { nombre: 'Arepa', precio: 1800, categoria: 'Arepas', activo: true },
      { nombre: 'Viejo', precio: 100, categoria: 'Otros', activo: false },
    ]
    expect(resumirMenu(menu)).toEqual({ productos: 2, desde: 1800, categorias: ['Papas', 'Arepas'], menu: ['Papa', 'Arepa'] })
  })

  test('CA-1: un negocio sin productos no inventa un precio', () =>
    expect(resumirMenu([])).toEqual({ productos: 0, desde: null, categorias: [], menu: [] }))
})

describe('HU-29 Vitrina (integración)', () => {
  beforeAll(async () => {
    const a = await repo.crear('global', 'negocios', { nombre: 'Fritos A', slug: 'fritos-a', propietarioId: 'u1' })
    const b = await repo.crear('global', 'negocios', { nombre: 'Jugos B', slug: 'jugos-b', propietarioId: 'u2' })
    await repo.crear(a.id, 'productos', { nombre: 'Empanada', precio: 2500, activo: true, masaId: 'm', extras: [{ insumoId: 'i', cantidad: 1 }] })
    await repo.crear(b.id, 'productos', { nombre: 'Jugo', precio: 4000, activo: true })
  })

  test('CA-1: cada tienda trae el resumen de su propio menú', async () => {
    const res = await request(app).get('/api/publico/tiendas')
    expect(res.body.map((t) => [t.slug, t.productos, t.desde])).toEqual([['fritos-a', 1, 2500], ['jugos-b', 1, 4000]])
  })

  test('CA-6: la vitrina no expone información interna', async () => {
    const { text } = await request(app).get('/api/publico/tiendas')
    expect(text).not.toMatch(/propietarioId|masaId|extras|insumo|costo/)
  })
})
