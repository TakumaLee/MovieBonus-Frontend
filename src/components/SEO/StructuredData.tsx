'use client';

import { sanitizeJsonLd } from '@/lib/sanitize';

interface OrganizationSchema {
  '@context': string;
  '@type': string;
  name: string;
  url: string;
  description: string;
  logo?: string;
  sameAs?: string[];
}

interface WebsiteSchema {
  '@context': string;
  '@type': string;
  name: string;
  url: string;
  description: string;
  publisher: {
    '@type': string;
    name: string;
  };
  potentialAction: {
    '@type': string;
    target: {
      '@type': string;
      urlTemplate: string;
    };
    'query-input': string;
  };
}

interface MovieSchema {
  '@context': string;
  '@type': string;
  name: string;
  description?: string;
  image?: string;
  genre?: string[];
  datePublished?: string;
  url: string;
  publisher: {
    '@type': string;
    name: string;
  };
  offers?: {
    '@type': string;
    availability: string;
    price?: string;
    priceCurrency?: string;
  };
  aggregateRating?: {
    '@type': string;
    ratingValue?: number;
    ratingCount?: number;
    bestRating?: number;
    worstRating?: number;
  };
  director?: {
    '@type': string;
    name: string;
  };
  actor?: Array<{
    '@type': string;
    name: string;
  }>;
}

interface BreadcrumbSchema {
  '@context': string;
  '@type': string;
  itemListElement: Array<{
    '@type': string;
    position: number;
    name: string;
    item?: string;
  }>;
}

interface FAQSchema {
  '@context': string;
  '@type': string;
  mainEntity: Array<{
    '@type': string;
    name: string;
    acceptedAnswer: {
      '@type': string;
      text: string;
    };
  }>;
}

interface StructuredDataProps {
  type: 'website' | 'movie' | 'organization' | 'breadcrumb' | 'faq';
  data?: {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    genre?: string[];
    datePublished?: string;
    price?: string;
    rating?: {
      value: number;
      count: number;
    };
    director?: string;
    actors?: string[];
    breadcrumbs?: Array<{
      name: string;
      url?: string;
    }>;
    faqs?: Array<{
      question: string;
      answer: string;
    }>;
  };
}

export function StructuredData({ type, data }: StructuredDataProps) {
  const baseUrl = 'https://paruparu.vercel.app';
  
  const generateSchema = () => {
    switch (type) {
      case 'organization':
        const organizationSchema: OrganizationSchema = {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: '特典速報 パルパル',
          url: baseUrl,
          description: '台灣最完整的電影特典與限定禮品追蹤平台',
          // logo: `${baseUrl}/logo.png`, // Uncomment when logo is available
          sameAs: [
            // 可以添加社交媒體連結
          ],
        };
        return organizationSchema;

      case 'website':
        const websiteSchema: WebsiteSchema = {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: '特典速報 パルパル',
          url: baseUrl,
          description: '台灣最完整的電影特典與限定禮品追蹤平台。即時更新威秀影城、各大電影院的獨家特典資訊，不錯過任何精彩好康！',
          publisher: {
            '@type': 'Organization',
            name: '特典速報 パルパル',
          },
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${baseUrl}/?q={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
          },
        };
        return websiteSchema;

      case 'movie':
        const movieSchema: MovieSchema = {
          '@context': 'https://schema.org',
          '@type': 'Movie',
          name: data?.title || '電影',
          description: data?.description,
          image: data?.image,
          genre: data?.genre,
          datePublished: data?.datePublished,
          url: data?.url || baseUrl,
          publisher: {
            '@type': 'Organization',
            name: '特典速報 パルパル',
          },
        };

        if (data?.price) {
          movieSchema.offers = {
            '@type': 'Offer',
            availability: 'https://schema.org/InStock',
            price: data.price,
            priceCurrency: 'TWD',
          };
        }

        if (data?.rating) {
          movieSchema.aggregateRating = {
            '@type': 'AggregateRating',
            ratingValue: data.rating.value,
            ratingCount: data.rating.count,
            bestRating: 5,
            worstRating: 1,
          };
        }

        if (data?.director) {
          movieSchema.director = {
            '@type': 'Person',
            name: data.director,
          };
        }

        if (data?.actors && data.actors.length > 0) {
          movieSchema.actor = data.actors.map(actor => ({
            '@type': 'Person',
            name: actor,
          }));
        }

        return movieSchema;

      case 'breadcrumb':
        if (!data?.breadcrumbs) return null;
        
        const breadcrumbSchema: BreadcrumbSchema = {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: data.breadcrumbs.map((crumb, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: crumb.name,
            ...(crumb.url && { item: crumb.url }),
          })),
        };
        return breadcrumbSchema;

      case 'faq':
        if (!data?.faqs || data.faqs.length === 0) return null;
        
        const faqSchema: FAQSchema = {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: data.faqs.map(faq => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.answer,
            },
          })),
        };
        return faqSchema;

      default:
        return null;
    }
  };

  const schema = generateSchema();

  if (!schema) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: sanitizeJsonLd(schema),
      }}
    />
  );
}