export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      analyzed_tattoos: {
        Row: {
          id: string
          user_id: string | null
          conversation_id: string | null
          image_url: string
          analysis_mode: string | null
          subject: string | null
          analysis_result: Json
          created_at: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          conversation_id?: string | null
          image_url: string
          analysis_mode?: string | null
          subject?: string | null
          analysis_result: Json
          created_at?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          user_id?: string | null
          conversation_id?: string | null
          image_url?: string
          analysis_mode?: string | null
          subject?: string | null
          analysis_result?: Json
          created_at?: string | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "analyzed_tattoos_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analyzed_tattoos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      conversation_messages: {
        Row: {
          id: string
          conversation_id: string | null
          role: string
          content: string
          audio_url: string | null
          tool_calls: Json | null
          created_at: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          conversation_id?: string | null
          role: string
          content: string
          audio_url?: string | null
          tool_calls?: Json | null
          created_at?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          conversation_id?: string | null
          role?: string
          content?: string
          audio_url?: string | null
          tool_calls?: Json | null
          created_at?: string | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          }
        ]
      }
      conversations: {
        Row: {
          id: string
          user_id: string | null
          type: string
          title: string | null
          created_at: string | null
          updated_at: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          type: string
          title?: string | null
          created_at?: string | null
          updated_at?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          user_id?: string | null
          type?: string
          title?: string | null
          created_at?: string | null
          updated_at?: string | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      design_collection_items: {
        Row: {
          id: string
          collection_id: string | null
          design_id: string | null
          added_at: string | null
        }
        Insert: {
          id?: string
          collection_id?: string | null
          design_id?: string | null
          added_at?: string | null
        }
        Update: {
          id?: string
          collection_id?: string | null
          design_id?: string | null
          added_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "design_collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "design_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_collection_items_design_id_fkey"
            columns: ["design_id"]
            isOneToOne: false
            referencedRelation: "generated_designs"
            referencedColumns: ["id"]
          }
        ]
      }
      design_collections: {
        Row: {
          id: string
          user_id: string | null
          name: string
          description: string | null
          is_public: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          description?: string | null
          is_public?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          description?: string | null
          is_public?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "design_collections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      generated_designs: {
        Row: {
          id: string
          user_id: string | null
          conversation_id: string | null
          prompt: string
          ai_model: string
          image_url: string
          style: string | null
          technique: string | null
          color_palette: string | null
          body_zone: string | null
          subject: string | null
          theme: string | null
          is_favorite: boolean | null
          created_at: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          conversation_id?: string | null
          prompt: string
          ai_model: string
          image_url: string
          style?: string | null
          technique?: string | null
          color_palette?: string | null
          body_zone?: string | null
          subject?: string | null
          theme?: string | null
          is_favorite?: boolean | null
          created_at?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          user_id?: string | null
          conversation_id?: string | null
          prompt?: string
          ai_model?: string
          image_url?: string
          style?: string | null
          technique?: string | null
          color_palette?: string | null
          body_zone?: string | null
          subject?: string | null
          theme?: string | null
          is_favorite?: boolean | null
          created_at?: string | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_designs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_designs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      styles: {
        Row: {
          "Assistant Guidance Level": string | null
          "Attributes & Tags": string | null
          Description: string | null
          "Detailed Description": string | null
          Keyword: string | null
        }
        Insert: {
          "Assistant Guidance Level"?: string | null
          "Attributes & Tags"?: string | null
          Description?: string | null
          "Detailed Description"?: string | null
          Keyword?: string | null
        }
        Update: {
          "Assistant Guidance Level"?: string | null
          "Attributes & Tags"?: string | null
          Description?: string | null
          "Detailed Description"?: string | null
          Keyword?: string | null
        }
        Relationships: []
      }
      techniques: {
        Row: {
          "Assistant Guidance Level": string | null
          "Attributes & Tags": string | null
          "blog artical": string | null
          "Detailed Description": string | null
          Keyword: string | null
          "Short Description": string | null
        }
        Insert: {
          "Assistant Guidance Level"?: string | null
          "Attributes & Tags"?: string | null
          "blog artical"?: string | null
          "Detailed Description"?: string | null
          Keyword?: string | null
          "Short Description"?: string | null
        }
        Update: {
          "Assistant Guidance Level"?: string | null
          "Attributes & Tags"?: string | null
          "blog artical"?: string | null
          "Detailed Description"?: string | null
          Keyword?: string | null
          "Short Description"?: string | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string | null
          preferred_ai_model: string | null
          preferred_style: string | null
          preferred_technique: string | null
          preferred_color_palette: string | null
          voice_chat_enabled: boolean | null
          notifications_enabled: boolean | null
          theme: string | null
          created_at: string | null
          updated_at: string | null
          preferences: Json | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          preferred_ai_model?: string | null
          preferred_style?: string | null
          preferred_technique?: string | null
          preferred_color_palette?: string | null
          voice_chat_enabled?: boolean | null
          notifications_enabled?: boolean | null
          theme?: string | null
          created_at?: string | null
          updated_at?: string | null
          preferences?: Json | null
        }
        Update: {
          id?: string
          user_id?: string | null
          preferred_ai_model?: string | null
          preferred_style?: string | null
          preferred_technique?: string | null
          preferred_color_palette?: string | null
          voice_chat_enabled?: boolean | null
          notifications_enabled?: boolean | null
          theme?: string | null
          created_at?: string | null
          updated_at?: string | null
          preferences?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
