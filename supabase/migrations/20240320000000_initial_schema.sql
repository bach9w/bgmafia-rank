-- Create players table
CREATE TABLE players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create daily_stats table
CREATE TABLE daily_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    experience INTEGER NOT NULL DEFAULT 0,
    victories INTEGER NOT NULL DEFAULT 0,
    strength INTEGER NOT NULL DEFAULT 0,
    intelligence INTEGER NOT NULL DEFAULT 0,
    sex INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(player_id, date)
);

-- Create view for latest rankings
CREATE VIEW player_rankings AS
SELECT 
    p.id,
    p.name,
    ds.date,
    ds.experience,
    ds.victories,
    ds.strength,
    ds.intelligence,
    ds.sex,
    (ds.experience + ds.victories + ds.strength + ds.intelligence + ds.sex) as total_score
FROM players p
JOIN daily_stats ds ON p.id = ds.player_id
WHERE ds.date = CURRENT_DATE
ORDER BY total_score DESC;

-- Add RLS policies
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON players
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON daily_stats
    FOR SELECT USING (true);

-- Only allow insert/update/delete for authenticated users
CREATE POLICY "Enable insert for authenticated users only" ON players
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON players
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON players
    FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users only" ON daily_stats
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON daily_stats
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON daily_stats
    FOR DELETE USING (auth.role() = 'authenticated'); 