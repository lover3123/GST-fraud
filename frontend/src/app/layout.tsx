import "./globals.css";

import type { ReactNode } from "react";

export const metadata = {
  title: "GST E-Invoice Guardian",
  description: "AI-powered GST e-invoice risk monitoring",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-shell-50 font-sans text-ink-900">
        <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-12 px-6 py-16">
          <section className="rounded-[28px] bg-white px-10 py-12 shadow-subtle">
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-700">GST E-Invoice Guardian</p>
              <h1 className="text-3xl font-semibold text-ink-900">
                Verify every invoice with quiet certainty.
              </h1>
              <p className="max-w-2xl text-base text-ink-700">
                Minimal, high-signal monitoring for compliance teams. Upload invoices, trace anomalies, and
                compare filings with calm precision.
              </p>
            </div>
          </section>
          {children}
        </main>
      </body>
    </html>
  );
}
