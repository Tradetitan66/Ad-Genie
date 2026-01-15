// Webhook service for sending brand data to n8n
// Production URLs - different webhooks for different content types
//const IMAGE_ONLY_WEBHOOK_URL = 'https://n8n.srv1004168.hstgr.cloud/webhook/07be41b0-cf
const IMAGE_ONLY_WEBHOOK_URL = 'https://n8n.srv1114357.hstgr.cloud/webhook/74f0426e-a5c2-4bf7-8316-3341f947e3c1';
const DEFAULT_WEBHOOK_URL = 'https://n8n.srv1114357.hstgr.cloud/webhook/74f0426e-a5c2-4bf7-8316-3341f947e3c1';
// Production URL - n8n workflow is complete with "Respond to Webhook" connected
//const WEBHOOK_URL = 'https://n8n.srv1004168.hstgr.cloud/webhook/07be41b0-cf9a-4cc3-8ba8-1fcc9652be51';
//const WEBHOOK_URL = 'https://n8n.srv1114357.hstgr.cloud/webhook/da5b80b8-dbc3-4b2a-8df6-ca86340a106c';
const WEBHOOK_URL = 'https://n8n.srv1114357.hstgr.cloud/webhook/74f0426e-a5c2-4bf7-8316-3341f947e3c1';

export interface BrandWebhookData {
  user_id: string;
  user_email: string;
  brand_name: string;
  industry: string;
  audience?: string;
  website_url?: string;
  contact_email: string;
  logo_url?: string | null;
  product_images: string[];
  brand_colors: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  preferred_language?: string;
  content_type?: string;
  campaign_goal?: string;
  campaign_market?: string; // Target market for the campaign (Local, International, Global)
  brand_voice?: string;
  visual_styles?: string[];
  campaign_timing?: string;
  seasonal_events?: string[] | {
    local?: string[];
    international?: string[];
  };
}

// Webhook response types - flexible to handle different formats
export interface WebhookImageItem {
  url?: string;
  image_url?: string;
  imageUrl?: string;
  src?: string;
  title?: string;
  id?: string;
  [key: string]: any; // Allow additional properties
}

export interface WebhookVideoItem {
  url?: string;
  video_url?: string;
  videoUrl?: string;
  src?: string;
  title?: string;
  id?: string;
  [key: string]: any; // Allow additional properties
}

export interface WebhookResponse {
  images?: WebhookImageItem[] | string[];
  image_urls?: string[];
  imageUrls?: string[];
  videos?: WebhookVideoItem[] | string[];
  video_urls?: string[];
  videoUrls?: string[];
  data?: {
    images?: WebhookImageItem[] | string[];
    videos?: WebhookVideoItem[] | string[];
    [key: string]: any;
  };
  [key: string]: any; // Allow additional properties
}

/**
 * Parse webhook response to extract image URLs
 * Handles multiple response formats:
 * - Array of URLs: ["url1", "url2"]
 * - Array of objects: [{url: "...", title: "..."}]
 * - Object with images property: {images: [...]}
 */
export function parseWebhookResponse(response: any): WebhookImageItem[] {
  if (!response) {
    return [];
  }

  // If response is already an array of strings
  if (Array.isArray(response) && typeof response[0] === 'string') {
    return response.map((url, index) => ({
      url,
      id: `img-${index}`,
      title: `Image ${index + 1}`,
    }));
  }

  // If response is an array of objects
  if (Array.isArray(response)) {
    return response.map((item, index) => {
      if (typeof item === 'string') {
        return { url: item, id: `img-${index}`, title: `Image ${index + 1}` };
      }
      return {
        url: item.url || item.image_url || item.imageUrl || item.src || '',
        title: item.title || `Image ${index + 1}`,
        id: item.id || `img-${index}`,
        ...item,
      };
    });
  }

  // If response has images property
  if (response.images && Array.isArray(response.images)) {
    return parseWebhookResponse(response.images);
  }

  // If response has image_urls or imageUrls property
  if (response.image_urls && Array.isArray(response.image_urls)) {
    return parseWebhookResponse(response.image_urls);
  }
  if (response.imageUrls && Array.isArray(response.imageUrls)) {
    return parseWebhookResponse(response.imageUrls);
  }

  // If response has data.images
  if (response.data?.images && Array.isArray(response.data.images)) {
    return parseWebhookResponse(response.data.images);
  }

  // Try to find any array property that might contain images
  for (const key in response) {
    if (Array.isArray(response[key]) && response[key].length > 0) {
      const firstItem = response[key][0];
      // Check if it looks like image data
      if (typeof firstItem === 'string' || firstItem?.url || firstItem?.image_url) {
        return parseWebhookResponse(response[key]);
      }
    }
  }

  console.warn('Could not parse webhook response format:', response);
  return [];
}

