'use client'

import { useState } from 'react'
import { Folder, Video, Download, ChevronDown, ChevronRight, FileText } from 'lucide-react'

interface VideoItem {
  id: string
  name: string
  mimeType: string
  fileType: 'video' | 'pdf'
  size: string
  folderPath: string
  webViewLink: string
}

interface FolderStructure {
  [key: string]: VideoItem[]
}

interface VideoListProps {
  folderStructure: FolderStructure
  formatSize: (bytes: number) => string
}

export default function VideoList({ folderStructure, formatSize }: VideoListProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(Object.keys(folderStructure)))

  const toggleFolder = (folderPath: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath)
    } else {
      newExpanded.add(folderPath)
    }
    setExpandedFolders(newExpanded)
  }

  const handleDownload = async (video: VideoItem) => {
    try {
      const response = await fetch('/api/download-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId: video.id,
          fileName: video.name,
          folderPath: video.folderPath,
        }),
      })

      if (!response.ok) {
        // Intentar obtener mensaje de error del servidor
        let errorMessage = 'Error al descargar el video'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // Si no se puede parsear, usar mensaje genérico
        }
        throw new Error(errorMessage)
      }

      // Verificar si la respuesta es JSON con URL de descarga directa
      const contentType = response.headers.get('content-type')
      
      if (contentType?.includes('application/json')) {
        const data = await response.json()
        if (data.downloadUrl && data.useDirectDownload) {
          // Crear un enlace de descarga programático para mejor compatibilidad
          const link = document.createElement('a')
          link.href = data.downloadUrl
          link.download = data.fileName || video.name
          link.target = '_blank'
          link.rel = 'noopener noreferrer'
          
          // Agregar al DOM temporalmente para activar la descarga
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          
          return
        }
      }
      
      // Si hubo una redirección, seguir el enlace
      if (response.redirected) {
        window.location.href = response.url
        return
      }

      // Si es un blob (descarga a través del servidor)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = video.name
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error: any) {
      console.error('Error descargando video:', error)
      alert(`Error al descargar el video: ${error.message || 'Error desconocido'}\n\nPor favor, intenta de nuevo o verifica que tienes permisos para descargar este archivo.`)
    }
  }

  const sortedFolders = Object.keys(folderStructure).sort()

  return (
    <div className="space-y-4">
      {sortedFolders.map((folderPath) => {
        const videos = folderStructure[folderPath]
        const isExpanded = expandedFolders.has(folderPath)
        const folderSize = videos.reduce((sum, v) => sum + parseInt(v.size || '0'), 0)

        return (
          <div key={folderPath} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Encabezado de carpeta */}
            <button
              onClick={() => toggleFolder(folderPath)}
              className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3 flex-1 text-left">
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                )}
                <Folder className="w-5 h-5 text-primary-600" />
                <div className="flex-1">
                  <span className="font-semibold text-gray-900">{folderPath || 'Raíz'}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    ({videos.length} {videos.length === 1 ? 'video' : 'videos'} • {formatSize(folderSize)})
                  </span>
                </div>
              </div>
            </button>

            {/* Lista de videos */}
            {isExpanded && (
              <div className="bg-white divide-y divide-gray-200">
                {videos.map((video, index) => (
                  <div
                    key={video.id}
                    className="px-4 py-3 hover:bg-gray-50 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {video.fileType === 'video' ? (
                        <Video className="w-5 h-5 text-primary-600 flex-shrink-0" />
                      ) : (
                        <FileText className="w-5 h-5 text-red-600 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{video.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatSize(parseInt(video.size || '0'))} • {video.fileType === 'video' ? 'Video' : 'PDF'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownload(video)}
                      className="ml-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 flex-shrink-0"
                    >
                      <Download className="w-4 h-4" />
                      Descargar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

