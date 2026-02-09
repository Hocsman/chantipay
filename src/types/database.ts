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
          vat_number: string | null;
          tax_status: 'standard' | 'auto_entrepreneur' | 'micro_entreprise';
          is_subcontractor: boolean;
          rcs: string | null;
          ape_code: string | null;
          share_capital: string | null;
          role: string;
          subscription_status: string;
          subscription_plan: 'solo' | 'team' | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          current_period_end: string | null;
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
          vat_number?: string | null;
          tax_status?: 'standard' | 'auto_entrepreneur' | 'micro_entreprise';
          is_subcontractor?: boolean;
          rcs?: string | null;
          ape_code?: string | null;
          share_capital?: string | null;
          role?: string;
          subscription_status?: string;
          subscription_plan?: 'solo' | 'team' | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          current_period_end?: string | null;
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
          vat_number?: string | null;
          tax_status?: 'standard' | 'auto_entrepreneur' | 'micro_entreprise';
          is_subcontractor?: boolean;
          rcs?: string | null;
          ape_code?: string | null;
          share_capital?: string | null;
          role?: string;
          subscription_status?: string;
          subscription_plan?: 'solo' | 'team' | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          current_period_end?: string | null;
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
          deposit_paid_at: string | null;
          deposit_method: 'virement' | 'cash' | 'cheque' | 'autre' | null;
          signature_image_url: string | null;
          signed_at: string | null;
          payment_link_url: string | null;
          expires_at: string | null;
          work_location: string | null;
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
          deposit_paid_at?: string | null;
          deposit_method?: 'virement' | 'cash' | 'cheque' | 'autre' | null;
          signature_image_url?: string | null;
          signed_at?: string | null;
          payment_link_url?: string | null;
          expires_at?: string | null;
          work_location?: string | null;
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
          deposit_paid_at?: string | null;
          deposit_method?: 'virement' | 'cash' | 'cheque' | 'autre' | null;
          signature_image_url?: string | null;
          signed_at?: string | null;
          payment_link_url?: string | null;
          expires_at?: string | null;
          work_location?: string | null;
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
      invoices: {
        Row: {
          id: string;
          user_id: string;
          quote_id: string | null;
          invoice_number: string;
          client_id: string | null;
          client_name: string;
          client_email: string | null;
          client_phone: string | null;
          client_address: string | null;
          client_siret: string | null;
          subtotal: number;
          tax_rate: number;
          tax_amount: number;
          total: number;
          payment_status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'canceled';
          payment_method: string | null;
          paid_amount: number;
          paid_at: string | null;
          due_date: string | null;
          issue_date: string;
          sent_at: string | null;
          notes: string | null;
          payment_terms: string | null;
          work_location: string | null;
          is_subcontracting: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          quote_id?: string | null;
          invoice_number?: string;
          client_id?: string | null;
          client_name: string;
          client_email?: string | null;
          client_phone?: string | null;
          client_address?: string | null;
          client_siret?: string | null;
          subtotal?: number;
          tax_rate?: number;
          tax_amount?: number;
          total?: number;
          payment_status?: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'canceled';
          payment_method?: string | null;
          paid_amount?: number;
          paid_at?: string | null;
          due_date?: string | null;
          issue_date: string;
          sent_at?: string | null;
          notes?: string | null;
          payment_terms?: string | null;
          work_location?: string | null;
          is_subcontracting?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          quote_id?: string | null;
          invoice_number?: string;
          client_id?: string | null;
          client_name?: string;
          client_email?: string | null;
          client_phone?: string | null;
          client_address?: string | null;
          client_siret?: string | null;
          subtotal?: number;
          tax_rate?: number;
          tax_amount?: number;
          total?: number;
          payment_status?: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'canceled';
          payment_method?: string | null;
          paid_amount?: number;
          paid_at?: string | null;
          due_date?: string | null;
          issue_date?: string;
          sent_at?: string | null;
          notes?: string | null;
          payment_terms?: string | null;
          work_location?: string | null;
          is_subcontracting?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      invoice_items: {
        Row: {
          id: string;
          invoice_id: string;
          description: string;
          quantity: number;
          unit_price: number;
          total: number;
          vat_rate: number | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          description: string;
          quantity?: number;
          unit_price?: number;
          total?: number;
          vat_rate?: number | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          description?: string;
          quantity?: number;
          unit_price?: number;
          total?: number;
          vat_rate?: number | null;
          sort_order?: number;
          created_at?: string;
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
export type Invoice = Database['public']['Tables']['invoices']['Row'];
export type InvoiceItem = Database['public']['Tables']['invoice_items']['Row'];

export type InsertProfile = Database['public']['Tables']['profiles']['Insert'];
export type InsertClient = Database['public']['Tables']['clients']['Insert'];
export type InsertQuote = Database['public']['Tables']['quotes']['Insert'];
export type InsertQuoteItem = Database['public']['Tables']['quote_items']['Insert'];
export type InsertPayment = Database['public']['Tables']['payments']['Insert'];
export type InsertSettings = Database['public']['Tables']['settings']['Insert'];
export type InsertInvoice = Database['public']['Tables']['invoices']['Insert'];
export type InsertInvoiceItem = Database['public']['Tables']['invoice_items']['Insert'];

export type UpdateProfile = Database['public']['Tables']['profiles']['Update'];
export type UpdateClient = Database['public']['Tables']['clients']['Update'];
export type UpdateQuote = Database['public']['Tables']['quotes']['Update'];
export type UpdateQuoteItem = Database['public']['Tables']['quote_items']['Update'];
export type UpdatePayment = Database['public']['Tables']['payments']['Update'];
export type UpdateSettings = Database['public']['Tables']['settings']['Update'];
export type UpdateInvoice = Database['public']['Tables']['invoices']['Update'];
export type UpdateInvoiceItem = Database['public']['Tables']['invoice_items']['Update'];

// Quote status type for convenience
export type QuoteStatus = Quote['status'];
export type PaymentStatus = Payment['status'];
export type PaymentType = Payment['type'];
export type DepositStatus = NonNullable<Quote['deposit_status']>;
