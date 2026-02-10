// 檢查 Supabase movies 表結構
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTableStructure() {
  try {
    // 查詢 information_schema 來取得表結構
    const { data, error } = await supabase.rpc('check_movies_table_structure');
    
    if (error) {
      console.log('使用 direct query fallback...');
      // Fallback: 直接查詢一筆資料來看欄位
      const { data: sampleData, error: sampleError } = await supabase
        .from('movies')
        .select('*')
        .limit(1);
      
      if (sampleError) {
        console.error('Error:', sampleError);
        return;
      }
      
      console.log('Sample movie data:');
      console.log(JSON.stringify(sampleData[0], null, 2));
      
      if (sampleData[0]) {
        const existingFields = Object.keys(sampleData[0]);
        const requiredFields = ['tmdb_id', 'vote_average', 'backdrop_url', 'data_source'];
        
        console.log('\n=== 欄位檢查 ===');
        console.log('現有欄位:', existingFields);
        
        const missingFields = requiredFields.filter(field => !existingFields.includes(field));
        if (missingFields.length > 0) {
          console.log('❌ 需要新增的欄位:', missingFields);
          console.log('\n建議執行的 Migration SQL:');
          missingFields.forEach(field => {
            switch(field) {
              case 'tmdb_id':
                console.log('ALTER TABLE movies ADD COLUMN tmdb_id INTEGER;');
                console.log('CREATE UNIQUE INDEX IF NOT EXISTS idx_movies_tmdb_id ON movies(tmdb_id);');
                break;
              case 'vote_average':
                console.log('ALTER TABLE movies ADD COLUMN vote_average DECIMAL(3,1);');
                break;
              case 'backdrop_url':
                console.log('ALTER TABLE movies ADD COLUMN backdrop_url TEXT;');
                break;
              case 'data_source':
                console.log('ALTER TABLE movies ADD COLUMN data_source VARCHAR(20) DEFAULT \'manual\';');
                break;
            }
          });
        } else {
          console.log('✅ 所有必要欄位都存在');
        }
      }
    } else {
      console.log('Table structure:', data);
    }
  } catch (err) {
    console.error('Failed to check table structure:', err);
  }
}

checkTableStructure();