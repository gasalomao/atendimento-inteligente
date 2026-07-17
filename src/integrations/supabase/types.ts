export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      contatos: {
        Row: {
          consent_timestamp: string | null
          consentimento: boolean
          conversas_dia: string | null
          created_at: string
          email: string | null
          email_status: string
          event_id: string | null
          faturamento: string | null
          fbclid: string | null
          form_answers: Json | null
          gclid: string | null
          id: string
          investimento: string | null
          ip: string | null
          landing_path: string | null
          lead_classification: string | null
          loja: string
          nome: string
          papel: string | null
          pontuacao: number
          privacy_policy_version: string | null
          problema_principal: string | null
          referrer: string | null
          status: string
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          webhook_status: string
          whatsapp: string
        }
        Insert: {
          consent_timestamp?: string | null
          consentimento?: boolean
          conversas_dia?: string | null
          created_at?: string
          email?: string | null
          email_status?: string
          event_id?: string | null
          faturamento?: string | null
          fbclid?: string | null
          form_answers?: Json | null
          gclid?: string | null
          id?: string
          investimento?: string | null
          ip?: string | null
          landing_path?: string | null
          lead_classification?: string | null
          loja: string
          nome: string
          papel?: string | null
          pontuacao?: number
          privacy_policy_version?: string | null
          problema_principal?: string | null
          referrer?: string | null
          status?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          webhook_status?: string
          whatsapp: string
        }
        Update: {
          consent_timestamp?: string | null
          consentimento?: boolean
          conversas_dia?: string | null
          created_at?: string
          email?: string | null
          email_status?: string
          event_id?: string | null
          faturamento?: string | null
          fbclid?: string | null
          form_answers?: Json | null
          gclid?: string | null
          id?: string
          investimento?: string | null
          ip?: string | null
          landing_path?: string | null
          lead_classification?: string | null
          loja?: string
          nome?: string
          papel?: string | null
          pontuacao?: number
          privacy_policy_version?: string | null
          problema_principal?: string | null
          referrer?: string | null
          status?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          webhook_status?: string
          whatsapp?: string
        }
        Relationships: []
      }
      lead_notification_jobs: {
        Row: {
          attempts: number
          channel: string
          created_at: string
          event_id: string
          id: string
          last_error: string | null
          lead_id: string
          locked_at: string | null
          next_attempt_at: string
          provider_message_id: string | null
          response_status: number | null
          sent_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          channel: string
          created_at?: string
          event_id: string
          id?: string
          last_error?: string | null
          lead_id: string
          locked_at?: string | null
          next_attempt_at?: string
          provider_message_id?: string | null
          response_status?: number | null
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          channel?: string
          created_at?: string
          event_id?: string
          id?: string
          last_error?: string | null
          lead_id?: string
          locked_at?: string | null
          next_attempt_at?: string
          provider_message_id?: string | null
          response_status?: number | null
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_notification_jobs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "contatos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_notification_jobs: {
        Args: { _limit: number }
        Returns: {
          attempts: number
          channel: string
          created_at: string
          event_id: string
          id: string
          last_error: string | null
          lead_id: string
          locked_at: string | null
          next_attempt_at: string
          provider_message_id: string | null
          response_status: number | null
          sent_at: string | null
          status: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "lead_notification_jobs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
