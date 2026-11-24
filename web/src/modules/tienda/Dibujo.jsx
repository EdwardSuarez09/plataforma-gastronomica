// Dibujos propios de comida: dan identidad a la tienda mientras no haya fotos (HU-25).
const FORMAS = {
  empanada: (
    <>
      <path d="M10 66a40 40 0 0 1 80 0Z" fill="#e79c33" />
      <path d="M10 66a40 40 0 0 1 80 0" fill="none" stroke="#b9681a" strokeWidth="6" strokeLinecap="round" strokeDasharray="1 7" />
      <path d="M30 56c4-10 11-15 20-16M58 42c6 2 10 6 13 12" fill="none" stroke="#f6c877" strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  arepa: (
    <>
      <circle cx="50" cy="52" r="36" fill="#f0c765" />
      <circle cx="50" cy="52" r="36" fill="none" stroke="#cf9330" strokeWidth="5" />
      <path d="M32 40h36M26 52h48M32 64h36" stroke="#b9772a" strokeWidth="5" strokeLinecap="round" />
    </>
  ),
  huevo: (
    <>
      <circle cx="50" cy="52" r="36" fill="#f0c765" />
      <circle cx="50" cy="52" r="36" fill="none" stroke="#cf9330" strokeWidth="5" />
      <path d="M30 54c-3-12 8-21 20-20s22 8 20 20-10 17-21 16-17-6-19-16Z" fill="#fffaf0" />
      <circle cx="50" cy="52" r="10" fill="#f39c1f" />
    </>
  ),
  papa: (
    <>
      <ellipse cx="50" cy="54" rx="38" ry="31" fill="#cf8430" />
      <path d="M22 46c5-12 15-18 27-18" fill="none" stroke="#eab168" strokeWidth="5" strokeLinecap="round" />
      <path d="M38 60h.1M54 68h.1M66 56h.1M52 48h.1M70 44h.1M30 66h.1" stroke="#9c5c18" strokeWidth="5" strokeLinecap="round" />
    </>
  ),
  carimanola: (
    <g transform="rotate(-24 50 52)">
      <ellipse cx="50" cy="52" rx="42" ry="22" fill="#dca04a" />
      <path d="M18 44c8-8 20-12 34-12" fill="none" stroke="#f5cf8e" strokeWidth="5" strokeLinecap="round" />
      <path d="M40 60h.1M58 62h.1M70 54h.1" stroke="#a96a22" strokeWidth="5" strokeLinecap="round" />
    </g>
  ),
  pastel: (
    <>
      <rect x="12" y="28" width="76" height="48" rx="12" fill="#dfa04a" />
      <rect x="15" y="31" width="70" height="42" rx="10" fill="none" stroke="#b06a1e" strokeWidth="4" strokeLinecap="round" strokeDasharray="1 7" />
      <path d="M32 46h22M32 58h12" stroke="#f5cf8e" strokeWidth="5" strokeLinecap="round" />
    </>
  ),
  jugo: (
    <>
      <path d="M58 30 66 6" stroke="#1b6a40" strokeWidth="5" strokeLinecap="round" />
      <path d="M24 24h52l-7 62a6 6 0 0 1-6 5H37a6 6 0 0 1-6-5Z" fill="#ffffff" opacity="0.75" />
      <path d="M27 40h46l-5 44a5 5 0 0 1-5 4H37a5 5 0 0 1-5-4Z" fill="#f28c28" />
      <circle cx="74" cy="26" r="15" fill="#f6b23c" /><circle cx="74" cy="26" r="10" fill="#fde3a3" />
      <path d="M74 17v18M65 26h18" stroke="#f6b23c" strokeWidth="2.5" />
    </>
  ),
  mora: (
    <>
      <path d="M58 30 66 6" stroke="#1b6a40" strokeWidth="5" strokeLinecap="round" />
      <path d="M24 24h52l-7 62a6 6 0 0 1-6 5H37a6 6 0 0 1-6-5Z" fill="#ffffff" opacity="0.75" />
      <path d="M27 40h46l-5 44a5 5 0 0 1-5 4H37a5 5 0 0 1-5-4Z" fill="#8c2450" />
      <path d="M42 54h.1M54 62h.1M46 74h.1M58 50h.1" stroke="#c65a86" strokeWidth="7" strokeLinecap="round" />
    </>
  ),
  batido: (
    <>
      <path d="M56 24 62 4" stroke="#b8410e" strokeWidth="5" strokeLinecap="round" />
      <path d="M28 34h44l-6 52a6 6 0 0 1-6 5H40a6 6 0 0 1-6-5Z" fill="#f8c98a" />
      <path d="M24 36c0-12 12-18 26-18s26 6 26 18Z" fill="#fff6e6" />
      <path d="M36 50l3 30M64 50l-3 30" stroke="#fff6e6" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
    </>
  ),
  pan: (
    <>
      <path d="M12 62c0-20 17-34 38-34s38 14 38 34c0 9-6 14-14 14H26c-8 0-14-5-14-14Z" fill="#d58f3c" />
      <path d="M32 58c1-9 4-15 9-20M48 58c1-9 4-15 9-20M64 58c1-8 3-12 6-16" fill="none" stroke="#f6d9a6" strokeWidth="5" strokeLinecap="round" />
    </>
  ),
  cafe: (
    <>
      <path d="M38 8c-4 7 4 9 0 17M52 8c-4 7 4 9 0 17" fill="none" stroke="#7a4a2a" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
      <path d="M18 34h54v24a22 22 0 0 1-22 22H40a22 22 0 0 1-22-22Z" fill="#ffffff" />
      <path d="M72 42h6a10 10 0 0 1 0 20h-7" fill="none" stroke="#ffffff" strokeWidth="6" />
      <ellipse cx="45" cy="36" rx="25" ry="6" fill="#5a2f17" />
      <path d="M12 88h66" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" />
    </>
  ),
  plato: (
    <>
      <circle cx="50" cy="52" r="38" fill="#ffffff" /><circle cx="50" cy="52" r="27" fill="#eef2ec" />
      <path d="M30 54c0-12 9-19 20-19 8 0 12 4 13 10-12 2-20 8-22 18-7 0-11-3-11-9Z" fill="#e9b04a" />
      <path d="M44 66c2-12 11-18 25-18 3 12-5 24-18 24-4 0-7-2-7-6Z" fill="#3d7d4c" />
      <circle cx="43" cy="50" r="5" fill="#c0392b" /><circle cx="53" cy="46" r="4" fill="#c0392b" />
    </>
  ),
}

// El primero que coincida gana: de lo más específico a lo más general.
const REGLAS = [
  [/mora|fresa|uva/, 'mora'], [/batido|malteada|leche/, 'batido'], [/jugo|limonada|bebida|gaseosa/, 'jugo'],
  [/huevo/, 'huevo'], [/arepa|arepuela|tortilla/, 'arepa'], [/empanada|frito|panzerotti/, 'empanada'],
  [/cari(m|ñ)|dedito|yuca frita/, 'carimanola'], [/papa|buñuelo|albóndiga/, 'papa'], [/pastel|pizza|torta|quiche/, 'pastel'],
  [/caf[eé]|tinto|capuchino|chocolate/, 'cafe'], [/pan|croissant|mogolla|galleta/, 'pan'],
]

export function dibujoDe(...textos) {
  const texto = textos.filter(Boolean).join(' ').toLowerCase()
  return REGLAS.find(([regla]) => regla.test(texto))?.[1] ?? 'plato'
}

export function Dibujo({ nombre, className }) {
  return <svg viewBox="0 0 100 100" className={className} aria-hidden="true">{FORMAS[nombre] ?? FORMAS.plato}</svg>
}

const PORTADAS = {
  Fritos: ['#f7d27a', ['empanada', 'arepa', 'papa']],
  Restaurante: ['#bcd9c3', ['plato', 'arepa', 'jugo']],
  Panadería: ['#f1d2ad', ['pan', 'cafe', 'pastel']],
  Cafetería: ['#d8bfa8', ['cafe', 'pan', 'pastel']],
  Jugos: ['#f9b9a0', ['jugo', 'mora', 'batido']],
  Otro: ['#c7d8d0', ['plato', 'jugo', 'pan']],
}

export function Portada({ tipo }) {
  const [color, dibujos] = PORTADAS[tipo] ?? PORTADAS.Otro
  return (
    <div className="portada-dibujo" style={{ background: color }} aria-hidden="true">
      {dibujos.map((d, i) => <Dibujo key={d} nombre={d} className={`pieza-${i}`} />)}
    </div>
  )
}
