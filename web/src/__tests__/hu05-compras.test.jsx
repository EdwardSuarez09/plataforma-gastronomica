import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import modulo from '../modules/compras/index.jsx'
import { crear, editar, listar } from '../services/apiClient.js'

vi.mock('../services/apiClient.js', () => ({ listar: vi.fn(), crear: vi.fn(), editar: vi.fn() }))

const insumo = { id: 'h', nombre: 'Harina', unidad: 'kg', precio: 3000, stock: 5 }
const compras = [
  { id: '1', insumoId: 'h', fecha: '2026-06-01', cantidad: 2, precioUnitario: 3000, valorTotal: 6000 },
  { id: '2', insumoId: 'h', fecha: '2026-06-05', cantidad: 1, precioUnitario: 3100, valorTotal: 3100 },
]
let datos
const abrir = () => render(<MemoryRouter><modulo.Componente /></MemoryRouter>)
const registrar = async () => {
  await userEvent.selectOptions(await screen.findByLabelText('Insumo'), 'h')
  await userEvent.type(screen.getByLabelText('Cantidad'), '10')
  await userEvent.type(screen.getByLabelText('Valor total'), '32000')
  await userEvent.click(screen.getByRole('button', { name: 'Registrar compra' }))
}

describe('HU-05 Compras (funcionales)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    datos = { insumos: [insumo], compras }
    listar.mockImplementation(async (c) => datos[c])
    crear.mockResolvedValue({ compra: { precioUnitario: 3200 }, insumo: { ...insumo, stock: 15 } })
  })

  test('CA-7: sin insumos no permite comprar', async () => {
    datos.insumos = []
    abrir()
    expect(await screen.findByText(/Primero registra insumos/)).toBeTruthy()
  })

  test('CA-6: lista de la más reciente a la más antigua con el total', async () => {
    abrir()
    const filas = (await screen.findAllByRole('row')).slice(1).map((f) => f.textContent)
    expect(filas[0]).toContain('2026-06-05')
    expect(screen.getByText(/9\.100/)).toBeTruthy()
  })

  test('CA-5: si el usuario confirma, actualiza el precio', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true))
    abrir()
    await registrar()
    expect(await screen.findByRole('status')).toBeTruthy()
    expect(editar).toHaveBeenCalledWith('insumos', 'h', { precio: 3200 })
  })

  test('CA-5: si no confirma, el precio queda igual', async () => {
    vi.stubGlobal('confirm', vi.fn(() => false))
    abrir()
    await registrar()
    expect(await screen.findByRole('status')).toBeTruthy()
    expect(editar).not.toHaveBeenCalled()
  })
})
