/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
    ],
  },

  // ✅ Prevent Vercel from tracing massive libraries
  experimental: {
    outputFileTracingExcludes: {
      "*": [
        "node_modules/pdfkit/**/*",
        "node_modules/pdfjs-dist/**/*",
        "node_modules/react-pdf/**/*",
        "node_modules/canvas/**/*",
      ],
    },

    // Keep these as runtime deps instead of bundling
    serverExternalPackages: ["pdfkit", "formidable", "nodemailer"],
  },

  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    // ✅ Stop optional native deps from breaking tracing
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;

    return config;
  },
};

export default nextConfig;