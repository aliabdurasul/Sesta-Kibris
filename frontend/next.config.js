/** @type {import('next').NextConfig} */
const nextConfig = {
  // Silence the workspace root warning from Vercel
  experimental: {
    outputFileTracingRoot: require('path').join(__dirname, '../'),
  },
  // Ensure TypeScript errors don't block production builds for JS-heavy projects
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
