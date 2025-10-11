import type { NextConfig } from "next";
import withPWA from '@ducanh2912/next-pwa';

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Increase limit to 10MB for image uploads
    },
  },
  images:{
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*',
      },
    ],
  },
  // Disable static optimization for pages using IndexedDB
  eslint: {
    ignoreDuringBuilds: true, // Ignore ESLint warnings during build
  },
};

const config = withPWA({
  dest: "public",
  disable: false, // Enable PWA in all modes
  register: true,
  workboxOptions: {
    disableDevLogs: true,
    skipWaiting: true,
  },
})(nextConfig);

export default config;
