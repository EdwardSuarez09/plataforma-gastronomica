import { Link } from 'react-router-dom'
import { Aviso, Dato, Encabezado, Vacio, dinero, porcentaje } from '../../components/ui.jsx'
import { useDatos } from '../../services/useDatos.js'

const BUENO = 0.4
const AJUSTADO = 0.2

// El semáforo es orientativo: ayuda a ver de un vistazo qué precio conviene revisar.
export function nivel({ margen, sinRendimiento }) {
  if (sinRendimiento) return ['', 'Incompleto']
  if (margen < 0) return ['mal', 'Pierdes dinero']
  if (margen < AJUSTADO) return ['mal', 'Muy bajo']
  if (margen < BUENO) return ['atento', 'Ajustado']
  return ['ok', 'Bueno']
}

function Costos() {
  const { datos, error } = useDatos('costos')
  if (!datos) return <Aviso>{error}</Aviso>
  const costos = [...datos.costos].sort((a, b) => b.margen - a.margen)
  const contar = (...tonos) => costos.filter((c) => !c.sinRendimiento && tonos.includes(nivel(c)[0])).length
  const incompletos = costos.filter((c) => c.sinRendimiento).length
  return (
    <>
      <Encabezado titulo="Costos y margen">Cuánto te cuesta cada producto y cuánto te queda. Se recalcula solo cuando cambia el precio de un insumo.</Encabezado>
      {costos.length === 0 ? (
        <Vacio titulo="Aún no hay productos activos."><p>Crea un producto para ver su costo. <Link to="/productos">Ir a productos</Link></p></Vacio>
      ) : (
        <>
          <div className="resumen">
            <Dato nombre="Con buen margen" valor={contar('ok')} tono="ok">Ganan 40 % o más</Dato>
            <Dato nombre="Por revisar" valor={contar('atento', 'mal')} tono="atento">Sube el precio o baja el costo</Dato>
            <Dato nombre="Datos incompletos" valor={incompletos}>Les falta la cantidad por lote</Dato>
          </div>
          <div className="tabla">
            <table>
              <thead>
                <tr>
                  <th>Producto</th><th className="num">Masa</th><th className="num">Extras</th><th className="num">Costo</th>
                  <th className="num">Precio</th><th className="num">Ganancia</th><th>Margen</th><th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {costos.map((c) => {
                  const [tono, texto] = nivel(c)
                  return (
                    <tr key={c.productoId}>
                      <td><strong>{c.nombre}</strong>{c.sinRendimiento && <small className="alerta"> Falta su rendimiento</small>}</td>
                      <td className="num">{dinero(c.costoMasa)}</td><td className="num">{dinero(c.costoExtras)}</td>
                      <td className="num">{dinero(c.costo)}</td><td className="num">{dinero(c.precio)}</td><td className="num">{dinero(c.ganancia)}</td>
                      <td>
                        <span className={c.margen < 0 ? 'alerta' : ''}>{porcentaje(c.margen)}</span>
                        <span className="medidor" aria-hidden="true"><i className={tono === 'ok' ? '' : tono} style={{ width: `${Math.min(100, Math.max(0, c.margen * 100))}%` }} /></span>
                      </td>
                      <td><span className={`chip ${tono}`}>{texto}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="explica" style={{ marginTop: '0.75rem' }}>Costo = masa + extras. Ganancia = precio − costo. Margen = ganancia ÷ precio. No incluye arriendo, gas ni salarios.</p>
        </>
      )}
    </>
  )
}

export default {
  ruta: '/costos', titulo: 'Costos', resumen: 'Costo unitario y margen', orden: 30, menu: true, Componente: Costos,
  guia: {
    para: 'Muestra cuánto ganas con cada producto, para decidir precios con datos.',
    pasos: ['Mira primero los que están "Por revisar".', 'Compara costo, precio y ganancia.', 'Ajusta el precio en Productos o busca un insumo más barato.'],
    conecta: 'Sale de Insumos, Masas y Rendimiento. El plan de producción usa estos costos.',
  },
}
