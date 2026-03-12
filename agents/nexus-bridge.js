#!/usr/bin/env node

/*
 * NEXUS BRIDGE
 * Conecta agents legados ao Blackboard System
 * Pré-popula inputs e coleta outputs de cada agent
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const board = require('./nexus-blackboard');

const WORKSPACE = path.join(__dirname, '..');
const AGENTS_DIR = __dirname;

class NexusBridge {

  constructor(projectName) {
    this.projectName = projectName;
    this.projectDir = path.join(WORKSPACE, 'projects', projectName);
    board.init(projectName);
  }

  // ========== PRE-STAGE: Populate files agents expect ==========

  prepareContext() {
    // Context agent takes briefing as CLI arg + project name
    // If we have briefing data from Blackboard, build a briefing string
    const brief = board.get('briefing.brief');
    const discovery = board.get('discovery');

    if (brief || discovery) {
      let briefingText = '';

      if (brief) {
        briefingText = [
          brief.projectName || this.projectName,
          brief.objective || '',
          brief.targetAudience || '',
          brief.differentials ? (brief.differentials.join ? brief.differentials.join(', ') : brief.differentials) : '',
          brief.tone || '',
          brief.sector || ''
        ].filter(Boolean).join('. ');
      }

      if (discovery && discovery.company) {
        const d = discovery;
        const extras = [
          d.company.name ? `Empresa: ${d.company.name}` : '',
          d.sector ? `Setor: ${d.sector}` : '',
          d.colors && d.colors.length ? `Cores da marca: ${d.colors.slice(0, 5).join(', ')}` : '',
          d.fonts && d.fonts.length ? `Fontes: ${d.fonts.slice(0, 3).join(', ')}` : '',
          d.website && d.website.url ? `Site: ${d.website.url}` : ''
        ].filter(Boolean);
        if (extras.length) briefingText += '. ' + extras.join('. ');
      }

      return briefingText || this.projectName;
    }

    return this.projectName;
  }

  // After context agent runs, collect its output
  collectContext() {
    const dnaPath = path.join(this.projectDir, 'context-dna.json');
    if (fs.existsSync(dnaPath)) {
      const dna = JSON.parse(fs.readFileSync(dnaPath, 'utf-8'));
      board.set('context.dna', dna);
      board.set('context.keywords', dna.seo?.keywords || []);
      board.set('context.tone', dna.psychology?.primary || null);
      board.set('context.audience', dna.audience || null);
      return true;
    }
    return false;
  }

  // After design agent runs, collect its output
  collectDesign() {
    // Design agent may write to project dir OR workspace root (legacy behavior)
    const locations = [
      path.join(this.projectDir, 'design-system', 'design-system.json'),
      path.join(WORKSPACE, 'design-system', 'design-system.json')
    ];
    for (const designFile of locations) {
      if (fs.existsSync(designFile)) {
        const ds = JSON.parse(fs.readFileSync(designFile, 'utf-8'));
        board.set('design.system', ds);
        board.set('design.palette', ds.colors || []);
        board.set('design.typography', ds.typography || null);
        board.set('design.layout', ds.layout || null);
        board.set('design.components', ds.components || []);
        // Copy to project dir if it was in workspace root
        const sourceDir = path.dirname(designFile);
        if (!designFile.startsWith(this.projectDir)) {
          const targetDir = path.join(this.projectDir, 'design-system');
          if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
          fs.readdirSync(sourceDir).forEach(f => {
            fs.copyFileSync(path.join(sourceDir, f), path.join(targetDir, f));
          });
          console.log(`   📁 Design system copiado para projeto`);
        }
        return true;
      }
    }
    return false;
  }

  // After content agent runs, collect its output
  collectContent() {
    const searchPaths = [
      path.join(this.projectDir, 'content-assets', 'all-content.json'),
      path.join(this.projectDir, 'all-content.json'),
      path.join(WORKSPACE, 'content-assets', 'all-content.json'),
      path.join(WORKSPACE, 'content', 'all-content.json')
    ];
    const file = searchPaths.find(p => fs.existsSync(p));

    if (file) {
      const content = JSON.parse(fs.readFileSync(file, 'utf-8'));
      board.set('content.hero', content.hero || null);
      board.set('content.sections', content.sections || []);
      board.set('content.cta', content.ctas || content.cta || []);
      board.set('content.seo', content.seo || null);
      board.set('content.copy', content);
      return true;
    }
    return false;
  }

  // After code agent runs, collect its output
  collectCode() {
    const outputDir = path.join(this.projectDir, 'output');
    const collected = { html: null, css: null, js: null, outputPath: null };

    // Check various output locations (project dir, workspace root, generated-site)
    const locations = [outputDir, this.projectDir, path.join(WORKSPACE, 'generated-site'), WORKSPACE];
    for (const loc of locations) {
      if (!fs.existsSync(loc)) continue;
      const files = fs.readdirSync(loc);
      for (const f of files) {
        const full = path.join(loc, f);
        if (f.endsWith('.html') && !collected.html) collected.html = full;
        if (f === 'styles.css' || f === 'main.css') collected.css = full;
        if (f === 'main.js' || f === 'script.js') collected.js = full;
      }
      if (collected.html) { collected.outputPath = loc; break; }
    }

    if (collected.html) {
      board.set('code.html', collected.html);
      board.set('code.css', collected.css);
      board.set('code.js', collected.js);
      board.set('code.outputPath', collected.outputPath);
      return true;
    }
    return false;
  }

  // After quality agent runs, collect its output
  collectQuality() {
    // Quality agent writes quality-report.md (not JSON) — parse scores from text
    const searchPaths = [
      path.join(this.projectDir, 'quality-report.json'),
      path.join(this.projectDir, 'quality-report.md'),
      path.join(WORKSPACE, 'quality-report.json'),
      path.join(WORKSPACE, 'quality-report.md')
    ];

    for (const reportPath of searchPaths) {
      if (!fs.existsSync(reportPath)) continue;

      if (reportPath.endsWith('.json')) {
        const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
        board.set('quality.score', report.score || 0);
        board.set('quality.issues', report.issues || []);
        board.set('quality.passed', (report.score || 0) >= 70);
        return true;
      }

      // Parse .md report for scores
      const md = fs.readFileSync(reportPath, 'utf-8');
      const scoreMatch = md.match(/Score Geral[:\s]*(\d+)/i) || md.match(/overall[:\s]*(\d+)/i);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;

      const issues = [];
      const issueMatches = md.match(/^[-*]\s+.+$/gm) || [];
      issueMatches.slice(0, 20).forEach(line => issues.push(line.replace(/^[-*]\s+/, '')));

      board.set('quality.score', score);
      board.set('quality.issues', issues);
      board.set('quality.passed', score >= 70);

      // Copy to project dir if needed
      if (!reportPath.startsWith(this.projectDir)) {
        const dest = path.join(this.projectDir, path.basename(reportPath));
        fs.copyFileSync(reportPath, dest);
      }
      return true;
    }
    return false;
  }

  // ========== RUN WITH BRIDGE ==========

  runAgent(stage) {
    const runners = {
      context: () => {
        const briefing = this.prepareContext();
        const cmd = `node ${path.join(AGENTS_DIR, 'nexus-context-agent.js')} "${briefing}" "${this.projectName}"`;
        execSync(cmd, { cwd: WORKSPACE, timeout: 60000, stdio: 'inherit' });
        return this.collectContext();
      },
      design: () => {
        const dnaPath = path.join(this.projectDir, 'context-dna.json');
        const cmd = `node ${path.join(AGENTS_DIR, 'nexus-design-agent.js')} "${dnaPath}"`;
        execSync(cmd, { cwd: WORKSPACE, timeout: 90000, stdio: 'inherit' });
        return this.collectDesign();
      },
      content: () => {
        const dnaPath = path.join(this.projectDir, 'context-dna.json');
        const cmd = `node ${path.join(AGENTS_DIR, 'nexus-content-agent.js')} "${dnaPath}"`;
        execSync(cmd, { cwd: WORKSPACE, timeout: 60000, stdio: 'inherit' });
        return this.collectContent();
      },
      code: () => {
        const dnaPath = path.join(this.projectDir, 'context-dna.json');
        // Use Code Agent v2 with real component library
        const agentScript = fs.existsSync(path.join(AGENTS_DIR, 'nexus-code-agent-v2.js'))
          ? 'nexus-code-agent-v2.js' : 'nexus-code-agent.js';
        const cmd = `node ${path.join(AGENTS_DIR, agentScript)} "${dnaPath}"`;
        execSync(cmd, { cwd: WORKSPACE, timeout: 180000, stdio: 'inherit' });
        return this.collectCode();
      },
      quality: () => {
        // Quality agent expects: <context-dna-path> <site-directory>
        const dnaPath = path.join(this.projectDir, 'context-dna.json');
        const siteDir = board.get('code.outputPath') || path.join(WORKSPACE, 'generated-site');
        if (!fs.existsSync(dnaPath)) {
          console.log('   No context-dna.json found for quality audit');
          return false;
        }
        const cmd = `node ${path.join(AGENTS_DIR, 'nexus-quality-agent.js')} "${dnaPath}" "${siteDir}"`;
        execSync(cmd, { cwd: WORKSPACE, timeout: 120000, stdio: 'inherit' });
        return this.collectQuality();
      }
    };

    if (!runners[stage]) {
      console.log(`   Bridge: no runner for stage '${stage}'`);
      return false;
    }

    return runners[stage]();
  }
}

module.exports = NexusBridge;

// CLI
if (require.main === module) {
  const [project, stage] = process.argv.slice(2);
  if (!project || !stage) {
    console.log('Usage: node nexus-bridge.js <project> <stage>');
    console.log('Stages: context, design, content, code, quality');
    process.exit(1);
  }
  const bridge = new NexusBridge(project);
  const ok = bridge.runAgent(stage);
  console.log(ok ? `\n✅ ${stage} → Blackboard updated` : `\n❌ ${stage} → no output collected`);
}
