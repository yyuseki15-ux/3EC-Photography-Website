import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "3EC Photography",
  description: "Luxury photography with a clean modern eye and cinematic dark storytelling."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
