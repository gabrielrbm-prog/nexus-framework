#!/usr/bin/env node

/*
 * 🧠 NEXUS CONTEXT AGENT
 * O cérebro que entende qualquer briefing e cria o DNA do projeto
 * Input: Briefing do cliente
 * Output: Context DNA completo para todos outros agentes
 */

const fs = require('fs');
const path = require('path');

class NexusContextAgent {
  constructor() {
    this.name = "NEXUS Context Agent";
    this.version = "1.0.0";
    this.capabilities = [
      "Briefing Analysis",
      "Target Audience Profiling", 
      "Competitor Intelligence",
      "Brand Personality Definition",
      "Technical Requirements",
      "Conversion Psychology",
      "Market Positioning"
    ];
  }

  /**
   * Processa um briefing e gera o Context DNA completo
   */
  async processBriefing(briefing) {
    console.log(`🧠 ${this.name} processando briefing...`);
    
    const contextDNA = {
      project: this.extractProjectInfo(briefing),
      audience: this.analyzeTargetAudience(briefing),
      psychology: this.defineConversionPsychology(briefing),
      brand: this.createBrandPersonality(briefing),
      technical: this.defineTechnicalRequirements(briefing),
      competitive: this.analyzeCompetitors(briefing),
      content: this.defineContentStrategy(briefing),
      visual: this.createVisualDirection(briefing),
      created: new Date().toISOString(),
      agent: this.name
    };

    return contextDNA;
  }

  /**
   * Extrai informações básicas do projeto
   */
  extractProjectInfo(briefing) {
    const keywords = briefing.toLowerCase();
    
    // Detecta tipo de negócio
    const businessTypes = {
      'fintech': ['pagamento', 'banco', 'financeiro', 'cartão', 'investimento', 'trading', 'criptomoeda'],
      'ecommerce': ['loja', 'venda', 'produto', 'carrinho', 'checkout', 'marketplace'],
      'saas': ['software', 'app', 'plataforma', 'dashboard', 'ferramenta', 'sistema'],
      'agency': ['agência', 'marketing', 'design', 'criativo', 'publicidade'],
      'education': ['educação', 'curso', 'ensino', 'aprendizado', 'escola', 'universidade'],
      'healthcare': ['saúde', 'médico', 'clínica', 'hospital', 'telemedicina'],
      'real_estate': ['imóvel', 'casa', 'apartamento', 'propriedade', 'aluguel'],
      'food': ['restaurante', 'comida', 'delivery', 'alimentação', 'culinária'],
      'travel': ['viagem', 'hotel', 'turismo', 'passagem', 'hospedagem'],
      'fitness': ['academia', 'fitness', 'exercício', 'treino', 'saúde']
    };

    let detectedType = 'general';
    for (const [type, words] of Object.entries(businessTypes)) {
      if (words.some(word => keywords.includes(word))) {
        detectedType = type;
        break;
      }
    }

    return {
      businessType: detectedType,
      industry: this.mapIndustry(detectedType),
      projectScale: this.detectProjectScale(briefing),
      timeline: this.extractTimeline(briefing),
      budget: this.extractBudgetRange(briefing),
      goals: this.extractGoals(briefing)
    };
  }

  /**
   * Analisa target audience baseado no briefing
   */
  analyzeTargetAudience(briefing) {
    const keywords = briefing.toLowerCase();
    
    // Demografia
    const ageGroups = {
      'gen_z': ['jovem', 'tiktok', 'instagram', '18-24', 'gen z'],
      'millennial': ['millennia', '25-35', 'instagram', 'facebook'], 
      'gen_x': ['35-50', 'facebook', 'linkedin', 'experiência'],
      'boomer': ['50+', 'tradicional', 'telefone', 'experiência']
    };

    let primaryAge = 'millennial';
    for (const [age, indicators] of Object.entries(ageGroups)) {
      if (indicators.some(indicator => keywords.includes(indicator))) {
        primaryAge = age;
        break;
      }
    }

    return {
      primaryAge: primaryAge,
      demographics: this.buildDemographics(primaryAge),
      psychographics: this.buildPsychographics(briefing),
      painPoints: this.extractPainPoints(briefing),
      motivations: this.extractMotivations(briefing),
      digitalBehavior: this.analyzDigitalBehavior(primaryAge)
    };
  }

