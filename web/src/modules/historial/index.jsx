import { useState } from 'react'
import { Aviso, Campo, Encabezado, Seleccion, dinero, hoy } from '../../components/ui.jsx'
import { useDatos } from '../../services/useDatos.js'
import { aCsv, descargar } from './exportar.js'
import { filtrarVentas, totales } from './filtrar.js'

const POR_PAGINA = 40
const SIN_FILTRO = { desde: '', hasta: '', productoId: '' }
const RAPIDOS = [['Hoy', 0], ['Últimos 7 días', 6], ['Últimos 30 días', 29]]

export function rangoDe(dias, hasta) {
  const d = new Date(`${hasta}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - dias)
  return { desde: d.toISOString().slice(0, 10), hasta }
}

function Historial() {
  const { datos, error } = useDatos('ventas', 'productos')
  const [filtro, setFiltro] = useState(SIN_FILTRO)
  const [visibles, setVisibles] = useState(POR_PAGINA)
  const filtrar = (cambios) => {
    setFiltro({ ...filtro, ...cambios })
    setVisibles(POR_PAGINA)
  }
  const cambiar = (campo) => (e) => filtrar({ [campo]: e.target.value })
  if (!datos) return <Aviso>{error}</Aviso>

  const lineas = filtrarVentas(datos.ventas, filtro)
  const total = totales(lineas)
  const hayFiltro = filtro.desde || filtro.hasta || filtro.productoId
  return (
    <>
      <Encabezado titulo="Historial de ventas">Busca qué se vendió, cuándo y por cuánto.</Encabezado>
      <div className="filtros" role="group" aria-label="Periodos rápidos">
        {RAPIDOS.map(([nombre, dias]) => {
          const rango = rangoDe(dias, hoy())
          const activo = filtro.desde === rango.desde && filtro.hasta === rango.hasta
          return <button key={nombre} className={activo ? '' : 'secundario'} aria-pressed={activo} onClick={() => filtrar(rango)}>{nombre}</button>
        })}
        {hayFiltro && <button className="peligro" onClick={() => filtrar(SIN_FILTRO)}>Quitar filtros</button>}
      </div>
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
      <div className="resumen">
        <article className="dato"><span>Total vendido</span><strong>{dinero(total.dinero)}</strong></article>
        <article className="dato"><span>Unidades</span><strong>{total.unidades}</strong></article>
      </div>
      {lineas.length === 0 ? <p className="vacio">No hay ventas para los filtros seleccionados</p> : (
        <div className="tabla">
          <table>
            <thead><tr><th>Fecha</th><th>Producto</th><th>Origen</th><th className="num">Cantidad</th><th className="num">Precio</th><th className="num">Total</th></tr></thead>
            <tbody>
              {lineas.slice(0, visibles).map((l, i) => (
                <tr key={`${l.id}-${i}`}>
                  <td>{l.fecha}</td><td><strong>{l.nombre}</strong></td>
                  <td><span className="chip">{l.origen === 'pedido_digital' ? 'Tienda' : 'Mostrador'}</span></td>
                  <td className="num">{l.cantidad}</td><td className="num">{dinero(l.precioUnitario)}</td><td className="num">{dinero(l.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {lineas.length > visibles && (
        <button className="secundario" style={{ marginTop: '1rem' }} onClick={() => setVisibles(visibles + POR_PAGINA)}>
          Mostrar más ({lineas.length - visibles})
        </button>
      )}
    </>
  )
}

export default {
  ruta: '/historial', titulo: 'Historial', resumen: 'Ventas por fecha y producto', orden: 22, menu: true, Componente: Historial,
  guia: {
    para: 'Encuentra cualquier venta y entiende qué se vende más y en qué fechas.',
    pasos: ['Elige un periodo rápido o escribe las fechas.', 'Filtra por producto si lo necesitas.', 'Descarga el resultado para abrirlo en Excel.'],
    conecta: 'Muestra las ventas del mostrador y los pedidos entregados. Las anuladas no aparecen.',
  },
}
