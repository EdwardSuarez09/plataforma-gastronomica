import request from 'supertest'
import { describe, expect, test } from 'vitest'
import app from '../app.js'
import { firmarToken } from '../middleware/auth.js'
import { costoMasaUnidad, costoProducto, costosDe, recetaPorUnidad } from '../modules/costos/calcular.js'

const insumos = [
  { id: 'harina', precio: 3000 }, { id: 'aceite', precio: 8000 }, { id: 'huevo', precio: 300 },
  { id: 'sal', precio: 2000 }, { id: 'papa', precio: 2000 }, { id: 'carne', precio: 12000 },
  { id: 'empaque', precio: 50 },
]
const masa = {
  id: 'm',
  ingredientes: [
    { insumoId: 'harina', cantidad: 10 }, { insumoId: 'aceite', cantidad: 2 },
    { insumoId: 'huevo', cantidad: 12 }, { insumoId: 'sal', cantidad: 0.5 },
  ],
  rendimiento: [{ productoId: 'p', unidades: 50 }, { productoId: 'otros', unidades: 360 }],
}
const papa = {
  id: 'p', nombre: 'Papa rellena', precio: 3500, masaId: 'm', activo: true,
  extras: [
    { insumoId: 'papa', cantidad: 0.1 }, { insumoId: 'carne', cantidad: 0.05 },
    { insumoId: 'aceite', cantidad: 0.1 }, { insumoId: 'empaque', cantidad: 1 },
  ],
}

describe('HU-08 Costo unitario y margen', () => {
  test('CA-1: reparte el lote de $50.600 entre sus 410 unidades', () =>
    expect(costoMasaUnidad(masa, insumos)).toBeCloseTo(50600 / 410, 5))

  test('CA-2 y CA-3: coincide con la versión Python de referencia', () => {
    const r = costoProducto(papa, [masa], insumos)
    expect(r.costo).toBeCloseTo(1773.41, 1)
    expect(r.ganancia).toBeCloseTo(1726.59, 1)
    expect(r.margen).toBeCloseTo(0.493, 2)
  })

  test('CA-4: si sube un insumo, sube el costo', () => {
    const caros = insumos.map((i) => ({ ...i, precio: i.precio * 1.1 }))
    expect(costoProducto(papa, [masa], caros).costo)
      .toBeCloseTo(costoProducto(papa, [masa], insumos).costo * 1.1, 5)
  })

  test('CA-5: avisa si la masa no tiene rendimiento para el producto', () => {
    expect(costoProducto(papa, [{ ...masa, rendimiento: [] }], insumos).sinRendimiento).toBe(true)
    expect(costoProducto(papa, [masa], insumos).sinRendimiento).toBe(false)
  })

  test('la receta por unidad explica exactamente el costo', () => {
    const total = recetaPorUnidad(papa, [masa])
      .reduce((s, r) => s + r.cantidad * insumos.find((i) => i.id === r.insumoId).precio, 0)
    expect(total).toBeCloseTo(costoProducto(papa, [masa], insumos).costo, 6)
  })

  test('solo incluye productos activos', () =>
    expect(costosDe([{ ...papa, activo: false }], [masa], insumos)).toEqual([]))

  test('la API responde para un negocio sin datos', async () => {
    const res = await request(app).get('/api/costos')
      .set('Authorization', `Bearer ${firmarToken({ usuarioId: 'u', negocioId: 'n' })}`)
    expect(res.body).toEqual([])
  })
})
