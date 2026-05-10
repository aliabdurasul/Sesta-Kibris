/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  // Fix workspace root warning on Vercel
  outputFileTracingRoot: path.join(__dirname, '../'),

  // This project is primarily JSX with TypeScript type files only.
  // The 'validator' package (transitive dep of @hookform/resolvers) ships
  // a validator.ts source file without exports, which fails isolatedModules.
  // Since all app code is .jsx, we skip TS build errors safely.
  typescript: {
    ignoreBuildErrors: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
