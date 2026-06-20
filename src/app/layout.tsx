import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="en" className={inter.className}>
      <body className="antialiased bg-black text-zinc-100 selection:bg-white/10 selection:text-white">
        {children}
      </body>
    </html>
  );
}
