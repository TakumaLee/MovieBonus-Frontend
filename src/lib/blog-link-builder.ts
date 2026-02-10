// @ts-nocheck
/**
 * Blog Internal Link Builder
 * 
 * This module provides utilities for automatically generating and managing
 * internal links within blog content to improve SEO and user navigation.
 */

import { BlogPost, Movie, RelatedPost } from './types';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://paruparu.vercel.app';

// Types for internal link building
export interface InternalLink {
  type: 'blog_post' | 'movie' | 'category' | 'tag';
  target_id: string;
  target_slug: string;
  anchor_text: string;
  url: string;
  relevance_score: number;
  context?: string;
  suggested_placement: 'contextual' | 'related_section' | 'footer';
  position_in_content?: number;
}

export interface LinkBuildingOptions {
  maxLinksPerPost?: number;
  minRelevanceScore?: number;
  includeMovieLinks?: boolean;
  includeCategoryLinks?: boolean;
  includeTagLinks?: boolean;
  contextWindow?: number; // Characters around the link
  avoidOverLinking?: boolean; // Prevent too many links in small content sections
}

export interface TopicCluster {
  cluster_name: string;
  cluster_type: 'category' | 'tag' | 'movie' | 'custom';
  posts: Array<{
    id: string;
    title: string;
    slug: string;
    view_count: number;
    published_at: string;
  }>;
  posts_count: number;
  total_views: number;
  avg_views: number;
  common_tags: string[];
  suggested_pillar_content?: {
    id: string;
    title: string;
    slug: string;
    view_count: number;
  };
}

/**
 * Class for building internal links within blog content
 */
export class BlogLinkBuilder {
  private options: Required<LinkBuildingOptions>;

  constructor(options: LinkBuildingOptions = {}) {
    this.options = {
      maxLinksPerPost: options.maxLinksPerPost ?? 10,
      minRelevanceScore: options.minRelevanceScore ?? 0.3,
      includeMovieLinks: options.includeMovieLinks ?? true,
      includeCategoryLinks: options.includeCategoryLinks ?? true,
      includeTagLinks: options.includeTagLinks ?? true,
      contextWindow: options.contextWindow ?? 100,
      avoidOverLinking: options.avoidOverLinking ?? true,
    };
  }

  /**
   * Generate internal links for a blog post
   */
  async generateInternalLinks(
    post: BlogPost,
    relatedPosts: RelatedPost[] = [],
    movies: Movie[] = []
  ): Promise<InternalLink[]> {
    const links: InternalLink[] = [];

    // 1. Generate post-to-post links
    const postLinks = this.generatePostLinks(post, relatedPosts);
    links.push(...postLinks);

    // 2. Generate movie links
    if (this.options.includeMovieLinks) {
      const movieLinks = this.generateMovieLinks(post, movies);
      links.push(...movieLinks);
    }

    // 3. Generate category links
    if (this.options.includeCategoryLinks && post.category) {
      const categoryLinks = this.generateCategoryLinks(post);
      links.push(...categoryLinks);
    }

    // 4. Generate tag links
    if (this.options.includeTagLinks) {
      const tagLinks = this.generateTagLinks(post);
      links.push(...tagLinks);
    }

    // Filter and sort by relevance
    const filteredLinks = links
      .filter(link => link.relevance_score >= this.options.minRelevanceScore)
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, this.options.maxLinksPerPost);

    // Apply over-linking prevention
    if (this.options.avoidOverLinking) {
      return this.preventOverLinking(post.content, filteredLinks);
    }

