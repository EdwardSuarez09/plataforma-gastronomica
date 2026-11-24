import request from 'supertest'
import { describe, expect, test } from 'vitest'
import app from '../app.js'
import { firmarToken } from '../middleware/auth.js'
import { compararEscenarios, optimizarDia, planSemanal } from '../modules/optimizacion/modelo.js'

const a = { id: 'a', costo: 1000, ganancia: 1000, min: 5, max: 20 }
const b = { id: 'b', costo: 1000, ganancia: 500, min: 5, max: 20 }

const datos = {
  pronostico: {
    dias: [{ fecha: '2026-06-29', nombre: 'Lunes' }, { fecha: '2026-06-30', nombre: 'Martes' }],
    productos: [{ productoId: 'a', valores: [10, 20] }, { productoId: 'b', valores: [10, 10] }],
  },
  costos: [{ productoId: 'a', costo: 1000, precio: 2000 }, { productoId: 'b', costo: 1000, precio: 1500 }],
  presupuesto: 20000,
  factorMin: 0.5,
  factorMax: 1.5,
}

describe('HU-13 Optimización de la producción', () => {
  test('CA-1: prefiere el producto más rentable y respeta el presupuesto', () => {
    const r = optimizarDia([a, b], 20000)
    expect(r.cantidades).toEqual({ a: 15, b: 5 })
    expect(r).toMatchObject({ factible: true, costo: 20000, ganancia: 17500 })
  })

  test('CA-2: ningún producto supera su demanda máxima', () => {
    const r = optimizarDia([a, b], 1_000_000)
    expect(r.cantidades).toEqual({ a: 20, b: 20 })
  })

  test('CA-3: si el presupuesto no cubre lo mínimo, dice cuánto falta', () =>
    expect(optimizarDia([a, b], 6000)).toEqual({ factible: false, faltante: 4000 }))

  test('coincide con la solución óptima conocida de tres productos', () => {
    const c = { id: 'c', costo: 500, ganancia: 400, min: 0, max: 10 }
    // margen/costo: a=1, c=0.8, b=0.5 → a al máximo, luego c y al final b.
    const r = optimizarDia([a, b, c], 30000)
    expect(r.cantidades).toEqual({ a: 20, b: 5, c: 10 })
    expect(r.ganancia).toBe(20 * 1000 + 5 * 500 + 10 * 400)
  })

  test('CA-4: arma el plan de cada día a partir del pronóstico', () => {
    const r = planSemanal(datos)
    expect(r.factible).toBe(true)
    expect(r.dias[0].cantidades).toEqual({ a: 15, b: 5 })
    expect(r.dias[1].cantidades).toEqual({ a: 15, b: 5 })
    expect(r.ganancia).toBe(35000)
  })

  test('CA-5: si suben los costos baja la ganancia', () => {
    const [optimista, realista, pesimista] = compararEscenarios(datos, 0.1)
    expect(optimista.ganancia).toBeGreaterThan(realista.ganancia)
    expect(realista.ganancia).toBeGreaterThan(pesimista.ganancia)
  })

  test('CA-6: sin ventas suficientes la API explica qué falta', async () => {
    const res = await request(app).post('/api/produccion/optimizar')
      .set('Authorization', `Bearer ${firmarToken({ usuarioId: 'u', negocioId: 'nuevo' })}`)
      .send({ presupuesto: 100000 })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/Faltan ventas/)
  })
})
