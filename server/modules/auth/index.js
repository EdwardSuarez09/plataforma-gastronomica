import bcrypt from 'bcryptjs'
import { Router } from 'express'
import { firmarToken } from '../../middleware/auth.js'
import { exigir } from '../../middleware/errores.js'
import * as repo from '../persistencia/repo.js'
import { validarRegistro } from './validar.js'

const router = Router()
const normalizar = (correo) => String(correo ?? '').trim().toLowerCase()

const sesionDe = (u) => ({
  token: firmarToken({ usuarioId: u.id, negocioId: u.negocioId ?? null, rol: u.rol }),
  usuario: { id: u.id, nombre: u.nombre, correo: u.correo, negocioId: u.negocioId ?? null },
})

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
  const usuario = (await repo.listar('global', 'usuarios')).find((u) => u.correo === correo)
  const valida = usuario && (await bcrypt.compare(String(req.body.contrasena ?? ''), usuario.hash))
  exigir(valida, 'Correo o contraseña incorrectos', 401)
  res.json(sesionDe(usuario))
})

export default { ruta: '/api/auth', router, orden: 1 }
