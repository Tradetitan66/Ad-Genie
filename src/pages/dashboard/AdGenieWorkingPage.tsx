import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Download, RefreshCw } from 'lucide-react';
import { sendBrandDataToWebhook, parseWebhookResponse, parseWebhookVideoResponse, BrandWebhookData, WebhookImageItem, WebhookVideoItem } from '../../services/webhookService';
import { campaignService } from '../../services/database';
import { useToast } from '../../contexts/ToastContext';
import { downloadImage, downloadMultipleImages, ImageData } from '../../utils/imageDownload';
import { imageService } from '../../services/imageService';
import { ugcService } from '../../services/ugcService';
import { tokenService } from '../../services/tokenService';
import RotatingText from '../../components/RotatingText';
import PageHeader from '../../components/PageHeader';

export default function AdGenieWorkingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { error: showError, success } = useToast();
  const [images, setImages] = useState<WebhookImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [webhookPayload, setWebhookPayload] = useState<BrandWebhookData | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('Initializing...');
  const webhookCalledRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate webhook calls (React StrictMode runs effects twice in development)
    if (webhookCalledRef.current) {
      console.log('⚠️ Webhook already called, skipping duplicate call');
      return;
    }

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

    // Mark webhook as called to prevent duplicate calls
    webhookCalledRef.current = true;

    // Trigger webhook immediately when page loads
    // Webhook will wait for respond node to be connected in n8n
    console.log('🚀 AdGenieWorkingPage: Triggering webhook immediately...');
    callWebhookAndWait(state.campaignId, state.webhookPayload);
  }, [navigate, location, showError]);

  const callWebhookAndWait = async (campId: string, payload: BrandWebhookData) => {
    try {
      console.log('📞 Calling webhook - this may take a while as it waits for respond node...');
      setProgress(10);
      setProgressMessage('Connecting to webhook...');
      
      // Call webhook - will wait until respond node is connected in n8n
      setProgress(30);
      setProgressMessage('Processing your campaign request...');
      const webhookResponse = await sendBrandDataToWebhook(payload);
      
      setProgress(50);
      setProgressMessage('Receiving generated content...');
      
      const contentType = payload.content_type || 'image-only';
      
      // Handle UGC-only campaigns
      if (contentType === 'ugc-only') {
        console.log('✅ Webhook response received, parsing videos...');
        setProgress(60);
        setProgressMessage('Parsing video content...');
        
        // Parse videos from response
        const parsedVideos = parseWebhookVideoResponse(webhookResponse);
        
        console.log(`🎬 Parsed ${parsedVideos.length} videos from webhook response`);
        
        // Upload videos to Supabase storage
        console.log('📤 Uploading generated videos to Supabase storage...');
        setProgress(70);
        setProgressMessage(`Uploading ${parsedVideos.length} video${parsedVideos.length !== 1 ? 's' : ''}...`);
        const uploadResults = await Promise.allSettled(
          parsedVideos.map(async (video) => {
            const originalUrl = video.url || video.video_url || video.videoUrl || video.src || '';
            if (!originalUrl) {
              console.warn('⚠️ Video has no URL, skipping upload');
              return { video, uploaded: false, reason: 'no_url' };
            }
            
            try {
              // Get user ID from payload
              const userId = payload.user_id;
              if (!userId) {
                throw new Error('User ID is missing from payload');
              }
              
              console.log(`📤 Uploading video ${parsedVideos.indexOf(video) + 1}/${parsedVideos.length}...`);
              
              // Upload to Supabase storage
              const supabaseUrl = await ugcService.uploadGeneratedVideoToStorage(
                userId,
                originalUrl,
                campId
              );
              
              // Check if upload actually succeeded (URL should be Supabase URL)
              const isSupabaseUrl = supabaseUrl.includes('supabase.co/storage');
              
              if (isSupabaseUrl) {
                console.log(`✅ Video ${parsedVideos.indexOf(video) + 1} uploaded successfully to Supabase`);
                return {
                  video: {
                    ...video,
                    url: supabaseUrl, // Use Supabase URL as primary
                    original_url: originalUrl, // Keep original URL as backup
                  },
                  uploaded: true,
                };
              } else {
                console.warn(`⚠️ Video ${parsedVideos.indexOf(video) + 1} upload returned non-Supabase URL, using original`);
                return {
                  video: {
                    ...video,
                    url: originalUrl,
                    original_url: originalUrl,
                  },
                  uploaded: false,
                  reason: 'fallback_to_original',
                  returnedUrl: supabaseUrl,
                };
              }
            } catch (error: any) {
              console.error(`❌ Error uploading video ${parsedVideos.indexOf(video) + 1}:`, {
                error: error,
                message: error?.message,
                originalUrl: originalUrl.substring(0, 100),
              });
              // Return original video if upload fails
              return {
                video: {
                  ...video,
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
        let uploadedVideos = uploadResults.map((result) => {
          if (result.status === 'fulfilled') {
            return result.value.video;
          } else {
            console.error('❌ Unexpected error in upload promise:', result.reason);
            // Return a placeholder video object
            return {
              url: '',
              original_url: '',
            };
          }
        });
        
        // Count successful uploads
        const successfulUploads = uploadResults.filter(
          (result) => result.status === 'fulfilled' && result.value.uploaded === true
        ).length;
        
        const failedUploads = parsedVideos.length - successfulUploads;
        
        console.log(`📊 Upload Summary: ${successfulUploads}/${parsedVideos.length} videos uploaded to Supabase`);
        if (failedUploads > 0) {
          console.warn(`⚠️ ${failedUploads} video(s) failed to upload and are using webhook URLs`);
          uploadResults.forEach((result, index) => {
            if (result.status === 'fulfilled' && !result.value.uploaded) {
              console.warn(`  - Video ${index + 1}: ${result.value.reason || 'unknown reason'}`);
            }
          });
        }
        
        // Generate thumbnails for uploaded videos
        setProgress(82);
        setProgressMessage('Generating video thumbnails...');
        console.log('🖼️ Generating thumbnails for uploaded videos...');
        
        const videosWithThumbnails = await Promise.all(
          uploadedVideos.map(async (video) => {
            const videoUrl = video.url || video.original_url || '';
            if (!videoUrl || videoUrl.trim() === '') {
              return video; // Skip thumbnail generation for invalid videos
            }
            
            try {
              const thumbnailUrl = await ugcService.generateAndStoreVideoThumbnail(
                payload.user_id,
                videoUrl,
                campId
              );
              
              if (thumbnailUrl) {
                console.log('✅ Thumbnail generated for video:', videoUrl.substring(0, 50) + '...');
                return {
                  ...video,
                  thumbnail_url: thumbnailUrl,
                };
              } else {
                console.warn('⚠️ Thumbnail generation failed for video, continuing without thumbnail');
                return video;
              }
            } catch (error: any) {
              console.error('❌ Error generating thumbnail:', error);
              // Continue without thumbnail if generation fails
              return video;
            }
          })
        );
        
        setProgress(85);
        setProgressMessage('Finalizing campaign...');
        // Update campaign with generated assets (including videos with thumbnails)
        await campaignService.update(campId, {
          status: 'completed',
          completed_at: new Date().toISOString(),
          generated_assets: {
            webhook_payload: payload,
            videos: videosWithThumbnails, // Include thumbnail_url in video objects
            webhook_response: webhookResponse,
          },
        });

        // Trigger stats refresh event
        window.dispatchEvent(new Event('campaignUpdated'));

        // Deduct Magic Tokens for campaign generation
        try {
          const campaignCost = tokenService.calculateCampaignCost(
            contentType,
            { images: [], videos: uploadedVideos }
          );
          
          // Deduct base cost (2 tokens)
          await tokenService.deductTokens(
            payload.user_id,
            2,
            'campaign_generation',
            campId,
            `Campaign generation (${contentType})`
          );
          
          // Deduct tokens for each video (5 tokens per video)
          if (uploadedVideos.length > 0) {
            await tokenService.deductTokens(
              payload.user_id,
              uploadedVideos.length * 5,
              'video',
              campId,
              `${uploadedVideos.length} video(s) generated`
            );
          }
          
          console.log(`✨ Deducted ${campaignCost} Magic Tokens for campaign generation`);
        } catch (tokenError) {
          console.error('Error deducting Magic Tokens:', tokenError);
          // Don't block the flow - test mode allows negative tokens
        }

        setProgress(100);
        setProgressMessage('Campaign ready!');
        
        // Small delay to show 100% before navigation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Stop loading and automatically navigate to ResultsPage with videos
        setLoading(false);
        success('Campaign generated successfully!');
        
        // Automatically navigate to ResultsPage to show videos with download options
        console.log('🎯 Navigating to ResultsPage with generated videos...');
        navigate('/dashboard/results', {
          state: { 
            campaignId: campId, 
            videos: uploadedVideos, 
            webhookPayload: payload,
            skipOnboardingCheck: true // Allow access during onboarding completion
          }
        });
        return;
      }
      
      // Handle image-only or image-ugc campaigns
      console.log('✅ Webhook response received, parsing images...');
      setProgress(60);
      setProgressMessage('Parsing image content...');
      
      // Parse images from response
      const parsedImages = parseWebhookResponse(webhookResponse);
      
      console.log(`📸 Parsed ${parsedImages.length} images from webhook response`);
      
      // For image-ugc, also parse videos if available
      let parsedVideos: WebhookVideoItem[] = [];
      if (contentType === 'image-ugc') {
        parsedVideos = parseWebhookVideoResponse(webhookResponse);
        console.log(`🎬 Parsed ${parsedVideos.length} videos from webhook response`);
      }
      
      // Upload images to Supabase storage
      console.log('📤 Uploading generated images to Supabase storage...');
      setProgress(70);
      setProgressMessage(`Uploading ${parsedImages.length} image${parsedImages.length !== 1 ? 's' : ''}...`);
      const uploadResults = await Promise.allSettled(
        parsedImages.map(async (image) => {
          const originalUrl = image.url || image.image_url || image.imageUrl || image.src || '';
          if (!originalUrl) {
            console.warn('⚠️ Image has no URL, skipping upload');
            return { image, uploaded: false, reason: 'no_url' };
          }
          
          try {
            // Get user ID from payload
            const userId = payload.user_id;
            if (!userId) {
              throw new Error('User ID is missing from payload');
            }
            
            console.log(`📤 Uploading image ${parsedImages.indexOf(image) + 1}/${parsedImages.length}...`);
            
            // Upload to Supabase storage
            const supabaseUrl = await imageService.uploadGeneratedImageToStorage(
              userId,
              originalUrl,
              campId
            );
            
            // Check if upload actually succeeded (URL should be Supabase URL)
            const isSupabaseUrl = supabaseUrl.includes('supabase.co/storage');
            
            if (isSupabaseUrl) {
              console.log(`✅ Image ${parsedImages.indexOf(image) + 1} uploaded successfully to Supabase`);
              return {
                image: {
                  ...image,
                  url: supabaseUrl, // Use Supabase URL as primary
                  original_url: originalUrl, // Keep original URL as backup
                },
                uploaded: true,
              };
            } else {
              console.warn(`⚠️ Image ${parsedImages.indexOf(image) + 1} upload returned non-Supabase URL, using original`);
              return {
                image: {
                  ...image,
                  url: originalUrl,
                  original_url: originalUrl,
                },
                uploaded: false,
                reason: 'fallback_to_original',
                returnedUrl: supabaseUrl,
              };
            }
          } catch (error: any) {
            console.error(`❌ Error uploading image ${parsedImages.indexOf(image) + 1}:`, {
              error: error,
              message: error?.message,
              originalUrl: originalUrl.substring(0, 100),
            });
            // Return original image if upload fails
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
          // Return a placeholder image object
          return {
            url: '',
            original_url: '',
          };
        }
      });
      
      // Count successful uploads
      const successfulUploads = uploadResults.filter(
        (result) => result.status === 'fulfilled' && result.value.uploaded === true
      ).length;
      
      const failedUploads = parsedImages.length - successfulUploads;
      
      console.log(`📊 Upload Summary: ${successfulUploads}/${parsedImages.length} images uploaded to Supabase`);
      if (failedUploads > 0) {
        console.warn(`⚠️ ${failedUploads} image(s) failed to upload and are using webhook URLs`);
        uploadResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && !result.value.uploaded) {
            console.warn(`  - Image ${index + 1}: ${result.value.reason || 'unknown reason'}`);
          }
        });
      }
      
      // For image-ugc, upload videos as well
      let uploadedVideos: WebhookVideoItem[] = [];
      if (contentType === 'image-ugc' && parsedVideos.length > 0) {
        console.log('📤 Uploading generated videos to Supabase storage...');
        setProgress(80);
        setProgressMessage(`Uploading ${parsedVideos.length} video${parsedVideos.length !== 1 ? 's' : ''}...`);
        const videoUploadResults = await Promise.allSettled(
          parsedVideos.map(async (video) => {
            const originalUrl = video.url || video.video_url || video.videoUrl || video.src || '';
            if (!originalUrl) {
              console.warn('⚠️ Video has no URL, skipping upload');
              return { video, uploaded: false, reason: 'no_url' };
            }
            
            try {
              const userId = payload.user_id;
              if (!userId) {
                throw new Error('User ID is missing from payload');
              }
              
              console.log(`📤 Uploading video ${parsedVideos.indexOf(video) + 1}/${parsedVideos.length}...`);
              
              const supabaseUrl = await ugcService.uploadGeneratedVideoToStorage(
                userId,
                originalUrl,
                campId
              );
              
              const isSupabaseUrl = supabaseUrl.includes('supabase.co/storage');
              
              if (isSupabaseUrl) {
                console.log(`✅ Video ${parsedVideos.indexOf(video) + 1} uploaded successfully to Supabase`);
                return {
                  video: {
                    ...video,
                    url: supabaseUrl,
                    original_url: originalUrl,
                  },
                  uploaded: true,
                };
              } else {
                return {
                  video: {
                    ...video,
                    url: originalUrl,
                    original_url: originalUrl,
                  },
                  uploaded: false,
                  reason: 'fallback_to_original',
                };
              }
            } catch (error: any) {
              console.error(`❌ Error uploading video ${parsedVideos.indexOf(video) + 1}:`, error);
              return {
                video: {
                  ...video,
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
        
        uploadedVideos = videoUploadResults.map((result) => {
          if (result.status === 'fulfilled') {
            return result.value.video;
          } else {
            return { url: '', original_url: '' };
          }
        });
        
        // Generate thumbnails for uploaded videos (image-ugc case)
        if (uploadedVideos.length > 0) {
          setProgress(82);
          setProgressMessage('Generating video thumbnails...');
          console.log('🖼️ Generating thumbnails for uploaded videos (image-ugc)...');
          
          uploadedVideos = await Promise.all(
            uploadedVideos.map(async (video) => {
              const videoUrl = video.url || video.original_url || '';
              if (!videoUrl || videoUrl.trim() === '') {
                return video; // Skip thumbnail generation for invalid videos
              }
              
              try {
                const thumbnailUrl = await ugcService.generateAndStoreVideoThumbnail(
                  payload.user_id,
                  videoUrl,
                  campId
                );
                
                if (thumbnailUrl) {
                  console.log('✅ Thumbnail generated for video:', videoUrl.substring(0, 50) + '...');
                  return {
                    ...video,
                    thumbnail_url: thumbnailUrl,
                  };
                } else {
                  console.warn('⚠️ Thumbnail generation failed for video, continuing without thumbnail');
                  return video;
                }
              } catch (error: any) {
                console.error('❌ Error generating thumbnail:', error);
                // Continue without thumbnail if generation fails
                return video;
              }
            })
          );
        }
      }
      
      setProgress(85);
      setProgressMessage('Finalizing campaign...');
      // Update campaign with generated assets (including both URLs and thumbnails)
      await campaignService.update(campId, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        generated_assets: {
          webhook_payload: payload,
          images: uploadedImages,
          videos: contentType === 'image-ugc' ? uploadedVideos : undefined,
          webhook_response: webhookResponse,
        },
      });

      // Trigger stats refresh event
      window.dispatchEvent(new Event('campaignUpdated'));

      // Deduct Magic Tokens for campaign generation
      try {
        const campaignCost = tokenService.calculateCampaignCost(
          contentType,
          { images: uploadedImages, videos: uploadedVideos }
        );
        
        // Deduct base cost (2 tokens)
        await tokenService.deductTokens(
          payload.user_id,
          2,
          'campaign_generation',
          campId,
          `Campaign generation (${contentType})`
        );
        
        // Deduct tokens for each image (1 token per image)
        if (uploadedImages.length > 0) {
          await tokenService.deductTokens(
            payload.user_id,
            uploadedImages.length,
            'image',
            campId,
            `${uploadedImages.length} image(s) generated`
          );
        }
        
        // Deduct tokens for each video (5 tokens per video)
        if (uploadedVideos.length > 0) {
          await tokenService.deductTokens(
            payload.user_id,
            uploadedVideos.length * 5,
            'video',
            campId,
            `${uploadedVideos.length} video(s) generated`
          );
        }
        
        console.log(`✨ Deducted ${campaignCost} Magic Tokens for campaign generation`);
      } catch (tokenError) {
        console.error('Error deducting Magic Tokens:', tokenError);
        // Don't block the flow - test mode allows negative tokens
      }

      setProgress(100);
      setProgressMessage('Campaign ready!');
      
      // Small delay to show 100% before navigation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Stop loading and automatically navigate to ResultsPage with images
      setLoading(false);
      success('Campaign generated successfully!');
      
      // Automatically navigate to ResultsPage to show images with download options
      console.log('🎯 Navigating to ResultsPage with generated assets...');
      navigate('/dashboard/results', {
        state: { 
          campaignId: campId, 
          images: uploadedImages,
          videos: contentType === 'image-ugc' ? uploadedVideos : undefined,
          webhookPayload: payload,
          skipOnboardingCheck: true // Allow access during onboarding completion
        }
      });
    } catch (err: any) {
      console.error('❌ Webhook error in AdGenieWorkingPage:', {
        error: err,
        message: err.message,
        name: err.name,
        stack: err.stack,
        campaignId: campId,
        contentType: payload.content_type
      });
      
      setProgress(0);
      setProgressMessage('Error occurred');
      
      // Provide user-friendly error message
      let errorMessage = 'Failed to generate campaign';
      if (err.message) {
        if (err.message.includes('Network error')) {
          errorMessage = 'Network error: Unable to connect to the generation service. Please check your internet connection and try again.';
        } else if (err.message.includes('CORS error')) {
          errorMessage = 'Connection error: The generation service may be temporarily unavailable. Please try again later.';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Request timeout: The generation is taking longer than expected. Please try again.';
        } else if (err.message.includes('Webhook failed')) {
          errorMessage = `Server error: ${err.message}`;
        } else {
          errorMessage = err.message;
        }
      }
      
      showError(errorMessage);
      
      // Update campaign status to failed
      try {
        await campaignService.update(campId, {
          status: 'failed',
        });
        // Trigger stats refresh event (failed campaigns should also update stats)
        window.dispatchEvent(new Event('campaignUpdated'));
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
    <div className="min-h-screen bg-gradient-to-br from-genie-primary via-genie-secondary to-genie-accent flex items-center justify-center p-4 pt-24">
      <PageHeader />
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
              className="inline-flex w-20 h-20 bg-gradient-to-br from-genie-primary via-genie-secondary to-genie-accent rounded-full items-center justify-center mb-8"
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
            
            <p className="text-slate-600 text-lg mb-6">{progressMessage}</p>
            
            {/* Progress Bar */}
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-[#2D3142]">Progress</span>
                <span className="text-sm font-bold text-orange-500">{progress}%</span>
              </div>
              <div className="w-full bg-[#E5E7EB] rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 rounded-full shadow-sm"
                />
              </div>
            </div>
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
                      className="px-6 py-3 bg-genie-primary text-white font-bold rounded-lg shadow-lg flex items-center gap-2 hover:bg-genie-primary-hover"
                    >
                      <Download size={20} />
                      Download All
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleRegenerate}
                      className="px-6 py-3 bg-genie-secondary text-white font-bold rounded-lg shadow-lg flex items-center gap-2 hover:bg-genie-secondary-hover"
                    >
                      <RefreshCw size={20} />
                      Regenerate
                    </motion.button>
                  </div>
                </div>
                
                <div className={`grid gap-6 mb-8 ${
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
                    className="px-8 py-4 bg-genie-primary text-white font-bold rounded-lg shadow-lg hover:bg-genie-primary-hover transition-all"
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
                    className="px-6 py-3 bg-genie-primary text-white font-semibold rounded-lg hover:bg-genie-primary-hover transition-all"
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

