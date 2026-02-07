# Setec AI Hub

Plataforma de analisis de sistemas de medicion (MSA/Gauge R&R) con asistencia de IA conversacional.

## Descripcion

Setec AI Hub es una aplicacion web que permite a los usuarios realizar analisis de sistemas de medicion a traves de una interfaz de chat conversacional. La plataforma procesa archivos Excel con datos de medicion y genera analisis estadisticos junto con visualizaciones interactivas.

### Caracteristicas Principales

- Chat conversacional con agente IA especializado en MSA
- Carga y validacion de archivos Excel con datos de medicion
- Analisis Gauge R&R automatico con calculo de repetibilidad y reproducibilidad
- Graficos interactivos con exportacion a PNG
- Plantillas descargables para facilitar la entrada de datos
- Historial de conversaciones persistente

## Requisitos Previos

- Node.js 20+
- npm 10+
- Cuenta de Supabase (base de datos y autenticacion)
- Clave API de OpenAI (para GPT-4)

## Desarrollo Local

### 1. Clonar repositorio

```bash
git clone <repository-url>
cd setec-ai-hub
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copiar el archivo de ejemplo y completar los valores:

```bash
cp .env.example .env.local
```

Editar `.env.local` con tus credenciales:

```bash
# Supabase (https://supabase.com/dashboard/project/[project-id]/settings/api)
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# OpenAI (https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-...

# URL de la aplicacion
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Configurar Supabase

Crear las siguientes tablas en tu proyecto Supabase:

- `conversations` - Historial de conversaciones
- `messages` - Mensajes de chat
- `files` - Metadatos de archivos subidos

Habilitar RLS (Row Level Security) en todas las tablas.

Crear bucket de Storage llamado `analysis-files`.

### 5. Ejecutar servidor de desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

### 6. Ejecutar tests

```bash
npm run test        # Tests en modo watch
npm run test:run    # Tests una vez
npm run test:coverage  # Con cobertura
```

## Variables de Entorno

| Variable | Tipo | Descripcion |
|----------|------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Publica | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publica | Clave anonima de Supabase (segura para cliente) |
| `SUPABASE_SERVICE_ROLE_KEY` | Secreta | Clave de servicio Supabase (solo servidor) |
| `OPENAI_API_KEY` | Secreta | Clave API de OpenAI |
| `NEXT_PUBLIC_APP_URL` | Publica | URL base de la aplicacion |

**Nota:** Las variables con prefijo `NEXT_PUBLIC_` son expuestas al navegador. Las variables secretas solo estan disponibles en el servidor.

## Despliegue

### Vercel

1. Conectar repositorio a Vercel
2. Configurar variables de entorno en Vercel Dashboard
3. Desplegar

La configuracion de Vercel esta definida en `vercel.json`:
- Region: `iad1` (US East)
- Python runtime: 3.11 para endpoints de analisis
- Max duration: 60 segundos para funciones Python

### Supabase Produccion

1. Crear proyecto de produccion separado
2. Aplicar migraciones de base de datos
3. Verificar que RLS esta habilitado
4. Configurar bucket de Storage
5. Actualizar URLs de redireccion en Auth

## Crear Usuarios

Para el MVP, los usuarios se crean manualmente en Supabase:

1. Ir a Authentication > Users en el dashboard de Supabase
2. Click "Add user"
3. Ingresar email y password
4. El usuario puede iniciar sesion inmediatamente

## Estructura del Proyecto

```
setec-ai-hub/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Paginas de autenticacion
│   ├── (dashboard)/       # Paginas del dashboard
│   └── api/               # API routes
├── components/            # Componentes React
│   ├── chat/             # Componentes de chat
│   ├── charts/           # Graficos
│   ├── common/           # Componentes comunes
│   ├── layout/           # Layout components
│   └── ui/               # shadcn/ui components
├── lib/                   # Utilidades y logica
│   ├── openai/           # Integracion OpenAI
│   ├── supabase/         # Cliente Supabase
│   └── utils/            # Utilidades generales
├── api/                   # Python functions (Vercel)
│   └── analyze.py        # Endpoint de analisis MSA
├── constants/            # Constantes y mensajes
├── hooks/                # React hooks personalizados
├── types/                # TypeScript types
└── public/               # Assets estaticos
```

## Tecnologias

- **Frontend:** Next.js 16, React 19, TypeScript
- **Styling:** Tailwind CSS v4, shadcn/ui
- **Backend:** Next.js API Routes, Vercel Functions (Python)
- **Base de datos:** Supabase (PostgreSQL)
- **Autenticacion:** Supabase Auth
- **IA:** OpenAI GPT-4
- **Testing:** Vitest, React Testing Library
- **Charts:** Recharts

## Troubleshooting

### Error de conexion a Supabase

Verificar que las variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` estan correctamente configuradas.

### Error de API de OpenAI

Verificar que `OPENAI_API_KEY` es valida y tiene creditos disponibles.

### Errores de tipos TypeScript

Ejecutar `npm run build` para ver errores de tipos completos.

### Tests fallando

Ejecutar `npm run test:run` para ver detalles de tests fallidos.

## Licencia

Propietario - Setec
