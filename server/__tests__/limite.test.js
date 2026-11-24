import { expect, test } from 'vitest'
import { limitar } from '../middleware/limite.js'

test('bloquea al superar el máximo y no afecta a otra dirección', () => {
  const regla = limitar({ maximo: 2, minutos: 1, mensaje: 'Demasiados intentos' })
  const llamar = (ip) => regla({ ip }, {}, () => {})
  llamar('a')
  llamar('a')
  expect(() => llamar('a')).toThrow('Demasiados intentos')
  expect(() => llamar('b')).not.toThrow()
})
