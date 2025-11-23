# 🚀 Guía de Despliegue en Vercel

Esta guía te ayudará a desplegar la aplicación en Vercel paso a paso.

## 📋 Prerequisitos

- Cuenta de GitHub
- Cuenta de Vercel (gratis)
- Cuenta de Google Cloud Platform

## 🔧 Paso 1: Configurar Google Cloud Platform

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)

2. **Crear un nuevo proyecto:**
   - Haz clic en el selector de proyectos
   - Clic en "Nuevo proyecto"
   - Asigna un nombre (ej: "drive-video-downloader")
   - Haz clic en "Crear"

3. **Habilitar la API de Google Drive:**
   - En el menú lateral, ve a "APIs y servicios" > "Biblioteca"
   - Busca "Google Drive API"
   - Haz clic en "Habilitar"

4. **Crear credenciales OAuth 2.0:**
   - Ve a "APIs y servicios" > "Credenciales"
   - Haz clic en "Crear credenciales" > "ID de cliente OAuth"
   - Selecciona "Aplicación web"
   - Configura:
     - **Nombre**: Drive Video Downloader
     - **URIs de redirección autorizados**: Agrega estas URLs:
       - `http://localhost:3000/auth/callback` (para desarrollo)
       - `https://TU-DOMINIO.vercel.app/auth/callback` (para producción - actualiza después del despliegue)
   - Haz clic en "Crear"
   - **¡IMPORTANTE!** Copia el **ID de cliente** y el **Secreto de cliente**, los necesitarás después

## 📤 Paso 2: Subir el código a GitHub

1. Si no tienes un repositorio, crea uno en GitHub

2. **Inicializa Git en tu proyecto:**
```bash
git init
git add .
git commit -m "Initial commit: Google Drive Video Downloader"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/TU-REPOSITORIO.git
git push -u origin main
```

## 🌐 Paso 3: Desplegar en Vercel

1. **Ve a Vercel:**
   - Visita [vercel.com](https://vercel.com)
   - Inicia sesión con tu cuenta de GitHub

2. **Importar proyecto:**
   - Haz clic en "Add New Project"
   - Selecciona tu repositorio de GitHub
   - Vercel detectará automáticamente Next.js

3. **Configurar variables de entorno:**
   - Antes de hacer deploy, ve a "Environment Variables"
   - Agrega las siguientes variables:
     ```
     GOOGLE_CLIENT_ID=tu_client_id_aqui.apps.googleusercontent.com
     GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
     NEXTAUTH_URL=https://tu-proyecto.vercel.app
     ```
   - **NOTA**: Reemplaza `tu-proyecto` con el nombre real que Vercel te asigne

4. **Hacer deploy:**
   - Haz clic en "Deploy"
   - Espera a que termine el proceso (2-3 minutos)

5. **Obtener la URL de producción:**
   - Una vez desplegado, Vercel te dará una URL
   - Copia esa URL completa (ej: `https://drive-downloader.vercel.app`)

## 🔄 Paso 4: Actualizar Google Cloud con la URL de producción

1. **Vuelve a Google Cloud Console:**
   - Ve a "APIs y servicios" > "Credenciales"
   - Edita tu ID de cliente OAuth
   - En "URIs de redirección autorizados", agrega:
     - `https://TU-DOMINIO-VERCEL.vercel.app/auth/callback`
   - Guarda los cambios

2. **Opcional - Actualizar NEXTAUTH_URL en Vercel:**
   - Ve a tu proyecto en Vercel
   - Settings > Environment Variables
   - Edita `NEXTAUTH_URL` con tu URL completa
   - Haz un nuevo deploy

## ✅ Paso 5: Verificar que todo funciona

1. Abre tu aplicación en Vercel
2. Haz clic en "Autenticar con Google"
3. Completa el proceso de autenticación
4. Pega un enlace de una carpeta de Google Drive
5. Verifica que los videos se listen correctamente

## 🔐 Consideraciones de Seguridad

- **Nunca compartas** tus credenciales de Google Cloud
- Las variables de entorno en Vercel están cifradas
- Los tokens se almacenan en cookies HTTP-only
- Solo se solicita permiso de lectura (`drive.readonly`)

## 🐛 Solución de Problemas

### Error: "redirect_uri_mismatch"
- Verifica que la URL de callback en Google Cloud coincida exactamente con la de Vercel
- Incluye el protocolo `https://`
- No incluyas `/` al final

### Error: "invalid_client"
- Verifica que las variables de entorno estén configuradas correctamente
- Asegúrate de no tener espacios extras en los valores

### Los videos no se listan
- Verifica que estés autenticado
- Asegúrate de tener permisos en la carpeta de Google Drive
- Revisa la consola del navegador para errores

### Error al descargar videos
- Los videos muy grandes pueden fallar por limitaciones del navegador
- Intenta descargar videos individuales en lugar de todos a la vez
- Verifica tu conexión a internet

## 📞 Soporte

Si tienes problemas, revisa:
1. Los logs de Vercel en el dashboard
2. La consola del navegador (F12)
3. Los logs de Google Cloud Console

¡Listo! Tu aplicación debería estar funcionando en Vercel. 🎉

