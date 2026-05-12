/** @type {import('next').NextConfig} */
<<<<<<< HEAD
const path = require('path');

const nextConfig = {
  // Fix workspace root warning on Vercel
  outputFileTracingRoot: path.join(__dirname, '../'),
=======
const path = require("path");

const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname),
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
>>>>>>> fix/system-recovery-cleanup
};

module.exports = nextConfig;
