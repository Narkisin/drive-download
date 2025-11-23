'use client'

import { useState } from 'react'
import VideoDownloader from '@/components/VideoDownloader'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
            🎬 Descargador de Videos
          </h1>
          <p className="text-lg text-gray-600">
            Descarga videos de Google Drive organizados por carpetas
          </p>
        </header>
        <VideoDownloader />
      </div>
    </main>
  )
}

