#!/usr/bin/env node
/**
 * NEXUS Trend Scout Agent v1.0
 *
 * Builds and maintains a reference database of web design trends organized by nicho.
 * This curated dataset serves as the foundation for all other NEXUS agents.
 *
 * Usage:
 *   node nexus-trend-scout-agent.js           # First run: create full DB
 *   node nexus-trend-scout-agent.js --update   # Re-scan / refresh data
 *   node nexus-trend-scout-agent.js --summary  # Print summary only
 *   node nexus-trend-scout-agent.js --nicho fintech  # Show specific nicho
 */

const fs = require("fs");
const path = require("path");

// --- Config ---
const BASE_DIR = path.join(
  process.env.HOME || "/root",
  ".openclaw/workspace/nexus-project"
);
const DB_DIR = path.join(BASE_DIR, "references-db");
const NICHES_DIR = path.join(DB_DIR, "niches");
const COMPONENTS_DIR = path.join(DB_DIR, "components");
const TODAY = new Date().toISOString().slice(0, 10);

// --- Curated Reference Sites ---
const CURATED_SITES = [
  // == Fintech / Trading ==
  {
    url: "stripe.com",
    nicho: "fintech",
    style: "clean-modern",
    colors: { primary: "#635bff", secondary: "#0a2540", accent: "#00d4aa", background: "#ffffff", text: "#425466" },
    fonts: ["Inter", "system-ui"],
    sections: ["nav", "hero", "features-grid", "testimonials", "pricing", "cta", "footer"],
    components: ["gradient-text", "card-grid", "feature-icon-cards", "testimonial-carousel", "pricing-table"],
    animations: ["fade-in-scroll", "hover-scale", "gradient-shift"],
    cta_patterns: ["Get Started", "Start now ->", "Contact Sales"],
    layout: "single-col-centered",
    tags: ["trust", "enterprise", "payment", "purple", "clean"],
    hero_type: "text-left-image-right",
    score: { design: 9, performance: 9, conversion: 8 },
    last_updated: TODAY
  },
  {
    url: "mercury.com",
    nicho: "fintech",
    style: "minimal-modern",
    colors: { primary: "#5856d6", secondary: "#1a1a2e", accent: "#7c6ef0", background: "#ffffff", text: "#333344" },
    fonts: ["GT Walsheim", "system-ui"],
    sections: ["nav", "hero", "trust-bar", "features", "integrations", "testimonials", "cta", "footer"],
    components: ["logo-wall", "feature-cards", "metric-counters", "testimonial-cards"],
    animations: ["fade-up", "counter-increment", "smooth-scroll"],
    cta_patterns: ["Open an account", "Get started free", "See how it works"],
    layout: "single-col-centered",
    tags: ["banking", "startup", "clean", "trust", "minimal"],
    hero_type: "centered-text-with-product-screenshot",
    score: { design: 9, performance: 8, conversion: 9 },
    last_updated: TODAY
  },
  {
    url: "ramp.com",
    nicho: "fintech",
    style: "bold-corporate",
    colors: { primary: "#6c47ff", secondary: "#1a0a3e", accent: "#ffcc00", background: "#f8f7ff", text: "#1a0a3e" },
    fonts: ["Graphik", "system-ui"],
    sections: ["nav", "hero", "stats-bar", "features-showcase", "integrations", "case-studies", "pricing", "cta", "footer"],
    components: ["stats-counter", "tabbed-features", "integration-grid", "case-study-cards", "pricing-comparison"],
    animations: ["scroll-reveal", "number-count-up", "tab-transition", "hover-lift"],
    cta_patterns: ["Get started free", "Request a demo", "Talk to sales"],
    layout: "single-col-centered",
    tags: ["corporate", "expense", "bold", "purple", "enterprise"],
    hero_type: "text-center-with-dashboard-preview",
    score: { design: 8, performance: 8, conversion: 9 },
    last_updated: TODAY
  },
  {
    url: "ftmo.com",
    nicho: "trading",
    style: "dark-trust",
    colors: { primary: "#00b4d8", secondary: "#0a0a1a", accent: "#f5a623", background: "#0d0d1a", text: "#e0e0e0" },
    fonts: ["Poppins", "sans-serif"],
    sections: ["nav", "hero", "how-it-works", "stats", "features", "testimonials", "faq", "cta", "footer"],
    components: ["step-cards", "stat-counters", "video-modal", "faq-accordion", "trust-badges"],
    animations: ["fade-in", "counter-up", "pulse-glow", "slide-in"],
    cta_patterns: ["Start FTMO Challenge", "Get funded", "Begin your journey"],
    layout: "single-col-centered",
    tags: ["trading", "forex", "dark", "trust", "challenge", "funded"],
    hero_type: "centered-text-with-cta-button",
    score: { design: 7, performance: 7, conversion: 9 },
    last_updated: TODAY
  },
  {
    url: "linear.app",
    nicho: "fintech",
    style: "dark-developer",
    colors: { primary: "#5e6ad2", secondary: "#171723", accent: "#8b5cf6", background: "#0a0a15", text: "#d4d4e0" },
    fonts: ["Inter", "system-ui"],
    sections: ["nav", "hero", "features-bento", "integrations", "workflow", "customers", "cta", "footer"],
    components: ["bento-grid", "feature-spotlight", "keyboard-shortcut-hints", "customer-logos", "changelog-feed"],
    animations: ["fade-in-stagger", "gradient-aurora", "hover-glow", "parallax-subtle"],
    cta_patterns: ["Get started", "Start building", "Try Linear free"],
    layout: "single-col-centered",
    tags: ["developer", "productivity", "dark", "clean", "fast"],
    hero_type: "centered-text-with-gradient-background",
    score: { design: 10, performance: 10, conversion: 8 },
    last_updated: TODAY
  },
  {
    url: "wise.com",
    nicho: "fintech",
    style: "friendly-modern",
    colors: { primary: "#9fe870", secondary: "#163300", accent: "#2ed06e", background: "#ffffff", text: "#2e3033" },
    fonts: ["Gilroy", "system-ui"],
    sections: ["nav", "hero", "calculator", "how-it-works", "features", "trust-bar", "reviews", "cta", "footer"],
    components: ["currency-calculator", "step-timeline", "comparison-table", "review-carousel", "trust-badges"],
    animations: ["smooth-transition", "calculator-live", "fade-up"],
    cta_patterns: ["Send money now", "Get started", "Compare rates"],
    layout: "single-col-centered",
    tags: ["transfer", "international", "green", "friendly", "calculator"],
    hero_type: "text-left-calculator-right",
    score: { design: 8, performance: 9, conversion: 10 },
    last_updated: TODAY
  },
  {
    url: "coinbase.com",
    nicho: "fintech",
    style: "clean-blue",
    colors: { primary: "#0052ff", secondary: "#050f19", accent: "#00d395", background: "#ffffff", text: "#0a0b0d" },
    fonts: ["Coinbase Sans", "system-ui"],
    sections: ["nav", "hero", "crypto-ticker", "features", "education", "security", "app-download", "footer"],
    components: ["price-ticker", "crypto-cards", "feature-tabs", "security-badges", "app-store-buttons"],
    animations: ["ticker-scroll", "fade-in", "price-update-flash"],
    cta_patterns: ["Get started", "Sign up", "Start trading"],
    layout: "single-col-centered",
    tags: ["crypto", "blue", "trust", "exchange", "modern"],
    hero_type: "split-text-and-signup-form",
    score: { design: 8, performance: 8, conversion: 9 },
    last_updated: TODAY
  },
  // == SaaS ==
  {
    url: "vercel.com",
    nicho: "saas",
    style: "dark-gradient",
    colors: { primary: "#000000", secondary: "#111111", accent: "#0070f3", background: "#000000", text: "#ededed" },
    fonts: ["Inter", "Geist", "system-ui"],
    sections: ["nav", "hero", "features-grid", "performance-demo", "integrations", "customers", "pricing", "footer"],
    components: ["terminal-demo", "performance-metrics", "framework-logos", "deployment-flow", "pricing-cards"],
    animations: ["gradient-flow", "terminal-type", "fade-stagger", "glow-border"],
    cta_patterns: ["Start Deploying", "Get Started", "Start for Free ->"],
    layout: "single-col-centered",
    tags: ["developer", "deploy", "dark", "performance", "nextjs"],
    hero_type: "centered-text-with-terminal-demo",
    score: { design: 10, performance: 10, conversion: 8 },
    last_updated: TODAY
  },
  {
    url: "supabase.com",
    nicho: "saas",
    style: "dark-green",
    colors: { primary: "#3ecf8e", secondary: "#1c1c1c", accent: "#6ee7b7", background: "#1c1c1c", text: "#ededed" },
    fonts: ["Circular", "system-ui"],
    sections: ["nav", "hero", "features", "code-examples", "dashboard-preview", "pricing", "community", "footer"],
    components: ["code-block-tabs", "feature-cards", "dashboard-screenshot", "pricing-toggle", "github-stars"],
    animations: ["code-typing", "fade-up", "glow-pulse", "hover-scale"],
    cta_patterns: ["Start your project", "Start for free", "Read the docs"],
    layout: "single-col-centered",
    tags: ["database", "backend", "green", "developer", "open-source"],
    hero_type: "centered-text-with-code-snippet",
    score: { design: 9, performance: 9, conversion: 8 },
    last_updated: TODAY
  },
  {
    url: "notion.so",
    nicho: "saas",
    style: "clean-white",
    colors: { primary: "#000000", secondary: "#37352f", accent: "#eb5757", background: "#ffffff", text: "#37352f" },
    fonts: ["Inter", "Georgia", "system-ui"],
    sections: ["nav", "hero", "use-cases", "templates", "integrations", "teams", "pricing", "footer"],
    components: ["use-case-tabs", "template-gallery", "team-avatars", "integration-logos", "toggle-pricing"],
    animations: ["smooth-scroll", "tab-slide", "fade-in", "illustration-bounce"],
    cta_patterns: ["Get Notion free", "Try Notion ->", "Download now"],
    layout: "single-col-centered",
    tags: ["productivity", "workspace", "clean", "minimal", "wiki"],
    hero_type: "centered-text-with-product-screenshot",
    score: { design: 9, performance: 8, conversion: 9 },
    last_updated: TODAY
  },
  {
    url: "figma.com",
    nicho: "saas",
    style: "colorful-creative",
    colors: { primary: "#a259ff", secondary: "#1e1e1e", accent: "#0acf83", background: "#ffffff", text: "#333333" },
    fonts: ["Whyte", "system-ui"],
    sections: ["nav", "hero", "features-showcase", "use-cases", "community", "plugins", "pricing", "footer"],
    components: ["interactive-demo", "feature-video", "community-grid", "plugin-cards", "comparison-table"],
    animations: ["cursor-follow", "prototype-transition", "color-morph", "scroll-parallax"],
    cta_patterns: ["Get started for free", "Try Figma", "Design something great"],
    layout: "single-col-centered",
    tags: ["design", "collaboration", "colorful", "creative", "prototyping"],
    hero_type: "centered-text-with-interactive-canvas",
    score: { design: 10, performance: 8, conversion: 8 },
    last_updated: TODAY
  },
  {
    url: "raycast.com",
    nicho: "saas",
    style: "dark-command",
    colors: { primary: "#ff6363", secondary: "#1a1a2e", accent: "#e8a838", background: "#0d0d15", text: "#e0e0e0" },
    fonts: ["Inter", "JetBrains Mono", "system-ui"],
    sections: ["nav", "hero", "extensions", "features", "pro-features", "community", "pricing", "footer"],
    components: ["command-palette-demo", "extension-grid", "keyboard-shortcuts", "video-demo", "testimonial-wall"],
    animations: ["command-type", "spotlight-focus", "fade-stagger", "glow-border"],
    cta_patterns: ["Download for free", "Get Raycast", "Install now"],
    layout: "single-col-centered",
    tags: ["productivity", "developer", "dark", "spotlight", "mac"],
    hero_type: "centered-text-with-app-demo",
    score: { design: 9, performance: 9, conversion: 8 },
    last_updated: TODAY
  },
  {
    url: "slack.com",
    nicho: "saas",
    style: "friendly-colorful",
    colors: { primary: "#4a154b", secondary: "#1d1c1d", accent: "#36c5f0", background: "#ffffff", text: "#1d1c1d" },
    fonts: ["Slack-Circular", "Helvetica Neue", "system-ui"],
    sections: ["nav", "hero", "features", "integrations", "enterprise", "customer-stories", "pricing", "cta", "footer"],
    components: ["chat-demo", "integration-grid", "customer-logo-wall", "feature-tabs", "pricing-cards"],
    animations: ["message-pop-in", "fade-up", "emoji-bounce", "slide-in"],
    cta_patterns: ["Get started for free", "Talk to sales", "Try for free"],
    layout: "single-col-centered",
    tags: ["communication", "teams", "colorful", "enterprise", "messaging"],
    hero_type: "text-left-product-screenshot-right",
    score: { design: 8, performance: 8, conversion: 9 },
    last_updated: TODAY
  },
  {
    url: "loom.com",
    nicho: "saas",
    style: "friendly-purple",
    colors: { primary: "#625df5", secondary: "#2b2250", accent: "#ff5c72", background: "#f4f2ff", text: "#2b2250" },
    fonts: ["Circular", "system-ui"],
    sections: ["nav", "hero", "video-demo", "features", "use-cases", "integrations", "pricing", "cta", "footer"],
    components: ["video-player-inline", "use-case-tabs", "feature-cards", "integration-logos", "pricing-toggle"],
    animations: ["video-reveal", "tab-transition", "fade-up", "hover-lift"],
    cta_patterns: ["Get Loom for free", "Record your first video", "Try Loom"],
    layout: "single-col-centered",
    tags: ["video", "async", "purple", "communication", "recording"],
    hero_type: "centered-text-with-video-player",
    score: { design: 8, performance: 8, conversion: 9 },
    last_updated: TODAY
  },
  {
    url: "cal.com",
    nicho: "saas",
    style: "clean-modern",
    colors: { primary: "#111827", secondary: "#292929", accent: "#f97316", background: "#ffffff", text: "#374151" },
    fonts: ["Cal Sans", "Inter", "system-ui"],
    sections: ["nav", "hero", "features", "integrations", "open-source", "pricing", "cta", "footer"],
    components: ["booking-demo", "feature-list", "integration-logos", "github-stars-badge", "pricing-cards"],
    animations: ["fade-in", "booking-flow-demo", "hover-scale"],
    cta_patterns: ["Get started", "Start for free", "Self-host"],
    layout: "single-col-centered",
    tags: ["scheduling", "open-source", "clean", "booking", "calendar"],
    hero_type: "text-left-booking-widget-right",
    score: { design: 8, performance: 9, conversion: 9 },
    last_updated: TODAY
  },
  // == Ecommerce ==
  {
    url: "allbirds.com",
    nicho: "ecommerce",
    style: "eco-clean",
    colors: { primary: "#212a2f", secondary: "#f5f1eb", accent: "#2d8653", background: "#f5f1eb", text: "#212a2f" },
    fonts: ["GT Walsheim", "system-ui"],
    sections: ["nav", "hero-banner", "product-grid", "sustainability", "reviews", "newsletter", "footer"],
    components: ["product-card", "color-swatch-selector", "sustainability-badge", "review-stars", "newsletter-input"],
    animations: ["image-zoom-hover", "fade-in", "smooth-scroll", "cart-bounce"],
    cta_patterns: ["Shop now", "Explore collection", "Add to cart"],
    layout: "grid-product-layout",
    tags: ["eco", "sustainable", "clean", "product", "natural"],
    hero_type: "fullscreen-product-image-with-overlay-text",
    score: { design: 9, performance: 8, conversion: 9 },
    last_updated: TODAY
  },
  {
    url: "gymshark.com",
    nicho: "ecommerce",
    style: "bold-dark",
    colors: { primary: "#1a1a1a", secondary: "#ffffff", accent: "#00b0ff", background: "#ffffff", text: "#1a1a1a" },
    fonts: ["Druk Wide", "Helvetica Neue", "system-ui"],
    sections: ["nav", "hero-video", "new-arrivals", "collections", "athletes", "community", "footer"],
    components: ["video-hero", "product-carousel", "collection-grid", "athlete-cards", "size-filter"],
    animations: ["video-autoplay", "carousel-slide", "hover-zoom", "parallax-hero"],
    cta_patterns: ["Shop now", "View collection", "Add to bag"],
    layout: "grid-product-layout",
    tags: ["fitness", "bold", "dark", "athletic", "lifestyle"],
    hero_type: "fullscreen-video-with-overlay",
    score: { design: 8, performance: 7, conversion: 9 },
    last_updated: TODAY
  },
  {
    url: "glossier.com",
    nicho: "ecommerce",
    style: "minimal-pink",
    colors: { primary: "#f5c6c6", secondary: "#ffffff", accent: "#d63384", background: "#fff5f5", text: "#2c2c2c" },
    fonts: ["Apercu", "system-ui"],
    sections: ["nav", "hero", "bestsellers", "categories", "reviews", "instagram-feed", "footer"],
    components: ["product-card-minimal", "review-photos", "instagram-grid", "shade-selector", "quick-add"],
    animations: ["fade-in", "hover-scale", "image-pan", "smooth-scroll"],
    cta_patterns: ["Shop now", "Add to bag", "Choose your shade"],
    layout: "grid-product-layout",
    tags: ["beauty", "pink", "minimal", "feminine", "clean"],
    hero_type: "split-image-and-text",
    score: { design: 9, performance: 8, conversion: 8 },
    last_updated: TODAY
  },
  {
    url: "shopify.com",
    nicho: "ecommerce",
    style: "green-modern",
    colors: { primary: "#008060", secondary: "#004c3f", accent: "#5c6ac4", background: "#ffffff", text: "#212b36" },
    fonts: ["Shopify Sans", "system-ui"],
    sections: ["nav", "hero", "features", "themes", "pricing", "success-stories", "free-trial", "footer"],
    components: ["trial-form", "feature-cards", "theme-gallery", "pricing-table", "success-story-carousel"],
    animations: ["fade-up", "form-focus", "carousel-auto", "counter-up"],
    cta_patterns: ["Start free trial", "Get started", "Try Shopify free"],
    layout: "single-col-centered",
    tags: ["platform", "green", "commerce", "store-builder", "enterprise"],
    hero_type: "centered-text-with-email-input",
    score: { design: 8, performance: 8, conversion: 10 },
    last_updated: TODAY
  },
  {
    url: "nike.com",
    nicho: "ecommerce",
    style: "bold-athletic",
    colors: { primary: "#111111", secondary: "#ffffff", accent: "#fa5400", background: "#ffffff", text: "#111111" },
    fonts: ["Helvetica Neue", "system-ui"],
    sections: ["nav", "hero-banner", "featured-products", "collections", "member-benefits", "trending", "footer"],
    components: ["mega-nav", "product-card-hover", "collection-banner", "size-selector", "wishlist-heart"],
    animations: ["banner-slide", "hover-zoom", "quick-view-pop", "cart-fly"],
    cta_patterns: ["Shop", "Just Do It", "Join Us", "Add to Bag"],
    layout: "grid-product-layout",
    tags: ["athletic", "bold", "iconic", "sport", "lifestyle"],
    hero_type: "fullscreen-campaign-image-with-cta",
    score: { design: 9, performance: 8, conversion: 9 },
    last_updated: TODAY
  },
  // == Healthcare / Education ==
  {
    url: "headspace.com",
    nicho: "healthcare",
    style: "calm-friendly",
    colors: { primary: "#f47d31", secondary: "#2c2540", accent: "#ffc233", background: "#fef3e7", text: "#2c2540" },
    fonts: ["Brandon Grotesque", "system-ui"],
    sections: ["nav", "hero", "benefits", "how-it-works", "science", "plans", "testimonials", "app-download", "footer"],
    components: ["illustration-hero", "benefit-icons", "step-cards", "plan-cards", "app-store-buttons", "meditation-player"],
    animations: ["illustration-float", "fade-up", "breathing-animation", "gentle-bounce"],
    cta_patterns: ["Try for free", "Get started", "Subscribe now"],
    layout: "single-col-centered",
    tags: ["meditation", "wellness", "calm", "orange", "illustration", "friendly"],
    hero_type: "text-left-illustration-right",
    score: { design: 9, performance: 8, conversion: 8 },
    last_updated: TODAY
  },
  {
    url: "duolingo.com",
    nicho: "education",
    style: "playful-gamified",
    colors: { primary: "#58cc02", secondary: "#235390", accent: "#ff4b4b", background: "#ffffff", text: "#4b4b4b" },
    fonts: ["Nunito", "system-ui"],
    sections: ["nav", "hero", "how-it-works", "features", "stats", "leaderboard", "app-download", "footer"],
    components: ["character-mascot", "language-selector", "progress-bar", "streak-counter", "lesson-preview", "app-store-buttons"],
    animations: ["character-bounce", "progress-fill", "confetti", "slide-in", "gamification-pop"],
    cta_patterns: ["Get started", "Learn for free", "Start learning"],
    layout: "single-col-centered",
    tags: ["language", "gamified", "green", "playful", "education", "fun"],
    hero_type: "split-mascot-left-cta-right",
    score: { design: 9, performance: 8, conversion: 10 },
    last_updated: TODAY
  },
  {
    url: "coursera.org",
    nicho: "education",
    style: "professional-clean",
    colors: { primary: "#0056d2", secondary: "#1f1f1f", accent: "#00bfa5", background: "#ffffff", text: "#1f1f1f" },
    fonts: ["Source Sans Pro", "system-ui"],
    sections: ["nav", "hero-search", "categories", "popular-courses", "partners", "testimonials", "enterprise", "footer"],
    components: ["search-bar", "course-cards", "university-logos", "category-pills", "certificate-badge", "review-stars"],
    animations: ["fade-in", "card-hover-lift", "search-expand", "smooth-scroll"],
    cta_patterns: ["Join for free", "Enroll now", "Start learning"],
    layout: "single-col-centered",
    tags: ["courses", "university", "blue", "professional", "certificates"],
    hero_type: "centered-search-with-background-pattern",
    score: { design: 7, performance: 8, conversion: 9 },
    last_updated: TODAY
  },
  {
    url: "calm.com",
    nicho: "healthcare",
    style: "serene-dark",
    colors: { primary: "#4a90d9", secondary: "#1a2540", accent: "#7dd3c0", background: "#162447", text: "#e8e8e8" },
    fonts: ["GT Eesti", "system-ui"],
    sections: ["nav", "hero", "features", "sleep-stories", "music", "pricing", "testimonials", "app-download", "footer"],
    components: ["nature-video-bg", "audio-player-mini", "plan-cards", "celebrity-narrator-cards", "app-store-buttons"],
    animations: ["nature-ambient-video", "fade-slow", "breathing-guide", "wave-animation"],
    cta_patterns: ["Try Calm for free", "Start your journey", "Get Calm Premium"],
    layout: "single-col-centered",
    tags: ["sleep", "relaxation", "dark-blue", "nature", "audio", "serene"],
    hero_type: "fullscreen-nature-video-with-overlay",
    score: { design: 9, performance: 7, conversion: 8 },
    last_updated: TODAY
  },
  {
    url: "masterclass.com",
    nicho: "education",
    style: "premium-dark",
    colors: { primary: "#000000", secondary: "#1a1a1a", accent: "#c8102e", background: "#0a0a0a", text: "#ffffff" },
    fonts: ["Founders Grotesk", "system-ui"],
    sections: ["nav", "hero-video", "instructors", "categories", "how-it-works", "gift", "pricing", "footer"],
    components: ["video-trailer", "instructor-cards", "category-carousel", "gift-card-widget", "pricing-annual"],
    animations: ["video-autoplay", "card-hover-reveal", "fade-in", "parallax-scroll"],
    cta_patterns: ["Get started", "Gift Masterclass", "Start learning"],
    layout: "single-col-centered",
    tags: ["premium", "celebrity", "dark", "video", "learning"],
    hero_type: "fullscreen-video-with-overlay",
    score: { design: 9, performance: 7, conversion: 8 },
    last_updated: TODAY
  },
  // == Agency / Premium ==
  {
    url: "apple.com",
    nicho: "agency",
    style: "minimal-premium",
    colors: { primary: "#000000", secondary: "#1d1d1f", accent: "#0071e3", background: "#ffffff", text: "#1d1d1f" },
    fonts: ["SF Pro", "system-ui"],
    sections: ["nav", "hero-product", "product-showcase", "features-scroll", "comparison", "accessories", "cta", "footer"],
    components: ["product-hero-fullscreen", "scroll-reveal-features", "comparison-table", "accessory-carousel", "trade-in-calculator"],
    animations: ["scroll-trigger-reveal", "parallax-product", "3d-product-rotate", "fade-on-scroll"],
    cta_patterns: ["Buy", "Learn more", "Compare models"],
    layout: "single-col-immersive",
    tags: ["premium", "minimal", "product", "glass", "immersive"],
    hero_type: "fullscreen-product-centered",
    score: { design: 10, performance: 9, conversion: 9 },
    last_updated: TODAY
  },
  {
    url: "tesla.com",
    nicho: "agency",
    style: "immersive-fullscreen",
    colors: { primary: "#171a20", secondary: "#393c41", accent: "#3e6ae1", background: "#000000", text: "#ffffff" },
    fonts: ["Gotham", "system-ui"],
    sections: ["hero-fullscreen", "model-showcase", "features", "order-config", "footer"],
    components: ["fullscreen-hero-scroll", "model-selector", "config-builder", "video-background", "minimal-nav"],
    animations: ["fullscreen-scroll-snap", "parallax-deep", "video-autoplay", "smooth-morph"],
    cta_patterns: ["Order Now", "Custom Order", "Learn More"],
    layout: "fullscreen-scroll-sections",
    tags: ["automotive", "immersive", "dark", "fullscreen", "premium", "minimal-text"],
    hero_type: "fullscreen-video-with-minimal-text",
    score: { design: 10, performance: 8, conversion: 8 },
    last_updated: TODAY
  },
  {
    url: "awwwards.com",
    nicho: "agency",
    style: "brutalist-experimental",
    colors: { primary: "#222222", secondary: "#f5f5f5", accent: "#ff3c00", background: "#ffffff", text: "#222222" },
    fonts: ["Druk", "Inter", "system-ui"],
    sections: ["nav", "hero-showcase", "site-of-the-day", "nominees", "collections", "blog", "footer"],
    components: ["site-card-hover", "jury-avatars", "category-filter", "site-preview-modal", "rating-bars"],
    animations: ["hover-distort", "cursor-follow", "image-reveal", "text-scramble"],
    cta_patterns: ["Submit your site", "Join Awwwards", "See all nominees"],
    layout: "grid-masonry",
    tags: ["design", "awards", "experimental", "brutalist", "showcase"],
    hero_type: "dynamic-showcase-carousel",
    score: { design: 10, performance: 7, conversion: 6 },
    last_updated: TODAY
  },
  {
    url: "framer.com",
    nicho: "agency",
    style: "dark-creative",
    colors: { primary: "#0055ff", secondary: "#111111", accent: "#ff0080", background: "#000000", text: "#ffffff" },
    fonts: ["Inter", "Framer", "system-ui"],
    sections: ["nav", "hero", "templates", "features", "ai-builder", "pricing", "showcase", "footer"],
    components: ["template-gallery", "live-preview", "ai-prompt-input", "feature-video", "pricing-toggle"],
    animations: ["template-morph", "3d-tilt", "glow-pulse", "smooth-resize"],
    cta_patterns: ["Start for free", "Build your site", "Try AI"],
    layout: "single-col-centered",
    tags: ["website-builder", "creative", "dark", "ai", "no-code"],
    hero_type: "centered-text-with-template-morphing",
    score: { design: 10, performance: 8, conversion: 8 },
    last_updated: TODAY
  },
  {
    url: "webflow.com",
    nicho: "agency",
    style: "dark-professional",
    colors: { primary: "#4353ff", secondary: "#1a1a2e", accent: "#00d4aa", background: "#0e0e16", text: "#e4e4e7" },
    fonts: ["Plus Jakarta Sans", "system-ui"],
    sections: ["nav", "hero", "visual-builder-demo", "features", "enterprise", "templates", "pricing", "footer"],
    components: ["visual-editor-demo", "feature-bento", "enterprise-logos", "template-cards", "cms-showcase"],
    animations: ["builder-demo-interact", "bento-hover", "fade-stagger", "glow-border"],
    cta_patterns: ["Get started - it is free", "Start building", "Contact sales"],
    layout: "single-col-centered",
    tags: ["no-code", "design", "professional", "dark", "visual-builder"],
    hero_type: "centered-text-with-builder-preview",
    score: { design: 9, performance: 8, conversion: 8 },
    last_updated: TODAY
  },
  {
    url: "wix.com",
    nicho: "agency",
    style: "colorful-modern",
    colors: { primary: "#116dff", secondary: "#20303c", accent: "#fbbc05", background: "#ffffff", text: "#20303c" },
    fonts: ["Madefor", "Helvetica Neue", "system-ui"],
    sections: ["nav", "hero", "templates", "features", "ai-site-builder", "business-tools", "pricing", "footer"],
    components: ["template-preview", "ai-chat-builder", "feature-tabs", "pricing-comparison", "business-type-selector"],
    animations: ["template-slide", "ai-generate-demo", "fade-up", "tab-switch"],
    cta_patterns: ["Get Started", "Create your website", "Start now"],
    layout: "single-col-centered",
    tags: ["website-builder", "templates", "colorful", "ai", "business"],
    hero_type: "centered-text-with-ai-demo",
    score: { design: 7, performance: 7, conversion: 9 },
    last_updated: TODAY
  }
];

