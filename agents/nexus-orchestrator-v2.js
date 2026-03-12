#!/usr/bin/env node

/*
 * NEXUS ORCHESTRATOR v2.0
 * Pipeline completo: Discovery → Briefing → Report → Context → Design → Content → Image → Video → Code → Quality → Deploy
 * Usa Blackboard para estado central compartilhado
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const board = require('./nexus-blackboard');
const NexusBridge = require('./nexus-bridge');

const WORKSPACE = path.join(__dirname, '..');
const AGENTS_DIR = __dirname;

class NexusOrchestratorV2 {
  constructor() {
    this.name = "NEXUS Orchestrator v2.0";
    this.version = "2.0.0";

    // Pipeline completo com 11 estágios
    this.pipeline = [
      { stage: 'discovery',  script: 'nexus-discovery-agent.js', required: true,  parallel: false, timeout: 30000,
        description: 'Coleta dados da empresa (web, redes sociais, materiais)' },
      { stage: 'briefing',   script: 'nexus-briefing-agent.js',  required: true,  parallel: false, timeout: 60000,
        description: 'Gera briefing personalizado com perguntas adaptativas' },
      { stage: 'report',     script: 'nexus-briefing-report.js', required: false, parallel: false, timeout: 20000,
        description: 'Gera relatório visual do briefing (HTML)' },
      { stage: 'context',    script: 'nexus-context-agent.js',   required: true,  parallel: false, timeout: 60000,
        description: 'Analisa briefing e gera Context DNA' },
      { stage: 'design',     script: 'nexus-design-agent.js',    required: true,  parallel: ['image', 'video', 'content'], timeout: 90000,
        description: 'Gera design system contextual' },
      { stage: 'content',    script: 'nexus-content-agent.js',   required: true,  parallel: ['design', 'image', 'video'], timeout: 60000,
        description: 'Gera copy contextual otimizado' },
      { stage: 'image',      script: 'nexus-image-agent.js',     required: false, parallel: ['design', 'content', 'video'], timeout: 120000,
        description: 'Gera prompts para imagens contextuais' },
      { stage: 'video',      script: 'nexus-video-agent.js',     required: false, parallel: ['design', 'content', 'image'], timeout: 90000,
        description: 'Gera prompts para vídeos cinematográficos' },
      { stage: 'code',       script: 'nexus-code-agent.js',      required: true,  parallel: false, timeout: 180000,
        description: 'Gera site completo production-ready',
        depends: ['context', 'design', 'content'] },
      { stage: 'quality',    script: 'nexus-quality-agent.js',   required: true,  parallel: false, timeout: 120000,
        description: 'Audit de qualidade e performance',
        depends: ['code'] },
      { stage: 'deploy',     script: null,                       required: false, parallel: false, timeout: 60000,
        description: 'Deploy para GitHub Pages ou VPS' }
    ];
  }

  // ========== MAIN PIPELINE ==========

  async run(projectName, opts = {}) {
    const startTime = Date.now();
    console.log(`\n🎯 NEXUS ORCHESTRATOR v2.0`);
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

    // Determine start point (resume from last incomplete stage)
    const startStage = opts.from || board.getNextStage() || 'discovery';
    const stageIndex = this.pipeline.findIndex(p => p.stage === startStage);

    console.log(`▶ Iniciando de: ${startStage}\n`);

    // Sequential execution with parallel groups
    for (let i = stageIndex; i < this.pipeline.length; i++) {
      const step = this.pipeline[i];

      // Skip if already complete
      if (board.get(`pipeline.stages.${step.stage}.status`) === 'complete') {
        console.log(`⏭️  ${step.stage} — já completo, pulando`);
        continue;
      }

      // Skip optional stages if --fast mode (but never skip deploy when --deploy is set)
      if (opts.fast && !step.required && !(step.stage === 'deploy' && opts.deploy)) {
        board.transition(step.stage, 'skipped');
        console.log(`⏭️  ${step.stage} — pulado (modo fast)`);
        continue;
      }

      // Check dependencies
      if (step.depends) {
        const unmet = step.depends.filter(d => 
          board.get(`pipeline.stages.${d}.status`) !== 'complete'
        );
        if (unmet.length > 0) {
          console.log(`⚠️  ${step.stage} — dependências não completas: ${unmet.join(', ')}`);
          if (step.required) {
            board.addError(step.stage, `Unmet dependencies: ${unmet.join(', ')}`);
            board.transition(step.stage, 'failed');
            continue;
          }
          board.transition(step.stage, 'skipped');
          continue;
        }
      }

      // Execute stage
      const success = await this._executeStage(step, projectName, opts);
      
      if (!success && step.required) {
        console.log(`\n❌ Pipeline parado em: ${step.stage}`);
        console.log(`   Use: node nexus-orchestrator-v2.js ${projectName} --from ${step.stage} para retomar\n`);
        break;
      }

      // Feedback loop: if quality score < 70, re-run code + quality (max 1 retry)
      if (step.stage === 'quality' && success && !opts._retried) {
        const qScore = board.get('quality.score') || 0;
        if (qScore > 0 && qScore < 70) {
          console.log(`\n🔄 Score ${qScore}/100 < 70 — re-gerando código...`);
          opts._retried = true;
          // Re-run code stage
          board.transition('code', 'pending');
          const codeStep = this.pipeline.find(p => p.stage === 'code');
          await this._executeStage(codeStep, projectName, opts);
          // Re-run quality
          board.transition('quality', 'pending');
          await this._executeStage(step, projectName, opts);
          const newScore = board.get('quality.score') || 0;
          console.log(`   Score após retry: ${newScore}/100`);
        }
      }

      // Human checkpoint after briefing report
      if (step.stage === 'report' && opts.interactive) {
        const cp = board.addCheckpoint('report', 'Revise o relatório do briefing antes de continuar', true);
        console.log(`\n🛑 CHECKPOINT: Revise o relatório e aprove para continuar`);
        console.log(`   ID: ${cp.id}`);
        console.log(`   Comando: node nexus-blackboard.js approve ${projectName} ${cp.id}\n`);
        break; // Pausa para revisão humana
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n${'═'.repeat(50)}`);
    console.log(`⏱️  Tempo total: ${elapsed}s`);
    console.log(board.summary());
    console.log(`${'═'.repeat(50)}\n`);

    return board.state;
  }

  // ========== STAGE EXECUTION ==========

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
    const scriptPath = path.join(WORKSPACE, script);
    if (!fs.existsSync(scriptPath)) {
      return { success: false, error: `Script not found: ${script}` };
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

  // ========== REFERENCES ==========

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
  node nexus-orchestrator-v2.js <project-name> [options]

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
  node nexus-orchestrator-v2.js summit-prop --company "Summit Prop" --url summitprop.com --niche trading --demo
  node nexus-orchestrator-v2.js summit-prop --from code
  node nexus-orchestrator-v2.js my-project --fast --deploy
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

  const orchestrator = new NexusOrchestratorV2();
  orchestrator.run(projectName, opts).catch(err => {
    console.error(`\n💥 Fatal error: ${err.message}`);
    process.exit(1);
  });
}

module.exports = NexusOrchestratorV2;
