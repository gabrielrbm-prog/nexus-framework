#!/usr/bin/env node

/**
 * NEXUS Reference Hunter
 *
 * Automatic competitor research + extraction pipeline.
 * When the Context Agent identifies competitors or a niche is provided,
 * this agent:
 *   1. Discovers competitor URLs (from context DNA, trend scout DB, or LLM)
 *   2. Scrapes each competitor site for design patterns (colors, fonts, layout)
 *   3. Runs the Extractor Agent to harvest reusable components
 *   4. Syncs everything to Google Sheets (if configured)
 *   5. Saves competitor-analysis.json for downstream agents
 *   6. Updates references-db/ with new niche data
 *
 * Usage:
 *   node nexus-reference-hunter.js <project-name> [--niche fintech] [--max 5]
 *
 * Pipeline position: Wave 3.5 — runs after Context, before Design/Content
 */

'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { exec } = require('child_process');

const WORKSPACE = path.join(__dirname, '..');
const AGENTS_DIR = __dirname;

// ─────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────

const CONFIG = {
  maxConcurrent: 3,
  maxSites: 6,
  requestTimeout: 12000,
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

// Known competitor sites by niche (fallback when no URL list provided)
const NICHE_COMPETITORS = {
  fintech:    ['stripe.com', 'mercury.com', 'ramp.com', 'wise.com', 'brex.com', 'revolut.com'],
  trading:    ['ftmo.com', 'topstep.com', 'apex-trader-funding.com', 'fundednext.com', 'myfundedfx.com'],
  saas:       ['vercel.com', 'supabase.com', 'linear.app', 'notion.so', 'resend.com', 'cal.com'],
  healthcare: ['headspace.com', 'calm.com', 'zocdoc.com', 'noom.com', 'betterhelp.com'],
  ecommerce:  ['shopify.com', 'gumroad.com', 'lemonsqueezy.com', 'printful.com', 'gymshark.com'],
  fitness:    ['peloton.com', 'myfitnesspal.com', 'strava.com', 'nike.com/training', 'crossfit.com'],
  education:  ['udemy.com', 'skillshare.com', 'masterclass.com', 'coursera.org', 'duolingo.com'],
  restaurant: ['doordash.com', 'uber.com/eats', 'opentable.com', 'resy.com', 'toast.restaurant'],
  agency:     ['webflow.com', 'framer.com', 'squarespace.com', 'wix.com', 'figma.com'],
  luxury:     ['tesla.com', 'apple.com', 'rolex.com', 'cartier.com', 'louisvuitton.com'],
  tech:       ['github.com', 'vercel.com', 'netlify.com', 'cloudflare.com', 'digitalocean.com'],
  realestate: ['zillow.com', 'realtor.com', 'redfin.com', 'trulia.com', 'compass.com'],
};

// Category mapping for premium references → niche matching
const CATEGORY_MAP = {
  fitness: ['fitness', 'personal', 'agency'],
  healthcare: ['software', 'personal'],
  fintech: ['fintech', 'software'],
  trading: ['fintech', 'software'],
  saas: ['software', 'ai'],
  ecommerce: ['commerce', 'software'],
  restaurant: ['personal', 'agency'],
  education: ['education', 'software'],
  agency: ['agency', 'personal'],
  luxury: ['agency', 'personal', 'commerce'],
  tech: ['software', 'ai'],
  default: ['software', 'agency'],
};

// ─────────────────────────────────────────────────────────────
// HTTP FETCHER
// ─────────────────────────────────────────────────────────────

function fetchUrl(targetUrl, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) return reject(new Error('Too many redirects'));

    let fullUrl = targetUrl;
    if (!fullUrl.startsWith('http')) fullUrl = 'https://' + fullUrl;

    let parsed;
    try { parsed = new URL(fullUrl); } catch { return reject(new Error(`Invalid URL: ${fullUrl}`)); }

    const transport = parsed.protocol === 'https:' ? https : http;
    const req = transport.request({
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: { 'User-Agent': CONFIG.userAgent, 'Accept': 'text/html,*/*' },
      timeout: CONFIG.requestTimeout,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = new URL(res.headers.location, fullUrl).href;
        res.resume();
        return fetchUrl(redirectUrl, maxRedirects - 1).then(resolve).catch(reject);
      }
      if (res.statusCode < 200 || res.statusCode >= 300) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.end();
  });
}

// ─────────────────────────────────────────────────────────────
// SITE ANALYZER — extracts design DNA from a competitor page
// ─────────────────────────────────────────────────────────────

class SiteAnalyzer {

