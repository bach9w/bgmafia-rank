-- Премахване на съществуващите политики
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON players;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON players;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON players;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON daily_stats;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON daily_stats;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON daily_stats;

-- Създаване на нови политики, които позволяват всички операции
CREATE POLICY "Enable all operations for all users" ON players
    FOR ALL USING (true);

CREATE POLICY "Enable all operations for all users" ON daily_stats
    FOR ALL USING (true); 