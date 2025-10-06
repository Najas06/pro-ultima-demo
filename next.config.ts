import type { NextConfig } from "next";
import withPWA from '@ducanh2912/next-pwa';

const nextConfig: NextConfig = {
  /* config options here */
};

const config = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: {
    disableDevLogs: true,
    skipWaiting: true,
  },
})(nextConfig);

export default config;
