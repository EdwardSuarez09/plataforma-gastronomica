import solver from 'javascript-lp-solver'

// Programación lineal de un día:
//   maximizar  Σ ganancia_i · x_i
//   sujeto a   min_i ≤ x_i ≤ max_i     (demanda)
//              Σ costo_i · x_i ≤ presupuesto
export function optimizarDia(productos, presupuesto) {
  const costoMinimo = productos.reduce((suma, p) => suma + p.costo * p.min, 0)
  if (costoMinimo > presupuesto) return { factible: false, faltante: Math.ceil(costoMinimo - presupuesto) }

  const modelo = { optimize: 'ganancia', opType: 'max', constraints: { costo: { max: presupuesto } }, variables: {} }
  for (const p of productos) {
    modelo.variables[p.id] = { ganancia: p.ganancia, costo: p.costo, [`d_${p.id}`]: 1 }
    modelo.constraints[`d_${p.id}`] = { min: p.min, max: p.max }
  }
  const solucion = solver.Solve(modelo)

  // Se redondea hacia abajo para no pasarse del presupuesto: no se fabrica media empanada.
  const cantidades = Object.fromEntries(
    productos.map((p) => [p.id, Math.floor((solucion[p.id] ?? 0) + 1e-6)]),
  )
  const total = (campo) => productos.reduce((suma, p) => suma + p[campo] * cantidades[p.id], 0)
  return { factible: true, cantidades, costo: total('costo'), ganancia: total('ganancia') }
}

export function planSemanal({ pronostico, costos, presupuesto, factorMin, factorMax, variacionCosto = 0 }) {
  const costoDe = new Map(costos.map((c) => [c.productoId, c]))
  const dias = pronostico.dias.map((dia, j) => {
    const productos = pronostico.productos.map(({ productoId, valores }) => {
      const { costo, precio } = costoDe.get(productoId)
      const costoFinal = costo * (1 + variacionCosto)
      return {
        id: productoId,
        costo: costoFinal,
        ganancia: precio - costoFinal,
        min: Math.floor(valores[j] * factorMin),
        max: Math.ceil(valores[j] * factorMax),
      }
    })
    return { ...dia, ...optimizarDia(productos, presupuesto) }
  })
  const factibles = dias.filter((d) => d.factible)
  return {
    dias,
    factible: factibles.length === dias.length,
    ganancia: factibles.reduce((suma, d) => suma + d.ganancia, 0),
    costo: factibles.reduce((suma, d) => suma + d.costo, 0),
  }
}

export function compararEscenarios(datos, variacion = 0.1) {
  return [['Optimista', -variacion], ['Realista', 0], ['Pesimista', variacion]].map(([nombre, variacionCosto]) => {
    const { factible, ganancia, costo } = planSemanal({ ...datos, variacionCosto })
    return { nombre, variacionCosto, factible, ganancia, costo }
  })
}
