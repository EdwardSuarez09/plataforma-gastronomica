import { useState } from 'react'
import { Aviso, Campo, Encabezado, Seleccion, dinero, hoy } from '../../components/ui.jsx'
import { crear, pedir } from '../../services/apiClient.js'
import { useDatos } from '../../services/useDatos.js'

function Ventas() {
  const { datos, error, recargar } = useDatos('ventas', 'productos')
  const [fecha, setFecha] = useState(hoy())
  const [linea, setLinea] = useState({ productoId: '', cantidad: '' })
  const [items, setItems] = useState([])
  const [mensaje, setMensaje] = useState(null)
  if (!datos) return <Aviso>{error}</Aviso>

  const activos = datos.productos.filter((p) => p.activo)
  const buscar = (id) => datos.productos.find((p) => p.id === id)
  const total = items.reduce((suma, i) => suma + i.cantidad * buscar(i.productoId).precio, 0)
  const delDia = datos.ventas.filter((v) => v.fecha === fecha && v.estado !== 'anulada')

  const agregar = (e) => {
    e.preventDefault()
    const cantidad = Number(linea.cantidad)
    if (!linea.productoId) return setMensaje(['error', 'Elige un producto'])
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      return setMensaje(['error', 'La cantidad debe ser un entero mayor que 0'])
    }
    setItems([...items, { productoId: linea.productoId, cantidad }])
    setLinea({ productoId: '', cantidad: '' })
    setMensaje(null)
  }

  const intentar = async (accion, exito) => {
    try {
      await accion()
      setMensaje(['ok', exito])
      await recargar()
      return true
    } catch (err) {
      setMensaje(['error', err.message])
      return false
    }
  }
  const registrar = async () => {
    if (await intentar(() => crear('ventas', { fecha, items }), 'Venta registrada')) setItems([])
  }
  const anular = (v) =>
    window.confirm('¿Anular esta venta? Saldrá del historial.') &&
    intentar(() => pedir(`/ventas/${v.id}/anular`, { metodo: 'POST' }), 'Venta anulada')

  return (
    <>
      <Encabezado titulo="Ventas">Registra lo vendido en el mostrador.</Encabezado>
      {mensaje && <Aviso tipo={mensaje[0]}>{mensaje[1]}</Aviso>}
      <form className="tarjeta formulario" onSubmit={agregar} noValidate>
        <Campo etiqueta="Fecha" type="date" max={hoy()} value={fecha} onChange={(e) => setFecha(e.target.value)} />
        <Seleccion
          etiqueta="Producto" vacia="Elige…" opciones={activos.map((p) => [p.id, `${p.nombre} · ${dinero(p.precio)}`])}
          value={linea.productoId} onChange={(e) => setLinea({ ...linea, productoId: e.target.value })}
        />
        <Campo
          etiqueta="Cantidad" type="number" value={linea.cantidad}
          onChange={(e) => setLinea({ ...linea, cantidad: e.target.value })}
        />
        <button className="secundario">Agregar</button>
      </form>
      {items.length > 0 && (
        <section className="tarjeta">
          <ul className="lista">
            {items.map((i, n) => (
              <li key={n}>{i.cantidad} × {buscar(i.productoId).nombre} <span>{dinero(i.cantidad * buscar(i.productoId).precio)}</span></li>
            ))}
          </ul>
          <p className="cifra">Total: <strong>{dinero(total)}</strong></p>
          <button onClick={registrar}>Registrar venta</button>
        </section>
      )}
      <h2>Ventas del {fecha}</h2>
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
      {delDia.length === 0 && <p className="vacio">No hay ventas en esta fecha.</p>}
    </>
  )
}

export default {
  ruta: '/ventas', titulo: 'Ventas', resumen: 'Registro del mostrador', orden: 21, menu: true, Componente: Ventas,
}
