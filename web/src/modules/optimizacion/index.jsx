import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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

function ListaCompras({ compras }) {
  if (compras.length === 0) return <p className="vacio">Con lo que hay en inventario alcanza para el plan.</p>
  const total = compras.reduce((suma, c) => suma + c.costo, 0)
  return (
    <>
      <p className="cifra">Necesitas comprar <strong>{dinero(total)}</strong> en insumos.</p>
      <div className="tabla">
        <table>
          <thead><tr><th>Insumo</th><th>Necesario</th><th>Hay</th><th>Comprar</th><th>Costo</th><th /></tr></thead>
          <tbody>
            {compras.map((c) => (
              <tr key={c.insumoId}>
                <td>{c.nombre}</td><td>{c.necesario} {c.unidad}</td><td>{c.stock}</td>
                <td><strong>{c.comprar} {c.unidad}</strong></td><td>{dinero(c.costo)}</td>
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
        Programación lineal: cuánto producir cada día para ganar más con tu presupuesto.
      </Encabezado>
      <form className="tarjeta formulario" onSubmit={calcular} noValidate>
        {campo('presupuesto', 'Presupuesto diario (COP)')}
        {campo('factorMin', 'Mínimo a producir (% del pronóstico)')}
        {campo('factorMax', 'Máximo a producir (% del pronóstico)')}
        {campo('variacion', 'Variación de costos (%)')}
        <label className="fila" style={{ justifyContent: 'start' }}>
          <input type="checkbox" style={{ width: 'auto' }} checked={form.soloStock} onChange={(e) => setForm({ ...form, soloStock: e.target.checked })} />
          Producir solo con lo que tengo
        </label>
        <button>Calcular plan</button>
      </form>
      <Aviso>{error}</Aviso>
      {inviables.map((d) => (
        <Aviso key={d.fecha}>{`${d.nombre}: el presupuesto no alcanza para lo mínimo, faltan ${dinero(d.faltante)}`}</Aviso>
      ))}
      {resultado && (
        <>
          {resultado.excluidos?.length > 0 && <Aviso>{`Fuera del plan por no tener rendimiento: ${resultado.excluidos.join(', ')}`}</Aviso>}
          <p className="cifra">
            Ganancia semanal estimada: <strong>{dinero(resultado.plan.ganancia)}</strong> · Inversión: <strong>{dinero(resultado.plan.costo)}</strong>
          </p>
          <Plan productos={resultado.productos} plan={resultado.plan} />
          <h2>Qué comprar para cumplirlo</h2>
          <ListaCompras compras={resultado.compras ?? []} />
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
