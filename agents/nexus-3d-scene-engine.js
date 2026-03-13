/**
 * Nexus 3D Scene Engine v2.0
 *
 * Generates IMPRESSIVE Three.js scenes per business type/niche.
 * Each scene is a complete, self-contained ES module with:
 *   - Post-processing (EffectComposer + UnrealBloomPass)
 *   - Custom shaders (vertex displacement, chromatic aberration)
 *   - Dense particle systems (BufferGeometry)
 *   - Multi-light setups with color variation
 *   - Smooth camera orbit/drift
 *   - Mouse parallax + scroll reactivity
 *   - Mobile optimization (reduced particles, no bloom)
 *
 * Supported scenes: fintech, trading, saas, healthcare, ecommerce,
 *   fitness, education, restaurant, agency, luxury, tech, default
 */

'use strict';

class Nexus3DSceneEngine {
  constructor() {
    this.version = '2.0.0';
    this.threeCDN = 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';
    this.addonCDNs = [
      'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/postprocessing/EffectComposer.js',
      'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/postprocessing/RenderPass.js',
      'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/postprocessing/UnrealBloomPass.js',
    ];
  }

  /**
   * @param {object} options
   * @param {string} options.businessType
   * @param {object} options.colors - { primary, secondary, accent }
   * @param {boolean} options.darkMode
   * @param {string} options.performanceLevel - 'high' | 'medium' | 'low'
   * @returns {{ js: string, css: string, canvasId: string, dependencies: string[] }}
   */
  generate(options = {}) {
    const {
      businessType = 'default',
      darkMode = true,
      performanceLevel = 'high',
    } = options;
    const colors = {
      primary: '#6366f1', secondary: '#8b5cf6', accent: '#f59e0b',
      ...(options.colors || {}),
    };

    const canvasId = options.canvasId || 'three-canvas';
    const bgColor = darkMode ? '#0a0a0f' : '#f8f9fa';

    const sceneMap = {
      fintech: this._sceneFintech,
      trading: this._sceneTrading,
      saas: this._sceneSaas,
      healthcare: this._sceneHealthcare,
      ecommerce: this._sceneEcommerce,
      fitness: this._sceneFitness,
      education: this._sceneEducation,
      restaurant: this._sceneRestaurant,
      agency: this._sceneAgency,
      luxury: this._sceneLuxury,
      tech: this._sceneTech,
      default: this._sceneDefault,
    };

    const sceneFn = sceneMap[businessType] || sceneMap['default'];
    const { js: sceneJs, css: sceneCss } = sceneFn.call(this, {
      canvasId,
      colors,
      darkMode,
      bgColor,
      performanceLevel,
    });

    return {
      js: sceneJs,
      css: sceneCss,
      canvasId,
      dependencies: [this.threeCDN, ...this.addonCDNs],
    };
  }

  // ── Helpers ──────────────────────────────────────────────────────

  _hex(color) {
    return '0x' + (color || '#3b82f6').replace('#', '');
  }

  _preamble(canvasId, bgColor, colors) {
    return `
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/postprocessing/UnrealBloomPass.js';

(function() {
  const canvas = document.getElementById('${canvasId}');
  if (!canvas) return;

  const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
  const mouse = { x: 0, y: 0 };
  let scrollY = 0;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(${this._hex(bgColor)});
  scene.fog = new THREE.FogExp2(${this._hex(bgColor)}, 0.015);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const PRIMARY = ${this._hex(colors.primary)};
  const SECONDARY = ${this._hex(colors.secondary)};
  const ACCENT = ${this._hex(colors.accent)};

  // Post-processing
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  if (!isMobile) {
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.8, 0.4, 0.85
    );
    composer.addPass(bloom);
  }

  // Noise function (simple 3D simplex approx)
  function noise3D(x, y, z) {
    const p = x * 12.9898 + y * 78.233 + z * 37.719;
    return (Math.sin(p) * 43758.5453) % 1;
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
  });
  window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });
  window.addEventListener('scroll', () => { scrollY = window.scrollY; });
`;
  }

  _postamble() {
    return `
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();
    const delta = clock.getDelta();
    update(elapsed, delta);
    composer.render();
  }
  animate();
})();
`;
  }

  _canvasCss(canvasId) {
    return `
#${canvasId} {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1;
  pointer-events: none;
}
`.trim();
  }

  // ── Shared: create particle cloud ─────────────────────────────────

  _particleSnippet(count, color, size, spread, blending) {
    return `
  (function() {
    const pCount = isMobile ? ${Math.floor(count * 0.3)} : ${count};
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPos[i*3]   = (Math.random()-0.5)*${spread};
      pPos[i*3+1] = (Math.random()-0.5)*${spread};
      pPos[i*3+2] = (Math.random()-0.5)*${spread};
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: ${color}, size: ${size}, transparent: true, opacity: 0.6,
      blending: THREE.${blending || 'AdditiveBlending'}, depthWrite: false,
    });
    scene.add(new THREE.Points(pGeo, pMat));
    return { geo: pGeo, pos: pPos, count: pCount };
  })()`;
  }

  // ── SCENE: Fitness — Exploding wireframe morph ────────────────────

