import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Aviso, Campo, Encabezado, Seleccion, dinero } from '../../components/ui.jsx'
import { pedir } from '../../services/apiClient.js'
import { useDatos } from '../../services/useDatos.js'
import { cantidad, nivelDe } from './nivel.js'
import './inventario.css'

const TIPOS = [['conteo', 'Conteo físico'], ['desperdicio', 'Desperdicio']]
const EXPLICA = {
  conteo: 'Cuenta lo que hay de verdad. El sistema registra la diferencia.',
  desperdicio: 'Lo que se dañó o se botó. Se resta del stock.',
}
const NOMBRES = {
  inicial: 'Stock inicial', compra: 'Compra', anulacion: 'Compra anulada', conteo: 'Conteo', desperdicio: 'Desperdicio',
  consumo: 'Venta', devolucion: 'Venta anulada',
}
const VACIO = { insumoId: '', tipo: 'conteo', cantidad: '', motivo: '' }
const POR_PAGINA = 20
const conSigno = (n) => (n > 0 ? `+${cantidad(n)}` : cantidad(n))

function Inventario() {
  const { datos, error, recargar } = useDatos('inventario', 'movimientos')
  const [form, setForm] = useState(VACIO)
  const [mensaje, setMensaje] = useState(null)
  const [soloBajos, setSoloBajos] = useState(false)
  const [filtro, setFiltro] = useState('')
  const [visibles, setVisibles] = useState(POR_PAGINA)
  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })
  if (!datos) return <Aviso>{error}</Aviso>

  const guardar = async (e) => {
    e.preventDefault()
    try {
      await pedir('/inventario/ajustes', { metodo: 'POST', datos: { ...form, cantidad: form.cantidad === '' ? null : Number(form.cantidad) } })
      setMensaje(['ok', 'Ajuste guardado'])
      setForm(VACIO)
      await recargar()
    } catch (err) {
      setMensaje(['error', err.message])
    }
  }
  const valor = datos.inventario.reduce((suma, i) => suma + Math.max(0, i.valor), 0)
  const bajos = datos.inventario.filter((i) => i.bajo)
  const lista = soloBajos ? bajos : datos.inventario
  const elegido = datos.inventario.find((i) => i.id === form.insumoId)
  const opciones = datos.inventario.map((i) => [i.id, `${i.nombre} (${i.unidad})`])
  const movimientos = datos.movimientos.filter((m) => !filtro || m.insumoId === filtro).toReversed()
  return (
    <>
      <Encabezado titulo="Inventario">Lo que hay, lo que vale y por qué cambió.</Encabezado>
      {mensaje && <Aviso tipo={mensaje[0]}>{mensaje[1]}</Aviso>}
      <div className="resumen">
        <article className="dato"><span>Valor del inventario</span><strong>{dinero(valor)}</strong></article>
        <article className={`dato ${bajos.length ? 'mal' : 'ok'}`}><span>Por reponer</span><strong>{bajos.length}</strong><small>de {datos.inventario.length} insumos</small></article>
      </div>
      {bajos.length > 0 && (
        <label className="casilla" style={{ marginBottom: '1rem' }}>
          <input type="checkbox" checked={soloBajos} onChange={(e) => setSoloBajos(e.target.checked)} />
          Ver solo lo que debo comprar
        </label>
      )}
      <div className="dos-paneles">
        <div className="tabla">
          <table>
            <thead><tr><th>Insumo</th><th>Stock</th><th className="num">Valor</th><th><span hidden>Acciones</span></th></tr></thead>
            <tbody>
              {lista.map((i) => {
                const nivel = nivelDe(i)
                return (
                  <tr key={i.id}>
                    <td>
                      <strong>{i.nombre}</strong> {i.bajo
                        ? <span className="inventario-nivel mal">Bajo mínimo</span>
                        : <span className={`inventario-nivel ${nivel.tono}`}>{nivel.texto}</span>}
                      <br /><small>{i.verificadoEn ? `Contado el ${i.verificadoEn}` : 'Sin contar todavía'}</small>
                    </td>
                    <td className={i.stock < 0 ? 'alerta' : ''}>
                      {cantidad(i.stock)} {i.unidad} {i.stockMinimo > 0 && <small>· mínimo {cantidad(i.stockMinimo)}</small>}
                      <span
                        className="inventario-medidor"
                        role="meter"
                        aria-label={`Nivel de stock de ${i.nombre}`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={nivel.parte * 100}
                      >
                        <i className={nivel.tono} style={{ width: `${nivel.parte * 100}%` }} />
                      </span>
                    </td>
                    <td className="num">{dinero(i.valor)}</td>
                    <td className="acciones">
                      <button className="secundario" aria-label={`Ajustar ${i.nombre}`} onClick={() => setForm({ ...VACIO, insumoId: i.id })}>Ajustar</button>
                      {i.bajo && <Link to={`/compras?insumo=${i.id}`}>Comprar</Link>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <form className="tarjeta formulario panel-lateral" onSubmit={guardar} noValidate>
          <h2>Ajustar</h2>
          <Seleccion etiqueta="Insumo" vacia="Elige…" opciones={opciones} value={form.insumoId} onChange={cambiar('insumoId')} />
          {elegido && <p className="explica">El sistema dice que hay {cantidad(elegido.stock)} {elegido.unidad}.</p>}
          <Seleccion etiqueta="Tipo" ayuda={EXPLICA[form.tipo]} opciones={TIPOS} value={form.tipo} onChange={cambiar('tipo')} />
          <Campo
            etiqueta={form.tipo === 'conteo' ? 'Cantidad contada' : 'Cantidad perdida'} type="number" step="any"
            value={form.cantidad} onChange={cambiar('cantidad')}
          />
          <Campo etiqueta="Motivo" placeholder="Ej: cierre del día" value={form.motivo} onChange={cambiar('motivo')} />
          <button>Guardar ajuste</button>
        </form>
      </div>
      <h2>Libro de movimientos</h2>
      <p className="explica">Cada entrada y salida queda escrita aquí. El stock es la suma de estas líneas.</p>
      <div className="herramientas" style={{ marginTop: '0.75rem' }}>
        <Seleccion etiqueta="Ver" vacia="Todos los insumos" opciones={opciones} value={filtro} onChange={(e) => setFiltro(e.target.value)} />
      </div>
      <div className="tabla">
        <table>
          <thead><tr><th>Fecha</th><th>Insumo</th><th>Qué pasó</th><th className="num">Cantidad</th><th className="num">Quedó en</th><th>Motivo</th></tr></thead>
          <tbody>
            {movimientos.slice(0, visibles).map((m) => (
              <tr key={m.id}>
                <td>{m.fecha}</td><td>{m.nombre}</td><td><span className={`chip ${m.cantidad > 0 ? 'ok' : ''}`}>{NOMBRES[m.tipo] ?? m.tipo}</span></td>
                <td className="num">{conSigno(m.cantidad)}</td><td className="num">{cantidad(m.saldo)}</td><td>{m.motivo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {movimientos.length > visibles && (
        <button className="secundario" style={{ marginTop: '1rem' }} onClick={() => setVisibles(visibles + POR_PAGINA)}>Mostrar más</button>
      )}
    </>
  )
}

export default {
  ruta: '/inventario', titulo: 'Inventario', resumen: 'Stock, alertas y movimientos', orden: 14, menu: true, Componente: Inventario,
  guia: {
    para: 'Dice cuánto te queda de cada insumo, cuánto vale y explica cada cambio.',
    pasos: ['Mira lo que está bajo el mínimo y cómpralo.', 'De vez en cuando cuenta lo que hay y registra un conteo.', 'Anota lo que se dañó como desperdicio.', 'Revisa el libro si algo no cuadra.'],
    conecta: 'Se mueve solo con Compras, Ventas y Pedidos. Aquí solo corriges diferencias.',
  },
}
