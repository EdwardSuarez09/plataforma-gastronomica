import { randomUUID } from 'node:crypto'
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { ErrorApi } from '../../middleware/errores.js'

// Carpeta global para usuarios y negocios; una carpeta por negocio para lo demás.
const base = () => process.env.DATA_DIR || join(import.meta.dirname, '../../data')
const rutaDe = (ambito, coleccion) =>
  ambito === 'global'
    ? join(base(), 'global', `${coleccion}.json`)
    : join(base(), 'negocios', ambito, `${coleccion}.json`)

const colas = new Map()

async function leerArchivo(ruta) {
  let texto
  try {
    texto = await readFile(ruta, 'utf8')
  } catch (e) {
    if (e.code === 'ENOENT') return []
    throw e
  }
  try {
    return JSON.parse(texto)
  } catch {
    await copyFile(ruta, `${ruta}.bak`)
    throw new ErrorApi(503, 'El archivo de datos está dañado. Se guardó una copia .bak')
  }
}

// Las operaciones sobre un mismo archivo se ejecutan una detrás de otra.
function enCola(ruta, tarea) {
  const turno = (colas.get(ruta) ?? Promise.resolve()).then(tarea)
  colas.set(ruta, turno.catch(() => {}))
  return turno
}

export function listar(ambito, coleccion) {
  const ruta = rutaDe(ambito, coleccion)
  return enCola(ruta, () => leerArchivo(ruta))
}

// Lee, deja que `cambio` modifique la lista y guarda, todo en un solo turno de la cola.
export function transformar(ambito, coleccion, cambio) {
  const ruta = rutaDe(ambito, coleccion)
  return enCola(ruta, async () => {
    const lista = await leerArchivo(ruta)
    const resultado = await cambio(lista)
    await mkdir(dirname(ruta), { recursive: true })
    await writeFile(ruta, JSON.stringify(lista, null, 2))
    return resultado
  })
}

export async function obtener(ambito, coleccion, id) {
  const registro = (await listar(ambito, coleccion)).find((r) => r.id === id)
  if (!registro) throw new ErrorApi(404, 'Registro no encontrado')
  return registro
}

export function crear(ambito, coleccion, datos) {
  return transformar(ambito, coleccion, (lista) => {
    const registro = { ...datos, id: randomUUID(), creadoEn: new Date().toISOString() }
    if (ambito !== 'global') registro.negocioId = ambito
    lista.push(registro)
    return registro
  })
}

export function editar(ambito, coleccion, id, cambios) {
  return transformar(ambito, coleccion, (lista) => {
    const registro = lista.find((r) => r.id === id)
    if (!registro) throw new ErrorApi(404, 'Registro no encontrado')
    const { id: _id, negocioId: _negocio, creadoEn: _creado, ...permitidos } = cambios
    return Object.assign(registro, permitidos, { actualizadoEn: new Date().toISOString() })
  })
}

export function eliminar(ambito, coleccion, id) {
  return transformar(ambito, coleccion, (lista) => {
    const i = lista.findIndex((r) => r.id === id)
    if (i < 0) throw new ErrorApi(404, 'Registro no encontrado')
    lista.splice(i, 1)
  })
}
