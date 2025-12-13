import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Image, Video, Sparkles, Loader2 } from 'lucide-react';
import OnboardingLayout from '../../components/OnboardingLayout';
import { userService, preferencesService } from '../../services/database';
import { useToast } from '../../contexts/ToastContext';

const contentTypes = [
  {
    id: 'image-only',
    title: 'Static Ad',
    subtitle: '2x Image Generations',
    description: 'Product photos & lifestyle shots',
    icon: Image,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'ugc-only',
    title: 'Video Ad',
    subtitle: '1x Video Ad',
    description: 'Authentic video style ads',
    icon: Video,
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'image-ugc',
    title: 'UGC Ad',
    subtitle: '1x AI Avatar based Ad',
    description: 'Complete campaign package',
    icon: Sparkles,
    color: 'from-amber-500 to-orange-600',
    recommended: true
  }
];

const campaignMarkets = [
  { label: 'India', value: 'Local (India)' },
  { label: 'International', value: 'International' },
  // Global option temporarily disabled - may be needed in future
  // { label: 'Global', value: 'Global' }
];

export default function ContentSelectionPage() {
  const navigate = useNavigate();
  const { error } = useToast();
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
          // Map "Global" to "International" for backward compatibility
          const marketValue = preferences.campaign_market === 'Global' ? 'International' : preferences.campaign_market;
          setSelectedMarket(marketValue);
        } else if (preferences.campaign_goal && ['Local (India)', 'International', 'Global'].includes(preferences.campaign_goal)) {
          // Fallback: migrate from old campaign_goal field
          // Map "Global" to "International" for backward compatibility
          const marketValue = preferences.campaign_goal === 'Global' ? 'International' : preferences.campaign_goal;
          setSelectedMarket(marketValue);
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
      console.log('🔄 ContentSelectionPage: Saving preferences...', { userId, selectedType, selectedMarket });
      
      // Fetch existing preferences to preserve other fields
      const existingPreferences = await preferencesService.getByUserId(userId);
      
      // Update preferences with campaign_market (not campaign_goal) while preserving other fields
      const savedPreferences = await preferencesService.upsert({
        user_id: userId,
        content_type: selectedType, // CRITICAL: Save the selected content type
        campaign_market: selectedMarket, // Store in correct field
        // Preserve existing fields to avoid overwriting them
        campaign_goal: existingPreferences?.campaign_goal ?? null,
        brand_voice: existingPreferences?.brand_voice ?? null,
        visual_styles: existingPreferences?.visual_styles ?? [],
        campaign_timing: existingPreferences?.campaign_timing ?? null,
        seasonal_events: existingPreferences?.seasonal_events ?? [],
        enable_auto_suggestions: existingPreferences?.enable_auto_suggestions ?? true,
      });

      // Verify the save was successful
      console.log('✅ ContentSelectionPage: Preferences saved successfully:', {
        savedContentType: savedPreferences?.content_type,
        expectedContentType: selectedType,
        match: savedPreferences?.content_type === selectedType,
        savedCampaignMarket: savedPreferences?.campaign_market,
        expectedCampaignMarket: selectedMarket
      });

      if (savedPreferences?.content_type !== selectedType) {
        console.error('❌ ContentSelectionPage: Content type mismatch after save!', {
          expected: selectedType,
          actual: savedPreferences?.content_type
        });
        error('Failed to save content type correctly. Please try again.');
        setSaving(false);
        return;
      }

      // CRITICAL: Verify the save one more time by fetching fresh data
      console.log('🔄 ContentSelectionPage: Verifying save by fetching fresh preferences...');
      const verificationPreferences = await preferencesService.getByUserId(userId);
      console.log('✅ ContentSelectionPage: Verification fetch:', {
        verifiedContentType: verificationPreferences?.content_type,
        expected: selectedType,
        match: verificationPreferences?.content_type === selectedType
      });

      if (verificationPreferences?.content_type !== selectedType) {
        console.error('❌ ContentSelectionPage: Verification failed! Content type not persisted:', {
          expected: selectedType,
          verified: verificationPreferences?.content_type
        });
        error('Content type was not saved correctly. Please try again.');
        setSaving(false);
        return;
      }

      console.log('✅ ContentSelectionPage: Preferences saved and verified, navigating to brand-and-preferences');
      
      // Small delay to ensure database write is fully committed before navigation
      await new Promise(resolve => setTimeout(resolve, 200));
      
      navigate('/onboarding/brand-and-preferences');
      console.log('✅ ContentSelectionPage: Navigation called');
    } catch (err) {
      console.error('❌ Error saving content type:', err);
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
          <p className="text-slate-600">Select the campaign format for this project</p>
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
                      whileHover={type.id === 'image-ugc' ? {} : { scale: 1.02, y: -5 }}
                      whileTap={type.id === 'image-ugc' ? {} : { scale: 0.98 }}
                      onClick={() => type.id !== 'image-ugc' && setSelectedType(type.id)}
                      className={`relative rounded-lg border-2 p-6 transition-all ${
                        type.id === 'image-ugc'
                          ? 'opacity-60 cursor-not-allowed border-slate-200 bg-gray-50'
                          : selectedType === type.id
                          ? 'border-[#2563EB] bg-blue-50 shadow-lg cursor-pointer'
                          : 'border-slate-200 hover:border-slate-300 shadow cursor-pointer'
                      }`}
                    >
                      {type.recommended && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                          <span className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md whitespace-nowrap">
                            COMING SOON!
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

                      {selectedType === type.id && type.id !== 'image-ugc' && (
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
                  <label key={market.value} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-all">
                    <input
                      type="radio"
                      name="market"
                      value={market.value}
                      checked={selectedMarket === market.value}
                      onChange={(e) => setSelectedMarket(e.target.value)}
                      className="w-4 h-4 text-[#2563EB] focus:ring-[#2563EB]"
                    />
                    <span className="text-slate-700 font-medium">{market.label}</span>
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
                disabled={!selectedType || !selectedMarket || saving || selectedType === 'image-ugc'}
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
