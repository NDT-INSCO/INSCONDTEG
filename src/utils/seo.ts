/**
 * SEO utilities — hreflang, canonical, and dynamic head management
 * for the multilingual INSCO site.
 *
 * The site is a single-page app hosted at https://ndt-insco.github.io/INSCONDTEG/
 * All routes use hash fragments (#company, #academy, etc.) — crawlers see
 * them as one URL, so we expose language variants via query param `?lang=xx`
 * and let the GeoLocale banner + TranslatorRobot handle the actual rendering.
 */

import { SITE_LANGUAGES } from '../i18n/languages';

export const SITE_URL = 'https://ndt-insco.github.io/INSCONDTEG/';
export const SITE_NAME = 'INSCO — International Company for Services & Contracting';
export const SITE_NAME_AR = 'الشركة الدولية للخدمات والمقاولات (إنسكو)';

export interface SeoConfig {
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  path?: string; // hash path like #academy or #company/services
  lang?: string; // active language code
  image?: string;
  type?: 'website' | 'article';
}

/**
 * Generate hreflang links for all supported languages.
 * Returns array of { hreflang, href } for injection into <head>.
 */
export function generateHreflangLinks(currentPath: string = ''): Array<{ hreflang: string; href: string }> {
  const base = SITE_URL.replace(/\/$/, '');
  const path = currentPath ? `${base}/${currentPath}` : base;

  const links: Array<{ hreflang: string; href: string }> = [
    { hreflang: 'x-default', href: `${base}/` },
    { hreflang: 'ar', href: `${base}/?lang=ar` },
    { hreflang: 'en', href: `${base}/?lang=en` },
  ];

  // Add popular languages as hreflang alternates (full list would be 110+ tags — too heavy)
  const popular = SITE_LANGUAGES.filter(l => l.popular && l.code !== 'ar' && l.code !== 'en');
  for (const lang of popular) {
    // Convert registry code to hreflang format (zh-CN -> zh-CN, pt-BR -> pt-BR)
    const hreflang = lang.code.toLowerCase();
    links.push({ hreflang, href: `${base}/?lang=${lang.code}` });
  }

  return links;
}

/**
 * Inject/update hreflang <link> tags into document head.
 * Idempotent — removes old hreflang links first.
 */
export function injectHreflangLinks(path: string = ''): void {
  if (typeof document === 'undefined') return;

  // Remove existing hreflang links we injected
  document.querySelectorAll('link[data-insco-hreflang]').forEach(el => el.remove());

  const links = generateHreflangLinks(path);
  const head = document.head;

  for (const { hreflang, href } of links) {
    const link = document.createElement('link');
    link.rel = 'alternate';
    link.hreflang = hreflang;
    link.href = href;
    link.setAttribute('data-insco-hreflang', 'true');
    head.appendChild(link);
  }
}

/**
 * Update document title, meta description, canonical, and OG tags.
 */
export function updateSeoTags(config: SeoConfig): void {
  if (typeof document === 'undefined') return;

  const { title, description, path, lang, image, type = 'website' } = config;
  const canonical = path ? `${SITE_URL}${path}` : SITE_URL;
  const ogImage = image || `${SITE_URL}images/hero_ndt_inspection_1792692322245.jpg`;

  // Title
  document.title = title.includes(SITE_NAME) || title.includes(SITE_NAME_AR)
    ? title
    : `${title} | ${lang === 'ar' ? SITE_NAME_AR : SITE_NAME}`;

  // Meta description
  setMeta('name', 'description', description);

  // Canonical
  let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonicalEl) {
    canonicalEl = document.createElement('link');
    canonicalEl.rel = 'canonical';
    document.head.appendChild(canonicalEl);
  }
  canonicalEl.href = canonical;

  // Open Graph
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:url', canonical);
  setMeta('property', 'og:type', type);
  setMeta('property', 'og:image', ogImage);
  setMeta('property', 'og:locale', lang === 'ar' ? 'ar_EG' : lang === 'en' ? 'en_US' : lang ? `${lang}_${lang.toUpperCase()}` : 'ar_EG');

  // Twitter
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', description);
  setMeta('name', 'twitter:image', ogImage);

  // Language
  if (lang) {
    document.documentElement.lang = lang;
  }

  // JSON-LD breadcrumb for current path
  updateJsonLdBreadcrumb(path || '', title);
}

function setMeta(attr: 'name' | 'property', key: string, value: string): void {
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = value;
}

function updateJsonLdBreadcrumb(path: string, title: string): void {
  const existing = document.getElementById('insco-breadcrumb-ld');
  if (existing) existing.remove();

  if (!path || path === '#') return;

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'الرئيسية | Home',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: title,
        item: `${SITE_URL}${path}`,
      },
    ],
  };

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = 'insco-breadcrumb-ld';
  script.textContent = JSON.stringify(breadcrumb);
  document.head.appendChild(script);
}

/**
 * Generate sitemap.xml content for all portals and languages.
 * Used at build time to create public/sitemap.xml
 */
export function generateSitemapXml(): string {
  const base = SITE_URL.replace(/\/$/, '');
  const now = new Date().toISOString().split('T')[0];

  const routes = [
    { path: '', priority: '1.0', changefreq: 'weekly' },
    { path: '#company', priority: '0.9', changefreq: 'weekly' },
    { path: '#company/services', priority: '0.8', changefreq: 'monthly' },
    { path: '#company/demo', priority: '0.7', changefreq: 'monthly' },
    { path: '#academy', priority: '0.9', changefreq: 'weekly' },
    { path: '#academy/disciplines', priority: '0.8', changefreq: 'monthly' },
    { path: '#client', priority: '0.7', changefreq: 'weekly' },
    { path: '#network', priority: '0.7', changefreq: 'weekly' },
  ];

  const urls = routes.map(route => {
    const loc = route.path ? `${base}/${route.path}` : base;
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.w3.org/1999/xlink" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}
