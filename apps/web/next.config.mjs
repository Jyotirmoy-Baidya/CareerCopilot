/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    // Needed so Next.js includes shared workspace packages in the standalone bundle
    outputFileTracingRoot: '../../',
  },
};

export default nextConfig;
