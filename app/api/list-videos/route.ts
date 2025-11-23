import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

const VIDEO_MIMETYPES = [
  'video/mp4',
  'video/avi',
  'video/mkv',
  'video/mov',
  'video/wmv',
  'video/flv',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'video/x-ms-wmv',
]

function isVideo(mimeType: string): boolean {
  return mimeType.startsWith('video/') || VIDEO_MIMETYPES.includes(mimeType)
}

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

async function getFolderName(drive: any, folderId: string): Promise<string> {
  try {
    const folder = await drive.files.get({
      fileId: folderId,
      fields: 'name',
    })
    return folder.data.name || `Carpeta_${folderId}`
  } catch (error) {
    return `Carpeta_${folderId}`
  }
}

async function listVideosInFolder(
  drive: any,
  folderId: string,
  parentPath: string = ''
): Promise<any[]> {
  const videos: any[] = []

  try {
    const folderName = await getFolderName(drive, folderId)
    const currentPath = parentPath ? `${parentPath}/${folderName}` : folderName

    let pageToken: string | undefined = undefined

    while (true) {
      const query = `'${folderId}' in parents and trashed=false`
      
      const response: { data: { files?: any[]; nextPageToken?: string } } = await drive.files.list({
        q: query,
        pageSize: 100,
        fields: 'nextPageToken, files(id, name, mimeType, size, webViewLink)',
        pageToken,
      })

      const items = response.data.files || []

      for (const item of items) {
        const mimeType = item.mimeType || ''

        // Si es una carpeta, explorarla recursivamente
        if (mimeType === 'application/vnd.google-apps.folder') {
          const subfolderVideos = await listVideosInFolder(drive, item.id, currentPath)
          videos.push(...subfolderVideos)
        }
        // Si es un video, agregarlo a la lista
        else if (isVideo(mimeType)) {
          videos.push({
            id: item.id,
            name: item.name,
            mimeType: mimeType,
            size: item.size || '0',
            folderPath: currentPath,
            webViewLink: item.webViewLink || '',
          })
        }
      }

      pageToken = response.data.nextPageToken
      if (!pageToken) {
        break
      }
    }
  } catch (error: any) {
    console.error(`Error al acceder a la carpeta ${folderId}:`, error.message)
  }

  return videos
}

export async function POST(request: NextRequest) {
  try {
    const { folderId } = await request.json()

    if (!folderId) {
      return NextResponse.json({ error: 'ID de carpeta no proporcionado' }, { status: 400 })
    }

    const auth = await getAuthenticatedClient(request)

    if (!auth) {
      return NextResponse.json(
        { error: 'No autenticado', requiresAuth: true },
        { status: 401 }
      )
    }

    const drive = google.drive({ version: 'v3', auth })
    const videos = await listVideosInFolder(drive, folderId)

    return NextResponse.json({ videos, success: true })
  } catch (error: any) {
    console.error('Error al listar videos:', error)
    return NextResponse.json(
      { error: error.message || 'Error al listar videos' },
      { status: 500 }
    )
  }
}

