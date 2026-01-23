import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "./providers/PostHogProvider";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ForexFriend",
  description: "Track your study abroad funds easily",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`} data-theme="dark">
        <PostHogProvider>
          {children}
        </PostHogProvider>
      </body>
    </html>
  );
}