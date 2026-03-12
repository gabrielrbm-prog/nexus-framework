#!/usr/bin/env node

/*
 * NEXUS DISCOVERY AGENT
 * Coleta automatica de dados sobre uma empresa antes do briefing
 * Input: Nome da empresa + URL/handles opcionais
 * Output: company-profile.json + discovery-report.md
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { URL } = require('url');

// ===========================================================================
// CONFIG
// ===========================================================================

const BASE_DIR = path.join(process.env.HOME, '.openclaw/workspace/nexus-project');
const PROJECTS_DIR = path.join(BASE_DIR, 'projects');
const CURL_TIMEOUT = 15; // seconds
const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// ===========================================================================
// UTILITIES
// ===========================================================================

function log(emoji, msg) {
  console.log(`${emoji} ${msg}`);
}

function curlFetch(url, opts = {}) {
  const maxSize = opts.maxSize || '2M';
  const timeout = opts.timeout || CURL_TIMEOUT;
  const followRedirects = opts.followRedirects !== false;
  try {
    const cmd = [
      'curl', '-sS',
      '-m', String(timeout),
      '--max-filesize', maxSize,
      '-H', `"User-Agent: ${USER_AGENT}"`,
      '-H', '"Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"',
      '-H', '"Accept-Language: pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7"',
      followRedirects ? '-L' : '',
      `"${url}"`
    ].filter(Boolean).join(' ');
    const result = execSync(cmd, { encoding: 'utf-8', maxBuffer: 5 * 1024 * 1024, timeout: (timeout + 5) * 1000 });
    return result;
  } catch (e) {
    return null;
  }
}

function curlHead(url) {
  try {
    const cmd = `curl -sS -I -m ${CURL_TIMEOUT} -L -H "User-Agent: ${USER_AGENT}" "${url}" 2>/dev/null`;
    return execSync(cmd, { encoding: 'utf-8', timeout: (CURL_TIMEOUT + 5) * 1000 });
  } catch (e) {
    return null;
  }
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function sanitizeProjectId(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function timestamp() {
  return new Date().toISOString();
}

// ===========================================================================
// CLI ARGUMENT PARSING
// ===========================================================================

function parseArgs() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.log('Uso: node nexus-discovery-agent.js "Nome da Empresa" [project-id] [opcoes]');
    console.log('');
    console.log('Opcoes:');
    console.log('  --url <site>          URL do site da empresa');
    console.log('  --instagram <handle>  Handle do Instagram (com ou sem @)');
    console.log('  --youtube <handle>    Handle do YouTube');
    console.log('  --linkedin <url>      URL do perfil LinkedIn');
    console.log('  --sector <setor>      Setor da empresa');
    console.log('');
    console.log('Exemplos:');
    console.log('  node nexus-discovery-agent.js "Summit Prop" summit-prop');
    console.log('  node nexus-discovery-agent.js "Summit Prop" summit-prop --url summitprop.com --instagram @summitprop');
    process.exit(1);
  }

  const companyName = args[0];
  let projectId = args[1] && !args[1].startsWith('--') ? args[1] : sanitizeProjectId(companyName);

  const options = {
    companyName,
    projectId,
    url: null,
    instagram: null,
    youtube: null,
    linkedin: null,
    sector: null,
  };

  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case '--url':
        options.url = args[++i];
        if (options.url && !options.url.startsWith('http')) {
          options.url = 'https://' + options.url;
        }
        break;
      case '--instagram':
        options.instagram = (args[++i] || '').replace(/^@/, '');
        break;
      case '--youtube':
        options.youtube = (args[++i] || '').replace(/^@/, '');
        break;
      case '--linkedin':
        options.linkedin = args[++i];
        break;
      case '--sector':
        options.sector = args[++i];
        break;
    }
  }

  return options;
}

// ===========================================================================
// WEB SEARCH MODULE
// ===========================================================================

class WebSearcher {
  constructor(companyName) {
    this.companyName = companyName;
    this.results = {
      website: null,
      socialProfiles: {},
      mentions: [],
      searchPerformed: false,
    };
  }

  search() {
    log('🔍', `Buscando informacoes sobre "${this.companyName}" na web...`);

    // Strategy 1: Try DuckDuckGo HTML search (no JS needed)
    const ddgResults = this._searchDuckDuckGo();
    if (ddgResults) {
      this.results.searchPerformed = true;
      this._parseSearchResults(ddgResults);
    }

    // Strategy 2: Try Google search via curl
    if (!this.results.searchPerformed) {
      const googleResults = this._searchGoogle();
      if (googleResults) {
        this.results.searchPerformed = true;
        this._parseSearchResults(googleResults);
      }
    }

    // Strategy 3: Try common URL patterns
    this._tryCommonUrls();

    return this.results;
  }

  _searchDuckDuckGo() {
    const query = encodeURIComponent(this.companyName + ' site oficial');
    const url = `https://html.duckduckgo.com/html/?q=${query}`;
    log('  📡', 'Tentando busca DuckDuckGo...');
    return curlFetch(url);
  }

  _searchGoogle() {
    const query = encodeURIComponent(this.companyName);
    const url = `https://www.google.com/search?q=${query}&hl=pt-BR&num=10`;
    log('  📡', 'Tentando busca Google...');
    return curlFetch(url);
  }

  _parseSearchResults(html) {
    if (!html) return;

    // Extract URLs from search results
    const urlPattern = /https?:\/\/[^\s"'<>]+/g;
    const urls = (html.match(urlPattern) || [])
      .filter(u => !u.includes('duckduckgo') && !u.includes('google.com') && !u.includes('bing.com'))
      .filter(u => !u.includes('javascript:') && !u.includes('cache:'));

    // Find social profiles
    const socialPatterns = {
      instagram: /https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_.]+/g,
      youtube: /https?:\/\/(www\.)?youtube\.com\/(channel|c|@)[^\s"'<>]+/g,
      linkedin: /https?:\/\/(www\.)?linkedin\.com\/company\/[^\s"'<>]+/g,
      facebook: /https?:\/\/(www\.)?facebook\.com\/[^\s"'<>]+/g,
      twitter: /https?:\/\/(www\.)?(twitter|x)\.com\/[^\s"'<>]+/g,
    };

    for (const [platform, pattern] of Object.entries(socialPatterns)) {
      const matches = html.match(pattern);
      if (matches && matches.length > 0) {
        this.results.socialProfiles[platform] = [...new Set(matches)][0];
      }
    }

    // Try to identify the main website (first non-social URL)
    const socialDomains = ['instagram.com', 'youtube.com', 'linkedin.com', 'facebook.com', 'twitter.com', 'x.com', 'wikipedia.org'];
    for (const url of urls) {
      try {
        const parsed = new URL(url);
        if (!socialDomains.some(d => parsed.hostname.includes(d))) {
          if (!this.results.website) {
            this.results.website = `${parsed.protocol}//${parsed.hostname}`;
          }
          this.results.mentions.push(url);
          if (this.results.mentions.length >= 10) break;
        }
      } catch (e) { /* ignore malformed */ }
    }

    log('  ✅', `Busca concluida: ${urls.length} URLs encontradas`);
  }

  _tryCommonUrls() {
    const slug = this.companyName.toLowerCase().replace(/\s+/g, '');
    const slugDash = this.companyName.toLowerCase().replace(/\s+/g, '-');
    const candidates = [
      `https://www.${slug}.com.br`,
      `https://www.${slug}.com`,
      `https://${slug}.com.br`,
      `https://${slug}.com`,
      `https://www.${slugDash}.com.br`,
      `https://www.${slugDash}.com`,
    ];

    for (const url of candidates) {
      if (this.results.website) break;
      const head = curlHead(url);
      if (head && (head.includes('200') || head.includes('301') || head.includes('302'))) {
        log('  🌐', `Site encontrado: ${url}`);
        this.results.website = url;
      }
    }
  }
}

