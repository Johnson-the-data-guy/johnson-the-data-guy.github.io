import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const escapeAttr = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/**
 * Reads a pre-exported SVG from public/ at build time and returns markup
 * that can be inlined. Inlining (rather than <img>) lets diagrams drawn with
 * `currentColor` follow the light and dark palettes.
 */
export async function loadDiagram(publicPath: string, label: string): Promise<string> {
  const file = join(process.cwd(), 'public', publicPath);

  let source: string;
  try {
    source = await readFile(file, 'utf8');
  } catch {
    throw new Error(`Diagram not found: ${publicPath} (looked for ${file})`);
  }

  const svg = source
    .replace(/<\?xml[\s\S]*?\?>/g, '')
    .replace(/<!DOCTYPE[\s\S]*?>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim();

  if (!/^<svg[\s>]/.test(svg)) {
    throw new Error(`Diagram is not an SVG document: ${publicPath}`);
  }

  // Give the diagram an accessible name unless the export already has one.
  return svg.replace(/^<svg\b([^>]*)>/, (_match, attrs: string) => {
    let extra = '';
    if (!/\srole=/.test(attrs)) extra += ' role="img"';
    if (!/\saria-label(?:ledby)?=/.test(attrs)) extra += ` aria-label="${escapeAttr(label)}"`;
    return `<svg${attrs}${extra}>`;
  });
}
