import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import React from 'react';

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const space = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });

export const metadata: Metadata = {
  title: "AgentSwarp | Autonomous Engine",
  description: "The next generation true-autonomy swarm engine. Build, deploy, and scale intelligent AI agents effortlessly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${space.variable} antialiased bg-app text-white min-h-screen relative overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200`}>
        {/* Extreme UI: Background Noise Texture */}
        <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03] mix-blend-overlay" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noiseFilter\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.85\" numOctaves=\"3\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noiseFilter)\"/%3E%3C/svg%3E')"}}></div>
        
        {/* Ambient Aurora Glows */}
        <div className="pointer-events-none fixed -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-indigo-600/10 blur-[120px] mix-blend-screen" />
        <div className="pointer-events-none fixed top-[40%] -right-[10%] w-[40vw] h-[40vw] rounded-full bg-cyan-500/10 blur-[120px] mix-blend-screen" />

        <div className="relative z-10 flex h-screen w-full">
          {children}
        </div>
      </body>
    </html>
  );
}
