import { Metadata } from 'next';
import { HelpCircle, ChevronDown } from 'lucide-react';

export const metadata: Metadata = {
  title: '常見問題 FAQ | MovieBonus 特典速報',
  description: '關於電影特典的所有疑問都在這裡找到答案！從特典查詢、領取方式到收藏保存，完整 FAQ 一次解答。',
};

const faqData = [
  {
    category: '基本概念',
    questions: [
      {
        q: '什麼是入場特典？',
        a: '入場特典（日文：入場者特典）是電影院在觀眾購票觀影時發放的限定周邊商品，常見類型包括海報、明信片、壓克力立牌、書籤等。源自日本動畫電影文化，近年在台灣越來越盛行。',
      },
      {
        q: 'MovieBonus 是什麼服務？',
        a: 'MovieBonus 是台灣最完整的電影特典資訊平台，整合各大院線（威秀、秀泰、國賓等）的特典發放資訊，讓影迷可以一站查詢所有電影的特典種類、數量、領取方式與時間。',
      },
      {
        q: '使用 MovieBonus 需要付費嗎？',
        a: '完全免費！MovieBonus 的所有功能都可免費使用，包括電影查詢、特典資訊、上映時間等。我們的目標是讓所有影迷都能輕鬆取得特典資訊。',
      },
    ],
  },
  {
    category: '查詢與使用',
    questions: [
      {
        q: '如何查詢某部電影有沒有特典？',
        a: '有三種方式：(1) 在首頁直接瀏覽「正在上映」或「即將上映」的電影列表，有特典的電影會顯示「特典」標籤；(2) 使用搜尋功能輸入電影名稱；(3) 點選電影進入詳細頁面查看完整特典資訊。',
      },
      {
        q: '特典資訊多久更新一次？',
        a: '我們每天更新特典資訊，並即時追蹤各大院線官方公告。如果有新的特典發放或數量變更，通常會在 24 小時內更新到網站上。',
      },
      {
        q: '如何知道特典還有沒有剩？',
        a: '特典數量資訊會顯示在電影詳細頁面。但因為發放速度快，建議直接致電影城確認，或提早到場領取。我們也提供「熱門度」指標，幫助你判斷搶手程度。',
      },
      {
        q: '可以設定特典通知嗎？',
        a: '目前正在開發「特典通知」功能，預計 2026 年 Q2 推出。屆時可以設定關注電影，當有新特典資訊時會透過 Email 或推播通知你。',
      },
    ],
  },
  {
    category: '領取方式',
    questions: [
      {
        q: '特典何時發放？',
        a: '最常見的是「首週」或「前 XXX 名」。部分電影採用「分週特典」（每週不同款）。具體發放時間請查看各電影的特典說明，或直接詢問影城櫃檯。',
      },
      {
        q: '如何領取特典？',
        a: '一般流程：(1) 購買電影票；(2) 到影城櫃檯出示票根（紙本或電子票皆可）；(3) 領取特典。某些影城要求「觀影後憑票根領取」，建議先確認規則。',
      },
      {
        q: '可以只領特典不看電影嗎？',
        a: '原則上不行，特典是「入場特典」，需憑票根領取。但各影城執行標準不同，有些較寬鬆，建議禮貌詢問櫃檯人員。',
      },
      {
        q: '一張票可以領幾份特典？',
        a: '通常是「一票一特典」，但規則因影城而異。有些會標註「一人限領一份」，有些則是「一票一份」（可重複進場領取）。建議事先確認。',
      },
      {
        q: '如果特典發完了怎麼辦？',
        a: '可以：(1) 詢問其他分店是否還有；(2) 等官方是否補貨（少見）；(3) 在二手市場（蝦皮、PTT）購買；(4) 參加片商或粉絲團的抽獎活動。',
      },
    ],
  },
  {
    category: '影城相關',
    questions: [
      {
        q: '哪些影城有發放特典？',
        a: '台灣主要發放特典的院線包括：威秀影城（最多）、秀泰影城、國賓影城、in89 駁二、美麗華大直影城等。威秀的特典種類最豐富，國賓較精選，秀泰數量較寬鬆。',
      },
      {
        q: '不同影城的特典會不一樣嗎？',
        a: '會！某些電影會有「院線限定」特典。例如威秀獨家、秀泰區域限定版等。建議在 MovieBonus 查詢各影城的特典資訊，選擇最想要的版本。',
      },
      {
        q: '加入影城會員有特典優勢嗎？',
        a: '有！威秀金卡/黑卡可提前預約特典；秀泰 VIP 會員有加碼特典；國賓與信用卡合作有額外優惠。如果常看電影，建議加入會員。',
      },
    ],
  },
  {
    category: '收藏與保存',
    questions: [
      {
        q: '特典該如何保存？',
        a: '依材質不同：紙類（海報、明信片）→ 使用透明套或裱框，避光保存；壓克力立牌 → 用絨布包裹避免刮傷；膠捲 → 專用保存盒，控溫控濕；金屬徽章 → 防潮防氧化。詳見我們的「特典收藏保存指南」文章。',
      },
      {
        q: '特典有收藏價值嗎？',
        a: '熱門作品的限量特典確實有收藏價值。例如《鬼滅之刃》首週特典在二手市場可達數千元，《空之境界》膠捲甚至上萬元。但不是所有特典都保值，建議以「喜愛」為出發點收藏。',
      },
    ],
  },
  {
    category: '其他',
    questions: [
      {
        q: '如何回報錯誤資訊？',
        a: '如果發現特典資訊有誤，請使用網站底部的「意見回饋」功能，或寄信至 moshi.asobo@gmail.com。我們會儘速確認並更新。',
      },
      {
        q: '可以投稿特典情報嗎？',
        a: '非常歡迎！如果你在影城發現最新特典資訊，可以透過意見回饋或 Email 提供照片與說明，幫助其他影迷。我們會在資訊中註明情報來源（如果你願意）。',
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <HelpCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-headline text-primary mb-4">
            常見問題 FAQ
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            關於電影特典的所有疑問，都在這裡找到答案
          </p>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-8">
          {faqData.map((section, sectionIndex) => (
            <div key={sectionIndex} className="border-b pb-8 last:border-b-0">
              <h2 className="text-2xl font-headline text-foreground mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-primary rounded"></span>
                {section.category}
              </h2>
              <div className="space-y-6">
                {section.questions.map((item, itemIndex) => (
                  <details
                    key={itemIndex}
                    className="group bg-card border rounded-lg overflow-hidden"
                  >
                    <summary className="flex items-center justify-between cursor-pointer px-6 py-4 hover:bg-accent transition-colors">
                      <h3 className="text-base sm:text-lg font-semibold text-foreground pr-4">
                        {item.q}
                      </h3>
                      <ChevronDown className="w-5 h-5 text-muted-foreground group-open:rotate-180 transition-transform flex-shrink-0" />
                    </summary>
                    <div className="px-6 py-4 border-t bg-card/50">
                      <p className="text-muted-foreground leading-relaxed">
                        {item.a}
                      </p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Still Have Questions */}
        <div className="mt-16 text-center bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-8 sm:p-12">
          <h3 className="text-2xl font-headline text-foreground mb-4">
            還有其他問題？
          </h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            如果以上 FAQ 沒有解答你的疑問，歡迎透過以下方式聯絡我們
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:moshi.asobo@gmail.com"
              className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              聯絡我們
            </a>
            <a
              href="/about"
              className="inline-block bg-card border border-border text-foreground px-8 py-3 rounded-lg font-semibold hover:bg-accent transition-colors"
            >
              關於我們
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
