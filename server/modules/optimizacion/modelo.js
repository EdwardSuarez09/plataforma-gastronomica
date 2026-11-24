import solver from 'javascript-lp-solver'

// Programación lineal:
//   maximizar  Σ ganancia_i · x_ij
//   sujeto a   min_ij ≤ x_ij ≤ max_ij                 (demanda de cada día)
//              Σ_i costo_i · x_ij ≤ presupuesto        (dinero de cada día)
//              Σ_ij receta_ik · x_ij ≤ stock_k         (opcional: solo con lo que hay)
export function optimizar(dias, presupuesto, { recetas = {}, stock } = {}) {
  const modelo = { optimize: 'ganancia', opType: 'max', constraints: {}, variables: {} }
  dias.forEach((productos, j) => {
    modelo.constraints[`costo_${j}`] = { max: presupuesto }
    for (const p of productos) {
      const nombre = `${j}|${p.id}`
      const variable = { ganancia: p.ganancia, [`costo_${j}`]: p.costo, [`d_${nombre}`]: 1 }
      if (stock) {
        for (const r of recetas[p.id] ?? []) {
          if (!(r.insumoId in stock)) continue
          variable[`s_${r.insumoId}`] = r.cantidad
          modelo.constraints[`s_${r.insumoId}`] = { max: Math.max(0, stock[r.insumoId]) }
        }
      }
      modelo.variables[nombre] = variable
      modelo.constraints[`d_${nombre}`] = { min: p.min, max: p.max }
    }
  })
  const solucion = solver.Solve(modelo)
  // Se redondea hacia abajo para no pasarse de los límites: no se fabrica media empanada.
  return dias.map((productos, j) => {
    const cantidades = Object.fromEntries(
      productos.map((p) => [p.id, Math.max(0, Math.floor((solucion[`${j}|${p.id}`] ?? 0) + 1e-6))]),
    )
    const total = (campo) => productos.reduce((suma, p) => suma + p[campo] * cantidades[p.id], 0)
    return { factible: true, cantidades, costo: total('costo'), ganancia: total('ganancia') }
  })
}

const faltanteDe = (productos, presupuesto) =>
  Math.ceil(productos.reduce((suma, p) => suma + p.costo * p.min, 0) - presupuesto)

export function optimizarDia(productos, presupuesto) {
  const faltante = faltanteDe(productos, presupuesto)
  return faltante > 0 ? { factible: false, faltante } : optimizar([productos], presupuesto)[0]
}

export function planSemanal(datos) {
  const { pronostico, costos, presupuesto, factorMin, factorMax, variacionCosto = 0, recetas, stock } = datos
  const costoDe = new Map(costos.map((c) => [c.productoId, c]))
  const porDia = pronostico.dias.map((_, j) => pronostico.productos.map(({ productoId, valores }) => {
    const { costo, precio } = costoDe.get(productoId)
    const costoFinal = costo * (1 + variacionCosto)
    return {
      id: productoId,
      costo: costoFinal,
      ganancia: precio - costoFinal,
      // Con inventario limitado no se puede prometer un mínimo.
      min: stock ? 0 : Math.floor(valores[j] * factorMin),
      max: Math.ceil(valores[j] * factorMax),
    }
  }))
  const resultados = stock
    ? optimizar(porDia, presupuesto, { recetas, stock })
    : porDia.map((productos) => optimizarDia(productos, presupuesto))
  const dias = pronostico.dias.map((dia, j) => ({ ...dia, ...resultados[j] }))
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

const redondear = (n) => Math.round(n * 100) / 100

// Insumos que exige el plan menos lo que ya hay.
export function listaCompras(plan, recetas, insumos) {
  const necesario = {}
  for (const dia of plan.dias.filter((d) => d.factible)) {
    for (const [productoId, unidades] of Object.entries(dia.cantidades)) {
      for (const r of recetas[productoId] ?? []) {
        necesario[r.insumoId] = (necesario[r.insumoId] ?? 0) + r.cantidad * unidades
      }
    }
  }
  return insumos
    .filter((i) => necesario[i.id] > 0)
    .map((i) => {
      const comprar = redondear(Math.max(0, necesario[i.id] - Math.max(0, i.stock)))
      return {
        insumoId: i.id, nombre: i.nombre, unidad: i.unidad, necesario: redondear(necesario[i.id]),
        stock: i.stock, comprar, costo: Math.round(comprar * i.precio),
      }
    })
    .filter((i) => i.comprar > 0)
    .sort((a, b) => b.costo - a.costo)
}

// Dinero para producir todo lo pronosticado en el día más fuerte.
export function presupuestoSugerido(pronostico, costos) {
  const costoDe = new Map(costos.map((c) => [c.productoId, c.costo]))
  const porDia = pronostico.dias.map((_, j) =>
    pronostico.productos.reduce((suma, p) => suma + p.valores[j] * costoDe.get(p.productoId), 0))
  return Math.ceil(Math.max(...porDia) / 1000) * 1000
}
