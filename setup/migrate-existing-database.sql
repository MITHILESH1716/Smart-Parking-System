-- Safe, data-preserving migration from the one-floor SmartParking schema.
-- Run while connected to the smartparking database, with the backend stopped.
-- Existing lots and slots are assigned to floor 1. No rows are deleted.

ALTER TABLE parking_lots ADD COLUMN IF NOT EXISTS floor_count INTEGER;
UPDATE parking_lots SET floor_count = 1 WHERE floor_count IS NULL;
ALTER TABLE parking_lots ALTER COLUMN floor_count SET DEFAULT 1;
ALTER TABLE parking_lots ALTER COLUMN floor_count SET NOT NULL;

ALTER TABLE slots ADD COLUMN IF NOT EXISTS floor_number INTEGER;
UPDATE slots SET floor_number = 1 WHERE floor_number IS NULL;
ALTER TABLE slots ALTER COLUMN floor_number SET DEFAULT 1;
ALTER TABLE slots ALTER COLUMN floor_number SET NOT NULL;

-- Replace the old one-floor unique key with a floor-aware unique key.
DO $$
DECLARE c RECORD;
BEGIN
    FOR c IN
        SELECT conname FROM pg_constraint
        WHERE conrelid = 'slots'::regclass
          AND contype = 'u'
          AND pg_get_constraintdef(oid) = 'UNIQUE (lot_id, row_idx, col_idx)'
    LOOP
        EXECUTE format('ALTER TABLE slots DROP CONSTRAINT %I', c.conname);
    END LOOP;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'slots'::regclass
          AND contype = 'u'
          AND pg_get_constraintdef(oid) = 'UNIQUE (lot_id, floor_number, row_idx, col_idx)'
    ) THEN
        ALTER TABLE slots ADD CONSTRAINT uq_slots_lot_floor_position
            UNIQUE (lot_id, floor_number, row_idx, col_idx);
    END IF;
END $$;

-- Hibernate creates the subscription tables and any other new tables at next startup.