  /**
   * Define psicologia de conversão baseada no target e negócio
   */
  defineConversionPsychology(briefing) {
    const businessType = this.extractProjectInfo(briefing).businessType;
    
    const psychologyMap = {
      'fintech': {
        primary: 'trust',
        triggers: ['security', 'transparency', 'social_proof', 'authority'],
        fears: ['fraud', 'loss', 'complexity'],
        desires: ['growth', 'control', 'simplicity'],
        copyTone: 'professional_confident'
      },
      'ecommerce': {
        primary: 'urgency',
        triggers: ['scarcity', 'social_proof', 'reciprocity'],
        fears: ['regret', 'missing_out', 'poor_quality'],
        desires: ['value', 'convenience', 'status'],
        copyTone: 'friendly_persuasive'
      },
      'saas': {
        primary: 'value',
        triggers: ['productivity', 'roi', 'authority', 'social_proof'],
        fears: ['complexity', 'time_waste', 'wrong_choice'],
        desires: ['efficiency', 'success', 'simplicity'],
        copyTone: 'smart_solution_oriented'
      }
    };

    return psychologyMap[businessType] || psychologyMap['saas'];
  }

  /**
   * Cria personalidade de marca baseada no briefing
   */
  createBrandPersonality(briefing) {
    const keywords = briefing.toLowerCase();
    
    // Detecta tom de personalidade
    const personalityIndicators = {
      'professional': ['corporativo', 'empresa', 'negócio', 'profissional', 'sério'],
      'friendly': ['amigável', 'próximo', 'acessível', 'humano', 'caloroso'],
      'innovative': ['inovador', 'moderno', 'tecnologia', 'futuro', 'disruptivo'],
      'trustworthy': ['confiável', 'seguro', 'transparente', 'honesto'],
      'premium': ['luxo', 'premium', 'exclusivo', 'sofisticado', 'elite']
    };

    const detectedTraits = [];
    for (const [trait, indicators] of Object.entries(personalityIndicators)) {
      if (indicators.some(indicator => keywords.includes(indicator))) {
        detectedTraits.push(trait);
      }
    }

    return {
      primaryTraits: detectedTraits.slice(0, 3),
      voiceTone: this.defineVoiceTone(detectedTraits),
      brandArchetype: this.assignBrandArchetype(detectedTraits),
      communicationStyle: this.defineCommunicationStyle(detectedTraits),
      emotionalCore: this.defineEmotionalCore(briefing)
    };
  }

  /**
   * Define requisitos técnicos baseados no projeto
   */
  defineTechnicalRequirements(briefing) {
    const businessType = this.extractProjectInfo(briefing).businessType;
    
    const technicalMap = {
      'fintech': {
        security: 'high',
        performance: 'high', 
        compliance: ['PCI', 'GDPR', 'SOC2'],
        integrations: ['payment_gateways', 'banking_apis', 'kyc'],
        monitoring: 'advanced'
      },
      'ecommerce': {
        security: 'high',
        performance: 'high',
        compliance: ['GDPR', 'PCI'],
        integrations: ['payment', 'shipping', 'inventory', 'crm'],
        monitoring: 'standard'
      },
      'saas': {
        security: 'medium',
        performance: 'high',
        compliance: ['GDPR'],
        integrations: ['apis', 'webhooks', 'analytics'],
        monitoring: 'advanced'
      }
    };

    return technicalMap[businessType] || technicalMap['saas'];
  }

  /**
   * Analisa competitors baseado no tipo de negócio
   */
  analyzeCompetitors(briefing) {
    const businessType = this.extractProjectInfo(briefing).businessType;
    
    const competitorBenchmarks = {
      'fintech': ['stripe', 'nubank', 'wise', 'revolut'],
      'ecommerce': ['amazon', 'shopify', 'mercadolivre'],
      'saas': ['notion', 'slack', 'figma', 'linear'],
      'agency': ['wix', 'squarespace', 'webflow']
    };

    const relevantCompetitors = competitorBenchmarks[businessType] || [];

    return {
      directCompetitors: relevantCompetitors,
      benchmarkSites: this.getBenchmarkSites(businessType),
      differentiationOpportunities: this.findDifferentiationOpportunities(briefing),
      designTrends: this.getCurrentDesignTrends(businessType)
    };
  }

