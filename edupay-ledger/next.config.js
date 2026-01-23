/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  // PWA configuration will be added here
  experimental: {
    // Enable server actions for form handling
  },
};

module.exports = nextConfig;
