import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { KIND_LABELS, getPosts, postUrl } from '../lib/content';
import { SITE } from '../site';

export const GET: APIRoute = async ({ site }) => {
  if (!site) throw new Error('Set `site` in astro.config.mjs');

  const posts = await getPosts();

  return rss({
    title: SITE.name,
    description: SITE.description,
    site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: postUrl(post),
      categories: [KIND_LABELS[post.data.kind], ...post.data.tags],
    })),
    customData: `<language>${SITE.lang}</language>`,
  });
};
