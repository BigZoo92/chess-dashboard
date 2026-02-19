import type { APIRoute } from 'astro';

export const prerender = true;

const fallbackSite = new URL('https://chess-dashboard.enzogivernaud.fr/');
const site = new URL(import.meta.env.SITE ?? fallbackSite.toString());

export const GET: APIRoute = () => {
  // Keep robots.txt parser-friendly: only standard directives.
  const sitemapUrl = new URL('/sitemap.xml', site).toString();
  const directives = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /health',
    'Disallow: /dashboard',
    'Disallow: /dashboard/',
    `Sitemap: ${sitemapUrl}`
  ];
  const body = `${directives.join('\n')}\n`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8'
    }
  });
};
