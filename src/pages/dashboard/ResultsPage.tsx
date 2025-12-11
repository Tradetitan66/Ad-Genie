import { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Download, Share2, Home, RefreshCw, CheckCircle, Loader2, Trash2, Video, Play, XCircle, AlertTriangle, AlertCircle, Clock } from 'lucide-react';
import { campaignService, userService } from '../../services/database';
import { sendBrandDataToWebhook, parseWebhookResponse, parseWebhookVideoResponse, BrandWebhookData, WebhookImageItem, WebhookVideoItem } from '../../services/webhookService';
import { downloadImage, downloadMultipleImages, ImageData } from '../../utils/imageDownload';
import { useToast } from '../../contexts/ToastContext';
import { imageService } from '../../services/imageService';
import { tokenService } from '../../services/tokenService';
import PageHeader from '../../components/PageHeader';

export default function ResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerationProgress, setRegenerationProgress] = useState(0);
  const [regenerationStep, setRegenerationStep] = useState<string>('');
  const [images, setImages] = useState<WebhookImageItem[]>([]);
  const [videos, setVideos] = useState<WebhookVideoItem[]>([]);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [webhookPayload, setWebhookPayload] = useState<BrandWebhookData | null>(null);
  const [campaignType, setCampaignType] = useState<string>('');
  const [campaignStatus, setCampaignStatus] = useState<string | null>(null);
  const [campaignCompletedAt, setCampaignCompletedAt] = useState<string | null>(null);
  const [webhookError, setWebhookError] = useState<string | null>(null);
  const [generationErrors, setGenerationErrors] = useState<string[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [videoThumbnails, setVideoThumbnails] = useState<Record<string, string>>({});
  const [previewVideo, setPreviewVideo] = useState<WebhookVideoItem | null>(null);
  const loadingRef = useRef(false);
  const dataLoadedRef = useRef(false);

  const regenerationSteps = [
    'Initializing regeneration...',
    'Connecting to generation service...',
    'Generating content...',
    'Uploading assets...',
    'Finalizing campaign...'
  ];

  useEffect(() => {
    const currentUserEmail = localStorage.getItem('currentUser');
    if (!currentUserEmail) {
      navigate('/login');
      return;
    }

    // Load data on mount or when location.state changes
    const state = location.state as {
      campaignId?: string;
      images?: WebhookImageItem[];
      videos?: WebhookVideoItem[];
      webhookPayload?: BrandWebhookData;
    } | null;
    
    // Reset data loaded flag if we have new state
    if (state?.campaignId) {
      dataLoadedRef.current = false;
    }
    
    if (!dataLoadedRef.current) {
      loadCampaignData();
    }
  }, [navigate, location.state]);

  const loadCampaignData = useCallback(async (explicitCampaignId?: string) => {
    // Prevent concurrent loads
    if (loadingRef.current) {
      console.log('⚠️ Load already in progress, skipping...');
      return;
    }
    loadingRef.current = true;
    dataLoadedRef.current = true;
    try {
      setLoading(true);
      const state = location.state as {
        campaignId?: string;
        images?: WebhookImageItem[];
        videos?: WebhookVideoItem[];
        webhookPayload?: BrandWebhookData;
      } | null;

      // Use explicit campaign ID if provided (e.g., after regeneration), otherwise use state
      const campaignIdToLoad = explicitCampaignId || state?.campaignId;

      // If we have a campaign ID to load, use it
      if (campaignIdToLoad) {
        setCampaignId(campaignIdToLoad);
        
        // Only use state data if we're not explicitly loading a new campaign
        if (!explicitCampaignId && state) {
          if (state.images) {
            setImages(state.images);
          }
          if (state.videos) {
            setVideos(state.videos);
          }
          if (state.webhookPayload) {
            setWebhookPayload(state.webhookPayload);
          }
        }

        // Load campaign to get content type and assets
        const campaign = await campaignService.getById(campaignIdToLoad);
        if (campaign) {
          setCampaignType(campaign.content_type);
          setCampaignStatus(campaign.status);
          setCampaignCompletedAt(campaign.completed_at);
          
          // Extract error information from webhook response
          if (campaign.generated_assets?.webhook_response) {
            const webhookResp = campaign.generated_assets.webhook_response;
            if (webhookResp.error) {
              setWebhookError(webhookResp.error);
            }
            if (webhookResp.errors && Array.isArray(webhookResp.errors)) {
              setGenerationErrors(webhookResp.errors);
            } else if (webhookResp.errors && typeof webhookResp.errors === 'string') {
              setGenerationErrors([webhookResp.errors]);
            }
          }
          
          // When explicitCampaignId is provided (e.g., after regeneration), always load from database
          // Otherwise, prefer database but fall back to state if available
          const shouldLoadFromDB = explicitCampaignId || !state;
          
          // For UGC-only campaigns, prioritize videos and clear images
          if (campaign.content_type === 'ugc-only') {
            setImages([]); // Clear images for UGC-only campaigns
            
            // Always load videos from database if explicit ID provided, otherwise prefer DB over state
            if (campaign.generated_assets?.videos && Array.isArray(campaign.generated_assets.videos) && campaign.generated_assets.videos.length > 0) {
              setVideos(campaign.generated_assets.videos);
            } else if (!shouldLoadFromDB && state?.videos && state.videos.length > 0) {
              setVideos(state.videos);
            }
            
            // Load webhook payload from database if explicit ID, otherwise prefer DB
            if (shouldLoadFromDB && campaign.generated_assets?.webhook_payload) {
              setWebhookPayload(campaign.generated_assets.webhook_payload);
            } else if (!state?.webhookPayload && campaign.generated_assets?.webhook_payload) {
              setWebhookPayload(campaign.generated_assets.webhook_payload);
            }
          } else {
            // For other campaign types, load both images and videos
            if (campaign.generated_assets) {
              const assets = campaign.generated_assets;
              
              // Always load from database if explicit ID provided
              if (shouldLoadFromDB) {
                if (assets.images && Array.isArray(assets.images)) {
                  setImages(assets.images);
                }
                if (assets.videos && Array.isArray(assets.videos)) {
                  setVideos(assets.videos);
                }
                if (assets.webhook_payload) {
                  setWebhookPayload(assets.webhook_payload);
                }
              } else {
                // Prefer database but fall back to state
                if (assets.images && Array.isArray(assets.images)) {
                  setImages(assets.images);
                } else if (state?.images && state.images.length > 0) {
                  setImages(state.images);
                }
                
                if (assets.videos && Array.isArray(assets.videos)) {
                  setVideos(assets.videos);
                } else if (state?.videos && state.videos.length > 0) {
                  setVideos(state.videos);
                }
                
                if (assets.webhook_payload) {
                  setWebhookPayload(assets.webhook_payload);
                } else if (state?.webhookPayload) {
                  setWebhookPayload(state.webhookPayload);
                }
              }
            }
          }
          
          // Debug logging
          console.log('🎬 Campaign Data Loaded:', {
            campaignId: campaign.id,
            contentType: campaign.content_type,
            status: campaign.status,
            videosCount: campaign.generated_assets?.videos?.length || 0,
            imagesCount: campaign.generated_assets?.images?.length || 0,
            hasError: !!webhookError || generationErrors.length > 0,
            explicitId: !!explicitCampaignId
          });
        }
      } else if (!explicitCampaignId) {
        // Only try to load latest campaign if no explicit ID was provided
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
              setCampaignStatus(latestCampaign.status);
              setCampaignCompletedAt(latestCampaign.completed_at);
              
              // Extract error information
              if (latestCampaign.generated_assets?.webhook_response) {
                const webhookResp = latestCampaign.generated_assets.webhook_response;
                if (webhookResp.error) {
                  setWebhookError(webhookResp.error);
                }
                if (webhookResp.errors && Array.isArray(webhookResp.errors)) {
                  setGenerationErrors(webhookResp.errors);
                } else if (webhookResp.errors && typeof webhookResp.errors === 'string') {
                  setGenerationErrors([webhookResp.errors]);
                }
              }
              
              // For UGC-only campaigns, prioritize videos
              if (latestCampaign.content_type === 'ugc-only') {
                setImages([]); // Clear images for UGC-only
                if (latestCampaign.generated_assets?.videos && Array.isArray(latestCampaign.generated_assets.videos)) {
                  setVideos(latestCampaign.generated_assets.videos);
                }
                if (latestCampaign.generated_assets?.webhook_payload) {
                  setWebhookPayload(latestCampaign.generated_assets.webhook_payload);
                }
              } else {
                // For other campaign types, load both
                if (latestCampaign.generated_assets) {
                  const assets = latestCampaign.generated_assets;
                  if (assets.images && Array.isArray(assets.images)) {
                    setImages(assets.images);
                  }
                  if (assets.videos && Array.isArray(assets.videos)) {
                    setVideos(assets.videos);
                  }
                  if (assets.webhook_payload) {
                    setWebhookPayload(assets.webhook_payload);
                  }
                }
              }
            }
          }
        }
      } else if (explicitCampaignId) {
        // If explicit ID provided but campaign not found in state path, load it directly
        const campaign = await campaignService.getById(explicitCampaignId);
        if (campaign) {
          setCampaignId(campaign.id);
          setCampaignType(campaign.content_type);
          setCampaignStatus(campaign.status);
          setCampaignCompletedAt(campaign.completed_at);
          
          // Extract error information
          if (campaign.generated_assets?.webhook_response) {
            const webhookResp = campaign.generated_assets.webhook_response;
            if (webhookResp.error) {
              setWebhookError(webhookResp.error);
            }
            if (webhookResp.errors && Array.isArray(webhookResp.errors)) {
              setGenerationErrors(webhookResp.errors);
            } else if (webhookResp.errors && typeof webhookResp.errors === 'string') {
              setGenerationErrors([webhookResp.errors]);
            }
          }
          
          // Load assets based on content type
          if (campaign.content_type === 'ugc-only') {
            setImages([]);
            if (campaign.generated_assets?.videos && Array.isArray(campaign.generated_assets.videos)) {
              setVideos(campaign.generated_assets.videos);
            }
            if (campaign.generated_assets?.webhook_payload) {
              setWebhookPayload(campaign.generated_assets.webhook_payload);
            }
          } else {
            if (campaign.generated_assets) {
              const assets = campaign.generated_assets;
              if (assets.images && Array.isArray(assets.images)) {
                setImages(assets.images);
              }
              if (assets.videos && Array.isArray(assets.videos)) {
                setVideos(assets.videos);
              }
              if (assets.webhook_payload) {
                setWebhookPayload(assets.webhook_payload);
              }
            }
          }
          
          console.log('🎬 Campaign Data Loaded (Explicit ID):', {
            campaignId: campaign.id,
            contentType: campaign.content_type,
            status: campaign.status,
            videosCount: campaign.generated_assets?.videos?.length || 0,
            imagesCount: campaign.generated_assets?.images?.length || 0
          });
        }
      }
    } catch (err) {
      console.error('Error loading campaign data:', err);
      showError('Failed to load campaign data');
      setCampaignStatus('failed');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [navigate, location.state, showError]);

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

  const generateVideoThumbnail = useCallback((videoUrl: string, videoId: string) => {
    // Skip if thumbnail already exists
    if (videoThumbnails[videoId]) {
      return;
    }

    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.src = videoUrl;
    video.muted = true;
    video.playsInline = true;
    
    const handleLoadedData = () => {
      video.currentTime = 1; // Seek to 1 second for thumbnail
    };
    
    const handleSeeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
          setVideoThumbnails(prev => ({ ...prev, [videoId]: thumbnail }));
        }
      } catch (error) {
        console.warn('Failed to generate thumbnail:', error);
      }
      // Cleanup
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('error', handleError);
    };
    
    const handleError = () => {
      console.warn('Video thumbnail generation failed for:', videoId);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('error', handleError);
    };
    
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('error', handleError);
    
    video.load();
  }, [videoThumbnails]);

  const handleDownloadVideo = async (video: WebhookVideoItem) => {
    try {
      const videoUrl = video.url || video.video_url || video.videoUrl || video.src || '';
      if (!videoUrl) {
        showError('Video URL not found');
        return;
      }
      // Create a temporary anchor element to download the video
      const link = document.createElement('a');
      link.href = videoUrl;
      link.download = video.title || `video-${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      console.error('Error downloading video:', err);
      showError(`Failed to download video: ${err.message}`);
    }
  };

  const handleDownloadAll = async () => {
    try {
      if (campaignType === 'ugc-only') {
        // Download all videos
        if (videos.length === 0) {
          showError('No videos available to download');
          return;
        }
        // Download videos one by one
        for (const video of videos) {
          await handleDownloadVideo(video);
          // Small delay between downloads
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        success('All videos downloaded successfully');
      } else {
        // Download all images (or images + videos for image-ugc)
        const imageData: ImageData[] = images.map((img, index) => ({
          url: img.url || img.image_url || img.imageUrl || img.src || '',
          title: img.title || `Image ${index + 1}`,
          id: img.id || `img-${index}`,
        })).filter(img => img.url);

        if (imageData.length === 0 && videos.length === 0) {
          showError('No assets available to download');
          return;
        }

        if (imageData.length > 0) {
          await downloadMultipleImages(imageData);
        }
        
        // Download videos if any
        if (videos.length > 0) {
          for (const video of videos) {
            await handleDownloadVideo(video);
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        success('All assets downloaded successfully');
      }
    } catch (err: any) {
      console.error('Error downloading assets:', err);
      showError(`Failed to download assets: ${err.message}`);
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

  const handleDeleteCampaign = async () => {
    if (!campaignId) {
      showError('Campaign ID not found');
      return;
    }

    try {
      await campaignService.delete(campaignId);
      success('Campaign deleted successfully');
      setDeleteConfirm(false);
      
      // Trigger stats refresh event
      window.dispatchEvent(new Event('campaignUpdated'));
      
      // Navigate back to campaign hub
      navigate('/dashboard/campaign-hub');
    } catch (err: any) {
      console.error('Error deleting campaign:', err);
      showError(`Failed to delete campaign: ${err.message}`);
    }
  };

  const regenerateWithPayload = async (_campId: string, payload: BrandWebhookData) => {
    try {
      setRegenerating(true);
      setRegenerationProgress(0);
      setRegenerationStep('Initializing generation...');
      
      // Step 1: Create new campaign
      setRegenerationProgress(10);
      setRegenerationStep('Initializing generation...');
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

      // Step 2: Call webhook
      setRegenerationProgress(20);
      setRegenerationStep('Connecting to generation service...');
      const webhookResponse = await sendBrandDataToWebhook(payload);
      
      const contentType = payload.content_type || 'image-only';
      
      // Step 3: Parse response based on content type
      setRegenerationProgress(40);
      setRegenerationStep('Parsing response...');
      
      // Handle UGC-only campaigns (videos)
      if (contentType === 'ugc-only') {
        const parsedVideos = parseWebhookVideoResponse(webhookResponse);
        
        // Step 4: Upload regenerated videos to Supabase storage
        setRegenerationProgress(50);
        setRegenerationStep('Uploading assets...');
        console.log('📤 Uploading regenerated videos to Supabase storage...');
        
        const { ugcService } = await import('../../services/ugcService');
        const uploadResults = await Promise.allSettled(
          parsedVideos.map(async (video, index) => {
            const originalUrl = video.url || video.video_url || video.videoUrl || video.src || '';
            if (!originalUrl) {
              console.warn('⚠️ Regenerated video has no URL, skipping upload');
              return { video, uploaded: false, reason: 'no_url' };
            }
            
            try {
              const userId = payload.user_id;
              if (!userId) {
                throw new Error('User ID is missing from payload');
              }
              
              console.log(`📤 Uploading regenerated video ${index + 1}/${parsedVideos.length}...`);
              
              // Update progress for each video upload
              const uploadProgress = 50 + ((index + 1) / parsedVideos.length) * 30;
              setRegenerationProgress(Math.min(uploadProgress, 80));
              
              // Upload to Supabase storage
              const supabaseUrl = await ugcService.uploadGeneratedVideoToStorage(
                userId,
                originalUrl,
                newCampaign.id
              );
              
              const isSupabaseUrl = supabaseUrl.includes('supabase.co/storage');
              
              if (isSupabaseUrl) {
                console.log(`✅ Regenerated video ${index + 1} uploaded successfully to Supabase`);
                return {
                  video: {
                    ...video,
                    url: supabaseUrl,
                    original_url: originalUrl,
                  },
                  uploaded: true,
                };
              } else {
                console.warn(`⚠️ Regenerated video ${index + 1} upload returned non-Supabase URL`);
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
              console.error(`❌ Error uploading regenerated video ${index + 1}:`, {
                error: error,
                message: error?.message,
                originalUrl: originalUrl.substring(0, 100),
              });
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
        
        // Process video results
        const uploadedVideos = uploadResults.map((result) => {
          if (result.status === 'fulfilled') {
            return result.value.video;
          } else {
            console.error('❌ Unexpected error in upload promise:', result.reason);
            return { url: '', original_url: '' };
          }
        });
        
        // Count successful uploads
        const successfulUploads = uploadResults.filter(
          (result) => result.status === 'fulfilled' && result.value.uploaded === true
        ).length;
        
        const failedUploads = parsedVideos.length - successfulUploads;
        
        console.log(`📊 Regeneration Upload Summary: ${successfulUploads}/${parsedVideos.length} videos uploaded to Supabase`);
        if (failedUploads > 0) {
          console.warn(`⚠️ ${failedUploads} regenerated video(s) failed to upload and are using webhook URLs`);
        }
        
        // Step 5: Finalize campaign
        setRegenerationProgress(85);
        setRegenerationStep('Finalizing campaign...');
        
        // Update campaign with generated assets
        await campaignService.update(newCampaign.id, {
          status: 'completed',
          completed_at: new Date().toISOString(),
          generated_assets: {
            webhook_payload: payload,
            videos: uploadedVideos,
            webhook_response: webhookResponse,
          },
        });
        
        // Trigger stats refresh event
        window.dispatchEvent(new Event('campaignUpdated'));
        
        // Deduct Magic Tokens for campaign regeneration
        try {
          await tokenService.deductTokens(
            payload.user_id,
            2,
            'campaign_generation',
            newCampaign.id,
            `Campaign regeneration (${contentType})`
          );
          
          // Deduct tokens for each video (5 tokens per video)
          if (uploadedVideos.length > 0) {
            await tokenService.deductTokens(
              payload.user_id,
              uploadedVideos.length * 5,
              'video',
              newCampaign.id,
              `${uploadedVideos.length} video(s) regenerated`
            );
          }
        } catch (tokenError) {
          console.error('Error deducting Magic Tokens:', tokenError);
        }
        
        // CRITICAL FIX: Update campaign ID FIRST, then update state, then reload
        setCampaignId(newCampaign.id);
        setCampaignType(contentType);
        
        // Update state with new videos immediately
        setVideos(uploadedVideos);
        setImages([]); // Clear images for UGC-only
        setCampaignStatus('completed');
        setCampaignCompletedAt(new Date().toISOString());
        setWebhookError(null);
        setGenerationErrors([]);
        
        // Complete progress
        setRegenerationProgress(100);
        setRegenerationStep('Complete!');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Reload campaign data with explicit new campaign ID
        await loadCampaignData(newCampaign.id);
        
        // Hide progress overlay
        setRegenerating(false);
        setRegenerationProgress(0);
        setRegenerationStep('');
        
        // Scroll to top to show new assets
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        success('Campaign regenerated successfully!');
        return; // Exit early for UGC-only campaigns
      }
      
      // Handle image campaigns (image-only or image-ugc)
      const parsedImages = parseWebhookResponse(webhookResponse);

      // Step 4: Upload regenerated images to Supabase storage
      setRegenerationProgress(50);
      setRegenerationStep('Uploading assets...');
      console.log('📤 Uploading regenerated images to Supabase storage...');
      const uploadResults = await Promise.allSettled(
        parsedImages.map(async (image, index) => {
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
            
            console.log(`📤 Uploading regenerated image ${index + 1}/${parsedImages.length}...`);
            
            // Update progress for each image upload
            const uploadProgress = 50 + ((index + 1) / parsedImages.length) * 30;
            setRegenerationProgress(Math.min(uploadProgress, 80));
            
            // Upload to Supabase storage
            const supabaseUrl = await imageService.uploadGeneratedImageToStorage(
              userId,
              originalUrl,
              newCampaign.id
            );
            
            // Check if upload actually succeeded (URL should be Supabase URL)
            const isSupabaseUrl = supabaseUrl.includes('supabase.co/storage');
            
            if (isSupabaseUrl) {
              console.log(`✅ Regenerated image ${index + 1} uploaded successfully to Supabase`);
              return {
                image: {
                  ...image,
                  url: supabaseUrl,
                  original_url: originalUrl,
                },
                uploaded: true,
              };
            } else {
              console.warn(`⚠️ Regenerated image ${index + 1} upload returned non-Supabase URL`);
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
            console.error(`❌ Error uploading regenerated image ${index + 1}:`, {
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

      // Step 5: Finalize campaign
      setRegenerationProgress(85);
      setRegenerationStep('Finalizing campaign...');
      
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

      // Trigger stats refresh event
      window.dispatchEvent(new Event('campaignUpdated'));

      // Deduct Magic Tokens for campaign regeneration
      try {
        const campaignCost = tokenService.calculateCampaignCost(
          contentType,
          { images: uploadedImages, videos: [] }
        );
        
        // Deduct base cost (2 tokens)
        await tokenService.deductTokens(
          payload.user_id,
          2,
          'campaign_generation',
          newCampaign.id,
          `Campaign regeneration (${contentType})`
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

      // CRITICAL FIX: Update campaign ID FIRST, then update state, then reload
      // This ensures loadCampaignData uses the correct new campaign ID
      setCampaignId(newCampaign.id);
      setCampaignType(contentType);
      
      // Update state with new images immediately
      setImages(uploadedImages);
      setVideos([]); // Clear videos for image-only campaigns
      setCampaignStatus('completed');
      setCampaignCompletedAt(new Date().toISOString());
      setWebhookError(null);
      setGenerationErrors([]);
      
      // Complete progress
      setRegenerationProgress(100);
      setRegenerationStep('Complete!');
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay to show 100%
      
      // Reload campaign data with explicit new campaign ID to ensure we get fresh data
      await loadCampaignData(newCampaign.id);
      
      // Hide progress overlay
      setRegenerating(false);
      setRegenerationProgress(0);
      setRegenerationStep('');
      
      // Scroll to top to show new assets
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      success('Campaign regenerated successfully!');
    } catch (err: any) {
      console.error('Error regenerating campaign:', err);
      showError(`Failed to regenerate: ${err.message}`);
      setCampaignStatus('failed');
      setWebhookError(err.message);
    } finally {
      setRegenerating(false);
      setRegenerationProgress(0);
      setRegenerationStep('');
    }
  };

  // Helper function to determine if campaign is actually successful
  const hasAssets = campaignType === 'ugc-only' ? videos.length > 0 : images.length > 0;
  const isActuallySuccessful = campaignStatus === 'completed' && hasAssets;
  const isFailed = campaignStatus === 'failed';
  const isGenerating = campaignStatus === 'generating';
  const isEmpty = campaignStatus === 'completed' && !hasAssets;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="w-full max-w-md px-4">
          {/* Loading Skeleton */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              <div className="space-y-3 mt-6">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>
            <div className="mt-6 text-center">
              <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin mx-auto mb-2" />
              <p className="text-[#6B7280] text-sm">Loading campaign results...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-20 pb-20 px-4 md:px-8">
      <PageHeader />
      <div className="max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          {/* Status Banner - Only show success if actually successful */}
          {isActuallySuccessful && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#10B981] bg-opacity-20 border border-[#10B981] rounded-full mb-4"
            >
              <CheckCircle className="text-[#10B981]" size={20} />
              <span className="text-[#10B981] font-semibold text-sm">Campaign Generated Successfully!</span>
            </motion.div>
          )}
          
          {isFailed && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 border border-red-400 rounded-full mb-4"
            >
              <XCircle className="text-red-600" size={20} />
              <span className="text-red-900 font-semibold text-sm">Campaign Generation Failed</span>
            </motion.div>
          )}
          
          {isGenerating && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 border border-blue-400 rounded-full mb-4"
            >
              <Loader2 className="text-blue-600 animate-spin" size={20} />
              <span className="text-blue-900 font-semibold text-sm">Campaign is Still Generating...</span>
            </motion.div>
          )}
          
          {isEmpty && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 border border-yellow-400 rounded-full mb-4"
            >
              <AlertTriangle className="text-yellow-600" size={20} />
              <span className="text-yellow-900 font-semibold text-sm">No Assets Generated</span>
            </motion.div>
          )}
          
          {/* Dynamic Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-[#2D3142] mb-2">
            {isActuallySuccessful
              ? 'Your Campaign is Ready'
              : isFailed
              ? 'Generation Unsuccessful'
              : isGenerating
              ? 'Generating Campaign'
              : isEmpty
              ? 'No Assets Created'
              : 'Campaign Results'}
          </h1>
          
          {/* Dynamic Subtitle */}
          <p className="text-lg text-[#6B7280]">
            {isActuallySuccessful
              ? 'Download your assets and launch your campaign'
              : isFailed
              ? 'We encountered an issue generating your campaign. Click retry to try again.'
              : isGenerating
              ? 'Your campaign is being created. This may take a few minutes...'
              : isEmpty
              ? 'Generation completed but no assets were created. Try regenerating with different settings.'
              : 'View and manage your campaign assets'}
          </p>
          
          {/* Timestamp Display */}
          {campaignCompletedAt && isActuallySuccessful && (
            <p className="text-sm text-[#6B7280] mt-2 flex items-center justify-center gap-1">
              <Clock size={14} />
              Completed: {new Date(campaignCompletedAt).toLocaleString()}
            </p>
          )}
          
          {/* Error Details */}
          {(webhookError || generationErrors.length > 0) && (
            <div className="mt-4 max-w-2xl mx-auto">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-900 mb-2">Error Details</h3>
                    {webhookError && (
                      <p className="text-sm text-red-800 mb-2">{webhookError}</p>
                    )}
                    {generationErrors.length > 0 && (
                      <ul className="text-sm text-red-800 space-y-1">
                        {generationErrors.map((error, index) => (
                          <li key={index} className="flex gap-2">
                            <span>•</span>
                            <span>{error}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {videos.length > 0 && campaignType === 'ugc-only' && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl font-bold text-[#2D3142]">Generated Videos ({videos.length})</h2>
              <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                  onClick={handleDownloadAll}
                className="px-6 py-3 bg-genie-primary text-white font-bold rounded-lg shadow-lg flex items-center gap-2 hover:bg-genie-primary-hover"
              >
                <Download size={20} />
                  {campaignType === 'ugc-only' ? 'Download All Videos' : 'Download All Assets'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRegenerate}
                  disabled={regenerating || isGenerating}
                  className="px-6 py-3 bg-genie-secondary text-white font-bold rounded-lg shadow-lg flex items-center gap-2 hover:bg-genie-secondary-hover disabled:opacity-50 disabled:cursor-not-allowed"
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
              {deleteConfirm ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDeleteCampaign}
                    className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg shadow-lg flex items-center gap-2 hover:bg-red-700"
                  >
                    <Trash2 size={20} />
                    Confirm Delete
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setDeleteConfirm(false)}
                    className="px-6 py-3 bg-[#E5E7EB] text-[#2D3142] font-bold rounded-lg shadow-lg hover:bg-[#D1D5DB]"
                  >
                    Cancel
                  </motion.button>
                </>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDeleteConfirm(true)}
                  className="px-6 py-3 bg-red-50 text-red-600 font-bold rounded-lg shadow-lg flex items-center gap-2 hover:bg-red-100 border-2 border-red-200"
                >
                  <Trash2 size={20} />
                  Delete Campaign
                </motion.button>
              )}
              </div>
            </div>
            <div className={`grid gap-4 ${
              videos.length === 1 
                ? 'grid-cols-1 max-w-md mx-auto' 
                : videos.length === 2 
                ? 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto'
                : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
            }`}>
              {videos.map((video, index) => {
                const videoUrl = video.url || video.video_url || video.videoUrl || video.src || '';
                const videoTitle = campaignType === 'ugc-only' ? `UGC Video ${index + 1}` : (video.title || `Video ${index + 1}`);
                const videoId = video.id || `video-${index}`;

                if (!videoUrl) return null;

                return (
                <motion.div
                    key={videoId}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className={`group relative bg-white overflow-hidden shadow-lg hover:shadow-2xl transition-all ${
                    videos.length === 2 ? 'rounded-2xl' : 'rounded-lg'
                  }`}
                >
                  <div className={`aspect-video bg-[#FAFAFA] relative ${
                    videos.length === 2 ? 'rounded-t-2xl' : 'rounded-t-lg'
                  }`}>
                    <video
                        src={videoUrl}
                        className="w-full h-full object-cover"
                        controls
                        preload="metadata"
                        playsInline
                        poster={videoThumbnails[videoId] || undefined}
                        onLoadedMetadata={(e) => {
                          const videoEl = e.currentTarget;
                          // Generate thumbnail if not already generated
                          if (!videoThumbnails[videoId] && videoEl.readyState >= 2) {
                            generateVideoThumbnail(videoUrl, videoId);
                          }
                        }}
                        onError={() => {
                          console.error('Video failed to load:', {
                            videoUrl,
                            videoId,
                            campaignId,
                            campaignType
                          });
                        }}
                    />
                    {/* Play button overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                      <div className="flex gap-3 pointer-events-auto">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setPreviewVideo(video)}
                          className="p-4 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
                          title="Preview video"
                        >
                          <Play size={24} className="text-purple-600 ml-1" fill="currentColor" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDownloadVideo(video)}
                          className="p-3 bg-white rounded-full shadow-lg hover:bg-[#FAFAFA] transition-colors"
                          title="Download video"
                        >
                          <Download size={20} className="text-[#2D3142]" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            if (navigator.share) {
                              navigator.share({
                                title: videoTitle,
                                url: videoUrl,
                              }).catch(() => {
                                navigator.clipboard.writeText(videoUrl);
                              });
                            } else {
                              navigator.clipboard.writeText(videoUrl);
                            }
                          }}
                          className="p-3 bg-white rounded-full shadow-lg hover:bg-[#FAFAFA] transition-colors"
                          title="Share video"
                        >
                          <Share2 size={20} className="text-[#2D3142]" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                  <div className={`${videos.length === 2 ? 'p-5' : 'p-4'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Video size={16} className="text-purple-600" />
                        <p className={`font-semibold text-[#2D3142] ${videos.length === 2 ? 'text-lg' : 'text-base'}`}>{videoTitle}</p>
                      </div>
                      {videos.length === 2 && (
                        <span className="px-3 py-1 bg-orange-50 text-orange-700 text-xs font-semibold rounded-full border border-orange-200">
                          Video {index + 1}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {images.length > 0 && campaignType !== 'ugc-only' && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl font-bold text-[#2D3142]">Generated Images ({images.length})</h2>
              <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                  onClick={handleDownloadAll}
                className="px-6 py-3 bg-genie-primary text-white font-bold rounded-lg shadow-lg flex items-center gap-2 hover:bg-genie-primary-hover"
              >
                <Download size={20} />
                  {campaignType === 'image-only' ? 'Download All Images' : 'Download All Assets'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRegenerate}
                  disabled={regenerating || isGenerating}
                  className="px-6 py-3 bg-genie-secondary text-white font-bold rounded-lg shadow-lg flex items-center gap-2 hover:bg-genie-secondary-hover disabled:opacity-50 disabled:cursor-not-allowed"
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
              {deleteConfirm ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDeleteCampaign}
                    className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg shadow-lg flex items-center gap-2 hover:bg-red-700"
                  >
                    <Trash2 size={20} />
                    Confirm Delete
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setDeleteConfirm(false)}
                    className="px-6 py-3 bg-[#E5E7EB] text-[#2D3142] font-bold rounded-lg shadow-lg hover:bg-[#D1D5DB]"
                  >
                    Cancel
                  </motion.button>
                </>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDeleteConfirm(true)}
                  className="px-6 py-3 bg-red-50 text-red-600 font-bold rounded-lg shadow-lg flex items-center gap-2 hover:bg-red-100 border-2 border-red-200"
                >
                  <Trash2 size={20} />
                  Delete Campaign
                </motion.button>
              )}
              </div>
            </div>
            <div className={`grid gap-4 ${
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
                  <div className="aspect-square bg-[#FAFAFA] relative">
                    <img
                        src={imageUrl}
                        alt={imageTitle}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          // Fallback if image fails to load
                          const target = e.currentTarget;
                          target.src = 'https://via.placeholder.com/400x400?text=Image+Not+Available';
                        }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                      <div className="flex gap-3 pointer-events-auto">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                            onClick={() => handleDownloadImage(image)}
                          className="p-3 bg-white rounded-full shadow-lg hover:bg-[#FAFAFA] transition-colors"
                            title="Download image"
                        >
                          <Download size={20} className="text-[#2D3142]" />
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
                                });
                              } else {
                                navigator.clipboard.writeText(imageUrl);
                              }
                            }}
                          className="p-3 bg-white rounded-full shadow-lg hover:bg-[#FAFAFA] transition-colors"
                            title="Share image"
                        >
                          <Share2 size={20} className="text-[#2D3142]" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                      <p className="font-semibold text-[#2D3142]">{imageTitle}</p>
                  </div>
                </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {images.length === 0 && videos.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-8 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#FAFAFA] flex items-center justify-center">
              {isFailed ? (
                <XCircle size={32} className="text-red-500" />
              ) : isEmpty ? (
                <AlertTriangle size={32} className="text-yellow-500" />
              ) : (
                <CheckCircle size={32} className="text-[#6B7280]" />
              )}
            </div>
            <h3 className="text-xl font-bold text-[#2D3142] mb-2">
              {isFailed
                ? 'Generation Failed'
                : isEmpty
                ? 'No Assets Generated'
                : campaignType === 'ugc-only'
                ? 'No videos generated yet'
                : 'No images generated yet'}
            </h3>
            <p className="text-[#6B7280] mb-4">
              {webhookError
                ? webhookError
                : webhookPayload
                ? `Click ${isFailed ? 'retry' : 'regenerate'} to ${isFailed ? 'try again' : `generate ${campaignType === 'ugc-only' ? 'videos' : 'images'}`}`
                : 'Unable to regenerate: missing campaign data'}
            </p>
            {webhookPayload && (
              <button
                onClick={handleRegenerate}
                disabled={regenerating || isGenerating}
                className="px-6 py-3 bg-genie-primary text-white font-semibold rounded-lg shadow-md hover:bg-genie-primary-hover transition-all disabled:opacity-50 flex items-center gap-2 mx-auto"
              >
                {regenerating ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw size={20} />
                    {isFailed ? 'Try Again' : campaignType === 'ugc-only' ? 'Generate Videos' : 'Generate Images'}
                  </>
                )}
              </button>
            )}
          </motion.div>
        )}

        {videos.length > 0 && campaignType === 'image-ugc' && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl font-bold text-[#2D3142]">Generated Videos ({videos.length})</h2>
            </div>
            <div className={`grid ${
              videos.length === 1 
                ? 'grid-cols-1 max-w-md mx-auto gap-4' 
                : videos.length === 2 
                ? 'grid-cols-1 md:grid-cols-2 max-w-6xl mx-auto gap-6 md:gap-8'
                : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
            }`}>
              {videos.map((video, index) => {
                const videoUrl = video.url || video.video_url || video.videoUrl || video.src || '';
                const videoTitle = video.title || `Video ${index + 1}`;
                const videoId = video.id || `video-${index}`;

                if (!videoUrl) return null;

                return (
                <motion.div
                    key={videoId}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className={`group relative bg-white overflow-hidden shadow-lg hover:shadow-2xl transition-all ${
                    videos.length === 2 ? 'rounded-2xl' : 'rounded-lg'
                  }`}
                >
                  <div className={`aspect-video bg-[#FAFAFA] relative ${
                    videos.length === 2 ? 'rounded-t-2xl' : 'rounded-t-lg'
                  }`}>
                    <video
                        src={videoUrl}
                        className="w-full h-full object-cover"
                        controls
                        preload="metadata"
                        playsInline
                        poster={videoThumbnails[videoId] || undefined}
                        onLoadedMetadata={(e) => {
                          const videoEl = e.currentTarget;
                          if (!videoThumbnails[videoId] && videoEl.readyState >= 2) {
                            generateVideoThumbnail(videoUrl, videoId);
                          }
                        }}
                        onError={() => {
                          console.error('Video failed to load:', { videoUrl, videoId });
                        }}
                    />
                    {/* Play button overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                      <div className="flex gap-3 pointer-events-auto">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setPreviewVideo(video)}
                          className="p-4 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
                          title="Preview video"
                        >
                          <Play size={24} className="text-purple-600 ml-1" fill="currentColor" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDownloadVideo(video)}
                          className="p-3 bg-white rounded-full shadow-lg hover:bg-[#FAFAFA] transition-colors"
                          title="Download video"
                        >
                          <Download size={20} className="text-[#2D3142]" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            if (navigator.share) {
                              navigator.share({
                                title: videoTitle,
                                url: videoUrl,
                              }).catch(() => {
                                navigator.clipboard.writeText(videoUrl);
                              });
                            } else {
                              navigator.clipboard.writeText(videoUrl);
                            }
                          }}
                          className="p-3 bg-white rounded-full shadow-lg hover:bg-[#FAFAFA] transition-colors"
                          title="Share video"
                        >
                          <Share2 size={20} className="text-[#2D3142]" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                  <div className={`${videos.length === 2 ? 'p-5' : 'p-4'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Video size={16} className="text-purple-600" />
                        <p className={`font-semibold text-[#2D3142] ${videos.length === 2 ? 'text-lg' : 'text-base'}`}>{videoTitle}</p>
                      </div>
                      {videos.length === 2 && (
                        <span className="px-3 py-1 bg-orange-50 text-orange-700 text-xs font-semibold rounded-full border border-orange-200">
                          Video {index + 1}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
                );
              })}
            </div>
          </div>
        )}


      </div>
      
      {/* Video Preview Modal */}
      {previewVideo && (
        <div 
          className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewVideo(null)}
        >
          <div 
            className="bg-white rounded-2xl overflow-hidden max-w-4xl w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-video bg-black">
              <video
                src={previewVideo.url || previewVideo.video_url || previewVideo.videoUrl || previewVideo.src || ''}
                className="w-full h-full object-contain"
                controls
                autoPlay
                playsInline
              />
              <button
                onClick={() => setPreviewVideo(null)}
                className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
                title="Close preview"
              >
                <span className="text-2xl text-[#2D3142]">×</span>
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-[#2D3142]">
                    {previewVideo.title || 'Video Preview'}
                  </h3>
                  <p className="text-sm text-[#6B7280] mt-1">Video Preview</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      handleDownloadVideo(previewVideo);
                      setPreviewVideo(null);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Download size={18} />
                    Download
                  </button>
                  <button
                    onClick={() => setPreviewVideo(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Regeneration Progress Overlay */}
      {regenerating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
          >
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Regenerating Campaign
              </h3>
              <p className="text-gray-600 text-sm">
                {regenerationStep || 'Initializing generation...'}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Progress</span>
                <span className="font-semibold text-blue-600">{regenerationProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${regenerationProgress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Step Indicators */}
            <div className="space-y-2">
              {Object.entries(regenerationSteps).map(([stepIndex, stepLabel]) => {
                const index = parseInt(stepIndex);
                const currentStepIndex = regenerationProgress <= 10 ? 0 :
                                        regenerationProgress <= 20 ? 1 :
                                        regenerationProgress <= 40 ? 2 :
                                        regenerationProgress <= 80 ? 3 : 4;
                const isCompleted = index < currentStepIndex;
                const isCurrent = index === currentStepIndex;
                
                return (
                  <div key={index} className="flex items-center gap-3">
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : isCurrent ? (
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                    )}
                    <span
                      className={`text-sm ${
                        isCompleted
                          ? 'text-gray-900'
                          : isCurrent
                          ? 'text-blue-600 font-medium'
                          : 'text-gray-400'
                      }`}
                    >
                      {stepLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Fixed Bottom Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E7EB] shadow-lg z-40 py-3">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8">
          <div className="flex justify-center gap-3">
            <button
              onClick={() => navigate('/dashboard/campaign-hub')}
              className="px-6 py-2.5 bg-gradient-to-r from-orange-400 to-orange-600 text-white font-bold rounded-lg shadow-md flex items-center gap-2 hover:from-orange-500 hover:to-orange-700 transition-all"
            >
              <RefreshCw size={18} />
              Create New Campaign
            </button>
            <button
              onClick={() => navigate('/dashboard/campaigns')}
              className="px-6 py-2.5 bg-white text-[#6B7280] font-bold rounded-lg shadow-md border-2 border-[#E5E7EB] flex items-center gap-2 hover:bg-[#FAFAFA] transition-all"
            >
              <Home size={18} />
              View All Campaigns
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
