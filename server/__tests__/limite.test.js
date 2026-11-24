import express from 'express'
import request from 'supertest'
import { expect, test } from 'vitest'
import { limitar } from '../middleware/limite.js'

test('limitar responde 429 y Retry-After al alcanzar el máximo', async () => {
  const app = express()
  app.get('/', limitar({ maximo: 2, minutos: 1, mensaje: 'Demasiadas solicitudes' }), (_req, res) =>
    res.sendStatus(200))

  expect((await request(app).get('/')).status).toBe(200)
  expect((await request(app).get('/')).status).toBe(200)
  const bloqueada = await request(app).get('/')
  expect(bloqueada.status).toBe(429)
  expect(bloqueada.headers['retry-after']).toBeTruthy()
  expect(bloqueada.body.error).toBe('Demasiadas solicitudes')
})
