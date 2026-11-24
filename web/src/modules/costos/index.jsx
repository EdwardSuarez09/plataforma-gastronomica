import { Aviso, Encabezado, dinero, porcentaje } from '../../components/ui.jsx'
import { useDatos } from '../../services/useDatos.js'

function Costos() {
  const { datos, error } = useDatos('costos')
  if (!datos) return <Aviso>{error}</Aviso>
  const costos = [...datos.costos].sort((a, b) => b.margen - a.margen)
  return (
    <>
      <Encabezado titulo="Costos y margen">Se recalculan solos cuando cambia el precio de un insumo.</Encabezado>
      {costos.length === 0 && <p className="vacio">Aún no hay productos activos.</p>}
      <div className="tabla">
        <table>
          <thead><tr><th>Producto</th><th>Masa</th><th>Extras</th><th>Costo</th><th>Precio</th><th>Ganancia</th><th>Margen</th></tr></thead>
          <tbody>
            {costos.map((c) => (
              <tr key={c.productoId}>
                <td>{c.nombre}{c.sinRendimiento && <small className="alerta"> Falta su rendimiento</small>}</td>
                <td>{dinero(c.costoMasa)}</td><td>{dinero(c.costoExtras)}</td><td>{dinero(c.costo)}</td>
                <td>{dinero(c.precio)}</td><td>{dinero(c.ganancia)}</td>
                <td><span className={c.margen < 0 ? 'alerta' : ''}>{porcentaje(c.margen)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default {
  ruta: '/costos', titulo: 'Costos', resumen: 'Costo unitario y margen', orden: 30, menu: true, Componente: Costos,
}
