import request from 'supertest'
import { describe, expect, test } from 'vitest'
import app from '../app.js'
import { firmarToken } from '../middleware/auth.js'
import * as repo from '../modules/persistencia/repo.js'

const token = (negocioId) => `Bearer ${firmarToken({ usuarioId: 'u1', negocioId })}`
const insumo = { nombre: 'Harina', unidad: 'kg', precio: 3000, stock: 5 }
const crear = (neg, datos = insumo) =>
  request(app).post('/api/insumos').set('Authorization', token(neg)).send(datos)

describe('HU-14 Conservar los registros', () => {
  test('CA-1: el registro queda guardado', async () => {
    const res = await crear('n1')
    expect(res.status).toBe(201)
    expect(await repo.listar('n1', 'insumos')).toEqual([res.body])
  })

  test('CA-2: id único y negocioId del token; no se ven datos de otro negocio', async () => {
    const res = await crear('n2', { ...insumo, negocioId: 'n1' })
    expect(res.body.id).toBeTruthy()
    expect(res.body.negocioId).toBe('n2')
    const ajeno = await request(app).get(`/api/insumos/${res.body.id}`).set('Authorization', token('n3'))
    expect(ajeno.status).toBe(404)
    const lista = await request(app).get('/api/insumos?negocioId=n2').set('Authorization', token('n3'))
    expect(lista.body).toEqual([])
  })

  test('CA-4: diez escrituras simultáneas no pierden datos', async () => {
    await Promise.all(
      Array.from({ length: 10 }, (_, i) => crear('n5', { ...insumo, nombre: `Insumo ${i}` })),
    )
    const lista = await request(app).get('/api/insumos').set('Authorization', token('n5'))
    expect(lista.body).toHaveLength(10)
  })

  test('CA-6: el respaldo trae todas las colecciones del negocio', async () => {
    const res = await request(app).get('/api/respaldo').set('Authorization', token('n5'))
    expect(Object.keys(res.body)).toEqual(
      expect.arrayContaining(['insumos', 'masas', 'productos', 'compras', 'ventas']),
    )
    expect(res.body.insumos).toHaveLength(10)
  })

  test('sin token responde 401', async () => {
    expect((await request(app).get('/api/insumos')).status).toBe(401)
  })
})
