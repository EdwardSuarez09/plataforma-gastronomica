import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import App from '../App.jsx'
import { pedir } from '../services/apiClient.js'
import { guardarSesion, leerSesion } from '../services/sesion.js'

vi.mock('../services/apiClient.js', () => ({ pedir: vi.fn(), listar: vi.fn(async () => []) }))

const negocio = { id: 'n1', nombre: 'Fritos Ana', slug: 'fritos-ana', tipo: 'Fritos', ciudad: 'Sincelejo', moneda: 'COP' }
const abrir = (ruta) => render(<MemoryRouter initialEntries={[ruta]}><App /></MemoryRouter>)

describe('HU-02 Negocio (funcionales)', () => {
  beforeEach(() => {
    pedir.mockReset()
    guardarSesion({ token: 't', usuario: { nombre: 'Ana', negocioId: null } })
  })

  test('CA-1: sin negocio configurado lleva al formulario', () => {
    abrir('/')
    expect(screen.getByRole('heading', { name: 'Configura tu negocio' })).toBeTruthy()
  })

  test('CA-3: sin nombre muestra el error y no guarda', async () => {
    abrir('/negocio')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(screen.getByRole('alert').textContent).toMatch(/obligatorio/)
    expect(pedir).not.toHaveBeenCalled()
  })

  test('CA-2: al guardar, la sesión queda atada al negocio', async () => {
    pedir.mockImplementation(async (_ruta, opciones) => (opciones?.metodo === 'POST' ? { negocio, token: 't2' } : negocio))
    abrir('/negocio')
    await userEvent.type(screen.getByLabelText('Nombre del negocio'), 'Fritos Ana')
    await userEvent.type(screen.getByLabelText('Ciudad'), 'Sincelejo')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByRole('heading', { name: 'Panel del negocio' })).toBeTruthy()
    expect(leerSesion()).toMatchObject({ token: 't2', usuario: { negocioId: 'n1' } })
  })

  test('CA-4: un negocio existente se puede editar', async () => {
    guardarSesion({ token: 't', usuario: { nombre: 'Ana', negocioId: 'n1' } })
    pedir.mockResolvedValue(negocio)
    abrir('/negocio')
    expect(await screen.findByDisplayValue('Fritos Ana')).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect((await screen.findByText('Cambios guardados'))).toBeTruthy()
  })
})
