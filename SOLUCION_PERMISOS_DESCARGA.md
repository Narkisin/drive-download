# 🔒 Solución: Problema de Permisos para Descargar Archivos

## ❌ Error: "El propietario no te ha dado permiso para descargar este archivo"

Este error ocurre cuando los archivos en Google Drive están compartidos con permisos limitados que no permiten la descarga.

## ✅ Soluciones

### Opción 1: Pedir Permisos de Descarga al Propietario (Recomendado)

**Para el propietario del archivo/carpeta:**

1. Abre Google Drive
2. Haz clic derecho en la carpeta/archivo > **Compartir**
3. En la configuración de compartir, busca a la persona o tu cuenta
4. Cambia el permiso de **"Visualizador"** a:
   - **"Editor"** (permite descargar)
   - O habilita la opción **"Los visualizadores pueden descargar"**

**Pasos detallados:**
1. Abre la carpeta en Google Drive
2. Haz clic en el ícono de **"Compartir"** (arriba a la derecha)
3. Verás una lista de personas con acceso
4. Al lado de cada persona, verás el nivel de permiso:
   - **Visualizador** ❌ (no puede descargar)
   - **Editor** ✅ (puede descargar)
5. Haz clic en el nivel de permiso y cámbialo a **"Editor"**
6. **Alternativamente**, en la configuración avanzada, marca:
   - ☑️ "Los visualizadores pueden descargar, imprimir y copiar"

### Opción 2: Usar la Aplicación con tu Propia Cuenta

Si los archivos son tuyos o tienes acceso como editor:

1. **Asegúrate de autenticarte con la cuenta correcta**:
   - La cuenta que usas para autenticarte debe tener permisos de editor
   - Si tienes múltiples cuentas, asegúrate de usar la correcta

2. **Vuelve a autenticarte**:
   - Haz clic en "Autenticar con Google" nuevamente
   - Selecciona la cuenta que tiene permisos de editor

### Opción 3: Copiar los Archivos a tu Drive

Si no puedes obtener permisos:

1. Abre Google Drive en tu navegador
2. Selecciona los archivos que quieres descargar
3. Haz clic derecho > **"Crear una copia"**
4. Los archivos copiados serán tuyos y podrás descargarlos
5. Luego usa la aplicación con esos archivos copiados

### Opción 4: Configurar Permisos Masivos (Para Propietarios)

Si eres el propietario y quieres dar permisos de descarga a múltiples personas:

1. Abre Google Drive
2. Selecciona la carpeta
3. Haz clic en **Compartir**
4. En **"Obtener enlace"**, configura:
   - Nivel de acceso: **"Editor"**
   - O si usas "Cualquier persona con el enlace":
     - Marca: ☑️ "Los visualizadores pueden descargar"

## 🔧 ¿Cómo Funciona la Aplicación?

La aplicación usa la **API de Google Drive** que permite descargar archivos si:
- ✅ Tienes acceso de **lectura** Y
- ✅ El archivo tiene permisos habilitados para descargar

**Nota importante:**
- El scope `drive.readonly` permite **leer** archivos
- Pero Google Drive puede bloquear la descarga si:
  - El archivo está marcado como "no descargable" por el propietario
  - Solo tienes permisos de "Visualizador" sin descarga habilitada

## 📋 Verificar Tus Permisos

1. **En Google Drive web:**
   - Abre el archivo/carpeta
   - Mira el ícono de compartir
   - Verás tu nivel de acceso:
     - 🔵 **Propietario** - Puede hacer todo
     - 🟢 **Editor** - Puede descargar
     - 🟡 **Visualizador** - Solo puede ver (puede o no descargar según configuración)

2. **En la aplicación:**
   - Si ves el error de permisos, significa que necesitas permisos adicionales
   - Vuelve a autenticarte si acabas de recibir nuevos permisos

## ⚙️ Configuración Avanzada para Propietarios

Para configurar una carpeta para que todos puedan descargar:

1. Abre la carpeta en Google Drive
2. Haz clic en **Compartir** > **Cambiar a "Cualquier persona con el enlace"**
3. En **"Obtener enlace"**:
   - Configura como **"Editor"** o
   - Marca ☑️ **"Los visualizadores pueden descargar"**
4. Copia el enlace y compártelo
5. Ahora cualquiera con el enlace podrá descargar los videos

## 🆘 Si Nada Funciona

1. **Verifica que estés autenticado con la cuenta correcta**
2. **Pide al propietario que:**
   - Te dé permisos de "Editor" específicamente
   - O habilite "Los visualizadores pueden descargar"
3. **Intenta copiar los archivos a tu propio Drive** (Opción 3)

## 💡 Tip

La forma más fácil es que el **propietario de la carpeta** la configure como:
- **"Cualquier persona con el enlace"** = **"Editor"**

De esta manera, cualquiera con el enlace podrá descargar sin problemas.

