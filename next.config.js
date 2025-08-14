/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse'],
  },
  output: 'standalone',
  images: {
    domains: ['localhost'],
  },
  env: {
    GOOGLE_GEMINI_API_KEY: process.env.GOOGLE_GEMINI_API_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    LANGEXTRACT_SERVICE_URL: process.env.LANGEXTRACT_SERVICE_URL,
  },
}

module.exports = nextConfig 