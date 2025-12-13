import { supabase } from '../lib/supabase';

export interface UserData {
  id: string;
  email: string;
  display_name: string | null;
  has_completed_onboarding: boolean;
  tokens: number | null;
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
  notifications?: {
    emailNotifications?: boolean;
    campaignComplete?: boolean;
    weeklyReport?: boolean;
    marketingTips?: boolean;
  };
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
        notifications: prefs.notifications,
        content_type: prefs.content_type ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      preferences.push(newPref);
      this.savePreferences(preferences);
      return newPref;
    } else {
      // Update existing - merge with existing values
      const updatedPref = {
        ...preferences[index],
        ...prefs,
        updated_at: new Date().toISOString(),
      };
      // If notifications are provided, merge them with existing
      if (prefs.notifications !== undefined) {
        updatedPref.notifications = {
          ...preferences[index].notifications,
          ...prefs.notifications,
        };
      }
      preferences[index] = updatedPref;
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
      // CRITICAL: If content_type is not in the payload, fetch existing preferences to preserve it
      // Supabase upsert may overwrite fields that are omitted from the payload
      if (!preferences.content_type) {
        const existing = await this.getByUserId(preferences.user_id);
        if (existing?.content_type) {
          console.log('🔄 preferencesService.upsert: Preserving existing content_type:', existing.content_type);
          preferences.content_type = existing.content_type;
        }
      }

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
      
      // Log for debugging
      if (preferences.content_type) {
        console.log('✅ preferencesService.upsert: Saved with content_type:', {
          saved: data?.content_type,
          expected: preferences.content_type,
          match: data?.content_type === preferences.content_type
        });
      }
      
      return data;
    } catch (error) {
      console.warn('Supabase upsert failed, falling back to localStorage:', error);
      return localStoragePreferencesService.upsert(preferences);
    }
  },
};

export const campaignService = {
  async getByUserId(userId: string): Promise<Campaign[]> {
    try {
      console.log('🔍 CampaignService: Querying campaigns for user_id:', userId);
      
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ CampaignService: Supabase query error:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          userId: userId
        });
        // Return empty array instead of throwing to prevent UI breakage
        return [];
      }

      const campaigns = data || [];
      console.log(`✅ CampaignService: Found ${campaigns.length} campaigns for user_id: ${userId}`);
      
      return campaigns;
    } catch (err: any) {
      console.error('❌ CampaignService: Unexpected error in getByUserId:', {
        error: err,
        message: err?.message,
        userId: userId
      });
      // Return empty array instead of throwing to prevent UI breakage
      return [];
    }
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

  /**
   * Reconstruct webhook payload from campaign data for regeneration
   * This extracts the stored webhook_payload from generated_assets
   */
  async getWebhookPayloadForCampaign(campaignId: string): Promise<any | null> {
    const campaign = await this.getById(campaignId);
    if (!campaign) return null;

    const generatedAssets = campaign.generated_assets;
    if (generatedAssets && typeof generatedAssets === 'object') {
      // Check if webhook_payload is stored in generated_assets
      if (generatedAssets.webhook_payload) {
        return generatedAssets.webhook_payload;
      }
    }

    // If webhook_payload is not stored, try to reconstruct from brand profile and preferences
    // This is a fallback for older campaigns
    try {
      const brandProfile = await brandProfileService.getByUserId(campaign.user_id);
      const preferences = await preferencesService.getByUserId(campaign.user_id);
      
      // Get user by ID from users table
      // First try to get user by ID directly if we have access to it
      // Otherwise, we'll need to get it from the campaign's user_id
      let user: UserData | null = null;
      
      // Try to get user from localStorage first (for local fallback)
      const currentUserEmail = localStorage.getItem('currentUser');
      if (currentUserEmail) {
        user = await userService.getByEmail(currentUserEmail);
      }
      
      // If we still don't have user, we can't reconstruct the payload
      if (!user || !brandProfile) return null;

      const formattedBrandColors = brandProfile.brand_colors && typeof brandProfile.brand_colors === 'object'
        ? {
            primary: brandProfile.brand_colors.primary || undefined,
            secondary: brandProfile.brand_colors.secondary || undefined,
            accent: brandProfile.brand_colors.accent || undefined,
          }
        : {};

      // Extract campaign market from campaign_market field (preferred) or fallback to campaign_goal
      const marketOptions = ['Local (India)', 'International']; // Global option temporarily disabled - may be needed in future
      const campaignMarket = preferences?.campaign_market || 
        (preferences?.campaign_goal && (marketOptions.includes(preferences.campaign_goal) || preferences.campaign_goal === 'Global')
          ? preferences.campaign_goal 
          : undefined);
      const actualCampaignGoal = preferences?.campaign_goal && !marketOptions.includes(preferences.campaign_goal) && preferences.campaign_goal !== 'Global'
        ? preferences.campaign_goal
        : undefined;

      // CRITICAL: Prefer preferences.content_type over campaign.content_type
      // campaign.content_type should match, but preferences is the source of truth
      const contentType = preferences?.content_type || campaign.content_type || undefined;
      
      // Log warning if content_type is missing
      if (!contentType) {
        console.warn('⚠️ Warning: content_type is missing in reconstructed webhook payload', {
          campaignId: campaign.id,
          hasPreferences: !!preferences,
          preferencesContentType: preferences?.content_type,
          campaignContentType: campaign.content_type
        });
      }
      
      return {
        user_id: user.id,
        user_email: user.email,
        brand_name: brandProfile.brand_name,
        industry: brandProfile.industry,
        audience: brandProfile.audience || undefined,
        website_url: brandProfile.website_url || undefined,
        contact_email: brandProfile.contact_email,
        logo_url: brandProfile.logo || null,
        product_images: Array.isArray(brandProfile.product_images) ? brandProfile.product_images : [],
        brand_colors: formattedBrandColors,
        content_type: contentType,
        campaign_goal: actualCampaignGoal,
        campaign_market: campaignMarket,
        brand_voice: preferences?.brand_voice || undefined,
        visual_styles: Array.isArray(preferences?.visual_styles) && preferences.visual_styles.length > 0 ? preferences.visual_styles : undefined,
        seasonal_events: Array.isArray(preferences?.seasonal_events) && preferences.seasonal_events.length > 0
          ? preferences.seasonal_events
          : (preferences?.seasonal_events && typeof preferences.seasonal_events === 'object'
            ? ((preferences.seasonal_events.local && preferences.seasonal_events.local.length > 0) || 
               (preferences.seasonal_events.international && preferences.seasonal_events.international.length > 0))
              ? preferences.seasonal_events
              : undefined
            : undefined),
      };
    } catch (error) {
      console.error('Error reconstructing webhook payload:', error);
      return null;
    }
  },
};
