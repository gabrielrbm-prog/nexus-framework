/**
 * NEXUS Typography Engine
 *
 * Produces agency-quality typography systems mapped to brand archetypes.
 * Generates fluid type scales, curated font pairings, CSS custom properties,
 * and Google Fonts imports — ready for production use.
 *
 * Usage:
 *   const engine = new NexusTypographyEngine();
 *   const result = engine.generate({ archetype: 'hero', brandName: 'Acme', businessType: 'fintech' });
 *   // result => { css, imports, tokens, fontFamilies }
 *
 * CLI:
 *   node nexus-typography-engine.js --archetype hero --business fintech
 */

'use strict';

// ---------------------------------------------------------------------------
// Font Strategy Database
// ---------------------------------------------------------------------------

const FONT_STRATEGIES = {
  hero: {
    label: 'Hero / Ruler',
    display: { family: 'Cabinet Grotesk', fallback: 'sans-serif', weights: [700, 800, 900], variable: false },
    displayAlt: { family: 'Clash Display', fallback: 'sans-serif', weights: [600, 700], variable: true },
    body: { family: 'Satoshi', fallback: 'sans-serif', weights: [400, 500, 700], variable: true },
    accent: { family: 'Space Mono', fallback: 'monospace', weights: [400, 700], variable: false },
    mood: 'commanding, authoritative, confident',
  },
  ruler: {
    label: 'Hero / Ruler',
    display: { family: 'Cabinet Grotesk', fallback: 'sans-serif', weights: [700, 800, 900], variable: false },
    displayAlt: { family: 'Clash Display', fallback: 'sans-serif', weights: [600, 700], variable: true },
    body: { family: 'Satoshi', fallback: 'sans-serif', weights: [400, 500, 700], variable: true },
    accent: { family: 'Space Mono', fallback: 'monospace', weights: [400, 700], variable: false },
    mood: 'commanding, authoritative, confident',
  },
  sage: {
    label: 'Sage / Trustworthy',
    display: { family: 'Fraunces', fallback: 'serif', weights: [600, 700, 900], variable: true },
    body: { family: 'DM Sans', fallback: 'sans-serif', weights: [400, 500, 700], variable: true },
    accent: { family: 'JetBrains Mono', fallback: 'monospace', weights: [400, 500], variable: false },
    mood: 'intellectual, trustworthy, refined',
  },
  trustworthy: {
    label: 'Sage / Trustworthy',
    display: { family: 'Fraunces', fallback: 'serif', weights: [600, 700, 900], variable: true },
    body: { family: 'DM Sans', fallback: 'sans-serif', weights: [400, 500, 700], variable: true },
    accent: { family: 'JetBrains Mono', fallback: 'monospace', weights: [400, 500], variable: false },
    mood: 'intellectual, trustworthy, refined',
  },
  creator: {
    label: 'Creator / Innovative',
    display: { family: 'Sora', fallback: 'sans-serif', weights: [600, 700, 800], variable: true },
    displayAlt: { family: 'Outfit', fallback: 'sans-serif', weights: [600, 700, 800], variable: true },
    body: { family: 'Plus Jakarta Sans', fallback: 'sans-serif', weights: [400, 500, 600, 700], variable: true },
    accent: { family: 'Fira Code', fallback: 'monospace', weights: [400, 500], variable: true },
    mood: 'creative, forward-thinking, inventive',
  },
  innovative: {
    label: 'Creator / Innovative',
    display: { family: 'Sora', fallback: 'sans-serif', weights: [600, 700, 800], variable: true },
    displayAlt: { family: 'Outfit', fallback: 'sans-serif', weights: [600, 700, 800], variable: true },
    body: { family: 'Plus Jakarta Sans', fallback: 'sans-serif', weights: [400, 500, 600, 700], variable: true },
    accent: { family: 'Fira Code', fallback: 'monospace', weights: [400, 500], variable: true },
    mood: 'creative, forward-thinking, inventive',
  },
  caregiver: {
    label: 'Caregiver / Friendly',
    display: { family: 'Playfair Display', fallback: 'serif', weights: [700, 800, 900], variable: true },
    body: { family: 'Nunito Sans', fallback: 'sans-serif', weights: [400, 600, 700], variable: true },
    accent: { family: 'Source Code Pro', fallback: 'monospace', weights: [400, 500], variable: true },
    mood: 'warm, approachable, nurturing',
  },
  friendly: {
    label: 'Caregiver / Friendly',
    display: { family: 'Playfair Display', fallback: 'serif', weights: [700, 800, 900], variable: true },
    body: { family: 'Nunito Sans', fallback: 'sans-serif', weights: [400, 600, 700], variable: true },
    accent: { family: 'Source Code Pro', fallback: 'monospace', weights: [400, 500], variable: true },
    mood: 'warm, approachable, nurturing',
  },
  rebel: {
    label: 'Rebel / Bold',
    display: { family: 'Unbounded', fallback: 'sans-serif', weights: [700, 800, 900], variable: true },
    displayAlt: { family: 'Archivo Black', fallback: 'sans-serif', weights: [400], variable: false },
    body: { family: 'Inter Tight', fallback: 'sans-serif', weights: [400, 500, 600, 700], variable: true },
    accent: { family: 'IBM Plex Mono', fallback: 'monospace', weights: [400, 500, 600], variable: false },
    mood: 'disruptive, edgy, unapologetic',
  },
  bold: {
    label: 'Rebel / Bold',
    display: { family: 'Unbounded', fallback: 'sans-serif', weights: [700, 800, 900], variable: true },
    displayAlt: { family: 'Archivo Black', fallback: 'sans-serif', weights: [400], variable: false },
    body: { family: 'Inter Tight', fallback: 'sans-serif', weights: [400, 500, 600, 700], variable: true },
    accent: { family: 'IBM Plex Mono', fallback: 'monospace', weights: [400, 500, 600], variable: false },
    mood: 'disruptive, edgy, unapologetic',
  },
  magician: {
    label: 'Magician / Premium',
    display: { family: 'Cormorant Garamond', fallback: 'serif', weights: [600, 700], variable: false },
    body: { family: 'Manrope', fallback: 'sans-serif', weights: [400, 500, 600, 700], variable: true },
    accent: { family: 'Space Grotesk', fallback: 'sans-serif', weights: [400, 500, 700], variable: true },
    mood: 'mysterious, transformative, luxurious',
  },
  premium: {
    label: 'Magician / Premium',
    display: { family: 'Cormorant Garamond', fallback: 'serif', weights: [600, 700], variable: false },
    body: { family: 'Manrope', fallback: 'sans-serif', weights: [400, 500, 600, 700], variable: true },
    accent: { family: 'Space Grotesk', fallback: 'sans-serif', weights: [400, 500, 700], variable: true },
    mood: 'mysterious, transformative, luxurious',
  },
  explorer: {
    label: 'Explorer / Adventurous',
    display: { family: 'Bricolage Grotesque', fallback: 'sans-serif', weights: [600, 700, 800], variable: true },
    body: { family: 'Geist', fallback: 'sans-serif', weights: [400, 500, 600], variable: true },
    accent: { family: 'Geist Mono', fallback: 'monospace', weights: [400, 500], variable: true },
    mood: 'adventurous, dynamic, pioneering',
  },
  adventurous: {
    label: 'Explorer / Adventurous',
    display: { family: 'Bricolage Grotesque', fallback: 'sans-serif', weights: [600, 700, 800], variable: true },
    body: { family: 'Geist', fallback: 'sans-serif', weights: [400, 500, 600], variable: true },
    accent: { family: 'Geist Mono', fallback: 'monospace', weights: [400, 500], variable: true },
    mood: 'adventurous, dynamic, pioneering',
  },
  everyman: {
    label: 'Everyman / Accessible',
    display: { family: 'Poppins', fallback: 'sans-serif', weights: [600, 700, 800], variable: false },
    body: { family: 'Work Sans', fallback: 'sans-serif', weights: [400, 500, 600], variable: true },
    accent: { family: 'Roboto Mono', fallback: 'monospace', weights: [400, 500], variable: true },
    mood: 'relatable, honest, dependable',
  },
  accessible: {
    label: 'Everyman / Accessible',
    display: { family: 'Poppins', fallback: 'sans-serif', weights: [600, 700, 800], variable: false },
    body: { family: 'Work Sans', fallback: 'sans-serif', weights: [400, 500, 600], variable: true },
    accent: { family: 'Roboto Mono', fallback: 'monospace', weights: [400, 500], variable: true },
    mood: 'relatable, honest, dependable',
  },
  lover: {
    label: 'Lover / Elegant',
    display: { family: 'Lora', fallback: 'serif', weights: [600, 700], variable: true },
    body: { family: 'Libre Franklin', fallback: 'sans-serif', weights: [400, 500, 600], variable: true },
    accent: { family: 'Crimson Pro', fallback: 'serif', weights: [400, 500], variable: true },
    mood: 'romantic, elegant, intimate',
  },
  elegant: {
    label: 'Lover / Elegant',
    display: { family: 'Lora', fallback: 'serif', weights: [600, 700], variable: true },
    body: { family: 'Libre Franklin', fallback: 'sans-serif', weights: [400, 500, 600], variable: true },
    accent: { family: 'Crimson Pro', fallback: 'serif', weights: [400, 500], variable: true },
    mood: 'romantic, elegant, intimate',
  },
  jester: {
    label: 'Jester / Playful',
    display: { family: 'Lilita One', fallback: 'sans-serif', weights: [400], variable: false },
    body: { family: 'Quicksand', fallback: 'sans-serif', weights: [400, 500, 600, 700], variable: true },
    accent: { family: 'Comfortaa', fallback: 'sans-serif', weights: [400, 500, 700], variable: true },
    mood: 'fun, energetic, lighthearted',
  },
  playful: {
    label: 'Jester / Playful',
    display: { family: 'Lilita One', fallback: 'sans-serif', weights: [400], variable: false },
    body: { family: 'Quicksand', fallback: 'sans-serif', weights: [400, 500, 600, 700], variable: true },
    accent: { family: 'Comfortaa', fallback: 'sans-serif', weights: [400, 500, 700], variable: true },
    mood: 'fun, energetic, lighthearted',
  },
  innocent: {
    label: 'Innocent / Clean',
    display: { family: 'Lexend', fallback: 'sans-serif', weights: [600, 700, 800], variable: true },
    body: { family: 'Karla', fallback: 'sans-serif', weights: [400, 500, 700], variable: true },
    accent: { family: 'Anonymous Pro', fallback: 'monospace', weights: [400, 700], variable: false },
    mood: 'pure, optimistic, straightforward',
  },
  clean: {
    label: 'Innocent / Clean',
    display: { family: 'Lexend', fallback: 'sans-serif', weights: [600, 700, 800], variable: true },
    body: { family: 'Karla', fallback: 'sans-serif', weights: [400, 500, 700], variable: true },
    accent: { family: 'Anonymous Pro', fallback: 'monospace', weights: [400, 700], variable: false },
    mood: 'pure, optimistic, straightforward',
  },
};

