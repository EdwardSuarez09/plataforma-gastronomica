// Barras por fecha. series: [{ campo, nombre, clase }]. El detalle aparece al pasar o enfocar.
export function BarrasPorDia({ datos, series, formato }) {
  const mayor = Math.max(1, ...datos.flatMap((d) => series.map((s) => d[s.campo])))
  const corta = (f) => `${f.slice(8)}/${f.slice(5, 7)}`
  return (
    <figure style={{ margin: 0 }}>
      {series.length > 1 && (
        <div className="leyenda">
          {series.map((s) => <span key={s.campo}><b className={s.clase} />{s.nombre}</span>)}
        </div>
      )}
      <div className="grafico">
        {datos.map((d) => {
          const detalle = `${corta(d.fecha)}: ${series.map((s) => `${s.nombre} ${formato(d[s.campo])}`).join(' · ')}`
          return (
            <div className="grupo" key={d.fecha} tabIndex={0} role="img" aria-label={detalle}>
              <span className="globo">{detalle}</span>
              {series.map((s) => <i key={s.campo} className={s.clase} style={{ height: `${(Math.max(0, d[s.campo]) / mayor) * 100}%` }} />)}
            </div>
          )
        })}
      </div>
      {datos.length > 0 && <div className="eje"><span>{corta(datos[0].fecha)}</span><span>Máximo {formato(mayor)}</span><span>{corta(datos.at(-1).fecha)}</span></div>}
    </figure>
  )
}

export function Ranking({ filas, formato }) {
  const mayor = Math.max(1, ...filas.map((f) => f.valor))
  return (
    <div className="ranking">
      {filas.map((f) => (
        <div key={f.nombre}>
          <span>{f.nombre} <small>{f.nota}</small></span><strong>{formato(f.valor)}</strong>
          <i className="serie-a" style={{ width: `${(Math.max(0, f.valor) / mayor) * 100}%` }} />
        </div>
      ))}
    </div>
  )
}
