import { expect, test } from 'vitest'
import { diaSemana, esFecha, hoy, sumarDias } from '../util/fechas.js'

test('hoy tiene formato AAAA-MM-DD', () => expect(esFecha(hoy())).toBe(true))

test.each(['', '2026-13-01', '2026-02-31', '2025-02-29', '01/02/2026', undefined])(
  'rechaza la fecha %s',
  (f) => expect(esFecha(f)).toBe(false),
)

test('acepta el 29 de febrero de un año bisiesto', () => {
  expect(esFecha('2024-02-29')).toBe(true)
})

test('suma y resta días cruzando meses y años', () => {
  expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01')
  expect(sumarDias('2026-03-01', -1)).toBe('2026-02-28')
})

test('el 1 de junio de 2026 es lunes', () => expect(diaSemana('2026-06-01')).toBe(1))
