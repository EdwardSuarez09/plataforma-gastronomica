import request from 'supertest'
import { expect, test, vi } from 'vitest'
import app from '../app.js'

const entrar = (correo) => request(app).post('/api/auth/login').send({ correo, contrasena: 'equivocada' })

test('CA-1: después de 5 intentos fallidos se bloquea ese correo por un tiempo', async () => {
  for (let i = 0; i < 5; i++) expect((await entrar('a@p.co')).status).toBe(401)
  const res = await entrar('A@p.co')
  expect(res.status).toBe(429)
  expect(res.body.error).toMatch(/Demasiados intentos/)
})

test('CA-2: el bloqueo no afecta a otro usuario', async () => expect((await entrar('b@p.co')).status).toBe(401))

test('CA-1: el bloqueo vence después de 10 minutos', async () => {
  let ahora = Date.now()
  const reloj = vi.spyOn(Date, 'now').mockImplementation(() => ahora)
  try {
    for (let i = 0; i < 5; i++) expect((await entrar('vence@p.co')).status).toBe(401)
    expect((await entrar('vence@p.co')).status).toBe(429)
    ahora += 10 * 60_000
    expect((await entrar('vence@p.co')).status).toBe(401)
  } finally {
    reloj.mockRestore()
  }
})

test('CA-3: entrar bien borra los intentos fallidos', async () => {
  const bueno = { nombre: 'C', correo: 'c@p.co', contrasena: 'clave-segura' }
  await request(app).post('/api/auth/registro').send(bueno)
  for (let i = 0; i < 4; i++) await entrar('c@p.co')
  expect((await request(app).post('/api/auth/login').send(bueno)).status).toBe(200)
  for (let i = 0; i < 4; i++) expect((await entrar('c@p.co')).status).toBe(401)
})
