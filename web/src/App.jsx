import { useEffect, useState } from 'react'
import { Link, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import Guia from './components/Guia.jsx'
import Icono from './components/Icono.jsx'
import { Marca } from './components/Logo.jsx'
import { NegocioProvider, useNegocio } from './context/NegocioContext.jsx'
import RutaProtegida from './modules/acceso/RutaProtegida.jsx'
import { modulos } from './services/modulos.js'
import { cerrarSesion, leerSesion } from './services/sesion.js'

// El orden de cada módulo decide su grupo en el menú.
const GRUPOS = [['Día a día', 0], ['Cocina', 10], ['Dinero', 20], ['Decisiones', 30], ['Mi tienda', 80]]
const menu = modulos.filter((m) => m.menu)
const grupos = GRUPOS.map(([nombre, desde], i) => {
  const hasta = GRUPOS[i + 1]?.[1] ?? Infinity
  return { nombre, items: menu.filter((m) => m.orden >= desde && m.orden < hasta) }
}).filter((g) => g.items.length > 0)
const grupoDe = (modulo) => grupos.find((g) => g.items.includes(modulo))?.nombre

function Navegacion() {
  const navegar = useNavigate()
  const { negocio } = useNegocio()
  const [abierta, setAbierta] = useState(false)
  const sesion = leerSesion()
  const salir = () => {
    cerrarSesion()
    navegar('/login')
  }
  return (
    <aside className={`lateral ${abierta ? 'abierta' : ''}`}>
      <div className="cabeza">
        <Link to="/" className="marca-enlace"><Marca tamano={42} detalle={negocio?.nombre ?? 'Plataforma gastronómica'} /></Link>
        <button className="abrir-menu" aria-expanded={abierta} onClick={() => setAbierta(!abierta)}>{abierta ? 'Cerrar' : 'Menú'}</button>
      </div>
      <nav aria-label="Principal" onClick={() => setAbierta(false)}>
        {grupos.map((g) => (
          <div key={g.nombre} className="grupo-menu">
            <small>{g.nombre}</small>
            {g.items.map((m) => (
              <NavLink key={m.ruta} to={m.ruta} end={m.ruta === '/'} title={m.resumen}><Icono nombre={m.ruta} />{m.titulo}</NavLink>
            ))}
          </div>
        ))}
      </nav>
      {sesion && (
        <div className="pie">
          <div className="persona">
            <span className="inicial" aria-hidden="true">{sesion.usuario.nombre?.[0]?.toUpperCase()}</span>
            <span>{sesion.usuario.nombre}</span>
          </div>
          <button onClick={salir}>Cerrar sesión</button>
        </div>
      )}
    </aside>
  )
}

function BarraPublica() {
  return (
    <header className="barra-publica">
      <Link to="/tiendas" className="marca-enlace"><Marca tamano={40} /></Link>
      <nav aria-label="Sitio">
        <Link to="/tiendas">Tiendas</Link>
        {leerSesion()?.token ? <Link to="/">Ir a mi panel</Link> : <Link to="/login">Soy un negocio</Link>}
      </nav>
    </header>
  )
}

function Pantalla({ modulo }) {
  const { pathname } = useLocation()
  useEffect(() => {
    document.title = `${modulo.titulo} · Sazonexo`
    window.scrollTo(0, 0)
  }, [modulo, pathname])

  const contenido = <modulo.Componente />
  if (modulo.publica) return <div className="publica">{!modulo.sinBarra && <BarraPublica />}{contenido}</div>
  return (
    <RutaProtegida>
      <div className="marco">
        <Navegacion />
        <main>
          <Guia key={modulo.ruta} modulo={modulo} grupo={grupoDe(modulo)} />
          {contenido}
        </main>
      </div>
    </RutaProtegida>
  )
}

export default function App() {
  useLocation() // vuelve a leer la sesión al cambiar de ruta
  const navegar = useNavigate()
  useEffect(() => {
    const alLogin = () => navegar('/login', { replace: true, state: { vencida: true } })
    window.addEventListener('sesion-vencida', alLogin)
    return () => window.removeEventListener('sesion-vencida', alLogin)
  }, [navegar])
  return (
    <NegocioProvider key={leerSesion()?.usuario?.negocioId ?? 'sin-negocio'}>
      <Routes>
        {modulos.map((m) => <Route key={m.ruta} path={m.ruta} element={<Pantalla modulo={m} />} />)}
        <Route path="*" element={<main className="no-encontrada"><Marca tamano={64} /><h1>Página no encontrada</h1><Link to="/" className="boton">Volver al inicio</Link></main>} />
      </Routes>
    </NegocioProvider>
  )
}