  /**
   * Define estratégia de conteúdo
   */
  defineContentStrategy(briefing) {
    const audience = this.analyzeTargetAudience(briefing);
    const psychology = this.defineConversionPsychology(briefing);
    
    return {
      contentPillars: this.defineContentPillars(briefing),
      copyStrategy: psychology.copyTone,
      ctaStrategy: this.defineCTAStrategy(psychology),
      contentHierarchy: this.defineContentHierarchy(briefing),
      seoStrategy: this.defineSEOStrategy(briefing)
    };
  }

  /**
   * Cria direção visual baseada no contexto
   */
  createVisualDirection(briefing) {
    const brand = this.createBrandPersonality(briefing);
    const businessType = this.extractProjectInfo(briefing).businessType;
    
    const visualMap = {
      'fintech': {
        colorPsychology: 'trust_blue',
        typography: 'modern_sans',
        layout: 'clean_minimal',
        imagery: 'business_lifestyle'
      },
      'ecommerce': {
        colorPsychology: 'converting_orange',
        typography: 'friendly_rounded',
        layout: 'grid_product',
        imagery: 'product_lifestyle'
      },
      'saas': {
        colorPsychology: 'productive_purple',
        typography: 'tech_geometric',
        layout: 'dashboard_focused',
        imagery: 'workflow_abstract'
      }
    };

    return visualMap[businessType] || visualMap['saas'];
  }

  /**
   * Salva o Context DNA em arquivo
   */
  async saveContextDNA(contextDNA, projectName) {
    const outputDir = path.join(__dirname, '..', 'projects', projectName);
    
    // Cria diretório se não existe
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filePath = path.join(outputDir, 'context-dna.json');
    
    // Salva o arquivo
    fs.writeFileSync(filePath, JSON.stringify(contextDNA, null, 2));
    
    console.log(`💾 Context DNA salvo em: ${filePath}`);
    
    // Gera resumo humano
    const summaryPath = path.join(outputDir, 'context-summary.md');
    const summary = this.generateHumanSummary(contextDNA);
    fs.writeFileSync(summaryPath, summary);
    
    console.log(`📄 Resumo humano salvo em: ${summaryPath}`);
    
    return { contextDNA, filePath, summaryPath };
  }

  /**
   * Gera resumo humano do Context DNA
   */
  generateHumanSummary(dna) {
    return `# 🧠 NEXUS Context DNA - Resumo

## 🎯 **Projeto**
- **Tipo:** ${dna.project.businessType}
- **Indústria:** ${dna.project.industry}
- **Escala:** ${dna.project.projectScale}
- **Timeline:** ${dna.project.timeline}
- **Objetivos:** ${dna.project.goals.join(', ')}

## 👥 **Target Audience**
- **Idade Primária:** ${dna.audience.primaryAge}
- **Demografia:** ${JSON.stringify(dna.audience.demographics, null, 2)}
- **Pain Points:** ${dna.audience.painPoints.join(', ')}
- **Motivações:** ${dna.audience.motivations.join(', ')}

## 🧠 **Psicologia de Conversão**
- **Trigger Primário:** ${dna.psychology.primary}
- **Gatilhos:** ${dna.psychology.triggers.join(', ')}
- **Medos:** ${dna.psychology.fears.join(', ')}
- **Desejos:** ${dna.psychology.desires.join(', ')}
- **Tom de Copy:** ${dna.psychology.copyTone}

## 🎨 **Personalidade da Marca**
- **Traços Principais:** ${dna.brand.primaryTraits.join(', ')}
- **Tom de Voz:** ${dna.brand.voiceTone}
- **Arquétipo:** ${dna.brand.brandArchetype}
- **Estilo de Comunicação:** ${dna.brand.communicationStyle}

## ⚙️ **Requisitos Técnicos**
- **Segurança:** ${dna.technical.security}
- **Performance:** ${dna.technical.performance}
- **Compliance:** ${dna.technical.compliance.join(', ')}
- **Integrações:** ${dna.technical.integrations.join(', ')}

## 🏆 **Análise Competitiva**
- **Competitors Diretos:** ${dna.competitive.directCompetitors.join(', ')}
- **Benchmark Sites:** ${dna.competitive.benchmarkSites.join(', ')}

## 📝 **Estratégia de Conteúdo**
- **Pilares:** ${dna.content.contentPillars.join(', ')}
- **Estratégia de Copy:** ${dna.content.copyStrategy}
- **Estratégia CTA:** ${dna.content.ctaStrategy}

## 🎨 **Direção Visual**
- **Psicologia de Cor:** ${dna.visual.colorPsychology}
- **Tipografia:** ${dna.visual.typography}
- **Layout:** ${dna.visual.layout}
- **Imagery:** ${dna.visual.imagery}

---
*Gerado por ${dna.agent} em ${dna.created}*
`;
  }

