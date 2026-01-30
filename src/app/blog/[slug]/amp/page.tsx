import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import AmpBlogPost from '@/components/blog/AmpBlogPost';
import { BlogPost } from '@/lib/types';

// This would typically come from your API client
async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1/blog/posts/${slug}`,
      { 
        next: { revalidate: 3600 }, // Revalidate every hour
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

type Props = {
  params: { slug: string };
};

// Generate metadata for AMP page
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost(params.slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/blog/${params.slug}`;
  const ampUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/blog/${params.slug}/amp`;

  return {
    title: `${post.seo_title || post.title} (AMP)`,
    description: post.seo_description || post.excerpt,
    alternates: {
      canonical: canonicalUrl,
      types: {
        'application/rss+xml': `${process.env.NEXT_PUBLIC_SITE_URL}/blog/rss.xml`,
      },
    },
    openGraph: {
      title: post.og_title || post.title,
      description: post.og_description || post.excerpt,
      images: post.cover_image ? [post.cover_image] : undefined,
      type: 'article',
      url: ampUrl,
    },
    other: {
      // Mark this as an AMP page
      'amp': '',
    },
  };
}

export default async function AmpBlogPostPage({ params }: Props) {
  const post = await getPost(params.slug);

  if (!post) {
    notFound();
  }

  const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/blog/${params.slug}`;

  return (
    <>
      {/* Add AMP-specific headers */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            // AMP runtime
            (function() {
              const ampScript = document.createElement('script');
              ampScript.async = true;
              ampScript.src = 'https://cdn.ampproject.org/v0.js';
              document.head.appendChild(ampScript);
              
              // AMP Analytics
              const analyticsScript = document.createElement('script');
              analyticsScript.async = true;
              analyticsScript.src = 'https://cdn.ampproject.org/v0/amp-analytics-0.1.js';
              analyticsScript.setAttribute('custom-element', 'amp-analytics');
              document.head.appendChild(analyticsScript);
            })();
          `
        }}
      />
      
      <AmpBlogPost 
        post={post} 
        canonicalUrl={canonicalUrl}
      />
    </>
  );
}

// Generate static params for static generation
export async function generateStaticParams() {
  try {
    // Fetch published blog posts
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1/blog/posts?status=published&limit=100`,
      { 
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch posts for static generation');
      return [];
    }

    const data = await response.json();
    const posts = data.success ? data.data : [];

    return posts.map((post: BlogPost) => ({
      slug: post.slug,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}