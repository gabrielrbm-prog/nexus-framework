#!/usr/bin/env node
/**
 * NEXUS Code Agent v2 — Production Landing Page Generator
 *
 * Generates single-file HTML landing pages with 16 premium effects from the
 * Nexus Premium Components Library. All CSS/JS is inlined; only CDN libs
 * (Three.js, GSAP) are loaded externally.
 *
 * Usage:  node nexus-code-agent-v2.js <path-to-context-dna.json>
 *
 * Reads:  context-dna.json  (required)
 *         design-system.json (optional)
 *         creative-brief.json (optional)
 *
 * Output: projects/<name>/output/index.html
 *         generated-site/index.html
 */

const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────
// Component Selection Profiles
// ─────────────────────────────────────────────────────────────

const ALWAYS_ON = [
  'threejs-wireframe',
  'gsap-scroll-reveal',
  'magicui-floating-particles',
  'magicui-wave-dividers',
  'apple-glass-buttons',
  'magicui-gradient-text',
  'aceternity-meteors',
  'aceternity-flip-words'
];

const BUSINESS_COMPONENTS = {
  fintech:    ['gsap-counter', 'fintech-trust-cards', 'fintech-pricing-cards', 'aceternity-moving-borders'],
  trading:    ['gsap-counter', 'fintech-trust-cards', 'fintech-pricing-cards', 'aceternity-moving-borders'],
  saas:       ['aceternity-3d-cards', 'aceternity-flip-words', 'fintech-pricing-cards', 'magicui-border-beam'],
  ecommerce:  ['aceternity-3d-cards', 'aceternity-moving-borders', 'fintech-trust-cards', 'magicui-border-beam'],
  healthcare: ['aceternity-glowing-stars', 'fintech-trust-cards', 'aceternity-3d-cards', 'magicui-border-beam'],
  education:  ['gsap-counter', 'fintech-trust-cards', 'fintech-pricing-cards', 'aceternity-3d-cards'],
  agency:     ['aceternity-3d-cards', 'magicui-border-beam', 'aceternity-glowing-stars', 'aceternity-moving-borders'],
  default:    [
    'gsap-counter', 'gsap-typewriter', 'aceternity-3d-cards', 'aceternity-glowing-stars',
    'aceternity-moving-borders', 'magicui-border-beam', 'fintech-trust-cards', 'fintech-pricing-cards'
  ]
};

// ─────────────────────────────────────────────────────────────
// Default color mappings for CSS variables
// ─────────────────────────────────────────────────────────────

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
// NexusCodeAgentV2 Class
// ─────────────────────────────────────────────────────────────

class NexusCodeAgentV2 {

  constructor(contextDnaPath) {
    this.contextDnaPath = path.resolve(contextDnaPath);
    this.projectDir = path.dirname(this.contextDnaPath);
    this.contextDna = {};
    this.designSystem = {};
    this.creativeBrief = {};
    this.activeComponents = [];
    this.cssBlocks = [];
    this.htmlSections = [];
    this.inlineJsBlocks = [];
    this.moduleJsBlocks = [];
    this.colors = { ...DEFAULT_COLORS };
  }

  // ── File I/O helpers ──────────────────────────────────────

