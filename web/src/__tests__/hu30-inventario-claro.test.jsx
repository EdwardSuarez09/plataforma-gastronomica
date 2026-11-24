import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import insumos from '../modules/insumos/index.jsx'
import inventario from '../modules/inventario/index.jsx'
import { cantidad, nivelDe } from '../modules/inventario/nivel.js'
import pronostico, { confianza } from '../modules/pronostico/index.jsx'
import { listar } from '../services/apiClient.js'

vi.mock('../services/apiClient.js', () => ({ listar: vi.fn(), crear: vi.fn(), editar: vi.fn(), eliminar: vi.fn(), pedir: vi.fn() }))

const harina = { id: 'h', nombre: 'Harina', unidad: 'kg', precio: 3000, stock: 3.4567, stockMinimo: 4, valor: 10370, bajo: true }
const aceite = { id: 'a', nombre: 'Aceite', unidad: 'L', precio: 8000, stock: 20, stockMinimo: 5, valor: 160000, bajo: false }
const abrir = (Componente) => render(<MemoryRouter><Componente /></MemoryRouter>)

describe('HU-30 lectura del stock (unitarias)', () => {
  test('CA-1: traduce stock y mínimo a un estado', () => {
    const texto = (stock, stockMinimo) => nivelDe({ stock, stockMinimo }).texto
    expect(texto(0, 5)).toBe('Sin stock')
    expect(texto(-2, 5)).toBe('Sin stock')
    expect(texto(5, 5)).toBe('Por agotarse')
    expect(texto(6, 5)).toBe('Justo')
    expect(texto(20, 5)).toBe('Suficiente')
    expect(texto(20, 0)).toBe('Sin mínimo')
  })

  test('CA-1: la barra va de vacía a llena', () => {
    expect(nivelDe({ stock: 0, stockMinimo: 5 }).parte).toBe(0)
    expect(nivelDe({ stock: 5, stockMinimo: 5 }).parte).toBe(0.5)
    expect(nivelDe({ stock: 900, stockMinimo: 5 }).parte).toBe(1)
  })

  test('CA-2: las cantidades se muestran con máximo dos decimales', () => {
    expect(cantidad(133.4359)).toBe('133,44')
    expect(cantidad(10)).toBe('10')
  })

  test('CA-5: el error del pronóstico se dice en palabras', () => {
    expect(confianza(0.09)[0]).toBe('ok')
    expect(confianza(0.25)[0]).toBe('atento')
    expect(confianza(0.6)[0]).toBe('mal')
    expect(confianza(null)).toBeNull()
  })

  test('CA-7: insumos, inventario y pronóstico traen su guía', () => {
    for (const modulo of [insumos, inventario, pronostico]) {
      expect(modulo.guia.para).toBeTruthy()
      expect(modulo.guia.pasos.length).toBeGreaterThan(1)
    }
  })
})

describe('HU-30 Inventario claro (funcionales)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listar.mockImplementation(async (c) => (c === 'movimientos' ? [] : [harina, aceite]))
  })

  test('CA-2: la lista de insumos muestra el nivel de cada uno', async () => {
    abrir(insumos.Componente)
    expect(await screen.findByText('Por agotarse')).toBeTruthy()
    expect(screen.getByText('Suficiente')).toBeTruthy()
    expect(screen.getByText('3,46', { exact: false })).toBeTruthy()
  })

  test('CA-8: insumos resume cuántos hay, cuántos reponer y cuánto valen', async () => {
    abrir(insumos.Componente)
    expect((await screen.findByText('Insumos registrados')).parentElement.textContent).toMatch(/2$/)
    expect(screen.getByText('Por reponer').parentElement.textContent).toMatch(/1/)
    expect(screen.getByText('Valor de lo que tienes').parentElement.textContent).toMatch(/170\.370/)
  })

  test('CA-8: el resumen también muestra ceros cuando no hay insumos', async () => {
    listar.mockResolvedValue([])
    abrir(insumos.Componente)
    expect((await screen.findByText('Insumos registrados')).parentElement.textContent).toMatch(/0$/)
    expect(screen.getByText('Por reponer').parentElement.textContent).toMatch(/0/)
    expect(screen.getByText('Valor de lo que tienes').parentElement.textContent).toMatch(/0/)
  })

  test('CA-1: inventario combina estado y barra en cada fila', async () => {
    const { container } = abrir(inventario.Componente)
    expect(await screen.findByText('Bajo mínimo')).toBeTruthy()
    expect(screen.getByText('Suficiente')).toBeTruthy()
    expect(container.querySelectorAll('.inventario-medidor > i')).toHaveLength(2)
  })

  test('CA-3: puedo ver solo lo que debo comprar', async () => {
    abrir(inventario.Componente)
    await userEvent.click(await screen.findByLabelText('Ver solo lo que debo comprar'))
    expect(screen.getByText('Harina')).toBeTruthy()
    expect(screen.queryByText('Aceite')).toBeNull()
  })

  test('CA-4: ajustar desde la fila deja elegido el insumo y dice cuánto hay', async () => {
    abrir(inventario.Componente)
    await userEvent.click(await screen.findByRole('button', { name: 'Ajustar Harina' }))
    expect(screen.getByLabelText('Insumo').value).toBe('h')
    expect(screen.getByText(/El sistema dice que hay 3,46 kg/)).toBeTruthy()
  })

  test('CA-5: el pronóstico resume la semana', async () => {
    listar.mockResolvedValue({
      suficiente: true, diasConDatos: 28, diasMinimos: 14, error: 0.12,
      dias: [{ fecha: '2026-06-29', nombre: 'Lunes' }, { fecha: '2026-06-30', nombre: 'Martes' }],
      productos: [{ productoId: 'e', nombre: 'Empanada', valores: [30, 12] }, { productoId: 'p', nombre: 'Papa', valores: [5, 8] }],
    })
    abrir(pronostico.Componente)
    expect(await screen.findByText('55')).toBeTruthy()
    expect(screen.getByText('Acierta bien')).toBeTruthy()
  })

  test('CA-6: sin datos muestra el avance', async () => {
    listar.mockResolvedValue({ suficiente: false, diasConDatos: 3, diasMinimos: 14 })
    abrir(pronostico.Componente)
    expect((await screen.findByLabelText('Días con ventas')).getAttribute('value')).toBe('3')
  })
})
