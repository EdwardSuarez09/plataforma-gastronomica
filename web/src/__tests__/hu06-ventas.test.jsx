import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { hoy } from '../components/ui.jsx'
import modulo from '../modules/ventas/index.jsx'
import { crear, listar, pedir } from '../services/apiClient.js'

vi.mock('../services/apiClient.js', () => ({ listar: vi.fn(), crear: vi.fn(), pedir: vi.fn() }))

const datos = {
  productos: [
    { id: 'e', nombre: 'Empanada', precio: 2500, activo: true },
    { id: 'p', nombre: 'Papa', precio: 3500, activo: true },
    { id: 'x', nombre: 'Viejo', precio: 100, activo: false },
  ],
  ventas: [{ id: 'v', fecha: hoy(), estado: 'registrada', origen: 'presencial', total: 2500, items: [{ nombre: 'Empanada', cantidad: 1 }] }],
}
const abrir = () => render(<MemoryRouter><modulo.Componente /></MemoryRouter>)
const tocar = async (nombre) => userEvent.click(await screen.findByRole('button', { name: nombre }))

describe('HU-06 y HU-23 Venta rápida (funcionales)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listar.mockImplementation(async (c) => datos[c])
    crear.mockResolvedValue({})
  })

  test('HU-06 CA-5: los productos desactivados no aparecen', async () => {
    abrir()
    await screen.findByRole('button', { name: /^Empanada/ })
    expect(screen.queryByText(/Viejo/)).toBeNull()
  })

  test('HU-23 CA-1: tocar dos veces suma dos unidades y se ve el total', async () => {
    abrir()
    await tocar(/^Empanada/)
    await tocar(/^Empanada/)
    await tocar(/^Papa/)
    expect(screen.getByText(/8\.500/)).toBeTruthy()
    await tocar('Cobrar')
    expect(crear).toHaveBeenCalledWith('ventas', {
      fecha: hoy(), metodoPago: 'efectivo',
      items: [{ productoId: 'e', cantidad: 2 }, { productoId: 'p', cantidad: 1 }],
    })
  })

  test('HU-23 CA-2: se puede quitar una unidad antes de cobrar', async () => {
    abrir()
    await tocar(/^Empanada/)
    await tocar('Quitar Empanada')
    expect(screen.queryByRole('button', { name: 'Cobrar' })).toBeNull()
  })

  test('HU-23 CA-4: calcula las vueltas en efectivo', async () => {
    abrir()
    await tocar(/^Empanada/)
    await userEvent.type(screen.getByLabelText('Paga con'), '10000')
    expect(screen.getByText(/Vueltas/).textContent).toMatch(/7\.500/)
  })

  test('HU-06 CA-7: anular pide confirmación', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true))
    abrir()
    await tocar('Anular')
    expect(window.confirm).toHaveBeenCalled()
    expect(pedir).toHaveBeenCalledWith('/ventas/v/anular', { metodo: 'POST' })
  })
})
