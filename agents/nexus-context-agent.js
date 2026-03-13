#!/usr/bin/env node

/*
 * NEXUS Context Agent v2 — LLM-Powered
 * Analyzes briefing with real AI to generate Context DNA
 * Replaces keyword-matching with DeepSeek analysis
 */

const fs = require('fs');
const path = require('path');
const llm = require('./nexus-llm');
const NexusSquadKnowledge = require('./nexus-squad-knowledge');

const WORKSPACE = path.join(__dirname, '..');

class NexusContextAgentV2 {

  async analyze(briefing, projectName, opts = {}) {
    console.log('🚀 Iniciando análise com IA...');
    console.log(`📋 Briefing: "${briefing.slice(0, 80)}..."`);
    console.log(`📂 Projeto: ${projectName}\n`);

    // Gather all available data
    const projectDir = path.join(WORKSPACE, 'projects', projectName);
    const discoveryData = this._loadJSON(path.join(projectDir, 'company-profile.json'));
    const briefData = this._loadJSON(path.join(projectDir, 'creative-brief.json'));
    const nicheRefs = this._loadNicheRefs(opts.niche);

    // Build rich context for LLM
    const contextPrompt = this._buildPrompt(briefing, projectName, discoveryData, briefData, nicheRefs, opts);

    // Call LLM for deep analysis
    console.log('🧠 Analisando com IA (DeepSeek)...');
    let contextDNA;
    try {
      contextDNA = await llm.callJSON(contextPrompt, {
        system: `Você é um estrategista digital especialista em landing pages de alta conversão.
Analise o briefing e dados fornecidos para criar um Context DNA completo e detalhado.
Responda APENAS com JSON válido, sem texto adicional.
Seja específico para o negócio — nunca use conteúdo genérico.
Adapte tudo ao mercado brasileiro (LGPD, não GDPR; cultura local).

FRAMEWORKS OBRIGATÓRIOS:
1. ARQUÉTIPOS DE MARCA (Jung/Margaret Mark): O brandArchetype DEVE influenciar cores, voz e visual.
   Não use roxo para clínicas médicas (caregiver→azul/verde), não use vermelho para marcas sage/trustworthy.
2. SCHWARTZ (5 Níveis de Consciência): Adapte headlines e copy ao nível de awareness do público.
   Solution_aware = lidere com resultado. Problem_aware = lidere com empatia pelo problema.
3. HORMOZI (Value Equation): Pain points devem mapear para "antes/durante/depois" da solução.
   Objeções devem ser resolvidas DENTRO da oferta, não ignoradas.`,
        maxTokens: 4096,
        temperature: 0.6
      });
    } catch(e) {
      console.log(`   ⚠️ LLM falhou (${e.message}), usando análise local...`);
      contextDNA = this._fallbackAnalysis(briefing, projectName, opts);
    }

    // Ensure required fields exist
    contextDNA = this._validateAndEnrich(contextDNA, briefing, projectName, opts);

    // Save
    if (!fs.existsSync(projectDir)) fs.mkdirSync(projectDir, { recursive: true });
    const filePath = path.join(projectDir, 'context-dna.json');
    contextDNA.filePath = filePath;
    contextDNA._generatedBy = 'nexus-context-agent-v2';
    contextDNA._generatedAt = new Date().toISOString();
    contextDNA._usedLLM = true;

    fs.writeFileSync(filePath, JSON.stringify(contextDNA, null, 2));
    console.log(`💾 Context DNA salvo em: ${filePath}`);

    // Generate human summary
    const summaryPath = path.join(projectDir, 'context-summary.md');
    const summary = this._generateSummary(contextDNA, projectName);
    fs.writeFileSync(summaryPath, summary);
    console.log(`📄 Resumo salvo em: ${summaryPath}`);

    console.log('\n✅ Context DNA gerado com IA!');
    console.log(`📄 Arquivos salvos:`);
    console.log(`   - ${filePath}`);
    console.log(`   - ${summaryPath}`);

    return { contextDNA, filePath, summaryPath };
  }

