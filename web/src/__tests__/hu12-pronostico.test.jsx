import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import modulo from '../modules/pronostico/index.jsx'
import { listar } from '../services/apiClient.js'

vi.mock('../services/apiClient.js', () => ({ listar: vi.fn() }))
const abrir = () => render(<MemoryRouter><modulo.Componente /></MemoryRouter>)

describe('HU-12 Pronóstico (funcionales)', () => {
  beforeEach(() => vi.clearAllMocks())

  test('CA-5: sin datos suficientes explica cuánto falta', async () => {
    listar.mockResolvedValue({ suficiente: false, diasConDatos: 3, diasMinimos: 14 })
    abrir()
    expect(await screen.findByText(/14 días con ventas.*llevas 3/)).toBeTruthy()
  })

  test('CA-4 y CA-6: muestra el pronóstico y su error', async () => {
    listar.mockResolvedValue({
      suficiente: true, diasConDatos: 28, diasMinimos: 14, error: 0.12,
      dias: [{ fecha: '2026-06-29', nombre: 'Lunes' }],
      productos: [{ productoId: 'e', nombre: 'Empanada', valores: [37] }],
    })
    abrir()
    expect(await screen.findByText('12 %')).toBeTruthy()
    expect(screen.getByRole('img', { name: 'Lunes: 37' })).toBeTruthy()
  })
})
