---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - prd.md
  - ux-design-specification.md
  - ux-design-directions.html
workflowType: 'architecture'
project_name: 'Setec AI Hub - LLM'
user_name: 'Setec'
date: '2026-02-02'
lastStep: 8
status: 'complete'
completedAt: '2026-02-03'
---

# Documento de Decisiones de Arquitectura

_Este documento se construye colaborativamente a través de descubrimiento paso a paso. Las secciones se agregan mientras trabajamos juntos en cada decisión arquitectónica._

## Análisis del Contexto del Proyecto

### Resumen de Requisitos

**Requisitos Funcionales:**
- **Autenticación (FR1-FR4):** Supabase Auth con email/contraseña, usuario único en MVP, flujo de recuperación de contraseña
- **Arquitectura de Agentes (FR-AGT1-FR-AGT6):** Sistema de dos agentes—Filtro (clasificación con structured output) + Principal (conversación + invocación de herramientas)
- **Interfaz de Chat (FR13-FR20):** Estilo ChatGPT con barra lateral de historial, carga de archivos, preguntas de seguimiento, persistencia en Supabase
- **Sección de Plantillas (FR26-FR27):** Página separada para descarga de plantilla MSA
- **Herramienta de Análisis (FR-TOOL1-FR-TOOL7):** Endpoint único (`POST /api/analyze`), validación y cálculo en Python, salida JSON estructurada
- **Interpretación por IA (FR32-FR35, FR-INT1-FR-INT3):** El LLM presenta resultados siguiendo instrucciones de la herramienta, gráficos interactivos en frontend
- **Transparencia de Privacidad (FR-PRIV1-FR-PRIV2):** Tooltip en zona de carga, página de privacidad en footer

**Requisitos No Funcionales:**
- **Seguridad (NFR1-NFR4):** HTTPS, seguridad de Supabase Auth, gestión de sesiones, expiración de tokens
- **Privacidad de Datos (NFR-PRIV1-NFR-PRIV4):** Archivos procesados solo en servidor, resultados agregados al LLM, AES-256 en reposo, comunicación clara al usuario
- **Confiabilidad (NFR6-NFR8):** Disponibilidad mejor esfuerzo, mensajes de error amigables, persistencia de conversaciones
- **Integraciones Externas (NFR10-NFR11):** Manejo gracioso de fallos de API de OpenAI y herramienta Python

**Escala y Complejidad:**
- Dominio primario: Aplicación web full-stack (Next.js frontend + backend de cómputo Python)
- Nivel de complejidad: Medio
- Componentes arquitectónicos estimados: ~8-10 (Auth, Chat UI, Sidebar, Plantillas, Carga de Archivos, Rutas API, Servicio de Análisis Python, Integración Supabase, Manejador de Streaming)

### Restricciones Técnicas y Dependencias

| Restricción | Fuente | Implicación |
|-------------|--------|-------------|
| OpenAI como único LLM | Decisión PRD | Sin abstracción multi-proveedor; usar SDK de OpenAI directamente |
| Tier gratuito de Supabase | Restricción PRD | Límites de 500MB DB, 1GB storage; monitorear uso |
| Python para cómputo | Decisión PRD | Necesita runtime Python (función serverless o servicio separado) |
| Idioma español | Requisito PRD | Toda la UI, errores, respuestas del agente en español |
| Desktop-first | Decisión UX | Optimizar para 1024px+; móvil solo visualización |
| Usuario único MVP | Alcance PRD | Sin RLS necesario inicialmente; simplifica flujo de auth |

### Preocupaciones Transversales Identificadas

1. **Frontera de Privacidad de Datos:** Carga de archivo → procesamiento Python → salida estructurada. El contenido crudo del archivo nunca debe entrar al contexto del LLM. La arquitectura debe imponer esto a nivel de API.

2. **Localización de Mensajes de Error:** Todos los errores visibles al usuario (validación, red, servidor) deben estar en español con guía específica y accionable.

3. **Gestión de Estado de Conversación:** Mensajes, referencias a archivos, salidas de herramientas y gráficos renderizados deben persistir y recargarse correctamente.

4. **Arquitectura de Respuestas en Streaming:** La interpretación del agente debe transmitirse al frontend para percepción de velocidad.

5. **Ciclo de Vida de Almacenamiento de Archivos:** Archivos subidos almacenados en Supabase Storage, vinculados a conversaciones, accesibles para re-descarga.

### Alcance de Configuración de Infraestructura

Este documento de arquitectura incluirá configuración detallada para:

**Supabase:**
- Esquema de base de datos (tablas, tipos, relaciones, índices)
- Políticas RLS (Row Level Security) para aislamiento de datos
- Configuración de Storage (buckets, políticas de acceso a archivos)
- Configuración de Auth (proveedores, URLs de redirección, configuración de sesión)
- Plantillas de email (bienvenida, recuperación de contraseña)

**Vercel:**
- Variables de entorno (desarrollo, preview, producción)
- Configuración de build y deploy
- Configuración de dominio y SSL
- Límites y timeouts de funciones serverless

## Evaluación de Plantilla de Inicio

### Dominio Tecnológico Primario

Aplicación web full-stack basada en:
- **Framework:** Next.js 16 con App Router y Turbopack
- **UI Components:** shadcn/ui + Tailwind CSS 4
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Cómputo Estadístico:** Python serverless functions
- **Hosting:** Vercel

### Opciones de Starter Consideradas

1. **Vercel + Supabase Template** — Oficial pero sin shadcn/ui preconfigurado
2. **Community starters (supa-next-starter)** — Completos pero riesgo de desactualización
3. **Enfoque modular (recomendado)** — Control total sobre cada componente

### Starter Seleccionado: Enfoque Modular

**Justificación:**
- Control sobre versiones exactas de dependencias
- Documentación oficial disponible para cada componente
- Evita dependencia de plantillas de terceros que pueden desactualizarse
- Permite configuración precisa para requisitos de privacidad (Python aislado del LLM)

**Comando de Inicialización:**

```bash
# 1. Crear proyecto Next.js 16 con defaults
npx create-next-app@latest setec-ai-hub --typescript --tailwind --eslint --app --turbopack

# 2. Instalar dependencias de Supabase
cd setec-ai-hub
npm install @supabase/supabase-js @supabase/ssr

# 3. Instalar shadcn/ui
npx shadcn@latest init

# 4. Instalar componentes shadcn/ui necesarios
npx shadcn@latest add button input card avatar dropdown-menu toast scroll-area separator badge skeleton dialog
```

### Decisiones Arquitectónicas del Starter

**Lenguaje y Runtime:**
- TypeScript 5.x (strict mode habilitado por default)
- Node.js 20.x para Next.js
- Python 3.11+ para funciones de análisis

**Solución de Estilos:**
- Tailwind CSS 4 (configuración por defecto de Next.js 16)
- CSS variables para tema de shadcn/ui
- Tokens de color Setec integrados en tailwind.config.ts

**Herramientas de Build:**
- Turbopack (estable en Next.js 16, default para dev y build)
- ESLint con configuración de Next.js
- PostCSS para Tailwind

**Framework de Testing:**
- Por definir en decisiones arquitectónicas (Vitest recomendado)

**Organización de Código:**

