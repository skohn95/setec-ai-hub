import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getFilesByConversation } from '@/lib/supabase/files'
import type { ApiResponse } from '@/types/api'
import type { MessageFile } from '@/types/chat'

// UUID v4 regex pattern for validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type FilesApiResponse = ApiResponse<MessageFile[]>

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/conversations/[id]/files
 * Get all files for a conversation
 * Verifies the user owns the conversation
 */
export async function GET(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<FilesApiResponse>> {
  try {
    // Await params (Next.js 15 requirement)
    const { id: conversationId } = await params

    // 1. Validate conversation ID format
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

    // 2. Verify user authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Debes iniciar sesión para ver los archivos.',
          },
        },
        { status: 401 }
      )
    }

    // 3. Verify user owns the conversation
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

    // 4. Fetch files for the conversation
    const { data: files, error: filesError } = await getFilesByConversation(conversationId)

    if (filesError) {
      console.error('Error fetching files:', filesError)
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'FETCH_ERROR',
            message: 'No se pudieron cargar los archivos.',
          },
        },
        { status: 500 }
      )
    }

    // 5. Return files (cast to MessageFile[] for type safety)
    return NextResponse.json({
      data: (files || []) as MessageFile[],
      error: null,
    })

  } catch (error) {
    console.error('Files API error:', error)
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
