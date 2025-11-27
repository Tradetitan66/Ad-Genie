import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, LogOut, Loader2, Download, Eye, Image, Calendar } from 'lucide-react';
import { userService, brandProfileService, preferencesService, campaignService, Campaign } from '../../services/database';
import { sendBrandDataToWebhook } from '../../services/webhookService';
import { useToast } from '../../contexts/ToastContext';
import { downloadMultipleImages, ImageData } from '../../utils/imageDownload';

export default function CampaignHubPage() {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sendingWebhook, setSendingWebhook] = useState(false);
  const [previousCampaigns, setPreviousCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    loadUser();
  }, [navigate]);


  const loadUser = async () => {
    const currentUserEmail = localStorage.getItem('currentUser');
    if (!currentUserEmail) {
      navigate('/login');
      return;
    }

    try {
      const user = await userService.getByEmail(currentUserEmail);
      if (user) {
        // Load brand profile
        const brandProfile = await brandProfileService.getByUserId(user.id);
        
        setUserData({
          email: user.email,
          displayName: user.display_name || 'User',
          userId: user.id,
          brandProfile: brandProfile ? {
            brandName: brandProfile.brand_name,
            industry: brandProfile.industry,
            logo: brandProfile.logo,
          } : null,
        });
        
        // Load previous campaigns after user data is set
        loadPreviousCampaignsForUser(user.id);
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('Error loading user:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };


  const handleUseExisting = async () => {
    if (!userData?.userId) {
      showError('User data not loaded');
      return;
    }

    setSendingWebhook(true);
    try {
      // Fetch complete brand profile and preferences
      const [brandProfile, preferences] = await Promise.all([
        brandProfileService.getByUserId(userData.userId),
        preferencesService.getByUserId(userData.userId)
      ]);
      
      if (!brandProfile) {
        showError('No brand profile found. Please complete onboarding first.');
        return;
      }

      // Format brand colors
      const formattedBrandColors = brandProfile.brand_colors && typeof brandProfile.brand_colors === 'object' 
        ? {
            primary: brandProfile.brand_colors.primary || undefined,
            secondary: brandProfile.brand_colors.secondary || undefined,
            accent: brandProfile.brand_colors.accent || undefined,
          }
        : {};

      // Send existing data to webhook with preferences
      // Extract campaign market if campaign_goal is a market value
      const marketOptions = ['Local (India)', 'International', 'Global'];
      const campaignGoalValue = preferences?.campaign_goal || '';
      const isMarketValue = campaignGoalValue && marketOptions.includes(campaignGoalValue);
      const campaignMarket = isMarketValue ? campaignGoalValue : undefined;
      const actualCampaignGoal = isMarketValue ? undefined : campaignGoalValue;

      await sendBrandDataToWebhook({
        user_id: userData.userId,
        user_email: userData.email,
        brand_name: brandProfile.brand_name,
        industry: brandProfile.industry,
        audience: brandProfile.audience || undefined,
        website_url: brandProfile.website_url || undefined,
        contact_email: brandProfile.contact_email,
        logo_url: brandProfile.logo || null,
        product_images: Array.isArray(brandProfile.product_images) ? brandProfile.product_images : [],
        brand_colors: formattedBrandColors,
        content_type: preferences?.content_type || undefined,
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

      success('Brand data sent successfully!');
      navigate('/dashboard/content-selection');
    } catch (err: any) {
      console.error('Error sending webhook:', err);
      showError(`Failed to send data: ${err.message}`);
    } finally {
      setSendingWebhook(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('user'); // Also clear AuthContext user
    navigate('/');
  };

  const loadPreviousCampaignsForUser = async (userId: string) => {
    try {
      const allCampaigns = await campaignService.getByUserId(userId);
      // Filter to show only completed campaigns with images
      const completedCampaigns = allCampaigns.filter(
        (campaign) =>
          campaign.status === 'completed' &&
          campaign.generated_assets &&
          campaign.generated_assets.images &&
          Array.isArray(campaign.generated_assets.images) &&
          campaign.generated_assets.images.length > 0
      );
      // Sort by most recent first
      completedCampaigns.sort((a, b) => {
        const dateA = new Date(a.completed_at || a.created_at).getTime();
        const dateB = new Date(b.completed_at || b.created_at).getTime();
        return dateB - dateA;
      });
      setPreviousCampaigns(completedCampaigns);
    } catch (error) {
      console.error('Error loading previous campaigns:', error);
    }
  };

  const handleDownloadAll = async (campaign: Campaign) => {
    try {
      if (!campaign.generated_assets?.images || !Array.isArray(campaign.generated_assets.images)) {
        showError('No images available to download');
        return;
      }

      const imageData: ImageData[] = campaign.generated_assets.images.map((img: any, index: number) => {
        const imageUrl = img?.url || img?.image_url || img?.imageUrl || img?.src || img;
        return {
          url: typeof imageUrl === 'string' ? imageUrl : '',
          title: img?.title || `Campaign-Image-${index + 1}`,
          id: img?.id || `img-${index}`,
        };
      }).filter((img: ImageData) => img.url);

      if (imageData.length === 0) {
        showError('No valid image URLs found');
        return;
      }

      await downloadMultipleImages(imageData);
      success(`Downloaded ${imageData.length} image(s) successfully!`);
    } catch (err: any) {
      console.error('Error downloading images:', err);
      showError(`Failed to download images: ${err.message}`);
    }
  };

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'image-only':
        return 'Images Only';
      case 'ugc-only':
        return 'UGC Only';
      case 'image-ugc':
        return 'Images + UGC';
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <div className="text-center">
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!userData) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Welcome back, {userData.displayName}! 👋
            </h1>
            <p className="text-xl text-slate-600">
              Ready to create your next campaign?
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <motion.div
              whileHover={!sendingWebhook ? { scale: 1.02 } : {}}
              className="bg-white rounded-lg shadow-lg p-8 cursor-pointer"
              onClick={handleUseExisting}
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#2563EB] to-[#8B5CF6] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 size={32} className="text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">
                    Use Existing Brand Profile
                  </h2>
                  {userData.brandProfile && (
                    <div className="mt-4">
                      <div className="flex items-center gap-3">
                        {userData.brandProfile.logo && (
                          <img
                            src={userData.brandProfile.logo}
                            alt="Logo"
                            className="w-12 h-12 object-contain rounded border"
                          />
                        )}
                        <div>
                          <p className="font-semibold text-slate-900">
                            {userData.brandProfile.brandName}
                          </p>
                          <p className="text-sm text-slate-500">
                            {userData.brandProfile.industry}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            Last used: {new Date().toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-slate-600 mb-6">
                Use your saved preferences
              </p>
              <button 
                disabled={sendingWebhook}
                className="w-full px-6 py-3 bg-[#2563EB] text-white font-semibold rounded-lg hover:bg-[#1d4ed8] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sendingWebhook ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Continue with {userData.brandProfile?.brandName || 'Profile'} →
                  </>
                )}
              </button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-lg shadow-lg p-8 cursor-pointer"
              onClick={() => navigate('/onboarding/content-selection')}
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#10B981] to-[#8B5CF6] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Plus size={32} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">
                    Start Fresh Campaign
                  </h2>
                </div>
              </div>
              <p className="text-slate-600 mb-6">
                New brand or different direction
              </p>
              <button className="w-full px-6 py-3 bg-white text-[#2563EB] font-semibold rounded-lg border-2 border-[#2563EB] hover:bg-blue-50 transition-all">
                Set Up New Campaign
              </button>
            </motion.div>
          </div>

          {/* Previous Campaigns Section */}
          {previousCampaigns.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Your Previous Campaigns</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {previousCampaigns.map((campaign, index) => {
                  const firstImage = campaign.generated_assets.images[0];
                  const imageUrl = firstImage?.url || firstImage?.image_url || firstImage?.imageUrl || firstImage?.src || firstImage;
                  const imageCount = campaign.generated_assets.images.length;
                  
                  return (
                    <motion.div
                      key={campaign.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all"
                    >
                      {/* Thumbnail */}
                      {typeof imageUrl === 'string' && imageUrl && (
                        <div className="aspect-video bg-slate-100 relative group">
                          <img
                            src={imageUrl}
                            alt="Campaign thumbnail"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate('/dashboard/results', { state: { campaignId: campaign.id } });
                                }}
                                className="px-4 py-2 bg-white rounded-lg shadow-lg flex items-center gap-2 hover:bg-slate-50"
                              >
                                <Eye size={16} />
                                View
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Campaign Info */}
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Image size={16} className="text-slate-500" />
                            <span className="text-sm font-semibold text-slate-900">
                              {getContentTypeLabel(campaign.content_type)}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500">{imageCount} image{imageCount !== 1 ? 's' : ''}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                          <Calendar size={12} />
                          <span>{formatDate(campaign.completed_at || campaign.created_at)}</span>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate('/dashboard/results', { state: { campaignId: campaign.id } })}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#2563EB] text-white font-semibold rounded-lg hover:bg-[#1d4ed8] transition-all text-sm"
                          >
                            <Eye size={16} />
                            View
                          </button>
                          <button
                            onClick={() => handleDownloadAll(campaign)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white text-[#2563EB] font-semibold rounded-lg border-2 border-[#2563EB] hover:bg-blue-50 transition-all text-sm"
                          >
                            <Download size={16} />
                            Download
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {previousCampaigns.length === 0 && (
            <div className="mt-12 text-center">
              <p className="text-slate-600">No previous campaigns yet. Create your first campaign!</p>
            </div>
          )}

          <div className="text-center space-y-3 mt-8">
            <button
              onClick={() => navigate('/onboarding/content-selection')}
              className="text-[#2563EB] hover:text-[#1d4ed8] font-medium"
            >
              Edit Brand Profile
            </button>
            <span className="mx-4 text-slate-300">•</span>
            <button
              onClick={handleLogout}
              className="text-slate-600 hover:text-slate-900 font-medium inline-flex items-center gap-2"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
