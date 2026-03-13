/**
 * Nexus 3D Scene Engine
 *
 * Generates UNIQUE Three.js scenes per business type/niche.
 * Each scene is a complete, self-contained ES module with:
 *   - requestAnimationFrame loop
 *   - Resize handling
 *   - Mouse parallax
 *   - Scroll reactivity
 *   - Mobile optimization
 *
 * Supported scenes: fintech, trading, saas, healthcare, ecommerce,
 *   fitness, education, restaurant, agency, luxury, tech, default
 */

'use strict';

class Nexus3DSceneEngine {
  constructor() {
    this.version = '1.0.0';
    this.threeCDN = 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';
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
      dependencies: [this.threeCDN],
    };
  }

  // ── Helpers ──────────────────────────────────────────────────────

  _hex(color) {
    return '0x' + (color || '#3b82f6').replace('#', '');
  }

  _preamble(canvasId, bgColor, colors) {
    return `
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';

(function() {
  const canvas = document.getElementById('${canvasId}');
  if (!canvas) return;

  const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
  const mouse = { x: 0, y: 0 };
  let scrollY = 0;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(${this._hex(bgColor)});

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const PRIMARY = ${this._hex(colors.primary)};
  const SECONDARY = ${this._hex(colors.secondary)};
  const ACCENT = ${this._hex(colors.accent)};

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
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
    renderer.render(scene, camera);
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

  // ── SCENE 1: Fintech — Floating Data Grid ───────────────────────

  _sceneFintech({ canvasId, colors, darkMode, bgColor, performanceLevel }) {
    const gridSize = performanceLevel === 'high' ? 10 : performanceLevel === 'medium' ? 7 : 5;
    const js = `${this._preamble(canvasId, bgColor, colors)}
  camera.position.set(0, 5, 18);
  camera.lookAt(0, 0, 0);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
  scene.add(ambientLight);
  const pointLight = new THREE.PointLight(PRIMARY, 2, 50);
  pointLight.position.set(5, 5, 5);
  scene.add(pointLight);

  const gridSize = isMobile ? ${Math.max(gridSize - 3, 3)} : ${gridSize};
  const spacing = 1.8;
  const cubes = [];
  const cubeGroup = new THREE.Group();

  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      for (let z = 0; z < 3; z++) {
        const geo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
        const mat = new THREE.MeshPhongMaterial({
          color: PRIMARY,
          transparent: true,
          opacity: 0.08 + Math.random() * 0.15,
          wireframe: Math.random() > 0.5,
        });
        const cube = new THREE.Mesh(geo, mat);
        cube.position.set(
          (x - gridSize / 2) * spacing,
          (y - gridSize / 2) * spacing,
          (z - 1) * spacing
        );
        cube.userData.baseOpacity = mat.opacity;
        cube.userData.pulseSpeed = 0.5 + Math.random() * 2;
        cube.userData.pulseOffset = Math.random() * Math.PI * 2;
        cubeGroup.add(cube);
        cubes.push(cube);
      }
    }
  }
  scene.add(cubeGroup);

  // Heatmap glow cubes — some cubes are designated "hot"
  const hotIndices = new Set();
  for (let i = 0; i < Math.floor(cubes.length * 0.15); i++) {
    hotIndices.add(Math.floor(Math.random() * cubes.length));
  }
  hotIndices.forEach(i => {
    cubes[i].material.color.set(ACCENT);
    cubes[i].userData.baseOpacity = 0.4;
    cubes[i].material.opacity = 0.4;
    cubes[i].material.wireframe = false;
  });

  function update(elapsed) {
    cubeGroup.rotation.y = elapsed * 0.05 + mouse.x * 0.3;
    cubeGroup.rotation.x = Math.sin(elapsed * 0.03) * 0.1 + mouse.y * 0.2;

    const scrollFactor = scrollY / (document.body.scrollHeight || 1);
    camera.position.z = 18 - scrollFactor * 10;

    for (let i = 0; i < cubes.length; i++) {
      const c = cubes[i];
      const pulse = Math.sin(elapsed * c.userData.pulseSpeed + c.userData.pulseOffset);
      c.material.opacity = c.userData.baseOpacity + pulse * 0.08;
      c.scale.setScalar(1 + pulse * 0.05);
    }

    pointLight.position.x = Math.sin(elapsed * 0.5) * 8;
    pointLight.position.y = Math.cos(elapsed * 0.3) * 5;
  }
${this._postamble()}`;

    return { js, css: this._canvasCss(canvasId) };
  }

  // ── SCENE 2: Trading — Market Flow ──────────────────────────────

  _sceneTrading({ canvasId, colors, darkMode, bgColor, performanceLevel }) {
    const streamCount = performanceLevel === 'high' ? 5 : 3;
    const particlesPerStream = performanceLevel === 'high' ? 600 : performanceLevel === 'medium' ? 350 : 200;

    const js = `${this._preamble(canvasId, bgColor, colors)}
  camera.position.set(0, 0, 30);

  const streamCount = isMobile ? ${Math.max(streamCount - 2, 2)} : ${streamCount};
  const particlesPerStream = isMobile ? ${Math.floor(particlesPerStream * 0.4)} : ${particlesPerStream};
  const streams = [];
  const streamColors = [PRIMARY, SECONDARY, ACCENT, 0x22d3ee, 0x34d399];

  for (let s = 0; s < streamCount; s++) {
    const positions = new Float32Array(particlesPerStream * 3);
    const velocities = new Float32Array(particlesPerStream);
    const phases = new Float32Array(particlesPerStream);
    const yOffset = (s - streamCount / 2) * 4;
    const freq = 0.1 + Math.random() * 0.15;
    const amp = 2 + Math.random() * 3;

    for (let i = 0; i < particlesPerStream; i++) {
      const x = (i / particlesPerStream) * 60 - 30;
      positions[i * 3] = x;
      positions[i * 3 + 1] = Math.sin(x * freq) * amp + yOffset;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
      velocities[i] = 0.02 + Math.random() * 0.04;
      phases[i] = Math.random() * Math.PI * 2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: streamColors[s % streamColors.length],
      size: isMobile ? 0.12 : 0.08,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const points = new THREE.Points(geo, mat);
    scene.add(points);
    streams.push({ points, positions, velocities, phases, freq, amp, yOffset });
  }

  // Trail lines per stream
  for (let s = 0; s < streams.length; s++) {
    const trailCount = isMobile ? 60 : 150;
    const trailPositions = new Float32Array(trailCount * 3);
    const st = streams[s];
    for (let i = 0; i < trailCount; i++) {
      const x = (i / trailCount) * 60 - 30;
      trailPositions[i * 3] = x;
      trailPositions[i * 3 + 1] = Math.sin(x * st.freq) * st.amp + st.yOffset;
      trailPositions[i * 3 + 2] = 0;
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: streamColors[s % streamColors.length],
      transparent: true,
      opacity: 0.15,
    });
    const line = new THREE.Line(lineGeo, lineMat);
    scene.add(line);
    streams[s].trailGeo = lineGeo;
    streams[s].trailPositions = trailPositions;
    streams[s].trailCount = trailCount;
  }

  function update(elapsed) {
    const scrollFactor = scrollY / (document.body.scrollHeight || 1);
    const speedMult = 1 + scrollFactor * 3;

    camera.position.x = mouse.x * 3;
    camera.position.y = mouse.y * 2;
    camera.lookAt(0, 0, 0);

    for (const st of streams) {
      const pos = st.points.geometry.attributes.position.array;
      for (let i = 0; i < pos.length / 3; i++) {
        pos[i * 3] += st.velocities[i] * speedMult;
        if (pos[i * 3] > 30) pos[i * 3] = -30;
        pos[i * 3 + 1] = Math.sin((pos[i * 3] + elapsed * 2) * st.freq) * st.amp + st.yOffset;
        pos[i * 3 + 2] = Math.sin(elapsed + st.phases[i]) * 1.5;
      }
      st.points.geometry.attributes.position.needsUpdate = true;

      // Update trail line
      if (st.trailGeo) {
        const tp = st.trailPositions;
        for (let i = 0; i < st.trailCount; i++) {
          const x = (i / st.trailCount) * 60 - 30;
          tp[i * 3 + 1] = Math.sin((x + elapsed * 2) * st.freq) * st.amp + st.yOffset;
        }
        st.trailGeo.attributes.position.needsUpdate = true;
      }
    }
  }