  _buildPrompt(briefing, projectName, discovery, brief, nicheRefs, opts) {
    const projectDir = path.join(WORKSPACE, 'projects', projectName);
    let prompt = `Analise este projeto e gere um Context DNA completo em JSON.

## Projeto: ${projectName}
## Briefing: ${briefing}`;

    if (opts.company) prompt += `\n## Empresa: ${opts.company}`;
    if (opts.niche) prompt += `\n## Nicho: ${opts.niche}`;
    if (opts.url) prompt += `\n## Website: ${opts.url}`;

    if (discovery && Object.keys(discovery).length > 0) {
      prompt += `\n\n## Dados de Discovery (coletados do site/redes):\n${JSON.stringify(discovery, null, 2).slice(0, 2000)}`;
    }

    if (brief && Object.keys(brief).length > 0) {
      prompt += `\n\n## Briefing Criativo:\n${JSON.stringify(brief, null, 2).slice(0, 1500)}`;
    }

    if (nicheRefs) {
      prompt += `\n\n## Referências do nicho ${opts.niche}:\n- Sites: ${(nicheRefs.sites || []).map(s => s.name || s.url).join(', ')}`;
      prompt += `\n- Padrões comuns: ${(nicheRefs.topComponents || []).slice(0, 5).map(c => c.pattern || c).join(', ')}`;
      if (nicheRefs.common_colors) {
        prompt += `\n- Cores mais usadas: ${JSON.stringify(nicheRefs.common_colors)}`;
      }
      if (nicheRefs.common_fonts) {
        prompt += `\n- Fontes mais usadas: ${nicheRefs.common_fonts.join(', ')}`;
      }
    }

    // Squad Knowledge: archetype-driven guidance for LLM
    try {
      const squadKnowledge = new NexusSquadKnowledge();
      const archetype = opts.archetype || brief?.brandArchetype || discovery?.archetype || '';
      if (archetype) {
        prompt += squadKnowledge.buildContextPromptSection(archetype, opts.niche || '');
        console.log(`  🎭 Squad Knowledge: arquétipo "${archetype}" injetado no prompt`);
      }
    } catch(e) { /* silent */ }

    // Load competitor analysis if Reference Hunter already ran
    const compAnalysis = this._loadJSON(path.join(projectDir, 'competitor-analysis.json'));
    if (compAnalysis && compAnalysis.sites) {
      prompt += `\n\n## Análise de Concorrentes (${compAnalysis.competitorsAnalyzed} sites analisados):`;
      prompt += `\n- Scores médios: Design ${compAnalysis.averageScore?.design}/10, Conversão ${compAnalysis.averageScore?.conversion}/10`;
      prompt += `\n- Efeitos populares: ${(compAnalysis.commonPatterns?.effects || []).slice(0, 5).map(e => e.value).join(', ')}`;
      prompt += `\n- Fontes populares: ${(compAnalysis.commonPatterns?.fonts || []).slice(0, 4).map(f => f.value).join(', ')}`;
      prompt += `\n- Seções mais comuns: ${(compAnalysis.commonPatterns?.sections || []).slice(0, 6).map(s => s.value).join(', ')}`;
      prompt += `\n- Dark mode: ${(compAnalysis.darkModePrevalence * 100).toFixed(0)}% dos concorrentes`;
      prompt += `\n- CTAs populares: ${(compAnalysis.commonPatterns?.ctaTexts || []).slice(0, 3).map(c => `"${c.value}"`).join(', ')}`;
    }

    prompt += `

## Formato de saída (JSON):

{
  "project": {
    "name": "nome do projeto",
    "businessType": "tipo exato (healthcare, fintech, fitness, ecommerce, saas, education, restaurant, agency, consulting, realestate)",
    "industry": "indústria específica (ex: estética facial, trading esportivo, crossfit)",
    "projectScale": "small|medium|large",
    "goals": ["goal1", "goal2", "goal3"]
  },
  "brand": {
    "name": "nome da marca/empresa",
    "tagline": "frase de impacto curta e única para este negócio",
    "primaryTraits": ["trait1", "trait2", "trait3"],
    "voiceTone": "tom de voz específico (ex: acolhedor_profissional, ousado_jovem, técnico_confiável)",
    "brandArchetype": "arquétipo (hero, sage, caregiver, creator, ruler, explorer, magician, lover, jester, everyman, innocent, rebel)",
    "communicationStyle": "estilo detalhado",
    "emotionalCore": "emoção central específica (ex: transformação_pessoal, segurança_financeira, pertencimento)"
  },
  "audience": {
    "primaryAge": "faixa etária (ex: 25-45)",
    "gender": "predominante ou todos",
    "income": "faixa de renda",
    "psychographics": ["psicografia1", "psicografia2", "psicografia3"],
    "painPoints": ["dor real 1 específica do nicho", "dor real 2", "dor real 3"],
    "motivations": ["motivação real 1", "motivação real 2", "motivação real 3"],
    "objections": ["objeção comum 1", "objeção comum 2", "objeção comum 3"]
  },
  "psychology": {
    "primary": "gatilho principal (trust, urgency, authority, scarcity, social_proof, transformation, exclusivity, fear_of_missing)",
    "secondary": "gatilho secundário",
    "conversionTriggers": ["trigger1", "trigger2", "trigger3"],
    "emotionalJourney": "descreva a jornada emocional do visitante em 1 frase"
  },
  "visual": {
    "mood": "mood board em 3 palavras (ex: clean_luxuoso_acolhedor)",
    "colorStrategy": "estratégia de cor (ex: tons de azul para confiança médica, verde para saúde)",
    "suggestedPalette": {
      "primary": "#hexcolor baseado no nicho",
      "secondary": "#hexcolor complementar",
      "accent": "#hexcolor de destaque",
      "background": "#hexcolor de fundo"
    },
    "typography": "sugestão de fonte (ex: sans-serif moderna, serif elegante)",
    "imageStyle": "estilo de imagens (ex: fotos reais de pacientes, ilustrações flat, mockups)"
  },
  "content": {
    "keyMessages": ["mensagem-chave 1 específica", "mensagem-chave 2", "mensagem-chave 3"],
    "uniqueSellingPoints": ["USP1 real do negócio", "USP2", "USP3"],
    "socialProof": "tipo de prova social ideal (depoimentos de pacientes, números de alunos, cases de sucesso)",
    "ctaStrategy": "estratégia de CTA (ex: agendar consulta gratuita, começar teste grátis)"
  },
  "seo": {
    "primaryKeyword": "keyword principal",
    "secondaryKeywords": ["kw2", "kw3", "kw4", "kw5"],
    "searchIntent": "intenção de busca do público",
    "localSEO": true/false
  },
  "technical": {
    "layoutStyle": "hero_centric, feature_grid, storytelling, comparison, funnel",
    "prioritySections": ["hero", "section2", "section3", "section4", "cta"],
    "interactionLevel": "low|medium|high",
    "mobileFirst": true
  },
  "competitors": {
    "directCompetitors": ["concorrente real 1", "concorrente real 2"],
    "differentiators": ["diferencial real 1 deste negócio", "diferencial 2"],
    "marketPosition": "posicionamento em 1 frase"
  },
  "copyStrategy": {
    "awarenessLevel": "most_aware|product_aware|solution_aware|problem_aware|unaware (nível de consciência do público sobre este tipo de solução)",
    "sophisticationStage": 1-5,
    "headlineApproach": "como a headline deve funcionar para este nível",
    "heroStyle": "estilo do hero section baseado no awareness level"
  },
  "offerStrategy": {
    "guaranteeType": "unconditional|conditional|performance|reverse_risk",
    "valueProposition": "proposta de valor em 1 frase usando Value Equation de Hormozi",
    "objectionHandling": ["como abordar objeção 1 na oferta", "objeção 2"]
  }
}

IMPORTANTE:
- Tudo deve ser ESPECÍFICO para "${briefing}" — nada genérico
- Pain points, motivações e objeções devem ser REAIS do nicho
- Cores devem fazer sentido para o setor (não roxo para clínica médica, por exemplo)
- Keywords devem ser termos que o público REALMENTE busca no Google Brasil
- Concorrentes devem ser empresas REAIS do setor quando possível`;

    return prompt;
  }

