'use client'

import { useState, useEffect } from 'react'
import { LogIn, Loader2 } from 'lucide-react'

export default function AuthButton() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
    
    // Verificar autenticación cuando la página se enfoca (después del callback)
    const handleFocus = () => {
      checkAuth()
    }
    
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/check')
      const data = await response.json()
      setIsAuthenticated(data.authenticated || false)
    } catch (error) {
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  const handleAuth = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth?action=login')
      const data = await response.json()
      
      if (!response.ok) {
        // Si hay un error, mostrarlo al usuario
        if (data.error) {
          alert(`Error de configuración: ${data.error}\n\nPor favor, verifica que las variables de entorno GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET estén configuradas correctamente.`)
        }
        setLoading(false)
        return
      }
      
      if (data.authUrl) {
        window.location.href = data.authUrl
      } else {
        alert('No se pudo obtener la URL de autenticación. Verifica la configuración.')
        setLoading(false)
      }
    } catch (error: any) {
      console.error('Error al autenticar:', error)
      alert(`Error al conectar con el servidor: ${error.message || 'Error desconocido'}`)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <button
        disabled
        className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed flex items-center gap-2"
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        Verificando...
      </button>
    )
  }

  if (isAuthenticated) {
    return (
      <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg flex items-center gap-2">
        <span>✅ Autenticado</span>
      </div>
    )
  }

  return (
    <button
      onClick={handleAuth}
      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
    >
      <LogIn className="w-4 h-4" />
      Autenticar con Google
    </button>
  )
}

