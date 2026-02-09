import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadFile } from '@/lib/supabase/files'
import { validateExcelFile } from '@/lib/utils/file-validation'
import type { ApiResponse } from '@/types/api'
import type { FileUploadResult } from '@/lib/supabase/files'

// Node.js runtime required for multipart form handling
export const runtime = 'nodejs'

// UUID v4 regex pattern for validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type FileApiResponse = ApiResponse<{ fileId: string; storagePath: string }>

/**
 * POST /api/files
 * Upload a file to Supabase Storage
 * Expects multipart/form-data with:
 * - file: The Excel file to upload
 * - conversationId: The conversation to attach the file to
 */
export async function POST(req: NextRequest): Promise<NextResponse<FileApiResponse>> {
  try {
    // 1. Verify user authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Debes iniciar sesión para subir archivos.',
          },
        },
        { status: 401 }
      )
    }

    // 2. Parse multipart form data
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const conversationId = formData.get('conversationId') as string | null

    // 3. Validate conversationId
    if (!conversationId || !UUID_REGEX.test(conversationId)) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'El ID de conversación es inválido.',
          },
        },
        { status: 400 }
      )
    }

    // 4. Validate file is present
    if (!file) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'No se proporcionó ningún archivo.',
          },
        },
        { status: 400 }
      )
    }

    // 5. Validate file type and size
    const validation = validateExcelFile(file)
    if (!validation.valid) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error || 'El archivo no es válido.',
          },
        },
        { status: 400 }
      )
    }

    // 6. Verify user owns the conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single()

    if (convError || !conversation) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'La conversación no existe o no tienes acceso.',
          },
        },
        { status: 404 }
      )
    }

    // 7. Upload file to storage and create database record (pass authenticated client)
    const result: FileUploadResult = await uploadFile(user.id, conversationId, file, supabase)

    if (result.error || !result.fileId || !result.storagePath) {
      console.error('File upload error:', result.error)
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'UPLOAD_ERROR',
            message: 'No se pudo subir el archivo. Intenta de nuevo.',
          },
        },
        { status: 500 }
      )
    }

    // 8. Return success response
    return NextResponse.json({
      data: {
        fileId: result.fileId,
        storagePath: result.storagePath,
      },
      error: null,
    })

  } catch (error) {
    console.error('File upload API error:', error)
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error al procesar la solicitud. Intenta de nuevo.',
        },
      },
      { status: 500 }
    )
  }
}
