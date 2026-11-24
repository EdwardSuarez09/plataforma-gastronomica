import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import App from '../App.jsx'
import { correoValido, fuerza } from '../modules/acceso/fuerza.js'
import { ESCENAS, posicion } from '../modules/acceso/Presentacion.jsx'
import historial, { rangoDe } from '../modules/historial/index.jsx'
import inicio, { pendientesDe } from '../modules/inicio/index.jsx'
import negocio from '../modules/negocio/index.jsx'
import { dibujoDe } from '../modules/tienda/Dibujo.jsx'
import { filtrarTiendas } from '../modules/tienda/filtrar.js'
import { listar, pedir } from '../services/apiClient.js'

vi.mock('../services/apiClient.js', () => ({ pedir: vi.fn(), listar: vi.fn() }))

const tiendas = [
  { nombre: 'Fritos Ana', slug: 'fritos-ana', tipo: 'Fritos', ciudad: 'Sincelejo', productos: 8, desde: 1800, categorias: ['Arepas'], menu: ['Carimañola'] },
  { nombre: 'Café Río', slug: 'cafe-rio', tipo: 'Cafetería', ciudad: 'Corozal', productos: 3, desde: 1500, categorias: [], menu: ['Tinto'] },
]
const nombres = (filtro) => filtrarTiendas(tiendas, filtro).map((t) => t.nombre)
const abrir = (ruta) => render(<MemoryRouter initialEntries={[ruta]}><App /></MemoryRouter>)

describe('HU-29 filtros (unitarias)', () => {
  test('CA-2: busca por negocio o por plato, sin importar tildes', () => {
    expect(nombres({ texto: 'cafe' })).toEqual(['Café Río'])
    expect(nombres({ texto: 'CARIMANOLA' })).toEqual(['Fritos Ana'])
  })

  test('CA-3: filtra por tipo y ciudad, y ordena', () => {
    expect(nombres({ tipo: 'Fritos' })).toEqual(['Fritos Ana'])
    expect(nombres({ ciudad: 'Corozal' })).toEqual(['Café Río'])
    expect(nombres({ orden: 'precio' })).toEqual(['Café Río', 'Fritos Ana'])
    expect(nombres({ orden: 'menu' })).toEqual(['Fritos Ana', 'Café Río'])
  })

  test('cada producto recibe un dibujo y lo desconocido cae en el plato', () => {
    expect(dibujoDe('Arepa con huevo')).toBe('huevo')
    expect(dibujoDe('Sancocho')).toBe('plato')
  })

  test('CA-7: el panel lista solo lo que necesita atención', () => {
    expect(pendientesDe({ pendientes: 0, bajos: [] })).toEqual([])
    expect(pendientesDe({ pendientes: 2, bajos: [{}] }).map((x) => x[0])).toEqual(['/pedidos', '/inventario'])
  })

  test('CA-9: el periodo rápido incluye el día de hoy', () =>
    expect(rangoDe(6, '2026-06-07')).toEqual({ desde: '2026-06-01', hasta: '2026-06-07' }))

  test('CA-10: panel, negocio e historial traen su guía', () => {
    for (const modulo of [inicio, negocio, historial]) {
      expect(modulo.guia.para).toBeTruthy()
      expect(modulo.guia.pasos.length).toBeGreaterThan(1)
    }
  })
})

