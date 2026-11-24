import { NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { NegocioProvider, useNegocio } from './context/NegocioContext.jsx'
import RutaProtegida from './modules/acceso/RutaProtegida.jsx'
import { modulos } from './services/modulos.js'
import { cerrarSesion, leerSesion } from './services/sesion.js'

function Navegacion() {
  const navegar = useNavigate()
  const { negocio } = useNegocio()
  const sesion = leerSesion()
  const salir = () => {
    cerrarSesion()
    navegar('/login')
  }
  return (
    <aside className="lateral">
      <div className="marca">Sazón<small>{negocio?.nombre ?? 'Plataforma gastronómica'}</small></div>
      <nav aria-label="Principal">
        {modulos.filter((m) => m.menu).map((m) => (
          <NavLink key={m.ruta} to={m.ruta} end={m.ruta === '/'}>{m.titulo}</NavLink>
        ))}
      </nav>
      {sesion && (
        <div className="pie">
          <span>{sesion.usuario.nombre}</span>
          <button className="secundario" onClick={salir}>Cerrar sesión</button>
        </div>
      )}
    </aside>
  )
}

function Pantalla({ modulo }) {
  const contenido = <modulo.Componente />
  if (modulo.publica) return <div className="publica">{contenido}</div>
  return (
    <RutaProtegida>
      <div className="marco">
        <Navegacion />
        <main>{contenido}</main>
      </div>
    </RutaProtegida>
  )
}

export default function App() {
  useLocation() // vuelve a leer la sesión al cambiar de ruta
  return (
    <NegocioProvider key={leerSesion()?.usuario?.negocioId ?? 'sin-negocio'}>
      <Routes>
        {modulos.map((m) => <Route key={m.ruta} path={m.ruta} element={<Pantalla modulo={m} />} />)}
        <Route path="*" element={<main><h1>Página no encontrada</h1></main>} />
      </Routes>
    </NegocioProvider>
  )
}
