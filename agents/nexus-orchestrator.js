#!/usr/bin/env node

/*
 * NEXUS ORCHESTRATOR v3.0
 * Declarative pipeline with real parallel execution
 * Discovery → Briefing → Report → Context → [Design | Content | Image | Video] → Code → Quality → Deploy
 * Uses Blackboard for shared central state
 */

const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');
const board = require('./nexus-blackboard');
const NexusBridge = require('./nexus-bridge');

const WORKSPACE = path.join(__dirname, '..');
const AGENTS_DIR = __dirname;

class NexusOrchestrator {
  constructor() {
    this.name = "NEXUS Orchestrator";
    this.version = "3.0.0";

    // Declarative pipeline with explicit waves
    // Each wave runs in parallel; waves execute sequentially
    this.pipeline = [
      // Wave 0: Data collection (sequential)
      { wave: 0, stage: 'discovery',  required: true,  timeout: 30000,
        description: 'Coleta dados da empresa (web, redes sociais, materiais)' },
      { wave: 1, stage: 'briefing',   required: true,  timeout: 60000,
        description: 'Gera briefing personalizado com perguntas adaptativas' },
      { wave: 2, stage: 'report',     required: false, timeout: 20000,
        description: 'Gera relatório visual do briefing (HTML)' },
      // Wave 3: Analysis
      { wave: 3, stage: 'context',    required: true,  timeout: 60000,
        description: 'Analisa briefing e gera Context DNA' },
      // Wave 3.5: Competitor research + extraction (parallel with nothing — runs after context)
      { wave: 3.5, stage: 'references', required: false, timeout: 120000,
        description: 'Pesquisa concorrentes, extrai componentes e sincroniza referências' },
      // Wave 4: PARALLEL — Design + Content + Image + Video all depend on Context only
      { wave: 4, stage: 'design',     required: true,  timeout: 90000,
        description: 'Gera design system contextual' },
      { wave: 4, stage: 'content',    required: true,  timeout: 60000,
        description: 'Gera copy contextual otimizado' },
      { wave: 4, stage: 'image',      required: false, timeout: 120000,
        description: 'Gera prompts para imagens contextuais' },
      { wave: 4, stage: 'video',      required: false, timeout: 90000,
        description: 'Gera prompts para vídeos cinematográficos' },
      // Wave 5: Assembly (depends on wave 4)
      { wave: 5, stage: 'code',       required: true,  timeout: 180000,
        description: 'Gera site completo production-ready' },
      // Wave 6: Validation
      { wave: 6, stage: 'quality',    required: true,  timeout: 120000,
        description: 'Audit de qualidade e performance' },
      // Wave 7: Ship
      { wave: 7, stage: 'deploy',     required: false, timeout: 60000,
        description: 'Deploy para GitHub Pages ou VPS' }
    ];
  }

  // ========== MAIN PIPELINE ==========

