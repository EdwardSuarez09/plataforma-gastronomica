import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, test, vi } from 'vitest'
import App from '../App.jsx'
import { Aviso, Campo, Seleccion, dinero, porcentaje } from '../components/ui.jsx'

afterEach(() => vi.unstubAllGlobals())

describe('TEC-01 Componentes comunes', () => {
  test('muestra pesos sin decimales y porcentajes redondeados', () => {
    expect(dinero(2500)).toMatch(/2\.500/)
    expect(dinero(undefined)).toMatch(/0/)
    expect(porcentaje(0.493)).toBe('49 %')
  })

  test('cada campo queda unido a su etiqueta', () => {
    render(<><Campo etiqueta="Nombre" /><Seleccion etiqueta="Unidad" opciones={[['kg', 'Kilo']]} /></>)
    expect(screen.getByLabelText('Nombre').tagName).toBe('INPUT')
    expect(screen.getByLabelText('Unidad').tagName).toBe('SELECT')
  })

  test('un error se anuncia como alerta y un aviso vacío no ocupa espacio', () => {
    render(<><Aviso>Falta el nombre</Aviso><Aviso tipo="ok">{''}</Aviso></>)
    expect(screen.getByRole('alert').textContent).toBe('Falta el nombre')
    expect(screen.queryByRole('status')).toBeNull()
  })

  test('la pantalla de inicio carga sola al agregar su carpeta', () => {
    vi.stubGlobal('fetch', async () => ({ ok: false, status: 500, json: async () => ({}) }))
    localStorage.setItem('sesion', JSON.stringify({ token: 't', usuario: { nombre: 'Ana', negocioId: 'n' } }))
    render(<MemoryRouter><App /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Panel del negocio' })).toBeTruthy()
  })
})