// ---------------------------------------------------------------------------
// Fluid Type Scale Definitions
// ---------------------------------------------------------------------------

const FLUID_SCALE = {
  h1: { min: '2.5rem', preferred: '5vw + 1rem', max: '4.5rem' },
  h2: { min: '1.875rem', preferred: '3vw + 0.75rem', max: '3rem' },
  h3: { min: '1.5rem', preferred: '2vw + 0.5rem', max: '2.25rem' },
  h4: { min: '1.125rem', preferred: '1.5vw + 0.5rem', max: '1.5rem' },
  h5: { min: '1rem', preferred: '1vw + 0.5rem', max: '1.25rem' },
  h6: { min: '0.875rem', preferred: '0.75vw + 0.5rem', max: '1.125rem' },
  body: { min: '1rem', preferred: '0.5vw + 0.875rem', max: '1.125rem' },
  small: { min: '0.875rem', preferred: '0.25vw + 0.75rem', max: '0.9375rem' },
  caption: { min: '0.75rem', preferred: '0.25vw + 0.625rem', max: '0.8125rem' },
  overline: { min: '0.6875rem', preferred: '0.2vw + 0.5625rem', max: '0.75rem' },
  label: { min: '0.8125rem', preferred: '0.3vw + 0.6875rem', max: '0.875rem' },
};

