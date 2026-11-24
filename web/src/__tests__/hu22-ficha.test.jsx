import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { estimar } from '../modules/productos/estimar.js'
import modulo from '../modules/productos/index.jsx'
import { crear, listar } from '../services/apiClient.js'

vi.mock('../services/apiClient.js', () => ({ listar: vi.fn(), crear: vi.fn(), editar: vi.fn() }))

const insumos = [{ id: 'h', nombre: 'Harina', unidad: 'kg', precio: 3000 }, { id: 'q', nombre: 'Queso', unidad: 'lb', precio: 10000 }]
const masas = [{ id: 'm', nombre: 'Base', costoLote: 30000, ingredientes: [], rendimiento: [{ productoId: 'otro', unidades: 50 }] }]

describe('HU-22 costo estimado (unitarias)', () => {
  const form = { precio: '1000', masaId: 'm', unidadesPorLote: '50', extras: [{ insumoId: 'q', cantidad: '0.01' }] }

  test('CA-4: reparte el lote entre todos los productos de la masa y suma extras', () =>
    expect(estimar(form, masas, insumos)).toEqual({ costo: 400, margen: 0.6, sugerido: 800 }))

  test('CA-4: sin masa o sin unidades no inventa un costo', () => {
    expect(estimar({ ...form, masaId: '' }, masas, insumos)).toBeNull()
    expect(estimar({ ...form, unidadesPorLote: '' }, masas, insumos)).toBeNull()
  })
})

describe('HU-22 Ficha (funcionales)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listar.mockImplementation(async (c) => ({ insumos, masas, productos: [] })[c])
  })

  test('CA-1 y CA-4: muestra el costo mientras se escribe y guarda todo junto', async () => {
    render(<MemoryRouter><modulo.Componente /></MemoryRouter>)
    await userEvent.type(await screen.findByLabelText('Nombre'), 'Arepa')
    await userEvent.type(screen.getByLabelText('Precio de venta'), '1000')
    await userEvent.selectOptions(screen.getByLabelText('Masa'), 'm')
    await userEvent.type(screen.getByLabelText('Unidades por lote de masa'), '50')
    expect(screen.getByText(/Costo estimado/).textContent).toMatch(/300/)
    await userEvent.click(screen.getByRole('button', { name: 'Crear producto' }))
    expect(crear.mock.calls[0][1]).toMatchObject({ nombre: 'Arepa', precio: 1000, masaId: 'm', unidadesPorLote: 50 })
  })
})