// --- Component Patterns ---
const HERO_PATTERNS = [
  {
    name: "text-left-image-right",
    description: "Classic split layout with headline and CTA on left, product image or mockup on right",
    html_structure: "<section class=\"hero\"><div class=\"hero-content\"><h1/><p/><a class=\"cta\"/></div><div class=\"hero-image\"><img/></div></section>",
    css_classes: ["hero", "hero-content", "hero-image", "hero-cta"],
    best_for: ["saas", "fintech", "healthcare"],
    example_sites: ["stripe.com", "slack.com", "headspace.com"]
  },
  {
    name: "centered-text-with-product-screenshot",
    description: "Centered headline with large product screenshot below. Trust badges or logos underneath",
    html_structure: "<section class=\"hero text-center\"><h1/><p/><a class=\"cta\"/><div class=\"hero-screenshot\"><img/></div></section>",
    css_classes: ["hero", "text-center", "hero-screenshot", "hero-cta"],
    best_for: ["saas", "fintech"],
    example_sites: ["mercury.com", "notion.so", "cal.com"]
  },
  {
    name: "fullscreen-video-with-overlay",
    description: "Fullscreen background video with text overlay and minimal CTA",
    html_structure: "<section class=\"hero-video\"><video autoplay muted loop/><div class=\"hero-overlay\"><h1/><a class=\"cta\"/></div></section>",
    css_classes: ["hero-video", "hero-overlay", "video-bg"],
    best_for: ["agency", "ecommerce", "trading"],
    example_sites: ["tesla.com", "gymshark.com"]
  },
  {
    name: "fullscreen-product-centered",
    description: "Single product image centered with minimal text. Apple-style immersive hero",
    html_structure: "<section class=\"hero-product\"><h1/><img class=\"product-hero\"/><div class=\"hero-actions\"><a/><a/></div></section>",
    css_classes: ["hero-product", "product-hero", "hero-actions"],
    best_for: ["agency", "ecommerce"],
    example_sites: ["apple.com"]
  },
  {
    name: "centered-text-with-gradient-background",
    description: "Bold centered headline with animated gradient or aurora background effect",
    html_structure: "<section class=\"hero-gradient\"><div class=\"gradient-bg\"/><h1/><p/><a class=\"cta\"/></section>",
    css_classes: ["hero-gradient", "gradient-bg", "gradient-text"],
    best_for: ["saas", "fintech", "agency"],
    example_sites: ["linear.app", "vercel.com"]
  },
  {
    name: "split-mascot-left-cta-right",
    description: "Brand mascot or illustration on one side with headline, description, and CTA on the other",
    html_structure: "<section class=\"hero-split\"><div class=\"hero-mascot\"><img/></div><div class=\"hero-content\"><h1/><p/><a class=\"cta\"/></div></section>",
    css_classes: ["hero-split", "hero-mascot", "hero-content"],
    best_for: ["education", "healthcare"],
    example_sites: ["duolingo.com", "headspace.com"]
  },
  {
    name: "centered-text-with-email-input",
    description: "Centered headline with email signup form as primary CTA. High-conversion pattern",
    html_structure: "<section class=\"hero\"><h1/><p/><form class=\"hero-form\"><input type=\"email\"/><button/></form></section>",
    css_classes: ["hero", "hero-form", "email-input", "submit-btn"],
    best_for: ["saas", "ecommerce"],
    example_sites: ["shopify.com"]
  },
  {
    name: "centered-text-with-terminal-demo",
    description: "Developer-focused hero with centered text and animated terminal/code demo below",
    html_structure: "<section class=\"hero-dev\"><h1/><p/><div class=\"terminal-demo\"><pre><code/></pre></div><a class=\"cta\"/></section>",
    css_classes: ["hero-dev", "terminal-demo", "code-block"],
    best_for: ["saas", "fintech"],
    example_sites: ["vercel.com", "supabase.com"]
  },
  {
    name: "text-left-calculator-right",
    description: "Interactive calculator or tool on right side. Headline and trust elements on left",
    html_structure: "<section class=\"hero-interactive\"><div class=\"hero-content\"><h1/><p/></div><div class=\"hero-tool\"><div class=\"calculator\"/></div></section>",
    css_classes: ["hero-interactive", "hero-tool", "calculator"],
    best_for: ["fintech"],
    example_sites: ["wise.com"]
  },
  {
    name: "dynamic-showcase-carousel",
    description: "Auto-rotating showcase of featured projects or products with hover interactions",
    html_structure: "<section class=\"hero-showcase\"><h1/><div class=\"showcase-carousel\"><div class=\"showcase-item\"/></div></section>",
    css_classes: ["hero-showcase", "showcase-carousel", "showcase-item"],
    best_for: ["agency"],
    example_sites: ["awwwards.com", "framer.com"]
  },
  {
    name: "centered-text-with-video-player",
    description: "Centered headline with embedded video player demonstrating the product",
    html_structure: "<section class=\"hero\"><h1/><p/><div class=\"video-wrapper\"><video controls/></div><a class=\"cta\"/></section>",
    css_classes: ["hero", "video-wrapper", "video-player"],
    best_for: ["saas", "education"],
    example_sites: ["loom.com"]
  },
  {
    name: "centered-search-with-background",
    description: "Large search bar as the primary CTA, with categories below and patterned background",
    html_structure: "<section class=\"hero-search\"><h1/><form class=\"search-form\"><input type=\"search\"/><button/></form><div class=\"categories\"/></section>",
    css_classes: ["hero-search", "search-form", "categories"],
    best_for: ["education", "ecommerce"],
    example_sites: ["coursera.org"]
  }
];