// ===========================================================================
// WEBSITE SCRAPER MODULE
// ===========================================================================

class WebsiteScraper {
  constructor(url) {
    this.url = url;
    this.html = null;
    this.data = {
      url: url,
      title: null,
      meta_description: null,
      colors: [],
      fonts: [],
      sections: [],
      ctas: [],
      nav_items: [],
      images: [],
      logo_candidates: [],
      tech: [],
      og_image: null,
      favicon: null,
      language: null,
      raw_html_saved: false,
    };
  }

  scrape() {
    log('🌐', `Fazendo scraping de ${this.url}...`);
    this.html = curlFetch(this.url);
    if (!this.html) {
      log('  ❌', 'Nao foi possivel acessar o site');
      return this.data;
    }
    log('  ✅', `HTML recebido: ${(this.html.length / 1024).toFixed(1)} KB`);

    this._extractTitle();
    this._extractMetaDescription();
    this._extractOGData();
    this._extractLanguage();
    this._extractColors();
    this._extractFonts();
    this._extractNavigation();
    this._extractSections();
    this._extractCTAs();
    this._extractImages();
    this._extractTech();

    // Also try to fetch the CSS files
    this._fetchExternalCSS();

    return this.data;
  }

  saveRawHTML(filepath) {
    if (this.html) {
      fs.writeFileSync(filepath, this.html, 'utf-8');
      this.data.raw_html_saved = true;
      log('  💾', `HTML salvo: ${filepath}`);
    }
  }

  _extractTitle() {
    const match = this.html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (match) {
      this.data.title = match[1].trim().replace(/\s+/g, ' ');
      log('  📄', `Titulo: ${this.data.title}`);
    }
  }

  _extractMetaDescription() {
    const match = this.html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
      || this.html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
    if (match) {
      this.data.meta_description = match[1].trim();
      log('  📝', `Descricao: ${this.data.meta_description.substring(0, 80)}...`);
    }
  }

  _extractOGData() {
    const ogImage = this.html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || this.html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (ogImage) {
      this.data.og_image = ogImage[1];
    }

    const favicon = this.html.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i)
      || this.html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["']/i);
    if (favicon) {
      this.data.favicon = this._resolveUrl(favicon[1]);
    }
  }

  _extractLanguage() {
    const match = this.html.match(/<html[^>]+lang=["']([^"']+)["']/i);
    if (match) {
      this.data.language = match[1];
    }
  }

  _extractColors() {
    const hexPattern = /#(?:[0-9a-fA-F]{3}){1,2}\b/g;
    const rgbPattern = /rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/g;
    const rgbaPattern = /rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*[\d.]+\s*\)/g;

    const colorSet = new Set();

    // Hex colors
    const hexMatches = this.html.match(hexPattern) || [];
    hexMatches.forEach(c => {
      const normalized = c.toLowerCase();
      // Filter out very common/boring colors
      if (!['#fff', '#ffffff', '#000', '#000000', '#333', '#333333', '#666', '#666666',
            '#999', '#999999', '#ccc', '#cccccc', '#ddd', '#dddddd', '#eee', '#eeeeee',
            '#aaa', '#aaaaaa', '#bbb', '#bbbbbb'].includes(normalized)) {
        colorSet.add(normalized.length === 4 ? this._expandHex(normalized) : normalized);
      }
    });

    // RGB colors
    let rgbMatch;
    while ((rgbMatch = rgbPattern.exec(this.html)) !== null) {
      const hex = '#' + [rgbMatch[1], rgbMatch[2], rgbMatch[3]]
        .map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
      if (!['#ffffff', '#000000'].includes(hex)) {
        colorSet.add(hex);
      }
    }

    while ((rgbMatch = rgbaPattern.exec(this.html)) !== null) {
      const hex = '#' + [rgbMatch[1], rgbMatch[2], rgbMatch[3]]
        .map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
      if (!['#ffffff', '#000000'].includes(hex)) {
        colorSet.add(hex);
      }
    }

    // CSS custom properties that look like brand colors
    const cssVarPattern = /--(?:primary|secondary|accent|brand|main|color)[^:]*:\s*([^;]+)/gi;
    let cssVarMatch;
    while ((cssVarMatch = cssVarPattern.exec(this.html)) !== null) {
      const val = cssVarMatch[1].trim();
      const hexInVar = val.match(hexPattern);
      if (hexInVar) {
        colorSet.add(hexInVar[0].toLowerCase());
      }
    }

