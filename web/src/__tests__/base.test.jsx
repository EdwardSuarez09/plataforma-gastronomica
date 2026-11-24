import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, test } from 'vitest'
import App from '../App.jsx'

test('una ruta desconocida muestra un mensaje claro', () => {
  render(<MemoryRouter initialEntries={['/no-existe']}><App /></MemoryRouter>)
  expect(screen.getByText('Página no encontrada')).toBeTruthy()
})
