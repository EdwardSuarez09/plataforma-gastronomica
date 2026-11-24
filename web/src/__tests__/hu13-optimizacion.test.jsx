import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import modulo from '../modules/optimizacion/index.jsx'
import { pedir } from '../services/apiClient.js'

vi.mock('../services/apiClient.js', () => ({ pedir: vi.fn() }))

const calcular = async () => {
  render(<MemoryRouter><modulo.Componente /></MemoryRouter>)
  await userEvent.click(screen.getByRole('button', { name: 'Calcular plan' }))
}

describe('HU-13 Plan de producción (funcionales)', () => {
  beforeEach(() => vi.resetAllMocks())

  test('CA-3, CA-4 y CA-5: muestra el plan, los días inviables y los escenarios', async () => {
    pedir.mockImplementation(async (ruta) => ruta === '/produccion/sugerencia' ? {} : ({
      productos: [{ productoId: 'e', nombre: 'Empanada' }],
      plan: {
        ganancia: 70000, costo: 50000, factible: false,
        dias: [
          { fecha: '2026-06-29', nombre: 'Lunes', factible: true, cantidades: { e: 42 }, costo: 50000, ganancia: 70000 },
          { fecha: '2026-06-30', nombre: 'Martes', factible: false, faltante: 4000 },
        ],
      },
      escenarios: [{ nombre: 'Pesimista', variacionCosto: 0.1, factible: true, ganancia: 61000 }],
    }))
    await calcular()
    expect(await screen.findByText('42')).toBeTruthy()
    expect(screen.getByRole('alert').textContent).toMatch(/Martes.*4\.000/)
    expect(screen.getByText(/61\.000/)).toBeTruthy()
    expect(pedir.mock.calls.at(-1)[1].datos).toMatchObject({ presupuesto: 300000, factorMin: 0.5, factorMax: 1.2, variacion: 0.1 })
  })

  test('CA-6: muestra por qué no se puede calcular', async () => {
    pedir.mockRejectedValue(new Error('Faltan ventas: hay 3 días y se necesitan 14'))
    await calcular()
    expect((await screen.findByRole('alert')).textContent).toMatch(/Faltan ventas/)
  })
})