// ---------------------------------------------------------------------------
// Per-Level Typography Tokens
// ---------------------------------------------------------------------------

const HEADING_TOKENS = {
  h1: { weight: 900, letterSpacing: '-0.03em', lineHeight: 1.05, textTransform: 'none' },
  h2: { weight: 700, letterSpacing: '-0.02em', lineHeight: 1.15, textTransform: 'none' },
  h3: { weight: 600, letterSpacing: '-0.01em', lineHeight: 1.25, textTransform: 'none' },
  h4: { weight: 500, letterSpacing: '0em', lineHeight: 1.3, textTransform: 'none' },
  h5: { weight: 500, letterSpacing: '0.01em', lineHeight: 1.35, textTransform: 'none' },
  h6: { weight: 600, letterSpacing: '0.02em', lineHeight: 1.4, textTransform: 'uppercase' },
};

// ---------------------------------------------------------------------------
// Google Fonts URL Builder
// ---------------------------------------------------------------------------

/**
 * Fonts hosted on Google Fonts. Some premium fonts (Cabinet Grotesk, Clash Display,
 * Satoshi, Geist, Geist Mono) are not on Google Fonts — they ship from fontshare.com
 * or vercel. We handle both cases: Google Fonts get <link> tags, others get a comment
 * noting where to source them.
 */
const GOOGLE_FONTS_REGISTRY = new Set([
  'Fraunces', 'DM Sans', 'JetBrains Mono', 'Sora', 'Outfit',
  'Plus Jakarta Sans', 'Fira Code', 'Playfair Display', 'Nunito Sans',
  'Source Code Pro', 'Unbounded', 'Archivo Black', 'Inter Tight',
  'IBM Plex Mono', 'Cormorant Garamond', 'Manrope', 'Space Grotesk',
  'Bricolage Grotesque', 'Poppins', 'Work Sans', 'Roboto Mono',
  'Lora', 'Libre Franklin', 'Crimson Pro', 'Lilita One', 'Quicksand',
  'Comfortaa', 'Lexend', 'Karla', 'Anonymous Pro', 'Space Mono',
]);

