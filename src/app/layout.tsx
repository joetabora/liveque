import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "IronQueue — Service Queue Display",
  description:
    "Premium real-time appointment and service queue display system for Harley-Davidson dealerships.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-iron-black text-white`}>
        {children}
      </body>
    </html>
  );
}
