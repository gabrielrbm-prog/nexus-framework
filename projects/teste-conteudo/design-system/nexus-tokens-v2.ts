/**
 * 🌌 NEXUS Design Tokens V2
 * Evolved with FlowPilot insights + AI design intelligence
 * Scientific color psychology + micro-animation system
 */

export const nexusTokens = {
  /* ══════════════════════════════════════════════
     COLOR SYSTEM — FlowPilot Enhanced
     ══════════════════════════════════════════════ */
  
  colors: {
    // Primary (Cyan) — Trust + Technology + Innovation
    primary: {
      50: '#ecfeff',
      100: '#cffafe', 
      200: '#a5f3fc',
      300: '#67e8f9',   // FlowPilot highlight
      400: '#22d3ee',
      500: '#06b6d4',   // FlowPilot primary
      600: '#0891b2',   // FlowPilot dark
      700: '#0e7490',
      800: '#155e75',
      900: '#164e63',
      950: '#083344',
      glow: 'rgba(6,182,212,.35)' // FlowPilot glow
    },
    
    // Accent (Purple) — Creativity + Premium + Magic
    accent: {
      300: '#c4b5fd',
      400: '#a78bfa',   // FlowPilot light
      500: '#8b5cf6',   // FlowPilot purple
      600: '#7c3aed',
      700: '#6d28d9',
      glow: 'rgba(139,92,246,.25)' // FlowPilot purple glow
    },
    
    // Secondary (Teal) — Growth + Success + Nature
    secondary: {
      400: '#2dd4bf',
      500: '#14b8a6',   // FlowPilot teal
      600: '#0d9488',
      glow: 'rgba(20,184,166,.15)'
    },
    
    // Surfaces (Navy Spectrum) — FlowPilot Mastery
    surface: {
      base: '#050a14',      // FlowPilot navy
      raised: '#0a1225',    // FlowPilot card
      overlay: '#0d1730',   // FlowPilot card2  
      interactive: '#111d3a', // FlowPilot card3
      hover: '#162950',
      pressed: '#1e3566'
    },
    
    // Text (Semantic Hierarchy) — FlowPilot Scientific
    text: {
      primary: '#e8ecf4',                    // FlowPilot fg
      secondary: 'rgba(232,236,244,.55)',    // FlowPilot dim
      tertiary: 'rgba(232,236,244,.3)',      // FlowPilot muted
      ghost: 'rgba(232,236,244,.15)',        // FlowPilot ghost
      inverse: '#050a14'
    },
    
    // Semantic Colors
    semantic: {
      success: '#22c55e',    // FlowPilot green
      warning: '#f59e0b',    // FlowPilot amber  
      danger: '#ef4444',     // FlowPilot red
      info: '#3b82f6'        // FlowPilot blue
    },
    
    // Social & Brand
    social: {
      whatsapp: '#25D366',   // FlowPilot wa
      instagram: '#E1306C',  // FlowPilot ig
      youtube: '#FF0000',
      linkedin: '#0077B5'
    }
  },

  /* ══════════════════════════════════════════════
     TYPOGRAPHY SYSTEM — FlowPilot Enhanced
     ══════════════════════════════════════════════ */
  
  typography: {
    fonts: {
      primary: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', // FlowPilot
      mono: "'JetBrains Mono', monospace", // FlowPilot
      display: 'var(--font-display)', // Custom display font injection
    },
    
    // FlowPilot-inspired fluid scale
    fontSize: {
      xs: 'clamp(0.68rem, 0.6rem + 0.4vw, 0.75rem)',     // FlowPilot labels
      sm: 'clamp(0.72rem, 0.65rem + 0.35vw, 0.875rem)',   
      base: 'clamp(1rem, 0.9rem + 0.5vw, 1.125rem)',      // FlowPilot desc
      lg: 'clamp(1.05rem, 0.95rem + 0.5vw, 1.25rem)',
      xl: 'clamp(1.2rem, 1.05rem + 0.75vw, 1.5rem)',
      '2xl': 'clamp(1.4rem, 1.2rem + 1vw, 1.875rem)',     // FlowPilot h3
      '3xl': 'clamp(1.8rem, 1.5rem + 1.5vw, 2.25rem)',    
      '4xl': 'clamp(2.2rem, 1.8rem + 2vw, 2.8rem)',       // FlowPilot h2
      '5xl': 'clamp(3rem, 2.2rem + 4vw, 5.5rem)',         // FlowPilot hero
    },
    
    // FlowPilot letter-spacing mastery
    letterSpacing: {
      tighter: '-.045em',    // FlowPilot hero
      tight: '-.035em',      // FlowPilot h2
      normal: '-.02em',      // FlowPilot h3
      wide: '.04em',         // FlowPilot nav links
      wider: '.08em',        // FlowPilot badges
      widest: '.14em'        // FlowPilot labels
    },
    
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',       // FlowPilot labels
      bold: '700',           // FlowPilot h3
      extrabold: '800',      // FlowPilot h2  
      black: '900'           // FlowPilot hero
    },
    
    lineHeight: {
      none: '1',
      tight: '1.05',         // FlowPilot hero
      snug: '1.12',          // FlowPilot h2
      normal: '1.25',        // FlowPilot h3
      relaxed: '1.7',        // FlowPilot body
      loose: '1.8'           // FlowPilot descriptions
    }
  },

  /* ══════════════════════════════════════════════
     SPACING SYSTEM — Harmonic Scale
     ══════════════════════════════════════════════ */
  
  spacing: {
    0: '0',
    px: '1px',
    0.5: '0.125rem',    // 2px
    1: '0.25rem',       // 4px
    1.5: '0.375rem',    // 6px
    2: '0.5rem',        // 8px
    2.5: '0.625rem',    // 10px
    3: '0.75rem',       // 12px
    3.5: '0.875rem',    // 14px
    4: '1rem',          // 16px
    5: '1.25rem',       // 20px
    6: '1.5rem',        // 24px
    7: '1.75rem',       // 28px
    8: '2rem',          // 32px
    10: '2.5rem',       // 40px
    12: '3rem',         // 48px
    16: '4rem',         // 64px
    20: '5rem',         // 80px — FlowPilot section padding
    24: '6rem',         // 96px — FlowPilot large padding
    32: '8rem',         // 128px
    40: '10rem',        // 160px
    48: '12rem',        // 192px
    56: '14rem',        // 224px
    64: '16rem'         // 256px
  },

  /* ══════════════════════════════════════════════
     BORDER RADIUS — FlowPilot Style
     ══════════════════════════════════════════════ */
  
  borderRadius: {
    none: '0',
    sm: '8px',           // FlowPilot r-sm
    md: '12px',          // FlowPilot r-md  
    lg: '16px',          // FlowPilot r-lg
    xl: '20px',          // FlowPilot r-xl
    '2xl': '24px',       // FlowPilot r-2xl
    full: '9999px'       // FlowPilot r-full
  },

  /* ══════════════════════════════════════════════
     SHADOWS — Depth System
     ══════════════════════════════════════════════ */
  
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    
    // FlowPilot-inspired glows
    'glow-primary': '0 0 24px rgba(6,182,212,.08)',      // FlowPilot badge
    'glow-accent': '0 0 20px rgba(139,92,246,.1)',
    'glow-hover': '0 0 50px rgba(6,182,212,.06)',        // FlowPilot card hover
    'glow-intense': '0 0 60px rgba(6,182,212,.15)'       // FlowPilot accent card
  },

  /* ══════════════════════════════════════════════
     ANIMATION SYSTEM — FlowPilot Enhanced
     ══════════════════════════════════════════════ */
  
  animations: {
    durations: {
      instant: '100ms',     // Micro-feedbacks
      fast: '200ms',        // Hover states
      normal: '300ms',      // Standard transitions
      slow: '500ms',        // Complex animations
      slower: '800ms',      // Dramatic entrances
      breathe: '4s',        // FlowPilot breathing
      pulse: '2s'           // FlowPilot neon pulse
    },
    
    // FlowPilot-inspired easing curves
    easings: {
      linear: 'linear',
      out: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',      // Natural deceleration
      inOut: 'cubic-bezier(0.645, 0.045, 0.355, 1)',    // Smooth transitions
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Playful
      dramatic: 'cubic-bezier(0.23, 1, 0.320, 1)'       // Cinematic
    },
    
    // Keyframe animations
    keyframes: {
      // FlowPilot breathing effect
      breathe: {
        '0%, 100%': { 
          opacity: '0.7', 
          transform: 'translateX(-50%) scale(1)' 
        },
        '50%': { 
          opacity: '1', 
          transform: 'translateX(-50%) scale(1.05)' 
        }
      },
      
      // FlowPilot neon pulse
      neonPulse: {
        '0%, 100%': { 
          filter: 'drop-shadow(0 0 8px var(--primary-glow))' 
        },
        '50%': { 
          filter: 'drop-shadow(0 0 20px var(--primary-glow)) drop-shadow(0 0 40px rgba(6,182,212,.15))' 
        }
      },
      
      // NEXUS additions
      fadeInUp: {
        '0%': { opacity: '0', transform: 'translateY(30px)' },
        '100%': { opacity: '1', transform: 'translateY(0)' }
      },
      
      scaleIn: {
        '0%': { opacity: '0', transform: 'scale(0.9)' },
        '100%': { opacity: '1', transform: 'scale(1)' }
      },
      
      slideInRight: {
        '0%': { opacity: '0', transform: 'translateX(30px)' },
        '100%': { opacity: '1', transform: 'translateX(0)' }
      }
    }
  },

  /* ══════════════════════════════════════════════
     COMPONENT TOKENS — FlowPilot Patterns
     ══════════════════════════════════════════════ */
  
  components: {
    // FlowPilot hero badge pattern
    badge: {
      padding: '0.35rem 1rem',
      borderRadius: '100px',
      background: 'rgba(6,182,212,.08)',
      border: '1px solid rgba(6,182,212,.2)',
      fontSize: '0.72rem',
      fontWeight: '600',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      boxShadow: '0 0 20px rgba(6,182,212,.1)'
    },
    
    // FlowPilot navigation pattern
    navigation: {
      background: 'rgba(5,10,20,.9)',
      backdropFilter: 'blur(24px)',
      borderBottom: '1px solid rgba(6,182,212,.08)',
      height: '56px'
    },
    
    // FlowPilot card pattern
    card: {
      background: 'var(--surface-raised)',
      border: '1px solid rgba(6,182,212,.06)',
      borderRadius: '20px',
      padding: '3rem 2rem',
      transition: 'box-shadow .4s, border-color .3s'
    },
    
    // FlowPilot button patterns
    button: {
      primary: {
        background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
        color: 'var(--text-inverse)',
        padding: '0.75rem 2rem',
        borderRadius: 'var(--radius-xl)',
        fontWeight: '600',
        boxShadow: 'var(--shadow-glow-primary)'
      },
      
      secondary: {
        background: 'transparent',
        color: 'var(--primary-400)',
        border: '1px solid rgba(6,182,212,.2)',
        padding: '0.75rem 2rem',
        borderRadius: 'var(--radius-xl)',
        fontWeight: '600'
      }
    }
  },

  /* ══════════════════════════════════════════════
     BREAKPOINTS — Mobile-First
     ══════════════════════════════════════════════ */
  
  breakpoints: {
    xs: '475px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
    
    // FlowPilot container max-widths
    container: {
      sm: '640px',
      md: '768px', 
      lg: '1024px',
      xl: '1100px',    // FlowPilot sweet spot
      '2xl': '1200px'  // FlowPilot max
    }
  },

  /* ══════════════════════════════════════════════
     Z-INDEX SYSTEM
     ══════════════════════════════════════════════ */
  
  zIndex: {
    hide: '-1',
    auto: 'auto',
    base: '0',
    docked: '10',
    dropdown: '1000',
    sticky: '1100',
    banner: '1200', 
    overlay: '1300',
    modal: '1400',
    popover: '1500',
    skipLink: '1600',
    toast: '1700',
    tooltip: '1800'
  }
};