const EXTERNAL_FONT_SOURCES = {
  'Cabinet Grotesk': 'https://www.fontshare.com/fonts/cabinet-grotesk',
  'Clash Display': 'https://www.fontshare.com/fonts/clash-display',
  'Satoshi': 'https://www.fontshare.com/fonts/satoshi',
  'Geist': 'https://vercel.com/font',
  'Geist Mono': 'https://vercel.com/font',
};

function buildGoogleFontsUrl(fonts) {
  // fonts: array of { family, weights, variable }
  const googleFonts = fonts.filter(f => GOOGLE_FONTS_REGISTRY.has(f.family));
  if (googleFonts.length === 0) return null;

  const families = googleFonts.map(f => {
    const name = f.family.replace(/ /g, '+');
    if (f.variable) {
      const minW = Math.min(...f.weights);
      const maxW = Math.max(...f.weights);
      // Variable fonts use ital,wght axes — we include regular only (no italic axis here)
      return `family=${name}:wght@${minW}..${maxW}`;
    }
    const wgts = [...f.weights].sort((a, b) => a - b).join(';');
    return `family=${name}:wght@${wgts}`;
  });

  return `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`;
}

// ---------------------------------------------------------------------------
// NexusTypographyEngine
// ---------------------------------------------------------------------------

class NexusTypographyEngine {
  constructor() {
    this.strategies = FONT_STRATEGIES;
    this.fluidScale = FLUID_SCALE;
    this.headingTokens = HEADING_TOKENS;
  }

  // -------------------------------------------------------------------------
  // Public: generate()
  // -------------------------------------------------------------------------

  /**
   * Main entry point. Returns a full typography system for a given brand archetype.
   *
   * @param {Object} options
   * @param {string} options.archetype  - Brand archetype key (e.g. 'hero', 'sage', 'creator')
   * @param {string} [options.brandName] - Brand name (used in CSS comment header)
   * @param {string} [options.businessType] - Business vertical (informational)
   * @param {string} [options.mood] - Override mood string
   * @param {boolean} [options.useAltDisplay] - Use the alternate display font when available
   * @returns {{ css: string, imports: string, tokens: Object, fontFamilies: Object }}
   */
  generate(options = {}) {
    const archetype = (options.archetype || 'creator').toLowerCase().trim();
    const strategy = this.getFontStrategy(archetype, options.useAltDisplay);

    if (!strategy) {
      throw new Error(
        `Unknown archetype "${archetype}". Available: ${this.listArchetypes().join(', ')}`
      );
    }

    const tokens = this.generateTokens(strategy);
    const imports = this.generateFontImports(strategy);
    const css = this.generateCSS(strategy, {
      brandName: options.brandName || 'Brand',
      businessType: options.businessType || '',
      mood: options.mood || strategy.mood,
      archetype,
    });

    return {
      css,
      imports,
      tokens,
      fontFamilies: {
        display: `"${strategy.display.family}", ${strategy.display.fallback}`,
        body: `"${strategy.body.family}", ${strategy.body.fallback}`,
        accent: `"${strategy.accent.family}", ${strategy.accent.fallback}`,
      },
    };
  }

  // -------------------------------------------------------------------------
  // Public: getFontStrategy()
  // -------------------------------------------------------------------------

  /**
   * Returns the font strategy object for a given archetype.
   *
   * @param {string} archetype
   * @param {boolean} [useAlt=false] - Swap display font with displayAlt if available
   * @returns {Object|null}
   */
  getFontStrategy(archetype, useAlt = false) {
    const key = (archetype || '').toLowerCase().trim();
    const base = this.strategies[key];
    if (!base) return null;

    const strategy = { ...base };
    if (useAlt && strategy.displayAlt) {
      strategy.display = strategy.displayAlt;
    }
    return strategy;
  }

  // -------------------------------------------------------------------------
  // Public: generateFluidScale()
  // -------------------------------------------------------------------------

  /**
   * Returns CSS custom properties for the fluid type scale.
   *
   * @param {Object} [options]
   * @param {Object} [options.overrides] - Override individual scale entries { h1: { min, preferred, max } }
   * @returns {string} CSS custom property declarations (without :root wrapper)
   */
  generateFluidScale(options = {}) {
    const scale = { ...this.fluidScale, ...(options.overrides || {}) };
    const lines = [];

    for (const [level, def] of Object.entries(scale)) {
      const varName = `--font-size-${level}`;
      lines.push(`  ${varName}: clamp(${def.min}, ${def.preferred}, ${def.max});`);
    }

    return lines.join('\n');
  }

