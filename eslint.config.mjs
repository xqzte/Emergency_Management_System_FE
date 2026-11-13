import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTs,
  {
    settings: { next: { rootDir: ["apps/patient/", "apps/hospital/"] } },
  },
  {
    ignores: ["**/node_modules/**", "**/.next/**", "**/out/**", "**/next-env.d.ts", "**/public/mockServiceWorker.js"],
  },
];

export default config;
