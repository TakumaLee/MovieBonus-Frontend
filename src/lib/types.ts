/**
 * TypeScript Type Definitions for MovieBonus Frontend
 * 
 * These types match the backend API response structures
 * and Supabase database schema
 */

// ============================================================================
// Core Database Types (matching Supabase schema)
// ============================================================================

export type MovieStatus = 'showing' | 'coming_soon' | 'ended';
export type GiftType = 'physical' | 'digital' | 'experience' | 'discount';
export type FormatType = 'digital' | 'imax' | '4dx' | 'vr' | 'titan' | 'mucrown';
export type DataSource = 'manual' | 'scraper' | 'user-report' | 'vieshow' | 'ambassador' | 'showtime' | 'miramar' | 'in89';

// Movie entity
export interface Movie {
  id: string; // 資料庫主鍵 UUID（主要使用的識別符）
  movie_id: string; // 額外的電影標識符
  title: string;
  english_title?: string;
  vieshow_movie_id: string;
  status: MovieStatus;
  genre: string[];
  rating?: string; // 分級
  duration?: number; // 片長（分鐘）
  director: string[];
  movie_cast: string[]; // 注意：資料庫欄位名為 movie_cast
  synopsis?: string;
  release_date?: string;
  end_date?: string;
  poster_url?: string;
  trailer_url?: string;
  gallery: string[];
  // Bonus information (populated by API)
  has_bonuses?: boolean;
  bonus_count?: number;
  // SEO fields (new fields from backend SEO implementation)
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  og_title?: string;
  og_description?: string;
  canonical_url?: string;
  // Data provenance fields (from MVP integration)
  /** Data source tag for transparency */
  data_source?: DataSource;
  /** true = confirmed real data; false/undefined = unverified */
  is_verified?: boolean;

  created_at: string;
  updated_at: string;
}

// Movie promotion/bonus entity
export interface MoviePromotion {
  id: string;
  movie_id: string;
  promotion_type: string;
  title: string;
  description?: string;
  release_date?: string;
  end_date?: string;
  acquisition_method?: string;
  terms_and_conditions?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Related data
  gifts?: PromotionGift[];
}

// Promotion gift entity
export interface PromotionGift {
  id: string;
  promotion_id: string;
  gift_name: string;
  gift_type?: GiftType;
  gift_description?: string;
  gift_image_url?: string;
  quantity?: number;
  per_person_limit: number;
  estimated_value?: number;
  is_exclusive: boolean;
  created_at: string;
  updated_at: string;
}

// Cinema entity
export interface Cinema {
  id: string;
  cinema_id: string;
  name: string;
  location?: string;
  address?: string;
  phone?: string;
  features: string[]; // ['IMAX', '4DX', 'VR', 'GOLD CLASS']
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Scrape session entity
export interface ScrapeSession {
  id: string;
  session_type: 'all' | 'showing' | 'coming';
  start_time: string;
  end_time?: string;
  total_movies_scraped: number;
  total_pages_scraped: number;
  status: string;
  error_message?: string;
  created_at: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

// Generic API response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    limit: number;
    offset: number;
    count: number;
    has_more: boolean;
  };
}

// Movie query parameters
export interface MovieQueryParams {
  status?: MovieStatus;
  limit?: number;
  offset?: number;
  search?: string;
  vieshow_movie_id?: string;
}

