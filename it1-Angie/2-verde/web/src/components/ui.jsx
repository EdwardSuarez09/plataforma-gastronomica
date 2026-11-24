export const dinero = (valor) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor ?? 0)

export const porcentaje = (valor) => `${Math.round((valor ?? 0) * 100)} %`

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

export function Campo({ etiqueta, children, ...props }) {
  return (
    <label className="campo">
      <span>{etiqueta}</span>
      {children ?? <input {...props} />}
    </label>
  )
}

export const Seleccion = ({ etiqueta, opciones, vacia, ...props }) => (
  <Campo etiqueta={etiqueta}>
    <select {...props}>
      {vacia !== undefined && <option value="">{vacia}</option>}
      {opciones.map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
    </select>
  </Campo>
)
