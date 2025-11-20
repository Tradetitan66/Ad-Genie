import { supabase } from '../lib/supabase';

export interface UserData {
  id: string;
  email: string;
  display_name: string | null;
  has_completed_onboarding: boolean;
  created_at: string;
  updated_at: string;
}

export interface BrandProfile {
  id: string;
  user_id: string;
  brand_name: string;
  industry: string;
  audience: string | null;
  website_url: string;
  contact_email: string;
  logo: string | null;
  product_images: string[];
  brand_colors: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface Preferences {
  id: string;
  user_id: string;
  campaign_goal: string | null;
  brand_voice: string | null;
  visual_styles: string[];
  campaign_timing: string | null;
  seasonal_events: {
    local?: string[];
    international?: string[];
  };
  enable_auto_suggestions: boolean;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  user_id: string;
  brand_profile_id: string | null;
  content_type: string;
  status: string;
  generated_assets: any;
  created_at: string;
  completed_at: string | null;
}

export const userService = {
  async getByEmail(email: string): Promise<UserData | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async create(email: string, displayName: string): Promise<UserData> {
    const { data, error } = await supabase
      .from('users')
      .insert({
        email,
        display_name: displayName,
        has_completed_onboarding: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(email: string, updates: Partial<UserData>): Promise<UserData> {
    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('email', email)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async completeOnboarding(email: string): Promise<UserData> {
    return this.update(email, { has_completed_onboarding: true });
  },
};

export const brandProfileService = {
  async getByUserId(userId: string): Promise<BrandProfile | null> {
    const { data, error } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async create(profile: Omit<BrandProfile, 'id' | 'created_at' | 'updated_at'>): Promise<BrandProfile> {
    const { data, error } = await supabase
      .from('brand_profiles')
      .insert(profile)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<BrandProfile>): Promise<BrandProfile> {
    const { data, error } = await supabase
      .from('brand_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async upsert(profile: Omit<BrandProfile, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<BrandProfile> {
    const { data, error } = await supabase
      .from('brand_profiles')
      .upsert({
        ...profile,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

export const preferencesService = {
  async getByUserId(userId: string): Promise<Preferences | null> {
    const { data, error } = await supabase
      .from('preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async create(preferences: Omit<Preferences, 'id' | 'created_at' | 'updated_at'>): Promise<Preferences> {
    const { data, error } = await supabase
      .from('preferences')
      .insert(preferences)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(userId: string, updates: Partial<Preferences>): Promise<Preferences> {
    const { data, error } = await supabase
      .from('preferences')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async upsert(preferences: Omit<Preferences, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<Preferences> {
    const { data, error } = await supabase
      .from('preferences')
      .upsert({
        ...preferences,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

export const campaignService = {
  async getByUserId(userId: string): Promise<Campaign[]> {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(campaign: Omit<Campaign, 'id' | 'created_at' | 'completed_at'>): Promise<Campaign> {
    const { data, error } = await supabase
      .from('campaigns')
      .insert(campaign)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Campaign>): Promise<Campaign> {
    const { data, error } = await supabase
      .from('campaigns')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getById(id: string): Promise<Campaign | null> {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
