import request from 'supertest'
import { expect, test } from 'vitest'
import app from '../app.js'
import { firmarToken } from '../middleware/auth.js'
import * as repo from '../modules/persistencia/repo.js'

const vender = async (extra) => {
  const p = await repo.crear('n1', 'productos', { nombre: 'Empanada', precio: 2500, activo: true })
  return request(app).post('/api/ventas')
    .set('Authorization', `Bearer ${firmarToken({ usuarioId: 'u', negocioId: 'n1' })}`)
    .send({ items: [{ productoId: p.id, cantidad: 1 }], ...extra })
}

test('CA-3: guarda el medio de pago; por defecto efectivo', async () => {
  expect((await vender({})).body.metodoPago).toBe('efectivo')
  expect((await vender({ metodoPago: 'transferencia' })).body.metodoPago).toBe('transferencia')
})

test('CA-3: rechaza un medio de pago desconocido', async () =>
  expect((await vender({ metodoPago: 'trueque' })).status).toBe(400))
