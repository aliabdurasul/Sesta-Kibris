/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  // Fix workspace root warning on Vercel
  outputFileTracingRoot: path.join(__dirname, '../'),
};

module.exports = nextConfig;
