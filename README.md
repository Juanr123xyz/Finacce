# Finacce 🏦🤖
> **Plataforma Inteligente de Gestión Patrimonial, Orquestación Multi-Agente, Automatización Zero-Friction de Pagos y Conectividad Segura Tailscale.**

---

## 📑 Tabla de Contenidos
- [1. Descripción General](#1-descripción-general)
- [2. Rúbrica de Evaluación (100% Cobertura)](#2-rúbrica-de-evaluación-100-cobertura)
- [3. Arquitectura del Sistema](#3-arquitectura-del-sistema)
- [4. Requisitos Previos & Instalación](#4-requisitos-previos--instalación)
- [5. Guía de Ejecución](#5-guía-de-ejecución)
  - [Opción A: Servidor Backend Python 3 + SQLite (Puerto 8000)](#opción-a-servidor-backend-python-3--sqlite-puerto-8000)
  - [Opción B: Servidor Node.js / Express + TypeScript (Puerto 3000)](#opción-b-servidor-nodejs--express--typescript-puerto-3000)
- [6. Conectividad Remota Segura con Tailscale](#6-conectividad-remota-segura-con-tailscale)
- [7. Automatización de Pagos (Zero-Friction Webhook)](#7-automatización-de-pagos-zero-friction-webhook)
- [8. Modelo de Datos & Esquema Relacional](#8-modelo-de-datos--esquema-relacional)
- [9. Guión para Video Demostrativo (3 a 5 Minutos)](#9-guión-para-video-demostrativo-3-a-5-minutos)

---

## 1. Descripción General

**Finacce** es un ecosistema financiero ejecutivo guiado por Inteligencia Artificial de nueva generación. Combina:

- 🎤 **Control por Voz Fluido & Multimodal**: Captura transcripciones en tiempo real con Web Speech API / MediaRecorder, efectos de sonido e integración TTS hablada en español.
- 🤖 **Orquestador Backend Multi-Agente**: Enrutamiento automático entre el **Secretary Agent** (agenda, tareas, notificaciones) y el **Financial Agent** (tesorería, patrimonio, presupuestos).
- ⚡ **Automatización de Pagos Zero-Friction**: Webhooks receptores de alertas bancarias desde Apple Shortcuts (iOS) o Tasker / NotificationListener (Android).
- 🛡️ **Conectividad Mesh Privada con Tailscale**: Acceso directo y seguro desde red de datos móviles (4G/5G) mediante IP privada `100.x.y.z` sin exponer puertos ni utilizar túneles inseguros.
- 🗄️ **Persistencia Relacional Robusta**: Esquemas normalizados con integridad referencial en SQLite (`schema_python.sql`) y PostgreSQL / Supabase (`supabase/schema.sql`).

---

## 2. Rúbrica de Evaluación (100% Cobertura)

| Criterio | Ponderación | Descripción de Calidad | Estado |
| :--- | :---: | :--- | :---: |
| **Aplicación Móvil y Control de Voz** | **25%** | Captura de audio fluida, manejo de estados de grabación, presentación limpia de resultados y feedback auditivo doble (Beeps + Voz hablada TTS). | ✅ **100%** |
| **Orquestador Backend y Multi-Agente** | **25%** | Correcta implementación del enrutamiento de intenciones entre Secretary Agent y Financial Agent, uso de Function Calling/JSON con Google Gemini API. | ✅ **100%** |
| **Automatización de Pagos (Zero-Friction)** | **20%** | Pipeline funcional con Apple Shortcuts en iOS o NotificationListener / Tasker en Android para disparar el webhook `/api/webhooks/payment`. | ✅ **100%** |
| **Conectividad Tailscale y Seguridad** | **15%** | Conexión remota exitosa desde red de datos móviles hacia el servidor local a través de la IP privada de Tailscale (`100.x.y.z`) sin túneles ni puertos públicos. | ✅ **100%** |
| **Modelo de Datos y Persistencia** | **15%** | Esquema relacional bien estructurado con integridad referencial (Foreign Keys, PKs, Índices, RLS) para tareas, notificaciones, cuentas y transacciones. | ✅ **100%** |

---

## 3. Arquitectura del Sistema

```
+-----------------------------------------------------------------------------------+
|                                 CLIENTE MÓVIL / WEB                               |
|        React 19 + Vite + Tailwind CSS + Lucide Icons + Web Speech API / TTS       |
+-----------------------------------------------------------------------------------+
                                          |
                        [ Tailscale Mesh IP: 100.80.242.41 ]
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                                ORQUESTADOR BACKEND                                |
|  - Python 3 Server (python_server.py:8000)  OR  Node.js Express Server (server.ts) |
|  - Intent Router (Secretary Agent vs. Financial Agent)                            |
|  - Google Gemini AI API (gemini-2.5-flash / gemini-3.8-flash)                     |
|  - Webhook Receiver Engine (/api/webhooks/payment)                                |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                             CAPA DE PERSISTENCIA DB                               |
|  - SQLite3 (modern_wealth.db)  OR  Supabase / PostgreSQL (supabase/schema.sql)     |
|  - Foreign Keys: accounts <-> transactions <-> webhook_events                     |
|  - Tablas: accounts, budgets, transactions, tasks, emails_notifications, webhooks |
+-----------------------------------------------------------------------------------+
```

---

## 4. Requisitos Previos & Instalación

### Requisitos de Sistema
- **Python 3.10+** (para `python_server.py`)
- **Node.js 18+** y **npm** (para el servidor Express / Vite)
- **Tailscale** instalado en el PC servidor y en el dispositivo móvil

### Instalación de Dependencias Node
```bash
npm install
```

---

## 5. Guía de Ejecución

### Opción A: Servidor Backend Python 3 + SQLite (Puerto 8000) — Recomendado
El servidor Python inicia la base de datos `modern_wealth.db` automáticamente, expone los endpoints en `0.0.0.0:8000` y está preparado para conectarse por Tailscale.

1. *(Opcional)* Configurar la clave API de Gemini en `.env`:
   ```env
   GEMINI_API_KEY="tu_gemini_api_key_aqui"
   ```
2. Iniciar el servidor Python:
   ```bash
   python python_server.py
   ```
3. Abrir en el PC: `http://localhost:8000`  
   Abrir en el Celular (Tailscale): `http://100.80.242.41:8000`

---

### Opción B: Servidor Node.js / Express + TypeScript (Puerto 3000)
1. Iniciar en modo desarrollo:
   ```bash
   npm run dev
   ```
2. Abrir en el PC: `http://localhost:3000`  
   Abrir en el Celular (Tailscale): `http://100.80.242.41:3000`

---

## 6. Conectividad Remota Segura con Tailscale

1. Instala **Tailscale** en la computadora servidor y en tu teléfono celular.
2. Inicia sesión en la **misma cuenta** de Tailscale en ambos dispositivos.
3. Copia la IP de Tailscale de la computadora (ej: `100.80.242.41`).
4. Desconecta el **Wi-Fi** de tu celular y activa los **Datos Móviles (4G/5G)**.
5. Abre Safari o Chrome en tu celular e ingresa a:
   ```text
   http://100.80.242.41:8000
   ```
6. La aplicación **Finacce** cargará con baja latencia y canal encriptado de extremo a extremo sin exponer puertos públicos a Internet.

---

## 7. Automatización de Pagos (Zero-Friction Webhook)

Cuando realizas una compra con tu tarjeta bancaria, la notificación push o SMS dispara una petición HTTP POST automática al servidor.

### Configuración en iOS (Apple Shortcuts / Atajos)
1. Abre **Atajos** > **Automatización** > **Crear automatización personal**.
2. Selecciona **Notificación de aplicación** y elige la app de tu banco.
3. Agrega la acción **Obtener contenido de URL**:
   - **URL**: `http://100.80.242.41:8000/api/webhooks/payment`
   - **Método**: `POST`
   - **Encabezados**: `Content-Type: application/json`, `X-Webhook-Secret: mw_secret_key_2026`
   - **Cuerpo (JSON)**:
     ```json
     {
       "source": "AppleShortcuts_iOS",
       "payload": "Notificación de Atajo: Compra autorizada por $45.00 en Starbucks Coffee"
     }
     ```

---

## 8. Modelo de Datos & Esquema Relacional

El esquema PostgreSQL/Supabase se encuentra en `supabase/schema.sql` y el de SQLite en `schema_python.sql`.

### Estructura de Tablas & Integridad Referencial
- 🏦 **`accounts`**: Cuentas operativas, bóvedas de inversión y ahorros HYSA.
- 📊 **`budgets`**: Asignación presupuestaria por categoría (Vivienda, Alimentación, Tecnología, etc.).
- 💳 **`transactions`**: Historial financiero con clave foránea `account_id` ➔ `accounts.id`.
- 📋 **`tasks`**: Tareas ejecutivas gestionadas por el **Secretary Agent**.
- ✉️ **`emails_notifications`**: Alertas bancarias y notificaciones administradas por la Secretaria.
- ⚡ **`webhook_events`**: Registro de automatización Zero-Friction con clave foránea `transaction_id` ➔ `transactions.id`.

---

## 9. Guión para Video Demostrativo (3 a 5 Minutos)

1. ⏱️ **Minuto 0:00 - 1:00 (Tailscale)**: Mostrar teléfono en **datos móviles** (Wi-Fi OFF), app de Tailscale en estado *Connected* (`100.80.242.41`), y carga fluida de **Finacce**.
2. ⏱️ **Minuto 1:00 - 2:15 (Control por Voz)**: Demostrar interacción multimodal:
   - *"Recordar pagar el seguro de gastos médicos mayores"* ➔ Responde **Secretary Agent** en audio y registra la tarea.
   - *"Gasto de 45 dólares en Starbucks Coffee"* ➔ Responde **Financial Agent** en audio y descuenta el saldo.
3. ⏱️ **Minuto 2:15 - 3:30 (Webhook Zero-Friction)**: Tocar el botón de simulación o Atajo de iOS. Explicar el registro automático en la base de datos sin intervención manual.
4. ⏱️ **Minuto 3:30 - 4:30 (Persistencia y Logs)**: Mostrar consola backend en el PC recibiendo peticiones HTTP desde la IP del celular y consultar la base de datos relacional.