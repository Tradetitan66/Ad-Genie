import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Loader2, Target, Mic, RefreshCw, Plus, X } from 'lucide-react';
import OnboardingLayout from '../../components/OnboardingLayout';
import { userService, preferencesService, brandProfileService } from '../../services/database';
import { useToast } from '../../contexts/ToastContext';
import { sendBrandDataToWebhook } from '../../services/webhookService';
import { generateEventSuggestions } from '../../services/openaiService';

const brandVoices = ['Professional', 'Casual', 'Playful', 'Authoritative', 'Inspirational'];
const visualStyles = ['Minimalist', 'Bold', 'Elegant', 'Vintage', 'Modern', 'Colorful'];

export default function PreferencesPage() {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    campaignGoal: '',
    brandVoice: '',
    visualStyles: [] as string[],
    seasonalEvents: {
      local: [] as string[],
      international: [] as string[]
    },
    enableAutoSuggestions: true
  });
  const [aiSuggestions, setAiSuggestions] = useState<{ local: string[], international: string[] }>({
    local: [],
    international: []
  });
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [manualEventInputs, setManualEventInputs] = useState<{ local: string, international: string }>({
    local: '',
    international: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUserEmail = localStorage.getItem('currentUser');
      if (!currentUserEmail) {
        navigate('/login');
        return;
      }

      const user = await userService.getByEmail(currentUserEmail);
      if (!user) {
        navigate('/login');
        return;
      }

      setUserId(user.id);
      
      // Check if user has completed onboarding (edit mode)
      setIsEditMode(user.has_completed_onboarding || false);

      const existingPreferences = await preferencesService.getByUserId(user.id);
      if (existingPreferences) {
        // If campaign_goal is a market value (from ContentSelectionPage), preserve it but don't show as goal
        // Otherwise, use it as the campaign goal
        const marketOptions = ['Local (India)', 'Regional (Specific States/Regions)', 'International', 'Global'];
        const isMarketValue = existingPreferences.campaign_goal && marketOptions.includes(existingPreferences.campaign_goal);
        
        setFormData({
          campaignGoal: isMarketValue ? '' : (existingPreferences.campaign_goal || ''),
          brandVoice: existingPreferences.brand_voice || '',
          visualStyles: existingPreferences.visual_styles || [],
          seasonalEvents: (existingPreferences.seasonal_events?.local && existingPreferences.seasonal_events?.international)
            ? {
                local: existingPreferences.seasonal_events.local,
                international: existingPreferences.seasonal_events.international
              }
            : { local: [], international: [] },
          enableAutoSuggestions: existingPreferences.enable_auto_suggestions
        });
      }
    } catch (err) {
      console.error('Error loading preferences:', err);
      error('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleVisualStyleToggle = (style: string) => {
    if (formData.visualStyles.includes(style)) {
      setFormData({
        ...formData,
        visualStyles: formData.visualStyles.filter(s => s !== style)
      });
    } else if (formData.visualStyles.length < 3) {
      setFormData({
        ...formData,
        visualStyles: [...formData.visualStyles, style]
      });
    }
  };

  const fetchAISuggestions = async () => {
    if (!userId) return;

    setLoadingSuggestions(true);
    setSuggestionError(null);

    try {
      // Get industry from brand profile
      const brandProfile = await brandProfileService.getByUserId(userId);
      if (!brandProfile || !brandProfile.industry) {
        console.log('⚠️ No industry found, skipping AI suggestions');
        setLoadingSuggestions(false);
        return;
      }

      // Get market from preferences
      const preferences = await preferencesService.getByUserId(userId);
      const marketOptions = ['Local (India)', 'Regional (Specific States/Regions)', 'International', 'Global'];
      const market = preferences?.campaign_goal && marketOptions.includes(preferences.campaign_goal)
        ? preferences.campaign_goal
        : 'Local (India)'; // Default to Local if not set

      console.log('🤖 Fetching AI suggestions...', { industry: brandProfile.industry, market });

      // Fetch suggestions for both local and international
      const [localSuggestions, internationalSuggestions] = await Promise.all([
        generateEventSuggestions(brandProfile.industry, market, 'local'),
        generateEventSuggestions(brandProfile.industry, market, 'international')
      ]);

      setAiSuggestions({
        local: localSuggestions,
        international: internationalSuggestions
      });

      console.log('✅ AI suggestions loaded:', { local: localSuggestions, international: internationalSuggestions });
    } catch (err: any) {
      console.error('❌ Error fetching AI suggestions:', err);
      setSuggestionError(err.message || 'Failed to load AI suggestions');
      // Don't block the user - they can still add events manually
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSeasonalEventToggle = (event: string, type: 'local' | 'international') => {
    const currentEvents = formData.seasonalEvents[type];
    if (currentEvents.includes(event)) {
      setFormData({
        ...formData,
        seasonalEvents: {
          ...formData.seasonalEvents,
          [type]: currentEvents.filter(e => e !== event)
        }
      });
    } else {
      setFormData({
        ...formData,
        seasonalEvents: {
          ...formData.seasonalEvents,
          [type]: [...currentEvents, event]
        }
      });
    }
  };

  const handleAddManualEvent = (type: 'local' | 'international') => {
    const eventName = manualEventInputs[type].trim();
    if (!eventName) return;

    // Check if event already exists
    if (formData.seasonalEvents[type].includes(eventName)) {
      error('This event is already added');
      return;
    }

    // Add to selected events
    setFormData({
      ...formData,
      seasonalEvents: {
        ...formData.seasonalEvents,
        [type]: [...formData.seasonalEvents[type], eventName]
      }
    });

    // Clear input
    setManualEventInputs({
      ...manualEventInputs,
      [type]: ''
    });

    success(`Added "${eventName}" to ${type === 'local' ? 'local' : 'international'} events`);
  };

  const handleRemoveManualEvent = (event: string, type: 'local' | 'international') => {
    setFormData({
      ...formData,
      seasonalEvents: {
        ...formData.seasonalEvents,
        [type]: formData.seasonalEvents[type].filter(e => e !== event)
      }
    });
  };

  const handleContinue = async () => {
    if (!userId) return;

    setSaving(true);
    try {
      // Get content_type from localStorage or existing preferences
      const existingPreferences = await preferencesService.getByUserId(userId);
      const contentType = existingPreferences?.content_type || localStorage.getItem('selectedContentType') || null;

      // Preserve market value if it was set from ContentSelectionPage
      // Market is stored in campaign_goal initially, then user enters actual goal
      const marketOptions = ['Local (India)', 'Regional (Specific States/Regions)', 'International', 'Global'];
      const currentMarket = existingPreferences?.campaign_goal && marketOptions.includes(existingPreferences.campaign_goal)
        ? existingPreferences.campaign_goal
        : null;
      
      // Use campaign goal if provided, otherwise keep the market value
      // If user entered a goal, use it; otherwise preserve market for webhook
      const finalCampaignGoal = formData.campaignGoal.trim() || currentMarket || '';

      await preferencesService.upsert({
        user_id: userId,
        campaign_goal: finalCampaignGoal,
        brand_voice: formData.brandVoice,
        visual_styles: formData.visualStyles,
        campaign_timing: null, // Removed - no longer used
        seasonal_events: formData.seasonalEvents,
        enable_auto_suggestions: formData.enableAutoSuggestions,
        content_type: contentType
      });

      // Send webhook with all data (brand details, assets, and preferences) after saving campaign selection
      try {
        // Fetch complete brand profile and user data for webhook
        const currentUserEmail = localStorage.getItem('currentUser');
        if (!currentUserEmail) {
          throw new Error('User email not found');
        }
        
        const [user, brandProfile, latestPreferences] = await Promise.all([
          userService.getByEmail(currentUserEmail),
          brandProfileService.getByUserId(userId),
          preferencesService.getByUserId(userId)
        ]);

        if (user && brandProfile) {
          // Format brand colors
          const formattedBrandColors = brandProfile.brand_colors && typeof brandProfile.brand_colors === 'object'
            ? {
                primary: brandProfile.brand_colors.primary || undefined,
                secondary: brandProfile.brand_colors.secondary || undefined,
                accent: brandProfile.brand_colors.accent || undefined,
              }
            : {};

          // Extract campaign market if campaign_goal is a market value
          const marketOptions = ['Local (India)', 'Regional (Specific States/Regions)', 'International', 'Global'];
          const campaignGoalValue = latestPreferences?.campaign_goal || formData.campaignGoal || '';
          const isMarketValue = marketOptions.includes(campaignGoalValue);
          const campaignMarket = isMarketValue ? campaignGoalValue : undefined;
          const actualCampaignGoal = isMarketValue ? undefined : campaignGoalValue;

          await sendBrandDataToWebhook({
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
            content_type: latestPreferences?.content_type || contentType || undefined,
            campaign_goal: actualCampaignGoal,
            campaign_market: campaignMarket,
            brand_voice: latestPreferences?.brand_voice || formData.brandVoice || undefined,
            visual_styles: Array.isArray(latestPreferences?.visual_styles) && latestPreferences.visual_styles.length > 0 
              ? latestPreferences.visual_styles 
              : (formData.visualStyles.length > 0 ? formData.visualStyles : undefined),
            campaign_timing: undefined, // Removed - no longer used
            seasonal_events: latestPreferences?.seasonal_events && typeof latestPreferences.seasonal_events === 'object'
              ? ((latestPreferences.seasonal_events.local && latestPreferences.seasonal_events.local.length > 0) || 
                 (latestPreferences.seasonal_events.international && latestPreferences.seasonal_events.international.length > 0))
                ? latestPreferences.seasonal_events
                : undefined
              : ((formData.seasonalEvents.local.length > 0 || formData.seasonalEvents.international.length > 0)
                  ? formData.seasonalEvents
                  : undefined),
          });
          console.log('✅ All data sent to webhook successfully (brand details + assets + preferences)');
        }
      } catch (webhookError: any) {
        console.error('⚠️ Webhook error (continuing anyway):', webhookError);
        // Show warning but don't block the user flow
        error(`Webhook failed: ${webhookError.message}. Continuing...`);
      }

      success('Campaign preferences saved!');
      
      // Navigate based on mode
      if (isEditMode) {
        navigate('/dashboard/campaign-hub');
      } else {
        navigate('/onboarding/review');
      }
    } catch (err) {
      console.error('Error saving preferences:', err);
      error('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.campaignGoal.trim() !== '' &&
      formData.brandVoice !== '' &&
      formData.visualStyles.length >= 1 &&
      formData.visualStyles.length <= 3
    );
  };

  if (loading) {
    return (
      <OnboardingLayout currentStep={5} totalSteps={5} stepLabel="Loading campaign selection...">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-[#2563EB] animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading...</p>
          </div>
        </div>
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout currentStep={5} totalSteps={5} stepLabel={isEditMode ? "Edit Campaign Selection" : "Campaign Selection"}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg p-8"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {isEditMode ? 'Edit Campaign Selection' : 'Campaign Selection'}
          </h1>
          <p className="text-slate-600">{isEditMode ? 'Update your campaign preferences' : 'Configure your campaign preferences'}</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Campaign Goal <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-slate-500 mb-2">What's your main campaign goal?</p>
            <div className="relative">
              <Target className="absolute left-3 top-4 text-slate-400" size={20} />
              <textarea
                value={formData.campaignGoal}
                onChange={(e) => setFormData({ ...formData, campaignGoal: e.target.value })}
                maxLength={300}
                rows={3}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent resize-none"
                placeholder="e.g., Increase brand awareness, drive sales, promote new products"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">{formData.campaignGoal.length}/300</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Brand Voice <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mic className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <select
                value={formData.brandVoice}
                onChange={(e) => setFormData({ ...formData, brandVoice: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent bg-white text-slate-900"
              >
                <option value="">Select a brand voice</option>
                {brandVoices.map(voice => (
                  <option key={voice} value={voice}>{voice}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Visual Style <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-slate-500 mb-3">Select 1-3 styles</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {visualStyles.map(style => (
                <motion.button
                  key={style}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleVisualStyleToggle(style)}
                  className={`px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium ${
                    formData.visualStyles.includes(style)
                      ? 'border-[#2563EB] bg-blue-50 text-[#2563EB]'
                      : 'border-slate-300 hover:border-slate-400 text-slate-700 bg-white'
                  }`}
                >
                  {style}
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-slate-700">
                Seasonal Interests
              </label>
              <button
                type="button"
                onClick={fetchAISuggestions}
                disabled={loadingSuggestions}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#2563EB] bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <RefreshCw className={`w-3 h-3 ${loadingSuggestions ? 'animate-spin' : ''}`} />
                {loadingSuggestions ? 'Loading...' : 'Refresh Suggestions'}
              </button>
            </div>

            {suggestionError && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">
                  ⚠️ {suggestionError}. You can still add events manually below.
                </p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {/* Local & Regional Events */}
              <div>
                <h3 className="font-semibold text-slate-700 mb-3 text-sm">Local & Regional Events</h3>
                
                {/* AI Suggestions */}
                {loadingSuggestions && aiSuggestions.local.length === 0 ? (
                  <div className="flex items-center gap-2 p-4 text-sm text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading AI suggestions...
                  </div>
                ) : aiSuggestions.local.length > 0 ? (
                  <div className="mb-4">
                    <p className="text-xs text-slate-500 mb-2">AI Suggestions:</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {aiSuggestions.local.map(event => (
                        <label key={event} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.seasonalEvents.local.includes(event)}
                            onChange={() => handleSeasonalEventToggle(event, 'local')}
                            className="w-4 h-4 text-[#2563EB] focus:ring-[#2563EB] rounded border-slate-300"
                          />
                          <span className="text-sm text-slate-700">{event}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Manual Entry */}
                <div className="border-t border-slate-200 pt-3">
                  <p className="text-xs text-slate-500 mb-2">Add Custom Event:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualEventInputs.local}
                      onChange={(e) => setManualEventInputs({ ...manualEventInputs, local: e.target.value })}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddManualEvent('local');
                        }
                      }}
                      placeholder="Enter event name"
                      className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddManualEvent('local')}
                      disabled={!manualEventInputs.local.trim()}
                      className="px-3 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Selected Events */}
                {formData.seasonalEvents.local.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-slate-500 mb-2">Selected Events:</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.seasonalEvents.local.map(event => (
                        <span
                          key={event}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                        >
                          {event}
                          <button
                            type="button"
                            onClick={() => handleRemoveManualEvent(event, 'local')}
                            className="hover:text-blue-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* International Events */}
              <div>
                <h3 className="font-semibold text-slate-700 mb-3 text-sm">International Events</h3>
                
                {/* AI Suggestions */}
                {loadingSuggestions && aiSuggestions.international.length === 0 ? (
                  <div className="flex items-center gap-2 p-4 text-sm text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading AI suggestions...
                  </div>
                ) : aiSuggestions.international.length > 0 ? (
                  <div className="mb-4">
                    <p className="text-xs text-slate-500 mb-2">AI Suggestions:</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {aiSuggestions.international.map(event => (
                        <label key={event} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.seasonalEvents.international.includes(event)}
                            onChange={() => handleSeasonalEventToggle(event, 'international')}
                            className="w-4 h-4 text-[#2563EB] focus:ring-[#2563EB] rounded border-slate-300"
                          />
                          <span className="text-sm text-slate-700">{event}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Manual Entry */}
                <div className="border-t border-slate-200 pt-3">
                  <p className="text-xs text-slate-500 mb-2">Add Custom Event:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualEventInputs.international}
                      onChange={(e) => setManualEventInputs({ ...manualEventInputs, international: e.target.value })}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddManualEvent('international');
                        }
                      }}
                      placeholder="Enter event name"
                      className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddManualEvent('international')}
                      disabled={!manualEventInputs.international.trim()}
                      className="px-3 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Selected Events */}
                {formData.seasonalEvents.international.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-slate-500 mb-2">Selected Events:</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.seasonalEvents.international.map(event => (
                        <span
                          key={event}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                        >
                          {event}
                          <button
                            type="button"
                            onClick={() => handleRemoveManualEvent(event, 'international')}
                            className="hover:text-blue-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 bg-slate-50">
            <input
              type="checkbox"
              id="autoSuggestions"
              checked={formData.enableAutoSuggestions}
              onChange={(e) => setFormData({ ...formData, enableAutoSuggestions: e.target.checked })}
              className="w-5 h-5 text-[#2563EB] focus:ring-[#2563EB] rounded border-slate-300"
            />
            <label htmlFor="autoSuggestions" className="text-sm text-slate-700 cursor-pointer">
              Enable automatic seasonal suggestions
            </label>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/onboarding/visual-assets')}
              className="px-6 py-3 rounded-lg border border-slate-300 hover:bg-slate-50 transition-all text-slate-700"
            >
              Back
            </button>
            <button
              onClick={handleContinue}
              disabled={!isFormValid() || saving}
              className="flex-1 px-6 py-3 bg-[#2563EB] text-white font-semibold rounded-lg shadow-md hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {saving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Continue →'}
            </button>
          </div>
          <p className="text-xs text-slate-500 text-center mt-4">
            You can change these anytime from your dashboard
          </p>
        </div>
      </motion.div>
    </OnboardingLayout>
  );
}
