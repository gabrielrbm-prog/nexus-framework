#!/usr/bin/env node

/*
 * NEXUS BLACKBOARD SYSTEM
 * Estado central compartilhado entre todos os agentes (Blackboard Pattern)
 * Cada agente lê e escreve no state via API simples
 * 
 * Usage:
 *   const board = require('./nexus-blackboard');
 *   board.init('meu-projeto');
 *   board.set('discovery.company', { name: 'Acme' });
 *   board.get('discovery.company.name'); // 'Acme'
 *   board.transition('discovery', 'complete');
 */

const fs = require('fs');
const path = require('path');

const PROJECTS_DIR = path.join(__dirname, '..', 'projects');

class NexusBlackboard {
  constructor() {
    this.projectName = null;
    this.statePath = null;
    this.state = null;
    this.lockFile = null;
    this._snapshots = [];
    this._forceOverwrite = false;
  }

  // ========== CORE ==========

  init(projectName, opts = {}) {
    this.projectName = projectName;
    const projectDir = path.join(PROJECTS_DIR, projectName);
    if (!fs.existsSync(projectDir)) fs.mkdirSync(projectDir, { recursive: true });

    this.statePath = path.join(projectDir, 'project-state.json');
    this.lockFile = path.join(projectDir, '.state.lock');

    if (fs.existsSync(this.statePath) && !opts.reset) {
      try {
        this.state = JSON.parse(fs.readFileSync(this.statePath, 'utf-8'));
        this.state.meta.lastAccess = new Date().toISOString();
      } catch (e) {
        console.warn(`  ⚠️ Corrupt project-state.json, reinitializing: ${e.message}`);
        this.state = this._createInitialState(projectName, opts);
      }
    } else {
      this.state = this._createInitialState(projectName, opts);
    }
    this._save();
    return this;
  }

  _createInitialState(projectName, opts = {}) {
    return {
      meta: {
        project: projectName,
        created: new Date().toISOString(),
        lastAccess: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        version: '2.0',
        nexusVersion: '2.0.0'
      },
      pipeline: {
        currentStage: 'idle',
        stages: {
          discovery:  { status: 'pending', startedAt: null, completedAt: null, agent: 'nexus-discovery-agent' },
          briefing:   { status: 'pending', startedAt: null, completedAt: null, agent: 'nexus-briefing-agent' },
          report:     { status: 'pending', startedAt: null, completedAt: null, agent: 'nexus-briefing-report' },
          context:    { status: 'pending', startedAt: null, completedAt: null, agent: 'nexus-context-agent' },
          design:     { status: 'pending', startedAt: null, completedAt: null, agent: 'nexus-design-agent' },
          content:    { status: 'pending', startedAt: null, completedAt: null, agent: 'nexus-content-agent' },
          image:      { status: 'pending', startedAt: null, completedAt: null, agent: 'nexus-image-agent' },
          video:      { status: 'pending', startedAt: null, completedAt: null, agent: 'nexus-video-agent' },
          code:       { status: 'pending', startedAt: null, completedAt: null, agent: 'nexus-code-agent' },
          quality:    { status: 'pending', startedAt: null, completedAt: null, agent: 'nexus-quality-agent' },
          deploy:     { status: 'pending', startedAt: null, completedAt: null, agent: 'nexus-deploy' }
        },
        history: []
      },
      // Discovery Agent output
      discovery: {
        company: null,
        website: null,
        social: null,
        colors: [],
        fonts: [],
        techStack: [],
        sector: null,
        completeness: 0
      },
      // Briefing Agent output
      briefing: {
        questions: [],
        answers: {},
        brief: null,
        completeness: 0
      },
      // Report output
      report: {
        htmlPath: null,
        pdfPath: null,
        generatedAt: null
      },
      // Context Agent output
      context: {
        dna: null,
        keywords: [],
        tone: null,
        audience: null,
        competitors: [],
        archetype: null,
        awarenessLevel: null,
        guaranteeType: null
      },
      // Design Agent output
      design: {
        system: null,
        palette: [],
        typography: null,
        layout: null,
        components: []
      },
      // Content Agent output
      content: {
        hero: null,
        sections: [],
        cta: [],
        seo: null,
        copy: {}
      },
      // Image Agent output
      image: {
        prompts: [],
        generated: [],
        placeholders: []
      },
      // Video Agent output
      video: {
        prompts: [],
        scripts: [],
        animations: []
      },
      // Code Agent output
      code: {
        html: null,
        css: null,
        js: null,
        outputPath: null,
        components: [],
        libraries: []
      },
      // Quality Agent output
      quality: {
        score: 0,
        lighthouse: null,
        accessibility: null,
        issues: [],
        passed: false
      },
      // Deploy info
      deploy: {
        url: null,
        platform: null,
        deployedAt: null
      },
      // Trend Scout references used
      references: {
        sites: [],
        components: [],
        niche: null
      },
      // Error tracking
      errors: [],
      // Human checkpoints
      checkpoints: []
    };
  }

  // ========== READ/WRITE ==========

