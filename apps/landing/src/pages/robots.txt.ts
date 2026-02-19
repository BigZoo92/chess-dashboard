import type { APIRoute } from 'astro';

export const prerender = true;

const fallbackSite = new URL('https://chess-dashboard.enzogivernaud.fr/');
const site = new URL(import.meta.env.SITE ?? fallbackSite.toString());

export const GET: APIRoute = () => {
  const sitemapUrl = new URL('/sitemap.xml', site).toString();
  const lines = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /health',
    'Disallow: /dashboard',
    'Disallow: /dashboard/',
    `Sitemap: ${sitemapUrl}`
  ];
  const body = `${lines.join('\n')}\n`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8'
    }
  });
};
