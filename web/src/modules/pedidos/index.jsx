import { useState } from 'react'
import { Aviso, Encabezado, dinero } from '../../components/ui.jsx'
import { pedir } from '../../services/apiClient.js'
import { useDatos } from '../../services/useDatos.js'
import './pedidos.css'

const COLUMNAS = [
  ['recibido', 'Recibidos'], ['confirmado', 'Confirmados'], ['en_preparacion', 'En preparación'], ['listo', 'Listos'],
]
// Estado -> botones que se muestran.
const ACCIONES = {
  recibido: [['confirmado', 'Confirmar'], ['rechazado', 'Rechazar']],
  confirmado: [['en_preparacion', 'Preparar'], ['cancelado', 'Cancelar']],
  en_preparacion: [['listo', 'Marcar listo'], ['cancelado', 'Cancelar']],
  listo: [['entregado', 'Entregar']],
}
const EXIGEN_MOTIVO = ['rechazado', 'cancelado']

function Tarjeta({ pedido: p, cambiar }) {
  return (
    <article className="tarjeta">
      <strong>{p.codigo}</strong>
      <span>{p.cliente.nombre} · <a href={`tel:${p.cliente.telefono}`}>{p.cliente.telefono}</a></span>
      <ul className="lista">{p.items.map((i) => <li key={i.productoId}>{i.cantidad} × {i.nombre}</li>)}</ul>
      {p.nota && <em>“{p.nota}”</em>}
      <b>{dinero(p.total)}</b>
      {!ACCIONES[p.estado] && <span className={`estado ${p.estado}`}>{p.estado}</span>}
      <div className="acciones">
        {(ACCIONES[p.estado] ?? []).map(([estado, texto]) => (
          <button key={estado} className={EXIGEN_MOTIVO.includes(estado) ? 'peligro' : ''} onClick={() => cambiar(p, estado)}>{texto}</button>
        ))}
      </div>
    </article>
  )
}

function Pedidos() {
  const { datos, error, recargar } = useDatos('pedidos')
  const [fallo, setFallo] = useState('')
  const [verTerminados, setVerTerminados] = useState(false)
  if (!datos) return <Aviso>{error}</Aviso>

  const cambiar = async (pedido, estado) => {
    let motivo
    if (EXIGEN_MOTIVO.includes(estado)) {
      motivo = window.prompt('¿Cuál es el motivo?')
      if (!motivo) return
    }
    try {
      await pedir(`/pedidos/${pedido.id}/estado`, { metodo: 'PATCH', datos: { estado, motivo } })
      setFallo('')
      await recargar()
    } catch (e) {
      setFallo(e.message)
    }
  }

  // Los activos, del más antiguo al más nuevo: se atiende primero al que más ha esperado.
  const activos = [...datos.pedidos].sort((a, b) => a.creadoEn.localeCompare(b.creadoEn))
  const terminados = activos.filter((p) => !ACCIONES[p.estado]).reverse()
  return (
    <>
      <Encabezado titulo="Pedidos de la tienda">Al entregar un pedido se registra como venta y descuenta los insumos.</Encabezado>
      <Aviso>{fallo}</Aviso>
      {datos.pedidos.length === 0 && <p className="vacio">Aún no hay pedidos. Comparte el enlace de tu tienda.</p>}
      <div className="columnas">
        {COLUMNAS.map(([estado, titulo]) => {
          const lista = activos.filter((p) => p.estado === estado)
          return (
            <section key={estado}>
              <h2>{titulo} ({lista.length})</h2>
              {lista.map((p) => <Tarjeta key={p.id} pedido={p} cambiar={cambiar} />)}
            </section>
          )
        })}
      </div>
      {terminados.length > 0 && (
        <button className="secundario" onClick={() => setVerTerminados(!verTerminados)}>
          {verTerminados ? 'Ocultar terminados' : `Ver terminados (${terminados.length})`}
        </button>
      )}
      {verTerminados && <div className="rejilla">{terminados.map((p) => <Tarjeta key={p.id} pedido={p} cambiar={cambiar} />)}</div>}
    </>
  )
}

export default {
  ruta: '/pedidos', titulo: 'Pedidos', resumen: 'Pedidos de tu tienda', orden: 5, menu: true, Componente: Pedidos,
}
