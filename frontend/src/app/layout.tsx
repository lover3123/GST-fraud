import "./globals.css";

import type { ReactNode } from "react";

export const metadata = {
  title: "GST E-Invoice Guardian",
  description: "AI-powered GST e-invoice risk monitoring",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#060b14] font-sans text-white antialiased">
        {children}
      </body>
    </html>
  );
}
