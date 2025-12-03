// Vercel Edge Function for Receipt Scanning
// Uses Claude Vision API for intelligent receipt processing
// Extracts merchant, amount, date, and suggests category
// Version 1.1 - Upgraded to Sonnet

export const config = {
  runtime: 'edge',
};

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// ============================================
// RATE LIMITING (Simple in-memory for Edge)
// ============================================

const RATE_LIMIT = {
  maxRequests: 10,      // Fewer requests for vision (more expensive)
  windowMs: 60 * 1000,  // 1 minute window
};

const rateLimitStore = new Map();

function checkRateLimit(userId) {
  const now = Date.now();
  const key = `rl:receipt:${userId}`;
  
  let record = rateLimitStore.get(key);
  
  if (record && record.resetAt <= now) {
    rateLimitStore.delete(key);
    record = null;
  }
  
  if (!record) {
    record = {
      count: 1,
      resetAt: now + RATE_LIMIT.windowMs,
    };
    rateLimitStore.set(key, record);
    
    return {
      allowed: true,
      remaining: RATE_LIMIT.maxRequests - 1,
      resetAt: record.resetAt,
    };
  }
  
  record.count++;
  
  if (record.count > RATE_LIMIT.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt,
    };
  }
  
  return {
    allowed: true,
    remaining: RATE_LIMIT.maxRequests - record.count,
    resetAt: record.resetAt,
  };
}

// ============================================
// RECEIPT PROCESSING PROMPT
// ============================================

const RECEIPT_ANALYSIS_PROMPT = `You are an expert receipt analyzer. Examine this receipt image and extract the following information.

Return ONLY a valid JSON object with this exact structure:
{
  "merchant": "Name of the store/vendor (or null if unreadable)",
  "amount": 12.50,
  "currency": "GBP",
  "date": "2025-12-01",
  "items": [
    {"name": "Item description", "quantity": 1, "price": 5.00}
  ],
  "paymentMethod": "card|cash|unknown",
  "category": "Travel|Accommodation|Sustenance",
  "confidence": 0.85,
  "rawText": "All visible text from the receipt"
}

IMPORTANT RULES:
1. "amount" must be a number (not a string), use null if unreadable
2. "date" must be in YYYY-MM-DD format, use null if unreadable
3. "currency" should default to "GBP" unless clearly stated otherwise
4. "category" must be one of: "Travel", "Accommodation", or "Sustenance"
   - Travel: Transport, fuel, parking, flights, trains, taxis, car hire
   - Accommodation: Hotels, lodging, B&B, Airbnb
   - Sustenance: Food, drinks, restaurants, cafes, supermarkets
5. "confidence" is your certainty about the extraction (0.0 to 1.0)
   - 0.9-1.0: Crystal clear receipt, all data visible
   - 0.7-0.89: Most data clear, some assumptions made
   - 0.5-0.69: Partial data, several assumptions
   - Below 0.5: Poor quality, significant guessing
6. "items" can be empty array if individual items aren't visible
7. "rawText" should include key text you can read (limited to 500 chars)

Return ONLY the JSON object, no markdown formatting, no explanation.`;

// ============================================
// MAIN HANDLER
// ============================================

export default async function handler(req) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check for API key
  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { image, userId } = body;

    // Validate image data
    if (!image || !image.data || !image.mediaType) {
      return new Response(JSON.stringify({ 
        error: 'Invalid image data. Requires {data: base64, mediaType: string}' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate media type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(image.mediaType)) {
      return new Response(JSON.stringify({ 
        error: 'Unsupported image type. Use JPEG, PNG, WebP, or GIF.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check rate limit
    const userIdentifier = userId || req.headers.get('x-forwarded-for')?.split(',')[0] || 'anonymous';
    const rateLimit = checkRateLimit(userIdentifier);
    
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded. Please wait before scanning another receipt.',
        retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
      }), {
        status: 429,
        headers: { 
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
        },
      });
    }

    // Call Claude Vision API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929', // High-quality vision model (Claude 4.5 Sonnet)
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: image.mediaType,
                  data: image.data,
                },
              },
              {
                type: 'text',
                text: RECEIPT_ANALYSIS_PROMPT,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude Vision API error:', errorText);
      return new Response(JSON.stringify({ 
        error: 'Failed to process receipt image' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const responseText = data.content[0].text;

    // Parse the JSON response from Claude
    let extractedData;
    try {
      // Remove any potential markdown code blocks
      let cleanedResponse = responseText.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.slice(7);
      }
      if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.slice(3);
      }
      if (cleanedResponse.endsWith('```')) {
        cleanedResponse = cleanedResponse.slice(0, -3);
      }
      
      extractedData = JSON.parse(cleanedResponse.trim());
    } catch (parseError) {
      console.error('Failed to parse Claude response:', responseText);
      // Return a partial result with raw text
      extractedData = {
        merchant: null,
        amount: null,
        currency: 'GBP',
        date: null,
        items: [],
        paymentMethod: 'unknown',
        category: null,
        confidence: 0.3,
        rawText: responseText.substring(0, 500),
        parseError: true,
      };
    }

    // Validate and sanitize the extracted data
    const result = {
      merchant: typeof extractedData.merchant === 'string' ? extractedData.merchant : null,
      amount: typeof extractedData.amount === 'number' ? extractedData.amount : null,
      currency: extractedData.currency || 'GBP',
      date: validateDate(extractedData.date) ? extractedData.date : null,
      items: Array.isArray(extractedData.items) ? extractedData.items : [],
      paymentMethod: extractedData.paymentMethod || 'unknown',
      category: validateCategory(extractedData.category) ? extractedData.category : null,
      confidence: typeof extractedData.confidence === 'number' 
        ? Math.min(1, Math.max(0, extractedData.confidence)) 
        : 0.5,
      rawText: typeof extractedData.rawText === 'string' 
        ? extractedData.rawText.substring(0, 500) 
        : null,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': String(rateLimit.remaining),
      },
    });

  } catch (error) {
    console.error('Receipt scan API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function validateDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

function validateCategory(category) {
  const validCategories = ['Travel', 'Accommodation', 'Sustenance'];
  return validCategories.includes(category);
}
