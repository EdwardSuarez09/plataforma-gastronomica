import { afterAll, beforeAll, expect, test } from 'vitest'
import app from '../app.js'
import { firmarToken } from '../middleware/auth.js'
import * as repo from '../modules/persistencia/repo.js'

let servidor, base
beforeAll(() => new Promise((listo) => {
  servidor = app.listen(0, () => {
    base = `http://localhost:${servidor.address().port}/api/eventos`
    listo()
  })
}))
afterAll(() => {
  servidor.closeAllConnections()
  servidor.close()
})

// Abre la conexión y junta lo que llega hasta que aparece `texto` o pasa el tiempo.
async function escuchar(negocioId, accion, texto, espera = 400) {
  const control = new AbortController()
  const res = await fetch(base, {
    signal: control.signal, headers: { Authorization: `Bearer ${firmarToken({ usuarioId: 'u', negocioId })}` },
  })
  const lector = res.body.getReader()
  let recibido = ''
  setTimeout(() => control.abort(), espera)
  await lector.read()
  await accion()
  try {
    while (!recibido.includes(texto)) {
      const { done, value } = await lector.read()
      if (done) break
      recibido += new TextDecoder().decode(value)
    }
  } catch {
    // se acabó el tiempo
  }
  control.abort()
  return recibido
}

test('CA-1: al crear un registro, la pantalla recibe el aviso', async () => {
  const texto = await escuchar('n1', () => repo.crear('n1', 'ventas', { total: 1 }), 'ventas', 3000)
  expect(texto).toContain('"ventas"')
})

test('CA-2: un negocio no recibe avisos de otro', async () => {
  const texto = await escuchar('n2', () => repo.crear('n3', 'ventas', { total: 1 }), 'ventas')
  expect(texto).not.toContain('ventas')
})

test('CA-3: si la transacción falla, no avisa', async () => {
  const fallar = () => repo.transaccion(async () => {
    await repo.crear('n4', 'ventas', { total: 1 })
    throw new Error('no')
  }).catch(() => {})
  expect(await escuchar('n4', fallar, 'ventas')).not.toContain('ventas')
})

test('CA-4: sin sesión responde 401', async () => expect((await fetch(base)).status).toBe(401))
