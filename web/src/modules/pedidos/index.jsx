import { useState } from 'react'
import { Aviso, Encabezado, dinero } from '../../components/ui.jsx'
import { pedir } from '../../services/apiClient.js'
import { useDatos } from '../../services/useDatos.js'
import './pedidos.css'

const COLUMNAS = [
  ['recibido', 'Recibidos', 'Revisa y confirma'],
  ['confirmado', 'Confirmados', 'Insumos reservados'],
  ['en_preparacion', 'En preparación', 'En la cocina'],
  ['listo', 'Listos', 'Esperan al cliente'],
]
// Estado -> botones que se muestran.
const ACCIONES = {
  recibido: [['confirmado', 'Confirmar'], ['rechazado', 'Rechazar']],
  confirmado: [['en_preparacion', 'Preparar'], ['cancelado', 'Cancelar']],
  en_preparacion: [['listo', 'Marcar listo'], ['cancelado', 'Cancelar']],
  listo: [['entregado', 'Entregar']],
}
const EXIGEN_MOTIVO = ['rechazado', 'cancelado']
const MOTIVOS = ['No hay insumos', 'Ya cerramos', 'El cliente no contesta']

export function espera(creadoEn, ahora = Date.now()) {
  const minutos = Math.floor((ahora - new Date(creadoEn).getTime()) / 60000)
  if (!Number.isFinite(minutos) || minutos < 0) return ''
  if (minutos < 1) return 'Ahora mismo'
  if (minutos < 60) return `Hace ${minutos} min`
  const horas = Math.floor(minutos / 60)
  return horas < 24 ? `Hace ${horas} h` : `Hace ${Math.floor(horas / 24)} d`
}

function Motivo({ estado, alConfirmar, alVolver }) {
  const [motivo, setMotivo] = useState('')
  return (
    <form className="motivo" onSubmit={(e) => { e.preventDefault(); if (motivo.trim()) alConfirmar(motivo.trim()) }}>
      <label className="campo"><span>¿Cuál es el motivo?</span><input value={motivo} autoFocus required onChange={(e) => setMotivo(e.target.value)} /></label>
      <div className="acciones">
        {MOTIVOS.map((m) => <button key={m} type="button" className="secundario" onClick={() => setMotivo(m)}>{m}</button>)}
      </div>
      <div className="acciones">
        <button className="peligro" disabled={!motivo.trim()}>{estado === 'rechazado' ? 'Sí, rechazar' : 'Sí, cancelar'}</button>
        <button type="button" className="secundario" onClick={alVolver}>Volver</button>
      </div>
    </form>
  )
}

function Tarjeta({ pedido: p, cambiar }) {
  const [pidiendo, setPidiendo] = useState('')
  const tocar = (estado) => (EXIGEN_MOTIVO.includes(estado) ? setPidiendo(estado) : cambiar(p, estado))
  const activo = Boolean(ACCIONES[p.estado])
  return (
    <article className={`tarjeta pedido ${p.estado}`}>
      <div className="pedido-cabeza"><strong>{p.codigo}</strong>{activo && <small>{espera(p.creadoEn)}</small>}</div>
      <span>{p.cliente.nombre} · <a href={`tel:${p.cliente.telefono}`}>{p.cliente.telefono}</a></span>
      <ul className="lista">{p.items.map((i) => <li key={i.productoId}><span><b>{i.cantidad}</b> × {i.nombre}</span></li>)}</ul>
      {p.nota && <em className="nota">“{p.nota}”</em>}
      <b className="pedido-total">{dinero(p.total)}</b>
      {!activo && <span className={`estado ${p.estado}`}>{p.estado}</span>}
      {pidiendo ? (
        <Motivo estado={pidiendo} alConfirmar={(motivo) => cambiar(p, pidiendo, motivo)} alVolver={() => setPidiendo('')} />
      ) : (
        <div className="acciones">
          {(ACCIONES[p.estado] ?? []).map(([estado, texto]) => (
            <button key={estado} className={EXIGEN_MOTIVO.includes(estado) ? 'peligro' : ''} onClick={() => tocar(estado)}>{texto}</button>
          ))}
        </div>
      )}
    </article>
  )
}

function Pedidos() {
  const { datos, error, recargar } = useDatos('pedidos')
  const [fallo, setFallo] = useState('')
  const [verTerminados, setVerTerminados] = useState(false)
  if (!datos) return <Aviso>{error}</Aviso>

  const cambiar = async (pedido, estado, motivo) => {
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
      <Encabezado titulo="Pedidos de la tienda">Llegan solos desde tu tienda. Al entregar se registra la venta y se descuentan los insumos.</Encabezado>
      <Aviso>{fallo}</Aviso>
      {datos.pedidos.length === 0 && (
        <div className="vacio-caja">
          <strong>Aún no hay pedidos</strong>
          <p>Comparte el enlace de tu tienda. Cuando alguien pida, aparecerá aquí sin recargar la página.</p>
        </div>
      )}
      <div className="columnas">
        {COLUMNAS.map(([estado, titulo, detalle]) => {
          const lista = activos.filter((p) => p.estado === estado)
          return (
            <section key={estado} className={`columna-pedidos ${estado}`}>
              <h2>{titulo} ({lista.length})</h2>
              <p className="columna-detalle">{detalle}</p>
              {lista.map((p) => <Tarjeta key={p.id} pedido={p} cambiar={cambiar} />)}
            </section>
          )
        })}
      </div>
      {terminados.length > 0 && (
        <button className="secundario ver-terminados" onClick={() => setVerTerminados(!verTerminados)}>
          {verTerminados ? 'Ocultar terminados' : `Ver terminados (${terminados.length})`}
        </button>
      )}
      {verTerminados && <div className="rejilla">{terminados.map((p) => <Tarjeta key={p.id} pedido={p} cambiar={cambiar} />)}</div>}
    </>
  )
}

export default {
  ruta: '/pedidos', titulo: 'Pedidos', resumen: 'Pedidos de tu tienda', orden: 5, menu: true, Componente: Pedidos,
  guia: {
    para: 'Organiza los pedidos que hacen los clientes desde tu tienda, del que más espera al más reciente.',
    pasos: ['Confirma: se reservan los insumos.', 'Pasa a preparar y luego márcalo listo.', 'Entrega cuando el cliente lo recoja.', 'Si no puedes atenderlo, recházalo con un motivo.'],
    conecta: 'Un pedido entregado se convierte en venta y baja el Inventario.',
  },
}
