import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kupon Takip",
  description: "Bahis kuponlarınızı takip edin",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
