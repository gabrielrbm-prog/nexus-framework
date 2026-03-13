#!/usr/bin/env node

/*
 * 🖼️ NEXUS IMAGE AGENT
 * Gera imagens únicas e contextuais baseadas no Context DNA
 * Input: Context DNA + Image requirements
 * Output: Hero images + Product mockups + Lifestyle imagery
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

class NexusImageAgent {
  constructor() {
    this.name = "NEXUS Image Agent";
    this.version = "1.0.0";
    this.capabilities = [
      "DALL-E 3 Integration",
      "Context-Aware Prompting", 
      "Brand Consistency",
      "Multi-Format Generation",
      "Web Optimization",
      "Asset Organization"
    ];
    
    // Configurações de API
    this.dalleApiKey = process.env.OPENAI_API_KEY;
    this.dalleUrl = 'https://api.openai.com/v1/images/generations';
  }

  /**
   * Processa Context DNA e gera todas as imagens necessárias
   */
  async processContextDNA(contextDNAPath) {
    console.log(`🖼️ ${this.name} processando Context DNA...`);
    
    // Lê o Context DNA
    const contextDNA = JSON.parse(fs.readFileSync(contextDNAPath, 'utf8'));
    
    // Analisa requisitos de imagem baseado no contexto
    const imageRequirements = this.analyzeImageRequirements(contextDNA);
    
    // Gera prompts contextuais
    const imagePrompts = this.generateContextualPrompts(contextDNA, imageRequirements);
    
    // Gera as imagens
    const generatedImages = await this.generateImages(imagePrompts);
    
    // Organiza os resultados
    const imageAssets = this.organizeImageAssets(generatedImages, contextDNA);
    
    return imageAssets;
  }

  /**
   * Analisa o Context DNA para definir que tipos de imagens gerar
   */
  analyzeImageRequirements(contextDNA) {
    const businessType = contextDNA.project.businessType;
    const audience = contextDNA.audience.primaryAge;
    const visual = contextDNA.visual;
    
    // Mapeia tipos de imagem por business type
    const imageTypeMap = {
      'fintech': {
        hero: ['professional_trader', 'charts_success', 'modern_office'],
        product: ['dashboard_mockup', 'mobile_app', 'trading_interface'],
        lifestyle: ['young_professional', 'success_story', 'learning_environment'],
        trust: ['certificates', 'team_photo', 'success_metrics']
      },
      'ecommerce': {
        hero: ['product_showcase', 'shopping_experience', 'lifestyle_product'],
        product: ['product_grid', 'checkout_process', 'mobile_shopping'],
        lifestyle: ['customer_using', 'unboxing_experience', 'social_proof'],
        trust: ['customer_reviews', 'secure_payment', 'shipping_fast']
      },
      'saas': {
        hero: ['team_collaboration', 'productivity_boost', 'workflow_improvement'],
        product: ['dashboard_interface', 'mobile_responsive', 'integration_diagram'],
        lifestyle: ['remote_work', 'efficient_workflow', 'team_success'],
        trust: ['enterprise_logos', 'security_badges', 'uptime_stats']
      }
    };

    const requirements = imageTypeMap[businessType] || imageTypeMap['saas'];
    
    return {
      businessType,
      audience,
      visual,
      requiredTypes: requirements,
      totalImages: this.calculateTotalImages(requirements),
      priority: this.definePriority(businessType)
    };
  }

  /**
   * Gera prompts contextuais para cada tipo de imagem
   */
  generateContextualPrompts(contextDNA, requirements) {
    const brand = contextDNA.brand;
    const audience = contextDNA.audience;
    const visual = contextDNA.visual;
    
    const baseStyle = this.createBaseStyle(visual, brand);
    const audienceContext = this.createAudienceContext(audience);
    
    const prompts = [];
    
    // Gera prompts para cada categoria
    for (const [category, imageTypes] of Object.entries(requirements.requiredTypes)) {
      for (const imageType of imageTypes) {
        const prompt = this.createSpecificPrompt(
          imageType, 
          category, 
          baseStyle, 
          audienceContext, 
          contextDNA
        );
        
        prompts.push({
          id: `${category}_${imageType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          category,
          type: imageType,
          prompt: prompt.text,
          style: prompt.style,
          size: prompt.size,
          quality: "hd"
        });
      }
    }
    
    return prompts;
  }

  /**
   * Cria estilo base baseado na direção visual
   */
  createBaseStyle(visual, brand) {
    const colorMap = {
      'trust_blue': 'professional blue color palette, navy and light blue accents',
      'converting_orange': 'energetic orange and warm color palette',
      'productive_purple': 'modern purple and violet color scheme'
    };

    const typographyMap = {
      'modern_sans': 'clean modern sans-serif typography, minimalist text',
      'friendly_rounded': 'friendly rounded fonts, approachable typography',
      'tech_geometric': 'geometric technical fonts, structured layout'
    };

    const layoutMap = {
      'clean_minimal': 'minimalist clean layout, lots of white space',
      'grid_product': 'organized grid layout, structured composition',
      'dashboard_focused': 'dashboard-style layout, data visualization'
    };

    return {
      colors: colorMap[visual.colorPsychology] || colorMap['trust_blue'],
      typography: typographyMap[visual.typography] || typographyMap['modern_sans'],
      layout: layoutMap[visual.layout] || layoutMap['clean_minimal'],
      mood: this.getBrandMood(brand)
    };
  }

  /**
   * Cria contexto de audiência para os prompts
   */
  createAudienceContext(audience) {
    const ageMap = {
      'gen_z': 'young Gen Z person, 18-24 years old, casual modern style',
      'millennial': 'millennial professional, 25-35 years old, business casual attire',
      'gen_x': 'experienced professional, 35-50 years old, corporate style',
      'boomer': 'mature business person, 50+ years old, formal professional attire'
    };

    return {
      person: ageMap[audience.primaryAge] || ageMap['millennial'],
      environment: this.getEnvironmentContext(audience),
      technology: this.getTechContext(audience.digitalBehavior)
    };
  }

  /**
   * Cria prompt específico para cada tipo de imagem
   */
  createSpecificPrompt(imageType, category, baseStyle, audienceContext, contextDNA) {
    const businessType = contextDNA.project.businessType;
    const brand = contextDNA.brand;
    
    // Templates específicos por tipo
    const promptTemplates = {
      // FINTECH / TRADING
      professional_trader: {
        text: `Professional ${audienceContext.person} working as a trader, analyzing financial charts on multiple monitors, modern trading desk setup, successful and focused expression, ${baseStyle.colors}, ${baseStyle.layout}, high-quality professional photography, natural lighting, realistic style`,
        style: "photorealistic",
        size: "1792x1024"
      },
      charts_success: {
        text: `Clean modern financial dashboard showing positive trading results, green profit charts, ${baseStyle.colors}, professional interface design, ${baseStyle.typography}, success metrics visible, ${baseStyle.layout}, ui/ux design style`,
        style: "digital art",
        size: "1792x1024"
      },
      trading_interface: {
        text: `Modern trading platform interface, ${baseStyle.colors}, ${baseStyle.typography}, clean dashboard design, charts and graphs, professional layout, ${baseStyle.layout}, trading tools visible, high-quality ui design`,
        style: "digital art",
        size: "1024x1792"
      },
      dashboard_mockup: {
        text: `Modern trading education dashboard interface, ${baseStyle.colors}, clean design, progress tracking, course modules, ${baseStyle.typography}, ${baseStyle.layout}, educational platform ui, professional design`,
        style: "digital art",
        size: "1792x1024"
      },
      young_professional: {
        text: `${audienceContext.person} learning trading in a modern educational environment, focused on laptop screen showing trading charts, bright modern room, successful and motivated expression, ${baseStyle.colors}, natural lighting, professional photography`,
        style: "photorealistic",
        size: "1024x1792"
      },
      success_story: {
        text: `${audienceContext.person} celebrating trading success, looking at profitable charts, modern office or home office, confident expression, ${baseStyle.colors}, professional photography, inspiring mood, ${baseStyle.mood}`,
        style: "photorealistic",
        size: "1792x1024"
      },
      learning_environment: {
        text: `Modern online trading education setup, ${audienceContext.person} attending virtual trading class, multiple monitors showing charts and educational content, ${baseStyle.colors}, professional learning environment, ${baseStyle.layout}`,
        style: "photorealistic",
        size: "1792x1024"
      },

      // ECOMMERCE
      product_showcase: {
        text: `Beautiful product display, ${baseStyle.colors}, ${baseStyle.layout}, professional product photography, clean background, attractive presentation, high-quality commercial photography`,
        style: "photorealistic",
        size: "1024x1024"
      },

      // SAAS
      team_collaboration: {
        text: `Modern team working together with laptops and screens, ${audienceContext.person}, collaborative environment, ${baseStyle.colors}, ${baseStyle.layout}, professional photography, productive atmosphere`,
        style: "photorealistic",
        size: "1792x1024"
      }
    };

    const template = promptTemplates[imageType];
    
    if (!template) {
      // Fallback genérico
      return {
        text: `Professional ${businessType} related image, ${audienceContext.person}, ${baseStyle.colors}, ${baseStyle.layout}, high-quality photography`,
        style: "photorealistic",
        size: "1792x1024"
      };
    }

    // Adiciona contexto de brand mood se disponível
    if (baseStyle.mood) {
      template.text += `, ${baseStyle.mood}`;
    }

    return template;
  }

  /**
   * Gera todas as imagens usando DALL-E 3
   */
  async generateImages(prompts) {
    console.log(`🎨 Gerando ${prompts.length} imagens...`);
    
    const generatedImages = [];
    
    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];
      console.log(`📷 Gerando imagem ${i + 1}/${prompts.length}: ${prompt.category}_${prompt.type}`);
      
      try {
        const imageData = await this.callDalleAPI(prompt);
        
        if (imageData && imageData.url) {
          // Download da imagem
          const imageBuffer = await this.downloadImage(imageData.url);
          
          generatedImages.push({
            ...prompt,
            url: imageData.url,
            buffer: imageBuffer,
            filename: `${prompt.id}.png`,
            generated: new Date().toISOString()
          });
          
          console.log(`✅ Imagem gerada: ${prompt.category}_${prompt.type}`);
        }
        
        // Rate limiting - pausa entre requests
        await this.sleep(2000);
        
      } catch (error) {
        console.error(`❌ Erro ao gerar imagem ${prompt.category}_${prompt.type}:`, error.message);
        
        // Gera placeholder em caso de erro
        generatedImages.push({
          ...prompt,
          error: error.message,
          placeholder: true,
          filename: `placeholder_${prompt.id}.png`
        });
      }
    }
    
    return generatedImages;
  }

  /**
   * Chama a API do DALL-E 3
   */
  async callDalleAPI(prompt) {
    if (!this.dalleApiKey) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    const requestBody = {
      model: "dall-e-3",
      prompt: prompt.prompt,
      n: 1,
      size: prompt.size || "1792x1024",
      quality: prompt.quality || "hd",
      style: prompt.style === "photorealistic" ? "natural" : "vivid"
    };

    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(requestBody);
      
      const options = {
        hostname: 'api.openai.com',
        port: 443,
        path: '/v1/images/generations',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.dalleApiKey}`,
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            
            if (res.statusCode === 200 && response.data && response.data[0]) {
              resolve({
                url: response.data[0].url,
                revised_prompt: response.data[0].revised_prompt
              });
            } else {
              reject(new Error(`API Error: ${response.error?.message || 'Unknown error'}`));
            }
          } catch (error) {
            reject(new Error(`Parse Error: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Request Error: ${error.message}`));
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Download de imagem da URL
   */
  async downloadImage(url) {
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        const data = [];
        
        res.on('data', (chunk) => {
          data.push(chunk);
        });
        
        res.on('end', () => {
          resolve(Buffer.concat(data));
        });
      }).on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Organiza e salva as imagens geradas
   */
  organizeImageAssets(generatedImages, contextDNA) {
    const filePath = contextDNA.filePath || contextDNA._sourcePath || '';
    const projectPath = filePath ? path.dirname(path.dirname(filePath)) : path.join(process.cwd(), 'projects', (contextDNA.project?.name || 'default'));
    const assetsPath = path.join(projectPath, 'assets', 'images');
    
    // Cria diretório de assets
    if (!fs.existsSync(assetsPath)) {
      fs.mkdirSync(assetsPath, { recursive: true });
    }

    const organizedAssets = {
      hero: [],
      product: [],
      lifestyle: [],
      trust: [],
      generated: new Date().toISOString(),
      total: generatedImages.length,
      successful: 0,
      errors: 0
    };

    // Salva cada imagem na categoria correta
    for (const image of generatedImages) {
      const categoryPath = path.join(assetsPath, image.category);
      
      if (!fs.existsSync(categoryPath)) {
        fs.mkdirSync(categoryPath, { recursive: true });
      }

      const filePath = path.join(categoryPath, image.filename);
      
      if (image.buffer && !image.placeholder) {
        // Salva a imagem
        fs.writeFileSync(filePath, image.buffer);
        
        // Adiciona à categoria
        organizedAssets[image.category].push({
          id: image.id,
          type: image.type,
          filename: image.filename,
          path: filePath,
          url: image.url,
          prompt: image.prompt,
          size: image.size,
          generated: image.generated
        });
        
        organizedAssets.successful++;
        
      } else {
        // Erro ou placeholder
        organizedAssets.errors++;
        console.log(`⚠️ Imagem não salva: ${image.category}_${image.type} - ${image.error || 'Placeholder'}`);
      }
    }

    // Salva manifesto das imagens
    const manifestPath = path.join(assetsPath, 'image-manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(organizedAssets, null, 2));
    
    console.log(`💾 Assets salvos em: ${assetsPath}`);
    console.log(`📋 Manifesto salvo: ${manifestPath}`);
    
    return organizedAssets;
  }

  // Métodos auxiliares
  calculateTotalImages(requirements) {
    return Object.values(requirements).reduce((total, types) => total + types.length, 0);
  }

  definePriority(businessType) {
    const priorityMap = {
      'fintech': ['hero', 'trust', 'product', 'lifestyle'],
      'ecommerce': ['product', 'hero', 'lifestyle', 'trust'],
      'saas': ['product', 'hero', 'lifestyle', 'trust']
    };
    return priorityMap[businessType] || priorityMap['saas'];
  }

  getBrandMood(brand) {
    const moodMap = {
      'professional_confident': 'professional confident atmosphere',
      'friendly_approachable': 'warm friendly welcoming mood',
      'cutting_edge_smart': 'innovative cutting-edge tech mood',
      'balanced_trustworthy': 'trustworthy reliable professional mood'
    };
    return moodMap[brand.voiceTone] || moodMap['balanced_trustworthy'];
  }

  getEnvironmentContext(audience) {
    const envMap = {
      'gen_z': 'modern casual environment, trendy workspace',
      'millennial': 'professional modern office, co-working space',
      'gen_x': 'corporate office environment, professional setting',
      'boomer': 'traditional office, formal business environment'
    };
    return envMap[audience.primaryAge] || envMap['millennial'];
  }

  getTechContext(digitalBehavior) {
    const techMap = {
      'mobile_first_short_attention': 'mobile devices prominent, multiple screens',
      'multi_device_research_heavy': 'laptop and mobile setup, multi-screen',
      'desktop_focused_thorough': 'desktop computer setup, professional monitors',
      'traditional_channels_preferred': 'simple tech setup, traditional interface'
    };
    return techMap[digitalBehavior] || techMap['multi_device_research_heavy'];
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Gera relatório de imagens criadas
   */
  generateImageReport(imageAssets, contextDNA) {
    const report = `# 🖼️ NEXUS Image Assets - Relatório

## 📊 **Resumo de Geração**
- **Total de Imagens:** ${imageAssets.total}
- **Sucessos:** ${imageAssets.successful}
- **Erros:** ${imageAssets.errors}
- **Taxa de Sucesso:** ${Math.round((imageAssets.successful / imageAssets.total) * 100)}%
- **Gerado em:** ${imageAssets.generated}

## 🎯 **Projeto Context**
- **Business Type:** ${contextDNA.project.businessType}
- **Target Audience:** ${contextDNA.audience.primaryAge}
- **Visual Style:** ${contextDNA.visual.colorPsychology}
- **Brand Mood:** ${contextDNA.brand.voiceTone}

## 📷 **Assets por Categoria**

### 🦸 Hero Images (${imageAssets.hero.length})
${imageAssets.hero.map(img => `- **${img.type}**: ${img.filename}`).join('\n')}

### 📱 Product Images (${imageAssets.product.length})
${imageAssets.product.map(img => `- **${img.type}**: ${img.filename}`).join('\n')}

### 🌟 Lifestyle Images (${imageAssets.lifestyle.length})
${imageAssets.lifestyle.map(img => `- **${img.type}**: ${img.filename}`).join('\n')}

### 🛡️ Trust Images (${imageAssets.trust.length})
${imageAssets.trust.map(img => `- **${img.type}**: ${img.filename}`).join('\n')}

## 🎨 **Prompts Utilizados**

${Object.values(imageAssets).flat()
  .filter(img => img.prompt)
  .map(img => `### ${img.type}
**Prompt:** ${img.prompt}
**Size:** ${img.size}
**File:** ${img.filename}
---`)
  .join('\n')}

## 🚀 **Próximos Passos**
1. Review das imagens geradas
2. Otimização para web (compressão)
3. Criação de variações se necessário
4. Integração com Design Agent
5. Implementação no Code Agent

---
*Gerado por ${this.name} em ${new Date().toISOString()}*
`;

    return report;
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🖼️ NEXUS Image Agent v1.0.0

Uso:
  node nexus-image-agent.js <context-dna-path>

Exemplo:
  node nexus-image-agent.js ../projects/etf-landing/context-dna.json
    `);
    process.exit(1);
  }

  const contextDNAPath = args[0];
  
  // Verifica se o arquivo existe
  if (!fs.existsSync(contextDNAPath)) {
    console.error(`❌ Arquivo não encontrado: ${contextDNAPath}`);
    process.exit(1);
  }
  
  const agent = new NexusImageAgent();
  
  console.log('🚀 Iniciando geração de imagens...');
  console.log(`📄 Context DNA: ${contextDNAPath}`);
  console.log('');

  try {
    const imageAssets = await agent.processContextDNA(contextDNAPath);
    
    // Gera relatório
    const contextDNA = JSON.parse(fs.readFileSync(contextDNAPath, 'utf8'));
    const report = agent.generateImageReport(imageAssets, contextDNA);
    
    const reportPath = path.join(path.dirname(contextDNAPath), 'image-report.md');
    fs.writeFileSync(reportPath, report);
    
    console.log('');
    console.log('✅ Geração de imagens concluída!');
    console.log('📊 Estatísticas:');
    console.log(`   - Total: ${imageAssets.total} imagens`);
    console.log(`   - Sucessos: ${imageAssets.successful}`);
    console.log(`   - Erros: ${imageAssets.errors}`);
    console.log(`   - Taxa de sucesso: ${Math.round((imageAssets.successful / imageAssets.total) * 100)}%`);
    console.log('');
    console.log('📁 Arquivos gerados:');
    console.log(`   - Assets: ${path.dirname(contextDNAPath)}/assets/images/`);
    console.log(`   - Relatório: ${reportPath}`);
    console.log('');
    console.log('🎯 Próximo passo: Use as imagens com Design Agent ou Code Agent');
    
  } catch (error) {
    console.error('❌ Erro ao gerar imagens:', error.message);
    process.exit(1);
  }
}

// Executa se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = NexusImageAgent;