```
setec-ai-hub/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Rutas de autenticación
│   ├── (dashboard)/       # Rutas protegidas
│   ├── api/               # Route Handlers (Node.js)
│   └── globals.css
├── api/                    # Python serverless functions (Vercel)
│   └── analyze.py         # Endpoint de análisis MSA
├── components/
│   ├── ui/                # Componentes shadcn/ui
│   └── chat/              # Componentes específicos del chat
├── lib/
│   ├── supabase/          # Clientes Supabase (browser + server)
│   └── openai/            # Cliente OpenAI
├── types/                  # Tipos TypeScript
└── utils/                  # Utilidades compartidas
```

**Experiencia de Desarrollo:**
- Hot reload con Turbopack (~700ms refresh)
- TypeScript con inferencia automática
- Tailwind IntelliSense en VS Code

**Nota:** La inicialización del proyecto usando estos comandos debe ser la primera historia de implementación.

## Decisiones Arquitectónicas Centrales

### Resumen de Decisiones

| Categoría | Decisión | Justificación |
|-----------|----------|---------------|
| **Eliminación de datos** | Hard delete inmediato | Privacidad máxima, simplicidad |
| **Streaming** | Server-Sent Events (SSE) | Gratis en Vercel, nativo de OpenAI SDK |
| **Gráficos** | Recharts | Ligero (~45KB), documentación excelente |
| **Estado servidor** | TanStack Query | Caching automático, fetching declarativo |
| **Estado cliente** | React Context | Suficiente para auth state, sin complejidad extra |
| **Testing** | Vitest + Testing Library | Rápido, compatible con Vite/Turbopack |

### Arquitectura de Datos (Supabase)

#### Esquema de Base de Datos

```sql
-- ============================================
-- ESQUEMA DE BASE DE DATOS - SETEC AI HUB
-- ============================================

-- Tabla: conversations
-- Almacena las conversaciones del usuario
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: messages
-- Almacena los mensajes de cada conversación
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',  -- tool_calls, file_refs, chart_data
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: files
-- Almacena metadata de archivos subidos
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,           -- {user_id}/{conversation_id}/{file_id}.xlsx
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'validating', 'valid', 'invalid', 'processed')),
  validation_errors JSONB,              -- Errores específicos si status = 'invalid'
  validated_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: analysis_results
-- Almacena resultados computados por Python (separados de mensajes)
CREATE TABLE analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL,          -- 'msa', 'control_chart', etc.
  results JSONB NOT NULL,               -- Datos numéricos del análisis
  chart_data JSONB NOT NULL,            -- Datos estructurados para gráficos
  instructions TEXT NOT NULL,           -- Markdown de presentación para el LLM
  python_version TEXT,                  -- Versión del script para trazabilidad
  computed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: token_usage
-- Tracking de consumo de OpenAI para monitoreo de costos
CREATE TABLE token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  model TEXT NOT NULL,                  -- 'gpt-4o', 'gpt-4o-mini'
  prompt_tokens INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  estimated_cost_usd DECIMAL(10,6),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_files_conversation_id ON files(conversation_id);
CREATE INDEX idx_files_status ON files(status);
CREATE INDEX idx_analysis_results_message_id ON analysis_results(message_id);
CREATE INDEX idx_token_usage_conversation_id ON token_usage(conversation_id);

-- ============================================
-- FUNCIONES Y TRIGGERS
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para conversations
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Función para hard delete de conversación (cascading)
CREATE OR REPLACE FUNCTION delete_conversation_cascade(conversation_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- Los DELETE CASCADE manejan la mayoría, pero Storage necesita limpieza manual
  DELETE FROM conversations WHERE id = conversation_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Políticas RLS (Row Level Security)

```sql
-- ============================================
-- POLÍTICAS DE SEGURIDAD RLS
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;

-- Políticas para conversations
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para messages (basadas en ownership de conversation)
CREATE POLICY "Users can view messages in own conversations"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in own conversations"
  ON messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );

-- Políticas para files
CREATE POLICY "Users can view own files"
  ON files FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own files"
  ON files FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );

-- Políticas para analysis_results
CREATE POLICY "Users can view own analysis results"
  ON analysis_results FOR SELECT
  USING (
    message_id IN (
      SELECT m.id FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- Políticas para token_usage
CREATE POLICY "Users can view own token usage"
  ON token_usage FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );
```

#### Configuración de Storage

```sql
-- ============================================
-- CONFIGURACIÓN DE STORAGE BUCKETS
-- ============================================

-- Crear bucket para archivos de análisis
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'analysis-files',
  'analysis-files',
  false,  -- Privado
  10485760,  -- 10MB máximo por archivo
  ARRAY['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']
);

-- Política: Usuarios pueden subir archivos a su carpeta
CREATE POLICY "Users can upload to own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'analysis-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Política: Usuarios pueden ver archivos de su carpeta
CREATE POLICY "Users can view own files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'analysis-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Política: Usuarios pueden eliminar archivos de su carpeta
CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'analysis-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Estructura de paths: {user_id}/{conversation_id}/{file_id}.xlsx
```

#### Configuración de Auth

```yaml
# Configuración de Supabase Auth (Dashboard > Authentication > Settings)

# URL Configuration
site_url: https://setec-ai-hub.vercel.app
redirect_urls:
  - https://setec-ai-hub.vercel.app/auth/callback
  - http://localhost:3000/auth/callback

# Auth Providers
providers:
  email:
    enabled: true
    confirm_email: false  # MVP: usuario creado manualmente, sin confirmación
    secure_password_change: true

# Session Configuration
jwt_expiry: 3600  # 1 hora
refresh_token_rotation_enabled: true

# Rate Limiting
rate_limit:
  email_sent: 4 per hour
  sms_sent: 10 per hour
```

#### Plantillas de Email (Español)

**Recuperación de Contraseña:**
```html
<!-- Subject: Restablecer tu contraseña de Setec AI Hub -->

<h2>Restablecer Contraseña</h2>

<p>Hola,</p>

<p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en Setec AI Hub.</p>

<p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>

<p><a href="{{ .ConfirmationURL }}">Restablecer mi contraseña</a></p>

<p>Este enlace expirará en 24 horas.</p>

<p>Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña actual seguirá funcionando.</p>

<p>Saludos,<br>
El equipo de Setec AI Hub</p>

<hr>
<p style="font-size: 12px; color: #666;">
Si el enlace no funciona, copia y pega esta URL en tu navegador:<br>
{{ .ConfirmationURL }}
</p>
```

**Confirmación de Cambio de Contraseña:**
```html
<!-- Subject: Tu contraseña ha sido actualizada -->

<h2>Contraseña Actualizada</h2>

<p>Hola,</p>

<p>Te confirmamos que la contraseña de tu cuenta en Setec AI Hub ha sido actualizada exitosamente.</p>

<p>Si no realizaste este cambio, contacta inmediatamente a soporte.</p>

<p>Saludos,<br>
El equipo de Setec AI Hub</p>
```

### Configuración de Vercel

#### Variables de Entorno

```bash
# ============================================
# VARIABLES DE ENTORNO - VERCEL
# ============================================

# ----- Supabase -----
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # Solo server-side

# ----- OpenAI -----
OPENAI_API_KEY=sk-...

# ----- App Configuration -----
NEXT_PUBLIC_APP_URL=https://setec-ai-hub.vercel.app  # O dominio personalizado