const PRICING_PATTERNS = [
  {
    name: "three-tier-cards",
    description: "Classic three-column pricing with Free, Pro, and Enterprise tiers. Middle card highlighted",
    html_structure: "<section class=\"pricing\"><div class=\"pricing-grid\"><div class=\"pricing-card\"/><div class=\"pricing-card featured\"/><div class=\"pricing-card\"/></div></section>",
    css_classes: ["pricing", "pricing-grid", "pricing-card", "featured", "price-amount"],
    best_for: ["saas", "education"],
    example_sites: ["notion.so", "figma.com", "slack.com"]
  },
  {
    name: "toggle-monthly-annual",
    description: "Pricing cards with monthly/annual toggle switch. Annual shows discount badge",
    html_structure: "<section class=\"pricing\"><div class=\"toggle\"><button>Monthly</button><button>Annual</button></div><div class=\"pricing-grid\"/></section>",
    css_classes: ["pricing", "toggle", "toggle-active", "discount-badge"],
    best_for: ["saas", "healthcare"],
    example_sites: ["supabase.com", "loom.com", "cal.com"]
  },
  {
    name: "comparison-table",
    description: "Full feature comparison table with checkmarks across plan tiers",
    html_structure: "<section class=\"pricing\"><table class=\"comparison\"><thead><tr><th/><th>Free</th><th>Pro</th><th>Enterprise</th></tr></thead><tbody/></table></section>",
    css_classes: ["pricing", "comparison", "check-mark", "plan-header"],
    best_for: ["saas", "fintech", "enterprise"],
    example_sites: ["stripe.com", "figma.com"]
  },
  {
    name: "single-plan-cta",
    description: "Single prominent plan with feature list and strong CTA. For products with one main tier",
    html_structure: "<section class=\"pricing-single\"><div class=\"plan-card\"><h2/><p class=\"price\"/><ul class=\"features\"/><a class=\"cta\"/></div></section>",
    css_classes: ["pricing-single", "plan-card", "price", "features"],
    best_for: ["ecommerce", "trading"],
    example_sites: ["ftmo.com"]
  },
  {
    name: "freemium-highlight",
    description: "Free tier prominently displayed with clear upgrade path to paid plans",
    html_structure: "<section class=\"pricing\"><div class=\"free-tier\"><h3>Free forever</h3><ul/><a/></div><div class=\"paid-tiers\"/></section>",
    css_classes: ["pricing", "free-tier", "paid-tiers", "upgrade-arrow"],
    best_for: ["saas", "education"],
    example_sites: ["duolingo.com", "notion.so", "raycast.com"]
  },
  {
    name: "slider-based-pricing",
    description: "Interactive slider to adjust usage/seats with dynamic price calculation",
    html_structure: "<section class=\"pricing\"><div class=\"slider-container\"><input type=\"range\"/><div class=\"price-display\"/></div><div class=\"plan-details\"/></section>",
    css_classes: ["pricing", "slider-container", "price-display", "range-slider"],
    best_for: ["saas", "fintech"],
    example_sites: ["vercel.com"]
  },
  {
    name: "enterprise-contact",
    description: "Custom enterprise pricing with Contact Sales CTA. Feature list and social proof",
    html_structure: "<section class=\"pricing-enterprise\"><div class=\"features\"/><div class=\"social-proof\"><img class=\"logo\"/>...</div><a class=\"cta\">Contact Sales</a></section>",
    css_classes: ["pricing-enterprise", "features", "social-proof", "cta-enterprise"],
    best_for: ["fintech", "saas", "agency"],
    example_sites: ["stripe.com", "ramp.com", "slack.com"]
  },
  {
    name: "plan-cards-with-addons",
    description: "Base plan cards with optional add-on modules displayed below",
    html_structure: "<section class=\"pricing\"><div class=\"plans\"/><div class=\"addons\"><h3>Add-ons</h3><div class=\"addon-grid\"/></div></section>",
    css_classes: ["pricing", "plans", "addons", "addon-card"],
    best_for: ["saas", "ecommerce"],
    example_sites: ["shopify.com", "webflow.com"]
  }
];