    return filteredLinks;
  }

  /**
   * Generate links to related blog posts
   */
  private generatePostLinks(post: BlogPost, relatedPosts: RelatedPost[]): InternalLink[] {
    const links: InternalLink[] = [];

    relatedPosts.forEach(relatedPost => {
      // Check if the post title or keywords appear in content
      const titleVariants = [
        relatedPost.title,
        relatedPost.title.replace(/[：:]/g, ''),
        this.extractKeywords(relatedPost.title)[0]
      ].filter(Boolean);

      titleVariants.forEach(variant => {
        const context = this.findContextInContent(post.content, variant);
        if (context) {
          const relevanceScore = this.calculatePostRelevance(post, relatedPost);
          
          links.push({
            type: 'blog_post',
            target_id: relatedPost.id,
            target_slug: relatedPost.slug,
            anchor_text: variant,
            url: `/blog/${relatedPost.slug}`,
            relevance_score: relevanceScore,
            context: context.text,
            suggested_placement: 'contextual',
            position_in_content: context.position
          });
        }
      });
    });

    return links;
  }

  /**
   * Generate links to movie pages
   */
  private generateMovieLinks(post: BlogPost, movies: Movie[]): InternalLink[] {
    const links: InternalLink[] = [];

    movies.forEach(movie => {
      const titleVariants = [
        movie.title,
        movie.english_title,
        movie.title.replace(/[：:]/g, ''),
        movie.english_title?.replace(/[：:]/g, '')
      ].filter(Boolean);

      titleVariants.forEach(variant => {
        if (variant && post.content.toLowerCase().includes(variant.toLowerCase())) {
          const context = this.findContextInContent(post.content, variant);
          
          links.push({
            type: 'movie',
            target_id: movie.id,
            target_slug: movie.vieshow_movie_id,
            anchor_text: variant,
            url: `/movie/${movie.id}`,
            relevance_score: 0.8,
            context: context?.text,
            suggested_placement: 'contextual',
            position_in_content: context?.position
          });
        }
      });
    });

    return links;
  }

  /**
   * Generate links to category pages
   */
  private generateCategoryLinks(post: BlogPost): InternalLink[] {
    const links: InternalLink[] = [];

    if (post.category) {
      const categoryKeywords = [
        post.category.name,
        post.category.name_en,
        `${post.category.name}相關`,
        `${post.category.name}文章`
      ].filter(Boolean);

      categoryKeywords.forEach(keyword => {
        if (keyword && post.content.includes(keyword)) {
          const context = this.findContextInContent(post.content, keyword);
          
          links.push({
            type: 'category',
            target_id: post.category!.id,
            target_slug: post.category!.slug,
            anchor_text: keyword,
            url: `/blog/category/${post.category!.slug}`,
            relevance_score: 0.6,
            context: context?.text,
            suggested_placement: 'contextual',
            position_in_content: context?.position
          });
        }
      });
    }

    return links;
  }

  /**
   * Generate links to tag pages
   */
  private generateTagLinks(post: BlogPost): InternalLink[] {
    const links: InternalLink[] = [];

    post.tags.forEach(tag => {
      const tagKeywords = [
        tag,
        `#${tag}`,
        `${tag}相關`,
        `關於${tag}`
      ];

      tagKeywords.forEach(keyword => {
        if (post.content.includes(keyword)) {
          const context = this.findContextInContent(post.content, keyword);
          
          links.push({
            type: 'tag',
            target_id: tag,
            target_slug: encodeURIComponent(tag),
            anchor_text: keyword,
            url: `/blog/tag/${encodeURIComponent(tag)}`,
            relevance_score: 0.4,
            context: context?.text,
            suggested_placement: 'contextual',
            position_in_content: context?.position
          });
        }
      });
    });

    return links;
  }

  /**
   * Calculate relevance between current post and related post
   */
  private calculatePostRelevance(currentPost: BlogPost, relatedPost: RelatedPost): number {
    let score = 0;

    // Same category bonus
    if (currentPost.category?.id === relatedPost.category?.id) {
      score += 0.4;
    }

    // Same movie bonus
    if (currentPost.primary_movie_id && currentPost.primary_movie_id === relatedPost.id) {
      score += 0.5;
    }

    // Tag overlap
    if (currentPost.tags && relatedPost.category) {
      const categoryAsTag = relatedPost.category.name;
      if (currentPost.tags.includes(categoryAsTag)) {
        score += 0.2;
      }
    }

    // Reading time similarity (prefer similar length content)
    const timeDiff = Math.abs((currentPost.reading_time || 5) - (relatedPost.reading_time || 5));
    if (timeDiff <= 2) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Find context around a keyword in content
   */
  private findContextInContent(content: string, keyword: string): { text: string; position: number } | null {
    const cleanContent = content.replace(/<[^>]*>/g, ' ');
    const keywordIndex = cleanContent.toLowerCase().indexOf(keyword.toLowerCase());
    
    if (keywordIndex === -1) return null;
    
    const start = Math.max(0, keywordIndex - this.options.contextWindow);
    const end = Math.min(cleanContent.length, keywordIndex + keyword.length + this.options.contextWindow);
    
    return {
      text: cleanContent.substring(start, end).trim(),
      position: keywordIndex
    };
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    // Remove HTML and split by common delimiters
    const cleanText = text.replace(/<[^>]*>/g, ' ');
    const words = cleanText
      .split(/[\s,，。！？；：\n\r]+/)
      .filter(word => word.length > 1)
      .map(word => word.trim());

    // Filter out stop words
    const stopWords = ['的', '是', '在', '有', '和', '或', '但', '這', '那', 'the', 'a', 'an', 'and', 'or', 'but'];
    return words.filter(word => !stopWords.includes(word.toLowerCase()));
  }

  /**
   * Prevent over-linking by ensuring links are well-distributed
   */
  private preventOverLinking(content: string, links: InternalLink[]): InternalLink[] {
    const contentLength = content.length;
    const minDistance = Math.floor(contentLength / (links.length * 2)); // Minimum distance between links
    
    const sortedLinks = links.sort((a, b) => 
      (a.position_in_content || 0) - (b.position_in_content || 0)
    );

    const finalLinks: InternalLink[] = [];
    let lastPosition = -minDistance;

    for (const link of sortedLinks) {
      const linkPosition = link.position_in_content || 0;
      
      if (linkPosition - lastPosition >= minDistance) {
        finalLinks.push(link);
        lastPosition = linkPosition;
      }
    }

    return finalLinks;
  }
}

