import { Navigate } from 'react-router-dom'
import { leerSesion } from '../../services/sesion.js'

export default function RutaProtegida({ children }) {
  if (!leerSesion()?.token) return <Navigate to="/login" replace />
  return children
}
