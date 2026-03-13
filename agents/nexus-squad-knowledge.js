/**
 * NEXUS Squad Knowledge Engine
 *
 * Integrates proven frameworks from expert squads into the NEXUS pipeline:
 * 1. Archetype Consultant — 12 Jungian archetypes → color/voice/visual validation
 * 2. Eugene Schwartz — 5 Levels of Awareness → headline/copy calibration
 * 3. Hormozi Offers — Value Equation → pricing/CTA/guarantee optimization
 *
 * Used by: Context Agent (enriches LLM prompt), Code Agent (structures content)
 */

'use strict';

// ─────────────────────────────────────────────────────────────
// 1. ARCHETYPE KNOWLEDGE (from brand-squad/archetype-consultant)
// ─────────────────────────────────────────────────────────────

const ARCHETYPE_PROFILES = {
  innocent: {
    desire: 'Felicidade, simplicidade, paraíso',
    fear: 'Fazer algo errado',
    brand_voice: 'Otimista, simples, honesto, acolhedor',
    color_tendency: ['#FFFFFF', '#BFDBFE', '#FDE68A', '#D1FAE5'],
    color_description: 'Branco, azul claro, pastéis suaves',
    visual_traits: { borderRadius: 'arredondado', spacing: 'generoso', imagery: 'fotos naturais, iluminação suave', contrast: 'baixo' },
    examples: ['Coca-Cola', 'Dove', 'Volkswagen'],
  },
  explorer: {
    desire: 'Liberdade, descoberta, auto-realização',
    fear: 'Ficar preso, conformidade',
    brand_voice: 'Aventureiro, independente, pioneiro, ousado',
    color_tendency: ['#78716C', '#166534', '#1E3A5F', '#92400E'],
    color_description: 'Tons terrosos, verde floresta, navy',
    visual_traits: { borderRadius: 'moderado', spacing: 'amplo', imagery: 'paisagens, natureza, aventura', contrast: 'alto' },
    examples: ['Patagonia', 'Jeep', 'The North Face'],
  },
  sage: {
    desire: 'Verdade, conhecimento, entendimento',
    fear: 'Ignorância, ser enganado',
    brand_voice: 'Inteligente, informado, analítico, autoritativo',
    color_tendency: ['#1E3A5F', '#14532D', '#B8860B', '#1F2937'],
    color_description: 'Navy, verde escuro, dourado',
    visual_traits: { borderRadius: 'sutil', spacing: 'estruturado', imagery: 'gráficos, dados, diagramas', contrast: 'médio' },
    examples: ['Google', 'BBC', 'Harvard'],
  },
  hero: {
    desire: 'Provar valor através de ação corajosa',
    fear: 'Fraqueza, vulnerabilidade',
    brand_voice: 'Corajoso, determinado, forte, disciplinado',
    color_tendency: ['#DC2626', '#000000', '#1F2937', '#FBBF24'],
    color_description: 'Vermelho, preto, contrastes fortes',
    visual_traits: { borderRadius: 'mínimo', spacing: 'compacto', imagery: 'ação, conquista, superação', contrast: 'máximo' },
    examples: ['Nike', 'FedEx', 'BMW'],
  },
  outlaw: {
    desire: 'Revolução, libertação, disrupção',
    fear: 'Ser impotente, irrelevante',
    brand_voice: 'Rebelde, provocativo, disruptivo, autêntico',
    color_tendency: ['#000000', '#DC2626', '#1F2937', '#78716C'],
    color_description: 'Preto, vermelho, tons escuros',
    visual_traits: { borderRadius: 'nenhum ou sharp', spacing: 'denso', imagery: 'raw, street, contracultural', contrast: 'extremo' },
    examples: ['Harley-Davidson', 'Virgin', 'Diesel'],
  },
  magician: {
    desire: 'Transformar realidade, realizar sonhos',
    fear: 'Consequências negativas não intencionais',
    brand_voice: 'Visionário, imaginativo, transformador, carismático',
    color_tendency: ['#7C3AED', '#000000', '#6366F1', '#A855F7'],
    color_description: 'Roxo, preto, iridescente',
    visual_traits: { borderRadius: 'suave', spacing: 'generoso', imagery: 'futurista, efeitos visuais, gradientes', contrast: 'alto' },
    examples: ['Apple', 'Disney', 'Tesla'],
  },
  everyman: {
    desire: 'Pertencimento, conexão',
    fear: 'Se destacar demais, ser excluído',
    brand_voice: 'Amigável, humilde, autêntico, acessível',
    color_tendency: ['#3B82F6', '#F5F5F4', '#D4A574', '#78716C'],
    color_description: 'Azul, neutros quentes',
    visual_traits: { borderRadius: 'moderado', spacing: 'confortável', imagery: 'pessoas reais, cotidiano', contrast: 'médio' },
    examples: ['IKEA', 'Target', 'Levi\'s'],
  },
  lover: {
    desire: 'Intimidade, experiência, prazer sensorial',
    fear: 'Ficar sozinho, ser rejeitado',
    brand_voice: 'Apaixonado, sensual, íntimo, indulgente',
    color_tendency: ['#DC2626', '#881337', '#B8860B', '#78184A'],
    color_description: 'Vermelho, borgonha, dourado, tons ricos',
    visual_traits: { borderRadius: 'suave/orgânico', spacing: 'generoso', imagery: 'texturas, close-ups, luxo', contrast: 'médio-alto' },
    examples: ['Chanel', 'Victoria\'s Secret', 'Godiva'],
  },
  jester: {
    desire: 'Diversão, leveza, aproveitar o momento',
    fear: 'Ser entediante ou entediado',
    brand_voice: 'Divertido, bem-humorado, irreverente, espirituoso',
    color_tendency: ['#FBBF24', '#EF4444', '#22D3EE', '#A855F7'],
    color_description: 'Cores vibrantes, multicolorido, amarelo',
    visual_traits: { borderRadius: 'grande/lúdico', spacing: 'dinâmico', imagery: 'ilustrações, memes, pop art', contrast: 'alto' },
    examples: ['Old Spice', 'M&M\'s', 'Dollar Shave Club'],
  },
  caregiver: {
    desire: 'Proteger e cuidar dos outros',
    fear: 'Egoísmo, ingratidão',
    brand_voice: 'Cuidadoso, acolhedor, compassivo, generoso',
    color_tendency: ['#3B82F6', '#22C55E', '#F5F5F4', '#FBBF24'],
    color_description: 'Azul, verde, tons quentes',
    visual_traits: { borderRadius: 'arredondado', spacing: 'acolhedor', imagery: 'família, cuidado, sorrisos', contrast: 'baixo-médio' },
    examples: ['Johnson & Johnson', 'TOMS', 'Volvo'],
  },
  creator: {
    desire: 'Criar algo de valor duradouro',
    fear: 'Visão ou execução medíocre',
    brand_voice: 'Inovador, artístico, expressivo, perfeccionista',
    color_tendency: ['#6366F1', '#EC4899', '#8B5CF6', '#14B8A6'],
    color_description: 'Variado, ousado, distintivo',
    visual_traits: { borderRadius: 'misto/criativo', spacing: 'assimétrico', imagery: 'design, criação, portfólio', contrast: 'alto' },
    examples: ['Adobe', 'Lego', 'Pinterest'],
  },
  ruler: {
    desire: 'Controle, poder, ordem',
    fear: 'Caos, ser superado',
    brand_voice: 'Autoritativo, refinado, comandante, premium',
    color_tendency: ['#1E3A5F', '#000000', '#B8860B', '#C0C0C0'],
    color_description: 'Navy, preto, dourado, prata',
    visual_traits: { borderRadius: 'mínimo/preciso', spacing: 'generoso/luxuoso', imagery: 'minimalista, premium, lifestyle', contrast: 'alto' },
    examples: ['Mercedes-Benz', 'Rolex', 'American Express'],
  },
};

