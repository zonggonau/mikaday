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

## Email ke pelanggan

| Kapan | Email | Pemicu |
| --- | --- | --- |
| Pembayaran PayPal berhasil | Konfirmasi pesanan (item, total, alamat) | capture PayPal `COMPLETED` |
| Paket dikirim | Kurir, nomor resi, tombol lacak | webhook Printful `package_shipped` |
| Paket sampai | Tanggal diterima | cron `/api/cron/orders` membaca `delivered_at` dari Printful API v2 |

- **Atur SMTP di Admin → Pengaturan → Email pelanggan** (preset Gmail, Brevo, Zoho, Hostinger, atau kustom), lalu
  **Tes koneksi** dan **Kirim email contoh**. Password disimpan terenkripsi (AES-256-GCM, kunci dari `AUTH_SECRET` —
  mengganti `AUTH_SECRET` berarti memasukkan ulang password SMTP). Pengaturan admin mengalahkan `SMTP_*` di `.env`.
  - Gmail: aktifkan 2-Step Verification, buat App Password (myaccount.google.com/apppasswords), email pengirim = alamat
    Gmail itu sendiri; batas ±500 email/hari.
  - Domain sendiri (Brevo/Zoho/…): verifikasi domain pengirim (SPF + DKIM) agar tidak masuk spam.
- `CRON_SECRET` (lihat `.env.example`) dibutuhkan untuk email "paket sampai" dan pengiriman ulang otomatis.
- Tiap email dicatat di tabel `OrderEmail` dengan kunci unik → webhook yang berulang tidak mengirim email ganda.
  Riwayat & tombol kirim ulang ada di Admin → Pesanan → detail.
- **Cron** (setiap 30 menit): cek status "sampai", baca ulang order terbuka bila webhook terlewat, ulangi email gagal.
  - VPS: `/etc/cron.d/mikaday` menjalankan `/opt/mikaday/cron.sh` (membaca `CRON_SECRET` dari `.env`).
  - Vercel: tambahkan Cron Job ke `/api/cron/orders` (Vercel mengirim header `Authorization: Bearer $CRON_SECRET` sendiri).
- Status "sampai" bergantung pada data kurir di Printful; kurir tanpa pelacakan tidak memicu email ini.

## SEO

- **Metadata per halaman** lewat `pageMetadata()` di `src/lib/seo.ts`: title, description, canonical, Open Graph & Twitter
  (gambar 1200×630). Halaman `/shop` dengan filter (`?q=`, `?category=`) ber-canonical ke `/shop`.
- **Structured data (JSON-LD)**: Organization + WebSite (beranda), Product + BreadcrumbList (produk, tanpa rating rekaan),
  CollectionPage/ItemList (shop & koleksi), Blog / BlogPosting (jurnal), FAQPage (FAQ).
- **Gambar share** di `public/og/` (kartu MIKADAY, kartu Meet Mika, versi landscape foto Mika dengan label AI) dan logo
  `public/brand/logo.png`. Setelah mengganti foto di `public/images/mika/`, jalankan `node scripts/generate-og-images.mjs`.
- **Sitemap** (`/sitemap.xml`) memuat gambar produk & artikel; **robots.txt** menutup admin, API, keranjang, checkout, lacak.
- Halaman keranjang, checkout, sukses, lacak, dan admin `noindex`.
- **Google Search Console**: isi `GOOGLE_SITE_VERIFICATION` (metode tag HTML), build ulang, lalu kirim
  `https://mikaday.store/sitemap.xml` di menu Sitemaps. Uji data terstruktur di https://search.google.com/test/rich-results.

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
| Lacak pesanan, formulir kontak → Admin → Pesan | SMTP untuk email pelanggan (konfirmasi / dikirim / sampai) |
| Admin produk/pesanan/refund | Kebijakan final (Shipping/Returns/Privacy/Terms masih draft) |
| Konten via adapter, CMS jurnal di admin | Koneksi SaCMS untuk konten lain |
| | Produk Mountain Sunset Tee/Tote/Hoodie (buat di Printful, lalu tambahkan ID-nya di `collections.ts`) |

## Desain & aksesibilitas

