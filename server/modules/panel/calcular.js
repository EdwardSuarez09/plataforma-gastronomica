import { sumarDias } from '../../util/fechas.js'
import { DIAS_MINIMOS, predecir, ventasPorDia } from '../pronostico/calcular.js'

const sumar = (lista, valor) => lista.reduce((total, x) => total + valor(x), 0)
const agrupar = (lista, clave, valor) => {
  const grupos = {}
  for (const x of lista) grupos[clave(x)] = (grupos[clave(x)] ?? 0) + valor(x)
  return grupos
}
const entre = (desde, hasta) => (x) => x.fecha >= desde && x.fecha <= hasta

function fechasDe(desde, hasta) {
  const fechas = []
  for (let f = desde; f <= hasta; f = sumarDias(f, 1)) fechas.push(f)
  return fechas
}

const costoLinea = (l) => l.cantidad * (l.costoUnitario ?? 0)
const ingresoLinea = (l) => l.cantidad * l.precioUnitario

function porProducto(lineas) {
  const grupos = new Map()
  for (const l of lineas) {
    const p = grupos.get(l.productoId) ?? { productoId: l.productoId, nombre: l.nombre, unidades: 0, ingresos: 0, ganancia: 0 }
    p.unidades += l.cantidad
    p.ingresos += ingresoLinea(l)
    p.ganancia += ingresoLinea(l) - costoLinea(l)
    grupos.set(l.productoId, p)
  }
  return [...grupos.values()].sort((a, b) => b.ganancia - a.ganancia)
}

// Todo se calcula a partir de los registros en el momento de la consulta: nada se guarda fijo.
export function resumir({ ventas, compras, insumos, pedidos, movimientos }, { desde, hasta }) {
  const validas = ventas.filter((v) => v.estado !== 'anulada')
  const actuales = validas.filter(entre(desde, hasta))
  const lineas = actuales.flatMap((v) => v.items)
  const ingresos = sumar(lineas, ingresoLinea)
  const costo = sumar(lineas, costoLinea)

  const fechas = fechasDe(desde, hasta)
  const previas = validas.filter(entre(sumarDias(desde, -fechas.length), sumarDias(desde, -1)))
  const antes = sumar(previas.flatMap((v) => v.items), ingresoLinea)

  return {
    ingresos,
    costo,
    ganancia: ingresos - costo,
    margen: ingresos ? (ingresos - costo) / ingresos : 0,
    unidades: sumar(lineas, (l) => l.cantidad),
    ventas: actuales.length,
    ticket: actuales.length ? Math.round(ingresos / actuales.length) : 0,
    cambio: antes ? (ingresos - antes) / antes : null,
    sinCosto: lineas.filter((l) => l.costoUnitario === undefined).length,
    compras: sumar(compras.filter((c) => c.estado !== 'anulada').filter(entre(desde, hasta)), (c) => c.valorTotal),
    desperdicio: sumar(
      movimientos.filter((m) => m.tipo === 'desperdicio').filter(entre(desde, hasta)), (m) => -m.cantidad * (m.precio ?? 0),
    ),
    inventario: sumar(insumos, (i) => Math.max(0, i.stock) * i.precio),
    bajos: insumos.filter((i) => i.stockMinimo > 0 && i.stock <= i.stockMinimo)
      .map(({ id, nombre, unidad, stock, stockMinimo }) => ({ id, nombre, unidad, stock, stockMinimo })),
    pendientes: pedidos.filter((p) => ['recibido', 'confirmado', 'en_preparacion', 'listo'].includes(p.estado)).length,
    porDia: fechas.map((fecha) => {
      const delDia = actuales.filter((v) => v.fecha === fecha).flatMap((v) => v.items)
      return { fecha, ingresos: sumar(delDia, ingresoLinea), ganancia: sumar(delDia, (l) => ingresoLinea(l) - costoLinea(l)) }
    }),
    productos: porProducto(lineas),
    canales: agrupar(actuales, (v) => v.origen, (v) => sumar(v.items, ingresoLinea)),
  }
}

// Para cada día cerrado, lo que se habría pronosticado con los datos anteriores a ese día.
export function compararPronostico(ventas, hoy) {
  const dias = ventasPorDia(ventas.filter((v) => v.fecha < hoy))
  if (Object.keys(dias).length < DIAS_MINIMOS) return []
  const productos = [...new Set(Object.values(dias).flatMap(Object.keys))]
  return fechasDe(sumarDias(hoy, -7), sumarDias(hoy, -1)).map((fecha) => ({
    fecha,
    pronostico: sumar(productos, (id) => predecir(dias, id, fecha)),
    real: sumar(Object.values(dias[fecha] ?? {}), (n) => n),
  }))
}
