# 🎬 Descargador de Videos de Google Drive - Aplicación Web

Aplicación web completa con interfaz de usuario moderna para descargar videos de Google Drive organizados por carpetas. Construida con Next.js, TypeScript y Tailwind CSS, lista para desplegar en Vercel.

## ✨ Características

- ✅ **Interfaz de usuario moderna y responsive**
- ✅ **Autenticación OAuth con Google**
- ✅ **Lista todos los videos en carpetas y subcarpetas**
- ✅ **Organización por carpetas con vista expandible**
- ✅ **Descarga individual o masiva de videos**
- ✅ **Estadísticas de videos (cantidad, tamaño total)**
- ✅ **Barra de progreso durante las descargas**
- ✅ **Compatible con Vercel**

## 🚀 Instalación Local

### 1. Clonar o descargar el proyecto

```bash
git clone <tu-repositorio>
cd google-drive-video-downloader
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar credenciales de Google Drive

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la **API de Google Drive**
4. Ve a **Credenciales** > **Crear credenciales** > **ID de cliente OAuth**
5. Selecciona **Aplicación web**
6. Configura los URI de redirección autorizados:
   - `http://localhost:3000/auth/callback` (para desarrollo)
   - `https://tu-dominio.vercel.app/auth/callback` (para producción)
7. Copia el **ID de cliente** y el **Secreto de cliente**

### 4. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
GOOGLE_CLIENT_ID=tu_client_id_aqui.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
NEXTAUTH_URL=http://localhost:3000
```

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🌐 Desplegar en Vercel

### 1. Subir el proyecto a GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <tu-repositorio-github>
git push -u origin main
```

### 2. Conectar con Vercel

1. Ve a [Vercel](https://vercel.com/)
2. Importa tu repositorio de GitHub
3. Vercel detectará automáticamente Next.js

### 3. Configurar variables de entorno en Vercel

En el dashboard de Vercel:
1. Ve a **Settings** > **Environment Variables**
2. Agrega las siguientes variables:
   - `GOOGLE_CLIENT_ID`: Tu ID de cliente de Google
   - `GOOGLE_CLIENT_SECRET`: Tu secreto de cliente de Google
   - `NEXTAUTH_URL`: La URL de tu aplicación en Vercel (ej: `https://tu-app.vercel.app`)

### 4. Actualizar URI de redirección en Google Cloud

Asegúrate de agregar la URL de callback de producción en Google Cloud Console:
- `https://tu-app.vercel.app/auth/callback`

### 5. Desplegar

Vercel desplegará automáticamente. Cada push a la rama principal activará un nuevo despliegue.

## 📖 Uso

1. **Autenticar con Google**: Haz clic en "Autenticar con Google" y autoriza el acceso a Google Drive
2. **Pegar enlace**: Pega el enlace de la carpeta de Google Drive que contiene los videos
3. **Buscar videos**: Haz clic en "Buscar Videos" para listar todos los videos
4. **Descargar**: Puedes descargar videos individuales o todos a la vez

### Formatos de URL soportados:

- `https://drive.google.com/drive/folders/1ABC...XYZ`
- `1ABC...XYZ` (solo el ID)
- URLs compartidas de Google Drive

## 🏗️ Estructura del Proyecto

```
.
├── app/
│   ├── api/
│   │   ├── auth/          # Endpoints de autenticación
│   │   ├── list-videos/   # API para listar videos
│   │   └── download-video/# API para descargar videos
│   ├── auth/
│   │   └── callback/      # Página de callback OAuth
│   ├── globals.css        # Estilos globales
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página principal
├── components/
│   ├── AuthButton.tsx     # Botón de autenticación
│   ├── VideoDownloader.tsx# Componente principal
│   └── VideoList.tsx      # Lista de videos por carpetas
├── public/                # Archivos estáticos
└── package.json           # Dependencias
```

## 🛠️ Tecnologías

- **Next.js 14** - Framework React
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos
- **Google APIs** - Integración con Google Drive
- **OAuth 2.0** - Autenticación

## 🔒 Seguridad

- Los tokens de autenticación se almacenan en cookies HTTP-only
- Solo permisos de lectura (`drive.readonly`)
- Las credenciales nunca se exponen al cliente
- Validación de autenticación en cada petición

## ⚙️ Requisitos

- Node.js 18 o superior
- Cuenta de Google Cloud Platform
- Acceso a las carpetas de Google Drive que quieras descargar

## 📝 Notas

- Los videos grandes pueden tardar más en descargarse
- El navegador puede limitar las descargas simultáneas
- Asegúrate de tener permisos de visualización en las carpetas de Google Drive
- Los tokens de autenticación expiran después de 7 días

## 🐛 Solución de Problemas

### Error de autenticación
- Verifica que las variables de entorno estén configuradas correctamente
- Asegúrate de que el URI de redirección esté configurado en Google Cloud Console

### Videos no encontrados
- Verifica que tengas permisos de acceso a la carpeta
- Asegúrate de que la carpeta esté compartida contigo o sea pública

### Error al descargar
- Verifica tu conexión a internet
- Los archivos muy grandes pueden fallar por limitaciones del navegador
- Intenta descargar videos de uno en uno

## 📄 Licencia

MIT

## 👨‍💻 Autor

Desarrollado para facilitar la descarga organizada de videos de Google Drive.
