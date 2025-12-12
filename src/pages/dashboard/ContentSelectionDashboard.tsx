import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Image, Video, Sparkles, Loader2, LogOut, ArrowRight, MapPin, Palette, MessageSquare, Calendar, ChevronDown, ChevronUp, Pencil, Target } from 'lucide-react';
import { userService, preferencesService, brandProfileService, campaignService, Campaign } from '../../services/database';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';

const contentTypes = [
  {
    id: 'image-only',
    title: 'Image Only',
    subtitle: '2x Image Generations',
    description: 'Product photos & lifestyle shots',
    icon: Image,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'ugc-only',
    title: 'Video Only',
    subtitle: '2x Product Videos Ads',
    description: 'Authentic video style ads',
    icon: Video,
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'image-ugc',
    title: 'Images + Video',
    subtitle: '2x Images + 2x Videos',
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
  const [previousCampaigns, setPreviousCampaigns] = useState<Campaign[]>([]);
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);

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

      // Load previous campaigns for statistics
      const campaigns = await campaignService.getByUserId(user.id);
      setPreviousCampaigns(campaigns);
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

      // Navigate to ReviewPage where user will verify and click "Generate Campaign Assets"
      // ReviewPage will trigger webhook when user clicks "Generate Campaign Assets"
      navigate('/onboarding/review');
    } catch (err: any) {
      console.error('Error saving content type:', err);
      error(`Failed to save content type: ${err.message}`);
      setGenerating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('currentUser');
      localStorage.removeItem('user');
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
      localStorage.removeItem('currentUser');
      localStorage.removeItem('user');
      navigate('/');
    }
  };

  // Calculate campaign statistics
  const campaignStats = {
    total: previousCampaigns.length,
    lastCampaignDate: previousCampaigns.length > 0 
      ? previousCampaigns[0].completed_at || previousCampaigns[0].created_at 
      : null,
    mostUsedContentType: (() => {
      if (previousCampaigns.length === 0) return null;
      const contentTypeCounts: Record<string, number> = {};
      previousCampaigns.forEach(c => {
        contentTypeCounts[c.content_type] = (contentTypeCounts[c.content_type] || 0) + 1;
      });
      return Object.entries(contentTypeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    })(),
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  // Get content type label
  const getContentTypeLabel = (type: string | null) => {
    if (!type) return '';
    const labels: Record<string, string> = {
      'image-only': 'Images Only',
      'ugc-only': 'UGC Only',
      'image-ugc': 'Images + UGC',
    };
    return labels[type] || type;
  };

  // Check if user has preferences or campaign history
  const hasPreferences = preferences?.campaign_market || preferences?.brand_voice || 
    (Array.isArray(preferences?.visual_styles) && preferences.visual_styles.length > 0);
  const hasCampaignHistory = previousCampaigns.length > 0;

  // Check if campaign goal is set and non-generic
  const hasCampaignGoal = preferences?.campaign_goal && 
    preferences.campaign_goal.trim() !== '' &&
    !['Local (India)', 'International', 'Global'].includes(preferences.campaign_goal);

  // Get active/upcoming seasonal events (within 30 days)
  const getActiveSeasonalEvents = () => {
    if (!preferences?.seasonal_events) return [];
    
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    let events: string[] = [];
    
    // Handle both array format and object format
    if (Array.isArray(preferences.seasonal_events)) {
      events = preferences.seasonal_events;
    } else if (typeof preferences.seasonal_events === 'object' && preferences.seasonal_events !== null) {
      const seasonalObj = preferences.seasonal_events as { local?: string[]; international?: string[] };
      events = [
        ...(Array.isArray(seasonalObj.local) ? seasonalObj.local : []),
        ...(Array.isArray(seasonalObj.international) ? seasonalObj.international : [])
      ];
    }
    
    // For now, return all events (we can add date-based filtering later if needed)
    // This is a simplified version - in production, you'd check actual event dates
    return events.slice(0, 2); // Limit to 2 most relevant
  };

  const activeSeasonalEvents = getActiveSeasonalEvents();
  const hasActiveSeasonalEvents = activeSeasonalEvents.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-[#6B7280]">Loading campaign data...</p>
        </div>
      </div>
    );
  }

  if (!brandProfile) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        {/* Header Navigation Bar */}
        <header className="bg-[#2D3142] shadow-sm h-16 flex items-center justify-between px-6 md:px-8 fixed top-0 left-0 right-0 z-50">
          <Link
            to="/dashboard/campaign-hub"
            className="flex items-center gap-3"
          >
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-orange-500 shadow-md bg-white flex-shrink-0">
              <img
                src="/enhanced_design_a_contemporary_professional_logo_combining_a_streamlined_genie_figure_with_modern_tech_symbo_g4d4ei5j85xa3vwd3mit_1 (1).png"
                alt="Ad-Genie Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-xl font-bold text-orange-500">
              Ad-Genie
            </span>
            <Sparkles className="text-amber-400 w-4 h-4" />
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-white border border-white/30 rounded-lg hover:bg-white/10 hover:border-white/50 transition-all"
          >
            <LogOut size={18} />
            <span className="font-medium">Logout</span>
          </button>
        </header>

        <div className="pt-24 pb-12 px-4">
          <div className="max-w-[1400px] mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center">
              <h2 className="text-3xl font-bold text-[#2D3142] mb-4">Brand Profile Required</h2>
              <p className="text-[#6B7280] mb-6 text-lg">Please complete your brand setup before creating a campaign.</p>
              <button
                onClick={() => navigate('/dashboard/settings?tab=brand')}
                className="px-6 py-3 bg-gradient-to-r from-orange-400 to-orange-600 text-white font-bold rounded-xl hover:from-orange-500 hover:to-orange-700 transition-all"
              >
                Go to Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header Navigation Bar */}
      <header className="bg-[#2D3142] shadow-sm h-16 flex items-center justify-between px-6 md:px-8 fixed top-0 left-0 right-0 z-50">
        {/* Logo - Left Side */}
        <Link
          to="/dashboard/campaign-hub"
          className="flex items-center gap-3"
        >
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-orange-500 shadow-md bg-white flex-shrink-0">
            <img
              src="/enhanced_design_a_contemporary_professional_logo_combining_a_streamlined_genie_figure_with_modern_tech_symbo_g4d4ei5j85xa3vwd3mit_1 (1).png"
              alt="Ad-Genie Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-xl font-bold text-orange-500">
            Ad-Genie
          </span>
          <Sparkles className="text-amber-400 w-4 h-4" />
        </Link>

        {/* Logout Button - Right Side */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-white border border-white/30 rounded-lg hover:bg-white/10 hover:border-white/50 transition-all"
        >
          <LogOut size={18} />
          <span className="font-medium">Logout</span>
        </button>
      </header>

      {/* Page Content */}
      <div className="pt-20 pb-6 px-4 md:px-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            {/* Brand Profile Section - Enhanced */}
            <div className="mb-6">
              <div className="bg-[#FAFAFA] rounded-xl p-5 border border-[#E5E7EB]">
                {/* Header Row */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {brandProfile.logo && (
                      <img 
                        src={brandProfile.logo} 
                        alt="Logo" 
                        className="w-12 h-12 object-contain rounded-lg border border-[#E5E7EB]" 
                      />
                    )}
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-bold text-[#2D3142] text-base flex items-center gap-1.5">
                          {brandProfile.brand_name}
                          <button
                            onClick={() => navigate('/dashboard/settings?tab=brand')}
                            className="p-0.5 text-[#6B7280] hover:text-orange-500 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 rounded"
                            aria-label="Edit brand profile"
                            title="Edit brand profile"
                          >
                            <Pencil size={12} />
                          </button>
                        </p>
                        <p className="text-xs text-[#6B7280]">{brandProfile.industry}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate('/dashboard/settings?tab=brand')}
                      className="text-orange-500 hover:text-orange-600 text-xs font-semibold transition-colors"
                    >
                      Edit Profile
                    </button>
                    {(hasCampaignHistory || hasCampaignGoal || hasActiveSeasonalEvents) && (
                      <button
                        onClick={() => setIsProfileExpanded(!isProfileExpanded)}
                        className="p-1 text-[#6B7280] hover:text-[#2D3142] transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 rounded"
                        aria-label={isProfileExpanded ? 'Collapse details' : 'Expand details'}
                      >
                        {isProfileExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Preference Chips - Always Visible (Primary: Max 3-4 chips) */}
                {hasPreferences && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-3">
                    {preferences?.campaign_market && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white rounded-lg border border-[#E5E7EB]">
                        <MapPin size={12} className="text-orange-500 flex-shrink-0" />
                        <span className="text-xs text-[#2D3142] font-medium truncate">{preferences.campaign_market}</span>
                      </div>
                    )}
                    {preferences?.brand_voice && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white rounded-lg border border-[#E5E7EB]">
                        <MessageSquare size={12} className="text-orange-500 flex-shrink-0" />
                        <span className="text-xs text-[#2D3142] font-medium truncate" title={preferences.brand_voice}>
                          {preferences.brand_voice.length > 15 ? `${preferences.brand_voice.substring(0, 15)}...` : preferences.brand_voice}
                        </span>
                      </div>
                    )}
                    {Array.isArray(preferences?.visual_styles) && preferences.visual_styles.length > 0 && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white rounded-lg border border-[#E5E7EB]">
                        <Palette size={12} className="text-orange-500 flex-shrink-0" />
                        <span className="text-xs text-[#2D3142] font-medium">
                          {preferences.visual_styles.length === 1 
                            ? preferences.visual_styles[0] 
                            : `${preferences.visual_styles.length} styles`}
                        </span>
                      </div>
                    )}
                    {hasCampaignHistory && campaignStats.lastCampaignDate && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white rounded-lg border border-[#E5E7EB]">
                        <Calendar size={12} className="text-orange-500 flex-shrink-0" />
                        <span className="text-xs text-[#2D3142] font-medium">Last: {formatDate(campaignStats.lastCampaignDate)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Expanded Details - Secondary Information */}
                {isProfileExpanded && (hasPreferences || hasCampaignHistory || hasCampaignGoal || hasActiveSeasonalEvents) && (
                  <div className="pt-3 mt-3 border-t border-[#E5E7EB] space-y-3">
                    {/* Campaign Goal - Conditionally shown if set and non-generic */}
                    {hasCampaignGoal && (
                      <div className="flex items-start gap-2">
                        <Target size={14} className="text-orange-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span className="text-xs text-[#6B7280] block mb-0.5">Campaign Goal:</span>
                          <span className="text-sm font-semibold text-[#2D3142]">{preferences.campaign_goal}</span>
                        </div>
                      </div>
                    )}

                    {/* Seasonal Events - Conditionally shown if active/upcoming */}
                    {hasActiveSeasonalEvents && (
                      <div className="flex items-start gap-2">
                        <Calendar size={14} className="text-orange-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span className="text-xs text-[#6B7280] block mb-1">Seasonal Events:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {activeSeasonalEvents.map((event, index) => (
                              <span 
                                key={index}
                                className="inline-flex items-center px-2 py-1 bg-orange-50 text-orange-700 text-xs font-medium rounded-md border border-orange-200"
                              >
                                {event}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Campaign History Stats */}
                    {hasCampaignHistory && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-[#E5E7EB]">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#6B7280]">Total Campaigns:</span>
                          <span className="text-sm font-semibold text-[#2D3142]">{campaignStats.total}</span>
                        </div>
                        {campaignStats.mostUsedContentType && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#6B7280]">Most Used:</span>
                            <span className="text-sm font-semibold text-[#2D3142]">{getContentTypeLabel(campaignStats.mostUsedContentType)}</span>
                          </div>
                        )}
                        {campaignStats.lastCampaignDate && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#6B7280]">Last Campaign:</span>
                            <span className="text-sm font-semibold text-[#2D3142]">{formatDate(campaignStats.lastCampaignDate)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Empty state for new users */}
                    {!hasPreferences && !hasCampaignHistory && !hasCampaignGoal && !hasActiveSeasonalEvents && (
                      <p className="text-xs text-[#6B7280] italic">Complete your profile to unlock personalized campaigns</p>
                    )}
                  </div>
                )}

                {/* New User Prompt */}
                {!hasPreferences && !hasCampaignHistory && (
                  <div className="pt-2 mt-2 border-t border-[#E5E7EB]">
                    <p className="text-xs text-[#6B7280] italic">Complete your profile to unlock personalized campaigns</p>
                  </div>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-[#2D3142] mb-1">
                Choose Your Content Type
              </h1>
              <p className="text-sm text-[#6B7280]">Select the campaign format for this project</p>
            </div>

            {/* Content Type Selection Grid */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {contentTypes.map((type) => {
                const Icon = type.icon;
                const isDisabled = type.id === 'image-ugc';
                return (
                  <div
                    key={type.id}
                    onClick={() => !isDisabled && setSelectedType(type.id)}
                    className={`relative rounded-xl border-2 p-5 transition-all ${
                      isDisabled
                        ? 'opacity-60 cursor-not-allowed border-[#E5E7EB] bg-gray-50'
                        : selectedType === type.id
                        ? 'border-orange-500 bg-orange-50 shadow-lg cursor-pointer'
                        : 'border-[#E5E7EB] hover:border-orange-300 bg-white shadow-md cursor-pointer hover:shadow-lg'
                    }`}
                  >
                    {type.recommended && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                        <span className="bg-gradient-to-r from-amber-400 to-orange-600 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-md">
                          COMING SOON!
                        </span>
                      </div>
                    )}

                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${type.color} flex items-center justify-center mb-4 mx-auto shadow-md`}>
                      <Icon size={28} className="text-white" />
                    </div>

                    <h3 className="text-lg font-bold text-[#2D3142] text-center mb-1">
                      {type.title}
                    </h3>
                    <p className="text-sm font-semibold text-[#6B7280] text-center mb-2">
                      {type.subtitle}
                    </p>
                    <p className="text-xs text-[#6B7280] text-center">
                      {type.description}
                    </p>

                    {selectedType === type.id && !isDisabled && (
                      <div className="absolute top-3 right-3">
                        <div className="w-6 h-6 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-md">
                          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Preferences Checkbox */}
            <div className="mb-5">
              <label className="flex items-center gap-2 cursor-pointer p-3 bg-[#FAFAFA] rounded-lg hover:bg-orange-50 transition-colors">
                <input
                  type="checkbox"
                  checked={useExistingPreferences}
                  onChange={(e) => setUseExistingPreferences(e.target.checked)}
                  className="w-4 h-4 accent-orange-500 cursor-pointer"
                />
                <span className="text-sm text-[#2D3142] font-medium">Use existing seasonal preferences</span>
              </label>
            </div>

            {/* Action Buttons - Enhanced Button Group */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[#E5E7EB]">
              {/* Back Button - 40% width on desktop */}
              <button
                onClick={() => navigate('/dashboard/campaign-hub')}
                className="w-full sm:w-[40%] px-5 py-3 rounded-lg border-2 border-[#E5E7EB] text-[#6B7280] hover:bg-[#FAFAFA] hover:border-[#6B7280] transition-all font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-[#E5E7EB] focus:ring-offset-2"
              >
                Back
              </button>
              
              {/* Generate Campaign Button - 60% width on desktop */}
              <button
                onClick={handleGenerate}
                disabled={!selectedType || generating || selectedType === 'image-ugc'}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-400 to-orange-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl hover:from-orange-500 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-base flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 active:scale-[0.98] group"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Starting Generation...
                  </>
                ) : (
                  <>
                    Generate Campaign
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-200" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
