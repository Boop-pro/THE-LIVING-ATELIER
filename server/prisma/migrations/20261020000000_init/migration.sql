-- CreateEnum
CREATE TYPE "Role" AS ENUM ('customer', 'studio');

-- CreateEnum
CREATE TYPE "PaintingStatus" AS ENUM ('available', 'sold');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('placed', 'cancelled');

-- CreateEnum
CREATE TYPE "WallBookingStatus" AS ENUM ('requested', 'confirmed', 'declined', 'cancelled');

-- CreateEnum
CREATE TYPE "PotteryRequestStatus" AS ENUM ('requested', 'accepted', 'declined', 'cancelled');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'customer',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Painting" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "status" "PaintingStatus" NOT NULL DEFAULT 'available',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Painting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaintingOrder" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "paintingId" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'placed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaintingOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WallPaintingRate" (
    "id" TEXT NOT NULL,
    "ratePerSqFt" DOUBLE PRECISION NOT NULL DEFAULT 150.0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WallPaintingRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WallBooking" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "bookingDate" DATE NOT NULL,
    "wallSizeSqFt" DOUBLE PRECISION NOT NULL,
    "ratePerSqFt" DOUBLE PRECISION NOT NULL DEFAULT 150.0,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "serviceAddress" TEXT NOT NULL,
    "status" "WallBookingStatus" NOT NULL DEFAULT 'requested',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WallBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PotteryItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PotteryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PotteryGlaze" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PotteryGlaze_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PotteryRequest" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "potteryItemId" TEXT NOT NULL,
    "potteryGlazeId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "neededByDate" DATE NOT NULL,
    "status" "PotteryRequestStatus" NOT NULL DEFAULT 'requested',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PotteryRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Painting_status_idx" ON "Painting"("status");

-- CreateIndex
CREATE INDEX "PaintingOrder_customerId_idx" ON "PaintingOrder"("customerId");

-- CreateIndex
CREATE INDEX "PaintingOrder_paintingId_idx" ON "PaintingOrder"("paintingId");

-- CreateIndex
CREATE INDEX "PaintingOrder_status_idx" ON "PaintingOrder"("status");

-- CreateIndex
CREATE INDEX "WallBooking_customerId_idx" ON "WallBooking"("customerId");

-- CreateIndex
CREATE INDEX "WallBooking_bookingDate_idx" ON "WallBooking"("bookingDate");

-- CreateIndex
CREATE INDEX "WallBooking_status_idx" ON "WallBooking"("status");

-- Partial Unique Index to ensure exactly one active (requested or confirmed) booking per date
CREATE UNIQUE INDEX "unique_active_wall_booking_date" ON "WallBooking"("bookingDate") WHERE status IN ('requested', 'confirmed');

-- CreateIndex
CREATE INDEX "PotteryRequest_customerId_idx" ON "PotteryRequest"("customerId");

-- CreateIndex
CREATE INDEX "PotteryRequest_potteryItemId_idx" ON "PotteryRequest"("potteryItemId");

-- CreateIndex
CREATE INDEX "PotteryRequest_potteryGlazeId_idx" ON "PotteryRequest"("potteryGlazeId");

-- CreateIndex
CREATE INDEX "PotteryRequest_status_idx" ON "PotteryRequest"("status");

-- AddForeignKey
ALTER TABLE "PaintingOrder" ADD CONSTRAINT "PaintingOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaintingOrder" ADD CONSTRAINT "PaintingOrder_paintingId_fkey" FOREIGN KEY ("paintingId") REFERENCES "Painting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WallBooking" ADD CONSTRAINT "WallBooking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PotteryRequest" ADD CONSTRAINT "PotteryRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PotteryRequest" ADD CONSTRAINT "PotteryRequest_potteryItemId_fkey" FOREIGN KEY ("potteryItemId") REFERENCES "PotteryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PotteryRequest" ADD CONSTRAINT "PotteryRequest_potteryGlazeId_fkey" FOREIGN KEY ("potteryGlazeId") REFERENCES "PotteryGlaze"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
