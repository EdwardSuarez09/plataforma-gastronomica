import { useState } from 'react'
import { Aviso, Encabezado, Seleccion, porcentaje } from '../../components/ui.jsx'
import { useDatos } from '../../services/useDatos.js'

function Barras({ dias, valores }) {
  const mayor = Math.max(1, ...valores)
  return (
    <div className="barras" role="img" aria-label={dias.map((d, i) => `${d.nombre}: ${valores[i]}`).join(', ')}>
      {valores.map((v, i) => (
        <div key={dias[i].fecha} className="columna">
          <b>{v}</b>
          <div className="barra" style={{ height: `${(v / mayor) * 140}px` }} />
          <span>{dias[i].nombre.slice(0, 3)}</span>
        </div>
      ))}
    </div>
  )
}

function Pronostico() {
  const { datos, error } = useDatos('pronostico')
  const [elegido, setElegido] = useState('')
  if (!datos) return <Aviso>{error}</Aviso>

  const p = datos.pronostico
  const titulo = <Encabezado titulo="Pronóstico de demanda">Lo que probablemente venderás en los próximos 7 días.</Encabezado>
  if (!p.suficiente) {
    return (
      <>
        {titulo}
        <p className="vacio">
          Se necesitan {p.diasMinimos} días con ventas para pronosticar y llevas {p.diasConDatos}. Sigue registrando ventas.
        </p>
      </>
    )
  }
  const producto = p.productos.find((x) => x.productoId === elegido) ?? p.productos[0]
  return (
    <>
      {titulo}
      <p className="cifra">
        Calculado con <strong>{p.diasConDatos}</strong> días de ventas
        {p.error !== null && <> · Error en la última semana: <strong>{porcentaje(p.error)}</strong></>}
      </p>
      <section className="tarjeta">
        <Seleccion
          etiqueta="Producto" opciones={p.productos.map((x) => [x.productoId, x.nombre])}
          value={producto?.productoId} onChange={(e) => setElegido(e.target.value)}
        />
        {producto && <Barras dias={p.dias} valores={producto.valores} />}
      </section>
      <div className="tabla">
        <table>
          <thead><tr><th>Producto</th>{p.dias.map((d) => <th key={d.fecha}>{d.nombre}<br /><small>{d.fecha.slice(5)}</small></th>)}</tr></thead>
          <tbody>
            {p.productos.map((x) => (
              <tr key={x.productoId}><td>{x.nombre}</td>{x.valores.map((v, i) => <td key={p.dias[i].fecha}>{v}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default {
  ruta: '/pronostico', titulo: 'Pronóstico', resumen: 'Demanda de los próximos 7 días', orden: 31, menu: true, Componente: Pronostico,
}
