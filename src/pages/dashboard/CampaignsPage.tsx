import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, Image, Video, Sparkles, Calendar, Trash2, Eye } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
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
        return <Image size={20} />;
      case 'ugc-only':
        return <Video size={20} />;
      case 'image-ugc':
        return <Sparkles size={20} />;
      default:
        return <Image size={20} />;
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
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
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
      <DashboardLayout breadcrumbs={[{ label: 'My Campaigns' }]}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block w-12 h-12 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-600">Loading campaigns...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout breadcrumbs={[{ label: 'My Campaigns' }]}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">My Campaigns</h1>
            <p className="text-slate-600">View and manage your campaign history</p>
          </div>
          <button
            onClick={() => navigate('/dashboard/content-selection')}
            className="flex items-center gap-2 px-6 py-3 bg-[#2563EB] text-white font-semibold rounded-lg shadow-md hover:bg-[#1d4ed8] transition-all"
          >
            <Plus size={20} />
            New Campaign
          </button>
        </div>

        {campaigns.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
              <Sparkles size={40} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No campaigns yet</h3>
            <p className="text-slate-600 mb-6">
              Create your first campaign to get started with Ad Genie
            </p>
            <button
              onClick={() => navigate('/dashboard/content-selection')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#2563EB] text-white font-semibold rounded-lg shadow-md hover:bg-[#1d4ed8] transition-all"
            >
              <Plus size={20} />
              Create Your First Campaign
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign, index) => (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#8B5CF6] flex items-center justify-center text-white">
                        {getContentTypeIcon(campaign.content_type)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {getContentTypeLabel(campaign.content_type)}
                        </h3>
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            campaign.status
                          )}`}
                        >
                          {campaign.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                    <Calendar size={16} />
                    <span>{formatDate(campaign.created_at)}</span>
                  </div>

                  {/* Show thumbnail if images are available */}
                  {campaign.status === 'completed' && campaign.generated_assets?.images && 
                   Array.isArray(campaign.generated_assets.images) && 
                   campaign.generated_assets.images.length > 0 && (
                    <div className="mb-4">
                      <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden">
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
                      <p className="text-xs text-slate-500 mt-2 text-center">
                        {campaign.generated_assets.images.length} image{campaign.generated_assets.images.length !== 1 ? 's' : ''} generated
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {campaign.status === 'completed' && (
                      <button
                        onClick={() => navigate('/dashboard/results', { state: { campaignId: campaign.id } })}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#2563EB] text-white font-semibold rounded-lg hover:bg-[#1d4ed8] transition-all"
                      >
                        <Eye size={16} />
                        View
                      </button>
                    )}
                    {campaign.status === 'generating' && (
                      <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 font-semibold rounded-lg">
                        <div className="w-4 h-4 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
                        Generating...
                      </div>
                    )}
                    {campaign.status === 'failed' && (
                      <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 font-semibold rounded-lg">
                        Failed
                      </div>
                    )}
                    {deleteConfirm === campaign.id ? (
                      <>
                        <button
                          onClick={() => handleDeleteCampaign(campaign.id)}
                          className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-all text-sm"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-all text-sm"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(campaign.id)}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all"
                        aria-label="Delete campaign"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
