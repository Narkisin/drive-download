import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

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

    // Obtener el archivo y generar URL de descarga
    const file: any = await drive.files.get({
      fileId: videoId,
      fields: 'name, mimeType, size',
    })

    // Obtener el stream de descarga
    const response: { data: any } = await drive.files.get(
      {
        fileId: videoId,
        alt: 'media',
      },
      { responseType: 'stream' }
    )

    // Convertir el stream a buffer
    const chunks: Buffer[] = []
    for await (const chunk of response.data as AsyncIterable<Buffer>) {
      chunks.push(Buffer.from(chunk))
    }
    const buffer = Buffer.concat(chunks)

    // Retornar el archivo como respuesta
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': file.data.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName || file.data.name || 'video')}"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error: any) {
    console.error('Error al descargar video:', error)
    return NextResponse.json(
      { error: error.message || 'Error al descargar el video' },
      { status: 500 }
    )
  }
}

