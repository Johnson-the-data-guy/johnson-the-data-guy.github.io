/**
 * Marks comments in fenced code blocks with <span class="comment"> so they
 * can be set in a second tone. There is no other highlighting. Runs as a
 * hast plugin on Astro's Markdown processor, Sätteri.
 *
 * Detection is lexical, not a parser: it skips over quoted strings and knows
 * each language's comment markers, but not heredocs, regex literals or
 * nested block comments. A block with no language, or one not listed below,
 * is left as it is.
 */

import type { SatteriProcessorOptions } from '@astrojs/markdown-satteri';

interface Syntax {
  /** Markers that comment out the rest of the line. */
  line: string[];
  /** Line markers that only count at the start of a line or after whitespace. */
  lineAfterSpace?: string[];
  block?: [open: string, close: string][];
  /** Characters that open a string. */
  quotes?: string;
  /** Of those, the ones whose strings may run across lines. */
  multiline?: string;
}

const HASH: Syntax = { line: [], lineAfterSpace: ['#'], quotes: `"'` };
const C_LIKE: Syntax = { line: ['//'], block: [['/*', '*/']], quotes: `"'\``, multiline: '`' };

const SYNTAXES: Record<string, Syntax> = {
  ...alias(['sh', 'bash', 'shell', 'zsh', 'fish'], { ...HASH, quotes: `"'\``, multiline: `"'\`` }),
  ...alias(['yaml', 'yml', 'toml', 'python', 'py', 'ruby', 'rb', 'perl', 'r'], HASH),
  ...alias(['dockerfile', 'docker', 'make', 'makefile', 'nginx', 'conf', 'properties', 'env', 'dotenv', 'gitignore', 'promql'], HASH),
  ...alias(['powershell', 'ps1', 'pwsh'], { ...HASH, block: [['<#', '#>']] }),
  ...alias(['ini', 'cfg'], { ...HASH, lineAfterSpace: ['#', ';'] }),
  ...alias(['hcl', 'terraform', 'tf', 'tfvars'], { ...C_LIKE, lineAfterSpace: ['#'], quotes: '"', multiline: '' }),
  ...alias(
    ['js', 'javascript', 'mjs', 'cjs', 'ts', 'typescript', 'jsx', 'tsx', 'go', 'golang', 'java', 'kotlin', 'kt',
     'scala', 'groovy', 'jenkinsfile', 'c', 'h', 'cpp', 'c++', 'cs', 'csharp', 'rust', 'rs', 'swift', 'dart',
     'proto', 'protobuf', 'jsonc', 'json5', 'cue'],
    C_LIKE,
  ),
  ...alias(['php'], { ...C_LIKE, lineAfterSpace: ['#'] }),
  ...alias(['jsonnet', 'libsonnet'], { ...C_LIKE, lineAfterSpace: ['#'] }),
  ...alias(['css', 'scss', 'less'], { line: [], block: [['/*', '*/']], quotes: `"'` }),
  ...alias(['sql', 'psql', 'mysql', 'postgres', 'postgresql', 'plsql'], {
    line: ['--'],
    block: [['/*', '*/']],
    quotes: `'"`,
    multiline: `'`,
  }),
  ...alias(['lua', 'haskell', 'hs'], { line: ['--'], quotes: `"'` }),
  ...alias(['html', 'xml', 'svg', 'xhtml', 'plist'], { line: [], block: [['<!--', '-->']] }),
};

function alias(names: string[], syntax: Syntax): Record<string, Syntax> {
  return Object.fromEntries(names.map((name) => [name, syntax]));
}

interface Segment {
  text: string;
  comment: boolean;
}

/** Splits code into alternating plain and comment segments. */
function splitComments(code: string, syntax: Syntax): Segment[] {
  const segments: Segment[] = [];
  let plainFrom = 0;
  let quote: string | null = null;
  let i = 0;

  const addComment = (from: number, to: number) => {
    if (from > plainFrom) segments.push({ text: code.slice(plainFrom, from), comment: false });
    segments.push({ text: code.slice(from, to), comment: true });
    plainFrom = to;
  };

  while (i < code.length) {
    const ch = code[i]!;

    if (quote) {
      if (ch === '\\') {
        i += 2;
        continue;
      }
      if (ch === quote || (ch === '\n' && !syntax.multiline?.includes(quote))) quote = null;
      i++;
      continue;
    }

    // A quote after a letter or digit is an apostrophe (it's, don't), not a string.
    if (syntax.quotes?.includes(ch) && !/\w/.test(code[i - 1] ?? '')) {
      quote = ch;
      i++;
      continue;
    }

    const block = syntax.block?.find(([open]) => code.startsWith(open, i));
    if (block) {
      const close = code.indexOf(block[1], i + block[0].length);
      const end = close === -1 ? code.length : close + block[1].length;
      addComment(i, end);
      i = end;
      continue;
    }

    const atWordStart = i === 0 || /\s/.test(code[i - 1]!);
    const isLine =
      syntax.line.some((marker) => code.startsWith(marker, i)) ||
      (atWordStart && syntax.lineAfterSpace?.some((marker) => code.startsWith(marker, i)));
    if (isLine) {
      const newline = code.indexOf('\n', i);
      const end = newline === -1 ? code.length : newline;
      addComment(i, end);
      i = end;
      continue;
    }

    i++;
  }

  if (plainFrom < code.length) segments.push({ text: code.slice(plainFrom), comment: false });
  return segments;
}

// The plugin's types come from the processor it is passed to.
type HastPluginEntry = NonNullable<SatteriProcessorOptions['hastPlugins']>[number];
type HastPlugin = Exclude<HastPluginEntry, Function | readonly unknown[] | null | undefined | false>;
type ElementVisitor = Exclude<NonNullable<HastPlugin['element']>, readonly unknown[]>;
type HastElement = Parameters<ElementVisitor['visit']>[0];
type HastChild = HastElement['children'][number];

function languageOf(code: HastElement): string | undefined {
  const className = code.properties['className'];
  const classes = Array.isArray(className) ? className : [];
  const language = classes.find(
    (name): name is string => typeof name === 'string' && name.startsWith('language-'),
  );
  return language?.slice('language-'.length).toLowerCase();
}

/** A Sätteri hast plugin: pass it to `satteri({ hastPlugins: [...] })`. */
export const codeComments: HastPlugin = {
  name: 'code-comments',
  element: {
    filter: ['pre'],
    visit(pre, ctx) {
      const [code] = pre.children;
      if (pre.children.length !== 1 || code?.type !== 'element' || code.tagName !== 'code') return;

      const language = languageOf(code);
      const syntax = language ? SYNTAXES[language] : undefined;
      if (!syntax) return;

      const segments = splitComments(ctx.textContent(code), syntax);
      if (!segments.some((segment) => segment.comment)) return;

      const children = segments.map(({ text, comment }): HastChild =>
        comment
          ? {
              type: 'element',
              tagName: 'span',
              properties: { className: ['comment'] },
              children: [{ type: 'text', value: text }],
            }
          : { type: 'text', value: text },
      );

      return { ...pre, children: [{ ...code, children }] };
    },
  },
};
