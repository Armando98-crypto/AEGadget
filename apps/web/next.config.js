/** @type {import('next').NextConfig} */
const nextConfig = {
  // Em Angola a internet pode ser lenta — otimizar imagens automaticamente
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        // Fallback para imagens locais durante desenvolvimento
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },

  // Proxy API requests in production (optional - can also use direct URL)
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
    const baseUrl = apiUrl.replace("/api", "");
    
    return [
      {
        source: "/api/:path*",
        destination: `${baseUrl}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${baseUrl}/uploads/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