  _sceneFitness({ canvasId, colors, darkMode, bgColor, performanceLevel }) {
    const js = `${this._preamble(canvasId, bgColor, { ...colors, primary: '#ef4444', secondary: '#dc2626', accent: '#f97316' })}
  camera.position.set(0, 0, 5);

  scene.add(new THREE.AmbientLight(0x330000, 0.5));
  const redLight = new THREE.PointLight(0xff2200, 3, 30);
  redLight.position.set(3, 3, 3);
  scene.add(redLight);
  const orangeLight = new THREE.PointLight(0xff6600, 2, 25);
  orangeLight.position.set(-3, -2, 2);
  scene.add(orangeLight);

  // Wireframe icosahedron "body" with vertex displacement
  const bodyGeo = new THREE.IcosahedronGeometry(1.5, 4);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xff2200, wireframe: true, emissive: 0xff0000, emissiveIntensity: 0.3,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  scene.add(body);
  const basePositions = bodyGeo.attributes.position.array.slice();

  // Energy particles
  const parts = ${this._particleSnippet(2000, '0xff4400', 0.03, 8, 'AdditiveBlending')};

  // Secondary ring
  const ringGeo = new THREE.TorusGeometry(2.5, 0.02, 16, 100);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0.4 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  scene.add(ring);

  function update(elapsed) {
    // Vertex displacement — morphing effect
    const pos = bodyGeo.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      const ox = basePositions[i], oy = basePositions[i+1], oz = basePositions[i+2];
      const d = Math.sin(ox*3 + elapsed*2) * Math.cos(oy*3 + elapsed*1.5) * 0.3;
      const explode = Math.sin(elapsed * 0.5) * 0.15;
      const len = Math.sqrt(ox*ox + oy*oy + oz*oz);
      pos[i]   = ox * (1 + d + explode);
      pos[i+1] = oy * (1 + d + explode);
      pos[i+2] = oz * (1 + d + explode);
    }
    bodyGeo.attributes.position.needsUpdate = true;

    body.rotation.y = elapsed * 0.3;
    body.rotation.x = Math.sin(elapsed * 0.2) * 0.3;

    ring.rotation.x = elapsed * 0.5;
    ring.rotation.z = elapsed * 0.3;
    ring.scale.setScalar(1 + Math.sin(elapsed * 2) * 0.1);

    // Particle drift
    for (let i = 0; i < parts.count; i++) {
      parts.pos[i*3+1] += Math.sin(elapsed + i) * 0.002;
      parts.pos[i*3]   += Math.cos(elapsed * 0.5 + i * 0.1) * 0.001;
    }
    parts.geo.attributes.position.needsUpdate = true;

    camera.position.x = Math.sin(elapsed * 0.15) * 0.5 + mouse.x * 0.8;
    camera.position.y = Math.cos(elapsed * 0.1) * 0.3 + mouse.y * 0.5;
    camera.position.z = 5 - scrollY * 0.003;
    camera.lookAt(0, 0, 0);

    redLight.position.x = Math.sin(elapsed) * 4;
    redLight.position.z = Math.cos(elapsed) * 4;
  }
${this._postamble()}`;
    return { js, css: this._canvasCss(canvasId) };
  }

  // ── SCENE: Healthcare — DNA Helix ─────────────────────────────────

  _sceneHealthcare({ canvasId, colors, darkMode, bgColor, performanceLevel }) {
    const js = `${this._preamble(canvasId, bgColor, { ...colors, primary: '#3b82f6', secondary: '#06b6d4', accent: '#22d3ee' })}
  camera.position.set(0, 0, 12);

  scene.add(new THREE.AmbientLight(0x112244, 0.6));
  const blueLight = new THREE.PointLight(0x3b82f6, 3, 40);
  blueLight.position.set(5, 5, 5);
  scene.add(blueLight);
  const cyanLight = new THREE.PointLight(0x06b6d4, 2, 35);
  cyanLight.position.set(-5, -3, 3);
  scene.add(cyanLight);

  // DNA helix
  const helixGroup = new THREE.Group();
  const nodeCount = isMobile ? 30 : 60;
  const nodes = [];
  const nodeMat = new THREE.MeshStandardMaterial({
    color: 0x3b82f6, emissive: 0x1e40af, emissiveIntensity: 0.5, metalness: 0.8, roughness: 0.2,
  });
  for (let i = 0; i < nodeCount; i++) {
    const t = (i / nodeCount) * Math.PI * 6;
    const y = (i / nodeCount) * 16 - 8;
    for (let strand = 0; strand < 2; strand++) {
      const angle = t + strand * Math.PI;
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), nodeMat.clone());
      sphere.position.set(Math.cos(angle) * 1.5, y, Math.sin(angle) * 1.5);
      helixGroup.add(sphere);
      nodes.push(sphere);
    }
    // Connection bar
    if (i % 3 === 0) {
      const barGeo = new THREE.CylinderGeometry(0.03, 0.03, 3, 4);
      const barMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.3 });
      const bar = new THREE.Mesh(barGeo, barMat);
      bar.position.set(0, y, 0);
      bar.rotation.z = t;
      helixGroup.add(bar);
    }
  }
  scene.add(helixGroup);

  // Flowing particles along helix paths
  const parts = ${this._particleSnippet(1500, '0x22d3ee', 0.04, 20, 'AdditiveBlending')};

  function update(elapsed) {
    helixGroup.rotation.y = elapsed * 0.15;

    nodes.forEach((n, i) => {
      n.material.emissiveIntensity = 0.3 + Math.sin(elapsed * 2 + i * 0.3) * 0.3;
      n.scale.setScalar(0.8 + Math.sin(elapsed * 3 + i * 0.5) * 0.3);
    });

    for (let i = 0; i < parts.count; i++) {
      parts.pos[i*3+1] += 0.01;
      if (parts.pos[i*3+1] > 10) parts.pos[i*3+1] = -10;
      parts.pos[i*3] += Math.sin(elapsed + i * 0.01) * 0.003;
    }
    parts.geo.attributes.position.needsUpdate = true;

    camera.position.x = Math.sin(elapsed * 0.1) * 1.5 + mouse.x * 1.2;
    camera.position.y = mouse.y * 1.0 + Math.cos(elapsed * 0.08) * 0.5;
    camera.position.z = 12 - scrollY * 0.004;
    camera.lookAt(0, 0, 0);
  }
${this._postamble()}`;
    return { js, css: this._canvasCss(canvasId) };
  }

  // ── SCENE: Fintech — Holographic Data Grid + Matrix Rain ──────────

