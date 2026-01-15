import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Save, User, Building2, Palette, Calendar, Bell } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { useToast } from '../../contexts/ToastContext';
import { userService, brandProfileService, preferencesService } from '../../services/database';

const tabs = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'brand', label: 'Brand Profile', icon: Building2 },
  { id: 'preferences', label: 'Preferences', icon: Palette },
  { id: 'events', label: 'Seasonal Events', icon: Calendar },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

const brandVoices = ['Professional', 'Casual', 'Playful', 'Authoritative', 'Inspirational'];
const visualStyles = ['Minimalist', 'Bold', 'Elegant', 'Vintage', 'Modern', 'Colorful'];
const industries = [
  'E-commerce',
  'Fashion & Apparel',
  'Technology & Software',
  'Food & Beverage',
  'Health & Wellness',
  'Finance & Banking',
  'Real Estate',
  'Education & E-learning',
  'Entertainment & Media',
  'Beauty & Cosmetics',
  'Travel & Hospitality',
  'Automotive',
  'Home & Garden',
  'Sports & Fitness',
  'Other',
];

const preferredLanguages = [
  'English',
  'Hindi',
  'Telugu',
  'Tamil',
];

const localEvents = [
  'Diwali',
  'Holi',
  'Independence Day (Aug 15)',
  'Republic Day (Jan 26)',
  'Raksha Bandhan',
  'Navratri',
  'Eid',
  'Christmas',
  'New Year',
];

const internationalEvents = [
  "Black Friday",
  "Cyber Monday",
  "Valentine's Day",
  "Mother's Day",
  "Father's Day",
  'Halloween',
  'Thanksgiving',
  'Easter',
  'Singles Day (11/11)',
];

