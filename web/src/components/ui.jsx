import { useId } from 'react'

export const dinero = (valor) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor ?? 0)

export const porcentaje = (valor) => `${Math.round((valor ?? 0) * 100)} %`

export const numero = (valor) => new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(valor ?? 0)

export const hoy = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())

export function Encabezado({ titulo, children }) {
  return (
    <header className="encabezado">
      <h1>{titulo}</h1>
      {children && <p>{children}</p>}
    </header>
  )
}

export function Aviso({ tipo = 'error', children }) {
  return children ? <p className={`aviso ${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>{children}</p> : null
}

// La ayuda queda fuera de la etiqueta: el lector de pantalla la lee como descripción, no como nombre.
function Rotulo({ etiqueta, ayuda, control }) {
  const id = useId()
  const unido = (descripcion) => (
    <>
      <span>{etiqueta}</span>
      {control(descripcion)}
    </>
  )
  if (!ayuda) return <label className="campo">{unido()}</label>
  return (
    <div className="campo">
      <label>{unido(id)}</label>
      <small id={id}>{ayuda}</small>
    </div>
  )
}

export function Campo({ etiqueta, ayuda, children, ...props }) {
  return <Rotulo etiqueta={etiqueta} ayuda={ayuda} control={(id) => children ?? <input aria-describedby={id} {...props} />} />
}

export function Seleccion({ etiqueta, ayuda, opciones, vacia, ...props }) {
  return (
    <Rotulo
      etiqueta={etiqueta} ayuda={ayuda}
      control={(id) => (
        <select aria-describedby={id} {...props}>
          {vacia !== undefined && <option value="">{vacia}</option>}
          {opciones.map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
        </select>
      )}
    />
  )
}

export const Dato = ({ nombre, valor, tono = '', children }) => (
  <article className={`dato ${tono}`}>
    <span>{nombre}</span><strong>{valor}</strong>{children && <small>{children}</small>}
  </article>
)

export const Vacio = ({ titulo, children }) => (
  <div className="vacio-caja"><strong>{titulo}</strong>{children}</div>
)
