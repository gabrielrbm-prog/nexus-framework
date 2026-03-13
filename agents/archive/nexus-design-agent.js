#!/usr/bin/env node

/*
 * 🎨 NEXUS DESIGN AGENT
 * Gera design system completo baseado no Context DNA
 * Input: Context DNA + Component Library
 * Output: Design system customizado + CSS variables + Component variants
 */

const fs = require('fs');
const path = require('path');

class NexusDesignAgent {
  constructor() {
    this.name = "NEXUS Design Agent";
    this.version = "1.0.0";
    this.capabilities = [
      "Context-Based Design Systems",
      "Color Psychology Application", 
      "Typography Optimization",
      "Component Customization",
      "Responsive Design Rules",
      "Dark Mode Generation",
      "CSS Variables Creation"
    ];
    
    // Path para nossa biblioteca de componentes
    this.componentLibraryPath = path.join(__dirname, '..', 'code-library');
  }

  /**
   * Processa Context DNA e gera design system completo
   */
  async processContextDNA(contextDNAPath) {
    console.log(`🎨 ${this.name} processando Context DNA...`);
    
    // Lê o Context DNA
    const contextDNA = JSON.parse(fs.readFileSync(contextDNAPath, 'utf8'));
    
    // Analisa requisitos de design baseado no contexto
    const designRequirements = this.analyzeDesignRequirements(contextDNA);
    
    // Gera design system
    const designSystem = this.generateDesignSystem(contextDNA, designRequirements);
    
    // Gera CSS customizado
    const customCSS = this.generateCustomCSS(designSystem, contextDNA);
    
    // Gera variantes de componentes
    const componentVariants = this.generateComponentVariants(designSystem, contextDNA);
    
    // Organiza os resultados
    const designAssets = this.organizeDesignAssets(designSystem, customCSS, componentVariants, contextDNA);
    
    return designAssets;
  }

  /**
   * Analisa o Context DNA para definir requisitos de design
   */
  analyzeDesignRequirements(contextDNA) {
    const businessType = contextDNA.project.businessType;
    const audience = contextDNA.audience;
    const visual = contextDNA.visual;
    const brand = contextDNA.brand;
    const psychology = contextDNA.psychology;
    
    return {
      businessType,
      targetAge: audience.primaryAge,
      visualDirection: visual,
      brandPersonality: brand,
      conversionPsychology: psychology,
      technicalRequirements: contextDNA.technical,
      devicePriority: this.getDevicePriority(audience),
      accessibilityLevel: this.getAccessibilityLevel(businessType),
      performanceGoals: this.getPerformanceGoals(businessType)
    };
  }

  /**
   * Gera o design system principal
   */
  generateDesignSystem(contextDNA, requirements) {
    const colorPalette = this.generateColorPalette(requirements);
    const typography = this.generateTypography(requirements);
    const spacing = this.generateSpacing(requirements);
    const elevation = this.generateElevation(requirements);
    const borders = this.generateBorders(requirements);
    const animations = this.generateAnimations(requirements);
    
    return {
      metadata: {
        projectName: path.basename(path.dirname(contextDNA.filePath || '')),
        businessType: requirements.businessType,
        targetAudience: requirements.targetAge,
        generated: new Date().toISOString(),
        agent: this.name
      },
      colors: colorPalette,
      typography: typography,
      spacing: spacing,
      elevation: elevation,
      borders: borders,
      animations: animations,
      breakpoints: this.generateBreakpoints(requirements),
      components: this.defineComponentStyles(requirements)
    };
  }

