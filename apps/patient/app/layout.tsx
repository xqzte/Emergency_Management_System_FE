import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "QuickSave", template: "%s | QuickSave" },
  description: "Get emergency help from the nearest hospital.",
  applicationName: "QuickSave",
  appleWebApp: { capable: true, title: "QuickSave", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F7F6F2",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-dvh bg-cream font-sans text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
