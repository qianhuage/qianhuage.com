/* ═══════════════════════════════════════════════════════
   QIANHUA GE — 3D GLOBE FLIGHT PORTFOLIO
   Three.js Globe + Flight Simulator
   ═══════════════════════════════════════════════════════ */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ── PROJECT DATA ──────────────────────────────────────
const PROJECTS = [
  // ── LAUNCHED ──
  { id:'kaon',       title:'Kaon',          city:'San Francisco',  lat:37.7749, lng:-122.4194, img:'https://freight.cargo.site/w/600/q/75/i/U2329052567392612164893807625645/Frame-2090051588.png', link:'https://kaon.io/' },
  { id:'collovlabs', title:'CollovLabs',     city:'Redwood City',   lat:37.4852, lng:-122.2364, img:'https://freight.cargo.site/w/600/q/75/i/N2755860063414473176452238820781/Screenshot-2026-01-20-at-6.44.12PM.png', link:'https://collovlabs.com/' },
  { id:'cozyai',     title:'CozyAI',         city:'Shenzhen',       lat:22.5431, lng:114.0579,  img:'https://freight.cargo.site/w/600/q/75/i/X2756203805356204973465402230189/cozyai.png',          link:'https://apps.apple.com/us/app/cozyai-ai-home-design/id6744885843' },

  { id:'emochi',     title:'Emochi',         city:'Oakland',        lat:37.8044, lng:-122.2712, img:'https://freight.cargo.site/w/600/q/75/i/E2590589006754239729531640235437/1923.png',             link:'https://play.google.com/store/apps/details?id=com.flow.mobile&hl=en' },
  { id:'collov',     title:'Collov',         city:'Redwood City',   lat:37.4870, lng:-122.2270, img:'https://freight.cargo.site/w/600/q/75/i/Q2578801080199267923600036742573/Wireframe---19.png',  link:'https://collov.ai/' },
  { id:'flowgpt',    title:'FlowGPT',        city:'Washington',     lat:47.6062, lng:-122.3321, img:'https://freight.cargo.site/w/600/q/75/i/V2579235822714973684961464173997/flowgpt.png',         link:'https://flowgpt.com/' },
  { id:'divly',      title:'Divly',          city:'Stockholm',      lat:59.3293, lng:18.0686,   img:'./images/divly.png',     link:'https://divly.com/en/' },
  { id:'markitai',   title:'MarkitAI',       city:'Berkeley',       lat:37.8716, lng:-122.2727, img:'https://freight.cargo.site/w/600/q/75/i/R2590575374960857395573477492141/1922.png',             link:'https://markit.ai' },
  { id:'substrate',  title:'Substrate',      city:'Palo Alto',      lat:37.4419, lng:-122.1430, img:'https://freight.cargo.site/w/600/q/75/i/J2579367830216556064905875047853/substrate.png',       link:'http://www.substratecapital.xyz/' },
  { id:'atlaslab',   title:'Atlas Lab',      city:'Sacramento',     lat:38.5816, lng:-121.4944, img:'https://freight.cargo.site/w/700/q/75/i/G2295860679372777805815165633965/atlas-lab.png',       link:'https://atlaslab.com/' },
  { id:'metaval',    title:'Metaval',        city:'Dubai',          lat:25.2048, lng:55.2708,   img:'./images/metaval.png',   link:'https://metaval.com/' },
  { id:'fabrique',   title:'Fabrique',       city:'New York City',  lat:40.7128, lng:-74.0060,   img:'https://freight.cargo.site/w/600/q/75/i/P2588783626365162737518352680365/Screenshot-2025-10-07-at-11.47.15PM.png', link:'https://fabrique.se/' },

  // ── UNLAUNCHED ──
  { id:'katakana',   title:'Katakana',       city:'Taipei',         lat:25.0330, lng:121.5654,  img:'https://freight.cargo.site/w/600/q/75/i/C2750890346348100079084459935149/Frame-4.png',         link:null },
  { id:'mundus',     title:'Mundus',         city:'Berkeley',       lat:37.8780, lng:-122.2600, img:'https://freight.cargo.site/w/600/q/75/i/D2755778654483334754417271260589/Frame-10.png',        link:null },
  { id:'nodeobjects',title:'Node Objects',   city:'Shanghai',       lat:31.2400, lng:121.4900,  img:'https://freight.cargo.site/w/600/q/75/i/X2588756189508130985248208864685/Wireframe---22.png',  link:null },
  { id:'opoplan',    title:'Opoplan',        city:'Dublin',         lat:53.3498, lng:-6.2603,   img:'https://freight.cargo.site/w/700/q/75/i/P2329052567429505653041226728877/web.png',              link:null },
  { id:'azulenelabs',title:'Azulene Labs',   city:'San Francisco',  lat:37.7850, lng:-122.4094, img:'https://freight.cargo.site/w/600/q/75/i/A2579303923740662219230576264621/461.png',              link:null },
  { id:'taormina',   title:'Taormina',       city:'Rome',           lat:41.9028, lng:12.4964,   img:'https://freight.cargo.site/w/700/q/75/i/W2755737092308729720163620767149/Frame-7.png',         link:null },
];