# ----- Feature Flags (opcional) -----
NEXT_PUBLIC_ENABLE_ANALYTICS=false
```

**Nota sobre ambientes:**
- `Development`: Usar proyecto Supabase de desarrollo
- `Preview`: Mismo que production o proyecto de staging
- `Production`: Proyecto Supabase de producción

#### Configuración de Build (vercel.json)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "api/*.py": {
      "runtime": "python3.11",
      "maxDuration": 60
    }
  },
  "rewrites": [
    {
      "source": "/api/analyze",
      "destination": "/api/analyze.py"
    }
  ]
}
```

#### Configuración de Python Function

```python
# api/analyze.py
# Configuración de Vercel Python Runtime

"""
Vercel Python Function para análisis estadístico MSA.

Runtime: Python 3.11
Max Duration: 60 segundos
Memory: 1024 MB (default)

Dependencias en requirements.txt:
- pandas>=2.0.0
- numpy>=1.24.0
- openpyxl>=3.1.0
- supabase>=2.0.0

Note: scipy excluded due to Vercel 250MB limit.
Statistical functions implemented in pure Python.
"""

from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        # Leer body
        content_length = int(self.headers['Content-Length'])
        body = self.rfile.read(content_length)
        data = json.loads(body)

        # Procesar análisis...
        # (implementación en historias de desarrollo)

        # Responder
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()

        response = {
            "results": {},
            "chartData": [],
            "instructions": ""
        }
        self.wfile.write(json.dumps(response).encode())
```

**requirements.txt:**
```
pandas>=2.0.0
numpy>=1.24.0
openpyxl>=3.1.0
supabase>=2.0.0
```

> **Note:** scipy was intentionally excluded due to Vercel's 250MB unzipped deployment limit. All statistical functions (F-distribution, p-values) are implemented in pure Python. See "Pure Python Statistical Implementation" section below.

### Pure Python Statistical Implementation

Due to Vercel's 250MB unzipped deployment limit, scipy cannot be used in production. All statistical functions required for MSA analysis are implemented in pure Python in `/api/utils/msa_calculator.py`:

| Function | Purpose | Based On |
|----------|---------|----------|
| `_log_beta(a, b)` | Log of beta function B(a,b) | `math.lgamma` from stdlib |
| `_betacf(a, b, x)` | Continued fraction for incomplete beta | Numerical Recipes |
| `_betainc(a, b, x)` | Regularized incomplete beta function I_x(a,b) | Numerical Recipes |
| `f_distribution_sf(f, df1, df2)` | F-distribution survival function (p-value) | Beta function relationship |

**Usage:** These functions calculate p-values for ANOVA F-tests without requiring scipy.

**Constraint for Future Development:** Any additional statistical functions (e.g., Anderson-Darling test, distribution fitting, chi-square tests) must also be implemented in pure Python to stay within Vercel's deployment limits.

### API y Comunicación

#### Streaming con SSE

```typescript
// app/api/chat/route.ts
// Endpoint de chat con streaming SSE

import { OpenAI } from 'openai';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';  // Edge runtime para mejor performance

export async function POST(req: Request) {
  const { conversationId, message } = await req.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const openai = new OpenAI();

      // 1. Filtrar mensaje (Agente Filtro)
      const filterResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: FILTER_SYSTEM_PROMPT },
          { role: 'user', content: message }
        ],
        response_format: { type: 'json_object' }
      });

      const { allowed } = JSON.parse(filterResponse.choices[0].message.content);

      if (!allowed) {
        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ type: 'filtered', text: REJECTION_MESSAGE })}\n\n`
        ));
        controller.close();
        return;
      }

      // 2. Procesar con Agente Principal (streaming)
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [...conversationHistory, { role: 'user', content: message }],
        tools: AVAILABLE_TOOLS,
        stream: true,
      });

      for await (const chunk of response) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: 'text', text: content })}\n\n`
          ));
        }

        // Manejar tool calls si existen
        const toolCalls = chunk.choices[0]?.delta?.tool_calls;
        if (toolCalls) {
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: 'tool_call', data: toolCalls })}\n\n`
          ));
        }
      }

      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

#### Estructura de API Routes

```
app/api/
├── chat/
│   └── route.ts          # POST: Enviar mensaje (streaming SSE)
├── conversations/
│   ├── route.ts          # GET: Listar, POST: Crear
│   └── [id]/
│       └── route.ts      # GET: Detalle, DELETE: Eliminar
├── files/
│   ├── route.ts          # POST: Subir archivo
│   └── [id]/
│       └── route.ts      # GET: Descargar, DELETE: Eliminar
└── auth/
    └── callback/
        └── route.ts      # GET: Callback de Supabase Auth

api/                       # Python serverless (Vercel)
└── analyze.py            # POST: Análisis MSA
```

### Frontend Architecture

#### Manejo de Estado

```typescript
// lib/providers.tsx
// Configuración de providers

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/lib/auth-context';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,  // 5 minutos
      retry: 1,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

```typescript
// lib/auth-context.tsx
// Context para estado de autenticación

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

```typescript
// hooks/use-conversations.ts
// Hook para conversaciones con TanStack Query

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export function useConversations() {
  const supabase = createClient();

  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Hard delete - cascade manejado por DB
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
```

#### Librería de Gráficos (Recharts)

```typescript
// components/charts/gauge-rr-chart.tsx
// Componente de gráfico para resultados MSA

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface GaugeRRChartProps {
  data: {
    source: string;
    variation: number;
    percentage: number;
  }[];
  totalGRR: number;
}

export function GaugeRRChart({ data, totalGRR }: GaugeRRChartProps) {
  const getStatusColor = (grr: number) => {
    if (grr < 10) return '#10B981';  // Verde - Aceptable
    if (grr < 30) return '#F59E0B';  // Amarillo - Marginal
    return '#EF4444';                 // Rojo - Inaceptable
  };

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" domain={[0, 100]} unit="%" />
          <YAxis type="category" dataKey="source" width={120} />
          <Tooltip
            formatter={(value: number) => [`${value.toFixed(1)}%`, 'Variación']}
          />
          <Legend />
          <Bar
            dataKey="percentage"
            fill={getStatusColor(totalGRR)}
            name="% de Variación Total"
          />
          <ReferenceLine x={10} stroke="#10B981" strokeDasharray="5 5" />
          <ReferenceLine x={30} stroke="#EF4444" strokeDasharray="5 5" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### Dependencias del Proyecto

```json
{
  "dependencies": {
    "next": "16.1.6",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "@supabase/supabase-js": "^2.94.0",
    "@supabase/ssr": "^0.8.0",
    "openai": "^6.17.0",
    "@tanstack/react-query": "^5.90.20",
    "recharts": "^3.7.0",
    "zod": "^3.25.76",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.4.0",
    "lucide-react": "^0.563.0",
    "@hookform/resolvers": "^5.2.2",
    "@radix-ui/react-label": "^2.1.8",
    "@tailwindcss/typography": "^0.5.19",
    "date-fns": "^4.1.0",
    "next-themes": "^0.4.6",
    "react-hook-form": "^7.71.1",
    "react-markdown": "^10.1.0",
    "sonner": "^2.0.7"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@tailwindcss/postcss": "^4",
    "tailwindcss": "^4",
    "eslint": "^9",
    "eslint-config-next": "16.1.6",
    "vitest": "^4.0.18",
    "@testing-library/react": "^16.3.2",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/user-event": "^14.6.1",
    "@vitejs/plugin-react": "^5.1.3",
    "jsdom": "^28.0.0"
  }
}

## Patrones de Implementación y Reglas de Consistencia

### Puntos de Conflicto Identificados

**8 áreas críticas** donde diferentes agentes IA podrían tomar decisiones diferentes que causarían conflictos de integración:

1. Convenciones de nombrado de base de datos
2. Formato de endpoints API
3. Nombrado de archivos y componentes
4. Estructura de respuestas API
5. Formato de fechas y timestamps
6. Patrones de manejo de errores
7. Convenciones de query keys (TanStack Query)
8. Estructura de mensajes de usuario

### Patrones de Nombrado

#### Base de Datos (PostgreSQL/Supabase)

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| Tablas | snake_case, plural | `conversations`, `analysis_results` |
| Columnas | snake_case | `user_id`, `created_at`, `storage_path` |
| Claves foráneas | tabla_singular_id | `conversation_id`, `message_id` |
| Índices | idx_tabla_columna | `idx_conversations_user_id` |
| Triggers | trigger_accion_tabla | `update_conversations_updated_at` |
| Funciones | snake_case_verbo | `delete_conversation_cascade` |

#### API Endpoints

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| Rutas | kebab-case, plural | `/api/conversations`, `/api/files` |
| Parámetros de ruta | [id] | `/api/conversations/[id]` |
| Query params | camelCase | `?conversationId=xxx&limit=10` |
| Headers custom | X-Prefijo-Nombre | `X-Request-Id` |

#### TypeScript/React

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| Componentes | PascalCase | `ChatMessage`, `GaugeRRChart` |
| Archivos componentes | PascalCase.tsx | `ChatMessage.tsx` |
| Hooks | camelCase con use | `useConversations`, `useAuth` |
| Archivos hooks | use-nombre.ts | `use-conversations.ts` |
| Utilidades | camelCase | `formatDate`, `parseAnalysisResult` |
| Archivos utilidades | kebab-case.ts | `date-utils.ts`, `api-helpers.ts` |
| Tipos/Interfaces | PascalCase | `Conversation`, `AnalysisResult` |
| Archivos tipos | kebab-case.ts | `conversation-types.ts` |
| Constantes | SCREAMING_SNAKE_CASE | `MAX_FILE_SIZE`, `API_TIMEOUT` |

### Patrones de Estructura

#### Organización de Carpetas

```
setec-ai-hub/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Grupo: rutas de autenticación
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── recuperar-password/
│   │       └── page.tsx
│   ├── (dashboard)/              # Grupo: rutas protegidas
│   │   ├── layout.tsx            # Layout con sidebar
│   │   ├── page.tsx              # Dashboard principal (chat)
│   │   ├── plantillas/
│   │   │   └── page.tsx
│   │   └── privacidad/
│   │       └── page.tsx
│   ├── api/                      # Route Handlers (Node.js)
│   │   ├── chat/
│   │   │   └── route.ts
│   │   ├── conversations/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── files/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   └── auth/
│   │       └── callback/
│   │           └── route.ts
│   ├── globals.css
│   └── layout.tsx                # Root layout
├── api/                          # Python serverless (Vercel)
│   ├── analyze.py
│   └── requirements.txt
├── components/
│   ├── ui/                       # Componentes shadcn/ui
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── chat/                     # Componentes de chat
│   │   ├── ChatContainer.tsx
│   │   ├── ChatMessage.tsx
│   │   ├── ChatInput.tsx
│   │   ├── FileUpload.tsx
│   │   └── StreamingMessage.tsx
│   ├── charts/                   # Componentes de gráficos
│   │   ├── GaugeRRChart.tsx
│   │   └── VariationChart.tsx
│   ├── layout/                   # Componentes de layout
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── ConversationList.tsx
│   └── auth/                     # Componentes de autenticación
│       ├── LoginForm.tsx
│       └── PasswordResetForm.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Cliente browser
│   │   ├── server.ts             # Cliente server
│   │   └── middleware.ts         # Auth middleware
│   ├── openai/
│   │   ├── client.ts
│   │   ├── prompts.ts            # System prompts
│   │   └── tools.ts              # Tool definitions
│   └── utils/
│       ├── date-utils.ts
│       ├── file-utils.ts
│       └── error-utils.ts
├── hooks/
│   ├── use-conversations.ts
│   ├── use-messages.ts
│   ├── use-files.ts
│   ├── use-streaming.ts
│   └── use-auth.ts
├── types/
│   ├── database.ts               # Tipos generados de Supabase
│   ├── api.ts                    # Tipos de API
│   ├── chat.ts                   # Tipos de chat
│   └── analysis.ts               # Tipos de análisis
├── constants/
│   ├── api.ts                    # Constantes de API
│   ├── messages.ts               # Mensajes UI (español)
│   └── analysis.ts               # Constantes de análisis
├── tests/
│   ├── components/               # Tests de componentes
│   ├── hooks/                    # Tests de hooks
│   ├── api/                      # Tests de API routes
│   └── utils/                    # Tests de utilidades
├── public/
│   ├── logo.svg
│   └── templates/
│       └── plantilla-msa.xlsx
└── [archivos raíz]
    ├── package.json
    ├── next.config.ts
    ├── tailwind.config.ts
    ├── tsconfig.json
    ├── vercel.json
    ├── .env.local
    ├── .env.example
    └── .gitignore
```

#### Ubicación de Tests

Los tests se ubican **co-located** junto al archivo que prueban:

```
components/chat/
├── ChatMessage.tsx
├── ChatMessage.test.tsx    ← Test junto al componente
├── ChatInput.tsx
└── ChatInput.test.tsx

hooks/
├── use-conversations.ts
└── use-conversations.test.ts
```

**Excepción:** Tests de integración y E2E van en `/tests/e2e/`

### Patrones de Formato

#### Estructura de Respuestas API

Todas las API routes DEBEN usar esta estructura:

```typescript
// Respuesta exitosa
interface ApiSuccessResponse<T> {
  data: T;
  error: null;
}

// Respuesta de error
interface ApiErrorResponse {
  data: null;
  error: {
    code: string;      // 'VALIDATION_ERROR', 'NOT_FOUND', etc.
    message: string;   // Mensaje en español para el usuario
    details?: unknown; // Detalles técnicos (solo en desarrollo)
  };
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
```

**Ejemplo de implementación:**

```typescript
// app/api/conversations/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const conversations = await getConversations();
    return NextResponse.json({ data: conversations, error: null });
  } catch (error) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'FETCH_ERROR',
          message: 'No se pudieron cargar las conversaciones. Intenta de nuevo.',
        },
      },
      { status: 500 }
    );
  }
}
```

#### Formato de Fechas

```typescript
// lib/utils/date-utils.ts

// Para API/JSON: siempre ISO 8601
export const toISOString = (date: Date): string => date.toISOString();
// Output: "2026-02-03T14:30:00.000Z"

// Para UI: formato español
export const formatDisplayDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};
// Output: "3 feb 2026"

// Para timestamps en sidebar
export const formatRelativeTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;
  return formatDisplayDate(d);
};
```

### Patrones de Comunicación

#### Query Keys (TanStack Query)

Estructura jerárquica consistente para todas las query keys:

```typescript
// lib/query-keys.ts

export const queryKeys = {
  // Conversaciones
  conversations: {
    all: ['conversations'] as const,
    list: () => [...queryKeys.conversations.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.conversations.all, 'detail', id] as const,
  },

  // Mensajes
  messages: {
    all: ['messages'] as const,
    byConversation: (conversationId: string) =>
      [...queryKeys.messages.all, 'conversation', conversationId] as const,
  },

  // Archivos
  files: {
    all: ['files'] as const,
    byConversation: (conversationId: string) =>
      [...queryKeys.files.all, 'conversation', conversationId] as const,
    detail: (id: string) => [...queryKeys.files.all, 'detail', id] as const,
  },

  // Resultados de análisis
  analysis: {
    all: ['analysis'] as const,
    byMessage: (messageId: string) =>
      [...queryKeys.analysis.all, 'message', messageId] as const,
  },
} as const;
```

