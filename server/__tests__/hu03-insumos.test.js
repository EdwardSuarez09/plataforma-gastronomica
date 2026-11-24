import request from 'supertest'
import { describe, expect, test } from 'vitest'
import app from '../app.js'
import { firmarToken } from '../middleware/auth.js'
import { insumoEnUso, validarInsumo } from '../modules/insumos/validar.js'
import * as repo from '../modules/persistencia/repo.js'

const harina = { nombre: 'Harina', unidad: 'kg', precio: 3000, stock: 5 }
const api = (metodo, ruta, neg = 'n1') =>
  request(app)[metodo](`/api/insumos${ruta}`)
    .set('Authorization', `Bearer ${firmarToken({ usuarioId: 'u', negocioId: neg })}`)

describe('HU-03 validaciones (unitarias)', () => {
  test('acepta un insumo válido', () => expect(validarInsumo(harina)).toBeNull())

  test.each([
    [{ nombre: ' ' }, /nombre/],
    [{ unidad: 'arroba' }, /unidad/],
    [{ precio: 0 }, /precio/],
    [{ precio: 'abc' }, /precio/],
    [{ stock: -1 }, /stock/],
    [{ stockMinimo: -1 }, /mínimo/],
    [{ stockMinimo: 'abc' }, /mínimo/],
  ])('CA-2: rechaza %o', (cambio, mensaje) =>
    expect(validarInsumo({ ...harina, ...cambio })).toMatch(mensaje))

  test('CA-3: no permite repetir el nombre, pero sí editar el mismo insumo', () => {
    const existentes = [{ ...harina, id: '1' }]
    expect(validarInsumo({ ...harina, nombre: ' HARINA ' }, existentes)).toMatch(/Ya existe/)
    expect(validarInsumo({ ...harina, id: '1' }, existentes)).toBeNull()
  })

  test('CA-6: detecta si una masa o un producto usa el insumo', () => {
    expect(insumoEnUso('1', [{ ingredientes: [{ insumoId: '1' }] }], [])).toBe(true)
    expect(insumoEnUso('1', [], [{ extras: [{ insumoId: '1' }] }])).toBe(true)
    expect(insumoEnUso('1', [], [])).toBe(false)
  })
})

describe('HU-03 API de insumos', () => {
  test('CA-1 y CA-4: crea con stock 0 por defecto y edita', async () => {
    const { body } = await api('post', '').send({ nombre: 'Sal', unidad: 'kg', precio: 2000 })
    expect(body.stock).toBe(0)
    const editado = await api('put', `/${body.id}`).send({ precio: 2500 })
    expect(editado.body).toMatchObject({ nombre: 'Sal', precio: 2500 })
  })

  test('CA-6: impide eliminar un insumo en uso y permite los demás', async () => {
    const usado = (await api('post', '').send(harina)).body
    const libre = (await api('post', '').send({ ...harina, nombre: 'Ají' })).body
    await repo.crear('n1', 'masas', { nombre: 'Masa', ingredientes: [{ insumoId: usado.id, cantidad: 1 }] })
    expect((await api('delete', `/${usado.id}`)).status).toBe(409)
    expect((await api('delete', `/${libre.id}`)).status).toBe(204)
  })

  test('CA-7: no se ven los insumos de otro negocio', async () =>
    expect((await api('get', '', 'n2')).body).toEqual([]))
})
