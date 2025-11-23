
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'i.postimg.cc',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'pzumvjwhbpeygatbwskt.supabase.co'
      },
      {
        protocol: 'https',
        hostname: 'svrphclxvycrfyplqszt.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'tse4.mm.bing.net',
      }
    ],
  },
};

export default nextConfig;
