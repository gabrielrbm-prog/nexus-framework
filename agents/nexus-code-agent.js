#!/usr/bin/env node
/**
 * NEXUS Code Agent v4 — Slot-Driven Component Assembly
 *
 * Evolution of v3: instead of hardcoded HTML, uses a SLOT SYSTEM that:
 * 1. Defines page slots (nav, hero, stats, features, testimonials, pricing, cta, footer)
 * 2. For each slot, selects best components from the 771-component library
 * 3. Extracts CSS classes from selected components
 * 4. Generates HTML that uses real CSS classes from the library
 *
 * Usage:  node nexus-code-agent-v4.js <path-to-context-dna.json>
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const NexusTypographyEngine = require('./nexus-typography-engine');
const NexusAnimationEngine  = require('./nexus-animation-engine');
const Nexus3DSceneEngine    = require('./nexus-3d-scene-engine');
const NexusSquadKnowledge   = require('./nexus-squad-knowledge');

// ─────────────────────────────────────────────────────────────
// SLOT DEFINITIONS — maps page sections to library categories
// ─────────────────────────────────────────────────────────────

const SLOT_CATEGORIES = {
  nav:          ['Navigation', 'nav'],
  hero:         ['Heroes', 'hero'],
  stats:        ['Cards', 'card', 'Cards/Stats'],
  features:     ['Layouts', 'Cards', 'Cards/Interactive', 'section', 'card'],
  testimonials: ['Cards', 'testimonial', 'Cards/Pricing'],
  pricing:      ['Cards', 'Cards/Pricing', 'card'],
  cta:          ['Buttons/CTA', 'button', 'Buttons'],
  footer:       ['Footers'],
  backgrounds:  ['Backgrounds', 'Backgrounds/Animated', 'Effects/Background'],
  animations:   ['Animations', 'Animation/Scroll', 'Animation/Text'],
  typography:   ['Typography', 'Typography/Animation', 'Text/Effect']
};

// Source affinity by business type (which site's CSS to prefer)
const BUSINESS_SOURCE_AFFINITY = {
  fintech:    ['stripe', 'linear', 'mercury', 'ramp', 'brex'],
  trading:    ['stripe', 'linear', 'tradingview', 'mercury'],
  saas:       ['linear', 'vercel', 'notion', 'supabase', 'resend'],
  ecommerce:  ['shopify', 'gumroad', 'lemonsqueezy', 'stripe'],
  healthcare: ['calm', 'headspace', 'zocdoc', 'stripe'],
  education:  ['notion', 'duolingo', 'coursera', 'linear'],
  agency:     ['webflow', 'framer', 'figma', 'linear'],
  default:    ['stripe', 'linear', 'vercel']
};

// Premium effect components (always available)
const PREMIUM_EFFECTS = [
  'threejs-wireframe',
  'gsap-scroll-reveal',
  'gsap-counter',
  'magicui-floating-particles',
  'magicui-wave-dividers',
  'magicui-gradient-text',
  'magicui-border-beam',
  'apple-glass-buttons',
  'aceternity-meteors',
  'aceternity-flip-words',
  'aceternity-3d-cards',
  'aceternity-glowing-stars',
  'aceternity-moving-borders'
];

// Default colors
const DEFAULT_COLORS = {
  '--bg':             '#0a0a0f',
  '--bg-card':        '#12121a',
  '--bg-card-hover':  '#1a1a2e',
  '--blue':           '#3b82f6',
  '--cyan':           '#22d3ee',
  '--purple':         '#8b5cf6',
  '--pink':           '#ec4899',
  '--text':           '#e2e8f0',
  '--text-dim':       '#94a3b8',
  '--text-bright':    '#f8fafc',
  '--border':         'rgba(255,255,255,0.06)',
  '--glow-blue':      '0 0 30px rgba(59,130,246,0.3)',
  '--glow-cyan':      '0 0 30px rgba(34,211,238,0.3)',
  '--glow-purple':    '0 0 30px rgba(139,92,246,0.3)'
};

// ─────────────────────────────────────────────────────────────
// CSS Class Extractor — parses CSS to find usable class names
// ─────────────────────────────────────────────────────────────

class CssClassExtractor {
  static extract(cssString) {
    if (!cssString) return { classes: [], keyframes: [], hovers: [], mediaQueries: [] };

    const classes = new Set();
    const keyframes = [];
    const hovers = [];
    const mediaQueries = [];

    // Extract class names
    const classRegex = /\.([a-zA-Z_][\w-]*)\s*[{,:]/g;
    let m;
    while ((m = classRegex.exec(cssString)) !== null) {
      const cls = m[1];
      // Skip common framework noise
      if (!cls.match(/^(js-|wp-|is-|has-|show-|hide-|d-|col-|row-|container$|clearfix)/)) {
        classes.add(cls);
      }
    }

    // Extract @keyframes
    const kfRegex = /@keyframes\s+([\w-]+)\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}/g;
    while ((m = kfRegex.exec(cssString)) !== null) {
      keyframes.push({ name: m[1], css: m[0] });
    }

    // Extract :hover rules
    const hoverRegex = /([^{}]+):hover\s*\{([^}]*)\}/g;
    while ((m = hoverRegex.exec(cssString)) !== null) {
      if (m[0].length < 500) hovers.push(m[0]);
    }

    // Extract @media queries
    const mediaRegex = /@media\s*\([^)]+\)\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}/g;
    while ((m = mediaRegex.exec(cssString)) !== null) {
      if (m[0].length < 1000) mediaQueries.push(m[0]);
    }

    return { classes: [...classes], keyframes, hovers, mediaQueries };
  }

  // Score CSS quality (richer CSS = higher score)
  static qualityScore(cssString) {
    if (!cssString) return 0;
    let score = 0;
    const len = cssString.length;

    if (len > 100)  score += 1;
    if (len > 500)  score += 1;
    if (len > 1000) score += 1;
    if (len > 3000) score += 1;

    if (cssString.includes('@keyframes'))      score += 2;
    if (cssString.includes(':hover'))          score += 1;
    if (cssString.includes('gradient'))        score += 1;
    if (cssString.includes('backdrop-filter')) score += 1;
    if (cssString.includes('transform'))       score += 0.5;
    if (cssString.includes('transition'))      score += 0.5;
    if (cssString.includes('animation'))       score += 1;
    if (cssString.includes('box-shadow'))      score += 0.5;
    if (cssString.includes('border-radius'))   score += 0.5;
    if (cssString.includes('opacity'))         score += 0.5;
    if (cssString.includes('grid'))            score += 0.5;
    if (cssString.includes('flex'))            score += 0.5;

    return score;
  }

  // Extract the most useful CSS rules from a component (clean, no body/html resets)
  static extractUsableCss(cssString, maxLen = 4000) {
    if (!cssString) return '';

    // Remove body/html/* resets
    let clean = cssString
      .replace(/\bbody\s*\{[^}]*\}/g, '')
      .replace(/\bhtml\s*\{[^}]*\}/g, '')
      .replace(/\*\s*\{[^}]*\}/g, '')
      .trim();

    if (clean.length > maxLen) {
      // Prioritize: keyframes > hover > transitions > rest
      const parts = [];
      const { keyframes, hovers } = CssClassExtractor.extract(cssString);

      for (const kf of keyframes) parts.push(kf.css);
      for (const hv of hovers) parts.push(hv);

      // Fill remaining space with other rules
      const remaining = maxLen - parts.join('\n').length;
      if (remaining > 200) {
        // Get non-keyframe, non-hover rules
        let other = clean;
        for (const kf of keyframes) other = other.replace(kf.css, '');
        for (const hv of hovers) other = other.replace(hv, '');
        parts.push(other.substring(0, remaining));
      }

      clean = parts.join('\n').substring(0, maxLen);
    }

    return clean;
  }
}

// ─────────────────────────────────────────────────────────────
// Slot Resolver — selects best components per slot
// ─────────────────────────────────────────────────────────────

class SlotResolver {
  constructor(library, businessType) {
    this.library = library;
    this.businessType = businessType || 'default';
    this.affinity = BUSINESS_SOURCE_AFFINITY[this.businessType] || BUSINESS_SOURCE_AFFINITY.default;
    this.selected = {};  // slot → [components]
  }

  resolve() {
    for (const [slot, categories] of Object.entries(SLOT_CATEGORIES)) {
      const candidates = this._findCandidates(slot, categories);
      const scored = this._scoreAndRank(candidates);
      // Pick top 2-3 components per slot (combine their CSS)
      const limit = (slot === 'nav' || slot === 'footer') ? 1 : (slot === 'hero' ? 3 : 2);
      this.selected[slot] = scored.slice(0, limit);
    }
    return this.selected;
  }

  _findCandidates(slot, categories) {
    return this.library.filter(comp => {
      const cat = (comp.category || '').toLowerCase();
      return categories.some(c => cat === c.toLowerCase() || cat.startsWith(c.toLowerCase()));
    });
  }

  _scoreAndRank(candidates) {
    return candidates
      .map(comp => {
        let score = CssClassExtractor.qualityScore(comp.css);

        // Boost for source affinity
        const source = (comp.id || '').toLowerCase();
        for (const aff of this.affinity) {
          if (source.includes(aff)) { score += 3; break; }
        }

        // Boost for having html_template
        if (comp.html_template && comp.html_template.length > 50) score += 1;

        // Boost for having variables (premium component)
        if (comp.variables && Object.keys(comp.variables).length > 0) score += 2;

        return { comp, score };
      })
      .filter(item => item.score >= 2)
      .sort((a, b) => b.score - a.score);
  }

  // Get combined CSS for a slot
  getCssForSlot(slot) {
    const items = this.selected[slot] || [];
    const parts = [];
    const usedKeyframes = new Set();

    for (const { comp } of items) {
      const clean = CssClassExtractor.extractUsableCss(comp.css, 3000);
      if (clean.length < 30) continue;

      // Deduplicate keyframes
      const { keyframes } = CssClassExtractor.extract(comp.css);
      let css = clean;
      for (const kf of keyframes) {
        if (usedKeyframes.has(kf.name)) {
          css = css.replace(kf.css, '');
        } else {
          usedKeyframes.add(kf.name);
        }
      }

      if (css.trim().length > 20) {
        parts.push(`/* slot:${slot} src:${comp.id} */\n${css.trim()}`);
      }
    }

    return parts.join('\n\n');
  }

  // Get class names available for a slot
  getClassesForSlot(slot) {
    const items = this.selected[slot] || [];
    const allClasses = new Set();
    for (const { comp } of items) {
      const { classes } = CssClassExtractor.extract(comp.css);
      classes.forEach(c => allClasses.add(c));
    }
    return [...allClasses];
  }

  // Get a summary of what was selected
  getSummary() {
    const lines = [];
    for (const [slot, items] of Object.entries(this.selected)) {
      const names = items.map(i => i.comp.id).join(', ');
      lines.push(`  ${slot}: ${names || '(none)'}`);
    }
    return lines.join('\n');
  }
}

// ─────────────────────────────────────────────────────────────
// NexusCodeAgentV4 Class
// ─────────────────────────────────────────────────────────────

class NexusCodeAgentV4 {

  constructor(contextDnaPath) {
    this.contextDnaPath  = path.resolve(contextDnaPath);
    this.projectDir      = path.dirname(this.contextDnaPath);
    this.agentsDir       = __dirname;
    this.libraryPath     = path.resolve(this.agentsDir, '../code-library/components.json');

    this.contextDna      = {};
    this.designSystem    = {};
    this.creativeBrief   = {};
    this.contentData     = {};
    this.library         = [];
    this.premiumMap      = {};
    this.slotResolver    = null;
    this.resolvedPremium = {};
    this.colors          = { ...DEFAULT_COLORS };
    this._darkMode       = true;
    this._fontFamily     = 'Inter';
    this._headingFont    = 'Inter';
    this._headingWeight  = '800';
    this._typographyEngine = null;  // Typography Engine output
    this._animationEngine  = null;  // Animation Engine output
    this._3dScene          = null;  // 3D Scene Engine output
    this._squadStrategy    = null;  // Squad Knowledge (Schwartz + Hormozi + Archetypes)
  }

  // ─── File I/O helpers ──────────────────────────────────────

  _readJSON(filePath) {
    try { return JSON.parse(fs.readFileSync(filePath, 'utf-8')); }
    catch { return null; }
  }

  _ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }

  _writeFile(filePath, content) {
    this._ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`  [write] ${filePath} (${(Buffer.byteLength(content) / 1024).toFixed(1)} KB)`);
  }

  _escHtml(str) {
    if (!str && str !== 0) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  _escAttr(str) { return this._escHtml(str); }

  // ─── Context-dna accessors ─────────────────────────────────

  get dna()   { return this.contextDna; }
  get brief() { return this.creativeBrief; }

  _txt(field, fallback = '') {
    if (this.dna[field]) return this.dna[field];
    if (this.brief[field]) return this.brief[field];
    if (this.contentData[field]) return this.contentData[field];
    for (const section of ['project', 'brand', 'content', 'visual', 'audience', 'technical']) {
      if (this.dna[section] && this.dna[section][field]) return this.dna[section][field];
    }
    for (const section of ['sectionContent', 'metaContent', 'headlines', 'ctas']) {
      if (this.contentData[section] && this.contentData[section][field]) return this.contentData[section][field];
    }
    return fallback;
  }

  _arr(field, fallback = []) {
    let v = this.dna[field] || this.brief[field] || this.contentData[field];
    if (Array.isArray(v)) return v;
    for (const section of ['project', 'brand', 'content', 'visual', 'audience', 'technical']) {
      if (this.dna[section] && Array.isArray(this.dna[section][field])) return this.dna[section][field];
    }
    for (const section of ['sectionContent', 'metaContent']) {
      if (this.contentData[section] && Array.isArray(this.contentData[section][field])) return this.contentData[section][field];
    }
    return fallback;
  }

  _hexToRgb(hex) {
    if (!hex || !hex.startsWith('#')) return '59,130,246';
    let h = hex.replace('#', '');
    // Support shorthand hex (#fff → #ffffff)
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    if (h.length !== 6) return '59,130,246';
    const r = parseInt(h.substr(0,2),16), g = parseInt(h.substr(2,2),16), b = parseInt(h.substr(4,2),16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return '59,130,246';
    return `${r},${g},${b}`;
  }

  _normalizeHex(hex) {
    if (!hex || !hex.startsWith('#')) return null;
    let h = hex.replace('#', '');
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    if (h.length !== 6) return null;
    return h;
  }

  _isDarkColor(hex) {
    const h = this._normalizeHex(hex);
    if (!h) return true;
    const r = parseInt(h.substr(0, 2), 16);
    const g = parseInt(h.substr(2, 2), 16);
    const b = parseInt(h.substr(4, 2), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return true;
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  }

  _lightenHex(hex, amount) {
    const h = this._normalizeHex(hex);
    if (!h) return hex || '#1a1a1a';
    const r = Math.min(255, parseInt(h.substr(0, 2), 16) + amount);
    const g = Math.min(255, parseInt(h.substr(2, 2), 16) + amount);
    const b = Math.min(255, parseInt(h.substr(4, 2), 16) + amount);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return hex;
    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
  }

  // ─── Step 1: Load library ──────────────────────────────────

  loadLibrary() {
    console.log('\n[1/7] Loading component library...');
    const raw = this._readJSON(this.libraryPath);
    if (!raw) throw new Error(`Cannot read library at ${this.libraryPath}`);

    this.library = Array.isArray(raw) ? raw : (raw.components || []);

    // Separate premium (have typed variables) from extracted
    for (const comp of this.library) {
      const isPremium = comp.variables && typeof comp.variables === 'object' &&
        Object.values(comp.variables).some(v => v && typeof v === 'object' && 'default' in v);
      if (isPremium) this.premiumMap[comp.id] = comp;
    }

    console.log(`  Library: ${this.library.length} components`);
    console.log(`  Premium: ${Object.keys(this.premiumMap).length}`);
    console.log(`  Extracted: ${this.library.length - Object.keys(this.premiumMap).length}`);
  }

  // ─── Step 2: Load inputs ───────────────────────────────────

  loadInputs() {
    console.log('\n[2/7] Loading inputs...');

    this.contextDna = this._readJSON(this.contextDnaPath);
    if (!this.contextDna) throw new Error(`Cannot read context-dna at ${this.contextDnaPath}`);
    console.log(`  context-dna: ${this.contextDna.businessName || 'unnamed'}`);

    const dsPath = fs.existsSync(path.join(this.projectDir, 'design-system', 'design-system.json'))
      ? path.join(this.projectDir, 'design-system', 'design-system.json')
      : path.join(this.projectDir, 'design-system.json');
    this.designSystem = this._readJSON(dsPath) || {};
    if (Object.keys(this.designSystem).length) console.log('  design-system loaded');

    this.creativeBrief = this._readJSON(path.join(this.projectDir, 'creative-brief.json')) || {};
    if (Object.keys(this.creativeBrief).length) console.log('  creative-brief loaded');

    const contentPaths = [
      path.join(this.projectDir, 'content', 'all-content.json'),
      path.join(this.projectDir, 'all-content.json'),
      path.join(this.projectDir, 'content-assets', 'all-content.json'),
      path.resolve(this.agentsDir, '../content/all-content.json')
    ];
    for (const cp of contentPaths) {
      const data = this._readJSON(cp);
      if (data && Object.keys(data).length > 0) {
        this.contentData = data;
        console.log(`  content loaded from ${path.basename(path.dirname(cp))}/${path.basename(cp)}`);
        break;
      }
    }
    if (!Object.keys(this.contentData).length) console.log('  content: using defaults');

    // Load image manifest if available
    this._images = { hero: [], lifestyle: [], product: [], trust: [] };
    const manifestPath = path.join(this.projectDir, 'assets', 'images', 'image-manifest.json');
    if (fs.existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        (manifest.images || []).forEach(img => {
          const cat = img.category || 'lifestyle';
          if (!this._images[cat]) this._images[cat] = [];
          // Use URL directly if available, otherwise local path
          const src = img.url || ('../assets/images/' + path.basename(img.path));
          this._images[cat].push(src);
        });
        console.log('  [images] Loaded manifest:', Object.entries(this._images).map(([k,v]) => `${k}:${v.length}`).join(', '));
      } catch(e) { console.warn('  [images] Manifest parse error:', e.message); }
    }

    // Load video manifest (generated by Video Agent)
    this._videos = [];
    this._heroVideo = null;
    const videoManifestPath = path.join(this.projectDir, 'assets', 'videos', 'video-manifest.json');
    if (fs.existsSync(videoManifestPath)) {
      try {
        const vManifest = JSON.parse(fs.readFileSync(videoManifestPath, 'utf-8'));
        this._videos = (vManifest.videos || []).map(v => ({
          ...v,
          // Use URL directly if available, otherwise local path
          src: v.url || ('../assets/videos/' + path.basename(v.path || ''))
        }));
        // Separate hero background video from showcase videos
        const heroBg = this._videos.find(v => v.type === 'hero_background');
        if (heroBg) {
          this._heroVideo = heroBg;
          this._videos = this._videos.filter(v => v.type !== 'hero_background');
        }
        console.log('  [videos] Loaded manifest:', this._videos.length + ' showcase videos' + (this._heroVideo ? ', 1 hero background' : ''));
      } catch(e) { console.warn('  [videos] Manifest parse error:', e.message); }
    }
  }

  // ─── Step 3: Resolve slots ─────────────────────────────────

  resolveSlots() {
    console.log('\n[3/7] Resolving component slots...');

    const btype = (this._txt('businessType', 'default')).toLowerCase();
    this.businessType = btype;
    console.log(`  Business type: ${btype}`);

    this.slotResolver = new SlotResolver(this.library, btype);
    this.slotResolver.resolve();

    console.log(`  Slot assignments:`);
    console.log(this.slotResolver.getSummary());
  }

  // ─── Step 4: Resolve colors & premium components ──────────

  resolveDesign() {
    console.log('\n[4/7] Resolving design system & premium components...');

    // Colors from design system OR context-dna suggestedPalette
    const ds = this.designSystem;
    const dsPalette = ds.colorPalette || ds.colors || {};
    const dnaPalette = this.contextDna.visual?.suggestedPalette || {};
    const hasDsColors = Object.keys(dsPalette).length > 0;

    // Merge: design-system takes priority, then context-dna suggestedPalette
    const palette = hasDsColors ? dsPalette : {};
    const getColor = (obj) => {
      if (!obj) return null;
      if (typeof obj === 'string') return obj;
      if (obj.base) return obj.base;
      if (obj['500']) return obj['500'];
      return null;
    };

    const primary   = getColor(palette.primary)   || dnaPalette.primary   || null;
    const secondary = getColor(palette.secondary)  || dnaPalette.secondary || null;
    const accent    = getColor(palette.accent)     || dnaPalette.accent    || null;
    const highlight = getColor(palette.highlight)  || dnaPalette.highlight || null;
    const bg        = palette.background           || dnaPalette.background || null;
    const surface   = palette.surface              || dnaPalette.surface    || null;
    const text      = palette.text                 || dnaPalette.text       || null;
    const textDim   = palette.textDim              || dnaPalette.textDim    || null;

    if (primary)    this.colors['--blue']     = primary;
    if (secondary)  this.colors['--cyan']     = secondary;
    if (accent)     this.colors['--purple']   = accent;
    if (highlight)  this.colors['--pink']     = highlight;
    if (bg)         this.colors['--bg']       = bg;
    if (surface)    this.colors['--bg-card']  = surface;
    if (text)       this.colors['--text']     = text;
    if (textDim)    this.colors['--text-dim'] = textDim;

    // Auto-derive surface/card color from background if not specified
    if (bg && !surface) {
      this.colors['--bg-card'] = this._lightenHex(bg, 8);
      this.colors['--bg-card-hover'] = this._lightenHex(bg, 14);
    }

    const isDark = palette.darkMode !== undefined ? palette.darkMode !== false
      : dnaPalette.background ? this._isDarkColor(dnaPalette.background)
      : true;

    if (!isDark) {
      if (!bg)      this.colors['--bg']            = '#ffffff';
      if (!surface) this.colors['--bg-card']       = '#f8fafc';
      if (!text)    this.colors['--text']          = '#1e293b';
      if (!textDim) this.colors['--text-dim']      = '#64748b';
      this.colors['--border']        = 'rgba(0,0,0,0.08)';
      this.colors['--text-bright']   = '#0f172a';
      this.colors['--bg-card-hover'] = '#f1f5f9';
    }

    const colorSource = hasDsColors ? 'design-system' : (Object.keys(dnaPalette).length ? 'context-dna' : 'defaults');
    console.log(`  Colors: ${colorSource} → primary=${this.colors['--blue']}, secondary=${this.colors['--cyan']}, accent=${this.colors['--purple']}`);

    const typo = ds.typography || {};
    this._fontFamily    = typo.fontFamily  || 'Inter';
    this._headingFont   = typo.headingFamily || typo.fontFamily || 'Inter';
    this._headingWeight = typo.headingWeight || '800';
    this._darkMode      = isDark;

    // Generate glow vars
    for (const [varName, cssVar] of [['--blue','--glow-blue'],['--cyan','--glow-cyan'],['--purple','--glow-purple']]) {
      const hex = this.colors[varName];
      if (hex && hex.startsWith('#')) {
        this.colors[cssVar] = `0 0 30px rgba(${this._hexToRgb(hex)},0.3)`;
      }
    }

    // Resolve premium effect components
    const ctx = this._buildVarContext();
    for (const id of PREMIUM_EFFECTS) {
      const comp = this.premiumMap[id];
      if (!comp) continue;
      const vars = { ...ctx };
      if (comp.variables) {
        for (const [key, def] of Object.entries(comp.variables)) {
          if (!(key in vars)) vars[key] = def && typeof def === 'object' ? String(def.default ?? '') : String(def ?? '');
        }
      }
      this.resolvedPremium[id] = {
        css:    this._resolveTpl(comp.css || '', vars),
        html:   this._resolveTpl(comp.html_template || '', vars),
        js:     this._resolveTpl(comp.js_init || '', vars),
        jsType: comp.js_type || 'inline',
        deps:   comp.dependencies || []
      };
    }

    // Generate Typography Engine output
    try {
      const archetype = (this.contextDna.brand?.brandArchetype || this.contextDna.brand?.archetype || 'creator').toLowerCase();
      const typoEngine = new NexusTypographyEngine();
      this._typographyEngine = typoEngine.generate({
        archetype,
        brandName: this.contextDna.brand?.name || this.contextDna.project?.name || '',
        businessType: this.contextDna.project?.businessType || '',
      });
      // Override fonts with engine's curated selections
      const displayFamily = (this._typographyEngine?.fontFamilies?.display || 'Inter').split(',')[0].replace(/"/g, '').trim() || 'Inter';
      const bodyFamily = (this._typographyEngine?.fontFamilies?.body || 'Inter').split(',')[0].replace(/"/g, '').trim() || 'Inter';
      this._fontFamily = bodyFamily;
      this._headingFont = displayFamily;
      console.log(`  Typography Engine: ${archetype} → ${displayFamily} / ${bodyFamily}`);
    } catch (e) {
      console.log(`  Typography Engine fallback: ${e.message}`);
    }

    // Generate Animation Engine output
    try {
      const animEngine = new NexusAnimationEngine();
      const sections = ['hero', 'stats', 'features', 'testimonials', 'pricing', 'cta'];
      this._animationEngine = animEngine.generate(sections);
      console.log(`  Animation Engine: ${sections.length} section choreographies loaded`);
    } catch (e) {
      console.log(`  Animation Engine fallback: ${e.message}`);
    }

    // Generate 3D Scene based on business type
    try {
      const sceneEngine = new Nexus3DSceneEngine();
      const businessType = (this.contextDna.project?.businessType || 'default').toLowerCase();
      this._3dScene = sceneEngine.generate({
        businessType,
        colors: {
          primary: this.colors['--blue'] || '#3b82f6',
          secondary: this.colors['--cyan'] || '#22d3ee',
          accent: this.colors['--purple'] || '#8b5cf6',
        },
        darkMode: this._darkMode,
        performanceLevel: 'high',
      });
      console.log(`  3D Scene Engine: ${businessType} scene loaded (${this._3dScene?.js?.length || 0} chars)`);
    } catch (e) {
      console.log(`  3D Scene Engine fallback: ${e.message}`);
    }

    // Squad Knowledge: enrich content strategy with Schwartz + Hormozi + Archetypes
    try {
      const squadKnowledge = new NexusSquadKnowledge();
      this._squadStrategy = squadKnowledge.enrichContentStrategy(this.contextDna);
      const arch = this._squadStrategy?.archetype?.key || 'unknown';
      const awareness = this._squadStrategy?.copy?.awarenessLevel || 'unknown';
      const guarantee = this._squadStrategy?.offer?.guarantee?.recommended || 'unknown';
      console.log(`  Squad Knowledge: archetype=${arch}, awareness=${awareness}, guarantee=${guarantee}`);

      // Validate palette against archetype
      const paletteCheck = squadKnowledge.validatePalette(arch, {
        primary: this.colors['--blue'],
        secondary: this.colors['--cyan'],
        accent: this.colors['--purple'],
      });
      if (!paletteCheck.aligned) {
        console.log(`  ⚠️ Palette alert: ${paletteCheck.suggestions.join('; ')}`);
      }
    } catch (e) {
      console.log(`  Squad Knowledge fallback: ${e.message}`);
    }

    console.log(`  Colors resolved (${this._darkMode ? 'dark' : 'light'} mode)`);
    console.log(`  Premium effects: ${Object.keys(this.resolvedPremium).length}`);
  }

  _buildVarContext() {
    const c = this.colors;
    const cd = this.contentData;
    const hlData = cd.headlines || {};
    const hlVars = Array.isArray(hlData.variants) ? hlData.variants : [];
    const toNumHex = (cssHex) => '0x' + (cssHex || '#3b82f6').replace('#', '');

    return {
      wireframeColor: toNumHex(c['--blue']), wireframeColor2: toNumHex(c['--cyan']),
      wireframeOpacity: '0.12', particleCount: '2500',
      gradientFrom: c['--blue'], gradientMid: c['--cyan'], gradientTo: c['--purple'],
      gradientExtra: c['--pink'], gradientDuration: '6s',
      flipWord1: hlVars[0] || 'Profissional', flipWord2: hlVars[1] || 'Premium',
      flipWord3: hlVars[2] || 'Poderoso', flipWord4: hlVars[3] || 'Comprovado',
      meteorCount: '10', meteorColor: 'rgba(255,255,255,0.6)', meteorDuration: '3s',
      starCount: '80', starColor1: c['--purple'], starColor2: c['--cyan'],
      borderColor1: c['--blue'], borderColor2: c['--cyan'], borderColor3: c['--purple'], borderDuration: '4s',
      beamColor1: c['--blue'], beamColor2: c['--cyan'], beamDuration: '4s',
      btnGradientFrom: c['--blue'] + 'cc', btnGradientTo: c['--cyan'] + '99',
      btnShadowColor: c['--blue'] + '4d',
      particleColor1: c['--blue'] + '66', particleColor2: c['--cyan'] + '4d',
      particleColor3: c['--purple'] + '4d', particleColor4: c['--pink'] + '33', particleCount2: '10',
      waveColor1: c['--blue'] + '1a', waveColor2: c['--purple'] + '14', waveColor3: c['--cyan'] + '1a',
      counterDuration: '2',
      '--blue': c['--blue'], '--cyan': c['--cyan'], '--purple': c['--purple'], '--pink': c['--pink'],
      '--bg': c['--bg'], '--bg-card': c['--bg-card'], '--text': c['--text'],
      '--text-dim': c['--text-dim'], '--text-bright': c['--text-bright'], '--border': c['--border'],
      businessName: this.contextDna.brand?.name || this._txt('businessName', this._txt('projectName', 'Business')),
      tagline: (cd.headlines && cd.headlines.primary) || this._txt('tagline', 'Transforme Seu Negocio'),
      subtitle: (cd.sectionContent && cd.sectionContent.hero && cd.sectionContent.hero.subheadline) || this._txt('subtitle', ''),
      ctaText: (cd.ctas && cd.ctas.primary) || this._txt('ctaPrimary', 'Comecar Agora'),
      ctaUrl: this._txt('ctaUrl', '#pricing'),
      year: String(new Date().getFullYear())
    };
  }

  _resolveTpl(tpl, vars) {
    if (!tpl) return '';
    return tpl.replace(/\{\{(\w+)\}\}/g, (_, key) => key in vars ? vars[key] : '');
  }

  // ─── Step 5: Build page with slot system ───────────────────

  buildPage() {
    console.log('\n[5/7] Building page with slot system...');

    // ── Extract content ──
    const cd  = this.contentData;
    const hl  = cd.headlines || {};
    const ct  = cd.ctas || {};
    const sc  = cd.sectionContent || {};
    const mc  = cd.metaContent || {};
    const hero = sc.hero || {};

    const businessName = this.contextDna.brand?.name || this._txt('businessName', this._txt('projectName', 'Business'));
    const tagline      = hl.primary || this._txt('tagline', 'Seu Negocio Premium');
    const subtitle     = hero.subheadline || this._txt('subtitle', '');
    const ctaText      = ct.primary || this._txt('ctaPrimary', 'Comecar Agora');
    const ctaUrl       = this._txt('ctaUrl', '#pricing');
    const ctaSecondary = ct.secondary || this._txt('ctaSecondary', 'Saiba Mais');
    const ctaSecondaryUrl = this._txt('ctaSecondaryUrl', '#method');
    const description  = mc.description || this._txt('description', subtitle);
    const pageTitle    = mc.title || '';
    const language     = this._txt('language', 'pt-BR');
    const socialProof  = hero.socialProof || hero.social_proof || this._txt('socialProof', '');
    const currency     = this._txt('currency', 'R$');
    const footerText   = this._txt('footerText', `\u00a9 ${new Date().getFullYear()} ${businessName}. Todos os direitos reservados.`);

    // Features
    const contentFeatures = Array.isArray(sc.features) ? sc.features
      : (sc.features && Array.isArray(sc.features.items) ? sc.features.items : []);
    const defaultFeatures = ['Qualidade Premium', 'Suporte Especializado', 'Resultados Comprovados'];
    const features = contentFeatures.length > 0 ? contentFeatures
      : this._arr('features', defaultFeatures.map(f => ({ title: f, description: '' })));

    // Stats
    const scStats = Array.isArray(sc.stats) ? sc.stats : (sc.stats && Array.isArray(sc.stats.items)) ? sc.stats.items : [];
    const defaultStats = [
      { value: '1.000+', label: 'Clientes Atendidos' },
      { value: '98%',    label: 'Satisfacao' },
      { value: '5/5',    label: 'Avaliacao Media' },
      { value: '24/7',   label: 'Suporte' }
    ];
    const stats = scStats.length > 0 ? scStats : this._arr('stats', defaultStats);

    // Testimonials
    const contentTestimonials = Array.isArray(sc.testimonials) ? sc.testimonials
      : (sc.testimonials && Array.isArray(sc.testimonials.items) ? sc.testimonials.items : []);
    const defaultTestimonials = [
      { name: 'Joao S.',   role: 'CEO',      text: 'Transformou completamente nosso negocio.' },
      { name: 'Maria L.',  role: 'Diretora', text: 'Profissional, eficiente e premium.' },
      { name: 'Carlos R.', role: 'Fundador', text: 'O melhor investimento que fizemos.' }
    ];
    const testimonials = contentTestimonials.length > 0 ? contentTestimonials : this._arr('testimonials', defaultTestimonials);

    // Pricing
    const scPricingPlans = (sc.pricing && Array.isArray(sc.pricing.plans)) ? sc.pricing.plans
      : (sc.pricing && Array.isArray(sc.pricing.items)) ? sc.pricing.items : [];
    const pricingPlans = scPricingPlans.length > 0 ? scPricingPlans : this._arr('pricingPlans', this._arr('pricing', []));

    // Flip words
    const hlVariants = Array.isArray(hl.variants) ? hl.variants : [];
    const flipWords = hlVariants.length > 0 ? hlVariants.slice(0, 4)
      : this._arr('flipWords', ['Profissional', 'Premium', 'Poderoso', 'Comprovado']);

    // Nav links — use microcopy navigation if available
    const microNav = cd.microcopy?.navigation || [];
    const defaultNavLabels = ['M\u00e9todo', 'Resultados', 'Pre\u00e7os', 'Depoimentos'];
    const navLabels = microNav.length >= 4 ? microNav.slice(1) : defaultNavLabels; // skip "Início"
    const navHrefs = ['#method', '#stats', '#pricing', '#testimonials'];
    const navLinks = this._arr('navLinks', navLabels.map((label, i) => ({ label, href: navHrefs[i] || '#' })));

    // ── Collect slot CSS ──
    const slotCss = {};
    for (const slot of Object.keys(SLOT_CATEGORIES)) {
      slotCss[slot] = this.slotResolver.getCssForSlot(slot);
    }

    // Log slot CSS stats
    for (const [slot, css] of Object.entries(slotCss)) {
      if (css.length > 0) {
        const classes = this.slotResolver.getClassesForSlot(slot);
        console.log(`  slot:${slot} — ${(css.length/1024).toFixed(1)}KB CSS, ${classes.length} classes`);
      }
    }

    // ── Collect premium CSS ──
    const premiumCssParts = [];
    for (const [id, resolved] of Object.entries(this.resolvedPremium)) {
      if (resolved.css) premiumCssParts.push(`/* premium: ${id} */\n${resolved.css}`);
    }

    // ── Build HTML sections ──
    const c = this.colors;
    const waveOp = this._darkMode ? 0.1 : 0.2;

    // Wave divider helper — unique IDs to prevent SVG gradient collisions
    let waveIdx = 0;
    const waveDivider = () => {
      waveIdx++;
      const uid = `wg${waveIdx}_${Date.now().toString(36)}`;
      const wc1 = `rgba(${this._hexToRgb(c['--blue'])},${waveOp})`;
      const wc2 = `rgba(${this._hexToRgb(c['--purple'])},${waveOp * 0.8})`;
      const wc3 = `rgba(${this._hexToRgb(c['--cyan'])},${waveOp})`;
      return `
    <div class="wave-divider">
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
        <defs><linearGradient id="${uid}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:${wc1}"/>
          <stop offset="50%" style="stop-color:${wc2}"/>
          <stop offset="100%" style="stop-color:${wc3}"/>
        </linearGradient></defs>
        <path fill="url(#${uid})">
          <animate attributeName="d"
            values="M0,40 C360,80 720,0 1080,40 C1260,60 1380,30 1440,40 L1440,80 L0,80 Z;M0,50 C360,10 720,70 1080,30 C1260,10 1380,50 1440,40 L1440,80 L0,80 Z;M0,40 C360,80 720,0 1080,40 C1260,60 1380,30 1440,40 L1440,80 L0,80 Z"
            dur="8s" repeatCount="indefinite"/>
        </path>
      </svg>
    </div>`;
    };

    // ── Section builders using slot classes ──
    const navClasses = this.slotResolver.getClassesForSlot('nav');
    const heroClasses = this.slotResolver.getClassesForSlot('hero');
    const statsClasses = this.slotResolver.getClassesForSlot('stats');
    const featureClasses = this.slotResolver.getClassesForSlot('features');
    const testimonialClasses = this.slotResolver.getClassesForSlot('testimonials');
    const pricingClasses = this.slotResolver.getClassesForSlot('pricing');
    const ctaClasses = this.slotResolver.getClassesForSlot('cta');
    const footerClasses = this.slotResolver.getClassesForSlot('footer');

    // Helper: pick a class from slot if available, else use fallback
    const pick = (slotClasses, keywords, fallback) => {
      for (const kw of keywords) {
        const found = slotClasses.find(c => c.toLowerCase().includes(kw.toLowerCase()));
        if (found) return found;
      }
      return fallback;
    };

    // NAV — use slot nav classes if available
    const navContainerClass = pick(navClasses, ['nav', 'header', 'navigation'], 'nav-glass');
    const navLogoClass = pick(navClasses, ['logo', 'brand', 'home-link'], 'nav-logo');
    const navLinkClass = pick(navClasses, ['nav-link', 'menu-link', 'link'], 'nav-link');
    const navBtnClass = pick(ctaClasses, ['btn', 'button', 'cta'], 'glass-btn glass-btn-primary');

    const navHtml = `
    <!-- NAV (slot: ${navClasses.length} classes available) -->
    <nav class="${navContainerClass} nav-glass" id="navbar">
      <div class="container nav-inner">
        <a href="#" class="${navLogoClass} nav-logo"><span class="gradient-text">${this._escHtml(businessName)}</span></a>
        <div class="nav-links" id="navLinks">
          ${navLinks.map(l => `<a href="${l.href || '#'}" class="${navLinkClass} nav-link">${this._escHtml(l.label || '')}</a>`).join('\n          ')}
        </div>
        <a href="${ctaUrl}" class="${navBtnClass} glass-btn glass-btn-primary nav-cta">${this._escHtml(ctaText)}</a>
        <button class="nav-hamburger" id="navHamburger" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>`;

    // HERO — use slot hero classes
    const heroContainerClass = pick(heroClasses, ['hero-section', 'hero_container', 'Hero'], 'hero-section');
    const heroTitleClass = pick(heroClasses, ['hero-title', 'Hero_title', 'heading'], 'hero-title');
    const heroBtnClass = pick(heroClasses, ['hero-btn', 'button', 'cta-btn'], 'glass-btn glass-btn-primary');

    // Flip words
    const flipHtml = flipWords.length > 0 ? `
        <span class="flip-words-container">
          ${flipWords.map((w, i) => `<span class="flip-word${i === 0 ? ' active' : ''}">${this._escHtml(w)}</span>`).join('\n          ')}
        </span>` : '';

    // Hero background — video takes priority, then image
    const heroHasVideo = this._heroVideo != null;
    const heroHasImage = !heroHasVideo && this._images && this._images.hero && this._images.hero.length > 0;
    let heroMediaTag = '';
    if (heroHasVideo) {
      const vSrc = this._heroVideo.src;
      const vThumb = this._heroVideo.thumbnail || '';
      heroMediaTag = `<video class="hero-video-bg" autoplay muted loop playsinline${vThumb ? ` poster="${vThumb}"` : ''}>
        <source src="${vSrc}" type="video/mp4">
      </video>
      <div class="hero-overlay"></div>`;
    } else if (heroHasImage) {
      heroMediaTag = `<img src="${this._images.hero[0]}" alt="" class="hero-bg-image" loading="eager">
      <div class="hero-overlay"></div>`;
    }

    const heroHtml = `
    <!-- HERO (slot: ${heroClasses.length} classes) -->
    <section id="hero" class="section ${heroContainerClass} hero-section">
      ${heroMediaTag}
      <div class="meteors-container"><div class="meteor"></div><div class="meteor"></div><div class="meteor"></div><div class="meteor"></div><div class="meteor"></div><div class="meteor"></div><div class="meteor"></div><div class="meteor"></div></div>
      <div class="container hero-content">
        ${socialProof ? `<div class="hero-badge gsap-reveal"><span class="hero-badge-dot"></span>${this._escHtml(socialProof)}</div>` : ''}
        <h1 class="${heroTitleClass} hero-title gsap-reveal">
          ${this._escHtml(tagline)}${flipHtml ? `<br>${flipHtml}` : ''}
        </h1>
        <p class="hero-subtitle gsap-reveal">${this._escHtml(subtitle)}</p>
        <div class="hero-buttons gsap-reveal">
          <a href="${ctaUrl}" class="magnetic-area">
            <span class="${heroBtnClass} glass-btn glass-btn-primary">
              ${this._escHtml(ctaText)}
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
            </span>
          </a>
          <a href="${ctaSecondaryUrl}" class="magnetic-area">
            <span class="glass-btn glass-btn-secondary">${this._escHtml(ctaSecondary)}</span>
          </a>
        </div>
      </div>
    </section>`;

    // STATS — use slot stats classes
    const statCardClass = pick(statsClasses, ['card', 'stat', 'metric', 'testimonial-card'], 'stat-card');
    const statNumberClass = pick(statsClasses, ['number', 'value', 'count', 'stat-number'], 'stat-number');
    const statLabelClass = pick(statsClasses, ['label', 'description', 'stat-label'], 'stat-label');

    const statsArr = stats.length >= 4 ? stats : [...stats, ...Array(Math.max(0, 4 - stats.length)).fill({ value: '-', label: '-' })];
    const statsHtml = `
    <!-- STATS (slot: ${statsClasses.length} classes) -->
    <section id="stats" class="section">
      <div class="container">
        <div class="section-header gsap-reveal">
          <span class="section-label">Resultados</span>
          <h2 class="section-title"><span class="gradient-text">${this._escHtml(this._txt('statsTitle', 'Resultados Comprovados'))}</span></h2>
          <p class="section-desc">${this._escHtml(this._txt('statsDescription', 'Numeros que demonstram nosso compromisso com a excelencia'))}</p>
        </div>
        <div class="stats-grid">
          ${statsArr.slice(0, 4).map(s => {
            const rawVal  = String(s.value || s.number || '0');
            const numOnly = rawVal.replace(/[^0-9.]/g, '');
            const prefix  = rawVal.replace(/[0-9.,]+.*/, '');
            const suffix  = rawVal.replace(/.*?[0-9.,]+/, '');
            return `
          <div class="${statCardClass} stat-card gsap-reveal">
            <div class="stat-shimmer"></div>
            <div class="${statNumberClass} stat-number" data-count="${this._escAttr(numOnly)}" data-prefix="${this._escAttr(prefix)}" data-suffix="${this._escAttr(suffix)}">${this._escHtml(rawVal)}</div>
            <div class="${statLabelClass} stat-label">${this._escHtml(s.label || s.description || '')}</div>
          </div>`;
          }).join('')}
        </div>
      </div>
    </section>`;

    // FEATURES/METHOD
    const featureCardClass = pick(featureClasses, ['card', 'feature', 'item', 'bento'], 'card-3d');
    const featureIconClass = pick(featureClasses, ['icon', 'feature-icon', 'card-icon'], 'card-3d-icon');
    // Premium SVG icons mapped to common feature topics
    const SVG_ICONS = {
      default: [
        `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
        `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
        `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>`,
        `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
        `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
        `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>`,
        `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
        `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
      ],
      fitness: [
        `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>`,
        `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
        `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
        `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
        `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
        `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>`,
        `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
        `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
      ],
      healthcare: [
        `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
        `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
        `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
        `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
        `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
        `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
        `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
        `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
      ]
    };
    const nicheType = (this.contextDna?.project?.businessType || 'default').toLowerCase();
    const featureIcons = SVG_ICONS[nicheType] || SVG_ICONS.default;
    const featureColors = [
      { bg: `rgba(${this._hexToRgb(c['--blue'])},0.15)`,   border: `rgba(${this._hexToRgb(c['--blue'])},0.2)`,   tagBg: `rgba(${this._hexToRgb(c['--blue'])},0.15)`,   tagColor: 'var(--blue)' },
      { bg: `rgba(${this._hexToRgb(c['--cyan'])},0.15)`,   border: `rgba(${this._hexToRgb(c['--cyan'])},0.2)`,   tagBg: `rgba(${this._hexToRgb(c['--cyan'])},0.15)`,   tagColor: 'var(--cyan)' },
      { bg: `rgba(${this._hexToRgb(c['--purple'])},0.15)`, border: `rgba(${this._hexToRgb(c['--purple'])},0.2)`, tagBg: `rgba(${this._hexToRgb(c['--purple'])},0.15)`, tagColor: 'var(--purple)' },
      { bg: `rgba(${this._hexToRgb(c['--pink'])},0.15)`,   border: `rgba(${this._hexToRgb(c['--pink'])},0.2)`,   tagBg: `rgba(${this._hexToRgb(c['--pink'])},0.15)`,   tagColor: 'var(--pink)' },
    ];

    const featureItems = features.length > 0 ? features : [{ title: 'Premium', description: '' }];
    // Contextual tags based on niche instead of generic "Step N"
    const CONTEXTUAL_TAGS = {
      fitness:    ['Treino', 'Força', 'Resultado', 'Método', 'Evolução', 'Performance'],
      healthcare: ['Cuidado', 'Saúde', 'Bem-estar', 'Diagnóstico', 'Tratamento', 'Prevenção'],
      fintech:    ['Estratégia', 'Segurança', 'Retorno', 'Análise', 'Automação', 'Controle'],
      ecommerce:  ['Catálogo', 'Entrega', 'Qualidade', 'Variedade', 'Suporte', 'Garantia'],
      saas:       ['Integração', 'Automação', 'Escala', 'Analytics', 'Deploy', 'API'],
      restaurant: ['Sabor', 'Frescor', 'Receita', 'Ambiente', 'Tradição', 'Chef'],
      education:  ['Método', 'Prática', 'Resultado', 'Mentoria', 'Certificação', 'Comunidade'],
      default:    ['Destaque', 'Exclusivo', 'Premium', 'Inovação', 'Qualidade', 'Diferencial']
    };
    const contextTags = CONTEXTUAL_TAGS[nicheType] || CONTEXTUAL_TAGS.default;
    // Bento-style layout: alternate between normal and span-2 cards
    const methodHtml = featureItems.length > 0 ? `
    <!-- FEATURES (slot: ${featureClasses.length} classes) -->
    <section id="method" class="section">
      <div class="container">
        <div class="section-header gsap-reveal">
          <span class="section-label">M\u00e9todo</span>
          <h2 class="section-title"><span class="gradient-text">${this._escHtml(this._txt('featuresTitle', 'Como Funciona'))}</span></h2>
          <p class="section-desc">${this._escHtml(this._txt('featuresSubtitle', 'Nossa abordagem comprovada'))}</p>
        </div>
        <div class="bento-grid">
          ${featureItems.slice(0, 6).map((f, i) => {
            const fc = featureColors[i % featureColors.length];
            const title = typeof f === 'string' ? f : (f.title || f.name || f);
            const desc  = typeof f === 'string' ? '' : (f.description || f.text || '');
            const tag   = typeof f === 'string' ? contextTags[i % contextTags.length] : (f.tag || f.label || contextTags[i % contextTags.length]);
            const isWide = (i === 0 || i === 3) && featureItems.length >= 4;
            return `
          <div class="card-3d-wrapper${isWide ? ' bento-wide' : ''}">
            <div class="${featureCardClass} card-3d${isWide ? ' card-featured' : ''}">
              <div class="card-3d-glow"></div>
              <div class="${featureIconClass} card-3d-icon" style="background:${fc.bg};border:1px solid ${fc.border};color:${fc.tagColor};">${featureIcons[i % featureIcons.length]}</div>
              <h3>${this._escHtml(String(title))}</h3>
              <p>${this._escHtml(String(desc))}</p>
              <span class="card-3d-tag" style="background:${fc.tagBg};color:${fc.tagColor};">${this._escHtml(String(tag))}</span>
            </div>
          </div>`;
          }).join('')}
        </div>
      </div>
    </section>` : '';

    // GALLERY (only if 3+ images total)
    const allImages = [
      ...(this._images?.hero || []),
      ...(this._images?.lifestyle || []),
      ...(this._images?.product || []),
      ...(this._images?.trust || [])
    ];
    const galleryHtml = allImages.length >= 3 ? `
    <!-- GALLERY -->
    <section id="gallery" class="section">
      <div class="container">
        <div class="section-header gsap-reveal">
          <span class="section-label">Galeria</span>
          <h2 class="section-title"><span class="gradient-text">Nosso Espa\u00e7o</span></h2>
        </div>
        <div class="gallery-grid">
          ${allImages.slice(0, 6).map((src, i) => `
          <div class="gallery-item gsap-reveal">
            <img src="${src}" alt="Galeria ${i + 1}" loading="lazy">
          </div>`).join('')}
        </div>
      </div>
    </section>` : '';

    // VIDEO SHOWCASE — cinematic frame
    const videoUrl = this._videos.length > 0 ? this._videos[0].src : '';
    const videoThumb = this._videos.length > 0 && this._videos[0].thumbnail ? this._videos[0].thumbnail : '';
    const videoShowcaseHtml = `
    <!-- VIDEO SHOWCASE -->
    <section id="video" class="section">
      <div class="container">
        <div class="section-header gsap-reveal">
          <span class="section-label">Assista</span>
          <h2 class="section-title"><span class="gradient-text">${this._escHtml(this._txt('videoTitle', 'Veja Na Prática'))}</span></h2>
          <p class="section-desc">${this._escHtml(this._txt('videoSubtitle', 'Conheça nossa experiência'))}</p>
        </div>
        <div class="video-frame gsap-reveal">
          <div class="video-frame-inner"${videoUrl ? ` data-video="${videoUrl}"` : ''}>
            ${videoThumb ? `<img src="${videoThumb}" alt="Video thumbnail" class="video-thumb">` : ''}
            <div class="video-play-btn">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </div>
            <div class="video-frame-glow"></div>
          </div>
          <div class="video-frame-reflection"></div>
        </div>
      </div>
    </section>`;

    // TESTIMONIALS
    const testimonialCardClass = pick(testimonialClasses, ['testimonial', 'quote', 'card', 'review'], 'testimonial-card');
    // SVG star for premium testimonials
    const SVG_STAR = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
    const STARS_ROW = Array(5).fill(SVG_STAR).join('');
    // Gradient colors for avatars — each testimonial gets unique colors
    const AVATAR_GRADIENTS = [
      ['var(--blue)', 'var(--cyan)'],
      ['var(--purple)', 'var(--pink)'],
      ['var(--cyan)', 'var(--blue)'],
    ];
    const testimonialsHtml = testimonials.length > 0 ? `
    <!-- TESTIMONIALS (slot: ${testimonialClasses.length} classes) -->
    <section id="testimonials" class="section">
      <div class="container">
        <div class="section-header gsap-reveal">
          <span class="section-label">Depoimentos</span>
          <h2 class="section-title"><span class="gradient-text">${this._escHtml(this._txt('testimonialsTitle', 'O Que Dizem'))}</span></h2>
        </div>
        <div class="testimonials-grid">
          ${testimonials.slice(0, 3).map((t, i) => {
            const text = typeof t === 'string' ? t : (t.text || t.quote || t.content || '');
            const name = typeof t === 'string' ? '' : (t.name || t.author || '');
            const role = typeof t === 'string' ? '' : (t.role || t.title || t.position || '');
            const initials = name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'A';
            const [gradA, gradB] = AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length];
            const isFeatured = i === 0;
            // Use lifestyle/trust images as avatars if available
            const avatarImages = [...(this._images?.lifestyle || []), ...(this._images?.trust || [])];
            const avatarHtml = avatarImages.length > i
              ? `<img src="${avatarImages[i]}" alt="${this._escAttr(name)}" class="testimonial-avatar-img">`
              : `<div class="testimonial-avatar" style="background:linear-gradient(135deg,${gradA},${gradB});">${this._escHtml(initials)}</div>`;
            return `
          <div class="${testimonialCardClass} testimonial-card gsap-reveal${isFeatured ? ' testimonial-featured' : ''}">
            <div class="testimonial-stars">${STARS_ROW}</div>
            <p class="testimonial-text">"${this._escHtml(text)}"</p>
            <div class="testimonial-author">
              ${avatarHtml}
              <div>
                <div class="testimonial-name">${this._escHtml(name)}</div>
                <div class="testimonial-role">${this._escHtml(role)}</div>
              </div>
            </div>
          </div>`;
          }).join('')}
        </div>
      </div>
    </section>` : '';

    // PRICING
    const pricingCardClass = pick(pricingClasses, ['pricing', 'plan', 'card', 'tier'], 'pricing-card');
    // Hormozi: value anchoring subtitle
    const pricingSubtitle = this._squadStrategy
      ? this._txt('pricingSubtitle', 'Invista no resultado, não no custo')
      : '';
    const pricingHtml = pricingPlans.length > 0 ? `
    <!-- PRICING (slot: ${pricingClasses.length} classes) -->
    <section id="pricing" class="section">
      <div class="container">
        <div class="section-header gsap-reveal">
          <span class="section-label">Pre\u00e7os</span>
          <h2 class="section-title"><span class="gradient-text">${this._escHtml(this._txt('pricingTitle', 'Escolha Seu Plano'))}</span></h2>
          ${pricingSubtitle ? `<p class="section-desc">${this._escHtml(pricingSubtitle)}</p>` : ''}
        </div>
        <div class="pricing-grid">
          ${pricingPlans.slice(0, 3).map((p, i) => {
            const name = p.name || p.title || `Plano ${i+1}`;
            let price = p.price || p.value || '0';
            // Strip currency symbol if already included to avoid duplication
            const priceStr = String(price);
            const hasCurrency = priceStr.includes(currency) || priceStr.match(/^[R$€£¥]/);
            if (hasCurrency) price = priceStr.replace(currency, '').trim();
            const period = p.period || this._txt('pricingPeriod', '/mes');
            const feats = Array.isArray(p.features) ? p.features : [];
            const popular = p.popular || p.highlighted || i === 1;
            return `
          <div class="${pricingCardClass} pricing-card gsap-reveal${popular ? ' pricing-popular' : ''}">
            ${popular ? '<div class="pricing-badge">Mais Popular</div>' : ''}
            <h3 class="pricing-name">${this._escHtml(name)}</h3>
            <div class="pricing-price"><span class="pricing-currency">${this._escHtml(currency)}</span><span class="pricing-value">${this._escHtml(String(price))}</span><span class="pricing-period">${this._escHtml(period)}</span></div>
            <ul class="pricing-features">
              ${feats.map(f => `<li>${this._escHtml(typeof f === 'string' ? f : (f.text || f.name || ''))}</li>`).join('\n              ')}
            </ul>
            <a href="${ctaUrl}" class="glass-btn ${popular ? 'glass-btn-primary' : 'glass-btn-secondary'} pricing-btn">${this._escHtml(popular ? ctaText : ctaSecondary)}</a>
          </div>`;
          }).join('')}
        </div>
      </div>
    </section>` : '';

    // GUARANTEE SECTION (Hormozi Value Equation)
    let guaranteeHtml = '';
    if (this._squadStrategy?.offer?.guarantee) {
      const gConfig = this._squadStrategy.offer.guarantee;
      const gType = gConfig?.type;
      if (gType) {
        const copyTemplate = gType.copy_template || 'Garantia de {dias} dias. Se {requisito} e não alcançar {resultado} em {prazo}, devolvemos seu investimento.';
        const guaranteeText = this._txt('guaranteeText', copyTemplate
          .replace('{dias}', '30')
          .replace('{requisito}', 'o programa completo')
          .replace('{resultado}', 'o resultado prometido')
          .replace('{prazo}', '90 dias'));
        guaranteeHtml = `
    <!-- GUARANTEE (Hormozi) -->
    <section id="guarantee" class="section">
      <div class="container" style="text-align:center;max-width:700px;">
        <div class="gsap-reveal">
          <div class="guarantee-badge"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px;margin-right:6px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>Garantia ${this._escHtml(gType.label)}</div>
          <h2 class="section-title"><span class="gradient-text">${this._escHtml(this._txt('guaranteeTitle', 'Zero Risco Para Você'))}</span></h2>
          <p class="section-desc" style="font-size:1.1rem;line-height:1.7;margin-top:1rem;">${this._escHtml(guaranteeText)}</p>
        </div>
      </div>
    </section>`;
      }
    }

    // CTA SECTION
    const ctaHtml = `
    <!-- CTA -->
    <section id="cta-final" class="section cta-section">
      <div class="container" style="text-align:center;">
        <h2 class="section-title gsap-reveal"><span class="gradient-text">${this._escHtml(this._txt('ctaTitle', 'Pronto Para Comecar?'))}</span></h2>
        <p class="section-desc gsap-reveal">${this._escHtml(this._txt('ctaDescription', 'De o proximo passo agora'))}</p>
        <div class="gsap-reveal" style="margin-top:2rem;">
          <a href="${ctaUrl}" class="magnetic-area">
            <span class="glass-btn glass-btn-primary" style="font-size:1.1rem;padding:1rem 2.5rem;">
              ${this._escHtml(ctaText)}
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
            </span>
          </a>
        </div>
      </div>
    </section>`;

    // FOOTER
    const footerContainerClass = pick(footerClasses, ['footer', 'site-footer'], 'site-footer');
    const footerHtml = `
    <!-- FOOTER (slot: ${footerClasses.length} classes) -->
    <footer class="${footerContainerClass} site-footer" id="footer">
      <div class="container footer-content">
        <div class="footer-brand">
          <span class="gradient-text" style="font-size:1.3rem;font-weight:700;">${this._escHtml(businessName)}</span>
        </div>
        <div class="footer-links">
          ${navLinks.map(l => `<a href="${l.href || '#'}">${this._escHtml(l.label || '')}</a>`).join('\n          ')}
        </div>
        <p class="footer-copy">${footerText}</p>
      </div>
    </footer>`;

    // ── Three.js color values ──
    const threeColor1 = '0x' + (this.colors['--blue'] || '#3b82f6').replace('#', '');
    const threeColor2 = '0x' + (this.colors['--cyan'] || '#22d3ee').replace('#', '');

    // ── Collect JS from premium components ──
    const inlineJsParts = [];
    const moduleJsParts = [];
    for (const [id, resolved] of Object.entries(this.resolvedPremium)) {
      if (id === 'threejs-wireframe') continue; // handled separately
      if (!resolved.js) continue;
      if (resolved.jsType === 'module') moduleJsParts.push(resolved.js);
      else inlineJsParts.push(resolved.js);
    }
    const inlineJsFromLib = inlineJsParts.join('\n\n');
    const moduleJsFromLib = moduleJsParts.join('\n\n');

    // ── Assemble all slot CSS ──
    const allSlotCss = Object.values(slotCss).filter(s => s.length > 0).join('\n\n');

    // ── Assemble full HTML ──
    return `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this._escHtml(pageTitle || `${businessName} - ${tagline}`)}</title>
  <meta name="description" content="${this._escAttr(description)}">
  <meta property="og:title" content="${this._escAttr(pageTitle || businessName)}">
  <meta property="og:description" content="${this._escAttr(description)}">
  <meta property="og:type" content="website">
  ${this._typographyEngine ? this._typographyEngine.imports : `<link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(this._fontFamily)}:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  ${this._headingFont !== this._fontFamily ? `<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(this._headingFont)}:wght@700;800;900&display=swap" rel="stylesheet">` : ''}`}

  <style>
    /* ═══════════════════════════════════════════════════════
       CSS VARIABLES (from design system)
    ═══════════════════════════════════════════════════════ */
    :root {
      ${Object.entries(this.colors).map(([k, v]) => `${k}: ${v};`).join('\n      ')}
      --font-body: '${this._fontFamily}', system-ui, sans-serif;
      --font-heading: '${this._headingFont}', system-ui, sans-serif;
      --heading-weight: ${this._headingWeight};
    }

    /* ═══════════════════════════════════════════════════════
       TYPOGRAPHY ENGINE (fluid scale + archetype tokens)
    ═══════════════════════════════════════════════════════ */
    ${this._typographyEngine ? this._typographyEngine.css : ''}

    /* ═══════════════════════════════════════════════════════
       BASE STYLES
    ═══════════════════════════════════════════════════════ */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    html { scroll-behavior: smooth; }

    body {
      font-family: var(--font-body);
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
    }

    .container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }
    .section { padding: 5rem 0; position: relative; }
    .gradient-text {
      background: linear-gradient(135deg, var(--blue), var(--cyan), var(--purple));
      -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
      background-size: 200% 200%;
      animation: gradientShift 6s ease infinite;
    }
    @keyframes gradientShift {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }

    .section-header { text-align: center; margin-bottom: 3rem; }
    .section-label {
      display: inline-block; font-size: 0.8rem; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.15em;
      color: var(--blue); margin-bottom: 0.75rem;
      padding: 0.3rem 0.8rem; border-radius: 100px;
      background: rgba(${this._hexToRgb(c['--blue'])}, 0.1);
      border: 1px solid rgba(${this._hexToRgb(c['--blue'])}, 0.2);
    }
    .section-title { font-family: var(--font-heading); font-size: clamp(2rem, 4vw, 3rem); font-weight: var(--heading-weight); line-height: 1.2; margin-bottom: 1rem; }
    .section-desc { color: var(--text-dim); font-size: 1.1rem; max-width: 600px; margin: 0 auto; }

    /* ═══════════════════════════════════════════════════════
       NAV
    ═══════════════════════════════════════════════════════ */
    .nav-glass {
      position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
      background: ${this._darkMode ? 'rgba(10,10,15,0.8)' : 'rgba(255,255,255,0.85)'};
      backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border);
      transition: all 0.3s ease;
    }
    .nav-inner { display: flex; align-items: center; justify-content: space-between; padding: 1rem 0; }
    .nav-logo { text-decoration: none; font-size: 1.3rem; font-weight: 700; }
    .nav-links { display: flex; gap: 2rem; }
    .nav-link { color: var(--text-dim); text-decoration: none; font-size: 0.9rem; font-weight: 500; transition: color 0.3s; }
    .nav-link:hover { color: var(--text-bright); }
    .nav-cta { font-size: 0.85rem !important; padding: 0.5rem 1.25rem !important; }
    .nav-hamburger { display: none; background: none; border: none; cursor: pointer; padding: 0.5rem; }
    .nav-hamburger span { display: block; width: 22px; height: 2px; background: var(--text); margin: 5px 0; transition: all 0.3s; border-radius: 2px; }

    /* ═══════════════════════════════════════════════════════
       GLASS BUTTONS
    ═══════════════════════════════════════════════════════ */
    .glass-btn {
      display: inline-flex; align-items: center; gap: 0.5rem;
      padding: 0.75rem 1.75rem; border-radius: 12px;
      font-weight: 600; font-size: 0.95rem;
      text-decoration: none; cursor: pointer;
      transition: all 0.3s ease; border: none;
    }
    .glass-btn-primary {
      background: linear-gradient(135deg, var(--blue), var(--cyan));
      color: #fff;
      box-shadow: 0 4px 20px rgba(${this._hexToRgb(c['--blue'])}, 0.3);
    }
    .glass-btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(${this._hexToRgb(c['--blue'])}, 0.5);
    }
    .glass-btn-secondary {
      background: ${this._darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
      color: var(--text);
      border: 1px solid var(--border);
    }
    .glass-btn-secondary:hover {
      background: ${this._darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'};
      transform: translateY(-2px);
    }

    /* ═══════════════════════════════════════════════════════
       HERO
    ═══════════════════════════════════════════════════════ */
    .hero-section { min-height: 100vh; display: flex; align-items: center; padding-top: 5rem; position: relative; overflow: hidden; }
    .hero-content { position: relative; z-index: 2; text-align: center; max-width: 900px; margin: 0 auto; }
    .hero-badge {
      display: inline-flex; align-items: center; gap: 0.5rem;
      background: ${this._darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
      border: 1px solid var(--border); border-radius: 100px;
      padding: 0.4rem 1rem; font-size: 0.85rem; color: var(--text-dim); margin-bottom: 1.5rem;
    }
    .hero-badge-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .hero-title { font-family: var(--font-heading); font-size: clamp(2.5rem, 6vw, 4.5rem); font-weight: var(--heading-weight); line-height: 1.1; margin-bottom: 1.5rem; color: var(--text-bright); }
    .hero-subtitle { font-size: 1.2rem; color: var(--text-dim); margin-bottom: 2rem; max-width: 650px; margin-left: auto; margin-right: auto; }
    .hero-buttons { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
    .magnetic-area { display: inline-block; }

    /* Flip Words */
    .flip-words-container { display: inline-block; position: relative; height: 1.2em; overflow: hidden; vertical-align: bottom; min-width: 200px; }
    .flip-word {
      position: absolute; top: 0; left: 0; right: 0;
      opacity: 0; transform: translateY(100%);
      transition: all 0.5s ease;
      background: linear-gradient(135deg, var(--cyan), var(--purple));
      -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
    }
    .flip-word.active { opacity: 1; transform: translateY(0); }

    /* Meteors */
    .meteors-container { position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 1; }
    .meteor {
      position: absolute; width: 2px; height: 80px;
      background: linear-gradient(to bottom, rgba(255,255,255,0.6), transparent);
      animation: meteorFall 3s linear infinite;
      opacity: 0;
    }
    .meteor:nth-child(1) { left: 10%; animation-delay: 0s; }
    .meteor:nth-child(2) { left: 25%; animation-delay: 0.5s; }
    .meteor:nth-child(3) { left: 40%; animation-delay: 1s; }
    .meteor:nth-child(4) { left: 55%; animation-delay: 1.5s; }
    .meteor:nth-child(5) { left: 70%; animation-delay: 2s; }
    .meteor:nth-child(6) { left: 85%; animation-delay: 2.5s; }
    .meteor:nth-child(7) { left: 15%; animation-delay: 0.3s; }
    .meteor:nth-child(8) { left: 60%; animation-delay: 1.8s; }
    @keyframes meteorFall { 0% { transform: translateY(-100px) rotate(35deg); opacity: 0; } 10% { opacity: 0.6; } 100% { transform: translateY(100vh) rotate(35deg); opacity: 0; } }

    /* ═══════════════════════════════════════════════════════
       STATS
    ═══════════════════════════════════════════════════════ */
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; }
    .stat-card {
      text-align: center; padding: 2.5rem 1.5rem; border-radius: 20px;
      background: var(--bg-card); border: 1px solid var(--border);
      position: relative; overflow: hidden; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .stat-card:hover { transform: translateY(-6px); border-color: rgba(${this._hexToRgb(c['--blue'])}, 0.4); box-shadow: 0 20px 40px -12px rgba(0,0,0,0.25); }
    .stat-card:nth-child(1) { border-radius: 20px 20px 8px 20px; }
    .stat-card:nth-child(2) { border-radius: 20px 20px 20px 8px; }
    .stat-card:nth-child(3) { border-radius: 8px 20px 20px 20px; }
    .stat-card:nth-child(4) { border-radius: 20px 8px 20px 20px; }
    .stat-shimmer {
      position: absolute; inset: 0;
      background: linear-gradient(90deg, transparent, rgba(${this._hexToRgb(c['--blue'])}, 0.05), transparent);
      animation: shimmer 2s infinite;
    }
    @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
    .stat-number { font-family: var(--font-heading); font-size: 2.5rem; font-weight: 800; color: var(--text-bright); position: relative; z-index: 1; }
    .stat-label { color: var(--text-dim); font-size: 0.9rem; margin-top: 0.5rem; position: relative; z-index: 1; }

    /* ═══════════════════════════════════════════════════════
       FEATURES / METHOD — Bento Grid
    ═══════════════════════════════════════════════════════ */
    .bento-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; }
    .bento-wide { grid-column: span 2; }
    .card-3d-wrapper { perspective: 1000px; }
    .card-3d {
      padding: 2rem; border-radius: 20px;
      background: var(--bg-card); border: 1px solid var(--border);
      position: relative; overflow: hidden; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      transform-style: preserve-3d; height: 100%;
    }
    .card-3d:hover { transform: translateY(-6px); border-color: rgba(${this._hexToRgb(c['--blue'])}, 0.4); box-shadow: 0 20px 40px -12px rgba(0,0,0,0.3); }
    .card-featured { padding: 2.5rem; }
    .card-featured h3 { font-size: 1.4rem; }
    .card-3d-glow {
      position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
      background: radial-gradient(circle, rgba(${this._hexToRgb(c['--blue'])}, 0.03) 0%, transparent 70%);
      pointer-events: none;
    }
    .card-3d-icon {
      width: 48px; height: 48px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 1.25rem;
    }
    .card-3d-icon svg { width: 22px; height: 22px; flex-shrink: 0; }
    .card-3d h3 { font-family: var(--font-heading); font-size: 1.15rem; font-weight: 700; color: var(--text-bright); margin-bottom: 0.75rem; }
    .card-3d p { color: var(--text-dim); font-size: 0.95rem; line-height: 1.7; }
    .card-3d-tag {
      display: inline-block; margin-top: 1.25rem;
      padding: 0.3rem 0.85rem; border-radius: 100px;
      font-size: 0.7rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;
    }
    @media (max-width: 768px) { .bento-grid { grid-template-columns: 1fr; } .bento-wide { grid-column: span 1; } }

    /* ═══════════════════════════════════════════════════════
       TESTIMONIALS — Premium cards with variation
    ═══════════════════════════════════════════════════════ */
    .testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; align-items: start; }
    .testimonial-card {
      padding: 2rem; border-radius: 20px;
      background: var(--bg-card); border: 1px solid var(--border);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .testimonial-card:hover { transform: translateY(-6px); box-shadow: 0 20px 40px -12px rgba(0,0,0,0.3); }
    .testimonial-featured {
      padding: 2.5rem; border-color: rgba(${this._hexToRgb(c['--blue'])}, 0.3);
      background: linear-gradient(135deg, var(--bg-card), rgba(${this._hexToRgb(c['--blue'])}, 0.03));
    }
    .testimonial-featured .testimonial-text { font-size: 1.1rem; }
    .testimonial-stars { color: #fbbf24; display: flex; gap: 2px; margin-bottom: 1.25rem; }
    .testimonial-stars svg { flex-shrink: 0; }
    .testimonial-text { color: var(--text); font-size: 0.95rem; line-height: 1.8; margin-bottom: 1.5rem; }
    .testimonial-author { display: flex; align-items: center; gap: 0.75rem; padding-top: 1rem; border-top: 1px solid var(--border); }
    .testimonial-avatar {
      width: 44px; height: 44px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-weight: 700; font-size: 0.85rem; letter-spacing: 0.02em;
      flex-shrink: 0;
    }
    .testimonial-name { font-weight: 600; color: var(--text-bright); font-size: 0.9rem; }
    .testimonial-role { color: var(--text-dim); font-size: 0.8rem; }
    @media (max-width: 768px) { .testimonials-grid { grid-template-columns: 1fr; } }

    /* ═══════════════════════════════════════════════════════
       PRICING
    ═══════════════════════════════════════════════════════ */
    .pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem; max-width: 960px; margin: 0 auto; }
    .pricing-card {
      padding: 2.5rem 2rem; border-radius: 24px;
      background: var(--bg-card); border: 1px solid var(--border);
      text-align: center; position: relative; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .pricing-card:hover { transform: translateY(-6px); box-shadow: 0 20px 40px -12px rgba(0,0,0,0.25); }
    .pricing-popular {
      border-color: var(--blue);
      box-shadow: 0 0 30px rgba(${this._hexToRgb(c['--blue'])}, 0.15);
    }
    .pricing-badge {
      position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
      background: linear-gradient(135deg, var(--blue), var(--cyan));
      color: #fff; padding: 0.3rem 1rem; border-radius: 100px;
      font-size: 0.75rem; font-weight: 600;
    }
    .pricing-name { font-family: var(--font-heading); font-size: 1.3rem; font-weight: 700; color: var(--text-bright); margin-bottom: 1rem; }
    .pricing-price { margin-bottom: 1.5rem; }
    .pricing-currency { font-size: 1.2rem; color: var(--text-dim); vertical-align: top; }
    .pricing-value { font-family: var(--font-heading); font-size: 3rem; font-weight: 800; color: var(--text-bright); }
    .pricing-period { font-size: 0.9rem; color: var(--text-dim); }
    .pricing-features { list-style: none; text-align: left; margin-bottom: 2rem; }
    .pricing-features li { padding: 0.5rem 0; color: var(--text-dim); font-size: 0.9rem; border-bottom: 1px solid var(--border); }
    .pricing-features li::before { content: '\\2713'; color: var(--blue); margin-right: 0.5rem; font-weight: 700; }
    .pricing-btn { width: 100%; justify-content: center; }

    /* ═══════════════════════════════════════════════════════
       GUARANTEE (Hormozi)
    ═══════════════════════════════════════════════════════ */
    .guarantee-badge {
      display: inline-block; padding: 0.5rem 1.25rem; border-radius: 100px;
      font-size: 0.9rem; font-weight: 600; margin-bottom: 1.5rem;
      background: rgba(${this._hexToRgb(c['--blue'])}, 0.1);
      border: 1px solid rgba(${this._hexToRgb(c['--blue'])}, 0.25);
      color: var(--blue);
    }

    /* ═══════════════════════════════════════════════════════
       VIDEO SHOWCASE — Cinematic Frame
    ═══════════════════════════════════════════════════════ */
    .video-frame { max-width: 900px; margin: 0 auto; perspective: 1200px; }
    .video-frame-inner {
      position: relative; border-radius: 20px; overflow: hidden;
      aspect-ratio: 16/9; cursor: pointer;
      background: linear-gradient(135deg, rgba(${this._hexToRgb(c['--blue'])}, 0.1), rgba(${this._hexToRgb(c['--purple'])}, 0.1));
      border: 1px solid var(--border);
      transform: rotateX(2deg);
      transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.4);
    }
    .video-frame-inner:hover { transform: rotateX(0deg) scale(1.02); }
    .video-thumb { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    .video-play-btn {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 80px; height: 80px; border-radius: 50%;
      background: rgba(255,255,255,0.15); backdrop-filter: blur(10px);
      display: flex; align-items: center; justify-content: center;
      color: #fff; transition: all 0.3s; z-index: 2;
      border: 2px solid rgba(255,255,255,0.2);
    }
    .video-play-btn:hover { background: rgba(255,255,255,0.25); transform: translate(-50%, -50%) scale(1.1); }
    .video-play-btn svg { margin-left: 4px; }
    .video-frame-glow {
      position: absolute; inset: -50%;
      background: radial-gradient(circle at 50% 50%, rgba(${this._hexToRgb(c['--blue'])}, 0.08) 0%, transparent 60%);
      pointer-events: none;
    }
    .video-frame-reflection {
      height: 60px; margin-top: -1px; border-radius: 0 0 20px 20px;
      background: linear-gradient(to bottom, rgba(${this._hexToRgb(c['--blue'])}, 0.04), transparent);
      transform: scaleY(-1) rotateX(2deg);
      opacity: 0.3; mask-image: linear-gradient(to bottom, black, transparent);
      -webkit-mask-image: linear-gradient(to bottom, black, transparent);
    }

    /* ═══════════════════════════════════════════════════════
       CTA SECTION
    ═══════════════════════════════════════════════════════ */
    .cta-section {
      background: linear-gradient(135deg, rgba(${this._hexToRgb(c['--blue'])}, 0.05), rgba(${this._hexToRgb(c['--purple'])}, 0.05));
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
    }

    /* ═══════════════════════════════════════════════════════
       FOOTER
    ═══════════════════════════════════════════════════════ */
    .site-footer {
      padding: 3rem 0; border-top: 1px solid var(--border);
      background: ${this._darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.02)'};
    }
    .footer-content { text-align: center; }
    .footer-brand { margin-bottom: 1rem; }
    .footer-links { display: flex; justify-content: center; gap: 1.5rem; margin-bottom: 1rem; flex-wrap: wrap; }
    .footer-links a { color: var(--text-dim); text-decoration: none; font-size: 0.9rem; transition: color 0.3s; }
    .footer-links a:hover { color: var(--text-bright); }
    .footer-copy { color: var(--text-dim); font-size: 0.8rem; }

    /* ═══════════════════════════════════════════════════════
       WAVE DIVIDERS
    ═══════════════════════════════════════════════════════ */
    .wave-divider { position: relative; height: 60px; overflow: hidden; }
    .wave-divider svg { position: absolute; bottom: 0; width: 100%; height: 100%; }

    /* ═══════════════════════════════════════════════════════
       IMAGE INTEGRATION
    ═══════════════════════════════════════════════════════ */
    .hero-bg-image { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; }
    .hero-video-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; }
    .hero-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.7)); z-index: 1; }

    .gallery-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; }
    .gallery-item { border-radius: 16px; overflow: hidden; aspect-ratio: 4/3; }
    .gallery-item:first-child { grid-row: span 2; aspect-ratio: auto; }
    .gallery-item img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; }
    .gallery-item:hover img { transform: scale(1.05); }

    .testimonial-avatar-img { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }

    @media (max-width: 768px) { .gallery-grid { grid-template-columns: repeat(2, 1fr); } .gallery-item:first-child { grid-row: span 1; } }
    @media (max-width: 480px) { .gallery-grid { grid-template-columns: 1fr; } }

    /* ═══════════════════════════════════════════════════════
       THREE.JS CANVAS
    ═══════════════════════════════════════════════════════ */
    #three-canvas { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; }

    /* ═══════════════════════════════════════════════════════
       RESPONSIVE
    ═══════════════════════════════════════════════════════ */
    @media (max-width: 768px) {
      .nav-links { display: none; }
      .nav-hamburger { display: block; }
      .nav-links.open { display: flex; flex-direction: column; position: absolute; top: 100%; left: 0; right: 0; background: ${this._darkMode ? 'rgba(10,10,15,0.95)' : 'rgba(255,255,255,0.95)'}; backdrop-filter: blur(20px); padding: 1rem; gap: 1rem; border-bottom: 1px solid var(--border); }
      .nav-cta { display: none; }
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .bento-grid { grid-template-columns: 1fr; } .bento-wide { grid-column: span 1; }
      .hero-title { font-size: clamp(2rem, 5vw, 3rem); }
    }

    @media (max-width: 480px) {
      .stats-grid { grid-template-columns: 1fr; }
      .hero-buttons { flex-direction: column; align-items: center; }
    }

    /* ═══════════════════════════════════════════════════════
       PREMIUM COMPONENT CSS (from library)
    ═══════════════════════════════════════════════════════ */
    ${premiumCssParts.join('\n\n    ')}

    /* ═══════════════════════════════════════════════════════
       SLOT-ENRICHED CSS (from 771 component library)
    ═══════════════════════════════════════════════════════ */
    ${allSlotCss}

    /* Visibility fallback */
    .gsap-reveal { will-change: opacity, transform; }

    /* ═══════════════════════════════════════════════════════
       ANIMATION ENGINE (micro-interactions + reduced motion)
    ═══════════════════════════════════════════════════════ */
    ${this._animationEngine ? this._animationEngine.css : ''}
  </style>
