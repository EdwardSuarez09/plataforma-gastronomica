// Descubre los módulos: cada carpeta de modules/ exporta una pantalla (o una lista) con
// { ruta, titulo, orden, menu, publica, Componente }. Así nadie edita App.jsx para agregar la suya.
const archivos = import.meta.glob('../modules/*/index.jsx', { eager: true })

export const modulos = Object.values(archivos)
  .flatMap((m) => m.default)
  .sort((a, b) => (a.orden ?? 50) - (b.orden ?? 50))
