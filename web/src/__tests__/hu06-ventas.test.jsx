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
const agregar = async (id, cantidad) => {
  await userEvent.selectOptions(await screen.findByLabelText('Producto'), id)
  if (cantidad) await userEvent.type(screen.getByLabelText('Cantidad'), cantidad)
  await userEvent.click(screen.getByRole('button', { name: 'Agregar' }))
}

describe('HU-06 Ventas (funcionales)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listar.mockImplementation(async (c) => datos[c])
  })

  test('CA-5: los productos desactivados no aparecen', async () => {
    abrir()
    await screen.findByLabelText('Producto')
    expect(screen.queryByText(/Viejo/)).toBeNull()
  })

  test('CA-2: varios productos en una venta y total calculado', async () => {
    abrir()
    await agregar('e', '2')
    await agregar('p', '1')
    expect(screen.getByText(/8\.500/)).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: 'Registrar venta' }))
    expect(crear).toHaveBeenCalledWith('ventas', {
      fecha: hoy(), items: [{ productoId: 'e', cantidad: 2 }, { productoId: 'p', cantidad: 1 }],
    })
  })

  test('CA-6: cantidad vacía muestra el error y no se agrega', async () => {
    abrir()
    await agregar('e')
    expect(screen.getByRole('alert').textContent).toMatch(/entero mayor que 0/)
    expect(screen.queryByRole('button', { name: 'Registrar venta' })).toBeNull()
  })

  test('CA-7: anular pide confirmación', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true))
    abrir()
    await userEvent.click(await screen.findByRole('button', { name: 'Anular' }))
    expect(window.confirm).toHaveBeenCalled()
    expect(pedir).toHaveBeenCalledWith('/ventas/v/anular', { metodo: 'POST' })
  })
})
