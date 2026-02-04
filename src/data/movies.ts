/**
 * 真實電影資料 — 基於 2026 年 2 月台灣院線真實上映資訊
 *
 * 從 MVP 整合而來，包含 dataSource / isVerified 追蹤欄位。
 * 特典資料標注為 demo data（格式正確，內容為合理推測）。
 * 電影基本資訊來自開眼電影網 (atmovies.com.tw)。
 *
 * 注意：此檔為前端靜態資料備份 / fallback，
 * 正式環境以 Supabase API 為主要資料來源。
 */

// ============================================================================
// Types（與 MVP 相容，擴充 dataSource / isVerified）
// ============================================================================

export interface Bonus {
  week: number;
  description: string;
  quantity: string;
  imageUrl?: string;
}

export interface TheaterBonus {
  theaterId: string;
  theaterName: string;
  bonuses: Bonus[];
  ticketUrl: string;
}

export type DataSource = "manual" | "scraper" | "user-report";

export interface MovieData {
  id: string;
  title: string;
  titleJa?: string;
  titleEn?: string;
  releaseDate: string;
  posterUrl: string;
  synopsis: string;
  genre: string[];
  duration: number; // minutes
  rating: string;
  theaterBonuses: TheaterBonus[];
  /** true = scraped/confirmed real data; false/undefined = demo data */
  isVerified?: boolean;
  /** Data source tag for transparency */
  dataSource?: DataSource;
  /** 是否為重映/再上映版本（4K修復、IMAX紀念版等） */
  isRerelease?: boolean;
  /** TMDB 電影 ID */
  tmdbId?: number;
  /** TMDB 評分 */
  voteAverage?: number;
  /** 背景圖 URL */
  backdropUrl?: string;
}

export interface Theater {
  id: string;
  name: string;
  color: string;
  logo?: string;
}

// ============================================================================
// 影城列表
// ============================================================================

export const theaters: Theater[] = [
  { id: "vieshow", name: "威秀影城", color: "#E50914" },
  { id: "ambassador", name: "國賓影城", color: "#FFD700" },
  { id: "showtimes", name: "秀泰影城", color: "#00BFFF" },
  { id: "miramar", name: "美麗華影城", color: "#FF69B4" },
  { id: "in89", name: "in89 豪華數位影城", color: "#9B59B6" },
];

// ============================================================================
// 🎬 電影資料 — 2026 年 1-2 月台灣院線
// ============================================================================

