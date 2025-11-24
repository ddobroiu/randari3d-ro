/*
  Warnings:

  - Added the required column `pointsUsed` to the `History` table without a default value. This is not possible if the table is not empty.
  - Added the required column `prompt` to the `History` table without a default value. This is not possible if the table is not empty.
  - Added the required column `robot` to the `History` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "History" ADD COLUMN     "pointsUsed" INTEGER NOT NULL,
ADD COLUMN     "prompt" TEXT NOT NULL,
ADD COLUMN     "robot" TEXT NOT NULL;
