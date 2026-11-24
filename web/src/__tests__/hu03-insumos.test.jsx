import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import modulo from '../modules/insumos/index.jsx'
import { crear, eliminar, listar } from '../services/apiClient.js'

vi.mock('../services/apiClient.js', () => ({ listar: vi.fn(), crear: vi.fn(), editar: vi.fn(), eliminar: vi.fn() }))

const lista = [
  { id: '1', nombre: 'Harina', unidad: 'kg', precio: 3000, stock: 5 },
  { id: '2', nombre: 'Aceite', unidad: 'L', precio: 8000, stock: 2 },
]
const abrir = () => render(<MemoryRouter><modulo.Componente /></MemoryRouter>)

describe('HU-03 Insumos (funcionales)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listar.mockResolvedValue(lista)
  })

  test('CA-5: la búsqueda muestra solo coincidencias', async () => {
    abrir()
    expect(await screen.findByText('Harina')).toBeTruthy()
    await userEvent.type(screen.getByLabelText('Buscar'), 'ace')
    expect(screen.queryByText('Harina')).toBeNull()
    expect(screen.getByText('Aceite')).toBeTruthy()
  })

  test('CA-1: agrega un insumo con stock 0 por defecto', async () => {
    abrir()
    await userEvent.type(screen.getByLabelText('Nombre'), 'Sal')
    await userEvent.type(screen.getByLabelText('Precio por unidad'), '2000')
    await userEvent.click(screen.getByRole('button', { name: 'Agregar insumo' }))
    expect(crear).toHaveBeenCalledWith('insumos', { nombre: 'Sal', unidad: 'kg', precio: 2000, stock: 0 })
  })

  test('CA-2 y CA-3: muestra el error que devuelve la validación', async () => {
    crear.mockRejectedValue(new Error('El precio debe ser un número mayor que 0'))
    abrir()
    await userEvent.click(screen.getByRole('button', { name: 'Agregar insumo' }))
    expect((await screen.findByRole('alert')).textContent).toMatch(/mayor que 0/)
  })

  test('CA-6: pide confirmación y avisa si el insumo está en uso', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true))
    eliminar.mockRejectedValue(new Error('No se puede eliminar: el insumo está en uso'))
    abrir()
    await screen.findByText('Harina')
    await userEvent.click(screen.getAllByRole('button', { name: 'Eliminar' })[0])
    expect(window.confirm).toHaveBeenCalled()
    expect((await screen.findByRole('alert')).textContent).toMatch(/en uso/)
  })
})
