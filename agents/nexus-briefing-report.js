#!/usr/bin/env node

/*
 * NEXUS BRIEFING REPORT GENERATOR
 * Gera um relatório HTML profissional a partir do creative-brief.json
 * 
 * Input:  creative-brief.json
 * Output: briefing-report.html (auto-contido, imprimível, conversível para PDF)
 */

const fs = require('fs');
const path = require('path');

class NexusBriefingReport {
  constructor() {
    this.name = 'NEXUS Briefing Report Generator';
    this.version = '1.0.0';
    this.projectsDir = path.join(__dirname, '..', 'projects');
  }

  generate(brief, projectName) {
    const html = this._buildHTML(brief);
    const dir = path.join(this.projectsDir, projectName);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filePath = path.join(dir, 'briefing-report.html');
    fs.writeFileSync(filePath, html, 'utf-8');
    return filePath;
  }

  generateFromFile(projectName) {
    const briefPath = path.join(this.projectsDir, projectName, 'creative-brief.json');
    if (!fs.existsSync(briefPath)) {
      throw new Error(`Creative brief não encontrado: ${briefPath}`);
    }
    const brief = JSON.parse(fs.readFileSync(briefPath, 'utf-8'));
    return this.generate(brief, projectName);
  }

  _buildHTML(b) {
    const colors = b.brand && b.brand.colors || {};
    const primary = colors.primary || '#1e293b';
    const secondary = colors.secondary || '#3b82f6';
    const accent = colors.accent || '#10b981';

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Creative Brief — ${this._esc(b.company.name)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
/* ============ RESET & BASE ============ */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 16px; -webkit-font-smoothing: antialiased; }
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: #0b0f1a;
  color: #e2e8f0;
  line-height: 1.7;
  min-height: 100vh;
}
a { color: ${secondary}; text-decoration: none; }
a:hover { text-decoration: underline; }

/* ============ LAYOUT ============ */
.report {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 2.5rem;
}

/* ============ HEADER ============ */
.header {
  text-align: center;
  padding: 3rem 0 2rem;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  margin-bottom: 3rem;
}
.header .logo-placeholder {
  width: 80px; height: 80px;
  border-radius: 20px;
  background: linear-gradient(135deg, ${primary}, ${secondary});
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 2rem; font-weight: 800; color: #fff;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}
.header h1 {
  font-size: 2.2rem;
  font-weight: 800;
  background: linear-gradient(135deg, #fff, ${secondary});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
}
.header .subtitle {
  font-size: 1rem;
  color: #94a3b8;
  font-weight: 400;
}
.header .meta {
  margin-top: 1.2rem;
  display: flex;
  justify-content: center;
  gap: 2rem;
  font-size: 0.85rem;
  color: #64748b;
}
.header .meta span {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

/* ============ SECTIONS ============ */
.section {
  margin-bottom: 3rem;
}
.section-header {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 1.5rem;
  padding-bottom: 0.8rem;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.section-number {
  width: 36px; height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, ${secondary}22, ${secondary}44);
  border: 1px solid ${secondary}44;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.85rem; font-weight: 700;
  color: ${secondary};
  flex-shrink: 0;
}
.section-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #f1f5f9;
}

/* ============ CARDS ============ */
.card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1rem;
}
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}
.card-mini {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px;
  padding: 1.2rem;
}
.card-mini .label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748b;
  margin-bottom: 0.4rem;
  font-weight: 600;
}
.card-mini .value {
  font-size: 1rem;
  font-weight: 600;
  color: #f1f5f9;
}

/* ============ TAGS & BADGES ============ */
.tag {
  display: inline-block;
  padding: 0.3rem 0.8rem;
  border-radius: 100px;
  font-size: 0.8rem;
  font-weight: 500;
  margin: 0.2rem;
  background: ${secondary}18;
  color: ${secondary};
  border: 1px solid ${secondary}33;
}
.tag.accent {
  background: ${accent}18;
  color: ${accent};
  border-color: ${accent}33;
}
.tag.warn {
  background: #f59e0b18;
  color: #f59e0b;
  border-color: #f59e0b33;
}
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.4rem 1rem;
  border-radius: 100px;
  font-size: 0.85rem;
  font-weight: 600;
}
.badge.success {
  background: #10b98122;
  color: #10b981;
  border: 1px solid #10b98144;
}
.badge.warning {
  background: #f59e0b22;
  color: #f59e0b;
  border: 1px solid #f59e0b44;
}

