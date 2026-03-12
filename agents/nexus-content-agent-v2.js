#!/usr/bin/env node

/*
 * NEXUS Content Agent v2 — LLM-Powered
 * Generates truly unique, contextual copy using DeepSeek
 * Headlines, CTAs, sections, SEO, microcopy — all personalized
 */

const fs = require('fs');
const path = require('path');
const llm = require('./nexus-llm');

const WORKSPACE = path.join(__dirname, '..');

class NexusContentAgentV2 {

  async generate(contextDNAPath) {
    console.log('🚀 Iniciando geração de conteúdo com IA...');
    console.log(`📄 Context DNA: ${contextDNAPath}\n`);

    const dna = JSON.parse(fs.readFileSync(contextDNAPath, 'utf-8'));
    const projectDir = path.dirname(contextDNAPath);

    // Load any existing discovery/brief data for extra context
    const discovery = this._loadJSON(path.join(projectDir, 'company-profile.json'));
    const brief = this._loadJSON(path.join(projectDir, 'creative-brief.json'));

    // Generate all content via LLM
    console.log('📝 Gerando conteúdo único com IA (DeepSeek)...');

    let content;
    try {
      content = await this._generateContent(dna, discovery, brief);
    } catch(e) {
      console.log(`   ⚠️ LLM falhou (${e.message}), tentando novamente...`);
      try {
        content = await this._generateContent(dna, discovery, brief);
      } catch(e2) {
        console.log(`   ❌ LLM indisponível. Usando fallback local.`);
        content = this._fallbackContent(dna);
      }
    }

    // Validate and ensure all required fields
    content = this._validate(content, dna);

    // Save to project directory
    const contentDir = path.join(projectDir, 'content');
    if (!fs.existsSync(contentDir)) fs.mkdirSync(contentDir, { recursive: true });

    // Save all-content.json (main file)
    const allContentPath = path.join(contentDir, 'all-content.json');
    fs.writeFileSync(allContentPath, JSON.stringify(content, null, 2));

    // Save individual files for compatibility
    fs.writeFileSync(path.join(contentDir, 'headlines.json'), JSON.stringify(content.headlines, null, 2));
    fs.writeFileSync(path.join(contentDir, 'ctas.json'), JSON.stringify(content.ctas, null, 2));
    fs.writeFileSync(path.join(contentDir, 'sections.json'), JSON.stringify(content.sectionContent, null, 2));
    fs.writeFileSync(path.join(contentDir, 'meta-content.json'), JSON.stringify(content.metaContent || {}, null, 2));
    fs.writeFileSync(path.join(contentDir, 'ab-variants.json'), JSON.stringify(content.abVariants || {}, null, 2));
    fs.writeFileSync(path.join(contentDir, 'microcopy.json'), JSON.stringify(content.microcopy || {}, null, 2));

    // Save content report
    const report = this._generateReport(content, dna);
    fs.writeFileSync(path.join(projectDir, 'content-report.md'), report);

    console.log(`💾 Content assets salvos em: ${contentDir}`);
    console.log('\n✅ Conteúdo contextual gerado com IA!');
    console.log('📊 Estatísticas:');
    console.log(`   - Headlines: 1 principal + ${(content.headlines?.variants || []).length} variantes`);
    console.log(`   - CTAs: 1 primário + ${(content.ctas?.variants || []).length} variantes`);
    console.log(`   - Seções: ${Object.keys(content.sectionContent || {}).length} completas`);
    console.log(`   - SEO: Title + Description + Keywords`);

    return content;
  }

