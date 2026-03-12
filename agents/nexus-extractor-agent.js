#!/usr/bin/env node
// ============================================================================
// NEXUS EXTRACTOR AGENT
// Web scraper that extracts UI components from live websites and adds them
// to the Nexus component library. Uses only built-in Node.js modules.
// ============================================================================

'use strict';

const https = require('https');
const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  libraryDir: path.join(process.cwd(), 'code-library'),
  libraryFile: 'components.json',
  maxRedirects: 5,
  requestTimeout: 15000,
  maxConcurrent: 3,
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  deepMaxPages: 10,
};

// ============================================================================
// BUILT-IN SOURCE CATALOGS
// ============================================================================

const SOURCE_CATALOGS = {
  aceternity: {
    name: 'Aceternity UI',
    baseUrl: 'https://ui.aceternity.com',
    components: [
      { slug: 'spotlight-card', name: 'Spotlight Card', category: 'Cards', tags: ['hover-effect', 'gradient', 'spotlight'] },
      { slug: '3d-pin', name: '3D Pin Effect', category: 'Effects', tags: ['3d', 'transform', 'hover-effect'] },
      { slug: 'background-beams', name: 'Background Beams', category: 'Backgrounds', tags: ['animation', 'beams', 'gradient'] },
      { slug: 'lamp', name: 'Lamp Effect', category: 'Effects', tags: ['glow', 'animation', 'gradient'] },
      { slug: 'sparkles', name: 'Sparkles', category: 'Effects', tags: ['particles', 'animation', 'sparkle'] },
      { slug: 'floating-dock', name: 'Floating Dock', category: 'Navigation', tags: ['dock', 'hover-effect', 'animation'] },
      { slug: 'tabs', name: 'Animated Tabs', category: 'Navigation', tags: ['tabs', 'animation', 'transition'] },
      { slug: 'infinite-moving-cards', name: 'Infinite Scroll Cards', category: 'Layouts', tags: ['scroll', 'animation', 'marquee'] },
      { slug: 'hover-border-gradient', name: 'Hover Border Gradient', category: 'Effects', tags: ['border', 'gradient', 'hover-effect'] },
      { slug: 'bento-grid', name: 'Bento Grid', category: 'Layouts', tags: ['grid', 'bento', 'responsive'] },
      { slug: 'tracing-beam', name: 'Tracing Beam', category: 'Effects', tags: ['scroll', 'animation', 'beam'] },
      { slug: 'macbook-scroll', name: 'Macbook Scroll', category: 'Effects', tags: ['scroll', 'parallax', 'product'] },
      { slug: 'vortex', name: 'Vortex Effect', category: 'Effects', tags: ['animation', 'vortex', 'transition'] },
      { slug: 'aurora-background', name: 'Aurora Background', category: 'Backgrounds', tags: ['aurora', 'gradient', 'animation'] },
      { slug: 'sidebar', name: 'Animated Sidebar', category: 'Navigation', tags: ['sidebar', 'animation', 'responsive'] },
    ],
    buildUrl: (slug) => `https://ui.aceternity.com/components/${slug}`,
  },

  magicui: {
    name: 'Magic UI',
    baseUrl: 'https://magicui.design',
    components: [
      { slug: 'marquee', name: 'Marquee', category: 'Animations', tags: ['scroll', 'marquee', 'infinite'] },
      { slug: 'dock', name: 'Dock', category: 'Navigation', tags: ['dock', 'hover-effect', 'macos'] },
      { slug: 'globe', name: 'Globe', category: 'Effects', tags: ['3d', 'globe', 'interactive'] },
      { slug: 'orbiting-circles', name: 'Orbiting Circles', category: 'Animations', tags: ['orbit', 'animation', 'circles'] },
      { slug: 'animated-list', name: 'Animated List', category: 'Animations', tags: ['list', 'animation', 'stagger'] },
      { slug: 'shine-border', name: 'Shine Border', category: 'Effects', tags: ['border', 'shine', 'animation'] },
      { slug: 'safari', name: 'Safari Mockup', category: 'Layouts', tags: ['mockup', 'browser', 'showcase'] },
      { slug: 'number-ticker', name: 'Number Ticker', category: 'Animations', tags: ['counter', 'animation', 'number'] },
      { slug: 'blur-fade', name: 'Blur Fade', category: 'Animations', tags: ['blur', 'fade', 'transition'] },
      { slug: 'pulsating-button', name: 'Pulsating Button', category: 'Buttons/CTA', tags: ['pulse', 'animation', 'button'] },
      { slug: 'animated-grid-pattern', name: 'Animated Grid', category: 'Backgrounds', tags: ['grid', 'animation', 'pattern'] },
      { slug: 'hyper-text', name: 'Hyper Text', category: 'Typography', tags: ['text', 'animation', 'scramble'] },
      { slug: 'cool-mode', name: 'Cool Mode', category: 'Effects', tags: ['particles', 'confetti', 'interactive'] },
      { slug: 'retro-grid', name: 'Retro Grid', category: 'Backgrounds', tags: ['grid', 'retro', 'perspective'] },
      { slug: 'tweet-card', name: 'Tweet Card', category: 'Cards', tags: ['twitter', 'embed', 'social'] },
    ],
    buildUrl: (slug) => `https://magicui.design/docs/components/${slug}`,
  },

  shadcn: {
    name: 'shadcn/ui',
    baseUrl: 'https://ui.shadcn.com',
    components: [
      { slug: 'button', name: 'Button', category: 'Buttons/CTA', tags: ['button', 'variants', 'accessible'] },
      { slug: 'card', name: 'Card', category: 'Cards', tags: ['card', 'container', 'responsive'] },
      { slug: 'dialog', name: 'Dialog', category: 'Modals', tags: ['modal', 'dialog', 'overlay'] },
      { slug: 'dropdown-menu', name: 'Dropdown Menu', category: 'Navigation', tags: ['dropdown', 'menu', 'interactive'] },
      { slug: 'input', name: 'Input', category: 'Forms', tags: ['input', 'form', 'accessible'] },
      { slug: 'tabs', name: 'Tabs', category: 'Navigation', tags: ['tabs', 'navigation', 'accessible'] },
      { slug: 'toast', name: 'Toast', category: 'Feedback', tags: ['notification', 'toast', 'animation'] },
      { slug: 'sheet', name: 'Sheet', category: 'Modals', tags: ['drawer', 'sheet', 'slide'] },
      { slug: 'select', name: 'Select', category: 'Forms', tags: ['select', 'dropdown', 'form'] },
      { slug: 'navigation-menu', name: 'Navigation Menu', category: 'Navigation', tags: ['nav', 'menu', 'responsive'] },
    ],
    buildUrl: (slug) => `https://ui.shadcn.com/docs/components/${slug}`,
  },

  tailwindui: {
    name: 'Tailwind UI Patterns',
    baseUrl: 'https://tailwindui.com',
    components: [
      { slug: 'hero-sections', name: 'Hero Section', category: 'Heroes', tags: ['hero', 'landing', 'responsive'] },
      { slug: 'feature-sections', name: 'Feature Grid', category: 'Layouts', tags: ['features', 'grid', 'responsive'] },
      { slug: 'cta-sections', name: 'CTA Section', category: 'Buttons/CTA', tags: ['cta', 'action', 'gradient'] },
      { slug: 'pricing', name: 'Pricing Cards', category: 'Cards', tags: ['pricing', 'comparison', 'responsive'] },
      { slug: 'navbars', name: 'Navbar', category: 'Navigation', tags: ['nav', 'sticky', 'responsive'] },
      { slug: 'footers', name: 'Footer', category: 'Footers', tags: ['footer', 'links', 'responsive'] },
      { slug: 'testimonials', name: 'Testimonials', category: 'Cards', tags: ['testimonial', 'review', 'social-proof'] },
      { slug: 'forms', name: 'Form Layout', category: 'Forms', tags: ['form', 'input', 'validation'] },
    ],
    buildUrl: (slug) => `https://tailwindui.com/components/${slug}`,
  },

  codepen: {
    name: 'CodePen Popular',
    baseUrl: 'https://codepen.io',
    components: [
      { slug: 'glassmorphism-card', name: 'Glassmorphism Card', category: 'Cards', tags: ['glassmorphism', 'blur', 'transparent'] },
      { slug: 'neon-button', name: 'Neon Button', category: 'Buttons/CTA', tags: ['neon', 'glow', 'animation'] },
      { slug: 'particle-background', name: 'Particle Background', category: 'Backgrounds', tags: ['particles', 'canvas', 'animation'] },
      { slug: 'css-grid-masonry', name: 'CSS Masonry Grid', category: 'Layouts', tags: ['masonry', 'grid', 'responsive'] },
      { slug: 'animated-hamburger', name: 'Animated Hamburger', category: 'Navigation', tags: ['hamburger', 'menu', 'animation'] },
    ],
    buildUrl: (slug) => `https://codepen.io/search/pens?q=${slug}`,
  },
};

