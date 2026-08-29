import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DemoOperationsProvider } from "@/components/demo-operations-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "MGHSIS Command Centre",
  description:
    "Local-first digital twin and mass-gathering safety intelligence platform for SIH 2026.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased" data-scroll-behavior="smooth">
      <body id="main-content" className="min-h-full flex flex-col"><a className="skip-link" href="#main-content">Skip to operations</a><DemoOperationsProvider>{children}</DemoOperationsProvider></body>
    </html>
  );
}
