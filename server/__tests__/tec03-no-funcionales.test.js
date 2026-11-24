import request from 'supertest'
import { beforeAll, describe, expect, test } from 'vitest'
import app from '../app.js'
import { firmarToken } from '../middleware/auth.js'
import * as repo from '../modules/persistencia/repo.js'
import { hoy, sumarDias } from '../util/fechas.js'

const auth = ['Authorization', `Bearer ${firmarToken({ usuarioId: 'u', negocioId: 'n1' })}`]
const medir = async (ruta) => {
  const inicio = performance.now()
  const res = await request(app).get(ruta).set(...auth)
  expect(res.status).toBe(200)
  return performance.now() - inicio
}

describe('Rendimiento con un año de operación (2.000 ventas)', () => {
  beforeAll(() => repo.transaccion(async () => {
    await repo.crear('n1', 'productos', { nombre: 'Empanada', precio: 2500, activo: true })
    for (let i = 0; i < 2000; i++) {
      await repo.crear('n1', 'ventas', {
        fecha: sumarDias(hoy(), -(i % 365)), estado: 'registrada', origen: 'presencial',
        items: [{ productoId: 'p', nombre: 'Empanada', cantidad: 2, precioUnitario: 2500, costoUnitario: 900 }],
      })
    }
  }))

  test.each(['/api/panel', '/api/pronostico', '/api/ventas', '/api/costos'])('%s responde en menos de 1 segundo', async (ruta) =>
    expect(await medir(ruta)).toBeLessThan(1000))
})

describe('Recuperación', () => {
  test('la copia de seguridad permite reconstruir los datos', async () => {
    const copia = (await request(app).get('/api/respaldo').set(...auth)).body
    expect(copia.ventas).toHaveLength(2000)
    expect(copia).toHaveProperty('movimientos')
    expect(copia).toHaveProperty('negocio')
  })

  test('los datos sobreviven a un reinicio', async () => {
    repo.cerrar()
    expect(await repo.listar('n1', 'ventas')).toHaveLength(2000)
  })
})

describe('Seguridad', () => {
  test.each(['/api/panel', '/api/ventas', '/api/inventario', '/api/costos', '/api/pronostico', '/api/respaldo', '/api/eventos'])(
    '%s exige sesión', async (ruta) => expect((await request(app).get(ruta)).status).toBe(401))

  test('un texto malicioso se guarda como texto y no daña la base', async () => {
    const nombre = "'); DROP TABLE registros; --"
    await repo.crear('n9', 'insumos', { nombre })
    expect((await repo.listar('n9', 'insumos'))[0].nombre).toBe(nombre)
  })
})