describe('HU-29 Acceso de Sazonexo', () => {
  test('CA-11: la presentación cambia sola y al tocar un punto', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    abrir('/login')
    expect(screen.getByRole('heading', { name: ESCENAS[0].titulo })).toBeTruthy()
    await act(async () => vi.advanceTimersByTime(4600))
    expect(screen.getByRole('heading', { name: ESCENAS[1].titulo })).toBeTruthy()
    vi.useRealTimers()
    await userEvent.click(screen.getByRole('button', { name: 'Plan' }))
    expect(screen.getByRole('heading', { name: 'Produces lo justo' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Plan' }).getAttribute('aria-pressed')).toBe('true')
  })

  test('CA-11: se puede pausar', async () => {
    abrir('/login')
    await userEvent.click(screen.getByRole('button', { name: 'Pausar' }))
    expect(screen.getByRole('button', { name: 'Reproducir' })).toBeTruthy()
  })

  test('CA-11: los puntos quedan repartidos alrededor del logo', () => {
    expect(posicion(0, 4)).toEqual({ x: 50, y: 12 })
    expect(Math.round(posicion(2, 4).y)).toBe(88)
  })

  test('CA-12: el registro orienta sobre la contraseña y el correo', async () => {
    expect([fuerza('corta'), fuerza('solominusculas1'), fuerza('abcdefgh'), fuerza('Arepa#2026')]).toEqual([0, 3, 1, 4])
    expect([correoValido('ana@p.co'), correoValido('ana@'), correoValido('')]).toEqual([true, false, false])
    abrir('/registro')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'Arepa#2026')
    expect(screen.getByText('Contraseña fuerte')).toBeTruthy()
  })

  test('CA-12: el botón avisa que está entrando y no se envía dos veces', async () => {
    pedir.mockReset()
    pedir.mockReturnValue(new Promise(() => {}))
    abrir('/login')
    await userEvent.type(screen.getByLabelText('Correo'), 'ana@p.co')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'clave-segura')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(screen.getByRole('button', { name: 'Entrando…' }).disabled).toBe(true)
    expect(pedir).toHaveBeenCalledTimes(1)
  })
})

describe('HU-29 Vitrina (funcionales)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    listar.mockResolvedValue([])
    pedir.mockImplementation(async (ruta) => (ruta === '/publico/tiendas' ? tiendas : {
      negocio: { nombre: 'Fritos Ana', tipo: 'Fritos', ciudad: 'Sincelejo' },
      productos: [{ id: 'e', nombre: 'Empanada', precio: 2500 }],
    }))
  })

  test('CA-1: la tarjeta dice cuántos productos hay y desde qué precio', async () => {
    abrir('/tiendas')
    expect((await screen.findByText(/8 productos/)).textContent).toMatch(/1\.800/)
    expect(screen.getByText('2 negocios')).toBeTruthy()
  })

  test('CA-3: tocar un tipo deja solo esos negocios', async () => {
    abrir('/tiendas')
    await userEvent.click(await screen.findByRole('button', { name: 'Cafetería' }))
    expect(screen.queryByText('Fritos Ana')).toBeNull()
    expect(screen.getByText('1 negocio')).toBeTruthy()
  })

  test('CA-4: si nada coincide, lo dice y permite quitar los filtros', async () => {
    abrir('/tiendas')
    await screen.findByText('Fritos Ana')
    await userEvent.type(screen.getByLabelText('Buscar restaurante o plato'), 'sushi')
    expect(screen.getByText(/Ningún negocio coincide/)).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: 'Quitar filtros' }))
    expect(screen.getByText('Fritos Ana')).toBeTruthy()
  })

  test('CA-5: suma y resta desde la tarjeta del producto', async () => {
    abrir('/tienda/fritos-ana')
    const agregar = await screen.findByRole('button', { name: 'Agregar Empanada' })
    await userEvent.click(agregar)
    await userEvent.click(agregar)
    expect(screen.getByLabelText('Cantidad de Empanada').textContent).toBe('2')
    await userEvent.click(screen.getByRole('button', { name: 'Restar Empanada' }))
    expect(screen.getByLabelText('Cantidad de Empanada').textContent).toBe('1')
  })

  test('CA-7: un negocio nuevo ve los 4 primeros pasos', async () => {
    listar.mockImplementation(async (c) => {
      if (c.startsWith('panel')) {
        return { ventas: 0, porDia: [], productos: [], bajos: [], comparacion: [], canales: {}, cambio: null, pendientes: 0, sinCosto: 0 }
      }
      return c === 'insumos' ? [{ id: 'h' }] : []
    })
    render(<MemoryRouter><inicio.Componente /></MemoryRouter>)
    expect(await screen.findByRole('heading', { name: 'Empieza en 4 pasos' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Registra tus insumos' }).parentElement.textContent).toMatch(/Listo/)
  })

  test('CA-8: la vista previa cambia mientras se escribe', async () => {
    render(<MemoryRouter><negocio.Componente /></MemoryRouter>)
    await userEvent.type(screen.getByLabelText('Nombre del negocio'), 'Sabor Costeño')
    expect(screen.getByText('Sabor Costeño')).toBeTruthy()
  })
})