const TESTIMONIAL_PATTERNS = [
  {
    name: "carousel-with-photos",
    description: "Horizontal carousel of testimonial cards with user photo, name, role, and quote",
    html_structure: "<section class=\"testimonials\"><div class=\"carousel\"><div class=\"testimonial-card\"><img class=\"avatar\"/><blockquote/><cite/></div></div></section>",
    css_classes: ["testimonials", "carousel", "testimonial-card", "avatar", "blockquote"],
    best_for: ["saas", "fintech", "healthcare"],
    example_sites: ["stripe.com", "notion.so", "headspace.com"]
  },
  {
    name: "masonry-wall",
    description: "Masonry grid of testimonials in varying heights. Creates a social proof wall effect",
    html_structure: "<section class=\"testimonial-wall\"><div class=\"masonry\"><div class=\"testimonial-card\"/></div></section>",
    css_classes: ["testimonial-wall", "masonry", "testimonial-card"],
    best_for: ["saas", "agency"],
    example_sites: ["raycast.com", "linear.app"]
  },
  {
    name: "logo-bar-with-quotes",
    description: "Company logos in a bar, clicking reveals the full testimonial quote from that company",
    html_structure: "<section class=\"testimonials\"><div class=\"logo-bar\"><img class=\"company-logo\"/></div><div class=\"quote-display\"><blockquote/></div></section>",
    css_classes: ["testimonials", "logo-bar", "company-logo", "quote-display"],
    best_for: ["fintech", "saas", "enterprise"],
    example_sites: ["ramp.com", "vercel.com"]
  },
  {
    name: "video-testimonials",
    description: "Grid of video testimonial thumbnails that play on click or hover",
    html_structure: "<section class=\"testimonials-video\"><div class=\"video-grid\"><div class=\"video-thumb\"><video/><p class=\"name\"/></div></div></section>",
    css_classes: ["testimonials-video", "video-grid", "video-thumb"],
    best_for: ["education", "healthcare", "ecommerce"],
    example_sites: ["duolingo.com", "coursera.org"]
  },
  {
    name: "single-featured-quote",
    description: "One large, prominent testimonial with big quote marks and customer branding",
    html_structure: "<section class=\"testimonial-featured\"><div class=\"quote-icon\"/><blockquote class=\"big-quote\"/><div class=\"author\"><img/><div><strong/><span/></div></div></section>",
    css_classes: ["testimonial-featured", "big-quote", "quote-icon", "author"],
    best_for: ["agency", "fintech"],
    example_sites: ["mercury.com", "apple.com"]
  },
  {
    name: "twitter-style-cards",
    description: "Testimonials styled like social media posts with profile pictures and platform icons",
    html_structure: "<section class=\"social-proof\"><div class=\"tweet-grid\"><div class=\"tweet-card\"><div class=\"tweet-header\"><img/><span/></div><p/></div></div></section>",
    css_classes: ["social-proof", "tweet-grid", "tweet-card", "tweet-header"],
    best_for: ["saas", "education"],
    example_sites: ["supabase.com", "cal.com"]
  }
];

