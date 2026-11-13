import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ems/shared"],
  turbopack: {
    root: path.resolve(process.cwd(), "../.."),
    // MSW's browser build has no server version; give server rendering an empty stand-in.
    resolveAlias: {
      "msw/browser": { browser: "msw/browser", default: "../../packages/shared/src/mocks/server-stub.ts" },
    },
  },
  async headers() {
    return [
      {
        source: "/mockServiceWorker.js",
        headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
