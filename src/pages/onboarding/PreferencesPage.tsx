import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Save } from 'lucide-react';

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
  const [saving, setSaving] = useState(false);
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
    const currentUserEmail = localStorage.getItem('currentUser');
    if (!currentUserEmail) {
      navigate('/login');
    }
  }, [navigate]);

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

  const handleContinue = () => {
    const currentUserEmail = localStorage.getItem('currentUser');
    if (!currentUserEmail) return;

    const users = JSON.parse(localStorage.getItem('users') || '{}');
    users[currentUserEmail].preferences = formData;
    localStorage.setItem('users', JSON.stringify(users));

    setSaving(true);
    setTimeout(() => {
      navigate('/onboarding/brand-details');
    }, 500);
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

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-8"
        >
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
              <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-[#2563EB] h-full w-2/6 rounded-full transition-all"></div>
              </div>
              <span className="font-semibold">Step 2 of 6</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Let's Personalize Your Experience
            </h1>
            <p className="text-slate-600">Tell us about your creative preferences</p>
          </div>

          <div className="space-y-8">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Campaign Goal <span className="text-[#EF4444]">*</span>
              </label>
              <p className="text-sm text-slate-500 mb-2">What's your main campaign goal?</p>
              <textarea
                value={formData.campaignGoal}
                onChange={(e) => setFormData({ ...formData, campaignGoal: e.target.value })}
                maxLength={300}
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:border-[#2563EB] transition-colors"
                placeholder="e.g., Increase brand awareness, drive sales, promote new products"
              />
              <p className="text-xs text-slate-400 mt-1">{formData.campaignGoal.length}/300</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Brand Voice <span className="text-[#EF4444]">*</span>
              </label>
              <select
                value={formData.brandVoice}
                onChange={(e) => setFormData({ ...formData, brandVoice: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:border-[#2563EB] transition-colors"
              >
                <option value="">Select a brand voice</option>
                {brandVoices.map(voice => (
                  <option key={voice} value={voice}>{voice}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Visual Style <span className="text-[#EF4444]">*</span>
              </label>
              <p className="text-sm text-slate-500 mb-3">Select 1-3 styles</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {visualStyles.map(style => (
                  <motion.button
                    key={style}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleVisualStyleToggle(style)}
                    className={`px-4 py-3 rounded-lg border-2 transition-all ${
                      formData.visualStyles.includes(style)
                        ? 'border-[#2563EB] bg-blue-50 text-[#2563EB]'
                        : 'border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {style}
                  </motion.button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Campaign Timing <span className="text-[#EF4444]">*</span>
              </label>
              <div className="space-y-2">
                {campaignTimings.map(timing => (
                  <label key={timing} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="timing"
                      value={timing}
                      checked={formData.campaignTiming === timing}
                      onChange={(e) => setFormData({ ...formData, campaignTiming: e.target.value })}
                      className="w-4 h-4 text-[#2563EB]"
                    />
                    <span className="text-slate-700">{timing}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-4">
                Seasonal Interests
              </label>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-slate-700 mb-3">Local & Regional Events</h3>
                  <div className="space-y-2">
                    {localEvents.map(event => (
                      <label key={event} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.seasonalEvents.local.includes(event)}
                          onChange={() => handleSeasonalEventToggle(event, 'local')}
                          className="w-4 h-4 text-[#2563EB] rounded"
                        />
                        <span className="text-sm text-slate-700">{event}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-700 mb-3">International Events</h3>
                  <div className="space-y-2">
                    {internationalEvents.map(event => (
                      <label key={event} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.seasonalEvents.international.includes(event)}
                          onChange={() => handleSeasonalEventToggle(event, 'international')}
                          className="w-4 h-4 text-[#2563EB] rounded"
                        />
                        <span className="text-sm text-slate-700">{event}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <input
                type="checkbox"
                id="autoSuggestions"
                checked={formData.enableAutoSuggestions}
                onChange={(e) => setFormData({ ...formData, enableAutoSuggestions: e.target.checked })}
                className="w-5 h-5 text-[#2563EB]"
              />
              <label htmlFor="autoSuggestions" className="text-sm text-slate-700 cursor-pointer">
                Enable automatic seasonal suggestions
              </label>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-500 mb-4 flex items-center gap-2">
              {saving && <Save size={16} className="animate-pulse" />}
              You can change these anytime from your dashboard
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/onboarding/welcome')}
                className="px-6 py-3 rounded-lg border border-slate-300 hover:bg-slate-50 transition-all"
              >
                Back
              </button>
              <button
                onClick={handleContinue}
                disabled={!isFormValid()}
                className="flex-1 px-6 py-3 bg-[#2563EB] text-white font-semibold rounded-lg shadow-md hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Continue →
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