  _fallbackAnalysis(briefing, projectName, opts) {
    // Minimal fallback if LLM is unavailable
    const niche = opts.niche || 'general';
    return {
      project: {
        name: projectName,
        businessType: niche,
        industry: niche,
        projectScale: 'medium',
        goals: ['increase_conversions', 'build_trust', 'generate_leads']
      },
      brand: {
        name: opts.company || projectName,
        tagline: '',
        primaryTraits: [],
        voiceTone: 'professional',
        brandArchetype: 'hero',
        communicationStyle: 'informative',
        emotionalCore: 'trust'
      },
      audience: {
        primaryAge: '25-45',
        painPoints: [],
        motivations: [],
        objections: []
      },
      psychology: { primary: 'trust', secondary: 'authority', conversionTriggers: [] },
      visual: { mood: 'modern_clean', suggestedPalette: {} },
      content: { keyMessages: [], uniqueSellingPoints: [], ctaStrategy: '' },
      seo: { primaryKeyword: projectName.replace(/-/g, ' '), secondaryKeywords: [] },
      technical: { layoutStyle: 'hero_centric', prioritySections: ['hero', 'features', 'testimonials', 'pricing', 'cta'] },
      competitors: { directCompetitors: [], differentiators: [] }
    };
  }

  _validateAndEnrich(dna, briefing, projectName, opts) {
    // Ensure minimum structure
    if (!dna.project) dna.project = {};
    if (!dna.project.name) dna.project.name = projectName;
    if (!dna.project.businessType) dna.project.businessType = opts.niche || 'general';
    if (!dna.brand) dna.brand = {};
    if (!dna.brand.name) dna.brand.name = opts.company || projectName;
    if (!dna.audience) dna.audience = {};
    if (!dna.psychology) dna.psychology = { primary: 'trust' };
    if (!dna.visual) dna.visual = {};
    if (!dna.content) dna.content = {};
    if (!dna.seo) dna.seo = {};
    if (!dna.technical) dna.technical = {};
    if (!dna.competitors) dna.competitors = {};
    return dna;
  }

