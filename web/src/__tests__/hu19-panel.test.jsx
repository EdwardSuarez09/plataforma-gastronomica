import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import modulo from '../modules/inicio/index.jsx'
import { listar } from '../services/apiClient.js'

vi.mock('../services/apiClient.js', () => ({ listar: vi.fn(), pedir: vi.fn() }))

const panel = {
  ingresos: 50000, costo: 20000, ganancia: 30000, margen: 0.6, unidades: 20, ventas: 4, ticket: 12500, cambio: 0.25, sinCosto: 2,
  compras: 18000, desperdicio: 700, inventario: 90000, pendientes: 3,
  bajos: [{ id: 'h', nombre: 'Harina', unidad: 'kg', stock: 2, stockMinimo: 5 }],
  porDia: [{ fecha: '2026-06-01', ingresos: 50000, ganancia: 30000 }],
  productos: [{ productoId: 'e', nombre: 'Empanada', unidades: 20, ingresos: 50000, ganancia: 30000 }],
  canales: { presencial: 35000, pedido_digital: 15000 },
  comparacion: [{ fecha: '2026-06-01', pronostico: 18, real: 20 }],
}
const abrir = () => render(<MemoryRouter><modulo.Componente /></MemoryRouter>)

describe('HU-19 Panel (funcionales)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listar.mockResolvedValue(panel)
  })

  test('CA-1 y CA-3: muestra la ganancia real y el cambio frente al periodo anterior', async () => {
    abrir()
    expect((await screen.findByText('Ganancia')).parentElement.textContent).toMatch(/30\.000/)
    expect(screen.getByText(/25 % frente al periodo anterior/)).toBeTruthy()
  })

  test('CA-4: el insumo bajo lleva a comprarlo', async () => {
    abrir()
    expect((await screen.findByRole('link', { name: /Harina/ })).getAttribute('href')).toBe('/compras?insumo=h')
  })

  test('CA-7: advierte las ventas sin costo guardado', async () => {
    abrir()
    expect(await screen.findByText(/2 líneas.*sin costo/)).toBeTruthy()
  })

  test('CA-10: cambiar el periodo vuelve a consultar', async () => {
    abrir()
    await screen.findByText('Ganancia')
    await userEvent.click(screen.getByRole('button', { name: '30 días' }))
    expect(listar.mock.calls.length).toBeGreaterThan(1)
    expect(listar.mock.calls.at(-1)[0]).not.toBe(listar.mock.calls[0][0])
  })
})