  // -------------------------------------------------------------------------
  // Public: generateFontImports()
  // -------------------------------------------------------------------------

  /**
   * Generates HTML <link> tags for Google Fonts and comments for external fonts.
   *
   * @param {Object} fontStrategy
   * @returns {string} HTML string with <link> and <!-- comment --> tags
   */
  generateFontImports(fontStrategy) {
    const fontsToLoad = [
      { family: fontStrategy.display.family, weights: fontStrategy.display.weights, variable: fontStrategy.display.variable },
      { family: fontStrategy.body.family, weights: fontStrategy.body.weights, variable: fontStrategy.body.variable },
      { family: fontStrategy.accent.family, weights: fontStrategy.accent.weights, variable: fontStrategy.accent.variable },
    ];

    // Deduplicate by family name
    const seen = new Set();
    const unique = fontsToLoad.filter(f => {
      if (seen.has(f.family)) return false;
      seen.add(f.family);
      return true;
    });

    const parts = [];

    // Google Fonts link
    const googleUrl = buildGoogleFontsUrl(unique);
    if (googleUrl) {
      parts.push(`<link rel="preconnect" href="https://fonts.googleapis.com">`);
      parts.push(`<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`);
      parts.push(`<link rel="stylesheet" href="${googleUrl}">`);
    }

    // External font notes
    for (const font of unique) {
      if (EXTERNAL_FONT_SOURCES[font.family]) {
        parts.push(`<!-- ${font.family}: Download from ${EXTERNAL_FONT_SOURCES[font.family]} -->`);
      }
    }

    return parts.join('\n');
  }

  // -------------------------------------------------------------------------
  // Public: generateCSS()
  // -------------------------------------------------------------------------

