export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          company_name: string | null;
          phone: string | null;
          address: string | null;
          siret: string | null;
          role: string;
          subscription_status: string;
          stripe_customer_id: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          company_name?: string | null;
          phone?: string | null;
          address?: string | null;
          siret?: string | null;
          role?: string;
          subscription_status?: string;
          stripe_customer_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          company_name?: string | null;
          phone?: string | null;
          address?: string | null;
          siret?: string | null;
          role?: string;
          subscription_status?: string;
          stripe_customer_id?: string | null;
          created_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          phone: string | null;
          email: string | null;
          address_line1: string | null;
          postal_code: string | null;
          city: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          address_line1?: string | null;
          postal_code?: string | null;
          city?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          phone?: string | null;
          email?: string | null;
          address_line1?: string | null;
          postal_code?: string | null;
          city?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      quotes: {
        Row: {
          id: string;
          user_id: string;
          client_id: string;
          quote_number: string;
          status: 'draft' | 'sent' | 'signed' | 'deposit_paid' | 'completed' | 'canceled';
          total_ht: number;
          total_ttc: number;
          vat_rate: number;
          currency: string;
          deposit_amount: number | null;
          deposit_status: 'pending' | 'paid' | null;
          signature_image_url: string | null;
          signed_at: string | null;
          payment_link_url: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          client_id: string;
          quote_number: string;
          status?: 'draft' | 'sent' | 'signed' | 'deposit_paid' | 'completed' | 'canceled';
          total_ht?: number;
          total_ttc?: number;
          vat_rate?: number;
          currency?: string;
          deposit_amount?: number | null;
          deposit_status?: 'pending' | 'paid' | null;
          signature_image_url?: string | null;
          signed_at?: string | null;
          payment_link_url?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          client_id?: string;
          quote_number?: string;
          status?: 'draft' | 'sent' | 'signed' | 'deposit_paid' | 'completed' | 'canceled';
          total_ht?: number;
          total_ttc?: number;
          vat_rate?: number;
          currency?: string;
          deposit_amount?: number | null;
          deposit_status?: 'pending' | 'paid' | null;
          signature_image_url?: string | null;
          signed_at?: string | null;
          payment_link_url?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      quote_items: {
        Row: {
          id: string;
          quote_id: string;
          description: string;
          quantity: number;
          unit_price_ht: number;
          vat_rate: number;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          quote_id: string;
          description: string;
          quantity?: number;
          unit_price_ht?: number;
          vat_rate?: number;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          quote_id?: string;
          description?: string;
          quantity?: number;
          unit_price_ht?: number;
          vat_rate?: number;
          sort_order?: number;
          created_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          quote_id: string;
          stripe_payment_intent_id: string | null;
          amount: number;
          type: 'deposit' | 'balance';
          status: 'pending' | 'succeeded' | 'failed';
          paid_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          quote_id: string;
          stripe_payment_intent_id?: string | null;
          amount: number;
          type: 'deposit' | 'balance';
          status?: 'pending' | 'succeeded' | 'failed';
          paid_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          quote_id?: string;
          stripe_payment_intent_id?: string | null;
          amount?: number;
          type?: 'deposit' | 'balance';
          status?: 'pending' | 'succeeded' | 'failed';
          paid_at?: string | null;
          created_at?: string;
        };
      };
      settings: {
        Row: {
          id: string;
          user_id: string;
          company_logo_url: string | null;
          default_vat_rate: number;
          default_deposit_percent: number;
          pdf_footer_text: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_logo_url?: string | null;
          default_vat_rate?: number;
          default_deposit_percent?: number;
          pdf_footer_text?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_logo_url?: string | null;
          default_vat_rate?: number;
          default_deposit_percent?: number;
          pdf_footer_text?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};

// Convenience types for use throughout the app
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Client = Database['public']['Tables']['clients']['Row'];
export type Quote = Database['public']['Tables']['quotes']['Row'];
export type QuoteItem = Database['public']['Tables']['quote_items']['Row'];
export type Payment = Database['public']['Tables']['payments']['Row'];
export type Settings = Database['public']['Tables']['settings']['Row'];

export type InsertProfile = Database['public']['Tables']['profiles']['Insert'];
export type InsertClient = Database['public']['Tables']['clients']['Insert'];
export type InsertQuote = Database['public']['Tables']['quotes']['Insert'];
export type InsertQuoteItem = Database['public']['Tables']['quote_items']['Insert'];
export type InsertPayment = Database['public']['Tables']['payments']['Insert'];
export type InsertSettings = Database['public']['Tables']['settings']['Insert'];

export type UpdateProfile = Database['public']['Tables']['profiles']['Update'];
export type UpdateClient = Database['public']['Tables']['clients']['Update'];
export type UpdateQuote = Database['public']['Tables']['quotes']['Update'];
export type UpdateQuoteItem = Database['public']['Tables']['quote_items']['Update'];
export type UpdatePayment = Database['public']['Tables']['payments']['Update'];
export type UpdateSettings = Database['public']['Tables']['settings']['Update'];

// Quote status type for convenience
export type QuoteStatus = Quote['status'];
export type PaymentStatus = Payment['status'];
export type PaymentType = Payment['type'];
export type DepositStatus = NonNullable<Quote['deposit_status']>;
