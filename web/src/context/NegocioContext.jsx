import { createContext, useContext, useEffect, useState } from 'react'
import { pedir } from '../services/apiClient.js'
import { leerSesion } from '../services/sesion.js'

const Contexto = createContext({ negocio: null, setNegocio: () => {}, error: '' })

// Publica el negocio activo para las pantallas que lo necesiten.
export function NegocioProvider({ children }) {
  const [negocio, setNegocio] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    if (leerSesion()?.usuario?.negocioId) {
      pedir('/negocio').then(setNegocio).catch((err) => setError(err.message))
    }
  }, [])
  return <Contexto.Provider value={{ negocio, setNegocio, error }}>{children}</Contexto.Provider>
}

export const useNegocio = () => useContext(Contexto)
