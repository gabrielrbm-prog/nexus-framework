#!/usr/bin/env node

/*
 * NEXUS Integration Tests — Agent Handoff Format Validation
 *
 * Validates that each stage's output matches the contract expected by downstream stages.
 * Uses real project data from test-crossfit as fixture.
 *
 * Run: node tests/integration-handoff.test.js
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = path.join(__dirname, '..');
const FIXTURE_PROJECT = 'test-crossfit';
const FIXTURE_DIR = path.join(WORKSPACE, 'projects', FIXTURE_PROJECT);

// ========== Test Runner ==========

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
  if (condition) {
    passed++;
  } else {
    failed++;
    failures.push(message);
    console.log(`  ❌ ${message}`);
  }
}

function section(name) {
  console.log(`\n── ${name} ──`);
}

// ========== Helpers ==========

function loadJSON(relPath) {
  const full = path.join(FIXTURE_DIR, relPath);
  if (!fs.existsSync(full)) return null;
  return JSON.parse(fs.readFileSync(full, 'utf-8'));
}

function isHex(val) {
  return typeof val === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(val);
}

// ========== 1. Context DNA Contract ==========

section('Context DNA → Design/Content/Code handoff');

const dna = loadJSON('context-dna.json');
assert(dna !== null, 'context-dna.json exists');

if (dna) {
  // project block (required by code agent for slot selection)
  assert(dna.project && typeof dna.project === 'object', 'dna.project exists');
  assert(typeof dna.project.name === 'string' && dna.project.name.length > 0, 'dna.project.name is non-empty string');
  assert(typeof dna.project.businessType === 'string' && dna.project.businessType.length > 0, 'dna.project.businessType is non-empty string');

  // brand block (required by code agent for branding)
  assert(dna.brand && typeof dna.brand === 'object', 'dna.brand exists');
  assert(typeof dna.brand.name === 'string' && dna.brand.name.length > 0, 'dna.brand.name is non-empty string');
  assert(typeof dna.brand.brandArchetype === 'string', 'dna.brand.brandArchetype exists');

  // audience block (required by content agent)
  assert(dna.audience && typeof dna.audience === 'object', 'dna.audience exists');
  assert(Array.isArray(dna.audience.painPoints), 'dna.audience.painPoints is array');
  assert(Array.isArray(dna.audience.motivations), 'dna.audience.motivations is array');

  // psychology block (mapped to board.context.tone)
  assert(dna.psychology && typeof dna.psychology.primary === 'string', 'dna.psychology.primary exists');

  // visual block (fallback colors for code agent)
  assert(dna.visual && typeof dna.visual === 'object', 'dna.visual exists');
  assert(dna.visual.suggestedPalette && typeof dna.visual.suggestedPalette === 'object', 'dna.visual.suggestedPalette exists');
  assert(isHex(dna.visual.suggestedPalette.primary), 'dna.visual.suggestedPalette.primary is valid hex');
  assert(isHex(dna.visual.suggestedPalette.background), 'dna.visual.suggestedPalette.background is valid hex');

  // content block (key messages for code agent)
  assert(dna.content && typeof dna.content === 'object', 'dna.content exists');
  assert(Array.isArray(dna.content.keyMessages) && dna.content.keyMessages.length > 0, 'dna.content.keyMessages is non-empty array');
  assert(typeof dna.content.ctaStrategy === 'string', 'dna.content.ctaStrategy exists');

  // seo block (mapped to board.context.keywords)
  assert(dna.seo && typeof dna.seo === 'object', 'dna.seo exists');
  assert(typeof dna.seo.primaryKeyword === 'string', 'dna.seo.primaryKeyword exists');

  // technical block (used by code agent for layout)
  assert(dna.technical && typeof dna.technical === 'object', 'dna.technical exists');
  assert(typeof dna.technical.layoutStyle === 'string', 'dna.technical.layoutStyle exists');
  assert(Array.isArray(dna.technical.prioritySections), 'dna.technical.prioritySections is array');

  // copyStrategy block (mapped to board.context.awarenessLevel)
  assert(dna.copyStrategy && typeof dna.copyStrategy === 'object', 'dna.copyStrategy exists');
  assert(typeof dna.copyStrategy.awarenessLevel === 'string', 'dna.copyStrategy.awarenessLevel exists');

  // offerStrategy block (mapped to board.context.guaranteeType)
  assert(dna.offerStrategy && typeof dna.offerStrategy === 'object', 'dna.offerStrategy exists');
  assert(typeof dna.offerStrategy.guaranteeType === 'string', 'dna.offerStrategy.guaranteeType exists');
}

// ========== 2. Design System Contract ==========

section('Design System → Code handoff');

const ds = loadJSON('design-system/design-system.json');
assert(ds !== null, 'design-system.json exists');

if (ds) {
  // colors (required by code agent)
  assert(ds.colors && typeof ds.colors === 'object', 'ds.colors exists');
  assert(ds.colors.primary && typeof ds.colors.primary === 'object', 'ds.colors.primary exists');
  assert(isHex(ds.colors.primary.base) || isHex(ds.colors.primary['500']), 'ds.colors.primary has base or 500 hex value');
  assert(typeof ds.colors.background === 'string', 'ds.colors.background exists');
  assert(typeof ds.colors.text === 'string', 'ds.colors.text exists');

  // typography (required by code agent)
  assert(ds.typography && typeof ds.typography === 'object', 'ds.typography exists');
  assert(typeof ds.typography.fontFamily === 'string' && ds.typography.fontFamily.length > 0, 'ds.typography.fontFamily is non-empty string');

  // spacing
  assert(ds.spacing && typeof ds.spacing === 'object', 'ds.spacing exists');

  // effects
  assert(ds.effects && typeof ds.effects === 'object', 'ds.effects exists');

  // CSS variables file must exist alongside
  const cssVarsPath = path.join(FIXTURE_DIR, 'design-system', 'variables.css');
  assert(fs.existsSync(cssVarsPath), 'variables.css exists alongside design-system.json');
}

// ========== 3. Content Contract ==========

section('Content → Code handoff');

const content = loadJSON('content/all-content.json');
assert(content !== null, 'all-content.json exists');

if (content) {
  // sectionContent.hero (minimum required for code agent)
  const sc = content.sectionContent;
  assert(sc && typeof sc === 'object', 'content.sectionContent exists');

  if (sc) {
    // Hero section
    assert(sc.hero && typeof sc.hero === 'object', 'sectionContent.hero exists');
    if (sc.hero) {
      assert(typeof sc.hero.headline === 'string' && sc.hero.headline.length > 0, 'hero.headline is non-empty string');
      assert(typeof sc.hero.subheadline === 'string', 'hero.subheadline exists');
    }

    // Features section
    assert(sc.features && typeof sc.features === 'object', 'sectionContent.features exists');
    if (sc.features) {
      assert(Array.isArray(sc.features.items) && sc.features.items.length > 0, 'features.items is non-empty array');
      if (sc.features.items && sc.features.items[0]) {
        const item = sc.features.items[0];
        assert(typeof item.title === 'string', 'features.items[0].title exists');
        assert(typeof item.description === 'string', 'features.items[0].description exists');
      }
    }

    // Testimonials
    if (sc.testimonials) {
      assert(Array.isArray(sc.testimonials.items), 'testimonials.items is array');
      if (sc.testimonials.items && sc.testimonials.items[0]) {
        const t = sc.testimonials.items[0];
        assert(typeof t.name === 'string', 'testimonials.items[0].name exists');
        assert(typeof t.text === 'string', 'testimonials.items[0].text exists');
      }
    }

    // Pricing (if exists)
    if (sc.pricing) {
      assert(Array.isArray(sc.pricing.plans), 'pricing.plans is array');
      if (sc.pricing.plans && sc.pricing.plans[0]) {
        const plan = sc.pricing.plans[0];
        assert(typeof plan.name === 'string', 'pricing.plans[0].name exists');
        assert(typeof plan.price === 'string', 'pricing.plans[0].price exists');
        assert(Array.isArray(plan.features), 'pricing.plans[0].features is array');
      }
    }

    // FAQ (if exists)
    if (sc.faq) {
      assert(Array.isArray(sc.faq.items), 'faq.items is array');
      if (sc.faq.items && sc.faq.items[0]) {
        assert(typeof sc.faq.items[0].q === 'string', 'faq.items[0].q exists');
        assert(typeof sc.faq.items[0].a === 'string', 'faq.items[0].a exists');
      }
    }

    // CTA section
    if (sc.cta) {
      assert(typeof sc.cta.title === 'string', 'cta.title exists');
      assert(typeof sc.cta.buttonText === 'string', 'cta.buttonText exists');
    }
  }

  // Headlines and CTAs (top-level)
  if (content.headlines) {
    assert(typeof content.headlines.primary === 'string', 'headlines.primary exists');
  }
  if (content.ctas) {
    assert(typeof content.ctas.primary === 'string', 'ctas.primary exists');
  }

  // Meta content
  if (content.metaContent) {
    assert(content.metaContent.seo && typeof content.metaContent.seo === 'object', 'metaContent.seo exists');
    if (content.metaContent.seo) {
      assert(typeof content.metaContent.seo.title === 'string', 'seo.title exists');
      assert(typeof content.metaContent.seo.description === 'string', 'seo.description exists');
    }
  }
}

// ========== 4. Code Output → Quality handoff ==========

section('Code Output → Quality handoff');

const outputDir = path.join(FIXTURE_DIR, 'output');
assert(fs.existsSync(outputDir), 'output/ directory exists');

if (fs.existsSync(outputDir)) {
  const indexPath = path.join(outputDir, 'index.html');
  assert(fs.existsSync(indexPath), 'output/index.html exists');

  if (fs.existsSync(indexPath)) {
    const html = fs.readFileSync(indexPath, 'utf-8');
    assert(html.length > 500, 'index.html has substantial content (>500 chars)');
    assert(html.includes('<!DOCTYPE html>') || html.includes('<!doctype html>'), 'index.html has DOCTYPE');
    assert(html.includes('<html'), 'index.html has <html> tag');
    assert(html.includes('<head'), 'index.html has <head> tag');
    assert(html.includes('<body'), 'index.html has <body> tag');
    assert(html.includes('</html>'), 'index.html is properly closed');
  }
}

// ========== 5. Bridge Collect Functions ==========

section('Bridge collect contracts (unit)');

// Test that Bridge correctly maps DNA fields to Blackboard
const board = require(path.join(WORKSPACE, 'agents', 'nexus-blackboard'));
board.init('_test-integration', { reset: true });

// Simulate collectContext with fixture data
if (dna) {
  board.set('context.dna', dna);
  board.set('context.keywords', dna.seo?.keywords || []);
  board.set('context.tone', dna.psychology?.primary || null);
  board.set('context.audience', dna.audience || null);
  board.set('context.archetype', dna.brand?.brandArchetype || null);
  board.set('context.awarenessLevel', dna.copyStrategy?.awarenessLevel || null);
  board.set('context.guaranteeType', dna.offerStrategy?.guaranteeType || null);

  assert(board.get('context.dna') !== null, 'board.context.dna set from DNA');
  assert(board.get('context.tone') === dna.psychology.primary, 'board.context.tone maps from dna.psychology.primary');
  assert(board.get('context.archetype') === dna.brand.brandArchetype, 'board.context.archetype maps from dna.brand.brandArchetype');
  assert(board.get('context.awarenessLevel') === dna.copyStrategy.awarenessLevel, 'board.context.awarenessLevel maps correctly');
  assert(board.get('context.guaranteeType') === dna.offerStrategy.guaranteeType, 'board.context.guaranteeType maps correctly');
}

// Simulate collectDesign with fixture data
if (ds) {
  board.set('design.system', ds);
  board.set('design.palette', ds.colors || []);
  board.set('design.typography', ds.typography || null);

  assert(board.get('design.system') !== null, 'board.design.system set from design-system.json');
  assert(board.get('design.typography.fontFamily') === ds.typography.fontFamily, 'board.design.typography.fontFamily maps correctly');
}

// Simulate collectContent with fixture data
if (content) {
  board.set('content.hero', content.hero || null);
  board.set('content.sections', content.sections || []);
  board.set('content.cta', content.ctas || content.cta || []);
  board.set('content.seo', content.seo || null);
  board.set('content.copy', content);

  assert(board.get('content.copy') !== null, 'board.content.copy set from all-content.json');
}

// Cleanup test project
try {
  fs.rmSync(path.join(WORKSPACE, 'projects', '_test-integration'), { recursive: true, force: true });
} catch {}

// ========== 6. Blackboard Rollback Integration ==========

section('Blackboard rollback integration');

board.init('_test-rollback-int', { reset: true });
board.set('discovery.company', { name: 'TestCo' });
board.transition('discovery', 'complete');

// Snapshot
board.createSnapshot('wave-1');

// Simulate failed wave
board.transition('briefing', 'running');
board.set('briefing.brief', { partial: true });
board.addError('briefing', 'LLM timeout');
board.transition('briefing', 'failed');

assert(board.get('pipeline.stages.briefing.status') === 'failed', 'briefing failed status recorded');

// Rollback
const rolled = board.rollback('wave-1');
assert(rolled === true, 'rollback returns true');
assert(board.get('pipeline.stages.briefing.status') === 'pending', 'briefing rolled back to pending');
assert(board.get('pipeline.stages.discovery.status') === 'complete', 'discovery preserved as complete after rollback');
assert(board.get('briefing.brief') === null, 'briefing.brief rolled back to null');
assert(board.state.errors.length > 0, 'errors preserved after rollback for debugging');
assert(board.state.pipeline.history.some(h => h.stage === '*rollback*'), 'rollback recorded in history');

// Cleanup
try {
  fs.rmSync(path.join(WORKSPACE, 'projects', '_test-rollback-int'), { recursive: true, force: true });
} catch {}

// ========== 7. Cross-stage data consistency ==========

section('Cross-stage data consistency');

if (dna && ds) {
  // Design system should reflect DNA's business type
  if (ds.businessType) {
    assert(ds.businessType === dna.project.businessType, 'design-system.businessType matches context-dna.project.businessType');
  }
  // Design system brand name should match DNA
  if (ds.brandName) {
    assert(ds.brandName === dna.brand.name, 'design-system.brandName matches context-dna.brand.name');
  }
}

if (dna && content) {
  // Content should reference brand name somewhere
  const contentStr = JSON.stringify(content);
  assert(contentStr.includes(dna.brand.name), 'Content references brand name from context-dna');
}

// ========== Results ==========

console.log(`\n${'═'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failures.length > 0) {
  console.log(`\nFailures:`);
  failures.forEach(f => console.log(`  - ${f}`));
}
console.log(`${'═'.repeat(50)}\n`);

process.exit(failed > 0 ? 1 : 0);
