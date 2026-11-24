import { useCallback, useEffect, useState } from 'react'
import { listar } from './apiClient.js'

// const { datos, error, recargar } = useDatos('insumos', 'masas')
// datos.insumos y datos.masas; datos es null mientras carga.
export function useDatos(...colecciones) {
  const clave = colecciones.join(',')
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState('')

  const recargar = useCallback(async () => {
    try {
      const nombres = clave.split(',')
      const listas = await Promise.all(nombres.map((c) => listar(c)))
      setDatos(Object.fromEntries(nombres.map((c, i) => [c, listas[i]])))
      setError('')
    } catch (e) {
      setError(e.message)
    }
  }, [clave])

  useEffect(() => {
    recargar()
  }, [recargar])

  return { datos, error, recargar }
}
