/**
 * TMDB 整合測試腳本
 * 
 * 測試步驟：
 * 1. 呼叫 /api/scrape 確認 TMDB 資料抓取 + Supabase 寫入
 * 2. 檢查 Supabase 中的資料
 * 3. 測試 /api/cron/sync-movies
 */

require('dotenv').config({ path: '.env.local' });

const API_BASE = 'http://localhost:9002';
const CRON_SECRET = process.env.CRON_SECRET;

async function testTMDBIntegration() {
  console.log('🧪 開始測試 TMDB 整合...\n');
  
  try {
    // 1. 測試 /api/scrape
    console.log('1️⃣ 測試 /api/scrape...');
    const scrapeResponse = await fetch(`${API_BASE}/api/scrape?secret=${CRON_SECRET}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'TMDB-Integration-Test/1.0'
      }
    });
    
    if (!scrapeResponse.ok) {
      throw new Error(`Scrape API failed: ${scrapeResponse.status}`);
    }
    
    const scrapeResult = await scrapeResponse.json();
    
    console.log('✅ /api/scrape 成功回應');
    console.log(`📊 TMDB 電影數量: ${scrapeResult.tmdbMovieCount}`);
    console.log(`🎫 特典數量: ${scrapeResult.totalBonuses}`);
    console.log(`🔄 合併電影數量: ${scrapeResult.movies?.length || 0}`);
    
    if (scrapeResult.supabaseSync) {
      console.log(`💾 Supabase 同步: ${scrapeResult.supabaseSync.savedCount} 部電影已儲存`);
      if (scrapeResult.supabaseSync.errors?.length > 0) {
        console.log(`⚠️  同步錯誤: ${scrapeResult.supabaseSync.errors.slice(0, 2)}`);
      }
    } else {
      console.log('ℹ️  未進行 Supabase 同步');
    }
    
    console.log('\n');
    
    // 2. 測試 /api/cron/sync-movies  
    console.log('2️⃣ 測試 /api/cron/sync-movies...');
    const cronResponse = await fetch(`${API_BASE}/api/cron/sync-movies`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'User-Agent': 'TMDB-Integration-Test/1.0'
      }
    });
    
    if (!cronResponse.ok) {
      throw new Error(`Cron API failed: ${cronResponse.status}`);
    }
    
    const cronResult = await cronResponse.json();
    
    console.log('✅ /api/cron/sync-movies 成功回應');
    console.log(`📈 同步統計:`);
    console.log(`  - TMDB 電影: ${cronResult.data?.tmdbMovies || 0}`);
    console.log(`  - 特典數量: ${cronResult.data?.totalBonuses || 0}`);
    console.log(`  - Supabase 儲存: ${cronResult.data?.supabaseSynced || 0}`);
    console.log(`  - 執行時間: ${cronResult.data?.executionTimeMs || 0}ms`);
    console.log(`  - 下次同步: ${cronResult.nextSync || 'N/A'}`);
    
    if (cronResult.data?.errors?.length > 0) {
      console.log(`⚠️  發現錯誤: ${cronResult.data.errors.slice(0, 2)}`);
    }
    
    console.log('\n');
    
    // 3. 驗證 Supabase 資料
    console.log('3️⃣ 驗證 Supabase 資料...');
    await verifySupabaseData();
    
    console.log('\n🎉 TMDB 整合測試完成！');
    
    // 4. 產出測試報告
    generateTestReport(scrapeResult, cronResult);
    
  } catch (error) {
    console.error('💥 測試失敗:', error);
    console.log('\n🔧 故障排除提示:');
    console.log('1. 確認 Next.js dev server 在 port 9002 運行');
    console.log('2. 檢查 .env.local 中的 CRON_SECRET');
    console.log('3. 確認 TMDB_API_KEY 有效');
    console.log('4. 檢查 Supabase 連線設定');
  }
}

async function verifySupabaseData() {
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // 查詢最近新增的電影
    const { data: recentMovies, error } = await supabase
      .from('movies')
      .select('title, tmdb_id, data_source, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.log(`❌ Supabase 查詢失敗: ${error.message}`);
      return;
    }
    
    console.log('✅ Supabase 連線成功');
    console.log(`📝 最近 5 部電影:`);
    
    recentMovies?.forEach((movie, index) => {
      console.log(`  ${index + 1}. ${movie.title}`);
      console.log(`     TMDB ID: ${movie.tmdb_id || 'N/A'}`);
      console.log(`     資料來源: ${movie.data_source || 'manual'}`);
      console.log(`     更新時間: ${new Date(movie.updated_at).toLocaleString()}`);
    });
    
    // 統計 TMDB 資料
    const { data: tmdbStats, error: statsError } = await supabase
      .from('movies')
      .select('data_source')
      .eq('data_source', 'tmdb');
    
    if (!statsError) {
      console.log(`📊 TMDB 來源電影數量: ${tmdbStats?.length || 0}`);
    }
    
  } catch (error) {
    console.log(`❌ Supabase 驗證失敗: ${error.message}`);
  }
}

function generateTestReport(scrapeResult, cronResult) {
  const report = {
    testTime: new Date().toISOString(),
    scrapeApi: {
      success: scrapeResult?.success || false,
      tmdbMovieCount: scrapeResult?.tmdbMovieCount || 0,
      totalBonuses: scrapeResult?.totalBonuses || 0,
      supabaseSaved: scrapeResult?.supabaseSync?.savedCount || 0
    },
    cronApi: {
      success: cronResult?.success || false,
      executionTime: cronResult?.data?.executionTimeMs || 0,
      supabaseSaved: cronResult?.data?.supabaseSynced || 0
    }
  };
  
  console.log('\n📋 測試報告:');
  console.log(JSON.stringify(report, null, 2));
}

// 執行測試
if (require.main === module) {
  testTMDBIntegration();
}

module.exports = { testTMDBIntegration };