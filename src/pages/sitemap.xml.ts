import type { APIRoute } from 'astro';
import { getPosts, getProjects, isoDate, postUrl, projectUrl } from '../lib/content';

const escapeXml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const GET: APIRoute = async ({ site }) => {
  if (!site) throw new Error('Set `site` in astro.config.mjs');

  const [posts, projects] = await Promise.all([getPosts(), getProjects()]);

  const pages: { path: string; lastmod?: Date }[] = [
    { path: '/', ...(posts[0] && { lastmod: posts[0].data.date }) },
    { path: '/projects/' },
    { path: '/about/' },
    ...posts.map((post) => ({ path: postUrl(post), lastmod: post.data.date })),
    ...projects.map((project) => ({ path: projectUrl(project) })),
  ];

  const urls = pages.map(({ path, lastmod }) => {
    const loc = `<loc>${escapeXml(new URL(path, site).href)}</loc>`;
    return lastmod ? `  <url>${loc}<lastmod>${isoDate(lastmod)}</lastmod></url>` : `  <url>${loc}</url>`;
  });

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');

  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