// ── CONSTANTS ─────────────────────────────────────────
const GLOBE_RADIUS = 5;
const MARKER_HEIGHT = 0.15;
const CAM_DISTANCE_OVERVIEW = 12;
const CAM_DISTANCE_CLOSE = 7.5;

// ── THREE.JS SETUP ────────────────────────────────────
const container = document.getElementById('globe-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 5, CAM_DISTANCE_OVERVIEW);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.rotateSpeed = 0.4;
controls.zoomSpeed = 0.8;
controls.minDistance = 6.5;
controls.maxDistance = 20;
controls.enablePan = false;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.3;

// ═══════════════════════════════════════════════════════
// GLOBE GEOMETRY
// ═══════════════════════════════════════════════════════

// Solid sphere (slight off-black)
const sphereGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
const sphereMat = new THREE.MeshBasicMaterial({ color: 0x080808 });
const sphere = new THREE.Mesh(sphereGeo, sphereMat);
scene.add(sphere);

// Wireframe overlay
const wireGeo = new THREE.SphereGeometry(GLOBE_RADIUS + 0.005, 36, 18);
const wireMat = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  wireframe: true,
  transparent: true,
  opacity: 0.06,
});
const wireframe = new THREE.Mesh(wireGeo, wireMat);
scene.add(wireframe);

// Latitude lines (graticule)
function createGraticule() {
  const group = new THREE.Group();
  const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.04 });
  // Latitude lines every 30°
  for (let lat = -60; lat <= 60; lat += 30) {
    const pts = [];
    for (let lng = 0; lng <= 360; lng += 3) {
      pts.push(latLngToVec3(lat, lng, GLOBE_RADIUS + 0.01));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    group.add(new THREE.Line(geo, mat));
  }
  // Longitude lines every 30°
  for (let lng = 0; lng < 360; lng += 30) {
    const pts = [];
    for (let lat = -90; lat <= 90; lat += 3) {
      pts.push(latLngToVec3(lat, lng, GLOBE_RADIUS + 0.01));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    group.add(new THREE.Line(geo, mat));
  }
  return group;
}
scene.add(createGraticule());

// Atmospheric glow
const glowGeo = new THREE.SphereGeometry(GLOBE_RADIUS + 0.3, 64, 64);
const glowMat = new THREE.ShaderMaterial({
  vertexShader: `
    varying vec3 vNormal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec3 vNormal;
    void main() {
      float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
      gl_FragColor = vec4(1.0, 1.0, 1.0, intensity * 0.15);
    }
  `,
  side: THREE.BackSide,
  blending: THREE.AdditiveBlending,
  transparent: true,
});
scene.add(new THREE.Mesh(glowGeo, glowMat));

// ═══════════════════════════════════════════════════════
// COUNTRY OUTLINES — Load from world-atlas TopoJSON
// ═══════════════════════════════════════════════════════
async function loadCountryOutlines() {
  try {
    const res = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json');
    const topo = await res.json();
    // Parse TopoJSON manually (avoid import issues with topojson-client)
    const land = topo.objects.land;
    const arcs = topo.arcs;
    const transform = topo.transform;

    // Decode arc coordinates
    function decodeArc(arcIndex) {
      const reverse = arcIndex < 0;
      const idx = reverse ? ~arcIndex : arcIndex;
      const arc = arcs[idx];
      const coords = [];
      let x = 0, y = 0;
      for (let i = 0; i < arc.length; i++) {
        x += arc[i][0];
        y += arc[i][1];
        const lng = x * transform.scale[0] + transform.translate[0];
        const lat = y * transform.scale[1] + transform.translate[1];
        coords.push([lng, lat]);
      }
      return reverse ? coords.reverse() : coords;
    }

    // Extract all rings from the topology
    function getGeometryCoords(geom) {
      const rings = [];
      if (geom.type === 'Polygon' || geom.type === 'MultiPolygon') {
        const arcSets = geom.type === 'Polygon' ? [geom.arcs] : geom.arcs;
        for (const polygon of arcSets) {
          for (const ring of polygon) {
            const coords = [];
            for (const arcRef of ring) {
              coords.push(...decodeArc(arcRef));
            }
            rings.push(coords);
          }
        }
      }
      return rings;
    }

    // Handle GeometryCollection
    let allRings = [];
    if (land.type === 'GeometryCollection') {
      for (const geom of land.geometries) {
        allRings.push(...getGeometryCoords(geom));
      }
    } else {
      allRings = getGeometryCoords(land);
    }

    // Draw each ring as a line on the globe
    const coastMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 });
    const group = new THREE.Group();

    for (const ring of allRings) {
      if (ring.length < 2) continue;
      const points = [];
      for (const [lng, lat] of ring) {
        points.push(latLngToVec3(lat, lng, GLOBE_RADIUS + 0.008));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      group.add(new THREE.Line(geo, coastMat));
    }

    scene.add(group);
    console.log(`Loaded ${allRings.length} coastline segments`);
  } catch (err) {
    console.warn('Could not load country outlines:', err);
  }
}

