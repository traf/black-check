export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      _ponder_checkpoint: {
        Row: {
          chain_id: number
          chain_name: string
          latest_checkpoint: string
          safe_checkpoint: string
        }
        Insert: {
          chain_id: number
          chain_name: string
          latest_checkpoint: string
          safe_checkpoint: string
        }
        Update: {
          chain_id?: number
          chain_name?: string
          latest_checkpoint?: string
          safe_checkpoint?: string
        }
        Relationships: []
      }
      _ponder_meta: {
        Row: {
          key: string
          value: Json
        }
        Insert: {
          key: string
          value: Json
        }
        Update: {
          key?: string
          value?: Json
        }
        Relationships: []
      }
      _reorg__Account: {
        Row: {
          address: string | null
          balance: number | null
          checkpoint: string
          created_at: number | null
          delegate: string | null
          id: string
          nonce: number | null
          operation: number
          operation_id: number
          updated_at: number | null
          votes: number | null
        }
        Insert: {
          address?: string | null
          balance?: number | null
          checkpoint: string
          created_at?: number | null
          delegate?: string | null
          id: string
          nonce?: number | null
          operation: number
          operation_id?: number
          updated_at?: number | null
          votes?: number | null
        }
        Update: {
          address?: string | null
          balance?: number | null
          checkpoint?: string
          created_at?: number | null
          delegate?: string | null
          id?: string
          nonce?: number | null
          operation?: number
          operation_id?: number
          updated_at?: number | null
          votes?: number | null
        }
        Relationships: []
      }
      _reorg__Approval: {
        Row: {
          approved: string | null
          block_number: number | null
          block_timestamp: number | null
          checkpoint: string
          id: string
          operation: number
          operation_id: number
          owner: string | null
          token_id: number | null
          transaction_hash: string | null
        }
        Insert: {
          approved?: string | null
          block_number?: number | null
          block_timestamp?: number | null
          checkpoint: string
          id: string
          operation: number
          operation_id?: number
          owner?: string | null
          token_id?: number | null
          transaction_hash?: string | null
        }
        Update: {
          approved?: string | null
          block_number?: number | null
          block_timestamp?: number | null
          checkpoint?: string
          id?: string
          operation?: number
          operation_id?: number
          owner?: string | null
          token_id?: number | null
          transaction_hash?: string | null
        }
        Relationships: []
      }
      _reorg__ApprovalForAll: {
        Row: {
          block_number: number | null
          block_timestamp: number | null
          checkpoint: string
          id: string
          is_approved: boolean | null
          operation: number
          operation_id: number
          operator: string | null
          owner: string | null
          transaction_hash: string | null
        }
        Insert: {
          block_number?: number | null
          block_timestamp?: number | null
          checkpoint: string
          id: string
          is_approved?: boolean | null
          operation: number
          operation_id?: number
          operator?: string | null
          owner?: string | null
          transaction_hash?: string | null
        }
        Update: {
          block_number?: number | null
          block_timestamp?: number | null
          checkpoint?: string
          id?: string
          is_approved?: boolean | null
          operation?: number
          operation_id?: number
          operator?: string | null
          owner?: string | null
          transaction_hash?: string | null
        }
        Relationships: []
      }
      _reorg__CompositeLevelCompleted: {
        Row: {
          block_number: number | null
          block_timestamp: number | null
          checkpoint: string
          id: string
          level: number | null
          operation: number
          operation_id: number
          transaction_hash: string | null
        }
        Insert: {
          block_number?: number | null
          block_timestamp?: number | null
          checkpoint: string
          id: string
          level?: number | null
          operation: number
          operation_id?: number
          transaction_hash?: string | null
        }
        Update: {
          block_number?: number | null
          block_timestamp?: number | null
          checkpoint?: string
          id?: string
          level?: number | null
          operation?: number
          operation_id?: number
          transaction_hash?: string | null
        }
        Relationships: []
      }
      _reorg__ContractState: {
        Row: {
          checkpoint: string
          clock: number | null
          clock_mode: string | null
          funding_completed: boolean | null
          id: string
          metadata: string | null
          operation: number
          operation_id: number
          timelock: string | null
          total_supply: number | null
          updated_at: number | null
        }
        Insert: {
          checkpoint: string
          clock?: number | null
          clock_mode?: string | null
          funding_completed?: boolean | null
          id: string
          metadata?: string | null
          operation: number
          operation_id?: number
          timelock?: string | null
          total_supply?: number | null
          updated_at?: number | null
        }
        Update: {
          checkpoint?: string
          clock?: number | null
          clock_mode?: string | null
          funding_completed?: boolean | null
          id?: string
          metadata?: string | null
          operation?: number
          operation_id?: number
          timelock?: string | null
          total_supply?: number | null
          updated_at?: number | null
        }
        Relationships: []
      }
      _reorg__ContributionCompleted: {
        Row: {
          block_number: number | null
          block_timestamp: number | null
          checkpoint: string
          id: string
          operation: number
          operation_id: number
          transaction_hash: string | null
        }
        Insert: {
          block_number?: number | null
          block_timestamp?: number | null
          checkpoint: string
          id: string
          operation: number
          operation_id?: number
          transaction_hash?: string | null
        }
        Update: {
          block_number?: number | null
          block_timestamp?: number | null
          checkpoint?: string
          id?: string
          operation?: number
          operation_id?: number
          transaction_hash?: string | null
        }
        Relationships: []
      }
      _reorg__DelegateChanged: {
        Row: {
          block_number: number | null
          block_timestamp: number | null
          checkpoint: string
          delegator: string | null
          from_delegate: string | null
          id: string
          operation: number
          operation_id: number
          to_delegate: string | null
          transaction_hash: string | null
        }
        Insert: {
          block_number?: number | null
          block_timestamp?: number | null
          checkpoint: string
          delegator?: string | null
          from_delegate?: string | null
          id: string
          operation: number
          operation_id?: number
          to_delegate?: string | null
          transaction_hash?: string | null
        }
        Update: {
          block_number?: number | null
          block_timestamp?: number | null
          checkpoint?: string
          delegator?: string | null
          from_delegate?: string | null
          id?: string
          operation?: number
          operation_id?: number
          to_delegate?: string | null
          transaction_hash?: string | null
        }
        Relationships: []
      }
      _reorg__DelegateVotesChanged: {
        Row: {
          block_number: number | null
          block_timestamp: number | null
          checkpoint: string
          delegate: string | null
          id: string
          new_votes: number | null
          operation: number
          operation_id: number
          previous_votes: number | null
          transaction_hash: string | null
        }
        Insert: {
          block_number?: number | null
          block_timestamp?: number | null
          checkpoint: string
          delegate?: string | null
          id: string
          new_votes?: number | null
          operation: number
          operation_id?: number
          previous_votes?: number | null
          transaction_hash?: string | null
        }
        Update: {
          block_number?: number | null
          block_timestamp?: number | null
          checkpoint?: string
          delegate?: string | null
          id?: string
          new_votes?: number | null
          operation?: number
          operation_id?: number
          previous_votes?: number | null
          transaction_hash?: string | null
        }
        Relationships: []
      }
      _reorg__InfinityCompleted: {
        Row: {
          block_number: number | null
          block_timestamp: number | null
          checkpoint: string
          id: string
          operation: number
          operation_id: number
          transaction_hash: string | null
        }
        Insert: {
          block_number?: number | null
          block_timestamp?: number | null
          checkpoint: string
          id: string
          operation: number
          operation_id?: number
          transaction_hash?: string | null
        }
        Update: {
          block_number?: number | null
          block_timestamp?: number | null
          checkpoint?: string
          id?: string
          operation?: number
          operation_id?: number
          transaction_hash?: string | null
        }
        Relationships: []
      }
      _reorg__MetadataUpdate: {
        Row: {
          block_number: number | null
          block_timestamp: number | null
          checkpoint: string
          id: string
          operation: number
          operation_id: number
          token_id: number | null
          transaction_hash: string | null
        }
        Insert: {
          block_number?: number | null
          block_timestamp?: number | null
          checkpoint: string
          id: string
          operation: number
          operation_id?: number
          token_id?: number | null
          transaction_hash?: string | null
        }
        Update: {
          block_number?: number | null
          block_timestamp?: number | null
          checkpoint?: string
          id?: string
          operation?: number
          operation_id?: number
          token_id?: number | null
          transaction_hash?: string | null
        }
        Relationships: []
      }
      _reorg__Token: {
        Row: {
          art_type: boolean | null
          check_info: Json | null
          checkpoint: string
          created_at: number | null
          id: string
          operation: number
          operation_id: number
          owner: string | null
          token_id: number | null
          token_uri: string | null
          updated_at: number | null
          voting_power: number | null
        }
        Insert: {
          art_type?: boolean | null
          check_info?: Json | null
          checkpoint: string
          created_at?: number | null
          id: string
          operation: number
          operation_id?: number
          owner?: string | null
          token_id?: number | null
          token_uri?: string | null
          updated_at?: number | null
          voting_power?: number | null
        }
        Update: {
          art_type?: boolean | null
          check_info?: Json | null
          checkpoint?: string
          created_at?: number | null
          id?: string
          operation?: number
          operation_id?: number
          owner?: string | null
          token_id?: number | null
          token_uri?: string | null
          updated_at?: number | null
          voting_power?: number | null
        }
        Relationships: []
      }
      _reorg__Transfer: {
        Row: {
          block_number: number | null
          block_timestamp: number | null
          checkpoint: string
          from: string | null
          id: string
          operation: number
          operation_id: number
          to: string | null
          token_id: number | null
          transaction_hash: string | null
        }
        Insert: {
          block_number?: number | null
          block_timestamp?: number | null
          checkpoint: string
          from?: string | null
          id: string
          operation: number
          operation_id?: number
          to?: string | null
          token_id?: number | null
          transaction_hash?: string | null
        }
        Update: {
          block_number?: number | null
          block_timestamp?: number | null
          checkpoint?: string
          from?: string | null
          id?: string
          operation?: number
          operation_id?: number
          to?: string | null
          token_id?: number | null
          transaction_hash?: string | null
        }
        Relationships: []
      }
      Account: {
        Row: {
          address: string | null
          balance: number | null
          created_at: number | null
          delegate: string | null
          id: string
          nonce: number | null
          updated_at: number | null
          votes: number | null
        }
        Insert: {
          address?: string | null
          balance?: number | null
          created_at?: number | null
          delegate?: string | null
          id: string
          nonce?: number | null
          updated_at?: number | null
          votes?: number | null
        }
        Update: {
          address?: string | null
          balance?: number | null
          created_at?: number | null
          delegate?: string | null
          id?: string
          nonce?: number | null
          updated_at?: number | null
          votes?: number | null
        }
        Relationships: []
      }
      Approval: {
        Row: {
          approved: string | null
          block_number: number | null
          block_timestamp: number | null
          id: string
          owner: string | null
          token_id: number | null
          transaction_hash: string | null
        }
        Insert: {
          approved?: string | null
          block_number?: number | null
          block_timestamp?: number | null
          id: string
          owner?: string | null
          token_id?: number | null
          transaction_hash?: string | null
        }
        Update: {
          approved?: string | null
          block_number?: number | null
          block_timestamp?: number | null
          id?: string
          owner?: string | null
          token_id?: number | null
          transaction_hash?: string | null
        }
        Relationships: []
      }
      ApprovalForAll: {
        Row: {
          block_number: number | null
          block_timestamp: number | null
          id: string
          is_approved: boolean | null
          operator: string | null
          owner: string | null
          transaction_hash: string | null
        }
        Insert: {
          block_number?: number | null
          block_timestamp?: number | null
          id: string
          is_approved?: boolean | null
          operator?: string | null
          owner?: string | null
          transaction_hash?: string | null
        }
        Update: {
          block_number?: number | null
          block_timestamp?: number | null
          id?: string
          is_approved?: boolean | null
          operator?: string | null
          owner?: string | null
          transaction_hash?: string | null
        }
        Relationships: []
      }
      CompositeLevelCompleted: {
        Row: {
          block_number: number | null
          block_timestamp: number | null
          id: string
          level: number | null
          transaction_hash: string | null
        }
        Insert: {
          block_number?: number | null
          block_timestamp?: number | null
          id: string
          level?: number | null
          transaction_hash?: string | null
        }
        Update: {
          block_number?: number | null
          block_timestamp?: number | null
          id?: string
          level?: number | null
          transaction_hash?: string | null
        }
        Relationships: []
      }
      ContractState: {
        Row: {
          clock: number | null
          clock_mode: string | null
          funding_completed: boolean | null
          id: string
          metadata: string | null
          timelock: string | null
          total_supply: number | null
          updated_at: number | null
        }
        Insert: {
          clock?: number | null
          clock_mode?: string | null
          funding_completed?: boolean | null
          id: string
          metadata?: string | null
          timelock?: string | null
          total_supply?: number | null
          updated_at?: number | null
        }
        Update: {
          clock?: number | null
          clock_mode?: string | null
          funding_completed?: boolean | null
          id?: string
          metadata?: string | null
          timelock?: string | null
          total_supply?: number | null
          updated_at?: number | null
        }
        Relationships: []
      }
      ContributionCompleted: {
        Row: {
          block_number: number | null
          block_timestamp: number | null
          id: string
          transaction_hash: string | null
        }
        Insert: {
          block_number?: number | null
          block_timestamp?: number | null
          id: string
          transaction_hash?: string | null
        }
        Update: {
          block_number?: number | null
          block_timestamp?: number | null
          id?: string
          transaction_hash?: string | null
        }
        Relationships: []
      }
      DelegateChanged: {
        Row: {
          block_number: number | null
          block_timestamp: number | null
          delegator: string | null
          from_delegate: string | null
          id: string
          to_delegate: string | null
          transaction_hash: string | null
        }
        Insert: {
          block_number?: number | null
          block_timestamp?: number | null
          delegator?: string | null
          from_delegate?: string | null
          id: string
          to_delegate?: string | null
          transaction_hash?: string | null
        }
        Update: {
          block_number?: number | null
          block_timestamp?: number | null
          delegator?: string | null
          from_delegate?: string | null
          id?: string
          to_delegate?: string | null
          transaction_hash?: string | null
        }
        Relationships: []
      }
      DelegateVotesChanged: {
        Row: {
          block_number: number | null
          block_timestamp: number | null
          delegate: string | null
          id: string
          new_votes: number | null
          previous_votes: number | null
          transaction_hash: string | null
        }
        Insert: {
          block_number?: number | null
          block_timestamp?: number | null
          delegate?: string | null
          id: string
          new_votes?: number | null
          previous_votes?: number | null
          transaction_hash?: string | null
        }
        Update: {
          block_number?: number | null
          block_timestamp?: number | null
          delegate?: string | null
          id?: string
          new_votes?: number | null
          previous_votes?: number | null
          transaction_hash?: string | null
        }
        Relationships: []
      }
      InfinityCompleted: {
        Row: {
          block_number: number | null
          block_timestamp: number | null
          id: string
          transaction_hash: string | null
        }
        Insert: {
          block_number?: number | null
          block_timestamp?: number | null
          id: string
          transaction_hash?: string | null
        }
        Update: {
          block_number?: number | null
          block_timestamp?: number | null
          id?: string
          transaction_hash?: string | null
        }
        Relationships: []
      }
      MetadataUpdate: {
        Row: {
          block_number: number | null
          block_timestamp: number | null
          id: string
          token_id: number | null
          transaction_hash: string | null
        }
        Insert: {
          block_number?: number | null
          block_timestamp?: number | null
          id: string
          token_id?: number | null
          transaction_hash?: string | null
        }
        Update: {
          block_number?: number | null
          block_timestamp?: number | null
          id?: string
          token_id?: number | null
          transaction_hash?: string | null
        }
        Relationships: []
      }
      Token: {
        Row: {
          art_type: boolean | null
          check_info: Json | null
          created_at: number | null
          id: string
          owner: string | null
          token_id: number | null
          token_uri: string | null
          updated_at: number | null
          voting_power: number | null
        }
        Insert: {
          art_type?: boolean | null
          check_info?: Json | null
          created_at?: number | null
          id: string
          owner?: string | null
          token_id?: number | null
          token_uri?: string | null
          updated_at?: number | null
          voting_power?: number | null
        }
        Update: {
          art_type?: boolean | null
          check_info?: Json | null
          created_at?: number | null
          id?: string
          owner?: string | null
          token_id?: number | null
          token_uri?: string | null
          updated_at?: number | null
          voting_power?: number | null
        }
        Relationships: []
      }
      Transfer: {
        Row: {
          block_number: number | null
          block_timestamp: number | null
          from: string | null
          id: string
          to: string | null
          token_id: number | null
          transaction_hash: string | null
        }
        Insert: {
          block_number?: number | null
          block_timestamp?: number | null
          from?: string | null
          id: string
          to?: string | null
          token_id?: number | null
          transaction_hash?: string | null
        }
        Update: {
          block_number?: number | null
          block_timestamp?: number | null
          from?: string | null
          id?: string
          to?: string | null
          token_id?: number | null
          transaction_hash?: string | null
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
