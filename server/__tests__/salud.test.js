import request from 'supertest'
import { expect, test } from 'vitest'
import app from '../app.js'

test('GET /api/salud responde ok', async () => {
  const res = await request(app).get('/api/salud')
  expect(res.status).toBe(200)
  expect(res.body).toEqual({ estado: 'ok' })
})

test('una ruta inexistente responde 404', async () => {
  expect((await request(app).get('/no-existe')).status).toBe(404)
})
