# MIKADAY — Create. Sip. Explore.

Toko lifestyle berbahasa Inggris yang menggabungkan dunia **Mika** (AI virtual creator fiktif), jurnal editorial,
dan toko internasional dengan desain orisinal yang diproduksi & dikirim oleh **Printful**, dibayar lewat **PayPal**.

Stack: Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS v4 · shadcn/ui (Radix) · Lucide · Prisma 7 + PostgreSQL.

> Konsep awal meminta JavaScript; proyek tetap memakai **TypeScript** karena seluruh integrasi (Prisma, Printful, PayPal)
> sudah bertipe. Tidak ada perbedaan bagi pengunjung.

## Peta situs

| Rute | Isi |
| --- | --- |
| `/` | Hero, A Little About Mika, Everyday Favorites, Shop the Moment, koleksi Mountain Sunset, Journal, Follow Mika |
| `/meet-mika` | Profil Mika + disclosure identitas AI |
| `/shop`, `/shop/[slug]` | Katalog (cari, kategori, koleksi, harga, warna, urutan) · detail produk (galeri, varian, size guide, ongkir) |
| `/collections`, `/collections/[slug]` | Koleksi & ceritanya |
| `/journal`, `/journal/[slug]` | Cerita Mika + produk terkait (+ link video opsional) |
| `/cart`, `/checkout`, `/track` | Keranjang, checkout PayPal, lacak pesanan |
| `/contact`, `/faq`, `/shipping`, `/returns`, `/privacy`, `/terms` | Bantuan & kebijakan (**draft**, berlabel) |
| `/admin` | Produk, pesanan, pesan kontak, pengaturan |

URL lama `/products/...` otomatis dialihkan (308) ke `/shop/...`.

## Setup

```bash
npm install
npm run db:migrate   # termasuk ContactMessage, JournalArticle, Media
npm run dev
```

Lihat `.env.example` untuk semua variabel (tanpa nilai rahasia). Baru di versi ini:

| Variabel | Fungsi |
| --- | --- |
| `NEXT_PUBLIC_SOCIAL_INSTAGRAM` / `_TIKTOK` / `_YOUTUBE` / `_FACEBOOK` | Link "Follow Mika". Kosong = disembunyikan (tidak ada akun/angka rekaan). |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Ditampilkan di halaman Contact bila diisi. |
| `NEXT_PUBLIC_STORE_NAME` | Default `MIKADAY`. |

## Jurnal (CMS di Admin → Jurnal)

Artikel jurnal disimpan di database dan dikelola dari **/admin/journal**:

- Tulis / edit / hapus artikel, simpan sebagai **draft** atau **tampilkan di situs** (langsung terlihat).
- Isi artikel: baris kosong = paragraf baru, baris diawali `## ` = subjudul.
- **Cover**: unggah JPG/PNG/WebP (maks. 4 MB, disimpan di database, disajikan dari `/media/{id}`) atau pilih dari
  pustaka (`public/images/` + unggahan sebelumnya). Wajib isi teks alt; tandai "Ilustrasi"/"AI" agar diberi label.
- **Produk dalam cerita** → tampil sebagai "Shop the story" di artikel dan "Seen in Mika's journal" di halaman produk.
- **Video cerita** (TikTok / Instagram / YouTube, https) → tombol "Watch this story on …".
- Database baru kosong? Klik **Impor artikel contoh** untuk memasukkan 3 cerita bawaan (`src/content/journal.ts`).

## Konten lain (siap untuk SaCMS)

Konten editorial lain ada di `src/content/` dan **hanya** dibaca halaman lewat adapter `src/lib/content.ts` —
ganti implementasi adapter itu untuk menyambungkan CMS tanpa mengubah UI.

| File | Isi |
| --- | --- |
| `mika.ts` | Profil, minat, disclosure |
| `home.ts` | Teks hero & scene "Shop the Moment" (`productIds`) |
| `collections.ts` | Koleksi: cerita, `productIds`, item "In the works" |
| `faq.ts`, `policies.ts` | FAQ & kebijakan (`draft: true` menampilkan label Draft) |

- **ID produk** = Printful ID yang tampil di Admin → Produk → detail.
- **Gambar Mika** saat ini berupa ilustrasi SVG orisinal di `public/images/` (berlabel "Illustration").
  Untuk versi foto, lihat prompt di [`docs/mika-image-prompts.md`](docs/mika-image-prompts.md), simpan file di
  `public/images/`, lalu ubah `src` dan set `kind: "photo"` (dengan `conceptual: true` diberi label "AI-generated").
- **Everyday Favorites** menampilkan 4 produk *featured* (urut: featured → "Urutan tampil" → nama). Atur di Admin → Produk.

## Data produk & keakuratan

- Produk, harga, varian, mockup, dan deskripsi berasal dari **data Printful asli** (bukan data demo).
- Size guide (inci & cm) diambil dari katalog Printful; produk tanpa data ukuran tidak menampilkan size guide.
- Ongkir, ketersediaan tujuan, dan estimasi pengiriman selalu dari Printful — tidak ada klaim "free shipping" atau
  "ships everywhere".
- Tidak ada rating, ulasan, diskon coret, atau label stok/populer rekaan.

## Status fitur

| Berfungsi penuh | Butuh konfigurasi / integrasi |
| --- | --- |
| Katalog, cari, filter, urut, detail produk, size guide | Foto Mika yang disetujui (saat ini ilustrasi SVG) |
| Keranjang (localStorage), checkout PayPal sandbox | PayPal **live** + `PAYPAL_WEBHOOK_ID` setelah online |
| Cek ongkir real-time, order otomatis ke Printful (draft) | Domain publik HTTPS untuk webhook Printful & PayPal |
| Lacak pesanan, formulir kontak → Admin → Pesan | Email balasan otomatis (saat ini balas manual) |
| Admin produk/pesanan/refund | Kebijakan final (Shipping/Returns/Privacy/Terms masih draft) |
| Konten via adapter, CMS jurnal di admin | Koneksi SaCMS untuk konten lain |
| | Produk Mountain Sunset Tee/Tote/Hoodie (buat di Printful, lalu tambahkan ID-nya di `collections.ts`) |

## Desain & aksesibilitas

- Token warna di `src/app/globals.css` (sesuai konsep). Kontras WCAG AA terverifikasi untuk semua pasangan teks;
  oranye `#E87932` hanya dekoratif; border input `#8F857B` (≥ 3:1).
- Font: Manrope (teks) + Fraunces (judul), ukuran responsif dengan `clamp()`.
- Target sentuh ≥ 44 px, fokus keyboard terlihat, drawer/dialog Radix (focus trap + Esc), `prefers-reduced-motion`.
- Diverifikasi di 360 / 390 / 768 / 1024 / 1440 px: tanpa horizontal overflow, satu `<h1>` per halaman.

## Catatan lain

- **Build butuh database** (katalog di-prerender). Jalankan `npm run db:migrate` sebelum `npm run build` saat deploy.
- Order dari PayPal **sandbox** selalu berhenti sebagai draft di Printful dan tidak bisa dikonfirmasi ke produksi.
- `SYNC_WEBHOOK_SECRET` harus string acak, bukan API key Printful.
