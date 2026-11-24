import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Aviso, Campo, Encabezado, Seleccion, Vacio, dinero } from '../../components/ui.jsx'
import { crear, editar, eliminar, pedir } from '../../services/apiClient.js'
import { useDatos } from '../../services/useDatos.js'
import Ingredientes, { aNumeros } from './Ingredientes.jsx'

const TIPOS = ['tradicional', 'yuca', 'plátano', 'otro'].map((t) => [t, t[0].toUpperCase() + t.slice(1)])
const VACIA = { nombre: '', tipo: 'tradicional', ingredientes: [{ insumoId: '', cantidad: '' }] }

function Masas() {
  const { datos, error, recargar } = useDatos('masas', 'insumos')
  const [form, setForm] = useState(VACIA)
  const [fallo, setFallo] = useState('')

  const intentar = async (accion) => {
    try {
      await accion()
      setFallo('')
      setForm(VACIA)
      await recargar()
    } catch (e) {
      setFallo(e.message)
    }
  }
  const guardar = (e) => {
    e.preventDefault()
    const masa = { nombre: form.nombre, tipo: form.tipo, ingredientes: aNumeros(form.ingredientes) }
    intentar(() => (form.id ? editar('masas', form.id, masa) : crear('masas', masa)))
  }

  if (!datos) return <Aviso>{error}</Aviso>
  if (datos.insumos.length === 0) {
    return (
      <>
        <Encabezado titulo="Masas" />
        <p className="vacio">Primero registra insumos. <Link to="/insumos">Ir a insumos</Link></p>
      </>
    )
  }
  const insumo = (id) => datos.insumos.find((i) => i.id === id)
  const costo = form.ingredientes.reduce((suma, x) => suma + Number(x.cantidad || 0) * (insumo(x.insumoId)?.precio ?? 0), 0)
  const detalle = (m) => m.ingredientes.map((x) => insumo(x.insumoId)?.nombre).filter(Boolean).join(', ')
  return (
    <>
      <Encabezado titulo="Masas">La receta base de tus productos. Cada masa es un lote y su costo se calcula con los precios de hoy.</Encabezado>
      <Aviso>{fallo}</Aviso>
      <div className="dos-paneles">
        <div>
          {datos.masas.length === 0 ? <Vacio titulo="Aún no hay masas"><p>Crea la primera: ponle un nombre y agrega sus ingredientes.</p></Vacio> : (
            <div className="tabla">
              <table>
                <thead><tr><th>Masa</th><th>Ingredientes</th><th className="num">Costo del lote</th><th><span hidden>Acciones</span></th></tr></thead>
                <tbody>
                  {datos.masas.map((m) => (
                    <tr key={m.id}>
                      <td><strong>{m.nombre}</strong><br /><small>{m.tipo}</small></td>
                      <td style={{ whiteSpace: 'normal' }}>{detalle(m)}</td>
                      <td className="num">{dinero(m.costoLote)}</td>
                      <td className="acciones">
                        <button className="secundario" onClick={() => setForm(m)}>Editar</button>
                        <button
                          className="peligro"
                          onClick={() => window.confirm(`¿Eliminar "${m.nombre}"?`) && intentar(() => eliminar('masas', m.id))}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <form className="tarjeta formulario panel-lateral" onSubmit={guardar} noValidate>
          <h2>{form.id ? 'Editar masa' : 'Nueva masa'}</h2>
          <Campo etiqueta="Nombre" placeholder="Ej: Masa tradicional" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          <Seleccion etiqueta="Tipo" opciones={TIPOS} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} />
          <Ingredientes
            titulo="Ingredientes del lote" insumos={datos.insumos}
            valor={form.ingredientes} onChange={(ingredientes) => setForm({ ...form, ingredientes })}
          />
          {costo > 0 && <p className="cifra">Este lote cuesta <strong>{dinero(costo)}</strong></p>}
          <button>{form.id ? 'Guardar cambios' : 'Crear masa'}</button>
          {form.id && <button type="button" className="secundario" onClick={() => setForm(VACIA)}>Cancelar</button>}
        </form>
      </div>
    </>
  )
}

function Rendimiento() {
  const { datos, error, recargar } = useDatos('masas', 'productos')
  const [masaId, setMasaId] = useState('')
  const [unidades, setUnidades] = useState({})
  const [mensaje, setMensaje] = useState(null)
  if (!datos) return <Aviso>{error}</Aviso>

  const masa = datos.masas.find((m) => m.id === masaId)
  const productos = datos.productos.filter((p) => p.masaId === masaId)
  const elegir = (id) => {
    setMasaId(id)
    setMensaje(null)
    const r = datos.masas.find((m) => m.id === id)?.rendimiento ?? []
    setUnidades(Object.fromEntries(r.map((x) => [x.productoId, x.unidades])))
  }
  const guardar = async (e) => {
    e.preventDefault()
    const rendimiento = productos
      .filter((p) => unidades[p.id] !== undefined && unidades[p.id] !== '')
      .map((p) => ({ productoId: p.id, unidades: Number(unidades[p.id]) }))
    try {
      await pedir(`/masas/${masa.id}/rendimiento`, { metodo: 'PUT', datos: { rendimiento } })
      setMensaje(['ok', 'Rendimiento guardado'])
      await recargar()
    } catch (err) {
      setMensaje(['error', err.message])
    }
  }
  return (
    <>
      <Encabezado titulo="Rendimiento">Cuántas unidades de cada producto salen de un lote de masa. Con esto se calcula cuánto cuesta cada una.</Encabezado>
      {mensaje && <Aviso tipo={mensaje[0]}>{mensaje[1]}</Aviso>}
      <form className="tarjeta formulario" onSubmit={guardar} noValidate>
        <Seleccion
          etiqueta="Masa" vacia="Elige una masa…" opciones={datos.masas.map((m) => [m.id, m.nombre])}
          value={masaId} onChange={(e) => elegir(e.target.value)}
        />
        {!masa && <p className="explica">Elige una masa para ver los productos que se preparan con ella.</p>}
        {productos.map((p) => (
          <Campo
            key={p.id} etiqueta={`Unidades de ${p.nombre}`} type="number" value={unidades[p.id] ?? ''}
            onChange={(e) => setUnidades({ ...unidades, [p.id]: e.target.value })}
          />
        ))}
        {masa && productos.length === 0 && <p className="vacio">Esta masa aún no tiene productos.</p>}
        {productos.length > 0 && <button>Guardar rendimiento</button>}
      </form>
    </>
  )
}

export default [
  {
    ruta: '/masas', titulo: 'Masas', resumen: 'Lotes y su costo', orden: 11, menu: true, Componente: Masas,
    guia: {
      para: 'Guarda la receta de cada lote de masa para saber cuánto cuesta prepararlo, sin sacar cuentas a mano.',
      pasos: ['Ponle un nombre y elige el tipo.', 'Agrega los ingredientes con la cantidad que usas en un lote.', 'Mira el costo del lote antes de guardar.'],
      conecta: 'Usa los precios de Insumos. Los productos se arman a partir de una masa.',
    },
  },
  {
    ruta: '/rendimiento', titulo: 'Rendimiento', resumen: 'Unidades por lote', orden: 13, menu: true, Componente: Rendimiento,
    guia: {
      para: 'Dice cuántas unidades salen de un lote. Si falta, el costo del producto no se puede calcular.',
      pasos: ['Elige la masa.', 'Escribe cuántas unidades de cada producto salen de un lote.', 'Guarda y revisa el resultado en Costos.'],
      conecta: 'También lo puedes llenar en la ficha de cada producto.',
    },
  },
]
