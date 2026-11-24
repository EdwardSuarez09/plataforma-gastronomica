import { useState } from 'react'
import { Aviso, Campo, Encabezado, dinero } from '../../components/ui.jsx'
import { pedir } from '../../services/apiClient.js'

function Plan({ productos, plan }) {
  return (
    <div className="tabla">
      <table>
        <thead>
          <tr><th>Producto</th>{plan.dias.map((d) => <th key={d.fecha}>{d.nombre}<br /><small>{d.fecha.slice(5)}</small></th>)}</tr>
        </thead>
        <tbody>
          {productos.map((p) => (
            <tr key={p.productoId}>
              <td>{p.nombre}</td>
              {plan.dias.map((d) => <td key={d.fecha}>{d.factible ? d.cantidades[p.productoId] : '—'}</td>)}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr><th>Costo</th>{plan.dias.map((d) => <td key={d.fecha}>{d.factible ? dinero(d.costo) : '—'}</td>)}</tr>
          <tr><th>Ganancia</th>{plan.dias.map((d) => <td key={d.fecha}>{d.factible ? dinero(d.ganancia) : '—'}</td>)}</tr>
        </tfoot>
      </table>
    </div>
  )
}

function Optimizacion() {
  const [form, setForm] = useState({ presupuesto: '300000', factorMin: '50', factorMax: '120', variacion: '10' })
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState('')
  const campo = (nombre, etiqueta) => (
    <Campo
      etiqueta={etiqueta} type="number" value={form[nombre]}
      onChange={(e) => setForm({ ...form, [nombre]: e.target.value })}
    />
  )

  const calcular = async (e) => {
    e.preventDefault()
    try {
      const datos = {
        presupuesto: Number(form.presupuesto), factorMin: form.factorMin / 100,
        factorMax: form.factorMax / 100, variacion: form.variacion / 100,
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
        Programación lineal: cuánto producir cada día para ganar más con tu presupuesto.
      </Encabezado>
      <form className="tarjeta formulario" onSubmit={calcular} noValidate>
        {campo('presupuesto', 'Presupuesto diario (COP)')}
        {campo('factorMin', 'Mínimo a producir (% del pronóstico)')}
        {campo('factorMax', 'Máximo a producir (% del pronóstico)')}
        {campo('variacion', 'Variación de costos (%)')}
        <button>Calcular plan</button>
      </form>
      <Aviso>{error}</Aviso>
      {inviables.map((d) => (
        <Aviso key={d.fecha}>{`${d.nombre}: el presupuesto no alcanza para lo mínimo, faltan ${dinero(d.faltante)}`}</Aviso>
      ))}
      {resultado && (
        <>
          <p className="cifra">
            Ganancia semanal estimada: <strong>{dinero(resultado.plan.ganancia)}</strong> · Inversión: <strong>{dinero(resultado.plan.costo)}</strong>
          </p>
          <Plan productos={resultado.productos} plan={resultado.plan} />
          <h2>Si cambian los costos</h2>
          <div className="rejilla">
            {resultado.escenarios.map((e) => (
              <article key={e.nombre} className="tarjeta">
                <strong>{e.nombre}</strong>
                <span>{e.variacionCosto > 0 ? '+' : ''}{Math.round(e.variacionCosto * 100)} % en costos</span>
                <b className="grande">{dinero(e.ganancia)}</b>
                {!e.factible && <small className="alerta">Algún día no alcanza el presupuesto</small>}
              </article>
            ))}
          </div>
        </>
      )}
    </>
  )
}

export default {
  ruta: '/produccion', titulo: 'Plan de producción', resumen: 'Cuánto producir para ganar más', orden: 32, menu: true, Componente: Optimizacion,
}
