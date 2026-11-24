import request from 'supertest'
import { describe, expect, test } from 'vitest'
import app from '../app.js'
import { firmarToken } from '../middleware/auth.js'
import { compararPronostico, resumir } from '../modules/panel/calcular.js'
import { hoy, sumarDias } from '../util/fechas.js'

const venta = (fecha, cantidad, extra = {}) => ({
  fecha, estado: 'registrada', origen: 'presencial', total: cantidad * 2500,
  items: [{ productoId: 'e', nombre: 'Empanada', cantidad, precioUnitario: 2500, costoUnitario: 1000 }], ...extra,
})
const datos = (cambios) => ({ ventas: [], compras: [], insumos: [], pedidos: [], movimientos: [], ...cambios })
const rango = { desde: '2026-06-08', hasta: '2026-06-10' }

describe('HU-19 cálculos del panel (unitarias)', () => {
  test('CA-1: ingresos, costo y ganancia real salen de las ventas', () => {
    const r = resumir(datos({ ventas: [venta('2026-06-08', 4), venta('2026-06-10', 6), venta('2026-06-09', 99, { estado: 'anulada' })] }), rango)
    expect(r).toMatchObject({ ingresos: 25000, costo: 10000, ganancia: 15000, unidades: 10, ventas: 2, ticket: 12500 })
    expect(r.margen).toBeCloseTo(0.6, 5)
  })

  test('CA-2: un día por fecha, incluso sin ventas', () => {
    const r = resumir(datos({ ventas: [venta('2026-06-08', 4)] }), rango)
    expect(r.porDia.map((d) => [d.fecha, d.ingresos])).toEqual([['2026-06-08', 10000], ['2026-06-09', 0], ['2026-06-10', 0]])
  })

  test('CA-3: compara con el periodo anterior de igual duración', () => {
    const r = resumir(datos({ ventas: [venta('2026-06-06', 5), venta('2026-06-08', 10)] }), rango)
    expect(r.cambio).toBe(1)
    expect(resumir(datos({}), rango).cambio).toBeNull()
  })

  test('CA-4: gasto en compras sin anuladas, desperdicio y valor del inventario', () => {
    const r = resumir(datos({
      compras: [{ fecha: '2026-06-09', valorTotal: 500 }, { fecha: '2026-06-09', valorTotal: 900, estado: 'anulada' }],
      movimientos: [{ fecha: '2026-06-09', tipo: 'desperdicio', cantidad: -2, precio: 100 }],
      insumos: [{ nombre: 'Sal', stock: 3, precio: 200, stockMinimo: 5 }, { nombre: 'Aceite', stock: 9, precio: 10, stockMinimo: 1 }],
    }), rango)
    expect(r).toMatchObject({ compras: 500, desperdicio: 200, inventario: 690 })
    expect(r.bajos.map((i) => i.nombre)).toEqual(['Sal'])
  })

  test('CA-5: productos más vendidos por ganancia y ventas por canal', () => {
    const r = resumir(datos({ ventas: [venta('2026-06-08', 4), venta('2026-06-09', 2, { origen: 'pedido_digital' })] }), rango)
    expect(r.productos[0]).toMatchObject({ nombre: 'Empanada', unidades: 6, ganancia: 9000 })
    expect(r.canales).toEqual({ presencial: 10000, pedido_digital: 5000 })
  })

  test('CA-6: cuenta los pedidos pendientes', () =>
    expect(resumir(datos({ pedidos: [{ estado: 'recibido' }, { estado: 'entregado' }, { estado: 'listo' }] }), rango).pendientes).toBe(2))

  test('CA-7: si una venta no tiene costo guardado, lo advierte', () => {
    const v = venta('2026-06-08', 1)
    delete v.items[0].costoUnitario
    expect(resumir(datos({ ventas: [v] }), rango).sinCosto).toBe(1)
  })

  test('CA-8: pronóstico contra lo real en los últimos 7 días cerrados', () => {
    const ventas = Array.from({ length: 28 }, (_, i) => venta(sumarDias('2026-06-01', i), 10))
    const r = compararPronostico(ventas, '2026-06-29')
    expect(r).toHaveLength(7)
    expect(r.at(-1)).toEqual({ fecha: '2026-06-28', pronostico: 10, real: 10 })
    expect(compararPronostico(ventas.slice(0, 5), '2026-06-29')).toEqual([])
  })
})

test('CA-9: la API responde con datos del negocio del token', async () => {
  const res = await request(app).get(`/api/panel?desde=${sumarDias(hoy(), -6)}&hasta=${hoy()}`)
    .set('Authorization', `Bearer ${firmarToken({ usuarioId: 'u', negocioId: 'n' })}`)
  expect(res.body.ingresos).toBe(0)
  expect(res.body.porDia).toHaveLength(7)
})
