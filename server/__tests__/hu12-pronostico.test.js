import request from 'supertest'
import { describe, expect, test } from 'vitest'
import app from '../app.js'
import { firmarToken } from '../middleware/auth.js'
import { medirError, predecir, promedioPonderado, pronosticar, ventasPorDia } from '../modules/pronostico/calcular.js'
import { sumarDias } from '../util/fechas.js'

const INICIO = '2026-06-01' // lunes
const producto = { id: 'e', nombre: 'Empanada' }
const venta = (fecha, cantidad, estado = 'registrada') =>
  ({ fecha, estado, items: [{ productoId: 'e', cantidad }] })
// 28 días: 10 unidades entre semana y 30 los domingos.
const mes = Array.from({ length: 28 }, (_, i) => venta(sumarDias(INICIO, i), i % 7 === 6 ? 30 : 10))

describe('HU-12 Pronóstico de demanda', () => {
  test('CA-1: agrupa las ventas por día e ignora las anuladas', () => {
    const dias = ventasPorDia([venta(INICIO, 3), venta(INICIO, 2), venta(INICIO, 9, 'anulada')])
    expect(dias).toEqual({ [INICIO]: { e: 5 } })
  })

  test('CA-2: lo más reciente pesa más', () => {
    expect(promedioPonderado([20, 10])).toBeCloseTo(16.67, 1)
    expect(promedioPonderado([])).toBe(0)
  })

  test('CA-3: distingue el día de la semana', () => {
    const dias = ventasPorDia(mes)
    expect(predecir(dias, 'e', '2026-06-29')).toBe(10) // lunes
    expect(predecir(dias, 'e', '2026-07-05')).toBe(30) // domingo
  })

  test('CA-4: entrega los próximos 7 días por producto', () => {
    const r = pronosticar(mes, [producto], '2026-06-29')
    expect(r.suficiente).toBe(true)
    expect(r.dias[0]).toEqual({ fecha: '2026-06-30', nombre: 'Martes' })
    expect(r.productos[0].valores).toEqual([10, 10, 10, 10, 10, 30, 10])
  })

  test('CA-5: con menos de 14 días no pronostica y lo explica', () => {
    const r = pronosticar(mes.slice(0, 13), [producto], '2026-06-29')
    expect(r).toEqual({ suficiente: false, diasConDatos: 13, diasMinimos: 14 })
  })

  test('CA-8: una venta de hoy no cambia el pronóstico, porque el día no ha terminado', () => {
    const conHoy = [...mes, venta('2026-06-29', 1)]
    expect(pronosticar(conHoy, [producto], '2026-06-29')).toEqual(pronosticar(mes, [producto], '2026-06-29'))
  })

  test('CA-9: un producto nuevo no baja por los días en que aún no existía', () => {
    const dias = ventasPorDia([...mes, { fecha: '2026-06-22', estado: 'registrada', items: [{ productoId: 'n', cantidad: 12 }] }])
    expect(predecir(dias, 'n', '2026-06-29')).toBe(12)
  })

  test('CA-6: mide el error contra la última semana real', () => {
    expect(medirError(ventasPorDia(mes), ['e'])).toBe(0)
    const raro = mes.map((v, i) => (i >= 21 ? venta(v.fecha, v.items[0].cantidad * 2) : v))
    expect(medirError(ventasPorDia(raro), ['e'])).toBe(0.5)
  })

  test('CA-7: cada negocio usa solo sus ventas', async () => {
    const res = await request(app).get('/api/pronostico')
      .set('Authorization', `Bearer ${firmarToken({ usuarioId: 'u', negocioId: 'nuevo' })}`)
    expect(res.body.suficiente).toBe(false)
  })
})
