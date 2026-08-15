// Post-build: inject brand <head> metadata into the exported SPA index.html.
// Expo's `output: "single"` emits a default head and ignores app/+html.tsx, so
// we patch the title + favicon/apple-touch-icon + Open Graph/Twitter tags here
// (crawlers need these in the served HTML, not set at runtime).
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'dist/index.html';
const TITLE = 'Hauliday — Know before you haul';
const DESCRIPTION =
  'Scan a product abroad and instantly see what it costs at home, whether it is even sold there, and if it is worth the luggage space.';
const SITE = 'https://hauliday.app';
const OG_IMAGE = `${SITE}/og.png`;

let html = readFileSync(FILE, 'utf8');

html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${TITLE}</title>`);

if (!html.includes('og:image')) {
  const tags = `    <meta name="description" content="${DESCRIPTION}"/>
    <meta name="theme-color" content="#F8A7AC"/>
    <link rel="apple-touch-icon" href="/apple-touch-icon.png"/>
    <meta property="og:type" content="website"/>
    <meta property="og:site_name" content="Hauliday"/>
    <meta property="og:title" content="${TITLE}"/>
    <meta property="og:description" content="${DESCRIPTION}"/>
    <meta property="og:url" content="${SITE}"/>
    <meta property="og:image" content="${OG_IMAGE}"/>
    <meta property="og:image:width" content="1200"/>
    <meta property="og:image:height" content="630"/>
    <meta name="twitter:card" content="summary_large_image"/>
    <meta name="twitter:title" content="${TITLE}"/>
    <meta name="twitter:description" content="${DESCRIPTION}"/>
    <meta name="twitter:image" content="${OG_IMAGE}"/>
`;
  html = html.replace('</head>', `${tags}  </head>`);
}

writeFileSync(FILE, html);
console.log('[inject-head] brand meta + OG tags injected into', FILE);
