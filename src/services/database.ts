import { supabase } from '../lib/supabase';

export interface UserData {
  id: string;
  email: string;
  display_name: string | null;
  has_completed_onboarding: boolean;
  created_at: string;
  updated_at: string;
}

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return url && 
    url !== 'your_supabase_project_url' && 
    url.startsWith('http') &&
    key && 
    key !== 'your_supabase_anon_key' && 
    key.length > 20;
};

// LocalStorage fallback for when Supabase isn't configured
const localStorageService = {
  getUsers(): UserData[] {
    const stored = localStorage.getItem('localUsers');
    return stored ? JSON.parse(stored) : [];
  },
  
  saveUsers(users: UserData[]): void {
    localStorage.setItem('localUsers', JSON.stringify(users));
  },
  
  getUserByEmail(email: string): UserData | null {
    const users = this.getUsers();
    return users.find(u => u.email === email) || null;
  },
  
  createUser(email: string, displayName: string): UserData {
    const users = this.getUsers();
    const newUser: UserData = {
      id: `local_${Date.now()}`,
      email,
      display_name: displayName,
      has_completed_onboarding: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  },
  
  updateUser(userId: string, updates: Partial<UserData>): UserData {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) throw new Error('User not found');
    users[index] = { ...users[index], ...updates, updated_at: new Date().toISOString() };
    this.saveUsers(users);
    return users[index];
  },
  
  updateUserByEmail(email: string, updates: Partial<UserData>): UserData {
    const users = this.getUsers();
    const index = users.findIndex(u => u.email === email);
    if (index === -1) throw new Error('User not found');
    users[index] = { ...users[index], ...updates, updated_at: new Date().toISOString() };
    this.saveUsers(users);
    return users[index];
  },
};

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
  seasonal_events: string[] | {
    local?: string[];
    international?: string[];
  };
  enable_auto_suggestions: boolean;
  content_type: string | null;
  campaign_market?: string | null;
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
    // Use localStorage fallback if Supabase is not configured
    if (!isSupabaseConfigured()) {
      return localStorageService.getUserByEmail(email);
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Supabase query failed, falling back to localStorage:', error);
      return localStorageService.getUserByEmail(email);
    }
  },

  async create(email: string, displayName: string): Promise<UserData> {
    // Use localStorage fallback if Supabase is not configured
    if (!isSupabaseConfigured()) {
      return localStorageService.createUser(email, displayName);
    }

    try {
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
    } catch (error) {
      console.warn('Supabase create failed, falling back to localStorage:', error);
      return localStorageService.createUser(email, displayName);
    }
  },

  async update(userId: string, updates: Partial<UserData>): Promise<UserData> {
    // Use localStorage fallback if Supabase is not configured
    if (!isSupabaseConfigured()) {
      return localStorageService.updateUser(userId, updates);
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Supabase update failed, falling back to localStorage:', error);
      return localStorageService.updateUser(userId, updates);
    }
  },

  async updateByEmail(email: string, updates: Partial<UserData>): Promise<UserData> {
    // Use localStorage fallback if Supabase is not configured
    if (!isSupabaseConfigured()) {
      return localStorageService.updateUserByEmail(email, updates);
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('email', email)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Supabase updateByEmail failed, falling back to localStorage:', error);
      return localStorageService.updateUserByEmail(email, updates);
    }
  },

  async completeOnboarding(email: string): Promise<UserData> {
    return this.updateByEmail(email, { has_completed_onboarding: true });
  },
};

