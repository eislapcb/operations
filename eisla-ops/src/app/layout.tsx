import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eisla Ops Hub",
  description: "PCB design and manufacturing operations management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-cream text-teal antialiased">{children}</body>
    </html>
  );
}
