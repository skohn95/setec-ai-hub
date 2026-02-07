import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getFileDownloadUrl } from '@/lib/supabase/files'
import type { ApiResponse } from '@/types/api'

// UUID v4 regex pattern for validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type FileDownloadResponse = ApiResponse<{ downloadUrl: string }>

// Type for the file with conversation join
interface FileWithConversation {
  id: string
  storage_path: string
  original_name: string
  conversation: {
    id: string
    user_id: string
  }
}

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/files/[id]
 * Get a signed download URL for a file
 * Verifies the user owns the conversation the file belongs to
 */
export async function GET(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<FileDownloadResponse> | Response> {
  try {
    // Await params (Next.js 15 requirement)
    const { id: fileId } = await params

    // 1. Validate file ID format
    if (!fileId || !UUID_REGEX.test(fileId)) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'El ID del archivo es inválido.',
          },
        },
        { status: 400 }
      )
    }

    // 2. Verify user authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Debes iniciar sesión para descargar archivos.',
          },
        },
        { status: 401 }
      )
    }

    // 3. Get file record with conversation to verify ownership
    const { data: fileData, error: fileError } = await supabase
      .from('files')
      .select(`
        id,
        storage_path,
        original_name,
        conversation:conversations!inner(
          id,
          user_id
        )
      `)
      .eq('id', fileId)
      .single()

    if (fileError || !fileData) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'El archivo no existe.',
          },
        },
        { status: 404 }
      )
    }

    // Cast to proper type for the join result
    const file = fileData as unknown as FileWithConversation

    // 4. Verify user owns the conversation
    if (file.conversation.user_id !== user.id) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'No tienes acceso a este archivo.',
          },
        },
        { status: 403 }
      )
    }

    // 5. Generate signed download URL
    const downloadUrl = await getFileDownloadUrl(file.storage_path)

    if (!downloadUrl) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'DOWNLOAD_ERROR',
            message: 'No se pudo generar el enlace de descarga.',
          },
        },
        { status: 500 }
      )
    }

    // 6. Redirect to signed URL for download
    return NextResponse.redirect(downloadUrl)

  } catch (error) {
    console.error('File download API error:', error)
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
