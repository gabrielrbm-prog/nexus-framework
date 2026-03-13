#!/usr/bin/env node
/**
 * NEXUS Dark Design Extractor
 * Extracts premium CSS patterns from curated dark-themed websites
 * Sources: dark.design, dribbble, behance references
 *
 * Usage:
 *   node nexus-dark-design-extractor.js --all
 *   node nexus-dark-design-extractor.js --url https://linear.app
 *   node nexus-dark-design-extractor.js --category agency --max 5
 */

'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// ============================================================================
// PATHS
// ============================================================================

const WORKSPACE = path.join(__dirname, '..');
const REFS_DB = path.join(WORKSPACE, 'references-db');
const LIB_DIR = path.join(WORKSPACE, 'component-library');
const REFS_FILE = path.join(REFS_DB, 'premium-dark-references.json');
const LIB_FILE = path.join(LIB_DIR, 'components.json');
const REPORT_FILE = path.join(REFS_DB, 'extraction-report.md');

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

// ============================================================================
// REGEX PATTERNS
// ============================================================================

const PATTERNS = {
  cssVariables:    /--[a-zA-Z][\w-]*:\s*[^;]+/g,
  fontFace:        /@font-face\s*\{[^}]+\}/g,
  fontFamily:      /font-family:\s*[^;]+/g,
  keyframes:       /@keyframes\s+[\w-]+\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}/g,
  gradient:        /(linear|radial|conic)-gradient\([^)]+\)/g,
  boxShadow:       /box-shadow:\s*[^;]+/g,
  borderRadius:    /border-radius:\s*[^;]+/g,
  backdropFilter:  /backdrop-filter:\s*[^;]+/g,
  transition:      /transition:\s*[^;]+/g,
  mediaQuery:      /@media\s*\([^)]+\)\s*\{/g,
};