  // Métodos auxiliares
  mapIndustry(businessType) {
    const industryMap = {
      'fintech': 'Financial Services',
      'ecommerce': 'Retail & Commerce',
      'saas': 'Technology',
      'agency': 'Marketing & Advertising',
      'education': 'Education & Training',
      'healthcare': 'Healthcare & Medical',
      'real_estate': 'Real Estate',
      'food': 'Food & Beverage',
      'travel': 'Travel & Hospitality',
      'fitness': 'Health & Fitness'
    };
    return industryMap[businessType] || 'General';
  }

  detectProjectScale(briefing) {
    const keywords = briefing.toLowerCase();
    if (keywords.includes('startup') || keywords.includes('pequeno')) return 'startup';
    if (keywords.includes('empresa') || keywords.includes('médio')) return 'medium';
    if (keywords.includes('corporação') || keywords.includes('grande')) return 'enterprise';
    return 'medium';
  }

  extractTimeline(briefing) {
    const keywords = briefing.toLowerCase();
    if (keywords.includes('urgente') || keywords.includes('asap')) return 'rush';
    if (keywords.includes('semana')) return '1-2 weeks';
    if (keywords.includes('mês')) return '1 month';
    return '2-4 weeks';
  }

  extractBudgetRange(briefing) {
    const keywords = briefing.toLowerCase();
    if (keywords.includes('baixo') || keywords.includes('barato')) return 'low';
    if (keywords.includes('premium') || keywords.includes('investimento')) return 'high';
    return 'medium';
  }

  extractGoals(briefing) {
    const goalMap = {
      'conversão': 'increase_conversions',
      'vendas': 'increase_sales', 
      'leads': 'generate_leads',
      'cadastro': 'user_acquisition',
      'marca': 'brand_awareness',
      'engagement': 'user_engagement'
    };

    const detected = [];
    const keywords = briefing.toLowerCase();
    
    for (const [keyword, goal] of Object.entries(goalMap)) {
      if (keywords.includes(keyword)) {
        detected.push(goal);
      }
    }

    return detected.length > 0 ? detected : ['increase_conversions'];
  }

  // Adicionar mais métodos auxiliares conforme necessário...
  buildDemographics(primaryAge) {
    const ageMap = {
      'gen_z': { age: '18-24', income: 'low-medium', tech: 'high', social: 'tiktok-instagram' },
      'millennial': { age: '25-35', income: 'medium-high', tech: 'high', social: 'instagram-linkedin' },
      'gen_x': { age: '35-50', income: 'high', tech: 'medium', social: 'facebook-linkedin' },
      'boomer': { age: '50+', income: 'high', tech: 'low', social: 'facebook-email' }
    };
    return ageMap[primaryAge];
  }

  buildPsychographics(briefing) {
    // Análise psicográfica baseada no briefing
    return {
      values: ['efficiency', 'quality', 'value'],
      interests: ['technology', 'business', 'growth'],
      lifestyle: 'busy_professional'
    };
  }

