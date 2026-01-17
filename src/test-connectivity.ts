/**
 * Watchit API Connectivity Test
 * Run this to test if the Watchit API is reachable
 */

// Simple direct test without imports
const WATCHIT_CONFIG = {
  token: process.env.WATCHIT_API_TOKEN,
  dgst: process.env.WATCHIT_DGST,
  deviceId: process.env.WATCHIT_DEVICE_ID,
  baseUrl: "https://api.watchit.com/api",
};

function getHeaders() {
  return {
    accept: "application/json",
    authorization: `Bearer ${WATCHIT_CONFIG.token}`,
    dgst: WATCHIT_CONFIG.dgst!,
    applicationversion: "5.45.0.1099",
    deviceid: WATCHIT_CONFIG.deviceId!,
    deviceos: "Web",
    "service-code": "1766070793641",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) NextJS/Server",
  };
}

async function testWatchitConnectivity() {
  console.log('🔍 Testing Watchit API Connectivity...');
  console.log('=====================================');
  
  try {
    // Test 1: Environment Variables
    console.log('1. Checking environment variables...');
    const hasToken = !!process.env.WATCHIT_API_TOKEN;
    const hasDgst = !!process.env.WATCHIT_DGST;
    const hasDeviceId = !!process.env.WATCHIT_DEVICE_ID;
    
    console.log(`   - WATCHIT_API_TOKEN: ${hasToken ? '✅ SET' : '❌ MISSING'}`);
    console.log(`   - WATCHIT_DGST: ${hasDgst ? '✅ SET' : '❌ MISSING'}`);
    console.log(`   - WATCHIT_DEVICE_ID: ${hasDeviceId ? '✅ SET' : '❌ MISSING'}`);
    
    if (!hasToken || !hasDgst || !hasDeviceId) {
      throw new Error('Missing required environment variables');
    }
    
    // Test 2: Basic connectivity
    console.log('\\n2. Testing basic connectivity to api.watchit.com...');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch('https://api.watchit.com', {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      console.log(`   - Connection: ✅ SUCCESS (Status: ${response.status})`);
    } catch (error: any) {
      console.log(`   - Connection: ❌ FAILED (${error.message})`);
      if (error.name === 'AbortError') {
        console.log('     Reason: Request timed out after 10 seconds');
      }
    }
    
    // Test 3: Search API (lightweight test)
    console.log('\\n3. Testing Watchit search API...');
    try {
      const controller3 = new AbortController();
      const timeoutId3 = setTimeout(() => controller3.abort(), 15000); // 15s timeout
      
      const searchUrl = `${WATCHIT_CONFIG.baseUrl}/v3/search?keyword=test`;
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: getHeaders(),
        signal: controller3.signal,
      });
      
      clearTimeout(timeoutId3);
      
      if (response.ok) {
        console.log('   - Search API: ✅ SUCCESS');
        const data = await response.json();
        console.log(`     Response type: ${typeof data}`);
      } else {
        console.log(`   - Search API: ❌ HTTP ERROR (${response.status} ${response.statusText})`);
      }
    } catch (error: any) {
      console.log('   - Search API: ❌ FAILED');
      console.log(`     Error: ${error.name} - ${error.message}`);
      if (error.name === 'AbortError') {
        console.log('     Reason: Request timed out after 15 seconds');
      }
    }
    
    console.log('\\n✅ Connectivity test completed');
    
  } catch (error: any) {
    console.error('\\n❌ Connectivity test failed:', error.message);
  }
}

// Run the test if this file is executed directly
testWatchitConnectivity();