  /**
   * Generates the complete CSS for the typography system.
   *
   * @param {Object} fontStrategy
   * @param {Object} [meta] - { brandName, businessType, mood, archetype }
   * @returns {string}
   */
  generateCSS(fontStrategy, meta = {}) {
    const displayFamily = `"${fontStrategy.display.family}", ${fontStrategy.display.fallback}`;
    const bodyFamily = `"${fontStrategy.body.family}", ${fontStrategy.body.fallback}`;
    const accentFamily = `"${fontStrategy.accent.family}", ${fontStrategy.accent.fallback}`;

    const brandName = meta.brandName || 'Brand';
    const archetype = meta.archetype || 'custom';
    const mood = meta.mood || '';
    const businessType = meta.businessType || '';

    // Build Google Fonts @import for CSS-only usage
    const fontsToLoad = [
      { family: fontStrategy.display.family, weights: fontStrategy.display.weights, variable: fontStrategy.display.variable },
      { family: fontStrategy.body.family, weights: fontStrategy.body.weights, variable: fontStrategy.body.variable },
      { family: fontStrategy.accent.family, weights: fontStrategy.accent.weights, variable: fontStrategy.accent.variable },
    ];
    const seen = new Set();
    const unique = fontsToLoad.filter(f => {
      if (seen.has(f.family)) return false;
      seen.add(f.family);
      return true;
    });
    const googleUrl = buildGoogleFontsUrl(unique);

    const lines = [];

    // -- Header
    lines.push(`/* ==========================================================================`);
    lines.push(`   NEXUS Typography System`);
    lines.push(`   Brand: ${brandName}`);
    lines.push(`   Archetype: ${archetype}${businessType ? ` | ${businessType}` : ''}`);
    lines.push(`   Mood: ${mood}`);
    lines.push(`   Generated by NexusTypographyEngine`);
    lines.push(`   ========================================================================== */`);
    lines.push('');

    // -- @import for Google Fonts
    if (googleUrl) {
      lines.push(`@import url('${googleUrl}');`);
      lines.push('');
    }

    // -- External font notes
    for (const font of unique) {
      if (EXTERNAL_FONT_SOURCES[font.family]) {
        lines.push(`/* ${font.family} — not on Google Fonts.`);
        lines.push(`   Download: ${EXTERNAL_FONT_SOURCES[font.family]}`);
        lines.push(`   Add @font-face declarations below after downloading. */`);
        lines.push('');
      }
    }

    // -- :root custom properties
    lines.push(`:root {`);
    lines.push(`  /* Font Families */`);
    lines.push(`  --font-display: ${displayFamily};`);
    lines.push(`  --font-body: ${bodyFamily};`);
    lines.push(`  --font-accent: ${accentFamily};`);
    lines.push('');
    lines.push(`  /* Fluid Type Scale */`);
    lines.push(this.generateFluidScale());
    lines.push('');
    lines.push(`  /* Heading Weights */`);
    for (const [level, tok] of Object.entries(HEADING_TOKENS)) {
      lines.push(`  --font-weight-${level}: ${tok.weight};`);
    }
    lines.push('');
    lines.push(`  /* Heading Letter Spacing */`);
    for (const [level, tok] of Object.entries(HEADING_TOKENS)) {
      lines.push(`  --letter-spacing-${level}: ${tok.letterSpacing};`);
    }
    lines.push('');
    lines.push(`  /* Heading Line Heights */`);
    for (const [level, tok] of Object.entries(HEADING_TOKENS)) {
      lines.push(`  --line-height-${level}: ${tok.lineHeight};`);
    }
    lines.push('');
    lines.push(`  /* Body & Utility Tokens */`);
    lines.push(`  --font-weight-body: 400;`);
    lines.push(`  --font-weight-body-medium: 500;`);
    lines.push(`  --font-weight-body-bold: 700;`);
    lines.push(`  --line-height-body: 1.6;`);
    lines.push(`  --line-height-tight: 1.3;`);
    lines.push(`  --line-height-relaxed: 1.75;`);
    lines.push(`  --letter-spacing-body: 0em;`);
    lines.push(`  --letter-spacing-wide: 0.08em;`);
    lines.push(`  --letter-spacing-wider: 0.12em;`);
    lines.push(`  --paragraph-spacing: 1.5em;`);
    lines.push(`  --max-line-length: 68ch;`);
    lines.push(`}`);
    lines.push('');

    // -- Base reset
    lines.push(`/* Base Reset & Defaults */`);
    lines.push(`*, *::before, *::after { box-sizing: border-box; }`);
    lines.push('');
    lines.push(`html {`);
    lines.push(`  -webkit-font-smoothing: antialiased;`);
    lines.push(`  -moz-osx-font-smoothing: grayscale;`);
    lines.push(`  text-rendering: optimizeLegibility;`);
    lines.push(`  font-size: 100%;`);
    lines.push(`}`);
    lines.push('');

    lines.push(`body {`);
    lines.push(`  font-family: var(--font-body);`);
    lines.push(`  font-size: var(--font-size-body);`);
    lines.push(`  font-weight: var(--font-weight-body);`);
    lines.push(`  line-height: var(--line-height-body);`);
    lines.push(`  letter-spacing: var(--letter-spacing-body);`);
    lines.push(`  color: inherit;`);
    lines.push(`}`);
    lines.push('');

    // -- Headings
    lines.push(`/* Headings */`);
    for (const level of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']) {
      const tok = HEADING_TOKENS[level];
      lines.push(`${level} {`);
      lines.push(`  font-family: var(--font-display);`);
      lines.push(`  font-size: var(--font-size-${level});`);
      lines.push(`  font-weight: var(--font-weight-${level});`);
      lines.push(`  line-height: var(--line-height-${level});`);
      lines.push(`  letter-spacing: var(--letter-spacing-${level});`);
      if (tok.textTransform !== 'none') {
        lines.push(`  text-transform: ${tok.textTransform};`);
      }
      lines.push(`  margin-top: 0;`);
      lines.push(`  margin-bottom: 0.5em;`);
      lines.push(`  text-wrap: balance;`);
      lines.push(`}`);
      lines.push('');
    }

    // -- Paragraph & prose
    lines.push(`/* Paragraph & Prose */`);
    lines.push(`p {`);
    lines.push(`  margin-top: 0;`);
    lines.push(`  margin-bottom: var(--paragraph-spacing);`);
    lines.push(`  max-width: var(--max-line-length);`);
    lines.push(`}`);
    lines.push('');

    lines.push(`p + p {`);
    lines.push(`  margin-top: 0;`);
    lines.push(`}`);
    lines.push('');

    lines.push(`strong, b {`);
    lines.push(`  font-weight: var(--font-weight-body-bold);`);
    lines.push(`}`);
    lines.push('');

    lines.push(`small {`);
    lines.push(`  font-size: var(--font-size-small);`);
    lines.push(`}`);
    lines.push('');

    // -- Links
    lines.push(`/* Links */`);
    lines.push(`a {`);
    lines.push(`  color: inherit;`);
    lines.push(`  text-decoration-thickness: 1px;`);
    lines.push(`  text-underline-offset: 0.15em;`);
    lines.push(`  transition: color 0.2s ease, text-decoration-color 0.2s ease;`);
    lines.push(`}`);
    lines.push('');

    // -- Code / Accent font
    lines.push(`/* Code & Accent Font */`);
    lines.push(`code, kbd, samp, pre {`);
    lines.push(`  font-family: var(--font-accent);`);
    lines.push(`  font-size: 0.9em;`);
    lines.push(`}`);
    lines.push('');

    lines.push(`pre {`);
    lines.push(`  overflow-x: auto;`);
    lines.push(`  padding: 1.5em;`);
    lines.push(`  border-radius: 0.5em;`);
    lines.push(`  line-height: 1.5;`);
    lines.push(`}`);
    lines.push('');

    // -- Utility Classes
    lines.push(`/* =============================================`);
    lines.push(`   Utility Classes`);
    lines.push(`   ============================================= */`);
    lines.push('');

    lines.push(`.text-display {`);
    lines.push(`  font-family: var(--font-display);`);
    lines.push(`  font-size: var(--font-size-h1);`);
    lines.push(`  font-weight: 900;`);
    lines.push(`  line-height: 1.05;`);
    lines.push(`  letter-spacing: -0.03em;`);
    lines.push(`  text-wrap: balance;`);
    lines.push(`}`);
    lines.push('');

    lines.push(`.text-overline {`);
    lines.push(`  font-family: var(--font-accent);`);
    lines.push(`  font-size: var(--font-size-overline);`);
    lines.push(`  font-weight: 600;`);
    lines.push(`  letter-spacing: var(--letter-spacing-wider);`);
    lines.push(`  line-height: 1.4;`);
    lines.push(`  text-transform: uppercase;`);
    lines.push(`}`);
    lines.push('');

    lines.push(`.text-caption {`);
    lines.push(`  font-family: var(--font-body);`);
    lines.push(`  font-size: var(--font-size-caption);`);
    lines.push(`  font-weight: 400;`);
    lines.push(`  line-height: 1.4;`);
    lines.push(`  letter-spacing: 0.01em;`);
    lines.push(`}`);
    lines.push('');

    lines.push(`.text-label {`);
    lines.push(`  font-family: var(--font-body);`);
    lines.push(`  font-size: var(--font-size-label);`);
    lines.push(`  font-weight: 500;`);
    lines.push(`  line-height: 1.3;`);
    lines.push(`  letter-spacing: 0.02em;`);
    lines.push(`}`);
    lines.push('');

    lines.push(`.text-body-large {`);
    lines.push(`  font-size: clamp(1.0625rem, 0.6vw + 0.9375rem, 1.25rem);`);
    lines.push(`  line-height: 1.65;`);
    lines.push(`}`);
    lines.push('');

    lines.push(`.text-body-small {`);
    lines.push(`  font-size: var(--font-size-small);`);
    lines.push(`  line-height: 1.55;`);
    lines.push(`}`);
    lines.push('');

    lines.push(`.text-accent {`);
    lines.push(`  font-family: var(--font-accent);`);
    lines.push(`}`);
    lines.push('');

    lines.push(`.text-balance {`);
    lines.push(`  text-wrap: balance;`);
    lines.push(`}`);
    lines.push('');

    lines.push(`.text-pretty {`);
    lines.push(`  text-wrap: pretty;`);
    lines.push(`}`);
    lines.push('');

    lines.push(`.measure {`);
    lines.push(`  max-width: var(--max-line-length);`);
    lines.push(`}`);
    lines.push('');

    lines.push(`.measure-narrow {`);
    lines.push(`  max-width: 45ch;`);
    lines.push(`}`);
    lines.push('');

    lines.push(`.measure-wide {`);
    lines.push(`  max-width: 85ch;`);
    lines.push(`}`);
    lines.push('');

    // -- Responsive Adjustments
    lines.push(`/* =============================================`);
    lines.push(`   Responsive Adjustments`);
    lines.push(`   ============================================= */`);
    lines.push('');

    lines.push(`@media (max-width: 640px) {`);
    lines.push(`  h1 { letter-spacing: -0.02em; }`);
    lines.push(`  h2 { letter-spacing: -0.01em; }`);
    lines.push(`  h3 { letter-spacing: 0; }`);
    lines.push('');
    lines.push(`  .text-display {`);
    lines.push(`    letter-spacing: -0.02em;`);
    lines.push(`  }`);
    lines.push('');
    lines.push(`  .text-overline {`);
    lines.push(`    letter-spacing: var(--letter-spacing-wide);`);
    lines.push(`  }`);
    lines.push(`}`);
    lines.push('');

    lines.push(`@media (min-width: 1440px) {`);
    lines.push(`  :root {`);
    lines.push(`    --max-line-length: 72ch;`);
    lines.push(`  }`);
    lines.push(`}`);
    lines.push('');

    // -- Print styles
    lines.push(`/* Print */`);
    lines.push(`@media print {`);
    lines.push(`  body {`);
    lines.push(`    font-size: 12pt;`);
    lines.push(`    line-height: 1.5;`);
    lines.push(`  }`);
    lines.push('');
    lines.push(`  h1 { font-size: 24pt; }`);
    lines.push(`  h2 { font-size: 18pt; }`);
    lines.push(`  h3 { font-size: 14pt; }`);
    lines.push(`  h4, h5, h6 { font-size: 12pt; }`);
    lines.push(`}`);

    return lines.join('\n');
  }

