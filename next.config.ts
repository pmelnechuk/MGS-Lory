import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ipcfqxmobwltohdvzzak.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // @ts-ignore - buildActivity is valid but types might be outdated
  devIndicators: {
    buildActivity: false,
  },
};

export default nextConfig;