const CTA_PATTERNS = [
  {
    name: "centered-gradient-cta",
    description: "Full-width section with gradient background, centered headline, and primary button",
    html_structure: "<section class=\"cta-section gradient-bg\"><h2/><p/><a class=\"cta-button\"/></section>",
    css_classes: ["cta-section", "gradient-bg", "cta-button"],
    best_for: ["saas", "fintech", "agency"],
    example_sites: ["vercel.com", "linear.app", "stripe.com"]
  },
  {
    name: "split-cta-with-image",
    description: "Two-column CTA with compelling text on one side and image/illustration on other",
    html_structure: "<section class=\"cta-split\"><div class=\"cta-content\"><h2/><p/><a class=\"cta-button\"/></div><div class=\"cta-image\"><img/></div></section>",
    css_classes: ["cta-split", "cta-content", "cta-image", "cta-button"],
    best_for: ["healthcare", "education", "ecommerce"],
    example_sites: ["headspace.com", "duolingo.com"]
  },
  {
    name: "email-capture-cta",
    description: "Email input field with submit button. Newsletter or free trial signup",
    html_structure: "<section class=\"cta-email\"><h2/><form><input type=\"email\" placeholder=\"Enter your email\"/><button type=\"submit\"/></form></section>",
    css_classes: ["cta-email", "email-input", "submit-button"],
    best_for: ["saas", "ecommerce"],
    example_sites: ["shopify.com", "allbirds.com"]
  },
  {
    name: "two-button-cta",
    description: "Primary and secondary action buttons side by side. Get Started + Learn More",
    html_structure: "<section class=\"cta-dual\"><h2/><p/><div class=\"cta-buttons\"><a class=\"btn-primary\"/><a class=\"btn-secondary\"/></div></section>",
    css_classes: ["cta-dual", "cta-buttons", "btn-primary", "btn-secondary"],
    best_for: ["saas", "fintech", "agency"],
    example_sites: ["supabase.com", "figma.com", "notion.so"]
  },
  {
    name: "sticky-bottom-bar",
    description: "Fixed bar at bottom of viewport with CTA that appears on scroll",
    html_structure: "<div class=\"sticky-cta\"><p/><a class=\"cta-button\"/></div>",
    css_classes: ["sticky-cta", "cta-button", "show-on-scroll"],
    best_for: ["ecommerce", "healthcare"],
    example_sites: ["gymshark.com", "calm.com"]
  },
  {
    name: "dark-contrast-cta",
    description: "Dark background CTA section that contrasts with light page. Creates visual break",
    html_structure: "<section class=\"cta-dark\"><h2/><p/><a class=\"cta-button-light\"/></section>",
    css_classes: ["cta-dark", "cta-button-light"],
    best_for: ["fintech", "saas", "trading"],
    example_sites: ["mercury.com", "ramp.com", "ftmo.com"]
  },
  {
    name: "app-download-cta",
    description: "Mobile app download section with App Store and Google Play buttons",
    html_structure: "<section class=\"cta-app\"><div class=\"phone-mockup\"><img/></div><div class=\"download-buttons\"><a class=\"app-store\"/><a class=\"play-store\"/></div></section>",
    css_classes: ["cta-app", "phone-mockup", "download-buttons", "app-store", "play-store"],
    best_for: ["healthcare", "education", "fintech"],
    example_sites: ["headspace.com", "duolingo.com", "coinbase.com"]
  },
  {
    name: "minimal-text-link-cta",
    description: "Minimalist CTA with just a text link and arrow. Subtle but effective for premium brands",
    html_structure: "<section class=\"cta-minimal\"><p/><a class=\"text-link\">Learn more <span class=\"arrow\">-></span></a></section>",
    css_classes: ["cta-minimal", "text-link", "arrow"],
    best_for: ["agency"],
    example_sites: ["apple.com", "tesla.com"]
  }
];

