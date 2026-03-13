#!/usr/bin/env node

/*
 * 📝 NEXUS CONTENT AGENT
 * Gera copy contextual e otimizado baseado no Context DNA
 * Input: Context DNA + Brand personality
 * Output: Headlines, CTAs, microcopy, meta descriptions contextuais
 */

const fs = require('fs');
const path = require('path');

class NexusContentAgent {
  constructor() {
    this.name = "NEXUS Content Agent";
    this.version = "1.0.0";
    this.capabilities = [
      "Context-Driven Copy Generation",
      "Psychology-Based Headlines", 
      "Conversion-Optimized CTAs",
      "A/B Testing Variants",
      "SEO Meta Content",
      "Microcopy Optimization",
      "Brand Voice Consistency"
    ];
  }

  /**
   * Processa Context DNA e gera copy contextual
   */
  async processContextDNA(contextDNAPath) {
    console.log(`📝 ${this.name} processando Context DNA...`);
    
    // Lê o Context DNA
    const contextDNA = JSON.parse(fs.readFileSync(contextDNAPath, 'utf8'));
    
    // Analisa requisitos de conteúdo baseado no contexto
    const contentRequirements = this.analyzeContentRequirements(contextDNA);
    
    // Gera headlines contextuais
    const headlines = this.generateContextualHeadlines(contextDNA, contentRequirements);
    
    // Gera CTAs otimizados
    const ctas = this.generateOptimizedCTAs(contextDNA, contentRequirements);
    
    // Gera copy para seções
    const sectionContent = this.generateSectionContent(contextDNA, contentRequirements);
    
    // Gera meta content SEO
    const metaContent = this.generateMetaContent(contextDNA, contentRequirements);
    
    // Gera variantes A/B
    const abVariants = this.generateABVariants(contextDNA, headlines, ctas);
    
    // Gera microcopy
    const microcopy = this.generateMicrocopy(contextDNA, contentRequirements);
    
    // Organiza todo o conteúdo
    const contentAssets = this.organizeContentAssets({
      headlines,
      ctas,
      sectionContent,
      metaContent,
      abVariants,
      microcopy
    }, contextDNA);
    
    return contentAssets;
  }

  /**
   * Analisa o Context DNA para definir estratégia de conteúdo
   */
  analyzeContentRequirements(contextDNA) {
    const businessType = contextDNA.project.businessType;
    const audience = contextDNA.audience;
    const psychology = contextDNA.psychology;
    const brand = contextDNA.brand;
    
    return {
      businessType,
      audience,
      psychology,
      brand,
      contentStrategy: this.defineContentStrategy(psychology, audience),
      voiceAndTone: this.defineVoiceAndTone(brand, audience),
      conversionTriggers: this.identifyConversionTriggers(psychology, businessType),
      contentPriorities: this.defineContentPriorities(businessType),
      seoKeywords: this.generateSEOKeywords(businessType, audience),
      emotionalDrivers: this.identifyEmotionalDrivers(psychology, audience)
    };
  }