  /**
   * Gera paleta de cores baseada na psicologia e contexto
   */
  generateColorPalette(requirements) {
    const baseColor = this.getBaseColor(requirements.visualDirection.colorPsychology);
    const businessModifiers = this.getBusinessColorModifiers(requirements.businessType);
    const audienceModifiers = this.getAudienceColorModifiers(requirements.targetAge);
    
    // Gera paleta completa
    const palette = {
      // Cores primárias
      primary: this.generateColorScale(baseColor.primary, businessModifiers.primary),
      secondary: this.generateColorScale(baseColor.secondary, businessModifiers.secondary),
      accent: this.generateColorScale(baseColor.accent, businessModifiers.accent),
      
      // Cores semânticas
      success: this.generateColorScale('#10b981', businessModifiers.success),
      warning: this.generateColorScale('#f59e0b', businessModifiers.warning),
      error: this.generateColorScale('#ef4444', businessModifiers.error),
      info: this.generateColorScale('#3b82f6', businessModifiers.info),
      
      // Neutros
      neutral: this.generateNeutralScale(requirements),
      
      // Background layers
      background: this.generateBackgroundColors(requirements),
      
      // Text colors
      text: this.generateTextColors(requirements),
      
      // Border colors
      border: this.generateBorderColors(requirements)
    };

    return palette;
  }

  /**
   * Gera tipografia baseada no contexto
   */
  generateTypography(requirements) {
    const baseFonts = this.getBaseFonts(requirements.visualDirection.typography);
    const scaleRatio = this.getTypeScale(requirements);
    const lineHeights = this.getLineHeights(requirements);
    
    return {
      // Font families
      fontFamilies: {
        primary: baseFonts.primary,
        secondary: baseFonts.secondary,
        monospace: baseFonts.monospace
      },
      
      // Font weights
      fontWeights: {
        light: 300,
        regular: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800
      },
      
      // Type scale
      fontSize: this.generateTypeScale(scaleRatio, requirements),
      
      // Line heights
      lineHeight: lineHeights,
      
      // Letter spacing
      letterSpacing: this.generateLetterSpacing(requirements),
      
      // Text styles
      textStyles: this.generateTextStyles(requirements)
    };
  }

  /**
   * Gera CSS customizado baseado no design system
   */
  generateCustomCSS(designSystem, contextDNA) {
    const cssVariables = this.generateCSSVariables(designSystem);
    const componentCSS = this.generateComponentCSS(designSystem, contextDNA);
    const utilityCSS = this.generateUtilityCSS(designSystem);
    const responsiveCSS = this.generateResponsiveCSS(designSystem);
    const darkModeCSS = this.generateDarkModeCSS(designSystem);
    
    return {
      variables: cssVariables,
      components: componentCSS,
      utilities: utilityCSS,
      responsive: responsiveCSS,
      darkMode: darkModeCSS,
      complete: this.combineAllCSS(cssVariables, componentCSS, utilityCSS, responsiveCSS, darkModeCSS, designSystem)
    };
  }

