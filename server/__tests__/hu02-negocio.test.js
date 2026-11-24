import request from 'supertest'
import { describe, expect, test } from 'vitest'
import app from '../app.js'
import { crearSlug, validarNegocio } from '../modules/negocio/validar.js'

const datos = { nombre: 'Fritos Doña Ana', tipo: 'Fritos', ciudad: 'Sincelejo', moneda: 'COP' }
const registrar = async (correo) => {
  const usuario = { nombre: 'X', correo, contrasena: 'clave-segura' }
  return (await request(app).post('/api/auth/registro').send(usuario)).body.token
}
const con = (token) => ['Authorization', `Bearer ${token}`]

describe('HU-02 Configurar el negocio', () => {
  test('CA-3: el nombre es obligatorio', () => {
    expect(validarNegocio({ ...datos, nombre: '' })).toMatch(/obligatorio/)
    expect(validarNegocio(datos)).toBeNull()
  })

  test('la dirección de la tienda no lleva tildes ni espacios', () =>
    expect(crearSlug('Fritos Doña Ana')).toBe('fritos-dona-ana'))

  test('CA-2 y CA-4: guarda, consulta y edita', async () => {
    const t = await registrar('a@p.co')
    const res = await request(app).post('/api/negocio').set(...con(t)).send(datos)
    expect(res.status).toBe(201)
    expect(res.body.negocio.slug).toBe('fritos-dona-ana')
    const nuevo = res.body.token
    await request(app).put('/api/negocio').set(...con(nuevo)).send({ ...datos, ciudad: 'Corozal' })
    expect((await request(app).get('/api/negocio').set(...con(nuevo))).body.ciudad).toBe('Corozal')
  })

  test('CA-5: cada usuario ve solo su negocio y los enlaces no se repiten', async () => {
    const t = await registrar('b@p.co')
    const { negocio, token } = (await request(app).post('/api/negocio').set(...con(t)).send(datos)).body
    expect(negocio.slug).toBe('fritos-dona-ana-2')
    expect((await request(app).get('/api/negocio').set(...con(token))).body.id).toBe(negocio.id)
  })

  test('CA-1: sin negocio configurado la API lo indica', async () => {
    const t = await registrar('c@p.co')
    const res = await request(app).get('/api/negocio').set(...con(t))
    expect(res.status).toBe(403)
    expect(res.body.error).toBe('Primero configura tu negocio')
  })
})