// ─────────────────────────────────────────────────────────────
// 2. SCHWARTZ AWARENESS LEVELS (from copy-squad/eugene-schwartz)
// ─────────────────────────────────────────────────────────────

const AWARENESS_LEVELS = {
  most_aware: {
    level: 5,
    description: 'Conhece seu produto e quer, só precisa da oferta',
    headline_strategy: 'Nome do produto + preço/oferta. Direto ao ponto.',
    copy_length: 'curto',
    copy_approach: 'direto',
    hero_style: 'oferta direta com CTA imediato',
    section_order: ['hero', 'pricing', 'cta', 'testimonials', 'faq'],
    cta_urgency: 'alta',
    example: '"[Produto] — agora com 40% de desconto"',
  },
  product_aware: {
    level: 4,
    description: 'Conhece o produto mas não está convencido',
    headline_strategy: 'Diferenciação, prova, depoimentos. Por que ESTE produto é superior.',
    copy_length: 'médio',
    copy_approach: 'comparativo',
    hero_style: 'benefício principal + prova social',
    section_order: ['hero', 'stats', 'testimonials', 'features', 'pricing', 'cta'],
    cta_urgency: 'média-alta',
    example: '"Por que 10.000+ profissionais escolhem [Produto]"',
  },
  solution_aware: {
    level: 3,
    description: 'Sabe que soluções existem, mas não conhece SEU produto',
    headline_strategy: 'Lidere com o resultado desejado, depois conecte ao produto.',
    copy_length: 'médio-longo',
    copy_approach: 'resultado-primeiro',
    hero_style: 'resultado desejado + como alcançar',
    section_order: ['hero', 'features', 'stats', 'testimonials', 'pricing', 'cta'],
    cta_urgency: 'média',
    example: '"Como [resultado desejado] sem [dor]"',
  },
  problem_aware: {
    level: 2,
    description: 'Sente a dor, sabe o problema, não sabe que soluções existem',
    headline_strategy: 'Lidere com empatia pelo problema. Agite. Depois revele a solução.',
    copy_length: 'longo',
    copy_approach: 'problema-agitação-solução',
    hero_style: 'empatia + identificação do problema',
    section_order: ['hero', 'features', 'stats', 'testimonials', 'pricing', 'guarantee', 'cta'],
    cta_urgency: 'baixa-média',
    example: '"Se você sofre com [problema], esta é uma notícia importante"',
  },
  unaware: {
    level: 1,
    description: 'Não sabe que tem um problema',
    headline_strategy: 'Lidere com emoção, identidade ou história. Eduque para a consciência. Nunca mencione produto cedo.',
    copy_length: 'muito longo',
    copy_approach: 'história-educação',
    hero_style: 'storytelling + identificação emocional',
    section_order: ['hero', 'features', 'stats', 'testimonials', 'features2', 'pricing', 'guarantee', 'cta'],
    cta_urgency: 'baixa',
    example: '"A história de quem descobriu que [insight]"',
  },
};

