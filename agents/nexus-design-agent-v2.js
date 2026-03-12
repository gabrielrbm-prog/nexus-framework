#!/usr/bin/env node

/*
 * NEXUS Design Agent v2 — LLM-Powered
 * Generates contextual design system with real color math + AI decisions
 */

const fs = require('fs');
const path = require('path');
const llm = require('./nexus-llm');

const WORKSPACE = path.join(__dirname, '..');

class NexusDesignAgentV2 {

  async generate(contextDNAPath) {
    console.log('🚀 Iniciando geração de design system com IA...');
    console.log(`📄 Context DNA: ${contextDNAPath}\n`);

    const dna = JSON.parse(fs.readFileSync(contextDNAPath, 'utf-8'));
    const projectDir = path.dirname(contextDNAPath);

    // Ask LLM for design decisions
    console.log('🎨 Consultando IA para decisões de design...');
    let designDecisions;
    try {
      designDecisions = await this._getDesignDecisions(dna);
    } catch(e) {
      console.log(`   ⚠️ LLM falhou (${e.message}), usando heurísticas locais...`);
      designDecisions = this._fallbackDecisions(dna);
    }

    // Build full design system from AI decisions + real color math
    const designSystem = this._buildDesignSystem(designDecisions, dna);

    // Save outputs
    const dsDir = path.join(projectDir, 'design-system');
    if (!fs.existsSync(dsDir)) fs.mkdirSync(dsDir, { recursive: true });

    fs.writeFileSync(path.join(dsDir, 'design-system.json'), JSON.stringify(designSystem, null, 2));
    fs.writeFileSync(path.join(dsDir, 'variables.css'), this._generateCSS(designSystem));
    fs.writeFileSync(path.join(dsDir, 'design-system.css'), this._generateUtilityCSS(designSystem));

    // Also write to workspace design-system for backward compat
    const wsDir = path.join(WORKSPACE, 'design-system');
    if (!fs.existsSync(wsDir)) fs.mkdirSync(wsDir, { recursive: true });
    fs.writeFileSync(path.join(wsDir, 'design-system.json'), JSON.stringify(designSystem, null, 2));
    fs.writeFileSync(path.join(wsDir, 'variables.css'), this._generateCSS(designSystem));
    fs.writeFileSync(path.join(wsDir, 'design-system.css'), this._generateUtilityCSS(designSystem));

    // Report
    const report = this._generateReport(designSystem, dna);
    fs.writeFileSync(path.join(projectDir, 'design-report.md'), report);

    console.log(`💾 Design system salvo em: ${dsDir}`);
    console.log('\n✅ Design system gerado com IA!');
    console.log('📊 Estatísticas:');
    console.log(`   - Business Type: ${dna.project?.businessType || 'general'}`);
    console.log(`   - Primary: ${designSystem.colors?.primary?.base || '?'}`);
    console.log(`   - Secondary: ${designSystem.colors?.secondary?.base || '?'}`);
    console.log(`   - Accent: ${designSystem.colors?.accent?.base || '?'}`);
    console.log(`   - Font: ${designSystem.typography?.fontFamily || '?'}`);
    console.log(`   - Heading Font: ${designSystem.typography?.headingFamily || '?'}`);

    return designSystem;
  }

