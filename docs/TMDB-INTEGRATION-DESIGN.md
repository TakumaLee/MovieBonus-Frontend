# MovieBonus TMDB 整合設計文件

## 📊 架構分析結果

### 現有 Supabase 表結構
- **movies 表**：包含完整電影資訊（title, synopsis, genre, duration, rating, poster_url, release_date, status 等）
- **movie_promotions 表**：存特典活動（promotion_title, description, start_date, end_date, status 等）
- **promotion_gifts 表**：存特典贈品詳細（gift_name, gift_type, description, image_urls 等）
- **facebook_posts 表**：存 FB 貼文原始資料

### 現有 Python Backend API
- **SupabaseService**：完整的 Supabase 操作封裝（使用 service_role_key）
- **/save-movies** endpoint：支援批量 upsert 電影資料
- **movie_promotions_matcher**：特典比對與儲存邏輯
- **完善的 error handling** 和 logging

### 現有前端 /api/scrape Route
- **TMDB API**：已整合 fetchNowPlaying + fetchMovieDetails
- **影城爬蟲**：完整的威秀、國賓、秀泰等特典爬蟲
- **Fuzzy Matching**：matcher.ts 合併電影與特典
- **❌ 缺失**：沒有寫入 Supabase，僅回傳 JSON

## 🔄 方案比較分析

### 方案 A：前端直接用 Supabase JS Client 寫入
```typescript
// 在 /api/scrape route 中加入
import { createClient } from '@supabase/supabase-js'

const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 直接 upsert
await supabaseClient.from('movies').upsert(movieData, { onConflict: 'tmdbId' })
```

**優點：**
- 實作簡單快速
- 減少網路跳轉（不經過 Python Backend）
- 前端完全自主控制
- TMDB 資料與特典在同一個 pipeline 處理

**缺點：**
- 重複造輪子（Python Backend 已有完整邏輯）
- 需要在前端重寫資料驗證、錯誤處理
- 缺少 Python Backend 的業務邏輯（如 fuzzy matching 的優化版本）
- 兩套寫入邏輯，未來維護成本高

### 方案 B：呼叫 Python Backend API 寫入
```typescript
// 在 /api/scrape route 中加入
const response = await fetch('http://python-backend/api/save-movies', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(mergedMovies)
})
```

**優點：**
- **復用現有邏輯**：Python Backend 已有完整的儲存、驗證、錯誤處理
- **維護成本低**：只有一套 Supabase 寫入邏輯
- **業務邏輯集中**：所有資料處理集中在 Backend
- **穩定可靠**：Python Backend 已經過測試，error handling 完善

**缺點：**
- 增加網路延遲（前端 → Python Backend → Supabase）
- 需要確保 Python Backend 可用性
- 跨服務依賴

## 🎯 建議方案：選擇方案 B

**理由：**
1. **避免重複造輪子**：Python Backend 的 SupabaseService 已經非常完善
2. **維護成本最低**：只需要在前端呼叫 API，不需要重寫複雜邏輯
3. **資料一致性**：所有 Supabase 寫入都走同一套邏輯
4. **現有程式碼復用**：充分利用已投入的開發成本

**風險緩解：**
- **依賴問題**：如果 Python Backend 不可用，前端仍可回傳 JSON 供手動處理
- **效能問題**：增加的網路延遲可接受，因為是背景批次作業

## 🛠️ 實作設計

### 1. Supabase Schema 檢查與擴展
**確認 movies 表是否需要新增欄位：**
```sql
-- 檢查是否需要新增 TMDB 相關欄位
ALTER TABLE movies ADD COLUMN IF NOT EXISTS tmdb_id INTEGER UNIQUE;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS vote_average DECIMAL(3,1);
ALTER TABLE movies ADD COLUMN IF NOT EXISTS backdrop_url TEXT;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS data_source VARCHAR(20) DEFAULT 'manual';

-- 建立 tmdb_id 索引
CREATE INDEX IF NOT EXISTS idx_movies_tmdb_id ON movies(tmdb_id);
```