  /**
   * Gera CSS variables do design system
   */
  generateCSSVariables(designSystem) {
    const vars = [];
    
    vars.push('/* ===========================================');
    vars.push(`   ${designSystem.metadata.projectName.toUpperCase()} DESIGN SYSTEM`);
    vars.push(`   Generated by ${this.name}`);
    vars.push(`   Business: ${designSystem.metadata.businessType}`);
    vars.push(`   Target: ${designSystem.metadata.targetAudience}`);
    vars.push(`   Generated: ${designSystem.metadata.generated}`);
    vars.push('   =========================================== */');
    vars.push('');
    vars.push(':root {');
    vars.push('  /* ===============================');
    vars.push('     COLOR PALETTE');
    vars.push('     =============================== */');
    
    // Primary colors
    Object.entries(designSystem.colors.primary).forEach(([key, value]) => {
      vars.push(`  --color-primary-${key}: ${value};`);
    });
    
    // Secondary colors
    Object.entries(designSystem.colors.secondary).forEach(([key, value]) => {
      vars.push(`  --color-secondary-${key}: ${value};`);
    });
    
    // Accent colors
    Object.entries(designSystem.colors.accent).forEach(([key, value]) => {
      vars.push(`  --color-accent-${key}: ${value};`);
    });
    
    // Semantic colors
    vars.push('');
    vars.push('  /* Semantic Colors */');
    Object.entries(designSystem.colors.success).forEach(([key, value]) => {
      vars.push(`  --color-success-${key}: ${value};`);
    });
    Object.entries(designSystem.colors.warning).forEach(([key, value]) => {
      vars.push(`  --color-warning-${key}: ${value};`);
    });
    Object.entries(designSystem.colors.error).forEach(([key, value]) => {
      vars.push(`  --color-error-${key}: ${value};`);
    });
    
    // Neutral colors
    vars.push('');
    vars.push('  /* Neutral Colors */');
    Object.entries(designSystem.colors.neutral).forEach(([key, value]) => {
      vars.push(`  --color-neutral-${key}: ${value};`);
    });
    
    // Background colors
    vars.push('');
    vars.push('  /* Background Colors */');
    Object.entries(designSystem.colors.background).forEach(([key, value]) => {
      vars.push(`  --color-bg-${key}: ${value};`);
    });
    
    // Text colors
    vars.push('');
    vars.push('  /* Text Colors */');
    Object.entries(designSystem.colors.text).forEach(([key, value]) => {
      vars.push(`  --color-text-${key}: ${value};`);
    });
    
    // Typography
    vars.push('');
    vars.push('  /* ===============================');
    vars.push('     TYPOGRAPHY');
    vars.push('     =============================== */');
    
    Object.entries(designSystem.typography.fontFamilies).forEach(([key, value]) => {
      vars.push(`  --font-family-${key}: ${value};`);
    });
    
    Object.entries(designSystem.typography.fontWeights).forEach(([key, value]) => {
      vars.push(`  --font-weight-${key}: ${value};`);
    });
    
    Object.entries(designSystem.typography.fontSize).forEach(([key, value]) => {
      vars.push(`  --font-size-${key}: ${value};`);
    });
    
    Object.entries(designSystem.typography.lineHeight).forEach(([key, value]) => {
      vars.push(`  --line-height-${key}: ${value};`);
    });
    
    // Spacing
    vars.push('');
    vars.push('  /* ===============================');
    vars.push('     SPACING');
    vars.push('     =============================== */');
    
    Object.entries(designSystem.spacing).forEach(([key, value]) => {
      vars.push(`  --spacing-${key}: ${value};`);
    });
    
    // Borders
    vars.push('');
    vars.push('  /* ===============================');
    vars.push('     BORDERS');
    vars.push('     =============================== */');
    
    Object.entries(designSystem.borders.radius).forEach(([key, value]) => {
      vars.push(`  --border-radius-${key}: ${value};`);
    });
    
    Object.entries(designSystem.borders.width).forEach(([key, value]) => {
      vars.push(`  --border-width-${key}: ${value};`);
    });
    
    // Elevation
    vars.push('');
    vars.push('  /* ===============================');
    vars.push('     ELEVATION');
    vars.push('     =============================== */');
    
    Object.entries(designSystem.elevation).forEach(([key, value]) => {
      vars.push(`  --shadow-${key}: ${value};`);
    });
    
    // Animations
    vars.push('');
    vars.push('  /* ===============================');
    vars.push('     ANIMATIONS');
    vars.push('     =============================== */');
    
    Object.entries(designSystem.animations.duration).forEach(([key, value]) => {
      vars.push(`  --duration-${key}: ${value};`);
    });
    
    Object.entries(designSystem.animations.easing).forEach(([key, value]) => {
      vars.push(`  --easing-${key}: ${value};`);
    });
    
    vars.push('}');
    vars.push('');
    
    return vars.join('\n');
  }

  /**
   * Organiza todos os assets de design
   */
  organizeDesignAssets(designSystem, customCSS, componentVariants, contextDNA) {
    const projectPath = path.dirname(path.dirname(contextDNA.filePath || ''));
    const designPath = path.join(projectPath, 'design-system');
    
    // Cria diretório de design system
    if (!fs.existsSync(designPath)) {
      fs.mkdirSync(designPath, { recursive: true });
    }

    const assets = {
      designSystem: designSystem,
      css: customCSS,
      components: componentVariants,
      generated: new Date().toISOString(),
      successful: true,
      files: []
    };

    // Salva design system JSON
    const designSystemPath = path.join(designPath, 'design-system.json');
    fs.writeFileSync(designSystemPath, JSON.stringify(designSystem, null, 2));
    assets.files.push(designSystemPath);

    // Salva CSS variables
    const variablesPath = path.join(designPath, 'variables.css');
    fs.writeFileSync(variablesPath, customCSS.variables);
    assets.files.push(variablesPath);

    // Salva CSS completo
    const completeCSSPath = path.join(designPath, 'design-system.css');
    fs.writeFileSync(completeCSSPath, customCSS.complete);
    assets.files.push(completeCSSPath);

    // Salva componentes customizados
    if (componentVariants && Object.keys(componentVariants).length > 0) {
      const componentsPath = path.join(designPath, 'components.css');
      fs.writeFileSync(componentsPath, this.generateComponentsCSS(componentVariants));
      assets.files.push(componentsPath);
    }

    console.log(`💾 Design system salvo em: ${designPath}`);
    
    return assets;
  }

