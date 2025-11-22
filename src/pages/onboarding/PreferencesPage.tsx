import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Loader2, Target, Mic } from 'lucide-react';
import OnboardingLayout from '../../components/OnboardingLayout';
import { userService, preferencesService } from '../../services/database';
import { useToast } from '../../contexts/ToastContext';

const brandVoices = ['Professional', 'Casual', 'Playful', 'Authoritative', 'Inspirational'];
const visualStyles = ['Minimalist', 'Bold', 'Elegant', 'Vintage', 'Modern', 'Colorful'];
const campaignTimings = [
  'Quarterly campaigns',
  'Monthly campaigns',
  'Event-based (holidays/festivals)',
  'On-demand (whenever I need)'
];

const localEvents = [
  'Diwali', 'Holi', 'Independence Day (Aug 15)', 'Republic Day (Jan 26)',
  'Raksha Bandhan', 'Navratri', 'Eid', 'Christmas', 'New Year'
];

const internationalEvents = [
  'Black Friday', 'Cyber Monday', 'Valentine\'s Day', 'Mother\'s Day',
  'Father\'s Day', 'Halloween', 'Thanksgiving', 'Easter', 'Singles Day (11/11)'
];

export default function PreferencesPage() {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [formData, setFormData] = useState({
    campaignGoal: '',
    brandVoice: '',
    visualStyles: [] as string[],
    campaignTiming: '',
    seasonalEvents: {
      local: [] as string[],
      international: [] as string[]
    },
    enableAutoSuggestions: true
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

      const existingPreferences = await preferencesService.getByUserId(user.id);
      if (existingPreferences) {
        setFormData({
          campaignGoal: existingPreferences.campaign_goal || '',
          brandVoice: existingPreferences.brand_voice || '',
          visualStyles: existingPreferences.visual_styles || [],
          campaignTiming: existingPreferences.campaign_timing || '',
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

  const handleContinue = async () => {
    if (!userId) return;

    setSaving(true);
    try {
      // Get content_type from localStorage or existing preferences
      const existingPreferences = await preferencesService.getByUserId(userId);
      const contentType = existingPreferences?.content_type || localStorage.getItem('selectedContentType') || null;

      await preferencesService.upsert({
        user_id: userId,
        campaign_goal: formData.campaignGoal,
        brand_voice: formData.brandVoice,
        visual_styles: formData.visualStyles,
        campaign_timing: formData.campaignTiming,
        seasonal_events: formData.seasonalEvents,
        enable_auto_suggestions: formData.enableAutoSuggestions,
        content_type: contentType
      });

      success('Campaign preferences saved!');
      navigate('/onboarding/review');
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
      formData.campaignTiming !== ''
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
    <OnboardingLayout currentStep={5} totalSteps={5} stepLabel="Campaign Selection">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg p-8"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Campaign Selection
          </h1>
          <p className="text-slate-600">Configure your campaign preferences</p>
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
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Campaign Timing <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {campaignTimings.map(timing => (
                <label key={timing} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="timing"
                    value={timing}
                    checked={formData.campaignTiming === timing}
                    onChange={(e) => setFormData({ ...formData, campaignTiming: e.target.value })}
                    className="w-4 h-4 text-[#2563EB] focus:ring-[#2563EB]"
                  />
                  <span className="text-slate-700">{timing}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Seasonal Interests
            </label>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-slate-700 mb-3 text-sm">Local & Regional Events</h3>
                <div className="space-y-2">
                  {localEvents.map(event => (
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

              <div>
                <h3 className="font-semibold text-slate-700 mb-3 text-sm">International Events</h3>
                <div className="space-y-2">
                  {internationalEvents.map(event => (
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
              {saving ? 'Saving...' : 'Continue →'}
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