${this._postamble()}`;

    return { js, css: this._canvasCss(canvasId) };
  }

  // ── SCENE 3: SaaS — Orbital Network ────────────────────────────

  _sceneSaas({ canvasId, colors, darkMode, bgColor, performanceLevel }) {
    const nodeCount = performanceLevel === 'high' ? 40 : performanceLevel === 'medium' ? 25 : 15;

    const js = `${this._preamble(canvasId, bgColor, colors)}
  camera.position.set(0, 5, 20);
  camera.lookAt(0, 0, 0);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);
  const pointLight = new THREE.PointLight(PRIMARY, 1.5, 40);
  scene.add(pointLight);

  const nodeCount = isMobile ? ${Math.floor(nodeCount * 0.5)} : ${nodeCount};
  const nodes = [];
  const nodeGroup = new THREE.Group();

  for (let i = 0; i < nodeCount; i++) {
    const radius = 3 + Math.random() * 8;
    const angle = Math.random() * Math.PI * 2;
    const ySpread = (Math.random() - 0.5) * 6;
    const speed = (0.1 + Math.random() * 0.3) * (Math.random() > 0.5 ? 1 : -1);
    const size = 0.15 + Math.random() * 0.25;

    const geo = new THREE.SphereGeometry(size, 12, 12);
    const mat = new THREE.MeshPhongMaterial({
      color: i % 3 === 0 ? ACCENT : (i % 3 === 1 ? SECONDARY : PRIMARY),
      emissive: PRIMARY,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.85,
    });
    const sphere = new THREE.Mesh(geo, mat);
    sphere.position.set(
      Math.cos(angle) * radius,
      ySpread,
      Math.sin(angle) * radius
    );
    sphere.userData = { radius, angle, ySpread, speed, baseEmissive: 0.2 };
    nodeGroup.add(sphere);
    nodes.push(sphere);
  }
  scene.add(nodeGroup);

  // Connection lines
  const maxDist = 5;
  const lineGeo = new THREE.BufferGeometry();
  const maxLines = nodeCount * nodeCount;
  const linePositions = new Float32Array(maxLines * 6);
  const lineColors = new Float32Array(maxLines * 6);
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  lineGeo.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));
  const lineMat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.25,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const lines = new THREE.LineSegments(lineGeo, lineMat);
  scene.add(lines);

  const primaryCol = new THREE.Color(PRIMARY);

  function update(elapsed) {
    const scrollFactor = scrollY / (document.body.scrollHeight || 1);
    const orbitSpeed = 1 + scrollFactor * 2;

    camera.position.x = mouse.x * 4;
    camera.position.y = 5 + mouse.y * 3;
    camera.lookAt(0, 0, 0);

    // Update node positions
    for (const node of nodes) {
      const d = node.userData;
      d.angle += d.speed * 0.01 * orbitSpeed;
      node.position.x = Math.cos(d.angle) * d.radius;
      node.position.z = Math.sin(d.angle) * d.radius;
      node.position.y = d.ySpread + Math.sin(elapsed * 0.5 + d.angle) * 0.5;

      // Glow based on mouse proximity (projected)
      const dx = (node.position.x / 15) - mouse.x;
      const dy = (node.position.y / 10) - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      node.material.emissiveIntensity = d.baseEmissive + Math.max(0, 1 - dist) * 0.8;
    }

    // Update connection lines
    let lineIdx = 0;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const d = nodes[i].position.distanceTo(nodes[j].position);
        if (d < maxDist) {
          const alpha = 1 - d / maxDist;
          linePositions[lineIdx * 6] = nodes[i].position.x;
          linePositions[lineIdx * 6 + 1] = nodes[i].position.y;
          linePositions[lineIdx * 6 + 2] = nodes[i].position.z;
          linePositions[lineIdx * 6 + 3] = nodes[j].position.x;
          linePositions[lineIdx * 6 + 4] = nodes[j].position.y;
          linePositions[lineIdx * 6 + 5] = nodes[j].position.z;
          for (let c = 0; c < 6; c++) {
            lineColors[lineIdx * 6 + c] = primaryCol.r * alpha;
            if (c % 3 === 1) lineColors[lineIdx * 6 + c] = primaryCol.g * alpha;
            if (c % 3 === 2) lineColors[lineIdx * 6 + c] = primaryCol.b * alpha;
          }
          lineIdx++;
        }
      }
    }
    lineGeo.setDrawRange(0, lineIdx * 2);
    lineGeo.attributes.position.needsUpdate = true;
    lineGeo.attributes.color.needsUpdate = true;

    pointLight.position.set(Math.sin(elapsed) * 5, 3, Math.cos(elapsed) * 5);
  }