/* ============ COLOR SWATCHES ============ */
.color-palette {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}
.swatch {
  text-align: center;
}
.swatch-circle {
  width: 64px; height: 64px;
  border-radius: 16px;
  border: 2px solid rgba(255,255,255,0.1);
  margin-bottom: 0.5rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}
.swatch-label {
  font-size: 0.7rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.swatch-hex {
  font-size: 0.8rem;
  color: #cbd5e1;
  font-weight: 600;
  font-family: 'SF Mono', Consolas, monospace;
}

/* ============ PERSONA CARD ============ */
.persona-card {
  background: linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01));
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 20px;
  padding: 2rem;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1.5rem;
  align-items: start;
}
.persona-avatar {
  width: 72px; height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${secondary}, ${accent});
  display: flex; align-items: center; justify-content: center;
  font-size: 1.8rem; color: #fff;
}
.persona-info h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #f1f5f9;
  margin-bottom: 0.3rem;
}
.persona-info .desc {
  font-size: 0.9rem;
  color: #94a3b8;
  margin-bottom: 1rem;
}
.persona-lists {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.persona-list h4 {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748b;
  margin-bottom: 0.5rem;
}
.persona-list ul {
  list-style: none;
  padding: 0;
}
.persona-list li {
  font-size: 0.85rem;
  color: #cbd5e1;
  padding: 0.25rem 0;
  padding-left: 1rem;
  position: relative;
}
.persona-list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 6px; height: 6px;
  border-radius: 50%;
}
.persona-list.pains li::before { background: #ef4444; }
.persona-list.desires li::before { background: #10b981; }

/* ============ SECTIONS CHECKLIST ============ */
.checklist {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.6rem;
}
.checklist-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem 1rem;
  border-radius: 10px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.05);
  font-size: 0.9rem;
}
.checklist-item.required {
  border-color: ${secondary}33;
  background: ${secondary}08;
}
.check-icon {
  width: 20px; height: 20px;
  border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.7rem; flex-shrink: 0;
}
.check-icon.on {
  background: ${secondary}33;
  color: ${secondary};
}
.check-icon.off {
  background: rgba(255,255,255,0.05);
  color: #475569;
}

/* ============ REFERENCES ============ */
.ref-list {
  display: grid;
  gap: 0.8rem;
}
.ref-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 12px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.05);
}
.ref-thumb {
  width: 48px; height: 48px;
  border-radius: 10px;
  background: rgba(255,255,255,0.05);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.7rem; color: #64748b;
  flex-shrink: 0;
}
.ref-info .url {
  font-size: 0.9rem;
  font-weight: 600;
  color: ${secondary};
}
.ref-info .note {
  font-size: 0.8rem;
  color: #64748b;
}

/* ============ PROGRESS BAR ============ */
.progress-container {
  margin-top: 1rem;
}
.progress-bar {
  width: 100%;
  height: 10px;
  border-radius: 100px;
  background: rgba(255,255,255,0.06);
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 100px;
  transition: width 0.5s ease;
}
.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  margin-top: 0.5rem;
  color: #94a3b8;
}

/* ============ TIMELINE ============ */
.timeline {
  position: relative;
  padding-left: 2rem;
}
.timeline::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: rgba(255,255,255,0.08);
}
.timeline-item {
  position: relative;
  padding-bottom: 1.5rem;
}
.timeline-item::before {
  content: '';
  position: absolute;
  left: -2rem;
  top: 5px;
  width: 14px; height: 14px;
  border-radius: 50%;
  background: ${secondary};
  border: 3px solid #0b0f1a;
  z-index: 1;
}
.timeline-item .tl-date {
  font-size: 0.75rem;
  color: ${secondary};
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.timeline-item .tl-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #f1f5f9;
}
.timeline-item .tl-desc {
  font-size: 0.85rem;
  color: #94a3b8;
}

