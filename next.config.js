
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Non-dot build output folder so it isn't hidden by default in cPanel's
  // File Manager (and similar GUIs) after extracting the deploy zip.
  distDir: 'next-build',
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    ppr: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
