import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { filtrarVentas, totales } from '../modules/historial/filtrar.js'
import modulo from '../modules/historial/index.jsx'
import { listar } from '../services/apiClient.js'

vi.mock('../services/apiClient.js', () => ({ listar: vi.fn() }))

const item = (productoId, cantidad, precioUnitario) => ({ productoId, nombre: productoId, cantidad, precioUnitario })
const ventas = [
  { id: '1', fecha: '2026-06-01', estado: 'registrada', items: [item('empanada', 2, 2500), item('papa', 1, 3500)] },
  { id: '2', fecha: '2026-06-03', estado: 'registrada', items: [item('empanada', 4, 2500)] },
  { id: '3', fecha: '2026-06-02', estado: 'registrada', items: [item('papa', 3, 3500)] },
  { id: '4', fecha: '2026-06-02', estado: 'anulada', items: [item('papa', 99, 3500)] },
]
const fechas = (filtro) => filtrarVentas(ventas, filtro).map((l) => l.fecha)

describe('HU-07 filtros y totales (unitarias)', () => {
  test('CA-1: sin filtros, de la más reciente a la más antigua y sin anuladas', () =>
    expect(fechas()).toEqual(['2026-06-03', '2026-06-02', '2026-06-01', '2026-06-01']))

  test('CA-2: el rango de fechas es inclusive', () =>
    expect(fechas({ desde: '2026-06-01', hasta: '2026-06-02' })).toEqual(['2026-06-02', '2026-06-01', '2026-06-01']))

  test('CA-3: filtra por producto', () =>
    expect(filtrarVentas(ventas, { productoId: 'papa' }).map((l) => l.cantidad)).toEqual([3, 1]))

  test('CA-4: combina fecha y producto', () =>
    expect(filtrarVentas(ventas, { desde: '2026-06-02', productoId: 'papa' })).toHaveLength(1))

  test('CA-5: suma unidades y dinero', () =>
    expect(totales(filtrarVentas(ventas))).toEqual({ unidades: 10, dinero: 29000 }))
})

describe('HU-07 Historial (funcionales)', () => {
  beforeEach(() => {
    listar.mockImplementation(async (c) => (c === 'ventas' ? ventas : [{ id: 'papa', nombre: 'Papa rellena' }]))
  })

  test('CA-5 y CA-6: muestra totales y avisa si no hay resultados', async () => {
    render(<MemoryRouter><modulo.Componente /></MemoryRouter>)
    expect(await screen.findByText(/29\.000/)).toBeTruthy()
    await userEvent.type(screen.getByLabelText('Desde'), '2026-07-01')
    expect(await screen.findByText('No hay ventas para los filtros seleccionados')).toBeTruthy()
  })
})
