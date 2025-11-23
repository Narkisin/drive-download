'use client'

import { useState } from 'react'
import { Folder, Video, Download, ChevronDown, ChevronRight } from 'lucide-react'

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
        throw new Error('Error al descargar el video')
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
    } catch (error) {
      console.error('Error descargando video:', error)
      alert('Error al descargar el video. Por favor, intenta de nuevo.')
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
                      <Video className="w-5 h-5 text-primary-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{video.name}</p>
                        <p className="text-sm text-gray-500">{formatSize(parseInt(video.size || '0'))}</p>
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

