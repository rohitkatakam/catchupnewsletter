import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Catchup",
  description: "Weekly friend group newsletter",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
