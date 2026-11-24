import { Seleccion } from '../../components/ui.jsx'

// Lista editable de insumos con cantidad. La usan masas y productos.
export default function Ingredientes({ titulo, insumos, valor, onChange }) {
  const cambiar = (i, campo, dato) => onChange(valor.map((x, j) => (j === i ? { ...x, [campo]: dato } : x)))
  return (
    <fieldset className="ingredientes">
      <legend>{titulo}</legend>
      {valor.map((x, i) => (
        <div className="fila" key={i}>
          <Seleccion
            etiqueta="Insumo" vacia="Elige…" opciones={insumos.map((n) => [n.id, `${n.nombre} (${n.unidad})`])}
            value={x.insumoId} onChange={(e) => cambiar(i, 'insumoId', e.target.value)}
          />
          <label className="campo">
            <span>Cantidad</span>
            <input type="number" step="any" value={x.cantidad} onChange={(e) => cambiar(i, 'cantidad', e.target.value)} />
          </label>
          <button type="button" className="peligro" onClick={() => onChange(valor.filter((_, j) => j !== i))}>Quitar</button>
        </div>
      ))}
      <button type="button" className="secundario" onClick={() => onChange([...valor, { insumoId: '', cantidad: '' }])}>
        + Agregar insumo
      </button>
    </fieldset>
  )
}

export const aNumeros = (lista) => lista.map((x) => ({ insumoId: x.insumoId, cantidad: Number(x.cantidad) }))
