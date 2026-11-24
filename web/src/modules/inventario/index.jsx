import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Aviso, Campo, Encabezado, Seleccion, dinero } from '../../components/ui.jsx'
import { pedir } from '../../services/apiClient.js'
import { useDatos } from '../../services/useDatos.js'

const TIPOS = [['conteo', 'Conteo físico'], ['desperdicio', 'Desperdicio']]
const NOMBRES = {
  inicial: 'Stock inicial', compra: 'Compra', anulacion: 'Compra anulada', conteo: 'Conteo', desperdicio: 'Desperdicio',
  consumo: 'Venta', devolucion: 'Venta anulada',
}
const VACIO = { insumoId: '', tipo: 'conteo', cantidad: '', motivo: '' }
const POR_PAGINA = 20

function Inventario() {
  const { datos, error, recargar } = useDatos('inventario', 'movimientos')
  const [form, setForm] = useState(VACIO)
  const [mensaje, setMensaje] = useState(null)
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
  const opciones = datos.inventario.map((i) => [i.id, `${i.nombre} (${i.unidad})`])
  const movimientos = datos.movimientos.filter((m) => !filtro || m.insumoId === filtro).toReversed()
  return (
    <>
      <Encabezado titulo="Inventario">Lo que hay, lo que vale y por qué cambió.</Encabezado>
      {mensaje && <Aviso tipo={mensaje[0]}>{mensaje[1]}</Aviso>}
      <p className="cifra">Valor del inventario: <strong>{dinero(valor)}</strong></p>
      <div className="tabla">
        <table>
          <thead><tr><th>Insumo</th><th>Stock</th><th>Mínimo</th><th>Valor</th><th>Último conteo</th><th /></tr></thead>
          <tbody>
            {datos.inventario.map((i) => (
              <tr key={i.id}>
                <td>{i.nombre} {i.bajo && <small className="alerta">Bajo mínimo</small>}</td>
                <td className={i.stock < 0 ? 'alerta' : ''}>{i.stock} {i.unidad}</td><td>{i.stockMinimo || '—'}</td>
                <td>{dinero(i.valor)}</td><td>{i.verificadoEn ?? 'Estimado'}</td>
                <td>{i.bajo && <Link to={`/compras?insumo=${i.id}`}>Comprar</Link>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2>Ajustar</h2>
      <form className="tarjeta formulario" onSubmit={guardar} noValidate>
        <Seleccion etiqueta="Insumo" vacia="Elige…" opciones={opciones} value={form.insumoId} onChange={cambiar('insumoId')} />
        <Seleccion etiqueta="Tipo" opciones={TIPOS} value={form.tipo} onChange={cambiar('tipo')} />
        <Campo
          etiqueta={form.tipo === 'conteo' ? 'Cantidad contada' : 'Cantidad perdida'} type="number" step="any"
          value={form.cantidad} onChange={cambiar('cantidad')}
        />
        <Campo etiqueta="Motivo" value={form.motivo} onChange={cambiar('motivo')} />
        <button>Guardar ajuste</button>
      </form>
      <h2>Libro de movimientos</h2>
      <Seleccion etiqueta="Ver" vacia="Todos los insumos" opciones={opciones} value={filtro} onChange={(e) => setFiltro(e.target.value)} />
      <div className="tabla">
        <table>
          <thead><tr><th>Fecha</th><th>Insumo</th><th>Movimiento</th><th>Cantidad</th><th>Saldo</th><th>Motivo</th></tr></thead>
          <tbody>
            {movimientos.slice(0, visibles).map((m) => (
              <tr key={m.id}>
                <td>{m.fecha}</td><td>{m.nombre}</td><td>{NOMBRES[m.tipo] ?? m.tipo}</td>
                <td>{m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}</td><td>{m.saldo}</td><td>{m.motivo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {movimientos.length > visibles && (
        <button className="secundario" onClick={() => setVisibles(visibles + POR_PAGINA)}>Mostrar más</button>
      )}
    </>
  )
}

export default {
  ruta: '/inventario', titulo: 'Inventario', resumen: 'Stock, alertas y movimientos', orden: 14, menu: true, Componente: Inventario,
}
