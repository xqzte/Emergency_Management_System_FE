import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ems/shared"],
  turbopack: { root: path.resolve(process.cwd(), "../..") },
};

export default nextConfig;
