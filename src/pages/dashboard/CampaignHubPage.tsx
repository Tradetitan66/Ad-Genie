import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Plus, Loader2, Download, Eye, Image, Video, Calendar, ArrowRight, X, Trash2 } from 'lucide-react';
import { userService, brandProfileService, preferencesService, campaignService, Campaign } from '../../services/database';
import { sendBrandDataToWebhook } from '../../services/webhookService';
import { useToast } from '../../contexts/ToastContext';
import { downloadMultipleImages, ImageData } from '../../utils/imageDownload';
import TokenDisplay from '../../components/TokenDisplay';
import { tokenService } from '../../services/tokenService';
import CampaignSidebar from '../../components/CampaignSidebar';
import CampaignStatsBar from '../../components/CampaignStatsBar';
import PageHeader from '../../components/PageHeader';

export default function CampaignHubPage() {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sendingWebhook, setSendingWebhook] = useState(false);
  const [previousCampaigns, setPreviousCampaigns] = useState<Campaign[]>([]);
  const [magicTokens, setMagicTokens] = useState<number | null>(null);
  const [refreshingStats, setRefreshingStats] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    contentType: 'all',
    dateRange: 'all',
  });

  useEffect(() => {
    loadUser();
  }, [navigate]);

  // Refresh campaign data function
  const refreshCampaignData = useCallback(async () => {
    if (!userData?.userId) return;
    
    setRefreshingStats(true);
    try {
      await loadPreviousCampaignsForUser(userData.userId);
      // Also refresh magic tokens
      const tokens = await tokenService.getUserTokens(userData.userId);
      setMagicTokens(tokens);
    } catch (error) {
      console.error('Error refreshing campaign data:', error);
    } finally {
      setRefreshingStats(false);
    }
  }, [userData?.userId]);

  // Refresh on window focus
  useEffect(() => {
    const handleFocus = () => {
      // Refresh when user returns to tab
      if (userData?.userId) {
        refreshCampaignData();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [userData?.userId, refreshCampaignData]);

  // Listen for campaign update events
  useEffect(() => {
    const handleCampaignUpdate = () => {
      refreshCampaignData();
    };
    
    window.addEventListener('campaignUpdated', handleCampaignUpdate);
    return () => window.removeEventListener('campaignUpdated', handleCampaignUpdate);
  }, [refreshCampaignData]);


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
        
        // Load Magic Tokens balance
        const tokens = await tokenService.getUserTokens(user.id);
        setMagicTokens(tokens);
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
      const marketOptions = ['Local India', 'International', 'Global'];
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


  // Clear campaign cache function
  const clearCampaignCache = () => {
    // Clear temporary campaign selection cache
    localStorage.removeItem('selectedContentType');
    
    // Log for debugging
    console.log('🧹 Campaign cache cleared - starting fresh campaign');
  };

  // Handle start fresh campaign
  const handleStartFreshCampaign = () => {
    // Clear any cached campaign data
    clearCampaignCache();
    
    // Navigate to content selection (first step of onboarding)
    navigate('/onboarding/content-selection');
  };

  const loadPreviousCampaignsForUser = async (userId: string) => {
    try {
      const allCampaigns = await campaignService.getByUserId(userId);
      // Filter to show completed campaigns with images OR videos
      const completedCampaigns = allCampaigns.filter(
        (campaign) => {
          if (campaign.status !== 'completed' || !campaign.generated_assets) {
            return false;
          }
          
          // Check if campaign has images
          const hasImages = campaign.generated_assets.images &&
            Array.isArray(campaign.generated_assets.images) &&
            campaign.generated_assets.images.length > 0;
          
          // Check if campaign has videos
          const hasVideos = campaign.generated_assets.videos &&
            Array.isArray(campaign.generated_assets.videos) &&
            campaign.generated_assets.videos.length > 0;
          
          // Show if campaign has either images or videos
          return hasImages || hasVideos;
        }
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

  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      await campaignService.delete(campaignId);
      // Remove from local state
      setPreviousCampaigns(previousCampaigns.filter((c) => c.id !== campaignId));
      success('Campaign deleted successfully');
      setDeleteConfirm(null);
      
      // Trigger stats refresh event
      window.dispatchEvent(new Event('campaignUpdated'));
    } catch (err: any) {
      console.error('Error deleting campaign:', err);
      showError(`Failed to delete campaign: ${err.message}`);
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

  // Filter and search campaigns
  const filteredCampaigns = useMemo(() => {
    let filtered = [...previousCampaigns];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((campaign) => {
        const contentType = getContentTypeLabel(campaign.content_type).toLowerCase();
        const date = formatDate(campaign.completed_at || campaign.created_at).toLowerCase();
        return contentType.includes(query) || date.includes(query);
      });
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter((campaign) => campaign.status === filters.status);
    }

    // Content type filter
    if (filters.contentType !== 'all') {
      filtered = filtered.filter((campaign) => campaign.content_type === filters.contentType);
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter((campaign) => {
        const campaignDate = new Date(campaign.completed_at || campaign.created_at);
        return campaignDate >= filterDate;
      });
    }

    return filtered;
  }, [previousCampaigns, searchQuery, filters]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = previousCampaigns.length;
    const active = previousCampaigns.filter((c) => c.status === 'generating').length;
    const completed = previousCampaigns.filter((c) => c.status === 'completed').length;
    return { total, active, completed };
  }, [previousCampaigns]);

  // Get active filter labels
  const getActiveFilters = () => {
    const activeFilters: Array<{ key: string; label: string; type: 'status' | 'contentType' | 'dateRange' | 'search' }> = [];

    // Search query
    if (searchQuery.trim()) {
      activeFilters.push({
        key: 'search',
        label: `Search: "${searchQuery}"`,
        type: 'search',
      });
    }

    // Status filter
    if (filters.status !== 'all') {
      const statusLabels: Record<string, string> = {
        completed: 'Completed',
        generating: 'Generating',
        failed: 'Failed',
      };
      activeFilters.push({
        key: 'status',
        label: `Status: ${statusLabels[filters.status] || filters.status}`,
        type: 'status',
      });
    }

    // Content type filter
    if (filters.contentType !== 'all') {
      activeFilters.push({
        key: 'contentType',
        label: `Type: ${getContentTypeLabel(filters.contentType)}`,
        type: 'contentType',
      });
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const dateLabels: Record<string, string> = {
        today: 'Today',
        week: 'This Week',
        month: 'This Month',
        year: 'This Year',
      };
      activeFilters.push({
        key: 'dateRange',
        label: `Date: ${dateLabels[filters.dateRange] || filters.dateRange}`,
        type: 'dateRange',
      });
    }

    return activeFilters;
  };

  // Clear a specific filter
  const clearFilter = (type: 'status' | 'contentType' | 'dateRange' | 'search') => {
    if (type === 'search') {
      setSearchQuery('');
    } else {
      setFilters((prev) => ({
        ...prev,
        [type]: 'all',
      }));
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('');
    setFilters({
      status: 'all',
      contentType: 'all',
      dateRange: 'all',
    });
  };

  const activeFilters = getActiveFilters();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="text-center">
          <p className="text-[#6B7280]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!userData) return null;

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <PageHeader />

      {/* Sidebar */}
      <CampaignSidebar
        onFilterChange={setFilters}
        onSearchChange={setSearchQuery}
      />

      {/* Main Content Area */}
      <main className="lg:ml-[280px] pt-16">
        {/* Stats Bar */}
        <CampaignStatsBar
          totalCampaigns={stats.total}
          activeCampaigns={stats.active}
          completedCampaigns={stats.completed}
          userId={userData?.userId || null}
          isLoading={refreshingStats}
        />

        {/* Page Content */}
        <div className="max-w-[1400px] mx-auto px-8 py-8">
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-[#2D3142] mb-1">
              Welcome back, {userData.displayName}! 👋
            </h1>
            <p className="text-lg text-[#6B7280]">
              Ready to create your next campaign?
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div
              className="bg-white rounded-2xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
              onClick={handleUseExisting}
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                  <Building2 size={24} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl md:text-2xl font-bold text-[#2D3142] mb-2">
                    Use Existing Brand Profile
                  </h2>
                  {userData.brandProfile && (
                    <div className="mt-3">
                      <div className="flex items-center gap-2.5">
                        {userData.brandProfile.logo && (
                          <img
                            src={userData.brandProfile.logo}
                            alt="Logo"
                            className="w-10 h-10 object-contain rounded-lg border border-[#E5E7EB] flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm text-[#2D3142] truncate">
                            {userData.brandProfile.brandName}
                          </p>
                          <p className="text-xs text-[#6B7280] truncate">
                            {userData.brandProfile.industry}
                          </p>
                          <p className="text-[10px] text-[#6B7280] mt-0.5">
                            Last used: {new Date().toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-sm text-[#6B7280] mb-4">
                Use your saved preferences
              </p>
              <button 
                disabled={sendingWebhook}
                className="w-full px-5 py-2.5 bg-gradient-to-r from-orange-400 to-orange-600 text-white text-sm font-bold rounded-lg hover:from-orange-500 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sendingWebhook ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Continue with {userData.brandProfile?.brandName || 'Profile'}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>

            <div
              className="bg-white rounded-2xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
              onClick={handleStartFreshCampaign}
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                  <Plus size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-bold text-[#2D3142] mb-2">
                    Start Fresh Campaign
                  </h2>
                </div>
              </div>
              <p className="text-sm text-[#6B7280] mb-4">
                New brand or different direction
              </p>
              <button className="w-full px-5 py-2.5 bg-white text-orange-500 text-sm font-bold rounded-lg border-2 border-orange-500 hover:bg-orange-50 transition-all">
                Set Up New Campaign
              </button>
            </div>
          </div>

          {/* Previous Campaigns Section */}
          {previousCampaigns.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-[#2D3142]">
                  Your Campaigns {filteredCampaigns.length !== previousCampaigns.length && `(${filteredCampaigns.length} of ${previousCampaigns.length})`}
                </h2>
              </div>

              {/* Active Filter Tags */}
              {activeFilters.length > 0 && (
                <div className="mb-6 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mr-1">Active filters:</span>
                  {activeFilters.map((filter) => (
                    <button
                      key={filter.key}
                      onClick={() => clearFilter(filter.type)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-100 hover:border-orange-300 transition-all group text-sm"
                      aria-label={`Remove ${filter.label} filter`}
                    >
                      <span className="font-medium">{filter.label}</span>
                      <X size={14} className="text-orange-600 group-hover:text-orange-700 flex-shrink-0" />
                    </button>
                  ))}
                  {activeFilters.length > 1 && (
                    <button
                      onClick={clearAllFilters}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#6B7280] border border-[#E5E7EB] rounded-lg hover:bg-[#FAFAFA] hover:border-[#6B7280] transition-all text-sm font-medium"
                      aria-label="Clear all filters"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {filteredCampaigns.map((campaign) => {
                  // Determine content type and get appropriate assets
                  const isUgcOnly = campaign.content_type === 'ugc-only';
                  const isImageUgc = campaign.content_type === 'image-ugc';
                  
                  // Get images
                  const images = campaign.generated_assets?.images || [];
                  const firstImage = images[0];
                  const imageUrl = firstImage?.url || firstImage?.image_url || firstImage?.imageUrl || firstImage?.src || firstImage;
                  const imageCount = images.length;
                  
                  // Get videos
                  const videos = campaign.generated_assets?.videos || [];
                  const firstVideo = videos[0];
                  const videoUrl = firstVideo?.url || firstVideo?.video_url || firstVideo?.videoUrl || firstVideo?.src || (typeof firstVideo === 'string' ? firstVideo : null);
                  const videoCount = videos.length;
                  
                  // Determine thumbnail and count based on content type
                  let thumbnailUrl: string | null = null;
                  let assetCount = 0;
                  let assetType: 'image' | 'video' = 'image';
                  
                  if (isUgcOnly) {
                    // UGC-only: use video
                    thumbnailUrl = typeof videoUrl === 'string' ? videoUrl : null;
                    assetCount = videoCount;
                    assetType = 'video';
                  } else if (isImageUgc) {
                    // Image+UGC: prefer image, fallback to video
                    if (imageUrl && typeof imageUrl === 'string') {
                      thumbnailUrl = imageUrl;
                      assetCount = imageCount;
                      assetType = 'image';
                    } else if (videoUrl && typeof videoUrl === 'string') {
                      thumbnailUrl = videoUrl;
                      assetCount = videoCount;
                      assetType = 'video';
                    }
                  } else {
                    // Image-only: use image
                    thumbnailUrl = typeof imageUrl === 'string' ? imageUrl : null;
                    assetCount = imageCount;
                    assetType = 'image';
                  }
                  
                  return (
                    <div
                      key={campaign.id}
                      className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                    >
                      {/* Thumbnail */}
                      {thumbnailUrl && (
                        <div className="aspect-[4/3] bg-[#FAFAFA] relative group cursor-pointer" onClick={() => navigate('/dashboard/results', { state: { campaignId: campaign.id } })}>
                          {assetType === 'video' ? (
                            <video
                              src={thumbnailUrl}
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                              onMouseEnter={(e) => {
                                const video = e.currentTarget;
                                video.play().catch(() => {
                                  // Autoplay failed, that's okay
                                });
                              }}
                              onMouseLeave={(e) => {
                                const video = e.currentTarget;
                                video.pause();
                                video.currentTime = 0;
                              }}
                              onError={(e) => {
                                const target = e.currentTarget;
                                target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <img
                              src={thumbnailUrl}
                              alt="Campaign thumbnail"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate('/dashboard/results', { state: { campaignId: campaign.id } });
                                }}
                                className="px-4 py-2 bg-white rounded-lg shadow-lg flex items-center gap-2 hover:bg-[#FAFAFA] font-medium"
                              >
                                <Eye size={16} />
                                View
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Campaign Info */}
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {isUgcOnly ? (
                              <Video size={16} className="text-[#6B7280]" />
                            ) : (
                              <Image size={16} className="text-[#6B7280]" />
                            )}
                            <span className="text-sm font-semibold text-[#2D3142]">
                              {getContentTypeLabel(campaign.content_type)}
                            </span>
                          </div>
                          <span className="text-xs text-[#6B7280]">
                            {assetCount} {assetType}{assetCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-[#6B7280] mb-4">
                          <Calendar size={12} />
                          <span>{formatDate(campaign.completed_at || campaign.created_at)}</span>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate('/dashboard/results', { state: { campaignId: campaign.id } })}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-400 to-orange-600 text-white font-bold rounded-lg hover:from-orange-500 hover:to-orange-700 transition-all text-sm"
                          >
                            <Eye size={16} />
                            View
                          </button>
                          <button
                            onClick={() => handleDownloadAll(campaign)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white text-orange-500 font-bold rounded-lg border-2 border-orange-500 hover:bg-orange-50 transition-all text-sm"
                          >
                            <Download size={16} />
                            Download
                          </button>
                          {deleteConfirm === campaign.id ? (
                            <>
                              <button
                                onClick={() => handleDeleteCampaign(campaign.id)}
                                className="px-3 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-all flex items-center justify-center"
                                title="Confirm delete"
                              >
                                <Trash2 size={14} />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-3 py-2 bg-[#E5E7EB] text-[#2D3142] text-xs font-semibold rounded-lg hover:bg-[#D1D5DB] transition-all"
                                title="Cancel"
                              >
                                <X size={14} />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(campaign.id)}
                              className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all flex items-center justify-center"
                              title="Delete campaign"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {previousCampaigns.length === 0 && (
            <div className="mt-12 text-center py-16">
              <div className="inline-flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#FAFAFA] flex items-center justify-center">
                  <Image size={32} className="text-[#6B7280]" />
                </div>
                <div>
                  <p className="text-[#2D3142] text-lg font-semibold mb-1">No campaigns yet</p>
                  <p className="text-[#6B7280]">Create your first campaign to get started!</p>
                </div>
                <Link
                  to="/dashboard/content-selection"
                  className="mt-4 px-6 py-3 bg-gradient-to-r from-orange-400 to-orange-600 text-white font-bold rounded-lg hover:from-orange-500 hover:to-orange-700 transition-all inline-flex items-center gap-2"
                >
                  <Plus size={18} />
                  Create Campaign
                </Link>
              </div>
            </div>
          )}

          {previousCampaigns.length > 0 && filteredCampaigns.length === 0 && (
            <div className="mt-6 text-center py-12">
              <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#FAFAFA] flex items-center justify-center">
                  <Image size={32} className="text-[#6B7280]" />
                </div>
                <h3 className="text-xl font-bold text-[#2D3142] mb-2">No campaigns match your filters</h3>
                <p className="text-[#6B7280] mb-6">Try adjusting your search or filters to see more results.</p>
                {activeFilters.length > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="px-6 py-3 bg-gradient-to-r from-orange-400 to-orange-600 text-white font-bold rounded-lg hover:from-orange-500 hover:to-orange-700 transition-all inline-flex items-center gap-2"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
