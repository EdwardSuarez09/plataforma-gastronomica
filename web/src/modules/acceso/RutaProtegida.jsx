import { Navigate, useLocation } from 'react-router-dom'
import { leerSesion } from '../../services/sesion.js'

export default function RutaProtegida({ children }) {
  const { pathname } = useLocation()
  const sesion = leerSesion()
  if (!sesion?.token) return <Navigate to="/login" replace />
  // HU-02 CA-1: la primera vez se configura el negocio.
  if (!sesion.usuario.negocioId && pathname !== '/negocio') return <Navigate to="/negocio" replace />
  return children
}
