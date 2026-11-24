import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Aviso, Campo, dinero } from '../../components/ui.jsx'
import { pedir } from '../../services/apiClient.js'
import Carrito from '../pedidos/Carrito.jsx'
import { Dibujo, Portada, dibujoDe } from './Dibujo.jsx'
import './tienda.css'

function Producto({ producto: p, cantidad, sumar }) {
  return (
    <article className={`plato ${p.agotado ? 'agotado' : ''}`}>
      <div className="plato-dibujo"><Dibujo nombre={dibujoDe(p.nombre, p.categoria)} /></div>
      <div className="plato-cuerpo">
        <strong>{p.nombre}</strong>
        {p.descripcion && <span>{p.descripcion}</span>}
        <div className="plato-pie">
          <b>{dinero(p.precio)}</b>
          {p.agotado ? <em className="chip">Agotado por hoy</em> : (
            <div className="contador">
              {cantidad > 0 && (
                <>
                  <button className="secundario" aria-label={`Restar ${p.nombre}`} onClick={() => sumar(p.id, -1)}>−</button>
                  <output aria-label={`Cantidad de ${p.nombre}`}>{cantidad}</output>
                </>
              )}
              <button className={cantidad > 0 ? '' : 'secundario'} onClick={() => sumar(p.id, 1)} aria-label={`Agregar ${p.nombre}`}>
                {cantidad > 0 ? '+' : 'Agregar'}
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

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
  if (!menu) return <main><p className="vacio" role="status">Cargando menú…</p></main>
  const { negocio, productos } = menu
  const categoriaDe = (p) => p.categoria || 'General'
  const categorias = [...new Set(productos.map(categoriaDe))]
  const visibles = productos.filter((p) =>
    (!categoria || categoriaDe(p) === categoria) && p.nombre.toLowerCase().includes(texto.trim().toLowerCase()))
  const unidades = Object.values(carrito).reduce((a, b) => a + b, 0)
  const total = productos.reduce((suma, p) => suma + p.precio * (carrito[p.id] ?? 0), 0)
  return (
    <main className="tienda">
      <Link to="/tiendas" className="volver">← Todas las tiendas</Link>
      <header className="tienda-portada">
        <div className="tienda-datos">
          <p className="etiquetas"><span>{negocio.tipo}</span><span>{negocio.ciudad}</span></p>
          <h1>{negocio.nombre}</h1>
          {negocio.descripcion && <p>{negocio.descripcion}</p>}
          <p className="tienda-recoge">
            Pide aquí y recoge en el local.
            {negocio.telefono && <> <a href={`tel:${negocio.telefono}`}>Llamar: {negocio.telefono}</a></>}
          </p>
        </div>
        <Portada tipo={negocio.tipo} />
      </header>

      {productos.length === 0 && <div className="vacio-caja"><strong>Esta tienda aún no tiene productos.</strong><p>Vuelve pronto o mira otros negocios.</p></div>}
      {productos.length > 1 && (
        <div className="tienda-filtros">
          <Campo etiqueta="Buscar" type="search" placeholder="Nombre del producto" value={texto} onChange={(e) => setTexto(e.target.value)} />
          {categorias.length > 1 && (
            <div className="categorias" role="group" aria-label="Categorías">
              {['', ...categorias].map((c) => (
                <button key={c} aria-pressed={c === categoria} onClick={() => setCategoria(c)}>{c || 'Todo'}</button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="tienda-cuerpo">
        <div>
          <div className="platos">
            {visibles.map((p) => <Producto key={p.id} producto={p} cantidad={carrito[p.id] ?? 0} sumar={sumar} />)}
          </div>
          {visibles.length === 0 && productos.length > 0 && <p className="vacio">No hay productos con ese filtro.</p>}
        </div>
        <div id="pedido">
          <Carrito slug={slug} productos={productos} carrito={carrito} sumar={sumar} vaciar={() => setCarrito({})} />
        </div>
      </div>
      {unidades > 0 && <a href="#pedido" className="barra-pedido">Ver pedido ({unidades}) · {dinero(total)}</a>}
    </main>
  )
}
