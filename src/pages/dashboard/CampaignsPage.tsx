import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Image, Video, Sparkles, Calendar, Trash2, Eye, Loader2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { useToast } from '../../contexts/ToastContext';
import { campaignService, userService, Campaign } from '../../services/database';

export default function CampaignsPage() {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      console.log('📋 CampaignsPage: Starting to load campaigns...');
      
      const currentUserEmail = localStorage.getItem('currentUser');
      if (!currentUserEmail) {
        console.warn('⚠️ CampaignsPage: No user email found in localStorage');
        setLoading(false);
        return;
      }

      console.log('📧 CampaignsPage: User email from localStorage:', currentUserEmail);

      const user = await userService.getByEmail(currentUserEmail);
      if (!user) {
        console.error('❌ CampaignsPage: User not found for email:', currentUserEmail);
        setLoading(false);
        return;
      }

      console.log('👤 CampaignsPage: User found:', {
        id: user.id,
        email: user.email,
        display_name: user.display_name
      });

      console.log('🔍 CampaignsPage: Querying campaigns for user_id:', user.id);
      const userCampaigns = await campaignService.getByUserId(user.id);
      
      console.log(`✅ CampaignsPage: Loaded ${userCampaigns.length} campaigns`);
      setCampaigns(userCampaigns);
    } catch (err: any) {
      console.error('❌ CampaignsPage: Error loading campaigns:', {
        error: err,
        message: err?.message,
        stack: err?.stack
      });
      error('Failed to load campaigns. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      await campaignService.delete(campaignId);
      setCampaigns(campaigns.filter((c) => c.id !== campaignId));
      success('Campaign deleted successfully');
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting campaign:', err);
      error('Failed to delete campaign');
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'image-only':
        return <Image size={16} />;
      case 'ugc-only':
        return <Video size={16} />;
      case 'image-ugc':
        return <Sparkles size={16} />;
      default:
        return <Image size={16} />;
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'generating':
        return 'bg-orange-100 text-orange-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-[#FAFAFA] text-[#6B7280]';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <PageHeader />
        <div className="pt-20 pb-4 px-4 md:px-8">
          <div className="max-w-[1400px] mx-auto">
            <nav aria-label="Breadcrumb" className="mb-6">
              <ol className="flex items-center gap-2 text-sm">
                <li>
                  <Link to="/dashboard/campaign-hub" className="text-[#6B7280] hover:text-orange-500 transition-colors">
                    Dashboard
                  </Link>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#E5E7EB]">/</span>
                  <span className="text-[#2D3142] font-medium">My Campaigns</span>
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
            <p className="text-[#6B7280]">Loading campaigns...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <PageHeader />
      
      {/* Breadcrumb */}
      <div className="pt-20 pb-4 px-4 md:px-8">
        <div className="max-w-[1400px] mx-auto">
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-sm">
              <li>
                <Link to="/dashboard/campaign-hub" className="text-[#6B7280] hover:text-orange-500 transition-colors">
                  Dashboard
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#E5E7EB]">/</span>
                <span className="text-[#2D3142] font-medium">My Campaigns</span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Page Content */}
      <div className="px-4 md:px-8 pb-12">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#2D3142] mb-1">My Campaigns</h1>
              <p className="text-sm text-[#6B7280]">View and manage your campaign history</p>
            </div>
            <button
              onClick={() => navigate('/dashboard/content-selection')}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-400 to-orange-600 text-white text-sm font-semibold rounded-lg shadow-md hover:from-orange-500 hover:to-orange-700 transition-all"
            >
              <Plus size={18} />
              New Campaign
            </button>
          </div>

          {campaigns.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#FAFAFA] flex items-center justify-center">
                <Sparkles size={40} className="text-[#6B7280]" />
              </div>
              <h3 className="text-xl font-bold text-[#2D3142] mb-2">No campaigns yet</h3>
              <p className="text-[#6B7280] mb-6">
                Create your first campaign to get started with Ad Genie
              </p>
              <button
                onClick={() => navigate('/dashboard/content-selection')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-400 to-orange-600 text-white font-semibold rounded-lg shadow-md hover:from-orange-500 hover:to-orange-700 transition-all"
              >
                <Plus size={20} />
                Create Your First Campaign
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all"
                >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center text-white shadow-md flex-shrink-0">
                        {getContentTypeIcon(campaign.content_type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm text-[#2D3142] truncate">
                          {getContentTypeLabel(campaign.content_type)}
                        </h3>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold mt-1 ${getStatusColor(
                            campaign.status
                          )}`}
                        >
                          {campaign.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-[#6B7280] mb-3">
                    <Calendar size={12} />
                    <span className="truncate">{formatDate(campaign.created_at)}</span>
                  </div>

                  {/* Show thumbnail if images are available */}
                  {campaign.status === 'completed' && campaign.generated_assets?.images && 
                   Array.isArray(campaign.generated_assets.images) && 
                   campaign.generated_assets.images.length > 0 && (
                    <div className="mb-3">
                      <div className="aspect-[4/3] bg-[#FAFAFA] rounded-lg overflow-hidden">
                        {(() => {
                          const firstImage = campaign.generated_assets.images[0];
                          const imageUrl = firstImage?.url || firstImage?.image_url || firstImage?.imageUrl || firstImage?.src || firstImage;
                          if (typeof imageUrl === 'string' && imageUrl) {
                            return (
                              <img
                                src={imageUrl}
                                alt="Campaign thumbnail"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <p className="text-[10px] text-[#6B7280] mt-1.5 text-center">
                        {campaign.generated_assets.images.length} image{campaign.generated_assets.images.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {campaign.status === 'completed' && (
                      <button
                        onClick={() => navigate('/dashboard/results', { state: { campaignId: campaign.id } })}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-orange-400 to-orange-600 text-white text-sm font-semibold rounded-lg hover:from-orange-500 hover:to-orange-700 transition-all"
                      >
                        <Eye size={14} />
                        View
                      </button>
                    )}
                    {campaign.status === 'generating' && (
                      <div className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-orange-50 text-orange-700 text-sm font-semibold rounded-lg">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Generating...
                      </div>
                    )}
                    {campaign.status === 'failed' && (
                      <div className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-700 text-sm font-semibold rounded-lg">
                        Failed
                      </div>
                    )}
                    {deleteConfirm === campaign.id ? (
                      <>
                        <button
                          onClick={() => handleDeleteCampaign(campaign.id)}
                          className="flex-1 px-3 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-all"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="flex-1 px-3 py-2 bg-[#E5E7EB] text-[#2D3142] text-xs font-semibold rounded-lg hover:bg-[#D1D5DB] transition-all"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(campaign.id)}
                        className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all flex-shrink-0"
                        aria-label="Delete campaign"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
