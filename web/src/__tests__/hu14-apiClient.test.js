import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { crear, eliminar, listar } from '../services/apiClient.js'
import { guardarSesion, leerSesion } from '../services/sesion.js'

const responder = (status, cuerpo) =>
  fetch.mockResolvedValue({ ok: status < 400, status, json: async () => cuerpo })

describe('HU-14 apiClient', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()))
  afterEach(() => vi.unstubAllGlobals())

  test('CA-5: envía el token de la sesión', async () => {
    guardarSesion({ token: 'abc' })
    responder(200, [{ id: 1 }])
    expect(await listar('insumos')).toEqual([{ id: 1 }])
    expect(fetch.mock.calls[0][0]).toBe('/api/insumos')
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer abc')
  })

  test('CA-5: crea con POST y JSON', async () => {
    responder(201, {})
    await crear('insumos', { nombre: 'Sal' })
    expect(fetch.mock.calls[0][1]).toMatchObject({ method: 'POST', body: '{"nombre":"Sal"}' })
  })

  test('muestra el mensaje de error del servidor', async () => {
    responder(409, { error: 'El insumo está en uso' })
    await expect(eliminar('insumos', '1')).rejects.toThrow('El insumo está en uso')
  })

  test('si el token venció, cierra la sesión', async () => {
    guardarSesion({ token: 'viejo' })
    responder(401, { error: 'Debes iniciar sesión' })
    await expect(listar('insumos')).rejects.toThrow()
    expect(leerSesion()).toBeNull()
  })
})
