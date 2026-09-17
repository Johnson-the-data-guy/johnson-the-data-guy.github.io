// Site identity. The canonical domain lives in astro.config.mjs (`site`).
export const SITE = {
  name: 'Johnson Samuel',
  // The single line of identity at the top of every page.
  identity: 'Notes from building and breaking infrastructure.',
  github: 'https://github.com/Johnson-the-data-guy',
  description:
    'A DevOps engineer’s dated record of design decisions, tools used on real problems, and incident post-mortems.',
  lang: 'en',
  locale: 'en_GB',
} as const;
