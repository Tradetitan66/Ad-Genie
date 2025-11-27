import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Download, RefreshCw } from 'lucide-react';
import { sendBrandDataToWebhook, parseWebhookResponse, BrandWebhookData, WebhookImageItem } from '../../services/webhookService';
import { campaignService } from '../../services/database';
import { useToast } from '../../contexts/ToastContext';
import { downloadImage, downloadMultipleImages, ImageData } from '../../utils/imageDownload';
import { imageService } from '../../services/imageService';
// @ts-ignore - RotatingText is JSX component
import RotatingText from '../../components/RotatingText.jsx';
import '../../components/RotatingText.css';

export default function AdGenieWorkingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { error: showError, success } = useToast();
  const [images, setImages] = useState<WebhookImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [webhookPayload, setWebhookPayload] = useState<BrandWebhookData | null>(null);

  useEffect(() => {
    console.log('🎬 AdGenieWorkingPage: Component mounted');
    console.log('📍 Current location:', location.pathname);
    console.log('📦 Location state:', location.state);

    const currentUserEmail = localStorage.getItem('currentUser');
    if (!currentUserEmail) {
      console.error('❌ No user email found, redirecting to login');
      navigate('/login');
      return;
    }

    const state = location.state as { campaignId?: string; webhookPayload?: BrandWebhookData; skipOnboardingCheck?: boolean } | null;
    
    if (!state) {
      console.error('❌ No state found in location');
      showError('Missing campaign information. Please try again.');
      // Delay redirect to allow error message to show
      setTimeout(() => {
        navigate('/dashboard/campaign-hub');
      }, 2000);
      return;
    }

    if (!state.campaignId || !state.webhookPayload) {
      console.error('❌ Missing required state fields:', { 
        hasCampaignId: !!state.campaignId, 
        hasWebhookPayload: !!state.webhookPayload 
      });
      showError('Missing campaign information. Please try again.');
      // Delay redirect to allow error message to show
      setTimeout(() => {
        navigate('/dashboard/campaign-hub');
      }, 2000);
      return;
    }

    console.log('✅ State validated, setting up webhook call');
    setCampaignId(state.campaignId);
    setWebhookPayload(state.webhookPayload);

    // Trigger webhook immediately when page loads
    // Webhook will wait for respond node to be connected in n8n
    console.log('🚀 AdGenieWorkingPage: Triggering webhook immediately...');
    callWebhookAndWait(state.campaignId, state.webhookPayload);
  }, [navigate, location, showError]);

  const callWebhookAndWait = async (campId: string, payload: BrandWebhookData) => {
    try {
      console.log('📞 Calling webhook - this may take a while as it waits for respond node...');
      
      // Call webhook - will wait until respond node is connected in n8n
      const webhookResponse = await sendBrandDataToWebhook(payload);
      
      console.log('✅ Webhook response received, parsing images...');
      
      // Parse images from response
      const parsedImages = parseWebhookResponse(webhookResponse);
      
      console.log(`📸 Parsed ${parsedImages.length} images from webhook response`);
      
      // Upload images to Supabase storage
      console.log('📤 Uploading generated images to Supabase storage...');
      const uploadedImages = await Promise.all(
        parsedImages.map(async (image) => {
          const originalUrl = image.url || image.image_url || image.imageUrl || image.src || '';
          if (!originalUrl) return image;
          
          try {
            // Get user ID from payload
            const userId = payload.user_id;
            // Upload to Supabase storage
            const supabaseUrl = await imageService.uploadGeneratedImageToStorage(
              userId,
              originalUrl,
              campId
            );
            
            // Return image with both original and Supabase URLs
            return {
              ...image,
              url: supabaseUrl, // Use Supabase URL as primary
              original_url: originalUrl, // Keep original URL as backup
            };
          } catch (error: any) {
            console.error('Error uploading image to Supabase:', error);
            // Return original image if upload fails
            return image;
          }
        })
      );
      
      console.log(`✅ Uploaded ${uploadedImages.length} images to Supabase storage`);
      
      // Update campaign with generated assets (including both URLs)
      await campaignService.update(campId, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        generated_assets: {
          webhook_payload: payload,
          images: uploadedImages,
          webhook_response: webhookResponse,
        },
      });

      // Stop loading and automatically navigate to ResultsPage with images
      setLoading(false);
      success('Campaign generated successfully!');
      
      // Automatically navigate to ResultsPage to show images with download options
      console.log('🎯 Navigating to ResultsPage with generated images...');
      navigate('/dashboard/results', {
        state: { 
          campaignId: campId, 
          images: uploadedImages, 
          webhookPayload: payload,
          skipOnboardingCheck: true // Allow access during onboarding completion
        }
      });
    } catch (err: any) {
      console.error('❌ Webhook error:', err);
      showError(`Failed to generate campaign: ${err.message}`);
      
      // Update campaign status to failed
      try {
        await campaignService.update(campId, {
          status: 'failed',
        });
      } catch (updateError) {
        console.error('Failed to update campaign status:', updateError);
      }
      
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
      })).filter(img => img.url);

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
      showError('Unable to regenerate: missing campaign data');
      return;
    }

    setLoading(true);
    setImages([]);
    await callWebhookAndWait(campaignId, webhookPayload);
  };

  // Always show loading state initially to ensure generating page displays
  // This prevents the page from redirecting before showing the animation
  console.log('🎨 AdGenieWorkingPage: Rendering, loading state:', loading);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2563EB] to-[#8B5CF6] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl p-8"
      >
        {loading ? (
          // Show rotating text while waiting for webhook response
          <div className="text-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="inline-flex w-20 h-20 bg-gradient-to-br from-[#2563EB] to-[#8B5CF6] rounded-full items-center justify-center mb-8"
            >
              <Sparkles className="text-white" size={40} />
            </motion.div>
            
            <div className="mb-6 min-h-[60px] flex items-center justify-center">
              <RotatingText
                texts={[
                  "Ad-Genie is working for your marketing wish",
                  "Creating your perfect campaign",
                  "Generating amazing content",
                  "Almost there..."
                ]}
                mainClassName="text-3xl font-bold text-slate-900"
                rotationInterval={3000}
              />
            </div>
            
            <p className="text-slate-600 text-lg">Please wait while we create your campaign...</p>
          </div>
        ) : (
          // Show images when webhook responds
          <div>
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#10B981] bg-opacity-20 border border-[#10B981] rounded-full mb-6"
              >
                <Sparkles className="text-[#10B981]" size={24} />
                <span className="text-[#10B981] font-semibold">Campaign Generated Successfully!</span>
              </motion.div>
              <h2 className="text-4xl font-bold text-slate-900 mb-2">
                Your Campaign is Ready
              </h2>
              <p className="text-xl text-slate-600">
                Download your assets and launch your campaign
              </p>
            </div>
            
            {images.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-slate-900">
                    Generated Images ({images.length})
                  </h3>
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
                      className="px-6 py-3 bg-[#8B5CF6] text-white font-bold rounded-lg shadow-lg flex items-center gap-2 hover:bg-[#7c3aed]"
                    >
                      <RefreshCw size={20} />
                      Regenerate
                    </motion.button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
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
                        transition={{ delay: index * 0.1 }}
                        className="group relative bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all"
                      >
                        <div className="aspect-square bg-slate-200">
                          <img
                            src={imageUrl}
                            alt={imageTitle}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://via.placeholder.com/400x400?text=Image+Not+Available';
                            }}
                          />
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDownloadImage(image)}
                            className="p-3 bg-white rounded-full shadow-lg"
                            title="Download image"
                          >
                            <Download size={20} className="text-slate-900" />
                          </motion.button>
                        </div>
                        <div className="p-4">
                          <p className="font-semibold text-slate-900">{imageTitle}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                
                <div className="flex justify-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/dashboard/results', {
                      state: { campaignId, images, webhookPayload }
                    })}
                    className="px-8 py-4 bg-[#2563EB] text-white font-bold rounded-lg shadow-lg hover:bg-[#1d4ed8] transition-all"
                  >
                    View Full Results
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/dashboard/campaigns')}
                    className="px-8 py-4 bg-white text-slate-700 font-bold rounded-lg shadow-lg border-2 border-slate-300 hover:bg-slate-50 transition-all"
                  >
                    View All Campaigns
                  </motion.button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-600 mb-6">No images were generated.</p>
                {webhookPayload && (
                  <button
                    onClick={handleRegenerate}
                    className="px-6 py-3 bg-[#2563EB] text-white font-semibold rounded-lg hover:bg-[#1d4ed8] transition-all"
                  >
                    Try Again
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