export default function SettingsPage() {
  const { success, error } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') || 'account';
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  
  // Update active tab when URL changes
  useEffect(() => {
    const tab = searchParams.get('tab') || 'account';
    setActiveTab(tab);
  }, [searchParams]);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState('');

  const [accountData, setAccountData] = useState({
    email: '',
    displayName: '',
  });

  const [brandData, setBrandData] = useState({
    brandName: '',
    industry: '',
    audience: '',
    websiteUrl: '',
    contactEmail: '',
    preferredLanguage: '',
    brandColors: {
      primary: '#2563EB',
      secondary: '',
      accent: '',
    },
  });

  const [preferencesData, setPreferencesData] = useState({
    campaignGoal: '',
    brandVoice: '',
    visualStyles: [] as string[],
    campaignTiming: '',
    enableAutoSuggestions: true,
  });

  const [seasonalEvents, setSeasonalEvents] = useState({
    local: [] as string[],
    international: [] as string[],
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    campaignComplete: true,
    weeklyReport: false,
    marketingTips: true,
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUserEmail = localStorage.getItem('currentUser');
      if (!currentUserEmail) return;

      const user = await userService.getByEmail(currentUserEmail);
      if (!user) return;

      setUserId(user.id);
      setAccountData({
        email: user.email,
        displayName: user.display_name || '',
      });

      const brandProfile = await brandProfileService.getByUserId(user.id);
      if (brandProfile) {
        setBrandData({
          brandName: brandProfile.brand_name,
          industry: brandProfile.industry,
          audience: brandProfile.audience || '',
          websiteUrl: brandProfile.website_url,
          contactEmail: brandProfile.contact_email,
          preferredLanguage: brandProfile.preferred_language || '',
          brandColors: brandProfile.brand_colors || { primary: '#2563EB', secondary: '', accent: '' },
        });
      }

      const preferences = await preferencesService.getByUserId(user.id);
      if (preferences) {
        setPreferencesData({
          campaignGoal: preferences.campaign_goal || '',
          brandVoice: preferences.brand_voice || '',
          visualStyles: preferences.visual_styles || [],
          campaignTiming: preferences.campaign_timing || '',
          enableAutoSuggestions: preferences.enable_auto_suggestions,
        });
        // Handle both formats: array (new) or object with local/international (old)
        if (preferences.seasonal_events) {
          if (Array.isArray(preferences.seasonal_events)) {
            // New format: array of strings - convert to object format for settings page
            setSeasonalEvents({ local: preferences.seasonal_events, international: [] });
          } else if (typeof preferences.seasonal_events === 'object' && preferences.seasonal_events !== null) {
            // Old format: object with local/international
            setSeasonalEvents({
              local: Array.isArray(preferences.seasonal_events.local) ? preferences.seasonal_events.local : [],
              international: Array.isArray(preferences.seasonal_events.international) ? preferences.seasonal_events.international : [],
            });
          } else {
            setSeasonalEvents({ local: [], international: [] });
          }
        } else {
          setSeasonalEvents({ local: [], international: [] });
        }
        if (preferences.notifications) {
          setNotifications({
            emailNotifications: preferences.notifications.emailNotifications ?? true,
            campaignComplete: preferences.notifications.campaignComplete ?? true,
            weeklyReport: preferences.notifications.weeklyReport ?? false,
            marketingTips: preferences.notifications.marketingTips ?? true,
          });
        }
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      error('Failed to load settings');
    }
  };

  const handleSaveAccount = async () => {
    if (!userId) {
      error('User ID not found. Please refresh the page.');
      return;
    }
    setSaving(true);
    try {
      await userService.update(userId, {
        display_name: accountData.displayName,
      });
    } catch (err) {
      console.error('Error saving account:', err);
      error('Failed to save account settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBrand = async () => {
    if (!userId) {
      error('User ID not found. Please refresh the page.');
      return;
    }
    setSaving(true);
    try {
      const brandProfile = await brandProfileService.getByUserId(userId);
      if (brandProfile) {
        await brandProfileService.update(brandProfile.id, {
          brand_name: brandData.brandName,
          industry: brandData.industry,
          audience: brandData.audience,
          website_url: brandData.websiteUrl,
          contact_email: brandData.contactEmail,
          preferred_language: brandData.preferredLanguage || null,
          brand_colors: brandData.brandColors,
        });
      } else {
        await brandProfileService.create({
          user_id: userId,
          brand_name: brandData.brandName,
          industry: brandData.industry,
          audience: brandData.audience,
          website_url: brandData.websiteUrl,
          contact_email: brandData.contactEmail,
          preferred_language: brandData.preferredLanguage || null,
          brand_colors: brandData.brandColors,
          logo: null,
          product_images: [],
        });
      }
    } catch (err) {
      console.error('Error saving brand:', err);
      error('Failed to save brand profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!userId) {
      error('User ID not found. Please refresh the page.');
      return;
    }
    setSaving(true);
    try {
      // Get existing preferences to preserve notifications
      const existingPreferences = await preferencesService.getByUserId(userId);
      await preferencesService.upsert({
        user_id: userId,
        campaign_goal: preferencesData.campaignGoal,
        brand_voice: preferencesData.brandVoice,
        visual_styles: preferencesData.visualStyles,
        campaign_timing: preferencesData.campaignTiming,
        seasonal_events: seasonalEvents,
        enable_auto_suggestions: preferencesData.enableAutoSuggestions,
        notifications: existingPreferences?.notifications, // Preserve existing notifications
      });
    } catch (err) {
      console.error('Error saving preferences:', err);
      error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!userId) {
      error('User ID not found. Please refresh the page.');
      return;
    }
    setSaving(true);
    try {
      // Get existing preferences first
      const existingPreferences = await preferencesService.getByUserId(userId);
      await preferencesService.upsert({
        user_id: userId,
        campaign_goal: existingPreferences?.campaign_goal || null,
        brand_voice: existingPreferences?.brand_voice || null,
        visual_styles: existingPreferences?.visual_styles || [],
        campaign_timing: existingPreferences?.campaign_timing || null,
        seasonal_events: existingPreferences?.seasonal_events || { local: [], international: [] },
        enable_auto_suggestions: existingPreferences?.enable_auto_suggestions ?? true,
        notifications: notifications,
      });
    } catch (err) {
      console.error('Error saving notifications:', err);
      error('Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  const toggleVisualStyle = (style: string) => {
    if (preferencesData.visualStyles.includes(style)) {
      setPreferencesData({
        ...preferencesData,
        visualStyles: preferencesData.visualStyles.filter((s) => s !== style),
      });
    } else if (preferencesData.visualStyles.length < 3) {
      setPreferencesData({
        ...preferencesData,
        visualStyles: [...preferencesData.visualStyles, style],
      });
    }
  };

  const toggleSeasonalEvent = (event: string, type: 'local' | 'international') => {
    // Ensure seasonalEvents is in the correct format
    const safeSeasonalEvents = {
      local: Array.isArray(seasonalEvents?.local) ? seasonalEvents.local : [],
      international: Array.isArray(seasonalEvents?.international) ? seasonalEvents.international : [],
    };
    
    const currentEvents = safeSeasonalEvents[type];
    if (currentEvents.includes(event)) {
      setSeasonalEvents({
        ...safeSeasonalEvents,
        [type]: currentEvents.filter((e) => e !== event),
      });
    } else {
      setSeasonalEvents({
        ...safeSeasonalEvents,
        [type]: [...currentEvents, event],
      });
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'account':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-[#2D3142] mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={accountData.email}
                disabled
                className="w-full px-4 py-3 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] text-[#6B7280]"
              />
              <p className="text-xs text-[#6B7280] mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#2D3142] mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={accountData.displayName}
                onChange={(e) =>
                  setAccountData({ ...accountData, displayName: e.target.value })
                }
                className="w-full px-4 py-3 rounded-lg border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="Enter your display name"
              />
            </div>
            <button
              onClick={handleSaveAccount}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-400 to-orange-600 text-white font-semibold rounded-lg shadow-md hover:from-orange-500 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        );

      case 'brand':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-[#2D3142] mb-2">
                Brand Name
              </label>
              <input
                type="text"
                value={brandData.brandName}
                onChange={(e) => setBrandData({ ...brandData, brandName: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="Enter your brand name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#2D3142] mb-2">Industry</label>
              <select
                value={brandData.industry}
                onChange={(e) => setBrandData({ ...brandData, industry: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              >
                <option value="">Select an industry</option>
                {industries.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#2D3142] mb-2">
                Target Audience
              </label>
              <textarea
                value={brandData.audience}
                onChange={(e) => setBrandData({ ...brandData, audience: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="e.g., Young professionals aged 25-35"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#2D3142] mb-2">
                Preferred Language
              </label>
              <select
                value={brandData.preferredLanguage}
                onChange={(e) => setBrandData({ ...brandData, preferredLanguage: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              >
                <option value="">Select language</option>
                {preferredLanguages.map((language) => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </select>
              <p className="text-xs text-[#6B7280] mt-1">Select your preferred language for campaign content</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#2D3142] mb-2">
                Website URL
              </label>
              <input
                type="url"
                value={brandData.websiteUrl}
                onChange={(e) => setBrandData({ ...brandData, websiteUrl: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="https://yourbrand.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#2D3142] mb-2">
                Contact Email
              </label>
              <input
                type="email"
                value={brandData.contactEmail}
                onChange={(e) => setBrandData({ ...brandData, contactEmail: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="contact@yourbrand.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#2D3142] mb-3">
                Brand Colors
              </label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-[#6B7280] mb-2">Primary</label>
                  <input
                    type="color"
                    value={brandData.brandColors.primary}
                    onChange={(e) =>
                      setBrandData({
                        ...brandData,
                        brandColors: { ...brandData.brandColors, primary: e.target.value },
                      })
                    }
                    className="w-full h-12 rounded-lg cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#6B7280] mb-2">Secondary</label>
                  <input
                    type="color"
                    value={brandData.brandColors.secondary}
                    onChange={(e) =>
                      setBrandData({
                        ...brandData,
                        brandColors: { ...brandData.brandColors, secondary: e.target.value },
                      })
                    }
                    className="w-full h-12 rounded-lg cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#6B7280] mb-2">Accent</label>
                  <input
                    type="color"
                    value={brandData.brandColors.accent}
                    onChange={(e) =>
                      setBrandData({
                        ...brandData,
                        brandColors: { ...brandData.brandColors, accent: e.target.value },
                      })
                    }
                    className="w-full h-12 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>
            <button
              onClick={handleSaveBrand}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-400 to-orange-600 text-white font-semibold rounded-lg shadow-md hover:from-orange-500 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-[#2D3142] mb-2">
                Campaign Goal
              </label>
              <textarea
                value={preferencesData.campaignGoal}
                onChange={(e) =>
                  setPreferencesData({ ...preferencesData, campaignGoal: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="e.g., Increase brand awareness, drive sales"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#2D3142] mb-2">
                Brand Voice
              </label>
              <select
                value={preferencesData.brandVoice}
                onChange={(e) =>
                  setPreferencesData({ ...preferencesData, brandVoice: e.target.value })
                }
                className="w-full px-4 py-3 rounded-lg border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              >
                <option value="">Select a brand voice</option>
                {brandVoices.map((voice) => (
                  <option key={voice} value={voice}>
                    {voice}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#2D3142] mb-2">
                Visual Styles (Select 1-3)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {visualStyles.map((style) => (
                  <button
                    key={style}
                    onClick={() => toggleVisualStyle(style)}
                    className={`px-4 py-3 rounded-lg border-2 transition-all ${
                      preferencesData.visualStyles.includes(style)
                        ? 'border-orange-500 bg-orange-50 text-orange-600'
                        : 'border-[#E5E7EB] hover:border-orange-300'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="autoSuggestions"
                checked={preferencesData.enableAutoSuggestions}
                onChange={(e) =>
                  setPreferencesData({
                    ...preferencesData,
                    enableAutoSuggestions: e.target.checked,
                  })
                }
                className="w-5 h-5 accent-orange-500"
              />
              <label htmlFor="autoSuggestions" className="text-sm text-[#2D3142]">
                Enable automatic seasonal suggestions
              </label>
            </div>
            <button
              onClick={handleSavePreferences}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-400 to-orange-600 text-white font-semibold rounded-lg shadow-md hover:from-orange-500 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        );

      case 'events':
        // Ensure seasonalEvents is in the correct format
        const safeSeasonalEvents = {
          local: Array.isArray(seasonalEvents?.local) ? seasonalEvents.local : [],
          international: Array.isArray(seasonalEvents?.international) ? seasonalEvents.international : [],
        };
        
        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-[#2D3142] mb-3">Local & Regional Events</h3>
                <div className="space-y-2">
                  {localEvents.map((event) => (
                    <label key={event} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={safeSeasonalEvents.local.includes(event)}
                        onChange={() => toggleSeasonalEvent(event, 'local')}
                        className="w-4 h-4 accent-orange-500 rounded"
                      />
                      <span className="text-sm text-[#2D3142]">{event}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-[#2D3142] mb-3">International Events</h3>
                <div className="space-y-2">
                  {internationalEvents.map((event) => (
                    <label key={event} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={safeSeasonalEvents.international.includes(event)}
                        onChange={() => toggleSeasonalEvent(event, 'international')}
                        className="w-4 h-4 accent-orange-500 rounded"
                      />
                      <span className="text-sm text-[#2D3142]">{event}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={handleSavePreferences}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-400 to-orange-600 text-white font-semibold rounded-lg shadow-md hover:from-orange-500 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-[#FAFAFA] rounded-lg cursor-pointer">
                <div>
                  <p className="font-semibold text-[#2D3142]">Email Notifications</p>
                  <p className="text-sm text-[#6B7280]">Receive email updates</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.emailNotifications}
                  onChange={(e) =>
                    setNotifications({ ...notifications, emailNotifications: e.target.checked })
                  }
                  className="w-5 h-5 accent-orange-500"
                />
              </label>
              <label className="flex items-center justify-between p-4 bg-[#FAFAFA] rounded-lg cursor-pointer">
                <div>
                  <p className="font-semibold text-[#2D3142]">Campaign Complete</p>
                  <p className="text-sm text-[#6B7280]">Notify when campaign generation finishes</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.campaignComplete}
                  onChange={(e) =>
                    setNotifications({ ...notifications, campaignComplete: e.target.checked })
                  }
                  className="w-5 h-5 accent-orange-500"
                />
              </label>
              <label className="flex items-center justify-between p-4 bg-[#FAFAFA] rounded-lg cursor-pointer">
                <div>
                  <p className="font-semibold text-[#2D3142]">Weekly Report</p>
                  <p className="text-sm text-[#6B7280]">Get weekly campaign performance reports</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.weeklyReport}
                  onChange={(e) =>
                    setNotifications({ ...notifications, weeklyReport: e.target.checked })
                  }
                  className="w-5 h-5 accent-orange-500"
                />
              </label>
              <label className="flex items-center justify-between p-4 bg-[#FAFAFA] rounded-lg cursor-pointer">
                <div>
                  <p className="font-semibold text-[#2D3142]">Marketing Tips</p>
                  <p className="text-sm text-[#6B7280]">Receive helpful marketing tips</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.marketingTips}
                  onChange={(e) =>
                    setNotifications({ ...notifications, marketingTips: e.target.checked })
                  }
                  className="w-5 h-5 accent-orange-500"
                />
              </label>
            </div>
            <button
              onClick={handleSaveNotifications}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-400 to-orange-600 text-white font-semibold rounded-lg shadow-md hover:from-orange-500 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  // Get active tab label for breadcrumb
  const activeTabLabel = tabs.find(t => t.id === activeTab)?.label || 'Settings';

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <PageHeader />
      
      {/* Breadcrumb */}
      <div className="pt-20 pb-4 px-4 md:px-8">
        <div className="max-w-[1400px] mx-auto">
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-sm">
              <li>
                <Link to="/dashboard/campaign-hub" className="text-[#6B7280] hover:text-orange-500 transition-colors">
                  Dashboard
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#E5E7EB]">/</span>
                <Link to="/dashboard/settings" className="text-[#6B7280] hover:text-orange-500 transition-colors">
                  Settings
                </Link>
              </li>
              {activeTab !== 'account' && (
                <li className="flex items-center gap-2">
                  <span className="text-[#E5E7EB]">/</span>
                  <span className="text-[#2D3142] font-medium">{activeTabLabel}</span>
                </li>
              )}
            </ol>
          </nav>
        </div>
      </div>

      {/* Page Content */}
      <div className="px-4 md:px-8 pb-12">
        <div className="max-w-[1400px] mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[#2D3142] mb-2">Settings</h1>
            <p className="text-[#6B7280]">Manage your account and preferences</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="md:col-span-1">
              <nav className="space-y-1 bg-white rounded-2xl shadow-lg p-4" aria-label="Settings navigation">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setSearchParams({ tab: tab.id });
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                        activeTab === tab.id
                          ? 'bg-orange-50 text-orange-600 font-semibold'
                          : 'text-[#6B7280] hover:bg-[#FAFAFA]'
                      }`}
                      aria-current={activeTab === tab.id ? 'page' : undefined}
                    >
                      <Icon size={20} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="md:col-span-3">
              <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">{renderContent()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
