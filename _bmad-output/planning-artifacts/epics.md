---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
status: complete
inputDocuments:
  - prd.md
  - architecture.md
  - ux-design-specification.md
# Capacidad de Proceso Addition (2026-02-17)
capacidadProcesoStepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
capacidadProcesoStatus: complete
capacidadProcesoCompletedAt: 2026-02-20
capacidadProcesoInputDocuments:
  - prd-v2.md
  - architecture.md
---

# Setec AI Hub - LLM - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Setec AI Hub - LLM, decomposing the requirements from the PRD, UX Design, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

**Authentication (MVP):**
- FR1: Usuario puede iniciar sesión mediante Supabase Auth (email/password)
- FR2: Sistema redirige a usuarios no autenticados a la página de login
- FR3: Usuario permanece autenticado hasta cerrar sesión explícitamente (sesión gestionada por Supabase Auth)
- FR4: Usuario puede solicitar restablecimiento de contraseña desde la página de login
- FR4.1: Sistema envía correo con enlace seguro de restablecimiento via Supabase (expira en 24 horas)
- FR4.2: Usuario puede establecer nueva contraseña mediante el enlace recibido
- FR4.3: Sistema confirma el cambio exitoso y redirige al login

**Arquitectura de Agentes (MVP):**
- FR-AGT1: Sistema filtra todos los mensajes del usuario mediante el Agente 1 (Filtro) antes de procesarlos
- FR-AGT2: Agente Filtro usa structured output de OpenAI para clasificar mensajes: `{ "allowed": boolean }`
- FR-AGT3: Mensajes fuera de tema reciben respuesta contextual explicando las capacidades del sistema
- FR-AGT4: Mensajes aprobados se pasan al Agente 2 (Principal) para procesamiento
- FR-AGT5: Agente Principal puede conversar sobre estadística/MSA sin requerir archivo
- FR-AGT6: Agente Principal tiene acceso a tool de análisis para ejecutar cálculos

**Interfaz de Chat (MVP):**
- FR13: Usuario puede iniciar una nueva conversación (agente unificado, sin selección)
- FR14: Usuario puede enviar mensajes de texto al agente
- FR15: Usuario puede subir archivos Excel dentro de la conversación
- FR16: Archivos subidos se almacenan en Supabase Storage y son visibles/descargables desde el historial de conversaciones
- FR17: Usuario puede hacer preguntas de seguimiento sobre los resultados
- FR18: Usuario puede ver el historial de conversaciones en una barra lateral
- FR19: Usuario puede continuar una conversación anterior desde el historial
- FR20: Conversaciones se guardan en Supabase vinculadas al usuario autenticado

**Sección de Plantillas (MVP):**
- FR26: Usuario puede ver la plantilla MSA disponible
- FR27: Usuario puede descargar la plantilla Excel de MSA

**Tool de Análisis (MVP):**
- FR-TOOL1: Sistema invoca tool de análisis Python cuando usuario proporciona archivo y tipo de análisis
- FR-TOOL2: Si usuario sube archivo sin especificar tipo de análisis, agente pregunta qué análisis desea
- FR-TOOL3: Tool de análisis valida estructura del archivo antes de procesar (columnas correctas, tipos de datos)
- FR-TOOL4: Tool de análisis proporciona mensajes de error específicos y accionables cuando la validación falla (fila/columna/problema)
- FR-TOOL5: Usuario puede subir una plantilla corregida después de resolver errores
- FR-TOOL6: Tool de análisis retorna resultados numéricos, datos para gráficos e instrucciones de presentación en formato estructurado
- FR-TOOL7: Tool usa endpoint único `POST /api/analyze` que routea internamente según `analysis_type`

**Computación Estadística (MVP):**
- FR31: Sistema calcula métricas MSA a partir de los datos subidos mediante scripts Python con fórmulas verificadas

**Interpretación por IA (MVP):**
- FR32: Sistema proporciona interpretación generada por IA de los resultados estadísticos
- FR33: Sistema explica la metodología detrás del análisis (por qué esta prueba, qué significan los números)
- FR34: Sistema proporciona recomendaciones accionables basadas en los resultados
- FR35: Agente responde preguntas de seguimiento del usuario sobre los resultados usando contexto de la conversación (sin re-invocar tool)
- FR-INT1: Agente presenta resultados siguiendo instrucciones del output de la tool, con capacidad de adaptar al contexto
- FR-INT2: Usuario puede analizar múltiples archivos en la misma conversación
- FR-INT3: Frontend renderiza gráficos interactivos a partir de datos de la tool; usuario puede descargarlos como imagen (exportación de canvas)

**Transparencia de Privacidad (MVP):**
- FR-PRIV1: Sistema muestra tooltip informativo en la zona de carga de archivos explicando que los datos se procesan localmente
- FR-PRIV2: Sistema incluye página de Privacidad accesible desde el footer con detalles del manejo de datos

**Post-MVP (Fase 2):**
- FR5: Admin puede crear cuentas adicionales para nuevos usuarios via Admin portal
- FR6: Cada usuario tiene sus propias credenciales únicas
- FR7-FR12: Portal Admin con CRUD de usuarios
- FR24: Conversaciones se aíslan por usuario (cada usuario ve solo sus propias conversaciones)
- FR25: Tipos de análisis adicionales disponibles (Control Charts, Hypothesis Testing, etc.)
- FR36: Usuario solo puede ver sus propias conversaciones y datos subidos
- FR37: Admin puede ver lista de usuarios pero no puede acceder a datos de análisis de usuarios

### NonFunctional Requirements

**Seguridad (MVP):**
- NFR1: Todas las comunicaciones usan HTTPS (cifrado en tránsito)
- NFR2: Credenciales de usuario manejadas por Supabase Auth (hash seguro, nunca almacenadas en código)
- NFR3: Sesión de usuario gestionada por Supabase Auth, persiste hasta cierre de sesión explícito
- NFR4: Los tokens de restablecimiento de contraseña expiran después de 24 horas (gestionado por Supabase)

**Privacidad de Datos (MVP):**
- NFR-PRIV1: Los archivos Excel subidos se procesan exclusivamente server-side; el contenido crudo nunca se envía a OpenAI
- NFR-PRIV2: Solo resultados estadísticos agregados (métricas, porcentajes, clasificaciones) se incluyen en el contexto del LLM
- NFR-PRIV3: Supabase Storage cifra archivos en reposo (AES-256)
- NFR-PRIV4: La plataforma muestra información clara sobre manejo de datos en UI (tooltip en carga, página de privacidad)

**Confiabilidad (MVP):**
- NFR6: El sistema debe estar disponible durante horarios de capacitación (mejor esfuerzo para MVP)
- NFR7: Los errores del sistema muestran mensajes amigables al usuario, no stack traces
- NFR8: Las conversaciones persisten en Supabase vinculadas al usuario autenticado

**Integraciones Externas (MVP):**
- NFR10: El sistema maneja graciosamente la indisponibilidad de OpenAI API (muestra mensaje de reintento)
- NFR11: El sistema maneja graciosamente errores de la tool de análisis Python (muestra mensaje descriptivo al usuario)

**Almacenamiento de Archivos (MVP):**
- NFR12: Los archivos subidos se almacenan en Supabase Storage vinculados a la conversación
- NFR13: Los archivos son accesibles y descargables desde el historial de conversaciones

**Post-MVP:**
- NFR5: Los usuarios no pueden acceder a datos de otros usuarios a nivel de base de datos (Row Level Security)
- NFR9: Las conversaciones se aíslan por cuenta de usuario individual
- NFR14: El sistema maneja graciosamente fallos de envío de correo via Supabase

### Additional Requirements

**From Architecture - Project Setup:**
- Starter Template: Enfoque Modular con Next.js 16, shadcn/ui, Tailwind CSS 4, Supabase
- Comando de inicialización definido: `npx create-next-app@latest` + dependencias Supabase + shadcn/ui
- Python 3.11+ para funciones de análisis serverless en Vercel
- Configuración de Turbopack habilitado por default

**From Architecture - Database & Infrastructure:**
- Esquema de base de datos completo: conversations, messages, files, analysis_results, token_usage
- Políticas RLS (Row Level Security) definidas para todas las tablas
- Configuración de Supabase Storage bucket "analysis-files" con límite 10MB
- Configuración de Supabase Auth con templates de email en español
- Variables de entorno para Vercel definidas (Supabase, OpenAI, App URL)
- vercel.json con configuración de Python runtime y rewrites

**From Architecture - API & Communication:**
- SSE (Server-Sent Events) para streaming de respuestas del chat
- Estructura de API Routes definida: /api/chat, /api/conversations, /api/files, /api/auth/callback
- Python serverless function /api/analyze separada de Next.js routes
- Estructura de respuesta API estándar: `{ data, error }`

