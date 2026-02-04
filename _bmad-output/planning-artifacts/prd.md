---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
  - step-12-complete
  - step-e-01-discovery
  - step-e-02-review
  - step-e-03-edit
status: complete
completedAt: 2026-01-21
lastEdited: 2026-02-02
inputDocuments: []
workflowType: 'prd'
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 0
  projectDocs: 0
classification:
  projectType: saas_b2b
  domain: scientific_edtech
  complexity: medium
  projectContext: greenfield
  architecture: two-agent-python
editHistory:
  - date: 2026-02-02
    changes: Agregada sección completa de Privacidad y Seguridad de Datos; requisitos explícitos de que datos crudos nunca van a OpenAI; NFRs y FRs de privacidad; detalles de aislamiento en arquitectura de Tool
  - date: 2026-02-02
    changes: Arquitectura de dos agentes (filtro + principal) con computación Python; OpenAI como único proveedor LLM; eliminada selección de modelo y agente; agregado diagrama de arquitectura; documento traducido completamente a español
  - date: 2026-01-29
    changes: Updated MVP authentication from hardcoded credentials to Supabase Auth with single user; moved password recovery to MVP; updated all related sections for consistency
  - date: 2026-01-29
    changes: Added Executive Summary; removed TBD placeholders; deleted brief.md (PRD is now canonical)
---

# Documento de Requisitos del Producto - Setec AI Hub

**Autor:** Setec
**Fecha:** 2026-01-20

## Resumen Ejecutivo

Setec AI Hub es una plataforma de análisis estadístico potenciada por IA para practicantes de Lean Six Sigma. Permite a los estudiantes de Green Belt realizar Análisis del Sistema de Medición (MSA) sin necesidad de Minitab o habilidades avanzadas de Excel — sube tus datos, chatea con un agente de IA, y obtén resultados calculados con explicaciones metodológicas claras.

**Cómo funciona:** Los mensajes del usuario pasan por un agente filtro que asegura que las consultas estén relacionadas con el propósito del sistema. Las consultas válidas llegan al agente principal, que puede responder preguntas sobre estadística de forma conversacional o invocar una herramienta de análisis basada en Python cuando el usuario sube datos. La herramienta realiza los cálculos, genera gráficos, y retorna instrucciones estructuradas para presentar los resultados — asegurando precisión y consistencia.

**Para quién es:** Ingenieros de calidad y profesionales de procesos inscritos en los programas de capacitación LSS de Setec. Los usuarios están aprendiendo métodos estadísticos pero no quieren lidiar con software complejo.

**Por qué ahora:** Los clientes de capacitación de Setec necesitan una herramienta práctica para aplicar lo que aprenden. La plataforma diferencia la oferta de Setec y crea una base para expandir al currículo completo de Green Belt (~15 tipos de análisis).

**Alcance MVP:** Análisis MSA vía computación Python, interfaz estilo ChatGPT con persistencia en Supabase, OpenAI como proveedor de LLM. Un usuario autenticado (creado manualmente), interfaz completamente en español. Desktop-first con soporte de visualización móvil.

## Criterios de Éxito

### Éxito del Usuario

- Usuarios completan análisis MSA sin necesidad de Minitab
- Usuarios entienden la metodología detrás de los resultados (por qué esta prueba, por qué estas conclusiones)
- Usuarios pueden presentar y defender sus hallazgos ante stakeholders con confianza
- Errores de carga se resuelven rápidamente con guía clara y accionable

### Éxito del Negocio

- La plataforma se convierte en un diferenciador para la oferta de capacitación LSS de Setec
- Clientes de capacitación que pagan usan activamente la herramienta
- La base soporta expansión a ~15 tipos de análisis cubriendo el currículo completo de Green Belt

### Éxito Técnico

- Los cálculos estadísticos son precisos (scripts Python con fórmulas verificadas)
- Las interpretaciones de IA son útiles y pedagógicamente sólidas
- El sistema maneja usuarios concurrentes de múltiples organizaciones cliente
- La validación de plantillas captura errores antes de la computación

### Resultados Medibles

- Usuarios completan un análisis de principio a fin sin ayuda externa
- Resultados estadísticos coinciden con valores esperados para casos de prueba conocidos

## Alcance del Proyecto y Desarrollo por Fases

### Estrategia y Filosofía del MVP

**Enfoque MVP:** MVP de resolución de problemas — resolver el pain point principal (análisis estadístico sin Minitab) con complejidad mínima de plantillas.

