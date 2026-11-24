import { useState } from 'react'
import { Aviso, Campo, Encabezado, Seleccion, dinero, hoy } from '../../components/ui.jsx'
import { crear, pedir } from '../../services/apiClient.js'
import { useDatos } from '../../services/useDatos.js'
import './ventas.css'

const METODOS = [['efectivo', 'Efectivo'], ['transferencia', 'Transferencia']]

function Ventas() {
  const { datos, error, recargar } = useDatos('ventas', 'productos')
  const [fecha, setFecha] = useState(hoy())
  const [cuenta, setCuenta] = useState({})
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [recibido, setRecibido] = useState('')
  const [mensaje, setMensaje] = useState(null)
  if (!datos) return <Aviso>{error}</Aviso>

  const activos = datos.productos.filter((p) => p.activo)
  const lineas = activos.filter((p) => cuenta[p.id] > 0).map((p) => ({ ...p, cantidad: cuenta[p.id] }))
  const total = lineas.reduce((suma, l) => suma + l.cantidad * l.precio, 0)
  const delDia = datos.ventas.filter((v) => v.fecha === fecha && v.estado !== 'anulada').reverse()
  const sumar = (id, n) => setCuenta((c) => ({ ...c, [id]: Math.max(0, (c[id] ?? 0) + n) }))

  const intentar = async (accion, exito) => {
    try {
      const { faltantes = [] } = (await accion()) ?? {}
      setMensaje(faltantes.length ? ['error', `${exito}. Revisa el inventario de: ${faltantes.join(', ')}`] : ['ok', exito])
      await recargar()
      return true
    } catch (err) {
      setMensaje(['error', err.message])
      return false
    }
  }
  const cobrar = async () => {
    const items = lineas.map(({ id, cantidad }) => ({ productoId: id, cantidad }))
    if (await intentar(() => crear('ventas', { fecha, metodoPago, items }), `Venta registrada: ${dinero(total)}`)) {
      setCuenta({})
      setRecibido('')
    }
  }
  const anular = (v) =>
    window.confirm('¿Anular esta venta? Saldrá del historial.') &&
    intentar(() => pedir(`/ventas/${v.id}/anular`, { metodo: 'POST' }), 'Venta anulada')

  return (
    <>
      <Encabezado titulo="Ventas">Toca los productos y cobra.</Encabezado>
      {mensaje && <Aviso tipo={mensaje[0]}>{mensaje[1]}</Aviso>}
      <div className="mostrador">
        <div className="teclas">
          {activos.map((p) => (
            <button key={p.id} onClick={() => sumar(p.id, 1)}>{p.nombre}<small>{dinero(p.precio)}</small></button>
          ))}
          {activos.length === 0 && <p className="vacio">Aún no hay productos activos.</p>}
        </div>
        <section className="tarjeta cuenta" aria-label="Cuenta">
          <Campo etiqueta="Fecha" type="date" max={hoy()} value={fecha} onChange={(e) => setFecha(e.target.value)} />
          {lineas.length === 0 && <p className="vacio">La cuenta está vacía.</p>}
          <ul className="lista">
            {lineas.map((l) => (
              <li key={l.id}>
                <span>
                  <button className="secundario" aria-label={`Quitar ${l.nombre}`} onClick={() => sumar(l.id, -1)}>−</button>
                  {' '}{l.cantidad} × {l.nombre}
                </span>
                <span>{dinero(l.cantidad * l.precio)}</span>
              </li>
            ))}
          </ul>
          {lineas.length > 0 && (
            <>
              {lineas.length > 0 && <p className="cifra">Total: <strong className="grande">{dinero(total)}</strong></p>}
              <Seleccion etiqueta="Medio de pago" opciones={METODOS} value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} />
              {metodoPago === 'efectivo' && (
                <Campo etiqueta="Paga con" type="number" value={recibido} onChange={(e) => setRecibido(e.target.value)} />
              )}
              {metodoPago === 'efectivo' && Number(recibido) >= total && <p>Vueltas: <strong>{dinero(recibido - total)}</strong></p>}
              <button onClick={cobrar}>Cobrar</button>
            </>
          )}
        </section>
      </div>
      <h2>Ventas del {fecha}</h2>
      {delDia.length === 0 ? <p className="vacio">No hay ventas en esta fecha.</p> : (
        <div className="tabla">
          <table>
            <thead><tr><th>Detalle</th><th>Origen</th><th>Total</th><th /></tr></thead>
            <tbody>
              {delDia.map((v) => (
                <tr key={v.id}>
                  <td>{v.items.map((i) => `${i.cantidad} × ${i.nombre}`).join(', ')}</td>
                  <td>{v.origen === 'presencial' ? 'Mostrador' : 'Tienda'}</td><td>{dinero(v.total)}</td>
                  <td><button className="peligro" onClick={() => anular(v)}>Anular</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

export default {
  ruta: '/ventas', titulo: 'Ventas', resumen: 'Cobra en el mostrador', orden: 4, menu: true, Componente: Ventas,
}
