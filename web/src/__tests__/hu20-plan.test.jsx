import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { expect, test, vi } from 'vitest'
import modulo from '../modules/optimizacion/index.jsx'
import { pedir } from '../services/apiClient.js'

vi.mock('../services/apiClient.js', () => ({ pedir: vi.fn() }))

test('CA-1, CA-3 y CA-4: presupuesto sugerido, solo con lo que tengo y lista de compras', async () => {
  pedir.mockImplementation(async (ruta) => (ruta === '/produccion/sugerencia' ? { presupuesto: 345000 } : {
    productos: [], plan: { dias: [], ganancia: 1, costo: 1 }, escenarios: [], excluidos: ['Panzerotti'],
    compras: [{ insumoId: 'h', nombre: 'Harina', unidad: 'kg', necesario: 80, stock: 30, comprar: 50, costo: 25000 }],
  }))
  render(<MemoryRouter><modulo.Componente /></MemoryRouter>)
  expect(await screen.findByDisplayValue('345000')).toBeTruthy()
  await userEvent.click(screen.getByLabelText('Producir solo con lo que tengo'))
  await userEvent.click(screen.getByRole('button', { name: 'Calcular plan' }))
  expect((await screen.findByRole('link', { name: 'Comprar Harina' })).getAttribute('href')).toBe('/compras?insumo=h&cantidad=50')
  expect(screen.getByText(/Panzerotti/)).toBeTruthy()
  expect(pedir.mock.calls.at(-1)[1].datos).toMatchObject({ soloStock: true, presupuesto: 345000 })
})