  /**
   * Gera headlines contextuais baseados na psicologia
   */
  generateContextualHeadlines(contextDNA, requirements) {
    const businessType = requirements.businessType;
    const psychology = requirements.psychology.primary;
    const audience = requirements.audience.primaryAge;
    const triggers = requirements.conversionTriggers;
    
    // Templates de headlines por business type e psychology
    const headlineTemplates = {
      'fintech': {
        'trust': [
          "Transforme Sua Carreira em Trading Profissional",
          "Do Zero ao Trader Financiado em 90 Dias",
          "Método Comprovado: 1.000+ Traders Aprovados",
          "Trading Profissional com Resultados Reais",
          "Seja o Próximo Trader de Sucesso"
        ],
        'authority': [
          "O Método Definitivo para Trading Profissional",
          "Dominando o Mercado: Sistema SMC Avançado",
          "Trading de Elite: Técnicas dos Profissionais",
          "Segredos dos Traders Mais Rentáveis",
          "Master Class: Trading para Profissionais"
        ],
        'urgency': [
          "Últimas Vagas: Turma de Trading Profissional",
          "Oferta Limitada: Método SMC Completo",
          "Apenas Esta Semana: Acesso Total ETF",
          "Vagas Limitadas: Elite Trading School",
          "Aproveite Agora: Formação Completa"
        ]
      },
      'ecommerce': {
        'urgency': [
          "Liquidação Final: Até 70% OFF",
          "Últimas Peças da Coleção Premium",
          "Flash Sale: Frete Grátis Hoje",
          "Promoção Relâmpago: 48h Apenas",
          "Black Friday Antecipada"
        ],
        'value': [
          "Qualidade Premium por Preço Justo",
          "O Melhor Custo-Benefício do Mercado",
          "Produtos Originais com Garantia Total",
          "Investimento que Compensa a Longo Prazo",
          "Valor Real em Cada Compra"
        ],
        'trust': [
          "Marca Confiada por 10.000+ Clientes",
          "Satisfação Garantida ou Dinheiro de Volta",
          "Produtos Certificados e Originais",
          "Entrega Segura em Todo o Brasil",
          "Sua Confiança é Nossa Prioridade"
        ]
      },
      'fitness': {
        'transformation': [
          "Transforme Seu Corpo em 90 Dias",
          "O Físico Que Você Sempre Sonhou",
          "De Sedentário a Atlético: Sua Jornada",
          "Resultados Reais, Transformação Verdadeira",
          "Sua Melhor Versão Começa Aqui"
        ],
        'exclusivity': [
          "Academia Elite: Só Para Determinados",
          "Treinamento VIP: Acesso Exclusivo",
          "Personal Premium: Poucos Escolhidos",
          "Elite Fitness Club: Membros Especiais",
          "Exclusividade e Resultados Garantidos"
        ],
        'results': [
          "Resultados Comprovados em 30 Dias",
          "Método Científico: Resultados Garantidos",
          "Transformações Documentadas",
          "Sucesso Medido e Comprovado",
          "Performance Máxima, Resultados Reais"
        ]
      },
      'healthcare': {
        'care': [
          "Cuidando da Sua Saúde com Excelência",
          "Atendimento Humanizado e Especializado",
          "Sua Saúde é Nossa Prioridade Máxima",
          "Cuidado Integral para Toda Família",
          "Saúde de Qualidade ao Seu Alcance"
        ],
        'trust': [
          "Confiança Construída ao Longo de Anos",
          "Equipe Médica de Reconhecida Competência",
          "Tradição em Excelência Médica",
          "Profissionais Qualificados e Experientes",
          "Medicina de Qualidade com Responsabilidade"
        ],
        'innovation': [
          "Tecnologia de Ponta a Serviço da Saúde",
          "Medicina Moderna com Toque Humano",
          "Inovação e Excelência em Cada Atendimento",
          "Equipamentos de Última Geração",
          "O Futuro da Medicina Está Aqui"
        ]
      }
    };

    // Seleciona templates baseados no contexto
    const businessHeadlines = headlineTemplates[businessType] || headlineTemplates['fintech'];
    const psychologyHeadlines = businessHeadlines[psychology] || businessHeadlines['trust'];
    
    // Gera variações contextuais
    const generatedHeadlines = {
      primary: psychologyHeadlines[0],
      variants: psychologyHeadlines.slice(1, 4),
      psychological_focus: psychology,
      audience_optimized: this.optimizeForAudience(psychologyHeadlines, audience),
      conversion_focused: this.addConversionElements(psychologyHeadlines, triggers)
    };

    return generatedHeadlines;
  }

