import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import App from '../App.jsx'
import { pedir } from '../services/apiClient.js'
import { leerSesion } from '../services/sesion.js'

vi.mock('../services/apiClient.js', () => ({ pedir: vi.fn(), listar: vi.fn(async () => []) }))

const abrir = (ruta) => render(<MemoryRouter initialEntries={[ruta]}><App /></MemoryRouter>)

describe('HU-01 Acceso (funcionales)', () => {
  beforeEach(() => {
    pedir.mockReset()
  })

  test('CA-5: una ruta protegida sin sesión lleva al login', () => {
    abrir('/')
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeTruthy()
  })

  test('CA-4: credenciales incorrectas muestran el error y no entra', async () => {
    pedir.mockRejectedValue(new Error('Correo o contraseña incorrectos'))
    abrir('/login')
    await userEvent.type(screen.getByLabelText('Correo'), 'ana@p.co')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'equivocada')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect((await screen.findByRole('alert')).textContent).toBe('Correo o contraseña incorrectos')
    expect(leerSesion()).toBeNull()
  })

  test('CA-1 y CA-3: al registrarse queda la sesión guardada', async () => {
    pedir.mockResolvedValue({ token: 't', usuario: { nombre: 'Ana', negocioId: null } })
    abrir('/registro')
    await userEvent.type(screen.getByLabelText('Nombre'), 'Ana')
    await userEvent.type(screen.getByLabelText('Correo'), 'ana@p.co')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'clave-segura')
    await userEvent.click(screen.getByRole('button', { name: 'Registrarme' }))
    expect(pedir.mock.calls[0][0]).toBe('/auth/registro')
    expect(leerSesion().token).toBe('t')
  })
})
