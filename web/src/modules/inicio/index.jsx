import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Aviso, Encabezado, dinero, hoy, porcentaje } from '../../components/ui.jsx'
import { useDatos } from '../../services/useDatos.js'
import { BarrasPorDia, Ranking } from './Graficos.jsx'
import './inicio.css'

const PERIODOS = [['Hoy', 1], ['7 días', 7], ['30 días', 30], ['90 días', 90]]
const ATAJOS = [['/ventas', 'Registrar venta'], ['/compras', 'Registrar compra'], ['/inventario', 'Ajustar inventario'], ['/produccion', 'Planear producción']]

function restarDias(fecha, dias) {
  const d = new Date(`${fecha}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - dias)
  return d.toISOString().slice(0, 10)
}

const Indicador = ({ nombre, valor, principal, children }) => (
  <article className={`tarjeta indicador ${principal ? 'principal' : ''}`}><span>{nombre}</span><strong>{valor}</strong>{children && <small>{children}</small>}</article>
)

const Bloque = ({ titulo, ayuda, children }) => (
  <section className="tarjeta"><h2>{titulo}</h2>{ayuda && <p className="bloque-ayuda">{ayuda}</p>}{children}</section>
)

const cambioTexto = (c) =>
  (c === null ? 'Sin periodo anterior para comparar' : `${c >= 0 ? '▲' : '▼'} ${porcentaje(Math.abs(c))} frente al periodo anterior`)

// Lo que el dueño debería resolver hoy, con el enlace para hacerlo.
export function pendientesDe(p) {
  const lista = []
  if (p.pendientes > 0) lista.push(['/pedidos', p.pendientes === 1 ? '1 pedido espera atención' : `${p.pendientes} pedidos esperan atención`, 'Atender'])
  if (p.bajos.length > 0) lista.push(['/inventario', p.bajos.length === 1 ? '1 insumo se está acabando' : `${p.bajos.length} insumos se están acabando`, 'Revisar'])
  return lista
}

function PrimerosPasos() {
  const { datos } = useDatos('insumos', 'masas', 'productos')
  if (!datos || datos.productos.length > 0) return null
  const pasos = [
    ['/insumos', 'Registra tus insumos', 'Harina, aceite, queso… con su precio.', datos.insumos.length > 0],
    ['/masas', 'Crea una masa', 'La receta base y cuánto lleva cada lote.', datos.masas.length > 0],
    ['/productos', 'Agrega tus productos', 'Con su precio aparecen en tu tienda.', false],
    ['/ventas', 'Registra tu primera venta', 'Desde ahí el panel se llena solo.', false],
  ]
  return (
    <section className="tarjeta primeros">
      <h2>Empieza en 4 pasos</h2>
      <ol>
        {pasos.map(([ruta, nombre, detalle, hecho]) => (
          <li key={ruta} className={hecho ? 'hecho' : ''}>
            <Link to={ruta}>{nombre}</Link><span>{hecho ? 'Listo' : detalle}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}

function Inicio() {
  const [dias, setDias] = useState(7)
  const { datos, error } = useDatos(`panel?desde=${restarDias(hoy(), dias - 1)}&hasta=${hoy()}`)
  const p = datos && Object.values(datos)[0]
  const titulo = <Encabezado titulo="Panel del negocio">Cómo va tu negocio. Se calcula con cada venta, compra, pedido y ajuste que registras.</Encabezado>
  if (!p?.porDia) return <>{titulo}<Aviso>{error}</Aviso></>

  const pendientes = pendientesDe(p)
  return (
    <>
      {titulo}
      <nav className="atajos" aria-label="Acciones rápidas">
        {ATAJOS.map(([ruta, nombre]) => <Link key={ruta} to={ruta}>{nombre}</Link>)}
      </nav>
      {p.ventas === 0 && <PrimerosPasos />}
      {pendientes.length > 0 && (
        <section className="atencion" aria-label="Necesita tu atención">
          {pendientes.map(([ruta, nombre, accion]) => (
            <p key={ruta}><strong>{nombre}</strong><Link to={ruta}>{accion}</Link></p>
          ))}
        </section>
      )}
      {p.sinCosto > 0 && <p className="alerta">{p.sinCosto} líneas de venta están sin costo guardado: la ganancia real es menor.</p>}

      <div className="filtros" role="group" aria-label="Periodo">
        {PERIODOS.map(([nombre, n]) => (
          <button key={n} className={n === dias ? '' : 'secundario'} aria-pressed={n === dias} onClick={() => setDias(n)}>{nombre}</button>
        ))}
      </div>
      <div className="indicadores">
        <Indicador principal nombre="Ventas" valor={dinero(p.ingresos)}>{cambioTexto(p.cambio)}</Indicador>
        <Indicador principal nombre="Ganancia" valor={dinero(p.ganancia)}>Margen {porcentaje(p.margen)} sobre insumos</Indicador>
        <Indicador nombre="Costo de lo vendido" valor={dinero(p.costo)}>{p.unidades} unidades</Indicador>
        <Indicador nombre="Venta promedio" valor={dinero(p.ticket)}>{p.ventas} ventas</Indicador>
        <Indicador nombre="Compras" valor={dinero(p.compras)}>Desperdicio {dinero(p.desperdicio)}</Indicador>
        <Indicador nombre="Inventario" valor={dinero(p.inventario)}><Link to="/inventario">Ver inventario</Link></Indicador>
        <Indicador nombre="Pedidos por atender" valor={p.pendientes}><Link to="/pedidos">Ver pedidos</Link></Indicador>
        <Indicador nombre="Por la tienda" valor={dinero(p.canales.pedido_digital)}>Mostrador {dinero(p.canales.presencial)}</Indicador>
      </div>
      <div className="bloques">
        <Bloque titulo="Ventas por día">
          <BarrasPorDia datos={p.porDia} formato={dinero} series={[{ campo: 'ingresos', nombre: 'Ventas', clase: 'serie-a' }]} />
        </Bloque>
        <Bloque titulo="Productos que más ganan" ayuda="Ganancia en el periodo, después de descontar insumos.">
          {p.productos.length === 0 ? <p className="vacio">Sin ventas en este periodo.</p> : (
            <Ranking formato={dinero} filas={p.productos.slice(0, 6).map((x) => ({ nombre: x.nombre, valor: x.ganancia, nota: `${x.unidades} und` }))} />
          )}
        </Bloque>
        <Bloque titulo="Pronóstico contra lo vendido (7 días)" ayuda="Si las barras se parecen, puedes confiar más en el pronóstico.">
          {p.comparacion.length === 0 ? <p className="vacio">Aparece cuando haya 14 días con ventas.</p> : (
            <BarrasPorDia
              datos={p.comparacion} formato={(n) => `${n} und`}
              series={[{ campo: 'pronostico', nombre: 'Pronóstico', clase: 'serie-b' }, { campo: 'real', nombre: 'Vendido', clase: 'serie-a' }]}
            />
          )}
        </Bloque>
        <Bloque titulo="Insumos por reponer" ayuda="Toca uno para registrar su compra.">
          {p.bajos.length === 0 ? <p className="vacio">Todo está por encima del mínimo.</p> : (
            <ul className="lista">
              {p.bajos.map((i) => (
                <li key={i.id}><Link to={`/compras?insumo=${i.id}`}>{i.nombre}</Link><span>{Number(i.stock).toLocaleString('es-CO', { maximumFractionDigits: 2 })} de {i.stockMinimo} {i.unidad}</span></li>
              ))}
            </ul>
          )}
        </Bloque>
      </div>
    </>
  )
}

export default {
  ruta: '/', titulo: 'Panel', resumen: 'Cómo va tu negocio', orden: 0, menu: true, Componente: Inicio,
  guia: {
    para: 'Reúne en una pantalla cuánto vendes, cuánto ganas y qué necesita tu atención.',
    pasos: ['Empieza por los avisos: pedidos por atender e insumos que se acaban.', 'Cambia el periodo para comparar: hoy, 7, 30 o 90 días.', 'Mira qué productos te dejan más ganancia.'],
    conecta: 'No hay que llenar nada aquí: todo sale de Ventas, Pedidos, Compras e Inventario.',
  },
}