  static async analyze(siteUrl) {
    const url = siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`;
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    const companyName = hostname.split('.')[0];

    const result = {
      url,
      hostname,
      companyName: companyName.charAt(0).toUpperCase() + companyName.slice(1),
      analyzedAt: new Date().toISOString(),
      title: '',
      description: '',
      colors: { primary: [], secondary: [], accent: [], backgrounds: [], text: [] },
      fonts: [],
      techStack: [],
      effects: [],
      sections: [],
      ctaTexts: [],
      heroType: '',
      darkMode: false,
      score: { design: 0, performance: 0, conversion: 0 },
    };

    let html;
    try {
      html = await fetchUrl(url);
    } catch (e) {
      result.error = e.message;
      return result;
    }

    result.title = this._extractTitle(html);
    result.description = this._extractMeta(html);
    result.colors = this._extractColors(html);
    result.fonts = this._extractFonts(html);
    result.techStack = this._extractTech(html);
    result.effects = this._extractEffects(html);
    result.sections = this._extractSections(html);
    result.ctaTexts = this._extractCTAs(html);
    result.heroType = this._detectHeroType(html);
    result.darkMode = this._detectDarkMode(html, result.colors);
    result.score = this._calculateScore(result);

    return result;
  }

  static _extractTitle(html) {
    const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return m ? m[1].trim() : '';
  }

  static _extractMeta(html) {
    const m = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i)
           || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
    return m ? m[1].trim() : '';
  }

  static _extractColors(html) {
    const colors = { primary: [], secondary: [], accent: [], backgrounds: [], text: [] };
    const allHex = new Set();

    // CSS variables
    const varMatches = html.matchAll(/--(?:color-?)?(?:primary|main|brand)[^:]*:\s*(#[0-9a-fA-F]{3,8})/gi);
    for (const m of varMatches) allHex.add(m[1].toLowerCase());

    const secMatches = html.matchAll(/--(?:color-?)?(?:secondary|accent|highlight)[^:]*:\s*(#[0-9a-fA-F]{3,8})/gi);
    for (const m of secMatches) colors.secondary.push(m[1].toLowerCase());

    const bgMatches = html.matchAll(/--(?:color-?)?(?:bg|background|surface)[^:]*:\s*(#[0-9a-fA-F]{3,8})/gi);
    for (const m of bgMatches) colors.backgrounds.push(m[1].toLowerCase());

    // Hex colors in styles
    const hexMatches = html.matchAll(/#(?:[0-9a-fA-F]{3}){1,2}(?:[0-9a-fA-F]{2})?\b/g);
    for (const m of hexMatches) {
      const hex = m[0].toLowerCase();
      if (hex !== '#fff' && hex !== '#ffffff' && hex !== '#000' && hex !== '#000000'
          && hex !== '#333' && hex !== '#ccc' && hex !== '#ddd' && hex !== '#eee') {
        allHex.add(hex);
      }
    }

    colors.primary = [...new Set([...colors.primary, ...[...allHex].slice(0, 3)])];
    if (colors.secondary.length === 0) colors.secondary = [...allHex].slice(3, 5);
    colors.accent = [...allHex].slice(5, 7);

    return colors;
  }

  static _extractFonts(html) {
    const fonts = new Set();

    // Google Fonts
    const gfMatches = html.matchAll(/fonts\.googleapis\.com\/css2?\?family=([^"'&\s]+)/g);
    for (const m of gfMatches) {
      const families = decodeURIComponent(m[1]).split('|');
      families.forEach(f => fonts.add(f.split(':')[0].replace(/\+/g, ' ')));
    }

    // font-family declarations
    const ffMatches = html.matchAll(/font-family\s*:\s*["']?([^;"'}\n,]+)/gi);
    for (const m of ffMatches) {
      const name = m[1].trim().replace(/["']/g, '');
      if (!['inherit', 'initial', 'system-ui', '-apple-system', 'sans-serif', 'serif', 'monospace', 'cursive'].includes(name.toLowerCase())) {
        fonts.add(name);
      }
    }

    return [...fonts].slice(0, 6);
  }

  static _extractTech(html) {
    const tech = new Set();

    if (html.includes('__next'))                    tech.add('Next.js');
    if (html.includes('__nuxt'))                    tech.add('Nuxt.js');
    if (html.includes('react'))                     tech.add('React');
    if (html.includes('vue'))                       tech.add('Vue.js');
    if (html.includes('angular'))                   tech.add('Angular');
    if (html.includes('tailwind'))                  tech.add('Tailwind CSS');
    if (html.includes('bootstrap'))                 tech.add('Bootstrap');
    if (html.includes('gsap') || html.includes('ScrollTrigger')) tech.add('GSAP');
    if (html.includes('three.js') || html.includes('THREE'))     tech.add('Three.js');
    if (html.includes('framer-motion'))             tech.add('Framer Motion');
    if (html.includes('lottie'))                    tech.add('Lottie');
    if (html.includes('stripe'))                    tech.add('Stripe');
    if (html.includes('intercom'))                  tech.add('Intercom');
    if (html.includes('segment'))                   tech.add('Segment');
    if (html.includes('hotjar'))                    tech.add('Hotjar');
    if (html.includes('webflow'))                   tech.add('Webflow');
    if (html.includes('wordpress') || html.includes('wp-content')) tech.add('WordPress');

    return [...tech];
  }

  static _extractEffects(html) {
    const effects = [];

    if (html.includes('backdrop-filter') || html.includes('backdrop-blur')) effects.push('glassmorphism');
    if (html.includes('linear-gradient') || html.includes('radial-gradient')) effects.push('gradients');
    if (html.includes('@keyframes'))               effects.push('css-animations');
    if (html.includes('box-shadow'))               effects.push('shadows');
    if (html.includes('transform'))                effects.push('transforms');
    if (html.includes('parallax') || html.includes('data-parallax')) effects.push('parallax');
    if (html.includes('gsap') || html.includes('ScrollTrigger'))    effects.push('scroll-animations');
    if (html.includes('THREE') || html.includes('three.js'))        effects.push('3d-webgl');
    if (html.includes('particle'))                 effects.push('particles');
    if (html.includes('marquee') || html.includes('infinite-scroll')) effects.push('marquee');
    if (html.includes('blur('))                    effects.push('blur');
    if (html.includes('clip-path'))                effects.push('clip-path');
    if (html.includes('mix-blend'))                effects.push('blend-modes');
    if (html.includes('border-image') || html.includes('conic-gradient')) effects.push('advanced-borders');

    return effects;
  }

  static _extractSections(html) {
    const sections = [];
    const sectionMatches = html.matchAll(/<(?:section|div)[^>]+(?:id|class)=["']([^"']+)["']/gi);
    for (const m of sectionMatches) {
      const id = m[1].toLowerCase();
      if (id.includes('hero'))          sections.push('hero');
      if (id.includes('feature'))       sections.push('features');
      if (id.includes('pricing'))       sections.push('pricing');
      if (id.includes('testimonial'))   sections.push('testimonials');
      if (id.includes('faq'))           sections.push('faq');
      if (id.includes('contact'))       sections.push('contact');
      if (id.includes('footer'))        sections.push('footer');
      if (id.includes('cta'))           sections.push('cta');
      if (id.includes('about'))         sections.push('about');
      if (id.includes('team'))          sections.push('team');
      if (id.includes('stat'))          sections.push('stats');
      if (id.includes('blog'))          sections.push('blog');
      if (id.includes('partner') || id.includes('client') || id.includes('logo')) sections.push('logos');
    }
    return [...new Set(sections)];
  }

  static _extractCTAs(html) {
    const ctas = new Set();
    const ctaMatches = html.matchAll(/<(?:a|button)[^>]*class=["'][^"']*(?:cta|btn|button)[^"']*["'][^>]*>([^<]+)</gi);
    for (const m of ctaMatches) {
      const text = m[1].trim();
      if (text.length > 1 && text.length < 50) ctas.add(text);
    }
    return [...ctas].slice(0, 8);
  }

  static _detectHeroType(html) {
    const heroBlock = html.match(/<(?:section|div)[^>]*(?:hero|banner|masthead)[^>]*>([\s\S]*?)(?:<\/section>|<\/div>\s*<(?:section|div))/i);
    if (!heroBlock) return 'unknown';
    const h = heroBlock[1];
    if (h.includes('<video'))           return 'video-background';
    if (h.includes('<canvas'))          return '3d-canvas';
    if (h.includes('carousel'))         return 'carousel';
    if ((h.match(/<img/g) || []).length > 1) return 'image-gallery';
    if (h.includes('<img') && h.includes('<h1')) return 'text-image-split';
    if (h.includes('<h1'))              return 'text-centered';
    return 'minimal';
  }

  static _detectDarkMode(html, colors) {
    const bgColors = colors.backgrounds || [];
    if (bgColors.some(c => c.match(/^#[0-2]/))) return true;
    if (html.includes('dark-mode') || html.includes('dark-theme') || html.includes('data-theme="dark"')) return true;
    const bodyBg = html.match(/body\s*\{[^}]*background(?:-color)?\s*:\s*(#[0-9a-fA-F]+)/i);
    if (bodyBg) {
      const hex = bodyBg[1].replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      return r < 50;
    }
    return false;
  }

  static _calculateScore(result) {
    let design = 5, performance = 5, conversion = 5;

    // Design scoring
    if (result.fonts.length >= 2) design += 1;
    if (result.effects.length >= 3) design += 1;
    if (result.effects.includes('scroll-animations')) design += 1;
    if (result.effects.includes('glassmorphism')) design += 0.5;
    if (result.effects.includes('3d-webgl')) design += 1;
    if (result.colors.primary.length >= 2) design += 0.5;

    // Performance (heuristic)
    if (result.techStack.includes('Next.js') || result.techStack.includes('Nuxt.js')) performance += 1;
    if (!result.techStack.includes('WordPress')) performance += 0.5;

    // Conversion
    if (result.ctaTexts.length >= 2) conversion += 1;
    if (result.sections.includes('testimonials')) conversion += 1;
    if (result.sections.includes('pricing')) conversion += 1;
    if (result.sections.includes('faq')) conversion += 0.5;
    if (result.sections.includes('stats')) conversion += 0.5;

    return {
      design: Math.min(10, Math.round(design * 10) / 10),
      performance: Math.min(10, Math.round(performance * 10) / 10),
      conversion: Math.min(10, Math.round(conversion * 10) / 10),
    };
  }
}

// ─────────────────────────────────────────────────────────────
// EXTRACTOR RUNNER — calls nexus-extractor-agent.js per site
// ─────────────────────────────────────────────────────────────

function runExtractor(siteUrl) {
  return new Promise((resolve) => {
    const extractorPath = path.join(AGENTS_DIR, 'nexus-extractor-agent.js');
    if (!fs.existsSync(extractorPath)) {
      return resolve({ url: siteUrl, components: 0, error: 'Extractor not found' });
    }

    const url = siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`;
    const cmd = `node "${extractorPath}" --url "${url}"`;

    const child = exec(cmd, { cwd: WORKSPACE, timeout: 60000, encoding: 'utf-8' }, (err, stdout) => {
      if (err) {
        return resolve({ url: siteUrl, components: 0, error: err.message.slice(0, 100) });
      }

      // Parse component count from output
      const countMatch = stdout.match(/Components found:\s*(\d+)/);
      const newMatch = stdout.match(/New components:\s*(\d+)/);
      resolve({
        url: siteUrl,
        components: parseInt(countMatch?.[1] || '0'),
        newComponents: parseInt(newMatch?.[1] || '0'),
      });
    });

    // Pipe output for visibility
    child.stdout?.pipe(process.stdout);
    child.stderr?.pipe(process.stderr);
  });
}