**From Architecture - Frontend:**
- TanStack Query para estado del servidor (conversaciones, mensajes)
- React Context para estado de autenticación
- Recharts para gráficos interactivos (GaugeRRChart, VariationChart)
- Query keys estructuradas para consistencia
- Patrones de nombrado: snake_case para DB, PascalCase para componentes, kebab-case para rutas API

**From Architecture - Project Structure:**
- Estructura de carpetas completa definida (~80 archivos)
- Tests co-located junto a componentes/hooks
- Barrel exports (index.ts) para cada carpeta de componentes

**From UX Design:**
- Interfaz estilo ChatGPT con sidebar de historial de conversaciones
- Desktop-first, responsive para móvil en modo visualización
- Diseño en español desde el inicio (no traducción)
- Componentes de privacidad: PrivacyTooltip, Footer con link a Privacidad, FirstUploadPrivacyNotice
- Paleta de colores Setec: Orange (#F7931E), Charcoal (#3D3D3D), White (#FFFFFF)
- Typography: sans-serif limpia, jerarquía clara
- Estados de carga con feedback visual (streaming, skeleton)
- Mensajes de error específicos y accionables en español
- Gráficos interactivos con hover, tooltips, descargables como PNG

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 1 | Login via Supabase Auth |
| FR2 | Epic 1 | Redirect unauthenticated users |
| FR3 | Epic 1 | Session persistence |
| FR4-FR4.3 | Epic 1 | Password recovery flow |
| FR13 | Epic 2 | Start new conversation |
| FR14 | Epic 2 | Send text messages |
| FR15 | Epic 3 | Upload Excel files |
| FR16 | Epic 3 | Files stored and downloadable |
| FR17 | Epic 2 | Follow-up questions |
| FR18 | Epic 2 | Conversation history sidebar |
| FR19 | Epic 2 | Continue previous conversation |
| FR20 | Epic 2 | Conversations saved to Supabase |
| FR26 | Epic 3 | View MSA template |
| FR27 | Epic 3 | Download MSA template |
| FR-AGT1 | Epic 2 | Filter agent processes messages |
| FR-AGT2 | Epic 2 | Structured output classification |
| FR-AGT3 | Epic 2 | Off-topic rejection messages |
| FR-AGT4 | Epic 2 | Pass to main agent |
| FR-AGT5 | Epic 2 | Conversational without file |
| FR-AGT6 | Epic 4 | Tool invocation |
| FR-TOOL1 | Epic 4 | Invoke tool with file + type |
| FR-TOOL2 | Epic 4 | Ask for analysis type if missing |
| FR-TOOL3 | Epic 4 | Validate file structure |
| FR-TOOL4 | Epic 4 | Specific error messages |
| FR-TOOL5 | Epic 4 | Re-upload after correction |
| FR-TOOL6 | Epic 4 | Return structured output |
| FR-TOOL7 | Epic 4 | Single endpoint routing |
| FR31 | Epic 4 | MSA computation with Python |
| FR32 | Epic 5 | AI interpretation of results |
| FR33 | Epic 5 | Methodology explanation |
| FR34 | Epic 5 | Actionable recommendations |
| FR35 | Epic 5 | Follow-up from context |
| FR-INT1 | Epic 5 | Present following instructions |
| FR-INT2 | Epic 5 | Multiple files in conversation |
| FR-INT3 | Epic 5 | Interactive charts + export |
| FR-PRIV1 | Epic 3 | Privacy tooltip on upload |
| FR-PRIV2 | Epic 6 | Privacy page |

## Epic List

### Epic 1: Project Foundation & Secure Access
Users can access Setec AI Hub securely with email/password login and recover their password if forgotten.

**FRs covered:** FR1, FR2, FR3, FR4, FR4.1, FR4.2, FR4.3

**Deliverables:**
- Next.js 16 project with shadcn/ui and Tailwind CSS 4
- Supabase project with database schema and RLS policies
- Vercel configuration with environment variables
- Login page with Supabase Auth
- Password recovery flow with Spanish email templates
- Protected routes middleware
- Basic layout structure

---

### Epic 2: Conversational Interface
Users can start new conversations, chat with the AI assistant about statistics, and access their conversation history.

**FRs covered:** FR13, FR14, FR17, FR18, FR19, FR20, FR-AGT1, FR-AGT2, FR-AGT3, FR-AGT4, FR-AGT5

**Deliverables:**
- ChatGPT-style interface with sidebar
- New conversation creation
- Message sending with streaming responses (SSE)
- Two-agent architecture (Filter + Main) with OpenAI
- Conversation persistence in Supabase
- Conversation history sidebar
- Agent conversational ability (without file/tool)

---

### Epic 3: Template Workflow & File Management
Users can download the MSA template and upload filled templates into their conversations.

**FRs covered:** FR15, FR16, FR26, FR27, FR-PRIV1

**Deliverables:**
- Templates section page with MSA template download
- File upload component in chat
- Privacy tooltip on file upload zone
- File storage in Supabase Storage
- File references visible/downloadable in conversation

---

### Epic 4: MSA Statistical Analysis Engine
Users receive accurate MSA analysis results from their uploaded data with validation feedback.

**FRs covered:** FR-TOOL1, FR-TOOL2, FR-TOOL3, FR-TOOL4, FR-TOOL5, FR-TOOL6, FR-TOOL7, FR31, FR-AGT6

**Deliverables:**
- Python serverless function for MSA calculations
- File validation with specific error messages (row/column/problem)
- MSA metrics computation (Gauge R&R, variation analysis)
- Structured output (results, chartData, instructions)
- Agent tool invocation integration
- Re-upload after error correction

---

### Epic 5: AI Interpretation & Interactive Visualization
Users receive clear, contextual interpretations of their results with interactive charts they can explore and download.

**FRs covered:** FR32, FR33, FR34, FR35, FR-INT1, FR-INT2, FR-INT3

**Deliverables:**
- AI interpretation following tool instructions
- Methodology explanations (why this test, what numbers mean)
- Actionable recommendations
- Interactive Recharts components (GaugeRRChart, VariationChart)
- Chart hover/tooltips
- Chart export as PNG
- Follow-up questions from conversation context
- Multiple file analysis in same conversation

---

### Epic 6: Privacy Transparency & Production Readiness
Users have full transparency about data handling and experience a polished, reliable platform.

**FRs covered:** FR-PRIV2

**NFRs addressed:** NFR1, NFR6, NFR7, NFR8, NFR10, NFR11, NFR-PRIV1-4

**Deliverables:**
- Privacy page with data handling details
- Footer with Privacy link
- Graceful error handling for OpenAI/Python failures
- User-friendly error messages in Spanish
- Production deployment configuration
- Final polish and testing

---

## Epic 1: Project Foundation & Secure Access

Users can access Setec AI Hub securely with email/password login and recover their password if forgotten.

### Story 1.1: Project Initialization & Infrastructure Setup

As a **development team**,
I want **the project infrastructure fully configured**,
So that **all subsequent development can proceed on a solid foundation**.

**Acceptance Criteria:**

**Given** a new development environment
**When** the setup scripts are executed
**Then** a Next.js 16 project is created with TypeScript, Tailwind CSS 4, ESLint, and Turbopack enabled
**And** shadcn/ui is initialized with required components (button, input, card, avatar, dropdown-menu, toast, scroll-area, separator, badge, skeleton, dialog, tooltip)
**And** Supabase dependencies (@supabase/supabase-js, @supabase/ssr) are installed
**And** TanStack Query and Recharts dependencies are installed

**Given** a Supabase project needs to be configured
**When** the database setup SQL is executed
**Then** all tables are created (conversations, messages, files, analysis_results, token_usage)
**And** all indexes are created for performance
**And** RLS policies are applied to all tables
**And** the update_updated_at trigger function is created
**And** the Storage bucket "analysis-files" is created with 10MB limit and Excel MIME types only

**Given** Supabase Auth needs configuration
**When** Auth settings are applied
**Then** email provider is enabled with Spanish email templates (password recovery, confirmation)
**And** redirect URLs are configured for localhost and production
**And** a single MVP user account is created manually with documented credentials

**Given** Vercel deployment needs configuration
**When** vercel.json is created
**Then** Python 3.11 runtime is configured for /api/*.py functions
**And** rewrites are set up for /api/analyze
**And** region is set to iad1

**Given** environment configuration is needed
**When** .env.example and .env.local are created
**Then** all required variables are documented (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY, NEXT_PUBLIC_APP_URL)

**Given** the project structure needs to be established
**When** the folder structure is created
**Then** it follows the Architecture document exactly (app/, components/, lib/, hooks/, types/, constants/, api/)
**And** Supabase client files are created (lib/supabase/client.ts, server.ts, middleware.ts)
**And** the Providers component is created with QueryClientProvider

---

### Story 1.2: User Login with Email/Password

As a **user**,
I want **to log in with my email and password**,
So that **I can access my conversations and analysis tools securely**.

**FRs covered:** FR1, FR3

**Acceptance Criteria:**

**Given** an unauthenticated user visits the login page
**When** they view the page
**Then** they see a login form with email and password fields in Spanish
**And** they see a "Iniciar sesión" button
**And** they see a "¿Olvidaste tu contraseña?" link
**And** the page uses Setec brand colors (orange accent, charcoal text)

**Given** a user enters valid credentials
**When** they submit the login form
**Then** they are authenticated via Supabase Auth
**And** they are redirected to the dashboard (main chat page)
**And** their session is persisted (survives page refresh)

**Given** a user enters invalid credentials
**When** they submit the login form
**Then** they see an error message in Spanish: "Credenciales incorrectas. Verifica tu email y contraseña."
**And** the form remains on screen for retry
**And** the password field is cleared

**Given** a user is already authenticated
**When** they visit the login page
**Then** they are automatically redirected to the dashboard

---

### Story 1.3: Password Recovery Flow

As a **user**,
I want **to recover my password via email**,
So that **I can regain access to my account if I forget my password**.

**FRs covered:** FR4, FR4.1, FR4.2, FR4.3

**Acceptance Criteria:**

**Given** a user clicks "¿Olvidaste tu contraseña?" on the login page
**When** the password recovery page loads
**Then** they see a form requesting their email address
**And** the page is titled "Recuperar contraseña"
**And** they see a "Enviar enlace" button

**Given** a user enters a valid registered email
**When** they submit the recovery form
**Then** Supabase sends a password reset email using the Spanish template
**And** the user sees a confirmation message: "Te enviamos un enlace para restablecer tu contraseña. Revisa tu correo."
**And** the email contains a secure reset link that expires in 24 hours

**Given** a user enters an unregistered email
**When** they submit the recovery form
**Then** they see the same confirmation message (to prevent email enumeration)
**And** no email is sent

**Given** a user clicks the reset link in their email
**When** the reset page loads
**Then** they see a form to enter a new password
**And** they see password confirmation field
**And** they see a "Guardar nueva contraseña" button

**Given** a user enters a valid new password
**When** they submit the new password form
**Then** their password is updated in Supabase Auth
**And** they see a success message: "Tu contraseña ha sido actualizada."
**And** they are redirected to the login page

**Given** a user clicks an expired or invalid reset link
**When** the page attempts to load
**Then** they see an error message: "Este enlace ha expirado o no es válido. Solicita uno nuevo."
**And** they see a link to request a new reset email

---

### Story 1.4: Protected Routes & Session Management

As a **user**,
I want **unauthorized access to be blocked and my session managed properly**,
So that **my data is secure and I stay logged in until I choose to log out**.

**FRs covered:** FR2, FR3

**Acceptance Criteria:**

**Given** an unauthenticated user tries to access any dashboard route
**When** the middleware processes the request
**Then** they are redirected to the login page
**And** the originally requested URL is preserved for post-login redirect

**Given** an authenticated user is browsing the dashboard
**When** they navigate between pages
**Then** their session remains valid
**And** no re-authentication is required

**Given** an authenticated user closes their browser and reopens it
**When** they return to the site
**Then** they are still authenticated (session persisted via Supabase Auth)
**And** they can continue using the dashboard without logging in again

**Given** an authenticated user clicks "Cerrar sesión"
**When** the logout action completes
**Then** their session is invalidated
**And** they are redirected to the login page
**And** they cannot access dashboard routes until logging in again

**Given** the dashboard layout needs to be established
**When** an authenticated user accesses the dashboard
**Then** they see a header with the Setec logo and user menu (with logout option)
**And** they see a sidebar area (content to be added in Epic 2)
**And** they see a main content area
**And** the layout is responsive (desktop-first, functional on mobile)

---

## Epic 2: Conversational Interface

Users can start new conversations, chat with the AI assistant about statistics, and access their conversation history.

### Story 2.1: Conversation List Sidebar

As a **user**,
I want **to see my conversation history in a sidebar**,
So that **I can easily navigate between past conversations and continue previous work**.

**FRs covered:** FR18, FR19, FR20

**Acceptance Criteria:**

**Given** an authenticated user accesses the dashboard
**When** the page loads
**Then** they see a sidebar on the left side with a list of their conversations
**And** each conversation shows a title (or preview of first message) and relative timestamp
**And** conversations are sorted by most recently updated first
**And** the sidebar is scrollable if there are many conversations

**Given** a user has no conversations yet
**When** they view the sidebar
**Then** they see an empty state message: "No tienes conversaciones aún"
**And** they see a prominent "Nueva conversación" button

**Given** a user clicks on a conversation in the sidebar
**When** the conversation loads
**Then** they are navigated to that conversation's view
**And** the selected conversation is visually highlighted in the sidebar
**And** all messages from that conversation are displayed in the main area

**Given** a user wants to delete a conversation
**When** they click the delete option (via context menu or icon)
**Then** they see a confirmation dialog: "¿Eliminar esta conversación?"
**And** upon confirmation, the conversation and all its messages are permanently deleted
**And** the sidebar updates to reflect the deletion

**Given** the sidebar needs to be responsive
**When** viewed on mobile
**Then** the sidebar is collapsed by default
**And** a hamburger menu icon allows toggling the sidebar visibility

---

### Story 2.2: Create New Conversation

As a **user**,
I want **to start a new conversation with one click**,
So that **I can begin a fresh analysis session quickly**.

**FRs covered:** FR13

**Acceptance Criteria:**

**Given** a user is on the dashboard
**When** they click the "Nueva conversación" button
**Then** a new conversation is created in Supabase
**And** they are navigated to the new conversation view
**And** the chat area is empty and ready for input
**And** the new conversation appears at the top of the sidebar

**Given** a user creates a new conversation
**When** the conversation is created
**Then** it has a default title based on timestamp or "Nueva conversación"
**And** the conversation is associated with the authenticated user's ID

**Given** a user is already in a conversation
**When** they click "Nueva conversación"
**Then** a new conversation is created
**And** they are navigated away from the current conversation to the new one
**And** the previous conversation remains accessible in the sidebar

---

### Story 2.3: Chat Interface & Message Display

As a **user**,
I want **to view and send messages in a ChatGPT-style interface**,
So that **I can have natural conversations with the AI assistant**.

**FRs covered:** FR14, FR17

**Acceptance Criteria:**

**Given** a user is viewing a conversation
**When** the chat interface loads
**Then** they see a message list area showing the conversation history
**And** they see a text input area at the bottom
**And** they see a send button (and can also press Enter to send)
**And** user messages are displayed on the right, assistant messages on the left
**And** each message shows a timestamp on hover

**Given** a user types a message and sends it
**When** the message is submitted
**Then** the user's message immediately appears in the chat (optimistic update)
**And** the message is saved to the messages table in Supabase
**And** a loading indicator shows that the assistant is responding
**And** the input is cleared and ready for the next message

**Given** the assistant responds to a message
**When** the response is received
**Then** the assistant's message appears in the chat
**And** the message is saved to Supabase with role='assistant'
**And** the loading indicator disappears

**Given** a user views a conversation with existing messages
**When** the messages load
**Then** all messages are fetched from Supabase
**And** messages are displayed in chronological order
**And** the view auto-scrolls to the most recent message

**Given** an error occurs while sending a message
**When** the error is detected
**Then** the user sees an error toast: "No se pudo enviar el mensaje. Intenta de nuevo."
**And** the failed message can be retried

---

### Story 2.4: Filter Agent Integration

As a **system**,
I want **all user messages to pass through a filter agent**,
So that **off-topic queries are rejected with helpful guidance**.

**FRs covered:** FR-AGT1, FR-AGT2, FR-AGT3

**Acceptance Criteria:**

**Given** a user sends a message
**When** the /api/chat endpoint receives the message
**Then** the message is first sent to the Filter Agent (gpt-4o-mini)
**And** the Filter Agent uses structured output to return `{ "allowed": boolean }`

**Given** the Filter Agent determines the message is on-topic
**When** `allowed: true` is returned
**Then** the message proceeds to the Main Agent for processing
**And** no rejection message is shown to the user

**Given** the Filter Agent determines the message is off-topic
**When** `allowed: false` is returned
**Then** the user receives a contextual rejection message in Spanish
**And** the rejection explains the system's capabilities: "Soy un asistente especializado en análisis estadístico para Lean Six Sigma. Puedo ayudarte con MSA, gráficos de control, pruebas de hipótesis y más. ¿En qué puedo ayudarte?"
**And** no call is made to the Main Agent

**Given** the Filter Agent system prompt needs to be defined
**When** the prompt is configured
**Then** it allows: greetings, MSA-related queries, statistics questions, analysis requests, follow-up questions about results
**And** it rejects: unrelated topics (cooking recipes, general chat, coding help unrelated to stats, etc.)

---

### Story 2.5: Main Agent with Streaming Responses

As a **user**,
I want **to receive streaming responses from the AI assistant**,
So that **I see the response being generated in real-time and the interaction feels responsive**.

**FRs covered:** FR-AGT4, FR-AGT5

**Acceptance Criteria:**

**Given** a message passes the Filter Agent
**When** the message is sent to the Main Agent (gpt-4o)
**Then** the response is streamed back to the client via Server-Sent Events (SSE)
**And** the user sees the response appearing word-by-word in real-time
**And** a typing indicator shows while streaming is in progress

**Given** the Main Agent system prompt needs to be defined
**When** the prompt is configured
**Then** it establishes the agent's identity as a Lean Six Sigma statistics assistant
**And** it specifies the tone: helpful, pedagogical, professional, in Spanish
**And** it describes available capabilities (MSA analysis, statistical guidance)
**And** it instructs the agent to guide users to the Templates section when they need to perform an analysis

**Given** a user asks a statistics question without uploading a file
**When** the Main Agent responds
**Then** the agent provides a helpful conversational answer
**And** no tool invocation occurs
**And** the response is educational and contextual

**Given** a user asks about performing an MSA analysis
**When** the Main Agent responds (without file uploaded)
**Then** the agent explains the MSA process
**And** guides the user: "Para realizar un análisis MSA, ve a la sección de Plantillas y descarga la plantilla de MSA. Llénala con tus datos y súbela aquí."

**Given** streaming encounters an error mid-response
**When** the error is detected
**Then** the partial response is preserved
**And** an error indicator appears
**And** the user can retry or continue the conversation

**Given** the OpenAI API is unavailable
**When** a request fails
**Then** the user sees a friendly error message: "El servicio no está disponible en este momento. Por favor intenta de nuevo en unos minutos."
**And** the message is not marked as sent successfully

---

## Epic 3: Template Workflow & File Management

Users can download the MSA template and upload filled templates into their conversations.

### Story 3.1: Templates Section Page

As a **user**,
I want **to view and download analysis templates**,
So that **I can prepare my data in the correct format for analysis**.

**FRs covered:** FR26, FR27

**Acceptance Criteria:**

**Given** an authenticated user navigates to the Templates section
**When** the page loads
**Then** they see a page titled "Plantillas"
**And** they see the MSA template card with title "Análisis del Sistema de Medición (MSA)"
**And** the card includes a brief description of what the template is for
**And** the card has a "Descargar" button

**Given** a user clicks the "Descargar" button for the MSA template
**When** the download initiates
**Then** the file "plantilla-msa.xlsx" is downloaded from /public/templates/
**And** the download starts immediately without navigation

**Given** the MSA template Excel file needs to be created
**When** the template is designed
**Then** it includes sample data demonstrating the expected format
**And** it has clear column headers (Part, Operator, Measurement 1, Measurement 2, etc.)
**And** it does NOT include instructions (those come from the agent)
**And** the format matches what the Python analysis tool expects

**Given** the Templates page needs navigation
**When** the user is in the dashboard
**Then** there is a "Plantillas" link in the sidebar or header
**And** clicking it navigates to the Templates section
**And** the user can easily return to the chat

---

### Story 3.2: File Upload in Chat

As a **user**,
I want **to upload Excel files directly in the chat**,
So that **I can submit my data for analysis without leaving the conversation**.

**FRs covered:** FR15, FR-PRIV1

**Acceptance Criteria:**

**Given** a user is in a conversation
**When** they view the chat input area
**Then** they see a file attachment button (paperclip or upload icon)
**And** the button has a tooltip: "Adjuntar archivo"

**Given** a user clicks the file attachment button
**When** the file picker opens
**Then** it filters to show only Excel files (.xlsx, .xls)
**And** the user can select a file from their device

**Given** a user selects a valid Excel file
**When** the file is selected
**Then** the file name appears in the input area as a preview
**And** the user can remove the file before sending
**And** the user can add a message along with the file

**Given** a user attempts to upload an invalid file type
**When** they select the file
**Then** they see an error message: "Solo se permiten archivos Excel (.xlsx)"
**And** the file is not attached

**Given** a user attempts to upload a file larger than 10MB
**When** they select the file
**Then** they see an error message: "El archivo excede el tamaño máximo de 10MB."
**And** the file is not attached

**Given** the privacy tooltip needs to be displayed
**When** the user hovers over or focuses on the file upload area
**Then** they see a tooltip: "Tus datos se procesan en nuestros servidores. Solo los resultados estadísticos se envían a la IA."
**And** the tooltip uses the PrivacyTooltip component

**Given** a user can also drag and drop files
**When** they drag a file over the chat area
**Then** a drop zone indicator appears
**And** dropping a valid file attaches it to the message

---

### Story 3.3: File Storage & Display in Conversation

As a **user**,
I want **my uploaded files to be stored and visible in the conversation**,
So that **I can reference and re-download them later**.

**FRs covered:** FR16

**Acceptance Criteria:**

**Given** a user sends a message with an attached file
**When** the message is submitted
**Then** the file is uploaded to Supabase Storage in the path `{user_id}/{conversation_id}/{file_id}.xlsx`
**And** a record is created in the files table with storage_path, original_name, mime_type, size_bytes
**And** the file record is linked to the conversation_id and message_id
**And** the file status is set to 'pending'

**Given** a file has been uploaded successfully
**When** the message displays in the chat
**Then** the file appears as an attachment card showing the file name and size
**And** the card has a download button to re-download the file
**And** clicking download fetches the file from Supabase Storage

**Given** a user views a previous conversation with file attachments
**When** the messages load
**Then** all file attachments are visible with their original names
**And** files can be downloaded even in old conversations
**And** file cards show upload timestamp

**Given** file upload fails
**When** the error is detected
**Then** the user sees an error message: "No se pudo subir el archivo. Intenta de nuevo."
**And** the message is not sent
**And** the file attachment is preserved for retry

**Given** a conversation is deleted
**When** the deletion cascades
**Then** all associated files are deleted from Supabase Storage
**And** all file records are deleted from the files table

---

## Epic 4: MSA Statistical Analysis Engine

Users receive accurate MSA analysis results from their uploaded data with validation feedback.

### Story 4.1: Python Analysis Endpoint Structure

As a **system**,
I want **a Python serverless endpoint that routes analysis requests**,
So that **different analysis types can be handled by a single API**.

**FRs covered:** FR-TOOL7

**Acceptance Criteria:**

**Given** the analysis endpoint needs to be created
**When** /api/analyze.py is implemented
**Then** it accepts POST requests with `{ analysis_type: string, file_id: string }`
**And** it routes internally based on analysis_type (MVP: only 'msa')
**And** it returns JSON with structure `{ results, chartData, instructions }` on success
**And** it returns JSON with structure `{ error: { code, message, details } }` on failure

**Given** the Python environment needs dependencies
**When** requirements.txt is configured
**Then** it includes pandas>=2.0.0, numpy>=1.24.0, openpyxl>=3.1.0, scipy>=1.11.0

**Given** the endpoint receives a request for an unknown analysis_type
**When** the routing logic executes
**Then** it returns an error: `{ error: { code: 'UNKNOWN_ANALYSIS_TYPE', message: 'Tipo de análisis no soportado.' } }`
**And** HTTP status 400 is returned

**Given** the endpoint needs to fetch the file
**When** file_id is provided
**Then** the file is fetched from Supabase Storage using the service role key
**And** the file content is loaded into a pandas DataFrame
**And** if file fetch fails, an appropriate error is returned

**Given** the endpoint completes successfully
**When** results are returned
**Then** the file status in the files table is updated to 'processed'
**And** the analysis_results table is populated with the results

---

### Story 4.2: File Validation with Error Feedback

As a **user**,
I want **clear feedback when my uploaded file has problems**,
So that **I can fix the issues and re-upload without guessing what went wrong**.

**FRs covered:** FR-TOOL3, FR-TOOL4, FR-TOOL5

**Acceptance Criteria:**

**Given** an MSA file is submitted for analysis
**When** validation runs
**Then** the validator checks for required columns (Part, Operator, Measurement columns)
**And** the validator checks that measurement columns contain numeric data
**And** the validator checks for minimum required rows (at least 2 parts, 2 operators, 2 measurements)

**Given** the file is missing required columns
**When** validation fails
**Then** the error message specifies which columns are missing
**And** the message is in Spanish: "Faltan columnas requeridas: {column_names}. La plantilla debe incluir Part, Operator, y columnas de medición."
**And** the file status is updated to 'invalid' with validation_errors JSON

**Given** a column contains non-numeric data where numbers are expected
**When** validation fails
**Then** the error message specifies the exact row and column
**And** the message is in Spanish: "La celda {column}{row} contiene '{value}' pero se esperaba un número."
**And** all such errors are collected and returned together (not just the first one)

**Given** the file has empty required cells
**When** validation fails
**Then** the error message specifies which cells are empty
**And** the message is in Spanish: "Celdas vacías encontradas en: {cell_references}. Todos los campos de medición son requeridos."

**Given** validation passes
**When** the file is valid
**Then** the file status is updated to 'valid'
**And** processing continues to the calculation step
**And** validated_at timestamp is recorded

**Given** a user receives a validation error
**When** they fix their file and re-upload
**Then** the new file is processed independently
**And** the previous failed file remains in history (for reference)
**And** the agent acknowledges the re-upload and processes the new file

---

### Story 4.3: MSA Calculation Engine

As a **user**,
I want **accurate MSA calculations performed on my data**,
So that **I can trust the statistical results for my quality decisions**.

**FRs covered:** FR31, FR-TOOL6

**Acceptance Criteria:**

**Given** a valid MSA file is submitted
**When** calculations are performed
**Then** the system computes Gauge R&R metrics:
  - Total Variation
  - Repeatability (Equipment Variation)
  - Reproducibility (Operator Variation)
  - Part-to-Part Variation
  - %GRR (Gauge R&R as percentage of Total Variation)
  - Number of Distinct Categories (ndc)

**Given** calculations complete successfully
**When** results are structured
**Then** the `results` object contains all computed metrics with proper precision
**And** the `chartData` array contains data formatted for Recharts:
  - Variation breakdown by source (for bar chart)
  - Measurement by operator (for comparison chart)
**And** the `instructions` field contains markdown guidance for presenting results

**Given** the %GRR result needs interpretation
**When** instructions are generated
**Then** they include classification:
  - <10%: "Aceptable" (green)
  - 10-30%: "Marginal" (yellow)
  - >30%: "Inaceptable" (red)
**And** they include contextual explanation of what this means for the user's process
**And** they suggest potential actions based on the dominant variation source

**Given** the calculation uses verified formulas
**When** test cases with known outputs are run
**Then** the computed results match expected values within acceptable precision
**And** edge cases (minimum data, edge thresholds) are handled correctly

**Given** a calculation error occurs
**When** the error is caught
**Then** the error message is logged for debugging
**And** the user receives a friendly message: "Ocurrió un error al procesar el análisis. Por favor verifica el formato de tus datos."
**And** the file status is updated appropriately

---

### Story 4.4: Agent Tool Integration

As a **user**,
I want **the AI agent to automatically analyze my uploaded file**,
So that **I get results without manual steps after uploading**.

**FRs covered:** FR-AGT6, FR-TOOL1, FR-TOOL2

**Acceptance Criteria:**

**Given** a user uploads a file with a message indicating MSA analysis
**When** the Main Agent processes the message
**Then** the agent recognizes the intent to perform MSA analysis
**And** the agent invokes the analyze tool with `{ analysis_type: 'msa', file_id: '...' }`
**And** the tool call is visible to the user as a processing indicator

**Given** a user uploads a file without specifying the analysis type
**When** the Main Agent processes the message
**Then** the agent asks the user: "¿Qué tipo de análisis deseas realizar con este archivo?"
**And** the agent waits for user clarification before invoking the tool
**And** MVP: if user says anything related to MSA, the agent proceeds with MSA analysis

**Given** the analysis tool returns successfully
**When** the agent receives the tool response
**Then** the agent uses the `instructions` from the response to present results
**And** the `results` data is included in the message metadata
**And** the `chartData` is passed to the frontend for rendering

**Given** the analysis tool returns a validation error
**When** the agent receives the error response
**Then** the agent presents the validation errors to the user in a helpful way
**And** the agent encourages the user to fix the issues and re-upload
**And** the agent offers to explain what each error means if the user asks

**Given** the tool definition needs to be registered
**When** the Main Agent is configured
**Then** the `analyze` tool is defined with:
  - name: "analyze"
  - description: "Performs statistical analysis on uploaded Excel files"
  - parameters: analysis_type (string, required), file_id (string, required)
**And** the tool is only invoked when a file has been uploaded in the current message or recent context

**Given** the user uploads multiple files in a conversation
**When** they request analysis
**Then** the agent can handle each file separately
**And** the agent asks which file to analyze if ambiguous
**And** each analysis result is stored separately in analysis_results table

---

## Epic 5: AI Interpretation & Interactive Visualization

Users receive clear, contextual interpretations of their results with interactive charts they can explore and download.

### Story 5.1: AI Results Interpretation

As a **user**,
I want **the AI to explain my analysis results clearly**,
So that **I understand what the numbers mean and what actions to take**.

**FRs covered:** FR32, FR33, FR34, FR-INT1

**Acceptance Criteria:**

**Given** the analysis tool returns results
**When** the Main Agent presents the response
**Then** the agent follows the `instructions` from the tool output
**And** the agent can adapt the presentation to the conversation context
**And** the response is streamed to the user in real-time

**Given** results need methodology explanation
**When** the agent presents the analysis
**Then** it explains why MSA/Gauge R&R is the appropriate test
**And** it describes what each metric measures (repeatability = same operator same part, reproducibility = different operators)
**And** explanations are in plain Spanish, avoiding unexplained jargon

**Given** results need interpretation
**When** the agent presents the %GRR value
**Then** it provides the classification (Aceptable/Marginal/Inaceptable)
**And** it explains what this means in practical terms for the user's process
**And** it contextualizes: "Un GRR de 18.2% significa que aproximadamente el 18% de la variación que observas viene del sistema de medición, no del proceso real."

**Given** results need actionable recommendations
**When** the agent completes the interpretation
**Then** it provides specific recommendations based on the dominant variation source
**And** if repeatability is high: suggests equipment calibration, standardized procedures
**And** if reproducibility is high: suggests operator training, measurement standardization
**And** recommendations are practical and relevant to manufacturing/quality context

**Given** the agent presents results
**When** the message is displayed
**Then** numerical results are formatted clearly with appropriate precision
**And** key metrics are highlighted (bold or emphasized)
**And** the classification color (green/yellow/red) is indicated textually

---

### Story 5.2: Interactive Chart Components

As a **user**,
I want **to see my results as interactive charts**,
So that **I can visually understand the analysis and explore the data**.

**FRs covered:** FR-INT3 (partial)

**Acceptance Criteria:**

**Given** analysis results include chartData
**When** the message with results is rendered
**Then** the frontend renders interactive Recharts components
**And** charts appear below or alongside the text interpretation

**Given** the GaugeRRChart component needs to be created
**When** chartData for variation breakdown is received
**Then** a horizontal bar chart displays:
  - Repeatability percentage
  - Reproducibility percentage
  - Part-to-Part percentage
**And** bars are color-coded (equipment=blue, operator=orange, part=green)
**And** reference lines show 10% and 30% thresholds
**And** the total GRR bar uses the appropriate status color (green/yellow/red)

**Given** a user hovers over a chart element
**When** the hover event triggers
**Then** a tooltip displays the exact value and label
**And** the tooltip is styled consistently with the app design
**And** tooltips show values with appropriate precision (e.g., "18.2%")

**Given** charts need to be responsive
**When** viewed on different screen sizes
**Then** charts resize appropriately using ResponsiveContainer
**And** labels remain readable
**And** on mobile, charts may stack vertically

**Given** the VariationChart component needs to be created
**When** chartData for operator comparison is received
**Then** a grouped bar chart or line chart displays measurements by operator
**And** users can visually compare operator consistency
**And** the chart helps identify which operators have more variation

---

### Story 5.3: Chart Export & Multi-File Support

As a **user**,
I want **to download charts as images and analyze multiple files**,
So that **I can include results in reports and perform multiple analyses in one session**.

**FRs covered:** FR-INT2, FR-INT3 (complete)

**Acceptance Criteria:**

**Given** a chart is displayed in the conversation
**When** the user clicks the export/download button on the chart
**Then** the chart is exported as a PNG image
**And** the image includes the chart title and legend
**And** the download filename includes the analysis type and timestamp (e.g., "msa-results-2026-02-03.png")

**Given** chart export needs to be implemented
**When** the export function is triggered
**Then** the Recharts canvas is converted to PNG using html2canvas or similar
**And** the export happens client-side without server round-trip
**And** a loading indicator shows briefly during export

**Given** a user wants to analyze multiple files in one conversation
**When** they upload a second file after receiving first results
**Then** the agent processes the new file independently
**And** new results are presented in a new message
**And** previous results remain visible in the conversation history
**And** each set of results has its own charts

**Given** multiple analysis results exist in a conversation
**When** the user scrolls through the conversation
**Then** each result set is clearly delineated
**And** charts from different analyses don't conflict
**And** the user can export any chart independently

**Given** the message metadata needs to store results
**When** an analysis completes
**Then** the `results` and `chartData` are stored in the message's metadata JSONB field
**And** when the conversation is reloaded, charts can be re-rendered from stored data
**And** no re-computation is needed to view historical results

---

### Story 5.4: Follow-up Questions from Context

As a **user**,
I want **to ask follow-up questions about my results**,
So that **I can deepen my understanding without re-running the analysis**.

**FRs covered:** FR35

**Acceptance Criteria:**

**Given** analysis results have been presented in the conversation
**When** the user asks a follow-up question (e.g., "¿Qué puedo hacer para mejorar?")
**Then** the agent answers using the conversation context
**And** the agent references the specific results from the previous analysis
**And** no new tool invocation occurs (unless user uploads a new file)

**Given** the user asks for clarification on a specific metric
**When** they ask "¿Qué significa el número de categorías distintas?"
**Then** the agent provides a clear explanation
**And** the agent relates it to their specific ndc value from the results
**And** the explanation is educational and contextual

**Given** the user asks about methodology
**When** they ask "¿Por qué usaste Gauge R&R?"
**Then** the agent explains the choice of analysis method
**And** relates it to the user's stated goal (MSA analysis)
**And** may mention alternatives if relevant

**Given** the user asks about next steps
**When** they ask "¿Qué hago ahora?"
**Then** the agent provides practical guidance based on their results
**And** suggestions are specific to their %GRR level and dominant variation source
**And** the agent may suggest re-measuring after improvements

**Given** the conversation history is long
**When** the agent responds to follow-up questions
**Then** it correctly references the most recent analysis results
**And** if multiple analyses exist, it clarifies which one it's discussing
**And** the agent maintains coherent context throughout the conversation

---

## Epic 6: Privacy Transparency & Production Readiness

Users have full transparency about data handling and experience a polished, reliable platform.

### Story 6.1: Privacy Page

As a **user**,
I want **to understand how my data is handled**,
So that **I can trust the platform with my operational data**.

**FRs covered:** FR-PRIV2

**NFRs addressed:** NFR-PRIV4

**Acceptance Criteria:**

**Given** a user wants to learn about data privacy
**When** they click "Privacidad" in the footer
**Then** they are navigated to the Privacy page at /privacidad

**Given** the Privacy page loads
**When** the user views the content
**Then** they see a clear explanation of data handling in Spanish
**And** the page explains:
  - Raw Excel files are processed only on Setec servers
  - Raw data content is NEVER sent to OpenAI
  - Only statistical results (percentages, classifications) go to the AI
  - Conversations are stored in Supabase with encryption
  - Files are encrypted at rest (AES-256)
**And** the page includes a visual diagram or table showing what data goes where

**Given** the Privacy page needs to build trust
**When** the content is written
**Then** it uses clear, non-technical language
**And** it emphasizes the data isolation principle
**And** it mentions Supabase's security certifications
**And** it provides a contact method for privacy questions

**Given** the footer needs a Privacy link
**When** the dashboard layout is viewed
**Then** a footer is visible with "Privacidad" link
**And** the footer appears on all dashboard pages
**And** the link is always accessible

---

### Story 6.2: Error Handling & User Feedback

As a **user**,
I want **friendly error messages when something goes wrong**,
So that **I know what happened and what to do next**.

**FRs covered:** (supports all features)

**NFRs addressed:** NFR7, NFR10, NFR11

**Acceptance Criteria:**

**Given** the OpenAI API is unavailable or returns an error
**When** the error is caught in /api/chat
**Then** the user sees: "El servicio de IA no está disponible en este momento. Por favor intenta de nuevo en unos minutos."
**And** the error is logged server-side for monitoring
**And** the conversation state is preserved (user can retry)

**Given** the Python analysis endpoint fails
**When** the error is caught
**Then** the user sees: "Ocurrió un error al procesar el análisis. Por favor verifica el formato de tus datos o intenta de nuevo."
**And** the specific error is logged with file_id for debugging
**And** the file status is updated to reflect the error

**Given** a network error occurs during any operation
**When** the fetch fails
**Then** the user sees: "No hay conexión a internet. Verifica tu conexión e intenta de nuevo."
**And** the operation can be retried without data loss

**Given** a Supabase operation fails (database or storage)
**When** the error is caught
**Then** the user sees a generic friendly message: "Ocurrió un error. Por favor intenta de nuevo."
**And** technical details are NOT shown to the user
**And** the error is logged with context for debugging

**Given** an unexpected error occurs anywhere in the app
**When** the error boundary catches it
**Then** the user sees a fallback UI with: "Algo salió mal. Recarga la página para continuar."
**And** a reload button is provided
**And** the error is logged with stack trace

**Given** errors need consistent styling
**When** error messages are displayed
**Then** they use the toast component for transient errors
**And** they use inline messages for form validation errors
**And** they use the error boundary for fatal errors
**And** all messages are in Spanish

---

### Story 6.3: Production Deployment & Final Polish

As a **product owner**,
I want **the platform deployed and production-ready**,
So that **users can reliably access and use the system**.

**NFRs addressed:** NFR1, NFR6, NFR8

**Acceptance Criteria:**

**Given** the application needs production deployment
**When** deployment is configured
**Then** the app is deployed to Vercel with production environment variables
**And** HTTPS is enforced on all routes (handled by Vercel)
**And** the custom domain is configured (if applicable)
**And** environment variables are set for production Supabase project

**Given** production Supabase needs configuration
**When** the production project is set up
**Then** all migrations from development are applied
**And** RLS policies are verified as active
**And** Storage bucket policies are verified
**And** The MVP user account is created with secure credentials
**And** Email templates are configured and tested

**Given** the application needs final testing
**When** end-to-end testing is performed
**Then** the complete María user journey works:
  1. Login with credentials
  2. Create new conversation
  3. Chat with agent about MSA
  4. Navigate to Templates, download MSA template
  5. Upload filled template in chat
  6. Receive analysis results with charts
  7. Ask follow-up questions
  8. View results in conversation history
  9. Logout
**And** password recovery flow is tested with real email
**And** error scenarios are tested (invalid file, API timeout)

**Given** the UI needs final polish
**When** visual review is performed
**Then** all text is in Spanish with no English remnants
**And** Setec branding (colors, logo) is consistently applied
**And** Loading states show appropriate feedback (skeletons, spinners)
**And** The interface works on desktop (1024px+) and is viewable on mobile
**And** No console errors appear during normal use

**Given** monitoring needs to be in place
**When** the app is in production
**Then** Vercel provides basic analytics and error tracking
**And** Critical errors are visible in Vercel logs
**And** OpenAI API usage can be monitored via their dashboard
**And** Supabase usage can be monitored via their dashboard

**Given** documentation needs to be complete
**When** handoff is prepared
**Then** README includes:
  - How to run locally
  - Environment variables required
  - How to deploy
  - How to create additional users (manual process for MVP)
**And** The MVP user credentials are documented securely

---

# CAPACIDAD DE PROCESO FEATURE (Added 2026-02-17)

## Requirements Inventory — Capacidad de Proceso

### Functional Requirements

FR-CP1: Usuario puede descargar plantilla `plantilla-capacidad-proceso.xlsx` desde /plantillas
FR-CP2: La plantilla contiene una sola columna: "Valores" (numéricos)
FR-CP3: El agente intenta extraer LEI y LES del mensaje del usuario
FR-CP4: Si no hay LEI/LES en mensaje, mostrar formulario interactivo
FR-CP5: Formulario valida: campos completos, LEI < LES, valores numéricos
FR-CP6: Usuario puede cancelar formulario y subir otro archivo
FR-CP7: Validar archivo tiene al menos una columna numérica
FR-CP8: Detectar y reportar celdas vacías y valores no numéricos
FR-CP9: Si < 20 valores, mostrar advertencia pero continuar
FR-CP10: Mensajes de error en español con guía específica
FR-CP11: Calcular estadísticos básicos (media, mediana, moda, std, min/max/rango)
FR-CP12: Test de normalidad Anderson-Darling con p-value
FR-CP13: Si no normal: aplicar Box-Cox/Johnson, o ajustar distribución alternativa
FR-CP14: Análisis de estabilidad con carta I-MR (límites de control)
FR-CP15: Evaluar 7 reglas de inestabilidad
FR-CP16: Reportar cada regla: CUMPLE/NO CUMPLE con detalle
FR-CP17: Calcular Cp, Cpk, Pp, Ppk
FR-CP18: Si no normal: ajustar Weibull/Lognormal/Gamma/etc., reportar PPM
FR-CP19: Clasificar capacidad: Capaz (≥1.33), Marginal (1.00-1.33), No Capaz (<1.00)
FR-CP20: Generar 4 gráficos: Histograma, I-Chart, MR-Chart, Normality Plot
FR-CP21: Gráficos interactivos y exportables como PNG
FR-CP22: Retornar instrucciones en markdown con análisis técnico + conclusión ejecutiva + conclusión "terrenal"
FR-CP23: Agente puede responder preguntas de seguimiento sin re-ejecutar análisis

### NonFunctional Requirements

NFR-CP1: Anderson-Darling p-values comparables a Minitab (±0.01)
NFR-CP2: Análisis completo < 30 segundos para hasta 1000 filas
NFR-CP3: Todos los mensajes de error y resultados en español
NFR-CP4: Datos crudos nunca se envían a OpenAI (solo resultados agregados)

### Additional Requirements

- Pure Python implementation required (no scipy - Vercel 250MB limit)
- Follow existing `{ data, error }` API response pattern
- Use Recharts for charts (consistent with MSA)
- Follow established naming conventions (snake_case DB, PascalCase components)
- Tests co-located with components
- All UI messages in Spanish

### FR-CP Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR-CP1 | Epic 7 | Template download from /plantillas |
| FR-CP2 | Epic 7 | Template structure (single "Valores" column) |
| FR-CP3 | Epic 8 | Agent extracts LEI/LES from message |
| FR-CP4 | Epic 8 | Form shown if LEI/LES missing |
| FR-CP5 | Epic 8 | Form validation (LEI < LES, numeric) |
| FR-CP6 | Epic 8 | Cancel form capability |
| FR-CP7 | Epic 7 | Validate numeric column exists |
| FR-CP8 | Epic 7 | Report empty cells and non-numeric values |
| FR-CP9 | Epic 7 | Warning if < 20 values |
| FR-CP10 | Epic 7 | Spanish error messages |
| FR-CP11 | Epic 7 | Basic statistics (mean, median, std, etc.) |
| FR-CP12 | Epic 7 | Anderson-Darling normality test |
| FR-CP13 | Epic 7 | Box-Cox/Johnson transformations |
| FR-CP14 | Epic 7 | I-MR control chart calculations |
| FR-CP15 | Epic 7 | 7 instability rules evaluation |
| FR-CP16 | Epic 7 | Rule status reporting |
| FR-CP17 | Epic 7 | Cp, Cpk, Pp, Ppk indices |
| FR-CP18 | Epic 7 | Alternative distribution fitting + PPM |
| FR-CP19 | Epic 7 | Capability classification |
| FR-CP20 | Epic 8 | 4 charts (Histogram, I, MR, Normality) |
| FR-CP21 | Epic 8 | Interactive + PNG export |
| FR-CP22 | Epic 8 | Markdown instructions with 3-part interpretation |
| FR-CP23 | Epic 8 | Follow-up questions without re-analysis |

## Epic List — Capacidad de Proceso

### Epic 7: Process Capability Statistical Analysis Engine

Users receive accurate process capability analysis from their uploaded data, including normality testing, stability analysis, and capability indices.

**FRs covered:** FR-CP1, FR-CP2, FR-CP7, FR-CP8, FR-CP9, FR-CP10, FR-CP11, FR-CP12, FR-CP13, FR-CP14, FR-CP15, FR-CP16, FR-CP17, FR-CP18, FR-CP19

**NFRs addressed:** NFR-CP1, NFR-CP2, NFR-CP3, NFR-CP4

**Deliverables:**
- `capacidad_proceso_validator.py` — file validation with Spanish error messages
- `capacidad_proceso_calculator.py` — all statistical calculations (pure Python, no scipy)
- API routing in `/api/analyze.py` for `analysis_type='capacidad_proceso'`
- Plantilla Excel `plantilla-capacidad-proceso.xlsx`

---

### Epic 8: Capacity Visualization & Agent Integration

Users see interactive charts visualizing their process capability results, can provide spec limits via form or message, and receive clear interpretations with follow-up capability.

**FRs covered:** FR-CP3, FR-CP4, FR-CP5, FR-CP6, FR-CP20, FR-CP21, FR-CP22, FR-CP23

**Deliverables:**
- 4 Recharts components: HistogramChart, IChart, MRChart, NormalityPlot
- SpecLimitsForm component (interactive LEI/LES input)
- Template page update with Capacidad de Proceso card
- Agent tool definition update + smart LEI/LES parsing
- Chat flow integration for form handling

---

## Epic 7: Process Capability Statistical Analysis Engine

Users receive accurate process capability analysis from their uploaded data, including normality testing, stability analysis, and capability indices.

### Story 7.1: File Validation & Basic Statistics Calculator

As a **user**,
I want **my uploaded data file validated and basic statistics calculated**,
So that **I know if my data is ready for analysis and see the foundational metrics**.

**FRs covered:** FR-CP1, FR-CP2, FR-CP7, FR-CP8, FR-CP9, FR-CP10, FR-CP11

**Acceptance Criteria:**

**Given** a user uploads a file for capacidad_proceso analysis
**When** the file is processed
**Then** the system validates that at least one numeric column exists
**And** the system detects and reports empty cells with specific location (e.g., "Celda vacía en fila 15")
**And** the system detects and reports non-numeric values with specific location
**And** if < 20 values, a warning is shown: "Se recomienda un mínimo de 20 valores para obtener estimaciones confiables"
**And** all error messages are in Spanish with actionable guidance

**Given** validation passes
**When** basic statistics are calculated
**Then** the system computes: media, mediana, moda, desviación estándar, mínimo, máximo, rango
**And** results are stored in the analysis output structure

**Given** the template needs to be available
**When** user visits /plantillas
**Then** they see a card for "Análisis de Capacidad de Proceso"
**And** clicking download provides `plantilla-capacidad-proceso.xlsx`
**And** the template contains a single column "Valores" with sample numeric data

---

### Story 7.2: Normality Testing & Distribution Fitting

As a **user**,
I want **my data tested for normality and alternative distributions fitted if needed**,
So that **I know if my data follows a normal distribution or requires special handling**.

**FRs covered:** FR-CP12, FR-CP13, FR-CP18

**NFRs addressed:** NFR-CP1

**Acceptance Criteria:**

**Given** a valid data set is submitted for analysis
**When** normality testing is performed
**Then** the system calculates the Anderson-Darling statistic (A²)
**And** the system calculates p-value using an algorithm compatible with Minitab (±0.01 accuracy)
**And** the system compares p-value against α = 0.05
**And** the system concludes "Normal" or "No Normal"

**Given** data is NOT normal (p-value < 0.05)
**When** transformation is attempted
**Then** the system applies Box-Cox transformation (preferred) or Johnson transformation
**And** the system re-tests normality on transformed data
**And** if transformation succeeds, the system stores transformation type and parameters (λ for Box-Cox)

**Given** transformation does not achieve normality
**When** alternative distribution fitting is performed
**Then** the system fits: Weibull, Lognormal, Gamma, Exponential, Logistic, Extreme Value
**And** the system selects the distribution with best fit (lowest Anderson-Darling or AIC)
**And** the system stores: distribution name, parameters, goodness-of-fit metric
**And** the system calculates PPM (parts per million) outside specification using the fitted distribution

**Given** all normality/distribution work is pure Python
**When** implemented
**Then** no scipy dependency is used (Vercel 250MB limit)
**And** all statistical functions are implemented in pure Python with numpy

---

### Story 7.3: Stability Analysis with I-MR Control Charts

As a **user**,
I want **my process stability evaluated using I-MR control charts**,
So that **I know if my process is under statistical control before assessing capability**.

**FRs covered:** FR-CP14, FR-CP15, FR-CP16

**Acceptance Criteria:**

**Given** a valid data set is submitted for analysis
**When** I-Chart (Individual Values) calculations are performed
**Then** the system calculates the center line (X̄ = mean of all values)
**And** the system calculates MR̄ (mean of moving ranges between consecutive points)
**And** the system calculates UCL = X̄ + 2.66 × MR̄
**And** the system calculates LCL = X̄ - 2.66 × MR̄
**And** points outside UCL/LCL are flagged as out-of-control

**Given** MR-Chart calculations are performed
**When** the moving range chart is generated
**Then** the system calculates MR̄ as center line
**And** the system calculates UCL = 3.267 × MR̄
**And** LCL = 0
**And** points outside UCL are flagged

**Given** stability rules need evaluation
**When** the 7 instability rules are checked
**Then** the system evaluates:
  1. Points beyond 3σ (outside control limits)
  2. 7 consecutive points trending up or down
  3. 7 consecutive points within 1σ of center (stratification)
  4. 7 consecutive points between 2σ and 3σ above center
  5. 7 consecutive points between 2σ and 3σ below center
  6. 7 consecutive points in cyclic pattern
  7. 7 consecutive points above or below center line
**And** each rule reports: CUMPLE or NO CUMPLE
**And** violations include specific point indices where the pattern occurs

**Given** stability analysis completes
**When** results are compiled
**Then** the output includes all control limits, flagged points, and rule evaluations
**And** an overall stability conclusion is provided: "Proceso Estable" or "Proceso Inestable"

---

### Story 7.4: Capability Indices & API Integration

As a **user**,
I want **capability indices calculated and results returned through the API**,
So that **I receive a complete analysis with Cp, Cpk, Pp, Ppk metrics**.

**FRs covered:** FR-CP17, FR-CP19

**NFRs addressed:** NFR-CP2, NFR-CP3, NFR-CP4

**Acceptance Criteria:**

**Given** LEI (lower spec) and LES (upper spec) are provided
**When** capability indices are calculated
**Then** the system computes:
  - Cp = (LES - LEI) / (6σ) — using within-subgroup std dev (from MR̄/d2)
  - Cpk = min[(LES - μ) / 3σ, (μ - LEI) / 3σ]
  - Pp = (LES - LEI) / (6s) — using overall sample std dev
  - Ppk = min[(LES - μ) / 3s, (μ - LEI) / 3s]
**And** if data is non-normal with fitted distribution, indices use distribution-based calculations

**Given** capability indices are calculated
**When** classification is determined
**Then** the system classifies based on Cpk:
  - Cpk ≥ 1.33 → "Capaz" (green)
  - 1.00 ≤ Cpk < 1.33 → "Marginalmente Capaz" (yellow)
  - Cpk < 1.00 → "No Capaz" (red)

**Given** the API endpoint receives a capacidad_proceso request
**When** `/api/analyze.py` routes the request
**Then** `analysis_type='capacidad_proceso'` is recognized and routed to the calculator
**And** the response includes `{ results, chartData, instructions }`
**And** raw data is NEVER included in the response (only aggregated results)
**And** analysis completes in < 30 seconds for up to 1000 rows

**Given** the instructions field is generated
**When** the markdown is created
**Then** it includes three sections:
  1. **Análisis Técnico:** tables of statistics, normality result, control limits, rule evaluations, capability indices
  2. **Conclusión Ejecutiva:** stable/unstable, capable/not capable, normal/not normal
  3. **Conclusión "Terrenal":** plain-language explanation and specific recommendations

---

## Epic 8: Capacity Visualization & Agent Integration

Users see interactive charts visualizing their process capability results, can provide spec limits via form or message, and receive clear interpretations with follow-up capability.

### Story 8.1: Histogram & I-Chart Components

As a **user**,
I want **to see my data visualized as a histogram and individual values chart**,
So that **I can visually understand my data distribution and process behavior over time**.

**FRs covered:** FR-CP20 (partial), FR-CP21 (partial)

**Acceptance Criteria:**

**Given** analysis results include chartData for histogram
**When** the HistogramChart component renders
**Then** it displays frequency bars for data bins
**And** it shows LEI as a red vertical line with label
**And** it shows LES as a red vertical line with label
**And** it shows the mean as a blue vertical line
**And** it shows LCI and LCS as green dashed lines (control limits)
**And** if a distribution was fitted, a superimposed curve is displayed
**And** hovering shows exact values in tooltip

**Given** analysis results include chartData for I-Chart
**When** the IChart component renders
**Then** it displays data points connected by lines (run chart style)
**And** it shows center line (X̄) as solid line
**And** it shows UCL and LCL as dashed lines
**And** points outside control limits are highlighted in red
**And** instability signals are marked with indicators showing which rule was violated
**And** hovering shows point index and value

**Given** charts need to be exportable
**When** user clicks export button on either chart
**Then** the chart is downloaded as PNG with filename including chart type and timestamp
**And** export happens client-side without server round-trip

---

### Story 8.2: MR-Chart & Normality Plot Components

As a **user**,
I want **to see moving range and normality probability charts**,
So that **I can assess measurement variation and data distribution visually**.

**FRs covered:** FR-CP20 (partial), FR-CP21 (partial)

**Acceptance Criteria:**

**Given** analysis results include chartData for MR-Chart
**When** the MRChart component renders
**Then** it displays moving range points connected by lines
**And** it shows center line (MR̄) as solid line
**And** it shows UCL as dashed line (LCL = 0, may be omitted)
**And** points outside UCL are highlighted in red
**And** hovering shows point index and MR value

**Given** analysis results include chartData for Normality Plot
**When** the NormalityPlot component renders
**Then** it displays data points plotted against theoretical normal distribution
**And** it shows a fit line through the points
**And** it shows 95% confidence bands
**And** it displays the Anderson-Darling statistic and p-value on the chart
**And** hovering shows actual vs expected values

**Given** all chart components follow consistent patterns
**When** implemented
**Then** they use Recharts with ResponsiveContainer
**And** they match existing MSA chart styling (colors, fonts, tooltips)
**And** they are responsive and readable on desktop (1024px+)

---

### Story 8.3: Spec Limits Form & Template Page Update

As a **user**,
I want **to provide specification limits through a form when not included in my message**,
So that **I can complete the analysis even if I forgot to specify LEI/LES initially**.

**FRs covered:** FR-CP3, FR-CP4, FR-CP5, FR-CP6

**Acceptance Criteria:**

**Given** a user uploads a file and requests capacidad_proceso analysis
**When** the agent parses the message for LEI/LES
**Then** it extracts limits from patterns like:
  - "LEI=95, LES=105"
  - "LEI 95 y LES 105"
  - "límite inferior 95, superior 105"
  - "lower spec 95, upper 105"
**And** if found, analysis proceeds directly without showing form

**Given** LEI/LES are NOT found in the user's message
**When** the agent responds
**Then** a SpecLimitsForm component is rendered in the chat
**And** the form shows detected data summary: "Se detectó 1 variable numérica con {N} valores"
**And** the form has two input fields: LEI and LES
**And** the form has "Iniciar Análisis" and "Cancelar" buttons

**Given** user fills the SpecLimitsForm
**When** they click "Iniciar Análisis"
**Then** the form validates: both fields required, LEI < LES, both numeric
**And** validation errors show in Spanish below the relevant field
**And** on valid submission, values are sent to the chat as a structured message
**And** the agent proceeds with analysis using the provided limits

**Given** user clicks "Cancelar" on the form
**When** the form is dismissed
**Then** the form disappears from the chat
**And** user can upload a different file or provide limits in a new message

**Given** the Plantillas page needs updating
**When** the page is modified
**Then** a new card appears for "Análisis de Capacidad de Proceso"
**And** the card includes description: "Evalúa si tu proceso cumple con las especificaciones del cliente"
**And** clicking "Descargar" downloads `plantilla-capacidad-proceso.xlsx`

---

### Story 8.4: Agent Tool Update & Chat Flow Integration

As a **user**,
I want **the AI agent to handle my capacity analysis requests seamlessly**,
So that **I receive clear interpretations and can ask follow-up questions**.

**FRs covered:** FR-CP22, FR-CP23

**Acceptance Criteria:**

**Given** the analyze tool definition needs updating
**When** `lib/openai/tools.ts` is modified
**Then** the tool accepts `analysis_type: 'capacidad_proceso'`
**And** the tool accepts optional `spec_limits: { lei: number, les: number }`
**And** the tool description mentions process capability analysis

**Given** analysis completes successfully
**When** the agent presents results
**Then** the agent follows the `instructions` markdown from the tool response
**And** results are streamed to the user in real-time
**And** charts render inline after the text interpretation
**And** the message metadata stores results and chartData for conversation reload

**Given** the agent presents the interpretation
**When** the three-part structure is followed
**Then** Part 1 (Análisis Técnico) includes formatted tables of all metrics
**And** Part 2 (Conclusión Ejecutiva) clearly states: estable/inestable, capaz/no capaz, normal/no normal
**And** Part 3 (Conclusión Terrenal) explains in simple language what the numbers mean and what to do next

**Given** a user asks a follow-up question after receiving results
**When** they ask something like "¿Qué puedo hacer para mejorar?" or "¿Por qué no es capaz?"
**Then** the agent answers using conversation context without re-invoking the analysis tool
**And** the agent references specific values from the previous analysis
**And** recommendations are specific to their results (e.g., if Cpk low due to centering vs spread)

**Given** the chat route handles the SpecLimitsForm flow
**When** form values are submitted
**Then** they are received as a structured message in the chat
**And** the agent extracts LEI/LES and invokes the analyze tool
**And** the flow is seamless from user perspective
