# ⚡ Inicio Rápido

Guía rápida para poner en marcha la aplicación en 5 minutos.

## 📦 Instalación

```bash
npm install
```

## 🔑 Configurar Variables de Entorno

1. Copia `env.example.txt` a `.env.local`
2. Obtén tus credenciales de Google Cloud:
   - Ve a [Google Cloud Console](https://console.cloud.google.com/)
   - Crea un proyecto
   - Habilita Google Drive API
   - Crea credenciales OAuth 2.0
   - Agrega `http://localhost:3000/auth/callback` como URI de redirección

3. Configura `.env.local`:
```env
GOOGLE_CLIENT_ID=tu_client_id
GOOGLE_CLIENT_SECRET=tu_client_secret
NEXTAUTH_URL=http://localhost:3000
```

## 🚀 Ejecutar

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## 📝 Uso

1. Haz clic en "Autenticar con Google"
2. Autoriza el acceso a Google Drive
3. Pega el enlace de una carpeta de Google Drive
4. Haz clic en "Buscar Videos"
5. Descarga los videos que necesites

## 🌐 Desplegar en Vercel

Ver `DEPLOY.md` para instrucciones completas de despliegue.

¡Listo! 🎉

