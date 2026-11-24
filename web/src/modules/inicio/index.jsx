import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Aviso, Encabezado, dinero, hoy, porcentaje } from '../../components/ui.jsx'
import { useDatos } from '../../services/useDatos.js'
import { BarrasPorDia, Ranking } from './Graficos.jsx'
import './inicio.css'

const PERIODOS = [['Hoy', 1], ['7 días', 7], ['30 días', 30], ['90 días', 90]]

function restarDias(fecha, dias) {
  const d = new Date(`${fecha}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - dias)
  return d.toISOString().slice(0, 10)
}

const Indicador = ({ nombre, valor, children }) => (
  <article className="tarjeta indicador"><span>{nombre}</span><strong>{valor}</strong>{children && <small>{children}</small>}</article>
)

const Bloque = ({ titulo, children }) => <section className="tarjeta"><h2>{titulo}</h2>{children}</section>

const cambioTexto = (c) =>
  (c === null ? 'Sin periodo anterior para comparar' : `${c >= 0 ? '▲' : '▼'} ${porcentaje(Math.abs(c))} frente al periodo anterior`)

function Inicio() {
  const [dias, setDias] = useState(7)
  const { datos, error } = useDatos(`panel?desde=${restarDias(hoy(), dias - 1)}&hasta=${hoy()}`)
  const p = datos && Object.values(datos)[0]
  const titulo = <Encabezado titulo="Panel del negocio">Se calcula con cada venta, compra, pedido y ajuste registrado.</Encabezado>
  if (!p?.porDia) return <>{titulo}<Aviso>{error}</Aviso></>

  return (
    <>
      {titulo}
      <div className="filtros" role="group" aria-label="Periodo">
        {PERIODOS.map(([nombre, n]) => (
          <button key={n} className={n === dias ? '' : 'secundario'} aria-pressed={n === dias} onClick={() => setDias(n)}>{nombre}</button>
        ))}
      </div>
      {p.sinCosto > 0 && <p className="alerta">{p.sinCosto} líneas de venta están sin costo guardado: la ganancia real es menor.</p>}
      <div className="indicadores">
        <Indicador nombre="Ventas" valor={dinero(p.ingresos)}>{cambioTexto(p.cambio)}</Indicador>
        <Indicador nombre="Ganancia" valor={dinero(p.ganancia)}>Margen {porcentaje(p.margen)} sobre insumos</Indicador>
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
        <Bloque titulo="Productos que más ganan">
          {p.productos.length === 0 ? <p className="vacio">Sin ventas en este periodo.</p> : (
            <Ranking formato={dinero} filas={p.productos.slice(0, 6).map((x) => ({ nombre: x.nombre, valor: x.ganancia, nota: `${x.unidades} und` }))} />
          )}
        </Bloque>
        <Bloque titulo="Pronóstico contra lo vendido (7 días)">
          {p.comparacion.length === 0 ? <p className="vacio">Aparece cuando haya 14 días con ventas.</p> : (
            <BarrasPorDia
              datos={p.comparacion} formato={(n) => `${n} und`}
              series={[{ campo: 'pronostico', nombre: 'Pronóstico', clase: 'serie-b' }, { campo: 'real', nombre: 'Vendido', clase: 'serie-a' }]}
            />
          )}
        </Bloque>
        <Bloque titulo="Insumos por reponer">
          {p.bajos.length === 0 ? <p className="vacio">Todo está por encima del mínimo.</p> : (
            <ul className="lista">
              {p.bajos.map((i) => (
                <li key={i.id}><Link to={`/compras?insumo=${i.id}`}>{i.nombre}</Link><span>{i.stock} de {i.stockMinimo} {i.unidad}</span></li>
              ))}
            </ul>
          )}
        </Bloque>
      </div>
    </>
  )
}

export default { ruta: '/', titulo: 'Panel', orden: 0, menu: true, Componente: Inicio }
