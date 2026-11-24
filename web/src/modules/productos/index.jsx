import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Aviso, Campo, Encabezado, Seleccion, Vacio, dinero, porcentaje } from '../../components/ui.jsx'
import { crear, editar } from '../../services/apiClient.js'
import { useDatos } from '../../services/useDatos.js'
import Ingredientes, { aNumeros } from '../masas/Ingredientes.jsx'
import { estimar } from './estimar.js'

const VACIO = { nombre: '', precio: '', masaId: '', descripcion: '', categoria: '', unidadesPorLote: '', extras: [] }

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
    const { nombre, masaId, descripcion, categoria } = form
    const producto = {
      nombre, masaId, descripcion, categoria, precio: Number(form.precio), extras: aNumeros(form.extras),
      ...(form.unidadesPorLote && { unidadesPorLote: Number(form.unidadesPorLote) }),
    }
    intentar(() => (form.id ? editar('productos', form.id, producto) : crear('productos', producto)))
  }

  if (!datos) return <Aviso>{error}</Aviso>
  if (datos.masas.length === 0) {
    return (
      <>
        <Encabezado titulo="Productos" />
        <p className="vacio">Primero crea una masa. <Link to="/masas">Ir a masas</Link></p>
      </>
    )
  }

  const masaDe = (p) => datos.masas.find((m) => m.id === p.masaId)
  const rinde = (p) => masaDe(p)?.rendimiento?.find((r) => r.productoId === p.id)?.unidades ?? ''
  const abrir = (p) => setForm({ ...VACIO, ...p, unidadesPorLote: rinde(p) })
  const costo = estimar(form, datos.masas, datos.insumos)
  return (
    <>
      <Encabezado titulo="Productos">Lo que vendes en el mostrador y en tu tienda: una masa más sus extras.</Encabezado>
      <Aviso>{fallo}</Aviso>
      <div className="dos-paneles">
        <div>
          {datos.productos.length === 0 ? <Vacio titulo="Aún no hay productos"><p>Crea el primero con el formulario. Verás su costo mientras lo llenas.</p></Vacio> : (
            <div className="tabla">
              <table>
                <thead>
                  <tr><th>Producto</th><th className="num">Precio</th><th className="num">Por lote</th><th>Estado</th><th><span hidden>Acciones</span></th></tr>
                </thead>
                <tbody>
                  {datos.productos.map((p) => (
                    <tr key={p.id}>
                      <td><strong>{p.nombre}</strong><br /><small>{p.categoria || 'General'} · {masaDe(p)?.nombre}</small></td>
                      <td className="num">{dinero(p.precio)}</td>
                      <td className="num">{rinde(p) || <span className="chip atento">Falta</span>}</td>
                      <td><span className={`chip ${p.activo ? 'ok' : ''}`}>{p.activo ? 'Activo' : 'Inactivo'}</span></td>
                      <td className="acciones">
                        <button className="secundario" onClick={() => abrir(p)}>Editar</button>
                        <button className="secundario" onClick={() => intentar(() => editar('productos', p.id, { activo: !p.activo }))}>
                          {p.activo ? 'Desactivar' : 'Activar'}
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
          <h2>{form.id ? 'Editar producto' : 'Nuevo producto'}</h2>
          <Campo etiqueta="Nombre" value={form.nombre} onChange={cambiar('nombre')} />
          <Campo etiqueta="Categoría" ayuda="Agrupa tu menú en la tienda. Ej: Empanadas." value={form.categoria} onChange={cambiar('categoria')} />
          <Campo etiqueta="Precio de venta" type="number" inputMode="numeric" value={form.precio} onChange={cambiar('precio')} />
          <Seleccion
            etiqueta="Masa" vacia="Elige…" opciones={datos.masas.map((m) => [m.id, m.nombre])}
            value={form.masaId} onChange={cambiar('masaId')}
          />
          <Campo
            etiqueta="Unidades por lote de masa" ayuda="Cuántas salen de un lote. Sin este dato no hay costo." type="number"
            value={form.unidadesPorLote} onChange={cambiar('unidadesPorLote')}
          />
          <Campo etiqueta="Descripción (opcional)" ayuda="La lee el cliente en tu tienda." value={form.descripcion} onChange={cambiar('descripcion')} />
          <Ingredientes
            titulo="Insumos extra por unidad" insumos={datos.insumos}
            valor={form.extras} onChange={(extras) => setForm({ ...form, extras })}
          />
          {costo && (
            <p className="aviso ok" style={{ margin: 0 }}>
              Costo estimado: <strong>{dinero(costo.costo)}</strong>
              {costo.margen !== null && <> · Margen: <strong className={costo.margen < 0 ? 'alerta' : ''}>{porcentaje(costo.margen)}</strong></>}
              {' '}· Precio para ganar 50 %: <strong>{dinero(costo.sugerido)}</strong>
            </p>
          )}
          <button>{form.id ? 'Guardar cambios' : 'Crear producto'}</button>
          {form.id && <button type="button" className="secundario" onClick={() => setForm(VACIO)}>Cancelar</button>}
        </form>
      </div>
    </>
  )
}

export default {
  ruta: '/productos', titulo: 'Productos', resumen: 'Tu menú y sus recetas', orden: 12, menu: true, Componente: Productos,
  guia: {
    para: 'Crea lo que vendes y ve su costo y su margen mientras lo escribes.',
    pasos: ['Escribe el nombre, la categoría y el precio.', 'Elige la masa y cuántas unidades salen de un lote.', 'Agrega relleno, aceite o empaque como extras.', 'Desactiva lo que no vendas hoy: no se pierde el historial.'],
    conecta: 'Los productos activos aparecen en Ventas y en tu tienda.',
  },
}
