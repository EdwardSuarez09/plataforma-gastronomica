import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Aviso, Campo, Encabezado, Seleccion, dinero } from '../../components/ui.jsx'
import { crear, editar, eliminar, pedir } from '../../services/apiClient.js'
import { useDatos } from '../../services/useDatos.js'
import Ingredientes, { aNumeros } from './Ingredientes.jsx'

const TIPOS = ['tradicional', 'yuca', 'plátano', 'otro'].map((t) => [t, t])
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
    return <p className="vacio">Primero registra insumos. <Link to="/insumos">Ir a insumos</Link></p>
  }
  return (
    <>
      <Encabezado titulo="Masas">Cada masa es un lote; su costo se calcula con los precios vigentes.</Encabezado>
      <Aviso>{fallo}</Aviso>
      <form className="tarjeta formulario" onSubmit={guardar} noValidate>
        <Campo etiqueta="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        <Seleccion etiqueta="Tipo" opciones={TIPOS} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} />
        <Ingredientes
          titulo="Ingredientes del lote" insumos={datos.insumos}
          valor={form.ingredientes} onChange={(ingredientes) => setForm({ ...form, ingredientes })}
        />
        <button>{form.id ? 'Guardar cambios' : 'Crear masa'}</button>
      </form>
      <div className="tabla">
        <table>
          <thead><tr><th>Masa</th><th>Tipo</th><th>Ingredientes</th><th>Costo del lote</th><th /></tr></thead>
          <tbody>
            {datos.masas.map((m) => (
              <tr key={m.id}>
                <td>{m.nombre}</td><td>{m.tipo}</td><td>{m.ingredientes.length}</td><td>{dinero(m.costoLote)}</td>
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
      <Encabezado titulo="Rendimiento">Cuántas unidades de cada producto salen de un lote de masa.</Encabezado>
      {mensaje && <Aviso tipo={mensaje[0]}>{mensaje[1]}</Aviso>}
      <form className="tarjeta formulario" onSubmit={guardar} noValidate>
        <Seleccion
          etiqueta="Masa" vacia="Elige una masa…" opciones={datos.masas.map((m) => [m.id, m.nombre])}
          value={masaId} onChange={(e) => elegir(e.target.value)}
        />
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
  { ruta: '/masas', titulo: 'Masas', resumen: 'Lotes y su costo', orden: 11, menu: true, Componente: Masas },
  { ruta: '/rendimiento', titulo: 'Rendimiento', resumen: 'Unidades por lote', orden: 13, menu: true, Componente: Rendimiento },
]