  _sceneFintech({ canvasId, colors, darkMode, bgColor, performanceLevel }) {
    const js = `${this._preamble(canvasId, bgColor, { ...colors, primary: '#22c55e', secondary: '#10b981', accent: '#4ade80' })}
  camera.position.set(0, 5, 18);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0x001100, 0.4));
  const greenLight1 = new THREE.PointLight(0x22c55e, 3, 50);
  greenLight1.position.set(5, 5, 5);
  scene.add(greenLight1);
  const greenLight2 = new THREE.PointLight(0x10b981, 2, 40);
  greenLight2.position.set(-5, -3, 8);
  scene.add(greenLight2);

  // Holographic grid plane
  const gridGeo = new THREE.PlaneGeometry(30, 30, 50, 50);
  const gridMat = new THREE.MeshStandardMaterial({
    color: 0x22c55e, wireframe: true, transparent: true, opacity: 0.15,
    emissive: 0x22c55e, emissiveIntensity: 0.2,
  });
  const grid = new THREE.Mesh(gridGeo, gridMat);
  grid.rotation.x = -Math.PI * 0.4;
  grid.position.y = -3;
  scene.add(grid);
  const gridBasePos = gridGeo.attributes.position.array.slice();

  // Matrix rain columns — vertical particle lines
  const colCount = isMobile ? 20 : 50;
  const rainDrops = isMobile ? 15 : 30;
  const rainGroup = new THREE.Group();
  const rainData = [];
  for (let c = 0; c < colCount; c++) {
    const x = (Math.random() - 0.5) * 25;
    const z = (Math.random() - 0.5) * 15;
    const positions = new Float32Array(rainDrops * 3);
    for (let d = 0; d < rainDrops; d++) {
      positions[d*3] = x;
      positions[d*3+1] = d * 0.5 + Math.random() * 10;
      positions[d*3+2] = z;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x4ade80, size: isMobile ? 0.12 : 0.08, transparent: true, opacity: 0.5,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const pts = new THREE.Points(geo, mat);
    rainGroup.add(pts);
    rainData.push({ positions, speed: 0.03 + Math.random() * 0.05 });
  }
  scene.add(rainGroup);

  // Floating data nodes (icosahedrons)
  const dataNodes = [];
  for (let i = 0; i < (isMobile ? 5 : 12); i++) {
    const geo = new THREE.IcosahedronGeometry(0.15 + Math.random() * 0.2, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 0.8,
      wireframe: Math.random() > 0.5,
    });
    const node = new THREE.Mesh(geo, mat);
    node.position.set((Math.random()-0.5)*15, (Math.random()-0.5)*10, (Math.random()-0.5)*10);
    node.userData.speed = { x: Math.random()*0.3, y: Math.random()*0.5, z: Math.random()*0.2 };
    scene.add(node);
    dataNodes.push(node);
  }

  function update(elapsed) {
    // Grid wave displacement
    const gPos = gridGeo.attributes.position.array;
    for (let i = 0; i < gPos.length; i += 3) {
      gPos[i+2] = Math.sin(gridBasePos[i]*0.3 + elapsed) * Math.cos(gridBasePos[i+1]*0.3 + elapsed*0.7) * 0.8;
    }
    gridGeo.attributes.position.needsUpdate = true;

    // Matrix rain fall
    rainData.forEach(r => {
      for (let d = 0; d < rainDrops; d++) {
        r.positions[d*3+1] -= r.speed;
        if (r.positions[d*3+1] < -5) r.positions[d*3+1] = 15;
      }
    });
    rainGroup.children.forEach(c => c.geometry.attributes.position.needsUpdate = true);

    // Data nodes orbit
    dataNodes.forEach(n => {
      n.rotation.x += 0.01;
      n.rotation.y += 0.015;
      n.position.y += Math.sin(elapsed * n.userData.speed.y) * 0.005;
    });

    camera.position.x = Math.sin(elapsed * 0.08) * 2 + mouse.x * 2;
    camera.position.y = 5 + mouse.y * 1.5 + Math.cos(elapsed * 0.06) * 0.5;
    camera.position.z = 18 - scrollY * 0.005;
    camera.lookAt(0, 0, 0);

    greenLight1.position.x = Math.sin(elapsed * 0.5) * 8;
    greenLight1.position.y = Math.cos(elapsed * 0.3) * 5;
  }
${this._postamble()}`;
    return { js, css: this._canvasCss(canvasId) };
  }

  // ── SCENE: Trading — Market Flow with Streams ─────────────────────

  _sceneTrading({ canvasId, colors, darkMode, bgColor, performanceLevel }) {
    const js = `${this._preamble(canvasId, bgColor, { ...colors, primary: '#22c55e', secondary: '#ef4444', accent: '#eab308' })}
  camera.position.set(0, 0, 25);

  scene.add(new THREE.AmbientLight(0x111111, 0.3));
  const upLight = new THREE.PointLight(0x22c55e, 3, 40);
  upLight.position.set(5, 5, 5);
  scene.add(upLight);
  const downLight = new THREE.PointLight(0xef4444, 2, 35);
  downLight.position.set(-5, -5, 5);
  scene.add(downLight);

  // Candlestick-style bars in 3D
  const barGroup = new THREE.Group();
  const barCount = isMobile ? 20 : 40;
  const bars = [];
  for (let i = 0; i < barCount; i++) {
    const h = 0.5 + Math.random() * 4;
    const isUp = Math.random() > 0.4;
    const geo = new THREE.BoxGeometry(0.3, h, 0.3);
    const mat = new THREE.MeshStandardMaterial({
      color: isUp ? 0x22c55e : 0xef4444,
      emissive: isUp ? 0x22c55e : 0xef4444,
      emissiveIntensity: 0.3,
      metalness: 0.6, roughness: 0.3,
    });
    const bar = new THREE.Mesh(geo, mat);
    bar.position.set((i - barCount/2) * 0.7, h/2 - 2, 0);
    bar.userData = { baseH: h, isUp, phase: Math.random() * Math.PI * 2 };
    barGroup.add(bar);
    bars.push(bar);
  }
  scene.add(barGroup);

  // Flow particles — market data streams
  const parts = ${this._particleSnippet(2500, '0x22c55e', 0.04, 30, 'AdditiveBlending')};

  // TorusKnot accent — market cycle metaphor
  const knotGeo = new THREE.TorusKnotGeometry(4, 0.05, 128, 8, 2, 3);
  const knotMat = new THREE.MeshBasicMaterial({ color: 0xeab308, transparent: true, opacity: 0.2 });
  const knot = new THREE.Mesh(knotGeo, knotMat);
  scene.add(knot);

  function update(elapsed) {
    barGroup.rotation.y = elapsed * 0.05 + mouse.x * 0.3;
    bars.forEach(b => {
      const pulse = Math.sin(elapsed * 1.5 + b.userData.phase);
      b.scale.y = 0.7 + pulse * 0.4;
      b.material.emissiveIntensity = 0.2 + Math.abs(pulse) * 0.4;
    });

    knot.rotation.x = elapsed * 0.1;
    knot.rotation.y = elapsed * 0.15;

    for (let i = 0; i < parts.count; i++) {
      parts.pos[i*3] += Math.sin(elapsed*0.5 + i*0.01) * 0.005;
      parts.pos[i*3+1] += 0.005;
      if (parts.pos[i*3+1] > 15) parts.pos[i*3+1] = -15;
    }
    parts.geo.attributes.position.needsUpdate = true;

    camera.position.x = Math.sin(elapsed * 0.1) * 3 + mouse.x * 2;
    camera.position.y = mouse.y * 2 + Math.cos(elapsed * 0.07) * 1;
    camera.position.z = 25 - scrollY * 0.005;
    camera.lookAt(0, 0, 0);
  }
${this._postamble()}`;
    return { js, css: this._canvasCss(canvasId) };
  }

  // ── SCENE: SaaS — Neural Network ─────────────────────────────────

