import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

// Configurar timeout máximo para Vercel (60 segundos)
export const maxDuration = 60

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

const PDF_MIMETYPES = [
  'application/pdf',
  'application/x-pdf',
  'application/acrobat',
  'applications/vnd.pdf',
  'text/pdf',
  'text/x-pdf',
]

function isVideo(mimeType: string): boolean {
  return mimeType.startsWith('video/') || VIDEO_MIMETYPES.includes(mimeType)
}

function isPDF(mimeType: string): boolean {
  return mimeType === 'application/pdf' || PDF_MIMETYPES.includes(mimeType)
}

function getFileType(mimeType: string): 'video' | 'pdf' | 'other' {
  if (isVideo(mimeType)) return 'video'
  if (isPDF(mimeType)) return 'pdf'
  return 'other'
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

async function listFilesInFolder(
  drive: any,
  folderId: string,
  parentPath: string = '',
  depth: number = 0,
  maxDepth: number = 10
): Promise<any[]> {
  const files: any[] = []

  // Limitar profundidad para evitar recursión infinita y timeouts
  if (depth > maxDepth) {
    console.warn(`Profundidad máxima alcanzada en ${parentPath}`)
    return files
  }

  try {
    const folderName = await getFolderName(drive, folderId)
    const currentPath = parentPath ? `${parentPath}/${folderName}` : folderName

    let pageToken: string | undefined = undefined
    const foldersToProcess: { id: string; path: string }[] = []

    // Primero, recopilar todos los archivos y carpetas
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

        // Si es una carpeta, agregarla a la lista para procesar después
        if (mimeType === 'application/vnd.google-apps.folder') {
          foldersToProcess.push({ id: item.id, path: currentPath })
        }
        // Si es un video o PDF, agregarlo directamente
        else if (isVideo(mimeType) || isPDF(mimeType)) {
          files.push({
            id: item.id,
            name: item.name,
            mimeType: mimeType,
            fileType: getFileType(mimeType),
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

    // Procesar carpetas en paralelo (limitado a 5 a la vez para evitar demasiadas solicitudes)
    const batchSize = 5
    for (let i = 0; i < foldersToProcess.length; i += batchSize) {
      const batch = foldersToProcess.slice(i, i + batchSize)
      const subfolderPromises = batch.map(folder => 
        listFilesInFolder(drive, folder.id, folder.path, depth + 1, maxDepth)
      )
      const subfolderResults = await Promise.all(subfolderPromises)
      subfolderResults.forEach(subfolderFiles => {
        files.push(...subfolderFiles)
      })
    }
  } catch (error: any) {
    console.error(`Error al acceder a la carpeta ${folderId}:`, error.message)
  }

  return files
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const TIMEOUT_MS = 55000 // 55 segundos (dejar margen antes del límite de 60s)

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
    
    // Función para verificar timeout
    const checkTimeout = () => {
      if (Date.now() - startTime > TIMEOUT_MS) {
        throw new Error('Tiempo de espera agotado. La carpeta contiene demasiados archivos. Intenta con una carpeta más pequeña o más específica.')
      }
    }

    // Listar archivos (videos y PDFs) con límites de tiempo
    const files = await listFilesInFolder(drive, folderId)
    checkTimeout()

    // Separar por tipo
    const videos = files.filter(f => f.fileType === 'video')
    const pdfs = files.filter(f => f.fileType === 'pdf')

    return NextResponse.json({ 
      files,
      videos,
      pdfs,
      success: true,
      count: files.length,
      videosCount: videos.length,
      pdfsCount: pdfs.length,
      processingTime: Date.now() - startTime
    })
  } catch (error: any) {
    console.error('Error al listar videos:', error)
    
    // Si es un timeout, devolver un error más descriptivo
    if (error.message?.includes('Tiempo de espera') || Date.now() - startTime > TIMEOUT_MS) {
      return NextResponse.json(
        { 
          error: 'La búsqueda está tardando demasiado. Por favor, intenta con una carpeta más pequeña o específica.',
          timeout: true
        },
        { status: 504 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Error al listar archivos' },
      { status: 500 }
    )
  }
}

