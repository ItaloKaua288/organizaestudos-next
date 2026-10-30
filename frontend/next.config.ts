import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const url = isProd ? process.env.API_BASE_URL : "http://localhost:5000/api";

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  compress: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${url?.replace(/\/$/, "")}/:path*`,
      },
    ];
  },
  experimental: {
    // Importa só os ícones/funções realmente usados (bundle menor, carregamento mais rápido).
    optimizePackageImports: ["lucide-react", "date-fns", "date-fns-tz", "@base-ui/react"],
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
