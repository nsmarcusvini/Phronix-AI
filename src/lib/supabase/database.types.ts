// Gerado pelo Supabase (generate_typescript_types) a partir do projeto phronix-ai.
// Não editar à mão: regenerar depois de cada migration.

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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      ai_usage: {
        Row: {
          created_at: string
          custo: number
          etapa: Database["public"]["Enums"]["etapa_ia"]
          id: string
          kit_id: string | null
          modelo: string
          tokens_cache_escrita: number
          tokens_cache_leitura: number
          tokens_entrada: number
          tokens_saida: number
          user_id: string
        }
        Insert: {
          created_at?: string
          custo?: number
          etapa: Database["public"]["Enums"]["etapa_ia"]
          id?: string
          kit_id?: string | null
          modelo: string
          tokens_cache_escrita?: number
          tokens_cache_leitura?: number
          tokens_entrada?: number
          tokens_saida?: number
          user_id: string
        }
        Update: {
          created_at?: string
          custo?: number
          etapa?: Database["public"]["Enums"]["etapa_ia"]
          id?: string
          kit_id?: string | null
          modelo?: string
          tokens_cache_escrita?: number
          tokens_cache_leitura?: number
          tokens_entrada?: number
          tokens_saida?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "kits"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          acoes: string[]
          created_at: string
          id: string
          kit_id: string
          metrica: string | null
          origem: Database["public"]["Enums"]["origem_case"]
          requisitos: string[]
          resultado: string | null
          situacao: string
          titulo: string
          updated_at: string
        }
        Insert: {
          acoes?: string[]
          created_at?: string
          id?: string
          kit_id: string
          metrica?: string | null
          origem: Database["public"]["Enums"]["origem_case"]
          requisitos?: string[]
          resultado?: string | null
          situacao: string
          titulo: string
          updated_at?: string
        }
        Update: {
          acoes?: string[]
          created_at?: string
          id?: string
          kit_id?: string
          metrica?: string | null
          origem?: Database["public"]["Enums"]["origem_case"]
          requisitos?: string[]
          resultado?: string | null
          situacao?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cases_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "kits"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_messages: {
        Row: {
          conteudo: string
          criado_em: string
          id: string
          kit_id: string
          papel: Database["public"]["Enums"]["papel_mensagem"]
        }
        Insert: {
          conteudo: string
          criado_em?: string
          id?: string
          kit_id: string
          papel: Database["public"]["Enums"]["papel_mensagem"]
        }
        Update: {
          conteudo?: string
          criado_em?: string
          id?: string
          kit_id?: string
          papel?: Database["public"]["Enums"]["papel_mensagem"]
        }
        Relationships: [
          {
            foreignKeyName: "discovery_messages_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "kits"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          cargo: string | null
          created_at: string
          dados_json: Json | null
          empresa: string | null
          id: string
          texto: string
          user_id: string
        }
        Insert: {
          cargo?: string | null
          created_at?: string
          dados_json?: Json | null
          empresa?: string | null
          id?: string
          texto: string
          user_id?: string
        }
        Update: {
          cargo?: string | null
          created_at?: string
          dados_json?: Json | null
          empresa?: string | null
          id?: string
          texto?: string
          user_id?: string
        }
        Relationships: []
      }
      kits: {
        Row: {
          acesso: Database["public"]["Enums"]["acesso_kit"]
          acesso_expira_em: string | null
          created_at: string
          data_entrevista: string | null
          diagnostico_json: Json | null
          id: string
          job_id: string
          match_score: number | null
          nivel: Database["public"]["Enums"]["nivel"] | null
          nivel_ajustado: boolean
          nivel_confianca: Database["public"]["Enums"]["confianca"] | null
          resume_id: string
          status: Database["public"]["Enums"]["status_kit"]
          tipo: Database["public"]["Enums"]["tipo_entrevista"]
          updated_at: string
          user_id: string
        }
        Insert: {
          acesso?: Database["public"]["Enums"]["acesso_kit"]
          acesso_expira_em?: string | null
          created_at?: string
          data_entrevista?: string | null
          diagnostico_json?: Json | null
          id?: string
          job_id: string
          match_score?: number | null
          nivel?: Database["public"]["Enums"]["nivel"] | null
          nivel_ajustado?: boolean
          nivel_confianca?: Database["public"]["Enums"]["confianca"] | null
          resume_id: string
          status?: Database["public"]["Enums"]["status_kit"]
          tipo: Database["public"]["Enums"]["tipo_entrevista"]
          updated_at?: string
          user_id?: string
        }
        Update: {
          acesso?: Database["public"]["Enums"]["acesso_kit"]
          acesso_expira_em?: string | null
          created_at?: string
          data_entrevista?: string | null
          diagnostico_json?: Json | null
          id?: string
          job_id?: string
          match_score?: number | null
          nivel?: Database["public"]["Enums"]["nivel"] | null
          nivel_ajustado?: boolean
          nivel_confianca?: Database["public"]["Enums"]["confianca"] | null
          resume_id?: string
          status?: Database["public"]["Enums"]["status_kit"]
          tipo?: Database["public"]["Enums"]["tipo_entrevista"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kits_job_id_user_id_fkey"
            columns: ["job_id", "user_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "kits_resume_id_user_id_fkey"
            columns: ["resume_id", "user_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      live_sessions: {
        Row: {
          fim: string | null
          id: string
          inicio: string
          kit_id: string
          respondidas: string[]
        }
        Insert: {
          fim?: string | null
          id?: string
          inicio: string
          kit_id: string
          respondidas?: string[]
        }
        Update: {
          fim?: string | null
          id?: string
          inicio?: string
          kit_id?: string
          respondidas?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "live_sessions_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "kits"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          consentimento_lgpd_em: string | null
          created_at: string
          id: string
          nome: string | null
          plano: Database["public"]["Enums"]["plano"]
          tour_concluido_em: string | null
          updated_at: string
        }
        Insert: {
          consentimento_lgpd_em?: string | null
          created_at?: string
          id: string
          nome?: string | null
          plano?: Database["public"]["Enums"]["plano"]
          tour_concluido_em?: string | null
          updated_at?: string
        }
        Update: {
          consentimento_lgpd_em?: string | null
          created_at?: string
          id?: string
          nome?: string | null
          plano?: Database["public"]["Enums"]["plano"]
          tour_concluido_em?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      qa_items: {
        Row: {
          ancoras: string[]
          bloqueado: boolean
          bullets: string[]
          case_id: string | null
          categoria: Database["public"]["Enums"]["categoria_qa"]
          created_at: string
          expandida: string | null
          fixado: boolean
          gancho: string | null
          id: string
          kit_id: string
          numero_impacto: string | null
          ordem: number
          pendente_confirmacao: boolean
          pergunta: string
          updated_at: string
        }
        Insert: {
          ancoras?: string[]
          bloqueado?: boolean
          bullets?: string[]
          case_id?: string | null
          categoria: Database["public"]["Enums"]["categoria_qa"]
          created_at?: string
          expandida?: string | null
          fixado?: boolean
          gancho?: string | null
          id?: string
          kit_id: string
          numero_impacto?: string | null
          ordem: number
          pendente_confirmacao?: boolean
          pergunta: string
          updated_at?: string
        }
        Update: {
          ancoras?: string[]
          bloqueado?: boolean
          bullets?: string[]
          case_id?: string | null
          categoria?: Database["public"]["Enums"]["categoria_qa"]
          created_at?: string
          expandida?: string | null
          fixado?: boolean
          gancho?: string | null
          id?: string
          kit_id?: string
          numero_impacto?: string | null
          ordem?: number
          pendente_confirmacao?: boolean
          pergunta?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "qa_items_case_id_kit_id_fkey"
            columns: ["case_id", "kit_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id", "kit_id"]
          },
          {
            foreignKeyName: "qa_items_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "kits"
            referencedColumns: ["id"]
          },
        ]
      }
      resumes: {
        Row: {
          arquivo_path: string | null
          created_at: string
          dados_json: Json | null
          id: string
          texto: string | null
          user_id: string
        }
        Insert: {
          arquivo_path?: string | null
          created_at?: string
          dados_json?: Json | null
          id?: string
          texto?: string | null
          user_id?: string
        }
        Update: {
          arquivo_path?: string | null
          created_at?: string
          dados_json?: Json | null
          id?: string
          texto?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          caixa: number
          exercicio: Database["public"]["Enums"]["exercicio"]
          id: string
          kit_id: string
          nota: Database["public"]["Enums"]["nota_review"]
          proxima_revisao: string
          qa_item_id: string
          revisado_em: string
        }
        Insert: {
          caixa: number
          exercicio: Database["public"]["Enums"]["exercicio"]
          id?: string
          kit_id: string
          nota: Database["public"]["Enums"]["nota_review"]
          proxima_revisao: string
          qa_item_id: string
          revisado_em: string
        }
        Update: {
          caixa?: number
          exercicio?: Database["public"]["Enums"]["exercicio"]
          id?: string
          kit_id?: string
          nota?: Database["public"]["Enums"]["nota_review"]
          proxima_revisao?: string
          qa_item_id?: string
          revisado_em?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_qa_item_id_kit_id_fkey"
            columns: ["qa_item_id", "kit_id"]
            isOneToOne: false
            referencedRelation: "qa_items"
            referencedColumns: ["id", "kit_id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          id: string
          periodo_fim: string | null
          plano: Database["public"]["Enums"]["plano"]
          provedor: string
          provedor_assinatura_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          periodo_fim?: string | null
          plano: Database["public"]["Enums"]["plano"]
          provedor: string
          provedor_assinatura_id: string
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          periodo_fim?: string | null
          plano?: Database["public"]["Enums"]["plano"]
          provedor?: string
          provedor_assinatura_id?: string
          status?: string
          updated_at?: string
          user_id?: string
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
      acesso_kit: "gratis" | "avulso" | "pro"
      categoria_qa:
        | "abertura"
        | "motivacao_fit"
        | "experiencia_cases"
        | "competencias_tecnicas"
        | "perguntas_dificeis"
        | "perguntas_entrevistador"
      confianca: "alta" | "media" | "baixa"
      etapa_ia:
        | "extrair_curriculo"
        | "extrair_vaga"
        | "diagnostico"
        | "garimpo"
        | "mapa"
        | "reescrita"
        | "validador"
      exercicio:
        | "flashcard"
        | "ancoras"
        | "lacunas"
        | "ordenar"
        | "relampago"
        | "ensaio_geral"
      nivel: "junior" | "pleno" | "senior"
      nota_review: "errei" | "quase" | "acertei"
      origem_case: "cv" | "conversa" | "estimativa"
      papel_mensagem: "user" | "assistant"
      plano: "gratis" | "avulso" | "pro_mensal" | "pro_trimestral"
      status_kit: "rascunho" | "diagnosticado" | "garimpo" | "pronto"
      tipo_entrevista: "rh" | "tecnica" | "lideranca"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      acesso_kit: ["gratis", "avulso", "pro"],
      categoria_qa: [
        "abertura",
        "motivacao_fit",
        "experiencia_cases",
        "competencias_tecnicas",
        "perguntas_dificeis",
        "perguntas_entrevistador",
      ],
      confianca: ["alta", "media", "baixa"],
      etapa_ia: [
        "extrair_curriculo",
        "extrair_vaga",
        "diagnostico",
        "garimpo",
        "mapa",
        "reescrita",
        "validador",
      ],
      exercicio: [
        "flashcard",
        "ancoras",
        "lacunas",
        "ordenar",
        "relampago",
        "ensaio_geral",
      ],
      nivel: ["junior", "pleno", "senior"],
      nota_review: ["errei", "quase", "acertei"],
      origem_case: ["cv", "conversa", "estimativa"],
      papel_mensagem: ["user", "assistant"],
      plano: ["gratis", "avulso", "pro_mensal", "pro_trimestral"],
      status_kit: ["rascunho", "diagnosticado", "garimpo", "pronto"],
      tipo_entrevista: ["rh", "tecnica", "lideranca"],
    },
  },
} as const