export const movies: MovieData[] = [
  {
    id: "kara-no-kyoukai-4",
    title: "空之境界劇場版：第四章 伽藍之洞",
    titleJa: "空の境界 第四章 伽藍の洞",
    titleEn: "The Garden of Sinners: The Hollow Shrine",
    releaseDate: "2026-01-30",
    posterUrl: "/posters/kara-no-kyoukai-4.jpg",
    synopsis:
      "兩儀式甦醒，「直死之魔眼」真正覺醒，系列最靜、最沉重的一章，直擊存在本質，描繪人格崩解與重生，質疑「我為何存在」。1996年冬，一名重傷的少女被送進醫院──她叫兩儀式。歷經長時間搶救後雖保住性命，卻陷入長達兩年的沉睡。",
    genre: ["動畫", "奇幻", "劇情"],
    duration: 47,
    rating: "PG-12",
    theaterBonuses: [
      {
        theaterId: "vieshow",
        theaterName: "威秀影城",
        bonuses: [
          { week: 1, description: "兩儀式特製色紙（複製原畫）", quantity: "每場次前 30 名" },
          { week: 2, description: "空之境界角色明信片組（3入）", quantity: "每場次前 20 名" },
        ],
        ticketUrl: "https://www.vscinemas.com.tw/",
      },
      {
        theaterId: "in89",
        theaterName: "in89 豪華數位影城",
        bonuses: [
          { week: 1, description: "空之境界 A4 透明資料夾", quantity: "每日前 20 名" },
        ],
        ticketUrl: "https://www.in89.com.tw/",
      },
    ],
    dataSource: "manual",
  },
  {
    id: "girls-band-cry-part2",
    title: "劇場版 少女樂團吶喊吧【後篇】-嗨, 未來-",
    titleJa: "劇場版 ガールズバンドクライ【後篇】",
    titleEn: "Girls Band Cry The Movie: Hey, Our Future",
    releaseDate: "2026-01-30",
    posterUrl: "/posters/girls-band-cry.jpg",
    synopsis:
      "成立「TOGENASHI TOGEARI」的仁菜，開始正視自己曾經拋下的故鄉。桃香則直面自己曾經離開的樂團「鑽石星塵」。在各自克服過去的兩人影響之下，眾人也受到鼓舞，決心跨越過往、朝成為職業音樂人邁進。",
    genre: ["動畫", "音樂", "劇情"],
    duration: 111,
    rating: "PG",
    theaterBonuses: [
      {
        theaterId: "vieshow",
        theaterName: "威秀影城",
        bonuses: [
          { week: 1, description: "特製 A4 資料夾（仁菜 & 桃香 雙面款）", quantity: "每場次前 40 名" },
        ],
        ticketUrl: "https://www.vscinemas.com.tw/",
      },
      {
        theaterId: "showtimes",
        theaterName: "秀泰影城",
        bonuses: [
          { week: 1, description: "樂團成員明信片組（5入）", quantity: "每場次前 30 名" },
        ],
        ticketUrl: "https://www.showtimes.com.tw/",
      },
    ],
    dataSource: "manual",
  },
  {
    id: "konosuba-legend-of-crimson",
    title: "為美好的世界獻上祝福！紅傳說",
    titleJa: "この素晴らしい世界に祝福を！紅伝説",
    titleEn: "KonoSuba! Legend of Crimson",
    releaseDate: "2026-01-23",
    posterUrl: "/posters/konosuba.jpg",
    synopsis:
      "喜歡電玩的繭居族佐藤和真原本應該因為交通意外，草草結束人生，卻出人意料地帶著女廢物女神‧阿克婭轉生到異世界。和真跟三個能力高超卻無可救藥的人結伴行動，最大的危機即將襲向和真一行人！",
    genre: ["動畫", "喜劇", "奇幻"],
    duration: 89,
    rating: "PG-12",
    theaterBonuses: [
      {
        theaterId: "vieshow",
        theaterName: "威秀影城",
        bonuses: [
          { week: 1, description: "惠惠特製色紙（爆裂魔法版）", quantity: "每場次前 30 名" },
          { week: 2, description: "角色迷你海報（隨機 1 款，共 4 款）", quantity: "每場次前 20 名" },
        ],
        ticketUrl: "https://www.vscinemas.com.tw/",
      },
      {
        theaterId: "ambassador",
        theaterName: "國賓影城",
        bonuses: [
          { week: 1, description: "阿克婭 & 惠惠 雙面海報", quantity: "每場次前 25 名" },
        ],
        ticketUrl: "https://www.ambassador.com.tw/",
      },
      {
        theaterId: "in89",
        theaterName: "in89 豪華數位影城",
        bonuses: [
          { week: 1, description: "電影特製透明卡（隨機 1 款）", quantity: "每日前 15 名" },
        ],
        ticketUrl: "https://www.in89.com.tw/",
      },
    ],
    dataSource: "manual",
  },
  {
    id: "princess-mononoke-imax",
    title: "魔法公主 IMAX 4K 數位紀念版",
    titleJa: "もののけ姫",
    titleEn: "Princess Mononoke",
    releaseDate: "2026-01-23",
    posterUrl: "/posters/mononoke.jpg",
    synopsis:
      "宮﨑駿經典不敗動畫睽違 27 年重返大銀幕。中世紀末社會中的大團體組織崩解，瀰漫一股渾沌的現象，人類數目急速增加，許多原生林開始遭到破壞，在一片常綠樹的黑森林當中，存活著具靈性的野獸，共同對抗入侵的人類。",
    genre: ["動畫", "奇幻", "冒險"],
    duration: 134,
    rating: "PG",
    theaterBonuses: [
      {
        theaterId: "vieshow",
        theaterName: "威秀影城",
        bonuses: [
          { week: 1, description: "IMAX 限定海報（第 1 款）", quantity: "每場次前 50 名" },
          { week: 2, description: "IMAX 限定海報（第 2 款）", quantity: "每場次前 50 名" },
          { week: 3, description: "一般版限定海報（第 3 款）", quantity: "每場次前 40 名" },
          { week: 4, description: "一般版限定海報（第 4 款）", quantity: "每場次前 40 名" },
        ],
        ticketUrl: "https://www.vscinemas.com.tw/",
      },
      {
        theaterId: "ambassador",
        theaterName: "國賓影城",
        bonuses: [
          { week: 1, description: "吉卜力紀念海報", quantity: "每場次前 30 名" },
        ],
        ticketUrl: "https://www.ambassador.com.tw/",
      },
      {
        theaterId: "showtimes",
        theaterName: "秀泰影城",
        bonuses: [
          { week: 1, description: "魔法公主限定海報", quantity: "每場次前 35 名" },
        ],
        ticketUrl: "https://www.showtimes.com.tw/",
      },
      {
        theaterId: "miramar",
        theaterName: "美麗華影城",
        bonuses: [
          { week: 1, description: "IMAX 限定海報", quantity: "每場次前 40 名" },
        ],
        ticketUrl: "https://www.miramarcinemas.tw/",
      },
    ],
    dataSource: "manual",
    isVerified: true,
    isRerelease: true,
  },
  {
    id: "butt-detective-star-moon",
    title: "電影屁屁偵探：星星與月亮",
    titleJa: "映画おしりたんてい ほしとつき",
    titleEn: "Butt Detective the Movie: Star and Moon",
    releaseDate: "2026-01-23",
    posterUrl: "/posters/butt-detective.jpg",
    synopsis:
      "改編全球熱銷 3000 萬冊人氣兒童原作《屁屁偵探》。屁屁偵探接到來自無尾熊小妹的委託，希望能幫她找到在偶像甄選比賽中消失的親戚。為了阻止學院的陰謀，屁屁偵探和怪盜U決定暫時聯手對抗敵人。",
    genre: ["動畫", "兒童", "冒險"],
    duration: 76,
    rating: "G",
    theaterBonuses: [
      {
        theaterId: "vieshow",
        theaterName: "威秀影城",
        bonuses: [
          { week: 1, description: "屁屁偵探特製貼紙組（6入）", quantity: "每場次前 50 名" },
        ],
        ticketUrl: "https://www.vscinemas.com.tw/",
      },
      {
        theaterId: "showtimes",
        theaterName: "秀泰影城",
        bonuses: [
          { week: 1, description: "屁屁偵探 A5 著色畫紙", quantity: "每場次前 40 名" },
        ],
        ticketUrl: "https://www.showtimes.com.tw/",
      },
    ],
    dataSource: "manual",
  },
  {
    id: "return-to-silent-hill",
    title: "重返沉默之丘",
    titleEn: "Return to Silent Hill",
    releaseDate: "2026-01-23",
    posterUrl: "/posters/silent-hill.jpg",
    synopsis:
      "在失去畢生摯愛瑪麗後，傷心欲絕的詹姆斯始終無法走出陰影。然而某一天，詹姆斯收到一封瑪麗自沉默之丘寄出、充滿謎團的信。為了再見上瑪麗一面並找出真相，詹姆斯重返兩人當初邂逅的小鎮，卻驚訝地發現這裡已淪為被恐怖生物占據的荒涼異境。",
    genre: ["恐怖", "驚悚"],
    duration: 105,
    rating: "R",
    theaterBonuses: [
      {
        theaterId: "vieshow",
        theaterName: "威秀影城",
        bonuses: [
          { week: 1, description: "三角頭特製海報", quantity: "每場次前 30 名" },
        ],
        ticketUrl: "https://www.vscinemas.com.tw/",
      },
      {
        theaterId: "miramar",
        theaterName: "美麗華影城",
        bonuses: [
          { week: 1, description: "電影明信片（隨機 1 款，共 3 款）", quantity: "每場次前 25 名" },
        ],
        ticketUrl: "https://www.miramarcinemas.tw/",
      },
    ],
    dataSource: "manual",
  },
  {
    id: "mercy",
    title: "關鍵公敵",
    titleEn: "Mercy",
    releaseDate: "2026-02-06",
    posterUrl: "/posters/mercy.jpg",
    synopsis:
      "在不遠的未來，一個高階警探因被指控謀殺妻子接受AI法庭審判。在定罪行刑之前，他只有 90 分鐘向曾經極度推崇的 AI 法官證明自己的清白。由克里斯普瑞特、蕾貝卡弗格森主演。",
    genre: ["科幻", "驚悚", "劇情"],
    duration: 100,
    rating: "PG-12",
    theaterBonuses: [
      {
        theaterId: "vieshow",
        theaterName: "威秀影城",
        bonuses: [
          { week: 1, description: "電影限定海報", quantity: "每場次前 30 名" },
        ],
        ticketUrl: "https://www.vscinemas.com.tw/",
      },
    ],
    dataSource: "manual",
  },
  {
    id: "send-help",
    title: "荒島囚救",
    titleEn: "Send Help",
    releaseDate: "2026-01-29",
    posterUrl: "/posters/send-help.jpg",
    synopsis:
      "兩名同事在飛機失事後成為唯一倖存者並困在荒島上，他們必須放下過往恩怨、共同求生，但最終演變成一場不安又黑色幽默的意志與智慧對決。山姆雷米執導，瑞秋麥亞當斯與狄倫歐布萊恩主演。",
    genre: ["喜劇", "驚悚", "冒險"],
    duration: 113,
    rating: "PG-12",
    theaterBonuses: [
      {
        theaterId: "vieshow",
        theaterName: "威秀影城",
        bonuses: [
          { week: 1, description: "電影限定明信片", quantity: "每場次前 20 名" },
        ],
        ticketUrl: "https://www.vscinemas.com.tw/",
      },
    ],
    dataSource: "manual",
  },
  {
    id: "zootopia-2",
    title: "動物方城市2",
    titleEn: "Zootopia 2",
    releaseDate: "2025-11-26",
    posterUrl: "/posters/zootopia2.jpg",
    synopsis:
      "警官哈茱蒂和胡尼克將再次合體，追查一名潛入動物方城市、並將其鬧得天翻地覆的神秘爬行動物。為了破案，茱蒂和尼克必須潛入城市中從未有動物踏足的新區域，他們看似堅不可摧的關係也將面臨前所未有的考驗。",
    genre: ["動畫", "喜劇", "冒險"],
    duration: 107,
    rating: "G",
    theaterBonuses: [
      {
        theaterId: "vieshow",
        theaterName: "威秀影城",
        bonuses: [
          { week: 1, description: "茱蒂 & 尼克 特製海報", quantity: "數量有限，送完為止" },
        ],
        ticketUrl: "https://www.vscinemas.com.tw/",
      },
      {
        theaterId: "ambassador",
        theaterName: "國賓影城",
        bonuses: [
          { week: 1, description: "動物方城市2 造型貼紙（隨機 1 款）", quantity: "每場次前 30 名" },
        ],
        ticketUrl: "https://www.ambassador.com.tw/",
      },
    ],
    dataSource: "manual",
  },
  {
    id: "avatar-fire-and-ash",
    title: "阿凡達：火與燼",
    titleEn: "Avatar: Fire and Ash",
    releaseDate: "2025-12-17",
    posterUrl: "/posters/avatar3.jpg",
    synopsis:
      "新一集的《阿凡達》將觀眾再次帶回潘朵拉星球，展開一段全新的沉浸式冒險，故事圍繞身為前海軍陸戰隊員的納美人蘇傑克、戰士奈蒂莉及蘇里家族展開。本集為前三集的三部曲總結篇章。",
    genre: ["科幻", "冒險", "動作"],
    duration: 197,
    rating: "PG-12",
    theaterBonuses: [
      {
        theaterId: "vieshow",
        theaterName: "威秀影城",
        bonuses: [
          { week: 1, description: "IMAX 限定海報", quantity: "每場次前 50 名" },
        ],
        ticketUrl: "https://www.vscinemas.com.tw/",
      },
      {
        theaterId: "miramar",
        theaterName: "美麗華影城",
        bonuses: [
          { week: 1, description: "IMAX 3D 限定海報", quantity: "每場次前 40 名" },
        ],
        ticketUrl: "https://www.miramarcinemas.tw/",
      },
    ],
    dataSource: "manual",
  },
];

// ============================================================================
// Helper functions
// ============================================================================

export function getMovieById(id: string): MovieData | undefined {
  return movies.find((m) => m.id === id);
}

export function getTheaterById(id: string): Theater | undefined {
  return theaters.find((t) => t.id === id);
}

export function getVerifiedMovies(): MovieData[] {
  return movies.filter((m) => m.isVerified);
}

export function getMoviesByTheater(theaterId: string): MovieData[] {
  return movies.filter((m) =>
    m.theaterBonuses.some((tb) => tb.theaterId === theaterId)
  );
}
