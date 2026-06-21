import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[600px] px-6 py-24 text-center">
      <h1 className="mb-4 text-heading-sm font-bold">Halaman tidak ditemukan</h1>
      <p className="mb-8">Resep atau menu yang Anda cari tidak ada.</p>
      <Link href="/" className="btn-primary">
        Kembali ke beranda
      </Link>
    </div>
  );
}
