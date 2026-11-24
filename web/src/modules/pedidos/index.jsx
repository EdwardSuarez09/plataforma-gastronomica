import { useState } from 'react'
import { Aviso, Encabezado, dinero } from '../../components/ui.jsx'
import { pedir } from '../../services/apiClient.js'
import { useDatos } from '../../services/useDatos.js'

// Estado -> botones que se muestran.
const ACCIONES = {
  recibido: [['confirmado', 'Confirmar'], ['rechazado', 'Rechazar']],
  confirmado: [['en_preparacion', 'Preparar'], ['cancelado', 'Cancelar']],
  en_preparacion: [['listo', 'Marcar listo'], ['cancelado', 'Cancelar']],
  listo: [['entregado', 'Entregar']],
}
const EXIGEN_MOTIVO = ['rechazado', 'cancelado']

function Pedidos() {
  const { datos, error, recargar } = useDatos('pedidos')
  const [fallo, setFallo] = useState('')
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

  const pedidos = [...datos.pedidos].sort((a, b) => b.creadoEn.localeCompare(a.creadoEn))
  return (
    <>
      <Encabezado titulo="Pedidos de la tienda">Al entregar un pedido se registra como venta.</Encabezado>
      <Aviso>{fallo}</Aviso>
      <button className="secundario" onClick={recargar}>Actualizar</button>
      {pedidos.length === 0 && <p className="vacio">Aún no hay pedidos. Comparte el enlace de tu tienda.</p>}
      <div className="rejilla">
        {pedidos.map((p) => (
          <article key={p.id} className="tarjeta pedido">
            <div className="fila">
              <strong>{p.codigo}</strong>
              <span className={`estado ${p.estado}`}>{p.estado.replace('_', ' ')}</span>
            </div>
            <span>{p.cliente.nombre} · {p.cliente.telefono}</span>
            <ul className="lista">{p.items.map((i) => <li key={i.productoId}>{i.cantidad} × {i.nombre}</li>)}</ul>
            {p.nota && <em>“{p.nota}”</em>}
            <b>{dinero(p.total)}</b>
            <div className="acciones">
              {(ACCIONES[p.estado] ?? []).map(([estado, texto]) => (
                <button
                  key={estado} className={EXIGEN_MOTIVO.includes(estado) ? 'peligro' : ''}
                  onClick={() => cambiar(p, estado)}
                >
                  {texto}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </>
  )
}

export default {
  ruta: '/pedidos', titulo: 'Pedidos', resumen: 'Pedidos de tu tienda', orden: 5, menu: true, Componente: Pedidos,
}
