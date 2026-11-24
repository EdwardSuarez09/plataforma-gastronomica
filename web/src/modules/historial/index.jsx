import { useState } from 'react'
import { Aviso, Campo, Encabezado, Seleccion, dinero } from '../../components/ui.jsx'
import { useDatos } from '../../services/useDatos.js'
import { aCsv, descargar } from './exportar.js'
import { filtrarVentas, totales } from './filtrar.js'

const POR_PAGINA = 40

function Historial() {
  const { datos, error } = useDatos('ventas', 'productos')
  const [filtro, setFiltro] = useState({ desde: '', hasta: '', productoId: '' })
  const [visibles, setVisibles] = useState(POR_PAGINA)
  const cambiar = (campo) => (e) => {
    setFiltro({ ...filtro, [campo]: e.target.value })
    setVisibles(POR_PAGINA)
  }
  if (!datos) return <Aviso>{error}</Aviso>

  const lineas = filtrarVentas(datos.ventas, filtro)
  const total = totales(lineas)
  return (
    <>
      <Encabezado titulo="Historial de ventas">Filtra para entender el comportamiento de la demanda.</Encabezado>
      <div className="tarjeta formulario">
        <Campo etiqueta="Desde" type="date" value={filtro.desde} onChange={cambiar('desde')} />
        <Campo etiqueta="Hasta" type="date" value={filtro.hasta} onChange={cambiar('hasta')} />
        <Seleccion
          etiqueta="Producto" vacia="Todos" opciones={datos.productos.map((p) => [p.id, p.nombre])}
          value={filtro.productoId} onChange={cambiar('productoId')}
        />
        <button className="secundario" disabled={lineas.length === 0} onClick={() => descargar('ventas.csv', aCsv(lineas))}>
          Descargar para Excel
        </button>
      </div>
      <p className="cifra">
        Unidades: <strong>{total.unidades}</strong> · Total: <strong>{dinero(total.dinero)}</strong>
      </p>
      {lineas.length === 0 ? <p className="vacio">No hay ventas para los filtros seleccionados</p> : (
        <div className="tabla">
          <table>
            <thead><tr><th>Fecha</th><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Total</th></tr></thead>
            <tbody>
              {lineas.slice(0, visibles).map((l, i) => (
                <tr key={`${l.id}-${i}`}>
                  <td>{l.fecha}</td><td>{l.nombre}</td><td>{l.cantidad}</td>
                  <td>{dinero(l.precioUnitario)}</td><td>{dinero(l.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {lineas.length > visibles && (
        <button className="secundario" onClick={() => setVisibles(visibles + POR_PAGINA)}>Mostrar más</button>
      )}
    </>
  )
}

export default {
  ruta: '/historial', titulo: 'Historial', resumen: 'Ventas por fecha y producto', orden: 22, menu: true, Componente: Historial,
}
