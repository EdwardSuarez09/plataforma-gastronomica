import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import compras from '../modules/compras/index.jsx'
import modulo from '../modules/inventario/index.jsx'
import { listar, pedir } from '../services/apiClient.js'

vi.mock('../services/apiClient.js', () => ({ listar: vi.fn(), pedir: vi.fn(), crear: vi.fn(), editar: vi.fn() }))

const insumo = { id: 'h', nombre: 'Harina', unidad: 'kg', stock: 3, stockMinimo: 4, precio: 3000, valor: 9000, bajo: true }
const datos = {
  inventario: [insumo],
  insumos: [insumo],
  movimientos: [{ id: '1', insumoId: 'h', nombre: 'Harina', tipo: 'compra', cantidad: 10, saldo: 15, fecha: '2026-06-01', creadoEn: '1' }],
  compras: [],
}
const abrir = (Componente, ruta = '/') => render(<MemoryRouter initialEntries={[ruta]}><Componente /></MemoryRouter>)

describe('HU-09 Inventario (funcionales)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listar.mockImplementation(async (c) => datos[c])
  })

  test('CA-8: marca lo que está bajo el mínimo y muestra el valor total', async () => {
    abrir(modulo.Componente)
    expect(await screen.findByText('Bajo mínimo')).toBeTruthy()
    expect(screen.getAllByText(/9\.000/).length).toBeGreaterThan(0)
  })

  test('CA-2: registra un conteo con su motivo', async () => {
    abrir(modulo.Componente)
    await userEvent.selectOptions(await screen.findByLabelText('Insumo'), 'h')
    await userEvent.type(screen.getByLabelText('Cantidad contada'), '5')
    await userEvent.type(screen.getByLabelText('Motivo'), 'Cierre')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar ajuste' }))
    expect(pedir).toHaveBeenCalledWith('/inventario/ajustes', {
      metodo: 'POST', datos: { insumoId: 'h', tipo: 'conteo', cantidad: 5, motivo: 'Cierre' },
    })
  })

  test('CA-1: se ve el libro de movimientos', async () => {
    abrir(modulo.Componente)
    expect(await screen.findByText('+10')).toBeTruthy()
  })

  test('la compra se puede abrir con los datos del plan', async () => {
    abrir(compras.Componente, '/compras?insumo=h&cantidad=50')
    expect((await screen.findByLabelText('Cantidad')).value).toBe('50')
    expect(screen.getByLabelText('Insumo').value).toBe('h')
  })
})
