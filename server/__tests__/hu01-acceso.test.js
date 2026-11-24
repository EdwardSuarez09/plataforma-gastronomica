import request from 'supertest'
import { describe, expect, test } from 'vitest'
import app from '../app.js'
import * as repo from '../modules/persistencia/repo.js'
import { validarRegistro } from '../modules/auth/validar.js'

const datos = { nombre: 'Ana', correo: 'ana@prueba.co', contrasena: 'clave-segura' }

describe('HU-01 validación (unitarias)', () => {
  test.each([
    [{ ...datos, nombre: ' ' }, /nombre/],
    [{ ...datos, correo: 'ana.co' }, /correo/],
    [{ ...datos, contrasena: '1234567' }, /8 caracteres/],
  ])('rechaza %o', (entrada, mensaje) => expect(validarRegistro(entrada)).toMatch(mensaje))

  test('acepta datos válidos', () => expect(validarRegistro(datos)).toBeNull())
})

describe('HU-01 registro y login (API)', () => {
  test('CA-1: registra y devuelve la sesión sin exponer la contraseña', async () => {
    const res = await request(app).post('/api/auth/registro').send(datos)
    expect(res.status).toBe(201)
    expect(res.body.token).toBeTruthy()
    expect(JSON.stringify(res.body)).not.toMatch(/hash|clave-segura/)
  })

  test('CA-2: no permite repetir el correo', async () => {
    const res = await request(app).post('/api/auth/registro').send({ ...datos, correo: 'ANA@prueba.co' })
    expect(res.status).toBe(409)
    expect(res.body.error).toBe('Este correo ya está registrado')
  })

  test('CA-3: entra con credenciales correctas', async () => {
    const res = await request(app).post('/api/auth/login').send(datos)
    expect(res.status).toBe(200)
    expect(res.body.usuario.nombre).toBe('Ana')
  })

  test('CA-4: rechaza una contraseña incorrecta', async () => {
    const res = await request(app).post('/api/auth/login').send({ ...datos, contrasena: 'otra-clave' })
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Correo o contraseña incorrectos')
  })

  test('CA-6: la contraseña se guarda cifrada', async () => {
    const usuarios = await repo.listar('global', 'usuarios')
    expect(JSON.stringify(usuarios)).not.toContain(datos.contrasena)
    expect(usuarios[0].hash).toMatch(/^\$2/)
  })
})
