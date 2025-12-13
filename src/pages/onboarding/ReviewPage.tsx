import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Edit2, Loader2 } from 'lucide-react';
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


  const handleGenerate = async () => {
    if (!userId) return;

    setGenerating(true);
    try {
      // Fetch latest data with individual error handling
      const currentUserEmail = localStorage.getItem('currentUser');
      if (!currentUserEmail) {
        throw new Error('User email not found');
      }
      
      let user, preferences, brandProfile;
      
      // Fetch user with error handling
      try {
        console.log('📋 Fetching user data...');
        user = await userService.getByEmail(currentUserEmail);
        if (!user) {
          throw new Error('User not found in database');
        }
        console.log('✅ User data fetched successfully');
      } catch (err: any) {
        console.error('❌ Error fetching user:', {
          error: err,
          message: err.message,
          name: err.name,
          email: currentUserEmail
        });
        if (err.message?.includes('Failed to fetch') || err.name === 'TypeError') {
          throw new Error('Network error: Unable to fetch user data. Please check your internet connection.');
        }
        throw new Error(`Failed to fetch user data: ${err.message}`);
      }
      
      // Fetch preferences with error handling
      try {
        console.log('📋 Fetching preferences data...');
        preferences = await preferencesService.getByUserId(userId);
        console.log('✅ Preferences data fetched successfully');
      } catch (err: any) {
        console.error('❌ Error fetching preferences:', {
          error: err,
          message: err.message,
          name: err.name,
          userId
        });
        if (err.message?.includes('Failed to fetch') || err.name === 'TypeError') {
          throw new Error('Network error: Unable to fetch preferences. Please check your internet connection.');
        }
        throw new Error(`Failed to fetch preferences: ${err.message}`);
      }
      
      // Fetch brand profile with error handling
      try {
        console.log('📋 Fetching brand profile data...');
        brandProfile = await brandProfileService.getByUserId(userId);
        if (!brandProfile) {
          throw new Error('Brand profile not found in database');
        }
        console.log('✅ Brand profile data fetched successfully');
      } catch (err: any) {
        console.error('❌ Error fetching brand profile:', {
          error: err,
          message: err.message,
          name: err.name,
          userId
        });
        if (err.message?.includes('Failed to fetch') || err.name === 'TypeError') {
          throw new Error('Network error: Unable to fetch brand profile. Please check your internet connection.');
        }
        throw new Error(`Failed to fetch brand profile: ${err.message}`);
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
      // CRITICAL: Use only freshly fetched preferences - no fallback to avoid stale data
      if (!preferences?.content_type) {
        console.error('❌ Content type validation failed:', {
          hasPreferences: !!preferences,
          preferencesContentType: preferences?.content_type,
          userDataContentType: userData?.contentType,
          userId
        });
        error('Content type not selected. Please select a content type first.');
        setGenerating(false);
        navigate('/onboarding/content-selection');
        return;
      }
      const contentType = preferences.content_type;
      console.log('✅ Content type validated:', contentType);

      // Prepare product images array - use product images from brand profile
      const productImages = Array.isArray(brandProfile.product_images) ? brandProfile.product_images : [];

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
          content_type: contentType, // CRITICAL: This is now guaranteed to be set (validated above)
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

      // Create campaign record with status 'generating' - with error handling
      let campaign;
      try {
        console.log('📋 Creating campaign record...');
        campaign = await campaignService.create({
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
        console.log('✅ Campaign record created successfully:', campaign.id);
      } catch (err: any) {
        console.error('❌ Error creating campaign:', {
          error: err,
          message: err.message,
          name: err.name,
          userId: user.id,
          brandProfileId: brandProfile.id
        });
        if (err.message?.includes('Failed to fetch') || err.name === 'TypeError') {
          throw new Error('Network error: Unable to create campaign. Please check your internet connection.');
        }
        throw new Error(`Failed to create campaign: ${err.message}`);
      }

      // Trigger stats refresh event
      window.dispatchEvent(new Event('campaignUpdated'));

      // Only update onboarding status if user hasn't completed onboarding yet
      // IMPORTANT: Update onboarding status BEFORE navigation to ensure ProtectedRoute allows access
      if (!user.has_completed_onboarding) {
        try {
          console.log('📋 Updating onboarding status...');
          await userService.update(userId, {
            has_completed_onboarding: true
          });
          console.log('✅ Onboarding status updated successfully');
          // Small delay to ensure database update is propagated before navigation
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (err: any) {
          console.error('❌ Error updating onboarding status:', {
            error: err,
            message: err.message,
            name: err.name,
            userId
          });
          // Don't throw - navigation can still proceed even if this update fails
          console.warn('⚠️ Continuing despite onboarding status update failure');
        }
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
      console.error('❌ Error in handleGenerate:', {
        error: err,
        message: err.message,
        name: err.name,
        stack: err.stack,
        userId
      });
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to start generation';
      if (err.message?.includes('Network error')) {
        errorMessage = err.message;
      } else if (err.message?.includes('Failed to fetch')) {
        errorMessage = 'Network error: Unable to connect to server. Please check your internet connection and try again.';
      } else if (err.message) {
        errorMessage = err.message;
      } else {
        errorMessage = `Failed to start generation: ${err.message || 'Unknown error'}`;
      }
      
      error(errorMessage);
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <OnboardingLayout currentStep={5} totalSteps={5} stepLabel="Loading review...">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading...</p>
          </div>
        </div>
      </OnboardingLayout>
    );
  }

  if (!userData) return null;

  return (
    <OnboardingLayout currentStep={5} totalSteps={5} stepLabel="Review and launch">
      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#2D3142] mb-2">
            Review & Launch Your Campaign
          </h1>
          <p className="text-[#6B7280]">Almost done! Review your information below</p>
        </div>

          <div className="space-y-6 mb-8">
            <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
              <button
                onClick={() => toggleSection('brand')}
                className="w-full flex items-center justify-between p-4 md:p-6 bg-[#FAFAFA] hover:bg-orange-50 transition-colors border-b border-[#E5E7EB]"
              >
                <h3 className="text-lg font-bold text-[#2D3142]">Brand Details</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/onboarding/brand-and-preferences');
                    }}
                    className="text-orange-500 hover:text-orange-600 flex items-center gap-1.5 text-sm font-medium transition-colors"
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                  {expandedSections.brand ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </button>
              {expandedSections.brand && userData.brandProfile && (
                <div className="p-6 space-y-3 text-sm">
                  <div><span className="font-semibold text-[#2D3142]">Brand Name:</span> <span className="text-[#6B7280]">{userData.brandProfile.brandName}</span></div>
                  <div><span className="font-semibold text-[#2D3142]">Industry:</span> <span className="text-[#6B7280]">{userData.brandProfile.industry}</span></div>
                  {userData.brandProfile.audience && (
                    <div><span className="font-semibold text-[#2D3142]">Target Audience:</span> <p className="text-[#6B7280] mt-1">{userData.brandProfile.audience}</p></div>
                  )}
                  <div><span className="font-semibold text-[#2D3142]">Website:</span> <a href={userData.brandProfile.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-600 ml-2 transition-colors">{userData.brandProfile.websiteUrl}</a></div>
                </div>
              )}
            </div>

            <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
              <button
                onClick={() => toggleSection('preferences')}
                className="w-full flex items-center justify-between p-4 md:p-6 bg-[#FAFAFA] hover:bg-orange-50 transition-colors border-b border-[#E5E7EB]"
              >
                <h3 className="text-lg font-bold text-[#2D3142]">Your Preferences</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/onboarding/brand-and-preferences');
                    }}
                    className="text-orange-500 hover:text-orange-600 flex items-center gap-1.5 text-sm font-medium transition-colors"
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                  {expandedSections.preferences ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </button>
              {expandedSections.preferences && userData.preferences && (
                <div className="p-6 space-y-3 text-sm">
                  <div>
                    <span className="font-semibold text-[#2D3142]">Campaign Goal:</span>
                    <p className="text-[#6B7280] mt-1">{userData.preferences.campaignGoal}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-[#2D3142]">Brand Voice:</span>
                    <span className="ml-2 text-[#6B7280]">{userData.preferences.brandVoice}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-[#2D3142]">Visual Styles:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {userData.preferences.visualStyles.map((style: string) => (
                        <span key={style} className="px-3 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-xs">
                          {style}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
              <button
                onClick={() => toggleSection('assets')}
                className="w-full flex items-center justify-between p-4 md:p-6 bg-[#FAFAFA] hover:bg-orange-50 transition-colors border-b border-[#E5E7EB]"
              >
                <h3 className="text-lg font-bold text-[#2D3142]">Visual Assets</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/onboarding/brand-and-preferences');
                    }}
                    className="text-orange-500 hover:text-orange-600 flex items-center gap-1.5 text-sm font-medium transition-colors"
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                  {expandedSections.assets ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </button>
              {expandedSections.assets && userData.brandProfile && (
                <div className="p-6 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-[#2D3142] text-sm">
                        Product Image for Campaign
                      </span>
                      {userData.brandProfile.productImages.length > 1 && (
                        <span className="text-xs text-[#6B7280]">
                          Image 1 of {userData.brandProfile.productImages.length}
                        </span>
                      )}
                    </div>
                    {userData.brandProfile.productImages.length > 0 ? (
                      <div className="relative">
                        <img 
                          src={userData.brandProfile.productImages[0]} 
                          alt="Product image for campaign" 
                          className="w-full max-w-md h-auto rounded-xl border-2 border-[#E5E7EB] shadow-md object-contain bg-white"
                        />
                        <p className="text-xs text-[#6B7280] mt-2">
                          This image will be used to generate your campaign assets
                        </p>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-[#E5E7EB] rounded-xl p-8 text-center">
                        <p className="text-sm text-[#6B7280]">No product image uploaded</p>
                      </div>
                    )}
                   </div>
                 </div>
              )}
            </div>

            <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
              <button
                onClick={() => toggleSection('content')}
                className="w-full flex items-center justify-between p-4 md:p-6 bg-[#FAFAFA] hover:bg-orange-50 transition-colors border-b border-[#E5E7EB]"
              >
                <h3 className="text-lg font-bold text-[#2D3142]">Content Type</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/onboarding/content-selection');
                    }}
                    className="text-orange-500 hover:text-orange-600 flex items-center gap-1.5 text-sm font-medium transition-colors"
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                  {expandedSections.content ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </button>
              {expandedSections.content && (
                <div className="p-6">
                  <p className="text-sm text-[#6B7280] capitalize">{userData.contentType?.replace('-', ' ')}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-8">
            <p className="text-sm text-[#2D3142] text-center">
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
              className="flex-1 px-8 py-4 bg-gradient-to-r from-orange-400 to-orange-600 text-white font-bold rounded-lg shadow-lg hover:from-orange-500 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Launching...
                </>
              ) : (
                'Generate Campaign Assets'
              )}
            </button>
          </div>
      </div>
    </OnboardingLayout>
  );
}
