import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Edit2, Loader2 } from 'lucide-react';
import OnboardingLayout from '../../components/OnboardingLayout';
import { userService, preferencesService, brandProfileService } from '../../services/database';
import { useToast } from '../../contexts/ToastContext';
import { sendBrandDataToWebhook } from '../../services/webhookService';

export default function ReviewPage() {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [userId, setUserId] = useState('');
  const [userData, setUserData] = useState<any>(null);
  const [expandedSections, setExpandedSections] = useState({
    preferences: true,
    brand: true,
    assets: true,
    content: true
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

      const [preferences, brandProfile] = await Promise.all([
        preferencesService.getByUserId(user.id),
        brandProfileService.getByUserId(user.id)
      ]);

      const contentType = preferences?.content_type || localStorage.getItem('selectedContentType');

      setUserData({
        email: user.email,
        displayName: user.display_name,
        preferences: preferences ? {
          campaignGoal: preferences.campaign_goal,
          brandVoice: preferences.brand_voice,
          visualStyles: preferences.visual_styles,
          seasonalEvents: preferences.seasonal_events
        } : null,
        brandProfile: brandProfile ? {
          brandName: brandProfile.brand_name,
          industry: brandProfile.industry,
          audience: brandProfile.audience,
          websiteUrl: brandProfile.website_url,
          contactEmail: brandProfile.contact_email,
          logo: brandProfile.logo,
          productImages: brandProfile.product_images || [],
          brandColors: brandProfile.brand_colors
        } : null,
        contentType
      });
    } catch (err) {
      console.error('Error loading review data:', err);
      error('Failed to load data for review');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    });
  };

  const handleGenerate = async () => {
    if (!userId) return;

    setGenerating(true);
    try {
      // Fetch latest data
      const currentUserEmail = localStorage.getItem('currentUser');
      if (!currentUserEmail) {
        throw new Error('User email not found');
      }
      
      const [user, preferences, brandProfile] = await Promise.all([
        userService.getByEmail(currentUserEmail),
        preferencesService.getByUserId(userId),
        brandProfileService.getByUserId(userId)
      ]);

      if (!user || !brandProfile) {
        throw new Error('User or brand profile not found');
      }

      // Format brand colors
      const formattedBrandColors = brandProfile.brand_colors && typeof brandProfile.brand_colors === 'object'
        ? {
            primary: brandProfile.brand_colors.primary || undefined,
            secondary: brandProfile.brand_colors.secondary || undefined,
            accent: brandProfile.brand_colors.accent || undefined,
          }
        : {};

      // Send complete data to webhook
      try {
        // Extract campaign market if campaign_goal is a market value
        const marketOptions = ['Local (India)', 'Regional (Specific States/Regions)', 'International', 'Global'];
        const campaignGoalValue = preferences?.campaign_goal || '';
        const isMarketValue = campaignGoalValue && marketOptions.includes(campaignGoalValue);
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
          content_type: preferences?.content_type || userData.contentType || undefined,
          campaign_goal: actualCampaignGoal,
          campaign_market: campaignMarket,
          brand_voice: preferences?.brand_voice || undefined,
          visual_styles: Array.isArray(preferences?.visual_styles) && preferences.visual_styles.length > 0 ? preferences.visual_styles : undefined,
          campaign_timing: undefined, // Removed - no longer used
          seasonal_events: Array.isArray(preferences?.seasonal_events) && preferences.seasonal_events.length > 0
            ? preferences.seasonal_events
            : (preferences?.seasonal_events && typeof preferences.seasonal_events === 'object'
              ? ((preferences.seasonal_events.local && preferences.seasonal_events.local.length > 0) || 
                 (preferences.seasonal_events.international && preferences.seasonal_events.international.length > 0))
                ? preferences.seasonal_events
                : undefined
              : undefined),
        });
        console.log('✅ Brand data sent to webhook successfully');
      } catch (webhookError: any) {
        console.error('⚠️ Webhook error (continuing anyway):', webhookError);
        // Show warning but don't block the user flow
        error(`Webhook failed: ${webhookError.message}. Continuing...`);
      }

      await userService.update(userId, {
        has_completed_onboarding: true
      });

      success('Launching campaign generation!');
      navigate('/dashboard/generating');
    } catch (err: any) {
      console.error('Error updating onboarding status:', err);
      error(`Failed to start generation: ${err.message}`);
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <OnboardingLayout currentStep={5} totalSteps={5} stepLabel="Loading review...">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-[#2563EB] animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading...</p>
          </div>
        </div>
      </OnboardingLayout>
    );
  }

  if (!userData) return null;

  return (
    <OnboardingLayout currentStep={5} totalSteps={5} stepLabel="Review and launch">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg p-8"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Review & Launch Your First Campaign
          </h1>
          <p className="text-slate-600">Almost done! Review your information below</p>
        </div>

          <div className="space-y-4 mb-8">
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('preferences')}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <h3 className="font-bold text-slate-900">Your Preferences</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/onboarding/preferences');
                    }}
                    className="text-[#2563EB] hover:text-[#1d4ed8] flex items-center gap-1 text-sm"
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                  {expandedSections.preferences ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </button>
              {expandedSections.preferences && userData.preferences && (
                <div className="p-4 space-y-3 text-sm">
                  <div>
                    <span className="font-semibold text-slate-700">Campaign Goal:</span>
                    <p className="text-slate-600 mt-1">{userData.preferences.campaignGoal}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Brand Voice:</span>
                    <span className="ml-2 text-slate-600">{userData.preferences.brandVoice}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Visual Styles:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {userData.preferences.visualStyles.map((style: string) => (
                        <span key={style} className="px-3 py-1 bg-blue-100 text-[#2563EB] rounded-full text-xs">
                          {style}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('brand')}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <h3 className="font-bold text-slate-900">Brand Details</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/onboarding/brand-details');
                    }}
                    className="text-[#2563EB] hover:text-[#1d4ed8] flex items-center gap-1 text-sm"
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                  {expandedSections.brand ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </button>
              {expandedSections.brand && userData.brandProfile && (
                <div className="p-4 space-y-3 text-sm">
                  <div><span className="font-semibold text-slate-700">Brand Name:</span> <span className="text-slate-600">{userData.brandProfile.brandName}</span></div>
                  <div><span className="font-semibold text-slate-700">Industry:</span> <span className="text-slate-600">{userData.brandProfile.industry}</span></div>
                  {userData.brandProfile.audience && (
                    <div><span className="font-semibold text-slate-700">Target Audience:</span> <p className="text-slate-600 mt-1">{userData.brandProfile.audience}</p></div>
                  )}
                  <div><span className="font-semibold text-slate-700">Website:</span> <a href={userData.brandProfile.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-[#2563EB] ml-2">{userData.brandProfile.websiteUrl}</a></div>
                  <div><span className="font-semibold text-slate-700">Email:</span> <span className="text-slate-600">{userData.brandProfile.contactEmail}</span></div>
                </div>
              )}
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('assets')}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <h3 className="font-bold text-slate-900">Visual Assets</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/onboarding/visual-assets');
                    }}
                    className="text-[#2563EB] hover:text-[#1d4ed8] flex items-center gap-1 text-sm"
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                  {expandedSections.assets ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </button>
              {expandedSections.assets && userData.brandProfile && (
                <div className="p-4 space-y-3">
                  <div>
                    <span className="font-semibold text-slate-700 text-sm">Logo:</span>
                    <img src={userData.brandProfile.logo} alt="Logo" className="w-24 h-24 object-contain mt-2 border rounded" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 text-sm">Product Images ({userData.brandProfile.productImages.length}):</span>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {userData.brandProfile.productImages.map((img: string, i: number) => (
                        <img key={i} src={img} alt={`Product ${i + 1}`} className="w-full h-20 object-cover rounded" />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('content')}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <h3 className="font-bold text-slate-900">Content Type</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/onboarding/content-selection');
                    }}
                    className="text-[#2563EB] hover:text-[#1d4ed8] flex items-center gap-1 text-sm"
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                  {expandedSections.content ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </button>
              {expandedSections.content && (
                <div className="p-4">
                  <p className="text-sm text-slate-600 capitalize">{userData.contentType?.replace('-', ' ')}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <p className="text-sm text-slate-700 text-center">
              Estimated delivery: <span className="font-semibold">5-10 minutes</span>
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => navigate('/onboarding/preferences')}
              className="px-6 py-4 rounded-lg border border-slate-300 hover:bg-slate-50 transition-all"
            >
              Back
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex-1 px-8 py-4 bg-[#2563EB] text-white font-bold rounded-lg shadow-lg hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg"
            >
              {generating ? 'Launching...' : 'Generate Campaign Assets'}
            </button>
          </div>
      </motion.div>
    </OnboardingLayout>
  );
}
