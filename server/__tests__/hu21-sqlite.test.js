import { existsSync, writeFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import * as repo from '../modules/persistencia/repo.js'

test('CA-1: los datos siguen después de cerrar y abrir la base', async () => {
  const { id } = await repo.crear('n1', 'insumos', { nombre: 'Sal' })
  repo.cerrar()
  expect((await repo.obtener('n1', 'insumos', id)).nombre).toBe('Sal')
})

test('CA-2: si algo falla, la transacción no deja nada a medias', async () => {
  const operacion = repo.transaccion(async () => {
    await repo.crear('n2', 'compras', { valor: 1 })
    await repo.crear('n2', 'movimientos', { cantidad: 1 })
    throw new Error('se cayó la luz')
  })
  await expect(operacion).rejects.toThrow('se cayó la luz')
  expect(await repo.listar('n2', 'compras')).toEqual([])
  expect(await repo.listar('n2', 'movimientos')).toEqual([])
})

test('CA-3: dos transacciones simultáneas no se mezclan', async () => {
  const { id } = await repo.crear('n3', 'insumos', { stock: 0 })
  const sumar = () => repo.transaccion(async () => {
    const { stock } = await repo.obtener('n3', 'insumos', id)
    await repo.editar('n3', 'insumos', id, { stock: stock + 1 })
  })
  await Promise.all(Array.from({ length: 20 }, sumar))
  expect((await repo.obtener('n3', 'insumos', id)).stock).toBe(20)
})

test('CA-4: una base dañada da un error claro y deja copia .bak', async () => {
  repo.cerrar()
  writeFileSync(repo.archivo(), 'esto no es una base de datos '.repeat(50))
  await expect(repo.listar('n1', 'insumos')).rejects.toThrow(/dañada/)
  expect(existsSync(`${repo.archivo()}.bak`)).toBe(true)
})
