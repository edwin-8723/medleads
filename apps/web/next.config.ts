import type { NextConfig } from "next";

// URL interna del backend NestJS. El navegador solo habla con Next (mismo origen),
// así la cookie de sesión es de primera parte y no hace falta abrir CORS.
const API_URL = process.env.API_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
