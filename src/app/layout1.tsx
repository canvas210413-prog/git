import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRM AI Web",
  description: "CRM AI Web Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