</head>
<body>
  <canvas id="three-canvas"></canvas>
  ${navHtml}
  ${heroHtml}
  ${waveDivider()}
  ${statsHtml}
  ${waveDivider()}
  ${methodHtml}
  ${galleryHtml ? waveDivider() : ''}
  ${galleryHtml}
  ${waveDivider()}
  ${videoShowcaseHtml}
  ${waveDivider()}
  ${testimonialsHtml}
  ${waveDivider()}
  ${pricingHtml}
  ${guaranteeHtml ? waveDivider() : ''}
  ${guaranteeHtml}
  ${waveDivider()}
  ${ctaHtml}
  ${footerHtml}

  <!-- GSAP -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"><\/script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"><\/script>

  <script>
    /* ═══════════════════════════════════════════════════════
       NAVIGATION
    ═══════════════════════════════════════════════════════ */
    (function() {
      const hamburger = document.getElementById('navHamburger');
      const navLinks  = document.getElementById('navLinks');
      if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
        navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));
      }
      const navbar = document.getElementById('navbar');
      let lastScroll = 0;
      window.addEventListener('scroll', () => {
        const st = window.scrollY;
        if (navbar) {
          navbar.style.transform = st > lastScroll && st > 100 ? 'translateY(-100%)' : 'translateY(0)';
          if (st > 50) navbar.classList.add('scrolled');
          else navbar.classList.remove('scrolled');
        }
        lastScroll = st;
      });
    })();

    /* ═══════════════════════════════════════════════════════
       FLIP WORDS
    ═══════════════════════════════════════════════════════ */
    (function() {
      const words = document.querySelectorAll('.flip-word');
      if (words.length <= 1) return;
      let current = 0;
      setInterval(() => {
        words[current].classList.remove('active');
        current = (current + 1) % words.length;
        words[current].classList.add('active');
      }, 2500);
    })();

    /* ═══════════════════════════════════════════════════════
       FLOATING PARTICLES
    ═══════════════════════════════════════════════════════ */
    (function() {
      const colors = ['${c['--blue']}66', '${c['--cyan']}4d', '${c['--purple']}4d', '${c['--pink']}33'];
      for (let i = 0; i < 10; i++) {
        const p = document.createElement('div');
        p.style.cssText = \`position:fixed;width:\${4+Math.random()*6}px;height:\${4+Math.random()*6}px;
          border-radius:50%;background:\${colors[i%4]};pointer-events:none;z-index:1;
          left:\${Math.random()*100}%;top:\${Math.random()*100}%;
          animation:floatParticle \${8+Math.random()*12}s ease-in-out infinite \${Math.random()*5}s;\`;
        document.body.appendChild(p);
      }
      if (!document.querySelector('#floatParticleStyle')) {
        const style = document.createElement('style');
        style.id = 'floatParticleStyle';
        style.textContent = \`@keyframes floatParticle {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          25% { transform: translate(\${Math.random()*100-50}px, \${Math.random()*100-50}px) scale(1.2); opacity: 0.6; }
          50% { transform: translate(\${Math.random()*100-50}px, \${Math.random()*100-50}px) scale(0.8); opacity: 0.4; }
          75% { transform: translate(\${Math.random()*100-50}px, \${Math.random()*100-50}px) scale(1.1); opacity: 0.5; }
        }\`;
        document.head.appendChild(style);
      }
    })();

    /* ═══════════════════════════════════════════════════════
       GLOWING STARS (testimonials)
    ═══════════════════════════════════════════════════════ */
    (function() {
      const container = document.getElementById('testimonials');
      if (!container) return;
      for (let i = 0; i < 40; i++) {
        const star = document.createElement('div');
        const size = 1 + Math.random() * 2;
        star.style.cssText = \`position:absolute;width:\${size}px;height:\${size}px;border-radius:50%;
          background:\${Math.random()>0.5 ? '${c['--purple']}' : '${c['--cyan']}'};
          left:\${Math.random()*100}%;top:\${Math.random()*100}%;opacity:0;pointer-events:none;
          animation:starGlow \${2+Math.random()*3}s ease-in-out infinite \${Math.random()*3}s;\`;
        container.style.position = 'relative';
        container.appendChild(star);
      }
      if (!document.querySelector('#starGlowStyle')) {
        const style = document.createElement('style');
        style.id = 'starGlowStyle';
        style.textContent = \`@keyframes starGlow { 0%,100% { opacity:0; transform:scale(0.5); } 50% { opacity:0.8; transform:scale(1.5); } }\`;
        document.head.appendChild(style);
      }
    })();

    /* ═══════════════════════════════════════════════════════
       GSAP SCROLL CHOREOGRAPHY (Animation Engine)
    ═══════════════════════════════════════════════════════ */
    ${this._animationEngine ? this._animationEngine.js : `gsap.registerPlugin(ScrollTrigger);

    gsap.utils.toArray('.gsap-reveal').forEach(el => {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' },
        opacity: 0, y: 30, duration: 0.8, ease: 'power2.out'
      });
    });

    document.querySelectorAll('.bento-grid, .stats-grid, .pricing-grid, .testimonials-grid').forEach(grid => {
      gsap.from(grid.children, {
        scrollTrigger: { trigger: grid, start: 'top 90%', toggleActions: 'play none none none' },
        opacity: 0, y: 30, stagger: 0.15, duration: 0.8, ease: 'power2.out'
      });
    });`}

    setTimeout(() => {
      ScrollTrigger.refresh();
      document.querySelectorAll('.gsap-reveal').forEach(el => {
        if (getComputedStyle(el).opacity === '0') gsap.to(el, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
      });
    }, 500);

    /* ═══════════════════════════════════════════════════════
       COUNTER ANIMATION
    ═══════════════════════════════════════════════════════ */
    (function() {
      let triggered = false;
      const section = document.getElementById('stats');
      if (!section) return;
      ScrollTrigger.create({
        trigger: section, start: 'top 80%',
        onEnter: function() {
          if (triggered) return;
          triggered = true;
          document.querySelectorAll('.stat-shimmer').forEach(s => gsap.to(s, { opacity: 0, duration: 0.5, onComplete: () => s.remove() }));
          document.querySelectorAll('.stat-number').forEach(el => {
            const raw = el.dataset.count;
            if (!raw) return;
            const prefix = el.dataset.prefix || '', suffix = el.dataset.suffix || '';
            const target = parseFloat(raw);
            if (isNaN(target)) return;
            const isDec = raw.includes('.');
            gsap.to({ val: 0 }, {
              val: target, duration: 2, ease: 'power2.out',
              onUpdate: function() {
                const v = this.targets()[0].val;
                el.textContent = prefix + (isDec ? v.toFixed(1) : Math.floor(v).toLocaleString()) + suffix;
              }
            });
          });
        }
      });
    })();

    /* Fallback: ensure visibility */
    setTimeout(function() {
      document.querySelectorAll('.gsap-reveal').forEach(function(el) {
        el.style.opacity = '1'; el.style.transform = 'none';
      });
    }, 3000);

    /* Smooth anchor scroll */
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const target = a.getAttribute('href') !== '#' && document.querySelector(a.getAttribute('href'));
        if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      });
    });

    /* Additional inline JS from library */
    ${inlineJsFromLib}
  <\/script>

  <!-- THREE.JS 3D SCENE (${this._3dScene ? 'Scene Engine' : 'Fallback'}) -->
  <script type="module">
    ${this._3dScene ? this._3dScene.js : `import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
    const canvas = document.getElementById('three-canvas');
    if (canvas) {
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 5;
      const geo = new THREE.TorusKnotGeometry(1.2, 0.35, 128, 32);
      const mat = new THREE.MeshBasicMaterial({ color: ${threeColor1}, wireframe: true, transparent: true, opacity: 0.12 });
      const mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);
      const pCount = 2500, pos = new Float32Array(pCount*3), cols = new Float32Array(pCount*3);
      const c1 = new THREE.Color(${threeColor1}), c2 = new THREE.Color(${threeColor2});
      for (let i = 0; i < pCount; i++) { pos[i*3]=(Math.random()-.5)*20; pos[i*3+1]=(Math.random()-.5)*20; pos[i*3+2]=(Math.random()-.5)*20; const t=Math.random(); const c=c1.clone().lerp(c2,t); cols[i*3]=c.r; cols[i*3+1]=c.g; cols[i*3+2]=c.b; }
      const pg = new THREE.BufferGeometry(); pg.setAttribute('position',new THREE.BufferAttribute(pos,3)); pg.setAttribute('color',new THREE.BufferAttribute(cols,3));
      const pm = new THREE.PointsMaterial({size:0.025,vertexColors:true,transparent:true,opacity:0.6,sizeAttenuation:true});
      const pts = new THREE.Points(pg,pm); scene.add(pts);
      let mx=0,my=0; document.addEventListener('mousemove',e=>{mx=(e.clientX/window.innerWidth-.5)*2;my=(e.clientY/window.innerHeight-.5)*2;});
      (function anim(){requestAnimationFrame(anim);mesh.rotation.x+=.003;mesh.rotation.y+=.005;pts.rotation.y+=.0003;camera.position.x+=(mx*.3-camera.position.x)*.01;camera.position.y+=(-my*.3-camera.position.y)*.01;camera.lookAt(scene.position);renderer.render(scene,camera);})();
      window.addEventListener('resize',()=>{camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight);});
    }`}

    ${moduleJsFromLib}
  <\/script>
</body>
</html>`;
  }

  // ─── Step 6: Write outputs ─────────────────────────────────

  writeOutputs(html) {
    console.log('\n[6/7] Writing output files...');

    const projectName = this.dna.projectName || this.dna.businessName || path.basename(this.projectDir);
    const slug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const projOutputFile = path.join(this.projectDir, 'output', 'index.html');
    this._writeFile(projOutputFile, html);

    const workspaceRoot = path.resolve(this.projectDir, '..');
    const genSiteFile = path.join(workspaceRoot, 'generated-site', slug, 'index.html');
    this._writeFile(genSiteFile, html);

    // Also write a slot report
    const report = this._generateSlotReport();
    const reportFile = path.join(this.projectDir, 'output', 'slot-report.md');
    this._writeFile(reportFile, report);

    return { slug, projOutputFile, genSiteFile, reportFile };
  }

  _generateSlotReport() {
    const lines = ['# NEXUS v4 Slot Report\n'];
    lines.push(`Business Type: ${this.businessType}`);
    lines.push(`Mode: ${this._darkMode ? 'Dark' : 'Light'}`);
    lines.push(`Font: ${this._fontFamily} / ${this._headingFont}\n`);

    lines.push('## Slot Assignments\n');
    for (const [slot, items] of Object.entries(this.slotResolver.selected)) {
      lines.push(`### ${slot}`);
      for (const { comp, score } of items) {
        const cssLen = (comp.css || '').length;
        const classes = CssClassExtractor.extract(comp.css).classes.length;
        lines.push(`- **${comp.id}** (score: ${score.toFixed(1)}, css: ${cssLen}b, classes: ${classes})`);
      }
      lines.push('');
    }

    lines.push('## Premium Effects\n');
    for (const id of Object.keys(this.resolvedPremium)) {
      lines.push(`- ${id}`);
    }

    // Squad Knowledge report
    if (this._squadStrategy) {
      lines.push('\n## Squad Knowledge\n');
      lines.push(`- **Archetype:** ${this._squadStrategy?.archetype?.key || 'N/A'}`);
      lines.push(`- **Voice Tone:** ${this._squadStrategy?.voiceTone || 'N/A'}`);
      lines.push(`- **Awareness Level (Schwartz):** ${this._squadStrategy?.copy?.awarenessLevel || 'N/A'}`);
      lines.push(`- **Hero Style:** ${this._squadStrategy?.copy?.config?.hero_style || 'N/A'}`);
      lines.push(`- **CTA Urgency:** ${this._squadStrategy?.copy?.config?.cta_urgency || 'N/A'}`);
      lines.push(`- **Copy Approach:** ${this._squadStrategy?.copy?.config?.copy_approach || 'N/A'}`);
      lines.push(`- **Guarantee (Hormozi):** ${this._squadStrategy?.offer?.guarantee?.recommended || 'N/A'} — ${this._squadStrategy?.offer?.guarantee?.type?.description || 'N/A'}`);
      lines.push(`- **Value Equation:** ${this._squadStrategy?.offer?.valueEquation?.formula || 'N/A'}`);
    }

    return lines.join('\n');
  }

  // ─── Main run ──────────────────────────────────────────────

  run() {
    console.log('==================================================');
    console.log('  NEXUS Code Agent v4 — Slot-Driven Assembly');
    console.log('==================================================');

    const startTime = Date.now();

    try {
      this.loadLibrary();        // [1/7]
      this.loadInputs();         // [2/7]
      this.resolveSlots();       // [3/7]
      this.resolveDesign();      // [4/7]
      const html = this.buildPage(); // [5/7]

      console.log(`\n  Page: ${html.length} chars (${(Buffer.byteLength(html) / 1024).toFixed(1)} KB)`);

      const paths = this.writeOutputs(html); // [6/7]
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log(`\n[7/7] Done in ${elapsed}s`);
      console.log('==================================================');
      console.log(`  Slug:   ${paths.slug}`);
      console.log(`  Output: ${paths.projOutputFile}`);
      console.log(`  Site:   ${paths.genSiteFile}`);
      console.log(`  Report: ${paths.reportFile}`);
      console.log('==================================================\n');

      return paths;
    } catch (err) {
      console.error(`\n[ERROR] ${err.message}`);
      console.error(err.stack);
      process.exit(1);
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Export & CLI
// ─────────────────────────────────────────────────────────────

module.exports = NexusCodeAgentV4;

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: node nexus-code-agent-v4.js <path-to-context-dna.json>');
    process.exit(1);
  }
  const agent = new NexusCodeAgentV4(args[0]);
  agent.run();
}
