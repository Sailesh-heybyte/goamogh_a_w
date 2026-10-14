/** Next.js minimal config (CommonJS) */
module.exports = {
  reactStrictMode: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' }
    ]
  },
  webpack: (config) => {
    // Disable Webpack persistent caching to prevent ENOENT file pack cache errors on Windows
    config.cache = false;
    return config;
  }
}



