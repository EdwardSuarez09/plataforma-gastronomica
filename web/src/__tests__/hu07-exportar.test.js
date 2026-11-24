import { expect, test } from 'vitest'
import { aCsv } from '../modules/historial/exportar.js'

const linea = { fecha: '2026-06-01', nombre: 'Papa "rellena"', cantidad: 2, precioUnitario: 3500, total: 7000 }

test('CA-7: exporta las líneas filtradas para abrirlas en Excel', () =>
  expect(aCsv([linea])).toBe('Fecha;Producto;Cantidad;Precio;Total\n2026-06-01;"Papa ""rellena""";2;3500;7000'))

test('CA-7: un texto que parece fórmula no se ejecuta en Excel', () =>
  expect(aCsv([{ ...linea, nombre: '=1+1' }])).toContain('"\'=1+1"'))