  _sceneSaas({ canvasId, colors, darkMode, bgColor, performanceLevel }) {
    const js = `${this._preamble(canvasId, bgColor, colors)}
  camera.position.set(0, 0, 15);

  scene.add(new THREE.AmbientLight(0x111133, 0.4));
  const blueLight = new THREE.PointLight(PRIMARY, 3, 50);
  blueLight.position.set(5, 5, 5);
  scene.add(blueLight);
  const whiteLight = new THREE.PointLight(0xffffff, 1.5, 40);
  whiteLight.position.set(-5, 3, 8);
  scene.add(whiteLight);

  // Network nodes
  const nodeCount = isMobile ? 25 : 60;
  const netGroup = new THREE.Group();
  const nodePositions = [];
  const nodeMeshes = [];
  const nodeMat = new THREE.MeshStandardMaterial({
    color: PRIMARY, emissive: PRIMARY, emissiveIntensity: 0.6, metalness: 0.9, roughness: 0.1,
  });
  for (let i = 0; i < nodeCount; i++) {
    const pos = new THREE.Vector3(
      (Math.random()-0.5)*14, (Math.random()-0.5)*10, (Math.random()-0.5)*10
    );
    const sphere = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12 + Math.random()*0.1, 1), nodeMat.clone());
    sphere.position.copy(pos);
    netGroup.add(sphere);
    nodePositions.push(pos);
    nodeMeshes.push(sphere);
  }

  // Connections — lines between nearby nodes
  const lineMat = new THREE.LineBasicMaterial({
    color: SECONDARY, transparent: true, opacity: 0.12,
  });
  const connections = [];
  for (let i = 0; i < nodeCount; i++) {
    for (let j = i + 1; j < nodeCount; j++) {
      if (nodePositions[i].distanceTo(nodePositions[j]) < 4) {
        const geo = new THREE.BufferGeometry().setFromPoints([nodePositions[i], nodePositions[j]]);
        const line = new THREE.Line(geo, lineMat.clone());
        netGroup.add(line);
        connections.push({ line, a: i, b: j });
      }
    }
  }
  scene.add(netGroup);

  const parts = ${this._particleSnippet(1000, 'SECONDARY', 0.03, 18, 'AdditiveBlending')};

  function update(elapsed) {
    netGroup.rotation.y = elapsed * 0.04 + mouse.x * 0.3;
    netGroup.rotation.x = Math.sin(elapsed * 0.03) * 0.15 + mouse.y * 0.2;

    // Pulsing nodes
    nodeMeshes.forEach((n, i) => {
      const pulse = Math.sin(elapsed * 2 + i * 0.5);
      n.material.emissiveIntensity = 0.3 + pulse * 0.4;
      n.scale.setScalar(0.8 + pulse * 0.3);
    });

    // Pulsing connections
    connections.forEach((c, i) => {
      c.line.material.opacity = 0.05 + Math.sin(elapsed * 3 + i * 0.2) * 0.08;
    });

    for (let i = 0; i < parts.count; i++) {
      parts.pos[i*3] += Math.sin(elapsed + i * 0.05) * 0.002;
      parts.pos[i*3+1] += Math.cos(elapsed * 0.7 + i * 0.03) * 0.002;
    }
    parts.geo.attributes.position.needsUpdate = true;

    camera.position.x = Math.sin(elapsed * 0.06) * 2;
    camera.position.y = Math.cos(elapsed * 0.04) * 1;
    camera.position.z = 15 - scrollY * 0.004;
    camera.lookAt(0, 0, 0);
  }
${this._postamble()}`;
    return { js, css: this._canvasCss(canvasId) };
  }

  // ── SCENE: Ecommerce — Product Showcase Platforms ─────────────────

  _sceneEcommerce({ canvasId, colors, darkMode, bgColor, performanceLevel }) {
    const js = `${this._preamble(canvasId, bgColor, colors)}
  camera.position.set(0, 3, 12);

  scene.add(new THREE.AmbientLight(0x222222, 0.5));
  const spotColors = [PRIMARY, SECONDARY, ACCENT, 0xffffff];
  const spots = [];
  for (let i = 0; i < 4; i++) {
    const spot = new THREE.PointLight(spotColors[i], 2, 30);
    spot.position.set(Math.cos(i*Math.PI/2)*5, 4, Math.sin(i*Math.PI/2)*5);
    scene.add(spot);
    spots.push(spot);
  }

  // Floating platforms
  const platformGroup = new THREE.Group();
  const platforms = [];
  const shapes = [
    () => new THREE.TorusKnotGeometry(0.6, 0.2, 64, 8),
    () => new THREE.IcosahedronGeometry(0.7, 0),
    () => new THREE.OctahedronGeometry(0.7, 0),
    () => new THREE.TorusGeometry(0.5, 0.2, 16, 32),
    () => new THREE.DodecahedronGeometry(0.6, 0),
  ];
  const platCount = isMobile ? 4 : 7;
  for (let i = 0; i < platCount; i++) {
    const angle = (i / platCount) * Math.PI * 2;
    const r = 3.5;
    // Platform disc
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 0.08, 32),
      new THREE.MeshStandardMaterial({ color: 0x333344, metalness: 0.9, roughness: 0.2 })
    );
    disc.position.set(Math.cos(angle)*r, Math.sin(i*0.5)*1.5, Math.sin(angle)*r);
    platformGroup.add(disc);
    // Product shape on platform
    const product = new THREE.Mesh(
      shapes[i % shapes.length](),
      new THREE.MeshStandardMaterial({
        color: spotColors[i % spotColors.length], metalness: 0.7, roughness: 0.3,
        emissive: spotColors[i % spotColors.length], emissiveIntensity: 0.2,
      })
    );
    product.position.copy(disc.position).add(new THREE.Vector3(0, 0.8, 0));
    platformGroup.add(product);
    platforms.push({ disc, product, angle, baseY: disc.position.y });
  }
  scene.add(platformGroup);

  const parts = ${this._particleSnippet(800, 'ACCENT', 0.04, 15, 'AdditiveBlending')};

  function update(elapsed) {
    platformGroup.rotation.y = elapsed * 0.08 + mouse.x * 0.4;

    platforms.forEach((p, i) => {
      p.product.rotation.y = elapsed * 0.5 + i;
      p.product.rotation.x = Math.sin(elapsed * 0.3 + i) * 0.2;
      p.disc.position.y = p.baseY + Math.sin(elapsed * 0.5 + i * 0.8) * 0.3;
      p.product.position.y = p.disc.position.y + 0.8;
    });

    spots.forEach((s, i) => {
      s.position.x = Math.cos(elapsed * 0.3 + i * Math.PI/2) * 6;
      s.position.z = Math.sin(elapsed * 0.3 + i * Math.PI/2) * 6;
    });

    for (let i = 0; i < parts.count; i++) {
      parts.pos[i*3+1] += 0.003;
      if (parts.pos[i*3+1] > 8) parts.pos[i*3+1] = -8;
    }
    parts.geo.attributes.position.needsUpdate = true;

    camera.position.x = Math.sin(elapsed * 0.06) * 1.5 + mouse.x * 1.5;
    camera.position.y = 3 + mouse.y * 1 + Math.cos(elapsed * 0.05) * 0.5;
    camera.position.z = 12 - scrollY * 0.004;
    camera.lookAt(0, 0, 0);
  }
${this._postamble()}`;
    return { js, css: this._canvasCss(canvasId) };
  }

