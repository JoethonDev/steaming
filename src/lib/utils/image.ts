/**
 * Image utility functions for handling external CDN images
 */

/**
 * Converts an external image URL to use our image proxy
 */
export function getProxiedImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  
  // If it's already a proxy URL, return as is
  if (imageUrl.startsWith('/api/image/proxy')) {
    return imageUrl;
  }
  
  // If it's a relative URL, return as is
  if (imageUrl.startsWith('/')) {
    return imageUrl;
  }
  
  // Convert external URL to proxy URL
  return `/api/image/proxy?url=${encodeURIComponent(imageUrl)}`;
}

/**
 * Extracts the best image URL from Watchit content_images structure
 */
export function extractBestImageUrl(contentImages: any, preferSmall: boolean = false): string | null {
  if (!contentImages) return null;
  
  // Priority order for image selection
  const imageTypes = ['ORIGINAL', 'VERTICAL_LG', 'VERTICAL_SM', 'HORIZONTAL_LG', 'HORIZONTAL_SM'];
  
  for (const type of imageTypes) {
    const imageData = contentImages[type];
    if (imageData) {
      // Choose size based on preference
      if (preferSmall && imageData.SM) {
        return imageData.SM;
      }
      if (imageData.MD) {
        return imageData.MD;
      }
      if (imageData.SM) {
        return imageData.SM;
      }
      if (imageData.LG) {
        return imageData.LG;
      }
    }
  }
  
  return null;
}