import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  eslint: {
    // ESLint errors will not fail the production build on Vercel
    ignoreDuringBuilds: true,
  },
  typescript: {
    // TypeScript errors will not fail the production build
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
}

export default nextConfig