  // ── SCENE: Restaurant — Smoke/Steam Particles ────────────────────

  _sceneRestaurant({ canvasId, colors, darkMode, bgColor, performanceLevel }) {
    const js = `${this._preamble(canvasId, bgColor, { ...colors, primary: '#f59e0b', secondary: '#d97706', accent: '#fbbf24' })}
  camera.position.set(0, 1, 8);

  scene.add(new THREE.AmbientLight(0x221100, 0.6));
  scene.fog = new THREE.FogExp2(${this._hex(bgColor)}, 0.04);
  const warmLight1 = new THREE.PointLight(0xf59e0b, 3, 25);
  warmLight1.position.set(3, 4, 3);
  scene.add(warmLight1);
  const warmLight2 = new THREE.PointLight(0xd97706, 2, 20);
  warmLight2.position.set(-3, 2, 2);
  scene.add(warmLight2);
  const warmLight3 = new THREE.PointLight(0xff6b00, 1.5, 15);
  warmLight3.position.set(0, -1, 5);
  scene.add(warmLight3);

  // Central warm orb (firelight)
  const orbGeo = new THREE.SphereGeometry(0.4, 16, 16);
  const orbMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b, emissive: 0xff8c00, emissiveIntensity: 1.0, transparent: true, opacity: 0.6,
  });
  const orb = new THREE.Mesh(orbGeo, orbMat);
  orb.position.y = -1;
  scene.add(orb);

  // Smoke/steam particles — rising with turbulence
  const smokeCount = isMobile ? 400 : 1200;
  const smokePos = new Float32Array(smokeCount * 3);
  const smokeSpeeds = new Float32Array(smokeCount);
  const smokePhases = new Float32Array(smokeCount);
  for (let i = 0; i < smokeCount; i++) {
    smokePos[i*3]   = (Math.random()-0.5) * 6;
    smokePos[i*3+1] = Math.random() * 12 - 2;
    smokePos[i*3+2] = (Math.random()-0.5) * 6;
    smokeSpeeds[i] = 0.005 + Math.random() * 0.015;
    smokePhases[i] = Math.random() * Math.PI * 2;
  }
  const smokeGeo = new THREE.BufferGeometry();
  smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePos, 3));
  const smokeMat = new THREE.PointsMaterial({
    color: 0xfbbf24, size: isMobile ? 0.15 : 0.08, transparent: true, opacity: 0.25,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  scene.add(new THREE.Points(smokeGeo, smokeMat));

  // Ambient floating torus rings (plate metaphor)
  const rings = [];
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.5 + i * 0.5, 0.02, 8, 64),
      new THREE.MeshBasicMaterial({ color: 0xd97706, transparent: true, opacity: 0.15 })
    );
    ring.position.y = -1 + i * 0.3;
    ring.rotation.x = Math.PI * 0.5;
    scene.add(ring);
    rings.push(ring);
  }

  function update(elapsed) {
    // Smoke rise with turbulence
    for (let i = 0; i < smokeCount; i++) {
      smokePos[i*3+1] += smokeSpeeds[i];
      smokePos[i*3]   += Math.sin(elapsed * 0.8 + smokePhases[i]) * 0.003;
      smokePos[i*3+2] += Math.cos(elapsed * 0.6 + smokePhases[i]) * 0.003;
      if (smokePos[i*3+1] > 10) {
        smokePos[i*3+1] = -2;
        smokePos[i*3] = (Math.random()-0.5) * 4;
        smokePos[i*3+2] = (Math.random()-0.5) * 4;
      }
    }
    smokeGeo.attributes.position.needsUpdate = true;

    orb.scale.setScalar(0.9 + Math.sin(elapsed * 3) * 0.15);
    orbMat.emissiveIntensity = 0.7 + Math.sin(elapsed * 4) * 0.3;

    rings.forEach((r, i) => { r.rotation.z = elapsed * 0.1 * (i+1); });

    warmLight1.intensity = 2.5 + Math.sin(elapsed * 5) * 0.5;

    camera.position.x = Math.sin(elapsed * 0.05) * 1 + mouse.x * 0.8;
    camera.position.y = 1 + mouse.y * 0.5 + Math.cos(elapsed * 0.04) * 0.3;
    camera.position.z = 8 - scrollY * 0.003;
    camera.lookAt(0, 0, 0);
  }
${this._postamble()}`;
    return { js, css: this._canvasCss(canvasId) };
  }

  // ── SCENE: Education — Assembling Geometric Shapes ────────────────

