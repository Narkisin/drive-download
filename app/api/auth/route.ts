import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/callback`

  if (!clientId || !clientSecret) {
    throw new Error('Las credenciales de Google no están configuradas. Por favor, configura GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en las variables de entorno.')
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri)
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action') || 'login'

    if (action === 'login') {
      const oauth2Client = getOAuth2Client()
      
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/drive.readonly'],
        prompt: 'consent',
      })

      return NextResponse.json({ authUrl })
    }

    if (action === 'callback') {
      const oauth2Client = getOAuth2Client()
      const code = searchParams.get('code')
      
      if (!code) {
        return NextResponse.json({ error: 'No se proporcionó código de autorización' }, { status: 400 })
      }

      try {
        const { tokens } = await oauth2Client.getToken(code)
        oauth2Client.setCredentials(tokens)

        // Guardar tokens en cookies o en una sesión
        const response = NextResponse.json({ success: true })
        response.cookies.set('google_tokens', JSON.stringify(tokens), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 días
        })

        return response
      } catch (error: any) {
        console.error('Error al obtener tokens:', error)
        return NextResponse.json({ error: error.message || 'Error al procesar la autenticación' }, { status: 500 })
      }
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (error: any) {
    console.error('Error en autenticación:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Error de configuración',
        requiresSetup: error.message?.includes('credenciales')
      }, 
      { status: 500 }
    )
  }
}

