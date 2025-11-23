'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'

function AuthCallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Procesando autenticación...')

  useEffect(() => {
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      setStatus('error')
      setMessage('Error en la autenticación. Por favor, intenta de nuevo.')
      setTimeout(() => {
        router.push('/')
      }, 3000)
      return
    }

    if (code) {
      handleCallback(code)
    } else {
      setStatus('error')
      setMessage('No se recibió código de autorización')
      setTimeout(() => {
        router.push('/')
      }, 3000)
    }
  }, [searchParams, router])

  const handleCallback = async (code: string) => {
    try {
      const response = await fetch(`/api/auth?action=callback&code=${code}`)
      const data = await response.json()

      if (response.ok && data.success) {
        setStatus('success')
        setMessage('¡Autenticación exitosa! Redirigiendo...')
        setTimeout(() => {
          router.push('/')
        }, 2000)
      } else {
        throw new Error(data.error || 'Error al procesar la autenticación')
      }
    } catch (error: any) {
      setStatus('error')
      setMessage(error.message || 'Error al procesar la autenticación')
      setTimeout(() => {
        router.push('/')
      }, 3000)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
        <div className="flex flex-col items-center text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Autenticando...
              </h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="w-12 h-12 text-green-600 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                ¡Éxito!
              </h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-12 h-12 text-red-600 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Error
              </h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="flex flex-col items-center text-center">
            <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Cargando...
            </h2>
          </div>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}

