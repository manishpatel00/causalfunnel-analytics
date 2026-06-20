import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "CausalFunnel Analytics",
  description: "User behavior analytics dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className={`antialiased bg-black text-zinc-100 selection:bg-white/10 selection:text-white font-sans`}>
        {children}
      </body>
    </html>
  );
}
