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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      fx_rate: {
        Row: {
          as_of: string
          base: string
          card_realistic: number
          created_at: string
          id: string
          quote: string
          rate: number
          source: string
        }
        Insert: {
          as_of: string
          base: string
          card_realistic: number
          created_at?: string
          id?: string
          quote: string
          rate: number
          source: string
        }
        Update: {
          as_of?: string
          base?: string
          card_realistic?: number
          created_at?: string
          id?: string
          quote?: string
          rate?: number
          source?: string
        }
        Relationships: []
      }
      identifier: {
        Row: {
          created_at: string
          id: string
          id_type: Database["public"]["Enums"]["identifier_type"]
          id_value: string
          variant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          id_type: Database["public"]["Enums"]["identifier_type"]
          id_value: string
          variant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          id_type?: Database["public"]["Enums"]["identifier_type"]
          id_value?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "identifier_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "price_estimate_mv"
            referencedColumns: ["variant_id"]
          },
          {
            foreignKeyName: "identifier_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variant"
            referencedColumns: ["id"]
          },
        ]
      }
      observation: {
        Row: {
          amount_minor: number
          channel: Database["public"]["Enums"]["channel"]
          created_at: string
          currency: string
          evidence_verified: boolean
          id: string
          observed_on: string
          observer_id: string | null
          photo_id: string | null
          retailer_id: string
          source: Database["public"]["Enums"]["obs_source"]
          source_url: string | null
          store_id: string | null
          superseded_by: string | null
          tax_inclusive: boolean
          tax_rate_applied: number | null
          variant_id: string
        }
        Insert: {
          amount_minor: number
          channel: Database["public"]["Enums"]["channel"]
          created_at?: string
          currency: string
          evidence_verified?: boolean
          id?: string
          observed_on: string
          observer_id?: string | null
          photo_id?: string | null
          retailer_id: string
          source: Database["public"]["Enums"]["obs_source"]
          source_url?: string | null
          store_id?: string | null
          superseded_by?: string | null
          tax_inclusive: boolean
          tax_rate_applied?: number | null
          variant_id: string
        }
        Update: {
          amount_minor?: number
          channel?: Database["public"]["Enums"]["channel"]
          created_at?: string
          currency?: string
          evidence_verified?: boolean
          id?: string
          observed_on?: string
          observer_id?: string | null
          photo_id?: string | null
          retailer_id?: string
          source?: Database["public"]["Enums"]["obs_source"]
          source_url?: string | null
          store_id?: string | null
          superseded_by?: string | null
          tax_inclusive?: boolean
          tax_rate_applied?: number | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "observation_retailer_id_fkey"
            columns: ["retailer_id"]
            isOneToOne: false
            referencedRelation: "retailer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observation_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observation_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "observation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observation_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "price_estimate_mv"
            referencedColumns: ["variant_id"]
          },
          {
            foreignKeyName: "observation_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variant"
            referencedColumns: ["id"]
          },
        ]
      }
      observation_flag: {
        Row: {
          created_at: string
          flagged_by: string | null
          id: string
          observation_id: string
          reason: string | null
        }
        Insert: {
          created_at?: string
          flagged_by?: string | null
          id?: string
          observation_id: string
          reason?: string | null
        }
        Update: {
          created_at?: string
          flagged_by?: string | null
          id?: string
          observation_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "observation_flag_observation_id_fkey"
            columns: ["observation_id"]
            isOneToOne: false
            referencedRelation: "observation"
            referencedColumns: ["id"]
          },
        ]
      }
      observer_trust: {
        Row: {
          confirmed_count: number
          created_at: string
          flagged_count: number
          score: number
          tier: Database["public"]["Enums"]["trust_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          confirmed_count?: number
          created_at?: string
          flagged_count?: number
          score?: number
          tier?: Database["public"]["Enums"]["trust_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          confirmed_count?: number
          created_at?: string
          flagged_count?: number
          score?: number
          tier?: Database["public"]["Enums"]["trust_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product: {
        Row: {
          brand: string
          category: string | null
          created_at: string
          form: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          brand: string
          category?: string | null
          created_at?: string
          form?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          brand?: string
          category?: string | null
          created_at?: string
          form?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_variant: {
        Row: {
          canonical_name: string
          created_at: string
          formulation_note: string | null
          id: string
          market: string
          pack_count: number
          product_id: string
          size_unit: string | null
          size_value: number | null
          updated_at: string
        }
        Insert: {
          canonical_name: string
          created_at?: string
          formulation_note?: string | null
          id?: string
          market: string
          pack_count?: number
          product_id: string
          size_unit?: string | null
          size_value?: number | null
          updated_at?: string
        }
        Update: {
          canonical_name?: string
          created_at?: string
          formulation_note?: string | null
          id?: string
          market?: string
          pack_count?: number
          product_id?: string
          size_unit?: string | null
          size_value?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variant_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
        ]
      }
      retailer: {
        Row: {
          country: string
          created_at: string
          default_channel: Database["public"]["Enums"]["channel"]
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          country: string
          created_at?: string
          default_channel: Database["public"]["Enums"]["channel"]
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          country?: string
          created_at?: string
          default_channel?: Database["public"]["Enums"]["channel"]
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      store: {
        Row: {
          address: string | null
          area: string | null
          created_at: string
          google_place_id: string | null
          id: string
          lat: number | null
          lng: number | null
          name: string | null
          retailer_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          area?: string | null
          created_at?: string
          google_place_id?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string | null
          retailer_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          area?: string | null
          created_at?: string
          google_place_id?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string | null
          retailer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_retailer_id_fkey"
            columns: ["retailer_id"]
            isOneToOne: false
            referencedRelation: "retailer"
            referencedColumns: ["id"]
          },
        ]
      }
      variant_equivalence: {
        Row: {
          confidence: number | null
          created_at: string
          determined_by: Database["public"]["Enums"]["determined_by"]
          id: string
          notes: string | null
          relation: Database["public"]["Enums"]["equivalence_relation"]
          variant_a: string
          variant_b: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          determined_by: Database["public"]["Enums"]["determined_by"]
          id?: string
          notes?: string | null
          relation: Database["public"]["Enums"]["equivalence_relation"]
          variant_a: string
          variant_b: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          determined_by?: Database["public"]["Enums"]["determined_by"]
          id?: string
          notes?: string | null
          relation?: Database["public"]["Enums"]["equivalence_relation"]
          variant_a?: string
          variant_b?: string
        }
        Relationships: [
          {
            foreignKeyName: "variant_equivalence_variant_a_fkey"
            columns: ["variant_a"]
            isOneToOne: false
            referencedRelation: "price_estimate_mv"
            referencedColumns: ["variant_id"]
          },
          {
            foreignKeyName: "variant_equivalence_variant_a_fkey"
            columns: ["variant_a"]
            isOneToOne: false
            referencedRelation: "product_variant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variant_equivalence_variant_b_fkey"
            columns: ["variant_b"]
            isOneToOne: false
            referencedRelation: "price_estimate_mv"
            referencedColumns: ["variant_id"]
          },
          {
            foreignKeyName: "variant_equivalence_variant_b_fkey"
            columns: ["variant_b"]
            isOneToOne: false
            referencedRelation: "product_variant"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      price_estimate_mv: {
        Row: {
          amount_minor: number | null
          channel: Database["public"]["Enums"]["channel"] | null
          confidence: number | null
          country: string | null
          currency: string | null
          dominant_source: Database["public"]["Enums"]["obs_source"] | null
          freshest_observed_on: string | null
          observation_count: number | null
          variant_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      find_or_create_store: {
        Args: { p_area?: string; p_name: string; p_retailer_id: string }
        Returns: string
      }
      price_estimate: {
        Args: {
          p_channel: Database["public"]["Enums"]["channel"]
          p_country: string
          p_variant_id: string
        }
        Returns: Database["public"]["CompositeTypes"]["price_estimate_result"]
        SetofOptions: {
          from: "*"
          to: "price_estimate_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      refresh_price_estimates: { Args: never; Returns: undefined }
      search_catalogue: {
        Args: { p_country?: string; p_query: string }
        Returns: {
          brand: string
          canonical_name: string
          est_amount_minor: number
          est_confidence: number
          est_count: number
          est_currency: string
          gtin: string
          market: string
          product_name: string
          size_unit: string
          size_value: number
          variant_id: string
        }[]
      }
    }
    Enums: {
      channel: "online" | "in_store"
      determined_by: "human" | "llm" | "gtin"
      equivalence_relation: "identical" | "equivalent" | "similar" | "different"
      identifier_type: "gtin" | "jan" | "ean" | "upc" | "asin" | "sku"
      obs_source: "human" | "feed" | "scrape" | "llm_grounded"
      trust_tier: "new" | "trusted" | "verified" | "flagged"
    }
    CompositeTypes: {
      price_estimate_result: {
        amount_minor: number | null
        currency: string | null
        confidence: number | null
        observation_count: number | null
        freshest_observed_on: string | null
        dominant_source: Database["public"]["Enums"]["obs_source"] | null
      }
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
    Enums: {
      channel: ["online", "in_store"],
      determined_by: ["human", "llm", "gtin"],
      equivalence_relation: ["identical", "equivalent", "similar", "different"],
      identifier_type: ["gtin", "jan", "ean", "upc", "asin", "sku"],
      obs_source: ["human", "feed", "scrape", "llm_grounded"],
      trust_tier: ["new", "trusted", "verified", "flagged"],
    },
  },
} as const