  // Métodos auxiliares para geração de cores
  getBaseColor(colorPsychology) {
    const colorMap = {
      'trust_blue': {
        primary: '#3b82f6',
        secondary: '#1e293b',
        accent: '#06b6d4'
      },
      'converting_orange': {
        primary: '#f97316',
        secondary: '#ea580c',
        accent: '#fb923c'
      },
      'productive_purple': {
        primary: '#8b5cf6',
        secondary: '#7c3aed',
        accent: '#a78bfa'
      },
      'success_green': {
        primary: '#10b981',
        secondary: '#059669',
        accent: '#34d399'
      }
    };
    
    return colorMap[colorPsychology] || colorMap['trust_blue'];
  }

  getBusinessColorModifiers(businessType) {
    const modifiers = {
      'fintech': { primary: 1.0, secondary: 0.9, accent: 1.1, success: 1.0 },
      'ecommerce': { primary: 1.1, secondary: 1.0, accent: 1.2, success: 1.1 },
      'healthcare': { primary: 0.9, secondary: 0.8, accent: 1.0, success: 0.9 },
      'saas': { primary: 1.0, secondary: 1.0, accent: 1.0, success: 1.0 }
    };
    
    return modifiers[businessType] || modifiers['saas'];
  }

  getAudienceColorModifiers(targetAge) {
    const modifiers = {
      'gen_z': { saturation: 1.2, brightness: 1.1 },
      'millennial': { saturation: 1.0, brightness: 1.0 },
      'gen_x': { saturation: 0.9, brightness: 0.95 },
      'boomer': { saturation: 0.8, brightness: 0.9 }
    };
    
    return modifiers[targetAge] || modifiers['millennial'];
  }

  generateColorScale(baseColor, modifier = 1.0) {
    // Simplified color scale generation
    return {
      '50': this.lighten(baseColor, 0.95 * modifier),
      '100': this.lighten(baseColor, 0.9 * modifier),
      '200': this.lighten(baseColor, 0.8 * modifier),
      '300': this.lighten(baseColor, 0.6 * modifier),
      '400': this.lighten(baseColor, 0.3 * modifier),
      '500': baseColor,
      '600': this.darken(baseColor, 0.1 * modifier),
      '700': this.darken(baseColor, 0.2 * modifier),
      '800': this.darken(baseColor, 0.3 * modifier),
      '900': this.darken(baseColor, 0.4 * modifier)
    };
  }

  lighten(color, amount) {
    // Simplified color lightening
    return color; // Placeholder - would implement proper color manipulation
  }

  darken(color, amount) {
    // Simplified color darkening  
    return color; // Placeholder - would implement proper color manipulation
  }

  generateNeutralScale(requirements) {
    // Generate neutral colors based on business type
    const base = requirements.businessType === 'fintech' ? '#0f172a' : '#1a1a1a';
    
    return {
      '50': '#fafafa',
      '100': '#f4f4f5',
      '200': '#e4e4e7',
      '300': '#d4d4d8',
      '400': '#a1a1aa',
      '500': '#71717a',
      '600': '#52525b',
      '700': '#3f3f46',
      '800': '#27272a',
      '900': base
    };
  }

  generateBackgroundColors(requirements) {
    return {
      'primary': 'var(--color-neutral-50)',
      'secondary': 'var(--color-neutral-100)',
      'tertiary': 'var(--color-neutral-200)',
      'inverse': 'var(--color-neutral-900)',
      'accent': 'var(--color-primary-50)',
      'success': 'var(--color-success-50)',
      'warning': 'var(--color-warning-50)',
      'error': 'var(--color-error-50)'
    };
  }

