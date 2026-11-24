import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { listar } from '../services/apiClient.js'
import { guardarSesion } from '../services/sesion.js'
import { useDatos } from '../services/useDatos.js'

vi.mock('../services/apiClient.js', () => ({ listar: vi.fn(async () => []) }))

let enviar
beforeEach(() => {
  listar.mockClear()
  const cuerpo = new ReadableStream({
    start(c) {
      enviar = (texto) => c.enqueue(new TextEncoder().encode(texto))
    },
  })
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, body: cuerpo })))
})
afterEach(() => vi.unstubAllGlobals())

test('CA-5: la pantalla se actualiza sola cuando llega un aviso', async () => {
  guardarSesion({ token: 'abc' })
  const { unmount } = renderHook(() => useDatos('ventas'))
  await waitFor(() => expect(listar).toHaveBeenCalledTimes(1))
  expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer abc')
  await act(async () => enviar('da'))
  await act(async () => enviar('ta: ["ventas"]\n\n'))
  await waitFor(() => expect(listar).toHaveBeenCalledTimes(2), { timeout: 2000 })
  unmount()
})

test('CA-6: sin sesión no abre ninguna conexión', async () => {
  renderHook(() => useDatos('ventas'))
  await waitFor(() => expect(listar).toHaveBeenCalled())
  expect(fetch).not.toHaveBeenCalled()
})
