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

    // Obtener información del archivo, incluyendo el link de descarga directa
    const file: any = await drive.files.get({
      fileId: videoId,
      fields: 'name, mimeType, size, webContentLink, webViewLink',
    })

    // Intentar obtener el link de descarga directa de Google Drive
    let downloadUrl: string | null = null

    // Opción 1: Usar webContentLink si está disponible
    if (file.data.webContentLink) {
      try {
        // Obtener token de acceso
        const tokenResponse = await auth.getAccessToken()
        const accessToken = typeof tokenResponse === 'string' ? tokenResponse : tokenResponse.token

        if (accessToken) {
          // Generar URL de descarga directa con token de acceso
          // webContentLink ya tiene el formato correcto, solo agregamos el token
          downloadUrl = `${file.data.webContentLink}&access_token=${accessToken}`
        }
      } catch (tokenError) {
        console.error('Error obteniendo token:', tokenError)
      }
    }

    // Opción 2: Si no hay webContentLink, generar URL de descarga usando la API
    if (!downloadUrl) {
      try {
        // Generar URL de descarga directa usando la API
        // Esto funciona incluso sin webContentLink
        const tokenResponse = await auth.getAccessToken()
        const accessToken = typeof tokenResponse === 'string' ? tokenResponse : tokenResponse.token

        if (accessToken) {
          // URL base para descargar archivos de Google Drive
          downloadUrl = `https://www.googleapis.com/drive/v3/files/${videoId}?alt=media&access_token=${accessToken}`
        }
      } catch (tokenError) {
        console.error('Error generando URL de descarga:', tokenError)
      }
    }

    // Si tenemos una URL de descarga, devolverla para descarga directa desde el navegador
    if (downloadUrl) {
      return NextResponse.json({
        downloadUrl,
        fileName: fileName || file.data.name || 'video',
        mimeType: file.data.mimeType || 'video/mp4',
        useDirectDownload: true,
        success: true,
        message: 'URL de descarga directa generada. El archivo se descargará desde Google Drive.',
      })
    }

    // Método alternativo: descargar a través del servidor si no se puede obtener URL directa
    // Esto es menos eficiente pero funciona como respaldo
    try {
      const response: any = await drive.files.get(
        {
          fileId: videoId,
          alt: 'media',
          acknowledgeAbuse: false,
        },
        { responseType: 'stream' }
      )

      // Convertir el stream a buffer (solo para archivos pequeños/medianos)
      const chunks: Buffer[] = []
      const maxSize = 500 * 1024 * 1024 // 500MB límite
      let totalSize = 0

      for await (const chunk of response.data as AsyncIterable<Buffer>) {
        const chunkBuffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
        totalSize += chunkBuffer.length
        
        if (totalSize > maxSize) {
          throw new Error('El archivo es demasiado grande. Se recomienda usar la descarga directa.')
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
      
      // Si falla por permisos, proporcionar mensaje específico
      if (streamError.code === 403 || streamError.message?.includes('permission') || streamError.message?.includes('permiso')) {
        throw new Error('No tienes permisos para descargar este archivo. El propietario debe darte permisos de "Editor" o habilitar "Los visualizadores pueden descargar" en la configuración de compartir.')
      }

      throw streamError
    }
  } catch (error: any) {
    console.error('Error al descargar video:', error)
    
    // Mensajes de error específicos
    let errorMessage = 'Error al descargar el video'
    
    if (error.message?.includes('No autenticado') || error.code === 401) {
      errorMessage = 'No estás autenticado. Por favor, vuelve a autenticarte con Google.'
    } else if (error.message?.includes('permission') || error.code === 403 || error.message?.includes('permiso')) {
      errorMessage = error.message || 'No tienes permisos para descargar este archivo.'
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
