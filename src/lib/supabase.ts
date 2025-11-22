import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are set and not placeholder values
const isValidUrl = supabaseUrl && 
  supabaseUrl !== 'your_supabase_project_url' && 
  supabaseUrl.startsWith('http');
const isValidKey = supabaseAnonKey && 
  supabaseAnonKey !== 'your_supabase_anon_key' && 
  supabaseAnonKey.length > 20;

// Create Supabase client with fallback for missing/invalid config
let supabaseClient;
if (!isValidUrl || !isValidKey) {
  console.warn('Supabase environment variables are not configured. Using placeholder client.');
  // Create a placeholder client that won't crash the app
  supabaseClient = createClient(
    'https://placeholder.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTIwMDAsImV4cCI6MTk2MDc2ODAwMH0.placeholder'
  );
} else {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = supabaseClient;

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
