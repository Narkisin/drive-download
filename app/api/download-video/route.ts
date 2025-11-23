import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

// Configurar timeout máximo para Vercel
export const maxDuration = 60

function getOAuth2Client() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/callback`
  )
  return oauth2Client
}

async function getAuthenticatedClient(request: NextRequest) {
  const tokenCookie = request.cookies.get('google_tokens')
  
  if (!tokenCookie) {
    return null
  }

  try {
    const tokens = JSON.parse(tokenCookie.value)
    const oauth2Client = getOAuth2Client()
    oauth2Client.setCredentials(tokens)
    return oauth2Client
  } catch (error) {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { videoId, fileName } = await request.json()

    if (!videoId) {
      return NextResponse.json({ error: 'ID de video no proporcionado' }, { status: 400 })
    }

    const auth = await getAuthenticatedClient(request)

    if (!auth) {
      return NextResponse.json(
        { error: 'No autenticado', requiresAuth: true },
        { status: 401 }
      )
    }

    const drive = google.drive({ version: 'v3', auth })

    // Obtener información del archivo, incluyendo URL de descarga directa
    const file: any = await drive.files.get({
      fileId: videoId,
      fields: 'name, mimeType, size, webContentLink',
    })

    // Intentar usar URL de descarga directa si está disponible
    if (file.data.webContentLink) {
      try {
        // Obtener token de acceso
        const tokenResponse = await auth.getAccessToken()
        const accessToken = tokenResponse.token || tokenResponse

        // Generar URL de descarga directa con token
        const downloadUrl = `${file.data.webContentLink}&access_token=${accessToken}`
        
        // Devolver la URL para descarga directa
        return NextResponse.json({
          downloadUrl,
          fileName: fileName || file.data.name || 'video',
          useDirectDownload: true,
          success: true,
        })
      } catch (tokenError) {
        console.error('Error obteniendo token para descarga directa:', tokenError)
        // Continuar con método alternativo
      }
    }

    // Método alternativo: descargar a través del servidor (para archivos pequeños/medianos)
    try {
      const response: any = await drive.files.get(
        {
          fileId: videoId,
          alt: 'media',
        },
        { responseType: 'stream' }
      )

      // Convertir el stream a buffer
      const chunks: Buffer[] = []
      const maxSize = 500 * 1024 * 1024 // 500MB límite aproximado
      let totalSize = 0

      for await (const chunk of response.data as AsyncIterable<Buffer>) {
        const chunkBuffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
        totalSize += chunkBuffer.length
        
        if (totalSize > maxSize) {
          throw new Error('El archivo es demasiado grande para descargar a través del servidor. Por favor, intenta descargarlo directamente desde Google Drive.')
        }
        
        chunks.push(chunkBuffer)
      }
      
      const buffer = Buffer.concat(chunks)

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': file.data.mimeType || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName || file.data.name || 'video')}"`,
          'Content-Length': buffer.length.toString(),
        },
      })
    } catch (streamError: any) {
      console.error('Error en descarga por stream:', streamError)
      
      // Si falla, intentar devolver URL directa como última opción
      if (file.data.webContentLink) {
        return NextResponse.json({
          downloadUrl: file.data.webContentLink,
          fileName: fileName || file.data.name || 'video',
          useDirectDownload: true,
          success: true,
          message: 'Usa esta URL para descargar el archivo directamente',
        })
      }

      throw streamError
    }
  } catch (error: any) {
    console.error('Error al descargar video:', error)
    
    // Proporcionar mensajes de error más específicos
    let errorMessage = 'Error al descargar el video'
    
    if (error.message?.includes('No autenticado') || error.code === 401) {
      errorMessage = 'No estás autenticado. Por favor, vuelve a autenticarte con Google.'
    } else if (error.message?.includes('demasiado grande')) {
      errorMessage = error.message
    } else if (error.message?.includes('permission') || error.code === 403) {
      errorMessage = 'No tienes permisos para descargar este archivo. Verifica que el archivo esté compartido contigo.'
    } else if (error.message?.includes('not found') || error.code === 404) {
      errorMessage = 'El archivo no fue encontrado. Puede haber sido eliminado o movido.'
    } else if (error.message) {
      errorMessage = error.message
    }

    return NextResponse.json(
      { 
        error: errorMessage, 
        details: error.message,
        code: error.code,
      },
      { status: 500 }
    )
  }
}
