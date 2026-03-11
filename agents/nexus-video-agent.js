#!/usr/bin/env node

/*
 * 🎬 NEXUS VIDEO AGENT
 * Gera backgrounds cinematográficos únicos baseados no Context DNA
 * Input: Context DNA + Visual direction
 * Output: Vídeos MP4/WebM otimizados para web
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

class NexusVideoAgent {
  constructor() {
    this.name = "NEXUS Video Agent";
    this.version = "1.0.0";
    this.capabilities = [
      "Context-Aware Video Generation",
      "RunwayML Gen-3 Integration", 
      "Pika Labs Integration",
      "Cinematic Background Creation",
      "Web Optimization",
      "Loop Optimization",
      "Multi-Format Export"
    ];
    
    // Configurações de API
    this.runwayApiKey = process.env.RUNWAY_API_KEY;
    this.pikaApiKey = process.env.PIKA_API_KEY;
    this.openaiApiKey = process.env.OPENAI_API_KEY; // Fallback para DALL-E video
  }

  /**
   * Processa Context DNA e gera vídeos contextuais
   */
  async processContextDNA(contextDNAPath) {
    console.log(`🎬 ${this.name} processando Context DNA...`);
    
    // Lê o Context DNA
    const contextDNA = JSON.parse(fs.readFileSync(contextDNAPath, 'utf8'));
    
    // Analisa requisitos de vídeo baseado no contexto
    const videoRequirements = this.analyzeVideoRequirements(contextDNA);
    
    // Gera prompts cinematográficos
    const videoPrompts = this.generateCinematicPrompts(contextDNA, videoRequirements);
    
    // Gera os vídeos (demo mode por enquanto)
    const generatedVideos = await this.generateVideos(videoPrompts);
    
    // Organiza os resultados
    const videoAssets = this.organizeVideoAssets(generatedVideos, contextDNA);
    
    return videoAssets;
  }

  /**
   * Analisa o Context DNA para definir que tipos de vídeos gerar
   */
  analyzeVideoRequirements(contextDNA) {
    const businessType = contextDNA.project.businessType;
    const audience = contextDNA.audience.primaryAge;
    const visual = contextDNA.visual;
    const psychology = contextDNA.psychology;
    
    // Mapeia tipos de vídeo por business type
    const videoTypeMap = {
      'fintech': {
        hero: ['trading_charts_flowing', 'professional_office', 'success_celebration'],
        ambient: ['data_particles', 'geometric_patterns', 'trust_elements'],
        lifestyle: ['trader_working', 'team_collaboration', 'achievement_moments'],
        abstract: ['financial_growth', 'network_connections', 'stability_waves']
      },
      'ecommerce': {
        hero: ['product_showcase', 'shopping_experience', 'lifestyle_moments'],
        ambient: ['color_flow', 'shopping_patterns', 'energy_burst'],
        lifestyle: ['customer_satisfaction', 'unboxing_joy', 'social_moments'],
        abstract: ['conversion_flow', 'growth_animation', 'success_patterns']
      },
      'healthcare': {
        hero: ['caring_hands', 'medical_precision', 'healing_journey'],
        ambient: ['gentle_waves', 'heartbeat_rhythm', 'calm_patterns'],
        lifestyle: ['doctor_patient', 'wellness_journey', 'family_health'],
        abstract: ['healing_light', 'life_flow', 'care_network']
      },
      'saas': {
        hero: ['dashboard_animation', 'data_visualization', 'workflow_optimization'],
        ambient: ['code_patterns', 'network_grid', 'efficiency_flow'],
        lifestyle: ['team_productivity', 'remote_collaboration', 'innovation_moments'],
        abstract: ['system_connections', 'growth_metrics', 'optimization_waves']
      },
      'fitness': {
        hero: ['workout_energy', 'transformation_journey', 'strength_building'],
        ambient: ['energy_waves', 'muscle_patterns', 'vitality_flow'],
        lifestyle: ['gym_atmosphere', 'training_intensity', 'achievement_celebration'],
        abstract: ['power_surge', 'endurance_flow', 'transformation_energy']
      }
    };

    const requirements = videoTypeMap[businessType] || videoTypeMap['saas'];
    
    return {
      businessType,
      audience,
      visual,
      psychology,
      requiredTypes: requirements,
      totalVideos: this.calculateTotalVideos(requirements),
      priority: this.definePriority(businessType),
      duration: this.getOptimalDuration(audience),
      style: this.getCinematicStyle(visual, psychology)
    };
  }

  /**
   * Gera prompts cinematográficos contextuais
   */
  generateCinematicPrompts(contextDNA, requirements) {
    const brand = contextDNA.brand;
    const visual = contextDNA.visual;
    const psychology = contextDNA.psychology;
    
    const baseStyle = this.createCinematicStyle(visual, brand, psychology);
    const moodDirection = this.createMoodDirection(psychology, requirements);
    
    const prompts = [];
    
    // Gera prompts para cada categoria
    for (const [category, videoTypes] of Object.entries(requirements.requiredTypes)) {
      for (const videoType of videoTypes) {
        const prompt = this.createSpecificVideoPrompt(
          videoType, 
          category, 
          baseStyle, 
          moodDirection, 
          contextDNA,
          requirements
        );
        
        prompts.push({
          id: `${category}_${videoType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          category,
          type: videoType,
          prompt: prompt.text,
          style: prompt.style,
          duration: prompt.duration,
          aspectRatio: prompt.aspectRatio,
          fps: prompt.fps,
          quality: "high"
        });
      }
    }
    
    return prompts;
  }

  /**
   * Cria estilo cinematográfico baseado no contexto
   */
  createCinematicStyle(visual, brand, psychology) {
    const colorMap = {
      'trust_blue': 'professional blue lighting, navy and cyan color grading, corporate atmosphere',
      'converting_orange': 'warm orange glow, energetic color palette, dynamic lighting',
      'productive_purple': 'purple and violet lighting, modern color grading, tech atmosphere'
    };

    const moodMap = {
      'trust': 'stable, reliable, professional cinematography',
      'urgency': 'dynamic, fast-paced, high-energy cinematography',
      'value': 'premium, sophisticated, elegant cinematography'
    };

    return {
      colors: colorMap[visual.colorPsychology] || colorMap['trust_blue'],
      mood: moodMap[psychology.primary] || moodMap['trust'],
      brandTone: this.getBrandCinematicTone(brand),
      lighting: this.getLightingStyle(psychology, visual),
      movement: this.getMovementStyle(psychology)
    };
  }

  /**
   * Cria prompt específico para cada tipo de vídeo
   */
  createSpecificVideoPrompt(videoType, category, baseStyle, moodDirection, contextDNA, requirements) {
    const businessType = contextDNA.project.businessType;
    const duration = requirements.duration;
    
    // Templates específicos por tipo e business
    const promptTemplates = {
      // FINTECH
      trading_charts_flowing: {
        text: `Cinematic shot of financial trading charts and data flowing smoothly across multiple monitors, ${baseStyle.colors}, professional office environment, ${baseStyle.mood}, smooth camera movement, depth of field, ${baseStyle.lighting}, seamless loop animation`,
        style: "cinematic",
        duration: duration.hero,
        aspectRatio: "16:9",
        fps: 30
      },
      professional_office: {
        text: `Modern professional trading office environment, ${baseStyle.colors}, glass windows with city view, elegant interior design, ${baseStyle.mood}, slow camera pan, architectural lighting, ${baseStyle.brandTone}`,
        style: "architectural",
        duration: duration.ambient,
        aspectRatio: "16:9", 
        fps: 24
      },
      success_celebration: {
        text: `Professional trader celebrating successful trade, positive emotions, ${baseStyle.colors}, modern office setting, ${baseStyle.mood}, uplifting atmosphere, natural lighting, authentic human moment`,
        style: "lifestyle",
        duration: duration.lifestyle,
        aspectRatio: "16:9",
        fps: 30
      },
      data_particles: {
        text: `Abstract financial data particles flowing in space, ${baseStyle.colors}, geometric patterns, ${baseStyle.mood}, smooth particle animation, depth layers, digital aesthetic, seamless loop`,
        style: "abstract",
        duration: duration.abstract,
        aspectRatio: "16:9",
        fps: 60
      },

      // E-COMMERCE
      product_showcase: {
        text: `Elegant product presentation with rotating display, ${baseStyle.colors}, premium lighting setup, commercial photography style, ${baseStyle.mood}, smooth rotation, luxury feel`,
        style: "commercial",
        duration: duration.hero,
        aspectRatio: "16:9",
        fps: 30
      },
      shopping_experience: {
        text: `Modern shopping experience, customers browsing products, ${baseStyle.colors}, retail environment, ${baseStyle.mood}, lifestyle cinematography, natural interactions`,
        style: "lifestyle",
        duration: duration.lifestyle,
        aspectRatio: "16:9",
        fps: 24
      },

      // FITNESS
      workout_energy: {
        text: `High-energy gym workout scene, dynamic movement, ${baseStyle.colors}, fitness equipment, motivational atmosphere, ${baseStyle.mood}, action cinematography, inspiring energy`,
        style: "action",
        duration: duration.hero,
        aspectRatio: "16:9",
        fps: 30
      },
      transformation_journey: {
        text: `Fitness transformation montage, before and after moments, ${baseStyle.colors}, gym environment, ${baseStyle.mood}, motivational storytelling, progress visualization`,
        style: "montage",
        duration: duration.lifestyle,
        aspectRatio: "16:9",
        fps: 24
      },

      // HEALTHCARE
      caring_hands: {
        text: `Gentle caring hands providing medical care, ${baseStyle.colors}, medical environment, compassionate atmosphere, ${baseStyle.mood}, soft lighting, healing energy`,
        style: "medical",
        duration: duration.lifestyle,
        aspectRatio: "16:9",
        fps: 24
      },
      healing_journey: {
        text: `Patient healing journey, recovery process, ${baseStyle.colors}, medical facility, hope and healing, ${baseStyle.mood}, documentary style, authentic emotions`,
        style: "documentary",
        duration: duration.lifestyle,
        aspectRatio: "16:9",
        fps: 24
      },

      // SAAS
      dashboard_animation: {
        text: `Modern software dashboard with animated data visualization, ${baseStyle.colors}, user interface elements, ${baseStyle.mood}, smooth UI animation, tech aesthetic`,
        style: "ui_animation",
        duration: duration.hero,
        aspectRatio: "16:9",
        fps: 60
      },
      data_visualization: {
        text: `Beautiful data visualization with charts and graphs animating, ${baseStyle.colors}, digital interface, ${baseStyle.mood}, information design, smooth transitions`,
        style: "data_viz",
        duration: duration.abstract,
        aspectRatio: "16:9",
        fps: 30
      }
    };

    const template = promptTemplates[videoType];
    
    if (!template) {
      // Fallback genérico
      return {
        text: `Professional ${businessType} related video, ${baseStyle.colors}, ${baseStyle.mood}, cinematic quality, seamless loop`,
        style: "cinematic",
        duration: 10,
        aspectRatio: "16:9",
        fps: 30
      };
    }

    // Adiciona contexto de mood se disponível
    if (moodDirection.specific) {
      template.text += `, ${moodDirection.specific}`;
    }

    return template;
  }

  /**
   * Gera vídeos (modo demonstração por enquanto)
   */
  async generateVideos(prompts) {
    console.log(`🎬 Gerando ${prompts.length} vídeos cinematográficos...`);
    
    const generatedVideos = [];
    
    // Verifica se temos API keys configuradas
    const hasRunway = !!this.runwayApiKey;
    const hasPika = !!this.pikaApiKey;
    const hasOpenAI = !!this.openaiApiKey;
    
    if (!hasRunway && !hasPika && !hasOpenAI) {
      console.log('⚠️ Nenhuma API key configurada - gerando demonstração...');
      return this.generateDemoVideos(prompts);
    }
    
    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];
      console.log(`🎥 Gerando vídeo ${i + 1}/${prompts.length}: ${prompt.category}_${prompt.type}`);
      
      try {
        let videoData = null;
        
        // Tenta RunwayML primeiro (melhor qualidade)
        if (hasRunway) {
          videoData = await this.callRunwayAPI(prompt);
        }
        // Fallback para Pika Labs
        else if (hasPika) {
          videoData = await this.callPikaAPI(prompt);
        }
        // Último resort: placeholder
        else {
          videoData = this.generatePlaceholderVideo(prompt);
        }
        
        if (videoData && videoData.url) {
          // Download do vídeo
          const videoBuffer = await this.downloadVideo(videoData.url);
          
          generatedVideos.push({
            ...prompt,
            url: videoData.url,
            buffer: videoBuffer,
            filename: `${prompt.id}.mp4`,
            generated: new Date().toISOString(),
            provider: videoData.provider || 'placeholder'
          });
          
          console.log(`✅ Vídeo gerado: ${prompt.category}_${prompt.type}`);
        }
        
        // Rate limiting
        await this.sleep(3000);
        
      } catch (error) {
        console.error(`❌ Erro ao gerar vídeo ${prompt.category}_${prompt.type}:`, error.message);
        
        // Gera placeholder em caso de erro
        generatedVideos.push({
          ...prompt,
          error: error.message,
          placeholder: true,
          filename: `placeholder_${prompt.id}.mp4`
        });
      }
    }
    
    return generatedVideos;
  }

  /**
   * Gera vídeos de demonstração
   */
  generateDemoVideos(prompts) {
    console.log('🎭 Modo demonstração - gerando placeholders...');
    
    return prompts.map(prompt => ({
      ...prompt,
      demoMode: true,
      filename: `demo_${prompt.id}.mp4`,
      generated: new Date().toISOString(),
      provider: 'demo',
      description: `Demo: ${prompt.prompt.substring(0, 100)}...`
    }));
  }

  /**
   * Chama a API do RunwayML (placeholder)
   */
  async callRunwayAPI(prompt) {
    // Placeholder para integração futura
    throw new Error('RunwayML API integration não implementada - usando demo mode');
  }

  /**
   * Chama a API do Pika Labs (placeholder)
   */
  async callPikaAPI(prompt) {
    // Placeholder para integração futura  
    throw new Error('Pika Labs API integration não implementada - usando demo mode');
  }

  /**
   * Download de vídeo da URL
   */
  async downloadVideo(url) {
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
   * Organiza e salva os assets de vídeo
   */
  organizeVideoAssets(generatedVideos, contextDNA) {
    const projectPath = path.dirname(path.dirname(contextDNA.filePath || ''));
    const assetsPath = path.join(projectPath, 'assets', 'videos');
    
    // Cria diretório de assets
    if (!fs.existsSync(assetsPath)) {
      fs.mkdirSync(assetsPath, { recursive: true });
    }

    const organizedAssets = {
      hero: [],
      ambient: [],
      lifestyle: [],
      abstract: [],
      generated: new Date().toISOString(),
      total: generatedVideos.length,
      successful: 0,
      errors: 0,
      demoMode: generatedVideos.some(v => v.demoMode)
    };

    // Organiza por categoria
    for (const video of generatedVideos) {
      const categoryPath = path.join(assetsPath, video.category);
      
      if (!fs.existsSync(categoryPath)) {
        fs.mkdirSync(categoryPath, { recursive: true });
      }

      if (video.buffer && !video.placeholder && !video.demoMode) {
        // Salva o vídeo real
        const filePath = path.join(categoryPath, video.filename);
        fs.writeFileSync(filePath, video.buffer);
        
        organizedAssets[video.category].push({
          id: video.id,
          type: video.type,
          filename: video.filename,
          path: filePath,
          url: video.url,
          prompt: video.prompt,
          duration: video.duration,
          aspectRatio: video.aspectRatio,
          fps: video.fps,
          generated: video.generated,
          provider: video.provider
        });
        
        organizedAssets.successful++;
        
      } else {
        // Demo ou erro
        if (video.demoMode) {
          organizedAssets[video.category].push({
            id: video.id,
            type: video.type,
            filename: video.filename,
            prompt: video.prompt,
            duration: video.duration,
            demoMode: true,
            description: video.description
          });
          organizedAssets.successful++;
        } else {
          organizedAssets.errors++;
        }
        
        console.log(`ℹ️ Vídeo demo/placeholder: ${video.category}_${video.type}`);
      }
    }

    // Salva manifesto dos vídeos
    const manifestPath = path.join(assetsPath, 'video-manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(organizedAssets, null, 2));
    
    console.log(`💾 Video assets salvos em: ${assetsPath}`);
    console.log(`📋 Manifesto salvo: ${manifestPath}`);
    
    return organizedAssets;
  }

  // Métodos auxiliares
  calculateTotalVideos(requirements) {
    return Object.values(requirements).reduce((total, types) => total + types.length, 0);
  }

  definePriority(businessType) {
    const priorityMap = {
      'fintech': ['hero', 'ambient', 'lifestyle', 'abstract'],
      'ecommerce': ['hero', 'lifestyle', 'ambient', 'abstract'],
      'fitness': ['hero', 'lifestyle', 'ambient', 'abstract'],
      'healthcare': ['lifestyle', 'hero', 'ambient', 'abstract'],
      'saas': ['hero', 'abstract', 'ambient', 'lifestyle']
    };
    return priorityMap[businessType] || priorityMap['saas'];
  }

  getOptimalDuration(audience) {
    const durationMap = {
      'gen_z': { hero: 8, ambient: 15, lifestyle: 6, abstract: 12 },
      'millennial': { hero: 10, ambient: 20, lifestyle: 8, abstract: 15 },
      'gen_x': { hero: 12, ambient: 25, lifestyle: 10, abstract: 18 },
      'boomer': { hero: 15, ambient: 30, lifestyle: 12, abstract: 20 }
    };
    
    return durationMap[audience] || durationMap['millennial'];
  }

  getCinematicStyle(visual, psychology) {
    return {
      primary: visual.layout === 'clean_minimal' ? 'minimalist' : 'dynamic',
      energy: psychology.primary === 'urgency' ? 'high' : 'medium',
      pace: psychology.primary === 'trust' ? 'steady' : 'dynamic'
    };
  }

  createMoodDirection(psychology, requirements) {
    const moodMap = {
      'trust': 'reliable and stable atmosphere, trustworthy feeling',
      'urgency': 'dynamic and energetic, time-sensitive mood',
      'value': 'premium and sophisticated, high-value perception'
    };
    
    return {
      primary: psychology.primary,
      specific: moodMap[psychology.primary] || moodMap['trust'],
      intensity: requirements.audience === 'gen_z' ? 'high' : 'medium'
    };
  }

  getBrandCinematicTone(brand) {
    const toneMap = {
      'professional_confident': 'corporate professional cinematography',
      'friendly_approachable': 'warm welcoming cinematography',
      'cutting_edge_smart': 'modern tech-forward cinematography',
      'balanced_trustworthy': 'reliable professional cinematography'
    };
    
    return toneMap[brand.voiceTone] || toneMap['balanced_trustworthy'];
  }

  getLightingStyle(psychology, visual) {
    if (psychology.primary === 'trust') return 'professional even lighting';
    if (psychology.primary === 'urgency') return 'dynamic dramatic lighting';
    if (visual.colorPsychology === 'trust_blue') return 'cool professional lighting';
    return 'balanced natural lighting';
  }

  getMovementStyle(psychology) {
    const movementMap = {
      'trust': 'smooth steady camera movement',
      'urgency': 'dynamic fast-paced movement',
      'value': 'elegant sophisticated movement'
    };
    
    return movementMap[psychology.primary] || movementMap['trust'];
  }

  generatePlaceholderVideo(prompt) {
    return {
      url: '#placeholder',
      provider: 'placeholder',
      description: prompt.prompt
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Gera relatório de vídeos criados
   */
  generateVideoReport(videoAssets, contextDNA) {
    const report = `# 🎬 NEXUS Video Assets - Relatório

## 📊 **Resumo de Geração**
- **Total de Vídeos:** ${videoAssets.total}
- **Sucessos:** ${videoAssets.successful}
- **Erros:** ${videoAssets.errors}
- **Taxa de Sucesso:** ${Math.round((videoAssets.successful / videoAssets.total) * 100)}%
- **Modo:** ${videoAssets.demoMode ? 'DEMONSTRAÇÃO' : 'PRODUÇÃO'}
- **Gerado em:** ${videoAssets.generated}

## 🎯 **Projeto Context**
- **Business Type:** ${contextDNA.project.businessType}
- **Target Audience:** ${contextDNA.audience.primaryAge}
- **Visual Style:** ${contextDNA.visual.colorPsychology}
- **Psychology:** ${contextDNA.psychology.primary}

## 🎬 **Assets por Categoria**

### 🦸 Hero Videos (${videoAssets.hero.length})
${videoAssets.hero.map(video => `- **${video.type}**: ${video.filename} (${video.duration}s)`).join('\n') || 'Nenhum vídeo hero gerado'}

### 🌟 Ambient Videos (${videoAssets.ambient.length})
${videoAssets.ambient.map(video => `- **${video.type}**: ${video.filename} (${video.duration}s)`).join('\n') || 'Nenhum vídeo ambient gerado'}

### 🌟 Lifestyle Videos (${videoAssets.lifestyle.length})
${videoAssets.lifestyle.map(video => `- **${video.type}**: ${video.filename} (${video.duration}s)`).join('\n') || 'Nenhum vídeo lifestyle gerado'}

### 🎨 Abstract Videos (${videoAssets.abstract.length})
${videoAssets.abstract.map(video => `- **${video.type}**: ${video.filename} (${video.duration}s)`).join('\n') || 'Nenhum vídeo abstract gerado'}

## 🎨 **Prompts Utilizados**

${Object.values(videoAssets).flat()
  .filter(video => video.prompt && !video.demoMode)
  .map(video => `### ${video.type}
**Prompt:** ${video.prompt}
**Duração:** ${video.duration}s
**Aspect Ratio:** ${video.aspectRatio}
**FPS:** ${video.fps}
**File:** ${video.filename}
---`)
  .join('\n') || 'Prompts não disponíveis'}

${videoAssets.demoMode ? `
## 🎭 **Modo Demonstração**
Este relatório foi gerado em modo demonstração. Os vídeos não foram realmente criados, mas os prompts contextuais foram gerados com sucesso.

Para gerar vídeos reais, configure uma das APIs:
- \`RUNWAY_API_KEY\` para RunwayML Gen-3
- \`PIKA_API_KEY\` para Pika Labs
- \`OPENAI_API_KEY\` para fallback options

## 📋 **Prompts Demo Gerados**
${Object.values(videoAssets).flat()
  .filter(video => video.demoMode)
  .map(video => `### ${video.type}
**Categoria:** ${video.category}
**Descrição:** ${video.description}
**Duração:** ${video.duration}s
---`)
  .join('\n')}
` : ''}

## 🚀 **Próximos Passos**
1. ${videoAssets.demoMode ? 'Configurar API keys para geração real' : 'Otimizar vídeos para web'}
2. ${videoAssets.demoMode ? 'Testar integração com RunwayML/Pika' : 'Criar variações se necessário'}
3. Integração com Code Agent para backgrounds automáticos
4. Compressão e otimização para performance web
5. A/B testing de diferentes estilos de vídeo

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
🎬 NEXUS Video Agent v1.0.0

Uso:
  node nexus-video-agent.js <context-dna-path>

Exemplo:
  node nexus-video-agent.js ../projects/etf-landing/context-dna.json
  
APIs Suportadas:
  - RunwayML Gen-3 (RUNWAY_API_KEY)
  - Pika Labs (PIKA_API_KEY)
  - Demo mode (sem API keys)
    `);
    process.exit(1);
  }

  const contextDNAPath = args[0];
  
  // Verifica se o arquivo existe
  if (!fs.existsSync(contextDNAPath)) {
    console.error(`❌ Arquivo não encontrado: ${contextDNAPath}`);
    process.exit(1);
  }
  
  const agent = new NexusVideoAgent();
  
  console.log('🚀 Iniciando geração de vídeos cinematográficos...');
  console.log(`📄 Context DNA: ${contextDNAPath}`);
  console.log('');

  try {
    const videoAssets = await agent.processContextDNA(contextDNAPath);
    
    // Gera relatório
    const contextDNA = JSON.parse(fs.readFileSync(contextDNAPath, 'utf8'));
    const report = agent.generateVideoReport(videoAssets, contextDNA);
    
    const reportPath = path.join(path.dirname(contextDNAPath), 'video-report.md');
    fs.writeFileSync(reportPath, report);
    
    console.log('');
    console.log('✅ Geração de vídeos concluída!');
    console.log('📊 Estatísticas:');
    console.log(`   - Total: ${videoAssets.total} vídeos`);
    console.log(`   - Sucessos: ${videoAssets.successful}`);
    console.log(`   - Erros: ${videoAssets.errors}`);
    console.log(`   - Modo: ${videoAssets.demoMode ? 'DEMONSTRAÇÃO' : 'PRODUÇÃO'}`);
    console.log(`   - Taxa de sucesso: ${Math.round((videoAssets.successful / videoAssets.total) * 100)}%`);
    console.log('');
    console.log('📁 Arquivos gerados:');
    console.log(`   - Assets: ${path.dirname(contextDNAPath)}/assets/videos/`);
    console.log(`   - Relatório: ${reportPath}`);
    console.log('');
    console.log('🎯 Próximo passo: Use os vídeos como backgrounds no Code Agent');
    
  } catch (error) {
    console.error('❌ Erro ao gerar vídeos:', error.message);
    process.exit(1);
  }
}

// Executa se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = NexusVideoAgent;