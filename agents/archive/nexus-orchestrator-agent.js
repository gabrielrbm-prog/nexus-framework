#!/usr/bin/env node

/*
 * 🎯 NEXUS ORCHESTRATOR AGENT
 * Coordena todos os 7 agentes NEXUS em pipeline master inteligente
 * Input: Briefing natural + configurações
 * Output: Site completo end-to-end com todos agentes aplicados
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

class NexusOrchestratorAgent {
  constructor() {
    this.name = "NEXUS Orchestrator Agent";
    this.version = "1.0.0";
    this.capabilities = [
      "Multi-Agent Pipeline Coordination",
      "Intelligent Error Handling & Recovery",
      "Real-Time Progress Tracking",
      "Quality Gate Checkpoints",
      "Parallel Processing Optimization",
      "Dependency Management",
      "Rollback & Recovery Systems",
      "Performance Monitoring"
    ];
    
    // Define ordem e dependências dos agentes
    this.agentPipeline = [
      {
        name: 'Context',
        script: 'nexus-context.sh',
        dependencies: [],
        required: true,
        timeout: 60000, // 1 minuto
        description: 'Análise de briefing e geração de Context DNA'
      },
      {
        name: 'Design',
        script: 'nexus-design.sh',
        dependencies: ['Context'],
        required: true,
        timeout: 90000, // 1.5 minutos
        description: 'Geração de design system contextual'
      },
      {
        name: 'Image',
        script: 'nexus-images-demo.sh',
        dependencies: ['Context'],
        required: false,
        timeout: 120000, // 2 minutos
        description: 'Geração de prompts para imagens contextuais'
      },
      {
        name: 'Video',
        script: 'nexus-video-demo.sh',
        dependencies: ['Context'],
        required: false,
        timeout: 90000, // 1.5 minutos
        description: 'Geração de prompts para vídeos cinematográficos'
      },
      {
        name: 'Content',
        script: 'nexus-content.sh',
        dependencies: ['Context'],
        required: true,
        timeout: 60000, // 1 minuto
        description: 'Geração de copy contextual otimizado'
      },
      {
        name: 'Code',
        script: 'nexus-code.sh',
        dependencies: ['Context', 'Design', 'Content'],
        required: true,
        timeout: 180000, // 3 minutos
        description: 'Geração de site completo production-ready'
      },
      {
        name: 'Quality',
        script: 'nexus-quality.sh',
        dependencies: ['Code'],
        required: true,
        timeout: 120000, // 2 minutos
        description: 'Audit completo de qualidade e performance'
      }
    ];
    
    this.currentExecution = null;
  }

  /**
   * Executa pipeline completo end-to-end
   */
  async executeFullPipeline(briefing, projectName, options = {}) {
    console.log(`🎯 ${this.name} iniciando pipeline completo...`);
    console.log(`📋 Briefing: ${briefing}`);
    console.log(`📂 Projeto: ${projectName}`);
    console.log('');

    this.currentExecution = {
      briefing,
      projectName,
      options,
      startTime: Date.now(),
      stages: {},
      errors: [],
      warnings: [],
      currentStage: null,
      completed: false,
      finalResult: null
    };

    try {
      // Validação inicial
      await this.validateEnvironment();
      
      // Executa pipeline em ordem
      await this.executePipelineStages();
      
      // Validação final
      await this.validateFinalResult();
      
      // Gera relatório final
      const orchestrationReport = await this.generateOrchestrationReport();
      
      this.currentExecution.completed = true;
      this.currentExecution.finalResult = orchestrationReport;
      
      return orchestrationReport;
      
    } catch (error) {
      console.error(`❌ Pipeline failed: ${error.message}`);
      
      // Tenta recovery se configurado
      if (options.autoRecover) {
        console.log('🔄 Tentando recovery automático...');
        try {
          await this.attemptRecovery(error);
          return await this.executeFullPipeline(briefing, projectName, { ...options, autoRecover: false });
        } catch (recoveryError) {
          console.error(`❌ Recovery failed: ${recoveryError.message}`);
        }
      }
      
      // Gera relatório de erro
      const errorReport = await this.generateErrorReport(error);
      throw new Error(`Pipeline failed: ${error.message}. Report: ${errorReport.path}`);
    }
  }

  /**
   * Valida ambiente antes de executar
   */
  async validateEnvironment() {
    console.log('🔍 Validando ambiente...');
    
    const validations = [
      {
        name: 'Scripts dos agentes',
        check: () => this.validateAgentScripts()
      },
      {
        name: 'Diretório de trabalho',
        check: () => this.validateWorkingDirectory()
      },
      {
        name: 'Dependências do sistema',
        check: () => this.validateSystemDependencies()
      }
    ];

    for (const validation of validations) {
      try {
        await validation.check();
        console.log(`  ✅ ${validation.name}`);
      } catch (error) {
        console.error(`  ❌ ${validation.name}: ${error.message}`);
        throw new Error(`Environment validation failed: ${validation.name}`);
      }
    }
  }

  /**
   * Executa todos os estágios do pipeline
   */
  async executePipelineStages() {
    console.log('🚀 Executando pipeline NEXUS...');
    console.log('');

    for (let i = 0; i < this.agentPipeline.length; i++) {
      const agent = this.agentPipeline[i];
      
      // Verifica se pode executar (dependências)
      if (!this.canExecuteAgent(agent)) {
        if (agent.required) {
          throw new Error(`Cannot execute required agent ${agent.name}: dependencies not met`);
        } else {
          console.log(`⏭️  Pulando ${agent.name} (dependências não atendidas)`);
          continue;
        }
      }

      // Executa agente
      await this.executeAgent(agent, i + 1, this.agentPipeline.length);
      
      // Quality gate check
      if (agent.name === 'Context') {
        await this.validateContextDNA();
      } else if (agent.name === 'Code') {
        await this.validateGeneratedSite();
      } else if (agent.name === 'Quality') {
        await this.validateQualityScore();
      }
    }
  }

  /**
   * Verifica se pode executar agente baseado em dependências
   */
  canExecuteAgent(agent) {
    for (const dependency of agent.dependencies) {
      if (!this.currentExecution.stages[dependency] || 
          !this.currentExecution.stages[dependency].success) {
        return false;
      }
    }
    return true;
  }

  /**
   * Executa agente individual
   */
  async executeAgent(agent, stepNumber, totalSteps) {
    console.log(`🤖 ${stepNumber}/${totalSteps} - ${agent.name.toUpperCase()}: ${agent.description}`);
    console.log(`${'='.repeat(60)}`);
    
    this.currentExecution.currentStage = agent.name;
    this.currentExecution.stages[agent.name] = {
      name: agent.name,
      startTime: Date.now(),
      success: false,
      output: '',
      error: null
    };

    try {
      const result = await this.runAgentScript(agent);
      
      this.currentExecution.stages[agent.name].success = true;
      this.currentExecution.stages[agent.name].output = result.stdout;
      this.currentExecution.stages[agent.name].endTime = Date.now();
      this.currentExecution.stages[agent.name].duration = 
        this.currentExecution.stages[agent.name].endTime - 
        this.currentExecution.stages[agent.name].startTime;
      
      console.log(`✅ ${agent.name} completed successfully`);
      console.log('');
      
    } catch (error) {
      this.currentExecution.stages[agent.name].success = false;
      this.currentExecution.stages[agent.name].error = error.message;
      this.currentExecution.stages[agent.name].endTime = Date.now();
      this.currentExecution.errors.push({
        stage: agent.name,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      console.error(`❌ ${agent.name} failed: ${error.message}`);
      
      if (agent.required) {
        throw error;
      } else {
        console.log(`⚠️ ${agent.name} não é obrigatório, continuando...`);
        this.currentExecution.warnings.push({
          stage: agent.name,
          message: `Optional agent failed: ${error.message}`,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  /**
   * Executa script do agente
   */
  async runAgentScript(agent) {
    return new Promise((resolve, reject) => {
      let command;
      let args;
      
      if (agent.name === 'Context') {
        command = `./${agent.script}`;
        args = [`"${this.currentExecution.briefing}"`, this.currentExecution.projectName];
      } else {
        command = `./${agent.script}`;
        args = [this.currentExecution.projectName];
      }
      
      console.log(`  Executando: ${command} ${args.join(' ')}`);
      
      const child = spawn(command, args, {
        cwd: process.cwd(),
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        // Stream output em tempo real
        process.stdout.write(output);
      });
      
      child.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        process.stderr.write(output);
      });
      
      // Timeout handling
      const timeout = setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error(`Agent ${agent.name} timed out after ${agent.timeout}ms`));
      }, agent.timeout);
      
      child.on('close', (code) => {
        clearTimeout(timeout);
        
        if (code === 0) {
          resolve({ stdout, stderr, code });
        } else {
          reject(new Error(`Agent ${agent.name} exited with code ${code}. Error: ${stderr}`));
        }
      });
      
      child.on('error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`Failed to start agent ${agent.name}: ${error.message}`));
      });
    });
  }

  /**
   * Quality gates - validações entre estágios
   */
  async validateContextDNA() {
    const projectPath = path.join('projects', this.currentExecution.projectName);
    const contextDNAPath = path.join(projectPath, 'context-dna.json');
    
    console.log(`  🔍 Verificando Context DNA em: ${contextDNAPath}`);
    
    if (!fs.existsSync(contextDNAPath)) {
      console.log(`  ❌ Context DNA não encontrado em: ${contextDNAPath}`);
      
      // Lista arquivos disponíveis para debug
      if (fs.existsSync('projects')) {
        const projectDirs = fs.readdirSync('projects');
        console.log(`  📁 Projetos encontrados: ${projectDirs.join(', ')}`);
      }
      
      throw new Error(`Context DNA not generated at expected path: ${contextDNAPath}`);
    }
    
    try {
      const contextDNA = JSON.parse(fs.readFileSync(contextDNAPath, 'utf8'));
      if (!contextDNA.project || !contextDNA.project.businessType) {
        throw new Error('Invalid Context DNA structure');
      }
      console.log(`  ✅ Context DNA validated: ${contextDNA.project.businessType}`);
    } catch (error) {
      throw new Error(`Context DNA validation failed: ${error.message}`);
    }
  }

  async validateGeneratedSite() {
    const sitePath = 'generated-site';
    const indexPath = path.join(sitePath, 'index.html');
    
    if (!fs.existsSync(indexPath)) {
      throw new Error('Site not generated - Quality check cannot proceed');
    }
    
    const stats = fs.statSync(sitePath);
    console.log(`  ✅ Site generated and validated`);
  }

  async validateQualityScore() {
    const reportPath = 'quality-report.md';
    
    if (!fs.existsSync(reportPath)) {
      throw new Error('Quality report not generated');
    }
    
    try {
      const report = fs.readFileSync(reportPath, 'utf8');
      const scoreMatch = report.match(/\*\*(\d+)\/100\*\*/);
      
      if (scoreMatch) {
        const score = parseInt(scoreMatch[1]);
        console.log(`  ✅ Quality score: ${score}/100`);
        
        if (score < this.currentExecution.options.minQualityScore || 70) {
          this.currentExecution.warnings.push({
            stage: 'Quality',
            message: `Quality score ${score} below threshold`,
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      throw new Error(`Quality score validation failed: ${error.message}`);
    }
  }

  /**
   * Valida resultado final
   */
  async validateFinalResult() {
    console.log('🔍 Validando resultado final...');
    
    const validations = [
      { name: 'Site generated', check: () => fs.existsSync('generated-site/index.html') },
      { name: 'Context DNA exists', check: () => fs.existsSync(`projects/${this.currentExecution.projectName}/context-dna.json`) },
      { name: 'Quality report exists', check: () => fs.existsSync('quality-report.md') }
    ];
    
    for (const validation of validations) {
      if (!validation.check()) {
        throw new Error(`Final validation failed: ${validation.name}`);
      }
      console.log(`  ✅ ${validation.name}`);
    }
  }

  /**
   * Gera relatório de orquestração
   */
  async generateOrchestrationReport() {
    console.log('📊 Gerando relatório de orquestração...');
    
    const totalDuration = Date.now() - this.currentExecution.startTime;
    const successfulStages = Object.values(this.currentExecution.stages).filter(s => s.success);
    const failedStages = Object.values(this.currentExecution.stages).filter(s => !s.success);
    
    const report = {
      summary: {
        projectName: this.currentExecution.projectName,
        briefing: this.currentExecution.briefing,
        totalDuration: Math.round(totalDuration / 1000),
        totalStages: this.agentPipeline.length,
        successfulStages: successfulStages.length,
        failedStages: failedStages.length,
        successRate: Math.round((successfulStages.length / this.agentPipeline.length) * 100),
        status: failedStages.some(s => this.agentPipeline.find(a => a.name === s.name)?.required) ? 'FAILED' : 'SUCCESS',
        timestamp: new Date().toISOString()
      },
      stages: this.currentExecution.stages,
      errors: this.currentExecution.errors,
      warnings: this.currentExecution.warnings,
      performance: this.analyzePerformance(),
      finalAssets: this.catalogFinalAssets()
    };
    
    // Salva relatório
    const reportPath = `projects/${this.currentExecution.projectName}/orchestration-report.json`;
    const reportDir = path.dirname(reportPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Gera versão markdown
    const markdownReport = this.generateMarkdownReport(report);
    const markdownPath = `projects/${this.currentExecution.projectName}/orchestration-report.md`;
    fs.writeFileSync(markdownPath, markdownReport);
    
    console.log(`📊 Relatório salvo: ${reportPath}`);
    
    return {
      ...report,
      reportPath,
      markdownPath
    };
  }

  /**
   * Analisa performance da execução
   */
  analyzePerformance() {
    const stages = Object.values(this.currentExecution.stages);
    const totalTime = stages.reduce((sum, stage) => sum + (stage.duration || 0), 0);
    
    return {
      totalTime: Math.round(totalTime / 1000),
      averageStageTime: Math.round(totalTime / stages.length / 1000),
      slowestStage: stages.reduce((slowest, stage) => 
        (stage.duration || 0) > (slowest.duration || 0) ? stage : slowest, stages[0]),
      fastestStage: stages.reduce((fastest, stage) => 
        (stage.duration || 0) < (fastest.duration || 0) ? stage : fastest, stages[0])
    };
  }

  /**
   * Cataloga assets finais gerados
   */
  catalogFinalAssets() {
    const assets = {
      contextDNA: null,
      designSystem: null,
      generatedSite: null,
      qualityReport: null,
      contentAssets: null
    };
    
    // Context DNA
    const contextPath = `projects/${this.currentExecution.projectName}/context-dna.json`;
    if (fs.existsSync(contextPath)) {
      assets.contextDNA = {
        path: contextPath,
        size: fs.statSync(contextPath).size
      };
    }
    
    // Site gerado
    if (fs.existsSync('generated-site')) {
      const siteStats = this.getDirectoryStats('generated-site');
      assets.generatedSite = {
        path: 'generated-site',
        ...siteStats
      };
    }
    
    // Quality report
    if (fs.existsSync('quality-report.md')) {
      assets.qualityReport = {
        path: 'quality-report.md',
        size: fs.statSync('quality-report.md').size
      };
    }
    
    return assets;
  }

  /**
   * Obtém estatísticas de diretório
   */
  getDirectoryStats(dirPath) {
    let totalSize = 0;
    let fileCount = 0;
    
    const scanDirectory = (dir) => {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          scanDirectory(itemPath);
        } else {
          totalSize += stats.size;
          fileCount++;
        }
      }
    };
    
    if (fs.existsSync(dirPath)) {
      scanDirectory(dirPath);
    }
    
    return {
      totalSize,
      fileCount,
      formattedSize: Math.round(totalSize / 1024) + 'KB'
    };
  }

  /**
   * Gera relatório em markdown
   */
  generateMarkdownReport(report) {
    const duration = this.formatDuration(report.summary.totalDuration);
    const status = report.summary.status === 'SUCCESS' ? '✅ SUCESSO' : '❌ FALHOU';
    
    return `# 🎯 NEXUS Orchestrator - Relatório de Execução

## 📊 **Resumo da Execução**
- **Status:** ${status}
- **Projeto:** ${report.summary.projectName}
- **Briefing:** "${report.summary.briefing}"
- **Duração Total:** ${duration}
- **Taxa de Sucesso:** ${report.summary.successRate}%
- **Executado em:** ${new Date(report.summary.timestamp).toLocaleString()}

---

## 🚀 **Pipeline Executado**

| Estágio | Status | Duração | Descrição |
|---------|--------|---------|-----------|
${Object.values(report.stages).map(stage => {
  const status = stage.success ? '✅' : '❌';
  const duration = stage.duration ? this.formatDuration(Math.round(stage.duration / 1000)) : 'N/A';
  const agentInfo = this.agentPipeline.find(a => a.name === stage.name);
  return `| ${stage.name} | ${status} | ${duration} | ${agentInfo?.description || 'N/A'} |`;
}).join('\n')}

---

## ⚡ **Performance Analysis**
- **Tempo Total:** ${this.formatDuration(report.performance.totalTime)}
- **Tempo Médio por Estágio:** ${this.formatDuration(report.performance.averageStageTime)}
- **Estágio Mais Lento:** ${report.performance.slowestStage?.name} (${this.formatDuration(Math.round((report.performance.slowestStage?.duration || 0) / 1000))})
- **Estágio Mais Rápido:** ${report.performance.fastestStage?.name} (${this.formatDuration(Math.round((report.performance.fastestStage?.duration || 0) / 1000))})

---

## 📁 **Assets Gerados**

### Context DNA
${report.finalAssets.contextDNA ? `✅ ${report.finalAssets.contextDNA.path} (${Math.round(report.finalAssets.contextDNA.size / 1024)}KB)` : '❌ Não gerado'}

### Site Gerado
${report.finalAssets.generatedSite ? `✅ ${report.finalAssets.generatedSite.path} (${report.finalAssets.generatedSite.formattedSize}, ${report.finalAssets.generatedSite.fileCount} arquivos)` : '❌ Não gerado'}

### Quality Report
${report.finalAssets.qualityReport ? `✅ ${report.finalAssets.qualityReport.path} (${Math.round(report.finalAssets.qualityReport.size / 1024)}KB)` : '❌ Não gerado'}

---

${report.errors.length > 0 ? `## ❌ **Erros Encontrados**
${report.errors.map(error => `- **${error.stage}:** ${error.error} (${new Date(error.timestamp).toLocaleString()})`).join('\n')}

---
` : ''}

${report.warnings.length > 0 ? `## ⚠️ **Avisos**
${report.warnings.map(warning => `- **${warning.stage}:** ${warning.message} (${new Date(warning.timestamp).toLocaleString()})`).join('\n')}

---
` : ''}

## 🎯 **Conclusão**
${this.generateConclusion(report)}

---
*Relatório gerado pelo ${this.name} em ${new Date().toISOString()}*
`;
  }

  formatDuration(seconds) {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }

  generateConclusion(report) {
    if (report.summary.status === 'SUCCESS') {
      return `Pipeline executado com sucesso! Site ${report.summary.projectName} foi gerado com qualidade enterprise em ${this.formatDuration(report.summary.totalDuration)}. Todos os componentes NEXUS foram aplicados contextualmente, resultando em um site production-ready.`;
    } else {
      return `Pipeline falhou durante a execução. Verifique os erros acima e execute novamente após correções. Considere usar a opção de auto-recovery para problemas não-críticos.`;
    }
  }

  /**
   * Recovery automático
   */
  async attemptRecovery(error) {
    console.log('🔄 Iniciando procedimento de recovery...');
    
    // Recovery strategies baseadas no tipo de erro
    if (error.message.includes('Context DNA')) {
      console.log('  🔄 Tentando regenerar Context DNA...');
      await this.executeAgent(this.agentPipeline[0], 1, 1);
    }
    
    // Mais strategies podem ser adicionadas aqui
    console.log('✅ Recovery completado');
  }

  /**
   * Gera relatório de erro
   */
  async generateErrorReport(error) {
    const errorReport = {
      error: error.message,
      timestamp: new Date().toISOString(),
      execution: this.currentExecution,
      stack: error.stack,
      environment: {
        node: process.version,
        platform: process.platform,
        cwd: process.cwd()
      }
    };
    
    const errorPath = `projects/${this.currentExecution.projectName}/error-report.json`;
    const errorDir = path.dirname(errorPath);
    if (!fs.existsSync(errorDir)) {
      fs.mkdirSync(errorDir, { recursive: true });
    }
    
    fs.writeFileSync(errorPath, JSON.stringify(errorReport, null, 2));
    
    return { path: errorPath, report: errorReport };
  }

  // Métodos de validação
  validateAgentScripts() {
    const requiredScripts = this.agentPipeline.map(agent => agent.script);
    
    for (const script of requiredScripts) {
      if (!fs.existsSync(script)) {
        throw new Error(`Required script not found: ${script}`);
      }
    }
  }

  validateWorkingDirectory() {
    if (!fs.existsSync('projects')) {
      fs.mkdirSync('projects', { recursive: true });
    }
  }

  validateSystemDependencies() {
    try {
      execSync('node --version', { stdio: 'ignore' });
    } catch (error) {
      throw new Error('Node.js not available');
    }
  }

  /**
   * Status do pipeline em tempo real
   */
  getStatus() {
    if (!this.currentExecution) {
      return { status: 'idle' };
    }
    
    return {
      status: this.currentExecution.completed ? 'completed' : 'running',
      currentStage: this.currentExecution.currentStage,
      progress: Object.keys(this.currentExecution.stages).length,
      total: this.agentPipeline.length,
      errors: this.currentExecution.errors.length,
      warnings: this.currentExecution.warnings.length,
      duration: Math.round((Date.now() - this.currentExecution.startTime) / 1000)
    };
  }

  /**
   * Cancela execução em andamento
   */
  cancel() {
    if (this.currentExecution && !this.currentExecution.completed) {
      this.currentExecution.cancelled = true;
      console.log('🛑 Pipeline execution cancelled');
      return true;
    }
    return false;
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log(`
🎯 NEXUS Orchestrator Agent v1.0.0

Uso:
  node nexus-orchestrator-agent.js <briefing> <project-name> [options]

Exemplos:
  node nexus-orchestrator-agent.js "Site para trading, millennials, confiança" etf-landing
  node nexus-orchestrator-agent.js "Loja streetwear, jovens urbanos" streetwear-store
  
Options:
  --auto-recover     Habilita recovery automático em caso de falhas
  --min-quality=80   Define score mínimo de qualidade
  --parallel         Executa agentes em paralelo quando possível
  --verbose          Output detalhado
    `);
    process.exit(1);
  }

  const briefing = args[0];
  const projectName = args[1];
  
  // Parse options
  const options = {};
  for (let i = 2; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--auto-recover') {
      options.autoRecover = true;
    } else if (arg.startsWith('--min-quality=')) {
      options.minQualityScore = parseInt(arg.split('=')[1]);
    } else if (arg === '--parallel') {
      options.parallel = true;
    } else if (arg === '--verbose') {
      options.verbose = true;
    }
  }
  
  const orchestrator = new NexusOrchestratorAgent();
  
  console.log('🚀 NEXUS Orchestrator Agent - Pipeline Master');
  console.log('==============================================');
  console.log('');

  try {
    const result = await orchestrator.executeFullPipeline(briefing, projectName, options);
    
    console.log('');
    console.log('🎉 PIPELINE NEXUS COMPLETO!');
    console.log('============================');
    console.log('');
    console.log(`✅ Status: ${result.summary.status}`);
    console.log(`⏱️  Duração: ${orchestrator.formatDuration(result.summary.totalDuration)}`);
    console.log(`📊 Taxa de Sucesso: ${result.summary.successRate}%`);
    console.log(`🎯 Estágios: ${result.summary.successfulStages}/${result.summary.totalStages}`);
    console.log('');
    console.log('📁 Assets gerados:');
    console.log(`   - Site: ${result.finalAssets.generatedSite ? result.finalAssets.generatedSite.formattedSize : 'N/A'}`);
    console.log(`   - Context DNA: ${result.finalAssets.contextDNA ? 'Gerado' : 'N/A'}`);
    console.log(`   - Quality Report: ${result.finalAssets.qualityReport ? 'Gerado' : 'N/A'}`);
    console.log('');
    console.log(`📊 Relatório detalhado: ${result.reportPath}`);
    console.log('');
    console.log('🚀 Site production-ready gerado pelo NEXUS Framework!');
    
  } catch (error) {
    console.error('❌ Pipeline falhou:', error.message);
    process.exit(1);
  }
}

// Executa se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = NexusOrchestratorAgent;