import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DemoOperationsProvider } from "@/components/demo-operations-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "MGHSIS Command Centre",
  description:
    "Local-first digital twin and mass-gathering safety intelligence prototype for SIH26206.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col"><DemoOperationsProvider>{children}</DemoOperationsProvider></body>
    </html>
  );
}
