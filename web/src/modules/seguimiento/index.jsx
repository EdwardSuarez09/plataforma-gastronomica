import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Aviso, dinero } from '../../components/ui.jsx'
import { pedir } from '../../services/apiClient.js'
import '../pedidos/pedidos.css'

const PASOS = [
  ['recibido', 'Recibido', 'El negocio recibió tu pedido y pronto lo confirma.'],
  ['confirmado', 'Confirmado', 'Tu pedido está confirmado. Pronto empiezan a prepararlo.'],
  ['en_preparacion', 'En preparación', 'Lo están preparando en la cocina.'],
  ['listo', 'Listo para recoger', 'Ya puedes pasar por él. Muestra tu código.'],
  ['entregado', 'Entregado', '¡Que lo disfrutes!'],
]
const CADA_MS = 5000

function Seguimiento() {
  const { slug, codigo } = useParams()
  const [pedido, setPedido] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const consultar = () =>
      pedir(`/publico/${slug}/pedidos/${codigo}`).then(setPedido).catch((e) => setError(e.message))
    consultar()
    const reloj = setInterval(consultar, CADA_MS)
    return () => clearInterval(reloj)
  }, [slug, codigo])

  if (error && !pedido) return <main><Aviso>{error}</Aviso><Link to={`/tienda/${slug}`}>Volver a la tienda</Link></main>
  if (!pedido) return <main><p className="vacio" role="status">Buscando tu pedido…</p></main>
  const actual = PASOS.findIndex(([estado]) => estado === pedido.estado)
  return (
    <main className="seguimiento">
      <Link to={`/tienda/${slug}`}>← Volver a la tienda</Link>
      <h1>Pedido {pedido.codigo}</h1>
      {actual < 0 ? <Aviso>{`El pedido fue ${pedido.estado}.`}</Aviso> : <p className="mensaje" role="status">{PASOS[actual][2]}</p>}
      <div className="seguimiento-paneles">
        {actual >= 0 && (
          <section className="tarjeta">
            <ol className="pasos">
              {PASOS.map(([estado, texto], i) => (
                <li key={estado} className={i < actual ? 'hecho' : ''} aria-current={i === actual ? 'step' : undefined}>{texto}</li>
              ))}
            </ol>
          </section>
        )}
        <section className="tarjeta">
          <h2>Lo que pediste</h2>
          <ul className="lista">{pedido.items.map((i) => <li key={i.productoId}>{i.cantidad} × {i.nombre}</li>)}</ul>
          <p className="carrito-total">Total <strong>{dinero(pedido.total)}</strong></p>
        </section>
      </div>
      <p className="explica">Esta página se actualiza sola. Puedes cerrarla y volver con el mismo enlace.</p>
    </main>
  )
}

export default { ruta: '/tienda/:slug/pedido/:codigo', titulo: 'Seguimiento', publica: true, Componente: Seguimiento }