  /**
   * Gera CTAs otimizados para conversão
   */
  generateOptimizedCTAs(contextDNA, requirements) {
    const psychology = requirements.psychology.primary;
    const businessType = requirements.businessType;
    const triggers = requirements.conversionTriggers;
    
    // CTAs por psychology e business type
    const ctaTemplates = {
      'fintech': {
        'trust': [
          "Começar Com Segurança",
          "Acessar Método Comprovado",
          "Ver Resultados Reais",
          "Conhecer a Metodologia",
          "Falar Com Especialista"
        ],
        'authority': [
          "Dominar o Trading",
          "Acessar Conhecimento Elite",
          "Tornar-se Profissional",
          "Aprender com Experts",
          "Conquistar o Mercado"
        ],
        'urgency': [
          "Garantir Minha Vaga",
          "Aproveitar Agora",
          "Não Perder Esta Chance",
          "Acessar Imediatamente",
          "Reservar Hoje"
        ]
      },
      'ecommerce': {
        'urgency': [
          "Comprar Agora",
          "Garantir Desconto",
          "Aproveitar Oferta",
          "Finalizar Pedido",
          "Não Perder"
        ],
        'value': [
          "Ver Custo-Benefício",
          "Calcular Economia",
          "Comparar Preços",
          "Analisar Produto",
          "Avaliar Investimento"
        ],
        'trust': [
          "Comprar Com Segurança",
          "Ver Garantias",
          "Conhecer Produto",
          "Ler Avaliações",
          "Falar Conosco"
        ]
      },
      'fitness': {
        'transformation': [
          "Iniciar Transformação",
          "Começar Mudança",
          "Transformar Agora",
          "Evoluir Hoje",
          "Mudar de Vida"
        ],
        'exclusivity': [
          "Ser Aceito",
          "Candidatar-se",
          "Pleitear Vaga",
          "Aplicar Agora",
          "Ser Selecionado"
        ],
        'results': [
          "Ver Resultados",
          "Comprovar Eficácia",
          "Testar Método",
          "Medir Progresso",
          "Alcançar Meta"
        ]
      },
      'healthcare': {
        'care': [
          "Agendar Consulta",
          "Cuidar da Saúde",
          "Marcar Atendimento",
          "Receber Cuidado",
          "Ser Atendido"
        ],
        'trust': [
          "Conhecer Equipe",
          "Ver Credenciais",
          "Agendar Avaliação",
          "Falar com Médico",
          "Confiar em Nós"
        ]
      }
    };

    const businessCTAs = ctaTemplates[businessType] || ctaTemplates['fintech'];
    const psychologyCTAs = businessCTAs[psychology] || businessCTAs['trust'];

    return {
      primary: psychologyCTAs[0],
      secondary: psychologyCTAs[1],
      variants: psychologyCTAs.slice(2),
      psychological_focus: psychology,
      urgency_enhanced: this.addUrgencyElements(psychologyCTAs, triggers),
      trust_enhanced: this.addTrustElements(psychologyCTAs, triggers)
    };
  }

  /**
   * Gera conteúdo para seções do site
   */
  generateSectionContent(contextDNA, requirements) {
    const businessType = requirements.businessType;
    const psychology = requirements.psychology;
    const audience = requirements.audience;
    const brand = requirements.brand;

    return {
      hero: this.generateHeroContent(contextDNA, requirements),
      about: this.generateAboutContent(contextDNA, requirements),
      features: this.generateFeaturesContent(contextDNA, requirements),
      benefits: this.generateBenefitsContent(contextDNA, requirements),
      testimonials: this.generateTestimonialsContent(contextDNA, requirements),
      pricing: this.generatePricingContent(contextDNA, requirements),
      faq: this.generateFAQContent(contextDNA, requirements),
      footer: this.generateFooterContent(contextDNA, requirements)
    };
  }

  /**
   * Gera conteúdo Hero contextual
   */
  generateHeroContent(contextDNA, requirements) {
    const businessType = requirements.businessType;
    const psychology = requirements.psychology.primary;
    
    const heroTemplates = {
      'fintech': {
        subheadline: "Método SMC + PO3 comprovado. Do zero ao financiado em 90 dias. 1.000+ traders aprovados em prop firms internacionais.",
        benefits: [
          "Método SMC (Smart Money Concepts) completo",
          "Suporte 24/7 com traders experientes", 
          "Aprovação garantida em prop firms",
          "Comunidade exclusiva de 1.000+ traders"
        ],
        social_proof: "⭐⭐⭐⭐⭐ 4.9/5 baseado em 500+ avaliações",
        trust_elements: [
          "1.000+ alunos formados",
          "95% taxa de aprovação",
          "189 traders ativos",
          "Método comprovado há 5 anos"
        ]
      },
      'ecommerce': {
        subheadline: "Coleção exclusiva de streetwear urbano. Qualidade premium com entrega rápida e garantia total.",
        benefits: [
          "Entrega grátis em todo o Brasil",
          "Trocas e devoluções em 30 dias",
          "Produtos originais e garantidos", 
          "Atendimento especializado"
        ],
        social_proof: "🔥 Marca preferida de 50.000+ jovens",
        trust_elements: [
          "10.000+ pedidos entregues",
          "98% satisfação clientes",
          "Entrega em 24-48h",
          "Marca registrada"
        ]
      },
      'fitness': {
        subheadline: "Academia premium exclusiva. Transforme seu corpo com equipamentos de última geração e personal trainers especialistas.",
        benefits: [
          "Personal trainers especializados",
          "Equipamentos de última geração",
          "Ambiente premium e exclusivo",
          "Horários flexíveis VIP"
        ],
        social_proof: "💪 Transformações comprovadas diariamente",
        trust_elements: [
          "500+ transformações documentadas",
          "Equipamentos importados",
          "Personal trainers certificados",
          "Ambiente premium"
        ]
      },
      'healthcare': {
        subheadline: "Atendimento médico personalizado com tecnologia de ponta. Sua saúde é nossa prioridade máxima.",
        benefits: [
          "Atendimento médico personalizado",
          "Tecnologia de última geração", 
          "Equipe médica especializada",
          "Horários flexíveis e emergência 24h"
        ],
        social_proof: "🏥 Confiança de milhares de famílias",
        trust_elements: [
          "20+ anos de experiência",
          "Médicos especializados",
          "Tecnologia de ponta",
          "Certificações médicas"
        ]
      }
    };

    const template = heroTemplates[businessType] || heroTemplates['fintech'];
    
    return {
      subheadline: template.subheadline,
      benefits: template.benefits,
      social_proof: template.social_proof,
      trust_elements: template.trust_elements,
      psychology_optimized: psychology
    };
  }

