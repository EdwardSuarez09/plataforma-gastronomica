import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Aviso, Campo, Encabezado, Seleccion } from '../../components/ui.jsx'
import { useNegocio } from '../../context/NegocioContext.jsx'
import { pedir } from '../../services/apiClient.js'
import { guardarSesion, leerSesion } from '../../services/sesion.js'

const TIPOS = ['Fritos', 'Restaurante', 'Panadería', 'Cafetería', 'Jugos', 'Otro'].map((t) => [t, t])
const VACIO = { nombre: '', tipo: 'Fritos', ciudad: '', moneda: 'COP', telefono: '', descripcion: '' }

function Negocio() {
  const navegar = useNavigate()
  const { negocio, setNegocio, error } = useNegocio()
  const [datos, setDatos] = useState(VACIO)
  const [mensaje, setMensaje] = useState(null)
  const esNuevo = !leerSesion()?.usuario.negocioId

  useEffect(() => {
    if (negocio) setDatos({ ...VACIO, ...negocio })
  }, [negocio])

  const cambiar = (campo) => (e) => setDatos({ ...datos, [campo]: e.target.value })

  const guardar = async (e) => {
    e.preventDefault()
    if (!datos.nombre.trim()) return setMensaje(['error', 'El nombre del negocio es obligatorio'])
    try {
      if (esNuevo) {
        const { negocio: creado, token } = await pedir('/negocio', { metodo: 'POST', datos })
        const sesion = leerSesion()
        guardarSesion({ token, usuario: { ...sesion.usuario, negocioId: creado.id } })
        setNegocio(creado)
        navegar('/')
      } else {
        setNegocio(await pedir('/negocio', { metodo: 'PUT', datos }))
        setMensaje(['ok', 'Cambios guardados'])
      }
    } catch (err) {
      setMensaje(['error', err.message])
    }
  }

  return (
    <>
      <Encabezado titulo={esNuevo ? 'Configura tu negocio' : 'Mi negocio'}>
        {negocio && <>Tu tienda pública: <a href={`/tienda/${negocio.slug}`}>/tienda/{negocio.slug}</a></>}
      </Encabezado>
      <form className="tarjeta formulario" onSubmit={guardar} noValidate>
        <Aviso>{error}</Aviso>
        {mensaje && <Aviso tipo={mensaje[0]}>{mensaje[1]}</Aviso>}
        <Campo etiqueta="Nombre del negocio" value={datos.nombre} onChange={cambiar('nombre')} />
        <Seleccion etiqueta="Tipo de negocio" opciones={TIPOS} value={datos.tipo} onChange={cambiar('tipo')} />
        <Campo etiqueta="Ciudad" value={datos.ciudad} onChange={cambiar('ciudad')} />
        <Seleccion etiqueta="Moneda" opciones={[['COP', 'Peso colombiano (COP)']]} value={datos.moneda} onChange={cambiar('moneda')} />
        <Campo etiqueta="Teléfono (opcional)" value={datos.telefono} onChange={cambiar('telefono')} />
        <Campo etiqueta="Descripción para la tienda (opcional)" value={datos.descripcion} onChange={cambiar('descripcion')} />
        <button>Guardar</button>
      </form>
    </>
  )
}

export default {
  ruta: '/negocio', titulo: 'Mi negocio', resumen: 'Datos y enlace de tu tienda', orden: 90, menu: true, Componente: Negocio,
}
