import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Edit2, Loader2, Upload } from 'lucide-react';
import OnboardingLayout from '../../components/OnboardingLayout';
import { userService, preferencesService, brandProfileService, campaignService } from '../../services/database';
import { useToast } from '../../contexts/ToastContext';
import { sendBrandDataToWebhook, BrandWebhookData } from '../../services/webhookService';
import { imageService } from '../../services/imageService';

export default function ReviewPage() {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [userId, setUserId] = useState('');
  const [brandProfileId, setBrandProfileId] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [webhookPayload, setWebhookPayload] = useState<BrandWebhookData | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    preferences: true,
    brand: true,
    assets: true,
    content: true
  });
  const [ugcImageUrl, setUgcImageUrl] = useState<string | null>(null);
  const [uploadingUgcImage, setUploadingUgcImage] = useState(false);

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

      if (brandProfile) {
        setBrandProfileId(brandProfile.id);
      }

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

  const handleUgcImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      error('Please upload an image file');
      return;
    }

    setUploadingUgcImage(true);
    try {
      const imageUrl = await imageService.uploadToStorage(userId, file, 'product', false);
      setUgcImageUrl(imageUrl);
      success('Image uploaded successfully!');
    } catch (err: any) {
      console.error('Error uploading UGC image:', err);
      error(`Failed to upload image: ${err.message}`);
    } finally {
      setUploadingUgcImage(false);
    }
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

      // Extract campaign market from campaign_market field (preferred) or fallback to campaign_goal
      const marketOptions = ['Local (India)', 'International', 'Global'];
      const campaignMarket = preferences?.campaign_market || 
        (preferences?.campaign_goal && marketOptions.includes(preferences.campaign_goal) 
          ? preferences.campaign_goal 
          : undefined);
      const actualCampaignGoal = preferences?.campaign_goal && !marketOptions.includes(preferences.campaign_goal)
        ? preferences.campaign_goal
        : undefined;

      // Get content type early (needed for product images logic)
      const contentType = preferences?.content_type || userData.contentType || 'image-only';

      // Prepare product images array - include UGC image if uploaded
      const baseProductImages = Array.isArray(brandProfile.product_images) ? brandProfile.product_images : [];
      const productImages = contentType === 'ugc-only' || contentType === 'image-ugc'
        ? (ugcImageUrl ? [...baseProductImages, ugcImageUrl] : baseProductImages)
        : baseProductImages;

      // Prepare webhook payload
      const webhookData: BrandWebhookData = {
          user_id: user.id,
          user_email: user.email,
          brand_name: brandProfile.brand_name,
          industry: brandProfile.industry,
          audience: brandProfile.audience || undefined,
          website_url: brandProfile.website_url || undefined,
          contact_email: brandProfile.contact_email,
          logo_url: brandProfile.logo || null,
          product_images: productImages,
          brand_colors: formattedBrandColors,
          content_type: preferences?.content_type || userData.contentType || undefined,
          campaign_goal: actualCampaignGoal,
          campaign_market: campaignMarket,
          brand_voice: preferences?.brand_voice || undefined,
          visual_styles: Array.isArray(preferences?.visual_styles) && preferences.visual_styles.length > 0 ? preferences.visual_styles : undefined,
          campaign_timing: undefined, // Removed - no longer used
          seasonal_events: Array.isArray(preferences?.seasonal_events) && preferences.seasonal_events.length > 0
            ? preferences.seasonal_events
            : (preferences?.seasonal_events && typeof preferences.seasonal_events === 'object' && !Array.isArray(preferences.seasonal_events)
              ? ((preferences.seasonal_events.local && preferences.seasonal_events.local.length > 0) || 
                 (preferences.seasonal_events.international && preferences.seasonal_events.international.length > 0))
                ? preferences.seasonal_events
                : undefined
              : undefined),
      };

      // Store webhook payload for later use
      setWebhookPayload(webhookData);

      // Create campaign record with status 'generating'
      const campaign = await campaignService.create({
        user_id: user.id,
        brand_profile_id: brandProfile.id,
        content_type: contentType,
        status: 'generating',
        generated_assets: {
          webhook_payload: webhookData,
          images: [],
          videos: contentType === 'ugc-only' || contentType === 'image-ugc' ? [] : undefined,
        },
      });

      // Only update onboarding status if user hasn't completed onboarding yet
      // IMPORTANT: Update onboarding status BEFORE navigation to ensure ProtectedRoute allows access
      if (!user.has_completed_onboarding) {
      await userService.update(userId, {
        has_completed_onboarding: true
      });
        // Small delay to ensure database update is propagated before navigation
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      success('Launching campaign generation!');
      
      // Log navigation details for debugging
      console.log('🚀 ReviewPage: Navigating to AdGenieWorkingPage');
      console.log('📦 Navigation state:', {
        campaignId: campaign.id,
        hasWebhookPayload: !!webhookData,
        webhookPayloadKeys: Object.keys(webhookData)
      });
      
      // Navigate to Ad-Genie working page with campaign ID
      // AdGenieWorkingPage will call the webhook and wait for response
      navigate('/dashboard/ad-genie-working', { 
        state: { 
          campaignId: campaign.id, 
          webhookPayload: webhookData,
          skipOnboardingCheck: true // Flag to allow access during onboarding completion
        } 
      });
      
      console.log('✅ ReviewPage: Navigation called');
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
                      navigate('/onboarding/brand-and-preferences');
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
                      navigate('/onboarding/brand-and-preferences');
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
                      navigate('/onboarding/brand-and-preferences');
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
                  {(userData.contentType === 'ugc-only' || userData.contentType === 'image-ugc') && (
                    <div>
                      <span className="font-semibold text-slate-700 text-sm block mb-2">UGC Source Image:</span>
                      {ugcImageUrl ? (
                        <div className="relative">
                          <img src={ugcImageUrl} alt="UGC Source" className="w-full max-w-xs h-48 object-cover rounded border" />
                          <button
                            onClick={() => setUgcImageUrl(null)}
                            className="mt-2 text-sm text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full max-w-xs h-48 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {uploadingUgcImage ? (
                              <>
                                <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin mb-2" />
                                <p className="text-sm text-slate-600">Uploading...</p>
                              </>
                            ) : (
                              <>
                                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                                <p className="text-sm text-slate-600">Click to upload image</p>
                                <p className="text-xs text-slate-500 mt-1">This image will be used for video generation</p>
                              </>
                            )}
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleUgcImageUpload}
                            disabled={uploadingUgcImage}
                          />
                        </label>
                      )}
                    </div>
                  )}
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
              onClick={() => navigate('/onboarding/brand-and-preferences')}
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
