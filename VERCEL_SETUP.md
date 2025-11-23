# 🚀 Configuración de Variables de Entorno en Vercel

## ❌ Error: "Environment Variable references Secret which does not exist"

Este error aparece porque el archivo `vercel.json` estaba intentando usar "Secrets" que no existen.

## ✅ Solución: Configurar Variables Directamente en Vercel

No necesitas usar Secrets. Simplemente configura las variables de entorno directamente en el dashboard de Vercel.

### Paso 1: Ve a tu proyecto en Vercel

1. Abre [vercel.com/dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto: **drive-download** (o el nombre que tenga)

### Paso 2: Configura las Variables de Entorno

1. Ve a **Settings** (Configuración)
2. En el menú lateral, haz clic en **Environment Variables**
3. Agrega las siguientes variables:

#### Variable 1: GOOGLE_CLIENT_ID
- **Key (Clave)**: `GOOGLE_CLIENT_ID`
- **Value (Valor)**: Pega aquí tu Client ID de Google Cloud
  - Ejemplo: `123456789-abcdefghijk.apps.googleusercontent.com`
- **Environments (Ambientes)**: Selecciona:
  - ✅ Production
  - ✅ Preview  
  - ✅ Development

#### Variable 2: GOOGLE_CLIENT_SECRET
- **Key (Clave)**: `GOOGLE_CLIENT_SECRET`
- **Value (Valor)**: Pega aquí tu Client Secret de Google Cloud
  - Ejemplo: `GOCSPX-abcdefghijklmnopqrstuvwxyz`
- **Environments (Ambientes)**: Selecciona:
  - ✅ Production
  - ✅ Preview
  - ✅ Development

#### Variable 3: NEXTAUTH_URL
- **Key (Clave)**: `NEXTAUTH_URL`
- **Value (Valor)**: Tu URL de Vercel (obtendrás esto después del primer deploy)
  - Ejemplo: `https://drive-download.vercel.app`
  - **NOTA**: Si aún no tienes la URL, usa: `https://tu-proyecto.vercel.app`
  - Podrás actualizarla después del primer deploy
- **Environments (Ambientes)**: Selecciona:
  - ✅ Production
  - ✅ Preview
  - ✅ Development

### Paso 3: Guardar y Redesplegar

1. Haz clic en **Save** (Guardar) para cada variable
2. Una vez que todas estén guardadas, ve a la pestaña **Deployments**
3. En el último deployment, haz clic en los **tres puntos (⋯)**
4. Selecciona **Redeploy**
5. Espera a que termine el deploy

### Paso 4: Obtener tu URL de Vercel

Después del deploy exitoso:

1. Ve a **Settings** > **Domains**
2. Copia tu URL de producción (ej: `https://drive-download-xyz.vercel.app`)
3. Si necesitas actualizar `NEXTAUTH_URL`:
   - Ve a **Settings** > **Environment Variables**
   - Edita `NEXTAUTH_URL` con tu URL completa
   - Guarda y redespliega

### Paso 5: Actualizar Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Ve a **APIs y servicios** > **Credenciales**
3. Haz clic en tu **ID de cliente OAuth**
4. En **URIs de redirección autorizados**, agrega:
   ```
   https://tu-url-vercel.vercel.app/auth/callback
   ```
   Reemplaza `tu-url-vercel` con tu URL real de Vercel
5. Haz clic en **Guardar**

## 🔍 Verificar que Funciona

1. Abre tu aplicación en Vercel
2. Haz clic en "Autenticar con Google"
3. Deberías ser redirigido a la página de autenticación de Google
4. Si funciona, ¡ya está todo configurado! ✅

## ⚠️ Importante

- **NO** uses Secrets en Vercel para este proyecto
- Configura las variables **directamente** como Environment Variables
- Asegúrate de seleccionar todos los ambientes (Production, Preview, Development)
- La URL de callback debe coincidir **exactamente** en Google Cloud y Vercel

## 📸 Imagen de Referencia

En el dashboard de Vercel, deberías ver algo así:

```
Environment Variables
┌─────────────────────────────┬──────────────────────────┐
│ Key                         │ Value                    │
├─────────────────────────────┼──────────────────────────┤
│ GOOGLE_CLIENT_ID            │ [tu_client_id]           │
│ GOOGLE_CLIENT_SECRET        │ [tu_client_secret]       │
│ NEXTAUTH_URL                │ https://...vercel.app    │
└─────────────────────────────┴──────────────────────────┘
```

¡Listo! Ya deberías poder hacer deploy sin problemas. 🎉