const SOPHISTICATION_STAGES = {
  stage_1: {
    market_state: 'Primeiro no mercado. Sem competição.',
    strategy: 'Seja direto. Simplesmente declare o benefício.',
    headline_approach: 'claim_direto',
  },
  stage_2: {
    market_state: 'Alguma competição. Claims já foram feitos.',
    strategy: 'Amplifique o claim. Torne-o maior, mais ousado.',
    headline_approach: 'claim_amplificado',
  },
  stage_3: {
    market_state: 'Mercado cético. Já ouviu todos os claims.',
    strategy: 'Introduza o MECANISMO ÚNICO — explique COMO/POR QUE funciona diferente.',
    headline_approach: 'mecanismo_unico',
  },
  stage_4: {
    market_state: 'Mecanismos copiados. Profundamente saturado.',
    strategy: 'Amplifique o mecanismo. Mais elaborado, científico, credível.',
    headline_approach: 'mecanismo_amplificado',
  },
  stage_5: {
    market_state: 'Exaustão total. Todos os claims parecem truque.',
    strategy: 'Abandone claims. Conecte com a IDENTIDADE do prospect. Venda a experiência, quem eles se tornam.',
    headline_approach: 'identificacao',
  },
};

// ─────────────────────────────────────────────────────────────
// 3. HORMOZI VALUE EQUATION (from hormozi-squad/hormozi-offers)
// ─────────────────────────────────────────────────────────────