**Justificación:** Menos tipos de análisis = menos plantillas = más rápido para lanzar y validar con usuarios reales.

### Conjunto de Funcionalidades MVP (Fase 1)

**User Journey Principal Soportado:**

- María (Primer Análisis) — análisis MSA

**Capacidades Imprescindibles:**

- 1 tipo de análisis: MSA (Análisis del Sistema de Medición)
- 1 plantilla Excel
- Interfaz de chat (estilo ChatGPT) con barra lateral de historial de conversaciones
- Flujo de descarga/carga de plantilla Excel
- Resultados calculados por Python e interpretados por IA con explicaciones metodológicas
- Persistencia en Supabase (conversaciones guardadas server-side, sobreviven limpieza del navegador)
- Un usuario autenticado via Supabase Auth (creado manualmente en el dashboard de Supabase)
- Desktop-first, responsive para móvil en modo visualización

### Funcionalidades Post-MVP (Fase 2)

- Autenticación multi-usuario (usuarios adicionales creados via portal Admin)
- Portal Admin para CRUD de usuarios (protección con contraseña simple, no Supabase auth)
- Tipos de análisis adicionales (Control Charts, Hypothesis Testing, etc.)

### Visión (Fase 3)

- Expandir a ~15 tipos de análisis (currículo completo de Green Belt)
- Portal Admin: UI de configuración de análisis
- Versionado de plantillas
- Plantillas especializadas por tipo de análisis
- Funcionalidades a nivel empresa si se necesitan

## User Journeys

### Journey 1: María — Primer Análisis (Usuario Final - Camino Exitoso)

**Quién:** María, Ingeniera de Calidad en una empresa manufacturera. Acaba de completar la Semana 2 de su capacitación Green Belt. Necesita analizar datos de su sistema de medición para su proyecto capstone.

**Escena Inicial:** María tiene datos de medición en una hoja de cálculo pero le da pavor abrir Minitab. Recuerda que su instructor mencionó Setec AI Hub.

**Desarrollo:**

1. Abre Setec AI Hub en su navegador, inicia sesión con sus credenciales de Supabase
2. Hace clic en "Nueva conversación" para iniciar un nuevo chat
3. El agente la saluda: _"Hola, soy tu asistente de análisis estadístico. Puedo ayudarte con MSA, gráficos de control, pruebas de hipótesis, y más. ¿En qué puedo ayudarte hoy?"_
4. María responde: "Necesito hacer un análisis MSA para mi proyecto"
5. El agente la guía: _"Perfecto. Ve a la sección de Plantillas y descarga la plantilla de MSA. Llénala con tus datos y súbela aquí."_
6. Va a la sección de Plantillas, descarga la plantilla Excel de MSA
7. Llena la plantilla con sus datos (30 partes, 3 operadores, 2 repeticiones)
8. Regresa al chat, sube la plantilla completada

**Clímax:** El agente retorna sus resultados: **Variación del sistema: 18.2%**, con una explicación clara: _"Tu sistema de medición muestra 18.2% de variación del sistema de medición, lo cual cae en la categoría 'marginal' (10-30%). Esto significa que la variación de medición es aceptable para monitoreo de proceso pero puede enmascarar pequeñas mejoras. La variación operador-a-operador representa el 12% de la variación total—considera estandarizar la técnica de medición entre operadores."_

**Resolución:** María entiende no solo el número sino _qué significa_ para su proyecto. Hace una pregunta de seguimiento en el chat: "¿Qué puedo hacer para mejorar?" y el agente proporciona recomendaciones específicas. Incluye esto con confianza en su presentación capstone.

---

### Journey 2: Carlos — Recuperación de Error de Carga (Post-MVP)

> **Nota:** Este journey requiere el análisis de Normality-Stability-Capability, planeado para Fase 2.

**Quién:** Carlos, Ingeniero de Procesos. Cómodo con datos pero apurado.

**Escena Inicial:** Carlos tiene datos de capacidad de proceso y necesita resultados rápidos antes de una reunión en 30 minutos.

**Desarrollo:**

1. Inicia sesión, indica que quiere hacer análisis de "Normality-Stability-Process Capability"
2. Va a la sección de Plantillas, descarga la plantilla, pega sus datos rápidamente
3. Regresa al chat, sube el archivo—pero cometió un error (texto "N/A" en columnas numéricas)

