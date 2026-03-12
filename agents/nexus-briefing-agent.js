#!/usr/bin/env node

/*
 * NEXUS BRIEFING AGENT
 * Gera perguntas inteligentes de briefing baseadas no perfil da empresa
 * e estrutura as respostas em um creative brief completo.
 * 
 * Input:  company-profile.json (do Discovery Agent) ou context-dna.json
 * Output: creative-brief.json + briefing-report.html
 * 
 * Modo batch: lê perfil, gera perguntas, processa respostas, gera brief
 * Modo demo:  executa pipeline completo com dados de exemplo
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURAÇÃO DE NICHOS E PERGUNTAS ADAPTATIVAS
// ============================================================================

const SECTOR_QUESTIONS = {
  trading: [
    {
      id: 'trading_audience_level',
      question: 'Qual o nível do trader que vocês buscam?',
      options: ['Iniciante', 'Intermediário', 'Avançado', 'Todos os níveis'],
      required: true
    },
    {
      id: 'trading_instruments',
      question: 'Quais instrumentos/mercados vocês operam?',
      options: ['Forex', 'Índices', 'Criptomoedas', 'Commodities', 'Ações', 'Todos'],
      multiSelect: true
    },
    {
      id: 'trading_platform',
      question: 'Qual plataforma de trading utilizam?',
      options: ['MetaTrader 4', 'MetaTrader 5', 'cTrader', 'Proprietária', 'Outra'],
      type: 'single'
    },
    {
      id: 'trading_payout',
      question: 'Qual o ciclo de payout para os traders?',
      type: 'open'
    }
  ],
  fintech: [
    {
      id: 'fintech_regulation',
      question: 'A empresa possui regulamentação/licença financeira?',
      options: ['Sim, Bacen', 'Sim, CVM', 'Sim, outra', 'Em processo', 'Não aplicável'],
      type: 'single'
    },
    {
      id: 'fintech_security',
      question: 'Quais certificações de segurança possuem?',
      options: ['PCI DSS', 'ISO 27001', 'SOC 2', 'Nenhuma específica', 'Outra'],
      multiSelect: true
    },
    {
      id: 'fintech_onboarding',
      question: 'Como funciona o onboarding do cliente?',
      type: 'open'
    }
  ],
  ecommerce: [
    {
      id: 'ecom_products',
      question: 'Quantos produtos/SKUs tem no catálogo?',
      options: ['1-10', '10-50', '50-200', '200+'],
      type: 'single'
    },
    {
      id: 'ecom_shipping',
      question: 'Como funciona a logística de entrega?',
      type: 'open'
    },
    {
      id: 'ecom_payment',
      question: 'Quais formas de pagamento aceita?',
      options: ['Pix', 'Cartão', 'Boleto', 'Parcelamento', 'Todas'],
      multiSelect: true
    }
  ],
  saas: [
    {
      id: 'saas_model',
      question: 'Qual o modelo de precificação?',
      options: ['Freemium', 'Free trial', 'Planos mensais', 'Anual', 'Enterprise'],
      multiSelect: true
    },
    {
      id: 'saas_users',
      question: 'Quantos usuários ativos vocês têm?',
      options: ['Pré-lançamento', 'Até 100', '100-1.000', '1.000-10.000', '10.000+'],
      type: 'single'
    },
    {
      id: 'saas_integrations',
      question: 'Com quais ferramentas o produto integra?',
      type: 'open'
    }
  ],
  healthcare: [
    {
      id: 'health_specialty',
      question: 'Qual a especialidade médica principal?',
      type: 'open'
    },
    {
      id: 'health_booking',
      question: 'Precisa de agendamento online?',
      options: ['Sim, integrado', 'Sim, via WhatsApp', 'Não'],
      type: 'single'
    },
    {
      id: 'health_insurance',
      question: 'Aceita convênios? Quais?',
      type: 'open'
    }
  ],
  education: [
    {
      id: 'edu_format',
      question: 'Qual o formato dos cursos?',
      options: ['Online ao vivo', 'Gravado', 'Presencial', 'Híbrido'],
      multiSelect: true
    },
    {
      id: 'edu_platform',
      question: 'Usa alguma plataforma de ensino?',
      options: ['Hotmart', 'Kiwify', 'Própria', 'Outra', 'Não definido'],
      type: 'single'
    }
  ],
  fitness: [
    {
      id: 'fitness_type',
      question: 'Qual o tipo de serviço?',
      options: ['Musculação', 'CrossFit', 'Funcional', 'Personal', 'Online', 'Multi'],
      multiSelect: true
    },
    {
      id: 'fitness_membership',
      question: 'Como funciona a matrícula/planos?',
      type: 'open'
    }
  ],
  agency: [
    {
      id: 'agency_services',
      question: 'Quais os principais serviços oferecidos?',
      type: 'open'
    },
    {
      id: 'agency_portfolio',
      question: 'Tem cases/portfólio para exibir?',
      options: ['Sim, muitos', 'Sim, alguns', 'Poucos', 'Nenhum ainda'],
      type: 'single'
    }
  ],
  real_estate: [
    {
      id: 'realestate_type',
      question: 'Qual o tipo de imóvel?',
      options: ['Residencial', 'Comercial', 'Loteamento', 'Alto padrão', 'Misto'],
      multiSelect: true
    },
    {
      id: 'realestate_region',
      question: 'Em qual região/cidade atua?',
      type: 'open'
    }
  ],
  food: [
    {
      id: 'food_delivery',
      question: 'Faz delivery? Por qual plataforma?',
      options: ['iFood', 'Rappi', 'Próprio', 'Não faz delivery'],
      multiSelect: true
    },
    {
      id: 'food_reservation',
      question: 'Precisa de sistema de reservas?',
      options: ['Sim', 'Não', 'Já tem'],
      type: 'single'
    }
  ]
};

const SECTION_SUGGESTIONS = {
  trading: [
    { id: 'hero', title: 'Hero', required: true },
    { id: 'how-it-works', title: 'Como Funciona', required: true },
    { id: 'plans', title: 'Planos de Conta', required: true },
    { id: 'payouts', title: 'Payouts / Resultados', required: true },
    { id: 'rules', title: 'Regras e Condições', required: true },
    { id: 'testimonials', title: 'Depoimentos de Traders', required: true },
    { id: 'dashboard', title: 'Preview da Plataforma', required: false },
    { id: 'partners', title: 'Parceiros / Corretoras', required: false },
    { id: 'faq', title: 'FAQ', required: true },
    { id: 'cta', title: 'CTA Final', required: true }
  ],
  fintech: [
    { id: 'hero', title: 'Hero', required: true },
    { id: 'features', title: 'Funcionalidades', required: true },
    { id: 'security', title: 'Segurança', required: true },
    { id: 'how-it-works', title: 'Como Funciona', required: true },
    { id: 'plans', title: 'Planos / Preços', required: false },
    { id: 'testimonials', title: 'Depoimentos', required: true },
    { id: 'partners', title: 'Parceiros', required: false },
    { id: 'faq', title: 'FAQ', required: true },
    { id: 'cta', title: 'CTA Final', required: true }
  ],
  ecommerce: [
    { id: 'hero', title: 'Hero / Banner', required: true },
    { id: 'featured', title: 'Produtos Destaque', required: true },
    { id: 'categories', title: 'Categorias', required: true },
    { id: 'benefits', title: 'Benefícios / Diferenciais', required: true },
    { id: 'testimonials', title: 'Avaliações', required: true },
    { id: 'shipping', title: 'Entrega / Frete', required: false },
    { id: 'faq', title: 'FAQ', required: false },
    { id: 'newsletter', title: 'Newsletter', required: false },
    { id: 'cta', title: 'CTA Final', required: true }
  ],
  saas: [
    { id: 'hero', title: 'Hero', required: true },
    { id: 'features', title: 'Funcionalidades', required: true },
    { id: 'how-it-works', title: 'Como Funciona', required: true },
    { id: 'pricing', title: 'Preços', required: true },
    { id: 'integrations', title: 'Integrações', required: false },
    { id: 'testimonials', title: 'Depoimentos', required: true },
    { id: 'comparison', title: 'Comparativo', required: false },
    { id: 'faq', title: 'FAQ', required: true },
    { id: 'cta', title: 'CTA / Free Trial', required: true }
  ],
  healthcare: [
    { id: 'hero', title: 'Hero', required: true },
    { id: 'services', title: 'Serviços / Especialidades', required: true },
    { id: 'team', title: 'Equipe Médica', required: true },
    { id: 'structure', title: 'Infraestrutura', required: false },
    { id: 'testimonials', title: 'Depoimentos', required: true },
    { id: 'insurance', title: 'Convênios', required: false },
    { id: 'booking', title: 'Agendamento', required: true },
    { id: 'location', title: 'Localização', required: true },
    { id: 'faq', title: 'FAQ', required: false },
    { id: 'cta', title: 'CTA / Agendar', required: true }
  ],
  general: [
    { id: 'hero', title: 'Hero', required: true },
    { id: 'about', title: 'Sobre', required: true },
    { id: 'services', title: 'Serviços', required: true },
    { id: 'differentials', title: 'Diferenciais', required: true },
    { id: 'testimonials', title: 'Depoimentos', required: true },
    { id: 'faq', title: 'FAQ', required: false },
    { id: 'contact', title: 'Contato', required: true },
    { id: 'cta', title: 'CTA Final', required: true }
  ]
};

const TONE_OPTIONS = [
  { id: 'premium', label: 'Premium / Sofisticado', description: 'Linguagem elevada, exclusividade' },
  { id: 'casual', label: 'Casual / Descontraído', description: 'Próximo, amigável, leve' },
  { id: 'formal', label: 'Formal / Corporativo', description: 'Sério, profissional, institucional' },
  { id: 'aggressive', label: 'Agressivo / Vendedor', description: 'Urgência, escassez, direto' },
  { id: 'tech', label: 'Tech / Inovador', description: 'Moderno, futurista, disruptivo' },
  { id: 'warm', label: 'Acolhedor / Humano', description: 'Empático, cuidadoso, próximo' },
  { id: 'bold', label: 'Ousado / Provocador', description: 'Desafia o status quo, diferente' }
];

const STYLE_PRESETS = {
  trading: 'dark-premium',
  fintech: 'modern-trust',
  ecommerce: 'clean-commercial',
  saas: 'modern-minimal',
  healthcare: 'clean-trust',
  education: 'friendly-modern',
  fitness: 'bold-energy',
  agency: 'creative-bold',
  real_estate: 'elegant-classic',
  food: 'warm-inviting',
  general: 'modern-clean'
};

// ============================================================================
// CLASSE PRINCIPAL
// ============================================================================

class NexusBriefingAgent {
  constructor() {
    this.name = 'NEXUS Briefing Agent';
    this.version = '1.0.0';
    this.projectsDir = path.join(__dirname, '..', 'projects');
  }

  // --------------------------------------------------------------------------
  // GERAÇÃO DE PERGUNTAS ADAPTATIVAS
  // --------------------------------------------------------------------------

  generateQuestions(companyProfile) {
    const questions = [];
    const profile = this._normalizeProfile(companyProfile);
    const sector = this._detectSector(profile);

    // === BLOCO 1: OBJETIVO ===
    questions.push({
      id: 'objective',
      category: 'Objetivo',
      question: 'Qual o principal objetivo desse site?',
      options: [
        'Captar leads/clientes',
        'Vender produto/serviço diretamente',
        'Institucional / credibilidade',
        'Landing page para campanha',
        'Portfolio / Showcase',
        'Outro'
      ],
      required: true,
      skip: false
    });

    // === BLOCO 2: SETOR (só se não detectado) ===
    if (!sector || sector === 'general') {
      questions.push({
        id: 'sector',
        category: 'Negócio',
        question: 'Qual o setor/nicho do negócio?',
        type: 'open',
        required: true,
        skip: false
      });
    }

    // === BLOCO 3: PÚBLICO ===
    if (!profile.audience || !profile.audience.primaryAge) {
      questions.push({
        id: 'audience',
        category: 'Público',
        question: 'Quem é o cliente ideal? Descreva o perfil (idade, cargo, nível de conhecimento).',
        type: 'open',
        required: true,
        skip: false,
        hint: this._getAudienceHint(sector)
      });
    }

    // === BLOCO 4: DIFERENCIAL ===
    if (!profile.differentials || profile.differentials.length === 0) {
      questions.push({
        id: 'differentials',
        category: 'Diferencial',
        question: 'O que torna a empresa única? Liste os principais diferenciais.',
        type: 'open',
        required: true,
        skip: false
      });
    }

    // === BLOCO 5: REFERÊNCIAS ===
    questions.push({
      id: 'references',
      category: 'Referências',
      question: 'Tem sites que admira e gostaria de usar como referência? (pode enviar links)',
      type: 'open',
      required: false,
      skip: false,
      hint: 'Pode ser concorrentes, sites de outro setor, ou qualquer site que goste do visual.'
    });

    // === BLOCO 6: SEÇÕES ===
    const suggestedSections = SECTION_SUGGESTIONS[sector] || SECTION_SUGGESTIONS.general;
    questions.push({
      id: 'sections',
      category: 'Conteúdo',
      question: 'Quais seções o site deve ter?',
      options: suggestedSections.map(s => `${s.title}${s.required ? ' *' : ''}`),
      multiSelect: true,
      required: true,
      skip: false,
      default: suggestedSections.filter(s => s.required).map(s => s.title),
      hint: 'As marcadas com * são recomendadas para o seu nicho.'
    });

    // === BLOCO 7: TOM ===
    if (!profile.brand || !profile.brand.tone) {
      questions.push({
        id: 'tone',
        category: 'Marca',
        question: 'Como a marca deve se comunicar?',
        options: TONE_OPTIONS.map(t => `${t.label} — ${t.description}`),
        required: true,
        skip: false,
        default: this._suggestTone(sector)
      });
    }

    // === BLOCO 8: CORES ===
    const hasColors = profile.brand && profile.brand.colors && profile.brand.colors.primary;
    if (hasColors) {
      questions.push({
        id: 'colors',
        category: 'Marca',
        question: `Detectamos as cores ${profile.brand.colors.primary} e ${profile.brand.colors.secondary || 'N/A'}. Manter ou alterar?`,
        options: ['Manter as cores atuais', 'Quero cores diferentes', 'Manter mas adicionar cor de destaque'],
        required: true,
        skip: false,
        detected: profile.brand.colors
      });
    } else {
      questions.push({
        id: 'colors',
        category: 'Marca',
        question: 'Tem preferência de cores para o site?',
        type: 'open',
        required: false,
        skip: false,
        hint: 'Se não tiver preferência, vamos criar uma paleta baseada no seu nicho.'
      });
    }

    // === BLOCO 9: URGÊNCIA ===
    questions.push({
      id: 'urgency',
      category: 'Prazo',
      question: 'Qual a urgência desse projeto?',
      options: [
        'Urgente — preciso para ontem',
        'Rápido — essa semana',
        'Normal — 1-2 semanas',
        'Tranquilo — sem pressa'
      ],
      required: true,
      skip: false
    });

    // === BLOCO 10: MATERIAIS ===
    questions.push({
      id: 'materials',
      category: 'Materiais',
      question: 'Quais materiais você já tem prontos?',
      options: [
        'Logo em alta resolução',
        'Fotos profissionais',
        'Textos/copy pronto',
        'Manual da marca / Brand guide',
        'Vídeo institucional',
        'Nenhum — preciso de tudo'
      ],
      multiSelect: true,
      required: true,
      skip: false
    });

    // === BLOCO 11: EXTRAS ===
    questions.push({
      id: 'extras',
      category: 'Funcionalidades',
      question: 'Precisa de alguma funcionalidade especial?',
      options: [
        'Formulário de contato/lead',
        'Chat / WhatsApp widget',
        'Integração com CRM',
        'Blog',
        'Área de membros',
        'Animações avançadas',
        'Background 3D',
        'Multi-idioma',
        'Nenhuma extra'
      ],
      multiSelect: true,
      required: false,
      skip: false
    });

    // === PERGUNTAS ESPECÍFICAS DO NICHO ===
    const sectorQuestions = SECTOR_QUESTIONS[sector];
    if (sectorQuestions) {
      sectorQuestions.forEach(q => {
        questions.push({
          ...q,
          category: 'Específico do Nicho',
          skip: false
        });
      });
    }

    return {
      project: profile.name || 'unknown',
      sector: sector,
      total_questions: questions.length,
      questions: questions,
      generated_at: new Date().toISOString(),
      agent: this.name
    };
  }

  // --------------------------------------------------------------------------
  // PROCESSAMENTO DE RESPOSTAS -> CREATIVE BRIEF
  // --------------------------------------------------------------------------

  generateCreativeBrief(companyProfile, answers) {
    const profile = this._normalizeProfile(companyProfile);
    const sector = this._detectSector(profile);
    const projectId = profile.name ? this._slugify(profile.name) : 'unknown-project';

    // Mesclar dados do perfil com respostas do briefing
    const objective = this._parseObjective(answers.objective);
    const audience = this._buildAudience(profile, answers);
    const brand = this._buildBrand(profile, answers, sector);
    const sections = this._buildSections(answers, sector);
    const technical = this._buildTechnical(answers);
    const materials = this._parseMaterials(answers.materials);

    const brief = {
      project_id: projectId,
      version: 1,
      created_at: new Date().toISOString(),
      agent: this.name,

      company: {
        name: profile.name || answers.company_name || 'N/A',
        sector: sector,
        sector_label: this._sectorLabel(sector),
        description: profile.description || answers.description || '',
        differentials: this._parseDifferentials(profile, answers),
        current_presence: {
          website: profile.website || null,
          social: profile.social || {},
          detected_tech: profile.tech || []
        }
      },

      project: {
        objective: objective.type,
        objective_detail: objective.detail,
        type: this._inferProjectType(objective),
        urgency: this._parseUrgency(answers.urgency),
        deadline: this._calcDeadline(answers.urgency)
      },

      audience: audience,

      brand: brand,

      content: {
        sections: sections,
        references: this._parseReferences(answers.references)
      },

      technical: technical,

      materials_provided: materials,

      // Perguntas específicas do nicho (respostas brutas)
      sector_specifics: this._extractSectorAnswers(answers, sector),

      completeness_score: 0,
      ready_for_pipeline: false
    };

    // Calcular completude
    brief.completeness_score = this._calculateCompleteness(brief);
    brief.ready_for_pipeline = brief.completeness_score >= 70;

    return brief;
  }

  // --------------------------------------------------------------------------
  // HELPERS DE PARSING
  // --------------------------------------------------------------------------

  _normalizeProfile(raw) {
    if (!raw) return {};
    // Suporta tanto company-profile.json quanto context-dna.json
    if (raw.project && raw.audience) {
      // context-dna.json format
      return {
        name: raw.project.name || raw.project.businessType || '',
        sector: raw.project.businessType,
        description: raw.project.description || '',
        audience: raw.audience,
        brand: raw.visual || raw.brand || {},
        website: raw.project.website || null,
        social: raw.project.social || {},
        tech: raw.technical ? raw.technical.stack : [],
        differentials: raw.project.differentials || []
      };
    }
    if (raw.company) {
      // company-profile.json format
      return {
        name: raw.company.name || '',
        sector: raw.company.sector,
        description: raw.company.description || '',
        audience: raw.audience || {},
        brand: raw.brand || {},
        website: raw.company.website || null,
        social: raw.company.social || {},
        tech: raw.company.tech || [],
        differentials: raw.company.differentials || []
      };
    }
    return raw;
  }

  _detectSector(profile) {
    if (profile.sector) {
      const s = profile.sector.toLowerCase();
      if (s.includes('trading') || s.includes('prop')) return 'trading';
      if (s.includes('fintech') || s.includes('financ')) return 'fintech';
      if (s.includes('ecommerce') || s.includes('loja') || s.includes('commerce')) return 'ecommerce';
      if (s.includes('saas') || s.includes('software')) return 'saas';
      if (s.includes('health') || s.includes('clinic') || s.includes('medic') || s.includes('saude') || s.includes('saúde')) return 'healthcare';
      if (s.includes('educ') || s.includes('curso') || s.includes('ensino')) return 'education';
      if (s.includes('fit') || s.includes('academia') || s.includes('gym')) return 'fitness';
      if (s.includes('agenc') || s.includes('marketing') || s.includes('design')) return 'agency';
      if (s.includes('imov') || s.includes('imóv') || s.includes('real')) return 'real_estate';
      if (s.includes('food') || s.includes('restaurant') || s.includes('comida')) return 'food';
      return s;
    }
    return 'general';
  }

  _getAudienceHint(sector) {
    const hints = {
      trading: 'Ex: Traders intermediários, 25-40 anos, buscando conta financiada',
      fintech: 'Ex: Profissionais 30-50 anos, classe A/B, buscando praticidade financeira',
      ecommerce: 'Ex: Mulheres 20-35, classe B, interessadas em moda sustentável',
      saas: 'Ex: Gerentes de marketing, empresas médias, precisam de automação',
      healthcare: 'Ex: Pacientes 30-60, classe A/B, buscando especialista de confiança',
      general: 'Ex: Idade, profissão, nível de renda, o que buscam'
    };
    return hints[sector] || hints.general;
  }

  _suggestTone(sector) {
    const tones = {
      trading: 'Premium / Sofisticado',
      fintech: 'Tech / Inovador',
      ecommerce: 'Casual / Descontraído',
      saas: 'Tech / Inovador',
      healthcare: 'Acolhedor / Humano',
      education: 'Casual / Descontraído',
      fitness: 'Ousado / Provocador',
      agency: 'Ousado / Provocador',
      real_estate: 'Premium / Sofisticado',
      food: 'Acolhedor / Humano'
    };
    return tones[sector] || 'Formal / Corporativo';
  }

  _parseObjective(raw) {
    if (!raw) return { type: 'unknown', detail: '' };
    const text = typeof raw === 'string' ? raw : raw.toString();
    const lower = text.toLowerCase();
    if (lower.includes('lead') || lower.includes('captar')) return { type: 'lead-generation', detail: text };
    if (lower.includes('vender') || lower.includes('venda')) return { type: 'direct-sales', detail: text };
    if (lower.includes('institucional') || lower.includes('credibilidade')) return { type: 'institutional', detail: text };
    if (lower.includes('landing') || lower.includes('campanha')) return { type: 'landing-page', detail: text };
    if (lower.includes('portfolio') || lower.includes('showcase')) return { type: 'portfolio', detail: text };
    return { type: 'custom', detail: text };
  }

  _inferProjectType(objective) {
    const map = {
      'lead-generation': 'landing-page',
      'direct-sales': 'ecommerce-page',
      'institutional': 'institutional-site',
      'landing-page': 'landing-page',
      'portfolio': 'portfolio-site'
    };
    return map[objective.type] || 'website';
  }

  _buildAudience(profile, answers) {
    const existing = profile.audience || {};
    const raw = answers.audience || '';
    
    return {
      primary: raw || this._formatExistingAudience(existing),
      secondary: answers.audience_secondary || '',
      demographics: existing.demographics || {
        age: this._extractAge(raw),
        gender: this._extractGender(raw),
        income: existing.income || 'N/A',
        location: 'Brasil'
      },
      pain_points: existing.painPoints || this._splitList(answers.pain_points),
      desires: existing.motivations || this._splitList(answers.desires),
      behavior: existing.digitalBehavior || 'multi_device'
    };
  }

  _formatExistingAudience(audience) {
    if (!audience || !audience.demographics) return '';
    const d = audience.demographics;
    return `${d.age || ''}, ${d.income || ''} renda, ${d.tech || ''} tech-savviness`.trim();
  }

  _extractAge(text) {
    if (!text) return 'N/A';
    const match = text.match(/(\d{2})\s*[-a]\s*(\d{2})/);
    return match ? `${match[1]}-${match[2]}` : 'N/A';
  }

  _extractGender(text) {
    if (!text) return 'todos';
    const lower = text.toLowerCase();
    if (lower.includes('mulher') || lower.includes('feminino')) return 'feminino';
    if (lower.includes('homem') || lower.includes('masculino')) return 'masculino';
    return 'todos';
  }

  _buildBrand(profile, answers, sector) {
    const existing = profile.brand || {};
    const toneRaw = answers.tone || existing.tone || this._suggestTone(sector);
    const toneId = this._parseToneId(toneRaw);
    
    let colors = {};
    if (answers.colors) {
      const colorAnswer = answers.colors.toString().toLowerCase();
      if (colorAnswer.includes('manter')) {
        colors = { ...(existing.colors || {}), keep_current: true };
      } else {
        colors = this._parseColors(answers.colors);
      }
    } else if (existing.colors) {
      colors = { ...existing.colors, keep_current: true };
    } else {
      colors = this._defaultColors(sector);
    }

    return {
      tone: toneId,
      tone_label: toneRaw,
      colors: colors,
      fonts: {
        preference: this._suggestFontStyle(sector),
        detected: existing.fonts || []
      },
      style: STYLE_PRESETS[sector] || 'modern-clean'
    };
  }

  _parseToneId(raw) {
    if (!raw) return 'formal';
    const lower = raw.toLowerCase();
    if (lower.includes('premium') || lower.includes('sofisticado')) return 'premium';
    if (lower.includes('casual') || lower.includes('descontra')) return 'casual';
    if (lower.includes('formal') || lower.includes('corporat')) return 'formal';
    if (lower.includes('agressivo') || lower.includes('vendedor')) return 'aggressive';
    if (lower.includes('tech') || lower.includes('inovador')) return 'tech';
    if (lower.includes('acolhedor') || lower.includes('humano')) return 'warm';
    if (lower.includes('ousado') || lower.includes('provocador')) return 'bold';
    return 'formal';
  }

  _parseColors(raw) {
    if (!raw) return {};
    // Tenta extrair hex colors
    const hexes = raw.match(/#[0-9a-fA-F]{3,8}/g) || [];
    if (hexes.length >= 2) {
      return { primary: hexes[0], secondary: hexes[1], accent: hexes[2] || null };
    }
    // Cor por nome
    const colorMap = {
      'azul': '#1a56db', 'vermelho': '#dc2626', 'verde': '#16a34a',
      'amarelo': '#eab308', 'roxo': '#9333ea', 'laranja': '#ea580c',
      'preto': '#111827', 'branco': '#ffffff', 'dourado': '#c9a84c',
      'rosa': '#ec4899', 'ciano': '#06b6d4'
    };
    const result = {};
    const words = raw.toLowerCase().split(/[\s,]+/);
    let idx = 0;
    for (const word of words) {
      if (colorMap[word]) {
        if (idx === 0) result.primary = colorMap[word];
        else if (idx === 1) result.secondary = colorMap[word];
        else if (idx === 2) result.accent = colorMap[word];
        idx++;
      }
    }
    return result;
  }

  _defaultColors(sector) {
    const palettes = {
      trading: { primary: '#1a365d', secondary: '#c9a84c', accent: '#22d3ee' },
      fintech: { primary: '#0f172a', secondary: '#3b82f6', accent: '#10b981' },
      ecommerce: { primary: '#111827', secondary: '#7c3aed', accent: '#f59e0b' },
      saas: { primary: '#1e293b', secondary: '#6366f1', accent: '#22d3ee' },
      healthcare: { primary: '#0c4a6e', secondary: '#0ea5e9', accent: '#10b981' },
      education: { primary: '#1e3a5f', secondary: '#3b82f6', accent: '#f97316' },
      fitness: { primary: '#18181b', secondary: '#ef4444', accent: '#f59e0b' },
      agency: { primary: '#0f0f0f', secondary: '#a855f7', accent: '#ec4899' },
      real_estate: { primary: '#1c1917', secondary: '#b45309', accent: '#d4a574' },
      food: { primary: '#422006', secondary: '#ea580c', accent: '#fbbf24' }
    };
    return palettes[sector] || { primary: '#1e293b', secondary: '#3b82f6', accent: '#10b981' };
  }

  _suggestFontStyle(sector) {
    const styles = {
      trading: 'modern-sans', fintech: 'modern-sans', ecommerce: 'friendly-sans',
      saas: 'geometric-sans', healthcare: 'clean-sans', education: 'friendly-rounded',
      fitness: 'bold-condensed', agency: 'display-creative', real_estate: 'elegant-serif',
      food: 'warm-serif'
    };
    return styles[sector] || 'modern-sans';
  }

  _buildSections(answers, sector) {
    const suggested = SECTION_SUGGESTIONS[sector] || SECTION_SUGGESTIONS.general;
    if (!answers.sections) return suggested;

    const selected = Array.isArray(answers.sections) ? answers.sections : [answers.sections];
    // Marca como required as selecionadas
    return suggested.map(s => ({
      ...s,
      required: selected.some(sel => {
        const clean = sel.replace(' *', '').trim();
        return s.title.toLowerCase() === clean.toLowerCase() || s.id === clean.toLowerCase();
      }) || s.required
    }));
  }

  _buildTechnical(answers) {
    const extras = Array.isArray(answers.extras) ? answers.extras : (answers.extras ? [answers.extras] : []);
    const features = [];
    const integrations = [];

    for (const e of extras) {
      const lower = e.toLowerCase();
      if (lower.includes('formulário') || lower.includes('lead')) integrations.push('contact-form');
      if (lower.includes('chat') || lower.includes('whatsapp')) integrations.push('whatsapp-widget');
      if (lower.includes('crm')) integrations.push('crm');
      if (lower.includes('blog')) features.push('blog');
      if (lower.includes('membro')) features.push('members-area');
      if (lower.includes('animaç')) features.push('scroll-animations');
      if (lower.includes('3d')) features.push('3d-background');
      if (lower.includes('idioma')) features.push('multi-language');
    }

    return {
      type: 'static-html',
      hosting: 'github-pages',
      integrations: integrations,
      special_features: features
    };
  }

  _parseMaterials(raw) {
    if (!raw) return { logo: false, photos: false, copy: false, brand_guide: false, video: false };
    const list = Array.isArray(raw) ? raw : [raw];
    const joined = list.join(' ').toLowerCase();
    return {
      logo: joined.includes('logo'),
      photos: joined.includes('foto'),
      copy: joined.includes('texto') || joined.includes('copy'),
      brand_guide: joined.includes('manual') || joined.includes('brand'),
      video: joined.includes('vídeo') || joined.includes('video')
    };
  }

  _parseDifferentials(profile, answers) {
    if (profile.differentials && profile.differentials.length > 0) return profile.differentials;
    if (!answers.differentials) return [];
    return this._splitList(answers.differentials);
  }

  _parseReferences(raw) {
    if (!raw) return [];
    const text = typeof raw === 'string' ? raw : raw.toString();
    // Extrair URLs
    const urls = text.match(/https?:\/\/[^\s,]+|[a-zA-Z0-9-]+\.[a-z]{2,}[^\s,]*/g) || [];
    return urls.map(url => ({
      url: url.startsWith('http') ? url : `https://${url}`,
      what_they_like: 'Referência visual'
    }));
  }

  _parseUrgency(raw) {
    if (!raw) return 'normal';
    const lower = raw.toString().toLowerCase();
    if (lower.includes('urgente') || lower.includes('ontem')) return 'critical';
    if (lower.includes('rápido') || lower.includes('semana')) return 'high';
    if (lower.includes('normal') || lower.includes('1-2')) return 'normal';
    if (lower.includes('tranquilo') || lower.includes('pressa')) return 'low';
    return 'normal';
  }

  _calcDeadline(urgencyRaw) {
    const urgency = this._parseUrgency(urgencyRaw);
    const now = new Date();
    const days = { critical: 1, high: 3, normal: 10, low: 21 };
    now.setDate(now.getDate() + (days[urgency] || 10));
    return now.toISOString().split('T')[0];
  }

  _extractSectorAnswers(answers, sector) {
    const sectorQs = SECTOR_QUESTIONS[sector];
    if (!sectorQs) return {};
    const result = {};
    for (const q of sectorQs) {
      if (answers[q.id] !== undefined) {
        result[q.id] = answers[q.id];
      }
    }
    return result;
  }

  _sectorLabel(sector) {
    const labels = {
      trading: 'Prop Trading / Mesa Proprietária',
      fintech: 'Fintech / Serviços Financeiros',
      ecommerce: 'E-commerce / Loja Online',
      saas: 'SaaS / Software',
      healthcare: 'Saúde / Clínica',
      education: 'Educação / Cursos',
      fitness: 'Fitness / Academia',
      agency: 'Agência / Marketing',
      real_estate: 'Imobiliário',
      food: 'Alimentação / Restaurante',
      general: 'Geral'
    };
    return labels[sector] || sector;
  }

  _calculateCompleteness(brief) {
    let score = 0;
    let total = 0;

    const check = (val, weight = 1) => {
      total += weight;
      if (val && val !== 'N/A' && val !== 'unknown' && (typeof val !== 'object' || Object.keys(val).length > 0)) {
        score += weight;
      }
    };

    check(brief.company.name, 2);
    check(brief.company.sector !== 'general' ? brief.company.sector : null, 2);
    check(brief.company.description, 1);
    check(brief.company.differentials.length > 0 ? true : null, 2);
    check(brief.project.objective !== 'unknown' ? brief.project.objective : null, 3);
    check(brief.audience.primary, 3);
    check(brief.audience.pain_points.length > 0 ? true : null, 1);
    check(brief.brand.tone, 2);
    check(brief.brand.colors.primary, 2);
    check(brief.content.sections.length > 0 ? true : null, 2);
    check(brief.technical.type, 1);
    check(brief.materials_provided, 1);

    return Math.round((score / total) * 100);
  }

  _splitList(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    return raw.split(/[,;\n•\-]+/).map(s => s.trim()).filter(Boolean);
  }

  _slugify(text) {
    return text.toLowerCase()
      .replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u').replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  // --------------------------------------------------------------------------
  // PERSISTÊNCIA
  // --------------------------------------------------------------------------

  saveCreativeBrief(projectName, brief) {
    const dir = path.join(this.projectsDir, projectName);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filePath = path.join(dir, 'creative-brief.json');
    fs.writeFileSync(filePath, JSON.stringify(brief, null, 2), 'utf-8');
    console.log(`[Briefing] Creative brief salvo em: ${filePath}`);
    return filePath;
  }

  saveQuestions(projectName, questions) {
    const dir = path.join(this.projectsDir, projectName);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filePath = path.join(dir, 'briefing-questions.json');
    fs.writeFileSync(filePath, JSON.stringify(questions, null, 2), 'utf-8');
    console.log(`[Briefing] Perguntas salvas em: ${filePath}`);
    return filePath;
  }

  loadProfile(projectName) {
    const dir = path.join(this.projectsDir, projectName);
    // Tenta company-profile.json primeiro, depois context-dna.json
    const candidates = ['company-profile.json', 'context-dna.json'];
    for (const fname of candidates) {
      const fpath = path.join(dir, fname);
      if (fs.existsSync(fpath)) {
        console.log(`[Briefing] Perfil carregado de: ${fpath}`);
        return JSON.parse(fs.readFileSync(fpath, 'utf-8'));
      }
    }
    return null;
  }

  loadAnswers(projectName) {
    const fpath = path.join(this.projectsDir, projectName, 'briefing-answers.json');
    if (fs.existsSync(fpath)) {
      return JSON.parse(fs.readFileSync(fpath, 'utf-8'));
    }
    return null;
  }
}

