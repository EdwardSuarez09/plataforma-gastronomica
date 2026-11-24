import { describe, expect, test } from 'vitest'
import { listaCompras, planSemanal, presupuestoSugerido } from '../modules/optimizacion/modelo.js'

const datos = {
  pronostico: {
    dias: [{ fecha: '2026-06-29', nombre: 'Lunes' }, { fecha: '2026-06-30', nombre: 'Martes' }],
    productos: [{ productoId: 'a', valores: [10, 20] }, { productoId: 'b', valores: [10, 10] }],
  },
  costos: [{ productoId: 'a', costo: 1000, precio: 2000 }, { productoId: 'b', costo: 1000, precio: 1500 }],
  recetas: { a: [{ insumoId: 'h', cantidad: 2 }], b: [{ insumoId: 'h', cantidad: 1 }] },
  presupuesto: 1_000_000,
  factorMin: 0.5,
  factorMax: 1,
}
const insumos = [{ id: 'h', nombre: 'Harina', unidad: 'kg', precio: 500, stock: 30 }, { id: 'z', nombre: 'Sal', stock: 5 }]

describe('HU-20 Plan conectado con el inventario', () => {
  test('CA-1: dice qué comprar, cuánto y cuánto cuesta', () => {
    // a: 30 unidades × 2 + b: 20 × 1 = 80 kg; hay 30.
    const plan = planSemanal(datos)
    expect(listaCompras(plan, datos.recetas, insumos)).toEqual([
      { insumoId: 'h', nombre: 'Harina', unidad: 'kg', necesario: 80, stock: 30, comprar: 50, costo: 25000 },
    ])
  })

  test('CA-2: un stock negativo cuenta como cero', () => {
    const plan = planSemanal(datos)
    expect(listaCompras(plan, datos.recetas, [{ ...insumos[0], stock: -4 }])[0].comprar).toBe(80)
  })

  test('CA-3: con "solo lo que tengo" el consumo nunca supera el stock', () => {
    const plan = planSemanal({ ...datos, stock: { h: 30 } })
    const usado = plan.dias.reduce((t, d) => t + d.cantidades.a * 2 + d.cantidades.b, 0)
    expect(plan.factible).toBe(true)
    expect(usado).toBeLessThanOrEqual(30)
    // Por kg de harina, a gana 500 y b gana 500: cualquier reparto óptimo gana lo mismo.
    expect(plan.ganancia).toBe(15000)
  })

  test('CA-3: sin stock no se puede producir', () => {
    const plan = planSemanal({ ...datos, stock: { h: 0 } })
    expect(plan.ganancia).toBe(0)
  })

  test('CA-4: sugiere el presupuesto que cubre el día de mayor demanda', () =>
    expect(presupuestoSugerido(datos.pronostico, datos.costos)).toBe(30000))
})
