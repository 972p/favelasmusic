import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { GlobalPlayer } from "@/components/GlobalPlayer";
import { SiteBackground } from "@/components/SiteBackground";
import { getProfile } from "@/lib/storage";

import { ToastContainer } from "@/components/ui/ToastContainer";

const inter = Inter({ subsets: ["latin"] });

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "FavelasMusic",
  description: "Private Music Workspace",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getProfile();

  return (
    <html lang="en">
      <body className={inter.className}>
        <SiteBackground profile={profile} />
        <ToastContainer />
        {children}
        <GlobalPlayer />
      </body>
    </html>
  );
}