**Clímax:** En lugar de un error críptico, el agente responde: _"Encontré algunos problemas con tu archivo. La columna D (mediciones) tiene 'N/A' en las filas 15 y 28. Necesito valores numéricos aquí. Puedes reemplazarlos con mediciones reales o eliminar esas filas si no se recolectaron datos. ¿Quieres que te explique qué hacer?"_

**Resolución:** Carlos corrige las dos celdas, vuelve a subir, obtiene sus resultados con 10 minutos de sobra. No tuvo que adivinar qué salió mal.

---

### Journey 3: Sofía — Gestión de Usuarios Admin (Post-MVP)

> **Nota:** Este journey requiere el portal Admin, planeado para Fase 2.

**Quién:** Sofía, Coordinadora de Capacitación de Setec. Gestiona acceso a la plataforma para cohortes de capacitación.

**Escena Inicial:** Nueva cohorte de 25 estudiantes comenzando el lunes. Sofía necesita provisionar cuentas.

**Desarrollo:**

1. Inicia sesión en Setec AI Hub Admin (plataforma separada)
2. Va a Gestión de Usuarios
3. Crea 25 nuevos usuarios uno por uno (nombre + email para cada uno)
4. El sistema envía correos de bienvenida con instrucciones de acceso para cada usuario

**Clímax:** Las 25 cuentas creadas. Sofía puede ver la lista completa de usuarios y verificar que todos están configurados.

**Resolución:** Llega el lunes, los estudiantes inician sesión sin problemas. Cuando el email de un estudiante estaba mal, Sofía rápidamente edita el registro del usuario para corregirlo.

---

### Journey 4: David — Eligiendo la Prueba Correcta (Post-MVP)

> **Nota:** Este journey requiere el análisis de Hypothesis Testing, planeado para Fase 2.

**Quién:** David, candidato a Black Belt. Conoce estadística pero quiere confirmar su selección de prueba.

**Escena Inicial:** David tiene dos conjuntos de datos y sospecha una diferencia, pero no está seguro si necesita una prueba t de 2 muestras o prueba t pareada.

**Desarrollo:**

1. Inicia sesión, comienza nuevo chat
2. El agente hace preguntas clarificadoras sobre la estructura de sus datos
3. David describe: "Tengo mediciones de las mismas máquinas antes y después de un ajuste"

**Clímax:** El agente lo guía: _"Basándome en tu descripción, necesitas una prueba t pareada porque estás comparando las mismas máquinas antes y después. Ve a la sección de Plantillas y descarga la plantilla de prueba t pareada."_

**Resolución:** David descarga la plantilla, la llena, la sube al chat, obtiene resultados con explicación de por qué pareada era la elección correcta. David aprende algo.

---

### Resumen de Requisitos por Journey

| Journey                        | Fase     | Capacidades Reveladas                                                                                                      |
| ------------------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| María (Camino Exitoso)         | MVP      | Login Supabase Auth, interfaz de chat, sección Plantillas, carga de archivo en chat, computación Python e interpretación IA |
| Sofía (Admin)                  | Post-MVP | Portal admin, CRUD de usuarios, invitaciones por email, vista de lista de usuarios                                         |
| Carlos (Recuperación de Error) | Post-MVP | Validación de plantilla, mensajes de error claros en español, flujo de re-carga                                            |
| David (Soporte de Decisión)    | Post-MVP | Guía conversacional para selección de prueba, recomendaciones de plantilla                                                 |

## Arquitectura de la Plataforma

### Plataforma MVP

| Plataforma       | URL             | Usuarios    | Propósito                                            |
| ---------------- | --------------- | ----------- | ---------------------------------------------------- |
| **Setec AI Hub** | Vercel default  | Estudiantes | Chat con agente de análisis, subir datos, ver resultados |

- Plataforma única con login via Supabase Auth
- Cuenta de usuario única creada manualmente en el dashboard de Supabase
- Credenciales de usuario gestionadas de forma segura por Supabase Auth

### Expansión de Plataforma Post-MVP

- Agregar soporte multi-usuario (usuarios adicionales creados via portal Admin)
- Agregar portal admin (plataforma separada con protección de contraseña simple)

### Idioma

- **Plataforma completamente en español** — UI, respuestas del agente, mensajes de error, plantillas

## Requisitos Específicos SaaS B2B

### Modelo de Datos MVP

