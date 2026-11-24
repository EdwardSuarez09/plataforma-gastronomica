import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Aviso, Campo, Encabezado, Seleccion, dinero, hoy } from '../../components/ui.jsx'
import { crear, editar } from '../../services/apiClient.js'
import { useDatos } from '../../services/useDatos.js'

const vacia = () => ({ insumoId: '', fecha: hoy(), cantidad: '', valorTotal: '' })

function Compras() {
  const { datos, error, recargar } = useDatos('compras', 'insumos')
  const [form, setForm] = useState(vacia)
  const [mensaje, setMensaje] = useState(null)
  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })
  const unitario = Number(form.valorTotal) / Number(form.cantidad)

  const guardar = async (e) => {
    e.preventDefault()
    try {
      const { compra, insumo } = await crear('compras', {
        insumoId: form.insumoId, fecha: form.fecha, cantidad: Number(form.cantidad), valorTotal: Number(form.valorTotal),
      })
      const cambio = compra.precioUnitario !== insumo.precio && window.confirm(
        `¿Actualizar el precio de "${insumo.nombre}" de ${dinero(insumo.precio)} a ${dinero(compra.precioUnitario)}?`,
      )
      if (cambio) await editar('insumos', insumo.id, { precio: compra.precioUnitario })
      setMensaje(['ok', `Compra registrada. Stock de ${insumo.nombre}: ${insumo.stock} ${insumo.unidad}`])
      setForm(vacia())
      await recargar()
    } catch (err) {
      setMensaje(['error', err.message])
    }
  }

  if (!datos) return <Aviso>{error}</Aviso>
  if (datos.insumos.length === 0) {
    return <p className="vacio">Primero registra insumos para poder comprar. <Link to="/insumos">Ir a insumos</Link></p>
  }
  const compras = [...datos.compras].sort((a, b) => b.fecha.localeCompare(a.fecha))
  const total = compras.reduce((suma, c) => suma + c.valorTotal, 0)
  return (
    <>
      <Encabezado titulo="Compras">Cada compra aumenta el stock del insumo.</Encabezado>
      {mensaje && <Aviso tipo={mensaje[0]}>{mensaje[1]}</Aviso>}
      <form className="tarjeta formulario" onSubmit={guardar} noValidate>
        <Seleccion
          etiqueta="Insumo" vacia="Elige…" opciones={datos.insumos.map((i) => [i.id, `${i.nombre} (${i.unidad})`])}
          value={form.insumoId} onChange={cambiar('insumoId')}
        />
        <Campo etiqueta="Fecha" type="date" max={hoy()} value={form.fecha} onChange={cambiar('fecha')} />
        <Campo etiqueta="Cantidad" type="number" step="any" value={form.cantidad} onChange={cambiar('cantidad')} />
        <Campo etiqueta="Valor total" type="number" value={form.valorTotal} onChange={cambiar('valorTotal')} />
        {unitario > 0 && Number.isFinite(unitario) && <p>Precio unitario: <strong>{dinero(unitario)}</strong></p>}
        <button>Registrar compra</button>
      </form>
      <p className="cifra">Total gastado: <strong>{dinero(total)}</strong></p>
      <div className="tabla">
        <table>
          <thead><tr><th>Fecha</th><th>Insumo</th><th>Cantidad</th><th>Precio unitario</th><th>Valor</th></tr></thead>
          <tbody>
            {compras.map((c) => (
              <tr key={c.id}>
                <td>{c.fecha}</td><td>{datos.insumos.find((i) => i.id === c.insumoId)?.nombre ?? '—'}</td>
                <td>{c.cantidad}</td><td>{dinero(c.precioUnitario)}</td><td>{dinero(c.valorTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default {
  ruta: '/compras', titulo: 'Compras', resumen: 'Entradas de insumos', orden: 20, menu: true, Componente: Compras,
}
