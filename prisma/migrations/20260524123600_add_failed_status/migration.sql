-- AlterEnum: safely add 'failed' only if it does not already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'failed'
      AND enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'TrackStatus'
      )
  ) THEN
    ALTER TYPE "TrackStatus" ADD VALUE 'failed';
  END IF;
END;
$$;
