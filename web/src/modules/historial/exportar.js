const texto = (valor) => `"${String(valor).replace(/^[=+\-@]/, "'$&").replaceAll('"', '""')}"`

export const aCsv = (lineas) =>
  ['Fecha;Producto;Cantidad;Precio;Total',
    ...lineas.map((l) => [l.fecha, texto(l.nombre), l.cantidad, l.precioUnitario, l.total].join(';'))].join('\n')

export function descargar(nombre, contenido) {
  const enlace = document.createElement('a')
  enlace.href = URL.createObjectURL(new Blob([String.fromCharCode(0xfeff), contenido], { type: 'text/csv' }))
  enlace.download = nombre
  enlace.click()
  URL.revokeObjectURL(enlace.href)
}
