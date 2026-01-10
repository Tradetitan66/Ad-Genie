// Waitlist service for submitting waitlist form data to n8n webhook
// Webhook URL can be configured via environment variable VITE_WAITLIST_WEBHOOK_URL
const WAITLIST_WEBHOOK_URL = import.meta.env.VITE_WAITLIST_WEBHOOK_URL ||
  'https://n8n.srv1004168.hstgr.cloud/webhook/7b3e5a0d-1466-4a6a-a60e-b4c2f98b3bd1';


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
   * Includes timeout handling, CORS support, and retry logic
   */
  async submitWaitlistForm(data: WaitlistFormData, retryCount = 0): Promise<{ success: boolean; message?: string }> {
    // Validate webhook URL
    if (!WAITLIST_WEBHOOK_URL || WAITLIST_WEBHOOK_URL.includes('placeholder')) {
      return {
        success: false,
        message: 'Waitlist webhook URL is not configured. Please check your environment variables.',
      };
    }

    try {
      console.log('📤 Submitting waitlist form to webhook:', WAITLIST_WEBHOOK_URL);
      console.log('📋 Form data:', JSON.stringify(data, null, 2));

      // Create AbortController for timeout handling (30 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      // Try JSON format first
      let response: Response;
      try {
        response = await fetch(WAITLIST_WEBHOOK_URL, {
          method: 'POST',
          mode: 'cors', // Explicitly set CORS mode
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(data),
          signal: controller.signal, // Add timeout signal
        });
        clearTimeout(timeoutId); // Clear timeout if request succeeds
      } catch (fetchError: any) {
        clearTimeout(timeoutId); // Clear timeout on error
        throw fetchError; // Re-throw to be handled below
      }

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

        // Create new AbortController for form-data request
        const formDataController = new AbortController();
        const formDataTimeoutId = setTimeout(() => formDataController.abort(), 30000);

        try {
          response = await fetch(WAITLIST_WEBHOOK_URL, {
            method: 'POST',
            mode: 'cors', // Explicitly set CORS mode
            body: formData,
            signal: formDataController.signal, // Add timeout signal
          });
          clearTimeout(formDataTimeoutId); // Clear timeout if request succeeds
        } catch (formDataError: any) {
          clearTimeout(formDataTimeoutId); // Clear timeout on error
          throw formDataError; // Re-throw to be handled below
        }
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
        webhookUrl: WAITLIST_WEBHOOK_URL,
        retryCount,
      });

      // Handle timeout errors
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        // Retry once for timeout errors
        if (retryCount < 1) {
          console.log('🔄 Retrying waitlist submission after timeout (attempt 2/2)...');
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          return this.submitWaitlistForm(data, retryCount + 1);
        }
        return {
          success: false,
          message: 'Request timed out after 30 seconds. Please check your internet connection and try again.',
        };
      }

      // Handle network errors with retry logic
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        // Check if it's likely a CORS issue
        if (error.message.includes('CORS') || error.message.includes('cross-origin') || error.message.includes('Access-Control')) {
          return {
            success: false,
            message: 'CORS error: The webhook server is not allowing requests from this domain. Please contact support.',
          };
        }
        
        // Retry once for general network errors
        if (retryCount < 1) {
          console.log('🔄 Retrying waitlist submission after network error (attempt 2/2)...');
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          return this.submitWaitlistForm(data, retryCount + 1);
        }
        
        return {
          success: false,
          message: `Network error: Unable to reach the webhook server at ${WAITLIST_WEBHOOK_URL}. Please check your internet connection and verify the webhook URL is correct.`,
        };
      }

      // Handle server errors (4xx, 5xx) - don't retry these
      if (error.message && (error.message.includes('status 4') || error.message.includes('status 5'))) {
        return {
          success: false,
          message: error.message || 'Server error: The webhook server returned an error. Please try again later.',
        };
      }

      // Generic error fallback
      return {
        success: false,
        message: error.message || 'Failed to submit form. Please try again.',
      };
    }
  },
};