  async _getDesignDecisions(dna) {
    const project = dna.project || {};
    const brand = dna.brand || {};
    const visual = dna.visual || {};
    const audience = dna.audience || {};

    const prompt = `Decida o design system para esta landing page.

## Negócio
- **Nome:** ${brand.name || project.name}
- **Tipo:** ${project.businessType} / ${project.industry || ''}
- **Tom de voz:** ${brand.voiceTone || 'profissional'}
- **Arquétipo:** ${brand.brandArchetype || 'hero'}
- **Mood visual:** ${visual.mood || '(decidir)'}
- **Audiência:** ${audience.primaryAge || '25-45'} anos
- **Paleta sugerida pelo contexto:** ${JSON.stringify(visual.suggestedPalette || {})}

## Decisões necessárias (JSON):

{
  "colors": {
    "primary": "#hex — cor principal da marca (deve comunicar ${brand.emotionalCore || 'confiança'})",
    "secondary": "#hex — cor complementar",
    "accent": "#hex — cor de destaque para CTAs e highlights",
    "background": "#hex — cor de fundo principal (dark or light)",
    "surface": "#hex — cor de cards/superfícies",
    "text": "#hex — cor do texto principal",
    "textDim": "#hex — cor do texto secundário",
    "success": "#hex",
    "warning": "#hex",
    "error": "#hex"
  },
  "darkMode": true ou false,
  "typography": {
    "fontFamily": "nome da fonte do Google Fonts para body (ex: Inter, Poppins, DM Sans)",
    "headingFamily": "nome da fonte para headings (ex: Playfair Display, Sora, Cabinet Grotesk)",
    "baseFontSize": "16px ou 18px",
    "headingWeight": "700, 800 ou 900",
    "bodyWeight": "400",
    "lineHeight": "1.6 ou 1.7"
  },
  "spacing": {
    "sectionPadding": "6rem ou 8rem",
    "cardPadding": "1.5rem ou 2rem",
    "borderRadius": "8px, 12px, 16px ou 24px"
  },
  "effects": {
    "glassmorphism": true/false,
    "gradients": true/false,
    "shadows": "none|subtle|medium|dramatic",
    "animations": "minimal|moderate|rich"
  },
  "rationale": "explique em 2 frases por que essas escolhas fazem sentido para ${brand.name || 'este negócio'}"
}

REGRAS:
- Cores devem ser APROPRIADAS para o setor (saúde=azul/verde, luxo=dourado/preto, tech=azul/roxo, comida=vermelho/laranja)
- Se visual.suggestedPalette tem cores, USE-AS como base
- Fontes devem estar disponíveis no Google Fonts
- DarkMode=true para tech/gaming/trading, false para saúde/comida/educação (em geral)
- Glassmorphism combina com tech/luxo, não com saúde/comida conservador`;

    return await llm.callJSON(prompt, {
      system: 'Você é um designer UI/UX sênior especialista em landing pages de alta conversão. Responda APENAS com JSON válido.',
      maxTokens: 2048,
      temperature: 0.6
    });
  }

  _fallbackDecisions(dna) {
    const bt = (dna.project?.businessType || 'general').toLowerCase();
    const palettes = {
      healthcare: { primary: '#0ea5e9', secondary: '#06b6d4', accent: '#22c55e', background: '#ffffff', surface: '#f8fafc', text: '#1e293b', textDim: '#64748b', darkMode: false },
      fintech: { primary: '#6366f1', secondary: '#8b5cf6', accent: '#f59e0b', background: '#0a0a1a', surface: '#111128', text: '#e8e8f0', textDim: '#8888aa', darkMode: true },
      fitness: { primary: '#ef4444', secondary: '#f97316', accent: '#eab308', background: '#0f0f0f', surface: '#1a1a1a', text: '#ffffff', textDim: '#a3a3a3', darkMode: true },
      ecommerce: { primary: '#8b5cf6', secondary: '#ec4899', accent: '#f59e0b', background: '#ffffff', surface: '#f9fafb', text: '#111827', textDim: '#6b7280', darkMode: false },
      saas: { primary: '#3b82f6', secondary: '#6366f1', accent: '#10b981', background: '#09090b', surface: '#18181b', text: '#fafafa', textDim: '#a1a1aa', darkMode: true },
      education: { primary: '#2563eb', secondary: '#7c3aed', accent: '#f59e0b', background: '#ffffff', surface: '#f5f5f5', text: '#1f2937', textDim: '#6b7280', darkMode: false },
      restaurant: { primary: '#dc2626', secondary: '#ea580c', accent: '#facc15', background: '#fffbeb', surface: '#ffffff', text: '#1c1917', textDim: '#78716c', darkMode: false },
    };
    const p = palettes[bt] || palettes.saas;
    return {
      colors: { ...p, success: '#22c55e', warning: '#f59e0b', error: '#ef4444' },
      darkMode: p.darkMode,
      typography: { fontFamily: 'Inter', headingFamily: 'Inter', baseFontSize: '16px', headingWeight: '800', bodyWeight: '400', lineHeight: '1.6' },
      spacing: { sectionPadding: '6rem', cardPadding: '1.75rem', borderRadius: '12px' },
      effects: { glassmorphism: p.darkMode, gradients: true, shadows: p.darkMode ? 'subtle' : 'medium', animations: 'moderate' },
      rationale: 'Fallback palette based on business type heuristics.'
    };
  }

