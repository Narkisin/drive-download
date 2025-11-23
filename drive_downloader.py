"""
Script para descargar videos de Google Drive organizados por carpetas
"""

import os
import json
import time
import io
from pathlib import Path
from typing import List, Dict, Optional
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaIoBaseDownload
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow

# Scope necesario para acceder a Google Drive
SCOPES = ['https://www.googleapis.com/auth/drive.readonly']

# Tipos MIME de video comunes
VIDEO_MIMETYPES = [
    'video/mp4', 'video/avi', 'video/mkv', 'video/mov',
    'video/wmv', 'video/flv', 'video/webm', 'video/quicktime',
    'video/x-msvideo', 'video/x-matroska', 'video/x-ms-wmv'
]


class GoogleDriveDownloader:
    def __init__(self, credentials_file: str = 'credentials.json', token_file: str = 'token.json'):
        """
        Inicializa el descargador de Google Drive
        
        Args:
            credentials_file: Ruta al archivo de credenciales de Google (credentials.json)
            token_file: Ruta al archivo de token guardado (token.json)
        """
        self.credentials_file = credentials_file
        self.token_file = token_file
        self.service = None
        self.videos_list = []
        
    def authenticate(self):
        """Autentica con Google Drive API"""
        creds = None
        
        # Cargar token existente si existe
        if os.path.exists(self.token_file):
            creds = Credentials.from_authorized_user_file(self.token_file, SCOPES)
        
        # Si no hay credenciales válidas, solicitar autorización
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                if not os.path.exists(self.credentials_file):
                    print(f"❌ Error: No se encontró el archivo {self.credentials_file}")
                    print("\n📋 Pasos para obtener las credenciales:")
                    print("1. Ve a https://console.cloud.google.com/")
                    print("2. Crea un nuevo proyecto o selecciona uno existente")
                    print("3. Habilita la API de Google Drive")
                    print("4. Ve a 'Credenciales' > 'Crear credenciales' > 'ID de cliente OAuth'")
                    print("5. Descarga el archivo JSON y guárdalo como 'credentials.json'")
                    return False
                
                flow = InstalledAppFlow.from_client_secrets_file(
                    self.credentials_file, SCOPES)
                creds = flow.run_local_server(port=0)
            
            # Guardar credenciales para la próxima vez
            with open(self.token_file, 'w') as token:
                token.write(creds.to_json())
        
        self.service = build('drive', 'v3', credentials=creds)
        print("✅ Autenticación exitosa con Google Drive")
        return True
    
    def extract_folder_id(self, url: str) -> Optional[str]:
        """
        Extrae el ID de la carpeta desde una URL de Google Drive
        
        Args:
            url: URL de Google Drive (puede ser formato completo o solo el ID)
        
        Returns:
            ID de la carpeta o None si no se puede extraer
        """
        # Si la URL contiene '/folders/'
        if '/folders/' in url:
            folder_id = url.split('/folders/')[-1].split('?')[0].split('/')[0]
            return folder_id
        # Si es solo un ID
        elif len(url) == 33 and url.replace('-', '').replace('_', '').isalnum():
            return url
        # Si es una URL compartida
        elif 'drive.google.com' in url:
            parts = url.split('/')
            try:
                idx = parts.index('folders')
                return parts[idx + 1].split('?')[0]
            except (ValueError, IndexError):
                pass
        
        return None
    
    def is_video(self, mime_type: str) -> bool:
        """Verifica si un archivo es un video"""
        return mime_type.startswith('video/') or mime_type in VIDEO_MIMETYPES
    
    def get_folder_name(self, folder_id: str) -> str:
        """Obtiene el nombre de una carpeta"""
        try:
            folder = self.service.files().get(
                fileId=folder_id,
                fields='name'
            ).execute()
            return folder.get('name', f'Carpeta_{folder_id}')
        except HttpError:
            return f'Carpeta_{folder_id}'
    
    def list_videos_in_folder(self, folder_id: str, parent_path: str = "") -> List[Dict]:
        """
        Lista todos los videos en una carpeta y sus subcarpetas recursivamente
        
        Args:
            folder_id: ID de la carpeta
            parent_path: Ruta de la carpeta padre para mantener la estructura
        
        Returns:
            Lista de diccionarios con información de los videos
        """
        videos = []
        
        try:
            # Obtener nombre de la carpeta
            folder_name = self.get_folder_name(folder_id)
            current_path = os.path.join(parent_path, folder_name) if parent_path else folder_name
            
            print(f"📁 Explorando carpeta: {current_path}")
            
            # Listar archivos en la carpeta actual
            query = f"'{folder_id}' in parents and trashed=false"
            
            page_token = None
            while True:
                results = self.service.files().list(
                    q=query,
                    pageSize=100,
                    fields="nextPageToken, files(id, name, mimeType, size, webViewLink)",
                    pageToken=page_token
                ).execute()
                
                items = results.get('files', [])
                
                for item in items:
                    mime_type = item.get('mimeType', '')
                    
                    # Si es una carpeta, explorarla recursivamente
                    if mime_type == 'application/vnd.google-apps.folder':
                        subfolder_videos = self.list_videos_in_folder(item['id'], current_path)
                        videos.extend(subfolder_videos)
                    
                    # Si es un video, agregarlo a la lista
                    elif self.is_video(mime_type):
                        video_info = {
                            'id': item['id'],
                            'name': item['name'],
                            'mimeType': mime_type,
                            'size': item.get('size', '0'),
                            'folder_path': current_path,
                            'webViewLink': item.get('webViewLink', '')
                        }
                        videos.append(video_info)
                        print(f"  ✅ Video encontrado: {item['name']} ({self.format_size(int(video_info['size']))})")
                
                page_token = results.get('nextPageToken')
                if not page_token:
                    break
            
        except HttpError as error:
            print(f"❌ Error al acceder a la carpeta {folder_id}: {error}")
        
        return videos
    
    def format_size(self, size_bytes: int) -> str:
        """Formatea el tamaño en bytes a formato legible"""
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.2f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.2f} PB"
    
    def display_videos_list(self, videos: List[Dict]):
        """Muestra la lista de videos organizados por carpeta"""
        if not videos:
            print("\n❌ No se encontraron videos en la carpeta especificada")
            return
        
        print("\n" + "="*80)
        print("📹 LISTA DE VIDEOS A DESCARGAR")
        print("="*80)
        
        # Agrupar videos por carpeta
        folders_dict = {}
        for video in videos:
            folder_path = video['folder_path']
            if folder_path not in folders_dict:
                folders_dict[folder_path] = []
            folders_dict[folder_path].append(video)
        
        total_size = sum(int(v.get('size', 0)) for v in videos)
        
        print(f"\n📊 Total de videos: {len(videos)}")
        print(f"💾 Tamaño total: {self.format_size(total_size)}")
        print(f"📁 Carpetas: {len(folders_dict)}\n")
        
        for folder_path, folder_videos in folders_dict.items():
            folder_size = sum(int(v.get('size', 0)) for v in folder_videos)
            print(f"\n📁 {folder_path} ({len(folder_videos)} videos, {self.format_size(folder_size)})")
            print("-" * 80)
            for i, video in enumerate(folder_videos, 1):
                print(f"  {i}. {video['name']} ({self.format_size(int(video.get('size', 0)))})")
        
        print("\n" + "="*80)
    
    def download_file(self, file_id: str, file_name: str, destination_path: str) -> bool:
        """
        Descarga un archivo de Google Drive
        
        Args:
            file_id: ID del archivo en Google Drive
            file_name: Nombre del archivo
            destination_path: Ruta de destino completa
        
        Returns:
            True si la descarga fue exitosa, False en caso contrario
        """
        try:
            # Obtener metadatos del archivo
            file_metadata = self.service.files().get(fileId=file_id).execute()
            total_size = int(file_metadata.get('size', 0))
            
            # Crear request para descargar el archivo
            request = self.service.files().get_media(fileId=file_id)
            
            # Descargar el archivo usando MediaIoBaseDownload
            fh = io.FileIO(destination_path, 'wb')
            downloader = MediaIoBaseDownload(fh, request, chunksize=1024*1024)
            
            downloaded = 0
            done = False
            
            while not done:
                status, done = downloader.next_chunk()
                if status:
                    progress = int(status.progress() * 100)
                    if total_size > 0:
                        downloaded_bytes = int(status.progress() * total_size)
                        print(f"\r  ⬇️  Descargando: {progress}% ({self.format_size(downloaded_bytes)}/{self.format_size(total_size)})", 
                              end='', flush=True)
                    else:
                        print(f"\r  ⬇️  Descargando: {progress}%", end='', flush=True)
            
            fh.close()
            print(f"\r  ✅ Descargado: {file_name}")
            return True
                
        except HttpError as error:
            print(f"\r  ❌ Error HTTP al descargar {file_name}: {error}")
            return False
        except Exception as e:
            print(f"\r  ❌ Error al descargar {file_name}: {str(e)}")
            return False
    
    def download_all_videos(self, videos: List[Dict], base_download_path: str = "descargas"):
        """
        Descarga todos los videos manteniendo la estructura de carpetas
        
        Args:
            videos: Lista de videos a descargar
            base_download_path: Carpeta base donde descargar los videos
        """
        if not videos:
            print("\n❌ No hay videos para descargar")
            return
        
        print(f"\n🚀 Iniciando descarga en: {base_download_path}")
        
        # Crear carpeta base
        Path(base_download_path).mkdir(parents=True, exist_ok=True)
        
        total = len(videos)
        downloaded = 0
        failed = 0
        
        for idx, video in enumerate(videos, 1):
            folder_path = os.path.join(base_download_path, video['folder_path'])
            
            # Crear estructura de carpetas
            Path(folder_path).mkdir(parents=True, exist_ok=True)
            
            # Ruta completa del archivo
            file_path = os.path.join(folder_path, video['name'])
            
            # Si el archivo ya existe, preguntar si sobrescribir
            if os.path.exists(file_path):
                print(f"\n⚠️  El archivo ya existe: {video['name']}")
                print(f"  📍 Ubicación: {file_path}")
                overwrite = input("  ¿Sobrescribir? (s/n): ").lower().strip()
                if overwrite != 's':
                    print(f"  ⏭️  Omitiendo: {video['name']}")
                    continue
            
            print(f"\n[{idx}/{total}] 📥 {video['name']}")
            print(f"  📁 Carpeta: {video['folder_path']}")
            
            if self.download_file(video['id'], video['name'], file_path):
                downloaded += 1
            else:
                failed += 1
                
            # Pequeña pausa para evitar rate limiting
            time.sleep(0.5)
        
        print("\n" + "="*80)
        print("📊 RESUMEN DE DESCARGA")
        print("="*80)
        print(f"✅ Descargados: {downloaded}")
        print(f"❌ Fallidos: {failed}")
        print(f"📁 Ubicación: {os.path.abspath(base_download_path)}")
        print("="*80)


