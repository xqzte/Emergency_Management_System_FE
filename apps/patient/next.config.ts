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
    // Workers must never be cached by the browser, or updates get stuck.
    const noCache = [
      { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
      { key: "Content-Type", value: "application/javascript; charset=utf-8" },
    ];
    return [
      { source: "/sw.js", headers: noCache },
      { source: "/mockServiceWorker.js", headers: noCache },
    ];
  },
};

export default nextConfig;
