// Un tazón (la cocina) del que sale una S (la sazón) que une dos puntos (el nexo).
export function Logo({ tamano = 40 }) {
  return (
    <svg className="logo" width={tamano} height={tamano} viewBox="0 0 48 48" aria-hidden="true">
      <rect width="48" height="48" rx="13" fill="#f4bf4a" />
      <path d="M9 28.5h30a15 12.5 0 0 1-30 0Z" fill="#15362a" />
      <path
        d="M28.5 8.5c-6 0-9 1.5-9 4.2 0 5 9.5 2.6 9.5 7.6 0 2.2-2.6 3.7-8 3.7" fill="none" stroke="#b8410e"
        strokeWidth="3.2" strokeLinecap="round"
      />
      <circle cx="29.5" cy="8.5" r="3.2" fill="#b8410e" /><circle cx="20" cy="24" r="3.2" fill="#b8410e" />
    </svg>
  )
}

export function Marca({ tamano, detalle }) {
  return (
    <span className="marca-completa">
      <Logo tamano={tamano} />
      <span className="marca">
        <span>Sazo<b>nexo</b></span>
        {detalle && <small>{detalle}</small>}
      </span>
    </span>
  )
}