- Usuario único autenticado via Supabase Auth (email/password)
- Cuenta de usuario creada manualmente en el dashboard de Supabase (UUID proporcionado en setup)
- Conversaciones persistidas en Supabase, vinculadas al UUID del usuario autenticado
- Usuario ve solo sus propias conversaciones
- Cuando se agregue soporte multi-usuario post-MVP, el usuario existente y conversaciones permanecen; nuevos usuarios agregados via portal Admin

### Multi-Tenancy Post-MVP

- Aislamiento a nivel de usuario (sin agrupación por empresa/organización)
- Cada usuario ve solo sus propias conversaciones y datos subidos
- Admin puede ver lista de usuarios pero no puede acceder a datos de usuarios

### Autenticación y Autorización — MVP

- **Auth de Usuario:** Supabase Auth (email/password)
- **Creación de Usuario:** Usuario único creado manualmente en dashboard de Supabase antes del lanzamiento
- **Flujo de Recuperación de Contraseña:** Usuario solicita reset → Sistema envía link de reset via email → Usuario hace clic en link → Usuario establece nueva contraseña → Se muestra confirmación

### Autenticación y Autorización — Post-MVP

- **Auth de Admin:** Protección de contraseña simple (no Supabase)
- **Flujo de Creación de Usuario:** Admin crea usuario → Sistema envía email de invitación → Usuario establece contraseña

### Arquitectura de Datos

- **Base de Datos:** Supabase PostgreSQL (tier gratuito - 500MB) — MVP para persistencia de conversaciones
- **Almacenamiento de Archivos:** Supabase Storage (tier gratuito - 1GB) — MVP para archivos Excel subidos
- **Retención:** Indefinida para conversaciones y archivos; revisar si se acercan los límites de almacenamiento

### Integraciones Externas

| Servicio        | Propósito                                           | Tier        | Fase     |
| --------------- | --------------------------------------------------- | ----------- | -------- |
| **OpenAI API**  | Agente filtro, agente principal, interpretación de resultados | Pago-por-uso | MVP      |
| **Supabase**    | Base de Datos + Almacenamiento de Archivos + Auth   | Gratuito    | MVP      |
| **Supabase**    | Auth multi-usuario, emails transaccionales (portal Admin) | Gratuito | Post-MVP |

### Consideraciones de Implementación

- OpenAI seleccionado por eficiencia de costos y API madura de function calling
- Los scripts Python realizan todos los cálculos estadísticos (no el LLM)
- El LLM interpreta resultados y los presenta al usuario siguiendo instrucciones estructuradas
- Sin integración de facturación/pagos (gratuito para clientes de capacitación)

## Privacidad y Seguridad de Datos

### Principio Fundamental

Los datos operacionales del cliente (archivos Excel con parámetros de proceso, volúmenes de producción, tasas de defectos) son procesados exclusivamente en nuestros servidores. **Los datos crudos nunca se envían a OpenAI.**

### Flujo de Datos y Aislamiento

| Dato | Ubicación | ¿Va a OpenAI? |
|------|-----------|---------------|
| Archivo Excel crudo | Supabase Storage (servidor Setec) | ❌ NO |
| Contenido del archivo | Python Tool (procesamiento server-side) | ❌ NO |
| Resultados estadísticos (ej: "18.2% variación") | Respuesta del LLM | ✅ SÍ |
| Conversación del usuario | OpenAI API | ✅ SÍ |
| Instrucciones de presentación | OpenAI API | ✅ SÍ |

### Política de Datos de OpenAI

- OpenAI API (endpoint de pago) **no usa datos de API para entrenar modelos** (política vigente)
- Los datos enviados a la API se retienen por 30 días para monitoreo de abuso, luego se eliminan
- Referencia: https://openai.com/enterprise-privacy

### Almacenamiento en Supabase

- **Cifrado en reposo:** Supabase cifra todos los datos almacenados (AES-256)
- **Cifrado en tránsito:** Todas las conexiones usan TLS 1.2+
- **Ubicación de datos:** Región configurable al crear el proyecto (ej: us-east-1, eu-central-1)
- **Retención:** Indefinida hasta eliminación explícita por el usuario o admin

### Aislamiento de Datos por Usuario

- MVP: Usuario único, todas las conversaciones vinculadas a su UUID
- Post-MVP: Row Level Security (RLS) en Supabase asegura que cada usuario solo accede a sus propios datos
- Admin no puede acceder al contenido de conversaciones ni archivos de usuarios

### Comunicación a Clientes

La plataforma debe incluir información clara sobre manejo de datos:
- Página de Privacidad accesible desde el footer
- Tooltip en la zona de carga de archivos: "Tus datos se procesan en nuestros servidores. Solo los resultados estadísticos se envían a la IA."

