import { Link } from 'react-router-dom'
import { Encabezado } from '../../components/ui.jsx'
import { modulos } from '../../services/modulos.js'

function Inicio() {
  return (
    <>
      <Encabezado titulo="Panel del negocio">Elige qué quieres gestionar hoy.</Encabezado>
      <nav className="rejilla" aria-label="Accesos">
        {modulos.filter((m) => m.menu && m.ruta !== '/').map((m) => (
          <Link key={m.ruta} to={m.ruta} className="tarjeta acceso">
            <strong>{m.titulo}</strong>
            <span>{m.resumen}</span>
          </Link>
        ))}
      </nav>
    </>
  )
}

export default { ruta: '/', titulo: 'Inicio', orden: 0, menu: true, Componente: Inicio }
