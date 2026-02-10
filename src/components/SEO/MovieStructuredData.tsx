'use client';

import { sanitizeJsonLd } from '@/lib/sanitize';

import { Movie, MoviePromotion } from '@/lib/types';

interface MovieSchemaData {
  '@context': string;
  '@type': string;
  name: string;
  description?: string;
  image?: string;
  url: string;
  genre?: string | string[];
  dateCreated?: string;
  director?: Array<{
    '@type': string;
    name: string;
  }>;
  actor?: Array<{
    '@type': string;
    name: string;
  }>;
  aggregateRating?: {
    '@type': string;
    ratingValue?: number;
    ratingCount?: number;
    bestRating?: number;
    worstRating?: number;
  };
  offers?: Array<{
    '@type': string;
    name: string;
    description?: string;
    availability: string;
    price?: string;
    priceCurrency?: string;
    validFrom?: string;
    validThrough?: string;
    category: string;
  }>;
  publisher: {
    '@type': string;
    name: string;
    url: string;
  };
  duration?: string; // ISO 8601 duration format (PT102M for 102 minutes)
  contentRating?: string;
  keywords?: string[];
}

interface MovieStructuredDataProps {
  movie: Movie;
  promotions?: MoviePromotion[];
  url: string;
}

export function MovieStructuredData({ movie, promotions = [], url }: MovieStructuredDataProps) {
  const baseUrl = 'https://paruparu.vercel.app';
  
  // Generate movie schema
  const movieSchema: MovieSchemaData = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: movie.title,
    description: movie.synopsis || movie.seo_description,
    image: movie.poster_url,
    url: url,
    publisher: {
      '@type': 'Organization',
      name: '特典速報 パルパル',
      url: baseUrl,
    },
  };

  // Add genre (handle both string and array formats)
  if (movie.genre && movie.genre.length > 0) {
    movieSchema.genre = Array.isArray(movie.genre) ? movie.genre : [movie.genre];
  }

  // Add release date
  if (movie.release_date) {
    movieSchema.dateCreated = movie.release_date;
  }

  // Add duration in ISO 8601 format
  if (movie.duration) {
    movieSchema.duration = `PT${movie.duration}M`;
  }

  // Add content rating
  if (movie.rating) {
    movieSchema.contentRating = movie.rating;
  }

  // Add director(s)
  if (movie.director && movie.director.length > 0) {
    movieSchema.director = movie.director.map(name => ({
      '@type': 'Person',
      name: name,
    }));
  }

  // Add cast/actors
  if (movie.movie_cast && movie.movie_cast.length > 0) {
    movieSchema.actor = movie.movie_cast.map(name => ({
      '@type': 'Person',
      name: name,
    }));
  }

  // Add SEO keywords
  if (movie.seo_keywords && movie.seo_keywords.length > 0) {
    movieSchema.keywords = movie.seo_keywords;
  }

  // Add promotional offers if available
  if (promotions && promotions.length > 0) {
    movieSchema.offers = promotions.map(promotion => ({
      '@type': 'Offer',
      name: promotion.title,
      description: promotion.description,
      availability: promotion.is_active ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      price: '0', // Most movie bonuses are free
      priceCurrency: 'TWD',
      validFrom: promotion.release_date,
      validThrough: promotion.end_date,
      category: 'MovieBonus',
    }));
  }

  // Generate breadcrumb schema for movie page
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: '特典速報',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: '電影',
        item: `${baseUrl}/#movies`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: movie.title,
        item: url,
      },
    ],
  };

  // Generate organization schema
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: '特典速報 パルパル',
    url: baseUrl,
    description: '台灣最完整的電影特典與限定禮品追蹤平台',
    sameAs: [],
  };

  return (
    <>
      {/* Movie Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: sanitizeJsonLd(movieSchema),
        }}
      />
      
      {/* Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: sanitizeJsonLd(breadcrumbSchema),
        }}
      />
      
      {/* Organization Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: sanitizeJsonLd(organizationSchema),
        }}
      />
      
      {/* FAQ Schema for movie bonuses if available */}
      {promotions && promotions.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: sanitizeJsonLd({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: promotions.slice(0, 5).map(promotion => ({
                '@type': 'Question',
                name: `如何獲得${promotion.title}？`,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: promotion.acquisition_method || promotion.description || `參與${promotion.title}活動即可獲得相關特典。詳情請參考活動頁面說明。`,
                },
              })),
            }),
          }}
        />
      )}
    </>
  );
}