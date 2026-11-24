import bcrypt from 'bcryptjs'
import { Router } from 'express'
import { firmarToken } from '../../middleware/auth.js'
import { exigir } from '../../middleware/errores.js'
import * as repo from '../persistencia/repo.js'
import { validarRegistro } from './validar.js'

const router = Router()
const normalizar = (correo) => String(correo ?? '').trim().toLowerCase()
const MAX_INTENTOS = 5
const BLOQUEO_MS = 10 * 60_000
const intentosFallidos = new Map()
let solicitudesLogin = 0

const sesionDe = (u) => ({
  token: firmarToken({ usuarioId: u.id, negocioId: u.negocioId ?? null, rol: u.rol }),
  usuario: { id: u.id, nombre: u.nombre, correo: u.correo, negocioId: u.negocioId ?? null },
})

function intentosRecientes(correo, ahora = Date.now()) {
  const recientes = (intentosFallidos.get(correo) ?? []).filter((momento) => ahora - momento < BLOQUEO_MS)
  if (recientes.length) intentosFallidos.set(correo, recientes)
  else intentosFallidos.delete(correo)
  return recientes
}

router.post('/registro', async (req, res) => {
  const error = validarRegistro(req.body)
  exigir(!error, error)
  const correo = normalizar(req.body.correo)
  const usuarios = await repo.listar('global', 'usuarios')
  exigir(!usuarios.some((u) => u.correo === correo), 'Este correo ya está registrado', 409)
  const usuario = await repo.crear('global', 'usuarios', {
    nombre: req.body.nombre.trim(),
    correo,
    hash: await bcrypt.hash(req.body.contrasena, 10),
    rol: 'propietario',
  })
  res.status(201).json(sesionDe(usuario))
})

router.post('/login', async (req, res) => {
  const correo = normalizar(req.body?.correo)
  const recientes = intentosRecientes(correo)
  exigir(
    recientes.length < MAX_INTENTOS,
    'Demasiados intentos. Espera 10 minutos e inténtalo de nuevo.',
    429,
  )

  solicitudesLogin += 1
  if (solicitudesLogin % 100 === 0) {
    const ahora = Date.now()
    for (const [email, momentos] of intentosFallidos) {
      if (!momentos.some((momento) => ahora - momento < BLOQUEO_MS)) intentosFallidos.delete(email)
    }
  }

  const usuario = (await repo.listar('global', 'usuarios')).find((u) => u.correo === correo)
  const valida = usuario && (await bcrypt.compare(String(req.body?.contrasena ?? ''), usuario.hash))
  if (!valida) {
    intentosFallidos.set(correo, [...intentosRecientes(correo), Date.now()])
  }
  exigir(valida, 'Correo o contraseña incorrectos', 401)
  intentosFallidos.delete(correo)
  res.json(sesionDe(usuario))
})

export default { ruta: '/api/auth', router, orden: 1 }
