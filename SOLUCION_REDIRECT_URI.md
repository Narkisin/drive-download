# 🔧 Solución: Error "redirect_uri_mismatch"

Este error ocurre cuando la URI de redirección no coincide **exactamente** entre tu aplicación y Google Cloud Console.

## 🔍 Paso 1: Obtener tu URL exacta de Vercel

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Abre tu proyecto
3. Ve a la pestaña **Settings** > **Domains**
4. Copia la URL de producción (será algo como):
   ```
   https://drive-download-abc123.vercel.app
   ```
   O si tienes un dominio personalizado:
   ```
   https://tu-dominio.com
   ```

## ✅ Paso 2: Configurar en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto
3. Ve a **APIs y servicios** > **Credenciales**
4. Haz clic en tu **ID de cliente OAuth 2.0**
5. En la sección **"URIs de redirección autorizados"**, asegúrate de tener:

   **Para Producción (Vercel):**
   ```
   https://TU-URL-VERCEL.vercel.app/auth/callback
   ```
   
   **Para Desarrollo (opcional):**
   ```
   http://localhost:3000/auth/callback
   ```

   **⚠️ IMPORTANTE:**
   - Usa `https://` (no `http://`) para producción
   - NO pongas barra `/` al final
   - NO pongas espacios
   - Debe ser EXACTAMENTE igual (mayúsculas/minúsculas importan)
   - Reemplaza `TU-URL-VERCEL` con tu URL real de Vercel

6. Haz clic en **GUARDAR** (abajo de la página)

## ⚙️ Paso 3: Verificar NEXTAUTH_URL en Vercel

1. En Vercel Dashboard, ve a **Settings** > **Environment Variables**
2. Busca la variable `NEXTAUTH_URL`
3. Verifica que el valor sea:
   ```
   https://TU-URL-VERCEL.vercel.app
   ```
   - Sin barra `/` al final
   - Con `https://`
   - Sin espacios
4. Si no existe o está mal, créala/edítala:
   - **Key**: `NEXTAUTH_URL`
   - **Value**: `https://tu-url-vercel.vercel.app` (tu URL real)
   - **Environments**: Selecciona Production, Preview, Development
   - Haz clic en **Save**

## 🔄 Paso 4: Redesplegar

1. En Vercel, ve a **Deployments**
2. Haz clic en los **tres puntos (⋯)** del último deployment
3. Selecciona **Redeploy**
4. Espera a que termine (2-3 minutos)

## 🧪 Paso 5: Probar

1. Abre tu aplicación en Vercel
2. Haz clic en "Autenticar con Google"
3. Deberías poder autenticarte sin el error

## 🔍 Verificar que todo está correcto

Ejemplo de configuración correcta:

**En Google Cloud Console:**
```
URIs de redirección autorizados:
https://drive-download-abc123.vercel.app/auth/callback
http://localhost:3000/auth/callback
```

**En Vercel Environment Variables:**
```
NEXTAUTH_URL = https://drive-download-abc123.vercel.app
```

**En tu código (automático):**
El código construye la URI como:
```
${NEXTAUTH_URL}/auth/callback
```
Que resulta en:
```
https://drive-download-abc123.vercel.app/auth/callback
```

## ❗ Errores Comunes

### ❌ Error: URL con barra final
```
https://tu-url.vercel.app/auth/callback/  ← MAL (barra al final)
https://tu-url.vercel.app/auth/callback   ← BIEN
```

### ❌ Error: URL con http en producción
```
http://tu-url.vercel.app/auth/callback    ← MAL (debe ser https)
https://tu-url.vercel.app/auth/callback   ← BIEN
```

### ❌ Error: URL diferente en NEXTAUTH_URL
Si `NEXTAUTH_URL` en Vercel es diferente a la URL real, no funcionará.

### ❌ Error: Espacios o caracteres extra
```
https://tu-url.vercel.app /auth/callback  ← MAL (espacio)
https://tu-url.vercel.app/auth/callback   ← BIEN
```

## 🆘 Si aún no funciona

1. **Espera unos minutos**: Los cambios en Google Cloud pueden tardar unos minutos en aplicarse

2. **Verifica los logs de Vercel**:
   - Ve a **Deployments** > Selecciona el deployment
   - Haz clic en **Logs** para ver errores

3. **Verifica en la consola del navegador**:
   - Presiona F12
   - Ve a la pestaña **Console**
   - Busca errores relacionados con OAuth

4. **Verifica que las credenciales sean correctas**:
   - El `GOOGLE_CLIENT_ID` en Vercel debe coincidir con el de Google Cloud
   - El `GOOGLE_CLIENT_SECRET` debe ser el correcto

## 📝 Notas Importantes

- Google es **muy estricto** con las URIs de redirección
- Deben coincidir **exactamente**, carácter por carácter
- Los cambios en Google Cloud pueden tardar 1-5 minutos en aplicarse
- Puedes tener múltiples URIs autorizadas (producción y desarrollo)

¡Con estos pasos deberías resolver el error! 🎉

