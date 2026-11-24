import { AsyncLocalStorage } from 'node:async_hooks'
import { randomUUID } from 'node:crypto'
import { EventEmitter } from 'node:events'
import { copyFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { ErrorApi } from '../../middleware/errores.js'

// Única capa que conoce la base de datos. Antes eran archivos JSON (HU-14); al migrar a
// SQLite no cambió ningún otro módulo, porque todos usan estas mismas funciones.
const ESQUEMA = `
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS registros (
    ambito    TEXT NOT NULL, -- 'global' o el id del negocio
    coleccion TEXT NOT NULL,
    id        TEXT NOT NULL,
    datos     TEXT NOT NULL CHECK (json_valid(datos)),
    PRIMARY KEY (ambito, coleccion, id)
  );`

export const cambios = new EventEmitter().setMaxListeners(0)

const carpeta = () => process.env.DATA_DIR || join(import.meta.dirname, '../../data')
export const archivo = () => join(carpeta(), 'sazon.db')

let conexion
function bd() {
  if (conexion) return conexion
  mkdirSync(carpeta(), { recursive: true })
  const nueva = new DatabaseSync(archivo())
  try {
    nueva.exec(ESQUEMA)
  } catch {
    nueva.close()
    copyFileSync(archivo(), `${archivo()}.bak`)
    throw new ErrorApi(503, 'La base de datos está dañada. Se guardó una copia .bak')
  }
  conexion = nueva
  return conexion
}

export function cerrar() {
  conexion?.close()
  conexion = undefined
}

// Las operaciones van en fila; lo que ocurre dentro de una transacción usa el mismo turno.
const enTurno = new AsyncLocalStorage()
let fila = Promise.resolve()

function esperarTurno(tarea) {
  if (enTurno.getStore()) return Promise.resolve().then(tarea)
  const turno = fila.then(() => enTurno.run(new Map(), tarea))
  fila = turno.catch(() => {})
  return turno
}

function anotar(ambito, coleccion) {
  const tocados = enTurno.getStore()
  tocados.set(ambito, (tocados.get(ambito) ?? new Set()).add(coleccion))
}

function avisar(cambio) {
  for (const listener of cambios.rawListeners('cambio')) {
    try {
      listener.call(cambios, cambio)
    } catch (error) {
      console.error('No se pudo notificar un cambio guardado', error)
    }
  }
}

// Todo o nada: si la tarea falla, se deshacen todos sus cambios.
export function transaccion(tarea) {
  if (enTurno.getStore()) return Promise.resolve().then(tarea)
  return esperarTurno(async () => {
    bd().exec('BEGIN IMMEDIATE')
    let resultado
    let tocados
    try {
      resultado = await tarea()
      bd().exec('COMMIT')
      tocados = [...enTurno.getStore()]
    } catch (e) {
      bd().exec('ROLLBACK')
      throw e
    }
    enTurno.exit(() => {
      for (const [ambito, colecciones] of tocados) {
        avisar({ ambito, colecciones: [...colecciones] })
      }
    })
    return resultado
  })
}

const leer = (ambito, coleccion) =>
  bd().prepare('SELECT datos FROM registros WHERE ambito = ? AND coleccion = ? ORDER BY rowid')
    .all(ambito, coleccion).map((f) => JSON.parse(f.datos))

const guardar = (ambito, coleccion, registro) => {
  anotar(ambito, coleccion)
  return bd().prepare(`INSERT INTO registros (ambito, coleccion, id, datos) VALUES (?, ?, ?, ?)
    ON CONFLICT DO UPDATE SET datos = excluded.datos`).run(ambito, coleccion, registro.id, JSON.stringify(registro))
}

const borrar = (ambito, coleccion, id) => {
  anotar(ambito, coleccion)
  return bd().prepare('DELETE FROM registros WHERE ambito = ? AND coleccion = ? AND id = ?').run(ambito, coleccion, id)
}

function buscar(ambito, coleccion, id) {
  const fila = bd().prepare('SELECT datos FROM registros WHERE ambito = ? AND coleccion = ? AND id = ?')
    .get(ambito, coleccion, id)
  if (!fila) throw new ErrorApi(404, 'Registro no encontrado')
  return JSON.parse(fila.datos)
}

export const listar = (ambito, coleccion) => esperarTurno(() => leer(ambito, coleccion))
export const obtener = (ambito, coleccion, id) => esperarTurno(() => buscar(ambito, coleccion, id))

export function crear(ambito, coleccion, datos) {
  return transaccion(() => {
    const registro = { ...datos, id: randomUUID(), creadoEn: new Date().toISOString() }
    if (ambito !== 'global') registro.negocioId = ambito
    guardar(ambito, coleccion, registro)
    return registro
  })
}

export function editar(ambito, coleccion, id, cambios) {
  return transaccion(() => {
    const { id: _id, negocioId: _negocio, creadoEn: _creado, ...permitidos } = cambios
    const registro = { ...buscar(ambito, coleccion, id), ...permitidos, actualizadoEn: new Date().toISOString() }
    guardar(ambito, coleccion, registro)
    return registro
  })
}

export function eliminar(ambito, coleccion, id) {
  return transaccion(() => {
    buscar(ambito, coleccion, id)
    borrar(ambito, coleccion, id)
  })
}

// Entrega la lista para modificarla y guarda solo lo que cambió.
export function transformar(ambito, coleccion, cambio) {
  return transaccion(async () => {
    const lista = leer(ambito, coleccion)
    const antes = new Map(lista.map((r) => [r.id, JSON.stringify(r)]))
    const resultado = await cambio(lista)
    for (const r of lista) if (antes.get(r.id) !== JSON.stringify(r)) guardar(ambito, coleccion, r)
    const quedan = new Set(lista.map((r) => r.id))
    for (const id of antes.keys()) if (!quedan.has(id)) borrar(ambito, coleccion, id)
    return resultado
  })
}

export const vaciar = () => transaccion(() => bd().exec('DELETE FROM registros'))
