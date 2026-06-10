/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return {
      fallback: [
        {
          source: "/:path*",
          destination: "/"
        }
      ]
    };
  }
};

module.exports = nextConfig;
