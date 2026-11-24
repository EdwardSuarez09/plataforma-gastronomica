import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Aviso, Campo, Encabezado, Seleccion, dinero, hoy } from '../../components/ui.jsx'
import { crear, pedir } from '../../services/apiClient.js'
import { useDatos } from '../../services/useDatos.js'
import './ventas.css'

const METODOS = [['efectivo', 'Efectivo'], ['transferencia', 'Transferencia']]
const BILLETES = [10000, 20000, 50000, 100000]

// Con qué podría pagar el cliente: los billetes que cubren el total.
export const billetesPara = (total) => BILLETES.filter((b) => b >= total).slice(0, 3)

function Ventas() {
  const { datos, error, recargar } = useDatos('ventas', 'productos')
  const [fecha, setFecha] = useState(hoy())
  const [cuenta, setCuenta] = useState({})
  const [buscado, setBuscado] = useState('')
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [recibido, setRecibido] = useState('')
  const [mensaje, setMensaje] = useState(null)
  if (!datos) return <Aviso>{error}</Aviso>

  const activos = datos.productos.filter((p) => p.activo)
  const visibles = activos.filter((p) => p.nombre.toLowerCase().includes(buscado.trim().toLowerCase()))
  const lineas = activos.filter((p) => cuenta[p.id] > 0).map((p) => ({ ...p, cantidad: cuenta[p.id] }))
  const total = lineas.reduce((suma, l) => suma + l.cantidad * l.precio, 0)
  const delDia = datos.ventas.filter((v) => v.fecha === fecha && v.estado !== 'anulada').reverse()
  const vendido = delDia.reduce((suma, v) => suma + v.total, 0)
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
    window.confirm('¿Anular esta venta? Saldrá del historial y los insumos volverán al inventario.') &&
    intentar(() => pedir(`/ventas/${v.id}/anular`, { metodo: 'POST' }), 'Venta anulada')

  return (
    <>
      <Encabezado titulo="Ventas">Toca los productos, revisa la cuenta y cobra.</Encabezado>
      {mensaje && <Aviso tipo={mensaje[0]}>{mensaje[1]}</Aviso>}
      <div className="mostrador">
        <div>
          {activos.length > 8 && (
            <div className="buscar-tecla">
              <Campo etiqueta="Buscar producto" type="search" value={buscado} onChange={(e) => setBuscado(e.target.value)} />
            </div>
          )}
          <div className="teclas">
            {visibles.map((p) => (
              <button key={p.id} className={cuenta[p.id] > 0 ? 'elegida' : ''} onClick={() => sumar(p.id, 1)}>
                {p.nombre}<small>{dinero(p.precio)}</small>
                {cuenta[p.id] > 0 && <span className="cuantos">{cuenta[p.id]}</span>}
              </button>
            ))}
          </div>
          {activos.length === 0 && (
            <div className="vacio-caja"><strong>Aún no hay productos activos</strong><p>Crea uno para empezar a vender.</p><Link to="/productos">Ir a productos</Link></div>
          )}
        </div>
        <section className="tarjeta cuenta" aria-label="Cuenta">
          <h2>Cuenta</h2>
          {lineas.length === 0 && <p className="vacio">Toca un producto para agregarlo.</p>}
          <ul className="lista">
            {lineas.map((l) => (
              <li key={l.id}>
                <span className="linea">
                  <button className="secundario" aria-label={`Quitar ${l.nombre}`} onClick={() => sumar(l.id, -1)}>−</button>
                  <span>{l.cantidad} × {l.nombre}</span>
                </span>
                <span>{dinero(l.cantidad * l.precio)}</span>
              </li>
            ))}
          </ul>
          {lineas.length > 0 && (
            <>
              <p className="total-cuenta">Total: <strong className="grande">{dinero(total)}</strong></p>
              <Seleccion etiqueta="Medio de pago" opciones={METODOS} value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} />
              {metodoPago === 'efectivo' && (
                <>
                  <Campo etiqueta="Paga con" type="number" inputMode="numeric" value={recibido} onChange={(e) => setRecibido(e.target.value)} />
                  <div className="billetes">
                    {billetesPara(total).map((b) => <button key={b} type="button" className="secundario" onClick={() => setRecibido(String(b))}>{dinero(b)}</button>)}
                  </div>
                </>
              )}
              {metodoPago === 'efectivo' && Number(recibido) >= total && <p className="vueltas">Vueltas: <strong>{dinero(recibido - total)}</strong></p>}
              <button className="cobrar" onClick={cobrar}>Cobrar</button>
              <button className="peligro" onClick={() => setCuenta({})}>Vaciar cuenta</button>
            </>
          )}
          <Campo etiqueta="Fecha de la venta" type="date" max={hoy()} value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </section>
      </div>
      <h2>{fecha === hoy() ? 'Ventas de hoy' : `Ventas del ${fecha}`}</h2>
      {delDia.length === 0 ? <p className="vacio">No hay ventas en esta fecha.</p> : (
        <>
          <p className="cifra">{delDia.length} {delDia.length === 1 ? 'venta' : 'ventas'}, en total <strong>{dinero(vendido)}</strong></p>
          <div className="tabla">
            <table>
              <thead><tr><th>Detalle</th><th>Origen</th><th className="num">Total</th><th><span hidden>Acciones</span></th></tr></thead>
              <tbody>
                {delDia.map((v) => (
                  <tr key={v.id}>
                    <td style={{ whiteSpace: 'normal' }}>{v.items.map((i) => `${i.cantidad} × ${i.nombre}`).join(', ')}</td>
                    <td><span className="chip">{v.origen === 'presencial' ? 'Mostrador' : 'Tienda'}</span></td><td className="num">{dinero(v.total)}</td>
                    <td><button className="peligro" onClick={() => anular(v)}>Anular</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  )
}

export default {
  ruta: '/ventas', titulo: 'Ventas', resumen: 'Cobra en el mostrador', orden: 4, menu: true, Componente: Ventas,
  guia: {
    para: 'Es tu caja: registra lo que vendes en el mostrador en pocos toques.',
    pasos: ['Toca cada producto una vez por unidad.', 'Elige el medio de pago; si es efectivo te decimos las vueltas.', 'Toca Cobrar. Si te equivocaste, anula la venta abajo.'],
    conecta: 'Cada venta descuenta los insumos del Inventario y suma en el Panel.',
  },
}
