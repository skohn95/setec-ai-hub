-- Migration 006: Make file_id nullable in analysis_results
-- Required for tamano_muestra (sample size) analysis which has no file upload.
-- FK constraint (REFERENCES files(id) ON DELETE CASCADE) already allows NULL by default.

ALTER TABLE analysis_results ALTER COLUMN file_id DROP NOT NULL;