// ============================================================================
// GENERAL PATTERN CATALOG (top sites)
// ============================================================================

const GENERAL_PATTERNS = [
  { url: 'https://stripe.com', name: 'Stripe Gradient Mesh', category: 'Backgrounds', tags: ['gradient', 'mesh', 'animation'] },
  { url: 'https://linear.app', name: 'Linear Dark Nav', category: 'Navigation', tags: ['dark-mode', 'minimal', 'blur'] },
  { url: 'https://vercel.com', name: 'Vercel Deploy Card', category: 'Cards', tags: ['dark-mode', 'status', 'minimal'] },
  { url: 'https://notion.so', name: 'Notion Toggle Block', category: 'Layouts', tags: ['toggle', 'accordion', 'clean'] },
  { url: 'https://figma.com', name: 'Figma Toolbar', category: 'Navigation', tags: ['toolbar', 'icons', 'compact'] },
  { url: 'https://github.com', name: 'GitHub Contribution Grid', category: 'Layouts', tags: ['grid', 'heatmap', 'data-viz'] },
  { url: 'https://open.spotify.com', name: 'Spotify Now Playing', category: 'Cards', tags: ['media', 'animation', 'gradient'] },
  { url: 'https://discord.com', name: 'Discord Chat Bubble', category: 'Cards', tags: ['chat', 'message', 'avatar'] },
  { url: 'https://slack.com', name: 'Slack Message', category: 'Cards', tags: ['message', 'thread', 'reaction'] },
  { url: 'https://apple.com', name: 'Apple Product Showcase', category: 'Heroes', tags: ['product', 'scroll', 'parallax'] },
  { url: 'https://tesla.com', name: 'Tesla Configurator Card', category: 'Cards', tags: ['configurator', 'interactive', 'slider'] },
  { url: 'https://airbnb.com', name: 'Airbnb Listing Card', category: 'Cards', tags: ['listing', 'image', 'hover-effect'] },
  { url: 'https://netflix.com', name: 'Netflix Content Row', category: 'Layouts', tags: ['carousel', 'scroll', 'hover-effect'] },
  { url: 'https://uber.com', name: 'Uber Map Card', category: 'Cards', tags: ['map', 'location', 'interactive'] },
  { url: 'https://duolingo.com', name: 'Duolingo Progress Card', category: 'Cards', tags: ['progress', 'gamification', 'animation'] },
  { url: 'https://dribbble.com', name: 'Dribbble Shot Card', category: 'Cards', tags: ['image', 'hover-effect', 'social'] },
  { url: 'https://tailwindcss.com', name: 'Tailwind Docs Nav', category: 'Navigation', tags: ['sidebar', 'search', 'responsive'] },
  { url: 'https://nextjs.org', name: 'Next.js Hero', category: 'Heroes', tags: ['gradient', 'animation', 'dark-mode'] },
  { url: 'https://supabase.com', name: 'Supabase Dashboard Card', category: 'Cards', tags: ['dashboard', 'data', 'dark-mode'] },
  { url: 'https://planetscale.com', name: 'PlanetScale Feature Grid', category: 'Layouts', tags: ['features', 'grid', 'dark-mode'] },
];

// ============================================================================
// HTTP FETCHER (supports redirects, http/https)
// ============================================================================

function fetchPage(targetUrl, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > CONFIG.maxRedirects) {
      return reject(new Error(`Too many redirects for ${targetUrl}`));
    }

    const parsed = new URL(targetUrl);
    const transport = parsed.protocol === 'https:' ? https : http;

    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        'User-Agent': CONFIG.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'identity',
      },
      timeout: CONFIG.requestTimeout,
    };

    const req = transport.request(options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = new URL(res.headers.location, targetUrl).href;
        res.resume();
        return fetchPage(redirectUrl, redirectCount + 1).then(resolve).catch(reject);
      }

      if (res.statusCode < 200 || res.statusCode >= 300) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} for ${targetUrl}`));
      }

      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf-8');
        resolve({ body, url: targetUrl, statusCode: res.statusCode, headers: res.headers });
      });
      res.on('error', reject);
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${targetUrl}`));
    });
    req.end();
  });
}

// ============================================================================
// HTML / CSS PARSER (regex-based, no dependencies)
// ============================================================================

const HTMLParser = {
  /**
   * Extract all <style> tag contents from HTML.
   */
  extractStyles(html) {
    const styles = [];
    const regex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
      styles.push(match[1].trim());
    }
    return styles;
  },

  /**
   * Extract all <script> tag contents from HTML.
   */
  extractScripts(html) {
    const scripts = [];
    const regex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
      const content = match[1].trim();
      if (content.length > 0) {
        scripts.push(content);
      }
    }
    return scripts;
  },

  /**
   * Extract inline styles from elements.
   */
  extractInlineStyles(html) {
    const inlineStyles = [];
    const regex = /style="([^"]+)"/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
      inlineStyles.push(match[1]);
    }
    return inlineStyles;
  },

  /**
   * Extract linked stylesheet URLs.
   */
  extractStylesheetUrls(html, baseUrl) {
    const urls = [];
    const regex = /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["'][^>]*>/gi;
    const regex2 = /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']stylesheet["'][^>]*>/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
      try {
        urls.push(new URL(match[1], baseUrl).href);
      } catch (e) { /* skip malformed */ }
    }
    while ((match = regex2.exec(html)) !== null) {
      try {
        const u = new URL(match[1], baseUrl).href;
        if (!urls.includes(u)) urls.push(u);
      } catch (e) { /* skip */ }
    }
    return urls;
  },

  /**
   * Extract the <title> of the page.
   */
  extractTitle(html) {
    const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    return match ? match[1].trim() : 'Untitled';
  },

  /**
   * Extract meta description.
   */
  extractMetaDescription(html) {
    const match = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    if (match) return match[1].trim();
    const match2 = html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
    return match2 ? match2[1].trim() : '';
  },

  /**
   * Extract internal links from a page.
   */
  extractInternalLinks(html, baseUrl) {
    const links = new Set();
    const parsed = new URL(baseUrl);
    const regex = /href=["']([^"'#]+)["']/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
      try {
        const resolved = new URL(match[1], baseUrl);
        if (resolved.hostname === parsed.hostname && !resolved.pathname.match(/\.(png|jpg|svg|gif|pdf|zip|css|js|woff|ttf)$/i)) {
          links.add(resolved.origin + resolved.pathname);
        }
      } catch (e) { /* skip */ }
    }
    return [...links];
  },
};

// ============================================================================
// CSS PARSER
// ============================================================================

const CSSParser = {
  /**
   * Parse CSS text into an array of rule objects.
   */
  parseRules(cssText) {
    const rules = [];
    // Remove comments
    const cleaned = cssText.replace(/\/\*[\s\S]*?\*\//g, '');
    // Match top-level rules (simple approach)
    const ruleRegex = /([^{}]+)\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
    let match;
    while ((match = ruleRegex.exec(cleaned)) !== null) {
      const selector = match[1].trim();
      const body = match[2].trim();
      if (selector && body) {
        rules.push({ selector, body, properties: this.parseProperties(body) });
      }
    }
    return rules;
  },

  /**
   * Parse CSS property declarations.
   */
  parseProperties(body) {
    const props = {};
    // Handle nested blocks (like keyframes) by stripping them
    const flat = body.replace(/\{[^}]*\}/g, '');
    const declarations = flat.split(';').map(d => d.trim()).filter(Boolean);
    for (const decl of declarations) {
      const colonIdx = decl.indexOf(':');
      if (colonIdx > 0) {
        const prop = decl.substring(0, colonIdx).trim();
        const val = decl.substring(colonIdx + 1).trim();
        if (prop && val) props[prop] = val;
      }
    }
    return props;
  },

  /**
   * Extract @keyframes blocks.
   */
  extractKeyframes(cssText) {
    const keyframes = [];
    const regex = /@keyframes\s+([\w-]+)\s*\{([\s\S]*?\})\s*\}/gi;
    let match;
    while ((match = regex.exec(cssText)) !== null) {
      keyframes.push({ name: match[1], body: match[2].trim() });
    }
    return keyframes;
  },

  /**
   * Extract CSS variables from :root or similar.
   */
  extractVariables(cssText) {
    const vars = {};
    const regex = /(--[\w-]+)\s*:\s*([^;]+)/g;
    let match;
    while ((match = regex.exec(cssText)) !== null) {
      vars[match[1].trim()] = match[2].trim();
    }
    return vars;
  },

  /**
   * Extract media queries.
   */
  extractMediaQueries(cssText) {
    const queries = [];
    const regex = /@media\s*([^{]+)\{([\s\S]*?\})\s*\}/gi;
    let match;
    while ((match = regex.exec(cssText)) !== null) {
      queries.push({ condition: match[1].trim(), body: match[2].trim() });
    }
    return queries;
  },

  /**
   * Detect advanced CSS features in a string.
   */
  detectFeatures(cssText) {
    const features = [];
    const checks = [
      { name: 'backdrop-filter', pattern: /backdrop-filter/i },
      { name: 'gradient', pattern: /(linear|radial|conic)-gradient/i },
      { name: 'transform', pattern: /transform\s*:/i },
      { name: 'animation', pattern: /animation\s*:/i },
      { name: 'transition', pattern: /transition\s*:/i },
      { name: 'filter', pattern: /(?<!backdrop-)filter\s*:/i },
      { name: 'clip-path', pattern: /clip-path/i },
      { name: 'mix-blend-mode', pattern: /mix-blend-mode/i },
      { name: 'box-shadow', pattern: /box-shadow/i },
      { name: 'text-shadow', pattern: /text-shadow/i },
      { name: 'grid', pattern: /display\s*:\s*grid/i },
      { name: 'flexbox', pattern: /display\s*:\s*flex/i },
      { name: 'css-variables', pattern: /var\(--/i },
      { name: 'scroll-snap', pattern: /scroll-snap/i },
      { name: 'aspect-ratio', pattern: /aspect-ratio/i },
      { name: 'container-query', pattern: /@container/i },
    ];
    for (const check of checks) {
      if (check.pattern.test(cssText)) features.push(check.name);
    }
    return features;
  },
};

