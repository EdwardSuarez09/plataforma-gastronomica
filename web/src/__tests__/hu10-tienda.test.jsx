import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import App from '../App.jsx'
import { pedir } from '../services/apiClient.js'

vi.mock('../services/apiClient.js', () => ({ pedir: vi.fn(), listar: vi.fn(async () => []) }))

const negocio = { nombre: 'Fritos Ana', slug: 'fritos-ana', tipo: 'Fritos', ciudad: 'Sincelejo' }
const abrir = (ruta) => render(<MemoryRouter initialEntries={[ruta]}><App /></MemoryRouter>)

describe('HU-10 Tienda pública (funcionales)', () => {
  beforeEach(() => {
    pedir.mockReset()
  })

  test('CA-1: la lista de tiendas se ve sin iniciar sesión', async () => {
    pedir.mockResolvedValue([negocio])
    abrir('/tiendas')
    expect((await screen.findByRole('link', { name: /Fritos Ana/ })).getAttribute('href')).toBe('/tienda/fritos-ana')
  })

  test('CA-2: la tienda muestra su menú con precios', async () => {
    pedir.mockResolvedValue({ negocio, productos: [{ id: 'e', nombre: 'Empanada', precio: 2500 }] })
    abrir('/tienda/fritos-ana')
    expect(await screen.findByRole('heading', { name: 'Fritos Ana' })).toBeTruthy()
    expect(screen.getByText(/2\.500/)).toBeTruthy()
    expect(pedir).toHaveBeenCalledWith('/publico/fritos-ana/menu')
  })

  test('CA-4: si no existe, lo dice', async () => {
    pedir.mockRejectedValue(new Error('Esta tienda no existe'))
    abrir('/tienda/nada')
    expect(await screen.findByText('Esta tienda no existe')).toBeTruthy()
  })
})