/**
 * Parse webhook response to extract video URLs
 * Handles multiple response formats:
 * - Array of URLs: ["url1", "url2"]
 * - Array of objects: [{url: "...", title: "..."}]
 * - Object with videos property: {videos: [...]}
 */
export function parseWebhookVideoResponse(response: any): WebhookVideoItem[] {
  if (!response) {
    return [];
  }

  // If response is already an array of strings
  if (Array.isArray(response) && typeof response[0] === 'string') {
    return response.map((url, index) => ({
      url,
      id: `video-${index}`,
      title: `Video ${index + 1}`,
    }));
  }

  // If response is an array of objects
  if (Array.isArray(response)) {
    return response.map((item, index) => {
      if (typeof item === 'string') {
        return { url: item, id: `video-${index}`, title: `Video ${index + 1}` };
      }
      return {
        url: item.url || item.video_url || item.videoUrl || item.src || '',
        title: item.title || `Video ${index + 1}`,
        id: item.id || `video-${index}`,
        ...item,
      };
    });
  }

  // If response has videos property
  if (response.videos && Array.isArray(response.videos)) {
    return parseWebhookVideoResponse(response.videos);
  }

  // If response has video_urls or videoUrls property
  if (response.video_urls && Array.isArray(response.video_urls)) {
    return parseWebhookVideoResponse(response.video_urls);
  }
  if (response.videoUrls && Array.isArray(response.videoUrls)) {
    return parseWebhookVideoResponse(response.videoUrls);
  }

  // If response has data.videos
  if (response.data?.videos && Array.isArray(response.data.videos)) {
    return parseWebhookVideoResponse(response.data.videos);
  }

  // Try to find any array property that might contain videos
  for (const key in response) {
    if (Array.isArray(response[key]) && response[key].length > 0) {
      const firstItem = response[key][0];
      // Check if it looks like video data
      if (typeof firstItem === 'string' || firstItem?.url || firstItem?.video_url || firstItem?.videoUrl) {
        return parseWebhookVideoResponse(response[key]);
      }
    }
  }

  console.warn('Could not parse webhook video response format:', response);
  return [];
}

