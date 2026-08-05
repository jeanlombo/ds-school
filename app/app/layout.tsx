import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DS School | La gestion scolaire nouvelle génération",
  description: "DS School centralise la gestion académique, administrative et financière de votre établissement scolaire.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/ds-scanner-192.png",
    apple: "/icons/ds-scanner-192.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