  async run(projectName, opts = {}) {
    const startTime = Date.now();
    console.log(`\n🎯 NEXUS ORCHESTRATOR v3.0`);
    console.log(`${'═'.repeat(50)}`);
    console.log(`📂 Projeto: ${projectName}`);
    console.log(`⏰ Início: ${new Date().toLocaleString('pt-BR')}`);
    console.log(`${'═'.repeat(50)}\n`);

    // Init blackboard
    board.init(projectName, { reset: opts.reset });

    // Load references from Trend Scout if available
    if (opts.niche) {
      this._loadReferences(opts.niche);
    }

    // Group pipeline into waves
    const waves = this._groupByWave();

    // Determine start wave
    const startStage = opts.from || board.getNextStage() || 'discovery';
    const startWave = this.pipeline.find(p => p.stage === startStage)?.wave || 0;

    console.log(`▶ Iniciando de: ${startStage} (wave ${startWave})\n`);

    // Execute wave by wave
    for (const [waveNum, steps] of Object.entries(waves)) {
      if (parseInt(waveNum) < startWave) continue;

      // Filter steps for this wave
      const activeSteps = steps.filter(step => {
        const status = board.get(`pipeline.stages.${step.stage}.status`);
        if (status === 'complete') {
          console.log(`⏭️  ${step.stage} — já completo`);
          return false;
        }
        if (opts.fast && !step.required && !(step.stage === 'deploy' && opts.deploy)) {
          board.transition(step.stage, 'skipped');
          console.log(`⏭️  ${step.stage} — pulado (modo fast)`);
          return false;
        }
        return true;
      });

      if (activeSteps.length === 0) continue;

      // Execute wave
      if (activeSteps.length === 1) {
        // Single stage — run directly
        const step = activeSteps[0];
        const success = await this._executeStage(step, projectName, opts);
        if (!success && step.required) {
          console.log(`\n❌ Pipeline parado em: ${step.stage}`);
          console.log(`   Use: node nexus-orchestrator.js ${projectName} --from ${step.stage}\n`);
          break;
        }
      } else {
        // Multiple stages in this wave — run in PARALLEL
        console.log(`\n⚡ WAVE ${waveNum} — executando ${activeSteps.length} agentes em paralelo`);
        console.log(`   ${activeSteps.map(s => s.stage).join(' | ')}\n`);

        const results = await Promise.allSettled(
          activeSteps.map(step => this._executeStageAsync(step, projectName, opts))
        );

        // Check results
        let waveFailed = false;
        results.forEach((result, idx) => {
          const step = activeSteps[idx];
          if (result.status === 'rejected' || !result.value) {
            if (step.required) waveFailed = true;
          }
        });

        if (waveFailed) {
          const failed = activeSteps.filter((s, i) =>
            s.required && (results[i].status === 'rejected' || !results[i].value)
          );
          console.log(`\n❌ Pipeline parado na wave ${waveNum}: ${failed.map(s => s.stage).join(', ')} falharam`);
          break;
        }
      }

      // Feedback loop: if quality score < 70, re-run code + quality (max 1 retry)
      const qualityStep = activeSteps.find(s => s.stage === 'quality');
      if (qualityStep && !opts._retried) {
        const qScore = board.get('quality.score') || 0;
        if (qScore > 0 && qScore < 70) {
          console.log(`\n🔄 Score ${qScore}/100 < 70 — re-gerando código...`);
          opts._retried = true;
          board.transition('code', 'pending');
          const codeStep = this.pipeline.find(p => p.stage === 'code');
          await this._executeStage(codeStep, projectName, opts);
          board.transition('quality', 'pending');
          await this._executeStage(qualityStep, projectName, opts);
          console.log(`   Score após retry: ${board.get('quality.score') || 0}/100`);
        }
      }

      // Human checkpoint after briefing report
      const reportStep = activeSteps.find(s => s.stage === 'report');
      if (reportStep && opts.interactive) {
        const cp = board.addCheckpoint('report', 'Revise o relatório do briefing antes de continuar', true);
        console.log(`\n🛑 CHECKPOINT: Revise o relatório e aprove para continuar`);
        console.log(`   ID: ${cp.id}`);
        console.log(`   Comando: node nexus-blackboard.js approve ${projectName} ${cp.id}\n`);
        break;
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n${'═'.repeat(50)}`);
    console.log(`⏱️  Tempo total: ${elapsed}s`);
    console.log(board.summary());
    console.log(`${'═'.repeat(50)}\n`);

    return board.state;
  }

  // Group pipeline steps by wave number
  _groupByWave() {
    const waves = {};
    for (const step of this.pipeline) {
      if (!waves[step.wave]) waves[step.wave] = [];
      waves[step.wave].push(step);
    }
    return waves;
  }

  // ========== STAGE EXECUTION ==========

  // Async wrapper for parallel execution (non-blocking child processes)
  async _executeStageAsync(step, projectName, opts) {
    const bridgeStages = ['context', 'design', 'content', 'code', 'quality'];
    if (bridgeStages.includes(step.stage)) {
      console.log(`  🔄 ${step.stage.toUpperCase()} — ${step.description}`);
      board.transition(step.stage, 'running');
      const start = Date.now();
      try {
        const bridge = new NexusBridge(projectName);
        const ok = await bridge.runAgentAsync(step.stage);
        if (ok) {
          board.transition(step.stage, 'complete');
          const elapsed = ((Date.now() - start) / 1000).toFixed(1);
          console.log(`  ✅ ${step.stage} completo em ${elapsed}s`);
          return true;
        } else {
          board.addError(step.stage, `${step.stage}: no output collected`);
          board.transition(step.stage, 'failed');
          console.log(`  ❌ ${step.stage} falhou: no output`);
          return false;
        }
      } catch (err) {
        board.addError(step.stage, err);
        board.transition(step.stage, 'failed');
        console.log(`  ❌ ${step.stage} erro: ${err.message}`);
        return false;
      }
    }
    // Fallback to sync for non-bridge stages
    return this._executeStage(step, projectName, opts);
  }

  async _executeStage(step, projectName, opts) {
    console.log(`\n${'─'.repeat(40)}`);
    console.log(`🔄 ${step.stage.toUpperCase()} — ${step.description}`);
    console.log(`${'─'.repeat(40)}`);

    board.transition(step.stage, 'running');
    const start = Date.now();

    try {
      let result;

      switch (step.stage) {
        case 'discovery':
          result = await this._runDiscovery(projectName, opts);
          break;
        case 'briefing':
          result = await this._runBriefing(projectName, opts);
          break;
        case 'report':
          result = await this._runReport(projectName, opts);
          break;
        case 'context':
          result = await this._runViaBridge(projectName, 'context');
          break;
        case 'references':
          result = await this._runReferenceHunter(projectName, opts);
          break;
        case 'design':
          result = await this._runViaBridge(projectName, 'design');
          break;
        case 'content':
          result = await this._runViaBridge(projectName, 'content');
          break;
        case 'image':
          result = await this._runShellAgent('nexus-images.sh', projectName, opts);
          break;
        case 'video':
          result = await this._runShellAgent('nexus-video.sh', projectName, opts);
          break;
        case 'code':
          result = await this._runViaBridge(projectName, 'code');
          break;
        case 'quality':
          result = await this._runViaBridge(projectName, 'quality');
          break;
        case 'deploy':
          result = await this._runDeploy(projectName, opts);
          break;
        default:
          result = { success: false, error: 'Unknown stage' };
      }

      if (result.success) {
        // Validate expected outputs exist
        const validation = this._validateStageOutput(step.stage, projectName);
        if (!validation.valid) {
          console.log(`  ⚠️ ${step.stage} output validation: ${validation.warnings.join('; ')}`);
        }
        board.transition(step.stage, 'complete');
        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        console.log(`✅ ${step.stage} completo em ${elapsed}s`);
        return true;
      } else {
        board.addError(step.stage, result.error || 'Unknown error');
        board.transition(step.stage, 'failed');
        console.log(`❌ ${step.stage} falhou: ${result.error}`);
        return false;
      }
    } catch (err) {
      board.addError(step.stage, err);
      board.transition(step.stage, 'failed');
      console.log(`❌ ${step.stage} erro: ${err.message}`);
      return false;
    }
  }

  // ========== AGENT RUNNERS ==========

  async _runViaBridge(projectName, stage) {
    try {
      const bridge = new NexusBridge(projectName);
      const ok = bridge.runAgent(stage);
      return { success: ok, error: ok ? null : `${stage}: no output collected` };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async _runDiscovery(projectName, opts) {
    const args = [path.join(AGENTS_DIR, 'nexus-discovery-agent.js')];
    args.push(opts.company || projectName);
    args.push(projectName);
    if (opts.url) args.push('--url', opts.url);
    if (opts.instagram) args.push('--instagram', opts.instagram);

    try {
      const output = execSync(`node ${args.join(' ')}`, {
        cwd: WORKSPACE, timeout: 30000, encoding: 'utf-8'
      });

      // Read discovery output and merge into blackboard
      const discoveryFile = path.join(WORKSPACE, 'projects', projectName, 'discovery-data.json');
      if (fs.existsSync(discoveryFile)) {
        const data = JSON.parse(fs.readFileSync(discoveryFile, 'utf-8'));
        board.set('discovery', {
          company: data.company || {},
          website: data.website || {},
          social: data.social || {},
          colors: data.colors || [],
          fonts: data.fonts || [],
          techStack: data.techStack || [],
          sector: data.sector || null,
          completeness: data.completenessScore || 0
        });
      }
      console.log(output.split('\n').slice(-5).join('\n'));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async _runBriefing(projectName, opts) {
    if (opts.demo) {
      // Demo mode — auto-generate brief without interaction
      const args = [path.join(AGENTS_DIR, 'nexus-briefing-agent.js'), projectName, '--demo'];
      try {
        execSync(`node ${args.join(' ')}`, { cwd: WORKSPACE, timeout: 60000, encoding: 'utf-8' });
        const briefFile = path.join(WORKSPACE, 'projects', projectName, 'creative-brief.json');
        if (fs.existsSync(briefFile)) {
          const brief = JSON.parse(fs.readFileSync(briefFile, 'utf-8'));
          board.set('briefing.brief', brief);
          board.set('briefing.completeness', brief.completeness || 0);
        }
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    // Interactive mode — needs Telegram integration (future)
    console.log('   ℹ️  Briefing interativo via Telegram ainda não integrado');
    console.log('   ℹ️  Use --demo para modo demonstração');
    return { success: true };
  }

  async _runReport(projectName, opts) {
    const args = [path.join(AGENTS_DIR, 'nexus-briefing-report.js'), projectName];
    try {
      execSync(`node ${args.join(' ')}`, { cwd: WORKSPACE, timeout: 20000, encoding: 'utf-8' });
      const reportPath = path.join(WORKSPACE, 'projects', projectName, 'briefing-report.html');
      if (fs.existsSync(reportPath)) {
        board.set('report.htmlPath', reportPath);
        board.set('report.generatedAt', new Date().toISOString());
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async _runShellAgent(script, projectName, opts) {
    const scriptPath = path.join(WORKSPACE, 'bin', script);
    if (!fs.existsSync(scriptPath)) {
      return { success: false, error: `Script not found: bin/${script}` };
    }
    try {
      const output = execSync(`bash ${scriptPath} "${projectName}"`, {
        cwd: WORKSPACE, timeout: 180000, encoding: 'utf-8'
      });
      console.log(output.split('\n').slice(-3).join('\n'));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.stderr || err.message };
    }
  }

  async _runDeploy(projectName, opts) {
    const outputDir = path.join(WORKSPACE, 'projects', projectName, 'output');
    const generatedSite = path.join(WORKSPACE, 'generated-site');
    const slug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    if (!fs.existsSync(outputDir)) {
      return { success: false, error: 'No output directory found' };
    }

    try {
      // Copy to generated-site/index.html (latest)
      fs.mkdirSync(generatedSite, { recursive: true });
      execSync(`cp ${outputDir}/index.html ${generatedSite}/index.html`, { cwd: WORKSPACE });
      console.log('   Copiado para generated-site/index.html');

      // Copy to generated-site/<slug>/index.html (project-specific URL)
      const projectSiteDir = path.join(generatedSite, slug);
      fs.mkdirSync(projectSiteDir, { recursive: true });
      execSync(`cp ${outputDir}/index.html ${projectSiteDir}/index.html`, { cwd: WORKSPACE });
      console.log(`   Copiado para generated-site/${slug}/index.html`);

      // Update navigation index
      this._updateSiteIndex(generatedSite);

      // Git commit and push
      execSync(`cd ${WORKSPACE} && git add generated-site/ && git commit -m "deploy: ${slug}"`, {
        timeout: 15000, encoding: 'utf-8'
      });
      console.log('   Git commit criado');

      execSync(`cd ${WORKSPACE} && git push origin main`, { timeout: 30000, encoding: 'utf-8' });
      console.log('   Push para GitHub Pages');

      const baseUrl = 'https://gabrielrbm-prog.github.io/nexus-framework/generated-site';
      board.set('deploy.url', `${baseUrl}/${slug}/`);
      board.set('deploy.indexUrl', `${baseUrl}/`);
      board.set('deploy.platform', 'github-pages');
      board.set('deploy.deployedAt', new Date().toISOString());
      board.set('deploy.slug', slug);

      console.log(`\n   URL: ${baseUrl}/${slug}/`);
      console.log(`   Index: ${baseUrl}/`);

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  _updateSiteIndex(generatedSiteDir) {
    try {
      const dirs = fs.readdirSync(generatedSiteDir).filter(f => {
        const fp = path.join(generatedSiteDir, f);
        return fs.statSync(fp).isDirectory() && fs.existsSync(path.join(fp, 'index.html'));
      });
      if (dirs.length === 0) return;
      const links = dirs.map(d => `      <a href="${d}/" class="project-link">${d}</a>`).join('\n');
      const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>NEXUS Framework</title>
  <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Inter',-apple-system,sans-serif;background:#0a0a0f;color:#e2e8f0;min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:60px 24px}h1{font-size:32px;font-weight:800;background:linear-gradient(90deg,#3b82f6,#22d3ee,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:12px}.sub{color:#94a3b8;font-size:16px;margin-bottom:48px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px;max-width:900px;width:100%}.project-link{display:block;padding:24px;background:rgba(18,18,26,.9);border:1px solid rgba(255,255,255,.06);border-radius:16px;text-decoration:none;color:#e2e8f0;font-size:18px;font-weight:600;transition:all .3s;text-transform:capitalize}.project-link:hover{background:rgba(59,130,246,.1);border-color:rgba(59,130,246,.3);transform:translateY(-2px);box-shadow:0 8px 30px rgba(59,130,246,.15)}.ct{color:#94a3b8;font-size:14px;margin-top:32px}</style>
</head>
<body>
  <h1>NEXUS Framework</h1>
  <p class="sub">Landing pages geradas automaticamente</p>
  <div class="grid">
${links}
  </div>
  <p class="ct">${dirs.length} projeto${dirs.length > 1 ? 's' : ''}</p>
</body></html>`;
      fs.writeFileSync(path.join(generatedSiteDir, 'index.html'), html, 'utf-8');
    } catch (err) {
      console.log('   [warn] Site index update failed:', err.message);
    }
  }

  // ========== OUTPUT VALIDATION ==========

  _validateStageOutput(stage, projectName) {
    const projectDir = path.join(WORKSPACE, 'projects', projectName);
    const warnings = [];

    const expectedFiles = {
      discovery: ['discovery-data.json'],
      briefing:  ['creative-brief.json'],
      context:   ['context-dna.json'],
      design:    ['design-system/design-system.json'],
      content:   ['content/all-content.json', 'all-content.json', 'content-assets/all-content.json'],
      code:      ['output/index.html'],
      quality:   ['quality-report.md', 'quality-report.json'],
    };

    const files = expectedFiles[stage];
    if (!files) return { valid: true, warnings: [] };

    // For stages with multiple possible locations, at least one must exist
    const found = files.some(f => fs.existsSync(path.join(projectDir, f)));
    if (!found) {
      warnings.push(`Missing output: expected one of [${files.join(', ')}]`);
    }

    // Validate JSON files are parseable
    for (const f of files) {
      const fp = path.join(projectDir, f);
      if (fs.existsSync(fp) && f.endsWith('.json')) {
        try {
          const data = JSON.parse(fs.readFileSync(fp, 'utf-8'));
          if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
            warnings.push(`${f} is empty`);
          }
        } catch (e) {
          warnings.push(`${f} is invalid JSON: ${e.message}`);
        }
      }
    }

    return { valid: warnings.length === 0, warnings };
  }

