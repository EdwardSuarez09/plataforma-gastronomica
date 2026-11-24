import request from 'supertest'
import { beforeAll, describe, expect, test } from 'vitest'
import app from '../app.js'
import * as repo from '../modules/persistencia/repo.js'

describe('HU-10 Tienda pública', () => {
  beforeAll(async () => {
    const a = await repo.crear('global', 'negocios', { nombre: 'Fritos A', slug: 'fritos-a', propietarioId: 'u1' })
    const b = await repo.crear('global', 'negocios', { nombre: 'Jugos B', slug: 'jugos-b', propietarioId: 'u2' })
    await repo.crear(a.id, 'productos', { nombre: 'Empanada', precio: 2500, activo: true, masaId: 'm', extras: [] })
    await repo.crear(a.id, 'productos', { nombre: 'Viejo', precio: 100, activo: false })
    await repo.crear(b.id, 'productos', { nombre: 'Jugo', precio: 4000, activo: true })
  })

  test('CA-1: cualquiera puede ver la lista de tiendas sin iniciar sesión', async () => {
    const res = await request(app).get('/api/publico/tiendas')
    expect(res.body.map((t) => t.slug)).toEqual(['fritos-a', 'jugos-b'])
  })

  test('CA-2: cada tienda muestra solo sus productos activos', async () => {
    const res = await request(app).get('/api/publico/fritos-a/menu')
    expect(res.body.negocio.nombre).toBe('Fritos A')
    expect(res.body.productos.map((p) => p.nombre)).toEqual(['Empanada'])
  })

  test('CA-3: el menú no expone información interna', async () => {
    const texto = (await request(app).get('/api/publico/fritos-a/menu')).text
    expect(texto).not.toMatch(/propietarioId|masaId|extras/)
  })

  test('CA-4: una tienda que no existe responde 404', async () => {
    const res = await request(app).get('/api/publico/nada/menu')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Esta tienda no existe')
  })
})
