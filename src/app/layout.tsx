import type { Metadata } from "next";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="min-h-screen">
        <header className="no-print border-b border-ink-violet bg-cream-paper">
          <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-6 md:px-20">
            <Link href="/" className="text-xl font-bold md:text-2xl">
              SevenDay Recipes
            </Link>
            <nav className="flex items-center gap-6 text-base">
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
          <div className="mx-auto max-w-[1200px] px-6 py-10 text-center text-body-sm md:px-20">
            Lebih dari 60.000 resep masakan Indonesia — generate, cari, cetak.
          </div>
        </footer>
      </body>
    </html>
  );
}