### 2. 修改 /api/scrape Route
**在現有 pipeline 後加入 Supabase 寫入：**
```typescript
// Step 6: 寫入 Supabase（新增）
console.log("[API /scrape] Step 6: Saving to Supabase...");
try {
  // 轉換為 Python Backend 期望的格式
  const pythonMovies = convertToBackendFormat(mergedMovies);
  
  // 呼叫 Python Backend API
  const saveResponse = await fetch(`${process.env.PYTHON_BACKEND_URL}/api/save-movies`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.PYTHON_BACKEND_TOKEN}`
    },
    body: JSON.stringify(pythonMovies)
  });
  
  if (saveResponse.ok) {
    const saveResult = await saveResponse.json();
    console.log(`[API /scrape] Supabase: ${saveResult.successful_saves} movies saved`);
  }
} catch (e) {
  console.error("[API /scrape] Supabase save failed:", e);
  // 不影響其他功能，繼續執行
}
```

### 3. 新增 /api/cron/sync-movies Route
**專門供 Vercel Cron 呼叫的同步端點：**
```typescript
// src/app/api/cron/sync-movies/route.ts
export async function GET(request: Request) {
  // 驗證 cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. TMDB 同步：抓取台灣現正上映片單
    const tmdbMovies = await fetchAndSyncTMDBMovies();
    
    // 2. 特典同步：使用現有 /api/scrape 邏輯
    const scrapeResult = await fetch('/api/scrape', {
      headers: { 'authorization': authHeader }
    });
    
    return NextResponse.json({
      success: true,
      tmdbSynced: tmdbMovies.length,
      scrapingResult: scrapeResult
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### 4. 更新 vercel.json Cron 設定
```json
{
  "crons": [
    {
      "path": "/api/cron/sync-movies",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

### 5. 冪等性設計
**使用 tmdbId 作為唯一鍵，確保重複同步不會產生重複資料：**
```python
# Python Backend 的 upsert 邏輯（已存在）
response = self.client.table('movies').upsert(
    movies_data,
    on_conflict='tmdb_id'  # 根據 tmdb_id 進行 upsert
).execute()
```

### 6. 特典資料保護
**確保手動輸入的特典不被爬蟲覆蓋：**
```python
# 在 movie_promotions_matcher.py 中加入檢查
if existing_promotion.get('data_source') == 'manual':
    print(f"Skipping manual promotion: {existing_promotion['title']}")
    continue  # 不覆蓋手動特典
```

## 🚀 實作順序

### Phase 1：基礎設施
1. **檢查並執行 Supabase migration**（如需新增 tmdb_id 等欄位）
2. **設定環境變數**：PYTHON_BACKEND_URL, PYTHON_BACKEND_TOKEN
3. **測試 Python Backend API**：確認 /save-movies 端點正常

### Phase 2：核心功能
1. **修改 /api/scrape route**：加入 Supabase 寫入邏輯
2. **建立格式轉換函數**：Frontend MovieData → Backend Movie model
3. **本地測試**：GET /api/scrape 確認能正確寫入 Supabase

### Phase 3：自動化
1. **建立 /api/cron/sync-movies route**
2. **更新 vercel.json**：設定每 6 小時同步一次
3. **部署測試**：確認 Vercel Cron 正常運作

### Phase 4：監控與優化
1. **加入 error monitoring**
2. **設定 rate limiting**：遵守 TMDB API 限制（40 req/10s）
3. **性能優化**：批次處理、快取機制

## 🔧 技術細節

### TMDB Rate Limit 處理
```typescript
// 在 TMDB API 呼叫間加入延遲
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

for (const movie of nowPlayingMovies) {
  const details = await fetchMovieDetails(movie.id);
  await delay(250); // 40 req/10s = 250ms delay
}
```

### 環境變數需求
```env
# .env.local (已有)
TMDB_API_KEY=xxx
NEXT_PUBLIC_SUPABASE_URL=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# 新增
PYTHON_BACKEND_URL=http://localhost:8000  # 或 production URL
PYTHON_BACKEND_TOKEN=xxx  # 用於 API 認證
CRON_SECRET=xxx  # Vercel Cron 安全金鑰
```

### 資料格式對應
```typescript
interface MovieDataToBackend {
  id: string;           → id
  title: string;        → title  
  tmdbId?: number;      → NEW: tmdb_id
  voteAverage?: number; → NEW: vote_average
  backdropUrl?: string; → NEW: backdrop_url
  dataSource: string;   → NEW: data_source = 'tmdb'
  // ... 其他欄位維持原有映射
}
```

## 📋 完成檢查清單

- [ ] **Supabase Migration**：新增 tmdb_id, vote_average, backdrop_url 欄位
- [ ] **修改 /api/scrape**：加入 Python Backend API 呼叫
- [ ] **建立 /api/cron/sync-movies**：自動同步端點
- [ ] **更新 vercel.json**：Cron 設定
- [ ] **格式轉換函數**：Frontend ↔ Backend 資料格式
- [ ] **錯誤處理**：網路失敗、API 限制、資料驗證
- [ ] **本地測試**：手動執行 /api/scrape 確認寫入成功
- [ ] **部署測試**：Vercel Cron 運作驗證
- [ ] **監控設定**：Log aggregation, Error tracking

## 🎉 預期效果

完成後，MovieBonus 將具備：

1. **自動電影同步**：每 6 小時從 TMDB 同步台灣上映片單
2. **自動特典更新**：爬蟲定期更新影城特典資訊
3. **零維護成本**：全自動化，無需手動干預
4. **資料完整性**：TMDB 官方資料 + 本地特典資訊
5. **向下相容**：不影響現有 UI 和 Hook，前端無感升級

**用戶體驗：**
- 開啟 MovieBonus → 自動顯示最新電影清單
- 點擊電影 → 看到 TMDB 官方資訊 + 台灣特典活動
- 完全不需要手動輸入電影資料，專注於特典品質