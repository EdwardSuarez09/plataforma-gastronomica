import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Aviso, Seleccion, dinero } from '../../components/ui.jsx'
import { pedir } from '../../services/apiClient.js'
import { Dibujo, Portada } from './Dibujo.jsx'
import { filtrarTiendas, opcionesDe } from './filtrar.js'
import Tienda from './Tienda.jsx'
import './tienda.css'

const SIN_FILTRO = { texto: '', tipo: '', ciudad: '', orden: 'nombre' }
const ORDENES = [['nombre', 'Nombre (A–Z)'], ['precio', 'Precio más bajo'], ['menu', 'Menú más grande']]
const DIBUJO_TIPO = { Fritos: 'empanada', Panadería: 'pan', Cafetería: 'cafe', Jugos: 'jugo' }
const CATEGORIAS_VISIBLES = 4

function Tarjeta({ tienda: t }) {
  const categorias = t.categorias ?? []
  return (
    <Link to={`/tienda/${t.slug}`} className="local">
      <Portada tipo={t.tipo} />
      <div className="local-cuerpo">
        <h2>{t.nombre}</h2>
        <p className="local-lugar">{t.tipo} · {t.ciudad}</p>
        {t.descripcion && <p className="local-descripcion">{t.descripcion}</p>}
        {categorias.length > 0 && (
          <p className="etiquetas">
            {categorias.slice(0, CATEGORIAS_VISIBLES).map((c) => <span key={c}>{c}</span>)}
            {categorias.length > CATEGORIAS_VISIBLES && <span>+{categorias.length - CATEGORIAS_VISIBLES}</span>}
          </p>
        )}
        <div className="local-pie">
          <span>{t.productos > 0 ? `${t.productos} producto${t.productos === 1 ? '' : 's'} · desde ${dinero(t.desde)}` : 'Menú en preparación'}</span>
          <b>Ver menú</b>
        </div>
      </div>
    </Link>
  )
}

function Tiendas() {
  const [tiendas, setTiendas] = useState(null)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState(SIN_FILTRO)
  useEffect(() => {
    pedir('/publico/tiendas').then(setTiendas).catch((e) => setError(e.message))
  }, [])

  const poner = (campo, valor) => setFiltro({ ...filtro, [campo]: valor })
  const tipos = opcionesDe(tiendas ?? [], 'tipo')
  const ciudades = opcionesDe(tiendas ?? [], 'ciudad')
  const visibles = filtrarTiendas(tiendas ?? [], filtro)
  return (
    <main className="vitrina">
      <header className="vitrina-portada">
        <div>
          <h1>¿Qué se te antoja hoy?</h1>
          <p>Mira el menú de los negocios de tu ciudad, pide sin crear cuenta y recoge cuando esté listo.</p>
          <label className="buscador">
            <span>Buscar restaurante o plato</span>
            <input type="search" placeholder="Ej: empanada de queso" value={filtro.texto} onChange={(e) => poner('texto', e.target.value)} />
          </label>
        </div>
        <div className="vitrina-dibujos" aria-hidden="true">
          {['empanada', 'jugo', 'huevo', 'cafe'].map((d) => <Dibujo key={d} nombre={d} />)}
        </div>
      </header>
      <Aviso>{error}</Aviso>

      <div className="vitrina-barra">
        {tipos.length > 1 && (
          <div className="tipos" role="group" aria-label="Tipo de negocio">
            {['', ...tipos].map((t) => (
              <button key={t} aria-pressed={t === filtro.tipo} onClick={() => poner('tipo', t)}>
                <Dibujo nombre={DIBUJO_TIPO[t] ?? 'plato'} />{t || 'Todos'}
              </button>
            ))}
          </div>
        )}
        <div className="vitrina-filtros">
          {ciudades.length > 1 && (
            <Seleccion etiqueta="Ciudad" vacia="Todas" opciones={ciudades.map((c) => [c, c])} value={filtro.ciudad} onChange={(e) => poner('ciudad', e.target.value)} />
          )}
          {tiendas?.length > 1 && (
            <Seleccion etiqueta="Ordenar por" opciones={ORDENES} value={filtro.orden} onChange={(e) => poner('orden', e.target.value)} />
          )}
        </div>
      </div>
      <p className="cuenta-locales" role="status">{tiendas ? `${visibles.length} ${visibles.length === 1 ? 'negocio' : 'negocios'}` : 'Cargando negocios…'}</p>

      <div className="locales">
        {!tiendas && !error && [1, 2, 3].map((n) => <div key={n} className="local esqueleto" aria-hidden="true" />)}
        {visibles.map((t) => <Tarjeta key={t.slug} tienda={t} />)}
        {tiendas && (
          <section className="local invitacion">
            <div className="invitacion-mas" aria-hidden="true">+</div>
            <h2>¿Tienes un negocio de comida?</h2>
            <p>Publica tu menú, recibe pedidos y conoce tus costos y tu ganancia en un solo lugar.</p>
            <Link to="/registro" className="boton">Crea tu tienda</Link>
          </section>
        )}
      </div>
      {tiendas && visibles.length === 0 && (
        <div className="vacio-caja">
          <strong>{tiendas.length === 0 ? 'Aún no hay negocios registrados' : 'Ningún negocio coincide con tu búsqueda'}</strong>
          {tiendas.length > 0 && <button className="secundario" onClick={() => setFiltro(SIN_FILTRO)}>Quitar filtros</button>}
        </div>
      )}

    </main>
  )
}

export default [
  { ruta: '/tiendas', titulo: 'Tiendas', resumen: 'Así te ven los clientes', orden: 80, menu: true, publica: true, Componente: Tiendas },
  { ruta: '/tienda/:slug', titulo: 'Tienda', publica: true, Componente: Tienda },
]
