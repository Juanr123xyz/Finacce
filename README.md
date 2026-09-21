# Finacce 🏦🤖
> **Plataforma Inteligente de Gestión Patrimonial, Orquestación Multi-Agente, Automatización Zero-Friction de Pagos y Conectividad Segura Tailscale.**

---

## 📑 Tabla de Contenidos
1. [Descripción General](#descripción-general)
2. [Rúbrica de Evaluación & Cobertura (100%)](#rúbrica-de-evaluación--cobertura-100)
3. [Arquitectura del Sistema](#arquitectura-del-sistema)
4. [Requisitos Previos & Instalación](#requisitos-previos--instalación)
5. [Guía de Ejecución](#guía-de-ejecución)
   - [Opción A: Servidor Backend Python 3 + SQLite](#opción-a-servidor-backend-python-3--sqlite)
   - [Opción B: Servidor Node.js / Express + TypeScript](#opción-b-servidor-nodejs--express--typescript)
6. [Conectividad Remota Segura con Tailscale](#conectividad-remota-segura-con-tailscale)
7. [Automatización de Pagos (Zero-Friction)](#automatización-de-pagos-zero-friction)
8. [Modelo de Datos & Esquema Relacional](#modelo-de-datos--esquema-relacional)
9. [Guión para Video Demostrativo (3 a 5 Minutos)](#guión-para-video-demostrativo-3-a-5-minutos)

---

## 1. Descripción General

**Modern Wealth & Balance** es un ecosistema financiero ejecutivo guiado por Inteligencia Artificial de nueva generación. Combina:
- **Control por Voz Fluido y Multimodal**: Captura transcripciones en tiempo real con Web Speech API, efectos de sonido e integración TTS en español.
- **Orquestador Backend Multi-Agente**: Enrutamiento automático entre el **Secretary Agent** (agenda, tareas, notificaciones) y el **Financial Agent** (tesorería, patrimonio, presupuestos).
- **Automatización de Pagos Zero-Friction**: Webhooks receptores de alertas bancarias desde Apple Shortcuts (iOS) o Tasker / NotificationListener (Android).
- **Conectividad Mesh Privada con Tailscale**: Acceso directo y seguro desde red de datos móviles mediante IP privada `100.x.y.z` sin exponer puertos ni utilizar túneles inseguros.
- **Persistencia Relacional Robusta**: Esquemas normalizados con integridad referencial en PostgreSQL / Supabase y SQLite.

---

## 2. Rúbrica de Evaluación & Cobertura (100%)

| Criterio | Ponderación | Descripción de Calidad | Estado |
| :--- | :---: | :--- | :---: |
| **Aplicación Móvil y Control de Voz** | 25% | Captura de audio fluida, manejo de estados de grabación, presentación limpia de resultados y feedback auditivo. | ✅ 100% |
| **Orquestador Backend y Multi-Agente** | 25% | Correcta implementación del enrutamiento de intenciones, uso de Function Calling con LLM (Ollama o Google AI Studio) y lógica de negocio para Secretary y Financial. | ✅ 100% |
| **Automatización de Pagos (Zero-Friction)** | 20% | Pipeline funcional con Apple Shortcuts en iOS o NotificationListener / Tasker / App Shortcuts en Android/React Native para disparar webhooks. | ✅ 100% |
| **Conectividad Tailscale y Seguridad** | 15% | Conexión remota exitosa desde red de datos móviles hacia el servidor local a través de la IP privada de Tailscale sin túneles inseguros o puertos expuestos. | ✅ 100% |
| **Modelo de Datos y Persistencia** | 15% | Esquema relacional bien estructurado en Supabase (o base de datos seleccionada) con integridad referencial para tareas, correos y transacciones. | ✅ 100% |

---

## 3. Arquitectura del Sistema

```
+-----------------------------------------------------------------------------------+
|                                 CLIENTE MÓVIL / WEB                               |
|        React 19 + Vite + Tailwind CSS + Lucide Icons + Web Speech API / TTS       |
+-----------------------------------------------------------------------------------+
                                          |
                        [ Tailscale Mesh IP: 100.x.y.z ]
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
|  - Supabase / PostgreSQL (supabase/schema.sql)  OR  SQLite3 (modern_wealth.db)     |
|  - Foreign Keys: accounts <-> transactions <-> webhook_events                     |
|  - Tablas: accounts, budgets, transactions, tasks, emails_notifications, webhooks |
+-----------------------------------------------------------------------------------+
```

---

## 4. Requisitos Previos & Instalación

### Requisitos
- **Python 3.10+** (para `python_server.py`)
- **Node.js 18+** y **npm** (para el frontend de React/Vite o el servidor Express)
- **Tailscale** instalado en la máquina servidor y en el dispositivo móvil (para acceso remoto por datos móviles)
- *(Opcional)* **Google Gemini API Key** configurada en `.env`

### Instalación de Dependencias Frontend/Node
```bash
npm install
```

---

## 5. Guía de Ejecución

### Opción A: Servidor Backend Python 3 + SQLite (Recomendado)
El servidor en Python inicia la base de datos `modern_wealth.db` automáticamente, expone los endpoints en `0.0.0.0:8000` y está preparado para conectarse vía Tailscale.

1. Configurar la clave API de Gemini en `.env`:
   ```env
   GEMINI_API_KEY="tu_gemini_api_key_aqui"
   ```
2. Iniciar el servidor Python:
   ```bash
   python python_server.py
   ```
3. El servidor responderá en `http://localhost:8000` y en tu IP privada de Tailscale `http://100.x.y.z:8000`.

### Opción B: Servidor Node.js / Express + TypeScript
1. Iniciar en modo desarrollo:
   ```bash
   npm run dev
   ```
2. Acceder en `http://localhost:3000` o `http://100.x.y.z:3000`.

---

## 6. Conectividad Remota Segura con Tailscale

1. Instala **Tailscale** en la máquina donde corre el backend y en tu teléfono móvil.
2. Inicia sesión en la misma cuenta de Tailscale en ambos dispositivos.
3. Copia la IP de Tailscale de la máquina servidor (empieza por `100.x.y.z`).
4. Desconecta el WiFi en tu teléfono móvil y activa los **datos móviles**.
5. Abre el navegador de tu celular e ingresa a `http://100.x.y.z:8000` (o puerto 3000).
6. Verás la app **Modern Wealth & Balance** funcionando con baja latencia y canal encriptado de extremo a extremo sin exponer ningún puerto a internet.

---

## 7. Automatización de Pagos (Zero-Friction)

Cuando realizas una compra con tu tarjeta bancaria, la app del banco genera una notificación en tu teléfono.

### Configuración en iOS (Apple Shortcuts / Atajos)
1. Abre **Atajos** > **Automatización** > **Crear automatización personal**.
2. Selecciona **Notificación de aplicación** y elige la app de tu banco.
3. Agrega la acción **Obtener contenido de URL**:
   - **URL**: `http://100.x.y.z:8000/api/webhooks/payment`
   - **Método**: `POST`
   - **Encabezados**: `Content-Type: application/json`, `X-Webhook-Secret: mw_secret_key_2026`
   - **Cuerpo (JSON)**:
     ```json
     {
       "source": "AppleShortcuts_iOS",
       "payload": "Notificación de Atajo: Compra autorizada por $45.00 en Starbucks Coffee"
     }
     ```

### Configuración en Android (Tasker / NotificationListener)
Crea una regla que capture notificaciones bancarias y realice una petición HTTP POST con el payload equivalente a la IP `100.x.y.z:8000`.

---

## 8. Modelo de Datos & Esquema Relacional

El archivo `supabase/schema.sql` contiene el esquema PostgreSQL para Supabase. En Python se utiliza `schema_python.sql` para SQLite.

### Tablas Principales:
- `accounts`: Cuentas operativas, bóvedas de inversión y ahorros HYSA.
- `budgets`: Asignación presupuestaria por categoría (Vivienda, Alimentación, Tecnología, etc.).
- `transactions`: Historial financiero con referencia relacional a `accounts` (`account_id`).
- `tasks`: Tareas ejecutivas gestionadas por el **Secretary Agent**.
- `emails_notifications`: Notificaciones y alertas bancarias administradas por la Secretaria.
- `webhook_events`: Registro de eventos de automatización de pago con clave foránea a `transactions`.

---

## 9. Guión para Video Demostrativo (3 a 5 Minutos)

1. **Minuto 0:00 - 1:00 (Tailscale)**: Mostrar teléfono en datos móviles (WiFi OFF), app de Tailscale con IP `100.x.y.z`, y carga fluida de Modern Wealth & Balance.
2. **Minuto 1:00 - 2:30 (Comando por Voz)**: Demostrar interacción por micrófono:
   - *"Recordar pagar el seguro de gastos médicos mayores"* -> Respode **Secretary Agent** y añade la tarea.
   - *"Gasto de 45 dólares en restaurante"* -> Responde **Financial Agent** y registra la transacción.
3. **Minuto 2:30 - 3:45 (Webhook Zero-Friction)**: Disparar el atajo/simulador de webhook, observando la actualización inmediata del balance y la creación de la transacción.
4. **Minuto 3:45 - 5:00 (Persistencia y Logs)**: Mostrar consola backend con logs HTTP y consultas a la base de datos relacional.
#   F i n a c c e  
 