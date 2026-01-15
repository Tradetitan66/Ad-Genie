import { supabase } from '../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://n8n.srv1114357.hstgr.cloud/webhook/74f0426e-a5c2-4bf7-8316-3341f947e3c1'
//actual  N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://n8n.srv1114357.hstgr.cloud/webhook/da5b80b8-dbc3-4b2a-8df6-ca86340a106c';
//const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://n8n.srv1114357.hstgr.cloud/webhook/27850a35-32bc-438c-b194-a5b86e192820';

interface RemoveBackgroundResponse {const
  success?: boolean;
  imageBase64?: string;
  image?: string;
  data?: string;
  error?: string;
  [key: string]: any; // Allow for flexible response formats
}

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

export const imageService = {
  async removeBackground(imageBase64: string): Promise<string> {
    console.log('🚀 Starting background removal');
    console.log('📡 Webhook URL:', N8N_WEBHOOK_URL);
    
    try {
      // Create AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error('⏱️ Request timeout after 60 seconds');
        controller.abort();
      }, 60000); // 60 second timeout

      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      // Extract just the base64 part if it's a data URL
      let base64Data = imageBase64;
      if (imageBase64.includes(',')) {
        base64Data = imageBase64.split(',')[1];
      }

      const requestBody = { imageBase64: base64Data };
      console.log('📤 Sending request to webhook');
      console.log('📊 Image data size:', base64Data.length, 'characters');
      console.log('📋 Request body keys:', Object.keys(requestBody));

      const fetchStartTime = Date.now();
      console.log('🌐 Making fetch request to:', N8N_WEBHOOK_URL);
      console.log('📦 Request body preview:', JSON.stringify(requestBody).substring(0, 100) + '...');
      
      let response: Response;
      try {
        response = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
      } catch (fetchError: any) {
        console.error('❌ Fetch error occurred:', fetchError);
        console.error('❌ Error name:', fetchError.name);
        console.error('❌ Error message:', fetchError.message);
        if (fetchError.name === 'TypeError' && fetchError.message.includes('Failed to fetch')) {
          throw new Error('Network error: Unable to reach webhook. Check CORS settings and webhook availability.');
        }
        throw fetchError;
      }

      const fetchDuration = Date.now() - fetchStartTime;
      console.log('✅ Webhook responded in', fetchDuration, 'ms');
      console.log('📥 Response status:', response.status, response.statusText);
      console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Webhook returned error status');
        console.error('📄 Error response:', errorText.substring(0, 500));
        let errorData;
        try {
          errorData = JSON.parse(errorText);
          console.error('📋 Parsed error data:', errorData);
        } catch {
          errorData = { error: errorText || `HTTP ${response.status}: ${response.statusText}` };
        }
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      console.log('📥 Webhook response received');
      console.log('📊 Response length:', responseText.length, 'characters');
      console.log('📄 Response preview:', responseText.substring(0, 200));
      
      // Check if response is a direct string (base64 image)
      if (responseText.trim().startsWith('data:image')) {
        console.log('💡 Response is a direct image data URL');
        return responseText.trim();
      }
      
      let data: RemoveBackgroundResponse;
      try {
        data = JSON.parse(responseText) as RemoveBackgroundResponse;
        console.log('✅ Response parsed as JSON');
        console.log('📋 Response keys:', Object.keys(data));
        console.log('📋 Full response structure:', JSON.stringify(data, null, 2).substring(0, 500));
      } catch (parseError: any) {
        console.error('❌ Failed to parse response as JSON');
        console.error('🔍 Parse error:', parseError.message);
        console.log('📄 Raw response:', responseText.substring(0, 500));
        
        // If response is a long string, might be base64 without prefix
        if (responseText.trim().length > 100 && !responseText.trim().startsWith('{')) {
          console.log('💡 Response might be base64 string, adding prefix');
          return `data:image/png;base64,${responseText.trim()}`;
        }
        
        throw new Error(`Invalid JSON response from webhook: ${parseError.message}`);
      }

      // Handle different possible response formats from n8n webhook
      // Try common field names that might contain the processed image
      const processedImage: string | undefined = 
        data.imageBase64 || 
        data.image || 
        data.data || 
        data.result?.imageBase64 ||
        data.result?.image ||
        data.body?.imageBase64 ||
        data.body?.image ||
        (Array.isArray(data) && data[0]?.imageBase64) ||
        (Array.isArray(data) && data[0]?.image) ||
        undefined;
      
      console.log('🔍 Searching for processed image in response...');
      console.log('📋 Processed image found:', !!processedImage);
      console.log('📋 Processed image type:', typeof processedImage);
      if (processedImage) {
        console.log('📋 Processed image length:', processedImage.length);
        console.log('📋 Processed image preview:', processedImage.substring(0, 100));
      }

      if (!processedImage) {
        console.warn('⚠️ No processed image found in expected fields');
        console.log('📋 Full response data:', JSON.stringify(data, null, 2));
        
        // If no processed image found, check if there's an error message
        if (data.error) {
          throw new Error(data.error);
        }
        // If response indicates success but no image, return original
        if (data.success === false) {
          throw new Error('Background removal was unsuccessful');
        }
        // This check is already handled above
        // Check if the entire response is the image
        if (typeof responseText === 'string' && responseText.trim().startsWith('data:image')) {
          console.log('💡 Using response text as direct image data');
          return responseText.trim();
        }
        throw new Error('No processed image found in webhook response. Response structure: ' + JSON.stringify(Object.keys(data)));
      }

      console.log('✅ Processed image extracted successfully');

      // Ensure the returned image is a valid data URL
      if (processedImage.startsWith('data:image')) {
        console.log('✅ Returning data URL format');
        return processedImage;
      } else if (processedImage.startsWith('http')) {
        console.log('🌐 Processed image is a URL, fetching...');
        // If it's a URL, fetch and convert to base64
        const imageResponse = await fetch(processedImage);
        const blob = await imageResponse.blob();
        const base64 = await this.blobToBase64(blob);
        console.log('✅ URL converted to base64');
        return base64;
      } else {
        console.log('💡 Adding data URL prefix to base64 string');
        // Assume it's base64 without data URL prefix, add it
        return `data:image/png;base64,${processedImage}`;
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('⏱️ Background removal timed out after 60 seconds, using original image');
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('🌐 Network error calling webhook:', error.message);
        console.error('🔗 Webhook URL:', N8N_WEBHOOK_URL);
        console.error('💡 Check: CORS settings, network connectivity, webhook availability');
      } else if (error.message) {
        console.error('❌ Background removal failed:', error.message);
        console.error('📋 Error details:', error);
      } else {
        console.error('❌ Background removal failed with unknown error:', error);
      }
      // Return original image if background removal fails
      console.log('🔄 Falling back to original image');
      return imageBase64;
    }
  },

  async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  },

  async uploadToStorage(
    userId: string,
    file: File,
    type: 'logo' | 'product',
    removeBackground = false,
    retryCount = 0
  ): Promise<string> {
    const startTime = performance.now();
    console.log('uploadToStorage called:', { userId, fileName: file.name, type, removeBackground, supabaseConfigured: isSupabaseConfigured(), retryCount });

    let fileToUpload = file;
    // Optimize filename: remove special characters and use simpler naming
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    let fileName = `${type}-${timestamp}-${randomSuffix}-${sanitizedFileName}`;

    // Use Edge Function for background removal if requested and Supabase is configured
    if (removeBackground && isSupabaseConfigured()) {
      try {
        console.log('🚀 Using Edge Function for background removal');
        const imageBase64 = await this.fileToBase64(file);
        
        // Extract base64 data (remove data URL prefix if present)
        let base64Data = imageBase64;
        if (imageBase64.includes(',')) {
          base64Data = imageBase64.split(',')[1];
        }

        // Call Edge Function
        const { data, error } = await supabase.functions.invoke('remove-background', {
          body: { imageBase64: base64Data }
        });

        if (error) {
          console.error('❌ Edge Function error:', error);
          throw new Error(`Background removal failed: ${error.message}`);
        }

        if (data?.imageBase64) {
          console.log('✅ Background removed successfully via Edge Function');
          // Convert base64 to blob for upload
          const blob = await this.base64ToBlob(data.imageBase64);
          fileToUpload = new File([blob], file.name, { type: 'image/png' });
          fileName = `${type}-processed-${Date.now()}.png`;
        } else if (data?.error) {
          console.error('❌ Edge Function returned error:', data.error);
          throw new Error(`Background removal failed: ${data.error}`);
        } else {
          console.warn('⚠️ Edge Function response format unexpected, using original image');
        }
      } catch (error: any) {
        console.error('❌ Background removal failed, using original image:', error.message);
        // Fall back to original image if background removal fails
        fileToUpload = file;
      }
    } else if (removeBackground && !isSupabaseConfigured()) {
      console.warn('⚠️ Background removal requested but Supabase not configured - uploading original image');
    }

    // Always attempt to upload to Supabase storage buckets
    const filePath = `${userId}/${fileName}`;

    const beforeUploadTime = performance.now();
    console.log('📤 Uploading to Supabase storage bucket:', {
      bucket: 'brand-assets',
      path: filePath,
      fileName: fileToUpload.name,
      fileSize: fileToUpload.size,
      fileType: fileToUpload.type,
      userId: userId,
      type: type,
      timeToUploadStart: `${(beforeUploadTime - startTime).toFixed(2)}ms`,
    });

    try {
      // Add timeout handling (30 seconds)
      let timeoutId: ReturnType<typeof setTimeout>;
      let timedOut = false;
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          timedOut = true;
          reject(new Error('Upload timeout: Request took longer than 30 seconds'));
        }, 30000);
      });

      const uploadPromise = supabase.storage
        .from('brand-assets')
        .upload(filePath, fileToUpload, {
          cacheControl: '3600',
          upsert: true, // Changed to true to avoid conflicts
          contentType: fileToUpload.type || 'image/jpeg',
        });

      let uploadResult: any;
      try {
        uploadResult = await Promise.race([uploadPromise, timeoutPromise]);
        clearTimeout(timeoutId);
      } catch (raceError: any) {
        clearTimeout(timeoutId);
        if (timedOut || (raceError.message && raceError.message.includes('timeout'))) {
          throw raceError;
        }
        // Supabase returns {data, error} format, so if it's not a timeout, it's the response
        uploadResult = raceError;
      }

      const { data, error } = uploadResult || {};

      if (error) {
        const errorTime = performance.now();
        console.error('❌ Supabase storage upload error details:', {
          message: error.message,
          statusCode: error.statusCode,
          error: error,
          path: filePath,
          userId: userId,
          bucket: 'brand-assets',
          fileName: fileToUpload.name,
          fileSize: fileToUpload.size,
          timeToError: `${(errorTime - beforeUploadTime).toFixed(2)}ms`,
        });
        
        // Retry logic for transient errors
        const MAX_RETRIES = 2;
        if (retryCount < MAX_RETRIES && (
          error.message.includes('network') || 
          error.message.includes('timeout') ||
          error.message.includes('fetch') ||
          error.statusCode === 408 ||
          error.statusCode === 429 ||
          error.statusCode === 503 ||
          error.statusCode === 504
        )) {
          const retryDelay = 1000 * (retryCount + 1); // Exponential backoff: 1s, 2s
          console.log(`🔄 Retrying upload (attempt ${retryCount + 2}/${MAX_RETRIES + 1}) after ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return this.uploadToStorage(userId, file, type, removeBackground, retryCount + 1);
        }
        
        // Check for specific error types
        if (error.message.includes('new row violates row-level security policy') || 
            error.message.includes('RLS') ||
            error.statusCode === 403) {
          console.error('🚫 RLS Policy Error: Storage policies are blocking upload');
          console.error('💡 Solution: Run migration 20250124000001_fix_brand_assets_storage_policies.sql');
          throw new Error(`Storage policy error: Upload blocked by security policies. Please check storage bucket policies.`);
        }
        
        if (error.statusCode === 413 || error.message.includes('too large')) {
          throw new Error(`File too large: Maximum size is 10MB`);
        }
        
        throw error;
      }

      const afterUploadTime = performance.now();
      console.log('✅ File uploaded successfully to Supabase:', {
        path: data.path,
        id: data.id,
        fullPath: data.fullPath,
        uploadDuration: `${(afterUploadTime - beforeUploadTime).toFixed(2)}ms`,
      });

      const beforeUrlTime = performance.now();
      const { data: urlData } = supabase.storage
        .from('brand-assets')
        .getPublicUrl(data.path);

      const publicUrl = urlData.publicUrl;
      const afterUrlTime = performance.now();
      const totalTime = performance.now() - startTime;
      console.log('🔗 Public URL generated:', {
        url: publicUrl,
        urlGenerationTime: `${(afterUrlTime - beforeUrlTime).toFixed(2)}ms`,
        totalTime: `${totalTime.toFixed(2)}ms`,
      });
      
      // Verify the URL is actually a Supabase URL
      if (!publicUrl.includes('supabase.co/storage')) {
        console.error('❌ Generated URL does not appear to be a Supabase URL:', publicUrl);
        throw new Error('Invalid Supabase URL generated');
      }
      
      return publicUrl;
    } catch (error: any) {
      console.error('❌ Failed to upload to Supabase storage:', {
        error: error,
        message: error?.message,
        stack: error?.stack,
        userId: userId,
        filePath: filePath,
        fileName: fileToUpload.name,
        fileSize: fileToUpload.size,
        type: type,
      });
      
      // Only fall back to localStorage if Supabase is truly not configured
      // Otherwise, throw the error so user knows upload failed
      if (!isSupabaseConfigured()) {
        console.warn('⚠️ Supabase not configured, falling back to localStorage');
        return this.uploadToLocalStorage(userId, fileToUpload, type, false);
      }
      
      // Provide more helpful error messages
      if (error?.message) {
        throw new Error(`Failed to upload ${type} image: ${error.message}`);
      }
      
      // If Supabase is configured but upload failed, throw error
      throw new Error(`Failed to upload image to Supabase: ${error.message || error}`);
    }
  },

  async uploadToLocalStorage(
    userId: string,
    file: File,
    type: 'logo' | 'product',
    _removeBackground = false
  ): Promise<string> {
    // Note: removeBackground parameter is kept for API consistency but not used here
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        
        // Store in localStorage
        const storageKey = `localImages_${userId}`;
        const existingImages = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        existingImages.push({
          id: imageId,
          type,
          base64,
          uploadedAt: new Date().toISOString(),
        });
        
        localStorage.setItem(storageKey, JSON.stringify(existingImages));
        
        // Return data URL (can be used directly in img src)
        resolve(base64);
      };
      reader.onerror = reject;
    });
  },

  async deleteFromStorage(url: string): Promise<void> {
    // If it's a data URL (localStorage), try to remove it
    if (url.startsWith('data:')) {
      // Find and remove from localStorage
      const storageKeys = Object.keys(localStorage).filter(key => key.startsWith('localImages_'));
      for (const key of storageKeys) {
        const images = JSON.parse(localStorage.getItem(key) || '[]');
        const filtered = images.filter((img: any) => img.base64 !== url);
        if (filtered.length !== images.length) {
          localStorage.setItem(key, JSON.stringify(filtered));
          return;
        }
      }
      return;
    }

    // If Supabase isn't configured, skip deletion
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured, skipping storage deletion');
      return;
    }

    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const bucketIndex = pathParts.indexOf('brand-assets');

      if (bucketIndex === -1) {
        throw new Error('Invalid storage URL');
      }

      const filePath = pathParts.slice(bucketIndex + 1).join('/');

      const { error } = await supabase.storage
        .from('brand-assets')
        .remove([filePath]);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.warn('Failed to delete from Supabase storage:', error);
      // Don't throw - deletion failure shouldn't break the app
    }
  },

  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  },

  async base64ToBlob(base64: string): Promise<Blob> {
    const response = await fetch(base64);
    return response.blob();
  },

  /**
   * Upload a generated image from webhook URL to Supabase storage
   * Stores in output-images/{userId}/{campaignId}/{filename}
   */
  async uploadGeneratedImageToStorage(
    userId: string,
    imageUrl: string,
    campaignId: string,
    retryCount = 0
  ): Promise<string> {
    const MAX_RETRIES = 2;
    
    // If Supabase isn't configured, return original URL
    if (!isSupabaseConfigured()) {
      console.warn('⚠️ Supabase not configured, returning original URL');
      return imageUrl;
    }

    // If it's already a data URL or not a valid HTTP(S) URL, return as-is
    if (!imageUrl || imageUrl.startsWith('data:') || (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://'))) {
      console.warn('⚠️ Image URL is not a valid HTTP(S) URL, returning as-is:', imageUrl);
      return imageUrl;
    }

    // Check if it's already a Supabase URL
    if (imageUrl.includes('supabase.co/storage')) {
      console.log('✅ Image is already a Supabase URL, skipping upload');
      return imageUrl;
    }

    try {
      // Fetch the image from the webhook URL with better error handling
      console.log(`📥 [Attempt ${retryCount + 1}/${MAX_RETRIES + 1}] Fetching image from webhook URL:`, imageUrl.substring(0, 100) + '...');
      
      let response: Response;
      try {
        response = await fetch(imageUrl, {
          mode: 'cors',
          credentials: 'omit',
          headers: {
            'Accept': 'image/*',
          },
        });
      } catch (fetchError: any) {
        console.error('❌ Fetch error details:', {
          name: fetchError.name,
          message: fetchError.message,
          stack: fetchError.stack,
          url: imageUrl.substring(0, 100),
        });
        
        // Retry on network errors
        if (retryCount < MAX_RETRIES && (fetchError.name === 'TypeError' || fetchError.message.includes('Failed to fetch'))) {
          console.log(`🔄 Retrying fetch (attempt ${retryCount + 2}/${MAX_RETRIES + 1})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
          return this.uploadGeneratedImageToStorage(userId, imageUrl, campaignId, retryCount + 1);
        }
        
        throw new Error(`Network error fetching image: ${fetchError.message}`);
      }
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unable to read error response');
        console.error('❌ HTTP error fetching image:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          errorBody: errorText.substring(0, 200),
        });
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || 'image/png';
      console.log('✅ Image fetched successfully, content-type:', contentType);
      
      const blob = await response.blob();
      console.log('✅ Image blob created, size:', blob.size, 'bytes');
      
      if (blob.size === 0) {
        throw new Error('Fetched image blob is empty');
      }
      
      // Generate filename from URL or use timestamp
      let urlFilename = `image-${Date.now()}.png`;
      try {
        const urlObj = new URL(imageUrl);
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
          return this.uploadGeneratedImageToStorage(userId, imageUrl, campaignId, retryCount + 1);
        }
        
        throw new Error(`Supabase upload failed: ${error.message} (status: ${error.statusCode || 'unknown'})`);
      }

      console.log('✅ Image uploaded successfully to Supabase:', {
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
      console.error('❌ Failed to upload generated image to Supabase:', {
        error: error,
        message: error?.message,
        stack: error?.stack,
        userId: userId,
        campaignId: campaignId,
        imageUrl: imageUrl.substring(0, 100),
        retryCount: retryCount,
      });
      
      // Only return original URL if we've exhausted retries
      if (retryCount >= MAX_RETRIES) {
        console.warn('⚠️ All retry attempts exhausted, returning original webhook URL');
        return imageUrl;
      }
      
      // Retry if we haven't exceeded max retries
      console.log(`🔄 Retrying upload (attempt ${retryCount + 2}/${MAX_RETRIES + 1})...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return this.uploadGeneratedImageToStorage(userId, imageUrl, campaignId, retryCount + 1);
    }
  },
};