/**
 * Auto-inject internal links into HTML content
 */
export function injectInternalLinks(content: string, links: InternalLink[]): string {
  let processedContent = content;
  
  // Sort links by position in reverse order to avoid position shifting
  const sortedLinks = links
    .filter(link => link.position_in_content !== undefined)
    .sort((a, b) => (b.position_in_content || 0) - (a.position_in_content || 0));

  sortedLinks.forEach(link => {
    const anchorText = link.anchor_text;
    const linkHtml = `<a href="${link.url}" class="internal-link" data-link-type="${link.type}" title="${anchorText}">${anchorText}</a>`;
    
    // Replace first occurrence of anchor text with link
    const regex = new RegExp(escapeRegex(anchorText), 'i');
    const match = processedContent.match(regex);
    
    if (match) {
      processedContent = processedContent.replace(regex, linkHtml);
    }
  });

  return processedContent;
}

/**
 * Generate topic clusters for content strategy
 */
export async function generateTopicClusters(
  posts: BlogPost[],
  options: { minClusterSize?: number; maxClusters?: number } = {}
): Promise<TopicCluster[]> {
  const { minClusterSize = 3, maxClusters = 20 } = options;
  const clusters: Record<string, TopicCluster> = {};

  // Group by category first
  posts.forEach(post => {
    const categoryName = post.category?.name || 'uncategorized';
    
    if (!clusters[categoryName]) {
      clusters[categoryName] = {
        cluster_name: categoryName,
        cluster_type: 'category',
        posts: [],
        posts_count: 0,
        total_views: 0,
        avg_views: 0,
        common_tags: []
      };
    }

    clusters[categoryName].posts.push({
      id: post.id,
      title: post.title,
      slug: post.slug,
      view_count: post.view_count,
      published_at: post.published_at || post.created_at
    });

    clusters[categoryName].total_views += post.view_count;
    
    // Collect common tags
    post.tags.forEach(tag => {
      if (!clusters[categoryName].common_tags.includes(tag)) {
        clusters[categoryName].common_tags.push(tag);
      }
    });
  });

  // Calculate cluster statistics and identify pillar content
  Object.values(clusters).forEach(cluster => {
    cluster.posts_count = cluster.posts.length;
    cluster.avg_views = cluster.posts_count > 0 ? 
      Math.round(cluster.total_views / cluster.posts_count) : 0;
    
    // Sort posts by view count and identify pillar content
    cluster.posts.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
    cluster.suggested_pillar_content = cluster.posts[0];
  });

  // Filter clusters by minimum size and sort by total views
  return Object.values(clusters)
    .filter(cluster => cluster.posts_count >= minClusterSize)
    .sort((a, b) => b.total_views - a.total_views)
    .slice(0, maxClusters);
}

