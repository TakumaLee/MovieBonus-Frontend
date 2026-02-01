-- 新增 dataSource / isVerified 追蹤欄位到 movies table
-- 從 MVP 整合而來，用於追蹤資料來源與驗證狀態

ALTER TABLE movies
  ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- 建立 index 方便查詢已驗證的電影
CREATE INDEX IF NOT EXISTS idx_movies_is_verified ON movies (is_verified) WHERE is_verified = TRUE;

-- 建立 index 方便依資料來源篩選
CREATE INDEX IF NOT EXISTS idx_movies_data_source ON movies (data_source);

COMMENT ON COLUMN movies.data_source IS '資料來源：manual, scraper, user-report, vieshow, ambassador, etc.';
COMMENT ON COLUMN movies.is_verified IS '是否已驗證為真實資料';