  generateTextColors(requirements) {
    return {
      'primary': 'var(--color-neutral-900)',
      'secondary': 'var(--color-neutral-600)',
      'tertiary': 'var(--color-neutral-400)',
      'inverse': 'var(--color-neutral-50)',
      'accent': 'var(--color-primary-600)',
      'success': 'var(--color-success-600)',
      'warning': 'var(--color-warning-600)',
      'error': 'var(--color-error-600)'
    };
  }

  generateBorderColors(requirements) {
    return {
      'primary': 'var(--color-neutral-200)',
      'secondary': 'var(--color-neutral-100)',
      'focus': 'var(--color-primary-500)',
      'error': 'var(--color-error-500)'
    };
  }

  // Métodos auxiliares para tipografia
  getBaseFonts(typography) {
    const fontMap = {
      'modern_sans': {
        primary: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
        secondary: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
        monospace: '"Fira Code", "Monaco", "Cascadia Code", "Roboto Mono", monospace'
      },
      'friendly_rounded': {
        primary: '"Nunito Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
        secondary: '"Nunito Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
        monospace: '"Fira Code", "Monaco", "Cascadia Code", "Roboto Mono", monospace'
      },
      'tech_geometric': {
        primary: '"Space Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
        secondary: '"Space Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
        monospace: '"Fira Code", "Monaco", "Cascadia Code", "Roboto Mono", monospace'
      }
    };
    
    return fontMap[typography] || fontMap['modern_sans'];
  }

  getTypeScale(requirements) {
    // Different scale ratios based on business type
    const scales = {
      'fintech': 1.25, // Major third - professional
      'ecommerce': 1.333, // Perfect fourth - dynamic
      'healthcare': 1.2, // Minor third - conservative
      'saas': 1.25 // Major third - balanced
    };
    
    return scales[requirements.businessType] || 1.25;
  }

  generateTypeScale(ratio, requirements) {
    const baseFontSize = requirements.targetAge === 'gen_z' ? 16 : 
                       requirements.targetAge === 'boomer' ? 18 : 16;
    
    return {
      'xs': `${Math.round(baseFontSize / Math.pow(ratio, 2))}px`,
      'sm': `${Math.round(baseFontSize / ratio)}px`,
      'base': `${baseFontSize}px`,
      'lg': `${Math.round(baseFontSize * ratio)}px`,
      'xl': `${Math.round(baseFontSize * Math.pow(ratio, 2))}px`,
      '2xl': `${Math.round(baseFontSize * Math.pow(ratio, 3))}px`,
      '3xl': `${Math.round(baseFontSize * Math.pow(ratio, 4))}px`,
      '4xl': `${Math.round(baseFontSize * Math.pow(ratio, 5))}px`,
      '5xl': `${Math.round(baseFontSize * Math.pow(ratio, 6))}px`
    };
  }

  getLineHeights(requirements) {
    return {
      'tight': '1.1',
      'normal': '1.4',
      'relaxed': '1.6',
      'loose': '1.8'
    };
  }

  generateLetterSpacing(requirements) {
    return {
      'tight': '-0.025em',
      'normal': '0em',
      'wide': '0.025em',
      'wider': '0.05em',
      'widest': '0.1em'
    };
  }

  generateTextStyles(requirements) {
    return {
      'h1': {
        fontSize: 'var(--font-size-4xl)',
        fontWeight: 'var(--font-weight-bold)',
        lineHeight: 'var(--line-height-tight)',
        letterSpacing: 'var(--letter-spacing-tight)'
      },
      'h2': {
        fontSize: 'var(--font-size-3xl)',
        fontWeight: 'var(--font-weight-semibold)',
        lineHeight: 'var(--line-height-tight)'
      },
      'h3': {
        fontSize: 'var(--font-size-2xl)',
        fontWeight: 'var(--font-weight-semibold)',
        lineHeight: 'var(--line-height-normal)'
      },
      'body': {
        fontSize: 'var(--font-size-base)',
        fontWeight: 'var(--font-weight-regular)',
        lineHeight: 'var(--line-height-relaxed)'
      },
      'caption': {
        fontSize: 'var(--font-size-sm)',
        fontWeight: 'var(--font-weight-regular)',
        lineHeight: 'var(--line-height-normal)'
      }
    };
  }

