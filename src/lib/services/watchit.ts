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
};

export const watchitService = {
    async searchSeries(keyword: string) {
      const url = `${WATCHIT_CONFIG.baseUrl}/v3/search?keyword=${encodeURIComponent(keyword)}`;
      const response = await fetch(url, {
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
        throw new Error(`Watchit Search API Error: ${response.status}`);
      }
      return response.json();
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
    const url = `${WATCHIT_CONFIG.baseUrl}/series?series_id=${seriesId}`;
    console.log("Fetching Watchit metadata for series:", url);
    const response = await fetch(url, {
      headers: this.getHeaders(),
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Watchit API Error: ${response.status}`);
    }

    return response.json();
  },

  async fetchEpisodes(seriesId: string, seasonId: string) {
    const url = `${WATCHIT_CONFIG.baseUrl}/series/seasons/episodes?series_id=${seriesId}&season_id=${seasonId}`;
    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Watchit Episode API Error: ${response.status}`);
    }

    return response.json();
  },
};
