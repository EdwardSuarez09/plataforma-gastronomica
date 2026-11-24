import { useId, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Aviso } from '../../components/ui.jsx'
import { iniciarSesion, registrarse } from './authService.js'
import { NIVELES, correoValido, fuerza } from './fuerza.js'
import Presentacion from './Presentacion.jsx'
import './acceso.css'

const ICONOS = {
  persona: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 8c0-3.5 3.6-5.5 8-5.5s8 2 8 5.5',
  correo: 'M3 6h18v12H3V6Zm0 1 9 7 9-7',
  clave: 'M6 11h12v9H6v-9Zm2 0V8a4 4 0 0 1 8 0v3m-4 4v2',
  ojo: 'M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  listo: 'm5 13 4 4L19 7',
}
const Dibujado = ({ nombre }) => <svg viewBox="0 0 24 24" aria-hidden="true"><path d={ICONOS[nombre]} /></svg>

function Caja({ etiqueta, icono, correcto, children, ...props }) {
  const id = useId()
  return (
    <div className={`caja-campo ${correcto ? 'correcto' : ''}`}>
      <label htmlFor={id}>{etiqueta}</label>
      <div className="caja">
        <Dibujado nombre={icono} />
        <input id={id} required {...props} />
        {children ?? (correcto && <span className="visto"><Dibujado nombre="listo" /></span>)}
      </div>
    </div>
  )
}

function Fuerza({ clave }) {
  const nivel = fuerza(clave)
  return (
    <div className={`fuerza nivel-${nivel}`}>
      <div aria-hidden="true">{NIVELES.slice(1).map((n, i) => <i key={n} className={i < nivel ? 'llena' : ''} />)}</div>
      <small role="status">{clave ? `Contraseña ${NIVELES[nivel]}` : 'Mínimo 8 caracteres.'}</small>
    </div>
  )
}

function Formulario({ titulo, saludo, boton, espera, accion, conNombre, pie }) {
  const navegar = useNavigate()
  const { state } = useLocation()
  const [datos, setDatos] = useState({ nombre: '', correo: '', contrasena: '' })
  const [visible, setVisible] = useState(false)
  const [mayusculas, setMayusculas] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const cambiar = (campo) => (e) => setDatos({ ...datos, [campo]: e.target.value })

  const enviar = async (e) => {
    e.preventDefault()
    if (enviando) return
    setEnviando(true)
    setError('')
    try {
      await accion(datos)
      navegar('/')
    } catch (err) {
      setError(err.message)
      setEnviando(false)
    }
  }

  return (
    <div className="entrada">
      <Presentacion />
      <div className="entrada-lado">
        <form className={`entrada-formulario ${error ? 'con-error' : ''}`} onSubmit={enviar}>
          <div className="entrada-cabeza">
            <img src="/logo.svg" alt="" />
            <div>
              <h1>{titulo}</h1>
              <p>{saludo}</p>
            </div>
          </div>
          <nav className="pestanas" aria-label="Acceso">
            <Link to="/login" aria-current={conNombre ? undefined : 'page'}>Ya tengo cuenta</Link>
            <Link to="/registro" aria-current={conNombre ? 'page' : undefined}>Soy nuevo</Link>
          </nav>
          {state?.vencida && !error && <Aviso tipo="ok">Tu sesión venció. Entra de nuevo para continuar.</Aviso>}
          <Aviso>{error}</Aviso>
          {conNombre && (
            <Caja etiqueta="Nombre" icono="persona" autoComplete="name" placeholder="Cómo te llamas" correcto={datos.nombre.trim().length > 1} value={datos.nombre} onChange={cambiar('nombre')} />
          )}
          <Caja
            etiqueta="Correo" icono="correo" type="email" autoComplete="email" placeholder="tucorreo@ejemplo.com"
            correcto={correoValido(datos.correo)} value={datos.correo} onChange={cambiar('correo')}
          />
          <Caja
            etiqueta="Contraseña" icono="clave" type={visible ? 'text' : 'password'} autoComplete={conNombre ? 'new-password' : 'current-password'}
            value={datos.contrasena} onChange={cambiar('contrasena')} onKeyUp={(e) => setMayusculas(e.getModifierState?.('CapsLock') ?? false)}
          >
            <button type="button" className="ojo" aria-label="Mostrar contraseña" aria-pressed={visible} onClick={() => setVisible(!visible)}>
              <Dibujado nombre="ojo" />
            </button>
          </Caja>
          {mayusculas && <small className="mayusculas" role="status">Tienes activadas las mayúsculas.</small>}
          {conNombre && <Fuerza clave={datos.contrasena} />}
          <button className="entrar" disabled={enviando}>{enviando ? <><span className="girando" aria-hidden="true" />{espera}</> : boton}</button>
          <div className="entrada-pie">
            {pie}
            <p>¿Solo quieres comprar? <Link to="/tiendas">Ver tiendas</Link></p>
          </div>
        </form>
      </div>
    </div>
  )
}

const Login = () => (
  <Formulario
    key="login" titulo="Iniciar sesión" saludo="Qué bueno verte de nuevo." boton="Entrar" espera="Entrando…" accion={iniciarSesion}
    pie={<p>¿No tienes cuenta? <Link to="/registro">Regístrate</Link></p>}
  />
)

const Registro = () => (
  <Formulario
    key="registro" titulo="Crear cuenta" saludo="Abre tu tienda en pocos minutos." boton="Registrarme" espera="Creando tu cuenta…" accion={registrarse} conNombre
    pie={<p>¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>}
  />
)

export default [
  { ruta: '/login', titulo: 'Iniciar sesión', publica: true, sinBarra: true, Componente: Login },
  { ruta: '/registro', titulo: 'Crear cuenta', publica: true, sinBarra: true, Componente: Registro },
]