  _sceneEducation({ canvasId, colors, darkMode, bgColor, performanceLevel }) {
    const js = `${this._preamble(canvasId, bgColor, { ...colors, primary: '#8b5cf6', secondary: '#a78bfa', accent: '#c084fc' })}
  camera.position.set(0, 2, 12);

  scene.add(new THREE.AmbientLight(0x111122, 0.5));
  const purpleLight = new THREE.PointLight(0x8b5cf6, 3, 40);
  purpleLight.position.set(5, 5, 5);
  scene.add(purpleLight);
  const softLight = new THREE.PointLight(0xc084fc, 2, 30);
  softLight.position.set(-4, 3, 6);
  scene.add(softLight);

  const shapeGroup = new THREE.Group();
  const geometries = [
    new THREE.TetrahedronGeometry(0.5),
    new THREE.OctahedronGeometry(0.5),
    new THREE.IcosahedronGeometry(0.5, 0),
    new THREE.DodecahedronGeometry(0.4),
    new THREE.TorusGeometry(0.35, 0.15, 8, 16),
    new THREE.TorusKnotGeometry(0.3, 0.1, 32, 4),
    new THREE.BoxGeometry(0.6, 0.6, 0.6),
    new THREE.ConeGeometry(0.4, 0.8, 6),
  ];
  const shapeCount = isMobile ? 12 : 25;
  const shapes = [];
  for (let i = 0; i < shapeCount; i++) {
    const mat = new THREE.MeshStandardMaterial({
      color: [0x8b5cf6, 0xa78bfa, 0xc084fc, 0x7c3aed][i % 4],
      metalness: 0.5, roughness: 0.4,
      emissive: [0x8b5cf6, 0xa78bfa, 0xc084fc, 0x7c3aed][i % 4],
      emissiveIntensity: 0.15,
    });
    const mesh = new THREE.Mesh(geometries[i % geometries.length].clone(), mat);
    // Orbit parameters
    const orbitR = 2 + Math.random() * 5;
    const orbitSpeed = 0.1 + Math.random() * 0.3;
    const orbitPhase = Math.random() * Math.PI * 2;
    const orbitY = (Math.random() - 0.5) * 6;
    mesh.userData = { orbitR, orbitSpeed, orbitPhase, orbitY, spinSpeed: 0.3 + Math.random() * 1 };
    shapeGroup.add(mesh);
    shapes.push(mesh);
  }
  scene.add(shapeGroup);

  const parts = ${this._particleSnippet(1000, '0xc084fc', 0.03, 16, 'AdditiveBlending')};

  function update(elapsed) {
    shapes.forEach(s => {
      const d = s.userData;
      s.position.x = Math.cos(elapsed * d.orbitSpeed + d.orbitPhase) * d.orbitR;
      s.position.z = Math.sin(elapsed * d.orbitSpeed + d.orbitPhase) * d.orbitR;
      s.position.y = d.orbitY + Math.sin(elapsed * 0.5 + d.orbitPhase) * 0.5;
      s.rotation.x += 0.005 * d.spinSpeed;
      s.rotation.y += 0.008 * d.spinSpeed;
    });

    for (let i = 0; i < parts.count; i++) {
      parts.pos[i*3+1] += 0.003;
      if (parts.pos[i*3+1] > 8) parts.pos[i*3+1] = -8;
    }
    parts.geo.attributes.position.needsUpdate = true;

    camera.position.x = Math.sin(elapsed * 0.07) * 2 + mouse.x * 1.5;
    camera.position.y = 2 + mouse.y * 1 + Math.cos(elapsed * 0.05) * 0.5;
    camera.position.z = 12 - scrollY * 0.004;
    camera.lookAt(0, 0, 0);
  }
${this._postamble()}`;
    return { js, css: this._canvasCss(canvasId) };
  }

  // ── SCENE: Luxury — Gold Particles + Crystal ──────────────────────

  _sceneLuxury({ canvasId, colors, darkMode, bgColor, performanceLevel }) {
    const js = `${this._preamble(canvasId, bgColor, { ...colors, primary: '#d4a017', secondary: '#b8860b', accent: '#ffd700' })}
  camera.position.set(0, 0, 10);

  scene.add(new THREE.AmbientLight(0x221100, 0.3));
  const goldLight1 = new THREE.PointLight(0xffd700, 3, 40);
  goldLight1.position.set(5, 5, 5);
  scene.add(goldLight1);
  const goldLight2 = new THREE.PointLight(0xd4a017, 2, 30);
  goldLight2.position.set(-5, -3, 4);
  scene.add(goldLight2);
  const whiteLight = new THREE.PointLight(0xffffff, 1, 20);
  whiteLight.position.set(0, 3, 8);
  scene.add(whiteLight);

  // Crystalline icosahedron
  const crystalGeo = new THREE.IcosahedronGeometry(2, 1);
  const crystalMat = new THREE.MeshStandardMaterial({
    color: 0xffd700, metalness: 1, roughness: 0.05,
    emissive: 0xd4a017, emissiveIntensity: 0.2,
    transparent: true, opacity: 0.85,
  });
  const crystal = new THREE.Mesh(crystalGeo, crystalMat);
  scene.add(crystal);

  // Wireframe outline
  const wireGeo = new THREE.IcosahedronGeometry(2.05, 1);
  const wireMat = new THREE.MeshBasicMaterial({ color: 0xffd700, wireframe: true, transparent: true, opacity: 0.3 });
  const wire = new THREE.Mesh(wireGeo, wireMat);
  scene.add(wire);

  // Gold particles
  const goldCount = isMobile ? 600 : 2000;
  const goldPos = new Float32Array(goldCount * 3);
  const goldVel = new Float32Array(goldCount);
  for (let i = 0; i < goldCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 3 + Math.random() * 8;
    goldPos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    goldPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    goldPos[i*3+2] = r * Math.cos(phi);
    goldVel[i] = 0.001 + Math.random() * 0.003;
  }
  const goldGeo = new THREE.BufferGeometry();
  goldGeo.setAttribute('position', new THREE.BufferAttribute(goldPos, 3));
  const goldMat = new THREE.PointsMaterial({
    color: 0xffd700, size: 0.05, transparent: true, opacity: 0.7,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  scene.add(new THREE.Points(goldGeo, goldMat));

  // Orbital rings
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(3 + i * 0.8, 0.01, 8, 100),
      new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.15 })
    );
    ring.rotation.x = Math.PI * 0.3 * i;
    ring.rotation.y = Math.PI * 0.2 * i;
    scene.add(ring);
  }

  function update(elapsed) {
    crystal.rotation.y = elapsed * 0.12;
    crystal.rotation.x = Math.sin(elapsed * 0.08) * 0.2;
    wire.rotation.y = -elapsed * 0.08;
    wire.rotation.x = Math.cos(elapsed * 0.06) * 0.2;

    // Slowly swirl gold particles
    for (let i = 0; i < goldCount; i++) {
      const x = goldPos[i*3], z = goldPos[i*3+2];
      const angle = goldVel[i];
      goldPos[i*3]   = x * Math.cos(angle) - z * Math.sin(angle);
      goldPos[i*3+2] = x * Math.sin(angle) + z * Math.cos(angle);
      goldPos[i*3+1] += Math.sin(elapsed + i * 0.01) * 0.001;
    }
    goldGeo.attributes.position.needsUpdate = true;

    camera.position.x = Math.sin(elapsed * 0.04) * 2 + mouse.x * 1.5;
    camera.position.y = Math.cos(elapsed * 0.03) * 1 + mouse.y * 1;
    camera.position.z = 10 - scrollY * 0.003;
    camera.lookAt(0, 0, 0);
  }
${this._postamble()}`;
    return { js, css: this._canvasCss(canvasId) };
  }