${this._postamble()}`;

    return { js, css: this._canvasCss(canvasId) };
  }

  // ── SCENE 4: Healthcare — DNA Helix ─────────────────────────────

  _sceneHealthcare({ canvasId, colors, darkMode, bgColor, performanceLevel }) {
    const sphereCount = performanceLevel === 'high' ? 80 : performanceLevel === 'medium' ? 50 : 30;

    const js = `${this._preamble(canvasId, bgColor, colors)}
  camera.position.set(0, 0, 25);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
  dirLight.position.set(5, 10, 5);
  scene.add(dirLight);

  const helixGroup = new THREE.Group();
  const sphereCount = isMobile ? ${Math.floor(sphereCount * 0.5)} : ${sphereCount};
  const helixRadius = 3;
  const helixHeight = 30;
  const turns = 3;
  const spheres1 = [];
  const spheres2 = [];
  const bars = [];

  const colA = new THREE.Color(0x22d3ee); // soft cyan
  const colB = new THREE.Color(0x34d399); // soft green

  for (let i = 0; i < sphereCount; i++) {
    const t = i / sphereCount;
    const angle = t * Math.PI * 2 * turns;
    const y = t * helixHeight - helixHeight / 2;

    // Strand 1
    const geo1 = new THREE.SphereGeometry(0.2, 10, 10);
    const mat1 = new THREE.MeshPhongMaterial({ color: colA, emissive: colA, emissiveIntensity: 0.15 });
    const s1 = new THREE.Mesh(geo1, mat1);
    s1.position.set(Math.cos(angle) * helixRadius, y, Math.sin(angle) * helixRadius);
    helixGroup.add(s1);
    spheres1.push(s1);

    // Strand 2 (offset by PI)
    const geo2 = new THREE.SphereGeometry(0.2, 10, 10);
    const mat2 = new THREE.MeshPhongMaterial({ color: colB, emissive: colB, emissiveIntensity: 0.15 });
    const s2 = new THREE.Mesh(geo2, mat2);
    s2.position.set(Math.cos(angle + Math.PI) * helixRadius, y, Math.sin(angle + Math.PI) * helixRadius);
    helixGroup.add(s2);
    spheres2.push(s2);

    // Cross bars every few spheres
    if (i % 3 === 0) {
      const barGeo = new THREE.CylinderGeometry(0.03, 0.03, 1, 4);
      const barMat = new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 });
      const bar = new THREE.Mesh(barGeo, barMat);
      bar.position.copy(s1.position).lerp(s2.position, 0.5);
      bar.lookAt(s2.position);
      bar.rotateX(Math.PI / 2);
      const dist = s1.position.distanceTo(s2.position);
      bar.scale.y = dist;
      helixGroup.add(bar);
      bars.push({ mesh: bar, i1: spheres1.length - 1, i2: spheres2.length - 1 });
    }
  }
  scene.add(helixGroup);

  function update(elapsed) {
    // Slow rotation
    helixGroup.rotation.y = elapsed * 0.15 + mouse.x * 0.5;

    // Breathing scale
    const breath = 1 + Math.sin(elapsed * 0.8) * 0.04;
    helixGroup.scale.set(breath, breath, breath);

    // Camera parallax
    camera.position.x = mouse.x * 3;
    camera.position.y = mouse.y * 4;
    camera.lookAt(0, 0, 0);

    // Scroll shifts view up/down along helix
    const scrollFactor = scrollY / (document.body.scrollHeight || 1);
    helixGroup.position.y = scrollFactor * 10 - 5;

    // Sphere pulse
    for (let i = 0; i < spheres1.length; i++) {
      const pulse = Math.sin(elapsed * 2 + i * 0.3) * 0.05;
      spheres1[i].scale.setScalar(1 + pulse);
      spheres2[i].scale.setScalar(1 + pulse);
    }
  }
${this._postamble()}`;

    return { js, css: this._canvasCss(canvasId) };
  }

  // ── SCENE 5: E-commerce — Product Showcase Orbit ────────────────

  _sceneEcommerce({ canvasId, colors, darkMode, bgColor, performanceLevel }) {
    const shapeCount = performanceLevel === 'high' ? 18 : performanceLevel === 'medium' ? 12 : 8;

    const js = `${this._preamble(canvasId, bgColor, colors)}
  camera.position.set(0, 3, 15);
  camera.lookAt(0, 0, 0);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);
  // Central glow
  const centralLight = new THREE.PointLight(ACCENT, 2, 20);
  centralLight.position.set(0, 0, 0);
  scene.add(centralLight);
  const rimLight = new THREE.PointLight(PRIMARY, 1, 30);
  rimLight.position.set(-5, 5, -5);
  scene.add(rimLight);

  // Central glow sphere
  const glowGeo = new THREE.SphereGeometry(0.8, 16, 16);
  const glowMat = new THREE.MeshBasicMaterial({
    color: ACCENT,
    transparent: true,
    opacity: 0.15,
  });
  const glowSphere = new THREE.Mesh(glowGeo, glowMat);
  scene.add(glowSphere);

  const shapeCount = isMobile ? ${Math.floor(shapeCount * 0.5)} : ${shapeCount};
  const shapes = [];
  const geometries = [
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.SphereGeometry(0.6, 16, 16),
    new THREE.ConeGeometry(0.5, 1.2, 8),
    new THREE.OctahedronGeometry(0.6),
    new THREE.TorusGeometry(0.5, 0.15, 8, 20),
    new THREE.DodecahedronGeometry(0.5),
  ];
  const colorPool = [PRIMARY, SECONDARY, ACCENT];

  for (let i = 0; i < shapeCount; i++) {
    const geo = geometries[i % geometries.length];
    const mat = new THREE.MeshPhongMaterial({
      color: colorPool[i % colorPool.length],
      emissive: colorPool[i % colorPool.length],
      emissiveIntensity: 0.1,
      flatShading: true,
      transparent: true,
      opacity: 0.85,
    });
    const mesh = new THREE.Mesh(geo, mat);
    const orbitRadius = 4 + Math.random() * 5;
    const angle = (i / shapeCount) * Math.PI * 2;
    const yPos = (Math.random() - 0.5) * 4;
    const rotSpeed = { x: (Math.random() - 0.5) * 0.02, y: (Math.random() - 0.5) * 0.02, z: (Math.random() - 0.5) * 0.02 };
    const orbitSpeed = 0.1 + Math.random() * 0.2;

    mesh.position.set(Math.cos(angle) * orbitRadius, yPos, Math.sin(angle) * orbitRadius);
    mesh.userData = { orbitRadius, angle, yPos, rotSpeed, orbitSpeed, baseRadius: orbitRadius };
    scene.add(mesh);
    shapes.push(mesh);
  }

  function update(elapsed) {
    const scrollFactor = scrollY / (document.body.scrollHeight || 1);

    camera.position.x = mouse.x * 3;
    camera.position.y = 3 + mouse.y * 2;
    camera.lookAt(0, 0, 0);

    // Central glow pulse
    glowSphere.scale.setScalar(1 + Math.sin(elapsed * 1.5) * 0.15);
    glowSphere.material.opacity = 0.1 + Math.sin(elapsed) * 0.05;

    for (const shape of shapes) {
      const d = shape.userData;
      // Shapes spread apart on scroll
      const currentRadius = d.baseRadius + scrollFactor * 6;
      d.angle += d.orbitSpeed * 0.01;
      shape.position.x = Math.cos(d.angle) * currentRadius;
      shape.position.z = Math.sin(d.angle) * currentRadius;
      shape.position.y = d.yPos + Math.sin(elapsed * 0.5 + d.angle) * 0.5;

      // Independent rotation
      shape.rotation.x += d.rotSpeed.x;
      shape.rotation.y += d.rotSpeed.y;
      shape.rotation.z += d.rotSpeed.z;
    }
  }