/* ══════════════════════════════════════════════
   NEXUS CSS VARIABLES EXPORT
   ══════════════════════════════════════════════ */

export const nexusCSSVariables = `
  /* FlowPilot + NEXUS Design Tokens */
  :root {
    /* Colors */
    --primary: ${nexusTokens.colors.primary[500]};
    --primary-light: ${nexusTokens.colors.primary[300]};
    --primary-glow: ${nexusTokens.colors.primary.glow};
    
    --accent: ${nexusTokens.colors.accent[500]};
    --accent-light: ${nexusTokens.colors.accent[400]};
    --accent-glow: ${nexusTokens.colors.accent.glow};
    
    --surface-base: ${nexusTokens.colors.surface.base};
    --surface-raised: ${nexusTokens.colors.surface.raised};
    --surface-overlay: ${nexusTokens.colors.surface.overlay};
    
    --text-primary: ${nexusTokens.colors.text.primary};
    --text-secondary: ${nexusTokens.colors.text.secondary};
    --text-tertiary: ${nexusTokens.colors.text.tertiary};
    --text-ghost: ${nexusTokens.colors.text.ghost};
    
    /* Typography */
    --font-primary: ${nexusTokens.typography.fonts.primary};
    --font-mono: ${nexusTokens.typography.fonts.mono};
    
    /* Spacing */
    --space-xs: ${nexusTokens.spacing[1]};
    --space-sm: ${nexusTokens.spacing[2]};
    --space-md: ${nexusTokens.spacing[4]};
    --space-lg: ${nexusTokens.spacing[8]};
    --space-xl: ${nexusTokens.spacing[16]};
    
    /* Border Radius */
    --radius-sm: ${nexusTokens.borderRadius.sm};
    --radius-md: ${nexusTokens.borderRadius.md};
    --radius-lg: ${nexusTokens.borderRadius.lg};
    --radius-xl: ${nexusTokens.borderRadius.xl};
    --radius-full: ${nexusTokens.borderRadius.full};
    
    /* Animations */
    --duration-fast: ${nexusTokens.animations.durations.fast};
    --duration-normal: ${nexusTokens.animations.durations.normal};
    --duration-slow: ${nexusTokens.animations.durations.slow};
    
    --ease-out: ${nexusTokens.animations.easings.out};
    --ease-in-out: ${nexusTokens.animations.easings.inOut};
    --ease-bounce: ${nexusTokens.animations.easings.bounce};
  }
`;

export default nexusTokens;