// ============================================================================
// PATTERN DETECTOR
// ============================================================================

const PatternDetector = {
  /**
   * Detect all component patterns from HTML + CSS.
   */
  detectAll(html, cssText, pageUrl) {
    const components = [];
    const detectors = [
      this.detectButtons,
      this.detectCards,
      this.detectHeroes,
      this.detectNavbars,
      this.detectAnimations,
      this.detectBackgrounds,
      this.detectTypography,
      this.detectGridLayouts,
      this.detectForms,
      this.detectFooters,
      this.detectModals,
      this.detectPricing,
      this.detectTestimonials,
      this.detectFeatureGrids,
      this.detectCTAs,
    ];

    for (const detector of detectors) {
      const found = detector.call(this, html, cssText, pageUrl);
      components.push(...found);
    }

    return components;
  },

  /**
   * Extract a section of HTML around a matched element.
   */
  _extractSection(html, startPattern, maxLength = 2000) {
    const idx = html.search(startPattern);
    if (idx === -1) return null;
    // Walk forward to find the closing tag
    let depth = 0;
    let i = idx;
    const tagMatch = html.substring(idx).match(/^<(\w+)/);
    if (!tagMatch) return html.substring(idx, idx + maxLength);
    const tagName = tagMatch[1];
    const openRegex = new RegExp(`<${tagName}[\\s>]`, 'gi');
    const closeRegex = new RegExp(`</${tagName}>`, 'gi');
    openRegex.lastIndex = idx;
    closeRegex.lastIndex = idx;

    let end = idx + maxLength;
    let openMatch, closeMatch;
    depth = 1;
    let pos = idx + tagMatch[0].length;

    while (pos < html.length && pos < idx + maxLength * 2) {
      const nextOpen = html.indexOf(`<${tagName}`, pos + 1);
      const nextClose = html.indexOf(`</${tagName}>`, pos);

      if (nextClose === -1) break;

      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++;
        pos = nextOpen + tagName.length + 1;
      } else {
        depth--;
        if (depth <= 0) {
          end = nextClose + tagName.length + 3;
          break;
        }
        pos = nextClose + tagName.length + 3;
      }
    }

    return html.substring(idx, Math.min(end, idx + maxLength));
  },

  /**
   * Extract CSS rules matching given selectors.
   */
  _extractMatchingCSS(cssText, patterns) {
    const rules = CSSParser.parseRules(cssText);
    const matched = [];
    for (const rule of rules) {
      for (const pattern of patterns) {
        if (rule.selector.match(pattern)) {
          matched.push(`${rule.selector} { ${rule.body} }`);
          break;
        }
      }
    }
    return matched.join('\n\n');
  },

  // --- BUTTONS ---
  detectButtons(html, cssText, pageUrl) {
    const components = [];
    const btnPatterns = [/\.btn[^a-z]/i, /\.button/i, /\.cta/i, /button\s*\{/i, /\[class\*="btn"\]/i];
    const btnCSS = this._extractMatchingCSS(cssText, btnPatterns);

    const btnHTML = [];
    const btnRegex = /<button[^>]*>[\s\S]*?<\/button>/gi;
    let m;
    while ((m = btnRegex.exec(html)) !== null && btnHTML.length < 5) {
      btnHTML.push(m[0]);
    }
    // Also look for anchor-styled buttons
    const aBtnRegex = /<a[^>]*class="[^"]*(?:btn|button|cta)[^"]*"[^>]*>[\s\S]*?<\/a>/gi;
    while ((m = aBtnRegex.exec(html)) !== null && btnHTML.length < 8) {
      btnHTML.push(m[0]);
    }

    if (btnCSS.length > 10 || btnHTML.length > 0) {
      const hostname = safeHostname(pageUrl);
      components.push({
        id: `${hostname}-button-primary`,
        name: `${capitalize(hostname)} Button Style`,
        category: 'Buttons/CTA',
        source: hostname,
        extracted_from: pageUrl,
        description: `Button styles extracted from ${hostname}. Includes primary button variants with hover states.`,
        css: btnCSS || '/* No dedicated button CSS found - uses utility classes */',
        html_template: btnHTML.slice(0, 3).join('\n') || '<button class="btn">Click me</button>',
        js_init: '',
        js_type: 'none',
        dependencies: [],
        variables: CSSParser.extractVariables(btnCSS),
        tags: detectTagsFromCSS(btnCSS, ['button']),
        quality_score: scoreComponent(btnCSS, btnHTML.join(''), ''),
      });
    }

    return components;
  },

  // --- CARDS ---
  detectCards(html, cssText, pageUrl) {
    const components = [];
    const cardPatterns = [/\.card/i, /\.feature/i, /\.pricing/i, /\.testimonial/i, /\.review/i, /\.item/i];
    const cardCSS = this._extractMatchingCSS(cssText, cardPatterns);

    const cardSection = this._extractSection(html, /<[^>]+class="[^"]*card[^"]*"/i);

    if (cardCSS.length > 10 || cardSection) {
      const hostname = safeHostname(pageUrl);
      components.push({
        id: `${hostname}-card-default`,
        name: `${capitalize(hostname)} Card Component`,
        category: 'Cards',
        source: hostname,
        extracted_from: pageUrl,
        description: `Card component extracted from ${hostname}. Features shadow, border-radius, and hover effects.`,
        css: cardCSS || '/* Utility-based card styling */',
        html_template: cardSection ? truncateHTML(cardSection, 1500) : '<div class="card"><h3>Title</h3><p>Content</p></div>',
        js_init: '',
        js_type: 'none',
        dependencies: [],
        variables: CSSParser.extractVariables(cardCSS),
        tags: detectTagsFromCSS(cardCSS, ['card']),
        quality_score: scoreComponent(cardCSS, cardSection || '', ''),
      });
    }

    return components;
  },

  // --- HEROES ---
  detectHeroes(html, cssText, pageUrl) {
    const components = [];
    const heroPatterns = [/\.hero/i, /\.banner/i, /\.jumbotron/i, /\.landing/i, /\[class\*="hero"\]/i];
    const heroCSS = this._extractMatchingCSS(cssText, heroPatterns);

    // Look for hero section: large section with h1
    const heroSection = this._extractSection(html, /<(?:section|div|header)[^>]*class="[^"]*(?:hero|banner|landing)[^"]*"/i, 3000);

    if (heroCSS.length > 10 || heroSection) {
      const hostname = safeHostname(pageUrl);
      components.push({
        id: `${hostname}-hero-main`,
        name: `${capitalize(hostname)} Hero Section`,
        category: 'Heroes',
        source: hostname,
        extracted_from: pageUrl,
        description: `Hero/landing section extracted from ${hostname}. Typically includes heading, subtext, and CTA.`,
        css: heroCSS || '/* Hero uses utility/inline styling */',
        html_template: heroSection ? truncateHTML(heroSection, 2000) : '<section class="hero"><h1>Heading</h1><p>Subtext</p><a href="#" class="cta">Get Started</a></section>',
        js_init: '',
        js_type: 'none',
        dependencies: [],
        variables: CSSParser.extractVariables(heroCSS),
        tags: detectTagsFromCSS(heroCSS, ['hero', 'landing']),
        quality_score: scoreComponent(heroCSS, heroSection || '', ''),
      });
    }

    return components;
  },

  // --- NAVBARS ---
  detectNavbars(html, cssText, pageUrl) {
    const components = [];
    const navPatterns = [/nav\s*\{/i, /\.nav/i, /\.navbar/i, /\.header/i, /header\s*\{/i, /\.topbar/i];
    const navCSS = this._extractMatchingCSS(cssText, navPatterns);

    const navSection = this._extractSection(html, /<(?:nav|header)[^>]*/i, 2000);

    if (navCSS.length > 10 || navSection) {
      const hostname = safeHostname(pageUrl);
      components.push({
        id: `${hostname}-navbar`,
        name: `${capitalize(hostname)} Navigation Bar`,
        category: 'Navigation',
        source: hostname,
        extracted_from: pageUrl,
        description: `Navigation bar extracted from ${hostname}. May include sticky positioning, blur backdrop, and responsive menu.`,
        css: navCSS || '/* Navigation uses utility classes */',
        html_template: navSection ? truncateHTML(navSection, 1500) : '<nav><a href="/" class="logo">Logo</a><ul><li><a href="#">Link</a></li></ul></nav>',
        js_init: '',
        js_type: 'none',
        dependencies: [],
        variables: CSSParser.extractVariables(navCSS),
        tags: detectTagsFromCSS(navCSS, ['navigation', 'sticky']),
        quality_score: scoreComponent(navCSS, navSection || '', ''),
      });
    }

    return components;
  },

  // --- ANIMATIONS ---
  detectAnimations(html, cssText, pageUrl) {
    const components = [];
    const keyframes = CSSParser.extractKeyframes(cssText);

    if (keyframes.length > 0) {
      const hostname = safeHostname(pageUrl);
      const kfCSS = keyframes.map(kf => `@keyframes ${kf.name} {\n${kf.body}\n}`).join('\n\n');

      // Find rules referencing these animations
      const animRules = [];
      const rules = CSSParser.parseRules(cssText);
      for (const rule of rules) {
        if (rule.properties['animation'] || rule.properties['animation-name']) {
          animRules.push(`${rule.selector} { ${rule.body} }`);
        }
      }

      components.push({
        id: `${hostname}-animations`,
        name: `${capitalize(hostname)} CSS Animations`,
        category: 'Animations',
        source: hostname,
        extracted_from: pageUrl,
        description: `${keyframes.length} CSS animation(s) extracted from ${hostname}: ${keyframes.map(k => k.name).join(', ')}.`,
        css: kfCSS + '\n\n' + animRules.join('\n\n'),
        html_template: '<!-- Apply animation class to any element -->',
        js_init: '',
        js_type: 'none',
        dependencies: [],
        variables: {},
        tags: ['animation', 'keyframes', ...keyframes.map(k => k.name)],
        quality_score: Math.min(10, 5 + keyframes.length),
      });
    }

    // Detect JS animation libraries
    const scripts = HTMLParser.extractScripts(html);
    const allScripts = scripts.join('\n');
    const jsAnimPatterns = [];

    if (/gsap|TweenMax|TweenLite|ScrollTrigger/i.test(allScripts)) {
      jsAnimPatterns.push('gsap');
    }
    if (/framer-motion|motion\(/i.test(allScripts) || /from\s+["']framer-motion["']/i.test(html)) {
      jsAnimPatterns.push('framer-motion');
    }
    if (/anime\s*\(/i.test(allScripts)) {
      jsAnimPatterns.push('anime.js');
    }
    if (/lottie/i.test(allScripts) || /lottie/i.test(html)) {
      jsAnimPatterns.push('lottie');
    }

    if (jsAnimPatterns.length > 0) {
      const hostname = safeHostname(pageUrl);
      components.push({
        id: `${hostname}-js-animations`,
        name: `${capitalize(hostname)} JS Animation Patterns`,
        category: 'Animations',
        source: hostname,
        extracted_from: pageUrl,
        description: `JavaScript animation patterns detected: ${jsAnimPatterns.join(', ')}. Uses external animation libraries.`,
        css: '',
        html_template: '<!-- JS animations applied via library -->',
        js_init: `// Libraries detected: ${jsAnimPatterns.join(', ')}\n// See source for implementation details`,
        js_type: 'module',
        dependencies: jsAnimPatterns,
        variables: {},
        tags: ['animation', 'javascript', ...jsAnimPatterns],
        quality_score: 6,
      });
    }

    return components;
  },

  // --- BACKGROUNDS ---
  detectBackgrounds(html, cssText, pageUrl) {
    const components = [];
    const bgPatterns = [/\.bg/i, /\.background/i, /\.gradient/i, /\.pattern/i, /\.mesh/i, /\.grain/i, /\.particles/i, /\.aurora/i];
    const bgCSS = this._extractMatchingCSS(cssText, bgPatterns);

    // Also look for gradient/background definitions in general rules
    const rules = CSSParser.parseRules(cssText);
    const gradientRules = [];
    for (const rule of rules) {
      const body = rule.body;
      if (/(linear|radial|conic)-gradient/i.test(body) || /background.*url/i.test(body)) {
        gradientRules.push(`${rule.selector} { ${rule.body} }`);
      }
    }

    const allBgCSS = [bgCSS, ...gradientRules].filter(Boolean).join('\n\n');

    if (allBgCSS.length > 20) {
      const hostname = safeHostname(pageUrl);
      components.push({
        id: `${hostname}-backgrounds`,
        name: `${capitalize(hostname)} Background Patterns`,
        category: 'Backgrounds',
        source: hostname,
        extracted_from: pageUrl,
        description: `Background styles and gradients extracted from ${hostname}. Includes gradient definitions and pattern overlays.`,
        css: truncateCSS(allBgCSS, 3000),
        html_template: '<div class="bg-pattern" style="width:100%;min-height:400px;"></div>',
        js_init: '',
        js_type: 'none',
        dependencies: [],
        variables: CSSParser.extractVariables(allBgCSS),
        tags: detectTagsFromCSS(allBgCSS, ['background']),
        quality_score: scoreComponent(allBgCSS, '', ''),
      });
    }

    return components;
  },

  // --- TYPOGRAPHY ---
  detectTypography(html, cssText, pageUrl) {
    const components = [];
    const typoPatterns = [/h[1-6]\s*\{/i, /\.heading/i, /\.title/i, /\.text/i, /\.font/i, /\.display/i, /body\s*\{/i, /p\s*\{/i];
    const typoCSS = this._extractMatchingCSS(cssText, typoPatterns);

    if (typoCSS.length > 30) {
      const hostname = safeHostname(pageUrl);
      // Detect gradient text
      const hasGradientText = /background-clip\s*:\s*text|text-fill-color/i.test(typoCSS);

      components.push({
        id: `${hostname}-typography`,
        name: `${capitalize(hostname)} Typography System`,
        category: 'Typography',
        source: hostname,
        extracted_from: pageUrl,
        description: `Typography styles from ${hostname}. Font stacks, sizing scale${hasGradientText ? ', gradient text effects' : ''}.`,
        css: truncateCSS(typoCSS, 2000),
        html_template: '<h1 class="heading">Heading 1</h1>\n<h2>Heading 2</h2>\n<p>Body text paragraph.</p>',
        js_init: '',
        js_type: 'none',
        dependencies: [],
        variables: CSSParser.extractVariables(typoCSS),
        tags: detectTagsFromCSS(typoCSS, ['typography', 'fonts']),
        quality_score: scoreComponent(typoCSS, '', ''),
      });
    }

    return components;
  },

  // --- GRID LAYOUTS ---
  detectGridLayouts(html, cssText, pageUrl) {
    const components = [];
    const gridPatterns = [/\.grid/i, /\.layout/i, /\.container/i, /\.wrapper/i, /\.row/i, /\.col/i, /\.masonry/i, /\.bento/i];
    const gridCSS = this._extractMatchingCSS(cssText, gridPatterns);

    const features = CSSParser.detectFeatures(gridCSS);
    const hasGrid = features.includes('grid');
    const hasFlex = features.includes('flexbox');

    if (gridCSS.length > 20 && (hasGrid || hasFlex)) {
      const hostname = safeHostname(pageUrl);
      components.push({
        id: `${hostname}-grid-layout`,
        name: `${capitalize(hostname)} Grid Layout`,
        category: 'Layouts',
        source: hostname,
        extracted_from: pageUrl,
        description: `Layout system from ${hostname}. Uses ${hasGrid ? 'CSS Grid' : ''}${hasGrid && hasFlex ? ' and ' : ''}${hasFlex ? 'Flexbox' : ''}.`,
        css: truncateCSS(gridCSS, 2000),
        html_template: '<div class="grid"><div class="col">1</div><div class="col">2</div><div class="col">3</div></div>',
        js_init: '',
        js_type: 'none',
        dependencies: [],
        variables: CSSParser.extractVariables(gridCSS),
        tags: detectTagsFromCSS(gridCSS, ['layout', 'grid', 'responsive']),
        quality_score: scoreComponent(gridCSS, '', ''),
      });
    }

    return components;
  },

  // --- FORMS ---
  detectForms(html, cssText, pageUrl) {
    const components = [];
    const formPatterns = [/\.form/i, /\.input/i, /\.field/i, /input\s*\{/i, /textarea\s*\{/i, /select\s*\{/i, /\.search/i, /\.login/i, /\.signup/i];
    const formCSS = this._extractMatchingCSS(cssText, formPatterns);

    const formSection = this._extractSection(html, /<form[^>]*/i, 2000);

    if (formCSS.length > 20 || formSection) {
      const hostname = safeHostname(pageUrl);
      components.push({
        id: `${hostname}-form`,
        name: `${capitalize(hostname)} Form Styles`,
        category: 'Forms',
        source: hostname,
        extracted_from: pageUrl,
        description: `Form and input styles from ${hostname}. Includes input fields, focus states, and validation styling.`,
        css: truncateCSS(formCSS, 2000),
        html_template: formSection ? truncateHTML(formSection, 1500) : '<form><input type="text" placeholder="Name"><input type="email" placeholder="Email"><button type="submit">Submit</button></form>',
        js_init: '',
        js_type: 'none',
        dependencies: [],
        variables: CSSParser.extractVariables(formCSS),
        tags: detectTagsFromCSS(formCSS, ['form', 'input']),
        quality_score: scoreComponent(formCSS, formSection || '', ''),
      });
    }

    return components;
  },

  // --- FOOTERS ---
  detectFooters(html, cssText, pageUrl) {
    const components = [];
    const footerPatterns = [/\.footer/i, /footer\s*\{/i, /\.site-footer/i, /\.bottom/i];
    const footerCSS = this._extractMatchingCSS(cssText, footerPatterns);

    const footerSection = this._extractSection(html, /<footer[^>]*/i, 2000);

    if (footerCSS.length > 10 || footerSection) {
      const hostname = safeHostname(pageUrl);
      components.push({
        id: `${hostname}-footer`,
        name: `${capitalize(hostname)} Footer`,
        category: 'Footers',
        source: hostname,
        extracted_from: pageUrl,
        description: `Footer component from ${hostname}. Link organization, layout pattern, and social icons.`,
        css: truncateCSS(footerCSS, 1500),
        html_template: footerSection ? truncateHTML(footerSection, 1500) : '<footer><div class="footer-content"><p>&copy; 2024</p></div></footer>',
        js_init: '',
        js_type: 'none',
        dependencies: [],
        variables: CSSParser.extractVariables(footerCSS),
        tags: detectTagsFromCSS(footerCSS, ['footer']),
        quality_score: scoreComponent(footerCSS, footerSection || '', ''),
      });
    }

    return components;
  },

  // --- MODALS ---
  detectModals(html, cssText, pageUrl) {
    const components = [];
    const modalPatterns = [/\.modal/i, /\.dialog/i, /\.overlay/i, /\.popup/i, /\.drawer/i, /\.sheet/i];
    const modalCSS = this._extractMatchingCSS(cssText, modalPatterns);

    if (modalCSS.length > 20) {
      const hostname = safeHostname(pageUrl);
      components.push({
        id: `${hostname}-modal`,
        name: `${capitalize(hostname)} Modal/Dialog`,
        category: 'Modals',
        source: hostname,
        extracted_from: pageUrl,
        description: `Modal/dialog styles from ${hostname}. Overlay, backdrop, and animation patterns.`,
        css: truncateCSS(modalCSS, 2000),
        html_template: '<div class="modal-overlay"><div class="modal"><h2>Title</h2><p>Content</p><button>Close</button></div></div>',
        js_init: 'document.querySelector(".modal-overlay").addEventListener("click", (e) => { if (e.target === e.currentTarget) e.currentTarget.classList.remove("active"); });',
        js_type: 'inline',
        dependencies: [],
        variables: CSSParser.extractVariables(modalCSS),
        tags: detectTagsFromCSS(modalCSS, ['modal', 'dialog', 'overlay']),
        quality_score: scoreComponent(modalCSS, '', 'modal'),
      });
    }

    return components;
  },

  // --- PRICING ---
  detectPricing(html, cssText, pageUrl) {
    const components = [];
    const pricingPatterns = [/\.pricing/i, /\.plan/i, /\.tier/i, /\.package/i];
    const pricingCSS = this._extractMatchingCSS(cssText, pricingPatterns);

    const pricingSection = this._extractSection(html, /<[^>]+class="[^"]*(?:pricing|plan|tier)[^"]*"/i, 3000);

    if (pricingCSS.length > 10 || pricingSection) {
      const hostname = safeHostname(pageUrl);
      components.push({
        id: `${hostname}-pricing`,
        name: `${capitalize(hostname)} Pricing Section`,
        category: 'Cards',
        source: hostname,
        extracted_from: pageUrl,
        description: `Pricing/plan cards from ${hostname}. Comparison layout with feature lists and CTAs.`,
        css: truncateCSS(pricingCSS, 2000),
        html_template: pricingSection ? truncateHTML(pricingSection, 2000) : '<div class="pricing"><div class="plan"><h3>Basic</h3><p class="price">$9/mo</p><ul><li>Feature 1</li></ul><button>Choose</button></div></div>',
        js_init: '',
        js_type: 'none',
        dependencies: [],
        variables: CSSParser.extractVariables(pricingCSS),
        tags: detectTagsFromCSS(pricingCSS, ['pricing', 'comparison']),
        quality_score: scoreComponent(pricingCSS, pricingSection || '', ''),
      });
    }

    return components;
  },

  // --- TESTIMONIALS ---
  detectTestimonials(html, cssText, pageUrl) {
    const components = [];
    const testPatterns = [/\.testimonial/i, /\.review/i, /\.quote/i, /\.feedback/i, /blockquote/i];
    const testCSS = this._extractMatchingCSS(cssText, testPatterns);

    const testSection = this._extractSection(html, /<[^>]+class="[^"]*(?:testimonial|review|quote)[^"]*"/i, 2000);

    if (testCSS.length > 10 || testSection) {
      const hostname = safeHostname(pageUrl);
      components.push({
        id: `${hostname}-testimonial`,
        name: `${capitalize(hostname)} Testimonial`,
        category: 'Cards',
        source: hostname,
        extracted_from: pageUrl,
        description: `Testimonial/review component from ${hostname}. Quote, avatar, and attribution layout.`,
        css: truncateCSS(testCSS, 1500),
        html_template: testSection ? truncateHTML(testSection, 1500) : '<div class="testimonial"><blockquote>"Great product!"</blockquote><cite>— User Name</cite></div>',
        js_init: '',
        js_type: 'none',
        dependencies: [],
        variables: CSSParser.extractVariables(testCSS),
        tags: detectTagsFromCSS(testCSS, ['testimonial', 'social-proof']),
        quality_score: scoreComponent(testCSS, testSection || '', ''),
      });
    }

    return components;
  },

  // --- FEATURE GRIDS ---
  detectFeatureGrids(html, cssText, pageUrl) {
    const components = [];
    const featPatterns = [/\.feature/i, /\.benefit/i, /\.service/i, /\.capability/i, /\.advantage/i];
    const featCSS = this._extractMatchingCSS(cssText, featPatterns);

    const featSection = this._extractSection(html, /<[^>]+class="[^"]*(?:feature|benefit|service)[^"]*"/i, 3000);

    if (featCSS.length > 10 || featSection) {
      const hostname = safeHostname(pageUrl);
      components.push({
        id: `${hostname}-features`,
        name: `${capitalize(hostname)} Feature Grid`,
        category: 'Layouts',
        source: hostname,
        extracted_from: pageUrl,
        description: `Feature/benefits grid from ${hostname}. Icon + title + description card layout.`,
        css: truncateCSS(featCSS, 2000),
        html_template: featSection ? truncateHTML(featSection, 2000) : '<div class="features"><div class="feature"><span class="icon">★</span><h3>Feature</h3><p>Description</p></div></div>',
        js_init: '',
        js_type: 'none',
        dependencies: [],
        variables: CSSParser.extractVariables(featCSS),
        tags: detectTagsFromCSS(featCSS, ['features', 'grid']),
        quality_score: scoreComponent(featCSS, featSection || '', ''),
      });
    }

    return components;
  },

  // --- CTAs ---
  detectCTAs(html, cssText, pageUrl) {
    const components = [];
    const ctaPatterns = [/\.cta/i, /\.call-to-action/i, /\.action/i, /\.subscribe/i, /\.signup/i, /\.newsletter/i];
    const ctaCSS = this._extractMatchingCSS(cssText, ctaPatterns);

    const ctaSection = this._extractSection(html, /<[^>]+class="[^"]*(?:cta|call-to-action|subscribe|newsletter)[^"]*"/i, 2000);

    if (ctaCSS.length > 10 || ctaSection) {
      const hostname = safeHostname(pageUrl);
      components.push({
        id: `${hostname}-cta-section`,
        name: `${capitalize(hostname)} CTA Section`,
        category: 'Buttons/CTA',
        source: hostname,
        extracted_from: pageUrl,
        description: `Call-to-action section from ${hostname}. Typically a banner with heading and action button.`,
        css: truncateCSS(ctaCSS, 1500),
        html_template: ctaSection ? truncateHTML(ctaSection, 1500) : '<section class="cta"><h2>Ready to start?</h2><a href="#" class="btn">Get Started</a></section>',
        js_init: '',
        js_type: 'none',
        dependencies: [],
        variables: CSSParser.extractVariables(ctaCSS),
        tags: detectTagsFromCSS(ctaCSS, ['cta', 'action']),
        quality_score: scoreComponent(ctaCSS, ctaSection || '', ''),
      });
    }

    return components;
  },
};

// ============================================================================
// QUALITY SCORING
// ============================================================================

function scoreComponent(css, html, js) {
  let score = 0;
  const combined = css + ' ' + html + ' ' + js;

  // Has hover state (+1)
  if (/:hover/i.test(css)) score += 1;

  // Has animation (+1)
  if (/animation|@keyframes/i.test(css)) score += 1;

  // Has responsive / media query (+1)
  if (/@media/i.test(css)) score += 1;

  // Has CSS variables (+1)
  if (/var\(--/i.test(css)) score += 1;

  // Has dark mode (+1)
  if (/dark|prefers-color-scheme/i.test(css)) score += 1;

  // Clean code: reasonable length, not minified gibberish (+2)
  if (css.length > 50 && css.length < 5000) score += 1;
  if (/\n/.test(css) || css.length < 200) score += 1;

  // Unique pattern: uses advanced CSS features (+1)
  const features = CSSParser.detectFeatures(css);
  if (features.length >= 2) score += 1;

  // Production-ready: has actual content (+2 possible)
  if (html.length > 20) score += 1;
  if (css.length > 30) score += 1;

  return Math.min(10, Math.max(1, score));
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function safeHostname(pageUrl) {
  try {
    return new URL(pageUrl).hostname.replace(/^www\./, '').replace(/\./g, '-');
  } catch {
    return 'unknown';
  }
}

function capitalize(str) {
  return str.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
}

function truncateHTML(html, maxLen) {
  if (html.length <= maxLen) return html;
  return html.substring(0, maxLen) + '\n<!-- ... truncated -->';
}

function truncateCSS(css, maxLen) {
  if (css.length <= maxLen) return css;
  return css.substring(0, maxLen) + '\n/* ... truncated */';
}

function detectTagsFromCSS(css, baseTags) {
  const tags = [...baseTags];
  const features = CSSParser.detectFeatures(css);
  tags.push(...features);

  if (/:hover/i.test(css)) tags.push('hover-effect');
  if (/dark/i.test(css)) tags.push('dark-mode');
  if (/glassmorphism|backdrop-filter.*blur/i.test(css)) tags.push('glassmorphism');
  if (/gradient/i.test(css)) tags.push('gradient');
  if (/@keyframes/i.test(css)) tags.push('animated');

  // Deduplicate
  return [...new Set(tags)];
}

function generateId(source, category, name) {
  const slug = `${source}-${category}-${name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return slug.substring(0, 80);
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

// ============================================================================
// LIBRARY MANAGER
// ============================================================================

const LibraryManager = {
  /**
   * Load existing library or create a new one.
   */
  load() {
    const filePath = path.join(CONFIG.libraryDir, CONFIG.libraryFile);
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      return {
        meta: {
          name: 'Nexus Component Library',
          version: '1.0.0',
          last_updated: new Date().toISOString(),
          total_components: 0,
        },
        components: [],
      };
    }
  },

  /**
   * Save library to disk.
   */
  save(library) {
    if (!fs.existsSync(CONFIG.libraryDir)) {
      fs.mkdirSync(CONFIG.libraryDir, { recursive: true });
    }
    library.meta.last_updated = new Date().toISOString();
    library.meta.total_components = library.components.length;
    const filePath = path.join(CONFIG.libraryDir, CONFIG.libraryFile);
    fs.writeFileSync(filePath, JSON.stringify(library, null, 2), 'utf-8');
    return filePath;
  },

  /**
   * Add components, skipping duplicates by id.
   */
  addComponents(library, newComponents) {
    const existingIds = new Set(library.components.map(c => c.id));
    let added = 0;
    for (const comp of newComponents) {
      if (!existingIds.has(comp.id)) {
        library.components.push(comp);
        existingIds.add(comp.id);
        added++;
      }
    }
    return added;
  },

  /**
   * Export components by category.
   */
  exportCategory(library, category) {
    const filtered = library.components.filter(c =>
      c.category.toLowerCase().includes(category.toLowerCase())
    );
    return {
      meta: {
        name: `Nexus Components - ${category}`,
        exported_at: new Date().toISOString(),
        total_components: filtered.length,
      },
      components: filtered,
    };
  },

  /**
   * Get library statistics.
   */
  getStats(library) {
    const categories = {};
    const sources = {};
    const allTags = {};
    let totalScore = 0;

    for (const comp of library.components) {
      categories[comp.category] = (categories[comp.category] || 0) + 1;
      sources[comp.source] = (sources[comp.source] || 0) + 1;
      totalScore += comp.quality_score || 0;
      for (const tag of (comp.tags || [])) {
        allTags[tag] = (allTags[tag] || 0) + 1;
      }
    }

    return {
      total: library.components.length,
      avgScore: library.components.length > 0 ? (totalScore / library.components.length).toFixed(1) : 0,
      categories,
      sources,
      topTags: Object.entries(allTags).sort((a, b) => b[1] - a[1]).slice(0, 20),
    };
  },

  /**
   * Identify gaps in the library.
   */
  identifyGaps(library) {
    const idealCategories = {
      'Buttons/CTA': 10,
      'Cards': 10,
      'Heroes': 8,
      'Navigation': 8,
      'Animations': 10,
      'Backgrounds': 8,
      'Typography': 5,
      'Layouts': 8,
      'Forms': 6,
      'Footers': 5,
      'Modals': 5,
      'Feedback': 4,
      'Effects': 8,
    };

    const current = {};
    for (const comp of library.components) {
      current[comp.category] = (current[comp.category] || 0) + 1;
    }

    const gaps = [];
    for (const [cat, ideal] of Object.entries(idealCategories)) {
      const count = current[cat] || 0;
      if (count < ideal) {
        gaps.push({ category: cat, current: count, ideal, deficit: ideal - count });
      }
    }

    return gaps.sort((a, b) => b.deficit - a.deficit);
  },
};

// ============================================================================
// EXTRACTION ENGINE
// ============================================================================

const Extractor = {
  /**
   * Extract components from a single URL.
   */
  async extractFromUrl(targetUrl, options = {}) {
    log(`Fetching: ${targetUrl}`);

    let response;
    try {
      response = await fetchPage(targetUrl);
    } catch (err) {
      logError(`Failed to fetch ${targetUrl}: ${err.message}`);
      return [];
    }

    log(`  Received ${response.body.length} bytes`);

    const html = response.body;
    const styles = HTMLParser.extractStyles(html);
    const inlineStyles = HTMLParser.extractInlineStyles(html);
    const title = HTMLParser.extractTitle(html);

    log(`  Page title: "${title}"`);
    log(`  Found ${styles.length} <style> block(s), ${inlineStyles.length} inline style(s)`);

    // Combine all CSS
    let allCSS = styles.join('\n\n');

    // Optionally fetch external stylesheets (first 3)
    const sheetUrls = HTMLParser.extractStylesheetUrls(html, targetUrl);
    log(`  Found ${sheetUrls.length} linked stylesheet(s)`);

    const sheetsToFetch = sheetUrls.slice(0, 3);
    for (const sheetUrl of sheetsToFetch) {
      try {
        log(`  Fetching stylesheet: ${sheetUrl}`);
        const sheetResp = await fetchPage(sheetUrl);
        allCSS += '\n\n' + sheetResp.body;
      } catch (err) {
        log(`  Could not fetch stylesheet: ${err.message}`);
      }
    }

    log(`  Total CSS: ${allCSS.length} characters`);

    // Detect CSS features
    const features = CSSParser.detectFeatures(allCSS);
    if (features.length > 0) {
      log(`  CSS features detected: ${features.join(', ')}`);
    }

    // Extract variables
    const variables = CSSParser.extractVariables(allCSS);
    const varCount = Object.keys(variables).length;
    if (varCount > 0) {
      log(`  CSS variables found: ${varCount}`);
    }

    // Extract keyframes
    const keyframes = CSSParser.extractKeyframes(allCSS);
    if (keyframes.length > 0) {
      log(`  Keyframe animations: ${keyframes.map(k => k.name).join(', ')}`);
    }

    // Detect patterns
    log('  Detecting component patterns...');
    const components = PatternDetector.detectAll(html, allCSS, targetUrl);
    log(`  Found ${components.length} component pattern(s)`);

    for (const comp of components) {
      log(`    - [${comp.category}] ${comp.name} (score: ${comp.quality_score}/10)`);
    }

    return components;
  },

  /**
   * Deep extraction: follow internal links and extract from multiple pages.
   */
  async extractDeep(targetUrl, maxPages = CONFIG.deepMaxPages) {
    const allComponents = [];
    const visited = new Set();

    // Extract from main page
    const mainComponents = await this.extractFromUrl(targetUrl);
    allComponents.push(...mainComponents);
    visited.add(targetUrl);

    // Get internal links
    let response;
    try {
      response = await fetchPage(targetUrl);
    } catch {
      return allComponents;
    }

    const links = HTMLParser.extractInternalLinks(response.body, targetUrl);
    log(`\n  Found ${links.length} internal links for deep extraction`);

    const pagesToVisit = links.filter(l => !visited.has(l)).slice(0, maxPages - 1);

    for (const link of pagesToVisit) {
      if (visited.has(link)) continue;
      visited.add(link);

      log(`\n--- Deep crawl: ${link} ---`);
      try {
        const components = await this.extractFromUrl(link);
        // Only add components with unique IDs
        const existingIds = new Set(allComponents.map(c => c.id));
        for (const comp of components) {
          if (!existingIds.has(comp.id)) {
            allComponents.push(comp);
            existingIds.add(comp.id);
          }
        }
      } catch (err) {
        logError(`  Error on ${link}: ${err.message}`);
      }
    }

    return allComponents;
  },

  /**
   * Extract from a curated source.
   */
  async extractFromSource(sourceName) {
    const catalog = SOURCE_CATALOGS[sourceName];
    if (!catalog) {
      logError(`Unknown source: ${sourceName}. Available: ${Object.keys(SOURCE_CATALOGS).join(', ')}`);
      return [];
    }

    log(`\n=== Extracting from ${catalog.name} ===`);
    log(`  ${catalog.components.length} components in catalog\n`);

    const allComponents = [];

    for (const entry of catalog.components) {
      const componentUrl = catalog.buildUrl(entry.slug);
      log(`--- ${entry.name} (${componentUrl}) ---`);

      try {
        const pageComponents = await this.extractFromUrl(componentUrl);

        if (pageComponents.length > 0) {
          // Override metadata with catalog info
          for (const comp of pageComponents) {
            comp.source = sourceName;
            comp.tags = [...new Set([...comp.tags, ...entry.tags])];
          }
          allComponents.push(...pageComponents);
        } else {
          // Create a placeholder from catalog metadata
          allComponents.push({
            id: `${sourceName}-${entry.slug}`,
            name: entry.name,
            category: entry.category,
            source: sourceName,
            extracted_from: componentUrl,
            description: `${entry.name} component from ${catalog.name}. Tags: ${entry.tags.join(', ')}.`,
            css: `/* Visit ${componentUrl} for full CSS */`,
            html_template: `<!-- ${entry.name} - see source for implementation -->`,
            js_init: '',
            js_type: 'none',
            dependencies: [],
            variables: {},
            tags: entry.tags,
            quality_score: 5,
          });
        }
      } catch (err) {
        logError(`  Error extracting ${entry.name}: ${err.message}`);
        // Still add catalog entry
        allComponents.push({
          id: `${sourceName}-${entry.slug}`,
          name: entry.name,
          category: entry.category,
          source: sourceName,
          extracted_from: componentUrl,
          description: `${entry.name} from ${catalog.name}. Could not fetch live — using catalog metadata.`,
          css: '',
          html_template: '',
          js_init: '',
          js_type: 'none',
          dependencies: [],
          variables: {},
          tags: entry.tags,
          quality_score: 3,
        });
      }
    }

    return allComponents;
  },

  /**
   * Batch extract from a JSON file.
   */
  async extractBatch(filePath) {
    let entries;
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      entries = JSON.parse(data);
    } catch (err) {
      logError(`Failed to read batch file ${filePath}: ${err.message}`);
      return [];
    }

    if (!Array.isArray(entries)) {
      logError('Batch file must contain a JSON array of URLs or {url, name} objects');
      return [];
    }

    log(`\n=== Batch extraction: ${entries.length} entries ===\n`);
    const allComponents = [];

    for (const entry of entries) {
      const targetUrl = typeof entry === 'string' ? entry : entry.url;
      if (!targetUrl) continue;

      log(`\n--- Batch: ${targetUrl} ---`);
      try {
        const components = await this.extractFromUrl(targetUrl);
        allComponents.push(...components);
      } catch (err) {
        logError(`  Error: ${err.message}`);
      }
    }

    return allComponents;
  },

  /**
   * Update library: identify gaps and suggest/fetch more components.
   */
  async updateLibrary() {
    const library = LibraryManager.load();
    const gaps = LibraryManager.identifyGaps(library);

    log('\n=== Library Update Analysis ===\n');
    log(`Current library: ${library.components.length} components\n`);

    if (gaps.length === 0) {
      log('Library is well-balanced! No major gaps found.');
      return [];
    }

    log('Category gaps found:');
    for (const gap of gaps) {
      log(`  ${gap.category}: ${gap.current}/${gap.ideal} (need ${gap.deficit} more)`);
    }

    // Map categories to sources that are likely to have them
    const categorySourceMap = {
      'Buttons/CTA': ['shadcn', 'tailwindui', 'codepen'],
      'Cards': ['aceternity', 'magicui', 'tailwindui'],
      'Heroes': ['tailwindui'],
      'Navigation': ['shadcn', 'aceternity', 'tailwindui'],
      'Animations': ['aceternity', 'magicui'],
      'Backgrounds': ['aceternity', 'codepen'],
      'Typography': ['tailwindui'],
      'Layouts': ['aceternity', 'magicui', 'tailwindui'],
      'Forms': ['shadcn', 'tailwindui'],
      'Footers': ['tailwindui'],
      'Modals': ['shadcn'],
      'Effects': ['aceternity', 'magicui', 'codepen'],
      'Feedback': ['shadcn'],
    };

    const allComponents = [];
    const sourcesToFetch = new Set();

    for (const gap of gaps.slice(0, 5)) {
      const sources = categorySourceMap[gap.category] || [];
      for (const src of sources) {
        sourcesToFetch.add(src);
      }
    }

    log(`\nSuggested sources to fetch: ${[...sourcesToFetch].join(', ')}`);
    log('Fetching from suggested sources...\n');

    for (const src of sourcesToFetch) {
      try {
        const components = await this.extractFromSource(src);
        allComponents.push(...components);
      } catch (err) {
        logError(`Error fetching ${src}: ${err.message}`);
      }
    }

    // Also try general patterns for site-specific components
    log('\nFetching from general pattern catalog...');
    for (const pattern of GENERAL_PATTERNS.slice(0, 5)) {
      try {
        const components = await this.extractFromUrl(pattern.url);
        allComponents.push(...components);
      } catch (err) {
        logError(`Error fetching ${pattern.url}: ${err.message}`);
      }
    }

    return allComponents;
  },
};

// ============================================================================
// LOGGING
// ============================================================================

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

function log(msg) {
  console.log(`${COLORS.dim}[nexus-extractor]${COLORS.reset} ${msg}`);
}

function logSuccess(msg) {
  console.log(`${COLORS.green}[nexus-extractor] ✓${COLORS.reset} ${msg}`);
}

function logError(msg) {
  console.error(`${COLORS.red}[nexus-extractor] ✗${COLORS.reset} ${msg}`);
}

function logHeader(msg) {
  console.log(`\n${COLORS.bright}${COLORS.cyan}${'═'.repeat(60)}`);
  console.log(`  ${msg}`);
  console.log(`${'═'.repeat(60)}${COLORS.reset}\n`);
}

function logStats(stats) {
  logHeader('LIBRARY STATISTICS');

  log(`${COLORS.bright}Total components:${COLORS.reset} ${stats.total}`);
  log(`${COLORS.bright}Average quality:${COLORS.reset} ${stats.avgScore}/10`);

  log(`\n${COLORS.bright}By Category:${COLORS.reset}`);
  const sortedCats = Object.entries(stats.categories).sort((a, b) => b[1] - a[1]);
  for (const [cat, count] of sortedCats) {
    const bar = '█'.repeat(Math.min(count, 30));
    log(`  ${cat.padEnd(20)} ${String(count).padStart(3)} ${COLORS.cyan}${bar}${COLORS.reset}`);
  }

  log(`\n${COLORS.bright}By Source:${COLORS.reset}`);
  const sortedSrcs = Object.entries(stats.sources).sort((a, b) => b[1] - a[1]);
  for (const [src, count] of sortedSrcs) {
    log(`  ${src.padEnd(25)} ${count}`);
  }

  if (stats.topTags.length > 0) {
    log(`\n${COLORS.bright}Top Tags:${COLORS.reset}`);
    log(`  ${stats.topTags.map(([tag, count]) => `${tag}(${count})`).join(', ')}`);
  }
}

// ============================================================================
// CLI PARSER
// ============================================================================

function parseArgs(argv) {
  const args = {
    url: null,
    deep: false,
    source: null,
    batch: null,
    updateLibrary: false,
    stats: false,
    export: null,
    help: false,
    output: null,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '--url':
      case '-u':
        args.url = argv[++i];
        break;
      case '--deep':
      case '-d':
        args.deep = true;
        break;
      case '--source':
      case '-s':
        args.source = argv[++i];
        break;
      case '--batch':
      case '-b':
        args.batch = argv[++i];
        break;
      case '--update-library':
        args.updateLibrary = true;
        break;
      case '--stats':
        args.stats = true;
        break;
      case '--export':
      case '-e':
        args.export = argv[++i];
        break;
      case '--output':
      case '-o':
        args.output = argv[++i];
        break;
      case '--help':
      case '-h':
        args.help = true;
        break;
      default:
        // If it looks like a URL without the flag
        if (arg.startsWith('http://') || arg.startsWith('https://')) {
          args.url = arg;
        }
        break;
    }
  }

  return args;
}

function printHelp() {
  console.log(`
${COLORS.bright}${COLORS.cyan}NEXUS EXTRACTOR AGENT${COLORS.reset}
${COLORS.dim}Extract UI components from live websites into the Nexus library${COLORS.reset}

${COLORS.bright}USAGE:${COLORS.reset}
  node nexus-extractor-agent.js [OPTIONS]

${COLORS.bright}MODES:${COLORS.reset}
  ${COLORS.green}--url <url>${COLORS.reset}          Extract from a single URL
  ${COLORS.green}--url <url> --deep${COLORS.reset}   Deep extract (follows internal links)
  ${COLORS.green}--source <name>${COLORS.reset}      Extract from curated source
  ${COLORS.green}--batch <file>${COLORS.reset}       Batch extract from JSON file
  ${COLORS.green}--update-library${COLORS.reset}     Auto-fill library gaps
  ${COLORS.green}--stats${COLORS.reset}              Show library statistics
  ${COLORS.green}--export <category>${COLORS.reset}  Export category to file

${COLORS.bright}OPTIONS:${COLORS.reset}
  ${COLORS.green}--output, -o <dir>${COLORS.reset}   Output directory (default: ./code-library)
  ${COLORS.green}--help, -h${COLORS.reset}           Show this help message

${COLORS.bright}SOURCES:${COLORS.reset}
  aceternity    ui.aceternity.com (15 components)
  magicui       magicui.design (15 components)
  shadcn        ui.shadcn.com (10 components)
  tailwindui    Tailwind UI patterns (8 components)
  codepen       CodePen popular UI (5 components)

${COLORS.bright}EXAMPLES:${COLORS.reset}
  node nexus-extractor-agent.js --url https://stripe.com
  node nexus-extractor-agent.js --url https://linear.app --deep
  node nexus-extractor-agent.js --source aceternity
  node nexus-extractor-agent.js --source magicui
  node nexus-extractor-agent.js --batch sites.json
  node nexus-extractor-agent.js --update-library
  node nexus-extractor-agent.js --stats
  node nexus-extractor-agent.js --export buttons

${COLORS.bright}LIBRARY FORMAT:${COLORS.reset}
  Components are saved to code-library/components.json
  Each component includes: id, name, category, CSS, HTML template,
  JS initialization, dependencies, tags, and quality score (1-10).

${COLORS.bright}PATTERN DETECTION:${COLORS.reset}
  Buttons, Cards, Heroes, Navbars, Animations, Backgrounds,
  Typography, Grids/Layouts, Forms, Footers, Modals, Pricing,
  Testimonials, Feature Grids, CTAs.
`);
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = parseArgs(process.argv);

  if (args.help || (process.argv.length <= 2)) {
    printHelp();
    process.exit(0);
  }

  // Set custom output directory
  if (args.output) {
    CONFIG.libraryDir = path.resolve(args.output);
  }

  const startTime = Date.now();

  // --- STATS MODE ---
  if (args.stats) {
    const library = LibraryManager.load();
    if (library.components.length === 0) {
      log('Library is empty. Run an extraction first.');
      process.exit(0);
    }
    const stats = LibraryManager.getStats(library);
    logStats(stats);
    process.exit(0);
  }

  // --- EXPORT MODE ---
  if (args.export) {
    const library = LibraryManager.load();
    const exported = LibraryManager.exportCategory(library, args.export);
    if (exported.components.length === 0) {
      logError(`No components found in category "${args.export}"`);
      process.exit(1);
    }
    const exportPath = path.join(CONFIG.libraryDir, `${slugify(args.export)}-components.json`);
    if (!fs.existsSync(CONFIG.libraryDir)) {
      fs.mkdirSync(CONFIG.libraryDir, { recursive: true });
    }
    fs.writeFileSync(exportPath, JSON.stringify(exported, null, 2), 'utf-8');
    logSuccess(`Exported ${exported.components.length} "${args.export}" components to ${exportPath}`);
    process.exit(0);
  }

  // --- EXTRACTION MODES ---
  let components = [];

  if (args.url) {
    logHeader(`EXTRACTING FROM URL${args.deep ? ' (DEEP)' : ''}`);
    log(`Target: ${args.url}`);

    if (args.deep) {
      components = await Extractor.extractDeep(args.url);
    } else {
      components = await Extractor.extractFromUrl(args.url);
    }
  } else if (args.source) {
    logHeader(`EXTRACTING FROM SOURCE: ${args.source.toUpperCase()}`);
    components = await Extractor.extractFromSource(args.source);
  } else if (args.batch) {
    logHeader('BATCH EXTRACTION');
    log(`Batch file: ${args.batch}`);
    components = await Extractor.extractBatch(args.batch);
  } else if (args.updateLibrary) {
    logHeader('LIBRARY UPDATE');
    components = await Extractor.updateLibrary();
  }

  // --- SAVE TO LIBRARY ---
  if (components.length > 0) {
    const library = LibraryManager.load();
    const added = LibraryManager.addComponents(library, components);
    const savedPath = LibraryManager.save(library);

    console.log('');
    logHeader('EXTRACTION COMPLETE');
    log(`Components found:  ${components.length}`);
    log(`New components:    ${added}`);
    log(`Total in library:  ${library.components.length}`);
    log(`Saved to:          ${savedPath}`);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`Time elapsed:      ${elapsed}s`);

    // Quick breakdown
    const breakdown = {};
    for (const comp of components) {
      breakdown[comp.category] = (breakdown[comp.category] || 0) + 1;
    }
    log('\nExtracted by category:');
    for (const [cat, count] of Object.entries(breakdown).sort((a, b) => b[1] - a[1])) {
      log(`  ${cat.padEnd(20)} ${count}`);
    }

    // Show quality distribution
    const scores = components.map(c => c.quality_score);
    const avgScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    log(`\nQuality: avg=${avgScore} min=${minScore} max=${maxScore}`);
  } else {
    log('\nNo components were extracted.');

    if (args.url) {
      log('Tip: The page might use JS-rendered content. Try --deep to crawl more pages.');
    }
  }
}

// Run
main().catch(err => {
  logError(`Fatal error: ${err.message}`);
  if (process.env.DEBUG) console.error(err.stack);
  process.exit(1);
});