export async function sendBrandDataToWebhook(data: BrandWebhookData, retryCount = 0): Promise<WebhookResponse> {
  const MAX_RETRIES = 2;
  
  try {
    // Select webhook URL based on content type
    const webhookUrl = data.content_type === 'image-only' 
      ? IMAGE_ONLY_WEBHOOK_URL 
      : DEFAULT_WEBHOOK_URL;
    
    console.log('📤 Sending brand data to webhook:', webhookUrl);
    console.log('📋 Content type:', data.content_type);
    console.log('📋 Attempt:', retryCount + 1, '/', MAX_RETRIES + 1);
    
    // Validate payload before sending
    const payloadSize = JSON.stringify(data).length;
    console.log('📊 Payload size:', payloadSize, 'bytes');
    if (payloadSize > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('Payload too large: Webhook payload exceeds 10MB limit');
    }
    
    // Validate required fields
    if (!data.user_id || !data.user_email || !data.brand_name || !data.industry) {
      throw new Error('Missing required fields: user_id, user_email, brand_name, and industry are required');
    }
    
    console.log('📋 Data keys:', Object.keys(data));
    console.log('⏳ Waiting for webhook response (this may take a while)...');

    // Fetch with timeout handling, CORS support, and retry logic
    let response: Response;
    try {
      // Create AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error('⏱️ Request timeout after 10 minutes');
        controller.abort();
      }, 600000); // 10 minute timeout

      // Try with CORS mode first (default)
      try {
        response = await fetch(webhookUrl, {
          method: 'POST',
          mode: 'cors', // Explicitly set CORS mode
          credentials: 'omit', // Don't send cookies to avoid CORS issues
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(data),
          signal: controller.signal,
        });
      } catch (corsError: any) {
        // If CORS fails, log it but don't retry with no-cors (we need to read the response)
        console.warn('⚠️ CORS error detected:', corsError.message);
        throw corsError;
      }

      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      console.error('❌ Fetch error details:', {
        name: fetchError.name,
        message: fetchError.message,
        stack: fetchError.stack,
        webhookUrl: webhookUrl,
        contentType: data.content_type,
        retryCount,
      });
      
      // Retry logic for transient network errors
      const isRetryableError = 
        (fetchError.name === 'TypeError' && fetchError.message.includes('Failed to fetch')) ||
        fetchError.name === 'AbortError' ||
        fetchError.message.includes('timeout') ||
        fetchError.message.includes('network') ||
        fetchError.message.includes('NetworkError');
      
      if (isRetryableError && retryCount < MAX_RETRIES) {
        const backoffDelay = 1000 * Math.pow(2, retryCount); // Exponential backoff: 1s, 2s
        console.log(`🔄 Retrying webhook request in ${backoffDelay}ms (attempt ${retryCount + 2}/${MAX_RETRIES + 1})...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        return sendBrandDataToWebhook(data, retryCount + 1);
      }
      
      // Provide more specific error messages
      if (fetchError.name === 'TypeError' && fetchError.message.includes('Failed to fetch')) {
        // Check if it's likely a CORS issue
        if (fetchError.message.includes('CORS') || fetchError.message.includes('cross-origin')) {
          throw new Error('CORS error: The webhook server may not allow requests from this origin. Please contact support.');
        }
        throw new Error('Network error: Unable to reach webhook server. Please check your internet connection and ensure the webhook URL is accessible.');
      }
      if (fetchError.name === 'AbortError' || fetchError.message.includes('timeout')) {
        throw new Error('Request timeout: The webhook request took too long. Please try again.');
      }
      throw new Error(`Network request failed: ${fetchError.message}`);
    }

    // Read the response body ONCE as text
    const responseText = await response.text();
    console.log('📥 Webhook response status:', response.status, response.statusText);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
    console.log('📥 Response body length:', responseText.length, 'characters');

    if (!response.ok) {
      // Check for specific HTTP status codes
      let errorMessage = `Webhook failed: ${response.status} ${response.statusText}`;
      if (response.status === 404) {
        errorMessage = 'Webhook endpoint not found (404). Please verify the webhook URL is correct.';
      } else if (response.status === 403) {
        errorMessage = 'Access forbidden (403). The webhook server rejected the request.';
      } else if (response.status === 401) {
        errorMessage = 'Unauthorized (401). Authentication may be required.';
      } else if (response.status >= 500) {
        errorMessage = `Server error (${response.status}). The webhook server encountered an error. Please try again later.`;
      } else if (response.status === 413) {
        errorMessage = 'Payload too large (413). The request data is too big.';
      }
      
      console.error('❌ Webhook HTTP error:', {
        status: response.status,
        statusText: response.statusText,
        responsePreview: responseText.substring(0, 500),
        webhookUrl: webhookUrl
      });
      
      throw new Error(errorMessage);
    }

    // Now parse the text as JSON
    let responseData: WebhookResponse;
    try {
      responseData = JSON.parse(responseText);
      console.log('✅ Webhook response parsed successfully');
    } catch (parseError) {
      console.warn('⚠️ Webhook response is not valid JSON, returning as raw text');
      // If it's not valid JSON, return it as raw text
      responseData = { raw: responseText };
    }

    console.log('✅ Webhook response received:', {
      hasImages: !!(responseData.images || responseData.image_urls || responseData.imageUrls),
      hasVideos: !!(responseData.videos || responseData.video_urls || responseData.videoUrls),
      keys: Object.keys(responseData)
    });
    return responseData;
  } catch (error: any) {
    console.error('❌ Webhook error:', {
      error: error,
      message: error.message,
      name: error.name,
      stack: error.stack,
      retryCount,
      contentType: data.content_type
    });
    
    // Check if it's a timeout or network error
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      throw new Error(`Webhook request timed out. Please ensure the respond node is connected in n8n.`);
    }
    
    // If error message already contains user-friendly text, use it
    if (error.message && (
      error.message.includes('Network error') ||
      error.message.includes('CORS error') ||
      error.message.includes('Webhook failed') ||
      error.message.includes('Payload too large') ||
      error.message.includes('Missing required fields')
    )) {
      throw error;
    }
    
    throw new Error(`Failed to send data to webhook: ${error.message || 'Unknown error'}`);
  }
}

