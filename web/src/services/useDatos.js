import { useCallback, useEffect, useState } from 'react'
import { listar } from './apiClient.js'
import { alCambiar } from './eventos.js'

// const { datos, error, recargar } = useDatos('insumos', 'masas')
// datos es null mientras carga. Se recarga cuando el servidor avisa de un cambio.
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
    let espera
    const dejar = alCambiar(() => {
      clearTimeout(espera)
      espera = setTimeout(recargar, 250)
    })
    return () => {
      clearTimeout(espera)
      dejar()
    }
  }, [recargar])

  return { datos, error, recargar }
}
