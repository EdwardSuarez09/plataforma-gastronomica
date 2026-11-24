import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Aviso, Campo } from '../../components/ui.jsx'
import { iniciarSesion, registrarse } from './authService.js'

function Formulario({ titulo, boton, accion, conNombre, pie }) {
  const navegar = useNavigate()
  const [datos, setDatos] = useState({ nombre: '', correo: '', contrasena: '' })
  const [error, setError] = useState('')
  const cambiar = (campo) => (e) => setDatos({ ...datos, [campo]: e.target.value })

  const enviar = async (e) => {
    e.preventDefault()
    try {
      await accion(datos)
      navegar('/')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="acceso-pagina">
      <form className="tarjeta angosta" onSubmit={enviar}>
        <div className="marca">Sazón<small>Plataforma gastronómica</small></div>
        <h1>{titulo}</h1>
        <Aviso>{error}</Aviso>
        {conNombre && <Campo etiqueta="Nombre" value={datos.nombre} onChange={cambiar('nombre')} required />}
        <Campo etiqueta="Correo" type="email" value={datos.correo} onChange={cambiar('correo')} required />
        <Campo etiqueta="Contraseña" type="password" value={datos.contrasena} onChange={cambiar('contrasena')} required />
        <button>{boton}</button>
        {pie}
      </form>
    </div>
  )
}

const Login = () => (
  <Formulario
    titulo="Iniciar sesión" boton="Entrar" accion={iniciarSesion}
    pie={<p>¿No tienes cuenta? <Link to="/registro">Regístrate</Link></p>}
  />
)

const Registro = () => (
  <Formulario
    titulo="Crear cuenta" boton="Registrarme" accion={registrarse} conNombre
    pie={<p>¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>}
  />
)

export default [
  { ruta: '/login', titulo: 'Iniciar sesión', publica: true, Componente: Login },
  { ruta: '/registro', titulo: 'Crear cuenta', publica: true, Componente: Registro },
]