**Uso en hooks:**

```typescript
// hooks/use-conversations.ts
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';

export function useConversations() {
  return useQuery({
    queryKey: queryKeys.conversations.list(),
    queryFn: fetchConversations,
  });
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: queryKeys.conversations.detail(id),
    queryFn: () => fetchConversation(id),
    enabled: !!id,
  });
}
```

### Patrones de Proceso

#### Manejo de Errores

```typescript
// lib/utils/error-utils.ts

// Códigos de error estándar
export const ERROR_CODES = {
  // Validación
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',

  // Autenticación
  UNAUTHORIZED: 'UNAUTHORIZED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // Recursos
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',

  // Servicios externos
  OPENAI_ERROR: 'OPENAI_ERROR',
  ANALYSIS_ERROR: 'ANALYSIS_ERROR',

  // Genéricos
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;

// Mensajes en español para el usuario
export const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.VALIDATION_ERROR]: 'Los datos proporcionados no son válidos.',
  [ERROR_CODES.INVALID_FILE_TYPE]: 'Solo se permiten archivos Excel (.xlsx).',
  [ERROR_CODES.FILE_TOO_LARGE]: 'El archivo excede el tamaño máximo de 10MB.',
  [ERROR_CODES.UNAUTHORIZED]: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
  [ERROR_CODES.SESSION_EXPIRED]: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
  [ERROR_CODES.NOT_FOUND]: 'El recurso solicitado no existe.',
  [ERROR_CODES.OPENAI_ERROR]: 'Hubo un problema al procesar tu solicitud. Intenta de nuevo.',
  [ERROR_CODES.ANALYSIS_ERROR]: 'No se pudo completar el análisis. Verifica el formato del archivo.',
  [ERROR_CODES.INTERNAL_ERROR]: 'Ocurrió un error inesperado. Intenta de nuevo más tarde.',
  [ERROR_CODES.NETWORK_ERROR]: 'No hay conexión a internet. Verifica tu conexión.',
};

// Helper para crear errores consistentes
export function createApiError(code: keyof typeof ERROR_CODES, customMessage?: string) {
  return {
    code,
    message: customMessage || ERROR_MESSAGES[code] || ERROR_MESSAGES.INTERNAL_ERROR,
  };
}
```

#### Estados de Carga

```typescript
// Convención: usar estados explícitos, no booleanos múltiples
type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// En componentes, usar estados de TanStack Query
const { data, isLoading, isError, error } = useConversations();

// Para operaciones locales
const [uploadState, setUploadState] = useState<LoadingState>('idle');
```

### Reglas de Aplicación

**Todos los Agentes IA DEBEN:**

1. ✅ Usar snake_case para TODA la nomenclatura de base de datos
2. ✅ Usar kebab-case para rutas API, PascalCase para componentes
3. ✅ Retornar `{ data, error }` en TODAS las respuestas API
4. ✅ Usar ISO 8601 para fechas en JSON, formato español en UI
5. ✅ Seguir la estructura de query keys definida
6. ✅ Usar los códigos y mensajes de error estándar
7. ✅ Escribir TODOS los mensajes de usuario en español
8. ✅ Ubicar tests en `/tests/` siguiendo estructura espejo

**Verificación de Patrones:**

- Pre-commit hooks verifican nombrado de archivos
- ESLint rules verifican convenciones de código
- TypeScript strict mode previene inconsistencias de tipos

**Proceso de Actualización:**

1. Proponer cambio de patrón en PR
2. Actualizar este documento
3. Actualizar cualquier código existente afectado
4. Agregar/modificar reglas de linting si aplica

### Ejemplos y Anti-Patrones

#### ✅ Correcto

```typescript
// Nombre de archivo: use-conversations.ts
// Query key estructurada
const { data } = useQuery({
  queryKey: queryKeys.conversations.list(),
  queryFn: fetchConversations,
});

// Respuesta API consistente
return NextResponse.json({ data: conversations, error: null });

// Mensaje de error en español
toast.error('No se pudo guardar la conversación.');
```

#### ❌ Incorrecto

