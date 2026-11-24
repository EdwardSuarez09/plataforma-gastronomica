import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Aviso, Campo, Encabezado, Seleccion } from '../../components/ui.jsx'
import { useNegocio } from '../../context/NegocioContext.jsx'
import { pedir } from '../../services/apiClient.js'
import { guardarSesion, leerSesion } from '../../services/sesion.js'
import { Portada } from '../tienda/Dibujo.jsx'
import '../tienda/tienda.css'
import './negocio.css'

const TIPOS = ['Fritos', 'Restaurante', 'Panadería', 'Cafetería', 'Jugos', 'Otro'].map((t) => [t, t])
const VACIO = { nombre: '', tipo: 'Fritos', ciudad: '', moneda: 'COP', telefono: '', descripcion: '' }

function Negocio() {
  const navegar = useNavigate()
  const { negocio, setNegocio, error } = useNegocio()
  const [datos, setDatos] = useState(VACIO)
  const [mensaje, setMensaje] = useState(null)
  const [copiado, setCopiado] = useState(false)
  const esNuevo = !leerSesion()?.usuario.negocioId

  useEffect(() => {
    if (negocio) setDatos({ ...VACIO, ...negocio })
  }, [negocio])

  const cambiar = (campo) => (e) => setDatos({ ...datos, [campo]: e.target.value })
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/tienda/${negocio.slug}`)
      setCopiado(true)
    } catch {
      setMensaje(['error', 'No se pudo copiar. Abre tu tienda y copia la dirección del navegador.'])
    }
  }

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
        {esNuevo ? 'Es el único paso antes de empezar. Podrás cambiarlo después.' : 'Estos datos los ven los clientes en tu tienda.'}
      </Encabezado>
      <div className="negocio-paneles">
        <form className="tarjeta formulario" onSubmit={guardar} noValidate>
          <Aviso>{error}</Aviso>
          {mensaje && <Aviso tipo={mensaje[0]}>{mensaje[1]}</Aviso>}
          <Campo etiqueta="Nombre del negocio" value={datos.nombre} onChange={cambiar('nombre')} />
          <Seleccion etiqueta="Tipo de negocio" opciones={TIPOS} value={datos.tipo} onChange={cambiar('tipo')} />
          <Campo etiqueta="Ciudad" value={datos.ciudad} onChange={cambiar('ciudad')} />
          <Seleccion etiqueta="Moneda" opciones={[['COP', 'Peso colombiano (COP)']]} value={datos.moneda} onChange={cambiar('moneda')} />
          <Campo etiqueta="Teléfono (opcional)" type="tel" value={datos.telefono} onChange={cambiar('telefono')} />
          <Campo etiqueta="Descripción para la tienda (opcional)" value={datos.descripcion} onChange={cambiar('descripcion')} />
          <button>Guardar</button>
        </form>
        <aside className="vista-previa">
          <h2>Así te verán</h2>
          <div className="local">
            <Portada tipo={datos.tipo} />
            <div className="local-cuerpo">
              <strong className="vista-nombre">{datos.nombre || 'Nombre de tu negocio'}</strong>
              <p className="local-lugar">{datos.tipo} · {datos.ciudad || 'Tu ciudad'}</p>
              {datos.descripcion && <p className="local-descripcion">{datos.descripcion}</p>}
            </div>
          </div>
          {negocio && (
            <div className="compartir">
              <a href={`/tienda/${negocio.slug}`}>Abrir mi tienda</a>
              <button type="button" className="secundario" onClick={copiar}>{copiado ? 'Enlace copiado' : 'Copiar enlace'}</button>
            </div>
          )}
        </aside>
      </div>
    </>
  )
}

export default {
  ruta: '/negocio', titulo: 'Mi negocio', resumen: 'Datos y enlace de tu tienda', orden: 90, menu: true, Componente: Negocio,
  guia: {
    para: 'Define cómo se presenta tu negocio ante los clientes.',
    pasos: ['Completa el nombre, el tipo y la ciudad.', 'Agrega teléfono y una frase corta que antoje.', 'Copia el enlace de tu tienda y compártelo por WhatsApp o redes.'],
    conecta: 'Es lo que aparece en la vitrina de Tiendas.',
  },
}
