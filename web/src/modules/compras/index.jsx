import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Aviso, Campo, Encabezado, Seleccion, dinero, hoy } from '../../components/ui.jsx'
import { crear, editar, pedir } from '../../services/apiClient.js'
import { useDatos } from '../../services/useDatos.js'

const vacia = () => ({ insumoId: '', fecha: hoy(), cantidad: '', valorTotal: '', proveedor: '' })
const POR_PAGINA = 20

// Compara lo que se paga hoy con el precio guardado del insumo.
export function compararPrecio(unitario, guardado) {
  if (!(unitario > 0) || !Number.isFinite(unitario) || !(guardado > 0) || !Number.isFinite(guardado)) return null
  const cambio = Math.round(((unitario - guardado) / guardado) * 100)
  if (cambio === 0) return ['', 'Igual al precio guardado']
  return cambio > 0 ? ['atento', `${cambio} % más caro que el guardado`] : ['ok', `${-cambio} % más barato que el guardado`]
}

function Compras() {
  const { datos, error, recargar } = useDatos('compras', 'insumos')
  const [consulta] = useSearchParams()
  // Desde el inventario o el plan se llega con el insumo y la cantidad ya elegidos.
  const [form, setForm] = useState(() => ({
    ...vacia(), insumoId: consulta.get('insumo') ?? '', cantidad: consulta.get('cantidad') ?? '',
  }))
  const [mensaje, setMensaje] = useState(null)
  const [visibles, setVisibles] = useState(POR_PAGINA)
  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })
  const unitario = Number(form.valorTotal) / Number(form.cantidad)

  const guardar = async (e) => {
    e.preventDefault()
    try {
      const { compra, insumo } = await crear('compras', {
        insumoId: form.insumoId, fecha: form.fecha, cantidad: Number(form.cantidad),
        valorTotal: Number(form.valorTotal), proveedor: form.proveedor,
      })
      const cambio = compra.precioUnitario !== insumo.precio && window.confirm(
        `¿Actualizar el precio de "${insumo.nombre}" de ${dinero(insumo.precio)} a ${dinero(compra.precioUnitario)}?`,
      )
      if (cambio) await editar('insumos', insumo.id, { precio: compra.precioUnitario })
      const stock = Number(insumo.stock).toLocaleString('es-CO', { maximumFractionDigits: 2 })
      setMensaje(['ok', `Compra registrada. Stock de ${insumo.nombre}: ${stock} ${insumo.unidad}`])
      setForm(vacia())
      await recargar()
    } catch (err) {
      setMensaje(['error', err.message])
    }
  }
  const anular = async (c) => {
    if (!window.confirm('¿Anular esta compra? El stock bajará en esa cantidad.')) return
    try {
      await pedir(`/compras/${c.id}/anular`, { metodo: 'POST' })
      setMensaje(['ok', 'Compra anulada'])
      await recargar()
    } catch (err) {
      setMensaje(['error', err.message])
    }
  }

  if (!datos) return <Aviso>{error}</Aviso>
  if (datos.insumos.length === 0) {
    return (
      <>
        <Encabezado titulo="Compras" />
        <p className="vacio">Primero registra insumos para poder comprar. <Link to="/insumos">Ir a insumos</Link></p>
      </>
    )
  }
  const insumo = (id) => datos.insumos.find((i) => i.id === id)
  const elegido = insumo(form.insumoId)
  const precio = compararPrecio(unitario, elegido?.precio)
  const compras = [...datos.compras].sort((a, b) => b.fecha.localeCompare(a.fecha))
  const vigentes = compras.filter((c) => c.estado !== 'anulada')
  const total = vigentes.reduce((suma, c) => suma + c.valorTotal, 0)
  return (
    <>
      <Encabezado titulo="Compras">Registra lo que compras: sube el stock del insumo y queda el gasto.</Encabezado>
      {mensaje && <Aviso tipo={mensaje[0]}>{mensaje[1]}</Aviso>}
      <div className="resumen">
        <article className="dato"><span>Total gastado</span><strong>{dinero(total)}</strong></article>
        <article className="dato"><span>Compras registradas</span><strong>{vigentes.length}</strong></article>
      </div>
      <div className="dos-paneles">
        <div>
          {compras.length === 0 ? (
            <div className="vacio-caja"><strong>Aún no hay compras</strong><p>Registra la primera con el formulario.</p></div>
          ) : (
            <div className="tabla">
              <table>
                <thead><tr><th>Fecha</th><th>Insumo</th><th className="num">Cantidad</th><th className="num">Precio unitario</th><th className="num">Valor</th><th>Estado</th></tr></thead>
                <tbody>
                  {compras.slice(0, visibles).map((c) => (
                    <tr key={c.id}>
                      <td>{c.fecha}</td>
                      <td><strong>{insumo(c.insumoId)?.nombre ?? '—'}</strong>{c.proveedor && <><br /><small>{c.proveedor}</small></>}</td>
                      <td className="num">{c.cantidad} <small>{insumo(c.insumoId)?.unidad}</small></td>
                      <td className="num">{dinero(c.precioUnitario)}</td><td className="num">{dinero(c.valorTotal)}</td>
                      <td>{c.estado === 'anulada' ? <span className="chip mal">Anulada</span> : <button className="peligro" onClick={() => anular(c)}>Anular</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {compras.length > visibles && (
            <button className="secundario" style={{ marginTop: '1rem' }} onClick={() => setVisibles(visibles + POR_PAGINA)}>Mostrar más ({compras.length - visibles})</button>
          )}
        </div>
        <form className="tarjeta formulario panel-lateral" onSubmit={guardar} noValidate>
          <h2>Nueva compra</h2>
          <Seleccion
            etiqueta="Insumo" vacia="Elige…" opciones={datos.insumos.map((i) => [i.id, `${i.nombre} (${i.unidad})`])}
            value={form.insumoId} onChange={cambiar('insumoId')}
          />
          <Campo etiqueta="Fecha" type="date" max={hoy()} value={form.fecha} onChange={cambiar('fecha')} />
          <Campo etiqueta="Cantidad" type="number" step="any" value={form.cantidad} onChange={cambiar('cantidad')} />
          <Campo etiqueta="Valor total" type="number" inputMode="numeric" value={form.valorTotal} onChange={cambiar('valorTotal')} />
          <Campo etiqueta="Proveedor (opcional)" value={form.proveedor} onChange={cambiar('proveedor')} />
          {unitario > 0 && Number.isFinite(unitario) && (
            <p>
              Precio unitario: <strong>{dinero(unitario)}</strong>
              {precio && <> <span className={`chip ${precio[0]}`}>{precio[1]}</span></>}
            </p>
          )}
          <button>Registrar compra</button>
        </form>
      </div>
    </>
  )
}

export default {
  ruta: '/compras', titulo: 'Compras', resumen: 'Entradas de insumos', orden: 20, menu: true, Componente: Compras,
  guia: {
    para: 'Anota lo que compras para que el stock y el gasto estén siempre al día.',
    pasos: ['Elige el insumo, la cantidad y cuánto pagaste en total.', 'Mira si salió más caro o más barato que la última vez.', 'Al guardar puedes actualizar el precio del insumo.'],
    conecta: 'Sube el stock en Inventario. Si actualizas el precio, cambian Costos y el Plan.',
  },
}
