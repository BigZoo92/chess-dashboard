-- AlterTable
ALTER TABLE "Player"
ADD COLUMN     "lastSyncAt" TIMESTAMP(3),
ADD COLUMN     "profileJson" JSONB,
ADD COLUMN     "statsJson" JSONB,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "Game" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "pgn" TEXT,
    "endTime" TIMESTAMP(3) NOT NULL,
    "timeClass" TEXT NOT NULL,
    "timeControl" TEXT,
    "rules" TEXT,
    "rated" BOOLEAN NOT NULL DEFAULT true,
    "tcn" TEXT,
    "fen" TEXT,
    "eco" TEXT,
    "ecoUrl" TEXT,
    "whiteUsername" TEXT NOT NULL,
    "blackUsername" TEXT NOT NULL,
    "whiteRating" INTEGER,
    "blackRating" INTEGER,
    "whiteResult" TEXT,
    "blackResult" TEXT,
    "whiteAccuracy" DOUBLE PRECISION,
    "blackAccuracy" DOUBLE PRECISION,
    "resultPerspective" TEXT NOT NULL,
    "colorPerspective" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Game_url_key" ON "Game"("url");

-- CreateIndex
CREATE INDEX "Game_playerId_endTime_idx" ON "Game"("playerId", "endTime");

-- CreateIndex
CREATE INDEX "Game_playerId_timeClass_idx" ON "Game"("playerId", "timeClass");

-- CreateIndex
CREATE INDEX "Game_playerId_resultPerspective_idx" ON "Game"("playerId", "resultPerspective");

-- CreateIndex
CREATE INDEX "Game_playerId_eco_idx" ON "Game"("playerId", "eco");

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
