import { leerSesion } from './sesion.js'

const oyentes = new Set()
let control = null

async function conectar(token) {
  control = new AbortController()
  const { signal } = control
  try {
    const res = await fetch('/api/eventos', { signal, headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) throw new Error(`La conexión de eventos respondió ${res.status}`)
    const lector = res.body.getReader()
    const texto = new TextDecoder()
    let buffer = ''
    for (;;) {
      const { done, value } = await lector.read()
      if (done || signal.aborted) break
      buffer += texto.decode(value, { stream: true })
      const eventos = buffer.split(/\r?\n\r?\n/)
      buffer = eventos.pop() ?? ''
      if (eventos.some((evento) => evento.split(/\r?\n/).some((linea) => linea.startsWith('data:')))) {
        oyentes.forEach((f) => f())
      }
    }
  } catch (error) {
    if (!signal.aborted) console.error('La conexión de eventos se interrumpió; se reintentará', error)
  }
  if (signal.aborted) return
  control = null
  setTimeout(() => oyentes.size > 0 && !control && abrir(), 3000)
}

function abrir() {
  const token = leerSesion()?.token
  if (token) conectar(token)
}

export function alCambiar(funcion) {
  oyentes.add(funcion)
  if (!control) abrir()
  return () => {
    oyentes.delete(funcion)
    if (oyentes.size === 0) {
      control?.abort()
      control = null
    }
  }
}