// Star field
function createStars() {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(3000);
  for (let i = 0; i < 3000; i += 3) {
    const r = 30 + Math.random() * 40;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i] = r * Math.sin(phi) * Math.cos(theta);
    positions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i + 2] = r * Math.cos(phi);
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, opacity: 0.6 });
  return new THREE.Points(geometry, mat);
}
scene.add(createStars());

// ═══════════════════════════════════════════════════════
// COORDINATE HELPERS
// ═══════════════════════════════════════════════════════
function latLngToVec3(lat, lng, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// ═══════════════════════════════════════════════════════
// LOCATION MARKERS
// ═══════════════════════════════════════════════════════
const markers = [];
const markerGroup = new THREE.Group();
scene.add(markerGroup);

function createMarkers() {
  PROJECTS.forEach((proj, i) => {
    const pos = latLngToVec3(proj.lat, proj.lng, GLOBE_RADIUS);
    const outerPos = latLngToVec3(proj.lat, proj.lng, GLOBE_RADIUS + MARKER_HEIGHT);

    // Pin line
    const lineGeo = new THREE.BufferGeometry().setFromPoints([pos, outerPos]);
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
    const line = new THREE.Line(lineGeo, lineMat);
    markerGroup.add(line);

    // Dot at top
    const dotGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.copy(outerPos);
    dot.userData = { projectIndex: i };
    markerGroup.add(dot);

    // Glow ring
    const ringGeo = new THREE.RingGeometry(0.06, 0.1, 16);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(outerPos);
    ring.lookAt(new THREE.Vector3(0, 0, 0));
    markerGroup.add(ring);

    markers.push({ dot, ring, line, pos: outerPos, project: proj, index: i });
  });
}

// ═══════════════════════════════════════════════════════
// FLIGHT ARCS BETWEEN LOCATIONS
// ═══════════════════════════════════════════════════════
function createFlightArc(from, to) {
  const start = latLngToVec3(from.lat, from.lng, GLOBE_RADIUS);
  const end = latLngToVec3(to.lat, to.lng, GLOBE_RADIUS);
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const dist = start.distanceTo(end);
  mid.normalize().multiplyScalar(GLOBE_RADIUS + dist * 0.3);

  const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
  const points = curve.getPoints(50);
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08 });
  return new THREE.Line(geo, mat);
}

function createAllFlightPaths() {
  const group = new THREE.Group();
  // Connect sequential projects
  for (let i = 0; i < PROJECTS.length - 1; i++) {
    group.add(createFlightArc(PROJECTS[i], PROJECTS[i + 1]));
  }
  // Connect last to first
  group.add(createFlightArc(PROJECTS[PROJECTS.length - 1], PROJECTS[0]));
  return group;
}

