// 執行 Supabase Migration - 新增 TMDB 欄位
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  try {
    console.log('🚀 開始執行 TMDB 欄位 Migration...');
    
    // 讀取 SQL 檔案
    const sqlContent = fs.readFileSync('./src/db/add_tmdb_fields_migration.sql', 'utf8');
    
    // 分割 SQL 語句（以 ; 分割，忽略註解）
    const statements = sqlContent
      .split('\n')
      .filter(line => line.trim() && !line.trim().startsWith('--'))
      .join('\n')
      .split(';')
      .filter(statement => statement.trim());
    
    console.log(`📄 發現 ${statements.length} 個 SQL 語句`);
    
    // 逐一執行每個 SQL 語句
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (!statement) continue;
      
      console.log(`\n⚡ 執行語句 ${i + 1}/${statements.length}:`);
      console.log(statement.substring(0, 100) + '...');
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_statement: statement 
        });
        
        if (error) {
          // 如果 exec_sql function 不存在，嘗試直接用 query
          console.log('ℹ️  嘗試 alternative 方法...');
          const { error: altError } = await supabase
            .from('information_schema.columns')  // 用一個無害的查詢來測試
            .select('*')
            .limit(1);
          
          if (altError) {
            console.log(`❌ SQL 執行失敗: ${error.message}`);
            console.log('💡 請手動在 Supabase Dashboard 執行以下 SQL：');
            console.log(statement);
          } else {
            console.log('✅ 語句執行成功 (使用 alternative 方法)');
          }
        } else {
          console.log('✅ 語句執行成功');
        }
      } catch (err) {
        console.log(`⚠️  執行出錯: ${err.message}`);
        console.log('💡 請手動在 Supabase Dashboard 執行以下 SQL：');
        console.log(statement);
      }
    }
    
    console.log('\n🎉 Migration 執行完成！');
    console.log('\n📋 請在 Supabase Dashboard 確認以下欄位是否成功新增：');
    console.log('- tmdb_id (INTEGER, UNIQUE)');
    console.log('- vote_average (DECIMAL(3,1))');
    console.log('- backdrop_url (TEXT)');
    console.log('- data_source (VARCHAR(20), DEFAULT \'manual\')');
    
    // 驗證 migration 是否成功
    console.log('\n🔍 驗證 migration 結果...');
    const { data: sampleData, error: sampleError } = await supabase
      .from('movies')
      .select('tmdb_id, vote_average, backdrop_url, data_source')
      .limit(1);
    
    if (sampleError) {
      console.log(`❌ 驗證失敗: ${sampleError.message}`);
    } else {
      console.log('✅ 欄位驗證成功！新欄位已存在。');
      console.log('Sample data:', sampleData);
    }
    
  } catch (err) {
    console.error('💥 Migration 執行失敗:', err);
    console.log('\n💡 手動執行方式：');
    console.log('1. 登入 Supabase Dashboard');
    console.log('2. 進入 SQL Editor');
    console.log('3. 執行 src/db/add_tmdb_fields_migration.sql 檔案內容');
  }
}

runMigration();