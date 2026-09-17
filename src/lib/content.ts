import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;
export type Project = CollectionEntry<'projects'>;
export type Kind = Post['data']['kind'];

export const KIND_LABELS: Record<Kind, string> = {
  design: 'Design decision',
  tool: 'Tool',
  incident: 'Incident',
  correction: 'Correction',
  completion: 'Completion',
};

export const STATUS_LABELS: Record<Project['data']['status'], string> = {
  'in-progress': 'In progress',
  complete: 'Complete',
};

/**
 * Drafts exist only under `astro dev`, where they are listed and rendered so
 * they can be previewed in place. The build leaves them out entirely: no
 * page, no listing, no RSS item, no sitemap entry.
 */
export const SHOW_DRAFTS = import.meta.env.DEV;

interface DraftOptions {
  drafts?: boolean;
}

/** Posts, newest first. Drafts are left out unless `drafts` is true. */
export async function getPosts({ drafts = false }: DraftOptions = {}): Promise<Post[]> {
  const posts = await getCollection('posts', (post) => drafts || !post.data.draft);
  return posts.sort(
    (a, b) =>
      b.data.date.valueOf() - a.data.date.valueOf() || a.data.title.localeCompare(b.data.title),
  );
}

/** Projects by `order`. Drafts are left out unless `drafts` is true. */
export async function getProjects({ drafts = false }: DraftOptions = {}): Promise<Project[]> {
  const projects = await getCollection('projects', (project) => drafts || !project.data.draft);
  return projects.sort((a, b) => a.data.order - b.data.order);
}

export const postUrl = (post: Post) => `/posts/${post.id}/`;
export const projectUrl = (project: Project) => `/projects/${project.id}/`;

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** "14 Mar 2026", or "14 March 2026" with `long`. Dates are read as UTC. */
export function formatDate(date: Date, style: 'short' | 'long' = 'short'): string {
  const months = style === 'long' ? MONTHS_LONG : MONTHS_SHORT;
  return `${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** "2026-03-14", for `<time datetime>`. */
export const isoDate = (date: Date) => date.toISOString().slice(0, 10);