  // Outros métodos auxiliares
  generateSpacing(requirements) {
    const base = 4; // 4px base unit
    const scale = requirements.targetAge === 'gen_z' ? 1.0 : 1.2;
    
    return {
      '0': '0',
      '1': `${base * 1 * scale}px`,
      '2': `${base * 2 * scale}px`,
      '3': `${base * 3 * scale}px`,
      '4': `${base * 4 * scale}px`,
      '6': `${base * 6 * scale}px`,
      '8': `${base * 8 * scale}px`,
      '12': `${base * 12 * scale}px`,
      '16': `${base * 16 * scale}px`,
      '20': `${base * 20 * scale}px`,
      '24': `${base * 24 * scale}px`,
      '32': `${base * 32 * scale}px`,
      '40': `${base * 40 * scale}px`,
      '48': `${base * 48 * scale}px`,
      '64': `${base * 64 * scale}px`
    };
  }

  generateElevation(requirements) {
    return {
      'none': 'none',
      'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      'base': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
    };
  }

  generateBorders(requirements) {
    return {
      radius: {
        'none': '0',
        'sm': '2px',
        'base': '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
        '2xl': '16px',
        'full': '9999px'
      },
      width: {
        'none': '0',
        'thin': '1px',
        'base': '2px',
        'thick': '4px'
      }
    };
  }