// Promotion query parameters
export interface PromotionQueryParams {
  status?: 'active' | 'inactive' | 'expired';
  movie_id?: string;
  promotion_type?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// Vieshow API Types
// ============================================================================

export interface VieshowMoviesResponse {
  success: boolean;
  message: string;
  scraped_count: number;
  page_info: {
    current_page: number;
    total_pages: number;
    movies_per_page: number;
  };
  execution_time: number;
  movies: Movie[];
  session_id?: string;
}

export interface VieshowScrapeRequest {
  target?: 'all' | 'showing' | 'coming';
  page_limit?: number;
  force_refresh?: boolean;
  save_to_supabase?: boolean;
}

export interface VieshowScrapeResponse {
  success: boolean;
  message: string;
  scraped_count: number;
  page_info: {
    current_page: number;
    total_pages: number;
    movies_per_page: number;
  };
  execution_time: number;
  movies: Movie[];
  session_id?: string;
}

// ============================================================================
// Movie Search Types
// ============================================================================

export interface MovieSearchQuery {
  title: string;
  search_type?: 'exact' | 'fuzzy' | 'smart';
  min_similarity?: number;
  max_results?: number;
}

export interface MovieBatchSearchRequest {
  queries: MovieSearchQuery[];
  return_all_if_no_match?: boolean;
}

export interface MovieSearchResult {
  query_title: string;
  matched_movies: Movie[];
  search_method: string;
  similarity_scores: number[];
  processing_time: number;
}

export interface MovieBatchSearchResponse {
  success: boolean;
  message: string;
  total_queries: number;
  total_matches: number;
  results: MovieSearchResult[];
  processing_time: number;
}

// ============================================================================
// Facebook API Types
// ============================================================================

export interface FacebookSinglePostRequest {
  post_url: string;
  extract_comments?: boolean;
  max_execution_time?: number;
}

export interface FacebookPostData {
  id: string;
  content: string;
  length: number;
  type: string;
  keywords: string[];
  features: {
    hasLinks: boolean;
    hasHashtags: boolean;
    hasPrice: boolean;
    hasDate: boolean;
  };
}

export interface FacebookSinglePostResponse {
  status: 'success' | 'error';
  post_url: string;
  post_data?: FacebookPostData;
  execution_time: number;
  message?: string;
}

export interface FacebookPromotionAnalysisRequest {
  page_url: string;
  save_to_supabase?: boolean;
  max_posts?: number;
}

export interface FacebookPromotionAnalysisResponse {
  status: 'success' | 'error';
  page_url: string;
  total_posts_analyzed: number;
  movies_found: number;
  promotions_matched: any[];
  analysis_summary: any;
  supabase_saved: boolean;
  processing_time: number;
}

// ============================================================================
// Movie Bonuses Types
// ============================================================================

export interface MovieBonusSaveRequest {
  bonuses: MovieBonusData[];
  source_info?: {
    platform: string;
    url: string;
    extraction_date: string;
  };
}

export interface MovieBonusData {
  id: string;
  movie_name: string;
  bonuses: string[];
  acquisition_method: string;
  release_date: string;
  notes: string;
  post_type: string;
  original_content: string;
}

export interface MovieBonusSaveResponse {
  success: boolean;
  message: string;
  total_bonuses: number;
  successful_saves: number;
  failed_saves: number;
  processing_time: number;
  saved_bonuses: Array<{
    movie_name: string;
    movie_id?: string;
    vieshow_movie_id?: string;
    promotion_id: string;
    bonuses_saved: number;
    matched_method: string;
    confidence_score: number;
  }>;
}

// ============================================================================
// Health Check Types
// ============================================================================

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services?: {
    database?: 'up' | 'down';
    cache?: 'up' | 'down';
    external_apis?: 'up' | 'down';
  };
  version?: string;
  service?: string;
  features?: string[];
}

// ============================================================================
// Save Movies Types
// ============================================================================

export interface SaveMoviesRequest {
  movies: Movie[];
  session_type?: string;
  force_update?: boolean;
  create_session?: boolean;
}

export interface SaveMoviesResponse {
  success: boolean;
  message: string;
  session_id?: string;
  total_movies: number;
  successful_saves: number;
  failed_saves: number;
  new_movies: number;
  updated_movies: number;
  execution_time: number;
  errors: Array<{ [key: string]: any }>;
}

// ============================================================================
// Frontend-Specific Types (UI State Management)
// ============================================================================

// Loading states
export interface LoadingState {
  isLoading: boolean;
  error?: string;
  lastUpdated?: Date;
}