  /**
   * Gera meta content para SEO
   */
  generateMetaContent(contextDNA, requirements) {
    const businessType = requirements.businessType;
    const keywords = requirements.seoKeywords;
    const audience = requirements.audience;
    
    const metaTemplates = {
      'fintech': {
        title: "Escola de Trading Profissional | Método SMC Completo | ETF Trading School",
        description: "Torne-se um trader profissional com nosso método SMC comprovado. 1.000+ alunos aprovados em prop firms. Suporte completo e aprovação garantida.",
        keywords: "trading, forex, SMC, prop firm, curso trading, escola trading, smart money concepts"
      },
      'ecommerce': {
        title: "Streetwear Premium | Roupas Urbanas Originais | Entrega Grátis Brasil",
        description: "Streetwear urbano autêntico com qualidade premium. Entrega grátis, trocas em 30 dias. Marca preferida pelos jovens conectados.",
        keywords: "streetwear, roupas urbanas, moda jovem, roupas premium, loja online"
      },
      'fitness': {
        title: "Academia Elite Premium | Personal Trainers Especializados | Transformação Real", 
        description: "Academia premium exclusiva com equipamentos de última geração. Personal trainers especializados, ambiente VIP. Transforme seu corpo com excelência.",
        keywords: "academia premium, personal trainer, fitness, musculação, transformação corporal"
      },
      'healthcare': {
        title: "Clínica Médica Premium | Atendimento Especializado | Tecnologia de Ponta",
        description: "Atendimento médico personalizado com equipe especializada. Tecnologia de última geração, cuidado humanizado. Sua saúde em primeiro lugar.",
        keywords: "clínica médica, médicos especialistas, atendimento médico, saúde, consulta médica"
      }
    };

    const template = metaTemplates[businessType] || metaTemplates['fintech'];

    return {
      title: template.title,
      description: template.description,
      keywords: template.keywords,
      og_title: template.title,
      og_description: template.description,
      twitter_title: template.title,
      twitter_description: template.description
    };
  }

  /**
   * Gera variantes A/B para testes
   */
  generateABVariants(contextDNA, headlines, ctas) {
    const psychology = contextDNA.psychology.primary;
    
    return {
      headlines: {
        variant_a: headlines.primary,
        variant_b: headlines.variants[0],
        variant_c: headlines.variants[1],
        test_focus: "psychological_trigger"
      },
      ctas: {
        variant_a: ctas.primary,
        variant_b: ctas.secondary, 
        variant_c: ctas.variants[0],
        test_focus: "conversion_optimization"
      },
      value_propositions: this.generateValuePropositionVariants(contextDNA),
      social_proof: this.generateSocialProofVariants(contextDNA)
    };
  }

  /**
   * Gera microcopy otimizado
   */
  generateMicrocopy(contextDNA, requirements) {
    const businessType = requirements.businessType;
    const psychology = requirements.psychology.primary;

    return {
      form_labels: this.generateFormLabels(businessType, psychology),
      error_messages: this.generateErrorMessages(psychology),
      success_messages: this.generateSuccessMessages(businessType),
      navigation: this.generateNavigationLabels(businessType),
      buttons: this.generateButtonLabels(psychology),
      loading_states: this.generateLoadingMessages(psychology),
      empty_states: this.generateEmptyStateMessages(businessType),
      tooltips: this.generateTooltips(businessType)
    };
  }

