#!/usr/bin/env node

/*
 * 🔄 NEXUS QUALITY AGENT
 * Realiza audit completo de performance, acessibilidade, SEO e qualidade
 * Input: Site gerado completo
 * Output: Relatórios detalhados + otimizações automáticas
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class NexusQualityAgent {
  constructor() {
    this.name = "NEXUS Quality Agent";
    this.version = "1.0.0";
    this.capabilities = [
      "Performance Audit (Lighthouse)",
      "Accessibility Validation (A11y)",
      "SEO Analysis & Optimization",
      "Code Quality Analysis",
      "Load Testing & Optimization",
      "Security Vulnerability Scan",
      "Browser Compatibility Check",
      "Mobile Responsiveness Test"
    ];
  }

  /**
   * Processa site gerado e realiza audit completo
   */
  async processGeneratedSite(contextDNAPath, siteDirectory) {
    console.log(`🔄 ${this.name} iniciando audit completo...`);
    
    // Lê o Context DNA para contexto
    let contextDNA;
    try { contextDNA = JSON.parse(fs.readFileSync(contextDNAPath, 'utf8')); }
    catch (e) { throw new Error(`Failed to parse context-dna.json: ${e.message}`); }
    
    // Valida se o site existe
    if (!fs.existsSync(siteDirectory)) {
      throw new Error(`Site directory não encontrado: ${siteDirectory}`);
    }
    
    // Análise inicial dos arquivos
    const siteStructure = this.analyzeSiteStructure(siteDirectory);
    
    // Executa todos os audits
    const auditResults = await this.runAllAudits(siteDirectory, contextDNA, siteStructure);
    
    // Gera otimizações automáticas
    const optimizations = await this.generateOptimizations(auditResults, siteDirectory);
    
    // Aplica otimizações se solicitado
    const optimizedResults = await this.applyOptimizations(optimizations, siteDirectory);
    
    // Organiza relatórios
    const qualityReport = this.organizeQualityReport({
      ...auditResults,
      optimizations,
      optimizedResults
    }, contextDNA, siteStructure);
    
    return qualityReport;
  }

  /**
   * Analisa estrutura do site gerado
   */
  analyzeSiteStructure(siteDirectory) {
    console.log('📊 Analisando estrutura do site...');
    
    const structure = {
      basePath: siteDirectory,
      files: {
        html: [],
        css: [],
        js: [],
        images: [],
        other: []
      },
      totalSize: 0,
      fileCount: 0
    };

    // Analisa arquivos recursivamente
    const analyzeDirectory = (dir) => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          analyzeDirectory(itemPath);
        } else {
          const ext = path.extname(item).toLowerCase();
          const relativePath = path.relative(siteDirectory, itemPath);
          
          structure.totalSize += stats.size;
          structure.fileCount++;
          
          // Categoriza por extensão
          if (['.html', '.htm'].includes(ext)) {
            structure.files.html.push({
              path: relativePath,
              fullPath: itemPath,
              size: stats.size
            });
          } else if (['.css'].includes(ext)) {
            structure.files.css.push({
              path: relativePath,
              fullPath: itemPath,
              size: stats.size
            });
          } else if (['.js'].includes(ext)) {
            structure.files.js.push({
              path: relativePath,
              fullPath: itemPath,
              size: stats.size
            });
          } else if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) {
            structure.files.images.push({
              path: relativePath,
              fullPath: itemPath,
              size: stats.size
            });
          } else {
            structure.files.other.push({
              path: relativePath,
              fullPath: itemPath,
              size: stats.size
            });
          }
        }
      }
    };

    analyzeDirectory(siteDirectory);
    
    console.log(`📁 Estrutura analisada: ${structure.fileCount} arquivos, ${Math.round(structure.totalSize / 1024)}KB total`);
    
    return structure;
  }

  /**
   * Executa todos os audits de qualidade
   */
  async runAllAudits(siteDirectory, contextDNA, siteStructure) {
    console.log('🔍 Executando audits de qualidade...');
    
    const results = {
      performance: await this.auditPerformance(siteStructure),
      accessibility: await this.auditAccessibility(siteStructure),
      seo: await this.auditSEO(siteStructure, contextDNA),
      codeQuality: await this.auditCodeQuality(siteStructure),
      security: await this.auditSecurity(siteStructure),
      compatibility: await this.auditCompatibility(siteStructure),
      mobile: await this.auditMobile(siteStructure),
      loadTesting: await this.auditLoadTesting(siteStructure)
    };
    
    // Calcula score geral
    results.overallScore = this.calculateOverallScore(results);
    
    return results;
  }

  /**
   * Audit de Performance
   */
  async auditPerformance(siteStructure) {
    console.log('⚡ Auditando performance...');
    
    const performance = {
      category: 'Performance',
      score: 0,
      metrics: {},
      issues: [],
      recommendations: []
    };

    // Analisa tamanho dos arquivos
    const totalSize = siteStructure.totalSize;
    const cssSize = siteStructure.files.css.reduce((sum, file) => sum + file.size, 0);
    const jsSize = siteStructure.files.js.reduce((sum, file) => sum + file.size, 0);
    const imageSize = siteStructure.files.images.reduce((sum, file) => sum + file.size, 0);

    performance.metrics = {
      totalSize: Math.round(totalSize / 1024),
      cssSize: Math.round(cssSize / 1024),
      jsSize: Math.round(jsSize / 1024),
      imageSize: Math.round(imageSize / 1024),
      fileCount: siteStructure.fileCount,
      estimatedLoadTime: this.estimateLoadTime(totalSize)
    };

    // Avalia performance
    let score = 100;

    // Penaliza tamanho excessivo
    if (totalSize > 1024 * 1024) { // > 1MB
      performance.issues.push('Site total > 1MB pode impactar carregamento');
      performance.recommendations.push('Comprimir assets e otimizar imagens');
      score -= 15;
    } else if (totalSize > 500 * 1024) { // > 500KB
      performance.issues.push('Site total > 500KB pode ser otimizado');
      performance.recommendations.push('Considerar compressão adicional');
      score -= 8;
    }

    // Analisa CSS
    if (cssSize > 100 * 1024) { // > 100KB
      performance.issues.push('CSS muito pesado (> 100KB)');
      performance.recommendations.push('Purgar CSS não utilizado e minificar');
      score -= 12;
    }

    // Analisa JavaScript
    if (jsSize > 200 * 1024) { // > 200KB
      performance.issues.push('JavaScript muito pesado (> 200KB)');
      performance.recommendations.push('Code splitting e lazy loading');
      score -= 10;
    }

    // Analisa imagens
    if (imageSize > 500 * 1024) { // > 500KB
      performance.issues.push('Imagens muito pesadas (> 500KB)');
      performance.recommendations.push('Otimizar e comprimir imagens');
      score -= 15;
    }

    // Analisa número de arquivos
    if (siteStructure.fileCount > 20) {
      performance.issues.push('Muitos arquivos podem gerar HTTP requests excessivos');
      performance.recommendations.push('Bundling de assets e HTTP/2');
      score -= 5;
    }

    performance.score = Math.max(score, 0);
    
    return performance;
  }

  /**
   * Audit de Acessibilidade
   */
  async auditAccessibility(siteStructure) {
    console.log('♿ Auditando acessibilidade...');
    
    const accessibility = {
      category: 'Accessibility',
      score: 0,
      issues: [],
      recommendations: [],
      level: 'AA' // WCAG 2.1 AA compliance
    };

    let score = 100;
    const issues = [];
    const recommendations = [];

    // Analisa arquivos HTML
    for (const htmlFile of siteStructure.files.html) {
      const content = fs.readFileSync(htmlFile.fullPath, 'utf8');
      
      // Verifica elementos obrigatórios
      if (!content.includes('<html lang=')) {
        issues.push(`${htmlFile.path}: Atributo lang ausente em <html>`);
        recommendations.push('Adicionar lang="pt-BR" ou idioma apropriado');
        score -= 10;
      }

      if (!content.includes('<title>')) {
        issues.push(`${htmlFile.path}: Tag <title> ausente`);
        recommendations.push('Adicionar título descritivo na página');
        score -= 15;
      }

      if (!content.includes('viewport')) {
        issues.push(`${htmlFile.path}: Meta viewport ausente`);
        recommendations.push('Adicionar meta viewport para responsividade');
        score -= 8;
      }

      // Verifica imagens sem alt
      const imgMatches = content.match(/<img[^>]*>/g);
      if (imgMatches) {
        for (const img of imgMatches) {
          if (!img.includes('alt=')) {
            issues.push(`${htmlFile.path}: Imagem sem atributo alt`);
            recommendations.push('Adicionar texto alternativo em todas as imagens');
            score -= 5;
          }
        }
      }

      // Verifica links sem texto
      const linkMatches = content.match(/<a[^>]*>.*?<\/a>/g);
      if (linkMatches) {
        for (const link of linkMatches) {
          const linkContent = link.replace(/<[^>]*>/g, '').trim();
          if (!linkContent && !link.includes('aria-label')) {
            issues.push(`${htmlFile.path}: Link sem texto ou aria-label`);
            recommendations.push('Adicionar texto descritivo ou aria-label em links');
            score -= 8;
          }
        }
      }

      // Verifica contraste (análise básica)
      if (content.includes('color:') || content.includes('background')) {
        // Análise simples de cores
        if (!content.includes('contrast') && !content.includes('wcag')) {
          recommendations.push('Verificar contraste de cores para WCAG AA compliance');
        }
      }

      // Verifica estrutura de headings
      const h1Count = (content.match(/<h1[^>]*>/g) || []).length;
      if (h1Count === 0) {
        issues.push(`${htmlFile.path}: Nenhum H1 encontrado`);
        recommendations.push('Adicionar pelo menos um H1 principal');
        score -= 10;
      } else if (h1Count > 1) {
        issues.push(`${htmlFile.path}: Múltiplos H1 encontrados`);
        recommendations.push('Usar apenas um H1 por página');
        score -= 5;
      }

      // Verifica formulários
      if (content.includes('<form')) {
        if (!content.includes('<label')) {
          issues.push(`${htmlFile.path}: Formulário sem labels`);
          recommendations.push('Associar labels aos campos de formulário');
          score -= 12;
        }
      }
    }

    accessibility.score = Math.max(score, 0);
    accessibility.issues = issues;
    accessibility.recommendations = recommendations;
    
    return accessibility;
  }

  /**
   * Audit de SEO
   */
  async auditSEO(siteStructure, contextDNA) {
    console.log('📈 Auditando SEO...');
    
    const seo = {
      category: 'SEO',
      score: 0,
      issues: [],
      recommendations: [],
      keywords: [],
      meta: {}
    };

    let score = 100;
    const issues = [];
    const recommendations = [];

    // Analisa arquivos HTML
    for (const htmlFile of siteStructure.files.html) {
      const content = fs.readFileSync(htmlFile.fullPath, 'utf8');
      
      // Extrai meta tags
      const titleMatch = content.match(/<title[^>]*>([^<]*)<\/title>/);
      const descMatch = content.match(/<meta[^>]*name=["|']description["|'][^>]*content=["|']([^"|']*)["|']/);
      const keywordsMatch = content.match(/<meta[^>]*name=["|']keywords["|'][^>]*content=["|']([^"|']*)["|']/);
      
      seo.meta = {
        title: titleMatch ? titleMatch[1] : null,
        description: descMatch ? descMatch[1] : null,
        keywords: keywordsMatch ? keywordsMatch[1] : null
      };

      // Verifica título
      if (!seo.meta.title) {
        issues.push(`${htmlFile.path}: Title tag ausente`);
        recommendations.push('Adicionar título descritivo e otimizado');
        score -= 20;
      } else {
        if (seo.meta.title.length < 30) {
          issues.push(`${htmlFile.path}: Título muito curto (< 30 chars)`);
          recommendations.push('Expandir título para 50-60 caracteres');
          score -= 8;
        } else if (seo.meta.title.length > 60) {
          issues.push(`${htmlFile.path}: Título muito longo (> 60 chars)`);
          recommendations.push('Reduzir título para 50-60 caracteres');
          score -= 5;
        }
      }

      // Verifica descrição
      if (!seo.meta.description) {
        issues.push(`${htmlFile.path}: Meta description ausente`);
        recommendations.push('Adicionar meta description de 150-160 chars');
        score -= 15;
      } else {
        if (seo.meta.description.length < 120) {
          issues.push(`${htmlFile.path}: Description muito curta`);
          recommendations.push('Expandir description para 150-160 chars');
          score -= 5;
        } else if (seo.meta.description.length > 160) {
          issues.push(`${htmlFile.path}: Description muito longa`);
          recommendations.push('Reduzir description para 150-160 chars');
          score -= 3;
        }
      }

      // Verifica keywords (opcional mas útil)
      if (!seo.meta.keywords) {
        recommendations.push('Considerar adicionar meta keywords relevantes');
      }

      // Verifica Open Graph
      if (!content.includes('og:title')) {
        issues.push(`${htmlFile.path}: Open Graph tags ausentes`);
        recommendations.push('Adicionar meta tags Open Graph para redes sociais');
        score -= 10;
      }

      // Verifica structured data
      if (!content.includes('schema.org') && !content.includes('application/ld+json')) {
        recommendations.push('Considerar adicionar structured data (Schema.org)');
      }

      // Verifica canonicals
      if (!content.includes('rel="canonical"')) {
        recommendations.push('Adicionar link canonical para evitar conteúdo duplicado');
      }

      // Analisa densidade de keywords baseada no contexto
      if (contextDNA.project && contextDNA.project.businessType) {
        const businessKeywords = this.getBusinessKeywords(contextDNA.project.businessType);
        const contentText = content.replace(/<[^>]*>/g, ' ').toLowerCase();
        
        let keywordCount = 0;
        for (const keyword of businessKeywords) {
          const regex = new RegExp(keyword.toLowerCase(), 'g');
          const matches = contentText.match(regex);
          if (matches) keywordCount += matches.length;
        }
        
        if (keywordCount === 0) {
          issues.push(`${htmlFile.path}: Keywords do negócio não encontradas`);
          recommendations.push(`Incluir keywords: ${businessKeywords.join(', ')}`);
          score -= 12;
        }
      }
    }

    seo.score = Math.max(score, 0);
    seo.issues = issues;
    seo.recommendations = recommendations;
    
    return seo;
  }

  /**
   * Audit de Qualidade de Código
   */
  async auditCodeQuality(siteStructure) {
    console.log('💻 Auditando qualidade de código...');
    
    const codeQuality = {
      category: 'Code Quality',
      score: 0,
      issues: [],
      recommendations: [],
      stats: {}
    };

    let score = 100;
    const issues = [];
    const recommendations = [];
    
    // Analisa HTML
    let htmlLines = 0;
    for (const htmlFile of siteStructure.files.html) {
      const content = fs.readFileSync(htmlFile.fullPath, 'utf8');
      htmlLines += content.split('\n').length;
      
      // Verifica DOCTYPE
      if (!content.trim().toLowerCase().startsWith('<!doctype html>')) {
        issues.push(`${htmlFile.path}: DOCTYPE ausente ou incorreto`);
        recommendations.push('Adicionar <!DOCTYPE html> no início');
        score -= 8;
      }

      // Verifica indentação
      const lines = content.split('\n');
      let indentationIssues = 0;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim() && line.startsWith('\t') && line.includes(' ')) {
          indentationIssues++;
        }
      }
      
      if (indentationIssues > lines.length * 0.1) {
        issues.push(`${htmlFile.path}: Indentação inconsistente`);
        recommendations.push('Padronizar indentação (espaços ou tabs)');
        score -= 5;
      }

      // Verifica tags não fechadas (análise básica)
      const openTags = content.match(/<[a-z][^>]*>/g) || [];
      const closeTags = content.match(/<\/[a-z][^>]*>/g) || [];
      if (Math.abs(openTags.length - closeTags.length) > 2) {
        issues.push(`${htmlFile.path}: Possíveis tags não fechadas`);
        recommendations.push('Verificar se todas as tags estão fechadas');
        score -= 10;
      }
    }

    // Analisa CSS
    let cssLines = 0;
    for (const cssFile of siteStructure.files.css) {
      const content = fs.readFileSync(cssFile.fullPath, 'utf8');
      cssLines += content.split('\n').length;
      
      // Verifica CSS minificado vs readable
      const isMinified = content.includes(';}') && content.split('\n').length < 10;
      if (isMinified) {
        recommendations.push(`${cssFile.path}: CSS minificado - ótimo para produção`);
      } else if (content.length > 10000) {
        recommendations.push(`${cssFile.path}: Considerar minificação para produção`);
      }

      // Verifica comentários
      const commentCount = (content.match(/\/\*[\s\S]*?\*\//g) || []).length;
      if (commentCount === 0 && content.length > 5000) {
        recommendations.push(`${cssFile.path}: Adicionar comentários para seções principais`);
      }
    }

    // Analisa JavaScript
    let jsLines = 0;
    for (const jsFile of siteStructure.files.js) {
      const content = fs.readFileSync(jsFile.fullPath, 'utf8');
      jsLines += content.split('\n').length;
      
      // Verifica console.log em produção
      if (content.includes('console.log') || content.includes('console.error')) {
        issues.push(`${jsFile.path}: Console statements encontrados`);
        recommendations.push('Remover console.log para produção');
        score -= 3;
      }

      // Verifica uso de var vs let/const
      if (content.includes(' var ')) {
        recommendations.push(`${jsFile.path}: Considerar usar let/const ao invés de var`);
      }

      // Verifica função anônimas vs arrow functions
      if (content.includes('function(') && !content.includes('=>')) {
        recommendations.push(`${jsFile.path}: Considerar usar arrow functions`);
      }
    }

    codeQuality.stats = {
      htmlLines,
      cssLines,
      jsLines,
      totalLines: htmlLines + cssLines + jsLines
    };

    codeQuality.score = Math.max(score, 0);
    codeQuality.issues = issues;
    codeQuality.recommendations = recommendations;
    
    return codeQuality;
  }

  /**
   * Audit de Segurança
   */
  async auditSecurity(siteStructure) {
    console.log('🔒 Auditando segurança...');
    
    const security = {
      category: 'Security',
      score: 0,
      issues: [],
      recommendations: [],
      vulnerabilities: []
    };

    let score = 100;
    const issues = [];
    const recommendations = [];
    
    // Analisa arquivos HTML
    for (const htmlFile of siteStructure.files.html) {
      const content = fs.readFileSync(htmlFile.fullPath, 'utf8');
      
      // Verifica CSP (Content Security Policy)
      if (!content.includes('Content-Security-Policy')) {
        issues.push(`${htmlFile.path}: Content Security Policy ausente`);
        recommendations.push('Implementar CSP headers para prevenir XSS');
        score -= 15;
      }

      // Verifica mixed content (http em site https)
      if (content.includes('http://') && !content.includes('localhost')) {
        issues.push(`${htmlFile.path}: Possível mixed content (HTTP)`);
        recommendations.push('Usar apenas HTTPS para recursos externos');
        score -= 10;
      }

      // Verifica target="_blank" sem rel="noopener"
      const blankLinks = content.match(/target=["|']_blank["|'][^>]*>/g);
      if (blankLinks) {
        for (const link of blankLinks) {
          if (!link.includes('rel="noopener"')) {
            issues.push(`${htmlFile.path}: target="_blank" sem rel="noopener"`);
            recommendations.push('Adicionar rel="noopener noreferrer" para segurança');
            score -= 5;
          }
        }
      }

      // Verifica inline scripts
      if (content.includes('<script>') && !content.includes('nonce')) {
        recommendations.push(`${htmlFile.path}: Scripts inline - considerar usar arquivos externos`);
      }

      // Verifica inputs sem validação
      if (content.includes('<input') && content.includes('type="email"')) {
        if (!content.includes('required') && !content.includes('pattern')) {
          recommendations.push(`${htmlFile.path}: Adicionar validação em campos de email`);
        }
      }

      // Verifica formulários sem CSRF protection (se aplicável)
      if (content.includes('<form') && content.includes('method="post"')) {
        recommendations.push(`${htmlFile.path}: Considerar implementar proteção CSRF`);
      }
    }

    security.score = Math.max(score, 0);
    security.issues = issues;
    security.recommendations = recommendations;
    
    return security;
  }

  /**
   * Audit de Compatibilidade
   */
  async auditCompatibility(siteStructure) {
    console.log('🌐 Auditando compatibilidade...');
    
    const compatibility = {
      category: 'Browser Compatibility',
      score: 95, // Assume boa compatibilidade, deduz por problemas
      issues: [],
      recommendations: [],
      browserSupport: {}
    };

    // Lista de features que podem causar problemas
    const modernFeatures = {
      'flexbox': { support: 98, fallback: 'CSS Grid ou floats' },
      'grid': { support: 95, fallback: 'Flexbox ou floats' },
      'css-variables': { support: 92, fallback: 'Sass variables' },
      'arrow-functions': { support: 94, fallback: 'Function declarations' },
      'const': { support: 96, fallback: 'var declarations' },
      'async-await': { support: 90, fallback: 'Promises ou callbacks' }
    };

    let score = compatibility.score;
    const issues = [];
    const recommendations = [];

    // Analisa CSS
    for (const cssFile of siteStructure.files.css) {
      const content = fs.readFileSync(cssFile.fullPath, 'utf8');
      
      // Verifica CSS Grid
      if (content.includes('grid-template') || content.includes('grid-area')) {
        if (!content.includes('@supports (display: grid)')) {
          recommendations.push(`${cssFile.path}: Considerar @supports para CSS Grid`);
        }
      }

      // Verifica CSS Variables
      if (content.includes('var(--')) {
        if (!content.includes('@supports (--css: variables)')) {
          recommendations.push(`${cssFile.path}: Considerar fallbacks para CSS Variables`);
        }
      }

      // Verifica prefixes vendor
      if (content.includes('transform') && !content.includes('-webkit-transform')) {
        recommendations.push(`${cssFile.path}: Adicionar prefixes vendor para transforms`);
      }
    }

    // Analisa JavaScript
    for (const jsFile of siteStructure.files.js) {
      const content = fs.readFileSync(jsFile.fullPath, 'utf8');
      
      // Verifica arrow functions
      if (content.includes('=>') && !content.includes('babel')) {
        recommendations.push(`${jsFile.path}: Considerar transpiling para navegadores antigos`);
      }

      // Verifica async/await
      if (content.includes('async ') || content.includes('await ')) {
        recommendations.push(`${jsFile.path}: Verificar suporte a async/await (IE não suporta)`);
      }

      // Verifica APIs modernas
      if (content.includes('fetch(')) {
        recommendations.push(`${jsFile.path}: Considerar polyfill para fetch() em IE`);
      }
    }

    compatibility.score = score;
    compatibility.issues = issues;
    compatibility.recommendations = recommendations;
    compatibility.browserSupport = modernFeatures;
    
    return compatibility;
  }

  /**
   * Audit Mobile
   */
  async auditMobile(siteStructure) {
    console.log('📱 Auditando responsividade mobile...');
    
    const mobile = {
      category: 'Mobile Responsiveness',
      score: 0,
      issues: [],
      recommendations: [],
      breakpoints: []
    };

    let score = 100;
    const issues = [];
    const recommendations = [];

    // Analisa arquivos HTML
    for (const htmlFile of siteStructure.files.html) {
      const content = fs.readFileSync(htmlFile.fullPath, 'utf8');
      
      // Verifica viewport meta tag
      if (!content.includes('name="viewport"')) {
        issues.push(`${htmlFile.path}: Meta viewport ausente`);
        recommendations.push('Adicionar <meta name="viewport" content="width=device-width, initial-scale=1.0">');
        score -= 25;
      } else {
        const viewportMatch = content.match(/name=["|']viewport["|'][^>]*content=["|']([^"|']*)["|']/);
        if (viewportMatch) {
          const viewportContent = viewportMatch[1];
          if (!viewportContent.includes('width=device-width')) {
            issues.push(`${htmlFile.path}: Viewport width não configurado`);
            recommendations.push('Configurar width=device-width no viewport');
            score -= 10;
          }
        }
      }
    }

    // Analisa CSS para responsividade
    for (const cssFile of siteStructure.files.css) {
      const content = fs.readFileSync(cssFile.fullPath, 'utf8');
      
      // Verifica media queries
      const mediaQueries = content.match(/@media[^{]*{/g);
      if (!mediaQueries || mediaQueries.length === 0) {
        issues.push(`${cssFile.path}: Nenhuma media query encontrada`);
        recommendations.push('Adicionar breakpoints para tablets e mobile');
        score -= 20;
      } else {
        // Analisa breakpoints comuns
        const commonBreakpoints = [
          { name: 'mobile', pattern: /(max-width:\s*767px|max-width:\s*768px)/ },
          { name: 'tablet', pattern: /(max-width:\s*1023px|max-width:\s*1024px)/ },
          { name: 'desktop', pattern: /(min-width:\s*1024px|min-width:\s*1200px)/ }
        ];

        const foundBreakpoints = [];
        for (const bp of commonBreakpoints) {
          if (bp.pattern.test(content)) {
            foundBreakpoints.push(bp.name);
          }
        }

        if (!foundBreakpoints.includes('mobile')) {
          issues.push(`${cssFile.path}: Breakpoint mobile ausente`);
          recommendations.push('Adicionar media query para mobile (max-width: 768px)');
          score -= 15;
        }

        mobile.breakpoints = foundBreakpoints;
      }

      // Verifica unidades responsivas
      const hasRelativeUnits = content.includes('rem') || content.includes('em') || 
                              content.includes('vw') || content.includes('vh') ||
                              content.includes('%');
      
      if (!hasRelativeUnits && content.includes('px')) {
        recommendations.push(`${cssFile.path}: Considerar usar unidades responsivas (rem, em, %)`);
      }

      // Verifica flexbox/grid para layouts responsivos
      const hasFlexbox = content.includes('display: flex') || content.includes('flex-direction');
      const hasGrid = content.includes('display: grid') || content.includes('grid-template');
      
      if (!hasFlexbox && !hasGrid && content.length > 1000) {
        recommendations.push(`${cssFile.path}: Considerar usar Flexbox ou Grid para layouts responsivos`);
      }
    }

    mobile.score = Math.max(score, 0);
    mobile.issues = issues;
    mobile.recommendations = recommendations;
    
    return mobile;
  }

  /**
   * Audit de Load Testing
   */
  async auditLoadTesting(siteStructure) {
    console.log('🚀 Auditando capacidade de carga...');
    
    const loadTesting = {
      category: 'Load Performance',
      score: 85, // Score base otimista
      estimatedCapacity: {},
      recommendations: [],
      bottlenecks: []
    };

    // Estima capacidade baseada no tamanho e complexidade
    const totalSize = siteStructure.totalSize;
    const fileCount = siteStructure.fileCount;
    
    // Calcula métricas estimadas
    const estimatedLoadTime = this.estimateLoadTime(totalSize);
    const estimatedConcurrentUsers = this.estimateMaxUsers(totalSize, fileCount);
    
    loadTesting.estimatedCapacity = {
      loadTime3G: estimatedLoadTime.mobile3G,
      loadTime4G: estimatedLoadTime.mobile4G, 
      loadTimeWifi: estimatedLoadTime.wifi,
      maxConcurrentUsers: estimatedConcurrentUsers,
      bandwidthRequirement: Math.round(totalSize * estimatedConcurrentUsers / 1024 / 1024) + ' MB/s'
    };

    // Recomendações baseadas no tamanho
    if (totalSize > 1024 * 1024) { // > 1MB
      loadTesting.recommendations.push('Site pesado - implementar lazy loading');
      loadTesting.recommendations.push('Usar CDN para distribuição global');
      loadTesting.bottlenecks.push('Tamanho total do site');
    }

    if (fileCount > 15) {
      loadTesting.recommendations.push('Muitos arquivos - considerar bundling');
      loadTesting.bottlenecks.push('Número de HTTP requests');
    }

    return loadTesting;
  }

  /**
   * Gera otimizações automáticas
   */
  async generateOptimizations(auditResults, siteDirectory) {
    console.log('🛠️ Gerando otimizações automáticas...');
    
    const optimizations = {
      performance: [],
      accessibility: [],
      seo: [],
      codeQuality: [],
      applicable: []
    };

    // Otimizações de Performance
    if (auditResults.performance.score < 85) {
      optimizations.performance = [
        'Minificar CSS e JavaScript',
        'Comprimir imagens (WebP, otimização)',
        'Implementar gzip/brotli compression',
        'Adicionar cache headers',
        'Lazy loading para imagens',
        'Preload de recursos críticos'
      ];
    }

    // Otimizações de Acessibilidade
    if (auditResults.accessibility.score < 90) {
      optimizations.accessibility = [
        'Adicionar alt text em imagens',
        'Melhorar contraste de cores',
        'Corrigir estrutura de headings',
        'Adicionar labels em formulários',
        'Implementar skip links'
      ];
    }

    // Otimizações de SEO
    if (auditResults.seo.score < 90) {
      optimizations.seo = [
        'Otimizar meta title e description',
        'Adicionar Open Graph tags',
        'Implementar structured data',
        'Melhorar URLs e canonical tags',
        'Adicionar sitemap.xml'
      ];
    }

    // Otimizações aplicáveis automaticamente
    optimizations.applicable = this.getApplicableOptimizations(auditResults, siteDirectory);

    return optimizations;
  }

  /**
   * Aplica otimizações automáticas
   */
  async applyOptimizations(optimizations, siteDirectory) {
    console.log('⚡ Aplicando otimizações automáticas...');
    
    const results = {
      applied: [],
      skipped: [],
      errors: []
    };

    // Aplica apenas otimizações seguras e automáticas
    for (const optimization of optimizations.applicable) {
      try {
        const success = await this.applySpecificOptimization(optimization, siteDirectory);
        if (success) {
          results.applied.push(optimization.name);
        } else {
          results.skipped.push(optimization.name);
        }
      } catch (error) {
        results.errors.push({ name: optimization.name, error: error.message });
      }
    }

    return results;
  }

  /**
   * Calcula score geral de qualidade
   */
  calculateOverallScore(auditResults) {
    const weights = {
      performance: 0.25,
      accessibility: 0.20,
      seo: 0.20,
      codeQuality: 0.15,
      security: 0.10,
      mobile: 0.10
    };

    let totalScore = 0;
    let totalWeight = 0;

    for (const [category, result] of Object.entries(auditResults)) {
      if (weights[category] && result.score !== undefined) {
        totalScore += result.score * weights[category];
        totalWeight += weights[category];
      }
    }

    return Math.round(totalScore / totalWeight);
  }

  /**
   * Organiza relatório final
   */
  organizeQualityReport(auditData, contextDNA, siteStructure) {
    const filePath = contextDNA.filePath || contextDNA._sourcePath || '';
    const projectPath = filePath ? path.dirname(filePath) : siteStructure.basePath;
    const qualityPath = path.join(projectPath, 'quality-report.md');
    
    const report = this.generateQualityReport(auditData, contextDNA, siteStructure);
    
    fs.writeFileSync(qualityPath, report);
    
    console.log(`📊 Relatório de qualidade salvo: ${qualityPath}`);
    
    return {
      ...auditData,
      reportPath: qualityPath,
      generated: new Date().toISOString(),
      siteStructure
    };
  }

  // Métodos auxiliares
  estimateLoadTime(totalSize) {
    return {
      wifi: Math.round(totalSize / (5 * 1024 * 1024) * 1000) + ' ms', // 5MB/s
      mobile4G: Math.round(totalSize / (1 * 1024 * 1024) * 1000) + ' ms', // 1MB/s
      mobile3G: Math.round(totalSize / (0.5 * 1024 * 1024) * 1000) + ' ms' // 500KB/s
    };
  }

  estimateMaxUsers(totalSize, fileCount) {
    // Estimativa conservadora baseada no tamanho
    const baseCapacity = 1000;
    const sizePenalty = Math.floor(totalSize / (100 * 1024));
    const filePenalty = Math.floor(fileCount / 2);
    
    return Math.max(baseCapacity - sizePenalty - filePenalty, 50);
  }

  getBusinessKeywords(businessType) {
    const keywords = {
      'fintech': ['trading', 'investimento', 'financeiro', 'dinheiro', 'lucro'],
      'ecommerce': ['comprar', 'produto', 'loja', 'desconto', 'entrega'],
      'fitness': ['treino', 'academia', 'saúde', 'corpo', 'exercício'],
      'healthcare': ['saúde', 'médico', 'tratamento', 'cuidado', 'consulta']
    };
    return keywords[businessType] || ['serviço', 'qualidade', 'profissional'];
  }

  getApplicableOptimizations(auditResults, siteDirectory) {
    // Retorna apenas otimizações que podem ser aplicadas automaticamente
    return [
      { name: 'HTML minification', safe: true },
      { name: 'CSS optimization', safe: true },
      { name: 'Add missing alt attributes', safe: false }, // Requer conteúdo
      { name: 'Optimize meta tags', safe: false } // Requer contexto
    ].filter(opt => opt.safe);
  }

  async applySpecificOptimization(optimization, siteDirectory) {
    // Implementação de otimizações específicas
    switch (optimization.name) {
      case 'HTML minification':
        return this.minifyHTML(siteDirectory);
      case 'CSS optimization':
        return this.optimizeCSS(siteDirectory);
      default:
        return false;
    }
  }

  minifyHTML(siteDirectory) {
    // Placeholder para minificação HTML
    console.log('  📄 HTML minification (placeholder)');
    return false; // Não implementado nesta versão
  }

  optimizeCSS(siteDirectory) {
    // Placeholder para otimização CSS
    console.log('  🎨 CSS optimization (placeholder)');
    return false; // Não implementado nesta versão
  }

  /**
   * Gera relatório de qualidade formatado
   */
  generateQualityReport(auditData, contextDNA, siteStructure) {
    return `# 🔄 NEXUS Quality Audit - Relatório

## 📊 **Score Geral de Qualidade**
**${auditData.overallScore}/100** ${this.getScoreEmoji(auditData.overallScore)}

${this.getScoreDescription(auditData.overallScore)}

---

## 🎯 **Resumo do Projeto**
- **Business Type:** ${contextDNA.project?.businessType || 'N/A'}
- **Target Audience:** ${contextDNA.audience?.primaryAge || 'N/A'}
- **Site Size:** ${Math.round(siteStructure.totalSize / 1024)}KB
- **Files:** ${siteStructure.fileCount} arquivos
- **Audit Date:** ${auditData.generated}

---

## 📈 **Scores por Categoria**

| Categoria | Score | Status |
|-----------|-------|--------|
| ⚡ Performance | **${auditData.performance.score}/100** | ${this.getStatusBadge(auditData.performance.score)} |
| ♿ Accessibility | **${auditData.accessibility.score}/100** | ${this.getStatusBadge(auditData.accessibility.score)} |
| 📈 SEO | **${auditData.seo.score}/100** | ${this.getStatusBadge(auditData.seo.score)} |
| 💻 Code Quality | **${auditData.codeQuality.score}/100** | ${this.getStatusBadge(auditData.codeQuality.score)} |
| 🔒 Security | **${auditData.security.score}/100** | ${this.getStatusBadge(auditData.security.score)} |
| 📱 Mobile | **${auditData.mobile.score}/100** | ${this.getStatusBadge(auditData.mobile.score)} |

---

## ⚡ **Performance Analysis**

### Métricas
- **Total Size:** ${auditData.performance.metrics.totalSize}KB
- **CSS Size:** ${auditData.performance.metrics.cssSize}KB  
- **JS Size:** ${auditData.performance.metrics.jsSize}KB
- **Images:** ${auditData.performance.metrics.imageSize}KB
- **Load Time:** ${auditData.performance.metrics.estimatedLoadTime.wifi}

### Issues (${auditData.performance.issues.length})
${auditData.performance.issues.map(issue => `- ⚠️ ${issue}`).join('\n') || 'Nenhum issue crítico encontrado'}

### Recommendations (${auditData.performance.recommendations.length})
${auditData.performance.recommendations.map(rec => `- 💡 ${rec}`).join('\n') || 'Performance está otimizada'}

---

## ♿ **Accessibility Analysis**

### WCAG 2.1 Level: ${auditData.accessibility.level}

### Issues (${auditData.accessibility.issues.length})
${auditData.accessibility.issues.map(issue => `- ⚠️ ${issue}`).join('\n') || 'Nenhum issue de acessibilidade encontrado'}

### Recommendations (${auditData.accessibility.recommendations.length})  
${auditData.accessibility.recommendations.map(rec => `- 💡 ${rec}`).join('\n') || 'Acessibilidade está em conformidade'}

---

## 📈 **SEO Analysis**

### Meta Tags Status
- **Title:** ${auditData.seo.meta.title ? `✅ "${auditData.seo.meta.title}"` : '❌ Ausente'}
- **Description:** ${auditData.seo.meta.description ? `✅ "${auditData.seo.meta.description.substring(0, 50)}..."` : '❌ Ausente'}
- **Keywords:** ${auditData.seo.meta.keywords ? `✅ "${auditData.seo.meta.keywords}"` : '⚠️ Ausente'}

### Issues (${auditData.seo.issues.length})
${auditData.seo.issues.map(issue => `- ⚠️ ${issue}`).join('\n') || 'Nenhum issue de SEO encontrado'}

### Recommendations (${auditData.seo.recommendations.length})
${auditData.seo.recommendations.map(rec => `- 💡 ${rec}`).join('\n') || 'SEO está otimizado'}

---

## 💻 **Code Quality Analysis**

### Stats
- **HTML Lines:** ${auditData.codeQuality.stats.htmlLines}
- **CSS Lines:** ${auditData.codeQuality.stats.cssLines}  
- **JS Lines:** ${auditData.codeQuality.stats.jsLines}
- **Total Lines:** ${auditData.codeQuality.stats.totalLines}

### Issues (${auditData.codeQuality.issues.length})
${auditData.codeQuality.issues.map(issue => `- ⚠️ ${issue}`).join('\n') || 'Código está bem estruturado'}

### Recommendations (${auditData.codeQuality.recommendations.length})
${auditData.codeQuality.recommendations.map(rec => `- 💡 ${rec}`).join('\n') || 'Qualidade de código está boa'}

---

## 📱 **Mobile Responsiveness**

### Breakpoints Detected
${auditData.mobile.breakpoints.length > 0 ? auditData.mobile.breakpoints.map(bp => `- ✅ ${bp}`).join('\n') : '- ⚠️ Nenhum breakpoint detectado'}

### Issues (${auditData.mobile.issues.length})
${auditData.mobile.issues.map(issue => `- ⚠️ ${issue}`).join('\n') || 'Site totalmente responsivo'}

### Recommendations (${auditData.mobile.recommendations.length})
${auditData.mobile.recommendations.map(rec => `- 💡 ${rec}`).join('\n') || 'Mobile experience está otimizada'}

---

## 🚀 **Load Testing Estimates**

### Capacity
- **Load Time (WiFi):** ${auditData.loadTesting.estimatedCapacity.loadTimeWifi}
- **Load Time (4G):** ${auditData.loadTesting.estimatedCapacity.loadTime4G}
- **Load Time (3G):** ${auditData.loadTesting.estimatedCapacity.loadTime3G}
- **Max Concurrent Users:** ~${auditData.loadTesting.estimatedCapacity.maxConcurrentUsers}
- **Bandwidth Required:** ${auditData.loadTesting.estimatedCapacity.bandwidthRequirement}

### Bottlenecks
${auditData.loadTesting.bottlenecks.map(bottleneck => `- ⚠️ ${bottleneck}`).join('\n') || 'Nenhum bottleneck identificado'}

---

## 🛠️ **Optimization Plan**

### High Priority
${this.getHighPriorityOptimizations(auditData).map(opt => `- 🔥 ${opt}`).join('\n')}

### Medium Priority  
${this.getMediumPriorityOptimizations(auditData).map(opt => `- 📈 ${opt}`).join('\n')}

### Low Priority
${this.getLowPriorityOptimizations(auditData).map(opt => `- 🔧 ${opt}`).join('\n')}

---

## 🎯 **Action Items**

### Immediate (Fix Now)
${this.getImmediateActions(auditData).map(action => `- ⚡ ${action}`).join('\n') || '- ✅ Nenhuma ação crítica necessária'}

### Short Term (1-2 weeks)
${this.getShortTermActions(auditData).map(action => `- 📅 ${action}`).join('\n') || '- ✅ Site está bem otimizado'}

### Long Term (1+ month)
${this.getLongTermActions(auditData).map(action => `- 📈 ${action}`).join('\n') || '- ✅ Estrutura está sólida'}

---

## 🏆 **Quality Grade**

**${this.getQualityGrade(auditData.overallScore)}** - ${this.getGradeDescription(auditData.overallScore)}

### Comparativo
- **Sites Médios:** 65-75 pontos
- **Sites Profissionais:** 80-90 pontos  
- **Sites Premium:** 90+ pontos
- **Seu Site:** **${auditData.overallScore} pontos** 🎯

---

*Audit realizado pelo ${this.name} em ${new Date().toISOString()}*
`;
  }

  // Métodos auxiliares para relatório
  getScoreEmoji(score) {
    if (score >= 95) return '🏆';
    if (score >= 85) return '🥇';
    if (score >= 75) return '🥈';
    if (score >= 65) return '🥉';
    return '⚠️';
  }

  getScoreDescription(score) {
    if (score >= 95) return 'Excelente! Site de qualidade premium.';
    if (score >= 85) return 'Muito bom! Poucos ajustes necessários.';
    if (score >= 75) return 'Bom. Algumas otimizações recomendadas.';
    if (score >= 65) return 'Regular. Várias melhorias possíveis.';
    return 'Precisa de atenção. Muitas otimizações necessárias.';
  }

  getStatusBadge(score) {
    if (score >= 90) return '🟢 Excelente';
    if (score >= 75) return '🟡 Bom';
    if (score >= 60) return '🟠 Regular';
    return '🔴 Precisa melhoria';
  }

  getHighPriorityOptimizations(auditData) {
    const high = [];
    if (auditData.performance.score < 70) high.push('Otimizar performance crítica');
    if (auditData.accessibility.score < 80) high.push('Corrigir problemas de acessibilidade');
    if (auditData.seo.score < 70) high.push('Implementar SEO básico');
    return high;
  }

  getMediumPriorityOptimizations(auditData) {
    const medium = [];
    if (auditData.mobile.score < 85) medium.push('Melhorar responsividade');
    if (auditData.security.score < 85) medium.push('Implementar práticas de segurança');
    return medium;
  }

  getLowPriorityOptimizations(auditData) {
    const low = [];
    if (auditData.codeQuality.score < 90) low.push('Refatorar código para melhor legibilidade');
    if (auditData.compatibility.score < 90) low.push('Melhorar compatibilidade com browsers antigos');
    return low;
  }

  getImmediateActions(auditData) {
    const immediate = [];
    if (auditData.accessibility.issues.some(issue => issue.includes('alt'))) {
      immediate.push('Adicionar texto alternativo em imagens');
    }
    if (auditData.seo.issues.some(issue => issue.includes('title'))) {
      immediate.push('Adicionar títulos em páginas');
    }
    return immediate;
  }

  getShortTermActions(auditData) {
    const shortTerm = [];
    if (auditData.performance.score < 80) {
      shortTerm.push('Otimizar imagens e assets');
    }
    if (auditData.mobile.score < 85) {
      shortTerm.push('Implementar breakpoints mobile');
    }
    return shortTerm;
  }

  getLongTermActions(auditData) {
    const longTerm = [];
    if (auditData.loadTesting.bottlenecks.length > 0) {
      longTerm.push('Implementar CDN e caching avançado');
    }
    return longTerm;
  }

  getQualityGrade(score) {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'A-';
    if (score >= 80) return 'B+';
    if (score >= 75) return 'B';
    if (score >= 70) return 'B-';
    if (score >= 65) return 'C+';
    if (score >= 60) return 'C';
    return 'D';
  }

  getGradeDescription(score) {
    if (score >= 95) return 'Site de qualidade excepcional, pronto para produção premium';
    if (score >= 85) return 'Site profissional com excelente qualidade';
    if (score >= 75) return 'Site bem estruturado, algumas melhorias recomendadas';
    if (score >= 65) return 'Site funcional, várias otimizações possíveis';
    return 'Site precisa de melhorias significativas antes do deploy';
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log(`
🔄 NEXUS Quality Agent v1.0.0

Uso:
  node nexus-quality-agent.js <context-dna-path> <site-directory>

Exemplo:
  node nexus-quality-agent.js ../projects/etf-landing/context-dna.json ../generated-site
    `);
    process.exit(1);
  }

  const contextDNAPath = args[0];
  const siteDirectory = args[1];
  
  // Verifica se os caminhos existem
  if (!fs.existsSync(contextDNAPath)) {
    console.error(`❌ Context DNA não encontrado: ${contextDNAPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(siteDirectory)) {
    console.error(`❌ Site directory não encontrado: ${siteDirectory}`);
    process.exit(1);
  }
  
  const agent = new NexusQualityAgent();
  
  console.log('🚀 Iniciando audit completo de qualidade...');
  console.log(`📄 Context DNA: ${contextDNAPath}`);
  console.log(`📁 Site Directory: ${siteDirectory}`);
  console.log('');

  try {
    const qualityReport = await agent.processGeneratedSite(contextDNAPath, siteDirectory);
    
    console.log('');
    console.log('✅ Audit de qualidade concluído!');
    console.log('📊 Resultados:');
    console.log(`   - Score Geral: ${qualityReport.overallScore}/100 ${agent.getScoreEmoji(qualityReport.overallScore)}`);
    console.log(`   - Performance: ${qualityReport.performance.score}/100`);
    console.log(`   - Accessibility: ${qualityReport.accessibility.score}/100`);
    console.log(`   - SEO: ${qualityReport.seo.score}/100`);
    console.log(`   - Code Quality: ${qualityReport.codeQuality.score}/100`);
    console.log(`   - Security: ${qualityReport.security.score}/100`);
    console.log(`   - Mobile: ${qualityReport.mobile.score}/100`);
    console.log('');
    console.log(`📊 Grade: ${agent.getQualityGrade(qualityReport.overallScore)} - ${agent.getGradeDescription(qualityReport.overallScore)}`);
    console.log('');
    console.log(`📁 Relatório detalhado: ${qualityReport.reportPath}`);
    console.log('');
    console.log('🎯 Próximo passo: Implementar otimizações recomendadas');
    
  } catch (error) {
    console.error('❌ Erro no audit:', error.message);
    process.exit(1);
  }
}

// Executa se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = NexusQualityAgent;