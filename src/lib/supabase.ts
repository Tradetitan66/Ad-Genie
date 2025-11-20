import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          has_completed_onboarding: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          display_name?: string | null;
          has_completed_onboarding?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          has_completed_onboarding?: boolean;
          updated_at?: string;
        };
      };
      brand_profiles: {
        Row: {
          id: string;
          user_id: string;
          brand_name: string;
          industry: string;
          audience: string | null;
          website_url: string;
          contact_email: string;
          logo: string | null;
          product_images: any;
          brand_colors: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          brand_name: string;
          industry: string;
          audience?: string | null;
          website_url: string;
          contact_email: string;
          logo?: string | null;
          product_images?: any;
          brand_colors?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          brand_name?: string;
          industry?: string;
          audience?: string | null;
          website_url?: string;
          contact_email?: string;
          logo?: string | null;
          product_images?: any;
          brand_colors?: any;
          updated_at?: string;
        };
      };
      preferences: {
        Row: {
          id: string;
          user_id: string;
          campaign_goal: string | null;
          brand_voice: string | null;
          visual_styles: any;
          campaign_timing: string | null;
          seasonal_events: any;
          enable_auto_suggestions: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          campaign_goal?: string | null;
          brand_voice?: string | null;
          visual_styles?: any;
          campaign_timing?: string | null;
          seasonal_events?: any;
          enable_auto_suggestions?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          campaign_goal?: string | null;
          brand_voice?: string | null;
          visual_styles?: any;
          campaign_timing?: string | null;
          seasonal_events?: any;
          enable_auto_suggestions?: boolean;
          updated_at?: string;
        };
      };
      campaigns: {
        Row: {
          id: string;
          user_id: string;
          brand_profile_id: string | null;
          content_type: string;
          status: string;
          generated_assets: any;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          brand_profile_id?: string | null;
          content_type: string;
          status?: string;
          generated_assets?: any;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          brand_profile_id?: string | null;
          content_type?: string;
          status?: string;
          generated_assets?: any;
          completed_at?: string | null;
        };
      };
    };
  };
}