/* ============ FOOTER ============ */
.footer {
  text-align: center;
  padding: 3rem 0 2rem;
  border-top: 1px solid rgba(255,255,255,0.06);
  margin-top: 3rem;
}
.footer .brand {
  font-size: 0.85rem;
  color: #475569;
  font-weight: 500;
}
.footer .brand strong {
  background: linear-gradient(135deg, ${secondary}, ${accent});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.footer .gen-date {
  font-size: 0.75rem;
  color: #334155;
  margin-top: 0.3rem;
}

/* ============ SECTOR SPECIFICS ============ */
.specifics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}
.specific-item {
  padding: 1rem;
  border-radius: 12px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.05);
}
.specific-item .q {
  font-size: 0.8rem;
  color: #64748b;
  margin-bottom: 0.3rem;
}
.specific-item .a {
  font-size: 0.95rem;
  font-weight: 600;
  color: #e2e8f0;
}

/* ============ PRINT ============ */
@media print {
  body {
    background: #fff;
    color: #1e293b;
    font-size: 11pt;
  }
  .report { padding: 0; max-width: 100%; }
  .header h1 {
    background: none;
    -webkit-text-fill-color: #0f172a;
    color: #0f172a;
  }
  .header .subtitle, .header .meta span { color: #475569; }
  .section-number {
    background: #f1f5f9;
    color: #1e293b;
    border-color: #e2e8f0;
  }
  .section-title { color: #0f172a; }
  .card, .card-mini, .persona-card, .checklist-item, .ref-item, .specific-item {
    background: #fafafa;
    border-color: #e2e8f0;
    color: #1e293b;
  }
  .card-mini .label { color: #64748b; }
  .card-mini .value { color: #0f172a; }
  .persona-info h3 { color: #0f172a; }
  .persona-info .desc { color: #475569; }
  .persona-list li { color: #334155; }
  .persona-list h4 { color: #64748b; }
  .swatch-label { color: #475569; }
  .swatch-hex { color: #1e293b; }
  .swatch-circle { border-color: #e2e8f0; }
  .tag { border-color: #d1d5db; background: #f3f4f6; color: #374151; }
  .timeline::before { background: #d1d5db; }
  .timeline-item .tl-date { color: #1e293b; }
  .timeline-item .tl-title { color: #0f172a; }
  .timeline-item .tl-desc { color: #475569; }
  .timeline-item::before { border-color: #fff; }
  .progress-bar { background: #e5e7eb; }
  .progress-label { color: #475569; }
  .footer .brand { color: #475569; }
  .footer .brand strong { -webkit-text-fill-color: #1e293b; color: #1e293b; background: none; }
  .footer .gen-date { color: #94a3b8; }
  .check-icon.on { background: #dbeafe; color: #1d4ed8; }
  .check-icon.off { background: #f3f4f6; color: #9ca3af; }
  .checklist-item.required { background: #eff6ff; border-color: #bfdbfe; }
  .ref-info .url { color: #1d4ed8; }
  .ref-info .note { color: #64748b; }
  .specific-item .q { color: #64748b; }
  .specific-item .a { color: #0f172a; }
}

@page {
  size: A4;
  margin: 1.5cm;
}
</style>
</head>
<body>
<div class="report">

  <!-- HEADER -->
  <div class="header">
    <div class="logo-placeholder">${this._esc((b.company.name || 'N')[0].toUpperCase())}</div>
    <h1>Creative Brief</h1>
    <div class="subtitle">${this._esc(b.company.name)} — ${this._esc(b.company.sector_label || b.company.sector)}</div>
    <div class="meta">
      <span>Versao ${b.version || 1}</span>
      <span>${this._formatDate(b.created_at)}</span>
      <span>Score: ${b.completeness_score}%</span>
    </div>
  </div>

  <!-- 01. RESUMO DO PROJETO -->
  ${this._sectionStart(1, 'Resumo do Projeto')}
  <div class="card-grid">
    <div class="card-mini">
      <div class="label">Empresa</div>
      <div class="value">${this._esc(b.company.name)}</div>
    </div>
    <div class="card-mini">
      <div class="label">Setor</div>
      <div class="value">${this._esc(b.company.sector_label || b.company.sector)}</div>
    </div>
    <div class="card-mini">
      <div class="label">Objetivo</div>
      <div class="value">${this._esc(this._objectiveLabel(b.project.objective))}</div>
    </div>
    <div class="card-mini">
      <div class="label">Tipo</div>
      <div class="value">${this._esc(b.project.type)}</div>
    </div>
    <div class="card-mini">
      <div class="label">Urgencia</div>
      <div class="value">${this._esc(this._urgencyLabel(b.project.urgency))}</div>
    </div>
    <div class="card-mini">
      <div class="label">Prazo Estimado</div>
      <div class="value">${this._esc(b.project.deadline || 'N/A')}</div>
    </div>
  </div>
  ${b.company.description ? `<div class="card" style="margin-top:1rem"><p style="color:#94a3b8;font-size:0.9rem">${this._esc(b.company.description)}</p></div>` : ''}
  </div>

  <!-- 02. DIFERENCIAIS -->
  ${this._sectionStart(2, 'Diferenciais')}
  <div class="card">
    ${(b.company.differentials || []).map(d => `<span class="tag">${this._esc(d)}</span>`).join('\n    ')}
    ${(!b.company.differentials || b.company.differentials.length === 0) ? '<p style="color:#64748b;font-size:0.9rem">Nenhum diferencial registrado</p>' : ''}
  </div>
  </div>

  <!-- 03. PÚBLICO-ALVO -->
  ${this._sectionStart(3, 'Publico-Alvo')}
  <div class="persona-card">
    <div class="persona-avatar">P</div>
    <div class="persona-info">
      <h3>Persona Principal</h3>
      <div class="desc">${this._esc(b.audience.primary || 'N/A')}</div>
      ${b.audience.secondary ? `<p style="font-size:0.85rem;color:#64748b;margin-bottom:1rem"><strong>Secundario:</strong> ${this._esc(b.audience.secondary)}</p>` : ''}
      <div class="persona-lists">
        <div class="persona-list pains">
          <h4>Dores</h4>
          <ul>
            ${(b.audience.pain_points || []).map(p => `<li>${this._esc(p)}</li>`).join('\n            ')}
            ${(!b.audience.pain_points || b.audience.pain_points.length === 0) ? '<li style="color:#475569">Nao identificadas</li>' : ''}
          </ul>
        </div>
        <div class="persona-list desires">
          <h4>Desejos</h4>
          <ul>
            ${(b.audience.desires || []).map(d => `<li>${this._esc(d)}</li>`).join('\n            ')}
            ${(!b.audience.desires || b.audience.desires.length === 0) ? '<li style="color:#475569">Nao identificados</li>' : ''}
          </ul>
        </div>
      </div>
    </div>
  </div>
  ${b.audience.demographics ? `
  <div class="card-grid" style="margin-top:1rem">
    <div class="card-mini"><div class="label">Idade</div><div class="value">${this._esc(b.audience.demographics.age || 'N/A')}</div></div>
    <div class="card-mini"><div class="label">Genero</div><div class="value">${this._esc(b.audience.demographics.gender || 'Todos')}</div></div>
    <div class="card-mini"><div class="label">Renda</div><div class="value">${this._esc(b.audience.demographics.income || 'N/A')}</div></div>
    <div class="card-mini"><div class="label">Localizacao</div><div class="value">${this._esc(b.audience.demographics.location || 'Brasil')}</div></div>
  </div>` : ''}
  </div>

  <!-- 04. MARCA & IDENTIDADE -->
  ${this._sectionStart(4, 'Marca e Identidade Visual')}
  <div class="card">
    <div class="card-grid" style="margin-bottom:1.5rem">
      <div class="card-mini" style="border:none;padding:0">
        <div class="label">Tom de Comunicacao</div>
        <div class="value">${this._esc(b.brand.tone_label || b.brand.tone)}</div>
      </div>
      <div class="card-mini" style="border:none;padding:0">
        <div class="label">Estilo Visual</div>
        <div class="value">${this._esc(b.brand.style || 'N/A')}</div>
      </div>
      <div class="card-mini" style="border:none;padding:0">
        <div class="label">Tipografia</div>
        <div class="value">${this._esc(b.brand.fonts ? b.brand.fonts.preference : 'N/A')}</div>
      </div>
    </div>
    <div class="label" style="margin-bottom:0.8rem;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;font-weight:600">Paleta de Cores</div>
    <div class="color-palette">
      ${this._renderSwatch('Primaria', b.brand.colors.primary)}
      ${this._renderSwatch('Secundaria', b.brand.colors.secondary)}
      ${this._renderSwatch('Destaque', b.brand.colors.accent)}
    </div>
    ${b.brand.colors.keep_current ? '<p style="margin-top:1rem;font-size:0.8rem;color:#64748b">Cores atuais mantidas conforme solicitado</p>' : ''}
  </div>
  </div>

  <!-- 05. SEÇÕES DO SITE -->
  ${this._sectionStart(5, 'Secoes do Site')}
  <div class="checklist">
    ${(b.content.sections || []).map(s => `
    <div class="checklist-item${s.required ? ' required' : ''}">
      <div class="check-icon ${s.required ? 'on' : 'off'}">${s.required ? '&#10003;' : '&#8212;'}</div>
      <span>${this._esc(s.title)}</span>
    </div>`).join('')}
  </div>
  </div>

  <!-- 06. REFERÊNCIAS -->
  ${this._sectionStart(6, 'Referencias Visuais')}
  ${(b.content.references && b.content.references.length > 0) ? `
  <div class="ref-list">
    ${b.content.references.map(r => `
    <div class="ref-item">
      <div class="ref-thumb">WWW</div>
      <div class="ref-info">
        <div class="url">${this._esc(r.url)}</div>
        <div class="note">${this._esc(r.what_they_like || '')}</div>
      </div>
    </div>`).join('')}
  </div>` : '<div class="card"><p style="color:#64748b;font-size:0.9rem">Nenhuma referencia fornecida</p></div>'}
  </div>

  <!-- 07. REQUISITOS TÉCNICOS -->
  ${this._sectionStart(7, 'Requisitos Tecnicos')}
  <div class="card-grid">
    <div class="card-mini">
      <div class="label">Tipo</div>
      <div class="value">${this._esc(b.technical.type)}</div>
    </div>
    <div class="card-mini">
      <div class="label">Hospedagem</div>
      <div class="value">${this._esc(b.technical.hosting)}</div>
    </div>
  </div>
  ${(b.technical.integrations && b.technical.integrations.length > 0) ? `
  <div class="card" style="margin-top:1rem">
    <div class="label" style="margin-bottom:0.5rem;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;font-weight:600">Integracoes</div>
    ${b.technical.integrations.map(i => `<span class="tag accent">${this._esc(i)}</span>`).join(' ')}
  </div>` : ''}
  ${(b.technical.special_features && b.technical.special_features.length > 0) ? `
  <div class="card" style="margin-top:1rem">
    <div class="label" style="margin-bottom:0.5rem;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;font-weight:600">Funcionalidades Especiais</div>
    ${b.technical.special_features.map(f => `<span class="tag">${this._esc(f)}</span>`).join(' ')}
  </div>` : ''}
  </div>

  <!-- 08. MATERIAIS -->
  ${this._sectionStart(8, 'Materiais Fornecidos')}
  <div class="card-grid">
    ${this._materialCard('Logo', b.materials_provided.logo)}
    ${this._materialCard('Fotos', b.materials_provided.photos)}
    ${this._materialCard('Textos / Copy', b.materials_provided.copy)}
    ${this._materialCard('Brand Guide', b.materials_provided.brand_guide)}
    ${this._materialCard('Video', b.materials_provided.video)}
  </div>
  </div>

  <!-- 09. ESPECÍFICOS DO NICHO -->
  ${Object.keys(b.sector_specifics || {}).length > 0 ? `
  ${this._sectionStart(9, 'Detalhes Especificos do Nicho')}
  <div class="specifics-grid">
    ${Object.entries(b.sector_specifics).map(([k, v]) => `
    <div class="specific-item">
      <div class="q">${this._esc(this._formatSpecificKey(k))}</div>
      <div class="a">${this._esc(Array.isArray(v) ? v.join(', ') : v.toString())}</div>
    </div>`).join('')}
  </div>
  </div>` : ''}

  <!-- 10. COMPLETUDE & STATUS -->
  ${this._sectionStart(Object.keys(b.sector_specifics || {}).length > 0 ? 10 : 9, 'Status do Brief')}
  <div class="card">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
      <div>
        <div style="font-size:1.1rem;font-weight:700;color:#f1f5f9">Completude do Brief</div>
        <div style="font-size:0.85rem;color:#94a3b8">Quanto mais completo, melhor o resultado final</div>
      </div>
      <div class="badge ${b.completeness_score >= 80 ? 'success' : 'warning'}">
        ${b.ready_for_pipeline ? 'Pronto para Pipeline' : 'Precisa de mais dados'}
      </div>
    </div>
    <div class="progress-container">
      <div class="progress-bar">
        <div class="progress-fill" style="width:${b.completeness_score}%;background:linear-gradient(90deg,${b.completeness_score >= 80 ? '#10b981' : '#f59e0b'},${b.completeness_score >= 80 ? '#22d3ee' : '#ef4444'})"></div>
      </div>
      <div class="progress-label">
        <span>0%</span>
        <span style="font-weight:700;color:${b.completeness_score >= 80 ? '#10b981' : '#f59e0b'}">${b.completeness_score}%</span>
        <span>100%</span>
      </div>
    </div>
  </div>

  <!-- TIMELINE -->
  <div class="card" style="margin-top:1rem">
    <div class="label" style="margin-bottom:1.2rem;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;font-weight:600">Proximos Passos</div>
    <div class="timeline">
      <div class="timeline-item">
        <div class="tl-date">Agora</div>
        <div class="tl-title">Brief Criativo Gerado</div>
        <div class="tl-desc">Documento de briefing completo e validado</div>
      </div>
      <div class="timeline-item">
        <div class="tl-date">Proximo</div>
        <div class="tl-title">Design System</div>
        <div class="tl-desc">Criacao da identidade visual e componentes</div>
      </div>
      <div class="timeline-item">
        <div class="tl-date">Em seguida</div>
        <div class="tl-title">Desenvolvimento</div>
        <div class="tl-desc">Codificacao do site com base no brief</div>
      </div>
      <div class="timeline-item">
        <div class="tl-date">${this._esc(b.project.deadline || 'A definir')}</div>
        <div class="tl-title">Entrega Final</div>
        <div class="tl-desc">Site publicado e funcionando</div>
      </div>
    </div>
  </div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="brand">Gerado por <strong>NEXUS Framework</strong></div>
    <div class="gen-date">${this._formatDate(b.created_at)} &mdash; v${b.version || 1}</div>
  </div>

</div>
</body>
</html>`;
  }

  // --------------------------------------------------------------------------
  // TEMPLATE HELPERS
  // --------------------------------------------------------------------------

  _sectionStart(num, title) {
    return `
  <div class="section">
    <div class="section-header">
      <div class="section-number">${String(num).padStart(2, '0')}</div>
      <div class="section-title">${this._esc(title)}</div>
    </div>`;
  }

  _renderSwatch(label, color) {
    if (!color) return '';
    return `
      <div class="swatch">
        <div class="swatch-circle" style="background:${this._esc(color)}"></div>
        <div class="swatch-label">${this._esc(label)}</div>
        <div class="swatch-hex">${this._esc(color)}</div>
      </div>`;
  }

  _materialCard(label, available) {
    return `
    <div class="card-mini">
      <div class="label">${this._esc(label)}</div>
      <div class="value" style="color:${available ? '#10b981' : '#ef4444'}">${available ? 'Disponivel' : 'Nao disponivel'}</div>
    </div>`;
  }

  _objectiveLabel(type) {
    const map = {
      'lead-generation': 'Captacao de Leads',
      'direct-sales': 'Vendas Diretas',
      'institutional': 'Institucional',
      'landing-page': 'Landing Page',
      'portfolio': 'Portfolio',
      'custom': 'Personalizado'
    };
    return map[type] || type || 'N/A';
  }

  _urgencyLabel(level) {
    const map = {
      'critical': 'Critica — Urgente',
      'high': 'Alta — Essa Semana',
      'normal': 'Normal — 1-2 Semanas',
      'low': 'Baixa — Sem Pressa'
    };
    return map[level] || level || 'N/A';
  }

  _formatDate(iso) {
    if (!iso) return 'N/A';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch {
      return iso;
    }
  }

  _formatSpecificKey(key) {
    return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  _esc(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

// ============================================================================
// CLI
// ============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);
  const projectName = args[0];

  if (!projectName) {
    console.log('Uso: node nexus-briefing-report.js <project-name>');
    console.log('Gera briefing-report.html a partir de creative-brief.json');
    process.exit(1);
  }

  try {
    const gen = new NexusBriefingReport();
    const reportPath = gen.generateFromFile(projectName);
    console.log(`Relatorio gerado: ${reportPath}`);
  } catch (err) {
    console.error(`[ERRO] ${err.message}`);
    process.exit(1);
  }
}

module.exports = NexusBriefingReport;
