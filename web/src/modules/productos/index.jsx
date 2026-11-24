import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Aviso, Campo, Encabezado, Seleccion, dinero } from '../../components/ui.jsx'
import { crear, editar } from '../../services/apiClient.js'
import { useDatos } from '../../services/useDatos.js'
import Ingredientes, { aNumeros } from '../masas/Ingredientes.jsx'

const VACIO = { nombre: '', precio: '', masaId: '', descripcion: '', extras: [] }

function Productos() {
  const { datos, error, recargar } = useDatos('productos', 'masas', 'insumos')
  const [form, setForm] = useState(VACIO)
  const [fallo, setFallo] = useState('')
  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })

  const intentar = async (accion) => {
    try {
      await accion()
      setFallo('')
      setForm(VACIO)
      await recargar()
    } catch (e) {
      setFallo(e.message)
    }
  }
  const guardar = (e) => {
    e.preventDefault()
    const { nombre, masaId, descripcion } = form
    const producto = { nombre, masaId, descripcion, precio: Number(form.precio), extras: aNumeros(form.extras) }
    intentar(() => (form.id ? editar('productos', form.id, producto) : crear('productos', producto)))
  }

  if (!datos) return <Aviso>{error}</Aviso>
  if (datos.masas.length === 0) return <p className="vacio">Primero crea una masa. <Link to="/masas">Ir a masas</Link></p>
  return (
    <>
      <Encabezado titulo="Productos">Lo que vendes: una masa más sus extras.</Encabezado>
      <Aviso>{fallo}</Aviso>
      <form className="tarjeta formulario" onSubmit={guardar} noValidate>
        <Campo etiqueta="Nombre" value={form.nombre} onChange={cambiar('nombre')} />
        <Campo etiqueta="Precio de venta" type="number" value={form.precio} onChange={cambiar('precio')} />
        <Seleccion
          etiqueta="Masa" vacia="Elige…" opciones={datos.masas.map((m) => [m.id, m.nombre])}
          value={form.masaId} onChange={cambiar('masaId')}
        />
        <Campo etiqueta="Descripción (opcional)" value={form.descripcion} onChange={cambiar('descripcion')} />
        <Ingredientes
          titulo="Insumos extra por unidad" insumos={datos.insumos}
          valor={form.extras} onChange={(extras) => setForm({ ...form, extras })}
        />
        <button>{form.id ? 'Guardar cambios' : 'Crear producto'}</button>
      </form>
      <div className="tabla">
        <table>
          <thead><tr><th>Producto</th><th>Precio</th><th>Masa</th><th>Estado</th><th /></tr></thead>
          <tbody>
            {datos.productos.map((p) => (
              <tr key={p.id}>
                <td>{p.nombre}</td><td>{dinero(p.precio)}</td>
                <td>{datos.masas.find((m) => m.id === p.masaId)?.nombre}</td>
                <td>{p.activo ? 'Activo' : 'Inactivo'}</td>
                <td className="acciones">
                  <button className="secundario" onClick={() => setForm(p)}>Editar</button>
                  <button className="secundario" onClick={() => intentar(() => editar('productos', p.id, { activo: !p.activo }))}>
                    {p.activo ? 'Desactivar' : 'Activar'}
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

export default {
  ruta: '/productos', titulo: 'Productos', resumen: 'Tu menú y sus recetas', orden: 12, menu: true, Componente: Productos,
}
