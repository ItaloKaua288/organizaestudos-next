import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const url = isProd ? process.env.API_BASE_URL : "http://localhost:5000/api";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${url?.replace(/\/$/, "")}/:path*`,
      },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
