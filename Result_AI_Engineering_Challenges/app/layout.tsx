import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Papaya · AI Engineering Challenges",
  description: "Insurance platform challenge solutions",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-50">
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0 group-hover:bg-blue-700 transition-colors">
                P
              </div>
              <span className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                Papaya <span className="text-slate-400 font-normal">· AI Challenges</span>
              </span>
            </Link>
            <span className="text-xs text-slate-400 hidden sm:block">Insurance Platform</span>
          </div>
        </nav>
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
