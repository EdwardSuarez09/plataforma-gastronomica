import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, test, vi } from 'vitest'
import modulo from '../modules/costos/index.jsx'
import { listar } from '../services/apiClient.js'

vi.mock('../services/apiClient.js', () => ({ listar: vi.fn() }))

test('HU-08 CA-3 y CA-5: muestra costo y margen, y avisa si falta el rendimiento', async () => {
  listar.mockResolvedValue([
    { productoId: 'a', nombre: 'Papa', costo: 1773, precio: 3500, ganancia: 1727, margen: 0.493, sinRendimiento: false },
    { productoId: 'b', nombre: 'Arepa', costo: 900, precio: 1800, ganancia: 900, margen: 0.5, sinRendimiento: true },
  ])
  render(<MemoryRouter><modulo.Componente /></MemoryRouter>)
  expect(await screen.findByText('49 %')).toBeTruthy()
  expect(screen.getByText(/1\.773/)).toBeTruthy()
  expect(screen.getAllByText(/Falta su rendimiento/)).toHaveLength(1)
})
