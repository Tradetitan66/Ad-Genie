// OpenAI service for generating AI-powered event suggestions

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export interface EventSuggestion {
  name: string;
  date?: string;
  description?: string;
}

/**
 * Generate event suggestions using OpenAI API
 * @param industry - Industry from brand profile (e.g., "Fashion", "Food & Beverage")
 * @param market - Market type from content selection (e.g., "Local (India)", "International")
 * @param eventType - Type of events to generate ("local" or "international")
 * @returns Array of event names as strings
 */
export async function generateEventSuggestions(
  industry: string,
  market: string,
  eventType: 'local' | 'international'
): Promise<string[]> {
  // Check if API key is configured
  if (!OPENAI_API_KEY || 
      OPENAI_API_KEY === 'your_openai_api_key_here' || 
      OPENAI_API_KEY.trim() === '' ||
      OPENAI_API_KEY.length < 20) {
    console.error('OpenAI API key check failed:', {
      hasKey: !!OPENAI_API_KEY,
      keyLength: OPENAI_API_KEY?.length || 0,
      keyValue: OPENAI_API_KEY ? `${OPENAI_API_KEY.substring(0, 7)}...` : 'undefined'
    });
    throw new Error('OpenAI API key is not configured. Please add VITE_OPENAI_API_KEY to your .env file and restart the dev server.');
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Determine market context for prompt
  let marketContext = '';
  if (market === 'Local (India)') {
    marketContext = 'Local India - Focus on Indian festivals, regional celebrations, and local events';
  } else if (market === 'Regional (Specific States/Regions)') {
    marketContext = 'Regional India - Focus on state-specific festivals, regional celebrations, and local cultural events';
  } else if (market === 'International') {
    marketContext = 'International - Focus on global holidays, international shopping events, and worldwide celebrations';
  } else {
    marketContext = 'Global - Focus on major global holidays, international events, and worldwide celebrations';
  }

  const eventTypeContext = eventType === 'local' 
    ? 'local Indian festivals, regional celebrations, and cultural events'
    : 'international holidays, global shopping events, and worldwide celebrations';

  const prompt = `You are an expert in festivals, events, and cultural celebrations worldwide.

Given:
- Industry: ${industry}
- Market: ${marketContext}
- Event Type: ${eventTypeContext}
- Current Date: ${currentDate}

Generate a list of 10-15 relevant upcoming festivals, events, or celebrations that would be suitable for marketing campaigns in the ${industry} industry for the ${market} market.

For local events: Focus on Indian festivals, regional celebrations, and local events that are relevant to the ${industry} industry.
For international events: Focus on global holidays, international shopping events, and worldwide celebrations that are relevant to the ${industry} industry.

Consider:
- Industry-specific events (e.g., fashion industry → fashion weeks, fashion festivals)
- Market-specific events (India → Diwali, Holi; International → Black Friday, Valentine's Day)
- Upcoming events based on the current date
- Events that would be suitable for marketing campaigns

Return ONLY a JSON array of event names as strings, like: ["Diwali", "Holi", "Eid", "Christmas"]
Do not include any explanations, descriptions, or additional text. Only return the JSON array.`;

  try {
    console.log('🤖 Calling OpenAI API for event suggestions...', { industry, market, eventType });

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates lists of festivals and events as JSON arrays. Always return only valid JSON arrays of strings.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from OpenAI API');
    }

    // Parse the JSON array from the response
    // The response might be wrapped in markdown code blocks or have extra text
    let cleanedContent = content.trim();
    
    // Remove markdown code blocks if present
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/```\n?/g, '');
    }

    // Try to extract JSON array from the content
    const jsonMatch = cleanedContent.match(/\[.*\]/s);
    if (jsonMatch) {
      cleanedContent = jsonMatch[0];
    }

    const events = JSON.parse(cleanedContent);

    if (!Array.isArray(events)) {
      throw new Error('OpenAI API did not return a valid array');
    }

    // Filter out any non-string values and ensure all are strings
    const eventNames = events
      .filter(event => typeof event === 'string' && event.trim().length > 0)
      .map(event => event.trim());

    console.log('✅ OpenAI suggestions received:', eventNames);
    return eventNames;

  } catch (error: any) {
    console.error('❌ OpenAI API error:', error);
    
    // Provide helpful error messages
    if (error.message.includes('API key')) {
      throw new Error('OpenAI API key is not configured. Please add VITE_OPENAI_API_KEY to your .env file.');
    } else if (error.message.includes('rate limit')) {
      throw new Error('OpenAI API rate limit exceeded. Please try again later.');
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      throw new Error('Network error. Please check your internet connection and try again.');
    } else {
      throw new Error(`Failed to generate suggestions: ${error.message}`);
    }
  }
}

