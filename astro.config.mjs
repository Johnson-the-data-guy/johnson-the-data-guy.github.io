// @ts-check
import { satteri } from '@astrojs/markdown-satteri';
import { defineConfig, fontProviders } from 'astro/config';
import { codeComments } from './src/lib/code-comments.ts';

export default defineConfig({
  site: 'https://johnson-the-data-guy.github.io',
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  markdown: {
    // No syntax highlighter. Code is two-tone: comments are marked at build
    // time and set in --muted, everything else in --ink.
    syntaxHighlight: false,
    processor: satteri({ hastPlugins: [codeComments] }),
  },
  // Fonts are downloaded at build time and served from this site.
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Newsreader',
      cssVariable: '--font-newsreader',
      // Regular and one bold. No optical-size axis.
      weights: [400, 600],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      fallbacks: ['Georgia', 'serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Archivo',
      cssVariable: '--font-archivo',
      weights: ['400 700'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
  ],
  devToolbar: {
    enabled: false,
  },
});
