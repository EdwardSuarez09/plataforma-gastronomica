import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import App from '../App.jsx'
import modulo from '../modules/pedidos/index.jsx'
import { listar, pedir } from '../services/apiClient.js'

vi.mock('../services/apiClient.js', () => ({ pedir: vi.fn(), listar: vi.fn() }))

const menu = {
  negocio: { nombre: 'Fritos Ana' },
  productos: [
    { id: 'e', nombre: 'Empanada', precio: 2500, categoria: 'Empanadas' },
    { id: 'a', nombre: 'Arepa', precio: 1800, categoria: 'Arepas' },
  ],
}
const pedido = { codigo: 'ABC123', total: 5000, estado: 'listo', items: [{ productoId: 'e', nombre: 'Empanada', cantidad: 2 }] }
const abrir = (ruta) => render(<MemoryRouter initialEntries={[ruta]}><App /></MemoryRouter>)

describe('HU-27 Experiencia del cliente (funcionales)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    listar.mockResolvedValue([])
    pedir.mockImplementation(async (ruta, o) => {
      if (o?.metodo === 'POST') return { codigo: 'ABC123', total: 2500, estado: 'recibido' }
      return ruta.includes('/pedidos/') ? pedido : menu
    })
  })

  test('CA-1: el enlace de seguimiento muestra en qué paso va', async () => {
    abrir('/tienda/fritos-ana/pedido/ABC123')
    expect((await screen.findByText('Listo para recoger')).getAttribute('aria-current')).toBe('step')
  })

  test('CA-1: actualiza el seguimiento cada cinco segundos y detiene el sondeo al salir', async () => {
    vi.useFakeTimers()
    try {
      const { unmount } = abrir('/tienda/fritos-ana/pedido/ABC123')
      await act(async () => { await Promise.resolve() })
      expect(pedir).toHaveBeenCalledTimes(1)
      await act(async () => { await vi.advanceTimersByTimeAsync(5000) })
      expect(pedir).toHaveBeenCalledTimes(2)
      unmount()
      await act(async () => { await vi.advanceTimersByTimeAsync(10_000) })
      expect(pedir).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })

  test('CA-2: después de pedir, ofrece seguir el pedido', async () => {
    abrir('/tienda/fritos-ana')
    await userEvent.click(await screen.findByRole('button', { name: 'Agregar Empanada' }))
    await userEvent.type(screen.getByLabelText('Tu nombre'), 'Luis')
    await userEvent.type(screen.getByLabelText('Teléfono'), '3001234567')
    await userEvent.click(screen.getByRole('button', { name: 'Hacer pedido' }))
    expect((await screen.findByRole('link', { name: 'Seguir mi pedido' })).getAttribute('href')).toBe('/tienda/fritos-ana/pedido/ABC123')
  })

  test('CA-3: busca y filtra por categoría', async () => {
    abrir('/tienda/fritos-ana')
    await screen.findByText('Empanada')
    await userEvent.click(screen.getByRole('button', { name: 'Arepas' }))
    expect(screen.queryByText('Empanada')).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Todo' }))
    await userEvent.type(screen.getByLabelText('Buscar'), 'empa')
    expect(screen.queryByText('Arepa')).toBeNull()
  })

  test('CA-4: una barra fija resume el pedido', async () => {
    abrir('/tienda/fritos-ana')
    await userEvent.click(await screen.findByRole('button', { name: 'Agregar Empanada' }))
    expect(screen.getByRole('link', { name: /Ver pedido \(1\)/ })).toBeTruthy()
  })

  test('CA-5: el negocio ve los pedidos por columnas y sin los terminados', async () => {
    const base = { total: 1, cliente: { nombre: 'L', telefono: '3001234567' }, items: [], creadoEn: '1' }
    listar.mockResolvedValue([
      { ...base, id: '1', codigo: 'AAA', estado: 'recibido', creadoEn: '2026-01-01' },
      { ...base, id: '2', codigo: 'CCC', estado: 'recibido', creadoEn: '2026-01-02' },
      { ...base, id: '3', codigo: 'BBB', estado: 'entregado', creadoEn: '2026-01-03' },
    ])
    render(<MemoryRouter><modulo.Componente /></MemoryRouter>)
    const heading = await screen.findByRole('heading', { name: 'Recibidos (2)' })
    const received = within(heading.parentElement).getAllByRole('article')
    expect(received.map((card) => card.textContent.match(/[ABC]{3}/)[0])).toEqual(['AAA', 'CCC'])
    expect(screen.queryByText('BBB')).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Ver terminados (1)' }))
    expect(screen.getByText('BBB')).toBeTruthy()
  })
})
