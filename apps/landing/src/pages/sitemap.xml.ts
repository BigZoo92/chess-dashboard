import type { APIRoute } from 'astro';

export const prerender = true;

const fallbackSite = new URL('https://chess-dashboard.enzogivernaud.fr/');
const site = new URL(import.meta.env.SITE ?? fallbackSite.toString());

const pages = [
  {
    path: '/',
    changefreq: 'weekly',
    priority: '1.0'
  }
];

export const GET: APIRoute = () => {
  const urls = pages
    .map(
      ({ path, changefreq, priority }) => `<url><loc>${new URL(path, site).toString()}</loc><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`
    )
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8'
    }
  });
};