const VALUE_EQUATION = {
  formula: 'Valor = (Dream Outcome × Perceived Likelihood) / (Time Delay × Effort & Sacrifice)',
  optimization: {
    dream_outcome: {
      label: 'Resultado dos Sonhos',
      tactics: [
        'Pinte o quadro vívido da vida DEPOIS',
        'Use resultados específicos e mensuráveis',
        'Conecte a desejos profundos de identidade',
        'Frame em termos de status, saúde, riqueza ou relacionamentos',
      ],
    },
    perceived_likelihood: {
      label: 'Probabilidade Percebida',
      tactics: [
        'Prova social (depoimentos, cases, dados)',
        'Competência demonstrada (mostre, não conte)',
        'Reversão de risco (garantias)',
        'Especificidade do sistema/processo',
      ],
    },
    time_delay: {
      label: 'Tempo de Espera',
      tactics: [
        'Quick wins nas primeiras 24-48 horas',
        'Indicadores de progresso por milestone',
        'Onboarding que entrega valor imediato',
        'Quebre jornadas longas em sprints curtos',
      ],
    },
    effort_sacrifice: {
      label: 'Esforço & Sacrifício',
      tactics: [
        'Componentes done-for-you',
        'Templates, scripts, materiais prontos',
        'Automação e ferramentas',
        'Sistema passo-a-passo',
      ],
    },
  },
};

const GUARANTEE_TYPES = {
  unconditional: {
    label: 'Incondicional',
    description: 'Dinheiro de volta, sem perguntas',
    best_for: 'Produtos de baixo risco, alta confiança na entrega',
    copy_template: 'Garantia de {dias} dias — Se não ficar satisfeito, devolvemos 100% do seu investimento. Sem perguntas.',
  },
  conditional: {
    label: 'Condicional',
    description: 'Dinheiro de volta SE você fizer X, Y, Z e não alcançar o resultado',
    best_for: 'Programas que exigem participação ativa',
    copy_template: 'Faça {requisito} por {dias} dias. Se não alcançar {resultado}, devolvemos cada centavo.',
  },
  performance: {
    label: 'Performance',
    description: 'Trabalhamos de graça até você alcançar o resultado',
    best_for: 'Serviços com alta confiança',
    copy_template: 'Se não entregarmos {resultado} em {prazo}, continuamos trabalhando sem custo adicional.',
  },
  reverse_risk: {
    label: 'Reversão de Risco',
    description: 'Fique com tudo mesmo se pedir reembolso',
    best_for: 'Produtos digitais, cursos',
    copy_template: 'Teste por {dias} dias. Se não for para você, fique com todo o material e devolvemos seu investimento.',
  },
};

const BONUS_STACKING_RULES = [
  'Cada bônus resolve o PRÓXIMO problema que surge após resolver o problema principal',
  'Cada bônus tem nome próprio, valor atribuído e problema específico que resolve',
  'Bônus devem parecer que poderiam ser vendidos separadamente',
  'Sempre atribua um valor em reais a cada bônus',
  'Stack de bônus deve fazer o valor total >> preço',
  'Use bônus de "ação rápida" para urgência',
];

// ─────────────────────────────────────────────────────────────
// Main Class
// ─────────────────────────────────────────────────────────────

