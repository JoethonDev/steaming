  // ...existing code...
/**
 * Watchit Server-Side Service
 * Handles API handshakes and metadata fetching using environment secrets.
 * This replaces the client-side logic and removes the need for a CORS proxy.
 */

const WATCHIT_CONFIG = {
  token: process.env.WATCHIT_API_TOKEN,
  dgst: process.env.WATCHIT_DGST,
  deviceId: process.env.WATCHIT_DEVICE_ID,
  version: "5.45.0.1099",
  serviceCode: "1766070793641",
  baseUrl: "https://api.watchit.com/api",
  timeout: 60000, // 60 seconds (increased from 30s)
  retries: 3,
  retryDelay: 2000, // 2 seconds (increased from 1s)
};

// Validate required environment variables
function validateConfig() {
  const requiredVars = [
    { key: 'WATCHIT_API_TOKEN', value: WATCHIT_CONFIG.token },
    { key: 'WATCHIT_DGST', value: WATCHIT_CONFIG.dgst },
    { key: 'WATCHIT_DEVICE_ID', value: WATCHIT_CONFIG.deviceId }
  ];

  console.log('Environment variables status:');
  requiredVars.forEach(v => {
    console.log(`- ${v.key}: ${v.value ? 'SET' : 'MISSING'}`);
  });

  const missing = requiredVars.filter(v => !v.value);
  if (missing.length > 0) {
    const missingVars = missing.map(v => v.key).join(', ');
    throw new Error(`Missing required environment variables: ${missingVars}. Please check your .env.local file.`);
  }
}

// Helper function for fetch with timeout and retry
async function fetchWithTimeoutAndRetry(
  url: string, 
  options: RequestInit = {}, 
  retries: number = WATCHIT_CONFIG.retries
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.log(`Request to ${url} timed out after ${WATCHIT_CONFIG.timeout}ms`);
    controller.abort();
  }, WATCHIT_CONFIG.timeout);

  try {
    console.log(`Attempting request to ${url} (${retries + 1} attempts left)`);
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    console.log(`Request successful to ${url}`);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    console.error(`Request failed to ${url}:`, {
      name: error?.name,
      code: error?.code,
      message: error?.message,
      cause: error?.cause?.code,
      retriesLeft: retries
    });
    
    // Check for various timeout/network error conditions
    const isTimeoutError = 
      error?.name === 'AbortError' ||
      error?.code === 'ETIMEDOUT' ||
      error?.cause?.code === 'ETIMEDOUT' ||
      error?.message?.includes('timeout') ||
      error?.message?.includes('ETIMEDOUT');
      
    const isNetworkError = 
      error?.code === 'ECONNREFUSED' ||
      error?.code === 'ENOTFOUND' ||
      error?.code === 'ECONNRESET' ||
      error?.message?.includes('fetch failed') ||
      error?.name === 'TypeError';
    
    // Retry on timeout or network errors
    if (retries > 0 && (isTimeoutError || isNetworkError)) {
      const delay = WATCHIT_CONFIG.retryDelay * (WATCHIT_CONFIG.retries - retries + 1); // Exponential backoff
      console.log(`Retrying request to ${url} in ${delay}ms... (${retries} attempts left)`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithTimeoutAndRetry(url, options, retries - 1);
    }
    
    // No more retries or non-retryable error
    throw error;
  }
}

