import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, test, vi } from 'vitest'
import App from '../App.jsx'
import { guardarSesion } from '../services/sesion.js'

afterEach(() => vi.unstubAllGlobals())
const abrir = (ruta) => render(<MemoryRouter initialEntries={[ruta]}><App /></MemoryRouter>)

describe('HU-28 Acceso seguro (funcionales)', () => {
  test('CA-4: si la sesión vence, vuelve al login con una explicación', async () => {
    guardarSesion({ token: 'viejo', usuario: { nombre: 'Ana', negocioId: 'n1' } })
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 401, json: async () => ({ error: 'Debes iniciar sesión' }) })))
    abrir('/insumos')
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeTruthy()
    expect(screen.getByText(/Tu sesión venció/)).toBeTruthy()
  })

  test('CA-5: la contraseña se puede mostrar para revisarla', async () => {
    abrir('/login')
    expect(screen.getByLabelText('Contraseña').type).toBe('password')
    await userEvent.click(screen.getByLabelText('Mostrar contraseña'))
    expect(screen.getByLabelText('Contraseña').type).toBe('text')
  })

  test('CA-6: quien solo quiere comprar encuentra las tiendas', () => {
    abrir('/login')
    expect(screen.getByRole('link', { name: /Ver tiendas/ }).getAttribute('href')).toBe('/tiendas')
  })
})