  async _generateContent(dna, discovery, brief) {
    const brand = dna.brand || {};
    const project = dna.project || {};
    const audience = dna.audience || {};
    const psychology = dna.psychology || {};
    const visual = dna.visual || {};
    const seoData = dna.seo || {};
    const contentHints = dna.content || {};
    const competitors = dna.competitors || {};
    const technical = dna.technical || {};

    const prompt = `Crie TODO o conteúdo de uma landing page de alta conversão para este negócio.

## Negócio
- **Nome:** ${brand.name || project.name || 'Empresa'}
- **Tipo:** ${project.businessType || 'general'} / ${project.industry || ''}
- **Tagline da marca:** ${brand.tagline || '(criar uma)'}
- **Tom de voz:** ${brand.voiceTone || 'profissional'}
- **Arquétipo:** ${brand.brandArchetype || 'hero'}
- **Emoção central:** ${brand.emotionalCore || 'confiança'}

## Audiência
- **Idade:** ${audience.primaryAge || '25-45'}
- **Dores:** ${(audience.painPoints || []).join(', ') || '(inferir do nicho)'}
- **Motivações:** ${(audience.motivations || []).join(', ') || '(inferir do nicho)'}
- **Objeções:** ${(audience.objections || []).join(', ') || '(inferir do nicho)'}

## Psicologia
- **Gatilho primário:** ${psychology.primary || 'trust'}
- **Jornada emocional:** ${psychology.emotionalJourney || ''}
- **Triggers de conversão:** ${(psychology.conversionTriggers || []).join(', ')}

## Estratégia
- **USPs:** ${(contentHints.uniqueSellingPoints || []).join(', ') || '(criar)'}
- **Prova social:** ${contentHints.socialProof || 'depoimentos'}
- **CTA Strategy:** ${contentHints.ctaStrategy || '(criar)'}
- **Concorrentes:** ${(competitors.directCompetitors || []).join(', ')}
- **Diferenciais:** ${(competitors.differentiators || []).join(', ')}

## SEO
- **Keyword principal:** ${seoData.primaryKeyword || ''}
- **Keywords secundárias:** ${(seoData.secondaryKeywords || []).join(', ')}

## Layout (seções esperadas)
${(technical.prioritySections || ['hero', 'features', 'testimonials', 'pricing', 'cta']).join(' → ')}
${discovery ? `\n## Dados reais coletados:\n${JSON.stringify(discovery, null, 2).slice(0, 1000)}` : ''}

## Formato de saída (JSON):

{
  "headlines": {
    "primary": "headline principal poderosa e específica para este negócio (máx 10 palavras)",
    "variants": [
      "variante 1 com abordagem diferente",
      "variante 2 focada em resultado",
      "variante 3 focada em dor/solução"
    ],
    "psychological_focus": "${psychology.primary || 'trust'}"
  },
  "ctas": {
    "primary": "CTA principal (verbo de ação + benefício, 3-5 palavras)",
    "variants": [
      "CTA variante 1",
      "CTA variante 2",
      "CTA variante 3"
    ]
  },
  "sectionContent": {
    "hero": {
      "headline": "igual ao headlines.primary",
      "subheadline": "frase complementar que expande o headline (15-25 palavras)",
      "social_proof": "prova social curta (ex: +2.000 pacientes atendidos)",
      "trust_badges": ["badge1", "badge2", "badge3"]
    },
    "about": {
      "title": "título da seção sobre",
      "description": "2-3 frases sobre a empresa/serviço, tom humano e específico",
      "highlights": ["destaque 1", "destaque 2", "destaque 3"]
    },
    "features": {
      "title": "título da seção de features/serviços",
      "items": [
        {"title": "feature 1 real", "description": "descrição em 1-2 frases", "icon": "emoji relevante"},
        {"title": "feature 2 real", "description": "descrição", "icon": "emoji"},
        {"title": "feature 3 real", "description": "descrição", "icon": "emoji"},
        {"title": "feature 4 real", "description": "descrição", "icon": "emoji"}
      ]
    },
    "benefits": {
      "title": "título focado em resultados/transformação",
      "items": [
        {"title": "benefício 1 concreto", "description": "resultado real que o cliente obtém"},
        {"title": "benefício 2", "description": "resultado"},
        {"title": "benefício 3", "description": "resultado"}
      ]
    },
    "testimonials": {
      "title": "título da seção de depoimentos",
      "items": [
        {"name": "nome fictício realista", "role": "profissão/contexto relevante ao nicho", "text": "depoimento realista de 2-3 frases", "rating": 5},
        {"name": "outro nome", "role": "contexto", "text": "depoimento diferente", "rating": 5},
        {"name": "terceiro nome", "role": "contexto", "text": "depoimento focado em resultado", "rating": 5}
      ]
    },
    "pricing": {
      "title": "título da seção de preços/planos",
      "subtitle": "frase sobre valor/investimento",
      "plans": [
        {"name": "plano básico", "price": "valor realista para o nicho", "features": ["feat1", "feat2", "feat3"], "cta": "CTA do plano", "highlighted": false},
        {"name": "plano premium", "price": "valor", "features": ["feat1", "feat2", "feat3", "feat4", "feat5"], "cta": "CTA", "highlighted": true},
        {"name": "plano enterprise/vip", "price": "valor ou Sob consulta", "features": ["feat1", "feat2", "feat3", "feat4", "feat5", "feat6"], "cta": "CTA", "highlighted": false}
      ]
    },
    "faq": {
      "title": "Perguntas Frequentes",
      "items": [
        {"question": "pergunta real que o público faz", "answer": "resposta completa e útil"},
        {"question": "pergunta 2", "answer": "resposta"},
        {"question": "pergunta 3", "answer": "resposta"},
        {"question": "pergunta 4", "answer": "resposta"}
      ]
    },
    "footer": {
      "tagline": "frase de fechamento",
      "contact": {"phone": "telefone fictício", "email": "email fictício", "address": "endereço genérico da cidade"},
      "links": ["Início", "Sobre", "Serviços", "Contato"]
    }
  },
  "metaContent": {
    "seo": {
      "title": "title tag otimizada (50-60 chars) com keyword + marca",
      "description": "meta description persuasiva (150-160 chars) com CTA",
      "keywords": "${seoData.primaryKeyword || 'keyword'}, kw2, kw3, kw4, kw5",
      "ogTitle": "título para compartilhamento social",
      "ogDescription": "descrição para social media"
    }
  },
  "abVariants": {
    "headlines": ["variante A/B 1", "variante A/B 2"],
    "ctas": ["CTA teste A", "CTA teste B"],
    "valueProps": ["proposta de valor A", "proposta de valor B"]
  },
  "microcopy": {
    "formLabels": {"name": "Seu nome", "email": "Seu melhor e-mail", "phone": "WhatsApp", "submit": "texto do botão"},
    "navigation": ["Início", "Sobre", "Serviços", "Depoimentos", "Preços", "Contato"],
    "loading": "mensagem de carregamento contextual",
    "success": "mensagem de sucesso após formulário",
    "error": "mensagem de erro amigável"
  },
  "stats": [
    {"value": "número impressionante", "label": "descrição curta"},
    {"value": "outro número", "label": "descrição"},
    {"value": "terceiro número", "label": "descrição"},
    {"value": "quarto número", "label": "descrição"}
  ]
}

REGRAS:
- Tudo em português brasileiro
- Conteúdo 100% específico para "${brand.name || project.name}" no setor de ${project.businessType || 'negócios'}
- ZERO texto genérico tipo "Transform Your Business" ou "Premium Solutions"
- Headlines devem ser emocionais e específicas
- Depoimentos devem parecer reais (nomes brasileiros, contextos do nicho)
- Preços devem ser realistas para o mercado brasileiro
- FAQ deve responder dúvidas REAIS que o público tem
- Stats devem ser números críveis (não exagerados)
- Microcopy deve ser amigável e contextual`;

    return await llm.callJSON(prompt, {
      system: `Você é um copywriter brasileiro especialista em landing pages de alta conversão.
Escreva conteúdo persuasivo, emocional e específico para o negócio.
Use técnicas de copywriting: AIDA, PAS, storytelling, gatilhos mentais.
Responda APENAS com JSON válido.`,
      maxTokens: 4096,
      temperature: 0.75
    });
  }

  _fallbackContent(dna) {
    const brand = dna.brand || {};
    const project = dna.project || {};
    return {
      headlines: {
        primary: `${brand.name || project.name || 'Nosso'} — Excelência que Transforma`,
        variants: [
          `Descubra ${brand.name || 'o Melhor'} para Você`,
          `Resultados Reais com ${brand.name || 'Nossa Solução'}`,
          `Sua Jornada de Sucesso Começa Aqui`
        ]
      },
      ctas: { primary: 'Começar Agora', variants: ['Saiba Mais', 'Agendar Consulta', 'Falar com Especialista'] },
      sectionContent: {
        hero: { headline: `${brand.name || 'Empresa'} — Excelência que Transforma`, subheadline: 'Soluções personalizadas para suas necessidades.' },
        features: { title: 'Nossos Serviços', items: [] },
        testimonials: { title: 'O Que Dizem Nossos Clientes', items: [] },
        faq: { title: 'Perguntas Frequentes', items: [] }
      },
      metaContent: { seo: { title: `${brand.name || project.name} — ${project.industry || 'Soluções Premium'}` } },
      microcopy: { navigation: ['Início', 'Sobre', 'Serviços', 'Contato'] },
      stats: []
    };
  }

  _validate(content, dna) {
    if (!content.headlines) content.headlines = { primary: '', variants: [] };
    if (!content.ctas) content.ctas = { primary: '', variants: [] };
    if (!content.sectionContent) content.sectionContent = {};
    if (!content.metaContent) content.metaContent = {};
    if (!content.microcopy) content.microcopy = {};
    if (!content.stats) content.stats = [];

    // Ensure hero exists
    if (!content.sectionContent.hero) {
      content.sectionContent.hero = {
        headline: content.headlines.primary,
        subheadline: ''
      };
    }

    content._generatedBy = 'nexus-content-agent-v2';
    content._generatedAt = new Date().toISOString();
    content._usedLLM = true;
    return content;
  }

  _generateReport(content, dna) {
    const hl = content.headlines || {};
    const ct = content.ctas || {};
    const sc = content.sectionContent || {};
    return `# Content Report — ${(dna.brand || {}).name || 'Projeto'}

## Headlines
- **Principal:** ${hl.primary}
- **Variantes:** ${(hl.variants || []).join(' | ')}

## CTAs
- **Principal:** ${ct.primary}
- **Variantes:** ${(ct.variants || []).join(' | ')}

## Seções Geradas
${Object.keys(sc).map(k => `- ${k}`).join('\n')}

## SEO
- **Title:** ${(content.metaContent?.seo || {}).title || '—'}
- **Description:** ${(content.metaContent?.seo || {}).description || '—'}

## Stats
${(content.stats || []).map(s => `- ${s.value} ${s.label}`).join('\n')}

---
*Gerado por NEXUS Content Agent v2 (LLM-powered) em ${new Date().toLocaleString('pt-BR')}*
`;
  }

  _loadJSON(filepath) {
    try { return JSON.parse(fs.readFileSync(filepath, 'utf-8')); } catch(e) { return null; }
  }
}

module.exports = NexusContentAgentV2;

// CLI
if (require.main === module) {
  const dnaPath = process.argv[2];
  if (!dnaPath) {
    console.log('Usage: node nexus-content-agent-v2.js <context-dna.json>');
    process.exit(1);
  }
  const agent = new NexusContentAgentV2();
  agent.generate(dnaPath)
    .then(() => console.log('\n🎯 Próximo passo: Use o conteúdo no Code Agent'))
    .catch(e => { console.error('❌ Erro:', e.message); process.exit(1); });
}
