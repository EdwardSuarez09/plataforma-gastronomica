import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Aviso, Encabezado, Seleccion, porcentaje } from '../../components/ui.jsx'
import { useDatos } from '../../services/useDatos.js'

const sumar = (valores) => valores.reduce((a, b) => a + b, 0)

// El error, dicho en palabras. Los cortes son orientativos.
export function confianza(error) {
  if (error === null || error === undefined) return null
  if (error <= 0.15) return ['ok', 'Acierta bien']
  if (error <= 0.3) return ['atento', 'Úsalo como guía']
  return ['mal', 'Todavía falla mucho']
}

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
        <div className="vacio-caja">
          <strong>Todavía estamos aprendiendo de tus ventas</strong>
          <p>
            Se necesitan {p.diasMinimos} días con ventas para pronosticar y llevas {p.diasConDatos}. Sigue registrando ventas.
          </p>
          <progress value={p.diasConDatos} max={p.diasMinimos} aria-label="Días con ventas" />
          <Link to="/ventas">Registrar una venta</Link>
        </div>
      </>
    )
  }
  const producto = p.productos.find((x) => x.productoId === elegido) ?? p.productos[0]
  const nivel = confianza(p.error)
  return (
    <>
      {titulo}
      <div className="resumen">
        <article className="dato"><span>Unidades esperadas</span><strong>{sumar(p.productos.flatMap((x) => x.valores))}</strong><small>en {p.dias.length} {p.dias.length === 1 ? 'día' : 'días'}, entre todos</small></article>
        {nivel && (
          <article className={`dato ${nivel[0]}`}>
            <span>Qué tan seguro es</span><strong>{nivel[1]}</strong>
            <small>Se equivocó <b>{porcentaje(p.error)}</b> en la última semana</small>
          </article>
        )}
        <article className="dato"><span>Historia usada</span><strong>{p.diasConDatos} días</strong><small>con ventas registradas</small></article>
      </div>
      <section className="tarjeta">
        <Seleccion
          etiqueta="Producto" opciones={p.productos.map((x) => [x.productoId, x.nombre])}
          value={producto?.productoId} onChange={(e) => setElegido(e.target.value)}
        />
        {producto && <Barras dias={p.dias} valores={producto.valores} />}
      </section>
      <h2>Todos los productos</h2>
      <div className="tabla">
        <table>
          <thead>
            <tr>
              <th>Producto</th>{p.dias.map((d) => <th key={d.fecha} className="num">{d.nombre}<br /><small>{d.fecha.slice(5)}</small></th>)}
              <th className="num">Semana</th>
            </tr>
          </thead>
          <tbody>
            {p.productos.map((x) => (
              <tr key={x.productoId}>
                <td><strong>{x.nombre}</strong></td>{x.valores.map((v, i) => <td key={p.dias[i].fecha} className="num">{v}</td>)}
                <td className="num"><strong>{sumar(x.valores)}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="explica" style={{ marginTop: '0.75rem' }}>
        Es un promedio de las últimas semanas, por día y con más peso en lo reciente. No conoce festivos ni eventos. <Link to="/produccion">Usarlo en el plan de producción</Link>
      </p>
    </>
  )
}

export default {
  ruta: '/pronostico', titulo: 'Pronóstico', resumen: 'Demanda de los próximos 7 días', orden: 31, menu: true, Componente: Pronostico,
  guia: {
    para: 'Estima cuánto venderás cada día de la próxima semana, para comprar y preparar lo justo.',
    pasos: ['Mira qué tan seguro es el pronóstico.', 'Elige un producto para ver sus días fuertes.', 'Lleva estos números al Plan de producción.'],
    conecta: 'Aprende de las ventas registradas. Mientras más ventas, mejor acierta.',
  },
}
