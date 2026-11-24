import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Aviso, Campo, Encabezado, Seleccion, dinero } from '../../components/ui.jsx'
import { crear, editar, eliminar } from '../../services/apiClient.js'
import { useDatos } from '../../services/useDatos.js'
import { cantidad, nivelDe } from '../inventario/nivel.js'

const UNIDADES = [['kg', 'Kilo (kg)'], ['g', 'Gramo (g)'], ['lb', 'Libra (lb)'], ['L', 'Litro (L)'], ['ml', 'Mililitro (ml)'], ['unidad', 'Unidad']]
const VACIO = { nombre: '', unidad: 'kg', precio: '', stock: '', stockMinimo: '' }

export const filtrarPorNombre = (lista, texto) =>
  lista.filter((i) => i.nombre.toLowerCase().includes(texto.trim().toLowerCase()))

function Insumos() {
  const { datos, error, recargar } = useDatos('insumos')
  const [form, setForm] = useState(VACIO)
  const [busqueda, setBusqueda] = useState('')
  const [fallo, setFallo] = useState('')
  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })

  const intentar = async (accion) => {
    try {
      await accion()
      setFallo('')
      await recargar()
      return true
    } catch (e) {
      setFallo(e.message)
      return false
    }
  }

  const guardar = async (e) => {
    e.preventDefault()
    const { nombre, unidad } = form
    const insumo = { nombre, unidad, precio: Number(form.precio), stockMinimo: Number(form.stockMinimo || 0) }
    if (!form.id) insumo.stock = Number(form.stock || 0)
    const ok = await intentar(() => (form.id ? editar('insumos', form.id, insumo) : crear('insumos', insumo)))
    if (ok) setForm(VACIO)
  }

  const borrar = (i) =>
    window.confirm(`¿Eliminar "${i.nombre}"?`) && intentar(() => eliminar('insumos', i.id))

  const lista = datos?.insumos ?? []
  const visibles = filtrarPorNombre(lista, busqueda)
  const porReponer = lista.filter((i) => nivelDe(i).tono === 'mal').length
  const valor = lista.reduce((suma, i) => suma + Math.max(0, i.stock) * i.precio, 0)
  return (
    <>
      <Encabezado titulo="Insumos">Lo que usas para producir. El stock cambia solo con compras, ventas y ajustes.</Encabezado>
      <Aviso>{error || fallo}</Aviso>
      {datos && (
        <div className="resumen">
          <article className="dato"><span>Insumos registrados</span><strong>{lista.length}</strong></article>
          <article className={`dato ${porReponer ? 'mal' : 'ok'}`}><span>Por reponer</span><strong>{porReponer}</strong><small>{porReponer ? 'Revisa los que están en rojo' : 'Todo está por encima del mínimo'}</small></article>
          <article className="dato"><span>Valor de lo que tienes</span><strong>{dinero(valor)}</strong></article>
        </div>
      )}
      <div className="dos-paneles">
        <div>
          <div className="herramientas">
            <Campo etiqueta="Buscar" type="search" placeholder="Nombre del insumo" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
          {visibles.length > 0 && (
            <div className="tabla">
              <table>
                <thead><tr><th>Insumo</th><th className="num">Precio</th><th className="num">Stock</th><th>Nivel</th><th><span hidden>Acciones</span></th></tr></thead>
                <tbody>
                  {visibles.map((i) => {
                    const nivel = nivelDe(i)
                    return (
                      <tr key={i.id}>
                        <td><strong>{i.nombre}</strong></td>
                        <td className="num">{dinero(i.precio)} <small>/ {i.unidad}</small></td>
                        <td className="num">{cantidad(i.stock)} <small>{i.unidad}</small></td>
                        <td><span className={`chip ${nivel.tono}`}>{nivel.texto}</span></td>
                        <td className="acciones">
                          <button className="secundario" onClick={() => setForm(i)}>Editar</button>
                          <button className="peligro" onClick={() => borrar(i)}>Eliminar</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          {lista.length > 0 && lista.length < 5 && !busqueda && (
            <div className="vacio-caja" style={{ marginTop: '1rem' }}>
              <strong>Sigue armando tu despensa</strong>
              <p>Agrega lo que usas a diario. Cuando tengas los ingredientes de una receta, crea tu primera masa.</p>
              <Link to="/masas">Ir a masas</Link>
            </div>
          )}
          {datos && lista.length === 0 && (
            <div className="vacio-caja">
              <strong>Aún no hay insumos</strong>
              <p>Empieza por los que más usas: harina, aceite, queso. Después podrás crear tus masas.</p>
            </div>
          )}
          {lista.length > 0 && visibles.length === 0 && <p className="vacio">Ningún insumo se llama así.</p>}
        </div>
        <form className="tarjeta formulario panel-lateral" onSubmit={guardar} noValidate>
          <h2>{form.id ? 'Editar insumo' : 'Nuevo insumo'}</h2>
          <Campo etiqueta="Nombre" value={form.nombre} onChange={cambiar('nombre')} />
          <Seleccion etiqueta="Unidad" ayuda="Cómo lo compras y lo mides." opciones={UNIDADES} value={form.unidad} onChange={cambiar('unidad')} />
          <Campo etiqueta="Precio por unidad" type="number" inputMode="numeric" value={form.precio} onChange={cambiar('precio')} />
          {!form.id && <Campo etiqueta="Stock inicial" ayuda="Cuánto tienes hoy. Si no sabes, déjalo vacío." type="number" value={form.stock} onChange={cambiar('stock')} />}
          <Campo etiqueta="Avisar cuando baje de" ayuda="Te lo mostramos en el panel para que compres a tiempo." type="number" value={form.stockMinimo} onChange={cambiar('stockMinimo')} />
          <button>{form.id ? 'Guardar cambios' : 'Agregar insumo'}</button>
          {form.id && <button type="button" className="secundario" onClick={() => setForm(VACIO)}>Cancelar</button>}
          {form.id && <p className="explica">¿Cambió la cantidad? Regístralo en <Link to="/inventario">Inventario</Link>.</p>}
        </form>
      </div>
    </>
  )
}

export default {
  ruta: '/insumos', titulo: 'Insumos', resumen: 'Precios y stock', orden: 10, menu: true, Componente: Insumos,
  guia: {
    para: 'Es la lista de todo lo que compras para cocinar, con su precio y cuánto te queda.',
    pasos: ['Agrega el insumo con su unidad y su precio.', 'Escribe el mínimo para que te avisemos a tiempo.', 'Si cambia el precio, edítalo: los costos se recalculan solos.'],
    conecta: 'Las Masas y los Productos se arman con insumos. Las Compras suben el stock y las Ventas lo bajan.',
  },
}
