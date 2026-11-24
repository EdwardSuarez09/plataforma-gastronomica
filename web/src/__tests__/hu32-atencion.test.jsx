import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import App from '../App.jsx'
import compras, { compararPrecio } from '../modules/compras/index.jsx'
import Carrito from '../modules/pedidos/Carrito.jsx'
import pedidos, { espera } from '../modules/pedidos/index.jsx'
import ventas, { billetesPara } from '../modules/ventas/index.jsx'
import { listar, pedir } from '../services/apiClient.js'

vi.mock('../services/apiClient.js', () => ({ listar: vi.fn(), pedir: vi.fn(), crear: vi.fn(), editar: vi.fn() }))

const abrir = (Componente) => render(<MemoryRouter><Componente /></MemoryRouter>)
const tocar = async (nombre) => userEvent.click(await screen.findByRole('button', { name: nombre }))

describe('HU-32 reglas (unitarias)', () => {
  test('CA-1: sugiere los billetes que alcanzan para pagar', () => {
    expect(billetesPara(8500)).toEqual([10000, 20000, 50000])
    expect(billetesPara(60000)).toEqual([100000])
    expect(billetesPara(500000)).toEqual([])
  })

  test('CA-4: dice cuánto lleva esperando un pedido', () => {
    const ahora = new Date('2026-06-01T12:00:00Z').getTime()
    expect(espera('2026-06-01T11:59:40Z', ahora)).toBe('Ahora mismo')
    expect(espera('2026-06-01T11:48:00Z', ahora)).toBe('Hace 12 min')
    expect(espera('2026-06-01T09:00:00Z', ahora)).toBe('Hace 3 h')
    expect(espera('sin fecha', ahora)).toBe('')
  })

  test('CA-7: compara lo pagado con el precio guardado', () => {
    expect(compararPrecio(3300, 3000)).toEqual(['atento', '10 % más caro que el guardado'])
    expect(compararPrecio(2700, 3000)).toEqual(['ok', '10 % más barato que el guardado'])
    expect(compararPrecio(3000, 3000)[1]).toMatch(/Igual/)
    expect(compararPrecio(Infinity, 3000)).toBeNull()
    expect(compararPrecio(NaN, 3000)).toBeNull()
  })

  test('CA-8: ventas, pedidos y compras traen su guía', () => {
    for (const modulo of [ventas, pedidos, compras]) {
      expect(modulo.guia.para).toBeTruthy()
      expect(modulo.guia.pasos.length).toBeGreaterThan(1)
    }
  })
})

describe('HU-32 Vender y atender (funcionales)', () => {
  beforeEach(() => vi.resetAllMocks())

  test('CA-1 y CA-2: la tecla cuenta las unidades y un billete calcula las vueltas', async () => {
    const datos = { ventas: [], productos: [{ id: 'e', nombre: 'Empanada', precio: 2500, activo: true }] }
    listar.mockImplementation(async (c) => datos[c])
    abrir(ventas.Componente)
    await tocar(/^Empanada/)
    await tocar(/^Empanada/)
    expect(screen.getByRole('button', { name: /^Empanada/ }).textContent).toMatch(/2$/)
    await tocar(/10\.000/)
    expect(screen.getByText(/Vueltas/).textContent).toMatch(/5\.000/)
  })

  test('CA-2: la cuenta se puede vaciar', async () => {
    const datos = { ventas: [], productos: [{ id: 'e', nombre: 'Empanada', precio: 2500, activo: true }] }
    listar.mockImplementation(async (c) => datos[c])
    abrir(ventas.Componente)
    await tocar(/^Empanada/)
    await tocar('Vaciar cuenta')
    expect(screen.queryByRole('button', { name: 'Cobrar' })).toBeNull()
  })

  test('CA-3: rechazar pide el motivo en la misma tarjeta', async () => {
    listar.mockResolvedValue([{
      id: '1', codigo: 'X', estado: 'recibido', creadoEn: '2026', total: 1, cliente: { nombre: 'L' }, items: [],
    }])
    abrir(pedidos.Componente)
    await tocar('Rechazar')
    expect(screen.getByRole('button', { name: 'Sí, rechazar' }).disabled).toBe(true)
    await tocar('Ya cerramos')
    await tocar('Sí, rechazar')
    expect(pedir).toHaveBeenCalledWith('/pedidos/1/estado', { metodo: 'PATCH', datos: { estado: 'rechazado', motivo: 'Ya cerramos' } })
  })

  test('CA-5: el cliente puede sumar desde su pedido', async () => {
    const sumar = vi.fn()
    render(<MemoryRouter><Carrito slug="x" productos={[{ id: 'e', nombre: 'Empanada', precio: 2500 }]} carrito={{ e: 1 }} sumar={sumar} vaciar={() => {}} /></MemoryRouter>)
    await tocar('Sumar Empanada')
    expect(sumar).toHaveBeenCalledWith('e', 1)
  })

  test('CA-6: el seguimiento explica qué sigue', async () => {
    pedir.mockResolvedValue({ codigo: 'ABC', total: 5000, estado: 'en_preparacion', items: [] })
    render(<MemoryRouter initialEntries={['/tienda/ana/pedido/ABC']}><App /></MemoryRouter>)
    expect((await screen.findByText('Lo están preparando en la cocina.')).getAttribute('role')).toBe('status')
  })
})
