import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StackPair — AI-Verified Peer Learning for Developers in India",
  description: "Match with developers at your exact skill level. 30-min sessions, real project collaboration, and AI-verified levels using GitHub, LeetCode & Kaggle. Free to join.",
  openGraph: {
    title: "StackPair — Learn. Build. Get Discovered.",
    description: "Peer learning with AI-verified skill levels. Swipe. Session. Build together.",
    url: "https://stackpair.app",
    siteName: "StackPair",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@stackpair",
    title: "StackPair — Learn. Build. Get Discovered.",
    description: "Peer learning with AI-verified skill levels. Swipe. Session. Build together.",
  },
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
