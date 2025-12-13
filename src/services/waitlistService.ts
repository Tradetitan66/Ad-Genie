// Waitlist service for submitting waitlist form data to n8n webhook
const WAITLIST_WEBHOOK_URL = 'https://n8n.srv1004168.hstgr.cloud/webhook/7b3e5a0d-1466-4a6a-a60e-b4c2f98b3bd1';
//const WAITLIST_WEBHOOK_URL = 'https://n8n.srv1004168.hstgr.cloud/webhook-test/7b3e5a0d-1466-4a6a-a60e-b4c2f98b3bd1';
//const WAITLIST_WEBHOOK_URL = 'https://n8n.srv1114357.hstgr.cloud/webhook/da5b80b8-dbc3-4b2a-8df6-ca86340a106c';
const WAITLIST_WEBHOOK_URL = 'https://n8n.srv1114357.hstgr.cloud/webhook/27850a35-32bc-438c-b194-a5b86e192820';


export interface WaitlistFormData {
  fullName: string;
  mobileNumber: string;
  email: string;
  inspiration: string;
  linkedinProfile?: string;
}

export const waitlistService = {
  /**
   * Submit waitlist form data to webhook
   * Tries JSON first, then falls back to form-data if needed
   */
  async submitWaitlistForm(data: WaitlistFormData): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('📤 Submitting waitlist form to webhook:', WAITLIST_WEBHOOK_URL);
      console.log('📋 Form data:', JSON.stringify(data, null, 2));

      // Try JSON format first
      let response = await fetch(WAITLIST_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log('📥 Webhook response status:', response.status, response.statusText);

      // If JSON fails with 415 (Unsupported Media Type) or 400, try form-data
      if (!response.ok && (response.status === 415 || response.status === 400)) {
        console.log('⚠️ JSON format failed, trying form-data format...');
        
        // Convert to form-data
        const formData = new FormData();
        formData.append('fullName', data.fullName);
        formData.append('mobileNumber', data.mobileNumber);
        formData.append('email', data.email);
        formData.append('inspiration', data.inspiration);
        if (data.linkedinProfile) {
          formData.append('linkedinProfile', data.linkedinProfile);
        }

        response = await fetch(WAITLIST_WEBHOOK_URL, {
          method: 'POST',
          body: formData,
        });
        console.log('📥 Form-data response status:', response.status, response.statusText);
      }

      // Try to get response text for better error messages
      const responseText = await response.text();
      console.log('📥 Webhook response body:', responseText);

      if (!response.ok) {
        let errorMessage = `Webhook request failed with status ${response.status}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If not JSON, use the text response
          if (responseText) {
            errorMessage = `${errorMessage}: ${responseText.substring(0, 200)}`;
          }
        }
        throw new Error(errorMessage);
      }

      // Try to parse response as JSON if possible
      try {
        const responseData = JSON.parse(responseText);
        console.log('✅ Webhook response parsed:', responseData);
      } catch {
        // Response might not be JSON, that's okay
        console.log('✅ Webhook responded successfully (non-JSON response)');
      }

      return { success: true };
    } catch (error: any) {
      console.error('❌ Error submitting waitlist form:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });

      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        return {
          success: false,
          message: 'Network error: Unable to reach the server. Please check your internet connection and try again.',
        };
      }

      // Handle timeout errors
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        return {
          success: false,
          message: 'Request timed out. Please try again.',
        };
      }

      return {
        success: false,
        message: error.message || 'Failed to submit form. Please try again.',
      };
    }
  },
};