const NAV_PATTERNS = [
  {
    name: "transparent-sticky",
    description: "Transparent navbar that becomes solid/blurred on scroll. Logo left, links center, CTA right",
    html_structure: "<nav class=\"nav-transparent\"><a class=\"logo\"/><ul class=\"nav-links\"/><a class=\"nav-cta\"/></nav>",
    css_classes: ["nav-transparent", "nav-scrolled", "nav-links", "nav-cta", "backdrop-blur"],
    best_for: ["agency", "ecommerce"],
    example_sites: ["apple.com", "tesla.com", "allbirds.com"]
  },
  {
    name: "classic-solid",
    description: "Solid background navbar with logo, navigation links, and CTA button",
    html_structure: "<nav class=\"nav-solid\"><a class=\"logo\"/><ul class=\"nav-links\"/><div class=\"nav-actions\"><a class=\"nav-cta\"/></div></nav>",
    css_classes: ["nav-solid", "nav-links", "nav-cta", "nav-actions"],
    best_for: ["saas", "fintech", "healthcare", "education"],
    example_sites: ["stripe.com", "notion.so", "duolingo.com"]
  },
  {
    name: "mega-menu-dropdown",
    description: "Navigation with mega dropdown menus showing product categories, features, or resources",
    html_structure: "<nav><a class=\"logo\"/><ul class=\"nav-links\"><li class=\"has-mega\"><a/><div class=\"mega-menu\"/></li></ul></nav>",
    css_classes: ["nav", "has-mega", "mega-menu", "mega-column"],
    best_for: ["saas", "fintech", "ecommerce"],
    example_sites: ["stripe.com", "shopify.com", "webflow.com"]
  },
  {
    name: "minimal-dark",
    description: "Dark minimal navbar with just logo and essential links. No background distraction",
    html_structure: "<nav class=\"nav-dark\"><a class=\"logo\"/><ul class=\"nav-links\"/></nav>",
    css_classes: ["nav-dark", "nav-links"],
    best_for: ["saas", "agency"],
    example_sites: ["vercel.com", "linear.app", "framer.com"]
  },
  {
    name: "sidebar-navigation",
    description: "Vertical sidebar navigation for dashboard-style marketing sites or documentation",
    html_structure: "<aside class=\"sidebar-nav\"><a class=\"logo\"/><ul class=\"nav-sections\"><li><a/></li></ul></aside>",
    css_classes: ["sidebar-nav", "nav-sections", "nav-active"],
    best_for: ["saas", "education"],
    example_sites: ["supabase.com"]
  },
  {
    name: "hamburger-mobile-first",
    description: "Hamburger icon that opens fullscreen or slide-in mobile menu. Desktop shows inline links",
    html_structure: "<nav><a class=\"logo\"/><button class=\"hamburger\"/><div class=\"mobile-menu\"><ul/></div></nav>",
    css_classes: ["hamburger", "mobile-menu", "menu-open"],
    best_for: ["ecommerce", "agency", "healthcare"],
    example_sites: ["gymshark.com", "calm.com"]
  }
];

