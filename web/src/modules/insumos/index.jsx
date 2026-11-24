import { useState } from 'react'
import { Aviso, Campo, Encabezado, Seleccion, dinero } from '../../components/ui.jsx'
import { crear, editar, eliminar } from '../../services/apiClient.js'
import { useDatos } from '../../services/useDatos.js'

const UNIDADES = ['kg', 'g', 'lb', 'L', 'ml', 'unidad'].map((u) => [u, u])
const VACIO = { nombre: '', unidad: 'kg', precio: '', stock: '' }

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
    const insumo = { nombre: form.nombre, unidad: form.unidad, precio: Number(form.precio), stock: Number(form.stock || 0) }
    const ok = await intentar(() => (form.id ? editar('insumos', form.id, insumo) : crear('insumos', insumo)))
    if (ok) setForm(VACIO)
  }

  const borrar = (i) =>
    window.confirm(`¿Eliminar "${i.nombre}"?`) && intentar(() => eliminar('insumos', i.id))

  return (
    <>
      <Encabezado titulo="Insumos">Unidad, precio y stock de lo que usas para producir.</Encabezado>
      <Aviso>{error || fallo}</Aviso>
      <form className="tarjeta formulario" onSubmit={guardar} noValidate>
        <Campo etiqueta="Nombre" value={form.nombre} onChange={cambiar('nombre')} />
        <Seleccion etiqueta="Unidad" opciones={UNIDADES} value={form.unidad} onChange={cambiar('unidad')} />
        <Campo etiqueta="Precio por unidad" type="number" value={form.precio} onChange={cambiar('precio')} />
        <Campo etiqueta="Stock" type="number" value={form.stock} onChange={cambiar('stock')} />
        <button>{form.id ? 'Guardar cambios' : 'Agregar insumo'}</button>
        {form.id && <button type="button" className="secundario" onClick={() => setForm(VACIO)}>Cancelar</button>}
      </form>
      <Campo etiqueta="Buscar" type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
      <div className="tabla">
        <table>
          <thead><tr><th>Insumo</th><th>Unidad</th><th>Precio</th><th>Stock</th><th /></tr></thead>
          <tbody>
            {filtrarPorNombre(datos?.insumos ?? [], busqueda).map((i) => (
              <tr key={i.id}>
                <td>{i.nombre}</td><td>{i.unidad}</td><td>{dinero(i.precio)}</td><td>{i.stock}</td>
                <td className="acciones">
                  <button className="secundario" onClick={() => setForm(i)}>Editar</button>
                  <button className="peligro" onClick={() => borrar(i)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {datos?.insumos.length === 0 && <p className="vacio">Aún no hay insumos. Agrega el primero arriba.</p>}
    </>
  )
}

export default {
  ruta: '/insumos', titulo: 'Insumos', resumen: 'Precios y stock', orden: 10, menu: true, Componente: Insumos,
}
