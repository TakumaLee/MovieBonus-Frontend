import { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Search, Bell, Star, Gift, Calendar } from 'lucide-react';

export const metadata: Metadata = {
  title: '使用指南 | MovieBonus 特典速報',
  description: '完整教學！教你如何使用 MovieBonus 查詢電影特典、設定通知、搜尋電影，以及規劃觀影行程的實用技巧。',
};

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-headline text-primary mb-4">
            MovieBonus 使用指南
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            從新手到進階，完整教學讓你輕鬆掌握特典資訊
          </p>
        </div>

        {/* Quick Start */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 sm:p-8 mb-12">
          <h2 className="text-2xl font-headline text-foreground mb-4">
            🚀 快速開始
          </h2>
          <ol className="space-y-3 text-muted-foreground">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-semibold">1</span>
              <span>打開 <Link href="/" className="text-primary hover:underline font-semibold">MovieBonus 首頁</Link>，瀏覽「正在上映」或「即將上映」的電影</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-semibold">2</span>
              <span>點選有「特典」標籤的電影，查看詳細特典資訊</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-semibold">3</span>
              <span>記下發放時間、數量、影城，提早規劃觀影行程</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-semibold">4</span>
              <span>到電影院購票觀影，憑票根領取特典！</span>
            </li>
          </ol>
        </div>

        {/* Feature Guides */}
        <div className="space-y-12">
          
          {/* 1. 查詢特典 */}
          <section className="border-b pb-12">
            <div className="flex items-center gap-3 mb-6">
              <Gift className="w-6 h-6 text-primary" />
              <h2 className="text-2xl sm:text-3xl font-headline text-foreground">
                如何查詢電影特典
              </h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-3">方法一：首頁瀏覽</h3>
                <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                  <li>打開首頁，切換「正在上映」或「即將上映」分頁</li>
                  <li>有特典的電影會顯示 <span className="inline-flex items-center px-2 py-1 text-xs bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 rounded">特典</span> 標籤</li>
                  <li>點擊電影海報進入詳細頁面</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-foreground mb-3">方法二：搜尋功能</h3>
                <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                  <li>使用頂部搜尋欄輸入電影名稱、演員或導演</li>
                  <li>支援中文、英文、日文搜尋</li>
                  <li>可搜尋關鍵字，例如「鬼滅」「新海誠」「漫威」</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-foreground mb-3">特典詳細資訊包含</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-card border rounded-lg p-4">
                    <h4 className="font-semibold text-foreground mb-2">✨ 特典種類</h4>
                    <p className="text-sm text-muted-foreground">海報、立牌、明信片、書籤等</p>
                  </div>
                  <div className="bg-card border rounded-lg p-4">
                    <h4 className="font-semibold text-foreground mb-2">📊 發放數量</h4>
                    <p className="text-sm text-muted-foreground">限量份數、前 XXX 名</p>
                  </div>
                  <div className="bg-card border rounded-lg p-4">
                    <h4 className="font-semibold text-foreground mb-2">🏢 發放影城</h4>
                    <p className="text-sm text-muted-foreground">威秀、秀泰、國賓等</p>
                  </div>
                  <div className="bg-card border rounded-lg p-4">
                    <h4 className="font-semibold text-foreground mb-2">📅 發放時間</h4>
                    <p className="text-sm text-muted-foreground">首週、首日、分週等</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 2. 搜尋電影 */}
          <section className="border-b pb-12">
            <div className="flex items-center gap-3 mb-6">
              <Search className="w-6 h-6 text-primary" />
              <h2 className="text-2xl sm:text-3xl font-headline text-foreground">
                搜尋技巧
              </h2>
            </div>

            <div className="space-y-4">
              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">🔍 進階搜尋技巧</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li><strong>關鍵字搜尋</strong>：輸入部分片名即可，例如「空之境」可找到《空之境界》</li>
                  <li><strong>英文搜尋</strong>：支援英文片名，例如「Demon Slayer」</li>
                  <li><strong>演員搜尋</strong>：輸入演員名字，找到相關電影</li>
                  <li><strong>導演搜尋</strong>：例如「新海誠」可找到所有相關作品</li>
                </ul>
              </div>

              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">💡 搜尋建議</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>如果找不到電影，試試英文片名或簡化關鍵字</li>
                  <li>使用「分類篩選」功能，按類型（動畫、劇情、動作）查找</li>
                  <li>關注「即將上映」區塊，提早規劃觀影</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. 通知設定（開發中） */}
          <section className="border-b pb-12">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-6 h-6 text-primary" />
              <h2 className="text-2xl sm:text-3xl font-headline text-foreground">
                特典通知（即將推出）
              </h2>
            </div>

            <div className="space-y-4">
              <div className="bg-card border rounded-lg p-6">
                <p className="text-muted-foreground mb-4">
                  我們正在開發「特典通知」功能，預計 2026 年 Q2 推出。屆時你可以：
                </p>
                <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                  <li>關注特定電影，當有新特典資訊時立即通知</li>
                  <li>設定喜好（動畫、科幻、劇情等），自動推薦相關特典</li>
                  <li>選擇通知方式（Email、推播、LINE）</li>
                  <li>設定提醒時間（上映前 3 天、1 天、當天）</li>
                </ul>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6">
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  搶先體驗
                </h4>
                <p className="text-muted-foreground">
                  想第一時間試用新功能？<a href="mailto:moshi.asobo@gmail.com" className="text-primary hover:underline">聯絡我們</a>加入 Beta 測試名單！
                </p>
              </div>
            </div>
          </section>

          {/* 4. 規劃觀影 */}
          <section className="border-b pb-12">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-6 h-6 text-primary" />
              <h2 className="text-2xl sm:text-3xl font-headline text-foreground">
                規劃觀影行程
              </h2>
            </div>

            <div className="space-y-4">
              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">📅 最佳搶特典策略</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary text-sm flex items-center justify-center font-semibold">1</span>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">提前確認資訊</h4>
                      <p className="text-sm text-muted-foreground">
                        在 MovieBonus 查詢特典種類、數量、發放影城
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary text-sm flex items-center justify-center font-semibold">2</span>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">選對場次</h4>
                      <p className="text-sm text-muted-foreground">
                        首日首場競爭最小，平日午場也是好選擇
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary text-sm flex items-center justify-center font-semibold">3</span>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">提早到場</h4>
                      <p className="text-sm text-muted-foreground">
                        熱門特典建議開演前 1-2 小時到櫃檯領取
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary text-sm flex items-center justify-center font-semibold">4</span>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">檢查品項</h4>
                      <p className="text-sm text-muted-foreground">
                        領取時當場確認是否完整、有無破損
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">⚡ 快速查詢清單</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span>特典種類是什麼？（海報、立牌、書籤...）</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span>限量幾份？（前 500 名、首週...）</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span>哪些影城有？（威秀、秀泰、國賓...）</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span>何時開始發放？（首日、首週...）</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span>熱門度如何？（需提早多久到場？）</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* 5. 進階技巧 */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Star className="w-6 h-6 text-primary" />
              <h2 className="text-2xl sm:text-3xl font-headline text-foreground">
                進階技巧
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">🎯 收藏家模式</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• 追蹤系列作品（如《空之境界》七章）</li>
                  <li>• 比較不同影城的特典版本</li>
                  <li>• 規劃「三館制霸」行程</li>
                  <li>• 閱讀我們的收藏保存指南</li>
                </ul>
              </div>

              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">💰 精打細算模式</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• 選擇「首週不限量」的特典</li>
                  <li>• 平日場次較便宜且好拿</li>
                  <li>• 加入影城會員享折扣</li>
                  <li>• 關注特映會抽獎活動</li>
                </ul>
              </div>

              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">👥 團體作戰</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• 與朋友分工搶不同影城</li>
                  <li>• 互相交換重複特典</li>
                  <li>• 加入特典交流社群</li>
                  <li>• 組團包場（某些影城有優惠）</li>
                </ul>
              </div>

              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">📚 深度研究</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• 閱讀我們的<Link href="/blog" className="text-primary hover:underline">部落格文章</Link></li>
                  <li>• 了解日本特典文化</li>
                  <li>• 研究特典設計趨勢</li>
                  <li>• 分析二手市場行情</li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-8 sm:p-12">
          <h3 className="text-2xl sm:text-3xl font-headline text-foreground mb-4">
            準備好了嗎？
          </h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            現在就開始使用 MovieBonus，不錯過任何精彩特典！
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              開始查詢特典
            </Link>
            <Link
              href="/faq"
              className="inline-block bg-card border border-border text-foreground px-8 py-3 rounded-lg font-semibold hover:bg-accent transition-colors"
            >
              查看 FAQ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