/**
 * Generate related posts suggestions based on content analysis
 */
export function generateRelatedPostsSuggestions(
  currentPost: BlogPost,
  allPosts: BlogPost[],
  options: { limit?: number; minSimilarity?: number } = {}
): RelatedPost[] {
  const { limit = 5, minSimilarity = 0.2 } = options;
  
  const suggestions = allPosts
    .filter(post => post.id !== currentPost.id)
    .map(post => {
      const similarity = calculateContentSimilarity(currentPost, post);
      
      return {
        ...post,
        similarity_score: similarity
      };
    })
    .filter(post => post.similarity_score >= minSimilarity)
    .sort((a, b) => b.similarity_score - a.similarity_score)
    .slice(0, limit);

  return suggestions;
}

/**
 * Calculate content similarity between two posts
 */
function calculateContentSimilarity(post1: BlogPost, post2: BlogPost): number {
  let similarity = 0;

  // Category similarity
  if (post1.category?.id === post2.category?.id) {
    similarity += 0.3;
  }

  // Movie similarity
  if (post1.primary_movie_id && post1.primary_movie_id === post2.primary_movie_id) {
    similarity += 0.4;
  }

  // Tag similarity
  if (post1.tags && post2.tags) {
    const commonTags = post1.tags.filter(tag => post2.tags.includes(tag));
    similarity += Math.min(commonTags.length * 0.1, 0.3);
  }

  // Title keyword similarity
  const post1Keywords = extractSimpleKeywords(post1.title);
  const post2Keywords = extractSimpleKeywords(post2.title);
  const commonKeywords = post1Keywords.filter(keyword => post2Keywords.includes(keyword));
  similarity += Math.min(commonKeywords.length * 0.05, 0.2);

  return Math.min(similarity, 1.0);
}

/**
 * Simple keyword extraction for similarity calculation
 */
function extractSimpleKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2)
    .filter(word => !['的', '是', '在', '有', '和', '或', '但', 'the', 'and', 'or'].includes(word));
}

/**
 * Escape special regex characters
 */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * API client functions for backend SEO endpoints
 */
export class BlogSEOClient {
  private baseUrl: string;

  constructor(baseUrl: string = SITE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetch related posts from backend
   */
  async getRelatedPosts(slug: string, limit: number = 5): Promise<RelatedPost[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/blog/seo/related-posts/${slug}?limit=${limit}`);
      const data = await response.json();
      
      if (data.success) {
        return data.data.related_posts || [];
      }
      
      throw new Error(data.error || 'Failed to fetch related posts');
    } catch (error) {
      console.error('Error fetching related posts:', error);
      return [];
    }
  }

  /**
   * Fetch internal link suggestions from backend
   */
  async getInternalLinks(slug: string, limit: number = 10): Promise<InternalLink[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/blog/seo/internal-links/${slug}?limit=${limit}`);
      const data = await response.json();
      
      if (data.success) {
        return data.data.internal_links || [];
      }
      
      throw new Error(data.error || 'Failed to fetch internal links');
    } catch (error) {
      console.error('Error fetching internal links:', error);
      return [];
    }
  }

  /**
   * Fetch topic clusters from backend
   */
  async getTopicClusters(category?: string, limit: number = 10): Promise<TopicCluster[]> {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      params.append('limit', limit.toString());
      
      const response = await fetch(`${this.baseUrl}/api/v1/blog/seo/topic-clusters?${params}`);
      const data = await response.json();
      
      if (data.success) {
        return data.data.topic_clusters || [];
      }
      
      throw new Error(data.error || 'Failed to fetch topic clusters');
    } catch (error) {
      console.error('Error fetching topic clusters:', error);
      return [];
    }
  }
}

export default {
  BlogLinkBuilder,
  BlogSEOClient,
  injectInternalLinks,
  generateTopicClusters,
  generateRelatedPostsSuggestions
};