```typescript
// Nombre de archivo: useConversations.ts (debería ser kebab-case)
// Query key ad-hoc
const { data } = useQuery({
  queryKey: ['getConversations'], // Debería usar queryKeys
  queryFn: fetchConversations,
});

// Respuesta API inconsistente
return NextResponse.json(conversations); // Falta wrapper { data, error }

// Mensaje en inglés
toast.error('Could not save conversation.'); // Debe ser español
```
```

## Estructura del Proyecto y Límites Arquitectónicos

### Estructura Completa del Proyecto

```
setec-ai-hub/
│
├── ═══════════════════════════════════════════════════
│   ARCHIVOS DE CONFIGURACIÓN RAÍZ
├── ═══════════════════════════════════════════════════
├── package.json                    # Dependencias y scripts npm
├── package-lock.json               # Lockfile de dependencias
├── next.config.ts                  # Configuración de Next.js 16
├── tailwind.config.ts              # Configuración de Tailwind CSS 4
├── postcss.config.mjs              # Configuración de PostCSS
├── tsconfig.json                   # Configuración de TypeScript
├── vitest.config.ts                # Configuración de Vitest
├── vercel.json                     # Configuración de deploy Vercel
├── .env.local                      # Variables de entorno locales (gitignore)
├── .env.example                    # Template de variables de entorno
├── .gitignore                      # Archivos ignorados por git
├── .eslintrc.json                  # Configuración de ESLint
├── .prettierrc                     # Configuración de Prettier
├── README.md                       # Documentación del proyecto
│
├── ═══════════════════════════════════════════════════
│   PYTHON SERVERLESS (Vercel Runtime)
├── ═══════════════════════════════════════════════════
├── api/                            # ⚠️ Carpeta raíz para Python (NO en app/)
│   ├── analyze.py                  # Endpoint POST /api/analyze
│   ├── requirements.txt            # Dependencias Python
│   └── utils/                      # Utilidades compartidas Python
│       ├── __init__.py
│       ├── msa_calculator.py       # Cálculos MSA
│       └── validators.py           # Validación de archivos Excel
│
├── ═══════════════════════════════════════════════════
│   NEXT.JS APP ROUTER
├── ═══════════════════════════════════════════════════
├── app/
│   ├── globals.css                 # Estilos globales + CSS variables
│   ├── layout.tsx                  # Root layout (providers, fonts)
│   ├── error.tsx                   # Error boundary global
│   │
│   ├── (auth)/                     # 🔓 Grupo: rutas públicas (sin sidebar)
│   │   ├── layout.tsx              # Layout centrado para auth
│   │   ├── login/
│   │   │   └── page.tsx            # FR1: Página de login
│   │   └── recuperar-password/
│   │       ├── page.tsx            # FR4: Solicitar reset
│   │       └── confirmar/
│   │           └── page.tsx        # FR4: Establecer nueva contraseña
│   │
│   ├── (dashboard)/                # 🔒 Grupo: rutas protegidas (con sidebar)
│   │   ├── layout.tsx              # Layout con sidebar + header
│   │   ├── page.tsx                # FR13: Dashboard principal (chat)
│   │   ├── conversacion/
│   │   │   └── [id]/
│   │   │       └── page.tsx        # FR19: Vista de conversación existente
│   │   ├── plantillas/
│   │   │   └── page.tsx            # FR26-27: Descarga de plantillas
│   │   └── privacidad/
│   │       └── page.tsx            # FR-PRIV2: Página de privacidad
│   │
│   └── api/                        # Route Handlers (Node.js)
│       ├── chat/
│       │   └── route.ts            # FR-AGT1-6: Streaming SSE + agentes
│       ├── conversations/
│       │   ├── route.ts            # GET: Listar, POST: Crear
│       │   └── [id]/
│       │       └── route.ts        # GET: Detalle, DELETE: Eliminar
│       ├── files/
│       │   ├── route.ts            # POST: Subir archivo
│       │   └── [id]/
│       │       └── route.ts        # GET: Descargar
│       └── auth/
│           └── callback/
│               └── route.ts        # Callback de Supabase Auth
│
├── ═══════════════════════════════════════════════════
│   COMPONENTES (con tests co-located)
├── ═══════════════════════════════════════════════════
├── components/
│   ├── ui/                         # shadcn/ui (NO MODIFICAR DIRECTAMENTE)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── avatar.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── toast.tsx
│   │   ├── toaster.tsx
│   │   ├── scroll-area.tsx
│   │   ├── separator.tsx
│   │   ├── badge.tsx
│   │   ├── skeleton.tsx
│   │   ├── dialog.tsx
│   │   ├── tooltip.tsx
│   │   └── index.ts                # Barrel export
│   │
│   ├── chat/                       # FR13-20: Componentes de chat
│   │   ├── ChatContainer.tsx
│   │   ├── ChatContainer.test.tsx  # ← Test co-located
│   │   ├── ChatMessage.tsx
│   │   ├── ChatMessage.test.tsx
│   │   ├── ChatInput.tsx
│   │   ├── ChatInput.test.tsx
│   │   ├── FileUpload.tsx          # FR-PRIV1: Upload con tooltip privacidad
│   │   ├── FileUpload.test.tsx
│   │   ├── StreamingMessage.tsx
│   │   ├── ToolCallIndicator.tsx
│   │   ├── MessageSkeleton.tsx
│   │   └── index.ts                # Barrel export
│   │
│   ├── charts/                     # FR-INT1-3: Componentes de gráficos
│   │   ├── GaugeRRChart.tsx
│   │   ├── GaugeRRChart.test.tsx
│   │   ├── VariationChart.tsx
│   │   ├── ChartContainer.tsx
│   │   └── index.ts
│   │
│   ├── layout/                     # Componentes de layout
│   │   ├── Sidebar.tsx
│   │   ├── Sidebar.test.tsx
│   │   ├── Header.tsx
│   │   ├── ConversationList.tsx
│   │   ├── ConversationItem.tsx
│   │   ├── NewChatButton.tsx
│   │   └── index.ts
│   │
│   ├── auth/                       # Componentes de autenticación
│   │   ├── LoginForm.tsx
│   │   ├── LoginForm.test.tsx
│   │   ├── PasswordResetForm.tsx
│   │   ├── PasswordConfirmForm.tsx
│   │   └── index.ts
│   │
│   └── common/                     # Componentes compartidos
│       ├── ErrorMessage.tsx
│       ├── LoadingSpinner.tsx
│       ├── PrivacyTooltip.tsx
│       └── index.ts
│
├── ═══════════════════════════════════════════════════
│   LÓGICA DE NEGOCIO
├── ═══════════════════════════════════════════════════
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Cliente para browser (createBrowserClient)
│   │   ├── server.ts               # Cliente para server components
│   │   ├── middleware.ts           # Cliente para middleware
│   │   └── admin.ts                # Cliente con service role (solo server)
│   │
│   ├── openai/
│   │   ├── client.ts               # Instancia de OpenAI
│   │   ├── prompts.ts              # System prompts (filtro + principal)
│   │   ├── tools.ts                # Definición de tools (analyze)
│   │   └── streaming.ts            # Helpers para SSE
│   │
│   ├── api/
│   │   ├── response.ts             # Helpers { data, error }
│   │   └── errors.ts               # Clase de errores API
│   │
│   ├── providers/
│   │   ├── Providers.tsx           # Wrapper de todos los providers
│   │   ├── QueryProvider.tsx       # TanStack Query provider
│   │   └── AuthProvider.tsx        # Context de autenticación
│   │
│   └── utils/
│       ├── cn.ts                   # clsx + tailwind-merge
│       ├── date-utils.ts           # Formateo de fechas
│       ├── date-utils.test.ts      # ← Test co-located
│       ├── file-utils.ts           # Validación de archivos
│       └── storage-utils.ts        # Helpers de Supabase Storage
│
├── ═══════════════════════════════════════════════════
│   HOOKS (con tests co-located)
├── ═══════════════════════════════════════════════════
├── hooks/
│   ├── use-auth.ts                 # Hook de autenticación (context)
│   ├── use-conversations.ts        # CRUD de conversaciones
│   ├── use-conversations.test.ts   # ← Test co-located
│   ├── use-messages.ts             # Mensajes de una conversación
│   ├── use-files.ts                # Upload/download de archivos
│   ├── use-streaming.ts            # Consumir SSE del chat
│   ├── use-streaming.test.ts
│   ├── use-toast.ts                # Hook de notificaciones
│   └── index.ts
│
├── ═══════════════════════════════════════════════════
│   TIPOS
├── ═══════════════════════════════════════════════════
├── types/
│   ├── database.ts                 # Tipos generados de Supabase
│   ├── api.ts                      # ApiResponse, ApiError
│   ├── chat.ts                     # Message, Conversation, StreamChunk
│   ├── analysis.ts                 # AnalysisResult, ChartData, MSAResult
│   ├── auth.ts                     # User, Session
│   └── index.ts
│
├── ═══════════════════════════════════════════════════
│   CONSTANTES
├── ═══════════════════════════════════════════════════
├── constants/
│   ├── api.ts                      # API_TIMEOUT, MAX_FILE_SIZE
│   ├── messages.ts                 # ERROR_MESSAGES, UI_MESSAGES (español)
│   ├── analysis.ts                 # MSA_THRESHOLDS, ANALYSIS_TYPES
│   └── query-keys.ts               # Query keys para TanStack Query
│
├── ═══════════════════════════════════════════════════
│   MIDDLEWARE
├── ═══════════════════════════════════════════════════
├── middleware.ts                   # Auth middleware (protección de rutas)
│
├── ═══════════════════════════════════════════════════
│   TESTS (solo E2E e integración)
├── ═══════════════════════════════════════════════════
├── tests/
│   ├── setup.ts                    # Configuración global de Vitest
│   ├── __mocks__/                  # Mocks globales
│   │   ├── supabase.ts
│   │   └── openai.ts
│   └── e2e/                        # Tests end-to-end (Playwright futuro)
│       └── auth.spec.ts
│
├── ═══════════════════════════════════════════════════
│   ASSETS PÚBLICOS
├── ═══════════════════════════════════════════════════
└── public/
    ├── logo.svg                    # Logo de Setec
    ├── favicon.ico                 # Favicon
    └── templates/
        └── plantilla-msa.xlsx      # FR26: Plantilla descargable MSA