## Arquitectura Técnica

### Arquitectura de Agentes

El sistema utiliza una arquitectura de dos agentes con computación basada en Python:

```
┌─────────────────────────────────────────────────────────────────┐
│                        USUARIO                                  │
│                     envía mensaje                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  AGENTE 1 (Filtro)                                              │
│  ─────────────────                                              │
│  • Structured output: { "allowed": true/false }                 │
│  • Permite: saludos, todo relacionado a análisis/MSA/stats      │
│  • Rechaza: todo lo demás → mensaje contextual                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                         allowed?
                     ┌─────┴─────┐
                    NO          SÍ
                     ↓           ↓
              [Mensaje       ┌───────────────────────────────────┐
               rechazo       │  AGENTE 2 (Principal)             │
               contextual]   │  ─────────────────                │
                             │  System prompt con:               │
                             │  • Identidad y propósito          │
                             │  • Tools disponibles              │
                             │  • Casos de uso                   │
                             │  • Reglas de operación            │
                             │  • Tono (español, pedagógico)     │
                             │                                   │
                             │  Puede:                           │
                             │  • Conversar sobre MSA/stats      │
                             │  • Responder sin archivo          │
                             │  • Invocar tool de análisis       │
                             └───────────────────────────────────┘
                                          ↓
                              ¿Archivo + tipo de análisis?
                             ┌───────┴───────┐
                            NO              SÍ
                             ↓               ↓
                    [Conversa o        ┌─────────────────────────┐
                     pregunta qué      │  TOOL: Análisis         │
                     análisis]         │  POST /api/analyze      │
                                       │  Input:                 │
                                       │  • analysis_type        │
                                       │  • file                 │
                                       └───────────┬─────────────┘
                                                   ↓
                                       ┌─────────────────────────┐
                                       │  Python Script          │
                                       │  • Valida archivo       │
                                       │  • Ejecuta cálculos     │
                                       │  • Prepara chartData    │
                                       │  • Retorna instructions │
                                       └───────────┬─────────────┘
                                                   ↓
                                       ┌─────────────────────────┐
                                       │  Output:                │
                                       │  {                      │
                                       │    results: {...},      │
                                       │    chartData: [...],    │
                                       │    instructions: "md"   │
                                       │  }                      │
                                       └───────────┬─────────────┘
                                                   ↓
                                       ┌─────────────────────────┐
                                       │  AGENTE 2 presenta      │
                                       │  • Sigue/adapta         │
                                       │    instructions         │
                                       │  • Muestra resultados   │
                                       │  • Frontend renderiza   │
                                       │    charts interactivos  │
                                       └─────────────────────────┘
```

**Agente 1 (Filtro):**
- Recibe todos los mensajes del usuario primero
- Usa structured output de OpenAI para clasificar: `{ "allowed": boolean }`
- Permite: saludos, consultas relacionadas a MSA, preguntas de estadística, solicitudes de análisis de datos
- Rechaza: consultas fuera de tema con mensaje contextual explicando las capacidades del sistema

**Agente 2 (Principal):**
- Maneja todas las consultas aprobadas
- System prompt define: identidad, tools disponibles, casos de uso, reglas operativas, tono (español, pedagógico)
- Puede conversar sobre estadística sin requerir carga de archivo
- Invoca la tool de análisis cuando el usuario proporciona archivo Y especifica tipo de análisis
- Si hay archivo pero no se especifica tipo: pregunta al usuario qué análisis desea
- Presenta resultados siguiendo `instructions` del output de la tool (puede adaptar al contexto de la conversación)
- Responde preguntas de seguimiento desde el contexto de la conversación sin re-invocar la tool
- Soporta múltiples análisis de archivos en la misma conversación

**Tool de Análisis:**
- Endpoint único: `POST /api/analyze`
- Input: `{ analysis_type: string, file: binary }`
- Routea internamente al script Python apropiado basado en `analysis_type`
- El script Python valida estructura del archivo y tipos de datos
- Retorna:
  ```json
  {
    "results": { /* datos numéricos del análisis */ },
    "chartData": [ /* datos estructurados para renderizar gráficos en frontend */ ],
    "instructions": "markdown con guía de presentación"
  }
  ```
- El campo `chartData` contiene datos estructurados que el frontend usa para renderizar gráficos interactivos (no imágenes pre-generadas)
- El campo `instructions` contiene markdown con guía sobre cómo presentar los resultados (asegura consistencia)