def main():
    """Función principal"""
    print("="*80)
    print("🎬 DESCARGADOR DE VIDEOS DE GOOGLE DRIVE")
    print("="*80)
    
    # Inicializar descargador
    downloader = GoogleDriveDownloader()
    
    # Autenticar
    if not downloader.authenticate():
        return
    
    # Solicitar URL o ID de la carpeta
    print("\n📋 Ingresa el enlace o ID de la carpeta de Google Drive:")
    url_input = input("👉 ").strip()
    
    # Extraer ID de la carpeta
    folder_id = downloader.extract_folder_id(url_input)
    
    if not folder_id:
        print("❌ Error: No se pudo extraer el ID de la carpeta desde la URL proporcionada")
        return
    
    print(f"\n🔍 Carpeta ID: {folder_id}")
    
    # Listar todos los videos
    print("\n🔎 Buscando videos en la carpeta y subcarpetas...")
    videos = downloader.list_videos_in_folder(folder_id)
    
    # Mostrar lista de videos
    downloader.display_videos_list(videos)
    
    if not videos:
        return
    
    # Preguntar si desea descargar
    print("\n❓ ¿Deseas descargar todos los videos? (s/n): ", end='')
    confirm = input().lower().strip()
    
    if confirm == 's':
        download_path = input("\n📁 Ingresa la carpeta de destino (Enter para 'descargas'): ").strip()
        if not download_path:
            download_path = "descargas"
        
        downloader.download_all_videos(videos, download_path)
    else:
        print("\n⏹️  Descarga cancelada")


if __name__ == "__main__":
    main()