${this._postamble()}`;

    return { js, css: this._canvasCss(canvasId) };
  }

  // ── SCENE 6: Fitness — Energy Burst ─────────────────────────────

  _sceneFitness({ canvasId, colors, darkMode, bgColor, performanceLevel }) {
    const particleCount = performanceLevel === 'high' ? 1500 : performanceLevel === 'medium' ? 800 : 400;

    const js = `${this._preamble(canvasId, bgColor, colors)}
  camera.position.set(0, 0, 20);

  // Central energy sphere
  const coreGeo = new THREE.SphereGeometry(1.5, 32, 32);
  const coreMat = new THREE.MeshBasicMaterial({
    color: ACCENT,
    transparent: true,
    opacity: 0.3,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  scene.add(core);

  // Wireframe overlay
  const wireGeo = new THREE.SphereGeometry(1.6, 16, 16);
  const wireMat = new THREE.MeshBasicMaterial({ color: PRIMARY, wireframe: true, transparent: true, opacity: 0.3 });
  const wireCore = new THREE.Mesh(wireGeo, wireMat);
  scene.add(wireCore);

  // Energy particles along field lines
  const count = isMobile ? ${Math.floor(particleCount * 0.35)} : ${particleCount};
  const positions = new Float32Array(count * 3);
  const velocities = [];
  const lifetimes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    // Spherical distribution
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 2 + Math.random() * 0.5;
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    // Outward velocity along curved paths
    const speed = 0.02 + Math.random() * 0.05;
    velocities.push({
      vx: Math.sin(phi) * Math.cos(theta) * speed,
      vy: Math.sin(phi) * Math.sin(theta) * speed,
      vz: Math.cos(phi) * speed,
      theta,
      phi,
      curveFactor: (Math.random() - 0.5) * 0.02,
    });
    lifetimes[i] = Math.random();
  }

  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const pMat = new THREE.PointsMaterial({
    color: ACCENT,
    size: isMobile ? 0.12 : 0.07,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  // Secondary ring particles
  const ringCount = isMobile ? 200 : 500;
  const ringPos = new Float32Array(ringCount * 3);
  for (let i = 0; i < ringCount; i++) {
    const angle = (i / ringCount) * Math.PI * 2;
    const r = 6 + Math.sin(angle * 5) * 0.5;
    ringPos[i * 3] = Math.cos(angle) * r;
    ringPos[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
    ringPos[i * 3 + 2] = Math.sin(angle) * r;
  }
  const ringGeo = new THREE.BufferGeometry();
  ringGeo.setAttribute('position', new THREE.BufferAttribute(ringPos, 3));
  const ringMat = new THREE.PointsMaterial({
    color: PRIMARY,
    size: 0.06,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const ringParticles = new THREE.Points(ringGeo, ringMat);
  scene.add(ringParticles);

  function update(elapsed) {
    const scrollFactor = scrollY / (document.body.scrollHeight || 1);
    const intensity = 1 + scrollFactor * 3;

    camera.position.x = mouse.x * 4;
    camera.position.y = mouse.y * 3;
    camera.lookAt(0, 0, 0);

    // Core pulse
    const pulse = 1 + Math.sin(elapsed * 3) * 0.1 * intensity;
    core.scale.setScalar(pulse);
    wireCore.scale.setScalar(pulse * 1.05);
    wireCore.rotation.y = elapsed * 0.3;
    wireCore.rotation.x = elapsed * 0.15;
    coreMat.opacity = 0.2 + Math.sin(elapsed * 2) * 0.1;

    // Update energy particles
    const pos = particles.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      const v = velocities[i];
      lifetimes[i] += 0.005 * intensity;

      pos[i * 3] += v.vx * intensity;
      pos[i * 3 + 1] += v.vy * intensity;
      pos[i * 3 + 2] += v.vz * intensity;

      // Curve the path
      pos[i * 3] += Math.sin(lifetimes[i] * 5) * v.curveFactor;
      pos[i * 3 + 1] += Math.cos(lifetimes[i] * 3) * v.curveFactor;

      // Reset when too far
      const dist = Math.sqrt(pos[i*3]**2 + pos[i*3+1]**2 + pos[i*3+2]**2);
      if (dist > 15) {
        const r = 2;
        pos[i * 3] = r * Math.sin(v.phi) * Math.cos(v.theta);
        pos[i * 3 + 1] = r * Math.sin(v.phi) * Math.sin(v.theta);
        pos[i * 3 + 2] = r * Math.cos(v.phi);
        lifetimes[i] = 0;
      }
    }
    particles.geometry.attributes.position.needsUpdate = true;

    // Rotate ring
    ringParticles.rotation.y = elapsed * 0.2;
    ringParticles.rotation.x = Math.sin(elapsed * 0.1) * 0.2;
  }
${this._postamble()}`;

    return { js, css: this._canvasCss(canvasId) };
  }

  // ── SCENE 7: Education — Knowledge Constellation ────────────────

  _sceneEducation({ canvasId, colors, darkMode, bgColor, performanceLevel }) {
    const starCount = performanceLevel === 'high' ? 500 : performanceLevel === 'medium' ? 300 : 150;

    const js = `${this._preamble(canvasId, bgColor, colors)}
  camera.position.set(0, 0, 20);

  const count = isMobile ? ${Math.floor(starCount * 0.4)} : ${starCount};

  // Define constellation shape sets (unit coordinates to morph between)
  // Shape 0: sphere cloud, Shape 1: book-like, Shape 2: star
  const shapeTargets = [];
  for (let s = 0; s < 3; s++) {
    const target = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      if (s === 0) {
        // Sphere
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 5 + Math.random() * 3;
        target[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        target[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        target[i * 3 + 2] = r * Math.cos(phi);
      } else if (s === 1) {
        // Flat spread (book pages)
        target[i * 3] = (Math.random() - 0.5) * 16;
        target[i * 3 + 1] = (Math.random() - 0.5) * 10;
        target[i * 3 + 2] = (Math.random() - 0.5) * 1;
      } else {
        // Ring / atom-like
        const angle = Math.random() * Math.PI * 2;
        const ringR = 4 + Math.random() * 4;
        const ringIdx = Math.floor(Math.random() * 3);
        if (ringIdx === 0) {
          target[i * 3] = Math.cos(angle) * ringR;
          target[i * 3 + 1] = Math.sin(angle) * ringR;
          target[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
        } else if (ringIdx === 1) {
          target[i * 3] = Math.cos(angle) * ringR;
          target[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
          target[i * 3 + 2] = Math.sin(angle) * ringR;
        } else {
          target[i * 3] = (Math.random() - 0.5) * 0.5;
          target[i * 3 + 1] = Math.cos(angle) * ringR;
          target[i * 3 + 2] = Math.sin(angle) * ringR;
        }
      }
    }
    shapeTargets.push(target);
  }

  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const twinklePhases = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = shapeTargets[0][i * 3];
    positions[i * 3 + 1] = shapeTargets[0][i * 3 + 1];
    positions[i * 3 + 2] = shapeTargets[0][i * 3 + 2];
    sizes[i] = 0.5 + Math.random() * 1.5;
    twinklePhases[i] = Math.random() * Math.PI * 2;
  }

  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  starGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const starMat = new THREE.PointsMaterial({
    color: PRIMARY,
    size: isMobile ? 0.15 : 0.1,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  // Connection lines for nearby stars
  const maxLineDist = 2.5;
  const linePositions = new Float32Array(count * 6);
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  const lineMat = new THREE.LineBasicMaterial({
    color: SECONDARY,
    transparent: true,
    opacity: 0.1,
    blending: THREE.AdditiveBlending,
  });
  const constellationLines = new THREE.LineSegments(lineGeo, lineMat);
  scene.add(constellationLines);

  let currentShape = 0;

  function update(elapsed) {
    const scrollFactor = scrollY / (document.body.scrollHeight || 1);
    const targetShape = Math.min(Math.floor(scrollFactor * 3), 2);

    camera.position.x = mouse.x * 5;
    camera.position.y = mouse.y * 3;
    camera.lookAt(0, 0, 0);

    // Morph between shapes
    const target = shapeTargets[targetShape];
    const pos = stars.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      pos[i * 3] += (target[i * 3] - pos[i * 3]) * 0.02;
      pos[i * 3 + 1] += (target[i * 3 + 1] - pos[i * 3 + 1]) * 0.02;
      pos[i * 3 + 2] += (target[i * 3 + 2] - pos[i * 3 + 2]) * 0.02;
    }
    stars.geometry.attributes.position.needsUpdate = true;

    // Twinkling via opacity modulation (using size as proxy)
    starMat.opacity = 0.6 + Math.sin(elapsed * 0.5) * 0.2;

    // Slow rotation
    stars.rotation.y = elapsed * 0.02;

    // Update constellation lines
    let lineIdx = 0;
    const lp = constellationLines.geometry.attributes.position.array;
    const maxPairs = Math.min(count, 100);
    for (let i = 0; i < maxPairs && lineIdx < count; i++) {
      for (let j = i + 1; j < maxPairs && lineIdx < count; j++) {
        const dx = pos[i*3] - pos[j*3];
        const dy = pos[i*3+1] - pos[j*3+1];
        const dz = pos[i*3+2] - pos[j*3+2];
        const d = Math.sqrt(dx*dx + dy*dy + dz*dz);
        if (d < maxLineDist) {
          lp[lineIdx * 6] = pos[i * 3];
          lp[lineIdx * 6 + 1] = pos[i * 3 + 1];
          lp[lineIdx * 6 + 2] = pos[i * 3 + 2];
          lp[lineIdx * 6 + 3] = pos[j * 3];
          lp[lineIdx * 6 + 4] = pos[j * 3 + 1];
          lp[lineIdx * 6 + 5] = pos[j * 3 + 2];
          lineIdx++;
        }
      }
    }
    lineGeo.setDrawRange(0, lineIdx * 2);
    constellationLines.geometry.attributes.position.needsUpdate = true;
  }
${this._postamble()}`;

    return { js, css: this._canvasCss(canvasId) };
  }

  // ── SCENE 8: Restaurant — Ambient Glow ──────────────────────────

  _sceneRestaurant({ canvasId, colors, darkMode, bgColor, performanceLevel }) {
    const orbCount = performanceLevel === 'high' ? 30 : performanceLevel === 'medium' ? 20 : 12;

    const js = `${this._preamble(canvasId, bgColor, colors)}
  camera.position.set(0, 0, 15);

  // Warm ambient
  const ambientLight = new THREE.AmbientLight(0x331a00, 0.3);
  scene.add(ambientLight);

  const orbCount = isMobile ? ${Math.floor(orbCount * 0.5)} : ${orbCount};
  const orbs = [];
  const warmColors = [0xff9d4d, 0xffb366, 0xffc880, 0xff8533, 0xffad33];

  for (let i = 0; i < orbCount; i++) {
    // Each orb is a soft glowing sphere
    const size = 0.3 + Math.random() * 0.8;
    const geo = new THREE.SphereGeometry(size, 16, 16);
    const color = warmColors[Math.floor(Math.random() * warmColors.length)];
    const mat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.06 + Math.random() * 0.1,
    });
    const orb = new THREE.Mesh(geo, mat);

    const x = (Math.random() - 0.5) * 25;
    const y = (Math.random() - 0.5) * 15;
    const z = (Math.random() - 0.5) * 10;
    orb.position.set(x, y, z);

    orb.userData = {
      baseX: x,
      baseY: y,
      baseZ: z,
      bobSpeed: 0.3 + Math.random() * 0.5,
      bobAmp: 0.2 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
      driftX: (Math.random() - 0.5) * 0.003,
      driftZ: (Math.random() - 0.5) * 0.003,
    };

    scene.add(orb);
    orbs.push(orb);

    // Add a point light to some orbs (limited for performance)
    if (i < (isMobile ? 3 : 6)) {
      const light = new THREE.PointLight(color, 0.3, 8);
      light.position.copy(orb.position);
      scene.add(light);
      orb.userData.light = light;
    }
  }

  // Bokeh-like background particles (depth layers)
  const bokehCount = isMobile ? 50 : 150;
  const bokehPositions = new Float32Array(bokehCount * 3);
  const bokehSizes = new Float32Array(bokehCount);
  for (let i = 0; i < bokehCount; i++) {
    bokehPositions[i * 3] = (Math.random() - 0.5) * 30;
    bokehPositions[i * 3 + 1] = (Math.random() - 0.5) * 20;
    bokehPositions[i * 3 + 2] = -5 - Math.random() * 15;
    bokehSizes[i] = 0.5 + Math.random() * 2;
  }
  const bokehGeo = new THREE.BufferGeometry();
  bokehGeo.setAttribute('position', new THREE.BufferAttribute(bokehPositions, 3));
  const bokehMat = new THREE.PointsMaterial({
    color: 0xffcc80,
    size: 0.4,
    transparent: true,
    opacity: 0.08,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const bokeh = new THREE.Points(bokehGeo, bokehMat);
  scene.add(bokeh);

  function update(elapsed) {
    camera.position.x = mouse.x * 1.5;
    camera.position.y = mouse.y * 1;
    camera.lookAt(0, 0, 0);

    const scrollFactor = scrollY / (document.body.scrollHeight || 1);

    for (const orb of orbs) {
      const d = orb.userData;
      // Gentle bobbing
      orb.position.y = d.baseY + Math.sin(elapsed * d.bobSpeed + d.phase) * d.bobAmp;
      orb.position.x = d.baseX + Math.sin(elapsed * 0.2 + d.phase) * 0.3;

      // Subtle drift
      d.baseX += d.driftX;
      d.baseZ += d.driftZ;
      if (Math.abs(d.baseX) > 15) d.driftX *= -1;
      if (Math.abs(d.baseZ) > 8) d.driftZ *= -1;

      // Flicker like candlelight
      orb.material.opacity = 0.06 + Math.sin(elapsed * 3 + d.phase) * 0.02 + Math.sin(elapsed * 7 + d.phase * 2) * 0.01;

      // Scale pulse
      const s = 1 + Math.sin(elapsed * d.bobSpeed * 2 + d.phase) * 0.08;
      orb.scale.setScalar(s);

      if (d.light) {
        d.light.position.copy(orb.position);
        d.light.intensity = 0.2 + Math.sin(elapsed * 3 + d.phase) * 0.1;
      }
    }

    // Slight bokeh parallax
    bokeh.position.x = mouse.x * -0.5;
    bokeh.position.y = mouse.y * -0.3;
  }
${this._postamble()}`;

    return { js, css: this._canvasCss(canvasId) };
  }

  // ── SCENE 9: Agency — Creative Morph ────────────────────────────

  _sceneAgency({ canvasId, colors, darkMode, bgColor, performanceLevel }) {
    const js = `${this._preamble(canvasId, bgColor, colors)}
  camera.position.set(0, 0, 8);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
  scene.add(ambientLight);
  const pointLight1 = new THREE.PointLight(PRIMARY, 1, 20);
  pointLight1.position.set(5, 5, 5);
  scene.add(pointLight1);
  const pointLight2 = new THREE.PointLight(SECONDARY, 1, 20);
  pointLight2.position.set(-5, -5, 5);
  scene.add(pointLight2);

  // Icosahedron wireframe
  const detail = isMobile ? 2 : 3;
  const icoGeo = new THREE.IcosahedronGeometry(3, detail);
  const icoMat = new THREE.MeshBasicMaterial({
    color: PRIMARY,
    wireframe: true,
    transparent: true,
    opacity: 0.6,
  });
  const ico = new THREE.Mesh(icoGeo, icoMat);
  scene.add(ico);

  // Solid inner glow
  const innerGeo = new THREE.IcosahedronGeometry(2.8, 1);
  const innerMat = new THREE.MeshPhongMaterial({
    color: SECONDARY,
    transparent: true,
    opacity: 0.05,
    side: THREE.DoubleSide,
  });
  const inner = new THREE.Mesh(innerGeo, innerMat);
  scene.add(inner);

  // Store original positions for noise displacement
  const origPositions = new Float32Array(icoGeo.attributes.position.array);
  const vertexCount = origPositions.length / 3;

  // Simple noise function
  function noise3D(x, y, z) {
    const n = Math.sin(x * 1.7 + y * 2.3 + z * 3.1) * 43758.5453;
    return (n - Math.floor(n)) * 2 - 1;
  }

  // Scatter particles around the shape
  const pCount = isMobile ? 200 : 600;
  const pPositions = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 3.5 + Math.random() * 2;
    pPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pPositions[i * 3 + 2] = r * Math.cos(phi);
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
  const pMat = new THREE.PointsMaterial({
    color: ACCENT,
    size: 0.04,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const particleCloud = new THREE.Points(pGeo, pMat);
  scene.add(particleCloud);

  function update(elapsed) {
    const scrollFactor = scrollY / (document.body.scrollHeight || 1);

    // Strong mouse reaction
    const targetRotX = mouse.y * 1.2;
    const targetRotY = mouse.x * 1.2;
    ico.rotation.x += (targetRotX - ico.rotation.x) * 0.05;
    ico.rotation.y += (targetRotY + elapsed * 0.2 - ico.rotation.y) * 0.05;
    inner.rotation.copy(ico.rotation);

    camera.position.z = 8 - scrollFactor * 3;

    // Vertex noise displacement (morph)
    const positions = icoGeo.attributes.position.array;
    const noiseScale = 0.3 + scrollFactor * 0.8;
    for (let i = 0; i < vertexCount; i++) {
      const ox = origPositions[i * 3];
      const oy = origPositions[i * 3 + 1];
      const oz = origPositions[i * 3 + 2];
      const len = Math.sqrt(ox * ox + oy * oy + oz * oz);
      const nx = ox / len;
      const ny = oy / len;
      const nz = oz / len;
      const displacement = noise3D(
        ox + elapsed * 0.5,
        oy + elapsed * 0.3,
        oz + elapsed * 0.4
      ) * noiseScale;
      positions[i * 3] = ox + nx * displacement;
      positions[i * 3 + 1] = oy + ny * displacement;
      positions[i * 3 + 2] = oz + nz * displacement;
    }
    icoGeo.attributes.position.needsUpdate = true;

    // Particles orbit
    particleCloud.rotation.y = elapsed * 0.1;
    particleCloud.rotation.x = Math.sin(elapsed * 0.15) * 0.3;

    // Lights move
    pointLight1.position.x = Math.sin(elapsed * 0.7) * 6;
    pointLight1.position.y = Math.cos(elapsed * 0.5) * 6;
    pointLight2.position.x = Math.sin(elapsed * 0.4 + 2) * 6;
    pointLight2.position.z = Math.cos(elapsed * 0.6 + 1) * 6;
  }
${this._postamble()}`;

    return { js, css: this._canvasCss(canvasId) };
  }

  // ── SCENE 10: Luxury — Crystal Reflections ──────────────────────

  _sceneLuxury({ canvasId, colors, darkMode, bgColor, performanceLevel }) {
    const js = `${this._preamble(canvasId, bgColor, colors)}
  camera.position.set(0, 2, 10);
  camera.lookAt(0, 0, 0);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.15);
  scene.add(ambientLight);
  const spotLight = new THREE.SpotLight(0xffffff, 1.5, 30, Math.PI / 4);
  spotLight.position.set(5, 10, 5);
  scene.add(spotLight);
  const backLight = new THREE.PointLight(SECONDARY, 0.8, 20);
  backLight.position.set(-5, -3, -5);
  scene.add(backLight);

  // Crystal (diamond-like shape) — custom geometry using two cones
  const crystalGroup = new THREE.Group();

  // Top pyramid
  const topGeo = new THREE.ConeGeometry(2.5, 2, 8);
  const crystalMat = new THREE.MeshPhongMaterial({
    color: 0xe8e8f0,
    specular: 0xffffff,
    shininess: 200,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    flatShading: true,
  });
  const topCone = new THREE.Mesh(topGeo, crystalMat);
  topCone.position.y = 1;
  crystalGroup.add(topCone);

  // Bottom inverted pyramid (longer)
  const botGeo = new THREE.ConeGeometry(2.5, 4, 8);
  const botCone = new THREE.Mesh(botGeo, crystalMat.clone());
  botCone.rotation.x = Math.PI;
  botCone.position.y = -2;
  crystalGroup.add(botCone);

  // Wireframe edges with prismatic colors
  const edgeColors = [0xff6b9d, 0x6366f1, 0x22d3ee, 0xfbbf24, 0xa78bfa];
  const edgeMaterials = [];
  [topGeo, botGeo].forEach((geo, idx) => {
    const edges = new THREE.EdgesGeometry(geo);
    const color = edgeColors[idx % edgeColors.length];
    const lineMat = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.6,
    });
    edgeMaterials.push(lineMat);
    const lineSegments = new THREE.LineSegments(edges, lineMat);
    lineSegments.position.copy(idx === 0 ? topCone.position : botCone.position);
    lineSegments.rotation.copy(idx === 0 ? topCone.rotation : botCone.rotation);
    crystalGroup.add(lineSegments);
  });

  scene.add(crystalGroup);

  // Floor reflection hint — a subtle reflective plane
  const floorGeo = new THREE.PlaneGeometry(30, 30);
  const floorMat = new THREE.MeshPhongMaterial({
    color: 0x111118,
    specular: 0x333344,
    shininess: 100,
    transparent: true,
    opacity: 0.5,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -4.5;
  scene.add(floor);

  // Floating prismatic particles
  const sparkleCount = isMobile ? 60 : 200;
  const sparklePositions = new Float32Array(sparkleCount * 3);
  const sparkleVelocities = [];
  for (let i = 0; i < sparkleCount; i++) {
    sparklePositions[i * 3] = (Math.random() - 0.5) * 15;
    sparklePositions[i * 3 + 1] = (Math.random() - 0.5) * 10;
    sparklePositions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    sparkleVelocities.push({
      vy: 0.005 + Math.random() * 0.01,
      phase: Math.random() * Math.PI * 2,
    });
  }
  const sparkleGeo = new THREE.BufferGeometry();
  sparkleGeo.setAttribute('position', new THREE.BufferAttribute(sparklePositions, 3));
  const sparkleMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: isMobile ? 0.08 : 0.05,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const sparkles = new THREE.Points(sparkleGeo, sparkleMat);
  scene.add(sparkles);

  function update(elapsed) {
    const scrollFactor = scrollY / (document.body.scrollHeight || 1);

    // Slow elegant rotation
    crystalGroup.rotation.y = elapsed * 0.1 + mouse.x * 0.5;
    crystalGroup.rotation.x = Math.sin(elapsed * 0.05) * 0.1 + mouse.y * 0.2;

    camera.position.x = mouse.x * 2;
    camera.position.y = 2 + mouse.y * 1.5;
    camera.lookAt(0, 0, 0);

    // Prismatic edge color cycling
    for (let i = 0; i < edgeMaterials.length; i++) {
      const hue = ((elapsed * 0.05 + i * 0.3) % 1);
      edgeMaterials[i].color.setHSL(hue, 0.8, 0.6);
    }

    // Crystal subtle scale
    const s = 1 + Math.sin(elapsed * 0.3) * 0.02;
    crystalGroup.scale.set(s, s, s);

    // Sparkle movement
    const sp = sparkles.geometry.attributes.position.array;
    for (let i = 0; i < sparkleCount; i++) {
      const v = sparkleVelocities[i];
      sp[i * 3 + 1] += v.vy;
      sp[i * 3] += Math.sin(elapsed + v.phase) * 0.003;
      if (sp[i * 3 + 1] > 6) sp[i * 3 + 1] = -6;
    }
    sparkles.geometry.attributes.position.needsUpdate = true;

    // Spotlight follows crystal
    spotLight.position.x = Math.sin(elapsed * 0.2) * 5;
    spotLight.position.z = Math.cos(elapsed * 0.2) * 5;
  }
${this._postamble()}`;

    return { js, css: this._canvasCss(canvasId) };
  }

  // ── SCENE 11: Tech — Matrix Rain ───────────────────────────────

  _sceneTech({ canvasId, colors, darkMode, bgColor, performanceLevel }) {
    const columnCount = performanceLevel === 'high' ? 40 : performanceLevel === 'medium' ? 25 : 15;
    const dotsPerColumn = performanceLevel === 'high' ? 30 : performanceLevel === 'medium' ? 20 : 12;

    const js = `${this._preamble(canvasId, bgColor, colors)}
  camera.position.set(0, 0, 20);

  const columnCount = isMobile ? ${Math.floor(columnCount * 0.5)} : ${columnCount};
  const dotsPerColumn = isMobile ? ${Math.floor(dotsPerColumn * 0.6)} : ${dotsPerColumn};
  const totalDots = columnCount * dotsPerColumn;

  const positions = new Float32Array(totalDots * 3);
  const colors = new Float32Array(totalDots * 3);
  const sizes = new Float32Array(totalDots);
  const velocities = new Float32Array(totalDots);
  const columnX = [];

  const spreadX = 30;
  const spreadY = 25;

  for (let c = 0; c < columnCount; c++) {
    const x = (c / columnCount) * spreadX - spreadX / 2;
    columnX.push(x);
    const depthLayer = Math.random(); // 0=far, 1=near
    const z = depthLayer * 10 - 5;

    for (let d = 0; d < dotsPerColumn; d++) {
      const idx = c * dotsPerColumn + d;
      positions[idx * 3] = x + (Math.random() - 0.5) * 0.3;
      positions[idx * 3 + 1] = Math.random() * spreadY - spreadY / 2;
      positions[idx * 3 + 2] = z;

      // Green/blue theme
      const green = 0.4 + Math.random() * 0.6;
      const blue = Math.random() * 0.3;
      colors[idx * 3] = 0;
      colors[idx * 3 + 1] = green;
      colors[idx * 3 + 2] = blue;

      // Front particles bigger
      sizes[idx] = (0.1 + depthLayer * 0.2);
      velocities[idx] = 0.02 + Math.random() * 0.08 + depthLayer * 0.03;
    }
  }

  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  rainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const rainMat = new THREE.PointsMaterial({
    size: 0.15,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const rain = new THREE.Points(rainGeo, rainMat);
  scene.add(rain);

  // "Head" dots — brighter leading particles, one per column
  const headPositions = new Float32Array(columnCount * 3);
  const headColors = new Float32Array(columnCount * 3);
  for (let c = 0; c < columnCount; c++) {
    headPositions[c * 3] = columnX[c];
    headPositions[c * 3 + 1] = Math.random() * spreadY;
    headPositions[c * 3 + 2] = positions[(c * dotsPerColumn) * 3 + 2];
    headColors[c * 3] = 0.7;
    headColors[c * 3 + 1] = 1;
    headColors[c * 3 + 2] = 0.7;
  }
  const headGeo = new THREE.BufferGeometry();
  headGeo.setAttribute('position', new THREE.BufferAttribute(headPositions, 3));
  headGeo.setAttribute('color', new THREE.BufferAttribute(headColors, 3));
  const headMat = new THREE.PointsMaterial({
    size: 0.25,
    vertexColors: true,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const heads = new THREE.Points(headGeo, headMat);
  scene.add(heads);

  function update(elapsed) {
    const scrollFactor = scrollY / (document.body.scrollHeight || 1);
    const speedMult = 1 + scrollFactor * 2;

    camera.position.x = mouse.x * 2;
    camera.position.y = mouse.y * 1.5;
    camera.lookAt(0, 0, 0);

    const pos = rain.geometry.attributes.position.array;
    for (let i = 0; i < totalDots; i++) {
      pos[i * 3 + 1] -= velocities[i] * speedMult;
      // Fade effect at bottom via wrapping
      if (pos[i * 3 + 1] < -spreadY / 2) {
        pos[i * 3 + 1] = spreadY / 2;
      }
    }
    rain.geometry.attributes.position.needsUpdate = true;

    // Update head particles
    const hp = heads.geometry.attributes.position.array;
    for (let c = 0; c < columnCount; c++) {
      hp[c * 3 + 1] -= (0.06 + Math.random() * 0.02) * speedMult;
      if (hp[c * 3 + 1] < -spreadY / 2) {
        hp[c * 3 + 1] = spreadY / 2;
      }
    }
    heads.geometry.attributes.position.needsUpdate = true;
  }
${this._postamble()}`;

    return { js, css: this._canvasCss(canvasId) };
  }

  // ── SCENE 12: Default — Enhanced Particle Field ─────────────────

  _sceneDefault({ canvasId, colors, darkMode, bgColor, performanceLevel }) {
    const particleCount = performanceLevel === 'high' ? 2000 : performanceLevel === 'medium' ? 1000 : 500;

    const js = `${this._preamble(canvasId, bgColor, colors)}
  camera.position.set(0, 0, 20);

  const count = isMobile ? ${Math.floor(particleCount * 0.35)} : ${particleCount};
  const positions = new Float32Array(count * 3);
  const basePositions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * 40;
    const y = (Math.random() - 0.5) * 25;
    const z = (Math.random() - 0.5) * 20;
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    basePositions[i * 3] = x;
    basePositions[i * 3 + 1] = y;
    basePositions[i * 3 + 2] = z;

    // Depth-based size
    const depth = (z + 10) / 20; // 0 to 1
    sizes[i] = 0.03 + depth * 0.12;
    phases[i] = Math.random() * Math.PI * 2;
  }

  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const particleMat = new THREE.PointsMaterial({
    color: PRIMARY,
    size: isMobile ? 0.1 : 0.06,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // Secondary layer with different color
  const count2 = Math.floor(count * 0.3);
  const pos2 = new Float32Array(count2 * 3);
  for (let i = 0; i < count2; i++) {
    pos2[i * 3] = (Math.random() - 0.5) * 35;
    pos2[i * 3 + 1] = (Math.random() - 0.5) * 20;
    pos2[i * 3 + 2] = (Math.random() - 0.5) * 15;
  }
  const geo2 = new THREE.BufferGeometry();
  geo2.setAttribute('position', new THREE.BufferAttribute(pos2, 3));
  const mat2 = new THREE.PointsMaterial({
    color: SECONDARY,
    size: isMobile ? 0.08 : 0.04,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const particles2 = new THREE.Points(geo2, mat2);
  scene.add(particles2);

  // Mouse repulsion parameters
  const repulsionRadius = 5;
  const repulsionStrength = 2;

  function update(elapsed) {
    const scrollFactor = scrollY / (document.body.scrollHeight || 1);

    camera.position.x = mouse.x * 3;
    camera.position.y = mouse.y * 2;
    camera.lookAt(0, 0, 0);

    const pos = particles.geometry.attributes.position.array;
    const mouseWorld = new THREE.Vector3(mouse.x * 15, mouse.y * 10, 0);

    for (let i = 0; i < count; i++) {
      const bx = basePositions[i * 3];
      const by = basePositions[i * 3 + 1];
      const bz = basePositions[i * 3 + 2];

      // Wave pattern
      const waveX = Math.sin(elapsed * 0.3 + by * 0.1 + phases[i]) * 0.5;
      const waveY = Math.cos(elapsed * 0.2 + bx * 0.1 + phases[i]) * 0.3;
      const waveZ = Math.sin(elapsed * 0.15 + bx * 0.05 + by * 0.05) * 0.5;

      let targetX = bx + waveX;
      let targetY = by + waveY;
      let targetZ = bz + waveZ;

      // Mouse repulsion field
      const dx = targetX - mouseWorld.x;
      const dy = targetY - mouseWorld.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < repulsionRadius) {
        const force = (1 - dist / repulsionRadius) * repulsionStrength;
        targetX += (dx / dist) * force;
        targetY += (dy / dist) * force;
      }

      // Smooth interpolation
      pos[i * 3] += (targetX - pos[i * 3]) * 0.05;
      pos[i * 3 + 1] += (targetY - pos[i * 3 + 1]) * 0.05;
      pos[i * 3 + 2] += (targetZ - pos[i * 3 + 2]) * 0.05;
    }
    particles.geometry.attributes.position.needsUpdate = true;

    // Secondary layer gentle drift
    particles2.rotation.y = elapsed * 0.02;
    particles2.rotation.x = Math.sin(elapsed * 0.05) * 0.1;
    particles2.position.y = scrollFactor * 3;
  }
${this._postamble()}`;

    return { js, css: this._canvasCss(canvasId) };
  }

  // ── List available scenes ───────────────────────────────────────

  listScenes() {
    return [
      { id: 'fintech', name: 'Floating Data Grid', description: '3D grid of transparent cubes pulsing like a heatmap' },
      { id: 'trading', name: 'Market Flow', description: 'Particles in sine-wave streams with trailing lines' },
      { id: 'saas', name: 'Orbital Network', description: 'Floating spheres connected by lines orbiting a center' },
      { id: 'healthcare', name: 'DNA Helix', description: 'Double helix of spheres with cross-bar connections' },
      { id: 'ecommerce', name: 'Product Showcase Orbit', description: 'Ring of mixed geometric shapes with central glow' },
      { id: 'fitness', name: 'Energy Burst', description: 'Central sphere with radiating energy particles' },
      { id: 'education', name: 'Knowledge Constellation', description: 'Point cloud morphing between shapes on scroll' },
      { id: 'restaurant', name: 'Ambient Glow', description: 'Floating warm light orbs with candlelight flicker' },
      { id: 'agency', name: 'Creative Morph', description: 'Wireframe icosahedron with noise vertex displacement' },
      { id: 'luxury', name: 'Crystal Reflections', description: 'Faceted diamond with prismatic edge highlights' },
      { id: 'tech', name: 'Matrix Rain', description: 'Falling particles in columns with depth layers' },
      { id: 'default', name: 'Enhanced Particle Field', description: 'Wave-patterned particles with mouse repulsion' },
    ];
  }
}

module.exports = Nexus3DSceneEngine;

// ── CLI Mode ──────────────────────────────────────────────────────

if (require.main === module) {
  const args = process.argv.slice(2);
  const engine = new Nexus3DSceneEngine();

  if (args[0] === '--list') {
    console.log('\nAvailable 3D Scenes:\n');
    for (const s of engine.listScenes()) {
      console.log(`  ${s.id.padEnd(14)} ${s.name.padEnd(28)} ${s.description}`);
    }
    console.log('');
    process.exit(0);
  }

  const businessType = args[0] || 'default';
  const primary = args[1] || '#6366f1';
  const secondary = args[2] || '#8b5cf6';
  const accent = args[3] || '#f59e0b';
  const darkMode = args[4] !== 'light';
  const performanceLevel = args[5] || 'high';

  const result = engine.generate({
    businessType,
    colors: { primary, secondary, accent },
    darkMode,
    performanceLevel,
  });

  console.log(`\n=== Nexus 3D Scene: ${businessType} ===`);
  console.log(`Canvas ID: ${result.canvasId}`);
  console.log(`Dependencies: ${result.dependencies.join(', ')}`);
  console.log(`\n--- CSS ---\n${result.css}`);
  console.log(`\n--- JS (${result.js.length} chars) ---`);
  console.log(result.js);
}
