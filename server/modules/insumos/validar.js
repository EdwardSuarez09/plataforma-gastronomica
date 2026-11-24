export const UNIDADES = ['kg', 'g', 'lb', 'L', 'ml', 'unidad']

const normalizar = (texto) => texto.trim().toLowerCase()
const esNumero = (valor) => typeof valor === 'number' && Number.isFinite(valor)

export function validarInsumo(datos, existentes = []) {
  const { id, nombre, unidad, precio, stock, stockMinimo = 0 } = datos
  const repetido = (i) => i.id !== id && normalizar(i.nombre) === normalizar(nombre)
  const reglas = [
    [() => Boolean(nombre?.trim()), 'El nombre es obligatorio'],
    [() => UNIDADES.includes(unidad), 'La unidad no es válida'],
    [() => esNumero(precio) && precio > 0, 'El precio debe ser un número mayor que 0'],
    [() => esNumero(stock) && stock >= 0, 'El stock no puede ser negativo'],
    [() => esNumero(stockMinimo) && stockMinimo >= 0, 'El stock mínimo no puede ser negativo'],
    [() => !existentes.some(repetido), 'Ya existe un insumo con ese nombre'],
  ]
  return reglas.find(([cumple]) => !cumple())?.[1] ?? null
}

// Un insumo está en uso si alguna masa o algún producto lo necesita.
export function insumoEnUso(insumoId, masas, productos) {
  const usa = (lista) => (lista ?? []).some((i) => i.insumoId === insumoId)
  return masas.some((m) => usa(m.ingredientes)) || productos.some((p) => usa(p.extras))
}
