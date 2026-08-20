-- Soft delete para sede y cobertura: baja logica en vez de DELETE fisico.
ALTER TABLE sede ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE cobertura ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1;