**Almacenamiento de Archivos:**
- Archivos subidos se almacenan en Supabase Storage
- Vinculados a la conversación para historial y re-acceso

**Aislamiento de Datos (Crítico):**
- El archivo Excel se procesa completamente en el servidor (Python)
- Solo el output estructurado (`results`, `chartData`, `instructions`) se retorna al agente
- El contenido crudo del archivo (filas de datos, valores de medición) **nunca se incluye en el contexto del LLM**
- Esto asegura que datos operacionales sensibles no fluyan a través de OpenAI

### Modelo de Computación

- **Proveedor LLM:** OpenAI (seleccionado por eficiencia de costos y API matura de function calling)
- **Computación:** Scripts Python realizan todos los cálculos estadísticos (no el LLM)
- **Visualización:** Frontend renderiza gráficos interactivos usando librería de charts (ej: Recharts, Chart.js) a partir de datos estructurados de la tool
- **Interpretación:** El LLM interpreta resultados y los presenta al usuario siguiendo instrucciones estructuradas
- **Justificación:** Python asegura precisión en los cálculos; frontend permite gráficos interactivos; el LLM maneja la interacción en lenguaje natural y las explicaciones pedagógicas
- **Estrategia de Validación:** Probar scripts Python con datasets conocidos que tienen outputs verificados correctos

### Tipos de Análisis MVP (V1)

| #   | Tipo de Análisis                  | Alcance                              | Plantillas |
| --- | --------------------------------- | ------------------------------------ | ---------- |
| 1   | Measurement System Analysis (MSA) | Análisis completo del sistema de medición | 1          |

**Total Plantillas MVP: 1**

### Tipos de Análisis Post-MVP (Fase 2)

| #   | Tipo de Análisis                       | Alcance                                                                                               |
| --- | -------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 2   | Control Charts (SPC)                   | X-bar R, X-bar S, I-MR, p-chart, np-chart, c-chart, u-chart                                           |
| 3   | Fishbone Diagram & 5 Whys              | Análisis cualitativo de causa raíz (no requiere plantilla Excel)                                      |
| 4   | Hypothesis Testing                     | 1-sample t-test, 2-sample t-test, paired t-test, one-way ANOVA, chi-square test, correlation analysis |
| 5   | Normality-Stability-Process Capability | Flujo agrupado—los tres análisis juntos                                                               |

### Interfaz de Chat (Estilo ChatGPT)

**MVP:**
- **Login Supabase Auth** — cuenta de usuario única (creada manualmente en el dashboard de Supabase)
- **Recuperación de contraseña** — usuario puede restablecer contraseña via flujo de email de Supabase Auth
- **Nueva conversación** — usuario hace clic en "Nueva conversación" para comenzar a chatear (sin selección de agente; agente unificado)
- **Carga de archivo en chat** — usuario sube Excel directamente en la conversación
- **Preguntas de seguimiento** — usuario puede hacer preguntas sobre los resultados en el mismo chat
- **Persistencia Supabase** — conversaciones guardadas server-side, vinculadas al UUID del usuario autenticado
- **Barra lateral de historial** — usuario puede ver y regresar a sus conversaciones anteriores

**Post-MVP:**
- **Soporte multi-usuario** — usuarios adicionales creados via portal Admin
- **Tipos de análisis adicionales** — más opciones de analysis_type disponibles

### Flujo de Plantilla y Workflow (MVP)

1. Usuario abre Setec AI Hub, inicia sesión via Supabase Auth (email/password)
2. Usuario hace clic en "Nueva conversación" para iniciar un nuevo chat
3. Agente saluda al usuario y presenta sus capacidades generales (MSA, gráficos de control, pruebas de hipótesis, etc.)
4. Usuario indica qué tipo de análisis necesita (ej: "Necesito hacer un MSA")
5. Agente guía al usuario a la plantilla correspondiente: "Ve a la sección de Plantillas y descarga la plantilla de MSA"
6. Usuario va a la sección de Plantillas, descarga la plantilla Excel correspondiente
7. Usuario llena la plantilla con sus datos
8. Usuario regresa al chat y sube la plantilla completada
9. Tool de Python valida la carga (estructura correcta, tipos de datos, campos requeridos)
10. Tool de Python calcula resultados estadísticos y retorna datos numéricos + datos para gráficos + instrucciones
11. Agente presenta resultados numéricos con explicación metodológica siguiendo las instrucciones
12. Frontend renderiza gráficos interactivos a partir de los datos (descargables como imagen)
13. Usuario puede hacer preguntas de seguimiento en la misma conversación
14. Usuario puede subir archivos adicionales para más análisis en la misma conversación

