import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export for deployment flexibility
  output: 'export',

  // Webpack configuration for WASM modules
  webpack: (config, { isServer, webpack }) => {
    // Handle qpdf-wasm and other modules that use Node.js built-ins
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        module: false,
        url: false,
        worker_threads: false,
      };
    }

    // Also add module to alias for some packages that use it
    config.resolve.alias = {
      ...config.resolve.alias,
      'module': false,
    };

    // Ignore the dynamic import of 'module' in gs-wasm
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^module$/,
        contextRegExp: /@bentopdf/,
      })
    );

    // Enable WebAssembly
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    return config;
  },

  // Image optimization configuration
  // Note: unoptimized is required for static export
  images: {
    unoptimized: true,
    // Define allowed image formats
    formats: ['image/avif', 'image/webp'],
    // Define device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // Define image sizes for srcset
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Minimum cache TTL for optimized images (in seconds)
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // Trailing slash for static hosting compatibility
  trailingSlash: true,

  // Strict mode for better development experience
  reactStrictMode: true,

  // TypeScript configuration
  typescript: {
    // Allow production builds even with type errors during development
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    // Run ESLint during builds
    ignoreDuringBuilds: true,
  },

  // Compiler options for performance
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Base path for the application
  basePath: '/pdf-tools',
};

export default withNextIntl(nextConfig);
