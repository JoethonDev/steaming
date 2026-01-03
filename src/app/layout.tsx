import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "@/components/Providers";
import "@/lib/init"; // Initialize app (create admin user if needed)
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "Stream Master Pro | Next.js 16 Edition",
  description: "High-performance HLS streaming platform with server-side API integration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <Providers>
        {children}
      </Providers>
    </div>
  );
}