### Sección de Plantillas

- Página separada listando plantillas Excel (MVP: 1 plantilla MSA)
- Usuario descarga plantillas desde aquí (no desde el chat del agente)
- Plantillas incluyen solo datos de ejemplo (sin instrucciones — mantiene el archivo limpio para parsing)
- Instrucciones proporcionadas por el agente en el chat o en la página de Plantillas

### Formato de Output

- Resultados numéricos mostrados en chat con explicación metodológica
- Gráficos interactivos renderizados por el frontend (hover, tooltips)
- Gráficos descargables como imagen (exportación del canvas a PNG)
- Reportes descargables (PDF con todos los resultados y gráficos) — Post-MVP

## Requisitos Funcionales

### Autenticación de Usuario — MVP

- FR1: Usuario puede iniciar sesión en Setec AI Hub mediante Supabase Auth (email/password)
- FR2: Sistema redirige a usuarios no autenticados a la página de login
- FR3: Usuario permanece autenticado hasta cerrar sesión explícitamente (sesión gestionada por Supabase Auth)
- FR4: Usuario puede solicitar restablecimiento de contraseña desde la página de login
- FR4.1: Sistema envía correo con enlace seguro de restablecimiento via Supabase (expira en 24 horas)
- FR4.2: Usuario puede establecer nueva contraseña mediante el enlace recibido
- FR4.3: Sistema confirma el cambio exitoso y redirige al login

### Autenticación de Usuario — Post-MVP

- FR5: Admin puede crear cuentas adicionales para nuevos usuarios via Admin portal
- FR6: Cada usuario tiene sus propias credenciales únicas

### Autenticación y Gestión de Admin (Post-MVP)

> **Nota:** Portal Admin diferido a Fase 2.

- FR7: Admin puede acceder al portal de administración con contraseña simple
- FR8: Admin puede crear un nuevo usuario proporcionando nombre y correo electrónico
- FR9: Admin puede ver la lista de todos los usuarios
- FR10: Admin puede editar el nombre o correo de un usuario
- FR11: Admin puede eliminar un usuario
- FR12: Sistema envía correo de bienvenida con instrucciones de acceso cuando admin crea un usuario

### Arquitectura de Agentes — MVP

- FR-AGT1: Sistema filtra todos los mensajes del usuario mediante el Agente 1 (Filtro) antes de procesarlos
- FR-AGT2: Agente Filtro usa structured output de OpenAI para clasificar mensajes: `{ "allowed": boolean }`
- FR-AGT3: Mensajes fuera de tema reciben respuesta contextual explicando las capacidades del sistema
- FR-AGT4: Mensajes aprobados se pasan al Agente 2 (Principal) para procesamiento
- FR-AGT5: Agente Principal puede conversar sobre estadística/MSA sin requerir archivo
- FR-AGT6: Agente Principal tiene acceso a tool de análisis para ejecutar cálculos

### Interfaz de Chat (Estilo ChatGPT) — MVP

- FR13: Usuario puede iniciar una nueva conversación (agente unificado, sin selección)
- FR14: Usuario puede enviar mensajes de texto al agente
- FR15: Usuario puede subir archivos Excel dentro de la conversación
- FR16: Archivos subidos se almacenan en Supabase Storage y son visibles/descargables desde el historial de conversaciones
- FR17: Usuario puede hacer preguntas de seguimiento sobre los resultados
- FR18: Usuario puede ver el historial de conversaciones en una barra lateral
- FR19: Usuario puede continuar una conversación anterior desde el historial
- FR20: Conversaciones se guardan en Supabase vinculadas al usuario autenticado

### Interfaz de Chat — Post-MVP Enhancements

- FR24: Conversaciones se aíslan por usuario (cada usuario ve solo sus propias conversaciones)
- FR25: Tipos de análisis adicionales disponibles (Control Charts, Hypothesis Testing, etc.)

### Sección de Plantillas — MVP

- FR26: Usuario puede ver la plantilla MSA disponible
- FR27: Usuario puede descargar la plantilla Excel de MSA

### Tool de Análisis — MVP

