import { describe, it, expect, beforeAll } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Project Setup', () => {
  describe('Task 1: Next.js 16 Project', () => {
    it('has TypeScript strict mode enabled', () => {
      const tsconfig = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'tsconfig.json'), 'utf-8')
      )
      expect(tsconfig.compilerOptions.strict).toBe(true)
    })

    it('has Next.js 16 installed', () => {
      const pkg = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8')
      )
      expect(pkg.dependencies.next).toMatch(/^16/)
    })

    it('has Tailwind CSS 4 installed', () => {
      const pkg = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8')
      )
      expect(pkg.devDependencies.tailwindcss).toMatch(/^\^4/)
    })
  })

  describe('Task 2: Core Dependencies', () => {
    let pkg: { dependencies: Record<string, string>; devDependencies: Record<string, string> }

    beforeAll(() => {
      pkg = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8')
      )
    })

    it('has Supabase dependencies installed', () => {
      expect(pkg.dependencies['@supabase/supabase-js']).toBeDefined()
      expect(pkg.dependencies['@supabase/ssr']).toBeDefined()
    })

    it('has TanStack Query installed', () => {
      expect(pkg.dependencies['@tanstack/react-query']).toBeDefined()
    })

    it('has Recharts installed', () => {
      expect(pkg.dependencies['recharts']).toBeDefined()
    })

    it('has Zod installed', () => {
      expect(pkg.dependencies['zod']).toBeDefined()
    })

    it('has utility libraries installed', () => {
      expect(pkg.dependencies['clsx']).toBeDefined()
      expect(pkg.dependencies['tailwind-merge']).toBeDefined()
      expect(pkg.dependencies['class-variance-authority']).toBeDefined()
      expect(pkg.dependencies['lucide-react']).toBeDefined()
    })

    it('has shadcn/ui components installed', () => {
      const componentsDir = path.join(process.cwd(), 'components', 'ui')
      const requiredComponents = [
        'button.tsx',
        'input.tsx',
        'card.tsx',
        'avatar.tsx',
        'dropdown-menu.tsx',
        'sonner.tsx', // toast replacement
        'scroll-area.tsx',
        'separator.tsx',
        'badge.tsx',
        'skeleton.tsx',
        'dialog.tsx',
        'tooltip.tsx',
      ]

      for (const component of requiredComponents) {
        expect(
          fs.existsSync(path.join(componentsDir, component)),
          `Missing component: ${component}`
        ).toBe(true)
      }
    })
  })

  describe('Task 3: Project Structure', () => {
    const requiredDirs = [
      'app/(auth)',
      'app/(dashboard)',
      'app/api',
      'api',
      'components/ui',
      'components/chat',
      'components/charts',
      'components/layout',
      'components/auth',
      'components/common',
      'lib/supabase',
      'lib/openai',
      'lib/api',
      'lib/providers',
      'lib/utils',
      'hooks',
      'types',
      'constants',
      'public/templates',
    ]

    it.each(requiredDirs)('has directory: %s', (dir) => {
      expect(
        fs.existsSync(path.join(process.cwd(), dir)),
        `Missing directory: ${dir}`
      ).toBe(true)
    })

    it('has barrel exports for component folders', () => {
      const foldersWithBarrels = [
        'components/ui',
        'components/chat',
        'components/charts',
        'components/layout',
        'components/auth',
        'components/common',
      ]

      for (const folder of foldersWithBarrels) {
        expect(
          fs.existsSync(path.join(process.cwd(), folder, 'index.ts')),
          `Missing barrel export: ${folder}/index.ts`
        ).toBe(true)
      }
    })
  })

  describe('Task 4: Supabase Clients', () => {
    const supabaseFiles = [
      'lib/supabase/client.ts',
      'lib/supabase/server.ts',
      'lib/supabase/middleware.ts',
      'lib/supabase/admin.ts',
      'lib/supabase/index.ts',
    ]

    it.each(supabaseFiles)('has file: %s', (file) => {
      expect(
        fs.existsSync(path.join(process.cwd(), file)),
        `Missing file: ${file}`
      ).toBe(true)
    })

    it('client.ts exports createClient function', () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), 'lib/supabase/client.ts'),
        'utf-8'
      )
      expect(content).toContain('export function createClient')
      expect(content).toContain('createBrowserClient')
    })

    it('server.ts uses createServerClient', () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), 'lib/supabase/server.ts'),
        'utf-8'
      )
      expect(content).toContain('createServerClient')
      expect(content).toContain('cookies')
    })

    it('middleware.ts exports updateSession', () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), 'lib/supabase/middleware.ts'),
        'utf-8'
      )
      expect(content).toContain('export async function updateSession')
    })

    it('admin.ts creates service role client', () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), 'lib/supabase/admin.ts'),
        'utf-8'
      )
      expect(content).toContain('SUPABASE_SERVICE_ROLE_KEY')
      expect(content).toContain('createAdminClient')
    })
  })

  describe('Task 5: Providers Component', () => {
    const providerFiles = [
      'lib/providers/QueryProvider.tsx',
      'lib/providers/AuthProvider.tsx',
      'lib/providers/Providers.tsx',
      'lib/providers/index.ts',
    ]

    it.each(providerFiles)('has file: %s', (file) => {
      expect(
        fs.existsSync(path.join(process.cwd(), file)),
        `Missing file: ${file}`
      ).toBe(true)
    })

    it('QueryProvider uses TanStack Query', () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), 'lib/providers/QueryProvider.tsx'),
        'utf-8'
      )
      expect(content).toContain('QueryClientProvider')
      expect(content).toContain('QueryClient')
    })

    it('AuthProvider manages Supabase auth state', () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), 'lib/providers/AuthProvider.tsx'),
        'utf-8'
      )
      expect(content).toContain('AuthContext')
      expect(content).toContain('onAuthStateChange')
      expect(content).toContain('useAuth')
    })

    it('Providers combines all providers', () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), 'lib/providers/Providers.tsx'),
        'utf-8'
      )
      expect(content).toContain('QueryProvider')
      expect(content).toContain('AuthProvider')
    })

    it('layout.tsx integrates Providers', () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), 'app/layout.tsx'),
        'utf-8'
      )
      expect(content).toContain("import { Providers } from '@/lib/providers'")
      expect(content).toContain('<Providers>')
    })
  })

  describe('Task 6: Environment Variables', () => {
    it('has .env.example file', () => {
      expect(
        fs.existsSync(path.join(process.cwd(), '.env.example'))
      ).toBe(true)
    })

    it('.env.example documents all required variables', () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), '.env.example'),
        'utf-8'
      )
      const requiredVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'OPENAI_API_KEY',
        'NEXT_PUBLIC_APP_URL',
      ]

      for (const varName of requiredVars) {
        expect(content).toContain(varName)
      }
    })

    it('.env.local exists for local development', () => {
      expect(
        fs.existsSync(path.join(process.cwd(), '.env.local'))
      ).toBe(true)
    })

    it('.gitignore ignores env files', () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), '.gitignore'),
        'utf-8'
      )
      expect(content).toContain('.env')
    })
  })

  describe('Task 7: Vercel Deployment Configuration', () => {
    it('has vercel.json', () => {
      expect(
        fs.existsSync(path.join(process.cwd(), 'vercel.json'))
      ).toBe(true)
    })

    it('vercel.json configures Python runtime', () => {
      const content = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'vercel.json'), 'utf-8')
      )
      expect(content.functions['api/*.py'].runtime).toBe('python3.11')
      expect(content.functions['api/*.py'].maxDuration).toBe(60)
    })

    it('vercel.json configures Next.js framework', () => {
      const content = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'vercel.json'), 'utf-8')
      )
      expect(content.framework).toBe('nextjs')
      expect(content.outputDirectory).toBe('.next')
    })

    it('has api/requirements.txt with Python dependencies', () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), 'api/requirements.txt'),
        'utf-8'
      )
      expect(content).toContain('pandas')
      expect(content).toContain('numpy')
      expect(content).toContain('openpyxl')
      expect(content).toContain('scipy')
    })

    it('has api/analyze.py placeholder', () => {
      expect(
        fs.existsSync(path.join(process.cwd(), 'api/analyze.py'))
      ).toBe(true)
    })
  })

  describe('Tasks 8-10: Supabase Configuration', () => {
    const migrationFiles = [
      'supabase/migrations/001_create_tables.sql',
      'supabase/migrations/002_create_indexes.sql',
      'supabase/migrations/003_create_triggers.sql',
      'supabase/migrations/004_enable_rls.sql',
      'supabase/migrations/005_create_storage.sql',
    ]

    it.each(migrationFiles)('has migration file: %s', (file) => {
      expect(
        fs.existsSync(path.join(process.cwd(), file)),
        `Missing migration: ${file}`
      ).toBe(true)
    })

    it('001_create_tables.sql creates all required tables', () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), 'supabase/migrations/001_create_tables.sql'),
        'utf-8'
      )
      const tables = ['conversations', 'messages', 'files', 'analysis_results', 'token_usage']
      for (const table of tables) {
        expect(content).toContain(`CREATE TABLE IF NOT EXISTS ${table}`)
      }
    })

    it('004_enable_rls.sql enables RLS on all tables', () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), 'supabase/migrations/004_enable_rls.sql'),
        'utf-8'
      )
      const tables = ['conversations', 'messages', 'files', 'analysis_results', 'token_usage']
      for (const table of tables) {
        expect(content).toContain(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`)
      }
    })

    it('005_create_storage.sql creates analysis-files bucket', () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), 'supabase/migrations/005_create_storage.sql'),
        'utf-8'
      )
      expect(content).toContain('analysis-files')
      expect(content).toContain('10485760') // 10MB limit
    })

    it('has SETUP.md with configuration instructions', () => {
      expect(
        fs.existsSync(path.join(process.cwd(), 'supabase/SETUP.md'))
      ).toBe(true)
    })
  })

  describe('Task 11: Type Definitions', () => {
    const typeFiles = [
      'types/database.ts',
      'types/api.ts',
      'types/chat.ts',
      'types/analysis.ts',
      'types/index.ts',
    ]

    it.each(typeFiles)('has type file: %s', (file) => {
      expect(
        fs.existsSync(path.join(process.cwd(), file)),
        `Missing type file: ${file}`
      ).toBe(true)
    })

    it('api.ts defines ApiResponse type', () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), 'types/api.ts'),
        'utf-8'
      )
      expect(content).toContain('interface ApiResponse')
      expect(content).toContain('data:')
      expect(content).toContain('error:')
    })

    it('chat.ts defines Message and Conversation types', () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), 'types/chat.ts'),
        'utf-8'
      )
      expect(content).toContain('interface Message')
      expect(content).toContain('interface Conversation')
    })

    it('analysis.ts defines AnalysisResult types', () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), 'types/analysis.ts'),
        'utf-8'
      )
      expect(content).toContain('interface AnalysisResult')
      expect(content).toContain('interface GageRRResults')
    })

    it('index.ts exports all type modules', () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), 'types/index.ts'),
        'utf-8'
      )
      expect(content).toContain("export * from './database'")
      expect(content).toContain("export * from './api'")
      expect(content).toContain("export * from './chat'")
      expect(content).toContain("export * from './analysis'")
    })
  })

  describe('Task 12: Constants', () => {
    const constantFiles = [
      'constants/api.ts',
      'constants/messages.ts',
      'constants/query-keys.ts',
      'constants/index.ts',
    ]

    it.each(constantFiles)('has constant file: %s', (file) => {
      expect(
        fs.existsSync(path.join(process.cwd(), file)),
        `Missing constant file: ${file}`
      ).toBe(true)
    })

    it('api.ts defines API_TIMEOUT and MAX_FILE_SIZE', () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), 'constants/api.ts'),
        'utf-8'
      )
      expect(content).toContain('API_TIMEOUT')
      expect(content).toContain('MAX_FILE_SIZE')
    })

    it('messages.ts defines ERROR_MESSAGES in Spanish', () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), 'constants/messages.ts'),
        'utf-8'
      )
      expect(content).toContain('ERROR_MESSAGES')
      // Verify Spanish content
      expect(content).toContain('No autorizado')
      expect(content).toContain('Error de validación')
    })

    it('query-keys.ts defines queryKeys structure', () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), 'constants/query-keys.ts'),
        'utf-8'
      )
      expect(content).toContain('queryKeys')
      expect(content).toContain('conversations')
      expect(content).toContain('messages')
    })
  })

  describe('Task 13: Utility Functions', () => {
    const utilFiles = [
      'lib/utils/cn.ts',
      'lib/utils/date-utils.ts',
      'lib/utils/error-utils.ts',
      'lib/utils/index.ts',
    ]

    it.each(utilFiles)('has utility file: %s', (file) => {
      expect(
        fs.existsSync(path.join(process.cwd(), file)),
        `Missing utility file: ${file}`
      ).toBe(true)
    })

    it('cn.ts exports cn function with clsx and tailwind-merge', () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), 'lib/utils/cn.ts'),
        'utf-8'
      )
      expect(content).toContain('export function cn')
      expect(content).toContain('clsx')
      expect(content).toContain('twMerge')
    })

    it('date-utils.ts exports formatDisplayDate and formatRelativeTime', () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), 'lib/utils/date-utils.ts'),
        'utf-8'
      )
      expect(content).toContain('export function formatDisplayDate')
      expect(content).toContain('export function formatRelativeTime')
    })

    it('error-utils.ts exports createApiError and ERROR_CODES', () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), 'lib/utils/error-utils.ts'),
        'utf-8'
      )
      expect(content).toContain('export function createApiError')
      expect(content).toContain('ERROR_CODES')
    })

    it('lib/utils.ts re-exports cn for shadcn compatibility', () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), 'lib/utils.ts'),
        'utf-8'
      )
      expect(content).toContain("export { cn } from './utils/cn'")
    })
  })

  describe('Task 14: Tailwind Theme', () => {
    it('globals.css includes Setec brand colors', () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), 'app/globals.css'),
        'utf-8'
      )
      // Check for Setec orange #F7931E
      expect(content).toContain('#F7931E')
      // Check for Setec charcoal #3D3D3D
      expect(content).toContain('#3D3D3D')
      // Check for Setec white #FFFFFF
      expect(content).toContain('#FFFFFF')
    })

    it('globals.css has CSS variables for shadcn/ui theme', () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), 'app/globals.css'),
        'utf-8'
      )
      expect(content).toContain('--primary:')
      expect(content).toContain('--background:')
      expect(content).toContain('--foreground:')
      expect(content).toContain('--radius:')
    })
  })

  describe('Task 15: Root Layout and Error Boundary', () => {
    it('app/layout.tsx exists with proper structure', () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), 'app/layout.tsx'),
        'utf-8'
      )
      expect(content).toContain('RootLayout')
      expect(content).toContain('Providers')
      expect(content).toContain('metadata')
      expect(content).toContain('Setec AI Hub')
    })

    it('app/error.tsx exists as global error boundary', () => {
      expect(
        fs.existsSync(path.join(process.cwd(), 'app/error.tsx'))
      ).toBe(true)
    })

    it('error.tsx uses client component and reset function', () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), 'app/error.tsx'),
        'utf-8'
      )
      expect(content).toContain("'use client'")
      expect(content).toContain('reset')
      expect(content).toContain('error')
    })

    it('app/globals.css exists with base styles', () => {
      expect(
        fs.existsSync(path.join(process.cwd(), 'app/globals.css'))
      ).toBe(true)
    })
  })
})
