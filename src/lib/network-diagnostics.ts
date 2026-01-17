/**
 * Network Diagnostics for Video Download Issues
 * 
 * Common causes of slow video segment downloads:
 * 1. Browser DevTools Network Throttling
 * 2. CDN Rate Limiting 
 * 3. Browser Extensions
 * 4. ISP Throttling
 * 5. Poor Network Connection
 */

export const DOWNLOAD_DIAGNOSTICS = {
  // Check for common issues causing slow downloads
  diagnose: () => {
    console.group('🔍 Video Download Diagnostics');
    
    // Check 1: Browser DevTools Throttling
    if ((navigator as any).connection) {
      const connection = (navigator as any).connection;
      console.log('Network Information:');
      console.log(`- Connection Type: ${connection.effectiveType || 'unknown'}`);
      console.log(`- Downlink Speed: ${connection.downlink || 'unknown'}Mbps`);
      console.log(`- RTT: ${connection.rtt || 'unknown'}ms`);
      
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        console.warn('⚠️ BROWSER THROTTLING DETECTED!');
        console.log('Check: Chrome DevTools > Network tab > Throttling dropdown');
      }
    }
    
    // Check 2: User Agent (some CDNs throttle based on UA)
    console.log('User Agent:', navigator.userAgent);
    
    // Check 3: Connection test
    const testUrl = 'https://httpbin.org/json';
    const startTime = performance.now();
    
    fetch(testUrl, { cache: 'no-cache' })
      .then(response => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        console.log(`Test download (${testUrl}):`);
        console.log(`- Status: ${response.status}`);
        console.log(`- Time: ${duration.toFixed(2)}ms`);
        
        if (duration > 5000) {
          console.warn('⚠️ SLOW GENERAL NETWORK DETECTED!');
          console.log('This suggests overall network issues, not just video');
        }
        
        return response.json();
      })
      .then(data => {
        console.log('- Test successful');
      })
      .catch(error => {
        console.error('❌ Network test failed:', error.message);
      });
    
    console.groupEnd();
  },
  
  // Common solutions for slow downloads
  solutions: [
    {
      issue: 'Browser DevTools Throttling',
      solution: 'Open DevTools > Network tab > Check throttling dropdown is set to "No throttling"',
      probability: 'High'
    },
    {
      issue: 'CDN Rate Limiting',
      solution: 'CDN (Brightcove/Fastly) may be limiting download speed per IP',
      probability: 'Medium'
    },
    {
      issue: 'Browser Extension',
      solution: 'Try incognito/private mode to disable extensions',
      probability: 'Medium'
    },
    {
      issue: 'ISP Throttling',
      solution: 'ISP may be throttling video traffic. Try VPN or different network',
      probability: 'Low'
    },
    {
      issue: 'Poor Connection',
      solution: 'Check internet speed with speedtest.net',
      probability: 'Low'
    }
  ]
};

// Export function to run diagnostics
export const runVideoNetworkDiagnostics = () => {
  DOWNLOAD_DIAGNOSTICS.diagnose();
  
  console.group('📋 Potential Solutions');
  DOWNLOAD_DIAGNOSTICS.solutions.forEach((item, index) => {
    console.log(`${index + 1}. ${item.issue} (${item.probability} probability)`);
    console.log(`   Solution: ${item.solution}`);
  });
  console.groupEnd();
};