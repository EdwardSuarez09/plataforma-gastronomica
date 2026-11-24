import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Aviso, dinero } from '../../components/ui.jsx'
import { pedir } from '../../services/apiClient.js'
import '../pedidos/pedidos.css'

const PASOS = [
  ['recibido', 'Recibido'], ['confirmado', 'Confirmado'], ['en_preparacion', 'En preparación'],
  ['listo', 'Listo para recoger'], ['entregado', 'Entregado'],
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

  if (error && !pedido) return <main><Aviso>{error}</Aviso></main>
  if (!pedido) return null
  const actual = PASOS.findIndex(([estado]) => estado === pedido.estado)
  return (
    <main>
      <Link to={`/tienda/${slug}`}>← Volver a la tienda</Link>
      <h1>Pedido {pedido.codigo}</h1>
      {actual < 0 ? <Aviso>{`El pedido fue ${pedido.estado}.`}</Aviso> : (
        <ol className="pasos">
          {PASOS.map(([estado, texto], i) => (
            <li key={estado} className={i < actual ? 'hecho' : ''} aria-current={i === actual ? 'step' : undefined}>{texto}</li>
          ))}
        </ol>
      )}
      <ul className="lista">{pedido.items.map((i) => <li key={i.productoId}>{i.cantidad} × {i.nombre}</li>)}</ul>
      <p className="cifra">Total: <strong>{dinero(pedido.total)}</strong></p>
    </main>
  )
}

export default { ruta: '/tienda/:slug/pedido/:codigo', titulo: 'Seguimiento', publica: true, Componente: Seguimiento }
