# MovieBonus TMDB 整合實作摘要

## ✅ 已完成的實作

### 1. 設計文件
- ✅ 完成詳細設計分析 (`docs/TMDB-INTEGRATION-DESIGN.md`)
- ✅ 選定方案：呼叫 Python Backend API 寫入 Supabase

### 2. Supabase Schema 擴展
- ✅ 建立 migration SQL (`src/db/add_tmdb_fields_migration.sql`)
- ✅ 新增欄位：`tmdb_id`, `vote_average`, `backdrop_url`, `data_source`
- ⚠️  **需要手動執行** migration（見下方）

### 3. 格式轉換工具
- ✅ 建立 `src/lib/supabase-sync.ts`
- ✅ Frontend MovieData → Backend Movie 格式轉換
- ✅ Python Backend API 呼叫邏輯
- ✅ 直接 Supabase 寫入 fallback 機制

### 4. API Routes 修改
- ✅ 修改 `/api/scrape` route：新增 Supabase 寫入功能
- ✅ 建立 `/api/cron/sync-movies` route：專用於 Cron 同步
- ✅ 完整錯誤處理與 fallback 邏輯

### 5. Cron 設定
- ✅ 更新 `vercel.json`：每 6 小時執行一次
- ✅ 設定 `CRON_SECRET` 環境變數

### 6. 測試腳本
- ✅ 建立 `test-tmdb-integration.js`
- ✅ 表結構檢查腳本 (`check-table-structure.js`)

## ⚠️ 需要主人手動執行的步驟

### 1. Supabase Migration（必須）
```sql
-- 在 Supabase Dashboard → SQL Editor 執行以下 SQL：

ALTER TABLE movies ADD COLUMN IF NOT EXISTS tmdb_id INTEGER;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS vote_average DECIMAL(3,1);
ALTER TABLE movies ADD COLUMN IF NOT EXISTS backdrop_url TEXT;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS data_source VARCHAR(20) DEFAULT 'manual';

-- 建立索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_movies_tmdb_id ON movies(tmdb_id) WHERE tmdb_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_movies_data_source ON movies(data_source);

-- 約束條件
ALTER TABLE movies ADD CONSTRAINT IF NOT EXISTS check_data_source 
    CHECK (data_source IN ('manual', 'tmdb', 'scraper', 'user-report'));
ALTER TABLE movies ADD CONSTRAINT IF NOT EXISTS check_vote_average 
    CHECK (vote_average IS NULL OR (vote_average >= 0.0 AND vote_average <= 10.0));

-- 更新現有資料
UPDATE movies SET data_source = 'manual' WHERE data_source IS NULL;
```

### 2. 環境變數設定
在 Vercel Dashboard 新增：
```
CRON_SECRET=moviebonus_cron_secret_2026
PYTHON_BACKEND_URL=https://your-python-backend.com
PYTHON_BACKEND_TOKEN=your_backend_auth_token
```

### 3. Python Backend 確認
確認 Python Backend 的 `/api/save-movies` endpoint 正常運作。

## 🧪 測試步驟

### 本地測試
```bash
# 1. 啟動 Next.js dev server
npm run dev

# 2. 執行整合測試
node test-tmdb-integration.js

# 3. 檢查 Supabase 表結構
node check-table-structure.js
```

### 手動測試 API
```bash
# 測試 scrape API
curl "http://localhost:9002/api/scrape?secret=moviebonus_cron_secret_2026"

# 測試 cron API
curl -H "Authorization: Bearer moviebonus_cron_secret_2026" \
     "http://localhost:9002/api/cron/sync-movies"
```

## 📁 修改的檔案清單

### 新建檔案
- `src/lib/supabase-sync.ts` - Supabase 同步工具
- `src/app/api/cron/sync-movies/route.ts` - Cron 同步端點
- `src/db/add_tmdb_fields_migration.sql` - Migration SQL
- `docs/TMDB-INTEGRATION-DESIGN.md` - 設計文件
- `test-tmdb-integration.js` - 測試腳本
- `check-table-structure.js` - 表結構檢查
- `run-migration.js` - Migration 執行腳本

### 修改檔案
- `src/app/api/scrape/route.ts` - 新增 Supabase 寫入
- `vercel.json` - 新增 Cron 設定
- `.env.local` - 新增環境變數
- `package.json` - 新增 dotenv 依賴

## 🎯 功能驗證清單

- [ ] **Migration 執行成功**：Supabase 表新增 4 個欄位
- [ ] **本地測試通過**：`test-tmdb-integration.js` 回報成功
- [ ] **TMDB API 正常**：能抓取台灣現正上映片單
- [ ] **Supabase 寫入成功**：電影資料正確儲存
- [ ] **Cron API 正常**：`/api/cron/sync-movies` 回應正確
- [ ] **部署後測試**：Vercel Cron 正常觸發

## 🔧 故障排除

### Migration 失敗
- 手動在 Supabase Dashboard 執行 SQL
- 確認有 service_role 權限

### API 呼叫失敗
- 檢查 TMDB_API_KEY 是否有效
- 確認 CRON_SECRET 設定正確
- 檢查網路連線與 rate limiting

### Supabase 寫入失敗
- 確認 SUPABASE_SERVICE_ROLE_KEY 正確
- 檢查表結構是否正確
- 查看錯誤日誌

## 🚀 部署步驟

1. **Supabase Migration**：手動執行 SQL
2. **環境變數設定**：在 Vercel Dashboard 設定
3. **部署代碼**：`git commit && git push`
4. **驗證 Cron**：等待 6 小時或手動觸發
5. **監控同步**：檢查 Vercel Function Logs

## 📊 預期結果

完成後，MovieBonus 將每 6 小時自動：
1. 從 TMDB 抓取台灣現正上映電影
2. 爬取各影城特典資訊
3. 合併資料並寫入 Supabase
4. 前端自動顯示最新電影清單

**用戶體驗**：開啟網站即可看到最新電影與特典，無需手動維護！