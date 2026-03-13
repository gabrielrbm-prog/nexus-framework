#!/usr/bin/env node
/**
 * NEXUS Animation Engine — Scroll Choreography System
 *
 * Produces agency-quality scroll animations with per-section choreography,
 * micro-interaction CSS, and full reduced-motion support.
 *
 * Every animation generates real GSAP code — no stubs, no placeholders.
 *
 * Usage:
 *   const engine = new NexusAnimationEngine();
 *   const { js, css, gsapPlugins } = engine.generate(['hero', 'stats', 'features']);
 *
 * CLI:
 *   node nexus-animation-engine.js --sections hero,stats,features,testimonials,pricing,cta
 */

'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// CHOREOGRAPHY PATTERNS — each section type gets a unique animation sequence
// ─────────────────────────────────────────────────────────────────────────────

const CHOREOGRAPHY_PATTERNS = {
  hero: {
    trigger: null, // plays on page load
    elements: [
      { selector: '.hero-overline', animation: 'fadeSlideUp', delay: 0, duration: 0.6, ease: 'power3.out' },
      { selector: '.hero-title', animation: 'clipReveal', delay: 0.15, duration: 0.8, ease: 'power4.out' },
      { selector: '.hero-subtitle', animation: 'fadeSlideUp', delay: 0.35, duration: 0.7, ease: 'power2.out' },
      { selector: '.hero-cta', animation: 'scaleIn', delay: 0.55, duration: 0.5, ease: 'back.out(1.4)' },
      { selector: '.hero-image', animation: 'parallaxReveal', delay: 0.2, duration: 1.2, ease: 'power2.out' },
      { selector: '.hero-badges', animation: 'staggerFadeUp', delay: 0.7, stagger: 0.08, duration: 0.4 }
    ]
  },
  stats: {
    trigger: { start: 'top 70%', once: true },
    elements: [
      { selector: '.stats-title', animation: 'fadeSlideUp', delay: 0, duration: 0.6 },
      { selector: '.stat-item', animation: 'staggerScaleIn', stagger: 0.12, duration: 0.5, ease: 'back.out(1.2)' },
      { selector: '.stat-value', animation: 'counterUp', delay: 0.3, duration: 1.5, ease: 'power2.out' }
    ]
  },
  features: {
    trigger: { start: 'top 80%', once: true },
    elements: [
      { selector: '.features-title', animation: 'splitTextReveal', delay: 0, duration: 0.8 },
      { selector: '.feature-card', animation: 'staggerSlideAlternate', stagger: 0.15, duration: 0.7, ease: 'power3.out' },
      { selector: '.feature-icon', animation: 'bounceIn', delay: 0.2, stagger: 0.15, duration: 0.5, ease: 'back.out(1.7)' }
    ]
  },
  testimonials: {
    trigger: { start: 'top 80%', once: true },
    elements: [
      { selector: '.testimonials-title', animation: 'fadeSlideUp', delay: 0, duration: 0.6 },
      { selector: '.testimonial-card', animation: 'staggerFadeScale', stagger: 0.2, duration: 0.6, ease: 'power2.out' },
      { selector: '.testimonial-stars', animation: 'staggerScaleIn', delay: 0.3, stagger: 0.05, duration: 0.3 }
    ]
  },
  pricing: {
    trigger: { start: 'top 80%', once: true },
    elements: [
      { selector: '.pricing-title', animation: 'fadeSlideUp', delay: 0, duration: 0.6 },
      { selector: '.pricing-card', animation: 'staggerSlideUp', stagger: 0.15, duration: 0.6 },
      { selector: '.pricing-card.highlighted', animation: 'glowPulse', delay: 0.8, duration: 0.4 },
      { selector: '.pricing-feature', animation: 'staggerFadeIn', stagger: 0.05, duration: 0.3 }
    ]
  },
  cta: {
    trigger: { start: 'top 85%', once: true },
    elements: [
      { selector: '.cta-title', animation: 'clipReveal', delay: 0, duration: 0.8 },
      { selector: '.cta-description', animation: 'fadeSlideUp', delay: 0.2, duration: 0.6 },
      { selector: '.cta-button', animation: 'magneticFloat', delay: 0.5, duration: 0.6, ease: 'elastic.out(1, 0.5)' }
    ]
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SCROLL TRIGGER DEFAULTS per section type
// ─────────────────────────────────────────────────────────────────────────────

const TRIGGER_DEFAULTS = {
  hero: null,
  stats: { start: 'top 70%', once: true },
  features: { start: 'top 80%', once: true },
  testimonials: { start: 'top 80%', once: true },
  pricing: { start: 'top 80%', once: true },
  cta: { start: 'top 85%', once: true }
};

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATION CODE GENERATORS
// Each returns a string of GSAP code that runs in the browser.
// ─────────────────────────────────────────────────────────────────────────────

const ANIMATION_GENERATORS = {

  fadeSlideUp(selector, { delay = 0, duration = 0.6, ease = 'power2.out' } = {}) {
    return `
    gsap.from('${selector}', {
      opacity: 0,
      y: 30,
      duration: ${duration},
      delay: ${delay},
      ease: '${ease}',
      clearProps: 'transform,opacity'
    });`;
  },

  fadeSlideDown(selector, { delay = 0, duration = 0.6, ease = 'power2.out' } = {}) {
    return `
    gsap.from('${selector}', {
      opacity: 0,
      y: -30,
      duration: ${duration},
      delay: ${delay},
      ease: '${ease}',
      clearProps: 'transform,opacity'
    });`;
  },

  clipReveal(selector, { delay = 0, duration = 0.8, ease = 'power4.out' } = {}) {
    return `
    gsap.fromTo('${selector}',
      { clipPath: 'inset(0 100% 0 0)' },
      {
        clipPath: 'inset(0 0% 0 0)',
        duration: ${duration},
        delay: ${delay},
        ease: '${ease}',
        clearProps: 'clipPath'
      }
    );`;
  },

  splitTextReveal(selector, { delay = 0, duration = 0.8 } = {}) {
    return `
    (function() {
      var el = document.querySelector('${selector}');
      if (!el) return;
      var text = el.textContent;
      el.innerHTML = '';
      el.setAttribute('aria-label', text);
      for (var i = 0; i < text.length; i++) {
        var span = document.createElement('span');
        span.textContent = text[i] === ' ' ? '\\u00A0' : text[i];
        span.style.display = 'inline-block';
        span.style.opacity = '0';
        span.setAttribute('aria-hidden', 'true');
        el.appendChild(span);
      }
      gsap.to(el.querySelectorAll('span'), {
        opacity: 1,
        y: 0,
        duration: 0.04,
        stagger: 0.025,
        delay: ${delay},
        ease: 'power2.out',
        startAt: { opacity: 0, y: 8 },
        clearProps: 'transform,opacity',
        onComplete: function() {
          el.innerHTML = text;
          el.removeAttribute('aria-label');
        }
      });
    })();`;
  },

  scaleIn(selector, { delay = 0, duration = 0.5, ease = 'back.out(1.4)' } = {}) {
    return `
    gsap.from('${selector}', {
      scale: 0.8,
      opacity: 0,
      duration: ${duration},
      delay: ${delay},
      ease: '${ease}',
      clearProps: 'transform,opacity'
    });`;
  },

  staggerFadeUp(selector, { delay = 0, stagger = 0.08, duration = 0.4, ease = 'power2.out' } = {}) {
    return `
    gsap.from('${selector}', {
      opacity: 0,
      y: 30,
      duration: ${duration},
      delay: ${delay},
      stagger: ${stagger},
      ease: '${ease}',
      clearProps: 'transform,opacity'
    });`;
  },

  staggerScaleIn(selector, { delay = 0, stagger = 0.12, duration = 0.5, ease = 'back.out(1.2)' } = {}) {
    return `
    gsap.from('${selector}', {
      scale: 0.7,
      opacity: 0,
      duration: ${duration},
      delay: ${delay},
      stagger: ${stagger},
      ease: '${ease}',
      clearProps: 'transform,opacity'
    });`;
  },

  staggerSlideAlternate(selector, { delay = 0, stagger = 0.15, duration = 0.7, ease = 'power3.out' } = {}) {
    return `
    document.querySelectorAll('${selector}').forEach(function(el, i) {
      var fromX = i % 2 === 0 ? -60 : 60;
      gsap.from(el, {
        x: fromX,
        opacity: 0,
        duration: ${duration},
        delay: ${delay} + (i * ${stagger}),
        ease: '${ease}',
        clearProps: 'transform,opacity'
      });
    });`;
  },

  staggerFadeScale(selector, { delay = 0, stagger = 0.2, duration = 0.6, ease = 'power2.out' } = {}) {
    return `
    gsap.from('${selector}', {
      scale: 0.9,
      opacity: 0,
      duration: ${duration},
      delay: ${delay},
      stagger: ${stagger},
      ease: '${ease}',
      clearProps: 'transform,opacity'
    });`;
  },

  staggerSlideUp(selector, { delay = 0, stagger = 0.15, duration = 0.6, ease = 'power3.out' } = {}) {
    return `
    gsap.from('${selector}', {
      y: 50,
      opacity: 0,
      duration: ${duration},
      delay: ${delay},
      stagger: ${stagger},
      ease: '${ease}',
      clearProps: 'transform,opacity'
    });`;
  },

  staggerFadeIn(selector, { delay = 0, stagger = 0.05, duration = 0.3, ease = 'power1.out' } = {}) {
    return `
    gsap.from('${selector}', {
      opacity: 0,
      duration: ${duration},
      delay: ${delay},
      stagger: ${stagger},
      ease: '${ease}',
      clearProps: 'opacity'
    });`;
  },

  bounceIn(selector, { delay = 0, stagger = 0, duration = 0.5, ease = 'back.out(1.7)' } = {}) {
    const staggerProp = stagger ? `stagger: ${stagger},` : '';
    return `
    gsap.from('${selector}', {
      scale: 0,
      opacity: 0,
      duration: ${duration},
      delay: ${delay},
      ${staggerProp}
      ease: '${ease}',
      clearProps: 'transform,opacity'
    });`;
  },

  counterUp(selector, { delay = 0, duration = 1.5, ease = 'power2.out' } = {}) {
    return `
    document.querySelectorAll('${selector}').forEach(function(el) {
      var raw = el.textContent.trim();
      var prefix = '';
      var suffix = '';
      var match = raw.match(/^([^\\d]*?)([\\d,.]+)(.*)$/);
      if (!match) return;
      prefix = match[1];
      suffix = match[3];
      var numStr = match[2].replace(/,/g, '');
      var target = parseFloat(numStr);
      if (isNaN(target)) return;
      var hasDecimal = numStr.indexOf('.') !== -1;
      var decimalPlaces = hasDecimal ? numStr.split('.')[1].length : 0;
      var useCommas = match[2].indexOf(',') !== -1;
      var obj = { val: 0 };
      gsap.to(obj, {
        val: target,
        duration: ${duration},
        delay: ${delay},
        ease: '${ease}',
        onUpdate: function() {
          var v = hasDecimal ? obj.val.toFixed(decimalPlaces) : Math.round(obj.val).toString();
          if (useCommas) {
            v = v.replace(/\\B(?=(\\d{3})+(?!\\d))/g, ',');
          }
          el.textContent = prefix + v + suffix;
        }
      });
    });`;
  },

  parallaxReveal(selector, { delay = 0, duration = 1.2, ease = 'power2.out' } = {}) {
    return `
    gsap.from('${selector}', {
      y: 80,
      opacity: 0,
      scale: 0.95,
      duration: ${duration},
      delay: ${delay},
      ease: '${ease}',
      clearProps: 'opacity'
    });
    gsap.to('${selector}', {
      y: -40,
      ease: 'none',
      scrollTrigger: {
        trigger: '${selector}',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.5
      }
    });`;
  },

  magneticFloat(selector, { delay = 0, duration = 0.6, ease = 'elastic.out(1, 0.5)' } = {}) {
    return `
    gsap.from('${selector}', {
      scale: 0.85,
      opacity: 0,
      duration: ${duration},
      delay: ${delay},
      ease: '${ease}',
      clearProps: 'opacity'
    });
    gsap.to('${selector}', {
      y: -6,
      duration: 2,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      delay: ${delay + duration}
    });
    document.querySelectorAll('${selector}').forEach(function(btn) {
      btn.addEventListener('mousemove', function(e) {
        var rect = btn.getBoundingClientRect();
        var dx = e.clientX - (rect.left + rect.width / 2);
        var dy = e.clientY - (rect.top + rect.height / 2);
        gsap.to(btn, {
          x: dx * 0.15,
          y: dy * 0.15,
          duration: 0.3,
          ease: 'power2.out',
          overwrite: 'auto'
        });
      });
      btn.addEventListener('mouseleave', function() {
        gsap.to(btn, {
          x: 0,
          y: 0,
          duration: 0.5,
          ease: 'elastic.out(1, 0.4)',
          overwrite: 'auto'
        });
      });
    });`;
  },

  glowPulse(selector, { delay = 0, duration = 0.4 } = {}) {
    return `
    gsap.fromTo('${selector}',
      { boxShadow: '0 0 0 0 rgba(var(--color-primary-rgb, 99, 102, 241), 0)' },
      {
        boxShadow: '0 0 30px 8px rgba(var(--color-primary-rgb, 99, 102, 241), 0.35)',
        duration: ${duration},
        delay: ${delay},
        ease: 'power2.in',
        yoyo: true,
        repeat: 1,
        clearProps: 'boxShadow'
      }
    );`;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MICRO-INTERACTION CSS
// ─────────────────────────────────────────────────────────────────────────────

const MICRO_INTERACTION_CSS = `/* ═══════════════════════════════════════════════════════════
   NEXUS Micro-Interactions
   Generated by NexusAnimationEngine
   ═══════════════════════════════════════════════════════════ */

/* ── Button micro-interactions ───────────────────────────── */
.btn-primary,
.cta-button,
[class*="btn-cta"] {
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.3s ease,
              background-color 0.2s ease;
  will-change: transform;
}
.btn-primary:hover,
.cta-button:hover,
[class*="btn-cta"]:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 25px -5px var(--color-primary-glow, rgba(99, 102, 241, 0.4));
}
.btn-primary:active,
.cta-button:active,
[class*="btn-cta"]:active {
  transform: translateY(0) scale(0.98);
  transition-duration: 0.1s;
}
.btn-primary:focus-visible,
.cta-button:focus-visible,
[class*="btn-cta"]:focus-visible {
  outline: 2px solid var(--color-primary, #6366f1);
  outline-offset: 3px;
  box-shadow: 0 0 0 4px var(--color-primary-glow, rgba(99, 102, 241, 0.25));
}

/* ── Card micro-interactions ─────────────────────────────── */
.card,
.feature-card,
.testimonial-card,
.pricing-card,
.stat-item {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.3s ease,
              border-color 0.2s ease;
  will-change: transform;
}
.card:hover,
.feature-card:hover,
.testimonial-card:hover,
.stat-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px -12px rgba(0, 0, 0, 0.2);
  border-color: var(--color-primary-200, rgba(99, 102, 241, 0.3));
}
.pricing-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 48px -16px rgba(0, 0, 0, 0.25);
}
.pricing-card.highlighted {
  border-color: var(--color-primary, #6366f1);
}

/* ── Link micro-interactions ─────────────────────────────── */
a:not(.btn):not(.btn-primary):not(.cta-button):not([class*="btn-cta"]):not(.nav-link) {
  text-decoration-color: transparent;
  text-underline-offset: 3px;
  transition: text-decoration-color 0.2s ease, color 0.2s ease;
}
a:not(.btn):not(.btn-primary):not(.cta-button):not([class*="btn-cta"]):not(.nav-link):hover {
  text-decoration-color: currentColor;
}

/* ── Nav link interactions ───────────────────────────────── */
.nav-link {
  position: relative;
  transition: color 0.2s ease;
}
.nav-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--color-primary, #6366f1);
  transform: scaleX(0);
  transform-origin: right;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.nav-link:hover::after {
  transform: scaleX(1);
  transform-origin: left;
}

/* ── Icon interactions ───────────────────────────────────── */
.feature-icon {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
              background-color 0.2s ease;
}
.feature-card:hover .feature-icon {
  transform: scale(1.1) rotate(-3deg);
}

/* ── Image interactions ──────────────────────────────────── */
.hero-image img,
.feature-card img {
  transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.hero-image:hover img {
  transform: scale(1.02);
}
.feature-card:hover img {
  transform: scale(1.05);
}

/* ── Star rating interactions ────────────────────────────── */
.testimonial-stars span,
.testimonial-stars svg {
  transition: transform 0.2s ease;
}
.testimonial-card:hover .testimonial-stars span,
.testimonial-card:hover .testimonial-stars svg {
  animation: nexus-star-wiggle 0.4s ease;
}
@keyframes nexus-star-wiggle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-8deg) scale(1.15); }
  75% { transform: rotate(8deg) scale(1.15); }
}

/* ── Smooth scroll ───────────────────────────────────────── */
html {
  scroll-behavior: smooth;
}`;

// ─────────────────────────────────────────────────────────────────────────────
// REDUCED MOTION CSS
// ─────────────────────────────────────────────────────────────────────────────

const REDUCED_MOTION_CSS = `/* ═══════════════════════════════════════════════════════════
   NEXUS Reduced Motion — Accessibility Fallback
   Respects prefers-reduced-motion user preference.
   ═══════════════════════════════════════════════════════════ */

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  /* Ensure all elements are visible when animations are disabled */
  .hero-overline,
  .hero-title,
  .hero-subtitle,
  .hero-cta,
  .hero-image,
  .hero-badges,
  .stats-title,
  .stat-item,
  .stat-value,
  .features-title,
  .feature-card,
  .feature-icon,
  .testimonials-title,
  .testimonial-card,
  .testimonial-stars,
  .pricing-title,
  .pricing-card,
  .pricing-feature,
  .cta-title,
  .cta-description,
  .cta-button {
    opacity: 1 !important;
    transform: none !important;
    clip-path: none !important;
  }
}`;

// ─────────────────────────────────────────────────────────────────────────────
// NexusAnimationEngine CLASS
// ─────────────────────────────────────────────────────────────────────────────

class NexusAnimationEngine {

  constructor(options = {}) {
    this.patterns = { ...CHOREOGRAPHY_PATTERNS, ...(options.customPatterns || {}) };
    this.triggerDefaults = { ...TRIGGER_DEFAULTS, ...(options.customTriggers || {}) };
  }

  /**
   * Main method — returns complete JS + CSS for the given sections.
   * @param {string[]} sections - e.g. ['hero', 'stats', 'features']
   * @returns {{ js: string, css: string, gsapPlugins: string[] }}
   */
  generate(sections) {
    const js = this.generateInitScript(sections);
    const css = this.generateMicroInteractionCSS() + '\n\n' + this.generateReducedMotionCSS();
    const gsapPlugins = this._requiredPlugins(sections);
    return { js, css, gsapPlugins };
  }

  /**
   * Get the choreography definition for a section type.
   * @param {string} sectionType
   * @returns {object|null}
   */
  getChoreography(sectionType) {
    return this.patterns[sectionType] || null;
  }

  /**
   * Generate raw GSAP animation code for given sections (no wrapper).
   * @param {string[]} sections
   * @returns {string}
   */
  generateGSAP(sections) {
    const blocks = [];

    for (const section of sections) {
      const choreography = this.patterns[section];
      if (!choreography) continue;

      blocks.push(this._buildSectionBlock(section, choreography));
    }

    return blocks.join('\n');
  }

  /**
   * Generate micro-interaction CSS.
   * @returns {string}
   */
  generateMicroInteractionCSS() {
    return MICRO_INTERACTION_CSS;
  }

  /**
   * Generate reduced-motion CSS.
   * @returns {string}
   */
  generateReducedMotionCSS() {
    return REDUCED_MOTION_CSS;
  }

  /**
   * Generate the complete, self-contained initialization script.
   * @param {string[]} sections
   * @returns {string}
   */
  generateInitScript(sections) {
    const gsapCode = this.generateGSAP(sections);
    const plugins = this._requiredPlugins(sections);

    const pluginRegistration = plugins.length > 0
      ? `  gsap.registerPlugin(${plugins.join(', ')});`
      : '';

    return `/**
 * NEXUS Animation Engine — Generated Scroll Choreography
 * Sections: ${sections.join(', ')}
 * Plugins required: ${plugins.length > 0 ? plugins.join(', ') : 'none'}
 *
 * Prerequisites:
 *   <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"><\/script>
 *   <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/ScrollTrigger.min.js"><\/script>
 */

(function() {
  'use strict';

  // ── Reduced motion guard ──────────────────────────────────
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Make everything visible immediately — no animation
    document.querySelectorAll(
      '.hero-overline,.hero-title,.hero-subtitle,.hero-cta,.hero-image,.hero-badges,' +
      '.stats-title,.stat-item,.stat-value,' +
      '.features-title,.feature-card,.feature-icon,' +
      '.testimonials-title,.testimonial-card,.testimonial-stars,' +
      '.pricing-title,.pricing-card,.pricing-feature,' +
      '.cta-title,.cta-description,.cta-button'
    ).forEach(function(el) {
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.style.clipPath = 'none';
    });
    return;
  }

  // ── Wait for GSAP ─────────────────────────────────────────
  function boot() {
    if (typeof gsap === 'undefined') {
      console.warn('[NexusAnimationEngine] GSAP not found. Animations disabled.');
      return;
    }

${pluginRegistration}

    // ── Set initial hidden state for animated elements ─────
    gsap.set(
      '.hero-overline,.hero-title,.hero-subtitle,.hero-cta,.hero-image,.hero-badges > *,' +
      '.stats-title,.stat-item,.feature-card,.feature-icon,' +
      '.testimonials-title,.testimonial-card,.testimonial-stars > *,' +
      '.pricing-title,.pricing-card,.pricing-feature,' +
      '.cta-title,.cta-description,.cta-button',
      { opacity: 0 }
    );

${gsapCode}
  }

  // ── Initialize on DOM ready ───────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();`;
  }

  // ─────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────

  /**
   * Build the animation block for a single section.
   */
  _buildSectionBlock(sectionType, choreography) {
    const trigger = choreography.trigger || this.triggerDefaults[sectionType] || null;
    const lines = [];

    lines.push(`    // ── ${sectionType.toUpperCase()} ──────────────────────────────────────`);

    if (trigger) {
      // Wrap in ScrollTrigger callback
      lines.push(`    ScrollTrigger.create({`);
      lines.push(`      trigger: '[data-section="${sectionType}"], .section-${sectionType}, #${sectionType}',`);
      lines.push(`      start: '${trigger.start || 'top 80%'}',`);
      if (trigger.once !== false) {
        lines.push(`      once: true,`);
      }
      lines.push(`      onEnter: function() {`);

      for (const elem of choreography.elements) {
        const code = this._generateAnimationCode(elem);
        // Indent inside the onEnter callback
        const indented = code.split('\n')
          .map(line => line.trim() ? '      ' + line.trim() : '')
          .filter(Boolean)
          .join('\n');
        lines.push(indented);
      }

      lines.push(`      }`);
      lines.push(`    });`);
    } else {
      // Hero: play directly as a timeline on load
      lines.push(`    // Hero plays immediately on page load`);
      lines.push(`    (function() {`);
      lines.push(`      var heroTl = gsap.timeline({ defaults: { ease: 'power2.out' } });`);

      for (const elem of choreography.elements) {
        const code = this._generateTimelineCode(elem);
        const indented = code.split('\n')
          .map(line => line.trim() ? '      ' + line.trim() : '')
          .filter(Boolean)
          .join('\n');
        lines.push(indented);
      }

      lines.push(`    })();`);
    }

    lines.push('');
    return lines.join('\n');
  }

  /**
   * Generate standalone GSAP animation code for one element definition.
   */
  _generateAnimationCode(elem) {
    const generator = ANIMATION_GENERATORS[elem.animation];
    if (!generator) {
      return `    // [warn] Unknown animation type: ${elem.animation}`;
    }
    return generator(elem.selector, {
      delay: elem.delay || 0,
      duration: elem.duration,
      ease: elem.ease,
      stagger: elem.stagger
    });
  }

  /**
   * Generate timeline-based GSAP code for hero elements.
   * Uses heroTl.from() with position parameter for proper sequencing.
   */
  _generateTimelineCode(elem) {
    const delay = elem.delay || 0;
    const duration = elem.duration || 0.6;
    const ease = elem.ease || 'power2.out';

    // Some animations need special timeline handling
    switch (elem.animation) {
      case 'fadeSlideUp':
        return `
      heroTl.from('${elem.selector}', {
        opacity: 0, y: 30, duration: ${duration}, ease: '${ease}', clearProps: 'transform,opacity'
      }, ${delay});`;

      case 'clipReveal':
        return `
      heroTl.fromTo('${elem.selector}',
        { clipPath: 'inset(0 100% 0 0)' },
        { clipPath: 'inset(0 0% 0 0)', duration: ${duration}, ease: '${ease}', clearProps: 'clipPath' },
      ${delay});`;

      case 'scaleIn':
        return `
      heroTl.from('${elem.selector}', {
        scale: 0.8, opacity: 0, duration: ${duration}, ease: '${ease}', clearProps: 'transform,opacity'
      }, ${delay});`;

      case 'parallaxReveal':
        return `
      heroTl.from('${elem.selector}', {
        y: 80, opacity: 0, scale: 0.95, duration: ${duration}, ease: '${ease}', clearProps: 'opacity'
      }, ${delay});
      gsap.to('${elem.selector}', {
        y: -40,
        ease: 'none',
        scrollTrigger: {
          trigger: '${elem.selector}',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.5
        }
      });`;

      case 'staggerFadeUp': {
        const stagger = elem.stagger || 0.08;
        return `
      heroTl.from('${elem.selector} > *', {
        opacity: 0, y: 30, duration: ${duration}, stagger: ${stagger}, ease: '${ease}', clearProps: 'transform,opacity'
      }, ${delay});`;
      }

      case 'magneticFloat':
        return `
      heroTl.from('${elem.selector}', {
        scale: 0.85, opacity: 0, duration: ${duration}, ease: '${ease}', clearProps: 'opacity'
      }, ${delay});
      gsap.to('${elem.selector}', {
        y: -6, duration: 2, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: ${delay + duration}
      });
      document.querySelectorAll('${elem.selector}').forEach(function(btn) {
        btn.addEventListener('mousemove', function(e) {
          var rect = btn.getBoundingClientRect();
          var dx = e.clientX - (rect.left + rect.width / 2);
          var dy = e.clientY - (rect.top + rect.height / 2);
          gsap.to(btn, { x: dx * 0.15, y: dy * 0.15, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
        });
        btn.addEventListener('mouseleave', function() {
          gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' });
        });
      });`;

      default:
        // Fall back to standalone generator
        return this._generateAnimationCode(elem);
    }
  }

  /**
   * Determine which GSAP plugins are needed for the given sections.
   */
  _requiredPlugins(sections) {
    const plugins = new Set();

    for (const section of sections) {
      const choreography = this.patterns[section];
      if (!choreography) continue;

      // Any section besides hero needs ScrollTrigger
      if (choreography.trigger || this.triggerDefaults[section]) {
        plugins.add('ScrollTrigger');
      }

      // Check for parallax (also needs ScrollTrigger)
      for (const elem of choreography.elements) {
        if (elem.animation === 'parallaxReveal') {
          plugins.add('ScrollTrigger');
        }
      }
    }

    return Array.from(plugins);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI INTERFACE
// ─────────────────────────────────────────────────────────────────────────────

if (require.main === module) {
  const fs = require('fs');
  const path = require('path');

  const args = process.argv.slice(2);
  let sections = ['hero', 'stats', 'features', 'testimonials', 'pricing', 'cta'];
  let outputDir = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--sections' && args[i + 1]) {
      sections = args[i + 1].split(',').map(s => s.trim());
      i++;
    } else if (args[i] === '--out' && args[i + 1]) {
      outputDir = args[i + 1];
      i++;
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
NEXUS Animation Engine — Scroll Choreography Generator

Usage:
  node nexus-animation-engine.js [options]

Options:
  --sections <list>   Comma-separated section types (default: hero,stats,features,testimonials,pricing,cta)
  --out <dir>         Output directory for generated files (default: stdout)
  --help, -h          Show this help

Available section types:
  hero, stats, features, testimonials, pricing, cta

Examples:
  node nexus-animation-engine.js --sections hero,features,cta
  node nexus-animation-engine.js --sections hero,stats,pricing --out ./dist
`);
      process.exit(0);
    }
  }

  const engine = new NexusAnimationEngine();
  const result = engine.generate(sections);

  if (outputDir) {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const jsPath = path.join(outputDir, 'nexus-animations.js');
    const cssPath = path.join(outputDir, 'nexus-animations.css');

    fs.writeFileSync(jsPath, result.js, 'utf-8');
    fs.writeFileSync(cssPath, result.css, 'utf-8');

    console.log(`[NexusAnimationEngine] Generated files:`);
    console.log(`  JS  → ${jsPath}`);
    console.log(`  CSS → ${cssPath}`);
    console.log(`  GSAP plugins needed: ${result.gsapPlugins.join(', ') || 'none'}`);
    console.log(`  Sections: ${sections.join(', ')}`);
  } else {
    console.log('// ═══════════════════════════════════════════════════════════');
    console.log('// NEXUS Animation Engine — Generated JavaScript');
    console.log('// Sections: ' + sections.join(', '));
    console.log('// GSAP plugins: ' + (result.gsapPlugins.join(', ') || 'none'));
    console.log('// ═══════════════════════════════════════════════════════════');
    console.log('');
    console.log(result.js);
    console.log('');
    console.log('// ═══════════════════════════════════════════════════════════');
    console.log('// NEXUS Animation Engine — Generated CSS');
    console.log('// ═══════════════════════════════════════════════════════════');
    console.log('');
    console.log(result.css);
  }
}

module.exports = NexusAnimationEngine;