// ─────────────────────────────────────────────────────────────
// REFERENCE HUNTER — main class
// ─────────────────────────────────────────────────────────────

class NexusReferenceHunter {

  constructor(projectName, opts = {}) {
    this.projectName = projectName;
    this.projectDir = path.join(WORKSPACE, 'projects', projectName);
    this.opts = opts;
    this.niche = opts.niche || null;
    this.maxSites = opts.max || CONFIG.maxSites;
  }

  async run() {
    const startTime = Date.now();
    console.log('\n══════════════════════════════════════════════════');
    console.log('  🔍 NEXUS Reference Hunter');
    console.log('══════════════════════════════════════════════════');
    console.log(`  Project: ${this.projectName}`);
    console.log(`  Niche: ${this.niche || '(auto-detect)'}`);
    console.log(`  Max sites: ${this.maxSites}\n`);

    // STEP 1: Determine niche and competitor URLs
    console.log('[1/5] Discovering competitor URLs...');
    const competitors = await this._discoverCompetitors();
    if (competitors.length === 0) {
      console.log('  ⚠️ No competitors found. Skipping.');
      return { success: false, error: 'No competitors discovered' };
    }
    console.log(`  Found ${competitors.length} competitors: ${competitors.join(', ')}\n`);

    // STEP 2: Analyze each competitor site
    console.log('[2/5] Analyzing competitor sites...');
    const analyses = await this._analyzeAll(competitors);
    const successful = analyses.filter(a => !a.error);
    console.log(`  Analyzed: ${successful.length}/${competitors.length} sites\n`);

    // STEP 3: Run extractor on each site (parallel, max 3)
    console.log('[3/5] Extracting components from competitors...');
    const extractions = await this._extractAll(competitors);
    const totalComponents = extractions.reduce((sum, e) => sum + (e.components || 0), 0);
    const totalNew = extractions.reduce((sum, e) => sum + (e.newComponents || 0), 0);
    console.log(`  Extracted: ${totalComponents} components (${totalNew} new)\n`);

    // STEP 4: Save competitor analysis
    console.log('[4/5] Saving competitor analysis...');
    const analysis = this._buildAnalysis(analyses, extractions);
    this._saveAnalysis(analysis);
    this._updateReferencesDB(analysis);

    // STEP 5: Sync to Google Sheets
    console.log('[5/5] Syncing to Google Sheets...');
    await this._syncToSheets(analyses, extractions);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n══════════════════════════════════════════════════`);
    console.log(`  ✅ Reference Hunter complete in ${elapsed}s`);
    console.log(`  📊 ${successful.length} sites analyzed`);
    console.log(`  🧩 ${totalComponents} components extracted (${totalNew} new)`);
    console.log(`  📁 ${path.join(this.projectDir, 'competitor-analysis.json')}`);
    console.log(`══════════════════════════════════════════════════\n`);

    return { success: true, analysis, extractions };
  }

  // ─── Premium References Loader ────────────────────────────

  _loadPremiumReferences() {
    const premiumPath = path.join(WORKSPACE, 'references-db', 'premium-dark-references.json');
    if (!fs.existsSync(premiumPath)) return [];

    try {
      const data = JSON.parse(fs.readFileSync(premiumPath, 'utf-8'));
      const categories = CATEGORY_MAP[this.niche] || CATEGORY_MAP.default;

      // Flatten all curated_sites groups into a single array
      const allSites = Object.values(data.curated_sites || {}).flat();

      // Filter sites matching the project's niche categories
      const matched = allSites.filter(site => categories.includes(site.category));

      // Shuffle and pick up to 3
      const shuffled = matched.sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, 3);

      if (selected.length > 0) {
        console.log(`  From Premium References: ${selected.length} curated dark-mode sites (categories: ${categories.join(', ')})`);
      }

      return selected.map(s => s.url);
    } catch (e) {
      console.log(`  ⚠️ Could not load premium references: ${e.message}`);
      return [];
    }
  }

  // ─── Step 1: Discover competitors ─────────────────────────

  async _discoverCompetitors() {
    let urls = [];

    // Source 1: Context DNA (competitors.directCompetitors)
    const dnaPath = path.join(this.projectDir, 'context-dna.json');
    if (fs.existsSync(dnaPath)) {
      try {
        const dna = JSON.parse(fs.readFileSync(dnaPath, 'utf-8'));

        // Auto-detect niche from context DNA
        if (!this.niche && dna.project?.businessType) {
          this.niche = dna.project.businessType.toLowerCase();
          console.log(`  Auto-detected niche: ${this.niche}`);
        }

        // Get competitor names from DNA
        const competitors = dna.competitors?.directCompetitors || [];
        for (const comp of competitors) {
          // Convert names like "FTMO" to "ftmo.com"
          const slug = comp.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
          if (slug.includes('.')) {
            urls.push(slug); // Already a URL
          } else {
            urls.push(`${slug}.com`);
            urls.push(`${slug}.com.br`);
          }
        }
        if (urls.length > 0) {
          console.log(`  From Context DNA: ${urls.length} competitor URLs`);
        }
      } catch (e) {
        console.log(`  ⚠️ Could not parse context-dna.json: ${e.message}`);
      }
    }

    // Source 2: Trend Scout references-db
    if (this.niche) {
      const nicheFile = path.join(WORKSPACE, 'references-db', 'niches', `${this.niche}.json`);
      if (fs.existsSync(nicheFile)) {
        try {
          const nicheData = JSON.parse(fs.readFileSync(nicheFile, 'utf-8'));
          const nicheUrls = (nicheData.sites || []).map(s => s.url).filter(Boolean);
          urls = [...new Set([...urls, ...nicheUrls])];
          console.log(`  From Trend Scout DB: ${nicheUrls.length} niche references`);
        } catch (e) {}
      }
    }

    // Source 3: Premium dark-mode references (highest quality, analyzed first)
    if (this.niche) {
      const premiumUrls = this._loadPremiumReferences();
      if (premiumUrls.length > 0) {
        // Prepend premium sites so they are analyzed first
        urls = [...new Set([...premiumUrls, ...urls])];
      }
    }

    // Source 4: Hardcoded niche competitors
    if (this.niche && NICHE_COMPETITORS[this.niche]) {
      const nicheUrls = NICHE_COMPETITORS[this.niche];
      urls = [...new Set([...urls, ...nicheUrls])];
      console.log(`  From built-in DB: ${nicheUrls.length} known competitors`);
    }

    // Source 5: Discovery data (company competitors)
    const discoveryPath = path.join(this.projectDir, 'company-profile.json');
    if (fs.existsSync(discoveryPath)) {
      try {
        const disc = JSON.parse(fs.readFileSync(discoveryPath, 'utf-8'));
        // Exclude the company's own site
        const ownUrl = disc.current_site?.url || disc.website?.url || '';
        urls = urls.filter(u => !ownUrl.includes(u) && !u.includes(new URL(ownUrl || 'http://x').hostname));
      } catch (e) {}
    }

    // Deduplicate and limit
    urls = [...new Set(urls)].slice(0, this.maxSites);

    // Validate URLs exist (quick HEAD requests)
    const valid = [];
    for (const url of urls) {
      try {
        await fetchUrl(url);
        valid.push(url);
      } catch {
        // Skip unreachable sites
      }
      if (valid.length >= this.maxSites) break;
    }

    return valid;
  }

  // ─── Step 2: Analyze all competitors ──────────────────────

  async _analyzeAll(urls) {
    const results = [];

    // Run in batches of CONFIG.maxConcurrent
    for (let i = 0; i < urls.length; i += CONFIG.maxConcurrent) {
      const batch = urls.slice(i, i + CONFIG.maxConcurrent);
      const batchResults = await Promise.allSettled(
        batch.map(url => SiteAnalyzer.analyze(url))
      );
      for (const r of batchResults) {
        if (r.status === 'fulfilled') {
          const a = r.value;
          console.log(`  ✅ ${a.companyName.padEnd(15)} colors:${a.colors.primary.length} fonts:${a.fonts.length} effects:${a.effects.length} sections:${a.sections.length} score:${a.score.design}`);
          results.push(a);
        } else {
          console.log(`  ❌ ${batch[results.length]}: ${r.reason?.message || 'Unknown error'}`);
          results.push({ url: batch[results.length], error: r.reason?.message });
        }
      }
    }

    return results;
  }

  // ─── Step 3: Extract components ───────────────────────────

  async _extractAll(urls) {
    const results = [];

    for (let i = 0; i < urls.length; i += CONFIG.maxConcurrent) {
      const batch = urls.slice(i, i + CONFIG.maxConcurrent);
      const batchResults = await Promise.allSettled(
        batch.map(url => runExtractor(url))
      );
      for (const r of batchResults) {
        results.push(r.status === 'fulfilled' ? r.value : { url: batch[0], components: 0, error: r.reason?.message });
      }
    }

    return results;
  }

  // ─── Step 4: Build and save analysis ──────────────────────

  _buildAnalysis(analyses, extractions) {
    const successful = analyses.filter(a => !a.error);

    // Aggregate common patterns
    const allColors = {};
    const allFonts = {};
    const allEffects = {};
    const allSections = {};
    const allTech = {};
    const allCTAs = {};

    for (const a of successful) {
      for (const c of (a.colors?.primary || [])) allColors[c] = (allColors[c] || 0) + 1;
      for (const c of (a.colors?.secondary || [])) allColors[c] = (allColors[c] || 0) + 1;
      for (const f of (a.fonts || [])) allFonts[f] = (allFonts[f] || 0) + 1;
      for (const e of (a.effects || [])) allEffects[e] = (allEffects[e] || 0) + 1;
      for (const s of (a.sections || [])) allSections[s] = (allSections[s] || 0) + 1;
      for (const t of (a.techStack || [])) allTech[t] = (allTech[t] || 0) + 1;
      for (const c of (a.ctaTexts || [])) allCTAs[c] = (allCTAs[c] || 0) + 1;
    }

    const sortByFreq = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ value: k, count: v }));

    const avgScore = successful.length > 0 ? {
      design: (successful.reduce((s, a) => s + (a.score?.design || 0), 0) / successful.length).toFixed(1),
      performance: (successful.reduce((s, a) => s + (a.score?.performance || 0), 0) / successful.length).toFixed(1),
      conversion: (successful.reduce((s, a) => s + (a.score?.conversion || 0), 0) / successful.length).toFixed(1),
    } : { design: 0, performance: 0, conversion: 0 };

    return {
      _generatedBy: 'nexus-reference-hunter',
      _generatedAt: new Date().toISOString(),
      niche: this.niche,
      competitorsAnalyzed: successful.length,
      totalComponentsExtracted: extractions.reduce((s, e) => s + (e.components || 0), 0),

      averageScore: avgScore,

      commonPatterns: {
        colors: sortByFreq(allColors).slice(0, 10),
        fonts: sortByFreq(allFonts).slice(0, 8),
        effects: sortByFreq(allEffects),
        sections: sortByFreq(allSections),
        techStack: sortByFreq(allTech),
        ctaTexts: sortByFreq(allCTAs).slice(0, 10),
      },

      darkModePrevalence: successful.filter(a => a.darkMode).length / Math.max(1, successful.length),

      sites: successful.map(a => ({
        url: a.url,
        companyName: a.companyName,
        title: a.title,
        colors: a.colors,
        fonts: a.fonts,
        effects: a.effects,
        sections: a.sections,
        ctaTexts: a.ctaTexts,
        heroType: a.heroType,
        darkMode: a.darkMode,
        techStack: a.techStack,
        score: a.score,
        componentsExtracted: extractions.find(e => e.url?.includes(a.hostname))?.components || 0,
      })),
    };
  }

  _saveAnalysis(analysis) {
    if (!fs.existsSync(this.projectDir)) fs.mkdirSync(this.projectDir, { recursive: true });

    // Save competitor analysis JSON
    const analysisPath = path.join(this.projectDir, 'competitor-analysis.json');
    fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2));
    console.log(`  📁 Saved: ${analysisPath}`);

    // Generate human-readable report
    const reportPath = path.join(this.projectDir, 'competitor-report.md');
    fs.writeFileSync(reportPath, this._generateReport(analysis));
    console.log(`  📄 Report: ${reportPath}`);
  }

  _generateReport(analysis) {
    const cp = analysis.commonPatterns;
    return `# Competitor Analysis — ${this.projectName}

## Overview
- **Niche:** ${analysis.niche || 'Auto-detected'}
- **Sites Analyzed:** ${analysis.competitorsAnalyzed}
- **Components Extracted:** ${analysis.totalComponentsExtracted}
- **Dark Mode Prevalence:** ${(analysis.darkModePrevalence * 100).toFixed(0)}%

## Average Scores
- **Design:** ${analysis.averageScore.design}/10
- **Performance:** ${analysis.averageScore.performance}/10
- **Conversion:** ${analysis.averageScore.conversion}/10

## Common Patterns

### Colors (most used)
${cp.colors.slice(0, 5).map(c => `- \`${c.value}\` (${c.count} sites)`).join('\n')}

### Fonts
${cp.fonts.map(f => `- **${f.value}** (${f.count} sites)`).join('\n')}

### Effects
${cp.effects.map(e => `- ${e.value} (${e.count} sites)`).join('\n')}

### Sections
${cp.sections.map(s => `- ${s.value} (${s.count} sites)`).join('\n')}

### Tech Stack
${cp.techStack.map(t => `- ${t.value} (${t.count} sites)`).join('\n')}

### CTA Texts
${cp.ctaTexts.slice(0, 5).map(c => `- "${c.value}" (${c.count} sites)`).join('\n')}

## Individual Sites

${analysis.sites.map(s => `### ${s.companyName} (${s.url})
- **Score:** Design ${s.score.design} | Performance ${s.score.performance} | Conversion ${s.score.conversion}
- **Hero:** ${s.heroType}
- **Dark Mode:** ${s.darkMode ? 'Yes' : 'No'}
- **Fonts:** ${s.fonts.join(', ') || 'N/A'}
- **Effects:** ${s.effects.join(', ') || 'N/A'}
- **Sections:** ${s.sections.join(', ') || 'N/A'}
- **CTAs:** ${s.ctaTexts.slice(0, 3).map(c => `"${c}"`).join(', ') || 'N/A'}
- **Components Extracted:** ${s.componentsExtracted}
`).join('\n')}

---
*Generated by NEXUS Reference Hunter on ${new Date().toLocaleString('pt-BR')}*
`;
  }

  // ─── Step 4b: Update references-db ────────────────────────

  _updateReferencesDB(analysis) {
    if (!this.niche) return;

    const nicheDir = path.join(WORKSPACE, 'references-db', 'niches');
    if (!fs.existsSync(nicheDir)) fs.mkdirSync(nicheDir, { recursive: true });

    const nicheFile = path.join(nicheDir, `${this.niche}.json`);
    let existingData = {};

    if (fs.existsSync(nicheFile)) {
      try { existingData = JSON.parse(fs.readFileSync(nicheFile, 'utf-8')); } catch {}
    }

    // Merge new sites with existing
    const existingSites = existingData.sites || [];
    const existingUrls = new Set(existingSites.map(s => s.url));

    for (const site of analysis.sites) {
      if (!existingUrls.has(site.url)) {
        existingSites.push({
          url: site.url.replace(/^https?:\/\/(www\.)?/, ''),
          nicho: this.niche,
          style: site.darkMode ? 'dark-modern' : 'light-clean',
          colors: {
            primary: (site.colors?.primary || [])[0] || '',
            secondary: (site.colors?.secondary || [])[0] || '',
            accent: (site.colors?.accent || [])[0] || '',
            background: (site.colors?.backgrounds || [])[0] || '',
          },
          fonts: site.fonts,
          sections: site.sections,
          components: site.effects,
          animations: site.effects.filter(e => ['scroll-animations', 'parallax', 'css-animations'].includes(e)),
          cta_patterns: site.ctaTexts,
          hero_type: site.heroType,
          score: site.score,
          tags: [...site.effects.slice(0, 3), site.darkMode ? 'dark' : 'light', this.niche],
          last_updated: new Date().toISOString().split('T')[0],
        });
        console.log(`  📝 Added ${site.companyName} to references-db/${this.niche}.json`);
      }
    }

    // Rebuild niche file
    const commonColors = { primary: [], secondary: [], accent: [], background: [], text: [] };
    const commonFonts = new Set();
    const commonAnimations = new Set();

    for (const site of existingSites) {
      if (site.colors?.primary) commonColors.primary.push(site.colors.primary);
      if (site.colors?.secondary) commonColors.secondary.push(site.colors.secondary);
      if (site.colors?.accent) commonColors.accent.push(site.colors.accent);
      for (const f of (site.fonts || [])) commonFonts.add(f);
      for (const a of (site.animations || [])) commonAnimations.add(a);
    }

    const updatedNiche = {
      nicho: this.niche,
      generated: new Date().toISOString(),
      count: existingSites.length,
      common_colors: commonColors,
      common_fonts: [...commonFonts],
      common_animations: [...commonAnimations],
      sites: existingSites,
    };

    fs.writeFileSync(nicheFile, JSON.stringify(updatedNiche, null, 2));
    console.log(`  📚 Updated: references-db/niches/${this.niche}.json (${existingSites.length} sites)`);

    // Update index
    this._updateIndex();
  }

  _updateIndex() {
    const nichesDir = path.join(WORKSPACE, 'references-db', 'niches');
    if (!fs.existsSync(nichesDir)) return;

    const files = fs.readdirSync(nichesDir).filter(f => f.endsWith('.json'));
    const index = {
      generated: new Date().toISOString(),
      niches: {},
      totalSites: 0,
    };

    for (const file of files) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(nichesDir, file), 'utf-8'));
        const niche = file.replace('.json', '');
        index.niches[niche] = { count: data.count || 0, sites: (data.sites || []).map(s => s.url) };
        index.totalSites += data.count || 0;
      } catch {}
    }

    fs.writeFileSync(path.join(WORKSPACE, 'references-db', 'index.json'), JSON.stringify(index, null, 2));
  }

  // ─── Step 5: Sync to Google Sheets ────────────────────────

  async _syncToSheets(analyses, extractions) {
    let SheetsSync;
    try {
      SheetsSync = require('./nexus-sheets-sync');
    } catch {
      console.log('  ⏭️ Google Sheets not configured (nexus-sheets-sync not available)');
      return;
    }

    try {
      const sync = new SheetsSync();

      const refs = analyses
        .filter(a => !a.error)
        .map(a => {
          const extraction = extractions.find(e => e.url?.includes(a.hostname)) || {};
          return {
            companyName: a.companyName,
            url: a.url,
            sector: this.niche || 'General',
            designScore: a.score?.design || 0,
            techStack: a.techStack || [],
            colors: a.colors?.primary || [],
            fonts: a.fonts || [],
            effects: a.effects || [],
            componentsExtracted: extraction.components || 0,
            extractedAt: new Date().toISOString().split('T')[0],
            notes: `Hero: ${a.heroType}. Sections: ${a.sections.join(', ')}. ${a.darkMode ? 'Dark mode.' : 'Light mode.'} Score: D${a.score?.design}/P${a.score?.performance}/C${a.score?.conversion}`,
          };
        });

      if (refs.length > 0) {
        await sync.addReferences(refs);
        console.log(`  📊 Synced ${refs.length} references to Google Sheets`);
      }
    } catch (e) {
      if (!e.message?.includes('credentials')) {
        console.log(`  ⚠️ Sheets sync failed: ${e.message}`);
      } else {
        console.log(`  ⏭️ Google Sheets credentials not configured`);
      }
    }
  }
}

module.exports = NexusReferenceHunter;

// ─────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────

if (require.main === module) {
  const args = process.argv.slice(2);
  const projectName = args[0];

  if (!projectName || projectName === '--help') {
    console.log(`
NEXUS Reference Hunter — Automatic Competitor Research + Extraction

Usage:
  node nexus-reference-hunter.js <project-name> [options]

Options:
  --niche <niche>    Business niche (fintech, trading, saas, healthcare, ecommerce,
                     fitness, education, restaurant, agency, luxury, tech, realestate)
  --max <number>     Max competitor sites to analyze (default: 6)

Examples:
  node nexus-reference-hunter.js my-project --niche fintech
  node nexus-reference-hunter.js my-project --niche trading --max 4
  node nexus-reference-hunter.js my-project  # auto-detect niche from context-dna.json
    `);
    process.exit(0);
  }

  const opts = {};
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--niche' && args[i + 1]) opts.niche = args[++i];
    if (args[i] === '--max' && args[i + 1]) opts.max = parseInt(args[++i]);
  }

  const hunter = new NexusReferenceHunter(projectName, opts);
  hunter.run()
    .then(result => {
      if (!result.success) {
        console.log(`\n⚠️ ${result.error || 'No results'}`);
        process.exit(1);
      }
    })
    .catch(err => {
      console.error(`\n❌ Fatal: ${err.message}`);
      process.exit(1);
    });
}