  _loadJSON(filepath) {
    try { return JSON.parse(fs.readFileSync(filepath, 'utf-8')); } catch(e) { return null; }
  }

  _loadNicheRefs(niche) {
    if (!niche) return null;
    const refPath = path.join(WORKSPACE, 'references-db', 'niches', `${niche}.json`);
    return this._loadJSON(refPath);
  }

  _generateSummary(dna, projectName) {
    const p = dna.project || {};
    const b = dna.brand || {};
    const a = dna.audience || {};
    const psy = dna.psychology || {};
    const v = dna.visual || {};
    const c = dna.content || {};

    return `# Context DNA — ${b.name || projectName}

## Projeto
- **Tipo:** ${p.businessType} / ${p.industry || ''}
- **Escala:** ${p.projectScale || 'medium'}
- **Objetivos:** ${(p.goals || []).join(', ')}

## Marca
- **Nome:** ${b.name || projectName}
- **Tagline:** ${b.tagline || '—'}
- **Tom de voz:** ${b.voiceTone || '—'}
- **Arquétipo:** ${b.brandArchetype || '—'}
- **Emoção central:** ${b.emotionalCore || '—'}

## Audiência
- **Idade:** ${a.primaryAge || '—'}
- **Dores:** ${(a.painPoints || []).join(', ')}
- **Motivações:** ${(a.motivations || []).join(', ')}
- **Objeções:** ${(a.objections || []).join(', ')}

## Psicologia
- **Gatilho primário:** ${psy.primary || '—'}
- **Gatilho secundário:** ${psy.secondary || '—'}
- **Jornada emocional:** ${psy.emotionalJourney || '—'}

## Visual
- **Mood:** ${v.mood || '—'}
- **Estratégia de cor:** ${v.colorStrategy || '—'}
- **Paleta sugerida:** ${JSON.stringify(v.suggestedPalette || {})}

## Conteúdo
- **Mensagens-chave:** ${(c.keyMessages || []).join(' | ')}
- **USPs:** ${(c.uniqueSellingPoints || []).join(' | ')}
- **CTA Strategy:** ${c.ctaStrategy || '—'}

## SEO
- **Keyword principal:** ${(dna.seo || {}).primaryKeyword || '—'}
- **Keywords secundárias:** ${((dna.seo || {}).secondaryKeywords || []).join(', ')}

---
*Gerado por NEXUS Context Agent v2 (LLM-powered) em ${new Date().toLocaleString('pt-BR')}*
`;
  }
}

module.exports = NexusContextAgentV2;

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const briefing = args[0] || 'projeto genérico';
  const projectName = args[1] || 'test-project';

  // Parse opts from remaining args
  const opts = {};
  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--niche' && args[i+1]) opts.niche = args[++i];
    if (args[i] === '--company' && args[i+1]) opts.company = args[++i];
    if (args[i] === '--url' && args[i+1]) opts.url = args[++i];
  }

  const agent = new NexusContextAgentV2();
  agent.analyze(briefing, projectName, opts)
    .then(r => {
      console.log('\n🎯 Próximo passo: Use este Context DNA com outros agentes NEXUS');
    })
    .catch(e => {
      console.error('❌ Erro:', e.message);
      process.exit(1);
    });
}
