// 快速測試腳本 - 驗證基礎 API
require('dotenv').config({ path: '.env.local' });

const API_BASE = 'http://localhost:9002';
const CRON_SECRET = process.env.CRON_SECRET;

async function quickTest() {
  console.log('🚀 快速測試基礎功能...\n');
  
  try {
    // 1. 測試 health check (如果有)
    console.log('1️⃣ 測試基礎連線...');
    const healthResponse = await fetch(`${API_BASE}/api/health`, {
      method: 'GET'
    });
    
    if (healthResponse.ok) {
      const healthResult = await healthResponse.json();
      console.log('✅ Health API 正常:', healthResult);
    } else {
      console.log('ℹ️  Health API 不存在，繼續測試...');
    }
    
    // 2. 測試 /api/scrape 但帶 timeout
    console.log('\n2️⃣ 測試 /api/scrape (30秒 timeout)...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      const scrapeResponse = await fetch(`${API_BASE}/api/scrape?secret=${CRON_SECRET}`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (scrapeResponse.ok) {
        const scrapeResult = await scrapeResponse.json();
        console.log('✅ /api/scrape 成功回應');
        console.log(`📊 基本統計:`);
        console.log(`  - 成功: ${scrapeResult.success}`);
        console.log(`  - TMDB 電影: ${scrapeResult.tmdbMovieCount || 0}`);
        console.log(`  - 特典數量: ${scrapeResult.totalBonuses || 0}`);
        console.log(`  - 合併電影: ${scrapeResult.movies?.length || 0}`);
        
        // 檢查 Supabase 同步結果
        if (scrapeResult.supabaseSync) {
          console.log(`  - Supabase 同步: ${scrapeResult.supabaseSync.success ? '成功' : '失敗'}`);
          console.log(`  - 儲存數量: ${scrapeResult.supabaseSync.savedCount || 0}`);
          
          if (scrapeResult.supabaseSync.errors?.length > 0) {
            console.log(`  - 錯誤數: ${scrapeResult.supabaseSync.errors.length}`);
            console.log(`  - 首個錯誤: ${scrapeResult.supabaseSync.errors[0]}`);
          }
        } else {
          console.log('  - Supabase 同步: 未執行');
        }
        
      } else {
        console.log(`❌ /api/scrape 失敗: ${scrapeResponse.status}`);
        const errorText = await scrapeResponse.text();
        console.log('錯誤詳情:', errorText.substring(0, 200));
      }
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.log('⏰ /api/scrape 超時 (30秒)，這是正常的，API 正在處理中...');
        console.log('💡 完整測試請等待 API 完成後再執行');
      } else {
        console.log(`❌ /api/scrape 網路錯誤: ${fetchError.message}`);
      }
    }
    
    // 3. 簡單驗證環境變數
    console.log('\n3️⃣ 驗證環境變數...');
    console.log(`✅ CRON_SECRET: ${CRON_SECRET ? '已設定' : '❌ 未設定'}`);
    console.log(`✅ TMDB_API_KEY: ${process.env.TMDB_API_KEY ? '已設定' : '❌ 未設定'}`);
    console.log(`✅ SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '已設定' : '❌ 未設定'}`);
    console.log(`✅ SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '已設定' : '❌ 未設定'}`);
    
    console.log('\n🎉 快速測試完成！');
    
  } catch (error) {
    console.error('💥 測試失敗:', error);
  }
}

quickTest();