```

### Límites Arquitectónicos

#### Límites de API

| Límite | Descripción | Archivos Clave |
|--------|-------------|----------------|
| **Auth Boundary** | Supabase Auth maneja toda autenticación | `lib/supabase/`, `middleware.ts` |
| **Chat Boundary** | SSE streaming aislado del resto de API | `app/api/chat/route.ts` |
| **Analysis Boundary** | Python completamente aislado de Node.js | `api/analyze.py` (separado de `app/api/`) |
| **Storage Boundary** | Archivos en Supabase Storage con RLS | `app/api/files/`, `lib/utils/storage-utils.ts` |

#### Límites de Componentes

| Límite | Descripción | Patrón de Comunicación |
|--------|-------------|------------------------|
| **UI Components** | shadcn/ui sin modificar | Props directos |
| **Feature Components** | Chat, Charts, Auth | Hooks + Context |
| **Layout Components** | Sidebar, Header | Props + Auth Context |

#### Límites de Datos

| Límite | Descripción | Patrón |
|--------|-------------|--------|
| **Server State** | Conversaciones, Mensajes, Archivos | TanStack Query |
| **Client State** | Auth, UI state | React Context |
| **Form State** | Login, Chat input | React state local |

### Mapeo de Requisitos a Estructura

#### Autenticación (FR1-FR4)

| Requisito | Archivo(s) |
|-----------|------------|
| FR1: Login email/password | `app/(auth)/login/page.tsx`, `components/auth/LoginForm.tsx` |
| FR2: Sesión persistente | `lib/supabase/middleware.ts`, `middleware.ts` |
| FR3: Logout | `components/layout/Header.tsx`, `hooks/use-auth.ts` |
| FR4: Recuperar contraseña | `app/(auth)/recuperar-password/`, `components/auth/PasswordResetForm.tsx` |

#### Interfaz de Chat (FR13-FR20)

| Requisito | Archivo(s) |
|-----------|------------|
| FR13: Interfaz estilo ChatGPT | `app/(dashboard)/page.tsx`, `components/chat/ChatContainer.tsx` |
| FR14: Enviar mensaje | `components/chat/ChatInput.tsx`, `app/api/chat/route.ts` |
| FR15: Streaming de respuesta | `hooks/use-streaming.ts`, `components/chat/StreamingMessage.tsx` |
| FR16: Subir archivo | `components/chat/FileUpload.tsx`, `app/api/files/route.ts` |
| FR19: Historial de conversaciones | `components/layout/Sidebar.tsx`, `hooks/use-conversations.ts` |
| FR20: Eliminar conversación | `hooks/use-conversations.ts` (useDeleteConversation) |

#### Arquitectura de Agentes (FR-AGT1-FR-AGT6)

| Requisito | Archivo(s) |
|-----------|------------|
| FR-AGT1: Agente Filtro | `lib/openai/prompts.ts` (FILTER_SYSTEM_PROMPT) |
| FR-AGT2: Agente Principal | `lib/openai/prompts.ts` (MAIN_SYSTEM_PROMPT) |
| FR-AGT3: Tool de análisis | `lib/openai/tools.ts`, `api/analyze.py` |
| FR-AGT5: Streaming | `app/api/chat/route.ts`, `lib/openai/streaming.ts` |

#### Tool de Análisis (FR-TOOL1-FR-TOOL7)

| Requisito | Archivo(s) |
|-----------|------------|
| FR-TOOL1: Validación de archivo | `api/utils/validators.py` |
| FR-TOOL2: Cálculos MSA | `api/utils/msa_calculator.py` |
| FR-TOOL3: Datos de gráficos | `api/analyze.py` (chartData output) |
| FR-TOOL4: Instrucciones | `api/analyze.py` (instructions output) |

#### Privacidad (FR-PRIV1-FR-PRIV2)

| Requisito | Archivo(s) |
|-----------|------------|
| FR-PRIV1: Tooltip en zona de carga | `components/chat/FileUpload.tsx`, `components/common/PrivacyTooltip.tsx` |
| FR-PRIV2: Página de privacidad | `app/(dashboard)/privacidad/page.tsx` |

### Puntos de Integración

#### Comunicación Interna

```
┌──────────────────┐     hooks/use-*.ts      ┌──────────────────┐
│   Componentes    │ ◄─────────────────────► │  TanStack Query  │
│   React          │                         │  (Server State)  │
└──────────────────┘                         └────────┬─────────┘
                                                      │
                                                      │ fetch
                                                      ▼
┌──────────────────┐                         ┌──────────────────┐
│  Auth Context    │ ◄─────────────────────► │  Route Handlers  │
│  (Client State)  │     supabase client     │  app/api/        │
└──────────────────┘                         └────────┬─────────┘
                                                      │
                                                      │ internal
                                                      ▼
                                             ┌──────────────────┐
                                             │  Supabase        │
                                             │  (DB + Storage)  │
                                             └──────────────────┘
```

#### Integraciones Externas

| Servicio | Punto de Integración | Archivo(s) |
|----------|---------------------|------------|
| **OpenAI API** | Chat completions + streaming | `lib/openai/client.ts`, `app/api/chat/route.ts` |
| **Supabase Auth** | Login, session, password reset | `lib/supabase/`, `middleware.ts` |
| **Supabase DB** | Conversations, messages, files | `hooks/use-conversations.ts`, route handlers |
| **Supabase Storage** | Archivos Excel | `lib/utils/storage-utils.ts`, `app/api/files/` |

#### Flujo de Datos: Análisis MSA

```
Usuario sube archivo
        │
        ▼
┌───────────────────┐
│ FileUpload.tsx    │ ──► POST /api/files ──► Supabase Storage
└───────────────────┘              │
        │                          │ file_id
        ▼                          ▼
┌───────────────────┐     ┌───────────────────┐
│ ChatInput.tsx     │ ──► │ POST /api/chat    │
│ (envía mensaje)   │     │ (streaming SSE)   │
└───────────────────┘     └─────────┬─────────┘
                                    │
                          ┌─────────▼─────────┐
                          │ Agente Filtro     │
                          │ (gpt-4o-mini)     │
                          └─────────┬─────────┘
                                    │ allowed: true
                          ┌─────────▼─────────┐
                          │ Agente Principal  │
                          │ (gpt-4o + tools)  │
                          └─────────┬─────────┘
                                    │ tool_call: analyze
                          ┌─────────▼─────────┐
                          │ POST /api/analyze │
                          │ (Python)          │
                          └─────────┬─────────┘
                                    │
                                    │ { results, chartData, instructions }
                                    │
                          ┌─────────▼─────────┐
                          │ Agente presenta   │
                          │ resultados        │
                          └─────────┬─────────┘
                                    │ streaming text + chart data
        ┌───────────────────────────▼───────────────────────────┐
        │                    Frontend                            │
        │  StreamingMessage.tsx + GaugeRRChart.tsx              │
        └───────────────────────────────────────────────────────┘
