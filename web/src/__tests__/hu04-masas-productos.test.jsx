import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import pantallas from '../modules/masas/index.jsx'
import productos from '../modules/productos/index.jsx'
import { crear, editar, listar } from '../services/apiClient.js'

vi.mock('../services/apiClient.js', () => ({
  listar: vi.fn(), crear: vi.fn(), editar: vi.fn(), eliminar: vi.fn(), pedir: vi.fn(),
}))

const insumo = { id: 'h', nombre: 'Harina', unidad: 'kg', precio: 3000 }
const masa = { id: 'm', nombre: 'Masa base', tipo: 'tradicional', ingredientes: [{ insumoId: 'h', cantidad: 10 }], costoLote: 30000 }
const producto = { id: 'p', nombre: 'Empanada', precio: 2500, masaId: 'm', extras: [], activo: true }
const abrir = (Componente) => render(<MemoryRouter><Componente /></MemoryRouter>)
const [masas, rendimiento] = pantallas.map((p) => p.Componente)
let datos

describe('HU-04 Masas y productos (funcionales)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    datos = { insumos: [insumo], masas: [masa], productos: [producto] }
    listar.mockImplementation(async (c) => datos[c])
  })

  test('CA-6: sin insumos avisa y ofrece ir a crearlos', async () => {
    datos.insumos = []
    abrir(masas)
    expect(await screen.findByText(/Primero registra insumos/)).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Ir a insumos' })).toBeTruthy()
  })

  test('CA-2: la lista muestra el costo del lote', async () => {
    abrir(masas)
    expect((await screen.findByText(/30\.000/)).tagName).toBe('TD')
  })

  test('CA-1: crea una masa con sus ingredientes', async () => {
    abrir(masas)
    await userEvent.type(await screen.findByLabelText('Nombre'), 'Nueva')
    await userEvent.selectOptions(screen.getByLabelText('Insumo'), 'h')
    await userEvent.type(screen.getByLabelText('Cantidad'), '4')
    await userEvent.click(screen.getByRole('button', { name: 'Crear masa' }))
    expect(crear).toHaveBeenCalledWith('masas', {
      nombre: 'Nueva', tipo: 'tradicional', ingredientes: [{ insumoId: 'h', cantidad: 4 }],
    })
  })

  test('CA-4: el rendimiento muestra los productos de la masa elegida', async () => {
    abrir(rendimiento)
    await userEvent.selectOptions(await screen.findByLabelText('Masa'), 'm')
    expect(screen.getByLabelText('Unidades de Empanada')).toBeTruthy()
  })

  test('CA-8: un producto se puede desactivar', async () => {
    abrir(productos.Componente)
    await userEvent.click(await screen.findByRole('button', { name: 'Desactivar' }))
    expect(editar).toHaveBeenCalledWith('productos', 'p', { activo: false })
  })
})