  /**
   * Organiza todos os assets de conteúdo
   */
  organizeContentAssets(contentData, contextDNA) {
    const projectPath = path.dirname(contextDNA.filePath || '');
    const contentPath = path.join(projectPath, 'content');
    
    // Cria diretório de conteúdo
    if (!fs.existsSync(contentPath)) {
      fs.mkdirSync(contentPath, { recursive: true });
    }

    const organizedAssets = {
      ...contentData,
      generated: new Date().toISOString(),
      context: {
        businessType: contextDNA.project.businessType,
        psychology: contextDNA.psychology.primary,
        audience: contextDNA.audience.primaryAge
      },
      files: []
    };

    // Salva cada categoria de conteúdo
    this.saveContentFile(contentPath, 'headlines.json', contentData.headlines);
    this.saveContentFile(contentPath, 'ctas.json', contentData.ctas);
    this.saveContentFile(contentPath, 'sections.json', contentData.sectionContent);
    this.saveContentFile(contentPath, 'meta-content.json', contentData.metaContent);
    this.saveContentFile(contentPath, 'ab-variants.json', contentData.abVariants);
    this.saveContentFile(contentPath, 'microcopy.json', contentData.microcopy);

    // Gera arquivo consolidado
    const allContentPath = path.join(contentPath, 'all-content.json');
    fs.writeFileSync(allContentPath, JSON.stringify(organizedAssets, null, 2));
    organizedAssets.files.push(allContentPath);

    console.log(`💾 Content assets salvos em: ${contentPath}`);
    
    return organizedAssets;
  }