  _buildDesignSystem(decisions, dna) {
    const c = decisions.colors || {};

    // Generate full color scale with REAL lighten/darken
    const colorScale = (hex) => {
      const hsl = this._hexToHSL(hex);
      return {
        50:  this._hslToHex(hsl.h, Math.max(hsl.s - 10, 10), Math.min(hsl.l + 45, 97)),
        100: this._hslToHex(hsl.h, Math.max(hsl.s - 5, 10), Math.min(hsl.l + 35, 95)),
        200: this._hslToHex(hsl.h, hsl.s, Math.min(hsl.l + 25, 90)),
        300: this._hslToHex(hsl.h, hsl.s, Math.min(hsl.l + 15, 80)),
        400: this._hslToHex(hsl.h, hsl.s, Math.min(hsl.l + 5, 70)),
        500: hex, // base
        600: this._hslToHex(hsl.h, Math.min(hsl.s + 5, 100), Math.max(hsl.l - 8, 15)),
        700: this._hslToHex(hsl.h, Math.min(hsl.s + 10, 100), Math.max(hsl.l - 16, 10)),
        800: this._hslToHex(hsl.h, Math.min(hsl.s + 10, 100), Math.max(hsl.l - 24, 8)),
        900: this._hslToHex(hsl.h, Math.min(hsl.s + 15, 100), Math.max(hsl.l - 32, 5)),
        base: hex
      };
    };

    const typo = decisions.typography || {};
    const spacing = decisions.spacing || {};
    const effects = decisions.effects || {};

    return {
      _generatedBy: 'nexus-design-agent-v2',
      _generatedAt: new Date().toISOString(),
      _usedLLM: true,
      _rationale: decisions.rationale || '',

      colors: {
        primary: colorScale(c.primary || '#6366f1'),
        secondary: colorScale(c.secondary || '#8b5cf6'),
        accent: colorScale(c.accent || '#f59e0b'),
        background: c.background || '#0a0a1a',
        surface: c.surface || '#111128',
        text: c.text || '#e8e8f0',
        textDim: c.textDim || '#8888aa',
        success: c.success || '#22c55e',
        warning: c.warning || '#f59e0b',
        error: c.error || '#ef4444',
        darkMode: decisions.darkMode ?? true
      },

      typography: {
        fontFamily: typo.fontFamily || 'Inter',
        headingFamily: typo.headingFamily || typo.fontFamily || 'Inter',
        baseFontSize: typo.baseFontSize || '16px',
        headingWeight: typo.headingWeight || '800',
        bodyWeight: typo.bodyWeight || '400',
        lineHeight: typo.lineHeight || '1.6',
        sizes: {
          xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.125rem',
          xl: '1.25rem', '2xl': '1.5rem', '3xl': '1.875rem',
          '4xl': '2.25rem', '5xl': '3rem', '6xl': '3.75rem', '7xl': '4.5rem'
        }
      },

      spacing: {
        section: spacing.sectionPadding || '6rem',
        card: spacing.cardPadding || '1.75rem',
        borderRadius: {
          sm: '4px',
          md: spacing.borderRadius || '12px',
          lg: `${parseInt(spacing.borderRadius || '12') + 4}px`,
          xl: `${parseInt(spacing.borderRadius || '12') + 8}px`,
          full: '9999px'
        }
      },

      effects: {
        glassmorphism: effects.glassmorphism ?? true,
        gradients: effects.gradients ?? true,
        shadows: effects.shadows || 'subtle',
        animations: effects.animations || 'moderate',
        glassBg: effects.glassmorphism
          ? `rgba(${this._hexToRGB(c.surface || '#111128')}, 0.6)`
          : c.surface || '#111128',
        glassBlur: effects.glassmorphism ? 'blur(20px)' : 'none',
        primaryGlow: `0 0 40px ${c.primary || '#6366f1'}26`,
        gradient: `linear-gradient(135deg, ${c.primary || '#6366f1'}, ${c.secondary || '#8b5cf6'}, ${c.accent || '#a78bfa'})`
      },

      businessType: dna.project?.businessType || 'general',
      brandName: dna.brand?.name || dna.project?.name || ''
    };
  }

  // ===== COLOR MATH (REAL, not stubs) =====

  _hexToHSL(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c+c).join('');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  _hslToHex(h, s, l) {
    s = Math.max(0, Math.min(100, s)) / 100;
    l = Math.max(0, Math.min(100, l)) / 100;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  _hexToRGB(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c+c).join('');
    return `${parseInt(hex.substr(0,2),16)}, ${parseInt(hex.substr(2,2),16)}, ${parseInt(hex.substr(4,2),16)}`;
  }

  // ===== CSS Generation =====

