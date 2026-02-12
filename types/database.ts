// Database types - will be expanded with full schema types
// This is a placeholder for Supabase client typing

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      conversations: {
        Row: {
          id: string
          user_id: string
          title: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: 'user' | 'assistant' | 'system'
          content?: string
          metadata?: Json
          created_at?: string
        }
        Relationships: []
      }
      files: {
        Row: {
          id: string
          conversation_id: string
          message_id: string | null
          storage_path: string
          original_name: string
          mime_type: string
          size_bytes: number
          status: 'pending' | 'validating' | 'valid' | 'invalid' | 'processed'
          validation_errors: Json | null
          validated_at: string | null
          processed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          message_id?: string | null
          storage_path: string
          original_name: string
          mime_type: string
          size_bytes: number
          status?: 'pending' | 'validating' | 'valid' | 'invalid' | 'processed'
          validation_errors?: Json | null
          validated_at?: string | null
          processed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          message_id?: string | null
          storage_path?: string
          original_name?: string
          mime_type?: string
          size_bytes?: number
          status?: 'pending' | 'validating' | 'valid' | 'invalid' | 'processed'
          validation_errors?: Json | null
          validated_at?: string | null
          processed_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      analysis_results: {
        Row: {
          id: string
          message_id: string
          file_id: string
          analysis_type: string
          results: Json
          chart_data: Json
          instructions: string
          python_version: string | null
          computed_at: string
        }
        Insert: {
          id?: string
          message_id: string
          file_id: string
          analysis_type: string
          results: Json
          chart_data: Json
          instructions: string
          python_version?: string | null
          computed_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          file_id?: string
          analysis_type?: string
          results?: Json
          chart_data?: Json
          instructions?: string
          python_version?: string | null
          computed_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