export const watchitService = {
    async searchSeries(keyword: string) {
      try {
        validateConfig();
        
        const url = `${WATCHIT_CONFIG.baseUrl}/v3/search?keyword=${encodeURIComponent(keyword)}`;
        console.log(`Searching Watchit for keyword: ${keyword}`);
        
        const response = await fetchWithTimeoutAndRetry(url, {
          method: 'GET',
          headers: {
            ...this.getHeaders(),
            'accept-language': 'en-US,en;q=0.6',
            'cache-control': 'no-cache',
            'content-type': 'application/json',
            'lang': 'en',
            'origin': 'https://www.watchit.com',
            'pragma': 'no-cache',
            'priority': 'u=1, i',
            'referer': 'https://www.watchit.com/',
            'sec-ch-ua': '"Brave";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site',
            'sec-gpc': '1',
            'x_c_id': '69',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Watchit Search API Error: ${response.status} ${response.statusText}`);
        }
        
        console.log(`Watchit search successful`);
        return await response.json();
      } catch (error) {
        console.error('Search API Error:', error);
        throw new Error(`Failed to search Watchit: ${error instanceof Error ? error.message : 'Network error'}`);
      }
  },
  
  getHeaders() {
    return {
      accept: "application/json",
      authorization: `Bearer ${WATCHIT_CONFIG.token}`,
      dgst: WATCHIT_CONFIG.dgst!,
      applicationversion: WATCHIT_CONFIG.version,
      deviceid: WATCHIT_CONFIG.deviceId!,
      deviceos: "Web",
      "service-code": WATCHIT_CONFIG.serviceCode,
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) NextJS/Server",
    };
  },

  async fetchSeriesMetadata(seriesId: string) {
    try {
      validateConfig();
      
      const url = `${WATCHIT_CONFIG.baseUrl}/series?series_id=${seriesId}`;
      console.log("Fetching Watchit metadata for series:", url);
      
      const response = await fetchWithTimeoutAndRetry(url, {
        headers: this.getHeaders(),
        next: { revalidate: 3600 }, // Cache for 1 hour
      });

      if (!response.ok) {
        throw new Error(`Watchit API Error: ${response.status} ${response.statusText}`);
      }

      console.log(`Series metadata fetched successfully for series ${seriesId}`);
      return await response.json();
    } catch (error) {
      console.error('Series API Error:', error);
      throw new Error(`Failed to fetch series metadata: ${error instanceof Error ? error.message : 'Network error'}`);
    }
  },

  async fetchEpisodes(seriesId: string, seasonId: string) {
    try {
      validateConfig();
      
      const url = `${WATCHIT_CONFIG.baseUrl}/series/seasons/episodes?series_id=${seriesId}&season_id=${seasonId}`;
      console.log(`Fetching episodes for series ${seriesId}, season ${seasonId}`);
      console.log(`API URL: ${url}`);
      
      const response = await fetchWithTimeoutAndRetry(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error(`API returned error: ${response.status} ${response.statusText} - ${errorText}`);
        throw new Error(`Watchit Episodes API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`Episodes fetched successfully for series ${seriesId}, season ${seasonId}: ${data?.items?.length || 0} episodes`);
      return data;
    } catch (error) {
      console.error('Episodes API Error:', error);
      
      // Provide more specific error messages based on error type
      if (error instanceof Error) {
        if (error.message.includes('Missing required environment variables')) {
          throw new Error(`Configuration error: ${error.message}`);
        }
        
        if (error.name === 'AbortError' || error.message.includes('timeout')) {
          throw new Error(`The Watchit API is taking too long to respond (${WATCHIT_CONFIG.timeout/1000}s timeout). This might be due to:\n- High server load at Watchit\n- Network connectivity issues\n- API rate limiting\n\nPlease try again in a few moments.`);
        }
        
        if (error.message.includes('ETIMEDOUT') || error.message.includes('fetch failed')) {
          throw new Error(`Network connection failed: Could not reach Watchit servers. This might be due to:\n- Internet connectivity issues\n- Firewall blocking the connection\n- Watchit servers temporarily unavailable\n\nPlease check your internet connection and try again.`);
        }
        
        if (error.message.includes('ECONNREFUSED')) {
          throw new Error(`Connection refused: Watchit servers are not accepting connections. The service may be temporarily down.`);
        }
        
        if (error.message.includes('ENOTFOUND')) {
          throw new Error(`DNS resolution failed: Could not find Watchit API servers. Please check your DNS settings.`);
        }
        
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          throw new Error(`Authentication failed: Invalid API credentials. Please check your WATCHIT_API_TOKEN and other credentials in .env.local`);
        }
        
        if (error.message.includes('403') || error.message.includes('Forbidden')) {
          throw new Error(`Access forbidden: Your API credentials don't have permission to access this resource.`);
        }
        
        if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
          throw new Error(`Rate limit exceeded: Too many requests to Watchit API. Please wait a moment and try again.`);
        }
      }
      
      throw new Error(`Failed to fetch episodes: ${error instanceof Error ? error.message : 'Unknown network error'}`);
    }
  },
};
