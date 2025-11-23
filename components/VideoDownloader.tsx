'use client'

import { useState } from 'react'
import { Folder, Video, Download, Search, Loader2, CheckCircle2, XCircle, FolderOpen, FileText, Filter } from 'lucide-react'
import VideoList from './VideoList'
import AuthButton from './AuthButton'

interface FileItem {
  id: string
  name: string
  mimeType: string
  fileType: 'video' | 'pdf'
  size: string
  folderPath: string
  webViewLink: string
}

interface FolderStructure {
  [key: string]: FileItem[]
}

export default function VideoDownloader() {
  const [folderUrl, setFolderUrl] = useState('')
  const [files, setFiles] = useState<FileItem[]>([])
  const [videos, setVideos] = useState<FileItem[]>([])
  const [pdfs, setPdfs] = useState<FileItem[]>([])
  const [folderStructure, setFolderStructure] = useState<FolderStructure>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [stats, setStats] = useState({ total: 0, videosCount: 0, pdfsCount: 0, totalSize: 0, folders: 0 })
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'video' | 'pdf'>('all')

  const extractFolderId = (url: string): string | null => {
    if (!url) return null

    if (url.includes('/folders/')) {
      return url.split('/folders/')[1].split('?')[0].split('/')[0]
    }

    if (url.includes('drive.google.com')) {
      const match = url.match(/[-\w]{25,}/)
      return match ? match[0] : null
    }

    if (url.length === 33 && /^[a-zA-Z0-9_-]+$/.test(url)) {
      return url
    }

    return null
  }

  const formatSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`
  }

  const organizeFilesByFolder = (files: FileItem[]): FolderStructure => {
    const structure: FolderStructure = {}
    
    files.forEach(file => {
      const path = file.folderPath || 'Raíz'
      if (!structure[path]) {
        structure[path] = []
      }
      structure[path].push(file)
    })

    return structure
  }

  const calculateStats = (files: FileItem[]) => {
    const total = files.length
    const videosCount = files.filter(f => f.fileType === 'video').length
    const pdfsCount = files.filter(f => f.fileType === 'pdf').length
    const totalSize = files.reduce((sum, file) => sum + parseInt(file.size || '0'), 0)
    const folders = new Set(files.map(f => f.folderPath || 'Raíz')).size

    return { total, videosCount, pdfsCount, totalSize, folders }
  }

  const getFilteredFiles = (): FileItem[] => {
    if (filterType === 'all') return files
    if (filterType === 'video') return videos
    if (filterType === 'pdf') return pdfs
    return files
  }

  const getFilteredFolderStructure = (): FolderStructure => {
    const filteredFiles = getFilteredFiles()
    return organizeFilesByFolder(filteredFiles)
  }

  const handleSearch = async () => {
    const folderId = extractFolderId(folderUrl)
    
    if (!folderId) {
      setError('Por favor, ingresa un enlace válido de Google Drive')
      return
    }

    setLoading(true)
      setError(null)
      setSuccess(false)
      setFiles([])
      setVideos([])
      setPdfs([])
      setFolderStructure({})

    try {
      // Crear un AbortController para manejar timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 segundos

      const response = await fetch('/api/list-videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderId }),
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)

      // Si la respuesta no es ok, intentar parsear el JSON del error
      let data
      try {
        data = await response.json()
      } catch {
        // Si no se puede parsear JSON, crear un objeto de error
        if (response.status === 504) {
          data = { error: 'Tiempo de espera agotado. La carpeta contiene demasiados archivos. Intenta con una carpeta más pequeña.', timeout: true }
        } else {
          data = { error: 'Error al procesar la respuesta del servidor' }
        }
      }

      if (!response.ok) {
        // Manejo especial para timeouts
        if (response.status === 504 || data.timeout) {
          throw new Error('⏱️ La búsqueda está tardando demasiado. Por favor, intenta con una carpeta más pequeña o más específica. La carpeta puede contener demasiados archivos o subcarpetas.')
        }
        throw new Error(data.error || 'Error al listar los videos')
      }

      if (data.requiresAuth) {
        setIsAuthenticated(false)
        setError('Por favor, autentícate con Google primero')
        return
      }

      setIsAuthenticated(true)
      const allFiles = data.files || []
      const videosList = data.videos || []
      const pdfsList = data.pdfs || []
      
      setFiles(allFiles)
      setVideos(videosList)
      setPdfs(pdfsList)
      
      const structure = organizeFilesByFolder(allFiles)
      setFolderStructure(structure)
      setStats(calculateStats(allFiles))
      setSuccess(true)
      
      // Mostrar tiempo de procesamiento si está disponible
      if (data.processingTime) {
        console.log(`Búsqueda completada en ${(data.processingTime / 1000).toFixed(2)} segundos`)
      }
    } catch (err: any) {
      // Manejo de errores de timeout del cliente
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        setError('⏱️ Tiempo de espera agotado. La carpeta contiene demasiados archivos. Intenta con una carpeta más pequeña o específica.')
      } else {
        setError(err.message || 'Error al buscar videos')
      }
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadAll = async () => {
    const filesToDownload = getFilteredFiles()
    if (filesToDownload.length === 0) return

    setLoading(true)
    setError(null)

    try {
      for (const file of filesToDownload) {
        try {
          const response = await fetch('/api/download-video', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ videoId: file.id, fileName: file.name, folderPath: file.folderPath }),
          })

          if (!response.ok) {
            let errorMessage = `Error al descargar ${file.name}`
            try {
              const errorData = await response.json()
              errorMessage = errorData.error || errorMessage
            } catch {
              // Si no se puede parsear, usar mensaje genérico
            }
            throw new Error(errorMessage)
          }

          // Verificar si es una URL de descarga directa
          const contentType = response.headers.get('content-type')
          
          if (contentType?.includes('application/json')) {
            const data = await response.json()
            if (data.downloadUrl && data.useDirectDownload) {
              // Crear enlace de descarga programático
              const link = document.createElement('a')
              link.href = data.downloadUrl
              link.download = data.fileName || file.name
              link.target = '_blank'
              link.rel = 'noopener noreferrer'
              
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
              
              // Pequeña pausa entre descargas para evitar saturar el navegador
              await new Promise(resolve => setTimeout(resolve, 500))
              continue
            }
          }

          // Descarga a través del servidor (blob)
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = file.name
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
          
          // Pequeña pausa entre descargas
          await new Promise(resolve => setTimeout(resolve, 500))
        } catch (err: any) {
          console.error(`Error descargando ${file.name}:`, err)
          // Continuar con el siguiente video en lugar de detenerse
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error al descargar videos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Sección de autenticación */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-6 flex justify-end">
        <AuthButton />
      </div>

      {/* Sección de búsqueda */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="folder-url" className="block text-sm font-medium text-gray-700 mb-2">
              Enlace de Google Drive
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="folder-url"
                type="text"
                value={folderUrl}
                onChange={(e) => setFolderUrl(e.target.value)}
                placeholder="Pega el enlace de la carpeta de Google Drive..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                disabled={loading}
              />
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              disabled={loading || !folderUrl}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Buscar Archivos
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <XCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {success && files.length > 0 && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
            <CheckCircle2 className="w-5 h-5" />
            <span>
              Se encontraron {stats.total} archivos ({stats.videosCount} videos, {stats.pdfsCount} PDFs) 
              en {stats.folders} {stats.folders === 1 ? 'carpeta' : 'carpetas'}
            </span>
          </div>
        )}
      </div>

      {/* Estadísticas */}
      {success && files.length > 0 && (
        <div className="space-y-4 mb-6">
          {/* Filtros por tipo */}
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Filtrar por tipo:</span>
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterType === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todos ({stats.total})
              </button>
              <button
                onClick={() => setFilterType('video')}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  filterType === 'video'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Video className="w-4 h-4" />
                Videos ({stats.videosCount})
              </button>
              <button
                onClick={() => setFilterType('pdf')}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  filterType === 'pdf'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                PDFs ({stats.pdfsCount})
              </button>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3">
                <Folder className="w-8 h-8 text-primary-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Archivos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3">
                <Video className="w-8 h-8 text-primary-600" />
                <div>
                  <p className="text-sm text-gray-600">Videos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.videosCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-primary-600" />
                <div>
                  <p className="text-sm text-gray-600">PDFs</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pdfsCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3">
                <Download className="w-8 h-8 text-primary-600" />
                <div>
                  <p className="text-sm text-gray-600">Tamaño Total</p>
                  <p className="text-2xl font-bold text-gray-900">{formatSize(stats.totalSize)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de archivos */}
      {success && files.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FolderOpen className="w-6 h-6" />
              {filterType === 'all' && 'Archivos Organizados por Carpetas'}
              {filterType === 'video' && 'Videos Organizados por Carpetas'}
              {filterType === 'pdf' && 'PDFs Organizados por Carpetas'}
            </h2>
            <button
              onClick={handleDownloadAll}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Descargar {filterType === 'all' ? 'Todos' : filterType === 'video' ? 'Videos' : 'PDFs'}
            </button>
          </div>
          <VideoList folderStructure={getFilteredFolderStructure()} formatSize={formatSize} />
        </div>
      )}
    </div>
  )
}

