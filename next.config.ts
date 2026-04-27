import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack is default in Next.js 16; add empty turbopack config to suppress warning
  turbopack: {},
  // @xenova/transformers and onnxruntime-node must run in Node.js, not the edge runtime
  serverExternalPackages: ["@xenova/transformers", "onnxruntime-node"],
};

export default nextConfig;
