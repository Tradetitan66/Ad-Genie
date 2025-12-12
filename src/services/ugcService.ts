import { supabase } from '../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
  const url = SUPABASE_URL;
  const key = SUPABASE_ANON_KEY;
  return url && 
    url !== 'your_supabase_project_url' && 
    url.startsWith('http') &&
    key && 
    key !== 'your_supabase_anon_key' && 
    key.length > 20;
};

export const ugcService = {
  /**
   * Upload a generated video from webhook URL to Supabase storage
   * Stores in output-images/{userId}/{campaignId}/{filename}
   * (Using same bucket as images, but with video MIME types)
   */
  async uploadGeneratedVideoToStorage(
    userId: string,
    videoUrl: string,
    campaignId: string,
    retryCount = 0
  ): Promise<string> {
    const MAX_RETRIES = 2;
    
    // If Supabase isn't configured, return original URL
    if (!isSupabaseConfigured()) {
      console.warn('⚠️ Supabase not configured, returning original URL');
      return videoUrl;
    }

    // If it's already a data URL or not a valid HTTP(S) URL, return as-is
    if (!videoUrl || videoUrl.startsWith('data:') || (!videoUrl.startsWith('http://') && !videoUrl.startsWith('https://'))) {
      console.warn('⚠️ Video URL is not a valid HTTP(S) URL, returning as-is:', videoUrl);
      return videoUrl;
    }

    // Check if it's already a Supabase URL
    if (videoUrl.includes('supabase.co/storage')) {
      console.log('✅ Video is already a Supabase URL, skipping upload');
      return videoUrl;
    }

    try {
      // Fetch the video from the webhook URL with better error handling
      console.log(`📥 [Attempt ${retryCount + 1}/${MAX_RETRIES + 1}] Fetching video from webhook URL:`, videoUrl.substring(0, 100) + '...');
      
      let response: Response;
      try {
        response = await fetch(videoUrl, {
          mode: 'cors',
          credentials: 'omit',
          headers: {
            'Accept': 'video/*',
          },
        });
      } catch (fetchError: any) {
        console.error('❌ Fetch error details:', {
          name: fetchError.name,
          message: fetchError.message,
          stack: fetchError.stack,
          url: videoUrl.substring(0, 100),
        });
        
        // Retry on network errors
        if (retryCount < MAX_RETRIES && (fetchError.name === 'TypeError' || fetchError.message.includes('Failed to fetch'))) {
          console.log(`🔄 Retrying fetch (attempt ${retryCount + 2}/${MAX_RETRIES + 1})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
          return this.uploadGeneratedVideoToStorage(userId, videoUrl, campaignId, retryCount + 1);
        }
        
        throw new Error(`Network error fetching video: ${fetchError.message}`);
      }
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unable to read error response');
        console.error('❌ HTTP error fetching video:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          errorBody: errorText.substring(0, 200),
        });
        throw new Error(`Failed to fetch video: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || 'video/mp4';
      console.log('✅ Video fetched successfully, content-type:', contentType);
      
      const blob = await response.blob();
      console.log('✅ Video blob created, size:', blob.size, 'bytes');
      
      if (blob.size === 0) {
        throw new Error('Fetched video blob is empty');
      }
      
      // Generate filename from URL or use timestamp
      let urlFilename = `video-${Date.now()}.mp4`;
      try {
        const urlObj = new URL(videoUrl);
        const urlPath = urlObj.pathname;
        const extractedFilename = urlPath.split('/').pop()?.split('?')[0]; // Remove query params
        if (extractedFilename && extractedFilename.includes('.')) {
          urlFilename = extractedFilename;
        }
      } catch (urlError) {
        console.warn('⚠️ Could not parse URL for filename, using default');
      }
      
      const sanitizedFilename = urlFilename.replace(/[^a-zA-Z0-9.-]/g, '_');
      
      // Upload to Supabase storage: output-images/{userId}/{campaignId}/{filename}
      const filePath = `${userId}/${campaignId}/${sanitizedFilename}`;
      
      console.log('📤 Uploading to Supabase storage:', {
        bucket: 'output-images',
        path: filePath,
        size: blob.size,
        contentType: contentType,
        userId: userId,
        campaignId: campaignId,
      });
      
      const { data, error } = await supabase.storage
        .from('output-images')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: true,
          contentType: contentType,
        });

      if (error) {
        console.error('❌ Supabase storage upload error details:', {
          message: error.message,
          statusCode: error.statusCode,
          error: error,
          path: filePath,
          userId: userId,
          campaignId: campaignId,
        });
        
        // Retry on certain errors
        if (retryCount < MAX_RETRIES && (
          error.message.includes('network') || 
          error.message.includes('timeout') ||
          error.statusCode === 408 ||
          error.statusCode === 429
        )) {
          console.log(`🔄 Retrying upload (attempt ${retryCount + 2}/${MAX_RETRIES + 1})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return this.uploadGeneratedVideoToStorage(userId, videoUrl, campaignId, retryCount + 1);
        }
        
        throw new Error(`Supabase upload failed: ${error.message} (status: ${error.statusCode || 'unknown'})`);
      }

      console.log('✅ Video uploaded successfully to Supabase:', {
        path: data.path,
        id: data.id,
        fullPath: data.fullPath,
      });

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('output-images')
        .getPublicUrl(data.path);

      const supabaseUrl = urlData.publicUrl;
      console.log('🔗 Supabase storage URL generated:', supabaseUrl);
      
      // Verify the URL is actually a Supabase URL
      if (!supabaseUrl.includes('supabase.co/storage')) {
        console.error('❌ Generated URL does not appear to be a Supabase URL:', supabaseUrl);
        throw new Error('Invalid Supabase URL generated');
      }
      
      return supabaseUrl;
    } catch (error: any) {
      console.error('❌ Failed to upload generated video to Supabase:', {
        error: error,
        message: error?.message,
        stack: error?.stack,
        userId: userId,
        campaignId: campaignId,
        videoUrl: videoUrl.substring(0, 100),
        retryCount: retryCount,
      });
      
      // Only return original URL if we've exhausted retries
      if (retryCount >= MAX_RETRIES) {
        console.warn('⚠️ All retry attempts exhausted, returning original webhook URL');
        return videoUrl;
      }
      
      // Retry if we haven't exceeded max retries
      console.log(`🔄 Retrying upload (attempt ${retryCount + 2}/${MAX_RETRIES + 1})...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return this.uploadGeneratedVideoToStorage(userId, videoUrl, campaignId, retryCount + 1);
    }
  },
};

