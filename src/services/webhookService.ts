// Webhook service for sending brand data to n8n
const WEBHOOK_URL = 'https://n8n.srv1004168.hstgr.cloud/webhook-test/07be41b0-cf9a-4cc3-8ba8-1fcc9652be51';

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
  campaign_market?: string; // Target market for the campaign (Local, Regional, International, Global)
  brand_voice?: string;
  visual_styles?: string[];
  campaign_timing?: string;
  seasonal_events?: {
    local?: string[];
    international?: string[];
  };
}

export async function sendBrandDataToWebhook(data: BrandWebhookData): Promise<void> {
  try {
    console.log('📤 Sending brand data to webhook:', WEBHOOK_URL);
    console.log('📋 Data:', JSON.stringify(data, null, 2));

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Webhook failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const responseData = await response.json().catch(() => ({}));
    console.log('✅ Webhook response:', responseData);
  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    throw new Error(`Failed to send data to webhook: ${error.message}`);
  }
}

