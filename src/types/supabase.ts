/**
 * SUPABASE DATABASE TYPES
 * 
 * Type definitions for Supabase database tables and relationships.
 * Generated from the database schema.
 */

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
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string
          first_name: string | null
          last_name: string | null
          avatar: string | null
          bio: string | null
          organization: string | null
          rank: string | null
          location: string | null
          unit_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name: string
          first_name?: string | null
          last_name?: string | null
          avatar?: string | null
          bio?: string | null
          organization?: string | null
          rank?: string | null
          location?: string | null
          unit_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string
          first_name?: string | null
          last_name?: string | null
          avatar?: string | null
          bio?: string | null
          organization?: string | null
          rank?: string | null
          location?: string | null
          unit_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      activities: {
        Row: {
          id: string
          user_id: string
          unit_id: string | null
          type: 'training' | 'exercise' | 'operation'
          title: string
          description: string | null
          duration: number
          date: string
          location: string | null
          latitude: number | null
          longitude: number | null
          visibility: 'private' | 'unit' | 'public'
          tags: string[] | null
          images: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          unit_id?: string | null
          type: 'training' | 'exercise' | 'operation'
          title: string
          description?: string | null
          duration: number
          date: string
          location?: string | null
          latitude?: number | null
          longitude?: number | null
          visibility?: 'private' | 'unit' | 'public'
          tags?: string[] | null
          images?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          unit_id?: string | null
          type?: 'training' | 'exercise' | 'operation'
          title?: string
          description?: string | null
          duration?: number
          date?: string
          location?: string | null
          latitude?: number | null
          longitude?: number | null
          visibility?: 'private' | 'unit' | 'public'
          tags?: string[] | null
          images?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      reactions: {
        Row: {
          id: string
          activity_id: string
          user_id: string
          type: 'respect' | 'strong' | 'teamwork' | 'impressive'
          created_at: string
        }
        Insert: {
          id?: string
          activity_id: string
          user_id: string
          type: 'respect' | 'strong' | 'teamwork' | 'impressive'
          created_at?: string
        }
        Update: {
          id?: string
          activity_id?: string
          user_id?: string
          type?: 'respect' | 'strong' | 'teamwork' | 'impressive'
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          activity_id: string
          user_id: string
          text: string
          created_at: string
        }
        Insert: {
          id?: string
          activity_id: string
          user_id: string
          text: string
          created_at?: string
        }
        Update: {
          id?: string
          activity_id?: string
          user_id?: string
          text?: string
          created_at?: string
        }
      }
      units: {
        Row: {
          id: string
          name: string
          location: string | null
          type: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          location?: string | null
          type?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          location?: string | null
          type?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      activity_type: 'training' | 'exercise' | 'operation'
      activity_visibility: 'private' | 'unit' | 'public'
      reaction_type: 'respect' | 'strong' | 'teamwork' | 'impressive'
    }
  }
}