  extractPainPoints(briefing) {
    return ['time_consuming', 'complex_process', 'lack_of_transparency'];
  }

  extractMotivations(briefing) {
    return ['save_time', 'increase_profit', 'reduce_risk'];
  }

  analyzDigitalBehavior(primaryAge) {
    const behaviorMap = {
      'gen_z': 'mobile_first_short_attention',
      'millennial': 'multi_device_research_heavy',
      'gen_x': 'desktop_focused_thorough',
      'boomer': 'traditional_channels_preferred'
    };
    return behaviorMap[primaryAge];
  }

  defineVoiceTone(traits) {
    if (traits.includes('professional')) return 'professional_confident';
    if (traits.includes('friendly')) return 'friendly_approachable';
    if (traits.includes('innovative')) return 'cutting_edge_smart';
    return 'balanced_trustworthy';
  }

  assignBrandArchetype(traits) {
    if (traits.includes('innovative')) return 'magician';
    if (traits.includes('trustworthy')) return 'sage';
    if (traits.includes('friendly')) return 'everyman';
    if (traits.includes('premium')) return 'ruler';
    return 'hero';
  }

  defineCommunicationStyle(traits) {
    if (traits.includes('professional')) return 'direct_clear';
    if (traits.includes('friendly')) return 'conversational_warm';
    if (traits.includes('innovative')) return 'visionary_inspiring';
    return 'informative_helpful';
  }

  defineEmotionalCore(briefing) {
    return 'trust_and_success';
  }

  getBenchmarkSites(businessType) {
    const benchmarkMap = {
      'fintech': ['stripe.com', 'wise.com', 'revolut.com'],
      'ecommerce': ['shopify.com', 'amazon.com'],
      'saas': ['linear.app', 'notion.so', 'figma.com']
    };
    return benchmarkMap[businessType] || [];
  }

  findDifferentiationOpportunities(briefing) {
    return ['user_experience', 'transparency', 'speed'];
  }

  getCurrentDesignTrends(businessType) {
    return ['glassmorphism', 'micro_interactions', 'dark_mode'];
  }

  defineContentPillars(briefing) {
    return ['education', 'trust_building', 'product_benefits'];
  }

  defineCTAStrategy(psychology) {
    const ctaMap = {
      'trust': 'Get_Started_Safely',
      'urgency': 'Limited_Time_Offer',
      'value': 'See_ROI_Calculator'
    };
    return ctaMap[psychology.primary] || 'Get_Started_Now';
  }

  defineContentHierarchy(briefing) {
    return ['hero_value_prop', 'social_proof', 'features', 'pricing', 'cta'];
  }

  defineSEOStrategy(briefing) {
    return 'focused_long_tail_keywords';
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🧠 NEXUS Context Agent v1.0.0

Uso:
  node nexus-context-agent.js "Briefing do projeto" [nome-do-projeto]

Exemplo:
  node nexus-context-agent.js "Preciso de um site para minha fintech de pagamentos, focado em conversão e confiança" fintech-payments
    `);
    process.exit(1);
  }

  const briefing = args[0];
  const projectName = args[1] || `projeto-${Date.now()}`;
  
  const agent = new NexusContextAgent();
  
  console.log('🚀 Iniciando análise...');
  console.log(`📋 Briefing: "${briefing}"`);
  console.log(`📂 Projeto: ${projectName}`);
  console.log('');

  try {
    const contextDNA = await agent.processBriefing(briefing);
    const result = await agent.saveContextDNA(contextDNA, projectName);
    
    console.log('');
    console.log('✅ Context DNA gerado com sucesso!');
    console.log('📄 Arquivos salvos:');
    console.log(`   - ${result.filePath}`);
    console.log(`   - ${result.summaryPath}`);
    console.log('');
    console.log('🎯 Próximo passo: Use este Context DNA com outros agentes NEXUS');
    
  } catch (error) {
    console.error('❌ Erro ao processar briefing:', error);
    process.exit(1);
  }
}

// Executa se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = NexusContextAgent;