class NexusSquadKnowledge {
  constructor() {
    this.archetypes = ARCHETYPE_PROFILES;
    this.awarenessLevels = AWARENESS_LEVELS;
    this.sophisticationStages = SOPHISTICATION_STAGES;
    this.valueEquation = VALUE_EQUATION;
    this.guaranteeTypes = GUARANTEE_TYPES;
    this.bonusRules = BONUS_STACKING_RULES;
  }

  // ─── Archetype Analysis ──────────────────────────────────

  /**
   * Get full archetype profile with visual and voice guidance
   * @param {string} archetype - Archetype key (hero, sage, etc.)
   * @returns {Object} Complete archetype profile
   */
  getArchetypeProfile(archetype) {
    const key = (archetype || 'creator').toLowerCase().replace(/[^a-z]/g, '');
    // Map aliases
    const aliases = { rebel: 'outlaw', bold: 'outlaw', premium: 'magician', trustworthy: 'sage', friendly: 'caregiver', accessible: 'everyman', elegant: 'lover', playful: 'jester', clean: 'innocent', adventurous: 'explorer' };
    const resolved = aliases[key] || key;
    return this.archetypes[resolved] || this.archetypes.creator;
  }

  /**
   * Validate a color palette against the archetype's tendencies
   * Returns suggestions if palette seems misaligned
   * @param {string} archetype
   * @param {Object} palette - { primary, secondary, accent, background }
   * @returns {{ aligned: boolean, suggestions: string[], archetypeColors: string[] }}
   */
  validatePalette(archetype, palette) {
    const profile = this.getArchetypeProfile(archetype);
    if (!profile) return { aligned: true, suggestions: [], archetypeColors: [] };

    const suggestions = [];
    const tendencyHues = profile.color_tendency.map(c => this._getHue(c));

    if (palette.primary) {
      const primaryHue = this._getHue(palette.primary);
      const aligned = tendencyHues.some(h => Math.abs(h - primaryHue) < 40 || Math.abs(h - primaryHue) > 320);
      if (!aligned) {
        suggestions.push(`Cor primária ${palette.primary} pode não combinar com arquétipo ${archetype} (tendência: ${profile.color_description})`);
      }
    }

    return {
      aligned: suggestions.length === 0,
      suggestions,
      archetypeColors: profile.color_tendency,
      colorDescription: profile.color_description,
      visualTraits: profile.visual_traits,
    };
  }

  // ─── Schwartz Copy Calibration ───────────────────────────

  /**
   * Diagnose market awareness level based on project context
   * @param {Object} contextDna - Full context DNA
   * @returns {{ level: string, config: Object }}
   */
  diagnoseAwareness(contextDna) {
    const brand = contextDna.brand || {};
    const audience = contextDna.audience || {};
    const competitors = contextDna.competitors || {};
    const project = contextDna.project || {};

    // Heuristics to estimate awareness level
    const hasEstablishedBrand = brand.name && brand.name.length > 2;
    const hasDirectCompetitors = (competitors.directCompetitors || []).length > 0;
    const isNewMarket = !hasDirectCompetitors;
    const hasHighAwareness = brand.primaryTraits && brand.primaryTraits.length > 2;

    // Default: solution_aware (most common for landing pages)
    let level = 'solution_aware';

    if (isNewMarket) {
      level = 'problem_aware';
    } else if (hasHighAwareness && hasEstablishedBrand) {
      level = 'product_aware';
    }

    // Check if user set it explicitly
    if (contextDna._awarenessLevel) {
      level = contextDna._awarenessLevel;
    }

    return {
      level,
      config: this.awarenessLevels[level],
    };
  }