  generateAnimations(requirements) {
    return {
      duration: {
        'fastest': '100ms',
        'fast': '200ms',
        'normal': '300ms',
        'slow': '500ms',
        'slowest': '800ms'
      },
      easing: {
        'linear': 'linear',
        'ease': 'ease',
        'ease-in': 'ease-in',
        'ease-out': 'ease-out',
        'ease-in-out': 'ease-in-out',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)'
      }
    };
  }

  generateBreakpoints(requirements) {
    return {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px'
    };
  }

  defineComponentStyles(requirements) {
    // Define estilos base para componentes baseados no contexto
    return {
      button: this.getButtonStyles(requirements),
      card: this.getCardStyles(requirements),
      input: this.getInputStyles(requirements),
      modal: this.getModalStyles(requirements)
    };
  }

  getButtonStyles(requirements) {
    const psychology = requirements.conversionPsychology.primary;
    
    if (psychology === 'urgency') {
      return {
        primary: 'bold colors, action-oriented, contrasting',
        secondary: 'outlined style, less prominent'
      };
    } else if (psychology === 'trust') {
      return {
        primary: 'solid, professional, reliable appearance',
        secondary: 'subtle, trustworthy styling'
      };
    }
    
    return {
      primary: 'balanced, professional styling',
      secondary: 'outlined, secondary styling'
    };
  }

  getCardStyles(requirements) {
    return {
      base: 'clean borders, appropriate shadows',
      interactive: 'hover effects, cursor pointer'
    };
  }

  getInputStyles(requirements) {
    return {
      base: 'clean styling, clear focus states',
      error: 'error color borders and text'
    };
  }

  getModalStyles(requirements) {
    return {
      backdrop: 'semi-transparent overlay',
      container: 'centered, appropriate shadows'
    };
  }

  // Métodos para geração de CSS
  generateComponentCSS(designSystem, contextDNA) {
    // Placeholder para CSS de componentes customizados
    return `
/* Component customizations based on Context DNA */
/* Business Type: ${contextDNA.project.businessType} */
/* Target: ${contextDNA.audience.primaryAge} */
/* Psychology: ${contextDNA.psychology.primary} */
`;
  }

  generateUtilityCSS(designSystem) {
    return `
/* Utility classes */
.text-primary { color: var(--color-text-primary); }
.text-secondary { color: var(--color-text-secondary); }
.bg-primary { background-color: var(--color-bg-primary); }
.bg-secondary { background-color: var(--color-bg-secondary); }
`;
  }

  generateResponsiveCSS(designSystem) {
    return `
/* Responsive utilities */
@media (min-width: ${designSystem.breakpoints.md}) {
  .md\\:text-lg { font-size: var(--font-size-lg); }
}
`;
  }

  generateDarkModeCSS(designSystem) {
    return `
/* Dark mode overrides */
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg-primary: var(--color-neutral-900);
    --color-text-primary: var(--color-neutral-50);
  }
}
`;
  }

  combineAllCSS(variables, components, utilities, responsive, darkMode, designSystem) {
    return `${variables}

${components}

${utilities}

${responsive}

${darkMode}

/* ===========================================
   DESIGN SYSTEM COMPLETE
   Generated by NEXUS Design Agent
   Business: ${designSystem.metadata.businessType}
   Target: ${designSystem.metadata.targetAudience}
   =========================================== */`;
  }

  generateComponentVariants(designSystem, contextDNA) {
    // Placeholder para variantes de componentes
    return {};
  }

  generateComponentsCSS(componentVariants) {
    // Placeholder para CSS de variantes
    return '/* Component variants CSS */';
  }

  // Métodos auxiliares
  getDevicePriority(audience) {
    const deviceMap = {
      'gen_z': 'mobile-first',
      'millennial': 'mobile-first', 
      'gen_x': 'desktop-focus',
      'boomer': 'desktop-focus'
    };
    
    return deviceMap[audience.primaryAge] || 'mobile-first';
  }

  getAccessibilityLevel(businessType) {
    const levelMap = {
      'healthcare': 'AAA',
      'fintech': 'AA',
      'ecommerce': 'AA',
      'saas': 'AA'
    };
    
    return levelMap[businessType] || 'AA';
  }

  getPerformanceGoals(businessType) {
    const goalMap = {
      'ecommerce': 'high',
      'fintech': 'high',
      'healthcare': 'medium',
      'saas': 'high'
    };
    
    return goalMap[businessType] || 'medium';
  }

  /**
   * Gera relatório do design system criado
   */
  generateDesignReport(designAssets, contextDNA) {
    const designSystem = designAssets.designSystem;
    
    return `# 🎨 NEXUS Design System - Relatório

## 📊 **Resumo da Geração**
- **Projeto:** ${designSystem.metadata.projectName}
- **Business Type:** ${designSystem.metadata.businessType}
- **Target Audience:** ${designSystem.metadata.targetAudience}
- **Gerado em:** ${designSystem.metadata.generated}
- **Status:** ${designAssets.successful ? 'Sucesso ✅' : 'Erro ❌'}

## 🎯 **Context DNA Aplicado**
- **Psicologia de Cor:** ${contextDNA.visual.colorPsychology}
- **Tipografia:** ${contextDNA.visual.typography}
- **Layout:** ${contextDNA.visual.layout}
- **Tom da Marca:** ${contextDNA.brand.voiceTone}
- **Trigger de Conversão:** ${contextDNA.psychology.primary}

## 🎨 **Sistema de Cores**
- **Paleta Primária:** ${Object.keys(designSystem.colors.primary).length} variações
- **Cores Semânticas:** Success, Warning, Error, Info
- **Neutros:** ${Object.keys(designSystem.colors.neutral).length} tons
- **Backgrounds:** ${Object.keys(designSystem.colors.background).length} camadas
- **Texto:** ${Object.keys(designSystem.colors.text).length} hierarquias

## 📝 **Sistema Tipográfico**
- **Font Stack:** ${designSystem.typography.fontFamilies.primary}
- **Pesos:** ${Object.keys(designSystem.typography.fontWeights).length} variações
- **Escala:** ${Object.keys(designSystem.typography.fontSize).length} tamanhos
- **Line Heights:** ${Object.keys(designSystem.typography.lineHeight).length} valores

## 📐 **Sistema de Espaçamento**
- **Unidades:** ${Object.keys(designSystem.spacing).length} valores
- **Bordas:** ${Object.keys(designSystem.borders.radius).length} raios
- **Elevação:** ${Object.keys(designSystem.elevation).length} sombras

## ⚡ **Sistema de Animação**
- **Durações:** ${Object.keys(designSystem.animations.duration).length} velocidades
- **Easing:** ${Object.keys(designSystem.animations.easing).length} curvas

## 📱 **Responsividade**
- **Breakpoints:** ${Object.keys(designSystem.breakpoints).length} pontos
- **Prioridade:** ${this.getDevicePriority(contextDNA.audience)}
- **Acessibilidade:** ${this.getAccessibilityLevel(contextDNA.project.businessType)}

## 📁 **Arquivos Gerados**
${designAssets.files.map(file => `- ${path.basename(file)}`).join('\n')}

## 🚀 **Próximos Passos**
1. Aplicar design system aos componentes
2. Testar responsividade
3. Validar acessibilidade
4. Integração com Code Agent
5. Deploy e testes A/B

## 💡 **Recomendações Contextuais**
- **Para ${designSystem.metadata.businessType}:** ${this.getBusinessRecommendations(designSystem.metadata.businessType)}
- **Para ${designSystem.metadata.targetAudience}:** ${this.getAudienceRecommendations(designSystem.metadata.targetAudience)}

---
*Gerado por ${this.name} em ${new Date().toISOString()}*
`;
  }

  getBusinessRecommendations(businessType) {
    const recommendations = {
      'fintech': 'Foque em transparência, use muitos white space, destaque certificações',
      'ecommerce': 'Otimize CTAs, use urgência visual, destaque promoções',
      'healthcare': 'Priorize legibilidade, use tons suaves, destaque credibilidade',
      'saas': 'Foque em funcionalidade, use layouts limpos, destaque features'
    };
    
    return recommendations[businessType] || 'Design clean e profissional';
  }

  getAudienceRecommendations(audience) {
    const recommendations = {
      'gen_z': 'Use elementos visuais dinâmicos, cores vibrantes, micro-interações',
      'millennial': 'Balance profissional e moderno, foque em usabilidade',
      'gen_x': 'Priorize clareza, use layouts familiares, foque em confiança',
      'boomer': 'Use fontes maiores, contraste alto, navegação simples'
    };
    
    return recommendations[audience] || 'Design balanceado e acessível';
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🎨 NEXUS Design Agent v1.0.0

Uso:
  node nexus-design-agent.js <context-dna-path>

Exemplo:
  node nexus-design-agent.js ../projects/etf-landing/context-dna.json
    `);
    process.exit(1);
  }

  const contextDNAPath = args[0];
  
  // Verifica se o arquivo existe
  if (!fs.existsSync(contextDNAPath)) {
    console.error(`❌ Arquivo não encontrado: ${contextDNAPath}`);
    process.exit(1);
  }
  
  const agent = new NexusDesignAgent();
  
  console.log('🚀 Iniciando geração de design system...');
  console.log(`📄 Context DNA: ${contextDNAPath}`);
  console.log('');

  try {
    const designAssets = await agent.processContextDNA(contextDNAPath);
    
    // Gera relatório
    const contextDNA = JSON.parse(fs.readFileSync(contextDNAPath, 'utf8'));
    const report = agent.generateDesignReport(designAssets, contextDNA);
    
    const reportPath = path.join(path.dirname(contextDNAPath), 'design-report.md');
    fs.writeFileSync(reportPath, report);
    
    console.log('');
    console.log('✅ Design system gerado com sucesso!');
    console.log('📊 Estatísticas:');
    console.log(`   - Business Type: ${designAssets.designSystem.metadata.businessType}`);
    console.log(`   - Target: ${designAssets.designSystem.metadata.targetAudience}`);
    console.log(`   - Cores: ${Object.keys(designAssets.designSystem.colors.primary).length} primary + neutros + semânticas`);
    console.log(`   - Tipografia: ${Object.keys(designAssets.designSystem.typography.fontSize).length} tamanhos`);
    console.log(`   - Arquivos: ${designAssets.files.length} gerados`);
    console.log('');
    console.log('📁 Arquivos gerados:');
    designAssets.files.forEach(file => {
      console.log(`   - ${path.basename(file)}`);
    });
    console.log(`   - ${path.basename(reportPath)} (relatório)`);
    console.log('');
    console.log('🎯 Próximo passo: Use o design system com Code Agent');
    
  } catch (error) {
    console.error('❌ Erro ao gerar design system:', error.message);
    process.exit(1);
  }
}

// Executa se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = NexusDesignAgent;