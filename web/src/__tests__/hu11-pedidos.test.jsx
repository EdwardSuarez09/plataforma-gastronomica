import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import App from '../App.jsx'
import modulo from '../modules/pedidos/index.jsx'
import { listar, pedir } from '../services/apiClient.js'

vi.mock('../services/apiClient.js', () => ({ pedir: vi.fn(), listar: vi.fn() }))

const menu = { negocio: { nombre: 'Fritos Ana' }, productos: [{ id: 'e', nombre: 'Empanada', precio: 2500 }] }
const abrirTienda = () => render(<MemoryRouter initialEntries={['/tienda/fritos-ana']}><App /></MemoryRouter>)

describe('HU-11 Pedidos (funcionales)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    pedir.mockImplementation(async (ruta, o) =>
      (o?.metodo === 'POST' ? { codigo: 'ABC123', total: 5000, estado: 'recibido' } : menu))
  })

  test('CA-1 y CA-2: el cliente arma el carrito y hace el pedido', async () => {
    abrirTienda()
    const agregar = await screen.findByRole('button', { name: 'Agregar Empanada' })
    await userEvent.click(agregar)
    await userEvent.click(agregar)
    await userEvent.type(screen.getByLabelText('Tu nombre'), 'Luis')
    await userEvent.type(screen.getByLabelText('Teléfono'), '3001234567')
    await userEvent.click(screen.getByRole('button', { name: 'Hacer pedido' }))
    expect(await screen.findByText('Pedido ABC123')).toBeTruthy()
    expect(pedir).toHaveBeenCalledWith('/publico/fritos-ana/pedidos', {
      metodo: 'POST',
      datos: { cliente: { nombre: 'Luis', telefono: '3001234567' }, items: [{ productoId: 'e', cantidad: 2 }], nota: '' },
    })
  })

  test('quitar el último producto cierra el carrito', async () => {
    abrirTienda()
    await userEvent.click(await screen.findByRole('button', { name: 'Agregar Empanada' }))
    await userEvent.click(screen.getByRole('button', { name: 'Quitar Empanada' }))
    expect(screen.queryByRole('form', { name: 'Carrito' })).toBeNull()
  })

  test('CA-4: el negocio solo ve las acciones válidas del estado', async () => {
    listar.mockResolvedValue([{
      id: '1', codigo: 'X', estado: 'recibido', creadoEn: '2026', total: 1, cliente: { nombre: 'L' }, items: [],
    }])
    render(<MemoryRouter><modulo.Componente /></MemoryRouter>)
    await userEvent.click(await screen.findByRole('button', { name: 'Confirmar' }))
    expect(pedir).toHaveBeenCalledWith('/pedidos/1/estado', { metodo: 'PATCH', datos: { estado: 'confirmado', motivo: undefined } })
    expect(screen.queryByRole('button', { name: 'Entregar' })).toBeNull()
  })
})
