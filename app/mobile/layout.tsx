import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "DS School Scanner",
  description: "Scanner mobile Safe Campus de DS School Enterprise.",
  manifest: "/manifest-ds-scanner.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DS Scanner",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b5ed7",
};

export default function MobileLayout({ children }: { children: ReactNode }) {
  return children;
}
