import { NavLink, Route, Routes } from 'react-router-dom'
import { modulos } from './services/modulos.js'

function Navegacion() {
  return (
    <aside className="lateral">
      <div className="marca">Sazón<small>Plataforma gastronómica</small></div>
      <nav aria-label="Principal">
        {modulos.filter((m) => m.menu).map((m) => (
          <NavLink key={m.ruta} to={m.ruta} end={m.ruta === '/'}>{m.titulo}</NavLink>
        ))}
      </nav>
    </aside>
  )
}

function Pantalla({ modulo }) {
  const contenido = <modulo.Componente />
  if (modulo.publica) return <div className="publica">{contenido}</div>
  return (
    <div className="marco">
      <Navegacion />
      <main>{contenido}</main>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      {modulos.map((m) => <Route key={m.ruta} path={m.ruta} element={<Pantalla modulo={m} />} />)}
      <Route path="*" element={<main><h1>Página no encontrada</h1></main>} />
    </Routes>
  )
}
