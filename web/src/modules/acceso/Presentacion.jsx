import { useEffect, useRef, useState } from 'react'
import { Dibujo } from '../tienda/Dibujo.jsx'

export const ESCENAS = [
  { nombre: 'Tienda', titulo: 'Tu menú, en línea', texto: 'Publica lo que vendes y recibe pedidos para recoger.', trazo: 'M5 11v9h14v-9M3 9l2-5h14l2 5a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0Z' },
  { nombre: 'Pedidos', titulo: 'Pedidos que llegan solos', texto: 'Aparecen al instante, sin recargar la página.', trazo: 'M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6m-6 4h6' },
  { nombre: 'Inventario', titulo: 'El inventario se mueve solo', texto: 'Cada venta descuenta los insumos de la receta.', trazo: 'm12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Zm0 9 8-4.5M12 12v9m0-9L4 7.5' },
  { nombre: 'Costos', titulo: 'Sabes cuánto ganas', texto: 'Costo y margen de cada producto, siempre al día.', trazo: 'M20 13l-7 7a1.5 1.5 0 0 1-2 0L4 13V4h9l7 7a1.5 1.5 0 0 1 0 2ZM8.5 8.5h.1' },
  { nombre: 'Plan', titulo: 'Produces lo justo', texto: 'Pronóstico de ventas y un plan para ganar más.', trazo: 'm3 17 6-6 4 4 8-9m0 0h-5m5 0v5' },
]
const CADA_MS = 4500
const RADIO = 38

// Reparte los puntos en círculo alrededor del logo (en porcentaje).
export const posicion = (i, total) => {
  const angulo = ((i / total) * 360 - 90) * (Math.PI / 180)
  return { x: 50 + RADIO * Math.cos(angulo), y: 50 + RADIO * Math.sin(angulo) }
}

const sinMovimiento = () => window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false

export default function Presentacion() {
  const [actual, setActual] = useState(0)
  const [pausada, setPausada] = useState(sinMovimiento)
  const seccion = useRef(null)

  useEffect(() => {
    if (pausada) return
    const reloj = setInterval(() => setActual((n) => (n + 1) % ESCENAS.length), CADA_MS)
    return () => clearInterval(reloj)
  }, [pausada, actual])

  // El fondo acompaña al puntero: da profundidad sin estorbar la lectura.
  const mover = (e) => {
    const caja = seccion.current.getBoundingClientRect()
    seccion.current.style.setProperty('--px', ((e.clientX - caja.left) / caja.width - 0.5).toFixed(3))
    seccion.current.style.setProperty('--py', ((e.clientY - caja.top) / caja.height - 0.5).toFixed(3))
  }

  const escena = ESCENAS[actual]
  return (
    <section className={`presentacion ${pausada ? 'quieta' : ''}`} aria-label="Conoce Sazonexo" ref={seccion} onPointerMove={mover}>
      <div className="presentacion-fondo" aria-hidden="true">
        <i /><i /><i />
        {['empanada', 'jugo', 'huevo', 'cafe', 'pan'].map((d) => <Dibujo key={d} nombre={d} />)}
      </div>

      <header className="presentacion-marca">
        <img src="/logo.svg" alt="" />
        <div>
          <p className="nombre" aria-label="Sazonexo">
            {[...'Sazonexo'].map((letra, i) => <span key={i} aria-hidden="true" className={i > 3 ? 'nexo' : ''} style={{ '--i': i }}>{letra}</span>)}
          </p>
          <p className="lema">Tu sazón, todo conectado.</p>
        </div>
      </header>

      <div className="constelacion">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle className="orbita" cx="50" cy="50" r={RADIO} />
          {ESCENAS.map((e, i) => {
            const { x, y } = posicion(i, ESCENAS.length)
            return <line key={e.nombre} className={i === actual ? 'activa' : ''} x1="50" y1="50" x2={x} y2={y} pathLength="1" />
          })}
        </svg>
        <svg className="nucleo" viewBox="0 0 48 48" aria-hidden="true">
          <rect width="48" height="48" rx="13" fill="#f4bf4a" />
          <path d="M9 28.5h30a15 12.5 0 0 1-30 0Z" fill="#15362a" />
          <path className="vapor" pathLength="1" d="M20 24c5.4 0 8-1.5 8-3.7 0-5-9.5-2.6-9.5-7.6 0-2.7 3-4.2 9-4.2" fill="none" stroke="#b8410e" strokeWidth="3.2" strokeLinecap="round" />
          <circle cx="20" cy="24" r="3.2" fill="#b8410e" /><circle className="punta" cx="28.5" cy="8.5" r="3.2" fill="#b8410e" />
        </svg>
        {ESCENAS.map((e, i) => {
          const { x, y } = posicion(i, ESCENAS.length)
          return (
            <button
              key={e.nombre} type="button" className="nodo" style={{ left: `${x}%`, top: `${y}%`, '--i': i }}
              aria-pressed={i === actual} onClick={() => setActual(i)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d={e.trazo} /></svg>
              <span>{e.nombre}</span>
            </button>
          )
        })}
      </div>

      <div className="relato">
        <div key={actual} className="relato-texto" aria-live={pausada ? 'polite' : 'off'}>
          <h2>{escena.titulo}</h2>
          <p>{escena.texto}</p>
        </div>
        <div className="avance">
          <div className="avance-barras" aria-hidden="true">
            {ESCENAS.map((e, i) => <i key={`${e.nombre}-${i === actual ? actual : ''}`} className={i < actual ? 'vista' : i === actual ? 'corre' : ''} />)}
          </div>
          <button type="button" className="pausa" onClick={() => setPausada(!pausada)}>{pausada ? 'Reproducir' : 'Pausar'}</button>
        </div>
      </div>
    </section>
  )
}
