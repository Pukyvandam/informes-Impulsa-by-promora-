import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Impulsa Intelligence",
  description: "Plataforma de inteligencia para el programa Impulsa by Promora",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${fraunces.variable} ${inter.variable} h-full`}>
      <body className="h-full antialiased" style={{ fontFamily: "var(--font-inter, Inter, system-ui)" }}>
        {children}
      </body>
    </html>
  );
}
