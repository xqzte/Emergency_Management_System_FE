import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "QuickSave Hospital", template: "%s | QuickSave Hospital" },
  description: "Live emergency board for hospital staff.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-dvh bg-cream font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
