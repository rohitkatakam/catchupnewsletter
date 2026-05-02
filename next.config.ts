import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@react-email/render", "@react-email/components"],
};

export default nextConfig;
