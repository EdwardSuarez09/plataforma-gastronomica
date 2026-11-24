import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Aviso, Campo, dinero } from '../../components/ui.jsx'
import { pedir } from '../../services/apiClient.js'

export default function Carrito({ slug, productos, carrito, sumar, vaciar }) {
  const [cliente, setCliente] = useState({ nombre: '', telefono: '' })
  const [nota, setNota] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [pedido, setPedido] = useState(null)

  const lineas = productos.filter((p) => carrito[p.id] > 0).map((p) => ({ ...p, cantidad: carrito[p.id] }))
  const total = lineas.reduce((suma, l) => suma + l.cantidad * l.precio, 0)

  const enviar = async (e) => {
    e.preventDefault()
    if (enviando) return
    setEnviando(true)
    try {
      const items = lineas.map(({ id, cantidad }) => ({ productoId: id, cantidad }))
      setPedido(await pedir(`/publico/${slug}/pedidos`, { metodo: 'POST', datos: { cliente, items, nota } }))
      vaciar()
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  if (pedido && lineas.length === 0) {
    return (
      <section className="tarjeta carrito" aria-label="Pedido">
        <h2>Pedido {pedido.codigo}</h2>
        <p>Estado: <strong>{pedido.estado.replace('_', ' ')}</strong> · Total: <strong>{dinero(pedido.total)}</strong></p>
        <Link to={`/tienda/${slug}/pedido/${pedido.codigo}`}>Seguir mi pedido</Link>
      </section>
    )
  }
  if (lineas.length === 0) return null
  return (
    <form className="tarjeta carrito" aria-label="Carrito" onSubmit={enviar} noValidate>
      <h2>Tu pedido</h2>
      <Aviso>{error}</Aviso>
      <ul className="lista">
        {lineas.map((l) => (
          <li key={l.id}>
            <span>
              <button type="button" className="secundario" aria-label={`Quitar ${l.nombre}`} onClick={() => sumar(l.id, -1)}>−</button>
              {' '}{l.cantidad} × {l.nombre}
            </span>
            <span>{dinero(l.cantidad * l.precio)}</span>
          </li>
        ))}
      </ul>
      <p className="cifra">Total: <strong>{dinero(total)}</strong></p>
      <Campo etiqueta="Tu nombre" value={cliente.nombre} onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })} />
      <Campo etiqueta="Teléfono" inputMode="tel" value={cliente.telefono} onChange={(e) => setCliente({ ...cliente, telefono: e.target.value })} />
      <Campo etiqueta="Nota (opcional)" value={nota} onChange={(e) => setNota(e.target.value)} />
      <button disabled={enviando}>Hacer pedido</button>
    </form>
  )
}
