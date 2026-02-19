import { Metadata } from 'next';
import Link from 'next/link';
import { Mail, Heart, Users, Target } from 'lucide-react';

export const metadata: Metadata = {
  title: '關於我們 | MovieBonus 特典速報',
  description: 'MovieBonus 是台灣最完整的電影特典資訊平台，致力於讓影迷不錯過任何限定好康。了解我們的使命、團隊與聯絡方式。',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-headline text-primary mb-4">
            關於 MovieBonus
          </h1>
          <p className="text-lg text-muted-foreground">
            台灣最完整的電影特典資訊平台
          </p>
        </div>

        {/* What is MovieBonus */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-6 h-6 text-primary" />
            <h2 className="text-2xl sm:text-3xl font-headline text-foreground">
              MovieBonus 是什麼？
            </h2>
          </div>
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
              MovieBonus（特典速報）是專為台灣影迷打造的電影特典資訊平台。我們整合威秀、秀泰、國賓等各大院線的特典發放資訊，讓你不再錯過任何限定好康。
            </p>
            <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
              從日本動畫電影的入場特典、好萊塢大片的限量海報，到獨立電影的精美周邊，MovieBonus 一站查詢、即時更新，是收藏者和影迷的最佳夥伴。
            </p>
            <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
              無論你是特典獵人、動畫狂熱粉絲，還是單純想知道「這部電影有沒有特典」，MovieBonus 都能幫你快速找到答案。我們提供電影上映時間、特典種類、發放數量、領取方式等完整資訊，讓你輕鬆規劃觀影行程。
            </p>
          </div>
        </section>

        {/* Why We Do This */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Heart className="w-6 h-6 text-primary" />
            <h2 className="text-2xl sm:text-3xl font-headline text-foreground">
              為什麼做這個網站？
            </h2>
          </div>
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
              身為資深影迷，我們深知搶特典的辛苦：要爬各大院線官網、加入無數臉書社團、在 PTT 爬文數小時，還常常因為資訊分散而錯過限定特典。
            </p>
            <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
              2020 年《鬼滅之刃劇場版》在台上映，我們親眼見證特典秒殺的盛況，也看到許多影迷因為資訊不透明而撲空。那時我們決定：一定要做一個「讓所有影迷都能輕鬆查到特典資訊」的平台。
            </p>
            <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
              MovieBonus 不只是工具，更是影迷社群的一部分。我們相信，電影不只是娛樂，特典也不只是贈品——它們是我們與喜愛作品連結的橋樑，是珍貴的回憶載體。讓每個影迷都能輕鬆取得特典，就是我們的使命。
            </p>
          </div>
        </section>

        {/* Team */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-primary" />
            <h2 className="text-2xl sm:text-3xl font-headline text-foreground">
              團隊介紹
            </h2>
          </div>
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
              MovieBonus 團隊由一群熱愛電影與收藏的影迷組成。我們來自不同背景——工程師、設計師、影評人、特典收藏者——但都有一個共同目標：讓特典資訊更透明、更易得。
            </p>
            <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
              我們每天追蹤各大院線公告、日本片商情報、社群討論，確保資訊即時更新。我們也持續優化網站功能，從電影搜尋、特典通知，到未來的個人化推薦，都是為了提供更好的使用體驗。
            </p>
            <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
              如果你也熱愛電影、熱愛特典，歡迎加入我們！無論是提供情報、回饋建議，或是單純分享你的收藏故事，MovieBonus 永遠歡迎每一位影迷。
            </p>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Mail className="w-6 h-6 text-primary" />
            <h2 className="text-2xl sm:text-3xl font-headline text-foreground">
              聯絡我們
            </h2>
          </div>
          <div className="bg-card border rounded-lg p-6 sm:p-8">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">一般諮詢</h3>
                <p className="text-muted-foreground">
                  <a href="mailto:moshi.asobo@gmail.com" className="text-primary hover:underline">
                    moshi.asobo@gmail.com
                  </a>
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">商業合作</h3>
                <p className="text-muted-foreground">
                  <a href="mailto:moshi.asobo@gmail.com" className="text-primary hover:underline">
                    moshi.asobo@gmail.com
                  </a>
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">技術支援</h3>
                <p className="text-muted-foreground">
                  <a href="mailto:moshi.asobo@gmail.com" className="text-primary hover:underline">
                    moshi.asobo@gmail.com
                  </a>
                </p>
              </div>
              <div className="pt-4 border-t">
                <h3 className="font-semibold text-foreground mb-2">社群媒體</h3>
                <p className="text-muted-foreground">
                  追蹤我們的社群平台，取得最新特典情報！
                </p>
                <div className="flex gap-4 mt-3">
                  <a href="https://www.facebook.com/moviebonus" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Facebook
                  </a>
                  <a href="https://www.instagram.com/moviebonus" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Instagram
                  </a>
                  <a href="https://twitter.com/moviebonus" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Twitter
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-8 sm:p-12">
          <h3 className="text-2xl sm:text-3xl font-headline text-foreground mb-4">
            開始使用 MovieBonus
          </h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            立即查詢最新電影特典資訊，不再錯過任何限定好康！
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/" 
              className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              探索電影特典
            </Link>
            <Link 
              href="/guide" 
              className="inline-block bg-card border border-border text-foreground px-8 py-3 rounded-lg font-semibold hover:bg-accent transition-colors"
            >
              使用指南
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
