// Webhook service for sending brand data to n8n
// Production URL - n8n workflow is complete with "Respond to Webhook" connected
//const WEBHOOK_URL = 'https://n8n.srv1004168.hstgr.cloud/webhook/07be41b0-cf9a-4cc3-8ba8-1fcc9652be51';
const WEBHOOK_URL = 'https://n8n.srv1114357.hstgr.cloud/webhook/da5b80b8-dbc3-4b2a-8df6-ca86340a106c';

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

export async function sendBrandDataToWebhook(data: BrandWebhookData): Promise<WebhookResponse> {
  try {
    console.log('📤 Sending brand data to webhook:', WEBHOOK_URL);
    console.log('📋 Data:', JSON.stringify(data, null, 2));
    console.log('⏳ Waiting for webhook response (this may take a while)...');

    // Fetch with no timeout - will wait until respond node is connected
    // Browser default timeout is typically 5-10 minutes, which should be sufficient
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    // Read the response body ONCE as text
    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText} - ${responseText}`);
    }

    // Now parse the text as JSON
    let responseData: WebhookResponse;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      // If it's not valid JSON, return it as raw text
      responseData = { raw: responseText };
    }

    console.log('✅ Webhook response received:', responseData);
    return responseData;
  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    // Check if it's a timeout or network error
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      throw new Error(`Webhook request timed out. Please ensure the respond node is connected in n8n.`);
    }
    throw new Error(`Failed to send data to webhook: ${error.message}`);
  }
}