// LocalStorage fallback for brand profiles
const localStorageBrandProfileService = {
  getBrandProfiles(): BrandProfile[] {
    const stored = localStorage.getItem('localBrandProfiles');
    return stored ? JSON.parse(stored) : [];
  },
  
  saveBrandProfiles(profiles: BrandProfile[]): void {
    localStorage.setItem('localBrandProfiles', JSON.stringify(profiles));
  },
  
  getByUserId(userId: string): BrandProfile | null {
    const profiles = this.getBrandProfiles();
    return profiles.find(p => p.user_id === userId) || null;
  },
  
  create(profile: Omit<BrandProfile, 'id' | 'created_at' | 'updated_at'>): BrandProfile {
    const profiles = this.getBrandProfiles();
    const newProfile: BrandProfile = {
      id: `local_brand_${Date.now()}`,
      ...profile,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    profiles.push(newProfile);
    this.saveBrandProfiles(profiles);
    return newProfile;
  },
  
  update(id: string, updates: Partial<BrandProfile>): BrandProfile {
    const profiles = this.getBrandProfiles();
    const index = profiles.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Brand profile not found');
    profiles[index] = { ...profiles[index], ...updates, updated_at: new Date().toISOString() };
    this.saveBrandProfiles(profiles);
    return profiles[index];
  },
  
  upsert(profile: Omit<BrandProfile, 'id' | 'created_at' | 'updated_at'> & { id?: string }): BrandProfile {
    const profiles = this.getBrandProfiles();
    const index = profiles.findIndex(p => p.user_id === profile.user_id);
    
    if (index === -1) {
      // Create new
      const newProfile: BrandProfile = {
        id: profile.id || `local_brand_${Date.now()}`,
        ...profile,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      profiles.push(newProfile);
      this.saveBrandProfiles(profiles);
      return newProfile;
    } else {
      // Update existing
      profiles[index] = {
        ...profiles[index],
        ...profile,
        updated_at: new Date().toISOString(),
      };
      this.saveBrandProfiles(profiles);
      return profiles[index];
    }
  },
};

export const brandProfileService = {
  async getByUserId(userId: string): Promise<BrandProfile | null> {
    // Use localStorage fallback if Supabase is not configured
    if (!isSupabaseConfigured()) {
      return localStorageBrandProfileService.getByUserId(userId);
    }

    try {
      const { data, error } = await supabase
        .from('brand_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Supabase getByUserId failed, falling back to localStorage:', error);
      return localStorageBrandProfileService.getByUserId(userId);
    }
  },

  async create(profile: Omit<BrandProfile, 'id' | 'created_at' | 'updated_at'>): Promise<BrandProfile> {
    // Use localStorage fallback if Supabase is not configured
    if (!isSupabaseConfigured()) {
      return localStorageBrandProfileService.create(profile);
    }

    try {
      const { data, error } = await supabase
        .from('brand_profiles')
        .insert(profile)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Supabase create failed, falling back to localStorage:', error);
      return localStorageBrandProfileService.create(profile);
    }
  },

  async update(id: string, updates: Partial<BrandProfile>): Promise<BrandProfile> {
    // Use localStorage fallback if Supabase is not configured
    if (!isSupabaseConfigured()) {
      return localStorageBrandProfileService.update(id, updates);
    }

    try {
      const { data, error } = await supabase
        .from('brand_profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Supabase update failed, falling back to localStorage:', error);
      return localStorageBrandProfileService.update(id, updates);
    }
  },

  async upsert(profile: Omit<BrandProfile, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<BrandProfile> {
    // Use localStorage fallback if Supabase is not configured
    if (!isSupabaseConfigured()) {
      return localStorageBrandProfileService.upsert(profile);
    }

    try {
      const { data, error } = await supabase
        .from('brand_profiles')
        .upsert({
          ...profile,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Supabase upsert failed, falling back to localStorage:', error);
      return localStorageBrandProfileService.upsert(profile);
    }
  },
};

// LocalStorage fallback for preferences
const localStoragePreferencesService = {
  getPreferences(): Preferences[] {
    const stored = localStorage.getItem('localPreferences');
    return stored ? JSON.parse(stored) : [];
  },
  
  savePreferences(preferences: Preferences[]): void {
    localStorage.setItem('localPreferences', JSON.stringify(preferences));
  },
  
  getByUserId(userId: string): Preferences | null {
    const preferences = this.getPreferences();
    return preferences.find(p => p.user_id === userId) || null;
  },
  
  create(prefs: Omit<Preferences, 'id' | 'created_at' | 'updated_at'>): Preferences {
    const preferences = this.getPreferences();
    const newPref: Preferences = {
      id: `local_pref_${Date.now()}`,
      ...prefs,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    preferences.push(newPref);
    this.savePreferences(preferences);
    return newPref;
  },
  
  update(userId: string, updates: Partial<Preferences>): Preferences {
    const preferences = this.getPreferences();
    const index = preferences.findIndex(p => p.user_id === userId);
    if (index === -1) throw new Error('Preferences not found');
    preferences[index] = { ...preferences[index], ...updates, updated_at: new Date().toISOString() };
    this.savePreferences(preferences);
    return preferences[index];
  },
  
  upsert(prefs: Omit<Preferences, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Preferences {
    const preferences = this.getPreferences();
    const index = preferences.findIndex(p => p.user_id === prefs.user_id);
    
    if (index === -1) {
      // Create new with defaults for missing fields
      const newPref: Preferences = {
        id: prefs.id || `local_pref_${Date.now()}`,
        user_id: prefs.user_id,
        campaign_goal: prefs.campaign_goal ?? null,
        brand_voice: prefs.brand_voice ?? null,
        visual_styles: prefs.visual_styles ?? [],
        campaign_timing: prefs.campaign_timing ?? null,
        seasonal_events: prefs.seasonal_events ?? [],
        enable_auto_suggestions: prefs.enable_auto_suggestions ?? true,
        content_type: prefs.content_type ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      preferences.push(newPref);
      this.savePreferences(preferences);
      return newPref;
    } else {
      // Update existing - merge with existing values
      preferences[index] = {
        ...preferences[index],
        ...prefs,
        updated_at: new Date().toISOString(),
      };
      this.savePreferences(preferences);
      return preferences[index];
    }
  },
};

export const preferencesService = {
  async getByUserId(userId: string): Promise<Preferences | null> {
    // Use localStorage fallback if Supabase is not configured
    if (!isSupabaseConfigured()) {
      return localStoragePreferencesService.getByUserId(userId);
    }

    try {
      const { data, error } = await supabase
        .from('preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Supabase getByUserId failed, falling back to localStorage:', error);
      return localStoragePreferencesService.getByUserId(userId);
    }
  },

  async create(preferences: Omit<Preferences, 'id' | 'created_at' | 'updated_at'>): Promise<Preferences> {
    // Use localStorage fallback if Supabase is not configured
    if (!isSupabaseConfigured()) {
      return localStoragePreferencesService.create(preferences);
    }

    try {
      const { data, error } = await supabase
        .from('preferences')
        .insert(preferences)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Supabase create failed, falling back to localStorage:', error);
      return localStoragePreferencesService.create(preferences);
    }
  },

  async update(userId: string, updates: Partial<Preferences>): Promise<Preferences> {
    // Use localStorage fallback if Supabase is not configured
    if (!isSupabaseConfigured()) {
      return localStoragePreferencesService.update(userId, updates);
    }

    try {
      const { data, error } = await supabase
        .from('preferences')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Supabase update failed, falling back to localStorage:', error);
      return localStoragePreferencesService.update(userId, updates);
    }
  },

  async upsert(preferences: Omit<Preferences, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<Preferences> {
    // Use localStorage fallback if Supabase is not configured
    if (!isSupabaseConfigured()) {
      return localStoragePreferencesService.upsert(preferences);
    }

    try {
      const { data, error } = await supabase
        .from('preferences')
        .upsert({
          ...preferences,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Supabase upsert failed, falling back to localStorage:', error);
      return localStoragePreferencesService.upsert(preferences);
    }
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
