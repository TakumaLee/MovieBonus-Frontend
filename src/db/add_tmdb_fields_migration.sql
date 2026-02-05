-- MovieBonus TMDB 整合欄位新增 Migration
-- 新增 TMDB 相關欄位到 movies 表
-- Created: 2026-02-05

-- ================================
-- 新增 TMDB 整合所需欄位
-- ================================

-- TMDB 電影 ID（唯一）
ALTER TABLE movies ADD COLUMN IF NOT EXISTS tmdb_id INTEGER;

-- TMDB 評分 (0.0 - 10.0)
ALTER TABLE movies ADD COLUMN IF NOT EXISTS vote_average DECIMAL(3,1);

-- 背景圖 URL
ALTER TABLE movies ADD COLUMN IF NOT EXISTS backdrop_url TEXT;

-- 資料來源標記
ALTER TABLE movies ADD COLUMN IF NOT EXISTS data_source VARCHAR(20) DEFAULT 'manual';

-- ================================
-- 建立索引提升查詢效能
-- ================================

-- TMDB ID 唯一索引（用於 upsert）
CREATE UNIQUE INDEX IF NOT EXISTS idx_movies_tmdb_id ON movies(tmdb_id) WHERE tmdb_id IS NOT NULL;

-- 資料來源索引（用於篩選不同來源的資料）
CREATE INDEX IF NOT EXISTS idx_movies_data_source ON movies(data_source);

-- ================================
-- 新增約束條件
-- ================================

-- 資料來源約束
ALTER TABLE movies ADD CONSTRAINT IF NOT EXISTS check_data_source 
    CHECK (data_source IN ('manual', 'tmdb', 'scraper', 'user-report'));

-- 評分約束（0.0 - 10.0）
ALTER TABLE movies ADD CONSTRAINT IF NOT EXISTS check_vote_average 
    CHECK (vote_average IS NULL OR (vote_average >= 0.0 AND vote_average <= 10.0));

-- ================================
-- 新增欄位說明
-- ================================

COMMENT ON COLUMN movies.tmdb_id IS 'TMDB (The Movie Database) 電影 ID，用於與 TMDB API 同步';
COMMENT ON COLUMN movies.vote_average IS 'TMDB 使用者評分 (0.0-10.0)';
COMMENT ON COLUMN movies.backdrop_url IS 'TMDB 提供的背景圖片 URL';
COMMENT ON COLUMN movies.data_source IS '資料來源：manual(手動), tmdb(TMDB API), scraper(爬蟲), user-report(用戶回報)';

-- ================================
-- 更新現有資料的 data_source
-- ================================

-- 將現有的手動輸入資料標記為 'manual'
UPDATE movies 
SET data_source = 'manual' 
WHERE data_source IS NULL;