import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Aviso, dinero } from '../../components/ui.jsx'
import { pedir } from '../../services/apiClient.js'
import Carrito from '../pedidos/Carrito.jsx'

export default function Tienda() {
  const { slug } = useParams()
  const [menu, setMenu] = useState(null)
  const [error, setError] = useState('')
  const [carrito, setCarrito] = useState({})

  useEffect(() => {
    pedir(`/publico/${slug}/menu`).then(setMenu).catch((e) => setError(e.message))
  }, [slug])

  const sumar = (id, n) => setCarrito((c) => ({ ...c, [id]: Math.max(0, (c[id] ?? 0) + n) }))

  if (error) return <main><Aviso>{error}</Aviso><Link to="/tiendas">Ver todas las tiendas</Link></main>
  if (!menu) return null
  const { negocio, productos } = menu
  return (
    <main>
      <Link to="/tiendas">← Todas las tiendas</Link>
      <header className="portada">
        <p>{negocio.tipo} · {negocio.ciudad}</p>
        <h1>{negocio.nombre}</h1>
        <p>{negocio.descripcion}</p>
      </header>
      {productos.length === 0 && <p className="vacio">Esta tienda aún no tiene productos.</p>}
      <div className="rejilla">
        {productos.map((p) => (
          <article key={p.id} className="tarjeta producto">
            <strong>{p.nombre}</strong>
            <span>{p.descripcion}</span>
            <div className="fila">
              <b>{dinero(p.precio)}</b>
              {p.agotado ? <em>Agotado por hoy</em> : (
                <button className="secundario" onClick={() => sumar(p.id, 1)} aria-label={`Agregar ${p.nombre}`}>Agregar</button>
              )}
            </div>
          </article>
        ))}
      </div>
      <Carrito slug={slug} productos={productos} carrito={carrito} sumar={sumar} vaciar={() => setCarrito({})} />
    </main>
  )
}
