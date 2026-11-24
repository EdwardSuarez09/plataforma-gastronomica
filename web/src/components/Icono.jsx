// Dibujos de 24 × 24 para el menú. Cada pantalla se reconoce por su ruta.
const TRAZOS = {
  '/': 'M4 20V10m5.3 10V4m5.4 16v-7M20 20V8',
  '/ventas': 'M4 8h16l-1.2 9.5a2 2 0 0 1-2 1.7H7.2a2 2 0 0 1-2-1.7L4 8Zm4 0a4 4 0 0 1 8 0',
  '/pedidos': 'M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6m-6 4h6',
  '/insumos': 'M12 21c-4.5 0-7-3-7-7 4 0 7 2.5 7 7Zm0 0c0-6 2.5-10 7-11 0 6-2 11-7 11Zm0-7V3',
  '/masas': 'M3 12h18a9 9 0 0 1-5 8H8a9 9 0 0 1-5-8Zm5-4c0-2 2-2 2-4m4 4c0-2 2-2 2-4',
  '/productos': 'M3 14a9 9 0 0 1 18 0H3Zm-1 4h20M12 5V3',
  '/rendimiento': 'M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z',
  '/inventario': 'm12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Zm0 9 8-4.5M12 12v9m0-9L4 7.5',
  '/compras': 'M3 4h2l2.4 11h10l2-8H6m3 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
  '/historial': 'M4 12a8 8 0 1 0 2.5-5.8L4 8.5M4 4v4.5h4.5M12 8v4.5l3 2',
  '/costos': 'M20 13l-7 7a1.5 1.5 0 0 1-2 0L4 13V4h9l7 7a1.5 1.5 0 0 1 0 2ZM8.5 8.5h.1',
  '/pronostico': 'm3 17 6-6 4 4 8-9m0 0h-5m5 0v5',
  '/produccion': 'M8 5H5v16h14V5h-3M8 3h8v4H8V3Zm1 11 2 2 4-4',
  '/tiendas': 'M5 11v9h14v-9M3 9l2-5h14l2 5a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0Z',
  '/negocio': 'M4 6h10m4 0h2M4 12h2m4 0h10M4 18h8m4 0h4M16 4v4M8 10v4m6 2v4',
  ayuda: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM9.5 9.8a2.6 2.6 0 1 1 3.7 2.4c-.8.4-1.2.9-1.2 1.8m0 3v.1',
}

export default function Icono({ nombre, tamano = 20 }) {
  return (
    <svg
      width={tamano} height={tamano} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    >
      <path d={TRAZOS[nombre] ?? 'M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z'} />
    </svg>
  )
}
