import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Aviso, Encabezado } from '../../components/ui.jsx'
import { pedir } from '../../services/apiClient.js'
import Tienda from './Tienda.jsx'

function Tiendas() {
  const [tiendas, setTiendas] = useState([])
  const [error, setError] = useState('')
  useEffect(() => {
    pedir('/publico/tiendas').then(setTiendas).catch((e) => setError(e.message))
  }, [])
  return (
    <main>
      <Encabezado titulo="Tiendas">Elige un negocio y mira su menú.</Encabezado>
      <Aviso>{error}</Aviso>
      <div className="rejilla">
        {tiendas.map((t) => (
          <Link key={t.slug} to={`/tienda/${t.slug}`} className="tarjeta acceso">
            <strong>{t.nombre}</strong>
            <span>{t.tipo} · {t.ciudad}</span>
          </Link>
        ))}
      </div>
      <p className="vacio">¿Tienes un negocio? <Link to="/registro">Crea tu tienda</Link></p>
    </main>
  )
}

export default [
  { ruta: '/tiendas', titulo: 'Tiendas', resumen: 'Así te ven los clientes', orden: 80, menu: true, publica: true, Componente: Tiendas },
  { ruta: '/tienda/:slug', titulo: 'Tienda', publica: true, Componente: Tienda },
]
