// @ts-nocheck
// Google Analytics 配置
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || '';

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Enhanced event tracking for movie and SEO analytics
export const trackEvent = {
  // 電影搜尋事件
  movieSearch: (query: string) => {
    event({
      action: 'search',
      category: 'Movie',
      label: query,
    });
  },
  
  // 電影詳情查看事件 - Enhanced with movie data
  movieView: (movieTitle: string, movieId?: string, hasBonuses?: boolean, bonusCount?: number) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'view_item', {
        event_category: 'Movie',
        event_label: movieTitle,
        item_id: movieId,
        item_name: movieTitle,
        item_category: 'Movie',
        custom_dimension_1: movieId,
        custom_dimension_2: movieTitle,
        custom_dimension_3: hasBonuses ? 'yes' : 'no',
        custom_dimension_4: bonusCount,
      });
    }
  },
  
  // 特典查看事件 - Enhanced with bonus data
  promotionView: (promotionTitle: string, movieTitle?: string, promotionType?: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'view_promotion', {
        event_category: 'Promotion',
        event_label: promotionTitle,
        promotion_name: promotionTitle,
        item_category: promotionType || 'movie_bonus',
        custom_dimension_2: movieTitle,
      });
    }
  },
  
  // 外部連結點擊事件
  externalLink: (url: string, linkType?: 'movie_trailer' | 'cinema_link' | 'promotion_link') => {
    event({
      action: 'click',
      category: 'External Link',
      label: url,
      value: linkType === 'movie_trailer' ? 5 : 1, // Higher value for trailer clicks
    });
  },
  
  // 反饋提交事件
  feedbackSubmit: (type: string) => {
    event({
      action: 'submit',
      category: 'Feedback',
      label: type,
    });
  },

  // SEO-related events
  seoEvents: {
    // Track structured data impressions
    structuredDataImpression: (schemaType: string, movieTitle?: string) => {
      event({
        action: 'structured_data_impression',
        category: 'SEO',
        label: `${schemaType}_schema`,
        value: 1,
      });
    },

    // Track meta tag generation
    metaTagGeneration: (pageType: string, hasCustomSEO: boolean) => {
      event({
        action: 'meta_tag_generation',
        category: 'SEO',
        label: `${pageType}_${hasCustomSEO ? 'custom' : 'default'}`,
      });
    },

    // Track canonical URL usage
    canonicalURL: (hasCustomCanonical: boolean) => {
      event({
        action: 'canonical_url',
        category: 'SEO',
        label: hasCustomCanonical ? 'custom' : 'default',
      });
    }
  },

  // Enhanced e-commerce tracking for bonuses
  ecommerce: {
    // Track bonus "purchase" (viewing/claiming)
    viewItem: (movieTitle: string, bonusTitle: string, bonusValue?: number) => {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'view_item', {
          currency: 'TWD',
          value: bonusValue || 0,
          items: [{
            item_id: `${movieTitle}_${bonusTitle}`,
            item_name: bonusTitle,
            item_category: 'Movie Bonus',
            item_category2: movieTitle,
            quantity: 1,
            price: bonusValue || 0
          }]
        });
      }
    },

    // Track bonus interest/engagement
    addToWishlist: (movieTitle: string, bonusTitle: string) => {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'add_to_wishlist', {
          currency: 'TWD',
          value: 0,
          items: [{
            item_id: `${movieTitle}_${bonusTitle}`,
            item_name: bonusTitle,
            item_category: 'Movie Bonus',
            item_category2: movieTitle,
            quantity: 1
          }]
        });
      }
    }
  }
};