  _readJSON(filePath) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch {
      return null;
    }
  }

  _ensureDir(dir) {
    fs.mkdirSync(dir, { recursive: true });
  }

  _writeFile(filePath, content) {
    this._ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`  [write] ${filePath} (${(Buffer.byteLength(content) / 1024).toFixed(1)} KB)`);
  }

  // ── Load inputs ───────────────────────────────────────────

  loadInputs() {
    console.log('\n[1/6] Loading inputs...');
    this.contextDna = this._readJSON(this.contextDnaPath);
    if (!this.contextDna) {
      throw new Error(`Cannot read context-dna.json at ${this.contextDnaPath}`);
    }
    console.log(`  context-dna.json loaded — ${this.contextDna.businessName || 'unnamed'}`);

    const dsPath = path.join(this.projectDir, 'design-system.json');
    this.designSystem = this._readJSON(dsPath) || {};
    if (Object.keys(this.designSystem).length) {
      console.log('  design-system.json loaded');
    }

    const cbPath = path.join(this.projectDir, 'creative-brief.json');
    this.creativeBrief = this._readJSON(cbPath) || {};
    if (Object.keys(this.creativeBrief).length) {
      console.log('  creative-brief.json loaded');
    }
  }

  // ── Resolve colors from design system ─────────────────────

  resolveColors() {
    const ds = this.designSystem;
    const palette = ds.colorPalette || ds.colors || {};
    if (palette.primary)   this.colors['--blue']   = palette.primary;
    if (palette.secondary) this.colors['--cyan']   = palette.secondary;
    if (palette.accent)    this.colors['--purple']  = palette.accent;
    if (palette.highlight) this.colors['--pink']    = palette.highlight;
    if (palette.background) this.colors['--bg']     = palette.background;
    if (palette.text)      this.colors['--text']    = palette.text;
    if (palette.textDim)   this.colors['--text-dim'] = palette.textDim;
  }

  // ── Select components ─────────────────────────────────────

  selectComponents() {
    console.log('\n[2/6] Selecting components...');
    const btype = (this.contextDna.businessType || 'default').toLowerCase();
    const extras = BUSINESS_COMPONENTS[btype] || BUSINESS_COMPONENTS.default;
    const set = new Set([...ALWAYS_ON, ...extras]);
    this.activeComponents = [...set];
    console.log(`  Business type: ${btype}`);
    console.log(`  Active components (${this.activeComponents.length}): ${this.activeComponents.join(', ')}`);
  }

  // ── Convenience accessors into context-dna ────────────────

  get dna() { return this.contextDna; }
  get brief() { return this.creativeBrief; }

  _txt(field, fallback = '') {
    // Try context DNA → creative brief → fallback
    return this.dna[field] || this.brief[field] || fallback;
  }

  _arr(field, fallback = []) {
    const v = this.dna[field] || this.brief[field];
    return Array.isArray(v) ? v : fallback;
  }

  // ── Build the page ────────────────────────────────────────

  buildPage() {
    console.log('\n[3/6] Building page sections...');
    this.resolveColors();

    // Derive content
    const businessName = this._txt('businessName', 'Business');
    const tagline      = this._txt('tagline', this._txt('headline', 'Transform Your Business'));
    const subtitle     = this._txt('subtitle', this._txt('subheadline', 'Premium solutions for modern professionals'));
    const ctaText      = this._txt('ctaPrimary', this._txt('cta', 'Get Started'));
    const ctaUrl       = this._txt('ctaUrl', '#pricing');
    const ctaSecondary = this._txt('ctaSecondary', 'Learn More');
    const ctaSecondaryUrl = this._txt('ctaSecondaryUrl', '#method');
    const description  = this._txt('description', this._txt('metaDescription', subtitle));
    const benefits     = this._arr('benefits', this._arr('features', ['Premium Quality', 'Expert Support', 'Proven Results']));
    const stats        = this._arr('stats', [
      { value: '1,000+', label: 'Clients Served' },
      { value: '98%', label: 'Satisfaction Rate' },
      { value: '5/5', label: 'Average Rating' },
      { value: '24/7', label: 'Support' }
    ]);
    const features = this._arr('features', this._arr('benefits', []));
    const testimonials = this._arr('testimonials', [
      { name: 'John S.', role: 'CEO', text: 'Absolutely transformed our business. The results speak for themselves.' },
      { name: 'Maria L.', role: 'Director', text: 'Professional, efficient, and truly premium. Highly recommended.' },
      { name: 'Carlos R.', role: 'Founder', text: 'The best investment we made this year. Outstanding service.' }
    ]);
    const pricingPlans = this._arr('pricingPlans', this._arr('pricing', []));
    const flipWords    = this._arr('flipWords', this._arr('keywords', ['Professional', 'Premium', 'Powerful', 'Proven']));
    const footerText   = this._txt('footerText', `© ${new Date().getFullYear()} ${businessName}. All rights reserved.`);
    const navLinks     = this._arr('navLinks', [
      { label: 'Method', href: '#method' },
      { label: 'Results', href: '#stats' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Testimonials', href: '#testimonials' }
    ]);
    const socialProof = this._txt('socialProof', '');
    const language    = this._txt('language', 'en');
    const ogImage     = this._txt('ogImage', '');

    // ── Assemble sections ──────────────────────────────────

    // -- HERO SECTION --
    const flipWordsHtml = this._has('aceternity-flip-words') ? `
              <span class="flip-words-wrapper">
                <span class="flip-words-inner">
                  <span class="flip-word">${flipWords[0] || 'Professional'}</span>
                  <span class="flip-word">${flipWords[1] || 'Premium'}</span>
                  <span class="flip-word">${flipWords[2] || 'Powerful'}</span>
                  <span class="flip-word">${flipWords[3] || 'Proven'}</span>
                  <span class="flip-word">${flipWords[0] || 'Professional'}</span>
                </span>
              </span>` : '';

    const heroHtml = `
    <!-- HERO -->
    <section id="hero" class="section hero-section">
      ${this._has('aceternity-meteors') ? '<div class="meteors-container"><div class="meteor"></div><div class="meteor"></div><div class="meteor"></div><div class="meteor"></div><div class="meteor"></div><div class="meteor"></div><div class="meteor"></div><div class="meteor"></div><div class="meteor"></div><div class="meteor"></div></div>' : ''}
      <div class="container hero-content">
        ${socialProof ? `<div class="hero-badge gsap-reveal"><span class="hero-badge-dot"></span>${this._escHtml(socialProof)}</div>` : ''}
        <h1 class="hero-title gsap-reveal">
          ${this._escHtml(tagline)}${flipWordsHtml ? `<br>${flipWordsHtml}` : ''}
        </h1>
        <p class="hero-subtitle gsap-reveal">${this._escHtml(subtitle)}</p>
        <div class="hero-buttons gsap-reveal">
          <a href="${ctaUrl}" class="magnetic-area">
            <span class="glass-btn glass-btn-primary">
              ${this._escHtml(ctaText)}
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
            </span>
          </a>
          <a href="${ctaSecondaryUrl}" class="magnetic-area">
            <span class="glass-btn glass-btn-secondary">
              ${this._escHtml(ctaSecondary)}
            </span>
          </a>
        </div>
      </div>
    </section>`;

    // -- WAVE DIVIDER HELPER --
    let waveIdx = 0;
    const waveDivider = () => {
      waveIdx++;
      return `
    <div class="wave-divider">
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
        <defs>
          <linearGradient id="waveGrad${waveIdx}" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:rgba(59,130,246,0.1)"/>
            <stop offset="50%" style="stop-color:rgba(139,92,246,0.08)"/>
            <stop offset="100%" style="stop-color:rgba(34,211,238,0.1)"/>
          </linearGradient>
        </defs>
        <path fill="url(#waveGrad${waveIdx})">
          <animate attributeName="d"
            values="M0,40 C360,80 720,0 1080,40 C1260,60 1380,30 1440,40 L1440,80 L0,80 Z;M0,50 C360,10 720,70 1080,30 C1260,10 1380,50 1440,40 L1440,80 L0,80 Z;M0,40 C360,80 720,0 1080,40 C1260,60 1380,30 1440,40 L1440,80 L0,80 Z"
            dur="8s" repeatCount="indefinite"/>
        </path>
      </svg>
    </div>`;
    };

    // -- STATS / TRUST SECTION --
    const statsArr = stats.length >= 4 ? stats : [...stats, ...Array(4 - stats.length).fill({ value: '-', label: '-' })];
    const statsHtml = `
    <!-- STATS -->
    <section id="stats" class="section">
      <div class="container">
        <div class="section-header gsap-reveal">
          <span class="section-label">Results</span>
          <h2 class="section-title"><span class="gradient-text">Proven Track Record</span></h2>
          <p class="section-desc">${this._escHtml(this._txt('statsDescription', 'Numbers that demonstrate our commitment to excellence'))}</p>
        </div>
        <div class="stats-grid">
          ${statsArr.slice(0, 4).map((s, i) => `
          <div class="stat-card gsap-reveal">
            <div class="stat-shimmer"></div>
            <div class="stat-number" data-count="${this._escAttr(String(s.value || s.number || '0').replace(/[^0-9.]/g, ''))}" data-prefix="${this._escAttr(String(s.value || s.number || '').replace(/[0-9.,]+.*/, ''))}" data-suffix="${this._escAttr(String(s.value || s.number || '').replace(/.*?[0-9.,]+/, ''))}">${this._escHtml(String(s.value || s.number || '0'))}</div>
            <div class="stat-label">${this._escHtml(s.label || s.description || '')}</div>
          </div>`).join('')}
        </div>
      </div>
    </section>`;

    // -- FEATURES / METHOD SECTION --
    const featureIcons = ['&#9889;', '&#9881;', '&#127919;', '&#128640;', '&#128161;', '&#128171;', '&#9733;', '&#128296;'];
    const featureColors = [
      { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.2)', tagBg: 'rgba(59,130,246,0.15)', tagColor: 'var(--blue)' },
      { bg: 'rgba(34,211,238,0.15)', border: 'rgba(34,211,238,0.2)', tagBg: 'rgba(34,211,238,0.15)', tagColor: 'var(--cyan)' },
      { bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.2)', tagBg: 'rgba(139,92,246,0.15)', tagColor: 'var(--purple)' },
      { bg: 'rgba(236,72,153,0.15)', border: 'rgba(236,72,153,0.2)', tagBg: 'rgba(236,72,153,0.15)', tagColor: 'var(--pink)' },
      { bg: 'rgba(34,197,94,0.15)',  border: 'rgba(34,197,94,0.2)',  tagBg: 'rgba(34,197,94,0.15)',  tagColor: '#22c55e' },
      { bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.2)', tagBg: 'rgba(249,115,22,0.15)', tagColor: '#f97316' },
    ];

    const featureItems = features.length > 0 ? features : benefits.map((b, i) => {
      if (typeof b === 'string') return { title: b, description: '', tag: `Step ${i + 1}` };
      return b;
    });

    const methodHtml = featureItems.length > 0 ? `
    <!-- METHOD / FEATURES -->
    <section id="method" class="section">
      <div class="container">
        <div class="section-header gsap-reveal">
          <span class="section-label">Method</span>
          <h2 class="section-title"><span class="gradient-text">${this._escHtml(this._txt('featuresTitle', this._txt('methodTitle', 'How It Works')))}</span></h2>
          <p class="section-desc">${this._escHtml(this._txt('featuresSubtitle', this._txt('methodSubtitle', 'Our proven approach delivers consistent results')))}</p>
        </div>
        <div class="method-grid">
          ${featureItems.slice(0, 6).map((f, i) => {
            const c = featureColors[i % featureColors.length];
            const title = typeof f === 'string' ? f : (f.title || f.name || f);
            const desc  = typeof f === 'string' ? '' : (f.description || f.text || '');
            const tag   = typeof f === 'string' ? `Step ${i + 1}` : (f.tag || f.label || `Step ${i + 1}`);
            return `
          <div class="card-3d-wrapper">
            <div class="card-3d">
              <div class="card-3d-glow"></div>
              <div class="card-3d-icon" style="background:${c.bg}; border:1px solid ${c.border};">${featureIcons[i % featureIcons.length]}</div>
              <h3>${this._escHtml(String(title))}</h3>
              <p>${this._escHtml(String(desc))}</p>
              <span class="card-3d-tag" style="background:${c.tagBg}; color:${c.tagColor};">${this._escHtml(String(tag))}</span>
            </div>
          </div>`;
          }).join('')}
        </div>
      </div>
    </section>` : '';

    // -- TESTIMONIALS SECTION --
    const testimonialsHtml = testimonials.length > 0 ? `
    <!-- TESTIMONIALS -->
    <section id="testimonials" class="section">
      ${this._has('aceternity-glowing-stars') ? '<div class="stars-container" id="testimonialsStars"></div>' : ''}
      <div class="container">
        <div class="section-header gsap-reveal">
          <span class="section-label">Testimonials</span>
          <h2 class="section-title"><span class="gradient-text">${this._escHtml(this._txt('testimonialsTitle', 'What Our Clients Say'))}</span></h2>
        </div>
        <div class="testimonials-grid">
          ${testimonials.slice(0, 3).map((t, i) => `
          <div class="moving-border-card testimonial-card-outer gsap-reveal">
            <div class="moving-border"></div>
            <div class="testimonial-card">
              <div class="testimonial-stars">${'&#9733;'.repeat(5)}</div>
              <p class="testimonial-text">"${this._escHtml(t.text || t.content || t.quote || '')}"</p>
              <div class="testimonial-author">
                <div class="testimonial-avatar">${(t.name || 'A')[0].toUpperCase()}</div>
                <div>
                  <div class="testimonial-name">${this._escHtml(t.name || t.author || 'Anonymous')}</div>
                  <div class="testimonial-role">${this._escHtml(t.role || t.title || t.position || '')}</div>
                </div>
              </div>
            </div>
          </div>`).join('')}
        </div>
      </div>
    </section>` : '';

    // -- PRICING SECTION --
    const hasPricing = pricingPlans.length >= 2;
    const defaultPlans = [
      { name: 'Starter', desc: 'For beginners', price: '97', features: ['Core access', 'Email support', 'Basic resources'], cta: 'Get Started' },
      { name: 'Professional', desc: 'Most popular', price: '197', features: ['Everything in Starter', 'Priority support', 'Premium resources', 'Live sessions'], cta: 'Choose Pro', featured: true },
      { name: 'VIP', desc: 'Complete access', price: '397', features: ['Everything in Pro', '1-on-1 mentoring', 'Lifetime access', 'Exclusive community', 'Certificates'], cta: 'Go VIP' }
    ];
    const plans = hasPricing ? pricingPlans : (this._has('fintech-pricing-cards') ? defaultPlans : []);
    const currency = this._txt('currency', this._txt('currencySymbol', 'R$'));
    const period   = this._txt('pricingPeriod', '/mo');
    const securityText = this._txt('securityText', 'Secure payment');

    const pricingHtml = plans.length >= 2 ? `
    <!-- PRICING -->
    <section id="pricing" class="section">
      <div class="container">
        <div class="section-header gsap-reveal">
          <span class="section-label">Pricing</span>
          <h2 class="section-title"><span class="gradient-text">${this._escHtml(this._txt('pricingTitle', 'Choose Your Plan'))}</span></h2>
          <p class="section-desc">${this._escHtml(this._txt('pricingSubtitle', 'Invest in your future with the plan that fits your goals'))}</p>
        </div>
        <div class="pricing-grid">
          ${plans.slice(0, 3).map((p, i) => {
            const isFeatured = p.featured || (plans.length >= 3 && i === 1);
            const feats = Array.isArray(p.features) ? p.features : [];
            return `
          <div class="pricing-card${isFeatured ? ' featured' : ''} gsap-reveal">
            ${isFeatured ? '<div class="moving-border"></div>' : ''}
            ${isFeatured ? `<div class="pricing-badge">${this._escHtml(p.badge || 'Most Popular')}</div>` : ''}
            <div class="pricing-name">${this._escHtml(p.name || p.title || `Plan ${i + 1}`)}</div>
            <div class="pricing-desc">${this._escHtml(p.desc || p.description || '')}</div>
            <div class="pricing-price">
              <span class="pricing-currency">${this._escHtml(currency)}</span>
              <span class="pricing-amount">${this._escHtml(String(p.price || p.amount || '0'))}</span>
              <span class="pricing-period">${this._escHtml(period)}</span>
            </div>
            <ul class="pricing-features">
              ${feats.map(f => `<li><span class="check">&#10003;</span> ${this._escHtml(typeof f === 'string' ? f : (f.text || f.name || ''))}</li>`).join('\n              ')}
            </ul>
            <button class="pricing-btn ${isFeatured ? 'pricing-btn-primary' : 'pricing-btn-outline'}">${this._escHtml(p.cta || p.ctaText || 'Select')}</button>
            <div class="pricing-security">&#128274; ${this._escHtml(securityText)}</div>
          </div>`;
          }).join('')}
        </div>
      </div>
    </section>` : '';

    // -- CTA SECTION --
    const ctaHtml = `
    <!-- CTA -->
    <section id="cta" class="section cta-section">
      <div class="container cta-content">
        <h2 class="section-title gsap-reveal"><span class="gradient-text">${this._escHtml(this._txt('ctaTitle', this._txt('finalCta', 'Ready to Get Started?')))}</span></h2>
        <p class="section-desc gsap-reveal">${this._escHtml(this._txt('ctaSubtitle', this._txt('ctaDescription', "Don't wait. Take the first step today.")))}</p>
        <div class="hero-buttons gsap-reveal">
          <a href="${ctaUrl}" class="magnetic-area">
            <span class="glass-btn glass-btn-primary">
              ${this._escHtml(ctaText)}
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
            </span>
          </a>
        </div>
      </div>
    </section>`;

    // -- NAV --
    const navHtml = `
    <!-- NAV -->
    <nav class="nav-glass" id="navbar">
      <div class="container nav-inner">
        <a href="#" class="nav-logo"><span class="gradient-text">${this._escHtml(businessName)}</span></a>
        <div class="nav-links" id="navLinks">
          ${navLinks.map(l => `<a href="${l.href || '#'}" class="nav-link">${this._escHtml(l.label || l.text || '')}</a>`).join('\n          ')}
        </div>
        <a href="${ctaUrl}" class="glass-btn glass-btn-primary nav-cta">${this._escHtml(ctaText)}</a>
        <button class="nav-hamburger" id="navHamburger" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>`;

    // -- FOOTER --
    const footerHtml = `
    <!-- FOOTER -->
    <footer class="footer">
      <div class="container footer-inner">
        <div class="footer-brand">
          <span class="gradient-text footer-logo">${this._escHtml(businessName)}</span>
          <p class="footer-desc">${this._escHtml(description.substring(0, 160))}</p>
        </div>
        <div class="footer-links">
          ${navLinks.map(l => `<a href="${l.href || '#'}">${this._escHtml(l.label || l.text || '')}</a>`).join('\n          ')}
        </div>
        <div class="footer-bottom">
          <p>${footerText}</p>
        </div>
      </div>
    </footer>`;

    // ── Assemble full HTML ──────────────────────────────────

    const fullHtml = this._renderFullPage({
      language,
      businessName,
      description,
      ogImage,
      navHtml,
      heroHtml,
      statsHtml,
      methodHtml,
      testimonialsHtml,
      pricingHtml,
      ctaHtml,
      footerHtml,
      waveDivider
    });

    return fullHtml;
  }

  // ── Has component check ───────────────────────────────────

  _has(id) {
    return this.activeComponents.includes(id);
  }

  // ── HTML escaping helpers ─────────────────────────────────

  _escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  _escAttr(str) {
    return this._escHtml(str);
  }

  // ── Full Page Renderer ────────────────────────────────────

  _renderFullPage({ language, businessName, description, ogImage, navHtml, heroHtml, statsHtml, methodHtml, testimonialsHtml, pricingHtml, ctaHtml, footerHtml, waveDivider }) {

    const c = this.colors;

    return `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this._escHtml(businessName)} — ${this._escHtml(this._txt('tagline', 'Premium Landing Page'))}</title>
  <meta name="description" content="${this._escAttr(description)}">
  <meta property="og:title" content="${this._escAttr(businessName)}">
  <meta property="og:description" content="${this._escAttr(description)}">
  <meta property="og:type" content="website">
  ${ogImage ? `<meta property="og:image" content="${this._escAttr(ogImage)}">` : ''}
  <meta name="twitter:card" content="summary_large_image">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    /* ═══════════════════════════════════════════════════════
       CSS VARIABLES
    ═══════════════════════════════════════════════════════ */
    :root {
      --bg: ${c['--bg']};
      --bg-card: ${c['--bg-card']};
      --bg-card-hover: ${c['--bg-card-hover']};
      --blue: ${c['--blue']};
      --cyan: ${c['--cyan']};
      --purple: ${c['--purple']};
      --pink: ${c['--pink']};
      --text: ${c['--text']};
      --text-dim: ${c['--text-dim']};
      --text-bright: ${c['--text-bright']};
      --border: ${c['--border']};
      --glow-blue: ${c['--glow-blue']};
      --glow-cyan: ${c['--glow-cyan']};
      --glow-purple: ${c['--glow-purple']};
    }

    /* ═══════════════════════════════════════════════════════
       RESET & BASE
    ═══════════════════════════════════════════════════════ */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
    }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
    .section { position: relative; padding: 100px 0; z-index: 1; }

    /* ═══════════════════════════════════════════════════════
       THREE.JS CANVAS
    ═══════════════════════════════════════════════════════ */
    #three-canvas {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      z-index: 0; pointer-events: none;
    }

    /* ═══════════════════════════════════════════════════════
       NAV — GLASSMORPHISM
    ═══════════════════════════════════════════════════════ */
    .nav-glass {
      position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
      background: rgba(10,10,15,0.7);
      backdrop-filter: saturate(180%) blur(20px);
      -webkit-backdrop-filter: saturate(180%) blur(20px);
      border-bottom: 1px solid var(--border);
      transition: all 0.3s ease;
    }
    .nav-glass.scrolled { background: rgba(10,10,15,0.92); }
    .nav-inner {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 24px; max-width: 1200px; margin: 0 auto;
    }
    .nav-logo { font-size: 22px; font-weight: 800; text-decoration: none; letter-spacing: -0.5px; }
    .nav-links { display: flex; gap: 32px; }
    .nav-link {
      color: var(--text-dim); text-decoration: none; font-size: 14px;
      font-weight: 500; transition: color 0.3s; position: relative;
    }
    .nav-link:hover { color: var(--text-bright); }
    .nav-link::after {
      content: ''; position: absolute; bottom: -4px; left: 0;
      width: 0; height: 2px; background: var(--blue);
      transition: width 0.3s ease;
    }
    .nav-link:hover::after { width: 100%; }
    .nav-cta { padding: 10px 24px !important; font-size: 13px !important; }
    .nav-hamburger {
      display: none; flex-direction: column; gap: 5px; background: none;
      border: none; cursor: pointer; padding: 4px;
    }
    .nav-hamburger span {
      width: 24px; height: 2px; background: var(--text);
      transition: all 0.3s ease; border-radius: 2px;
    }
    .nav-hamburger.active span:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
    .nav-hamburger.active span:nth-child(2) { opacity: 0; }
    .nav-hamburger.active span:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }

    /* ═══════════════════════════════════════════════════════
       SECTION HEADERS
    ═══════════════════════════════════════════════════════ */
    .section-header { text-align: center; margin-bottom: 64px; }
    .section-label {
      display: inline-block; font-size: 13px; font-weight: 600;
      color: var(--blue); letter-spacing: 2px; text-transform: uppercase;
      padding: 6px 20px; border-radius: 50px;
      background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2);
      margin-bottom: 20px;
    }
    .section-title {
      font-size: clamp(32px, 5vw, 48px); font-weight: 800;
      color: var(--text-bright); line-height: 1.2;
      letter-spacing: -1px; margin-bottom: 16px;
    }
    .section-desc {
      font-size: 18px; color: var(--text-dim); max-width: 640px;
      margin: 0 auto; line-height: 1.7;
    }

    /* ═══════════════════════════════════════════════════════
       HERO
    ═══════════════════════════════════════════════════════ */
    .hero-section {
      min-height: 100vh; display: flex; align-items: center;
      justify-content: center; text-align: center; padding-top: 120px;
    }
    .hero-content { position: relative; z-index: 2; }
    .hero-badge {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 8px 20px; border-radius: 50px; font-size: 14px;
      font-weight: 500; color: var(--text-dim);
      background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.15);
      margin-bottom: 32px;
    }
    .hero-badge-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: #22c55e; animation: badgePulse 2s ease-in-out infinite;
    }
    @keyframes badgePulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; box-shadow: 0 0 8px #22c55e; } }
    .hero-title {
      font-size: clamp(36px, 6vw, 64px); font-weight: 900;
      color: var(--text-bright); line-height: 1.15;
      letter-spacing: -2px; margin-bottom: 24px;
    }
    .hero-subtitle {
      font-size: clamp(16px, 2vw, 20px); color: var(--text-dim);
      max-width: 600px; margin: 0 auto 40px; line-height: 1.7;
    }
    .hero-buttons { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }

    /* ═══════════════════════════════════════════════════════
       GRADIENT TEXT
    ═══════════════════════════════════════════════════════ */
    .gradient-text {
      background: linear-gradient(90deg, var(--blue), var(--cyan), var(--purple), var(--pink), var(--blue));
      background-size: 400% 100%;
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text; animation: gradientShift 6s ease infinite;
    }
    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    /* ═══════════════════════════════════════════════════════
       FLIP WORDS
    ═══════════════════════════════════════════════════════ */
    .flip-words-wrapper {
      display: inline-block; position: relative;
      height: 1.15em; overflow: hidden; vertical-align: bottom;
    }
    .flip-words-inner {
      display: flex; flex-direction: column;
      animation: flipWord 10s infinite;
    }
    .flip-word {
      height: 1.15em; display: flex; align-items: center;
      background: linear-gradient(135deg, var(--blue), var(--cyan));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    @keyframes flipWord {
      0%, 18%   { transform: translateY(0); }
      22%, 38%  { transform: translateY(-1.15em); }
      42%, 58%  { transform: translateY(-2.30em); }
      62%, 78%  { transform: translateY(-3.45em); }
      82%, 100% { transform: translateY(-4.60em); }
    }

    /* ═══════════════════════════════════════════════════════
       METEORS
    ═══════════════════════════════════════════════════════ */
    .meteors-container { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
    .meteor {
      position: absolute; width: 150px; height: 1px;
      background: linear-gradient(90deg, rgba(255,255,255,0.6), transparent);
      transform: rotate(-45deg); animation: meteorFall linear infinite;
      opacity: 0; filter: drop-shadow(0 0 4px rgba(255,255,255,0.4));
    }
    .meteor::before {
      content: ''; position: absolute; left: 0; top: -1px;
      width: 4px; height: 3px; border-radius: 50%; background: white;
      box-shadow: 0 0 8px 2px rgba(255,255,255,0.4);
    }
    @keyframes meteorFall {
      0%   { transform: translateX(0) translateY(0) rotate(-45deg); opacity: 0; }
      5%   { opacity: 1; }
      30%  { opacity: 1; }
      100% { transform: translateX(-800px) translateY(800px) rotate(-45deg); opacity: 0; }
    }
    .meteor:nth-child(1)  { top: 5%;  left: 70%; animation-duration: 3s;   animation-delay: 0s;   width: 120px; }
    .meteor:nth-child(2)  { top: 15%; left: 85%; animation-duration: 2.5s; animation-delay: 0.8s; width: 100px; }
    .meteor:nth-child(3)  { top: 8%;  left: 50%; animation-duration: 3.5s; animation-delay: 1.5s; width: 180px; }
    .meteor:nth-child(4)  { top: 25%; left: 90%; animation-duration: 2.8s; animation-delay: 2.2s; width: 90px;  }
    .meteor:nth-child(5)  { top: 2%;  left: 60%; animation-duration: 4s;   animation-delay: 0.4s; width: 140px; }
    .meteor:nth-child(6)  { top: 20%; left: 75%; animation-duration: 3.2s; animation-delay: 3s;   width: 110px; }
    .meteor:nth-child(7)  { top: 12%; left: 95%; animation-duration: 2.6s; animation-delay: 1.8s; width: 160px; }
    .meteor:nth-child(8)  { top: 30%; left: 80%; animation-duration: 3.8s; animation-delay: 2.6s; width: 130px; }
    .meteor:nth-child(9)  { top: -2%; left: 45%; animation-duration: 3.3s; animation-delay: 4s;   width: 100px; }
    .meteor:nth-child(10) { top: 18%; left: 55%; animation-duration: 2.9s; animation-delay: 3.4s; width: 170px; }

    /* ═══════════════════════════════════════════════════════
       FLOATING PARTICLES
    ═══════════════════════════════════════════════════════ */
    .floating-particle {
      position: fixed; border-radius: 50%; pointer-events: none;
      z-index: 0; animation: particleFloat linear infinite;
    }
    @keyframes particleFloat {
      0%   { transform: translateY(100vh) scale(0); opacity: 0; }
      10%  { opacity: 1; }
      90%  { opacity: 1; }
      100% { transform: translateY(-100vh) scale(1); opacity: 0; }
    }

    /* ═══════════════════════════════════════════════════════
       WAVE DIVIDERS
    ═══════════════════════════════════════════════════════ */
    .wave-divider { position: relative; z-index: 1; height: 80px; overflow: hidden; }
    .wave-divider svg { position: absolute; bottom: 0; width: 100%; height: 80px; }

    /* ═══════════════════════════════════════════════════════
       GLASS BUTTONS
    ═══════════════════════════════════════════════════════ */
    .glass-btn {
      position: relative; display: inline-flex; align-items: center; gap: 10px;
      padding: 16px 36px; border-radius: 50px; font-family: 'Inter', sans-serif;
      font-size: 16px; font-weight: 600; text-decoration: none; cursor: pointer;
      border: none; overflow: hidden;
      transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
    .glass-btn-primary {
      background: linear-gradient(135deg, rgba(59,130,246,0.8), rgba(34,211,238,0.6));
      color: white;
      backdrop-filter: saturate(180%) blur(20px);
      -webkit-backdrop-filter: saturate(180%) blur(20px);
      border: 1px solid rgba(255,255,255,0.15);
      box-shadow: 0 8px 32px rgba(59,130,246,0.3), inset 0 1px 0 rgba(255,255,255,0.15);
    }
    .glass-btn-primary:hover {
      box-shadow: 0 8px 40px rgba(59,130,246,0.5), 0 0 20px rgba(59,130,246,0.3),
                  inset 0 1px 0 rgba(255,255,255,0.2);
      transform: translateY(-2px);
    }
    .glass-btn-secondary {
      background: rgba(255,255,255,0.05); color: var(--text);
      backdrop-filter: saturate(180%) blur(20px);
      -webkit-backdrop-filter: saturate(180%) blur(20px);
      border: 1px solid rgba(255,255,255,0.1);
    }
    .glass-btn-secondary:hover {
      background: rgba(255,255,255,0.1);
      border-color: rgba(255,255,255,0.2);
      transform: translateY(-2px);
    }
    .glass-btn::after {
      content: ''; position: absolute; top: 0; left: -100%;
      width: 100%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
      transition: left 0.5s ease;
    }
    .glass-btn:hover::after { left: 100%; }
    .magnetic-area { display: inline-block; transition: transform 0.2s ease-out; text-decoration: none; }

    /* ═══════════════════════════════════════════════════════
       STAT CARDS
    ═══════════════════════════════════════════════════════ */
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
    .stat-card {
      background: linear-gradient(135deg, rgba(18,18,26,0.9), rgba(26,26,46,0.6));
      border: 1px solid var(--border); border-radius: 16px;
      padding: 32px 24px; text-align: center; position: relative;
      overflow: hidden; backdrop-filter: blur(10px);
    }
    .stat-card::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
      background: linear-gradient(90deg, var(--blue), var(--cyan));
    }
    .stat-number {
      font-size: 42px; font-weight: 900; color: var(--blue);
      text-shadow: 0 0 40px rgba(59,130,246,0.3);
      line-height: 1; margin-bottom: 8px; letter-spacing: -1px;
    }
    .stat-label { font-size: 14px; color: var(--text-dim); font-weight: 500; }
    .stat-shimmer {
      position: absolute; inset: 0;
      background: linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.03) 50%, transparent 75%);
      background-size: 200% 100%; animation: shimmer 2s infinite;
    }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    /* ═══════════════════════════════════════════════════════
       3D TILT CARDS
    ═══════════════════════════════════════════════════════ */
    .method-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 24px;
    }
    .card-3d-wrapper { perspective: 1000px; cursor: pointer; }
    .card-3d {
      background: linear-gradient(145deg, rgba(18,18,26,0.95), rgba(10,10,15,0.95));
      border: 1px solid var(--border); border-radius: 20px;
      padding: 40px 32px; position: relative; overflow: hidden;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      transform-style: preserve-3d; will-change: transform;
    }
    .card-3d:hover {
      box-shadow: 0 20px 60px rgba(0,0,0,0.4), 0 0 30px rgba(59,130,246,0.1);
    }
    .card-3d-glow {
      position: absolute; width: 300px; height: 300px; border-radius: 50%;
      background: radial-gradient(circle, rgba(59,130,246,0.15), transparent 70%);
      pointer-events: none; opacity: 0; transition: opacity 0.3s;
      transform: translate(-50%, -50%);
    }
    .card-3d:hover .card-3d-glow { opacity: 1; }
    .card-3d-icon {
      width: 56px; height: 56px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      font-size: 24px; margin-bottom: 24px; position: relative; z-index: 1;
    }
    .card-3d h3 {
      font-size: 22px; font-weight: 700; color: var(--text-bright);
      margin-bottom: 12px; position: relative; z-index: 1;
    }
    .card-3d p {
      font-size: 15px; color: var(--text-dim); line-height: 1.7;
      position: relative; z-index: 1;
    }
    .card-3d-tag {
      display: inline-block; margin-top: 20px; padding: 4px 12px;
      border-radius: 20px; font-size: 12px; font-weight: 600;
      position: relative; z-index: 1;
    }

    /* ═══════════════════════════════════════════════════════
       MOVING BORDERS
    ═══════════════════════════════════════════════════════ */
    .moving-border-card { position: relative; border-radius: 20px; overflow: hidden; }
    .moving-border {
      position: absolute; inset: -2px; border-radius: 22px;
      z-index: -1; overflow: hidden;
    }
    .moving-border::before {
      content: ''; position: absolute; inset: -50%;
      background: conic-gradient(from 0deg, transparent, var(--blue), var(--cyan), var(--purple), transparent);
      animation: rotateBorder 4s linear infinite;
    }
    @keyframes rotateBorder { to { transform: rotate(360deg); } }
    .moving-border::after {
      content: ''; position: absolute; inset: 2px;
      background: linear-gradient(145deg, rgba(18,18,26,0.98), rgba(10,10,15,0.98));
      border-radius: 20px;
    }

    /* ═══════════════════════════════════════════════════════
       GLOWING STARS
    ═══════════════════════════════════════════════════════ */
    .stars-container { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
    .star {
      position: absolute; width: 2px; height: 2px;
      background: white; border-radius: 50%;
      animation: starGlow 3s ease-in-out infinite;
    }
    @keyframes starGlow {
      0%, 100% { opacity: 0.2; box-shadow: 0 0 4px rgba(139,92,246,0.3); }
      50%      { opacity: 0.8; box-shadow: 0 0 12px rgba(34,211,238,0.6); }
    }

    /* ═══════════════════════════════════════════════════════
       TESTIMONIALS
    ═══════════════════════════════════════════════════════ */
    .testimonials-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 24px;
    }
    .testimonial-card-outer { z-index: 1; }
    .testimonial-card {
      position: relative; z-index: 1;
      background: linear-gradient(145deg, rgba(18,18,26,0.95), rgba(10,10,15,0.95));
      border-radius: 20px; padding: 32px;
    }
    .testimonial-stars { color: #fbbf24; font-size: 18px; margin-bottom: 16px; letter-spacing: 2px; }
    .testimonial-text {
      font-size: 15px; color: var(--text); line-height: 1.8;
      margin-bottom: 24px; font-style: italic;
    }
    .testimonial-author { display: flex; align-items: center; gap: 12px; }
    .testimonial-avatar {
      width: 44px; height: 44px; border-radius: 50%;
      background: linear-gradient(135deg, var(--blue), var(--cyan));
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 18px; color: white;
    }
    .testimonial-name { font-size: 15px; font-weight: 600; color: var(--text-bright); }
    .testimonial-role { font-size: 13px; color: var(--text-dim); }

    /* ═══════════════════════════════════════════════════════
       PRICING
    ═══════════════════════════════════════════════════════ */
    .pricing-grid {
      display: grid; grid-template-columns: repeat(3, 1fr);
      gap: 24px; align-items: start;
    }
    .pricing-card {
      background: linear-gradient(145deg, rgba(18,18,26,0.95), rgba(10,10,15,0.95));
      border: 1px solid var(--border); border-radius: 20px;
      padding: 40px 32px; position: relative; overflow: hidden;
      transition: all 0.3s ease;
    }
    .pricing-card::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px;
      background: linear-gradient(90deg, var(--blue), var(--cyan));
    }
    .pricing-card.featured {
      transform: scale(1.05); border-color: rgba(59,130,246,0.3); z-index: 2;
    }
    .pricing-card.featured::before {
      background: linear-gradient(90deg, var(--blue), var(--purple), var(--cyan));
    }
    .pricing-badge {
      position: absolute; top: -1px; right: 24px;
      background: linear-gradient(135deg, var(--blue), var(--purple));
      color: white; font-size: 12px; font-weight: 700;
      padding: 6px 16px; border-radius: 0 0 10px 10px; letter-spacing: 0.5px;
    }
    .pricing-name { font-size: 18px; font-weight: 700; color: var(--text-bright); margin-bottom: 8px; }
    .pricing-desc { font-size: 14px; color: var(--text-dim); margin-bottom: 24px; }
    .pricing-price { margin-bottom: 32px; }
    .pricing-currency { font-size: 18px; font-weight: 600; color: var(--text-dim); vertical-align: top; }
    .pricing-amount {
      font-size: 52px; font-weight: 900; color: var(--text-bright);
      letter-spacing: -2px; line-height: 1;
    }
    .pricing-period { font-size: 14px; color: var(--text-dim); font-weight: 400; }
    .pricing-features { list-style: none; margin-bottom: 32px; padding: 0; }
    .pricing-features li {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 0; font-size: 14px; color: var(--text-dim);
      border-bottom: 1px solid var(--border);
    }
    .pricing-features li:last-child { border-bottom: none; }
    .pricing-features .check { color: #22c55e; font-size: 16px; flex-shrink: 0; }
    .pricing-btn {
      display: block; width: 100%; padding: 14px; border-radius: 50px;
      text-align: center; font-size: 15px; font-weight: 600;
      text-decoration: none; transition: all 0.3s ease; cursor: pointer;
      border: none; font-family: 'Inter', sans-serif;
    }
    .pricing-btn-outline {
      background: transparent; color: var(--text);
      border: 1px solid var(--border);
    }
    .pricing-btn-outline:hover {
      background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.15);
    }
    .pricing-btn-primary {
      background: linear-gradient(135deg, var(--blue), rgba(59,130,246,0.8));
      color: white; box-shadow: 0 4px 20px rgba(59,130,246,0.3);
    }
    .pricing-btn-primary:hover {
      box-shadow: 0 4px 30px rgba(59,130,246,0.5); transform: translateY(-2px);
    }
    .pricing-security {
      display: flex; align-items: center; justify-content: center;
      gap: 6px; margin-top: 16px; font-size: 12px; color: var(--text-dim);
    }

    /* ═══════════════════════════════════════════════════════
       BORDER BEAM (@property)
    ═══════════════════════════════════════════════════════ */
    @property --border-beam-angle {
      syntax: '<angle>'; initial-value: 0deg; inherits: false;
    }
    .border-beam-card { position: relative; border-radius: 20px; }
    .border-beam-card::after {
      content: ''; position: absolute; inset: -2px; border-radius: 22px;
      background: conic-gradient(from var(--border-beam-angle, 0deg),
        transparent 60%, var(--blue), var(--cyan), transparent 100%);
      z-index: -1; animation: borderBeam 4s linear infinite;
    }
    @keyframes borderBeam { to { --border-beam-angle: 360deg; } }

    /* ═══════════════════════════════════════════════════════
       CTA SECTION
    ═══════════════════════════════════════════════════════ */
    .cta-section { text-align: center; }
    .cta-content { max-width: 700px; }

    /* ═══════════════════════════════════════════════════════
       FOOTER
    ═══════════════════════════════════════════════════════ */
    .footer {
      position: relative; z-index: 1;
      border-top: 1px solid var(--border); padding: 60px 0 40px;
    }
    .footer-inner { text-align: center; }
    .footer-logo { font-size: 24px; font-weight: 800; }
    .footer-desc {
      font-size: 14px; color: var(--text-dim); max-width: 400px;
      margin: 12px auto 24px; line-height: 1.7;
    }
    .footer-links { display: flex; gap: 24px; justify-content: center; margin-bottom: 32px; flex-wrap: wrap; }
    .footer-links a {
      color: var(--text-dim); text-decoration: none; font-size: 14px;
      transition: color 0.3s;
    }
    .footer-links a:hover { color: var(--text-bright); }
    .footer-bottom p { font-size: 13px; color: var(--text-dim); }

    /* ═══════════════════════════════════════════════════════
       RESPONSIVE
    ═══════════════════════════════════════════════════════ */
    @media (max-width: 768px) {
      .nav-links { display: none; }
      .nav-cta { display: none; }
      .nav-hamburger { display: flex; }
      .nav-links.open {
        display: flex; flex-direction: column; position: absolute;
        top: 100%; left: 0; right: 0;
        background: rgba(10,10,15,0.95);
        backdrop-filter: blur(20px);
        padding: 20px; gap: 16px;
        border-bottom: 1px solid var(--border);
      }
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .pricing-grid { grid-template-columns: 1fr; }
      .pricing-card.featured { transform: none; }
      .method-grid { grid-template-columns: 1fr; }
      .hero-title { letter-spacing: -1px; }
      .section { padding: 60px 0; }
    }
    @media (max-width: 480px) {
      .stats-grid { grid-template-columns: 1fr; }
      .hero-buttons { flex-direction: column; align-items: center; }
    }
  </style>
</head>
<body>
  <!-- Three.js Canvas -->
  <canvas id="three-canvas"></canvas>

  <!-- Floating Particles Container -->
  <div id="floating-particles"></div>

  ${navHtml}
  ${heroHtml}
  ${waveDivider()}
  ${statsHtml}
  ${waveDivider()}
  ${methodHtml}
  ${waveDivider()}
  ${testimonialsHtml}
  ${waveDivider()}
  ${pricingHtml}
  ${waveDivider()}
  ${ctaHtml}
  ${footerHtml}

  <!-- GSAP CDN -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"><\/script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"><\/script>

  <!-- INLINE JS -->
  <script>
    /* ═══════════════════════════════════════════════════════
       NAV SCROLL & HAMBURGER
    ═══════════════════════════════════════════════════════ */
    (function() {
      const nav = document.getElementById('navbar');
      const hamburger = document.getElementById('navHamburger');
      const links = document.getElementById('navLinks');

      window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 50);
      });

      if (hamburger) {
        hamburger.addEventListener('click', () => {
          hamburger.classList.toggle('active');
          links.classList.toggle('open');
        });
        links.querySelectorAll('.nav-link').forEach(link => {
          link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            links.classList.remove('open');
          });
        });
      }
    })();

    /* ═══════════════════════════════════════════════════════
       MAGNETIC BUTTONS
    ═══════════════════════════════════════════════════════ */
    document.querySelectorAll('.magnetic-area').forEach(area => {
      area.addEventListener('mousemove', (e) => {
        const rect = area.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        area.style.transform = 'translate(' + (x * 0.15) + 'px, ' + (y * 0.15) + 'px)';
      });
      area.addEventListener('mouseleave', () => {
        area.style.transform = 'translate(0, 0)';
      });
    });

    /* ═══════════════════════════════════════════════════════
       3D TILT CARDS
    ═══════════════════════════════════════════════════════ */
    document.querySelectorAll('.card-3d-wrapper').forEach(wrapper => {
      const card = wrapper.querySelector('.card-3d');
      const glow = card.querySelector('.card-3d-glow');
      wrapper.addEventListener('mousemove', (e) => {
        const rect = wrapper.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / centerY * -10;
        const rotateY = (x - centerX) / centerX * 10;
        card.style.transform = 'perspective(1000px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateZ(20px)';
        if (glow) { glow.style.left = x + 'px'; glow.style.top = y + 'px'; }
      });
      wrapper.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
      });
    });

    /* ═══════════════════════════════════════════════════════
       FLOATING PARTICLES
    ═══════════════════════════════════════════════════════ */
    (function() {
      const container = document.getElementById('floating-particles');
      if (!container) return;
      const colors = [
        'rgba(59,130,246,0.4)', 'rgba(34,211,238,0.3)',
        'rgba(139,92,246,0.3)', 'rgba(236,72,153,0.2)'
      ];
      for (let i = 0; i < 10; i++) {
        const p = document.createElement('div');
        p.className = 'floating-particle';
        const size = Math.random() * 6 + 2;
        const color = colors[Math.floor(Math.random() * colors.length)];
        p.style.cssText = 'width:' + size + 'px; height:' + size + 'px; left:' + (Math.random()*100) + '%; background:' + color + '; box-shadow:0 0 ' + (size*4) + 'px ' + color + '; animation-duration:' + (Math.random()*15+10) + 's; animation-delay:' + (Math.random()*-20) + 's;';
        container.appendChild(p);
      }
    })();

    /* ═══════════════════════════════════════════════════════
       GLOWING STARS (testimonials)
    ═══════════════════════════════════════════════════════ */
    (function() {
      const container = document.getElementById('testimonialsStars');
      if (!container) return;
      for (let i = 0; i < 80; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.cssText = 'left:' + (Math.random()*100) + '%; top:' + (Math.random()*100) + '%; animation-delay:' + (Math.random()*3) + 's; animation-duration:' + (Math.random()*2+2) + 's; width:' + (Math.random()*2+1) + 'px; height:' + (Math.random()*2+1) + 'px;';
        container.appendChild(star);
      }
    })();

    /* ═══════════════════════════════════════════════════════
       GSAP SCROLL REVEAL
    ═══════════════════════════════════════════════════════ */
    gsap.registerPlugin(ScrollTrigger);

    gsap.utils.toArray('.gsap-reveal').forEach(el => {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' },
        opacity: 0, y: 30, duration: 0.8, ease: 'power2.out'
      });
    });

    // Stagger for card grids
    document.querySelectorAll('.method-grid, .stats-grid, .pricing-grid, .testimonials-grid').forEach(grid => {
      gsap.from(grid.children, {
        scrollTrigger: { trigger: grid, start: 'top 85%' },
        opacity: 0, y: 30, stagger: 0.15, duration: 0.8, ease: 'power2.out'
      });
    });

    /* ═══════════════════════════════════════════════════════
       COUNTER ANIMATION
    ═══════════════════════════════════════════════════════ */
    (function() {
      let counterTriggered = false;
      const statsSection = document.getElementById('stats');
      if (!statsSection) return;
      ScrollTrigger.create({
        trigger: statsSection,
        start: 'top 80%',
        onEnter: function() {
          if (counterTriggered) return;
          counterTriggered = true;
          document.querySelectorAll('.stat-shimmer').forEach(s => {
            gsap.to(s, { opacity: 0, duration: 0.5, onComplete: () => s.remove() });
          });
          document.querySelectorAll('.stat-number').forEach(el => {
            const raw = el.dataset.count;
            if (!raw) return;
            const prefix = el.dataset.prefix || '';
            const suffix = el.dataset.suffix || '';
            const target = parseFloat(raw);
            if (isNaN(target)) return;
            const isDecimal = raw.includes('.');
            gsap.to({ val: 0 }, {
              val: target, duration: 2, ease: 'power2.out',
              onUpdate: function() {
                const v = this.targets()[0].val;
                el.textContent = prefix + (isDecimal ? v.toFixed(1) : Math.floor(v).toLocaleString()) + suffix;
              }
            });
          });
        }
      });
    })();

    /* ═══════════════════════════════════════════════════════
       SMOOTH ANCHOR SCROLL
    ═══════════════════════════════════════════════════════ */
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const target = document.querySelector(a.getAttribute('href'));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  <\/script>

  <!-- THREE.JS MODULE -->
  <script type="module">
    import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';

    const canvas = document.getElementById('three-canvas');
    if (canvas) {
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 5;

      const torusGeo = new THREE.TorusKnotGeometry(1.2, 0.35, 128, 32);
      const torusMat = new THREE.MeshBasicMaterial({
        color: 0x3b82f6, wireframe: true, transparent: true, opacity: 0.12
      });
      const torusKnot = new THREE.Mesh(torusGeo, torusMat);
      scene.add(torusKnot);

      const particleCount = 2500;
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      const c1 = new THREE.Color(0x3b82f6);
      const c2 = new THREE.Color(0x22d3ee);

      for (let i = 0; i < particleCount; i++) {
        positions[i * 3]     = (Math.random() - 0.5) * 20;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
        const t = Math.random();
        const col = c1.clone().lerp(c2, t);
        colors[i * 3] = col.r;
        colors[i * 3 + 1] = col.g;
        colors[i * 3 + 2] = col.b;
      }

      const particleGeo = new THREE.BufferGeometry();
      particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      const particleMat = new THREE.PointsMaterial({
        size: 0.025, vertexColors: true, transparent: true, opacity: 0.6, sizeAttenuation: true
      });
      const particles = new THREE.Points(particleGeo, particleMat);
      scene.add(particles);

      let mouseX = 0, mouseY = 0;
      document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
      });

      function animate() {
        requestAnimationFrame(animate);
        torusKnot.rotation.x += 0.003;
        torusKnot.rotation.y += 0.005;
        torusKnot.position.x += (mouseX * 0.5 - torusKnot.position.x) * 0.02;
        torusKnot.position.y += (-mouseY * 0.5 - torusKnot.position.y) * 0.02;
        particles.rotation.y += 0.0003;
        particles.rotation.x += 0.0001;
        camera.position.x += (mouseX * 0.3 - camera.position.x) * 0.01;
        camera.position.y += (-mouseY * 0.3 - camera.position.y) * 0.01;
        camera.lookAt(scene.position);
        renderer.render(scene, camera);
      }
      animate();

      window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });
    }
  <\/script>
</body>
</html>`;
  }

  // ── Write outputs ─────────────────────────────────────────

  writeOutputs(html) {
    console.log('\n[5/6] Writing output files...');

    const projectName = this.dna.projectName || this.dna.businessName || path.basename(this.projectDir);
    const slug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Output 1: projects/<slug>/output/index.html
    const projOutputDir = path.join(this.projectDir, 'output');
    const projOutputFile = path.join(projOutputDir, 'index.html');
    this._writeFile(projOutputFile, html);

    // Output 2: generated-site/index.html (relative to workspace root)
    const workspaceRoot = path.resolve(this.projectDir, '..');
    const genSiteDir = path.join(workspaceRoot, 'generated-site');
    const genSiteFile = path.join(genSiteDir, 'index.html');
    this._writeFile(genSiteFile, html);

    return { projOutputFile, genSiteFile };
  }

  // ── Main run ──────────────────────────────────────────────

  run() {
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║      NEXUS Code Agent v2 — Page Generator       ║');
    console.log('╚══════════════════════════════════════════════════╝');

    const startTime = Date.now();

    try {
      this.loadInputs();
      this.selectComponents();
      const html = this.buildPage();

      console.log(`\n[4/6] Page built — ${html.length} chars (${(Buffer.byteLength(html) / 1024).toFixed(1)} KB)`);

      const paths = this.writeOutputs(html);

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`\n[6/6] Done in ${elapsed}s`);
      console.log('╔══════════════════════════════════════════════════╗');
      console.log('║  Generation complete!                            ║');
      console.log(`║  Output: ${paths.projOutputFile}`);
      console.log(`║  Mirror: ${paths.genSiteFile}`);
      console.log('╚══════════════════════════════════════════════════╝\n');

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

module.exports = NexusCodeAgentV2;

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: node nexus-code-agent-v2.js <path-to-context-dna.json>');
    process.exit(1);
  }
  const agent = new NexusCodeAgentV2(args[0]);
  agent.run();
}
