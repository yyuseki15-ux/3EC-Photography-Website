import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "3EC Sports Booking",
  description: "Book sports events online with a simple live-ready website."
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
