import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Download, Share2, Home, RefreshCw, CheckCircle, Loader2 } from 'lucide-react';
import { campaignService, userService } from '../../services/database';
import { sendBrandDataToWebhook, parseWebhookResponse, BrandWebhookData, WebhookImageItem } from '../../services/webhookService';
import { downloadImage, downloadMultipleImages, ImageData } from '../../utils/imageDownload';
import { useToast } from '../../contexts/ToastContext';
import { imageService } from '../../services/imageService';
import { tokenService } from '../../services/tokenService';

export default function ResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [images, setImages] = useState<WebhookImageItem[]>([]);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [webhookPayload, setWebhookPayload] = useState<BrandWebhookData | null>(null);
  const [campaignType, setCampaignType] = useState<string>('');

  useEffect(() => {
    const currentUserEmail = localStorage.getItem('currentUser');
    if (!currentUserEmail) {
      navigate('/login');
      return;
    }

    loadCampaignData();
  }, [navigate, location]);

  const loadCampaignData = async () => {
    try {
      setLoading(true);
      const state = location.state as {
        campaignId?: string;
        images?: WebhookImageItem[];
        webhookPayload?: BrandWebhookData;
      } | null;

      // If we have data from navigation state, use it
      if (state?.campaignId) {
        setCampaignId(state.campaignId);
        if (state.images) {
          setImages(state.images);
        }
        if (state.webhookPayload) {
          setWebhookPayload(state.webhookPayload);
        }

        // Load campaign to get content type
        const campaign = await campaignService.getById(state.campaignId);
        if (campaign) {
          setCampaignType(campaign.content_type);
          
          // If images weren't in state, try to get them from campaign
          if (!state?.images && campaign.generated_assets) {
            const assets = campaign.generated_assets;
            if (assets.images && Array.isArray(assets.images)) {
              setImages(assets.images);
            }
            
            // If webhook payload wasn't in state, try to get it from campaign
            if (!state?.webhookPayload && assets.webhook_payload) {
              setWebhookPayload(assets.webhook_payload);
            }
          }
        }
      } else {
        // Try to get campaign ID from URL params or load latest campaign
        const currentUserEmail = localStorage.getItem('currentUser');
        if (currentUserEmail) {
          const user = await userService.getByEmail(currentUserEmail);
          if (user) {
            const campaigns = await campaignService.getByUserId(user.id);
            if (campaigns.length > 0) {
              const latestCampaign = campaigns[0];
              setCampaignId(latestCampaign.id);
              setCampaignType(latestCampaign.content_type);
              
              if (latestCampaign.generated_assets) {
                const assets = latestCampaign.generated_assets;
                if (assets.images && Array.isArray(assets.images)) {
                  setImages(assets.images);
                }
                if (assets.webhook_payload) {
                  setWebhookPayload(assets.webhook_payload);
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Error loading campaign data:', err);
      showError('Failed to load campaign data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadImage = async (image: WebhookImageItem) => {
    try {
      const imageUrl = image.url || image.image_url || image.imageUrl || image.src || '';
      if (!imageUrl) {
        showError('Image URL not found');
        return;
      }
      await downloadImage(imageUrl, image.title || `image-${Date.now()}.png`);
      success('Image downloaded successfully');
    } catch (err: any) {
      console.error('Error downloading image:', err);
      showError(`Failed to download image: ${err.message}`);
    }
  };

  const handleDownloadAll = async () => {
    try {
      const imageData: ImageData[] = images.map((img, index) => ({
        url: img.url || img.image_url || img.imageUrl || img.src || '',
        title: img.title || `Image ${index + 1}`,
        id: img.id || `img-${index}`,
      })).filter(img => img.url); // Filter out images without URLs

      if (imageData.length === 0) {
        showError('No images available to download');
        return;
      }

      await downloadMultipleImages(imageData);
      success('All images downloaded successfully');
    } catch (err: any) {
      console.error('Error downloading images:', err);
      showError(`Failed to download images: ${err.message}`);
    }
  };

  const handleRegenerate = async () => {
    if (!campaignId || !webhookPayload) {
      // Try to get webhook payload from campaign
      if (campaignId) {
        const payload = await campaignService.getWebhookPayloadForCampaign(campaignId);
        if (payload) {
          setWebhookPayload(payload);
          await regenerateWithPayload(campaignId, payload);
        } else {
          showError('Unable to regenerate: webhook data not found');
        }
      } else {
        showError('Campaign ID not found');
      }
      return;
    }

    await regenerateWithPayload(campaignId, webhookPayload);
  };

  const regenerateWithPayload = async (campId: string, payload: BrandWebhookData) => {
    try {
      setRegenerating(true);
      
      // Create new campaign or update existing
      const newCampaign = await campaignService.create({
        user_id: payload.user_id,
        brand_profile_id: null, // Will be set if we can find it
        content_type: payload.content_type || 'image-only',
        status: 'generating',
        generated_assets: {
          webhook_payload: payload,
          images: [],
        },
      });

      // Call webhook
      const webhookResponse = await sendBrandDataToWebhook(payload);
      const parsedImages = parseWebhookResponse(webhookResponse);

      // Upload regenerated images to Supabase storage
      console.log('📤 Uploading regenerated images to Supabase storage...');
      const uploadResults = await Promise.allSettled(
        parsedImages.map(async (image) => {
          const originalUrl = image.url || image.image_url || image.imageUrl || image.src || '';
          if (!originalUrl) {
            console.warn('⚠️ Regenerated image has no URL, skipping upload');
            return { image, uploaded: false, reason: 'no_url' };
          }
          
          try {
            // Get user ID from payload
            const userId = payload.user_id;
            if (!userId) {
              throw new Error('User ID is missing from payload');
            }
            
            console.log(`📤 Uploading regenerated image ${parsedImages.indexOf(image) + 1}/${parsedImages.length}...`);
            
            // Upload to Supabase storage
            const supabaseUrl = await imageService.uploadGeneratedImageToStorage(
              userId,
              originalUrl,
              newCampaign.id
            );
            
            // Check if upload actually succeeded (URL should be Supabase URL)
            const isSupabaseUrl = supabaseUrl.includes('supabase.co/storage');
            
            if (isSupabaseUrl) {
              console.log(`✅ Regenerated image ${parsedImages.indexOf(image) + 1} uploaded successfully to Supabase`);
              return {
                image: {
                  ...image,
                  url: supabaseUrl,
                  original_url: originalUrl,
                },
                uploaded: true,
              };
            } else {
              console.warn(`⚠️ Regenerated image ${parsedImages.indexOf(image) + 1} upload returned non-Supabase URL`);
              return {
                image: {
                  ...image,
                  url: originalUrl,
                  original_url: originalUrl,
                },
                uploaded: false,
                reason: 'fallback_to_original',
              };
            }
          } catch (error: any) {
            console.error(`❌ Error uploading regenerated image ${parsedImages.indexOf(image) + 1}:`, {
              error: error,
              message: error?.message,
              originalUrl: originalUrl.substring(0, 100),
            });
            return {
              image: {
                ...image,
                url: originalUrl,
                original_url: originalUrl,
              },
              uploaded: false,
              reason: 'upload_error',
              error: error?.message,
            };
          }
        })
      );
      
      // Process results
      const uploadedImages = uploadResults.map((result) => {
        if (result.status === 'fulfilled') {
          return result.value.image;
        } else {
          console.error('❌ Unexpected error in upload promise:', result.reason);
          return { url: '', original_url: '' };
        }
      });
      
      // Count successful uploads
      const successfulUploads = uploadResults.filter(
        (result) => result.status === 'fulfilled' && result.value.uploaded === true
      ).length;
      
      const failedUploads = parsedImages.length - successfulUploads;
      
      console.log(`📊 Regeneration Upload Summary: ${successfulUploads}/${parsedImages.length} images uploaded to Supabase`);
      if (failedUploads > 0) {
        console.warn(`⚠️ ${failedUploads} regenerated image(s) failed to upload and are using webhook URLs`);
      }

      // Update campaign with generated assets (including both URLs)
      await campaignService.update(newCampaign.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        generated_assets: {
          webhook_payload: payload,
          images: uploadedImages,
          webhook_response: webhookResponse,
        },
      });

      // Deduct Magic Tokens for campaign regeneration
      try {
        const campaignCost = tokenService.calculateCampaignCost(
          payload.content_type || 'image-only',
          { images: uploadedImages, videos: [] }
        );
        
        // Deduct base cost (2 tokens)
        await tokenService.deductTokens(
          payload.user_id,
          2,
          'campaign_generation',
          newCampaign.id,
          `Campaign regeneration (${payload.content_type || 'image-only'})`
        );
        
        // Deduct tokens for each image (1 token per image)
        if (uploadedImages.length > 0) {
          await tokenService.deductTokens(
            payload.user_id,
            uploadedImages.length,
            'image',
            newCampaign.id,
            `${uploadedImages.length} image(s) regenerated`
          );
        }
        
        console.log(`✨ Deducted ${campaignCost} Magic Tokens for campaign regeneration`);
      } catch (tokenError) {
        console.error('Error deducting Magic Tokens:', tokenError);
        // Don't block the flow - test mode allows negative tokens
      }

      // Update state with new images
      setImages(uploadedImages);
      setCampaignId(newCampaign.id);
      success('Campaign regenerated successfully!');
    } catch (err: any) {
      console.error('Error regenerating campaign:', err);
      showError(`Failed to regenerate: ${err.message}`);
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#2563EB] animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading campaign results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#10B981] bg-opacity-20 border border-[#10B981] rounded-full mb-6"
          >
            <CheckCircle className="text-[#10B981]" size={24} />
            <span className="text-[#10B981] font-semibold">Campaign Generated Successfully!</span>
          </motion.div>
          <h1 className="text-5xl font-bold text-slate-900 mb-4">
            Your Campaign is Ready
          </h1>
          <p className="text-xl text-slate-600">
            Download your assets and launch your campaign
          </p>
        </motion.div>

        {images.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-slate-900">Generated Images ({images.length})</h2>
              <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                  onClick={handleDownloadAll}
                className="px-6 py-3 bg-[#2563EB] text-white font-bold rounded-lg shadow-lg flex items-center gap-2 hover:bg-[#1d4ed8]"
              >
                <Download size={20} />
                  Download All
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="px-6 py-3 bg-[#8B5CF6] text-white font-bold rounded-lg shadow-lg flex items-center gap-2 hover:bg-[#7c3aed] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {regenerating ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={20} />
                      Regenerate
                    </>
                  )}
              </motion.button>
              </div>
            </div>
            <div className={`grid gap-6 ${
              images.length === 1 
                ? 'grid-cols-1 max-w-md mx-auto' 
                : images.length === 2 
                ? 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto'
                : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
            }`}>
              {images.map((image, index) => {
                const imageUrl = image.url || image.image_url || image.imageUrl || image.src || '';
                const imageTitle = image.title || `Image ${index + 1}`;
                const imageId = image.id || `img-${index}`;

                if (!imageUrl) return null;

                return (
                <motion.div
                    key={imageId}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="group relative bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all"
                >
                  <div className="aspect-square bg-slate-200">
                    <img
                        src={imageUrl}
                        alt={imageTitle}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          // Fallback if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://via.placeholder.com/400x400?text=Image+Not+Available';
                        }}
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-3">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                          onClick={() => handleDownloadImage(image)}
                        className="p-3 bg-white rounded-full shadow-lg"
                          title="Download image"
                      >
                        <Download size={20} className="text-slate-900" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            if (navigator.share) {
                              navigator.share({
                                title: imageTitle,
                                url: imageUrl,
                              }).catch(() => {
                                // Fallback to copying URL
                                navigator.clipboard.writeText(imageUrl);
                                success('Image URL copied to clipboard');
                              });
                            } else {
                              navigator.clipboard.writeText(imageUrl);
                              success('Image URL copied to clipboard');
                            }
                          }}
                        className="p-3 bg-white rounded-full shadow-lg"
                          title="Share image"
                      >
                        <Share2 size={20} className="text-slate-900" />
                      </motion.button>
                    </div>
                  </div>
                  <div className="p-4">
                      <p className="font-semibold text-slate-900">{imageTitle}</p>
                  </div>
                </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {images.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-lg p-12 text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
              <CheckCircle size={40} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No images generated yet</h3>
            <p className="text-slate-600 mb-6">
              {webhookPayload ? 'Click regenerate to generate images' : 'Unable to regenerate: missing campaign data'}
            </p>
            {webhookPayload && (
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className="px-6 py-3 bg-[#2563EB] text-white font-semibold rounded-lg shadow-md hover:bg-[#1d4ed8] transition-all disabled:opacity-50"
                      >
                {regenerating ? 'Regenerating...' : 'Generate Images'}
              </button>
            )}
          </motion.div>
        )}


        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex justify-center gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/dashboard/campaign-hub')}
            className="px-8 py-4 bg-[#2563EB] text-white font-bold rounded-lg shadow-lg flex items-center gap-3 hover:bg-[#1d4ed8]"
          >
            <RefreshCw size={20} />
            Create New Campaign
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/dashboard/campaigns')}
            className="px-8 py-4 bg-white text-slate-700 font-bold rounded-lg shadow-lg border-2 border-slate-300 flex items-center gap-3 hover:bg-slate-50"
          >
            <Home size={20} />
            View All Campaigns
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
