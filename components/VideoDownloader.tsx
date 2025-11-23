'use client'

import { useState } from 'react'
import { Folder, Video, Download, Search, Loader2, CheckCircle2, XCircle, FolderOpen } from 'lucide-react'
import VideoList from './VideoList'
import AuthButton from './AuthButton'

interface VideoItem {
  id: string
  name: string
  mimeType: string
  size: string
  folderPath: string
  webViewLink: string
}

interface FolderStructure {
  [key: string]: VideoItem[]
}

export default function VideoDownloader() {
  const [folderUrl, setFolderUrl] = useState('')
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [folderStructure, setFolderStructure] = useState<FolderStructure>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [stats, setStats] = useState({ total: 0, totalSize: 0, folders: 0 })
  const [isAuthenticated, setIsAuthenticated] = useState(false)

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

  const organizeVideosByFolder = (videos: VideoItem[]): FolderStructure => {
    const structure: FolderStructure = {}
    
    videos.forEach(video => {
      const path = video.folderPath || 'Raíz'
      if (!structure[path]) {
        structure[path] = []
      }
      structure[path].push(video)
    })

    return structure
  }

  const calculateStats = (videos: VideoItem[]) => {
    const total = videos.length
    const totalSize = videos.reduce((sum, video) => sum + parseInt(video.size || '0'), 0)
    const folders = new Set(videos.map(v => v.folderPath || 'Raíz')).size

    return { total, totalSize, folders }
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
    setVideos([])
    setFolderStructure({})

    try {
      const response = await fetch('/api/list-videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al listar los videos')
      }

      if (data.requiresAuth) {
        setIsAuthenticated(false)
        setError('Por favor, autentícate con Google primero')
        return
      }

      setIsAuthenticated(true)
      setVideos(data.videos || [])
      const structure = organizeVideosByFolder(data.videos || [])
      setFolderStructure(structure)
      setStats(calculateStats(data.videos || []))
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Error al buscar videos')
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadAll = async () => {
    if (videos.length === 0) return

    setLoading(true)
    setError(null)

    try {
      for (const video of videos) {
        try {
          const response = await fetch('/api/download-video', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ videoId: video.id, fileName: video.name, folderPath: video.folderPath }),
          })

          if (!response.ok) {
            throw new Error(`Error al descargar ${video.name}`)
          }

          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = video.name
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        } catch (err) {
          console.error(`Error descargando ${video.name}:`, err)
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
                  Buscar Videos
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

        {success && videos.length > 0 && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
            <CheckCircle2 className="w-5 h-5" />
            <span>Se encontraron {stats.total} videos en {stats.folders} {stats.folders === 1 ? 'carpeta' : 'carpetas'}</span>
          </div>
        )}
      </div>

      {/* Estadísticas */}
      {success && videos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3">
              <Video className="w-8 h-8 text-primary-600" />
              <div>
                <p className="text-sm text-gray-600">Total de Videos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3">
              <Folder className="w-8 h-8 text-primary-600" />
              <div>
                <p className="text-sm text-gray-600">Carpetas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.folders}</p>
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
      )}

      {/* Lista de videos */}
      {success && videos.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FolderOpen className="w-6 h-6" />
              Videos Organizados por Carpetas
            </h2>
            <button
              onClick={handleDownloadAll}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Descargar Todos
            </button>
          </div>
          <VideoList folderStructure={folderStructure} formatSize={formatSize} />
        </div>
      )}
    </div>
  )
}

