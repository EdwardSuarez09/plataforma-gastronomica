import { useState } from 'react'
import Icono from './Icono.jsx'

const CLAVE = 'guias-vistas'
const leerVistas = () => {
  try {
    return JSON.parse(localStorage.getItem(CLAVE)) ?? []
  } catch {
    return []
  }
}

// Cada módulo puede traer guia: { para, pasos: [], conecta }. Se abre sola la primera vez
// y después queda a un clic con el botón "¿Cómo funciona?".
export default function Guia({ modulo, grupo }) {
  const { guia, ruta, titulo } = modulo
  const [abierta, setAbierta] = useState(() => Boolean(guia) && !leerVistas().includes(ruta))
  if (!guia) return null

  const alternar = () => {
    if (abierta) localStorage.setItem(CLAVE, JSON.stringify([...new Set([...leerVistas(), ruta])]))
    setAbierta(!abierta)
  }
  return (
    <>
      <div className="barra-modulo">
        <span>{grupo}</span>
        <button className="ayuda-boton" aria-expanded={abierta} onClick={alternar}>
          <Icono nombre="ayuda" tamano={18} />¿Cómo funciona?
        </button>
      </div>
      {abierta && (
        <section className="guia" aria-label={`Guía de ${titulo}`}>
          <div>
            <h2>Para qué sirve</h2>
            <p>{guia.para}</p>
          </div>
          <ol>{guia.pasos.map((paso) => <li key={paso}>{paso}</li>)}</ol>
          {guia.conecta && <p className="conecta">{guia.conecta}</p>}
          <button onClick={alternar}>Entendido</button>
        </section>
      )}
    </>
  )
}