  get(dotPath) {
    const keys = dotPath.split('.');
    let obj = this.state;
    for (const key of keys) {
      if (obj === null || obj === undefined) return undefined;
      obj = obj[key];
    }
    return obj;
  }

  set(dotPath, value) {
    const keys = dotPath.split('.');
    let obj = this.state;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]] || typeof obj[keys[i]] !== 'object') obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    this.state.meta.lastModified = new Date().toISOString();
    this._save();
    return this;
  }

  merge(dotPath, data) {
    const current = this.get(dotPath) || {};
    if (typeof current === 'object' && !Array.isArray(current)) {
      this.set(dotPath, { ...current, ...data });
    } else if (Array.isArray(current)) {
      this.set(dotPath, [...current, ...(Array.isArray(data) ? data : [data])]);
    } else {
      this.set(dotPath, data);
    }
    return this;
  }

  // ========== PIPELINE CONTROL ==========

  transition(stage, status) {
    const stageData = this.state.pipeline.stages[stage];
    if (!stageData) throw new Error(`Unknown stage: ${stage}`);

    const prevStatus = stageData.status;
    stageData.status = status;

    if (status === 'running' && !stageData.startedAt) {
      stageData.startedAt = new Date().toISOString();
      this.state.pipeline.currentStage = stage;
    }
    if (status === 'complete' || status === 'failed' || status === 'skipped') {
      stageData.completedAt = new Date().toISOString();
    }

    this.state.pipeline.history.push({
      stage,
      from: prevStatus,
      to: status,
      at: new Date().toISOString()
    });

    this._save();
    return this;
  }

  getNextStage() {
    const order = Object.keys(this.state.pipeline.stages);
    for (const stage of order) {
      if (this.state.pipeline.stages[stage].status === 'pending') return stage;
    }
    return null; // all done
  }

  isComplete() {
    const required = ['discovery', 'briefing', 'context', 'design', 'content', 'code', 'quality'];
    return required.every(s => 
      ['complete', 'skipped'].includes(this.state.pipeline.stages[s].status)
    );
  }

  // ========== SNAPSHOTS (State Rollback) ==========

  createSnapshot(label) {
    const snapshot = {
      label,
      createdAt: new Date().toISOString(),
      data: JSON.parse(JSON.stringify(this.state))
    };
    if (!this._snapshots) this._snapshots = [];
    this._snapshots.push(snapshot);
    return snapshot;
  }

  rollback(label) {
    if (!this._snapshots || this._snapshots.length === 0) return false;
    const idx = label
      ? this._snapshots.findLastIndex(s => s.label === label)
      : this._snapshots.length - 1;
    if (idx === -1) return false;

    const snapshot = this._snapshots[idx];
    // Restore state but keep errors/history for debugging
    const currentErrors = [...this.state.errors];
    const currentHistory = [...this.state.pipeline.history];

    this.state = JSON.parse(JSON.stringify(snapshot.data));
    this.state.errors = currentErrors;
    this.state.pipeline.history = currentHistory;
    this.state.pipeline.history.push({
      stage: '*rollback*',
      from: label || 'latest',
      to: 'rolled-back',
      at: new Date().toISOString()
    });

    // Discard snapshots after the one we rolled back to
    this._snapshots = this._snapshots.slice(0, idx);
    this._forceOverwrite = true;
    this._save();
    this._forceOverwrite = false;
    return true;
  }

  discardSnapshots() {
    this._snapshots = [];
  }

  // ========== ERRORS ==========

  addError(stage, error) {
    this.state.errors.push({
      stage,
      message: error.message || error,
      stack: error.stack || null,
      at: new Date().toISOString()
    });
    this._save();
    return this;
  }

  // ========== CHECKPOINTS ==========

  addCheckpoint(stage, message, requiresHuman = false) {
    const cp = {
      id: `cp-${Date.now()}`,
      stage,
      message,
      requiresHuman,
      approved: !requiresHuman,
      createdAt: new Date().toISOString()
    };
    this.state.checkpoints.push(cp);
    this._save();
    return cp;
  }

  approveCheckpoint(id) {
    const cp = this.state.checkpoints.find(c => c.id === id);
    if (cp) { cp.approved = true; this._save(); }
    return cp;
  }

  // ========== SUMMARY ==========

  summary() {
    const stages = this.state.pipeline.stages;
    const lines = [`\n📋 PROJECT: ${this.state.meta.project}`];
    lines.push(`   Stage: ${this.state.pipeline.currentStage}`);
    lines.push('');
    
    const icons = { pending: '⏳', running: '🔄', complete: '✅', failed: '❌', skipped: '⏭️' };
    for (const [name, data] of Object.entries(stages)) {
      const icon = icons[data.status] || '❓';
      const time = data.completedAt && data.startedAt 
        ? ` (${((new Date(data.completedAt) - new Date(data.startedAt)) / 1000).toFixed(1)}s)`
        : '';
      lines.push(`   ${icon} ${name.padEnd(12)} ${data.status}${time}`);
    }

    const errors = this.state.errors.length;
    if (errors) lines.push(`\n   ⚠️  ${errors} error(s) recorded`);
    
    const pending = this.state.checkpoints.filter(c => !c.approved).length;
    if (pending) lines.push(`   🛑 ${pending} checkpoint(s) awaiting approval`);

    return lines.join('\n');
  }

  // ========== PERSISTENCE ==========

  _acquireLock(maxWait = 5000) {
    const start = Date.now();
    while (fs.existsSync(this.lockFile)) {
      // Check for stale lock (older than 30s)
      try {
        const lockAge = Date.now() - fs.statSync(this.lockFile).mtimeMs;
        if (lockAge > 30000) { fs.unlinkSync(this.lockFile); break; }
      } catch { break; }
      if (Date.now() - start > maxWait) {
        console.warn('  ⚠️ Blackboard lock timeout, forcing write');
        try { fs.unlinkSync(this.lockFile); } catch {}
        break;
      }
      // Busy wait with small delay (sync context)
      const waitUntil = Date.now() + 50;
      while (Date.now() < waitUntil) {}
    }
    try { fs.writeFileSync(this.lockFile, String(process.pid)); } catch {}
  }

  _releaseLock() {
    try { fs.unlinkSync(this.lockFile); } catch {}
  }

  _save() {
    this._acquireLock();
    try {
      // Re-read state from disk to merge any changes from parallel agents
      // Skip merge on rollback — rollback state must fully overwrite disk
      if (!this._forceOverwrite && fs.existsSync(this.statePath)) {
        try {
          const diskState = JSON.parse(fs.readFileSync(this.statePath, 'utf-8'));
          // Merge: our in-memory changes take priority, but preserve other agents' data
          for (const key of Object.keys(diskState)) {
            if (key === 'meta' || key === 'pipeline' || key === 'errors' || key === 'checkpoints') continue;
            if (this.state[key] === null || this.state[key] === undefined) {
              this.state[key] = diskState[key];
            } else if (typeof this.state[key] === 'object' && typeof diskState[key] === 'object' && !Array.isArray(this.state[key])) {
              // Merge object: keep our values, add disk values we don't have
              for (const subKey of Object.keys(diskState[key])) {
                if (this.state[key][subKey] === null || this.state[key][subKey] === undefined) {
                  this.state[key][subKey] = diskState[key][subKey];
                }
              }
            }
          }
          // Merge errors array (append unique)
          if (diskState.errors && diskState.errors.length > this.state.errors.length) {
            const existingTimes = new Set(this.state.errors.map(e => e.at));
            for (const err of diskState.errors) {
              if (!existingTimes.has(err.at)) this.state.errors.push(err);
            }
          }
        } catch {}
      }
      fs.writeFileSync(this.statePath, JSON.stringify(this.state, null, 2));
    } finally {
      this._releaseLock();
    }
  }

  load(projectName) {
    return this.init(projectName);
  }

  // ========== STATIC HELPERS ==========

  static listProjects() {
    if (!fs.existsSync(PROJECTS_DIR)) return [];
    return fs.readdirSync(PROJECTS_DIR).filter(d => 
      fs.existsSync(path.join(PROJECTS_DIR, d, 'project-state.json'))
    );
  }
}

