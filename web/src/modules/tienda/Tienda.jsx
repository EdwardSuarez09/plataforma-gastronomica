import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Aviso, Campo, dinero } from '../../components/ui.jsx'
import { pedir } from '../../services/apiClient.js'
import Carrito from '../pedidos/Carrito.jsx'

export default function Tienda() {
  const { slug } = useParams()
  const [menu, setMenu] = useState(null)
  const [error, setError] = useState('')
  const [carrito, setCarrito] = useState({})
  const [categoria, setCategoria] = useState('')
  const [texto, setTexto] = useState('')

  useEffect(() => {
    pedir(`/publico/${slug}/menu`).then(setMenu).catch((e) => setError(e.message))
  }, [slug])

  const sumar = (id, n) => setCarrito((c) => ({ ...c, [id]: Math.max(0, (c[id] ?? 0) + n) }))

  if (error) return <main><Aviso>{error}</Aviso><Link to="/tiendas">Ver todas las tiendas</Link></main>
  if (!menu) return null
  const { negocio, productos } = menu
  const categorias = [...new Set(productos.map((p) => p.categoria ?? 'General'))]
  const visibles = productos.filter((p) =>
    (!categoria || (p.categoria ?? 'General') === categoria) && p.nombre.toLowerCase().includes(texto.trim().toLowerCase()))
  const unidades = Object.values(carrito).reduce((a, b) => a + b, 0)
  const total = productos.reduce((suma, p) => suma + p.precio * (carrito[p.id] ?? 0), 0)
  return (
    <main>
      <Link to="/tiendas">← Todas las tiendas</Link>
      <header className="portada">
        <p>{negocio.tipo} · {negocio.ciudad}</p>
        <h1>{negocio.nombre}</h1>
        <p>{negocio.descripcion}</p>
        {negocio.telefono && <p><a href={`tel:${negocio.telefono}`} style={{ color: 'inherit' }}>Llamar: {negocio.telefono}</a></p>}
      </header>
      {productos.length === 0 && <p className="vacio">Esta tienda aún no tiene productos.</p>}
      {productos.length > 1 && (
        <div className="filtros-menu">
          <Campo etiqueta="Buscar" type="search" value={texto} onChange={(e) => setTexto(e.target.value)} />
          {categorias.length > 1 && ['', ...categorias].map((c) => (
            <button key={c} className={c === categoria ? '' : 'secundario'} aria-pressed={c === categoria} onClick={() => setCategoria(c)}>
              {c || 'Todo'}
            </button>
          ))}
        </div>
      )}
      <div className="rejilla">
        {visibles.map((p) => (
          <article key={p.id} className="tarjeta producto">
            <strong>{p.nombre}</strong>
            <span>{p.descripcion}</span>
            <div className="fila">
              <b>{dinero(p.precio)}</b>
              {p.agotado ? <em>Agotado por hoy</em> : (
                <button className="secundario" onClick={() => sumar(p.id, 1)} aria-label={`Agregar ${p.nombre}`}>
                  {carrito[p.id] > 0 ? `Agregar (${carrito[p.id]})` : 'Agregar'}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
      {visibles.length === 0 && productos.length > 0 && <p className="vacio">No hay productos con ese filtro.</p>}
      <div id="pedido">
        <Carrito slug={slug} productos={productos} carrito={carrito} sumar={sumar} vaciar={() => setCarrito({})} />
      </div>
      {unidades > 0 && <a href="#pedido" className="barra-pedido">Ver pedido ({unidades}) · {dinero(total)}</a>}
    </main>
  )
}