  // ========== REFERENCES ==========

  async _runReferenceHunter(projectName, opts) {
    try {
      const NexusReferenceHunter = require('./nexus-reference-hunter');
      const hunter = new NexusReferenceHunter(projectName, {
        niche: opts.niche || board.get('references.niche') || board.get('discovery.sector'),
        max: opts.maxRefs || 5,
      });
      const result = await hunter.run();

      if (result.success && result.analysis) {
        board.set('references.competitorAnalysis', result.analysis);
        board.set('references.commonPatterns', result.analysis.commonPatterns);
        board.set('references.sitesAnalyzed', result.analysis.competitorsAnalyzed);
        board.set('references.componentsExtracted', result.analysis.totalComponentsExtracted);
      }

      return { success: result.success, error: result.error || null };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  _loadReferences(niche) {
    const nicheFile = path.join(WORKSPACE, 'references-db', 'niches', `${niche}.json`);
    if (fs.existsSync(nicheFile)) {
      const refs = JSON.parse(fs.readFileSync(nicheFile, 'utf-8'));
      board.set('references.niche', niche);
      board.set('references.sites', refs.sites || []);
      board.set('references.components', refs.topComponents || []);
      console.log(`📚 Loaded ${(refs.sites || []).length} references for niche: ${niche}`);
    }
  }
}

// ========== CLI ==========

if (require.main === module) {
  const args = process.argv.slice(2);
  const projectName = args[0];

  if (!projectName || projectName === '--help') {
    console.log(`
NEXUS Orchestrator v2.0 — Full Pipeline Controller

Usage:
  node nexus-orchestrator.js <project-name> [options]

Options:
  --company "Name"     Company name for discovery
  --url site.com       Company website
  --instagram @handle  Instagram handle
  --niche trading      Load references from Trend Scout DB
  --from <stage>       Resume from specific stage
  --fast               Skip optional stages (image, video, report)
  --demo               Use demo mode for briefing (no interaction)
  --deploy             Auto-deploy to GitHub Pages
  --interactive        Enable human checkpoints
  --reset              Reset project state

Pipeline:
  1. Discovery   → Coleta dados da empresa
  2. Briefing    → Gera briefing personalizado
  3. Report      → Relatório visual do briefing
  4. Context     → Análise e Context DNA
  5. Design      → Design system contextual
  6. Content     → Copy otimizado (parallel com 5,7,8)
  7. Image       → Prompts de imagens (parallel)
  8. Video       → Prompts de vídeos (parallel)
  9. Code        → Site production-ready
  10. Quality    → Audit de qualidade
  11. Deploy     → GitHub Pages / VPS

Examples:
  node nexus-orchestrator.js summit-prop --company "Summit Prop" --url summitprop.com --niche trading --demo
  node nexus-orchestrator.js summit-prop --from code
  node nexus-orchestrator.js my-project --fast --deploy
    `);
    process.exit(0);
  }

  // Parse options
  const opts = {};
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--fast') opts.fast = true;
    else if (arg === '--demo') opts.demo = true;
    else if (arg === '--deploy') opts.deploy = true;
    else if (arg === '--interactive') opts.interactive = true;
    else if (arg === '--reset') opts.reset = true;
    else if (arg === '--company' && args[i+1]) opts.company = args[++i];
    else if (arg === '--url' && args[i+1]) opts.url = args[++i];
    else if (arg === '--instagram' && args[i+1]) opts.instagram = args[++i];
    else if (arg === '--niche' && args[i+1]) opts.niche = args[++i];
    else if (arg === '--from' && args[i+1]) opts.from = args[++i];
  }

  const orchestrator = new NexusOrchestrator();
  orchestrator.run(projectName, opts).catch(err => {
    console.error(`\n💥 Fatal error: ${err.message}`);
    process.exit(1);
  });
}

module.exports = NexusOrchestrator;