  // Métodos auxiliares
  saveContentFile(basePath, filename, data) {
    const filePath = path.join(basePath, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  defineContentStrategy(psychology, audience) {
    const strategies = {
      'trust': 'authority_based',
      'urgency': 'scarcity_driven', 
      'value': 'benefit_focused'
    };
    return strategies[psychology.primary] || 'trust_building';
  }

  defineVoiceAndTone(brand, audience) {
    return {
      voice: brand.voiceTone || 'professional_confident',
      tone: audience.primaryAge === 'gen_z' ? 'casual_energetic' : 'professional_warm'
    };
  }

  identifyConversionTriggers(psychology, businessType) {
    const triggers = {
      'trust': ['social_proof', 'testimonials', 'guarantees'],
      'urgency': ['scarcity', 'time_limit', 'fomo'],
      'value': ['roi', 'comparison', 'benefits']
    };
    return triggers[psychology.primary] || triggers['trust'];
  }

  defineContentPriorities(businessType) {
    const priorities = {
      'fintech': ['trust', 'results', 'methodology', 'support'],
      'ecommerce': ['products', 'offers', 'social_proof', 'guarantee'],
      'fitness': ['transformation', 'results', 'exclusivity', 'expertise'], 
      'healthcare': ['care', 'expertise', 'technology', 'trust']
    };
    return priorities[businessType] || priorities['fintech'];
  }

  generateSEOKeywords(businessType, audience) {
    const keywords = {
      'fintech': ['trading', 'forex', 'investimentos', 'curso trading', 'prop firm', 'SMC'],
      'ecommerce': ['streetwear', 'roupas urbanas', 'moda jovem', 'loja online'],
      'fitness': ['academia premium', 'personal trainer', 'fitness', 'transformação'],
      'healthcare': ['clínica médica', 'médicos especialistas', 'atendimento médico']
    };
    return keywords[businessType] || keywords['fintech'];
  }

  identifyEmotionalDrivers(psychology, audience) {
    const drivers = {
      'trust': ['security', 'reliability', 'credibility'],
      'urgency': ['fomo', 'scarcity', 'competition'],
      'value': ['roi', 'efficiency', 'smart_choice']
    };
    return drivers[psychology.primary] || drivers['trust'];
  }

  // Métodos de otimização
  optimizeForAudience(headlines, audience) {
    const optimizations = {
      'gen_z': headlines.map(h => h.replace(/Profissional/g, 'Pro').replace(/Transforme/g, 'Mude')),
      'millennial': headlines.map(h => h.replace(/Pro/g, 'Profissional')),
      'gen_x': headlines.map(h => h.replace(/Mude/g, 'Transforme'))
    };
    return optimizations[audience] || headlines;
  }

  addConversionElements(headlines, triggers) {
    return headlines.map(headline => {
      if (triggers.includes('scarcity')) return headline + ' (Vagas Limitadas)';
      if (triggers.includes('social_proof')) return headline + ' - Método Comprovado';
      return headline;
    });
  }

  addUrgencyElements(ctas, triggers) {
    return ctas.map(cta => {
      if (triggers.includes('scarcity')) return cta + ' Hoje';
      if (triggers.includes('time_limit')) return cta + ' Agora';
      return cta;
    });
  }

  addTrustElements(ctas, triggers) {
    return ctas.map(cta => {
      if (triggers.includes('guarantees')) return cta + ' Com Segurança';
      if (triggers.includes('social_proof')) return cta + ' (Confiável)';
      return cta;
    });
  }

  // Métodos de geração específicos
  generateAboutContent(contextDNA, requirements) {
    return {
      mission: `Nossa missão é transformar ${requirements.audience.demographics.age} anos em profissionais de ${requirements.businessType} através de metodologia comprovada.`,
      vision: "Ser referência em formação profissional com resultados mensuráveis.",
      values: ["Excelência", "Transparência", "Resultados", "Comunidade"]
    };
  }

  generateFeaturesContent(contextDNA, requirements) {
    const businessType = requirements.businessType;
    const features = {
      'fintech': [
        { title: "Método SMC Completo", description: "Smart Money Concepts aplicados na prática" },
        { title: "Suporte 24/7", description: "Comunidade ativa de traders experientes" },
        { title: "Aprovação Garantida", description: "Metodologia testada em prop firms" }
      ],
      'fitness': [
        { title: "Personal Premium", description: "Treinadores especializados e certificados" },
        { title: "Equipamentos Importados", description: "Tecnologia de ponta para resultados" },
        { title: "Ambiente Exclusivo", description: "Espaço VIP para poucos membros" }
      ]
    };
    return features[businessType] || features['fintech'];
  }

  generateBenefitsContent(contextDNA, requirements) {
    return {
      primary_benefit: "Resultados comprovados em menos tempo",
      secondary_benefits: [
        "Methodology cientificamente validada",
        "Comunidade de suporte ativa",
        "Acompanhamento personalizado",
        "Garantia de satisfação"
      ]
    };
  }

  generateTestimonialsContent(contextDNA, requirements) {
    const businessType = requirements.businessType;
    const testimonials = {
      'fintech': [
        { name: "João Silva", role: "Trader", text: "Em 3 meses consegui aprovação na FTMO. Método realmente funciona!" },
        { name: "Maria Santos", role: "Iniciante", text: "Nunca pensei que conseguiria viver de trading. Obrigada ETF!" }
      ],
      'fitness': [
        { name: "Carlos Lima", role: "Executivo", text: "Perdi 15kg em 4 meses. Personal fez toda a diferença!" },
        { name: "Ana Costa", role: "Médica", text: "Ambiente premium e resultados reais. Vale cada centavo!" }
      ]
    };
    return testimonials[businessType] || testimonials['fintech'];
  }

  generatePricingContent(contextDNA, requirements) {
    return {
      value_proposition: "Investimento que se paga em resultados",
      guarantee: "30 dias de garantia total",
      payment_options: "12x sem juros no cartão",
      bonus_items: ["Bônus exclusivos", "Acesso vitalício", "Comunidade VIP"]
    };
  }

  generateFAQContent(contextDNA, requirements) {
    const businessType = requirements.businessType;
    const faqs = {
      'fintech': [
        { q: "Quanto tempo para ser aprovado?", a: "Em média 90 dias seguindo nossa metodologia." },
        { q: "Preciso de capital inicial?", a: "Não, trabalhamos com prop firms que fornecem capital." },
        { q: "Há garantia de aprovação?", a: "Sim, seguindo o método corretamente, aprovação é garantida." }
      ],
      'fitness': [
        { q: "Qual a duração mínima?", a: "Recomendamos pelo menos 6 meses para resultados duradouros." },
        { q: "Preciso de experiência?", a: "Não, nosso método funciona para todos os níveis." },
        { q: "Há avaliação física?", a: "Sim, fazemos avaliação completa no primeiro dia." }
      ]
    };
    return faqs[businessType] || faqs['fintech'];
  }

  generateFooterContent(contextDNA, requirements) {
    return {
      company_description: `Transformando vidas através de ${requirements.businessType} profissional desde 2019.`,
      contact_info: {
        email: "contato@empresa.com", 
        phone: "(11) 99999-9999",
        address: "São Paulo, SP"
      },
      social_links: ["Instagram", "YouTube", "LinkedIn"],
      legal_links: ["Termos de Uso", "Política de Privacidade", "LGPD"]
    };
  }

  // Métodos de microcopy
  generateFormLabels(businessType, psychology) {
    return {
      name: psychology === 'trust' ? 'Seu nome completo' : 'Nome',
      email: psychology === 'trust' ? 'Email principal (verificado)' : 'Seu melhor email',
      phone: psychology === 'urgency' ? 'WhatsApp para contato rápido' : 'Telefone'
    };
  }

  generateErrorMessages(psychology) {
    const messages = {
      'trust': 'Por favor, verifique os dados inseridos',
      'urgency': 'Oops! Corrija os campos destacados para continuar',
      'value': 'Alguns campos precisam ser ajustados'
    };
    return { generic: messages[psychology] || messages['trust'] };
  }

  generateSuccessMessages(businessType) {
    const messages = {
      'fintech': 'Perfeito! Em breve você receberá acesso ao método completo.',
      'fitness': 'Excelente! Sua transformação começa agora.',
      'ecommerce': 'Pedido confirmado! Seu produto chegará em breve.'
    };
    return { generic: messages[businessType] || messages['fintech'] };
  }

  generateNavigationLabels(businessType) {
    const labels = {
      'fintech': ['Início', 'Método', 'Resultados', 'Preços', 'Contato'],
      'fitness': ['Início', 'Treinos', 'Transformações', 'Planos', 'Contato'],
      'ecommerce': ['Início', 'Produtos', 'Promoções', 'Sobre', 'Contato']
    };
    return labels[businessType] || labels['fintech'];
  }

  generateButtonLabels(psychology) {
    const labels = {
      'trust': { submit: 'Enviar com Segurança', cancel: 'Cancelar' },
      'urgency': { submit: 'Garantir Agora', cancel: 'Voltar' },
      'value': { submit: 'Aproveitar Benefício', cancel: 'Revisar' }
    };
    return labels[psychology] || labels['trust'];
  }

  generateLoadingMessages(psychology) {
    const messages = {
      'trust': 'Processando com segurança...',
      'urgency': 'Garantindo sua vaga...',
      'value': 'Preparando seus benefícios...'
    };
    return { generic: messages[psychology] || messages['trust'] };
  }

  generateEmptyStateMessages(businessType) {
    const messages = {
      'fintech': 'Seus resultados aparecerão aqui em breve',
      'fitness': 'Suas transformações serão exibidas aqui',
      'ecommerce': 'Seu carrinho está vazio'
    };
    return { generic: messages[businessType] || messages['fintech'] };
  }

  generateTooltips(businessType) {
    return {
      help: 'Clique aqui para ajuda especializada',
      info: 'Mais informações sobre este recurso',
      contact: 'Entre em contato conosco'
    };
  }

  generateValuePropositionVariants(contextDNA) {
    const businessType = contextDNA.project.businessType;
    const variants = {
      'fintech': [
        'Do zero ao trader profissional em 90 dias',
        'Método comprovado por 1.000+ aprovações',
        'Trading profissional com suporte completo'
      ]
    };
    return variants[businessType] || variants['fintech'];
  }

  generateSocialProofVariants(contextDNA) {
    return [
      '⭐⭐⭐⭐⭐ 4.9/5 baseado em 500+ avaliações',
      '🏆 Mais de 1.000 alunos formados com sucesso',
      '💯 95% taxa de aprovação comprovada'
    ];
  }

  /**
   * Gera relatório de conteúdo criado
   */
  generateContentReport(contentAssets, contextDNA) {
    return `# 📝 NEXUS Content Generation - Relatório

## 📊 **Resumo da Geração**
- **Business Type:** ${contextDNA.project.businessType}
- **Psychology Focus:** ${contextDNA.psychology.primary}
- **Target Audience:** ${contextDNA.audience.primaryAge}
- **Gerado em:** ${contentAssets.generated}
- **Status:** Sucesso ✅

## 🎯 **Headlines Contextuais**
- **Principal:** ${contentAssets.headlines.primary}
- **Variantes A/B:** ${contentAssets.headlines.variants.length} opções
- **Foco Psicológico:** ${contentAssets.headlines.psychological_focus}

## 🚀 **CTAs Otimizados**
- **Primário:** "${contentAssets.ctas.primary}"
- **Secundário:** "${contentAssets.ctas.secondary}"
- **Variantes:** ${contentAssets.ctas.variants.length} alternativas
- **Foco:** Conversão por ${contentAssets.ctas.psychological_focus}

## 📄 **Conteúdo das Seções**
- **Hero:** Subheadline + benefícios + prova social
- **Sobre:** Missão, visão, valores contextuais
- **Features:** ${contentAssets.sectionContent.features.length} recursos principais
- **FAQ:** ${contentAssets.sectionContent.faq.length} perguntas estratégicas

## 🔤 **Microcopy Otimizado**
- **Form Labels:** Psychology-driven
- **Error Messages:** Tone-consistent
- **Success Messages:** Business-specific
- **Navigation:** Contextual labels

## 🧪 **Variantes A/B**
- **Headlines:** 3 variantes para teste
- **CTAs:** 3 variantes para otimização
- **Value Props:** ${contentAssets.abVariants.value_propositions.length} proposições
- **Social Proof:** ${contentAssets.abVariants.social_proof.length} variações

## 📈 **Meta Content SEO**
- **Title:** ${contentAssets.metaContent.title}
- **Description:** ${contentAssets.metaContent.description}
- **Keywords:** ${contentAssets.metaContent.keywords}

## 💎 **Aplicação Contextual**
Todo o conteúdo foi otimizado baseado em:
- **Business Type:** ${contextDNA.project.businessType}
- **Target Psychology:** ${contextDNA.psychology.primary}
- **Audience Age:** ${contextDNA.audience.primaryAge}
- **Conversion Strategy:** ${contentAssets.context.businessType}-specific

## 🚀 **Próximos Passos**
1. Integrar conteúdo no Code Agent
2. Implementar testes A/B das variantes
3. Monitorar performance das headlines
4. Otimizar CTAs baseado em conversões
5. Testar microcopy com usuários reais

---
*Gerado por ${this.name} em ${new Date().toISOString()}*
`;
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
📝 NEXUS Content Agent v1.0.0

Uso:
  node nexus-content-agent.js <context-dna-path>

Exemplo:
  node nexus-content-agent.js ../projects/etf-landing/context-dna.json
    `);
    process.exit(1);
  }

  const contextDNAPath = args[0];
  
  // Verifica se o arquivo existe
  if (!fs.existsSync(contextDNAPath)) {
    console.error(`❌ Arquivo não encontrado: ${contextDNAPath}`);
    process.exit(1);
  }
  
  const agent = new NexusContentAgent();
  
  console.log('🚀 Iniciando geração de conteúdo contextual...');
  console.log(`📄 Context DNA: ${contextDNAPath}`);
  console.log('');

  try {
    const contentAssets = await agent.processContextDNA(contextDNAPath);
    
    // Gera relatório
    const contextDNA = JSON.parse(fs.readFileSync(contextDNAPath, 'utf8'));
    const report = agent.generateContentReport(contentAssets, contextDNA);
    
    const reportPath = path.join(path.dirname(contextDNAPath), 'content-report.md');
    fs.writeFileSync(reportPath, report);
    
    console.log('');
    console.log('✅ Conteúdo contextual gerado com sucesso!');
    console.log('📊 Estatísticas:');
    console.log(`   - Headlines: 1 principal + ${contentAssets.headlines.variants.length} variantes`);
    console.log(`   - CTAs: 1 primário + ${contentAssets.ctas.variants.length} variantes`);
    console.log(`   - Seções: ${Object.keys(contentAssets.sectionContent).length} completas`);
    console.log(`   - A/B Variants: Headlines + CTAs + Value Props`);
    console.log(`   - Microcopy: Forms + Buttons + Messages`);
    console.log(`   - SEO Content: Title + Description + Keywords`);
    console.log('');
    console.log('📁 Arquivos gerados:');
    console.log(`   - Content: ${path.dirname(contextDNAPath)}/content/`);
    console.log(`   - Relatório: ${reportPath}`);
    console.log('');
    console.log('🎯 Próximo passo: Use o conteúdo no Code Agent');
    
  } catch (error) {
    console.error('❌ Erro ao gerar conteúdo:', error.message);
    process.exit(1);
  }
}

// Executa se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = NexusContentAgent;