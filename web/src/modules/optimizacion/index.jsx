import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Aviso, Campo, Dato, Encabezado, dinero, numero } from '../../components/ui.jsx'
import { pedir } from '../../services/apiClient.js'

function Plan({ productos, plan }) {
  return (
    <div className="tabla">
      <table>
        <thead>
          <tr><th>Producto</th>{plan.dias.map((d) => <th key={d.fecha} className="num">{d.nombre}<br /><small>{d.fecha.slice(5)}</small></th>)}</tr>
        </thead>
        <tbody>
          {productos.map((p) => (
            <tr key={p.productoId}>
              <td><strong>{p.nombre}</strong></td>
              {plan.dias.map((d) => <td key={d.fecha} className="num">{d.factible ? d.cantidades[p.productoId] : '—'}</td>)}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr><th>Costo</th>{plan.dias.map((d) => <td key={d.fecha} className="num">{d.factible ? dinero(d.costo) : '—'}</td>)}</tr>
          <tr><th>Ganancia</th>{plan.dias.map((d) => <td key={d.fecha} className="num">{d.factible ? dinero(d.ganancia) : '—'}</td>)}</tr>
        </tfoot>
      </table>
    </div>
  )
}

function ListaCompras({ compras }) {
  if (compras.length === 0) return <p className="vacio">Con lo que hay en inventario alcanza para el plan.</p>
  const total = compras.reduce((suma, c) => suma + c.costo, 0)
  return (
    <>
      <p className="cifra">Necesitas comprar <strong>{dinero(total)}</strong> en insumos.</p>
      <div className="tabla">
        <table>
          <thead><tr><th>Insumo</th><th className="num">Necesario</th><th className="num">Hay</th><th className="num">Comprar</th><th className="num">Costo</th><th><span hidden>Acciones</span></th></tr></thead>
          <tbody>
            {compras.map((c) => (
              <tr key={c.insumoId}>
                <td>{c.nombre}</td><td className="num">{numero(c.necesario)} {c.unidad}</td><td className="num">{numero(c.stock)}</td>
                <td className="num"><strong>{numero(c.comprar)} {c.unidad}</strong></td><td className="num">{dinero(c.costo)}</td>
                <td><Link to={`/compras?insumo=${c.insumoId}&cantidad=${c.comprar}`} aria-label={`Comprar ${c.nombre}`}>Comprar</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function Optimizacion() {
  const [form, setForm] = useState({ presupuesto: '300000', factorMin: '50', factorMax: '120', variacion: '10', soloStock: false })
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    pedir('/produccion/sugerencia')
      .then((s) => s?.presupuesto && setForm((f) => ({ ...f, presupuesto: String(s.presupuesto) })))
      .catch((err) => setError(err.message))
  }, [])

  const campo = (nombre, etiqueta, ayuda) => (
    <Campo
      etiqueta={etiqueta} ayuda={ayuda} type="number" value={form[nombre]}
      onChange={(e) => setForm({ ...form, [nombre]: e.target.value })}
    />
  )

  const calcular = async (e) => {
    e.preventDefault()
    try {
      const datos = {
        presupuesto: Number(form.presupuesto), factorMin: form.factorMin / 100,
        factorMax: form.factorMax / 100, variacion: form.variacion / 100, soloStock: form.soloStock,
      }
      setResultado(await pedir('/produccion/optimizar', { metodo: 'POST', datos }))
      setError('')
    } catch (err) {
      setError(err.message)
      setResultado(null)
    }
  }

  const inviables = resultado?.plan.dias.filter((d) => !d.factible) ?? []
  return (
    <>
      <Encabezado titulo="Plan de producción">
        Cuánto producir cada día para ganar más con tu presupuesto. Se calcula con programación lineal a partir del pronóstico.
      </Encabezado>
      <form className="tarjeta formulario" onSubmit={calcular} noValidate>
        {campo('presupuesto', 'Presupuesto diario (COP)', 'Lo que puedes gastar en insumos cada día.')}
        <label className="casilla">
          <input type="checkbox" checked={form.soloStock} onChange={(e) => setForm({ ...form, soloStock: e.target.checked })} />
          Producir solo con lo que tengo
        </label>
        <details className="mas todo">
          <summary>Opciones avanzadas</summary>
          <div className="formulario" style={{ margin: 0 }}>
            {campo('factorMin', 'Mínimo a producir (% del pronóstico)', '50 = al menos la mitad de lo que se espera vender.')}
            {campo('factorMax', 'Máximo a producir (% del pronóstico)', '120 = hasta un 20 % más de lo esperado.')}
            {campo('variacion', 'Variación de costos (%)', 'Para comparar qué pasa si los insumos suben o bajan.')}
          </div>
        </details>
        <button>Calcular plan</button>
      </form>
      <Aviso>{error}</Aviso>
      {inviables.map((d) => (
        <Aviso key={d.fecha}>{`${d.nombre}: el presupuesto no alcanza para lo mínimo, faltan ${dinero(d.faltante)}`}</Aviso>
      ))}
      {resultado && (
        <>
          {resultado.excluidos?.length > 0 && <Aviso>{`Fuera del plan por no tener rendimiento: ${resultado.excluidos.join(', ')}`}</Aviso>}
          <div className="resumen">
            <Dato nombre="Ganancia semanal estimada" valor={dinero(resultado.plan.ganancia)} tono="ok" />
            <Dato nombre="Inversión en insumos" valor={dinero(resultado.plan.costo)} />
          </div>
          <h2>Unidades por día</h2>
          <Plan productos={resultado.productos} plan={resultado.plan} />
          <h2>Qué comprar para cumplirlo</h2>
          <ListaCompras compras={resultado.compras ?? []} />
          <h2>Si cambian los costos</h2>
          <div className="resumen">
            {resultado.escenarios.map((e) => (
              <Dato key={e.nombre} nombre={e.nombre} valor={dinero(e.ganancia)}>
                {e.variacionCosto > 0 ? '+' : ''}{Math.round(e.variacionCosto * 100)} % en costos
                {!e.factible && <span className="alerta"><br />Algún día no alcanza el presupuesto</span>}
              </Dato>
            ))}
          </div>
        </>
      )}
    </>
  )
}

export default {
  ruta: '/produccion', titulo: 'Plan de producción', resumen: 'Cuánto producir para ganar más', orden: 32, menu: true, Componente: Optimizacion,
  guia: {
    para: 'Te dice cuántas unidades preparar cada día para ganar lo máximo posible con el dinero que tienes.',
    pasos: ['Escribe tu presupuesto diario, o usa el sugerido.', 'Marca "solo con lo que tengo" si hoy no vas a comprar.', 'Calcula y revisa las unidades por día.', 'Usa "Qué comprar" para ir directo a Compras.'],
    conecta: 'Parte del Pronóstico, de los Costos y de lo que hay en Inventario.',
  },
}