// Movie card display data
export interface MovieCardData {
  id: string;
  title: string;
  posterUrl: string;
  hasBonus: boolean;
  status: MovieStatus;
  releaseDate?: string;
}

// Movie detail page data
export interface MovieDetailData extends Movie {
  bonuses: MoviePromotion[];
  isLoading?: boolean;
  error?: string;
}

// Search state
export interface SearchState {
  query: string;
  results: Movie[];
  isSearching: boolean;
  suggestions: string[];
  history: string[];
}

// App state
export interface AppState {
  currentUser?: any; // 暫時未實作認證
  theme: 'light' | 'dark';
  language: 'zh-TW' | 'en-US';
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

// ============================================================================
// Legacy Types (for backward compatibility with existing AI flow)
// ============================================================================

export interface CurateMovieBonusesInput {
  movieTitle: string;
}

export interface CurateMovieBonusesOutput {
  bonuses: Array<{
    bonusName: string;
    description: string;
    imageUrl: string;
    distributionPeriod: string;
    rules: string;
  }>;
}

// ============================================================================
// Utility Types
// ============================================================================

export type WithTimestamps<T> = T & {
  created_at: string;
  updated_at: string;
};

export type CreateInput<T> = Omit<T, 'id' | 'created_at' | 'updated_at'>;
export type UpdateInput<T> = Partial<CreateInput<T>>;

// Form validation types
export type FormErrors<T> = {
  [K in keyof T]?: string;
};

export type AsyncStatus = 'idle' | 'pending' | 'success' | 'error';

export interface AsyncState<T> {
  data?: T;
  status: AsyncStatus;
  error?: string;
}

// ============================================================================
// Blog System Types (New Blog Feature)
// ============================================================================

export type BlogPostStatus = 'draft' | 'published' | 'scheduled' | 'archived';

export interface BlogAuthor {
  id: string;
  name: string;
  email: string;
  bio?: string;
  avatar_url?: string;
  social_links?: {
    twitter?: string;
    facebook?: string;
    line?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface BlogCategory {
  id: string;
  slug: string;
  name: string;
  name_en?: string;
  description?: string;
  description_en?: string;
  color?: string;
  icon?: string;
  parent_id?: string;
  sort_order: number;
  is_active: boolean;
  post_count?: number;
  children?: BlogCategory[];
  created_at: string;
  updated_at: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  content: string;
  cover_image?: string;
  status: BlogPostStatus;
  author_id: string;
  category_id: string;
  primary_movie_id?: string;
  related_movie_ids?: string[];
  tags: string[];
  reading_time?: number;
  view_count: number;
  like_count: number;
  share_count: number;
  comment_count: number;
  is_featured: boolean;
  
  // SEO fields
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  canonical_url?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  twitter_title?: string;
  twitter_description?: string;
  twitter_image?: string;
  
  // Scheduling
  published_at?: string;
  scheduled_at?: string;
  
  // Content metadata
  content_blocks?: BlogContentBlock[];
  related_posts?: string[];
  
  // Populated relationships
  author?: BlogAuthor;
  category?: BlogCategory;
  primary_movie?: Movie;
  related_movies?: Movie[];
  
  created_at: string;
  updated_at: string;
}

export interface BlogContentBlock {
  id: string;
  post_id: string;
  block_type: 'text' | 'image' | 'video' | 'quote' | 'code' | 'movie_card' | 'promotion_card';
  content: any; // JSON content specific to block type
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlogSEOData {
  title: string;
  description: string;
  keywords: string[];
  canonical_url: string;
  og_title: string;
  og_description: string;
  og_image: string;
  og_type: string;
  og_url: string;
  twitter_card: string;
  twitter_title: string;
  twitter_description: string;
  twitter_image: string;
  structured_data: any; // JSON-LD structured data
  robots: string;
  author: string;
  publish_date: string;
  modified_date: string;
}

export interface BlogAnalytics {
  id: string;
  post_id?: string;
  event_type: 'view' | 'like' | 'share' | 'comment' | 'read_complete';
  user_id?: string;
  session_id: string;
  ip_hash: string;
  user_agent: string;
  referrer?: string;
  device_type: 'desktop' | 'mobile' | 'tablet';
  country?: string;
  page_url: string;
  engagement_data?: {
    scroll_depth?: number;
    time_on_page?: number;
    interactions?: number;
  };
  created_at: string;
}

// ============================================================================
// Blog API Request/Response Types
// ============================================================================

export interface BlogPostQueryParams {
  status?: BlogPostStatus;
  category?: string;
  tag?: string;
  author?: string;
  movie_id?: string;
  featured?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  sort?: 'newest' | 'oldest' | 'popular' | 'trending';
  include_related?: boolean;
}

export interface BlogPostsResponse extends PaginatedResponse<BlogPost> {
  categories?: BlogCategory[];
  tags?: string[];
  featured_posts?: BlogPost[];
}

export interface BlogSearchParams {
  q: string;
  category?: string;
  tag?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export interface BlogSearchResult {
  posts: BlogPost[];
  suggestions: string[];
  trending_searches: string[];
  total_results: number;
  search_time: number;
}

export interface PopularPost {
  id: string;
  slug: string;
  title: string;
  view_count: number;
  published_at: string;
}

export interface RelatedPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover_image?: string;
  category: BlogCategory;
  published_at: string;
  reading_time: number;
}

export interface BlogDashboardStats {
  total_posts: number;
  published_posts: number;
  draft_posts: number;
  total_views: number;
  total_likes: number;
  total_shares: number;
  popular_posts: PopularPost[];
  recent_posts: BlogPost[];
  categories_stats: Array<{
    category: BlogCategory;
    post_count: number;
    total_views: number;
  }>;
  performance_metrics: {
    avg_reading_time: number;
    bounce_rate: number;
    engagement_rate: number;
  };
}

// ============================================================================
// Blog Content Generation Types
// ============================================================================

export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  target_length: number;
  structure: string[];
  seo_focus: string[];
}

export interface ContentGenerationRequest {
  template_id: string;
  movie_id?: string;
  custom_parameters?: {
    tone?: 'professional' | 'casual' | 'enthusiastic';
    target_audience?: 'general' | 'film_enthusiasts' | 'families';
    focus_keywords?: string[];
    include_promotions?: boolean;
  };
}

export interface GeneratedContent {
  title: string;
  content: string;
  excerpt: string;
  seo_title: string;
  seo_description: string;
  suggested_tags: string[];
  estimated_reading_time: number;
  content_quality_score: number;
}

// ============================================================================
// Blog UI State Types
// ============================================================================

export interface BlogState {
  posts: BlogPost[];
  categories: BlogCategory[];
  currentPost?: BlogPost;
  isLoading: boolean;
  error?: string;
  searchQuery: string;
  searchResults: BlogPost[];
  popularPosts: PopularPost[];
  featuredPosts: BlogPost[];
  pagination: {
    current_page: number;
    total_pages: number;
    has_more: boolean;
  };
}

export interface ReadingProgress {
  totalHeight: number;
  currentPosition: number;
  percentage: number;
  currentSection: string;
  timeSpent: number;
}

export interface ShareData {
  url: string;
  title: string;
  description: string;
  image?: string;
  hashtags?: string[];
}

export interface CommentData {
  id: string;
  post_id: string;
  author_name: string;
  author_email: string;
  content: string;
  parent_id?: string;
  is_approved: boolean;
  created_at: string;
  replies?: CommentData[];
}

export interface TableOfContentsItem {
  id: string;
  text: string;
  level: number;
  slug: string;
  isActive: boolean;
}

// ============================================================================
// Taiwan-Specific Types
// ============================================================================

export interface LineShareConfig {
  enabled: boolean;
  app_id?: string;
  share_text_template: string;
}

export interface LocalizationConfig {
  primary_language: 'zh-TW';
  fallback_language: 'en-US';
  date_format: string;
  number_format: string;
  social_platforms: ('line' | 'facebook' | 'twitter' | 'instagram')[];
}

export default {};