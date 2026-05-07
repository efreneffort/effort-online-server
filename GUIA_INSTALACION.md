# 🚀 EFFORT ONLINE - GUÍA DE INSTALACIÓN

## 📋 REQUISITOS

✅ Node.js v25.5.0 (ya instalado)
✅ NPM 11.8.0 (ya instalado)
✅ MongoDB Atlas cluster creado
✅ Connection String de MongoDB guardada

---

## 📁 ESTRUCTURA DE CARPETAS

```
Documentos/
  effort-online/
    ├── server/                    ← Archivos backend
    │   ├── server.js
    │   ├── package.json
    │   └── .env
    │
    └── public/                    ← Archivos frontend (HTML)
        ├── index.html
        ├── login.html
        ├── dashboard.html
        └── admin.html
```

---

## 🔧 PASOS DE INSTALACIÓN

### **PASO 1: Descargar archivos**

Descarga estos archivos desde Claude:
- `server.js` → Mételo en `server/`
- `package.json` → Mételo en `server/`
- `.env` → Mételo en `server/`
- `index.html` → Mételo en `public/`
- `login.html` → Mételo en `public/`
- `dashboard.html` → Mételo en `public/`
- `admin.html` → Mételo en `public/`

---

### **PASO 2: Abre CMD en la carpeta server**

1. Abre **Explorador de archivos**
2. Ve a `Documentos/effort-online/server/`
3. **Shift + Click derecho** en la carpeta vacía
4. Selecciona **"Abrir PowerShell aquí"** (o CMD)

---

### **PASO 3: Instala dependencias**

En CMD, escribe:
```
npm install
```

Espera a que termine (2-3 minutos).

Deberías ver:
```
added XX packages in X.XXs
```

---

### **PASO 4: Configura el .env**

1. Abre el archivo `.env` con Bloc de Notas
2. Reemplaza la cadena de MongoDB con la que guardaste:

**BUSCA ESTA LÍNEA:**
```
MONGODB_URI=mongodb+srv://effortentrenador_db_user:Acw8EbcFUPfnulyH@effort-online.oapoo5p.mongodb.net/?appName=Effort-Online
```

Si tu cadena es diferente, reemplázala.

3. **Guarda el archivo**

---

### **PASO 5: Inicia el servidor**

En la misma CMD, escribe:
```
npm start
```

**Deberías ver:**
```
✅ Servidor escuchando en puerto 3000
✅ Conectado a MongoDB
```

---

## 🌐 ACCEDER A LA APP

Abre tu navegador (Chrome, Firefox, Edge) y ve a:

```
http://localhost:3000
```

**¡¡DEBERÍAS VER LA LANDING PAGE DE EFFORT ONLINE!!**

---

## 🧪 PRUEBA RÁPIDA

1. **Haz click en "EMPEZAR AHORA"**
2. **Selecciona un plan (Premium)**
3. **Te llevará a login**
4. **Regístrate con:**
   - Email: test@example.com
   - Contraseña: Test123456!
5. **Acepta los checkboxes legales**
6. **Click "Crear cuenta"**
7. **Deberías entrar al dashboard** ✅

---

## ⚠️ SI ALGO FALLA

### **Error: "Cannot find module"**
```
npm install
```
(Reinstala las dependencias)

### **Error: "Port 3000 already in use"**
Cambia en `.env`:
```
PORT=3001
```
(O cierra otras aplicaciones)

### **Error: "MongoDB connection failed"**
Verifica que la `MONGODB_URI` en `.env` sea correcta

---

## 📧 EMAILS

Los emails se envían automáticamente desde: `onboarding@resend.dev`

Con reply-to: `effortentrenador@gmail.com`

---

## 💳 STRIPE (TEST MODE)

Para probar pagos, usa:
```
Tarjeta: 4242 4242 4242 4242
Mes: 12
Año: 2025
CVC: 123
```

---

## 🚀 SIGUIENTE PASO

Cuando todo funcione localmente:

1. Crea cuenta en **Render.com**
2. Conecta tu GitHub
3. Deploy automático
4. ¡APP EN PRODUCCIÓN!

---

**¿PREGUNTAS?** 💪

Sigue los pasos y dime si algo no funciona.
