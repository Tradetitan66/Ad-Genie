import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Loader2, Target, Mic, RefreshCw, Plus, X } from 'lucide-react';
import OnboardingLayout from '../../components/OnboardingLayout';
import { userService, preferencesService, brandProfileService } from '../../services/database';
import { useToast } from '../../contexts/ToastContext';
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
    seasonalEvents: [] as string[],
    enableAutoSuggestions: true
  });
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [manualEventInput, setManualEventInput] = useState('');

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
        const marketOptions = ['Local (India)', 'International', 'Global'];
        const isMarketValue = existingPreferences.campaign_goal && marketOptions.includes(existingPreferences.campaign_goal);
        
        setFormData({
          campaignGoal: isMarketValue ? '' : (existingPreferences.campaign_goal || ''),
          brandVoice: existingPreferences.brand_voice || '',
          visualStyles: existingPreferences.visual_styles || [],
          seasonalEvents: Array.isArray(existingPreferences.seasonal_events)
            ? existingPreferences.seasonal_events
            : (existingPreferences.seasonal_events?.local || existingPreferences.seasonal_events?.international)
              ? [
                  ...(existingPreferences.seasonal_events.local || []),
                  ...(existingPreferences.seasonal_events.international || [])
                ]
              : [],
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

      // Get market from preferences (campaign_market field)
      const preferences = await preferencesService.getByUserId(userId);
      const marketOptions = ['Local (India)', 'International', 'Global'];
      
      // Get market from campaign_market field (preferred) or fallback to campaign_goal
      const market = preferences?.campaign_market || 
        (preferences?.campaign_goal && marketOptions.includes(preferences.campaign_goal)
          ? preferences.campaign_goal
          : 'Local (India)'); // Default to Local if not set

      console.log('🤖 Fetching AI suggestions...', { industry: brandProfile.industry, market });

      // Fetch suggestions based on selected market:
      // - If "Local (India)" → local events (Indian festivals)
      // - If "International" → international events (country-wise events)
      // - If "Global" → global events (worldwide celebrations)
      let suggestions: string[] = [];
      
      if (market === 'Local (India)') {
        // Fetch local events for India
        suggestions = await generateEventSuggestions(brandProfile.industry, market, 'local');
        console.log('✅ Local (India) events loaded:', suggestions);
      } else if (market === 'International') {
        // Fetch international events (country-wise)
        suggestions = await generateEventSuggestions(brandProfile.industry, market, 'international');
        console.log('✅ International events loaded:', suggestions);
      } else if (market === 'Global') {
        // Fetch global events (worldwide celebrations)
        suggestions = await generateEventSuggestions(brandProfile.industry, market, 'global');
        console.log('✅ Global events loaded:', suggestions);
      } else {
        // Fallback to local if market is not recognized
        suggestions = await generateEventSuggestions(brandProfile.industry, 'Local (India)', 'local');
        console.log('✅ Default local events loaded:', suggestions);
      }

      setAiSuggestions(suggestions);
      console.log('✅ AI suggestions loaded:', suggestions);
    } catch (err: any) {
      console.error('❌ Error fetching AI suggestions:', err);
      setSuggestionError(err.message || 'Failed to load AI suggestions');
      // Don't block the user - they can still add events manually
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSeasonalEventToggle = (event: string) => {
    if (formData.seasonalEvents.includes(event)) {
      // Remove if already selected
      setFormData({
        ...formData,
        seasonalEvents: []
      });
    } else {
      // Only allow 1 selection - replace any existing selection
      setFormData({
        ...formData,
        seasonalEvents: [event]
      });
    }
  };

  const handleAddManualEvent = () => {
    const eventName = manualEventInput.trim();
    if (!eventName) return;

    // Check if event already exists
    if (formData.seasonalEvents.includes(eventName)) {
      error('This event is already selected');
      return;
    }

    // Only allow 1 selection - replace any existing selection
    setFormData({
      ...formData,
      seasonalEvents: [eventName]
    });

    // Clear input
    setManualEventInput('');

    success(`Selected "${eventName}"`);
  };

  const handleRemoveEvent = (event: string) => {
    setFormData({
      ...formData,
      seasonalEvents: formData.seasonalEvents.filter(e => e !== event)
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

      // Webhook will be triggered from ReviewPage when user clicks "Generate Campaign Assets"
      // Do NOT trigger webhook here - only save preferences

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
      formData.visualStyles.length <= 3 &&
      formData.seasonalEvents.length === 1 // Require exactly 1 seasonal event
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
                Seasonal Interest <span className="text-red-500">*</span>
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

            {/* AI Suggestions as Buttons */}
            {loadingSuggestions && aiSuggestions.length === 0 ? (
              <div className="flex items-center gap-2 p-4 text-sm text-slate-500 mb-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading AI suggestions...
              </div>
            ) : aiSuggestions.length > 0 ? (
              <div className="mb-6">
                <p className="text-xs text-slate-500 mb-3">AI Suggestions:</p>
                <div className="flex flex-wrap gap-2">
                  {aiSuggestions.map(event => (
                    <motion.button
                      key={event}
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSeasonalEventToggle(event)}
                      className={`px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
                        formData.seasonalEvents.includes(event)
                          ? 'border-[#2563EB] bg-blue-50 text-[#2563EB]'
                          : 'border-slate-300 hover:border-slate-400 text-slate-700 bg-white'
                      }`}
                    >
                      {event}
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Manual Entry - Single Input */}
            <div className="border-t border-slate-200 pt-4">
              <p className="text-xs text-slate-500 mb-2">
                Add Custom Event {formData.seasonalEvents.length >= 1 && <span className="text-red-500">(Event already selected)</span>}:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualEventInput}
                  onChange={(e) => setManualEventInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddManualEvent();
                    }
                  }}
                  placeholder="Enter event name"
                  disabled={formData.seasonalEvents.length >= 1}
                  className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={handleAddManualEvent}
                  disabled={!manualEventInput.trim() || formData.seasonalEvents.length >= 1}
                  className="px-3 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {formData.seasonalEvents.length === 0 ? 'No event selected' : '1 event selected'}
              </p>
            </div>

            {/* Selected Events */}
            {formData.seasonalEvents.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-slate-500 mb-2">Selected Events:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.seasonalEvents.map(event => (
                    <span
                      key={event}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium"
                    >
                      {event}
                      <button
                        type="button"
                        onClick={() => handleRemoveEvent(event)}
                        className="hover:text-blue-900 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
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
