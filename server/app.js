import { existsSync, readdirSync } from 'node:fs'
import express from 'express'

const app = express()
app.use(express.json({ limit: '1mb' }))

// Cada carpeta de modules/ exporta { ruta, router, orden }. Así cada integrante
// agrega su módulo sin modificar este archivo y se evitan conflictos de merge.
const carpeta = new URL('./modules/', import.meta.url)
const modulos = []
for (const nombre of readdirSync(carpeta)) {
  const archivo = new URL(`${nombre}/index.js`, carpeta)
  if (existsSync(archivo)) modulos.push((await import(archivo.href)).default)
}
modulos
  .sort((a, b) => (a.orden ?? 10) - (b.orden ?? 10))
  .forEach(({ ruta, router }) => app.use(ruta, router))

app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }))
app.use((err, _req, res, _next) => {
  const estado = err.estado ?? 500
  if (estado === 500) console.error(err)
  res.status(estado).json({ error: estado === 500 ? 'Error interno del servidor' : err.message })
})

export default app