  /**
   * Get headline strategy based on awareness + sophistication
   * @param {string} awarenessLevel
   * @param {number} sophisticationStage - 1-5
   * @returns {Object} Copy strategy guidance
   */
  getCopyStrategy(awarenessLevel, sophisticationStage = 3) {
    const awareness = this.awarenessLevels[awarenessLevel] || this.awarenessLevels.solution_aware;
    const stage = this.sophisticationStages[`stage_${sophisticationStage}`] || this.sophisticationStages.stage_3;

    return {
      awareness,
      sophistication: stage,
      recommendations: {
        headline: awareness.headline_strategy,
        copyLength: awareness.copy_length,
        copyApproach: awareness.copy_approach,
        heroStyle: awareness.hero_style,
        sectionOrder: awareness.section_order,
        ctaUrgency: awareness.cta_urgency,
        headlineApproach: stage.headline_approach,
      },
    };
  }

  // ─── Hormozi Offer Optimization ──────────────────────────

  /**
   * Generate Value Equation analysis for pricing section
   * @param {Object} contextDna
   * @returns {Object} Offer optimization config
   */
  getOfferStrategy(contextDna) {
    const content = contextDna.content || {};
    const audience = contextDna.audience || {};
    const psychology = contextDna.psychology || {};

    // Map pain points to objections to solve
    const painPoints = audience.painPoints || [];
    const objections = audience.objections || [];
    const usps = content.uniqueSellingPoints || [];

    // Recommend guarantee type based on business type
    const businessType = (contextDna.project?.businessType || '').toLowerCase();
    let recommendedGuarantee = 'conditional';
    if (['saas', 'ecommerce'].includes(businessType)) recommendedGuarantee = 'unconditional';
    if (['agency', 'consulting'].includes(businessType)) recommendedGuarantee = 'performance';
    if (['education'].includes(businessType)) recommendedGuarantee = 'reverse_risk';

    return {
      valueEquation: this.valueEquation,
      guarantee: {
        recommended: recommendedGuarantee,
        type: this.guaranteeTypes[recommendedGuarantee],
        allTypes: this.guaranteeTypes,
      },
      bonusStacking: {
        rules: this.bonusRules,
        suggestedBonuses: painPoints.slice(0, 3).map((pain, i) => ({
          name: `Bônus ${i + 1}`,
          solves: pain,
          suggestion: `Crie um bônus que elimina: "${pain}"`,
        })),
      },
      objectionKillers: objections.map(obj => ({
        objection: obj,
        strategy: `Aborde "${obj}" diretamente na seção de pricing ou FAQ`,
      })),
      pricingPsychology: {
        anchor: 'Sempre mostre o valor total antes do preço',
        comparison: 'Compare com alternativas (não fazer nada, DIY, concorrentes)',
        perDay: 'Divida o custo por dia/resultado para relativizar',
        rule: 'Nunca dê desconto — adicione valor',
      },
    };
  }

  // ─── LLM Prompt Enrichment ───────────────────────────────