```

### Patrones de Organización de Archivos

#### Archivos de Configuración

| Archivo | Propósito |
|---------|-----------|
| `next.config.ts` | Configuración de Next.js (turbopack, transpilePackages) |
| `tailwind.config.ts` | Tema de colores Setec, tokens CSS |
| `vitest.config.ts` | Configuración de testing |
| `vercel.json` | Runtime Python, rewrites, regions |
| `tsconfig.json` | Paths aliases (@/), strict mode |
| `.env.example` | Template documentado de todas las variables |

#### Convenciones de Organización

| Tipo | Ubicación | Convención |
|------|-----------|------------|
| **Componentes** | `components/{feature}/` | PascalCase, un componente por archivo |
| **Hooks** | `hooks/` | `use-{nombre}.ts`, kebab-case |
| **Utilidades** | `lib/utils/` | `{nombre}-utils.ts`, kebab-case |
| **Tipos** | `types/` | `{dominio}.ts`, kebab-case |
| **Tests unitarios** | Junto al archivo | `{Nombre}.test.ts(x)` |
| **Tests E2E** | `tests/e2e/` | `{feature}.spec.ts` |

#### Barrel Exports

Cada carpeta de componentes incluye `index.ts` para exportaciones limpias:

```typescript
// components/chat/index.ts
export { ChatContainer } from './ChatContainer';
export { ChatMessage } from './ChatMessage';
export { ChatInput } from './ChatInput';
export { FileUpload } from './FileUpload';
```

### Integración con Workflow de Desarrollo

#### Desarrollo Local

```bash
# Terminal 1: Next.js dev server
npm run dev

# Terminal 2: Supabase local (opcional)
npx supabase start
```

#### Scripts de NPM

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test"
  }
}
```

#### Estructura de Deploy (Vercel)

```
Production Build Output:
├── .next/                  # Next.js SSR + static
├── .vercel/
│   └── output/
│       ├── functions/
│       │   ├── api/chat.func    # Node.js serverless
│       │   └── api/analyze.func # Python serverless
│       └── static/              # Static assets
└── public/                 # Archivos estáticos (templates, favicon)
```

## Resultados de Validación de Arquitectura

### Validación de Coherencia ✅

**Compatibilidad de Decisiones:**
Todas las tecnologías seleccionadas (Next.js 16, React 19, Supabase, TanStack Query, Tailwind CSS 4, shadcn/ui, Recharts) son compatibles entre sí. No se detectaron conflictos de versiones ni incompatibilidades.

**Consistencia de Patrones:**
Los patrones de nombrado (snake_case para DB, PascalCase para componentes, kebab-case para rutas API) se aplican consistentemente en todo el documento. Los ejemplos de código siguen las convenciones establecidas.

**Alineación de Estructura:**
La estructura del proyecto soporta todas las decisiones arquitectónicas. La separación entre Python (`/api/`) y Node.js (`/app/api/`) es correcta para el runtime de Vercel.

### Validación de Cobertura de Requisitos ✅

**Cobertura de Requisitos Funcionales:** 100%
- Autenticación (FR1-FR4): Completamente soportada por Supabase Auth
- Arquitectura de Agentes (FR-AGT1-FR-AGT6): Dos agentes con streaming SSE
- Interfaz de Chat (FR13-FR20): Componentes mapeados a archivos específicos
- Plantillas (FR26-FR27): Página de descarga con plantilla MSA
- Tool de Análisis (FR-TOOL1-FR-TOOL7): Python serverless con validación
- Interpretación (FR-INT1-FR-INT3): Recharts para gráficos interactivos
- Privacidad (FR-PRIV1-FR-PRIV2): Página y tooltips documentados

**Cobertura de Requisitos No Funcionales:** 100%
- Seguridad: RLS en Supabase, HTTPS via Vercel, tokens JWT
- Privacidad: Datos crudos nunca enviados a OpenAI, aislamiento por usuario
- Confiabilidad: Patrones de error handling con mensajes en español

### Validación de Preparación para Implementación ✅

**Completitud de Decisiones:**
- ✅ Versiones específicas para todas las dependencias
- ✅ Patrones con ejemplos de código TypeScript
- ✅ Reglas de aplicación claras para agentes IA
- ✅ Anti-patrones documentados

**Completitud de Estructura:**
- ✅ Árbol de proyecto con ~80 archivos definidos
- ✅ Mapeo de requisitos a archivos específicos
- ✅ Diagramas de flujo de datos

**Completitud de Patrones:**
- ✅ Nombrado de base de datos, API, código
- ✅ Query keys estructuradas para TanStack Query
- ✅ Formato estándar de respuestas { data, error }
- ✅ Mensajes de error en español centralizados

### Análisis de Brechas

**Brechas Críticas:** Ninguna

**Brechas a Resolver Durante Implementación:**
1. Contenido de system prompts (FILTER_SYSTEM_PROMPT, MAIN_SYSTEM_PROMPT) — se definirá en la historia de implementación del chat
2. Fórmulas específicas de cálculo MSA — se implementarán en el script Python
3. Estructura exacta de chartData para Recharts — se definirá junto con los componentes de gráficos

**Mejoras Post-MVP:**
- Pipeline CI/CD con GitHub Actions
- Pre-commit hooks con Husky
- Documentación de setup de desarrollo

### Checklist de Completitud de Arquitectura

**✅ Análisis de Requisitos**
- [x] Contexto del proyecto analizado
- [x] Escala y complejidad evaluadas
- [x] Restricciones técnicas identificadas
- [x] Preocupaciones transversales mapeadas

**✅ Decisiones Arquitectónicas**
- [x] Decisiones críticas documentadas con versiones
- [x] Stack tecnológico completamente especificado
- [x] Patrones de integración definidos
- [x] Consideraciones de performance abordadas

**✅ Patrones de Implementación**
- [x] Convenciones de nombrado establecidas
- [x] Patrones de estructura definidos
- [x] Patrones de comunicación especificados
- [x] Patrones de proceso documentados

**✅ Estructura del Proyecto**
- [x] Estructura de directorios completa definida
- [x] Límites de componentes establecidos
- [x] Puntos de integración mapeados
- [x] Mapeo de requisitos a estructura completo

### Evaluación de Preparación de Arquitectura

**Estado General:** LISTO PARA IMPLEMENTACIÓN

**Nivel de Confianza:** ALTO

**Fortalezas Clave:**
1. Stack tecnológico moderno y estable (Next.js 16, React 19)
2. Arquitectura de privacidad sólida (datos crudos nunca a OpenAI)
3. Patrones claros para consistencia entre agentes IA
4. Mapeo completo de requisitos a archivos específicos
5. Esquema de base de datos con RLS preparado para multi-usuario

**Áreas para Mejora Futura:**
1. CI/CD pipeline para automatización
2. Tests E2E con Playwright
3. Monitoring y observabilidad
4. Rate limiting en APIs

### Guía de Handoff para Implementación

**Directrices para Agentes IA:**

1. **Seguir decisiones exactamente** — Usar las versiones y tecnologías especificadas
2. **Aplicar patrones consistentemente** — Respetar convenciones de nombrado y estructura
3. **Respetar límites** — No mezclar Python con Node.js, mantener separación de concerns
4. **Consultar este documento** — Para cualquier duda arquitectónica

**Primera Prioridad de Implementación:**

```bash
# 1. Crear proyecto Next.js 16
npx create-next-app@latest setec-ai-hub --typescript --tailwind --eslint --app --turbopack

# 2. Instalar dependencias de Supabase
cd setec-ai-hub
npm install @supabase/supabase-js @supabase/ssr

# 3. Inicializar shadcn/ui
npx shadcn@latest init

# 4. Instalar componentes necesarios
npx shadcn@latest add button input card avatar dropdown-menu toast scroll-area separator badge skeleton dialog tooltip
```

**Siguiente Paso:** Ejecutar workflow de Epics & Stories para generar historias de implementación basadas en esta arquitectura.