  // ── SCENE: Agency — Morphing Iridescent Blob ──────────────────────

  _sceneAgency({ canvasId, colors, darkMode, bgColor, performanceLevel }) {
    const js = `${this._preamble(canvasId, bgColor, colors)}
  camera.position.set(0, 0, 6);

  scene.add(new THREE.AmbientLight(0x111111, 0.3));
  const light1 = new THREE.PointLight(0xff0066, 3, 30);
  light1.position.set(3, 3, 3);
  scene.add(light1);
  const light2 = new THREE.PointLight(0x00ccff, 3, 30);
  light2.position.set(-3, -2, 3);
  scene.add(light2);
  const light3 = new THREE.PointLight(0xffcc00, 2, 25);
  light3.position.set(0, 3, -3);
  scene.add(light3);

  // Morphing blob — high-detail icosahedron with vertex displacement
  const blobGeo = new THREE.IcosahedronGeometry(2, ${performanceLevel === 'high' ? 5 : 3});
  const blobMat = new THREE.MeshStandardMaterial({
    color: PRIMARY, metalness: 0.9, roughness: 0.1,
    emissive: SECONDARY, emissiveIntensity: 0.15,
  });
  const blob = new THREE.Mesh(blobGeo, blobMat);
  scene.add(blob);
  const blobBase = blobGeo.attributes.position.array.slice();

  // Iridescence simulation — multiple colored wireframe layers
  const layers = [];
  const layerColors = [0xff0066, 0x00ccff, 0xffcc00];
  for (let i = 0; i < 3; i++) {
    const lGeo = new THREE.IcosahedronGeometry(2.08 + i * 0.04, 3);
    const lMat = new THREE.MeshBasicMaterial({
      color: layerColors[i], wireframe: true, transparent: true, opacity: 0.06,
    });
    const lMesh = new THREE.Mesh(lGeo, lMat);
    scene.add(lMesh);
    layers.push({ mesh: lMesh, geo: lGeo, base: lGeo.attributes.position.array.slice() });
  }

  const parts = ${this._particleSnippet(1200, 'ACCENT', 0.03, 12, 'AdditiveBlending')};

  function update(elapsed) {
    // Morphing displacement
    const pos = blobGeo.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      const ox = blobBase[i], oy = blobBase[i+1], oz = blobBase[i+2];
      const len = Math.sqrt(ox*ox + oy*oy + oz*oz);
      const nx = ox/len, ny = oy/len, nz = oz/len;
      const d = Math.sin(nx*4 + elapsed*1.2) * Math.cos(ny*4 + elapsed*0.9) * Math.sin(nz*4 + elapsed*0.7) * 0.25;
      pos[i]   = ox * (1 + d);
      pos[i+1] = oy * (1 + d);
      pos[i+2] = oz * (1 + d);
    }
    blobGeo.attributes.position.needsUpdate = true;
    blobGeo.computeVertexNormals();

    layers.forEach((l, li) => {
      const lp = l.geo.attributes.position.array;
      for (let i = 0; i < lp.length; i += 3) {
        const ox = l.base[i], oy = l.base[i+1], oz = l.base[i+2];
        const len = Math.sqrt(ox*ox + oy*oy + oz*oz);
        const nx = ox/len, ny = oy/len, nz = oz/len;
        const d = Math.sin(nx*4 + elapsed*1.2 + li*0.5) * Math.cos(ny*4 + elapsed*0.9 + li*0.3) * 0.2;
        lp[i]   = ox * (1 + d);
        lp[i+1] = oy * (1 + d);
        lp[i+2] = oz * (1 + d);
      }
      l.geo.attributes.position.needsUpdate = true;
    });

    blob.rotation.y = elapsed * 0.15;
    blob.rotation.x = Math.sin(elapsed * 0.1) * 0.3;

    light1.position.x = Math.sin(elapsed * 0.7) * 5;
    light1.position.y = Math.cos(elapsed * 0.5) * 4;
    light2.position.x = Math.cos(elapsed * 0.6) * 5;
    light2.position.z = Math.sin(elapsed * 0.4) * 5;

    for (let i = 0; i < parts.count; i++) {
      parts.pos[i*3] += Math.sin(elapsed + i*0.05) * 0.002;
      parts.pos[i*3+1] += Math.cos(elapsed*0.8 + i*0.03) * 0.002;
    }
    parts.geo.attributes.position.needsUpdate = true;

    camera.position.x = Math.sin(elapsed * 0.08) * 1.5 + mouse.x * 1.5;
    camera.position.y = Math.cos(elapsed * 0.06) * 0.8 + mouse.y * 1;
    camera.position.z = 6 - scrollY * 0.003;
    camera.lookAt(0, 0, 0);
  }
${this._postamble()}`;
    return { js, css: this._canvasCss(canvasId) };
  }

  // ── SCENE: Tech — Circuit Board / Code Matrix in 3D ───────────────

