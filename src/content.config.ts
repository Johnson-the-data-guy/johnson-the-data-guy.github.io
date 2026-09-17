import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Schemas are strict: an unknown frontmatter key (a misspelt `draft`, say)
// fails the build instead of being silently ignored.

const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.md' }),
  schema: z.strictObject({
    title: z.string().min(1),
    description: z.string().min(1),
    date: z.coerce.date(),
    tags: z.array(z.string().min(1)),
    // Must match the `slug` of an entry in src/content/projects/.
    project: z.string().optional(),
    kind: z.enum(['design', 'tool', 'incident', 'correction', 'completion']),
    draft: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  // The glob loader uses the `slug` field as the entry id.
  loader: glob({ base: './src/content/projects', pattern: '**/*.{yaml,yml}' }),
  schema: z.strictObject({
    title: z.string().min(1),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, digits and hyphens'),
    company: z.string().min(1),
    summary: z.string().min(1),
    stack: z.array(z.string().min(1)),
    repo: z.url({ protocol: /^https?$/ }),
    diagram: z
      .string()
      .regex(/^\/diagrams\/[\w-]+(?:\/[\w-]+)*\.svg$/, 'Use a path like /diagrams/name.svg')
      .optional(),
    order: z.number(),
    status: z.enum(['in-progress', 'complete']),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts, projects };