- FR-TOOL1: Sistema invoca tool de análisis Python cuando usuario proporciona archivo y tipo de análisis
- FR-TOOL2: Si usuario sube archivo sin especificar tipo de análisis, agente pregunta qué análisis desea
- FR-TOOL3: Tool de análisis valida estructura del archivo antes de procesar (columnas correctas, tipos de datos)
- FR-TOOL4: Tool de análisis proporciona mensajes de error específicos y accionables cuando la validación falla (fila/columna/problema)
- FR-TOOL5: Usuario puede subir una plantilla corregida después de resolver errores
- FR-TOOL6: Tool de análisis retorna resultados numéricos, datos para gráficos e instrucciones de presentación en formato estructurado
- FR-TOOL7: Tool usa endpoint único `POST /api/analyze` que routea internamente según `analysis_type`

### Computación Estadística — MVP

- FR31: Sistema calcula métricas MSA a partir de los datos subidos mediante scripts Python con fórmulas verificadas

### Interpretación por IA — MVP

- FR32: Sistema proporciona interpretación generada por IA de los resultados estadísticos
- FR33: Sistema explica la metodología detrás del análisis (por qué esta prueba, qué significan los números)
- FR34: Sistema proporciona recomendaciones accionables basadas en los resultados
- FR35: Agente responde preguntas de seguimiento del usuario sobre los resultados usando contexto de la conversación (sin re-invocar tool)
- FR-INT1: Agente presenta resultados siguiendo instrucciones del output de la tool, con capacidad de adaptar al contexto
- FR-INT2: Usuario puede analizar múltiples archivos en la misma conversación
- FR-INT3: Frontend renderiza gráficos interactivos a partir de datos de la tool; usuario puede descargarlos como imagen (exportación de canvas)

### Transparencia de Privacidad — MVP

- FR-PRIV1: Sistema muestra tooltip informativo en la zona de carga de archivos explicando que los datos se procesan localmente
- FR-PRIV2: Sistema incluye página de Privacidad accesible desde el footer con detalles del manejo de datos

### Aislamiento de Datos (Post-MVP)

> **Nota:** Requiere implementación de autenticación multi-usuario.

- FR36: Usuario solo puede ver sus propias conversaciones y datos subidos
- FR37: Admin puede ver lista de usuarios pero no puede acceder a datos de análisis de usuarios

## Requisitos No Funcionales

### Seguridad — MVP

- NFR1: Todas las comunicaciones usan HTTPS (cifrado en tránsito)
- NFR2: Credenciales de usuario manejadas por Supabase Auth (hash seguro, nunca almacenadas en código)
- NFR3: Sesión de usuario gestionada por Supabase Auth, persiste hasta cierre de sesión explícito
- NFR4: Los tokens de restablecimiento de contraseña expiran después de 24 horas (gestionado por Supabase)

### Privacidad de Datos — MVP

- NFR-PRIV1: Los archivos Excel subidos se procesan exclusivamente server-side; el contenido crudo nunca se envía a OpenAI
- NFR-PRIV2: Solo resultados estadísticos agregados (métricas, porcentajes, clasificaciones) se incluyen en el contexto del LLM
- NFR-PRIV3: Supabase Storage cifra archivos en reposo (AES-256)
- NFR-PRIV4: La plataforma muestra información clara sobre manejo de datos en UI (tooltip en carga, página de privacidad)

### Seguridad — Post-MVP

- NFR5: Los usuarios no pueden acceder a datos de otros usuarios a nivel de base de datos (Row Level Security)

### Confiabilidad — MVP

- NFR6: El sistema debe estar disponible durante horarios de capacitación (mejor esfuerzo para MVP)
- NFR7: Los errores del sistema muestran mensajes amigables al usuario, no stack traces
- NFR8: Las conversaciones persisten en Supabase vinculadas al usuario autenticado

### Confiabilidad — Post-MVP

- NFR9: Las conversaciones se aíslan por cuenta de usuario individual

### Integraciones Externas — MVP

- NFR10: El sistema maneja graciosamente la indisponibilidad de OpenAI API (muestra mensaje de reintento)
- NFR11: El sistema maneja graciosamente errores de la tool de análisis Python (muestra mensaje descriptivo al usuario)

### Almacenamiento de Archivos — MVP

- NFR12: Los archivos subidos se almacenan en Supabase Storage vinculados a la conversación
- NFR13: Los archivos son accesibles y descargables desde el historial de conversaciones

### Integraciones Externas — Post-MVP

- NFR14: El sistema maneja graciosamente fallos de envío de correo via Supabase