    this.data.colors = [...colorSet].slice(0, 20);
    log('  🎨', `Cores encontradas: ${this.data.colors.length}`);
  }

  _expandHex(hex) {
    return '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }

  _extractFonts() {
    const fontSet = new Set();

    // font-family declarations
    const fontFamilyPattern = /font-family\s*:\s*["']?([^;"'}\n]+)/gi;
    let fontMatch;
    while ((fontMatch = fontFamilyPattern.exec(this.html)) !== null) {
      const fonts = fontMatch[1].split(',').map(f => f.trim().replace(/["']/g, ''));
      fonts.forEach(f => {
        const clean = f.trim();
        // Skip generic family names
        if (!['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui',
              'ui-serif', 'ui-sans-serif', 'ui-monospace', '-apple-system',
              'BlinkMacSystemFont', 'Segoe UI', 'inherit', 'initial'].includes(clean)
            && clean.length > 1 && clean.length < 50) {
          fontSet.add(clean);
        }
      });
    }

    // Google Fonts links
    const gfPattern = /fonts\.googleapis\.com\/css2?\?family=([^"'&\s]+)/g;
    while ((fontMatch = gfPattern.exec(this.html)) !== null) {
      const families = decodeURIComponent(fontMatch[1]).split('|');
      families.forEach(f => {
        const name = f.split(':')[0].replace(/\+/g, ' ');
        if (name) fontSet.add(name);
      });
    }

    // @font-face declarations
    const fontFacePattern = /@font-face\s*\{[^}]*font-family\s*:\s*["']?([^;"'}\n]+)/gi;
    while ((fontMatch = fontFacePattern.exec(this.html)) !== null) {
      const name = fontMatch[1].trim().replace(/["']/g, '');
      if (name.length > 1 && name.length < 50) fontSet.add(name);
    }

    this.data.fonts = [...fontSet].slice(0, 10);
    log('  🔤', `Fontes encontradas: ${this.data.fonts.join(', ') || 'nenhuma'}`);
  }

  _extractNavigation() {
    // Try to find nav elements
    const navPattern = /<nav[^>]*>([\s\S]*?)<\/nav>/gi;
    const headerPattern = /<header[^>]*>([\s\S]*?)<\/header>/gi;
    const linkPattern = /<a[^>]*>([\s\S]*?)<\/a>/gi;

    const navItems = new Set();

    // From <nav> elements
    let navMatch;
    while ((navMatch = navPattern.exec(this.html)) !== null) {
      const navHtml = navMatch[1];
      let linkMatch;
      const linkRe = /<a[^>]*>([\s\S]*?)<\/a>/gi;
      while ((linkMatch = linkRe.exec(navHtml)) !== null) {
        const text = linkMatch[1].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
        if (text.length > 0 && text.length < 40) {
          navItems.add(text);
        }
      }
    }

    // From <header> if nav was empty
    if (navItems.size === 0) {
      while ((navMatch = headerPattern.exec(this.html)) !== null) {
        const headerHtml = navMatch[1];
        let linkMatch;
        const linkRe = /<a[^>]*>([\s\S]*?)<\/a>/gi;
        while ((linkMatch = linkRe.exec(headerHtml)) !== null) {
          const text = linkMatch[1].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
          if (text.length > 0 && text.length < 40) {
            navItems.add(text);
          }
        }
      }
    }

    this.data.nav_items = [...navItems].slice(0, 20);
    log('  📋', `Menu: ${this.data.nav_items.join(', ') || 'nao detectado'}`);
  }

  _extractSections() {
    const sectionPatterns = [
      /<section[^>]*(?:id|class)=["']([^"']+)["']/gi,
      /<div[^>]*id=["']([^"']+)["'][^>]*class=["'][^"']*(?:section|block|container)[^"']*["']/gi,
      /<div[^>]*class=["'][^"']*(?:section|block)[^"']*["'][^>]*id=["']([^"']+)["']/gi,
    ];

    const sectionSet = new Set();

    for (const pattern of sectionPatterns) {
      let match;
      while ((match = pattern.exec(this.html)) !== null) {
        const id = match[1].toLowerCase().replace(/[-_]/g, ' ').trim();
        // Filter meaningful section names
        const keywords = ['hero', 'about', 'sobre', 'service', 'servico', 'product', 'produto',
          'pricing', 'preco', 'plano', 'plan', 'team', 'equipe', 'contact', 'contato',
          'testimonial', 'depoimento', 'faq', 'footer', 'header', 'cta', 'feature',
          'benefit', 'beneficio', 'gallery', 'galeria', 'portfolio', 'blog', 'news',
          'parceiro', 'partner', 'client', 'cliente', 'how', 'como', 'step', 'passo',
          'banner', 'intro', 'video', 'download', 'newsletter', 'subscribe'];
        if (keywords.some(k => id.includes(k)) || id.length < 20) {
          sectionSet.add(id);
        }
      }
    }

    // Also detect by common heading patterns
    const headingPattern = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi;
    let headingMatch;
    const headings = [];
    while ((headingMatch = headingPattern.exec(this.html)) !== null) {
      const text = headingMatch[1].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
      if (text.length > 2 && text.length < 80) {
        headings.push(text);
      }
    }
    if (headings.length > 0 && sectionSet.size === 0) {
      // Use headings as section indicators
      headings.slice(0, 15).forEach(h => sectionSet.add(h));
    }

    this.data.sections = [...sectionSet].slice(0, 20);
    log('  📐', `Secoes: ${this.data.sections.length}`);
  }

  _extractCTAs() {
    const ctaPatterns = [
      // Buttons
      /<button[^>]*>([\s\S]*?)<\/button>/gi,
      // Links with CTA-like classes
      /<a[^>]*class=["'][^"']*(?:btn|button|cta|action)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi,
      // Links with CTA-like text
      /<a[^>]*>([\s\S]*?)<\/a>/gi,
    ];

    const ctaKeywords = [
      'comece', 'comecar', 'iniciar', 'start', 'begin',
      'saiba mais', 'learn more', 'ver mais', 'see more',
      'comprar', 'buy', 'adquirir', 'purchase',
      'assinar', 'subscribe', 'inscreva', 'sign up', 'cadastr',
      'contato', 'contact', 'fale conosco', 'talk to us',
      'baixar', 'download', 'get', 'obter',
      'testar', 'test', 'trial', 'free',
      'solicitar', 'request', 'agendar', 'schedule',
      'entrar', 'login', 'acessar', 'access',
      'conhecer', 'discover', 'explorar', 'explore',
      'investir', 'invest', 'operar', 'trade',
    ];

    const ctaSet = new Set();

    for (const pattern of ctaPatterns) {
      let match;
      while ((match = pattern.exec(this.html)) !== null) {
        const text = (match[2] || match[1]).replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
        if (text.length >= 3 && text.length <= 50) {
          if (ctaKeywords.some(k => text.toLowerCase().includes(k))) {
            ctaSet.add(text);
          }
        }
      }
    }

    this.data.ctas = [...ctaSet].slice(0, 15);
    log('  🎯', `CTAs: ${this.data.ctas.join(' | ') || 'nenhum detectado'}`);
  }

  _extractImages() {
    const imgPattern = /<img[^>]+src=["']([^"']+)["'][^>]*/gi;
    const images = [];
    const logoCandiates = [];
    let match;

    while ((match = imgPattern.exec(this.html)) !== null) {
      const src = this._resolveUrl(match[1]);
      const tag = match[0].toLowerCase();
      const alt = (tag.match(/alt=["']([^"']+)["']/i) || [])[1] || '';

      images.push({ src, alt });

      // Detect logo candidates
      if (tag.includes('logo') || alt.toLowerCase().includes('logo') ||
          src.toLowerCase().includes('logo') || tag.includes('brand')) {
        logoCandiates.push(src);
      }
    }

    // Also check SVG inline logos
    const svgLogoPattern = /<(?:a[^>]*class=["'][^"']*logo[^"']*["'][^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["'])/gi;
    while ((match = svgLogoPattern.exec(this.html)) !== null) {
      logoCandiates.push(this._resolveUrl(match[1]));
    }

    // OG image as fallback logo
    if (this.data.og_image) {
      logoCandiates.push(this.data.og_image);
    }

    this.data.images = images.slice(0, 30);
    this.data.logo_candidates = [...new Set(logoCandiates)].slice(0, 5);
    log('  🖼️', `Imagens: ${images.length}, Logos candidatos: ${logoCandiates.length}`);
  }

  _extractTech() {
    const tech = [];
    const html = this.html.toLowerCase();

    // CMS / Framework detection
    const techSignatures = {
      'WordPress': ['/wp-content/', '/wp-includes/', 'wp-json', 'wordpress'],
      'Wix': ['wix.com', '_wix', 'wixsite'],
      'Squarespace': ['squarespace', 'sqsp'],
      'Shopify': ['shopify', 'myshopify'],
      'Next.js': ['__next', '_next/static', 'next.js'],
      'Nuxt.js': ['__nuxt', '_nuxt/', 'nuxt.js'],
      'React': ['react-root', 'reactdom', '__react', 'react.production'],
      'Vue.js': ['vue.js', 'vue.min.js', 'vue-app', '__vue'],
      'Angular': ['ng-version', 'angular.js', 'angular.min.js'],
      'Gatsby': ['gatsby', '___gatsby'],
      'Webflow': ['webflow', 'wf-'],
      'Bootstrap': ['bootstrap.min.css', 'bootstrap.min.js', 'bootstrap.css'],
      'Tailwind CSS': ['tailwindcss', 'tailwind.min.css'],
      'jQuery': ['jquery.min.js', 'jquery-'],
      'Google Tag Manager': ['googletagmanager', 'gtm.js'],
      'Google Analytics': ['google-analytics', 'ga.js', 'gtag'],
      'Facebook Pixel': ['fbevents.js', 'facebook.net/en_US/fbevents'],
      'Hotjar': ['hotjar', 'hj.js'],
      'Cloudflare': ['cloudflare', 'cf-ray'],
      'Vercel': ['vercel', 'v0.dev'],
      'Elementor': ['elementor', 'elementor-widget'],
      'Divi': ['divi', 'et-builder'],
      'HubSpot': ['hubspot', 'hs-script'],
      'RD Station': ['rdstation', 'rd-station'],
      'Tawk.to': ['tawk.to', 'embed.tawk'],
      'Intercom': ['intercom', 'intercomcdn'],
      'Crisp': ['crisp.chat'],
      'PHP': ['.php"', '.php\''],
      'ASP.NET': ['aspnet', '__viewstate'],
      'Laravel': ['laravel', 'csrf-token'],
    };

    for (const [name, signatures] of Object.entries(techSignatures)) {
      if (signatures.some(sig => html.includes(sig))) {
        tech.push(name);
      }
    }

    // Check headers for tech info
    const headers = curlHead(this.url);
    if (headers) {
      const headersLower = headers.toLowerCase();
      if (headersLower.includes('x-powered-by: express')) tech.push('Express.js');
      if (headersLower.includes('x-powered-by: php')) tech.push('PHP');
      if (headersLower.includes('server: nginx')) tech.push('Nginx');
      if (headersLower.includes('server: apache')) tech.push('Apache');
      if (headersLower.includes('server: cloudflare')) {
        if (!tech.includes('Cloudflare')) tech.push('Cloudflare');
      }
    }

    this.data.tech = [...new Set(tech)];
    log('  🔧', `Tecnologias: ${this.data.tech.join(', ') || 'nao detectadas'}`);
  }

  _fetchExternalCSS() {
    const cssPattern = /<link[^>]+href=["']([^"']+\.css[^"']*)["'][^>]*rel=["']stylesheet["']/gi;
    const cssPattern2 = /<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+\.css[^"']*)["']/gi;

    const cssUrls = new Set();
    let match;
    while ((match = cssPattern.exec(this.html)) !== null) cssUrls.add(match[1]);
    while ((match = cssPattern2.exec(this.html)) !== null) cssUrls.add(match[1]);

    // Fetch up to 3 CSS files for more color/font data
    let cssCount = 0;
    for (const cssUrl of cssUrls) {
      if (cssCount >= 3) break;
      const fullUrl = this._resolveUrl(cssUrl);
      log('  📦', `Buscando CSS: ${fullUrl.substring(0, 80)}...`);
      const css = curlFetch(fullUrl, { maxSize: '1M' });
      if (css) {
        cssCount++;
        // Extract colors from CSS
        const hexPattern = /#(?:[0-9a-fA-F]{3}){1,2}\b/g;
        const hexMatches = css.match(hexPattern) || [];
        const newColors = hexMatches
          .map(c => c.toLowerCase())
          .filter(c => !['#fff', '#ffffff', '#000', '#000000', '#333', '#333333',
            '#666', '#666666', '#999', '#ccc', '#ddd', '#eee', '#aaa', '#bbb'].includes(c));

        // Add CSS variable colors
        const cssVarPattern = /--(?:primary|secondary|accent|brand|main|color)[^:]*:\s*([^;]+)/gi;
        let varMatch;
        while ((varMatch = cssVarPattern.exec(css)) !== null) {
          const val = varMatch[1].trim();
          const hexInVar = val.match(hexPattern);
          if (hexInVar) newColors.push(hexInVar[0].toLowerCase());
        }

        const existingColors = new Set(this.data.colors);
        newColors.forEach(c => {
          const norm = c.length === 4 ? this._expandHex(c) : c;
          existingColors.add(norm);
        });
        this.data.colors = [...existingColors].slice(0, 25);

        // Extract fonts from CSS
        const fontPattern = /font-family\s*:\s*["']?([^;"'}\n]+)/gi;
        let fontMatch;
        while ((fontMatch = fontPattern.exec(css)) !== null) {
          const fonts = fontMatch[1].split(',').map(f => f.trim().replace(/["']/g, ''));
          fonts.forEach(f => {
            if (!['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui',
                  'inherit', 'initial', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI']
                .includes(f.trim()) && f.trim().length > 1 && f.trim().length < 50) {
              if (!this.data.fonts.includes(f.trim())) {
                this.data.fonts.push(f.trim());
              }
            }
          });
        }
      }
    }

    this.data.fonts = [...new Set(this.data.fonts)].slice(0, 10);
  }

  _resolveUrl(relative) {
    if (!relative) return '';
    if (relative.startsWith('http://') || relative.startsWith('https://')) return relative;
    if (relative.startsWith('//')) return 'https:' + relative;
    try {
      const base = new URL(this.url);
      if (relative.startsWith('/')) {
        return `${base.protocol}//${base.hostname}${relative}`;
      }
      return `${base.protocol}//${base.hostname}/${relative}`;
    } catch (e) {
      return relative;
    }
  }
}

// ===========================================================================
// SOCIAL MEDIA SCRAPER MODULE
// ===========================================================================

class SocialMediaScraper {

  scrapeInstagram(handle) {
    if (!handle) return this._emptyProfile('instagram');
    log('📸', `Analisando Instagram: @${handle}...`);

    const url = `https://www.instagram.com/${handle}/`;
    const html = curlFetch(url);

    const profile = {
      handle: `@${handle}`,
      url: url,
      bio: 'manual_input_needed',
      followers: 'manual_input_needed',
      following: 'manual_input_needed',
      posts_count: 'manual_input_needed',
      tone: 'manual_input_needed',
      content_type: 'manual_input_needed',
      accessible: false,
    };

    if (!html) {
      log('  ⚠️', 'Instagram nao acessivel via curl (requer login)');
      return profile;
    }

    profile.accessible = true;

    // Try to extract from meta tags (sometimes available)
    const descMatch = html.match(/<meta[^>]+(?:property=["']og:description["']|name=["']description["'])[^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property=["']og:description["']|name=["']description["'])/i);
    if (descMatch) {
      const desc = descMatch[1];
      profile.bio = desc;
      // Try to parse follower counts from description
      // Format: "X Followers, Y Following, Z Posts - ..."
      const followerMatch = desc.match(/([\d,.]+[KkMm]?)\s*Followers/i);
      const followingMatch = desc.match(/([\d,.]+[KkMm]?)\s*Following/i);
      const postsMatch = desc.match(/([\d,.]+[KkMm]?)\s*Posts/i);
      if (followerMatch) profile.followers = followerMatch[1];
      if (followingMatch) profile.following = followingMatch[1];
      if (postsMatch) profile.posts_count = postsMatch[1];

      // Extract bio (after the counts)
      const bioMatch = desc.match(/Posts\s*-\s*([\s\S]+)/i);
      if (bioMatch) profile.bio = bioMatch[1].trim();
    }

    const titleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
    if (titleMatch) {
      profile.display_name = titleMatch[1];
    }

    log('  ✅', `Instagram: ${profile.followers !== 'manual_input_needed' ? profile.followers + ' seguidores' : 'dados limitados'}`);
    return profile;
  }

  scrapeYouTube(handle) {
    if (!handle) return this._emptyProfile('youtube');
    log('📺', `Analisando YouTube: @${handle}...`);

    // Try both formats
    const urls = [
      `https://www.youtube.com/@${handle}`,
      `https://www.youtube.com/c/${handle}`,
      `https://www.youtube.com/${handle}`,
    ];

    let html = null;
    let usedUrl = '';
    for (const url of urls) {
      html = curlFetch(url);
      if (html && html.length > 1000) {
        usedUrl = url;
        break;
      }
    }

    const profile = {
      handle: `@${handle}`,
      url: usedUrl || urls[0],
      description: 'manual_input_needed',
      subscribers: 'manual_input_needed',
      video_count: 'manual_input_needed',
      accessible: false,
    };

    if (!html) {
      log('  ⚠️', 'YouTube nao acessivel');
      return profile;
    }

    profile.accessible = true;

    // Extract from meta tags
    const descMatch = html.match(/<meta[^>]+(?:property=["']og:description["']|name=["']description["'])[^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property=["']og:description["']|name=["']description["'])/i);
    if (descMatch) {
      profile.description = descMatch[1].trim();
    }

    // Try to get subscriber count from page content
    const subMatch = html.match(/"subscriberCountText":\s*\{"simpleText":\s*"([^"]+)"/i)
      || html.match(/(\d[\d,.]*[KkMm]?)\s*(?:subscribers|inscritos)/i);
    if (subMatch) {
      profile.subscribers = subMatch[1];
    }

    const titleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
    if (titleMatch) {
      profile.channel_name = titleMatch[1];
    }

    log('  ✅', `YouTube: ${profile.subscribers !== 'manual_input_needed' ? profile.subscribers + ' inscritos' : 'dados limitados'}`);
    return profile;
  }

  scrapeLinkedIn(urlOrSlug) {
    if (!urlOrSlug) return this._emptyProfile('linkedin');
    log('💼', `Analisando LinkedIn: ${urlOrSlug}...`);

    let url = urlOrSlug;
    if (!url.startsWith('http')) {
      url = `https://www.linkedin.com/company/${urlOrSlug}/`;
    }

    const profile = {
      url: url,
      description: 'manual_input_needed',
      employee_count: 'manual_input_needed',
      industry: 'manual_input_needed',
      accessible: false,
      note: 'LinkedIn requer autenticacao para a maioria dos dados. Acesso via curl e muito limitado.',
    };

    // LinkedIn blocks most curl requests, but let's try
    const html = curlFetch(url);
    if (html && html.length > 1000) {
      profile.accessible = true;

      const descMatch = html.match(/<meta[^>]+(?:property=["']og:description["']|name=["']description["'])[^>]+content=["']([^"']+)["']/i);
      if (descMatch) {
        profile.description = descMatch[1].trim();
      }

      const titleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
      if (titleMatch) {
        profile.company_name = titleMatch[1];
      }
    } else {
      log('  ⚠️', 'LinkedIn nao acessivel via curl (requer autenticacao)');
    }

    return profile;
  }

  _emptyProfile(platform) {
    return {
      handle: 'not_provided',
      url: null,
      accessible: false,
      note: `Handle de ${platform} nao foi fornecido. Use --${platform} para especificar.`,
    };
  }
}

// ===========================================================================
// LOCAL FILES ANALYZER MODULE
// ===========================================================================

class LocalFilesAnalyzer {
  constructor(projectDir) {
    this.projectDir = projectDir;
  }

  analyze() {
    log('📁', `Analisando arquivos locais em ${this.projectDir}...`);

    const materials = [];
    const logoCandiates = [];

    if (!fs.existsSync(this.projectDir)) {
      log('  ℹ️', 'Diretorio do projeto ainda nao existe (sera criado)');
      return { materials, logoCandiates };
    }

    this._scanDir(this.projectDir, materials, logoCandiates, 0);

    log('  📄', `Materiais encontrados: ${materials.length}`);
    return { materials, logoCandiates };
  }

  _scanDir(dir, materials, logoCandiates, depth) {
    if (depth > 3) return; // Don't go too deep
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          this._scanDir(fullPath, materials, logoCandiates, depth + 1);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          const stat = fs.statSync(fullPath);

          if (['.pdf', '.doc', '.docx', '.pptx', '.ppt', '.xls', '.xlsx'].includes(ext)) {
            materials.push({
              type: 'document',
              name: entry.name,
              path: fullPath,
              size: `${(stat.size / 1024).toFixed(1)} KB`,
            });
          }

          if (['.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif'].includes(ext)) {
            const item = {
              type: 'image',
              name: entry.name,
              path: fullPath,
              size: `${(stat.size / 1024).toFixed(1)} KB`,
            };
            materials.push(item);

            // Check if it's a logo candidate
            if (entry.name.toLowerCase().includes('logo') || entry.name.toLowerCase().includes('marca')
                || entry.name.toLowerCase().includes('brand')) {
              logoCandiates.push(fullPath);
            }
          }

          if (['.ai', '.psd', '.fig', '.sketch', '.eps'].includes(ext)) {
            materials.push({
              type: 'design_file',
              name: entry.name,
              path: fullPath,
              size: `${(stat.size / 1024).toFixed(1)} KB`,
            });
          }
        }
      }
    } catch (e) {
      // Permission error or similar, skip
    }
  }
}

// ===========================================================================
// SECTOR DETECTOR
// ===========================================================================

function detectSector(companyName, websiteData, searchData) {
  const text = [
    companyName,
    websiteData?.title || '',
    websiteData?.meta_description || '',
    websiteData?.nav_items?.join(' ') || '',
    websiteData?.ctas?.join(' ') || '',
    websiteData?.sections?.join(' ') || '',
  ].join(' ').toLowerCase();

  const sectors = {
    'Prop Trading / Mesa Proprietaria': ['prop', 'trading', 'trader', 'mesa proprietaria', 'forex', 'operar', 'operacao', 'mercado financeiro'],
    'Fintech / Servicos Financeiros': ['fintech', 'pagamento', 'banco', 'financeiro', 'investimento', 'criptomoeda', 'crypto', 'defi', 'blockchain'],
    'E-commerce / Varejo': ['loja', 'shop', 'store', 'ecommerce', 'produto', 'comprar', 'carrinho', 'marketplace'],
    'SaaS / Tecnologia': ['software', 'saas', 'plataforma', 'api', 'cloud', 'dashboard', 'ferramenta'],
    'Agencia / Marketing': ['agencia', 'agency', 'marketing', 'digital', 'publicidade', 'branding', 'criativo'],
    'Educacao': ['curso', 'educacao', 'ensino', 'aprendizado', 'escola', 'universidade', 'treinamento'],
    'Saude': ['saude', 'medico', 'clinica', 'hospital', 'odontologico', 'fisioterapia', 'nutricao'],
    'Consultoria': ['consultoria', 'consulting', 'assessoria', 'mentoria', 'coaching'],
    'Imobiliario': ['imovel', 'imobiliaria', 'casa', 'apartamento', 'aluguel', 'construcao'],
    'Alimentacao': ['restaurante', 'comida', 'delivery', 'culinaria', 'gastronomia'],
    'Fitness / Esporte': ['academia', 'fitness', 'gym', 'treino', 'esporte', 'suplemento'],
    'Moda / Fashion': ['moda', 'fashion', 'roupa', 'streetwear', 'colecao', 'estilo', 'wear'],
    'Entretenimento': ['entretenimento', 'evento', 'show', 'musica', 'gaming', 'jogo'],
    'Advocacia / Juridico': ['advogado', 'juridico', 'direito', 'lei', 'escritorio', 'law'],
    'Automotivo': ['carro', 'auto', 'veiculo', 'mecanica', 'peca', 'motor'],
  };

  for (const [sector, keywords] of Object.entries(sectors)) {
    if (keywords.some(k => text.includes(k))) {
      return sector;
    }
  }

  return 'Nao identificado (manual_input_needed)';
}

// ===========================================================================
// DATA COMPLETENESS CALCULATOR
// ===========================================================================

function calculateCompleteness(profile) {
  const checks = {
    website: {
      total: 8,
      filled: 0,
      items: [],
    },
    social: {
      total: 6,
      filled: 0,
      items: [],
    },
    brand: {
      total: 4,
      filled: 0,
      items: [],
    },
  };

  // Website checks
  const site = profile.current_site;
  if (site.url) checks.website.filled++;
  else checks.website.items.push('URL do site');
  if (site.title) checks.website.filled++;
  else checks.website.items.push('Titulo do site');
  if (site.meta_description) checks.website.filled++;
  else checks.website.items.push('Meta description');
  if (site.colors && site.colors.length > 0) checks.website.filled++;
  else checks.website.items.push('Paleta de cores do site');
  if (site.fonts && site.fonts.length > 0) checks.website.filled++;
  else checks.website.items.push('Fontes do site');
  if (site.sections && site.sections.length > 0) checks.website.filled++;
  else checks.website.items.push('Estrutura de secoes');
  if (site.ctas && site.ctas.length > 0) checks.website.filled++;
  else checks.website.items.push('CTAs do site');
  if (site.tech && site.tech.length > 0) checks.website.filled++;
  else checks.website.items.push('Tecnologias do site');

  // Social checks
  const social = profile.social_media;
  if (social.instagram && social.instagram.accessible) checks.social.filled += 2;
  else {
    checks.social.items.push('Perfil do Instagram');
    checks.social.items.push('Bio e seguidores do Instagram');
  }
  if (social.youtube && social.youtube.accessible) checks.social.filled += 2;
  else {
    checks.social.items.push('Canal do YouTube');
    checks.social.items.push('Descricao e inscritos do YouTube');
  }
  if (social.linkedin && social.linkedin.accessible) checks.social.filled += 2;
  else {
    checks.social.items.push('Perfil do LinkedIn');
    checks.social.items.push('Descricao e setor do LinkedIn');
  }

  // Brand checks
  if (profile.brand_assets.logo_candidates.length > 0) checks.brand.filled++;
  else checks.brand.items.push('Logo da empresa');
  if (profile.brand_assets.colors_detected.length > 0) checks.brand.filled++;
  else checks.brand.items.push('Cores da marca');
  if (profile.brand_assets.fonts_detected.length > 0) checks.brand.filled++;
  else checks.brand.items.push('Fontes da marca');
  // Brand guidelines PDF
  const hasBrandDoc = profile.materials.some(m => m.type === 'document' &&
    (m.name.toLowerCase().includes('brand') || m.name.toLowerCase().includes('marca') || m.name.toLowerCase().includes('identidade')));
  if (hasBrandDoc) checks.brand.filled++;
  else checks.brand.items.push('Manual de marca / brand guidelines');

  const totalChecks = checks.website.total + checks.social.total + checks.brand.total;
  const totalFilled = checks.website.filled + checks.social.filled + checks.brand.filled;
  const score = Math.round((totalFilled / totalChecks) * 100);

  const missing = [
    ...checks.website.items,
    ...checks.social.items,
    ...checks.brand.items,
    'Definicao do publico-alvo',
    'Objetivos do projeto',
  ];

  return {
    website: checks.website.filled >= checks.website.total * 0.6,
    social: checks.social.filled === 0 ? false : checks.social.filled >= checks.social.total * 0.5 ? true : 'partial',
    brand: checks.brand.filled === 0 ? false : checks.brand.filled >= checks.brand.total * 0.5 ? true : 'partial',
    score,
    missing,
  };
}

// ===========================================================================
// REPORT GENERATOR
// ===========================================================================

function generateMarkdownReport(profile) {
  const lines = [];
  const sep = '---';

  lines.push(`# Discovery Report: ${profile.company.name}`);
  lines.push(`> Gerado em ${profile.generated_at}`);
  lines.push(`> Projeto: \`${profile.project_id}\``);
  lines.push('');
  lines.push(sep);
  lines.push('');

  // Company
  lines.push('## Empresa');
  lines.push(`- **Nome:** ${profile.company.name}`);
  lines.push(`- **Setor:** ${profile.company.sector}`);
  if (profile.company.description) lines.push(`- **Descricao:** ${profile.company.description}`);
  if (profile.company.location) lines.push(`- **Localizacao:** ${profile.company.location}`);
  lines.push('');

  // Website
  lines.push('## Site Atual');
  if (profile.current_site.url) {
    lines.push(`- **URL:** ${profile.current_site.url}`);
    lines.push(`- **Titulo:** ${profile.current_site.title || 'N/A'}`);
    lines.push(`- **Meta Description:** ${profile.current_site.meta_description || 'N/A'}`);
    lines.push(`- **Idioma:** ${profile.current_site.language || 'N/A'}`);
    lines.push('');

    if (profile.current_site.tech.length > 0) {
      lines.push(`### Tecnologias Detectadas`);
      profile.current_site.tech.forEach(t => lines.push(`- ${t}`));
      lines.push('');
    }

    if (profile.current_site.colors.length > 0) {
      lines.push(`### Paleta de Cores (${profile.current_site.colors.length} cores)`);
      lines.push(`\`${profile.current_site.colors.join('` `')}\``);
      lines.push('');
    }

    if (profile.current_site.fonts.length > 0) {
      lines.push(`### Fontes`);
      profile.current_site.fonts.forEach(f => lines.push(`- ${f}`));
      lines.push('');
    }

    if (profile.current_site.nav_items.length > 0) {
      lines.push(`### Navegacao`);
      lines.push(profile.current_site.nav_items.join(' | '));
      lines.push('');
    }

    if (profile.current_site.sections.length > 0) {
      lines.push(`### Secoes Identificadas`);
      profile.current_site.sections.forEach(s => lines.push(`- ${s}`));
      lines.push('');
    }

    if (profile.current_site.ctas.length > 0) {
      lines.push(`### CTAs (Call to Action)`);
      profile.current_site.ctas.forEach(c => lines.push(`- "${c}"`));
      lines.push('');
    }
  } else {
    lines.push('Site nao encontrado ou nao fornecido.');
    lines.push('');
  }

  // Social Media
  lines.push('## Redes Sociais');
  lines.push('');

  const social = profile.social_media;
  if (social.instagram) {
    lines.push('### Instagram');
    lines.push(`- **Handle:** ${social.instagram.handle || 'N/A'}`);
    lines.push(`- **Seguidores:** ${social.instagram.followers || 'N/A'}`);
    lines.push(`- **Bio:** ${social.instagram.bio || 'N/A'}`);
    lines.push(`- **Acessivel:** ${social.instagram.accessible ? 'Sim' : 'Nao'}`);
    lines.push('');
  }

  if (social.youtube) {
    lines.push('### YouTube');
    lines.push(`- **Canal:** ${social.youtube.handle || 'N/A'}`);
    lines.push(`- **Inscritos:** ${social.youtube.subscribers || 'N/A'}`);
    lines.push(`- **Descricao:** ${social.youtube.description || 'N/A'}`);
    lines.push(`- **Acessivel:** ${social.youtube.accessible ? 'Sim' : 'Nao'}`);
    lines.push('');
  }

  if (social.linkedin) {
    lines.push('### LinkedIn');
    lines.push(`- **URL:** ${social.linkedin.url || 'N/A'}`);
    lines.push(`- **Descricao:** ${social.linkedin.description || 'N/A'}`);
    lines.push(`- **Acessivel:** ${social.linkedin.accessible ? 'Sim' : 'Nao'}`);
    lines.push('');
  }

  // Brand Assets
  lines.push('## Brand Assets');
  if (profile.brand_assets.logo_candidates.length > 0) {
    lines.push('### Logos Candidatos');
    profile.brand_assets.logo_candidates.forEach(l => lines.push(`- ${l}`));
    lines.push('');
  }

  if (profile.brand_assets.colors_detected.length > 0) {
    lines.push('### Cores da Marca');
    lines.push(`\`${profile.brand_assets.colors_detected.join('` `')}\``);
    lines.push('');
  }

  if (profile.brand_assets.fonts_detected.length > 0) {
    lines.push('### Fontes da Marca');
    profile.brand_assets.fonts_detected.forEach(f => lines.push(`- ${f}`));
    lines.push('');
  }

  // Materials
  if (profile.materials.length > 0) {
    lines.push('## Materiais Encontrados');
    profile.materials.forEach(m => {
      lines.push(`- **[${m.type}]** ${m.name} (${m.size})`);
    });
    lines.push('');
  }

  // Completeness
  lines.push(sep);
  lines.push('');
  lines.push('## Completude dos Dados');
  lines.push('');
  const dc = profile.data_completeness;
  const bar = (pct) => {
    const filled = Math.round(pct / 5);
    return '[' + '█'.repeat(filled) + '░'.repeat(20 - filled) + '] ' + pct + '%';
  };
  lines.push(`**Score Geral:** ${bar(dc.score)}`);
  lines.push('');
  lines.push(`- Website: ${dc.website === true ? '✅ Completo' : dc.website === 'partial' ? '⚠️ Parcial' : '❌ Incompleto'}`);
  lines.push(`- Social Media: ${dc.social === true ? '✅ Completo' : dc.social === 'partial' ? '⚠️ Parcial' : '❌ Incompleto'}`);
  lines.push(`- Brand Assets: ${dc.brand === true ? '✅ Completo' : dc.brand === 'partial' ? '⚠️ Parcial' : '❌ Incompleto'}`);
  lines.push('');

  if (profile.missing_data.length > 0) {
    lines.push('### Dados Faltantes');
    profile.missing_data.forEach(m => lines.push(`- [ ] ${m}`));
    lines.push('');
  }

  lines.push(sep);
  lines.push('');
  lines.push(`*Gerado pelo NEXUS Discovery Agent v1.0.0*`);

  return lines.join('\n');
}

// ===========================================================================
// MAIN DISCOVERY ENGINE
// ===========================================================================

async function main() {
  const startTime = Date.now();

  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║       NEXUS DISCOVERY AGENT v1.0.0          ║');
  console.log('║  Coleta automatica de dados da empresa       ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  // Parse arguments
  const args = parseArgs();
  const projectDir = path.join(PROJECTS_DIR, args.projectId);
  const discoveryDir = path.join(projectDir, 'discovery');

  log('🏢', `Empresa: ${args.companyName}`);
  log('📂', `Projeto: ${args.projectId}`);
  log('📍', `Output: ${discoveryDir}`);
  console.log('');

  // Create directories
  ensureDir(projectDir);
  ensureDir(discoveryDir);

  // =========================================================================
  // STEP 1: Web Search
  // =========================================================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' FASE 1: Busca na Web');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const searcher = new WebSearcher(args.companyName);
  const searchResults = searcher.search();

  // Use provided URL or discovered one
  let websiteUrl = args.url || searchResults.website;
  if (websiteUrl) {
    log('🌐', `Site principal: ${websiteUrl}`);
  } else {
    log('⚠️', 'Site nao encontrado. Use --url para especificar.');
  }

  // Use discovered social profiles or provided ones
  const instagramHandle = args.instagram || (() => {
    if (searchResults.socialProfiles.instagram) {
      const match = searchResults.socialProfiles.instagram.match(/instagram\.com\/([a-zA-Z0-9_.]+)/);
      return match ? match[1] : null;
    }
    return null;
  })();

  const youtubeHandle = args.youtube || (() => {
    if (searchResults.socialProfiles.youtube) {
      const match = searchResults.socialProfiles.youtube.match(/youtube\.com\/(?:@|c\/)([a-zA-Z0-9_-]+)/);
      return match ? match[1] : null;
    }
    return null;
  })();

  const linkedinUrl = args.linkedin || searchResults.socialProfiles.linkedin || null;

  console.log('');

  // =========================================================================
  // STEP 2: Website Scraping
  // =========================================================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' FASE 2: Scraping do Site');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  let websiteData = {
    url: websiteUrl,
    title: null,
    meta_description: null,
    colors: [],
    fonts: [],
    sections: [],
    ctas: [],
    nav_items: [],
    images: [],
    logo_candidates: [],
    tech: [],
    language: null,
  };

  if (websiteUrl) {
    const scraper = new WebsiteScraper(websiteUrl);
    websiteData = scraper.scrape();
    scraper.saveRawHTML(path.join(discoveryDir, 'raw-homepage.html'));
  } else {
    log('⏭️', 'Pulando scraping (nenhum site disponivel)');
  }

  console.log('');

  // =========================================================================
  // STEP 3: Social Media Analysis
  // =========================================================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' FASE 3: Redes Sociais');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const socialScraper = new SocialMediaScraper();
  const instagramData = socialScraper.scrapeInstagram(instagramHandle);
  const youtubeData = socialScraper.scrapeYouTube(youtubeHandle);
  const linkedinData = socialScraper.scrapeLinkedIn(linkedinUrl);

  console.log('');

  // =========================================================================
  // STEP 4: Local Files Analysis
  // =========================================================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' FASE 4: Arquivos Locais');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const fileAnalyzer = new LocalFilesAnalyzer(projectDir);
  const localFiles = fileAnalyzer.analyze();

  console.log('');

  // =========================================================================
  // STEP 5: Build Company Profile
  // =========================================================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' FASE 5: Gerando Perfil da Empresa');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Detect sector
  const sector = args.sector || detectSector(args.companyName, websiteData, searchResults);
  log('🏷️', `Setor detectado: ${sector}`);

  // Merge logo candidates
  const allLogos = [
    ...websiteData.logo_candidates,
    ...localFiles.logoCandiates,
  ];

  // Build the profile
  const profile = {
    project_id: args.projectId,
    company: {
      name: args.companyName,
      sector: sector,
      description: websiteData.meta_description || 'manual_input_needed',
      location: 'manual_input_needed',
    },
    current_site: {
      url: websiteData.url || null,
      title: websiteData.title || null,
      meta_description: websiteData.meta_description || null,
      language: websiteData.language || null,
      colors: websiteData.colors || [],
      fonts: websiteData.fonts || [],
      sections: websiteData.sections || [],
      ctas: websiteData.ctas || [],
      nav_items: websiteData.nav_items || [],
      tech: websiteData.tech || [],
      og_image: websiteData.og_image || null,
      favicon: websiteData.favicon || null,
      screenshots: [],
    },
    social_media: {
      instagram: instagramData,
      youtube: youtubeData,
      linkedin: linkedinData,
    },
    brand_assets: {
      logo_candidates: [...new Set(allLogos)],
      colors_detected: websiteData.colors?.slice(0, 10) || [],
      fonts_detected: websiteData.fonts || [],
    },
    materials: localFiles.materials,
    web_search: {
      performed: searchResults.searchPerformed,
      website_found: !!searchResults.website,
      social_profiles_found: Object.keys(searchResults.socialProfiles),
      mentions: searchResults.mentions.slice(0, 10),
    },
    data_completeness: {},
    missing_data: [],
    generated_at: timestamp(),
    agent: 'NEXUS Discovery Agent',
    agent_version: '1.0.0',
  };

  // Calculate completeness
  const completeness = calculateCompleteness(profile);
  profile.data_completeness = {
    website: completeness.website,
    social: completeness.social,
    brand: completeness.brand,
    score: completeness.score,
  };
  profile.missing_data = completeness.missing;

  // =========================================================================
  // STEP 6: Save Outputs
  // =========================================================================
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' FASE 6: Salvando Resultados');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Save JSON profile
  const jsonPath = path.join(projectDir, 'company-profile.json');
  fs.writeFileSync(jsonPath, JSON.stringify(profile, null, 2), 'utf-8');
  log('💾', `Perfil JSON: ${jsonPath}`);

  // Also save in discovery dir
  const jsonPathDiscovery = path.join(discoveryDir, 'company-profile.json');
  fs.writeFileSync(jsonPathDiscovery, JSON.stringify(profile, null, 2), 'utf-8');

  // Save Markdown report
  const report = generateMarkdownReport(profile);
  const mdPath = path.join(projectDir, 'discovery-report.md');
  fs.writeFileSync(mdPath, report, 'utf-8');
  log('📝', `Relatorio MD: ${mdPath}`);

  const mdPathDiscovery = path.join(discoveryDir, 'discovery-report.md');
  fs.writeFileSync(mdPathDiscovery, report, 'utf-8');

  // Save search results for reference
  const searchPath = path.join(discoveryDir, 'search-results.json');
  fs.writeFileSync(searchPath, JSON.stringify(searchResults, null, 2), 'utf-8');

  // =========================================================================
  // SUMMARY
  // =========================================================================
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║           DISCOVERY COMPLETO!                ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
  log('🏢', `Empresa: ${profile.company.name}`);
  log('🏷️', `Setor: ${profile.company.sector}`);
  log('🌐', `Site: ${profile.current_site.url || 'N/A'}`);
  log('🎨', `Cores: ${profile.brand_assets.colors_detected.length}`);
  log('🔤', `Fontes: ${profile.brand_assets.fonts_detected.length}`);
  log('🔧', `Tecnologias: ${(profile.current_site.tech || []).join(', ') || 'N/A'}`);
  log('📊', `Completude: ${profile.data_completeness.score}%`);
  log('⏱️', `Tempo: ${elapsed}s`);
  console.log('');
  log('📂', `Arquivos salvos em: ${projectDir}`);
  console.log('');

  if (profile.missing_data.length > 0) {
    log('⚠️', 'Dados faltantes para o briefing:');
    profile.missing_data.slice(0, 8).forEach(m => console.log(`   - ${m}`));
    if (profile.missing_data.length > 8) {
      console.log(`   ... e mais ${profile.missing_data.length - 8} itens`);
    }
    console.log('');
  }
}

main().catch(err => {
  console.error('❌ Erro fatal:', err.message);
  console.error(err.stack);
  process.exit(1);
});