  /**
   * Generate enrichment data for Context Agent's LLM prompt
   * @param {string} archetype
   * @param {string} niche
   * @returns {string} Prompt section to append
   */
  buildContextPromptSection(archetype, niche) {
    const profile = this.getArchetypeProfile(archetype);
    if (!profile) return '';

    let section = `\n\n## Frameworks de Especialistas (Squad Knowledge)\n`;

    // Archetype guidance
    section += `\n### Arquétipo: ${archetype.charAt(0).toUpperCase() + archetype.slice(1)}`;
    section += `\n- Desejo central: ${profile.desire}`;
    section += `\n- Medo central: ${profile.fear}`;
    section += `\n- Voz da marca: ${profile.brand_voice}`;
    section += `\n- Tendência de cores: ${profile.color_description}`;
    section += `\n- Cores sugeridas: ${profile.color_tendency.join(', ')}`;
    section += `\n- Estilo visual: ${JSON.stringify(profile.visual_traits)}`;
    section += `\n- Exemplos de marcas: ${profile.examples.join(', ')}`;

    // Copy framework
    section += `\n\n### Copy (Eugene Schwartz)`;
    section += `\n- Para a MAIORIA das landing pages, o público está no nível "solution_aware" (sabe que soluções existem, não conhece ESTE produto)`;
    section += `\n- Headline deve liderar com o RESULTADO DESEJADO, depois conectar ao produto`;
    section += `\n- Em mercados saturados (estágio 3+), introduza o MECANISMO ÚNICO — explique COMO/POR QUE funciona diferente`;
    section += `\n- Copy é MONTADA, não escrita: desejo do público + performances do produto + mensagem que conecta os dois`;

    // Value Equation
    section += `\n\n### Oferta (Hormozi Value Equation)`;
    section += `\n- Valor = (Dream Outcome × Perceived Likelihood) / (Time Delay × Effort)`;
    section += `\n- Maximize: resultado dos sonhos (específico, mensurável) + probabilidade (prova social, garantias)`;
    section += `\n- Minimize: tempo de espera (quick wins) + esforço (done-for-you, templates)`;
    section += `\n- Pricing: "make the offer so good people feel stupid saying no"`;
    section += `\n- Nunca dê desconto — adicione valor (bônus, garantia, exclusividade)`;

    // Important rules
    section += `\n\n### Regras Importantes`;
    section += `\n- As cores sugeridas DEVEM estar alinhadas com o arquétipo da marca`;
    section += `\n- O tom de voz "${profile.brand_voice}" deve ser consistente em TODOS os textos`;
    section += `\n- Pain points devem ser REAIS e refletir o nível de consciência do público`;
    section += `\n- A seção de pricing deve sempre abordar objeções DENTRO da oferta`;

    return section;
  }

  /**
   * Generate Content DNA enrichment (used by Code Agent to structure page content)
   * @param {Object} contextDna - Full context DNA
   * @returns {Object} Enriched content strategy
   */
  enrichContentStrategy(contextDna) {
    const archetype = (contextDna.brand?.brandArchetype || contextDna.brand?.archetype || 'creator').toLowerCase();
    const profile = this.getArchetypeProfile(archetype);
    const { level, config } = this.diagnoseAwareness(contextDna);
    const offerStrategy = this.getOfferStrategy(contextDna);

    return {
      archetype: {
        key: archetype,
        profile,
      },
      copy: {
        awarenessLevel: level,
        config,
        sectionOrder: config.section_order,
        heroStyle: config.hero_style,
        ctaUrgency: config.cta_urgency,
      },
      offer: offerStrategy,
      voiceTone: profile.brand_voice,
      visualGuidance: profile.visual_traits,
    };
  }

  // ─── Helpers ─────────────────────────────────────────────

  _getHue(hex) {
    if (!hex || !hex.startsWith('#')) return 0;
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const d = max - min;
    if (d === 0) return 0;
    let h;
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
    return h;
  }
}

module.exports = NexusSquadKnowledge;

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const knowledge = new NexusSquadKnowledge();

  if (args[0] === '--archetype') {
    const profile = knowledge.getArchetypeProfile(args[1] || 'hero');
    console.log(JSON.stringify(profile, null, 2));
  } else if (args[0] === '--awareness') {
    const level = args[1] || 'solution_aware';
    const strategy = knowledge.getCopyStrategy(level, parseInt(args[2]) || 3);
    console.log(JSON.stringify(strategy, null, 2));
  } else if (args[0] === '--prompt') {
    const prompt = knowledge.buildContextPromptSection(args[1] || 'hero', args[2] || 'saas');
    console.log(prompt);
  } else {
    console.log('NEXUS Squad Knowledge Engine');
    console.log('  --archetype <name>     Show archetype profile');
    console.log('  --awareness <level>    Show copy strategy (most_aware|product_aware|solution_aware|problem_aware|unaware)');
    console.log('  --prompt <arch> <niche> Generate LLM prompt section');
    console.log('\nArchetypes:', Object.keys(ARCHETYPE_PROFILES).join(', '));
  }
}
