import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import App from '../App.jsx'
import Guia from '../components/Guia.jsx'
import { Campo, numero } from '../components/ui.jsx'
import costos, { nivel } from '../modules/costos/index.jsx'
import pantallasMasas from '../modules/masas/index.jsx'
import plan from '../modules/optimizacion/index.jsx'
import productos from '../modules/productos/index.jsx'
import { listar, pedir } from '../services/apiClient.js'
import { guardarSesion } from '../services/sesion.js'

vi.mock('../services/apiClient.js', () => ({ listar: vi.fn(), pedir: vi.fn(), crear: vi.fn(), editar: vi.fn(), eliminar: vi.fn() }))

const modulo = { ruta: '/prueba', titulo: 'Prueba', guia: { para: 'Sirve para probar', pasos: ['Primero', 'Después'], conecta: 'Se une con todo' } }
const abrir = (ruta) => render(<MemoryRouter initialEntries={[ruta]}><App /></MemoryRouter>)

describe('HU-31 Guía por módulo', () => {
  test('CA-1: se abre la primera vez y no vuelve a molestar', async () => {
    const { unmount } = render(<Guia modulo={modulo} />)
    expect(screen.getByText('Sirve para probar')).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: 'Entendido' }))
    expect(screen.queryByText('Sirve para probar')).toBeNull()
    unmount()
    render(<Guia modulo={modulo} />)
    expect(screen.queryByText('Sirve para probar')).toBeNull()
  })

  test('CA-2: el botón de ayuda la vuelve a mostrar', async () => {
    localStorage.setItem('guias-vistas', '["/prueba"]')
    render(<Guia modulo={modulo} />)
    const boton = screen.getByRole('button', { name: '¿Cómo funciona?' })
    expect(boton.getAttribute('aria-expanded')).toBe('false')
    await userEvent.click(boton)
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Primero', 'Después'])
  })

  test('CA-3: un módulo sin guía no muestra nada', () => {
    const { container } = render(<Guia modulo={{ ruta: '/x', titulo: 'X' }} />)
    expect(container.textContent).toBe('')
  })

  test('CA-9: masas, rendimiento, productos, costos y plan traen su guía', () => {
    for (const m of [...pantallasMasas, productos, costos, plan]) {
      expect(m.guia.para).toBeTruthy()
      expect(m.guia.pasos.length).toBeGreaterThan(1)
    }
  })
})

describe('HU-31 Campos y navegación', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    listar.mockResolvedValue([])
    pedir.mockResolvedValue([])
  })

  test('CA-4: la ayuda describe el campo sin cambiar su nombre', () => {
    render(<Campo etiqueta="Precio" ayuda="Sin puntos" />)
    const campo = screen.getByLabelText('Precio')
    expect(document.getElementById(campo.getAttribute('aria-describedby')).textContent).toBe('Sin puntos')
  })

  test('CA-4: los números se leen fácil', () => expect(numero(1234.5678)).toBe('1.234,57'))

  test('CA-5: en el celular el menú se abre y se cierra', async () => {
    guardarSesion({ token: 't', usuario: { nombre: 'Ana', negocioId: 'n' } })
    abrir('/costos')
    const boton = screen.getByRole('button', { name: 'Menú' })
    await userEvent.click(boton)
    expect(boton.getAttribute('aria-expanded')).toBe('true')
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(boton.getAttribute('aria-expanded')).toBe('false')
  })

  test('CA-6: las páginas públicas tienen barra y el dueño puede volver a su panel', async () => {
    const { unmount } = abrir('/tiendas')
    expect(screen.getByRole('link', { name: 'Soy un negocio' }).getAttribute('href')).toBe('/login')
    unmount()
    guardarSesion({ token: 't', usuario: { nombre: 'Ana', negocioId: 'n' } })
    abrir('/tiendas')
    expect(screen.getByRole('link', { name: 'Ir a mi panel' }).getAttribute('href')).toBe('/')
  })
})

describe('HU-31 Marca Sazonexo', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    listar.mockResolvedValue([])
    pedir.mockResolvedValue([])
  })

  test('CA-10: el logo y el nombre están en el panel y en las páginas públicas', () => {
    const { container, unmount } = abrir('/tiendas')
    expect(container.querySelector('.barra-publica .logo')).toBeTruthy()
    expect(container.querySelector('.barra-publica').textContent).toMatch(/^Sazonexo/)
    unmount()
    guardarSesion({ token: 't', usuario: { nombre: 'Ana', negocioId: 'n' } })
    const panel = abrir('/costos').container
    expect(panel.querySelector('.lateral .logo')).toBeTruthy()
    expect(panel.querySelector('.lateral').textContent).toMatch(/^Sazonexo/)
  })

  test('CA-10: la pestaña del navegador dice dónde estoy', () => {
    abrir('/tiendas')
    expect(document.title).toBe('Tiendas · Sazonexo')
  })

  test('CA-10: una ruta desconocida conserva la marca y permite volver', () => {
    const { container } = abrir('/no-existe')
    expect(container.textContent).toMatch(/Sazonexo/)
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toBeTruthy()
  })
})

describe('HU-31 Cocina y costos', () => {
  beforeEach(() => vi.resetAllMocks())

  test('CA-7: muestra el costo del lote mientras se escribe la receta', async () => {
    const datos = { masas: [], insumos: [{ id: 'h', nombre: 'Harina', unidad: 'kg', precio: 3000 }] }
    listar.mockImplementation(async (c) => datos[c])
    const Masas = pantallasMasas[0].Componente
    render(<MemoryRouter><Masas /></MemoryRouter>)
    await userEvent.selectOptions(await screen.findByLabelText('Insumo'), 'h')
    await userEvent.type(screen.getByLabelText('Cantidad'), '4')
    expect(screen.getByText(/Este lote cuesta/).textContent).toMatch(/12\.000/)
  })

  test('CA-8: cada margen tiene un estado que se entiende', () => {
    const texto = (margen, sinRendimiento = false) => nivel({ margen, sinRendimiento })[1]
    expect(texto(0.5)).toBe('Bueno')
    expect(texto(0.3)).toBe('Ajustado')
    expect(texto(0.1)).toBe('Muy bajo')
    expect(texto(-0.1)).toBe('Pierdes dinero')
    expect(texto(0.9, true)).toBe('Incompleto')
  })
})