// Selectors we look for in rule blocks
const SELECTOR_PATTERNS = {
  buttons: /(?:^|\})\s*((?:[^{}]*?(?:\.btn|\.button|button|\[class\*="btn"\]))[^{]*)\{([^}]+)\}/g,
  cards:   /(?:^|\})\s*((?:[^{}]*?(?:\.card|\[class\*="card"\]))[^{]*)\{([^}]+)\}/g,
  hero:    /(?:^|\})\s*((?:[^{}]*?(?:\.hero|\.banner|#hero|\[class\*="hero"\]))[^{]*)\{([^}]+)\}/g,
};

// ============================================================================
// NexusDarkDesignExtractor
// ============================================================================

class NexusDarkDesignExtractor {
  constructor(opts = {}) {
    this.maxSites = opts.max || 10;
    this.category = opts.category || null;
    this.singleUrl = opts.url || null;
    this.results = [];
    this.errors = [];
    this.startTime = Date.now();
  }

  // --------------------------------------------------------------------------
  // Load premium references from JSON
  // --------------------------------------------------------------------------
  loadReferences() {
    if (!fs.existsSync(REFS_FILE)) {
      console.log('[info] References file not found, creating default at', REFS_FILE);
      const defaults = this._defaultReferences();
      fs.mkdirSync(path.dirname(REFS_FILE), { recursive: true });
      fs.writeFileSync(REFS_FILE, JSON.stringify(defaults, null, 2));
      return defaults;
    }
    const data = JSON.parse(fs.readFileSync(REFS_FILE, 'utf-8'));
    // Support both flat `sites` array and nested `curated_sites` format
    if (!data.sites && data.curated_sites) {
      data.sites = Object.values(data.curated_sites).flat();
    }
    return data;
  }

  _defaultReferences() {
    return {
      version: '1.0.0',
      description: 'Curated premium dark-themed websites for design extraction',
      sites: [
        { name: 'Linear',    url: 'https://linear.app',       category: 'saas',    tags: ['dark', 'minimal', 'gradient'] },
        { name: 'Vercel',    url: 'https://vercel.com',       category: 'saas',    tags: ['dark', 'modern', 'glassmorphism'] },
        { name: 'Raycast',   url: 'https://raycast.com',      category: 'saas',    tags: ['dark', 'vibrant', 'animation'] },
        { name: 'Resend',    url: 'https://resend.com',       category: 'saas',    tags: ['dark', 'minimal', 'clean'] },
        { name: 'Framer',    url: 'https://framer.com',       category: 'design',  tags: ['dark', 'creative', 'animation'] },
        { name: 'Supabase',  url: 'https://supabase.com',     category: 'saas',    tags: ['dark', 'gradient', 'glow'] },
        { name: 'Planetscale', url: 'https://planetscale.com', category: 'saas',   tags: ['dark', 'clean', 'technical'] },
        { name: 'Lemon Squeezy', url: 'https://lemonsqueezy.com', category: 'saas', tags: ['dark', 'colorful', 'playful'] },
        { name: 'Pitch',     url: 'https://pitch.com',        category: 'saas',    tags: ['dark', 'professional', 'gradient'] },
        { name: 'Stripe',    url: 'https://stripe.com',       category: 'fintech', tags: ['dark', 'premium', 'gradient'] },
        { name: 'Liveblocks', url: 'https://liveblocks.io',   category: 'saas',    tags: ['dark', 'technical', 'animation'] },
        { name: 'WorkOS',    url: 'https://workos.com',       category: 'saas',    tags: ['dark', 'enterprise', 'clean'] },
        { name: 'Clerk',     url: 'https://clerk.com',        category: 'saas',    tags: ['dark', 'modern', 'gradient'] },
        { name: 'Neon',      url: 'https://neon.tech',        category: 'saas',    tags: ['dark', 'neon', 'glow'] },
        { name: 'Railway',   url: 'https://railway.app',      category: 'saas',    tags: ['dark', 'minimal', 'modern'] },
      ],
    };
  }

  // --------------------------------------------------------------------------
  // Filter by category
  // --------------------------------------------------------------------------
  filterByCategory(sites, category) {
    if (!category) return sites;
    return sites.filter(s => s.category === category);
  }

  // --------------------------------------------------------------------------
  // Fetch URL with timeout and redirect following
  // --------------------------------------------------------------------------
  fetchUrl(targetUrl, timeout = 15000, redirectCount = 0) {
    const MAX_REDIRECTS = 3;
    return new Promise((resolve, reject) => {
      if (redirectCount > MAX_REDIRECTS) {
        return reject(new Error(`Too many redirects (>${MAX_REDIRECTS}) for ${targetUrl}`));
      }

      let parsed;
      try {
        parsed = new URL(targetUrl);
      } catch (e) {
        return reject(new Error(`Invalid URL: ${targetUrl}`));
      }

      const transport = parsed.protocol === 'https:' ? https : http;
      const req = transport.get(targetUrl, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,text/css,application/xhtml+xml,*/*',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout,
      }, (res) => {
        // Follow redirects
        if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
          const next = new URL(res.headers.location, targetUrl).href;
          res.resume(); // drain
          return resolve(this.fetchUrl(next, timeout, redirectCount + 1));
        }

        if (res.statusCode < 200 || res.statusCode >= 400) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode} for ${targetUrl}`));
        }

        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
        res.on('error', reject);
      });

      req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout for ${targetUrl}`)); });
      req.on('error', reject);
    });
  }

  // --------------------------------------------------------------------------
  // Extract CSS from HTML (inline <style> blocks + linked stylesheet URLs)
  // --------------------------------------------------------------------------
  extractCSS(html, baseUrl) {
    let css = '';

    // Inline <style> blocks
    const styleRe = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    let m;
    while ((m = styleRe.exec(html)) !== null) {
      css += m[1] + '\n';
    }

    // Collect linked stylesheet hrefs (to be fetched later)
    const linkRe = /<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi;
    const linkRe2 = /<link[^>]+href=["']([^"']+)["'][^>]*rel=["']stylesheet["'][^>]*>/gi;
    const stylesheetUrls = [];

    for (const re of [linkRe, linkRe2]) {
      while ((m = re.exec(html)) !== null) {
        try {
          const absUrl = new URL(m[1], baseUrl).href;
          if (!stylesheetUrls.includes(absUrl)) {
            stylesheetUrls.push(absUrl);
          }
        } catch (_) { /* skip malformed */ }
      }
    }

    return { inlineCSS: css, stylesheetUrls };
  }

  // --------------------------------------------------------------------------
  // Parse CSS into pattern categories
  // --------------------------------------------------------------------------
  parsePatterns(css, siteName) {
    const patterns = {
      siteName,
      cssVariables: [],
      fontFaces: [],
      fontFamilies: [],
      buttons: [],
      cards: [],
      hero: [],
      keyframes: [],
      gradients: [],
      boxShadows: [],
      borderRadii: [],
      glassmorphism: [],
      transitions: [],
    };

    // Simple regex extraction
    let m;

    // CSS variables
    while ((m = PATTERNS.cssVariables.exec(css)) !== null) {
      const v = m[0].trim();
      if (!patterns.cssVariables.includes(v)) patterns.cssVariables.push(v);
    }

    // Font faces
    while ((m = PATTERNS.fontFace.exec(css)) !== null) {
      patterns.fontFaces.push(m[0].trim());
    }

    // Font families
    while ((m = PATTERNS.fontFamily.exec(css)) !== null) {
      const v = m[0].trim();
      if (!patterns.fontFamilies.includes(v)) patterns.fontFamilies.push(v);
    }

    // Keyframes
    while ((m = PATTERNS.keyframes.exec(css)) !== null) {
      patterns.keyframes.push(m[0].trim());
    }

    // Gradients
    while ((m = PATTERNS.gradient.exec(css)) !== null) {
      const v = m[0].trim();
      if (!patterns.gradients.includes(v)) patterns.gradients.push(v);
    }

    // Box shadows
    while ((m = PATTERNS.boxShadow.exec(css)) !== null) {
      const v = m[0].trim();
      if (!patterns.boxShadows.includes(v)) patterns.boxShadows.push(v);
    }

    // Border radius
    while ((m = PATTERNS.borderRadius.exec(css)) !== null) {
      const v = m[0].trim();
      if (!patterns.borderRadii.includes(v)) patterns.borderRadii.push(v);
    }

    // Glassmorphism (backdrop-filter)
    while ((m = PATTERNS.backdropFilter.exec(css)) !== null) {
      patterns.glassmorphism.push(m[0].trim());
    }

    // Transitions
    while ((m = PATTERNS.transition.exec(css)) !== null) {
      const v = m[0].trim();
      if (!patterns.transitions.includes(v)) patterns.transitions.push(v);
    }

    // Selector-based extraction (buttons, cards, hero)
    for (const [key, re] of Object.entries(SELECTOR_PATTERNS)) {
      // Reset regex each time
      re.lastIndex = 0;
      while ((m = re.exec(css)) !== null) {
        patterns[key].push({ selector: m[1].trim(), css: m[2].trim() });
      }
    }

    return patterns;
  }

  // --------------------------------------------------------------------------
  // Score a pattern based on CSS sophistication (1-10)
  // --------------------------------------------------------------------------
  scorePattern(css) {
    let score = 1; // base
    if (PATTERNS.gradient.test(css))        score += 1;
    if (PATTERNS.keyframes.test(css))       score += 2;
    if (PATTERNS.cssVariables.test(css))    score += 1;
    if (PATTERNS.mediaQuery.test(css))      score += 1;
    if (PATTERNS.transition.test(css))      score += 1;
    if (PATTERNS.backdropFilter.test(css))  score += 2;
    if (PATTERNS.boxShadow.test(css))       score += 1;

    // Reset all regex lastIndex
    for (const re of Object.values(PATTERNS)) re.lastIndex = 0;

    return Math.min(score, 10);
  }

  // --------------------------------------------------------------------------
  // Build component library entries from extracted patterns
  // --------------------------------------------------------------------------
  buildLibraryEntries(patterns) {
    const entries = [];
    const slug = patterns.siteName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');

    // CSS Variables as a design-token entry
    if (patterns.cssVariables.length > 0) {
      entries.push({
        id: `darkdesign-${slug}-variables`,
        name: `${patterns.siteName} Dark Variables`,
        category: 'Design Tokens',
        source: patterns.siteName,
        extractedAt: new Date().toISOString(),
        css: ':root {\n  ' + patterns.cssVariables.join(';\n  ') + ';\n}',
        score: Math.min(1 + Math.floor(patterns.cssVariables.length / 5), 10),
        tags: ['dark-theme', 'css-variables', 'design-tokens'],
      });
    }

    // Keyframes
    patterns.keyframes.forEach((kf, i) => {
      const nameMatch = kf.match(/@keyframes\s+([\w-]+)/);
      const animName = nameMatch ? nameMatch[1] : `anim-${i}`;
      entries.push({
        id: `darkdesign-${slug}-keyframe-${animName}`,
        name: `${patterns.siteName} - @keyframes ${animName}`,
        category: 'Animations',
        source: patterns.siteName,
        extractedAt: new Date().toISOString(),
        css: kf,
        score: this.scorePattern(kf),
        tags: ['dark-theme', 'animation', 'keyframes'],
      });
    });

    // Buttons
    patterns.buttons.forEach((btn, i) => {
      entries.push({
        id: `darkdesign-${slug}-button-${i}`,
        name: `${patterns.siteName} Button ${i + 1}`,
        category: 'Buttons',
        source: patterns.siteName,
        extractedAt: new Date().toISOString(),
        css: `${btn.selector} { ${btn.css} }`,
        score: this.scorePattern(btn.css),
        tags: ['dark-theme', 'button'],
      });
    });

    // Cards
    patterns.cards.forEach((card, i) => {
      entries.push({
        id: `darkdesign-${slug}-card-${i}`,
        name: `${patterns.siteName} Card ${i + 1}`,
        category: 'Cards',
        source: patterns.siteName,
        extractedAt: new Date().toISOString(),
        css: `${card.selector} { ${card.css} }`,
        score: this.scorePattern(card.css),
        tags: ['dark-theme', 'card'],
      });
    });

    // Hero sections
    patterns.hero.forEach((h, i) => {
      entries.push({
        id: `darkdesign-${slug}-hero-${i}`,
        name: `${patterns.siteName} Hero ${i + 1}`,
        category: 'Hero',
        source: patterns.siteName,
        extractedAt: new Date().toISOString(),
        css: `${h.selector} { ${h.css} }`,
        score: this.scorePattern(h.css),
        tags: ['dark-theme', 'hero', 'layout'],
      });
    });

    // Gradients as reusable patterns
    if (patterns.gradients.length > 0) {
      entries.push({
        id: `darkdesign-${slug}-gradients`,
        name: `${patterns.siteName} Gradients`,
        category: 'Gradients',
        source: patterns.siteName,
        extractedAt: new Date().toISOString(),
        css: patterns.gradients.map((g, i) => `.gradient-${slug}-${i} { background: ${g}; }`).join('\n'),
        score: Math.min(2 + patterns.gradients.length, 10),
        tags: ['dark-theme', 'gradient'],
      });
    }

    // Glassmorphism
    if (patterns.glassmorphism.length > 0) {
      entries.push({
        id: `darkdesign-${slug}-glass`,
        name: `${patterns.siteName} Glassmorphism`,
        category: 'Effects',
        source: patterns.siteName,
        extractedAt: new Date().toISOString(),
        css: patterns.glassmorphism.map(g => `.glass-${slug} { ${g}; }`).join('\n'),
        score: 8,
        tags: ['dark-theme', 'glassmorphism', 'backdrop-filter'],
      });
    }

    // Box shadows
    if (patterns.boxShadows.length > 0) {
      entries.push({
        id: `darkdesign-${slug}-shadows`,
        name: `${patterns.siteName} Box Shadows`,
        category: 'Effects',
        source: patterns.siteName,
        extractedAt: new Date().toISOString(),
        css: patterns.boxShadows.map((s, i) => `.shadow-${slug}-${i} { ${s}; }`).join('\n'),
        score: Math.min(2 + patterns.boxShadows.length, 10),
        tags: ['dark-theme', 'box-shadow', 'elevation'],
      });
    }

    return entries;
  }

  // --------------------------------------------------------------------------
  // Save to component library (merge with existing)
  // --------------------------------------------------------------------------
  saveToLibrary(allEntries) {
    fs.mkdirSync(LIB_DIR, { recursive: true });

    let library = { meta: {}, components: [] };
    if (fs.existsSync(LIB_FILE)) {
      try {
        library = JSON.parse(fs.readFileSync(LIB_FILE, 'utf-8'));
        if (!Array.isArray(library.components)) library.components = [];
      } catch (_) {
        library = { meta: {}, components: [] };
      }
    }

    const existingIds = new Set(library.components.map(c => c.id));
    let added = 0;
    let skipped = 0;

    for (const entry of allEntries) {
      if (existingIds.has(entry.id)) {
        skipped++;
        continue;
      }
      library.components.push(entry);
      existingIds.add(entry.id);
      added++;
    }

    library.meta = {
      ...library.meta,
      name: library.meta.name || 'Nexus Component Library',
      version: library.meta.version || '1.0.0',
      total_components: library.components.length,
      last_updated: new Date().toISOString(),
      last_extraction_source: 'nexus-dark-design-extractor',
    };

    fs.writeFileSync(LIB_FILE, JSON.stringify(library, null, 2));
    console.log(`[library] Saved: ${added} added, ${skipped} skipped (duplicate). Total: ${library.components.length}`);
    return { added, skipped, total: library.components.length };
  }

  // --------------------------------------------------------------------------
  // Generate extraction report
  // --------------------------------------------------------------------------
  generateReport(sitesProcessed) {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    const lines = [
      '# NEXUS Dark Design Extraction Report',
      '',
      `**Generated:** ${new Date().toISOString()}`,
      `**Duration:** ${elapsed}s`,
      `**Sites processed:** ${sitesProcessed.length}`,
      `**Errors:** ${this.errors.length}`,
      '',
      '## Results by Site',
      '',
    ];

    for (const result of this.results) {
      const p = result.patterns;
      lines.push(`### ${p.siteName}`);
      lines.push('');
      lines.push(`| Pattern | Count |`);
      lines.push(`|---------|-------|`);
      lines.push(`| CSS Variables | ${p.cssVariables.length} |`);
      lines.push(`| Font Faces | ${p.fontFaces.length} |`);
      lines.push(`| Font Families | ${p.fontFamilies.length} |`);
      lines.push(`| Buttons | ${p.buttons.length} |`);
      lines.push(`| Cards | ${p.cards.length} |`);
      lines.push(`| Hero Sections | ${p.hero.length} |`);
      lines.push(`| Keyframes | ${p.keyframes.length} |`);
      lines.push(`| Gradients | ${p.gradients.length} |`);
      lines.push(`| Box Shadows | ${p.boxShadows.length} |`);
      lines.push(`| Border Radii | ${p.borderRadii.length} |`);
      lines.push(`| Glassmorphism | ${p.glassmorphism.length} |`);
      lines.push(`| Transitions | ${p.transitions.length} |`);
      lines.push('');
    }

    if (this.errors.length > 0) {
      lines.push('## Errors');
      lines.push('');
      for (const err of this.errors) {
        lines.push(`- **${err.site}**: ${err.message}`);
      }
      lines.push('');
    }

    lines.push('## Library Summary');
    lines.push('');
    if (this.librarySummary) {
      lines.push(`- **New patterns added:** ${this.librarySummary.added}`);
      lines.push(`- **Duplicates skipped:** ${this.librarySummary.skipped}`);
      lines.push(`- **Total in library:** ${this.librarySummary.total}`);
    }
    lines.push('');

    const report = lines.join('\n');
    fs.writeFileSync(REPORT_FILE, report);
    console.log(`[report] Written to ${REPORT_FILE}`);
    return report;
  }

  // --------------------------------------------------------------------------
  // Process a single site
  // --------------------------------------------------------------------------
  async processSite(site) {
    const name = site.name || new URL(site.url).hostname;
    console.log(`[fetch] ${name} (${site.url})`);

    try {
      const html = await this.fetchUrl(site.url);
      const { inlineCSS, stylesheetUrls } = this.extractCSS(html, site.url);

      // Fetch up to 3 external stylesheets
      let externalCSS = '';
      const sheetsToFetch = stylesheetUrls.slice(0, 3);
      for (const sheetUrl of sheetsToFetch) {
        try {
          const css = await this.fetchUrl(sheetUrl, 10000);
          externalCSS += css + '\n';
        } catch (e) {
          console.log(`  [warn] Could not fetch stylesheet: ${sheetUrl} (${e.message})`);
        }
      }

      const fullCSS = inlineCSS + '\n' + externalCSS;
      const patterns = this.parsePatterns(fullCSS, name);

      const totalPatterns = patterns.cssVariables.length + patterns.fontFaces.length +
        patterns.buttons.length + patterns.cards.length + patterns.hero.length +
        patterns.keyframes.length + patterns.gradients.length + patterns.boxShadows.length +
        patterns.glassmorphism.length;

      console.log(`  [done] ${totalPatterns} patterns extracted (${stylesheetUrls.length} stylesheets found, ${sheetsToFetch.length} fetched)`);

      return { patterns, entries: this.buildLibraryEntries(patterns) };
    } catch (err) {
      console.log(`  [error] ${err.message}`);
      this.errors.push({ site: name, message: err.message });
      return null;
    }
  }

  // --------------------------------------------------------------------------
  // Main run
  // --------------------------------------------------------------------------
  async run() {
    console.log('=== NEXUS Dark Design Extractor ===\n');

    let sitesToProcess = [];

    if (this.singleUrl) {
      // Single URL mode
      sitesToProcess = [{ name: new URL(this.singleUrl).hostname, url: this.singleUrl, category: 'custom' }];
    } else {
      // Load from references file
      const refs = this.loadReferences();
      let sites = refs.sites || [];
      sites = this.filterByCategory(sites, this.category);

      if (sites.length === 0) {
        console.log(`[warn] No sites found${this.category ? ` for category "${this.category}"` : ''}. Check ${REFS_FILE}`);
        return;
      }

      sitesToProcess = sites.slice(0, this.maxSites);
    }

    console.log(`Processing ${sitesToProcess.length} site(s)...\n`);

    const allEntries = [];

    // Process sites sequentially to be polite to servers
    for (const site of sitesToProcess) {
      const result = await this.processSite(site);
      if (result) {
        this.results.push(result);
        allEntries.push(...result.entries);
      }
    }

    console.log(`\n[summary] ${this.results.length}/${sitesToProcess.length} sites OK, ${allEntries.length} patterns total\n`);

    // Save to library
    if (allEntries.length > 0) {
      this.librarySummary = this.saveToLibrary(allEntries);
    } else {
      console.log('[library] No patterns to save.');
      this.librarySummary = { added: 0, skipped: 0, total: 0 };
    }

    // Generate report
    this.generateReport(sitesToProcess);

    console.log('\nDone.');
  }
}

// ============================================================================
// CLI
// ============================================================================

function parseArgs(argv) {
  const opts = {};
  for (let i = 2; i < argv.length; i++) {
    switch (argv[i]) {
      case '--url':
        opts.url = argv[++i];
        break;
      case '--all':
        opts.max = 999;
        break;
      case '--category':
        opts.category = argv[++i];
        break;
      case '--max':
        opts.max = parseInt(argv[++i], 10) || 10;
        break;
      case '--help':
      case '-h':
        console.log(`Usage: node nexus-dark-design-extractor.js [options]

Options:
  --all              Process all curated sites
  --url <url>        Extract from a single URL
  --category <cat>   Filter sites by category (saas, fintech, agency, design)
  --max <n>          Maximum number of sites to process (default: 10)
  -h, --help         Show this help message
`);
        process.exit(0);
    }
  }
  return opts;
}

// ============================================================================
// ENTRY POINT
// ============================================================================

if (require.main === module) {
  const opts = parseArgs(process.argv);
  const extractor = new NexusDarkDesignExtractor(opts);
  extractor.run().catch((err) => {
    console.error('[fatal]', err.message);
    process.exit(1);
  });
}

module.exports = { NexusDarkDesignExtractor };
