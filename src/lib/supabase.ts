import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_NEW_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_NEW_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials missing. Please check your .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          avatar_url: string | null;
          created_at: string;
          kyc_status: "not_started" | "pending" | "verified";
          preferences: Record<string, unknown> | null;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          avatar_url?: string | null;
          created_at?: string;
          kyc_status?: "not_started" | "pending" | "verified";
          preferences?: Record<string, unknown> | null;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          avatar_url?: string | null;
          created_at?: string;
          kyc_status?: "not_started" | "pending" | "verified";
          preferences?: Record<string, unknown> | null;
        };
      };
      trades: {
        Row: {
          id: string;
          user_id: string;
          asset: string;
          quantity: number;
          price: number;
          type: "buy" | "sell";
          timestamp: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          asset: string;
          quantity: number;
          price: number;
          type: "buy" | "sell";
          timestamp?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          asset?: string;
          quantity?: number;
          price?: number;
          type?: "buy" | "sell";
          timestamp?: string;
        };
      };
      portfolio: {
        Row: {
          id: string;
          user_id: string;
          asset: string;
          total_quantity: number;
          average_price: number;
          current_value: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          asset: string;
          total_quantity: number;
          average_price: number;
          current_value: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          asset?: string;
          total_quantity?: number;
          average_price?: number;
          current_value?: number;
          updated_at?: string;
        };
      };
      wallet_transactions: {
        Row: {
          id: string;
          user_id: string;
          wallet_address: string;
          transaction_hash: string;
          type: "send" | "receive";
          amount: number;
          asset: string;
          to_address: string | null;
          from_address: string | null;
          status: "pending" | "confirmed" | "failed";
          network: string;
          timestamp: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          wallet_address: string;
          transaction_hash: string;
          type: "send" | "receive";
          amount: number;
          asset: string;
          to_address?: string | null;
          from_address?: string | null;
          status?: "pending" | "confirmed" | "failed";
          network: string;
          timestamp?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          wallet_address?: string;
          transaction_hash?: string;
          type?: "send" | "receive";
          amount?: number;
          asset?: string;
          to_address?: string | null;
          from_address?: string | null;
          status?: "pending" | "confirmed" | "failed";
          network?: string;
          timestamp?: string;
        };
      };
    };
  };
}
