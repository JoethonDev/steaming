import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  
  // Enable experimental features for better performance
  experimental: {
  },

  // Turbopack configuration (empty to silence warning)
  turbopack: {},

  // Security headers required for FFmpeg.wasm SharedArrayBuffer
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
          {
            key: "Cross-Origin-Opener-Policy", 
            value: "same-origin",
          },
          // Allow SharedArrayBuffer for FFmpeg.wasm
          {
            key: "Cross-Origin-Resource-Policy",
            value: "cross-origin",
          },
        ],
      },
    ];
  },

  // Image optimization for series posters and thumbnails
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // Webpack configuration for media processing libraries
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    
    return config;
  },
};

export default nextConfig;
