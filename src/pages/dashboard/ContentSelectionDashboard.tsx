import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Image, Video, Sparkles, Loader2 } from 'lucide-react';
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

export default function ContentSelectionDashboard() {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [useExistingPreferences, setUseExistingPreferences] = useState(true);
  const [userId, setUserId] = useState('');
  const [brandProfile, setBrandProfile] = useState<any>(null);
  const [preferences, setPreferences] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [navigate]);

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

      const [userPreferences, userBrandProfile] = await Promise.all([
        preferencesService.getByUserId(user.id),
        brandProfileService.getByUserId(user.id)
      ]);

      setPreferences(userPreferences);
      setBrandProfile(userBrandProfile);

      // Load existing content type if available
      if (userPreferences?.content_type) {
        setSelectedType(userPreferences.content_type);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      error('Failed to load campaign data');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedType || !userId) {
      error('Please select a content type');
      return;
    }

    setGenerating(true);
    try {
      // Update preferences with selected content type only
      // Do NOT trigger webhook here - webhook will be triggered from ReviewPage
      await preferencesService.upsert({
        user_id: userId,
        content_type: selectedType,
        campaign_market: preferences?.campaign_market || undefined,
      });

      success('Content type saved!');
      // Navigate to ReviewPage where user will verify and click "Generate Campaign Assets"
      // ReviewPage will trigger webhook when user clicks "Generate Campaign Assets"
      navigate('/onboarding/review');
    } catch (err: any) {
      console.error('Error saving content type:', err);
      error(`Failed to save content type: ${err.message}`);
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#2563EB] animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading campaign data...</p>
        </div>
      </div>
    );
  }

  if (!brandProfile) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Brand Profile Required</h2>
            <p className="text-slate-600 mb-6">Please complete your brand setup before creating a campaign.</p>
            <button
              onClick={() => navigate('/dashboard/settings')}
              className="px-6 py-3 bg-[#2563EB] text-white font-semibold rounded-lg hover:bg-[#1d4ed8] transition-all"
            >
              Go to Settings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-8"
        >
          <div className="mb-8">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg mb-6">
              <div className="flex items-center gap-3">
                {brandProfile.logo && (
                  <img src={brandProfile.logo} alt="Logo" className="w-10 h-10 object-contain rounded" />
                )}
                <div>
                  <p className="font-bold text-slate-900">{brandProfile.brand_name}</p>
                  <p className="text-sm text-slate-600">{brandProfile.industry}</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/dashboard/settings')}
                className="text-[#2563EB] hover:text-[#1d4ed8] text-sm font-semibold"
              >
                Edit Profile
              </button>
            </div>

            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Choose Your Content Type
            </h1>
            <p className="text-slate-600">Select the campaign format for this project</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
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

          <div className="mb-8">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useExistingPreferences}
                onChange={(e) => setUseExistingPreferences(e.target.checked)}
                className="w-5 h-5 text-[#2563EB]"
              />
              <span className="text-slate-700">Use existing seasonal preferences</span>
            </label>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => navigate('/dashboard/campaign-hub')}
              className="px-6 py-3 rounded-lg border border-slate-300 hover:bg-slate-50 transition-all"
            >
              Back
            </button>
            <button
              onClick={handleGenerate}
              disabled={!selectedType || generating}
              className="flex-1 px-8 py-4 bg-[#2563EB] text-white font-bold rounded-lg shadow-lg hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Starting Generation...
                </>
              ) : (
                'Generate Campaign'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