- Token warna di `src/app/globals.css` (sesuai konsep). Kontras WCAG AA terverifikasi untuk semua pasangan teks;
  oranye `#E87932` hanya dekoratif; border input `#8F857B` (≥ 3:1).
- Font: Manrope (teks) + Fraunces (judul), ukuran responsif dengan `clamp()`.
- Target sentuh ≥ 44 px, fokus keyboard terlihat, drawer/dialog Radix (focus trap + Esc), `prefers-reduced-motion`.
- Diverifikasi di 360 / 390 / 768 / 1024 / 1440 px: tanpa horizontal overflow, satu `<h1>` per halaman.

## Deploy ke Vercel

1. **Database**: Vercel → Storage → buat **Neon Postgres** dan hubungkan ke project
   (otomatis mengisi `DATABASE_URL` pooled dan `DATABASE_URL_UNPOOLED` untuk migrasi).
2. **Import** repo GitHub di Vercel. Build memakai script `vercel-build`
   (`prisma generate && prisma migrate deploy && next build`) — tabel dibuat otomatis.
3. **Environment variables**: isi semua variabel dari `.env.example` (kecuali `DATABASE_URL*` dari Neon).
   `NEXT_PUBLIC_*` dibaca saat build — setelah mengubahnya, lakukan **Redeploy**.
4. Setelah deploy pertama: Admin → Produk → **Sinkronkan dari Printful** → aktifkan produk;
   Admin → Jurnal → **Impor artikel contoh**.
5. **Domain**: Project → Settings → Domains → tambahkan `mikaday.com`, atur DNS sesuai instruksi Vercel,
   ubah `NEXT_PUBLIC_SITE_URL=https://mikaday.com`, redeploy, lalu daftarkan webhook Printful (Admin → Pengaturan)
   dan webhook PayPal (`https://mikaday.com/api/paypal/webhook`).

Catatan: paket Vercel **Hobby hanya untuk penggunaan non-komersial** — toko online butuh paket **Pro**.
Unggahan cover maks. 4 MB (batas body request Vercel 4,5 MB).

## Server produksi (VPS mikaday.store)

| Apa | Di mana |
| --- | --- |
| Aplikasi (PM2 `mikaday`, port 3010 di balik Caddy) | `/opt/mikaday/app` (`.env` permission 600) |
| Deploy: build di folder terpisah lalu ditukar | `/opt/mikaday/deploy.sh <release.tar.gz>`; versi sebelumnya di `app-prev` |
| Cron tiap 30 menit (status "sampai", order terlewat, ulang email) | `/etc/cron.d/mikaday` → `/opt/mikaday/cron.sh`, log `cron.log` |
| Backup database harian 03:15, disimpan 14 hari | `/opt/mikaday/backups/*.dump`, log `backup.log` |
| Backup `.env` | `/opt/mikaday/env-backups/` |
| Rotasi log (PM2, cron, backup) | `/etc/logrotate.d/mikaday` |

- Restore backup: `docker exec -i mikaday-postgres pg_restore -U mikaday -d mikaday --clean --if-exists < FILE.dump`.
  Backup ada di VPS yang sama — unduh salinan berkala (mis. `scp`) agar aman bila VPS rusak.
- Header keamanan (HSTS, anti-framing, nosniff, Referrer-Policy) diatur di `next.config.ts`.
- Google Analytics hanya dimuat setelah pengunjung menyetujui cookie (banner + "Cookie settings" di footer).

## Catatan lain

- **Build butuh database** (katalog di-prerender). Jalankan `npm run db:migrate` sebelum `npm run build` saat deploy.
- Order dari PayPal **sandbox** selalu berhenti sebagai draft di Printful dan tidak bisa dikonfirmasi ke produksi.
- `SYNC_WEBHOOK_SECRET` harus string acak, bukan API key Printful.
- **Provinsi wajib PayPal** (ID, IT, MX, AR, IN, TH + konversi prefektur JP) ada di `src/lib/regions.ts`. Tanpa provinsi
  yang dikenali, PayPal hanya menampilkan "Things don't appear to be working at the moment" setelah pembeli login.
