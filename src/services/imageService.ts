import { supabase } from '../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://n8n.srv1004168.hstgr.cloud/webhook/6b9d72b2-2403-4e5b-842e-e5e772309772'

interface RemoveBackgroundResponse {
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
    removeBackground = false
  ): Promise<string> {
    console.log('uploadToStorage called:', { userId, fileName: file.name, type, removeBackground, supabaseConfigured: isSupabaseConfigured() });

    let fileToUpload = file;
    let fileName = `${type}-${Date.now()}-${file.name}`;

    // Process background removal first (regardless of Supabase config)
    if (removeBackground) {
      console.log('Background removal requested for file:', file.name);
      try {
        const base64 = await this.fileToBase64(file);
        console.log('File converted to base64, calling removeBackground...');
        const processedBase64 = await this.removeBackground(base64);
        console.log('Background removal completed, converting to blob...');

        const blob = await this.base64ToBlob(processedBase64);
        fileToUpload = new File([blob], fileName, { type: 'image/png' });
        console.log('Processed file ready for upload, size:', fileToUpload.size);
      } catch (error) {
        console.error('Background removal failed, uploading original image:', error);
        // Continue with original file if background removal fails
      }
    }

    // If Supabase isn't configured, use localStorage fallback
    if (!isSupabaseConfigured()) {
      console.log('Supabase not configured, using localStorage fallback');
      return this.uploadToLocalStorage(userId, fileToUpload, type, false); // Already processed if needed
    }

    const filePath = `${userId}/${fileName}`;

    try {
      const { data, error } = await supabase.storage
        .from('brand-assets')
        .upload(filePath, fileToUpload, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw error;
      }

      const { data: urlData } = supabase.storage
        .from('brand-assets')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.warn('Supabase storage upload failed, falling back to localStorage:', error);
      return this.uploadToLocalStorage(userId, file, type, removeBackground);
    }
  },

  async uploadToLocalStorage(
    userId: string,
    file: File,
    type: 'logo' | 'product',
    removeBackground = false
  ): Promise<string> {
    // Note: removeBackground is ignored here as processing should happen before calling this
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
};