// Singleton export
const board = new NexusBlackboard();
module.exports = board;

// CLI mode
if (require.main === module) {
  const args = process.argv.slice(2);
  const cmd = args[0];

  if (cmd === 'init' && args[1]) {
    board.init(args[1], { reset: args.includes('--reset') });
    console.log(`✅ Blackboard initialized for: ${args[1]}`);
    console.log(board.summary());
  } else if (cmd === 'status' && args[1]) {
    board.init(args[1]);
    console.log(board.summary());
  } else if (cmd === 'list') {
    const projects = NexusBlackboard.listProjects();
    console.log(`\n📁 Projects with Blackboard state (${projects.length}):`);
    projects.forEach(p => console.log(`   • ${p}`));
  } else if (cmd === 'get' && args[1] && args[2]) {
    board.init(args[1]);
    console.log(JSON.stringify(board.get(args[2]), null, 2));
  } else if (cmd === 'transition' && args[1] && args[2] && args[3]) {
    board.init(args[1]);
    board.transition(args[2], args[3]);
    console.log(`✅ ${args[2]} → ${args[3]}`);
    console.log(board.summary());
  } else {
    console.log(`
NEXUS Blackboard System — Central State Manager

Usage:
  node nexus-blackboard.js init <project> [--reset]   Initialize project state
  node nexus-blackboard.js status <project>            Show pipeline status
  node nexus-blackboard.js list                        List all projects with state
  node nexus-blackboard.js get <project> <path>        Get value (dot notation)
  node nexus-blackboard.js transition <project> <stage> <status>  Change stage status

Programmatic:
  const board = require('./nexus-blackboard');
  board.init('my-project');
  board.set('discovery.company', { name: 'Acme' });
  board.transition('discovery', 'complete');
    `);
  }
}
