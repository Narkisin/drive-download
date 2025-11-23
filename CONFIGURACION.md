# 🔧 Guía de Configuración de Variables de Entorno

## ❌ Error: "Missing required parameter: client_id"

Este error ocurre cuando las variables de entorno no están configuradas correctamente.

## ✅ Solución Paso a Paso

### Para Desarrollo Local

1. **Crea el archivo `.env.local` en la raíz del proyecto:**

```bash
# En la raíz del proyecto, crea el archivo .env.local
```

2. **Agrega las siguientes variables:**

```env
GOOGLE_CLIENT_ID=tu_client_id_aqui.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
NEXTAUTH_URL=http://localhost:3000
```

3. **Obtén tus credenciales de Google Cloud:**

   a. Ve a [Google Cloud Console](https://console.cloud.google.com/)
   
   b. Selecciona o crea un proyecto
   
   c. Habilita la **API de Google Drive**:
      - Ve a "APIs y servicios" > "Biblioteca"
      - Busca "Google Drive API"
      - Haz clic en "Habilitar"
   
   d. Crea credenciales OAuth 2.0:
      - Ve a "APIs y servicios" > "Credenciales"
      - Haz clic en "Crear credenciales" > "ID de cliente OAuth"
      - Tipo: **Aplicación web**
      - Nombre: Drive Video Downloader (o el que prefieras)
      - **URIs de redirección autorizados**:
        ```
        http://localhost:3000/auth/callback
        ```
      - Haz clic en "Crear"
   
   e. Copia el **ID de cliente** y el **Secreto de cliente**
   
   f. Pégalos en tu archivo `.env.local`:
      ```env
      GOOGLE_CLIENT_ID=123456789-abcdefghijk.apps.googleusercontent.com
      GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
      ```

4. **Reinicia el servidor de desarrollo:**

```bash
# Detén el servidor (Ctrl+C) y vuelve a iniciarlo
npm run dev
```

### Para Producción (Vercel)

1. **Ve al dashboard de Vercel:**
   - [vercel.com/dashboard](https://vercel.com/dashboard)
   - Selecciona tu proyecto

2. **Configura las variables de entorno:**
   - Ve a **Settings** > **Environment Variables**
   - Agrega cada variable:
     - `GOOGLE_CLIENT_ID` = tu_client_id
     - `GOOGLE_CLIENT_SECRET` = tu_client_secret
     - `NEXTAUTH_URL` = https://tu-proyecto.vercel.app

3. **Actualiza Google Cloud Console:**
   - Ve a tu ID de cliente OAuth en Google Cloud
   - Agrega el URI de redirección de producción:
     ```
     https://tu-proyecto.vercel.app/auth/callback
     ```
   - **IMPORTANTE**: Reemplaza `tu-proyecto` con tu dominio real de Vercel

4. **Redespliega la aplicación:**
   - Ve a "Deployments" en Vercel
   - Haz clic en los tres puntos del último deployment
   - Selecciona "Redeploy"

## 🔍 Verificar que está funcionando

1. **Verifica que el archivo `.env.local` existe:**
   ```bash
   # En la raíz del proyecto
   ls -la .env.local
   # o en Windows
   dir .env.local
   ```

2. **Verifica que las variables estén configuradas:**
   - Abre `.env.local` y verifica que no tengan espacios extras
   - Las variables no deben tener comillas a menos que sea necesario

3. **Verifica en la consola del servidor:**
   - Si ves errores sobre variables de entorno, verifica la sintaxis
   - Asegúrate de reiniciar el servidor después de cambiar `.env.local`

4. **Prueba la autenticación:**
   - Haz clic en "Autenticar con Google"
   - Deberías ser redirigido a la página de autenticación de Google
   - Si ves el error nuevamente, verifica las variables de entorno

## ⚠️ Errores Comunes

### Error: "redirect_uri_mismatch"
- **Causa**: El URI de redirección en Google Cloud no coincide
- **Solución**: Verifica que el URI en Google Cloud sea exactamente igual:
  - Desarrollo: `http://localhost:3000/auth/callback`
  - Producción: `https://tu-dominio.vercel.app/auth/callback`
  - Sin barra final, sin espacios

### Error: "invalid_client"
- **Causa**: El client_id o client_secret son incorrectos
- **Solución**: 
  - Verifica que copiaste correctamente desde Google Cloud
  - No deben tener espacios extras
  - En Vercel, verifica que las variables estén guardadas correctamente

### Error: Variables no se leen
- **Causa**: El archivo `.env.local` no está en la raíz o tiene sintaxis incorrecta
- **Solución**:
  - El archivo debe estar en la misma carpeta que `package.json`
  - No debe tener espacios alrededor del `=`
  - Debe reiniciarse el servidor después de cambiar el archivo

## 📝 Ejemplo de archivo `.env.local` correcto

```env
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz123456
NEXTAUTH_URL=http://localhost:3000
```

**NOTA**: Reemplaza estos valores con tus credenciales reales de Google Cloud.

## 🆘 ¿Seguís teniendo problemas?

1. Verifica los logs del servidor en la terminal
2. Verifica la consola del navegador (F12)
3. Revisa que las variables de entorno estén correctamente configuradas
4. Asegúrate de haber reiniciado el servidor después de cambiar las variables

