import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { DemoOperationsProvider } from "@/components/demo-operations-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MGHSIS Command Centre",
  description:
    "Local-first digital twin and mass-gathering safety intelligence prototype for SIH26206.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><DemoOperationsProvider>{children}</DemoOperationsProvider></body>
    </html>
  );
}