  _generateCSS(ds) {
    const c = ds.colors;
    const t = ds.typography;
    const s = ds.spacing;
    const e = ds.effects;

    return `:root {
  /* Colors — Primary */
  --color-primary-50: ${c.primary[50]};
  --color-primary-100: ${c.primary[100]};
  --color-primary-200: ${c.primary[200]};
  --color-primary-300: ${c.primary[300]};
  --color-primary-400: ${c.primary[400]};
  --color-primary: ${c.primary.base};
  --color-primary-600: ${c.primary[600]};
  --color-primary-700: ${c.primary[700]};
  --color-primary-800: ${c.primary[800]};
  --color-primary-900: ${c.primary[900]};

  /* Colors — Secondary */
  --color-secondary-50: ${c.secondary[50]};
  --color-secondary: ${c.secondary.base};
  --color-secondary-700: ${c.secondary[700]};
  --color-secondary-900: ${c.secondary[900]};

  /* Colors — Accent */
  --color-accent-50: ${c.accent[50]};
  --color-accent: ${c.accent.base};
  --color-accent-700: ${c.accent[700]};

  /* Colors — Base */
  --color-bg: ${c.background};
  --color-surface: ${c.surface};
  --color-text: ${c.text};
  --color-text-dim: ${c.textDim};
  --color-success: ${c.success};
  --color-warning: ${c.warning};
  --color-error: ${c.error};

  /* Typography */
  --font-body: '${t.fontFamily}', system-ui, -apple-system, sans-serif;
  --font-heading: '${t.headingFamily}', system-ui, -apple-system, sans-serif;
  --font-size-base: ${t.baseFontSize};
  --font-weight-heading: ${t.headingWeight};
  --font-weight-body: ${t.bodyWeight};
  --line-height: ${t.lineHeight};

  /* Spacing */
  --section-padding: ${s.section};
  --card-padding: ${s.card};
  --radius-sm: ${s.borderRadius.sm};
  --radius-md: ${s.borderRadius.md};
  --radius-lg: ${s.borderRadius.lg};
  --radius-xl: ${s.borderRadius.xl};
  --radius-full: ${s.borderRadius.full};

  /* Effects */
  --glass-bg: ${e.glassBg};
  --glass-blur: ${e.glassBlur};
  --glow-primary: ${e.primaryGlow};
  --gradient: ${e.gradient};
}
`;
  }

  _generateUtilityCSS(ds) {
    const t = ds.typography;
    return `/* NEXUS Design System — Utility Classes */

body {
  font-family: var(--font-body);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-body);
  line-height: var(--line-height);
  color: var(--color-text);
  background: var(--color-bg);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  font-weight: var(--font-weight-heading);
  line-height: 1.15;
  letter-spacing: -0.02em;
}

h1 { font-size: ${t.sizes['5xl']}; }
h2 { font-size: ${t.sizes['3xl']}; }
h3 { font-size: ${t.sizes['2xl']}; }
h4 { font-size: ${t.sizes.xl}; }

.text-gradient {
  background: var(--gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.glass {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
}

.glow { box-shadow: var(--glow-primary); }

.btn-primary {
  background: var(--gradient);
  color: #fff;
  padding: 0.875rem 2rem;
  border-radius: var(--radius-md);
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--glow-primary);
}

.card {
  background: var(--color-surface);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: var(--radius-lg);
  padding: var(--card-padding);
}

section {
  padding: var(--section-padding) 2rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  h1 { font-size: ${t.sizes['3xl']}; }
  h2 { font-size: ${t.sizes['2xl']}; }
  section { padding: 4rem 1.25rem; }
}
`;
  }

  _generateReport(ds, dna) {
    const c = ds.colors;
    return `# Design System — ${ds.brandName || 'Projeto'}

## Decisão de IA
${ds._rationale || '—'}

## Paleta de Cores
- **Primary:** ${c.primary.base} (50: ${c.primary[50]} → 900: ${c.primary[900]})
- **Secondary:** ${c.secondary.base}
- **Accent:** ${c.accent.base}
- **Background:** ${c.background}
- **Surface:** ${c.surface}
- **Dark Mode:** ${c.darkMode ? 'Sim' : 'Não'}

## Tipografia
- **Body:** ${ds.typography.fontFamily}
- **Heading:** ${ds.typography.headingFamily} (weight: ${ds.typography.headingWeight})
- **Base size:** ${ds.typography.baseFontSize}

## Efeitos
- **Glassmorphism:** ${ds.effects.glassmorphism ? 'Sim' : 'Não'}
- **Gradients:** ${ds.effects.gradients ? 'Sim' : 'Não'}
- **Shadows:** ${ds.effects.shadows}
- **Animations:** ${ds.effects.animations}

---
*Gerado por NEXUS Design Agent v2 (LLM-powered) em ${new Date().toLocaleString('pt-BR')}*
`;
  }
}

module.exports = NexusDesignAgentV2;

// CLI
if (require.main === module) {
  const dnaPath = process.argv[2];
  if (!dnaPath) {
    console.log('Usage: node nexus-design-agent-v2.js <context-dna.json>');
    process.exit(1);
  }
  const agent = new NexusDesignAgentV2();
  agent.generate(dnaPath)
    .then(() => console.log('\n🎯 Próximo passo: Use o design system com Code Agent'))
    .catch(e => { console.error('❌ Erro:', e.message); process.exit(1); });
}
