-- Функция за извличане на класация на играчите за дадена дата
CREATE OR REPLACE FUNCTION public.get_player_rankings_for_date(target_date date)
RETURNS TABLE (
  id uuid,
  name text,
  strength bigint,
  intelligence bigint,
  sex bigint,
  victories bigint,
  experience bigint,
  total_score bigint,
  date date
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    COALESCE(ds.strength, 0) AS strength,
    COALESCE(ds.intelligence, 0) AS intelligence,
    COALESCE(ds.sex, 0) AS sex,
    COALESCE(ds.victories, 0) AS victories,
    COALESCE(ds.experience, 0) AS experience,
    (COALESCE(ds.strength, 0) + COALESCE(ds.intelligence, 0) + COALESCE(ds.sex, 0) + 
     COALESCE(ds.victories, 0) + COALESCE(ds.experience, 0)) AS total_score,
    ds.date
  FROM 
    players p
  LEFT JOIN 
    daily_stats ds ON p.id = ds.player_id AND ds.date = target_date
  WHERE 
    ds.date IS NOT NULL
  ORDER BY 
    total_score DESC;
END;
$$ LANGUAGE plpgsql;

-- Функция за извличане на обобщени статистики на играчите (сума от всички дни)
CREATE OR REPLACE FUNCTION public.get_players_summary_stats()
RETURNS TABLE (
  id uuid,
  name text,
  strength bigint,
  intelligence bigint,
  sex bigint,
  victories bigint,
  experience bigint,
  total_score bigint,
  date date
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    COALESCE(SUM(ds.strength), 0) AS strength,
    COALESCE(SUM(ds.intelligence), 0) AS intelligence,
    COALESCE(SUM(ds.sex), 0) AS sex,
    COALESCE(SUM(ds.victories), 0) AS victories,
    COALESCE(SUM(ds.experience), 0) AS experience,
    (COALESCE(SUM(ds.strength), 0) + 
     COALESCE(SUM(ds.intelligence), 0) + 
     COALESCE(SUM(ds.sex), 0) + 
     COALESCE(SUM(ds.victories), 0) + 
     COALESCE(SUM(ds.experience), 0)) AS total_score,
    CURRENT_DATE AS date  -- Връщаме текущата дата като заместител
  FROM 
    players p
  LEFT JOIN 
    daily_stats ds ON p.id = ds.player_id
  GROUP BY 
    p.id, p.name
  ORDER BY 
    total_score DESC;
END;
$$ LANGUAGE plpgsql; 