let flightPaths;

// ═══════════════════════════════════════════════════════
// CAMERA FLIGHT ANIMATION
// ═══════════════════════════════════════════════════════
let isFlying = false;
let flyStart = null;
let flyEnd = null;
let flyDuration = 2500;
let flyStartTime = 0;
let flyCallback = null;
let activeProjectIndex = -1;

function flyTo(lat, lng, onComplete, duration = 2500) {
  const targetPos = latLngToVec3(lat, lng, GLOBE_RADIUS);
  const camTarget = targetPos.clone().normalize().multiplyScalar(CAM_DISTANCE_CLOSE);
  // Slightly offset camera up
  camTarget.y += 1;

  flyStart = { pos: camera.position.clone(), target: controls.target.clone() };
  flyEnd = { pos: camTarget, target: new THREE.Vector3(0, 0, 0) };
  flyDuration = duration;
  flyStartTime = Date.now();
  isFlying = true;
  flyCallback = onComplete;
  controls.autoRotate = false;
}

function updateFlight() {
  if (!isFlying) return;
  const elapsed = Date.now() - flyStartTime;
  let t = Math.min(elapsed / flyDuration, 1);
  // Ease in-out cubic
  t = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  camera.position.lerpVectors(flyStart.pos, flyEnd.pos, t);
  controls.target.lerpVectors(flyStart.target, flyEnd.target, t);

  if (elapsed >= flyDuration) {
    isFlying = false;
    if (flyCallback) flyCallback();
  }
}

// ═══════════════════════════════════════════════════════
// AUTO-PILOT MODE
// ═══════════════════════════════════════════════════════
let autopilotActive = false;
let autopilotIndex = 0;

function startAutopilot() {
  autopilotActive = true;
  document.getElementById('btn-autopilot').classList.add('active');
  flyToProject(autopilotIndex);
}

function stopAutopilot() {
  autopilotActive = false;
  document.getElementById('btn-autopilot').classList.remove('active');
}

function nextAutopilot() {
  if (!autopilotActive) return;
  autopilotIndex = (autopilotIndex + 1) % PROJECTS.length;
  setTimeout(() => flyToProject(autopilotIndex), 3000);
}

// ═══════════════════════════════════════════════════════
// UI INTERACTION
// ═══════════════════════════════════════════════════════
const hudLocationEl = document.getElementById('hud-location');
const projectPanel = document.getElementById('project-panel');
const panelImage = document.getElementById('panel-image');
const panelTitle = document.getElementById('panel-title');
const panelCity = document.getElementById('panel-city');
const panelLink = document.getElementById('panel-link');
const flightStrip = document.getElementById('flight-strip');
const stripFrom = document.getElementById('strip-from');
const stripTo = document.getElementById('strip-to');
const locationListEl = document.getElementById('location-items');
const bioPanel = document.getElementById('bio-panel');

function flyToProject(index) {
  const proj = PROJECTS[index];
  const prevIndex = activeProjectIndex;
  activeProjectIndex = index;

  // Show flight strip
  if (prevIndex >= 0) {
    stripFrom.textContent = PROJECTS[prevIndex].city;
  } else {
    stripFrom.textContent = 'Overview';
  }
  stripTo.textContent = proj.city;
  flightStrip.classList.remove('hidden');

  // Update HUD
  hudLocationEl.textContent = `Flying to ${proj.city}`;

  // Update active location in sidebar
  document.querySelectorAll('.location-item').forEach((el, i) => {
    el.classList.toggle('active', i === index);
  });

  // Close project panel during flight
  closeProjectPanel();

  flyTo(proj.lat, proj.lng, () => {
    // Arrived
    hudLocationEl.textContent = proj.city;
    flightStrip.classList.add('hidden');
    openProjectPanel(proj);
    if (autopilotActive) nextAutopilot();
  }, 2500);
}

function openProjectPanel(proj) {
  panelImage.src = proj.img;
  panelImage.alt = proj.title;
  panelTitle.textContent = proj.title;
  panelCity.textContent = proj.city;
  if (proj.link) {
    panelLink.href = proj.link;
    panelLink.style.display = '';
  } else {
    panelLink.style.display = 'none';
  }
  projectPanel.classList.remove('hidden');
  requestAnimationFrame(() => projectPanel.classList.add('visible'));
}

