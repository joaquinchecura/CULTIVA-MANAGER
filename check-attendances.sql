SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'attendances'
ORDER BY ordinal_position;