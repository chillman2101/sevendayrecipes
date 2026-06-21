import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SevenDay Recipes — Menu Masakan Mingguan",
  description:
    "Generate menu masakan 1–7 hari dari 60.000+ resep Indonesia. Cari resep dari bahan yang ada, dan cetak kartu menu dengan QR code.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fffcf7",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="min-h-screen">
        <header className="no-print sticky top-0 z-50 border-b border-ink-violet bg-cream-paper">
          <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-4 sm:px-6 md:px-20 md:py-6">
            <Link href="/" className="text-base font-bold leading-tight sm:text-xl md:text-2xl">
              SevenDay Recipes
            </Link>
            <nav className="flex items-center gap-3 text-sm sm:gap-6 sm:text-base">
              <Link href="/" className="hover:underline">
                Generate
              </Link>
              <Link href="/browse" className="hover:underline">
                Cari Resep
              </Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="no-print border-t border-ink-violet bg-cream-paper">
          <div className="mx-auto max-w-[1200px] px-4 py-8 text-center text-sm sm:text-body-sm md:px-20 md:py-10">
            Lebih dari 60.000 resep masakan Indonesia — generate, cari, cetak.
          </div>
        </footer>
      </body>
    </html>
  );
}
