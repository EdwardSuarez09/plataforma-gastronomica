export const cantidad = (valor) => new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(valor ?? 0)

// Traduce stock y mínimo a un estado que se entiende sin hacer cuentas.
export function nivelDe({ stock, stockMinimo = 0 }) {
  if (stock <= 0) return { tono: 'mal', texto: 'Sin stock', parte: 0 }
  if (!stockMinimo) return { tono: '', texto: 'Sin mínimo', parte: 1 }
  const parte = Math.min(1, stock / (stockMinimo * 2)) // barra llena = el doble del mínimo
  if (stock <= stockMinimo) return { tono: 'mal', texto: 'Por agotarse', parte }
  if (stock < stockMinimo * 1.5) return { tono: 'atento', texto: 'Justo', parte }
  return { tono: 'ok', texto: 'Suficiente', parte }
}
