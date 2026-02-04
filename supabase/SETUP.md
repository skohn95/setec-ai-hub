# Supabase Setup Guide

Este documento describe cómo configurar Supabase para Setec AI Hub.

## Prerequisitos

1. Una cuenta de Supabase (https://supabase.com)
2. Un proyecto de Supabase creado

## Paso 1: Ejecutar Migraciones

Ejecutar los siguientes archivos SQL en orden en el **SQL Editor** de Supabase:

1. `migrations/001_create_tables.sql` - Crea las tablas principales
2. `migrations/002_create_indexes.sql` - Crea índices para rendimiento
3. `migrations/003_create_triggers.sql` - Crea triggers (updated_at)
4. `migrations/004_enable_rls.sql` - Habilita RLS y crea políticas
5. `migrations/005_create_storage.sql` - Crea bucket de storage

## Paso 2: Configurar Auth

En **Authentication > Providers**:

1. Habilitar **Email** provider
2. Desmarcar "Confirm email" para MVP (opcional)

En **Authentication > Email Templates > Reset Password**:

```html
<h2>Restablecer Contraseña</h2>
<p>Hola,</p>
<p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en Setec AI Hub.</p>
<p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
<p><a href="{{ .ConfirmationURL }}">Restablecer mi contraseña</a></p>
<p>Este enlace expirará en 24 horas.</p>
<p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
<p>Saludos,<br>El equipo de Setec AI Hub</p>
```

## Paso 3: Configurar URL Redirects

En **Authentication > URL Configuration**:

**Site URL:**
- Development: `http://localhost:3000`
- Production: `https://setec-ai-hub.vercel.app`

**Redirect URLs:**
- `http://localhost:3000/auth/callback`
- `https://setec-ai-hub.vercel.app/auth/callback`

## Paso 4: Obtener Credenciales

En **Project Settings > API**:

1. Copiar **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
2. Copiar **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Copiar **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

## Paso 5: Crear Usuario de Prueba (MVP)

En **Authentication > Users**:

1. Click "Add user"
2. Crear usuario con email y contraseña para pruebas

## Verificación

Después de completar la configuración:

1. Las tablas deben aparecer en **Table Editor**
2. El bucket "analysis-files" debe aparecer en **Storage**
3. Las políticas RLS deben estar activas (verificar en Table Editor > Policies)
