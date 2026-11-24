// Cada archivo de prueba usa su propia carpeta temporal: nunca toca los datos reales.
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

process.env.DATA_DIR = mkdtempSync(join(tmpdir(), 'fritos-'))
process.env.JWT_SECRET = 'secreto-de-pruebas'
