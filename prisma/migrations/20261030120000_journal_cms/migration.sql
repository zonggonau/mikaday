-- CreateTable
CREATE TABLE "JournalArticle" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "coverSrc" TEXT,
    "coverAlt" TEXT NOT NULL DEFAULT '',
    "coverKind" TEXT NOT NULL DEFAULT 'photo',
    "coverAi" BOOLEAN NOT NULL DEFAULT true,
    "productIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "videoPlatform" TEXT,
    "videoUrl" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JournalArticle_slug_key" ON "JournalArticle"("slug");

-- CreateIndex
CREATE INDEX "JournalArticle_published_publishedAt_idx" ON "JournalArticle"("published", "publishedAt");