// --- Utility Functions ---
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log("  [+] Created: " + dir);
  }
}

function writeJSON(filepath, data) {
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), "utf8");
  console.log("  [+] Written: " + filepath);
}

function groupBy(arr, key) {
  return arr.reduce(function(acc, item) {
    var k = item[key];
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});
}

// --- Core Functions ---
function buildIndex() {
  var nicheGroups = groupBy(CURATED_SITES, "nicho");
  var nicheNames = Object.keys(nicheGroups);
  var styleSet = new Set(CURATED_SITES.map(function(s) { return s.style; }));
  var tagSet = new Set(CURATED_SITES.flatMap(function(s) { return s.tags; }));

  return {
    version: "1.0.0",
    generated: new Date().toISOString(),
    agent: "nexus-trend-scout",
    stats: {
      total_sites: CURATED_SITES.length,
      niches: nicheNames.length,
      styles: styleSet.size,
      unique_tags: tagSet.size,
      component_patterns: {
        hero: HERO_PATTERNS.length,
        pricing: PRICING_PATTERNS.length,
        testimonial: TESTIMONIAL_PATTERNS.length,
        cta: CTA_PATTERNS.length,
        nav: NAV_PATTERNS.length
      }
    },
    niches: nicheNames.map(function(n) {
      return { name: n, count: nicheGroups[n].length, file: "niches/" + n + ".json" };
    }),
    styles: Array.from(styleSet),
    tags: Array.from(tagSet).sort(),
    component_files: [
      "components/hero-patterns.json",
      "components/pricing-patterns.json",
      "components/testimonial-patterns.json",
      "components/cta-patterns.json",
      "components/nav-patterns.json"
    ]
  };
}

