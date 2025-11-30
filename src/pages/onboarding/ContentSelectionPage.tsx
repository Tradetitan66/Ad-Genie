import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Image, Video, Sparkles, Loader2 } from 'lucide-react';
import OnboardingLayout from '../../components/OnboardingLayout';
import { userService, preferencesService, brandProfileService } from '../../services/database';
import { useToast } from '../../contexts/ToastContext';

const contentTypes = [
  {
    id: 'image-only',
    title: 'Image Only',
    subtitle: '6x Image Generations',
    description: 'Product photos & lifestyle shots',
    icon: Image,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'ugc-only',
    title: 'UGC Only',
    subtitle: '3x User-Generated Content Ads',
    description: 'Authentic video style ads',
    icon: Video,
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'image-ugc',
    title: 'Images + UGC',
    subtitle: '6x Images + 3x UGC Ads',
    description: 'Complete campaign package',
    icon: Sparkles,
    color: 'from-amber-500 to-orange-600',
    recommended: true
  }
];

const campaignMarkets = [
  'Local (India)',
  'International',
  'Global'
];

export default function ContentSelectionPage() {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedMarket, setSelectedMarket] = useState<string>('');

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

      const preferences = await preferencesService.getByUserId(user.id);

      if (preferences) {
        if (preferences.content_type) {
          setSelectedType(preferences.content_type);
        }
        // Load campaign market from campaign_market field
        if (preferences.campaign_market) {
          setSelectedMarket(preferences.campaign_market);
        } else if (preferences.campaign_goal && ['Local (India)', 'International', 'Global'].includes(preferences.campaign_goal)) {
          // Fallback: migrate from old campaign_goal field
          setSelectedMarket(preferences.campaign_goal);
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
      error('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    if (!selectedType || !userId) {
      error('Please select a content type');
      return;
    }

    if (!selectedMarket) {
      error('Please select a target market for your campaign');
      return;
    }

    setSaving(true);
    try {
      // Update preferences with campaign_market (not campaign_goal)
      await preferencesService.upsert({
        user_id: userId,
        content_type: selectedType,
        campaign_market: selectedMarket, // Store in correct field
      });

      success('Content type and market selected!');
      navigate('/onboarding/brand-and-preferences');
    } catch (err) {
      console.error('Error saving content type:', err);
      error('Failed to save content type. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <OnboardingLayout currentStep={2} totalSteps={3} stepLabel="Loading content selection...">
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
      <OnboardingLayout currentStep={2} totalSteps={3} stepLabel="Choose your content type">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg p-8"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Choose Your Content Type
          </h1>
          <p className="text-slate-600">Based on your preferences, we recommend Images + UGC</p>
        </div>

          <div className="space-y-8">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-4">
                Content Type <span className="text-red-500">*</span>
              </label>
              <div className="grid md:grid-cols-3 gap-6">
                {contentTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <motion.div
                      key={type.id}
                      whileHover={{ scale: 1.02, y: -5 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedType(type.id)}
                      className={`relative cursor-pointer rounded-lg border-2 p-6 transition-all ${
                        selectedType === type.id
                          ? 'border-[#2563EB] bg-blue-50 shadow-lg'
                          : 'border-slate-200 hover:border-slate-300 shadow'
                      }`}
                    >
                      {type.recommended && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                            RECOMMENDED
                          </span>
                        </div>
                      )}

                      <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${type.color} flex items-center justify-center mb-4 mx-auto`}>
                        <Icon size={32} className="text-white" />
                      </div>

                      <h3 className="text-xl font-bold text-slate-900 text-center mb-1">
                        {type.title}
                      </h3>
                      <p className="text-sm font-semibold text-slate-600 text-center mb-3">
                        {type.subtitle}
                      </p>
                      <p className="text-sm text-slate-500 text-center">
                        {type.description}
                      </p>

                      {selectedType === type.id && (
                        <div className="absolute top-4 right-4">
                          <div className="w-6 h-6 bg-[#2563EB] rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Target Market <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-slate-500 mb-3">Which market is this marketing campaign focusing on?</p>
              <div className="space-y-2">
                {campaignMarkets.map(market => (
                  <label key={market} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-all">
                    <input
                      type="radio"
                      name="market"
                      value={market}
                      checked={selectedMarket === market}
                      onChange={(e) => setSelectedMarket(e.target.value)}
                      className="w-4 h-4 text-[#2563EB] focus:ring-[#2563EB]"
                    />
                    <span className="text-slate-700 font-medium">{market}</span>
                  </label>
                ))}
              </div>
            </div>

          </div>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/onboarding/welcome')}
                className="px-6 py-3 rounded-lg border border-slate-300 hover:bg-slate-50 transition-all"
              >
                Back
              </button>
              <button
                onClick={handleContinue}
                disabled={!selectedType || !selectedMarket || saving}
                className="flex-1 px-6 py-3 bg-[#2563EB] text-white font-semibold rounded-lg shadow-md hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {saving ? 'Saving...' : 'Continue →'}
              </button>
            </div>
          </div>
      </motion.div>
    </OnboardingLayout>
  );
}