  // -------------------------------------------------------------------------
  // Public: generateTokens()
  // -------------------------------------------------------------------------

  /**
   * Returns a structured tokens object (useful for JS/TS theme systems, Tailwind config, etc.)
   *
   * @param {Object} fontStrategy
   * @returns {Object}
   */
  generateTokens(fontStrategy) {
    const displayFamily = `"${fontStrategy.display.family}", ${fontStrategy.display.fallback}`;
    const bodyFamily = `"${fontStrategy.body.family}", ${fontStrategy.body.fallback}`;
    const accentFamily = `"${fontStrategy.accent.family}", ${fontStrategy.accent.fallback}`;

    const fontSize = {};
    for (const [level, def] of Object.entries(FLUID_SCALE)) {
      fontSize[level] = `clamp(${def.min}, ${def.preferred}, ${def.max})`;
    }

    const fontWeight = {
      body: 400,
      'body-medium': 500,
      'body-bold': 700,
    };
    const letterSpacing = { body: '0em', wide: '0.08em', wider: '0.12em' };
    const lineHeight = { body: 1.6, tight: 1.3, relaxed: 1.75 };

    for (const [level, tok] of Object.entries(HEADING_TOKENS)) {
      fontWeight[level] = tok.weight;
      letterSpacing[level] = tok.letterSpacing;
      lineHeight[level] = tok.lineHeight;
    }

    return {
      fontFamily: {
        display: displayFamily,
        body: bodyFamily,
        accent: accentFamily,
      },
      fontSize,
      fontWeight,
      letterSpacing,
      lineHeight,
      textTransform: Object.fromEntries(
        Object.entries(HEADING_TOKENS).map(([k, v]) => [k, v.textTransform])
      ),
      spacing: {
        paragraph: '1.5em',
        maxLineLength: '68ch',
      },
    };
  }