// ============================================================================
// DADOS DE DEMONSTRAÇÃO
// ============================================================================

function getDemoData() {
  const companyProfile = {
    company: {
      name: 'Summit Prop',
      sector: 'Prop Trading',
      description: 'Mesa proprietária brasileira que oferece contas financiadas para traders de forex e índices. Foco em regras flexíveis, payout rápido e suporte totalmente em português.',
      website: 'https://summitprop.com.br',
      social: {
        instagram: '@summitprop',
        telegram: 't.me/summitprop'
      },
      tech: ['WordPress', 'WooCommerce'],
      differentials: ['Payout em 24h', 'Regras mais flexíveis do mercado', 'Suporte 100% em português', 'Conta demo ilimitada']
    },
    brand: {
      tone: 'Premium / Sofisticado',
      colors: {
        primary: '#1a365d',
        secondary: '#c9a84c',
        accent: '#22d3ee'
      },
      fonts: ['Montserrat', 'Inter']
    },
    audience: {
      demographics: {
        age: '25-40',
        gender: 'masculino',
        income: 'média-alta',
        tech: 'alto'
      },
      primaryAge: 'millennial',
      painPoints: ['Capital insuficiente para operar', 'Props com regras muito rígidas', 'Suporte apenas em inglês'],
      motivations: ['Conta financiada sem risco pessoal', 'Payout rápido', 'Suporte em português']
    }
  };

  const answers = {
    objective: 'Captar leads/clientes',
    audience: 'Traders intermediários e avançados, 25-40 anos, Brasil, buscando financiamento para operar forex e índices',
    differentials: 'Payout em 24h, Regras mais flexíveis, Suporte 100% PT-BR, Conta demo ilimitada',
    references: 'ftmo.com, stripe.com, topstep.com',
    sections: [
      'Hero *', 'Como Funciona *', 'Planos de Conta *', 'Payouts / Resultados *',
      'Regras e Condições *', 'Depoimentos de Traders *', 'Preview da Plataforma',
      'FAQ *', 'CTA Final *'
    ],
    tone: 'Premium / Sofisticado — Linguagem elevada, exclusividade',
    colors: 'Manter as cores atuais',
    urgency: 'Rápido — essa semana',
    materials: ['Logo em alta resolução', 'Fotos profissionais'],
    extras: ['Formulário de contato/lead', 'Chat / WhatsApp widget', 'Animações avançadas', 'Background 3D'],
    trading_audience_level: 'Intermediário',
    trading_instruments: ['Forex', 'Índices'],
    trading_platform: 'MetaTrader 5',
    trading_payout: 'Ciclo de 14 dias, payout em até 24h após solicitação'
  };

  return { companyProfile, answers };
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const agent = new NexusBriefingAgent();

  const isDemo = args.includes('--demo');
  const generateQuestionsOnly = args.includes('--questions');
  const generateBriefOnly = args.includes('--brief');
  const projectName = args.find(a => !a.startsWith('--')) || (isDemo ? 'summit-prop-demo' : null);

  console.log('');
  console.log('='.repeat(60));
  console.log('  NEXUS BRIEFING AGENT v1.0.0');
  console.log('  Gerador inteligente de briefing criativo');
  console.log('='.repeat(60));
  console.log('');

  if (!projectName && !isDemo) {
    console.log('Uso:');
    console.log('  node nexus-briefing-agent.js <project-name>              # pipeline completo');
    console.log('  node nexus-briefing-agent.js <project-name> --questions  # só gera perguntas');
    console.log('  node nexus-briefing-agent.js <project-name> --brief      # só gera brief (precisa de answers)');
    console.log('  node nexus-briefing-agent.js --demo                      # demonstração completa');
    console.log('');
    process.exit(1);
  }

  // ---------- MODO DEMO ----------
  if (isDemo) {
    console.log('[MODO DEMO] Executando pipeline completo com dados de exemplo...');
    console.log('');

    const { companyProfile, answers } = getDemoData();

    // 1. Gerar perguntas
    console.log('--- FASE 1: Gerando perguntas adaptativas ---');
    const questions = agent.generateQuestions(companyProfile);
    console.log(`Setor detectado: ${questions.sector}`);
    console.log(`Total de perguntas: ${questions.total_questions}`);
    agent.saveQuestions(projectName, questions);

    // Mostrar perguntas
    console.log('');
    questions.questions.forEach((q, i) => {
      console.log(`  ${i + 1}. [${q.category}] ${q.question}`);
      if (q.options) {
        q.options.forEach(o => console.log(`     - ${o}`));
      }
      if (q.hint) console.log(`     Dica: ${q.hint}`);
    });

    // 2. Gerar creative brief
    console.log('');
    console.log('--- FASE 2: Gerando creative brief ---');
    const brief = agent.generateCreativeBrief(companyProfile, answers);
    agent.saveCreativeBrief(projectName, brief);
    console.log(`Completude: ${brief.completeness_score}%`);
    console.log(`Pronto para pipeline: ${brief.ready_for_pipeline ? 'SIM' : 'NAO'}`);

    // 3. Gerar relatório HTML
    console.log('');
    console.log('--- FASE 3: Gerando relatório HTML ---');
    const ReportGenerator = require('./nexus-briefing-report.js');
    const reportGen = new ReportGenerator();
    const reportPath = reportGen.generate(brief, projectName);
    console.log(`Relatório salvo em: ${reportPath}`);

    console.log('');
    console.log('='.repeat(60));
    console.log('  DEMO CONCLUIDA COM SUCESSO');
    console.log('='.repeat(60));
    console.log('');
    console.log('Arquivos gerados:');
    console.log(`  projects/${projectName}/briefing-questions.json`);
    console.log(`  projects/${projectName}/creative-brief.json`);
    console.log(`  projects/${projectName}/briefing-report.html`);
    console.log('');
    return;
  }

  // ---------- MODO NORMAL ----------
  const profile = agent.loadProfile(projectName);
  if (!profile) {
    console.error(`[ERRO] Nenhum perfil encontrado para o projeto "${projectName}".`);
    console.error('Esperado: company-profile.json ou context-dna.json em projects/' + projectName + '/');
    process.exit(1);
  }

  if (generateQuestionsOnly || !generateBriefOnly) {
    console.log('--- Gerando perguntas adaptativas ---');
    const questions = agent.generateQuestions(profile);
    agent.saveQuestions(projectName, questions);
    console.log(`Setor detectado: ${questions.sector}`);
    console.log(`Total de perguntas: ${questions.total_questions}`);
    console.log('');
    questions.questions.forEach((q, i) => {
      console.log(`  ${i + 1}. [${q.category}] ${q.question}`);
      if (q.options) q.options.forEach(o => console.log(`     - ${o}`));
    });

    if (generateQuestionsOnly) {
      console.log('');
      console.log(`Perguntas salvas em: projects/${projectName}/briefing-questions.json`);
      console.log('Responda em: projects/' + projectName + '/briefing-answers.json');
      return;
    }
  }

  // Se não é só questions, precisa de answers
  const answers = agent.loadAnswers(projectName);
  if (!answers) {
    console.log('');
    console.log('[INFO] Nenhum arquivo de respostas encontrado.');
    console.log(`Crie o arquivo: projects/${projectName}/briefing-answers.json`);
    console.log('Depois execute: node nexus-briefing-agent.js ' + projectName + ' --brief');
    return;
  }

  console.log('');
  console.log('--- Gerando creative brief ---');
  const brief = agent.generateCreativeBrief(profile, answers);
  agent.saveCreativeBrief(projectName, brief);
  console.log(`Completude: ${brief.completeness_score}%`);
  console.log(`Pronto para pipeline: ${brief.ready_for_pipeline ? 'SIM' : 'NAO'}`);

  console.log('');
  console.log('--- Gerando relatório HTML ---');
  const ReportGenerator = require('./nexus-briefing-report.js');
  const reportGen = new ReportGenerator();
  const reportPath = reportGen.generate(brief, projectName);
  console.log(`Relatório salvo em: ${reportPath}`);

  console.log('');
  console.log('Pipeline concluído!');
}

// Exportar classe para uso externo
module.exports = NexusBriefingAgent;

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(err => {
    console.error('[ERRO FATAL]', err.message);
    process.exit(1);
  });
}
