/*
  Warnings:

  - Made the column `created_at` on table `wallpapers` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `wallpapers` required. This step will fail if there are existing NULL values in that column.

*/
-- Primeiro, atualiza os registros existentes com valores NULL
UPDATE "wallpapers"
SET 
    "created_at" = CURRENT_TIMESTAMP,
    "updated_at" = CURRENT_TIMESTAMP
WHERE "created_at" IS NULL OR "updated_at" IS NULL;

-- Depois, altera as colunas para NOT NULL e adiciona os valores padrão
ALTER TABLE "wallpapers" 
    ALTER COLUMN "created_at" SET NOT NULL,
    ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN "updated_at" SET NOT NULL,
    ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
