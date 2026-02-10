/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://paruparu.vercel.app',
  generateRobotsTxt: true,
  generateIndexSitemap: true,
  changefreq: 'daily',
  priority: 0.7,
  sitemapSize: 5000,
  exclude: [
    '/admin/*',
    '/api/*',
    '/_next/*',
    '/404',
    '/500',
    '/admin',
    '/admin/login',
    '/admin/forgot-password',
    '/admin/reset-password',
    '/server-sitemap.xml',
  ],
};