function closeProjectPanel() {
  projectPanel.classList.remove('visible');
  setTimeout(() => projectPanel.classList.add('hidden'), 400);
}

function goOverview() {
  closeProjectPanel();
  bioPanel.classList.add('hidden');
  activeProjectIndex = -1;
  controls.autoRotate = true;
  hudLocationEl.textContent = '';
  document.querySelectorAll('.location-item').forEach(el => el.classList.remove('active'));

  flyStart = { pos: camera.position.clone(), target: controls.target.clone() };
  flyEnd = { pos: new THREE.Vector3(0, 5, CAM_DISTANCE_OVERVIEW), target: new THREE.Vector3(0, 0, 0) };
  flyDuration = 2000;
  flyStartTime = Date.now();
  isFlying = true;
}

// ── Build location sidebar ───────────────────────────
function buildLocationList() {
  PROJECTS.forEach((proj, i) => {
    const item = document.createElement('div');
    item.className = 'location-item';
    item.innerHTML = `
      <div class="location-dot"></div>
      <div>
        <div class="location-name">${proj.title}</div>
        <div class="location-city">${proj.city}</div>
      </div>
    `;
    item.addEventListener('click', () => {
      stopAutopilot();
      flyToProject(i);
    });
    locationListEl.appendChild(item);
  });
}

// ═══════════════════════════════════════════════════════
// RAYCASTING (Click on markers)
// ═══════════════════════════════════════════════════════
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
raycaster.params.Points = { threshold: 0.2 };

function onPointerClick(event) {
  if (isFlying) return;
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const dots = markers.map(m => m.dot);
  const intersects = raycaster.intersectObjects(dots);

  if (intersects.length > 0) {
    const idx = intersects[0].object.userData.projectIndex;
    stopAutopilot();
    flyToProject(idx);
  }
}

// ═══════════════════════════════════════════════════════
// MARKER ANIMATIONS
// ═══════════════════════════════════════════════════════
function updateMarkers(time) {
  markers.forEach((m, i) => {
    const pulse = Math.sin(time * 2 + i * 0.5) * 0.5 + 0.5;
    m.ring.scale.setScalar(1 + pulse * 0.5);
    m.ring.material.opacity = 0.1 + pulse * 0.15;

    // Active marker glows more
    if (i === activeProjectIndex) {
      m.dot.scale.setScalar(1.5);
      m.dot.material.color.setHex(0xffffff);
      m.ring.material.opacity = 0.3 + pulse * 0.2;
    } else {
      m.dot.scale.setScalar(1);
    }
  });
}

// ═══════════════════════════════════════════════════════
// RESIZE
// ═══════════════════════════════════════════════════════
function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onResize);

// ═══════════════════════════════════════════════════════
// GAME LOOP
// ═══════════════════════════════════════════════════════
function animate() {
  requestAnimationFrame(animate);
  const time = Date.now() / 1000;

  updateFlight();
  updateMarkers(time);
  controls.update();

  renderer.render(scene, camera);
}

// ═══════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════
function init() {
  createMarkers();
  flightPaths = createAllFlightPaths();
  scene.add(flightPaths);
  buildLocationList();
  loadCountryOutlines();

  // Preload a few images
  PROJECTS.slice(0, 4).forEach(p => {
    const img = new Image();
    img.src = p.img;
  });

  // Event listeners
  renderer.domElement.addEventListener('click', onPointerClick);

  document.getElementById('panel-close').addEventListener('click', closeProjectPanel);

  document.getElementById('btn-autopilot').addEventListener('click', () => {
    if (autopilotActive) {
      stopAutopilot();
    } else {
      startAutopilot();
    }
  });

  document.getElementById('btn-overview').addEventListener('click', goOverview);

  document.getElementById('hud-brand').addEventListener('click', () => {
    const bio = document.getElementById('bio-panel');
    bio.classList.toggle('hidden');
  });

  document.getElementById('bio-close').addEventListener('click', () => {
    document.getElementById('bio-panel').classList.add('hidden');
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeProjectPanel();
      bioPanel.classList.add('hidden');
      stopAutopilot();
    }
    if (e.key === ' ' || e.key === 'p') {
      e.preventDefault();
      if (autopilotActive) stopAutopilot();
      else startAutopilot();
    }
    if (e.key === 'o') goOverview();
  });
}

init();
animate();