  // -------------------------------------------------------------------------
  // Utility
  // -------------------------------------------------------------------------

  /**
   * List unique archetype names (de-duplicated from alias keys).
   * @returns {string[]}
   */
  listArchetypes() {
    const unique = new Set();
    for (const key of Object.keys(this.strategies)) {
      unique.add(key);
    }
    return [...unique].sort();
  }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function runCLI() {
  const args = process.argv.slice(2);

  function getArg(name) {
    const idx = args.indexOf(`--${name}`);
    if (idx === -1 || idx + 1 >= args.length) return null;
    return args[idx + 1];
  }

  const hasFlag = (name) => args.includes(`--${name}`);

  if (hasFlag('help') || args.length === 0) {
    console.log(`
NEXUS Typography Engine
=======================

Usage:
  node nexus-typography-engine.js --archetype <name> [options]

Options:
  --archetype <name>   Brand archetype (required). One of:
                        hero, ruler, sage, trustworthy, creator, innovative,
                        caregiver, friendly, rebel, bold, magician, premium,
                        explorer, adventurous, everyman, accessible, lover,
                        elegant, jester, playful, innocent, clean
  --business <type>    Business type (e.g. fintech, saas, ecommerce)
  --brand <name>       Brand name for the CSS header
  --alt                Use alternate display font (when available)
  --tokens             Output tokens JSON instead of CSS
  --imports            Output only the HTML font imports
  --list               List all available archetypes
  --help               Show this help message

Examples:
  node nexus-typography-engine.js --archetype hero --business fintech
  node nexus-typography-engine.js --archetype sage --brand "Owl Labs" --tokens
  node nexus-typography-engine.js --archetype rebel --alt
  node nexus-typography-engine.js --list
`);
    process.exit(0);
  }

  const engine = new NexusTypographyEngine();

  if (hasFlag('list')) {
    console.log('Available archetypes:');
    const archetypes = engine.listArchetypes();
    for (const a of archetypes) {
      const s = engine.getFontStrategy(a);
      console.log(`  ${a.padEnd(16)} ${s.label} — ${s.display.family} / ${s.body.family} / ${s.accent.family}`);
    }
    process.exit(0);
  }

  const archetype = getArg('archetype');
  if (!archetype) {
    console.error('Error: --archetype is required. Use --help for usage.');
    process.exit(1);
  }

  const options = {
    archetype,
    brandName: getArg('brand') || undefined,
    businessType: getArg('business') || undefined,
    useAltDisplay: hasFlag('alt'),
  };

  let result;
  try {
    result = engine.generate(options);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }

  if (hasFlag('tokens')) {
    console.log(JSON.stringify(result.tokens, null, 2));
  } else if (hasFlag('imports')) {
    console.log(result.imports);
  } else {
    // Full output: imports comment + CSS
    console.log(`/* Font Imports (add to <head>):\n${result.imports}\n*/\n`);
    console.log(result.css);
  }
}

// ---------------------------------------------------------------------------
// Export & CLI entry
// ---------------------------------------------------------------------------

module.exports = NexusTypographyEngine;

if (require.main === module) {
  runCLI();
}