function buildNicheFiles() {
  var groups = groupBy(CURATED_SITES, "nicho");
  for (var nicho in groups) {
    var sites = groups[nicho];
    var nicheData = {
      nicho: nicho,
      generated: new Date().toISOString(),
      count: sites.length,
      common_colors: extractCommonColors(sites),
      common_fonts: extractCommonFonts(sites),
      common_animations: extractCommonAnimations(sites),
      sites: sites
    };
    writeJSON(path.join(NICHES_DIR, nicho + ".json"), nicheData);
  }
}

function extractCommonColors(sites) {
  var colorMap = {};
  sites.forEach(function(s) {
    Object.keys(s.colors).forEach(function(key) {
      if (!colorMap[key]) colorMap[key] = [];
      colorMap[key].push(s.colors[key]);
    });
  });
  var result = {};
  for (var key in colorMap) {
    var freq = {};
    colorMap[key].forEach(function(v) { freq[v] = (freq[v] || 0) + 1; });
    result[key] = Object.entries(freq).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 3).map(function(e) { return e[0]; });
  }
  return result;
}

function extractCommonFonts(sites) {
  var freq = {};
  sites.forEach(function(s) { s.fonts.forEach(function(f) { freq[f] = (freq[f] || 0) + 1; }); });
  return Object.entries(freq).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 5).map(function(e) { return e[0]; });
}

function extractCommonAnimations(sites) {
  var freq = {};
  sites.forEach(function(s) { s.animations.forEach(function(a) { freq[a] = (freq[a] || 0) + 1; }); });
  return Object.entries(freq).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 8).map(function(e) { return e[0]; });
}

function buildComponentFiles() {
  writeJSON(path.join(COMPONENTS_DIR, "hero-patterns.json"), {
    category: "hero", generated: new Date().toISOString(), count: HERO_PATTERNS.length, patterns: HERO_PATTERNS
  });
  writeJSON(path.join(COMPONENTS_DIR, "pricing-patterns.json"), {
    category: "pricing", generated: new Date().toISOString(), count: PRICING_PATTERNS.length, patterns: PRICING_PATTERNS
  });
  writeJSON(path.join(COMPONENTS_DIR, "testimonial-patterns.json"), {
    category: "testimonials", generated: new Date().toISOString(), count: TESTIMONIAL_PATTERNS.length, patterns: TESTIMONIAL_PATTERNS
  });
  writeJSON(path.join(COMPONENTS_DIR, "cta-patterns.json"), {
    category: "cta", generated: new Date().toISOString(), count: CTA_PATTERNS.length, patterns: CTA_PATTERNS
  });
  writeJSON(path.join(COMPONENTS_DIR, "nav-patterns.json"), {
    category: "navigation", generated: new Date().toISOString(), count: NAV_PATTERNS.length, patterns: NAV_PATTERNS
  });
}

function printSummary() {
  var index = buildIndex();
  console.log("");
  console.log("===========================================================");
  console.log("       NEXUS Trend Scout -- Reference Database Summary      ");
  console.log("===========================================================");
  console.log("");
  console.log("  Total reference sites: " + index.stats.total_sites);
  console.log("  Niches covered:        " + index.stats.niches);
  console.log("  Unique styles:         " + index.stats.styles);
  console.log("  Unique tags:           " + index.stats.unique_tags);
  console.log("");
  console.log("  Component Patterns:");
  var cp = index.stats.component_patterns;
  Object.keys(cp).forEach(function(cat) {
    console.log("    " + cat.padEnd(15) + " " + cp[cat] + " patterns");
  });
  console.log("");
  console.log("  Niches:");
  index.niches.forEach(function(n) {
    console.log("    " + n.name.padEnd(15) + " " + n.count + " sites -> " + n.file);
  });
  console.log("");
  console.log("  Database location: " + DB_DIR);
  console.log("");
}

function printNichoDetail(nicho) {
  var filepath = path.join(NICHES_DIR, nicho + ".json");
  if (!fs.existsSync(filepath)) {
    console.error("  [!] Nicho \"" + nicho + "\" not found. Available niches:");
    var groups = groupBy(CURATED_SITES, "nicho");
    Object.keys(groups).forEach(function(n) { console.log("      - " + n); });
    process.exit(1);
  }
  var data = JSON.parse(fs.readFileSync(filepath, "utf8"));
  console.log("");
  console.log("  Nicho: " + data.nicho + " (" + data.count + " sites)");
  console.log("  Common fonts: " + data.common_fonts.join(", "));
  console.log("  Common animations: " + data.common_animations.join(", "));
  console.log("");
  console.log("  Sites:");
  data.sites.forEach(function(s) {
    console.log("    " + s.url.padEnd(20) + " style=" + s.style + "  hero=" + s.hero_type + "  design=" + s.score.design + "/10");
  });
  console.log("");
}

// --- Main ---
function main() {
  var args = process.argv.slice(2);
  var isUpdate = args.indexOf("--update") !== -1;
  var isSummary = args.indexOf("--summary") !== -1;
  var nichoIdx = args.indexOf("--nicho");
  var nichoArg = nichoIdx !== -1 ? args[nichoIdx + 1] : null;

  console.log("");
  console.log("  NEXUS Trend Scout Agent v1.0");
  console.log("  ----------------------------");
  console.log("");

  if (nichoArg && fs.existsSync(NICHES_DIR)) {
    printNichoDetail(nichoArg);
    return;
  }

  if (isSummary && fs.existsSync(DB_DIR)) {
    printSummary();
    return;
  }

  var dbExists = fs.existsSync(DB_DIR) && fs.existsSync(path.join(DB_DIR, "index.json"));

  if (dbExists && !isUpdate) {
    console.log("  [i] Reference database already exists.");
    console.log("      Use --update to refresh, --summary for stats, or --nicho <name> for details.");
    console.log("");
    printSummary();
    return;
  }

  if (isUpdate) {
    console.log("  [~] Updating reference database...");
    console.log("");
  } else {
    console.log("  [*] Building reference database from scratch...");
    console.log("");
  }

  ensureDir(DB_DIR);
  ensureDir(NICHES_DIR);
  ensureDir(COMPONENTS_DIR);

  console.log("");
  console.log("  Building index...");
  var index = buildIndex();
  writeJSON(path.join(DB_DIR, "index.json"), index);

  console.log("");
  console.log("  Building nicho files...");
  buildNicheFiles();

  console.log("");
  console.log("  Building component pattern files...");
  buildComponentFiles();

  printSummary();

  console.log("  [OK] Reference database built successfully!");
  console.log("  [OK] " + (isUpdate ? "Updated" : "Created") + " at: " + DB_DIR);
  console.log("");
}

// --- Run ---
try {
  main();
} catch (err) {
  console.error("");
  console.error("  [ERROR] Trend Scout Agent failed:");
  console.error("  " + err.message);
  console.error(err.stack);
  process.exit(1);
}