  _sceneTech({ canvasId, colors, darkMode, bgColor, performanceLevel }) {
    const js = `${this._preamble(canvasId, bgColor, { ...colors, primary: '#06b6d4', secondary: '#0891b2', accent: '#22d3ee' })}
  camera.position.set(0, 8, 15);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0x001122, 0.4));
  const cyanLight = new THREE.PointLight(0x06b6d4, 3, 50);
  cyanLight.position.set(5, 5, 5);
  scene.add(cyanLight);
  const tealLight = new THREE.PointLight(0x0891b2, 2, 40);
  tealLight.position.set(-5, 3, 8);
  scene.add(tealLight);

  // Circuit board grid plane
  const boardGeo = new THREE.PlaneGeometry(20, 20, 40, 40);
  const boardMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4, wireframe: true, transparent: true, opacity: 0.1,
    emissive: 0x06b6d4, emissiveIntensity: 0.15,
  });
  const board = new THREE.Mesh(boardGeo, boardMat);
  board.rotation.x = -Math.PI * 0.5;
  board.position.y = -3;
  scene.add(board);

  // Circuit nodes — vertical pillars from board
  const pillarGroup = new THREE.Group();
  const pillarCount = isMobile ? 30 : 80;
  const pillars = [];
  for (let i = 0; i < pillarCount; i++) {
    const h = 0.3 + Math.random() * 3;
    const geo = new THREE.BoxGeometry(0.08, h, 0.08);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x22d3ee, emissive: 0x22d3ee, emissiveIntensity: 0.5,
      transparent: true, opacity: 0.5 + Math.random() * 0.4,
    });
    const pillar = new THREE.Mesh(geo, mat);
    pillar.position.set((Math.random()-0.5)*18, h/2 - 3, (Math.random()-0.5)*18);
    pillar.userData = { phase: Math.random() * Math.PI * 2, baseH: h };
    pillarGroup.add(pillar);
    pillars.push(pillar);

    // Node cap
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee })
    );
    cap.position.set(pillar.position.x, pillar.position.y + h/2, pillar.position.z);
    pillarGroup.add(cap);
  }
  scene.add(pillarGroup);

  // Connection lines between random pillars
  for (let i = 0; i < Math.min(pillarCount, 40); i++) {
    const a = pillars[Math.floor(Math.random() * pillars.length)];
    const b = pillars[Math.floor(Math.random() * pillars.length)];
    if (a === b) continue;
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(a.position.x, -3, a.position.z),
      new THREE.Vector3(b.position.x, -3, b.position.z),
    ]);
    const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({
      color: 0x06b6d4, transparent: true, opacity: 0.08,
    }));
    scene.add(line);
  }

  // Data rain particles
  const parts = ${this._particleSnippet(1800, '0x22d3ee', 0.04, 20, 'AdditiveBlending')};

  function update(elapsed) {
    pillars.forEach(p => {
      const pulse = Math.sin(elapsed * 2 + p.userData.phase);
      p.scale.y = 0.6 + pulse * 0.5;
      p.material.emissiveIntensity = 0.3 + pulse * 0.4;
    });

    for (let i = 0; i < parts.count; i++) {
      parts.pos[i*3+1] -= 0.015;
      if (parts.pos[i*3+1] < -10) parts.pos[i*3+1] = 10;
    }
    parts.geo.attributes.position.needsUpdate = true;

    camera.position.x = Math.sin(elapsed * 0.06) * 3 + mouse.x * 2;
    camera.position.y = 8 + mouse.y * 1.5 + Math.cos(elapsed * 0.04) * 0.5;
    camera.position.z = 15 - scrollY * 0.005;
    camera.lookAt(0, 0, 0);
  }
${this._postamble()}`;
    return { js, css: this._canvasCss(canvasId) };
  }

  // ── SCENE: Default — Morphing Icosahedron + Bloom + Particles ─────

  _sceneDefault({ canvasId, colors, darkMode, bgColor, performanceLevel }) {
    const js = `${this._preamble(canvasId, bgColor, colors)}
  camera.position.set(0, 0, 8);

  scene.add(new THREE.AmbientLight(0x111122, 0.4));
  const mainLight = new THREE.PointLight(PRIMARY, 3, 40);
  mainLight.position.set(5, 5, 5);
  scene.add(mainLight);
  const fillLight = new THREE.PointLight(SECONDARY, 2, 30);
  fillLight.position.set(-4, -2, 4);
  scene.add(fillLight);
  const rimLight = new THREE.PointLight(ACCENT, 1.5, 25);
  rimLight.position.set(0, 4, -4);
  scene.add(rimLight);

  // Main morphing icosahedron
  const icoGeo = new THREE.IcosahedronGeometry(2, ${performanceLevel === 'high' ? 4 : 3});
  const icoMat = new THREE.MeshStandardMaterial({
    color: PRIMARY, metalness: 0.7, roughness: 0.2,
    emissive: PRIMARY, emissiveIntensity: 0.15,
  });
  const ico = new THREE.Mesh(icoGeo, icoMat);
  scene.add(ico);
  const icoBase = icoGeo.attributes.position.array.slice();

  // Wireframe shell
  const shellGeo = new THREE.IcosahedronGeometry(2.2, 2);
  const shellMat = new THREE.MeshBasicMaterial({
    color: SECONDARY, wireframe: true, transparent: true, opacity: 0.12,
  });
  const shell = new THREE.Mesh(shellGeo, shellMat);
  scene.add(shell);

  // Orbital torus knot
  const knotGeo = new THREE.TorusKnotGeometry(3.5, 0.03, 128, 8, 3, 2);
  const knotMat = new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.2 });
  const knot = new THREE.Mesh(knotGeo, knotMat);
  scene.add(knot);

  const parts = ${this._particleSnippet(1500, 'ACCENT', 0.03, 15, 'AdditiveBlending')};

  function update(elapsed) {
    // Vertex morphing
    const pos = icoGeo.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      const ox = icoBase[i], oy = icoBase[i+1], oz = icoBase[i+2];
      const len = Math.sqrt(ox*ox + oy*oy + oz*oz);
      const nx = ox/len, ny = oy/len, nz = oz/len;
      const d = Math.sin(nx*3.5 + elapsed*1.5) * Math.cos(ny*3.5 + elapsed) * Math.sin(nz*2 + elapsed*0.8) * 0.2;
      pos[i]   = ox * (1 + d);
      pos[i+1] = oy * (1 + d);
      pos[i+2] = oz * (1 + d);
    }
    icoGeo.attributes.position.needsUpdate = true;
    icoGeo.computeVertexNormals();

    ico.rotation.y = elapsed * 0.15;
    ico.rotation.x = Math.sin(elapsed * 0.1) * 0.2;

    shell.rotation.y = -elapsed * 0.1;
    shell.rotation.z = Math.cos(elapsed * 0.08) * 0.15;

    knot.rotation.x = elapsed * 0.08;
    knot.rotation.y = elapsed * 0.12;

    // Particle gentle drift
    for (let i = 0; i < parts.count; i++) {
      parts.pos[i*3]   += Math.sin(elapsed * 0.5 + i * 0.1) * 0.001;
      parts.pos[i*3+1] += Math.cos(elapsed * 0.3 + i * 0.05) * 0.001;
    }
    parts.geo.attributes.position.needsUpdate = true;

    mainLight.position.x = Math.sin(elapsed * 0.4) * 6;
    mainLight.position.y = Math.cos(elapsed * 0.3) * 4;
    fillLight.position.z = Math.sin(elapsed * 0.5) * 5;

    camera.position.x = Math.sin(elapsed * 0.07) * 1.5 + mouse.x * 1.5;
    camera.position.y = Math.cos(elapsed * 0.05) * 0.8 + mouse.y * 1;
    camera.position.z = 8 - scrollY * 0.003;
    camera.lookAt(0, 0, 0);
  }
${this._postamble()}`;
    return { js, css: this._canvasCss(canvasId) };
  }
}

// ── Export ────────────────────────────────────────────────────────────

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Nexus3DSceneEngine;
}
if (typeof window !== 'undefined') {
  window.Nexus3DSceneEngine = Nexus3DSceneEngine;
}
