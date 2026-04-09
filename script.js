/* ═══════════════════════════════════════════════════════
   QIANHUA GE — 3D MAP PORTFOLIO
   Mapbox GL JS · Dark Cyberpunk · 3D Buildings
   ═══════════════════════════════════════════════════════ */

// ╔═══════════════════════════════════════════════════════╗
// ║  PASTE YOUR MAPBOX ACCESS TOKEN BELOW                ║
// ║  Get one free at: https://account.mapbox.com         ║
// ╚═══════════════════════════════════════════════════════╝
mapboxgl.accessToken = 'pk.eyJ1IjoicWlhbmh1YSIsImEiOiJjbW5kdWIyNXQxaHA5MnBvdmZ3Y3NzbjhsIn0.nDjkQ8eb0S5MdldDa1dhKg';

// ── PROJECT DATA ──────────────────────────────────────
const PROJECTS = [
  { id:'collovlabs', title:'CollovLabs',     city:'Redwood City',   lat:37.4852, lng:-122.2364, img:'https://freight.cargo.site/w/600/q/75/i/N2755860063414473176452238820781/Screenshot-2026-01-20-at-6.44.12PM.png', link:'https://collovlabs.com/' },
  { id:'emochi',     title:'Emochi',         city:'Oakland',        lat:37.8044, lng:-122.2712, img:'https://freight.cargo.site/w/600/q/75/i/E2590589006754239729531640235437/1923.png',             link:'https://play.google.com/store/apps/details?id=com.flow.mobile&hl=en' },
  { id:'nodeobjects',title:'Node Objects',   city:'Shanghai',       lat:31.2400, lng:121.4900,  img:'https://freight.cargo.site/w/600/q/75/i/X2588756189508130985248208864685/Wireframe---22.png',  link:null },
  { id:'katakana',   title:'Katakana',       city:'Taipei',         lat:25.0330, lng:121.5654,  img:'https://freight.cargo.site/w/600/q/75/i/C2750890346348100079084459935149/Frame-4.png',         link:null },
  { id:'divly',      title:'Divly',          city:'Stockholm',      lat:59.3293, lng:18.0686,   img:'./images/divly.png',     link:'https://divly.com/en/' },
  { id:'substrate',  title:'Substrate',      city:'Palo Alto',      lat:37.4419, lng:-122.1430, img:'https://freight.cargo.site/w/600/q/75/i/J2579367830216556064905875047853/substrate.png',       link:'http://www.substratecapital.xyz/' },
  { id:'atlaslab',   title:'Atlas Lab',      city:'Sacramento',     lat:38.5816, lng:-121.4944, img:'https://freight.cargo.site/w/700/q/75/i/G2295860679372777805815165633965/atlas-lab.png',       link:'https://atlaslab.com/' },
  { id:'spellbrush', title:'Spellbrush',     city:'San Francisco',  lat:37.7780, lng:-122.4150, img:'./Spellbrush.png', link:null },
  { id:'tesseract',  title:'Tesseract',      city:'Brownsville',    lat:25.9017, lng:-97.4975,  img:'./Tesseract.png',  link:null },
  { id:'kaon',       title:'Kaon',          city:'San Francisco',  lat:37.7749, lng:-122.4194, img:'https://freight.cargo.site/w/600/q/75/i/U2329052567392612164893807625645/Frame-2090051588.png', link:'https://kaon.io/' },
  { id:'azulenelabs',title:'Azulene Labs',   city:'San Francisco',  lat:37.7850, lng:-122.4094, img:'https://freight.cargo.site/w/600/q/75/i/A2579303923740662219230576264621/461.png',              link:null },
  { id:'metaval',    title:'Metaval',        city:'Dubai',          lat:25.2048, lng:55.2708,   img:'./images/metaval.png',   link:'https://metaval.com/' },
  { id:'cozyai',     title:'CozyAI',         city:'Shenzhen',       lat:22.5431, lng:114.0579,  img:'https://freight.cargo.site/w/600/q/75/i/X2756203805356204973465402230189/cozyai.png',          link:'https://apps.apple.com/us/app/cozyai-ai-home-design/id6744885843' },
  { id:'opoplan',    title:'Opoplan',        city:'Dublin',         lat:53.3498, lng:-6.2603,   img:'https://freight.cargo.site/w/700/q/75/i/P2329052567429505653041226728877/web.png',              link:null },
  { id:'mundus',     title:'Mundus',         city:'Berkeley',       lat:37.8780, lng:-122.2600, img:'https://freight.cargo.site/w/600/q/75/i/D2755778654483334754417271260589/Frame-10.png',        link:null },
  { id:'collov',     title:'Collov',         city:'Redwood City',   lat:37.4870, lng:-122.2270, img:'https://freight.cargo.site/w/600/q/75/i/Q2578801080199267923600036742573/Wireframe---19.png',  link:'https://collov.ai/' },
  { id:'fabrique',   title:'Fabrique',       city:'New York City',  lat:40.7128, lng:-74.0060,   img:'https://freight.cargo.site/w/600/q/75/i/P2588783626365162737518352680365/Screenshot-2025-10-07-at-11.47.15PM.png', link:'https://fabrique.se/' },
  { id:'flowgpt',    title:'FlowGPT',        city:'Washington',     lat:47.6062, lng:-122.3321, img:'https://freight.cargo.site/w/600/q/75/i/V2579235822714973684961464173997/flowgpt.png',         link:'https://flowgpt.com/' },
  { id:'markitai',   title:'MarkitAI',       city:'Berkeley',       lat:37.8716, lng:-122.2727, img:'https://freight.cargo.site/w/600/q/75/i/R2590575374960857395573477492141/1922.png',             link:null },
  { id:'taormina',   title:'Taormina',       city:'Rome',           lat:41.9028, lng:12.4964,   img:'https://freight.cargo.site/w/700/q/75/i/W2755737092308729720163620767149/Frame-7.png',         link:null },
];

// ── CONSTANTS ─────────────────────────────────────────
const OVERVIEW_ZOOM = 2;
const CITY_ZOOM = 15.5;
const CITY_PITCH = 60;
const CITY_BEARING = -20;
const FLY_DURATION = 3500;

// ═══════════════════════════════════════════════════════
// MAPBOX MAP SETUP
// ═══════════════════════════════════════════════════════
const map = new mapboxgl.Map({
  container: 'globe-container',
  style: 'mapbox://styles/mapbox/dark-v11',
  center: [-100, 35],
  zoom: OVERVIEW_ZOOM,
  pitch: 0,
  bearing: 0,
  projection: 'globe',
  antialias: true,
  fadeDuration: 0,
});

// Remove default Mapbox controls
map.dragRotate.enable();
map.touchZoomRotate.enableRotation();

// ═══════════════════════════════════════════════════════
// GLOBE ROTATION ANIMATION
// ═══════════════════════════════════════════════════════
let globeSpinning = true;
let isFlying = false;
let activeProjectIndex = -1;
const SPIN_SPEED = 0.012; // degrees per frame

function spinGlobe() {
  if (globeSpinning && !isFlying && activeProjectIndex === -1) {
    const center = map.getCenter();
    center.lng += SPIN_SPEED;
    map.setCenter(center);
  }
  requestAnimationFrame(spinGlobe);
}
spinGlobe();

// Pause spinning on user interaction
map.on('mousedown', () => { globeSpinning = false; });
map.on('touchstart', () => { globeSpinning = false; });
map.on('mouseup', () => {
  if (activeProjectIndex === -1) globeSpinning = true;
});
map.on('touchend', () => {
  if (activeProjectIndex === -1) globeSpinning = true;
});

// ═══════════════════════════════════════════════════════
// DARK ATMOSPHERE & FOG
// ═══════════════════════════════════════════════════════
map.on('style.load', () => {
  // Dark space atmosphere for globe view — pure greyscale, no blue tint
  map.setFog({
    'range': [0.5, 10],
    'color': 'rgb(5, 5, 5)',
    'high-color': 'rgb(2, 2, 2)',
    'horizon-blend': 0.03,
    'space-color': 'rgb(0, 0, 0)',
    'star-intensity': 0.15,
  });

  // Customize the dark style to be even darker
  customizeDarkStyle();
});

// ═══════════════════════════════════════════════════════
// CUSTOM DARK STYLE MODIFICATIONS
// ═══════════════════════════════════════════════════════
function customizeDarkStyle() {
  const layers = map.getStyle().layers;
  if (!layers) return;

  // Find the first symbol layer for inserting 3D buildings beneath labels
  let labelLayerId;
  for (const layer of layers) {
    if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
      labelLayerId = layer.id;
      break;
    }
  }

  // Darken water — pure black
  try { map.setPaintProperty('water', 'fill-color', '#020202'); } catch(e) {}

  // Darken land/background — pure greyscale
  try { map.setPaintProperty('land', 'background-color', '#050505'); } catch(e) {}
  try { map.setPaintProperty('landcover', 'fill-color', '#080808'); } catch(e) {}
  try { map.setPaintProperty('landuse', 'fill-color', '#080808'); } catch(e) {}

  // Make roads very subtle
  const roadLayers = layers.filter(l =>
    l.id.includes('road') || l.id.includes('bridge') || l.id.includes('tunnel')
  );
  roadLayers.forEach(l => {
    try {
      if (l.type === 'line') {
        map.setPaintProperty(l.id, 'line-color', '#0f0f0f');
        map.setPaintProperty(l.id, 'line-opacity', 0.5);
      }
    } catch(e) {}
  });

  // Hide most labels for cleaner look (keep country/state)
  layers.forEach(l => {
    if (l.type === 'symbol') {
      const id = l.id;
      if (id.includes('place-city') || id.includes('poi') || id.includes('road-label') ||
          id.includes('transit') || id.includes('natural') || id.includes('water-point')) {
        try { map.setLayoutProperty(id, 'visibility', 'none'); } catch(e) {}
      }
      // Make remaining labels subtle
      try { map.setPaintProperty(id, 'text-color', 'rgba(255,255,255,0.15)'); } catch(e) {}
    }
  });

  // Subtle building fill at lower zooms
  try {
    map.setPaintProperty('building', 'fill-color', '#0a0a0a');
    map.setPaintProperty('building', 'fill-opacity', 0.8);
  } catch(e) {}

  // ── ADD 3D BUILDING EXTRUSIONS ──
  map.addLayer({
    id: '3d-buildings',
    source: 'composite',
    'source-layer': 'building',
    filter: ['==', 'extrude', 'true'],
    type: 'fill-extrusion',
    minzoom: 12,
    paint: {
      'fill-extrusion-color': [
        'interpolate', ['linear'], ['get', 'height'],
        0, '#0c0c0c',
        50, '#141414',
        100, '#1a1a1a',
        200, '#222222'
      ],
      'fill-extrusion-height': [
        'interpolate', ['linear'], ['zoom'],
        12, 0,
        12.5, ['get', 'height']
      ],
      'fill-extrusion-base': [
        'interpolate', ['linear'], ['zoom'],
        12, 0,
        12.5, ['get', 'min_height']
      ],
      'fill-extrusion-opacity': [
        'interpolate', ['linear'], ['zoom'],
        12, 0,
        13, 0.5,
        16, 0.85
      ],
      // Vertical gradient for depth/lighting
      'fill-extrusion-vertical-gradient': true,
    },
  }, labelLayerId);

  // ── ADD TERRAIN ──
  if (!map.getSource('mapbox-dem')) {
    map.addSource('mapbox-dem', {
      type: 'raster-dem',
      url: 'mapbox://mapbox.terrain-rgb',
      tileSize: 512,
      maxzoom: 14,
    });
    map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
  }

  // ── ADD BUILDING EDGE GLOW (subtle top highlight) ──
  map.addLayer({
    id: 'building-edges',
    source: 'composite',
    'source-layer': 'building',
    filter: ['==', 'extrude', 'true'],
    type: 'fill-extrusion',
    minzoom: 14,
    paint: {
      'fill-extrusion-color': '#ffffff',
      'fill-extrusion-height': ['get', 'height'],
      'fill-extrusion-base': [
        '-', ['get', 'height'], 0.5
      ],
      'fill-extrusion-opacity': 0.04,
    },
  });
}

// ═══════════════════════════════════════════════════════
// CUSTOM MAP LIGHTING
// ═══════════════════════════════════════════════════════
map.on('load', () => {
  try {
    map.setLight({
      anchor: 'viewport',
      color: '#e0e0e0',
      intensity: 0.25,
      position: [1.5, 210, 30],
    });
  } catch(e) {}
});

// ═══════════════════════════════════════════════════════
// MARKERS
// ═══════════════════════════════════════════════════════
const mapMarkers = [];

function createMarkers() {
  PROJECTS.forEach((proj, i) => {
    // Custom marker DOM element
    const el = document.createElement('div');
    el.className = 'map-marker';
    el.dataset.index = i;

    // Inner dot
    const dot = document.createElement('div');
    dot.className = 'map-marker-dot';
    el.appendChild(dot);

    // Pulse ring
    const ring = document.createElement('div');
    ring.className = 'map-marker-ring';
    el.appendChild(ring);

    const marker = new mapboxgl.Marker({
      element: el,
      anchor: 'center',
    })
    .setLngLat([proj.lng, proj.lat])
    .addTo(map);

    // Click handler
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      stopAutopilot();
      flyToProject(i);
    });

    mapMarkers.push({ marker, el, proj });
  });
}

// ═══════════════════════════════════════════════════════
// FLIGHT PATHS (GeoJSON arc lines)
// ═══════════════════════════════════════════════════════
function createFlightPaths() {
  const features = [];
  for (let i = 0; i < PROJECTS.length - 1; i++) {
    const from = PROJECTS[i];
    const to = PROJECTS[i + 1];
    features.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [from.lng, from.lat],
          [to.lng, to.lat],
        ],
      },
    });
  }

  if (map.getSource('flight-paths')) {
    map.getSource('flight-paths').setData({ type: 'FeatureCollection', features });
  } else {
    map.addSource('flight-paths', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features },
    });

    map.addLayer({
      id: 'flight-paths-line',
      source: 'flight-paths',
      type: 'line',
      paint: {
        'line-color': 'rgba(255, 255, 255, 0.06)',
        'line-width': 1,
        'line-dasharray': [3, 4],
      },
    });
  }
}

// ═══════════════════════════════════════════════════════
// AUTOPILOT
// ═══════════════════════════════════════════════════════
let autopilotActive = false;
let autopilotTimer = null;

function startAutopilot() {
  autopilotActive = true;
  document.getElementById('btn-autopilot').classList.add('active');
  // Start from next project
  const nextIdx = (activeProjectIndex + 1) % PROJECTS.length;
  flyToProject(nextIdx);
}

function stopAutopilot() {
  autopilotActive = false;
  document.getElementById('btn-autopilot').classList.remove('active');
  if (autopilotTimer) {
    clearTimeout(autopilotTimer);
    autopilotTimer = null;
  }
}

function nextAutopilot() {
  autopilotTimer = setTimeout(() => {
    if (!autopilotActive) return;
    const nextIdx = (activeProjectIndex + 1) % PROJECTS.length;
    flyToProject(nextIdx);
  }, 4000);
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
const bioOverlay = document.getElementById('bio-overlay');
const connectorSvg = document.getElementById('panel-connector');
const connectorLine = document.getElementById('connector-line');

let activePanelProject = null;

function flyToProject(index) {
  const proj = PROJECTS[index];
  const prevIndex = activeProjectIndex;
  activeProjectIndex = index;
  isFlying = true;
  globeSpinning = false;

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

  // Update active marker styling
  mapMarkers.forEach((m, i) => {
    m.el.classList.toggle('active', i === index);
  });

  // Close project panel during flight
  closeProjectPanel();

  // Fly to the project location
  map.flyTo({
    center: [proj.lng, proj.lat],
    zoom: CITY_ZOOM,
    pitch: CITY_PITCH,
    bearing: CITY_BEARING + (index * 15) % 60 - 30, // Vary bearing per project
    duration: FLY_DURATION,
    essential: true,
    curve: 1.42,
  });

  // Listen for flight end
  const onMoveEnd = () => {
    map.off('moveend', onMoveEnd);
    isFlying = false;
    hudLocationEl.textContent = proj.city;
    flightStrip.classList.add('hidden');
    openProjectPanel(proj);
    if (autopilotActive) nextAutopilot();
  };
  map.on('moveend', onMoveEnd);
}

function openProjectPanel(proj) {
  activePanelProject = proj;
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
  positionPanelNearMarker(proj);
  projectPanel.classList.remove('hidden');
  requestAnimationFrame(() => {
    projectPanel.classList.add('visible');
    connectorSvg.classList.add('visible');
  });
}

function closeProjectPanel() {
  activePanelProject = null;
  projectPanel.classList.remove('visible');
  connectorSvg.classList.remove('visible');
  setTimeout(() => projectPanel.classList.add('hidden'), 400);
}

// Position project panel near the marker's screen coordinates
function positionPanelNearMarker(proj) {
  if (!proj) return;
  const point = map.project([proj.lng, proj.lat]);
  const sx = point.x;
  const sy = point.y;

  const pw = Math.min(480, window.innerWidth - 32);
  const ph = projectPanel.offsetHeight || 300;

  const offsetX = 30;
  const offsetY = -ph / 3;

  let panelX, panelY;

  if (sx > window.innerWidth / 2) {
    panelX = sx - pw - offsetX;
  } else {
    panelX = sx + offsetX;
  }
  panelY = sy + offsetY;

  panelX = Math.max(8, Math.min(window.innerWidth - pw - 8, panelX));
  panelY = Math.max(60, Math.min(window.innerHeight - ph - 8, panelY));

  projectPanel.style.left = panelX + 'px';
  projectPanel.style.top = panelY + 'px';

  // Draw connector line
  const panelCenterY = panelY + ph / 2;
  let connX2 = sx > window.innerWidth / 2 ? panelX + pw : panelX;
  connectorLine.setAttribute('x1', sx);
  connectorLine.setAttribute('y1', sy);
  connectorLine.setAttribute('x2', connX2);
  connectorLine.setAttribute('y2', panelCenterY);
}

// Update panel position as map moves
function updatePanelPosition() {
  if (!activePanelProject || !projectPanel.classList.contains('visible')) return;
  positionPanelNearMarker(activePanelProject);
}

// Listen for map movement to reposition panel
map.on('move', updatePanelPosition);

function goOverview() {
  closeProjectPanel();
  closeBioOverlay();
  activeProjectIndex = -1;
  hudLocationEl.textContent = 'Founder · Investor · Designer · Engineer';
  document.querySelectorAll('.location-item').forEach(el => el.classList.remove('active'));
  mapMarkers.forEach(m => m.el.classList.remove('active'));

  map.flyTo({
    center: [-100, 35],
    zoom: OVERVIEW_ZOOM,
    pitch: 0,
    bearing: 0,
    duration: 2500,
    essential: true,
  });

  // Resume globe spinning after flight completes
  const onOverviewEnd = () => {
    map.off('moveend', onOverviewEnd);
    globeSpinning = true;
  };
  map.on('moveend', onOverviewEnd);
}

// ── Bio overlay helpers ──────────────────────────────
function openBioOverlay() {
  bioOverlay.classList.add('visible');
}
function closeBioOverlay() {
  bioOverlay.classList.remove('visible');
}
function toggleBioOverlay() {
  bioOverlay.classList.toggle('visible');
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
// INITIALIZATION
// ═══════════════════════════════════════════════════════
function init() {
  buildLocationList();
  hudLocationEl.textContent = 'Founder · Investor · Designer · Engineer';

  // Wait for map style to load before adding layers
  map.on('load', () => {
    createMarkers();
    createFlightPaths();
  });

  // Preload images
  PROJECTS.slice(0, 4).forEach(p => {
    const img = new Image();
    img.src = p.img;
  });

  // Event listeners
  document.getElementById('panel-close').addEventListener('click', closeProjectPanel);

  document.getElementById('btn-autopilot').addEventListener('click', () => {
    if (autopilotActive) {
      stopAutopilot();
    } else {
      startAutopilot();
    }
  });

  document.getElementById('btn-overview').addEventListener('click', goOverview);

  document.getElementById('hud-brand').addEventListener('click', toggleBioOverlay);

  document.getElementById('bio-close').addEventListener('click', closeBioOverlay);

  bioOverlay.addEventListener('click', (e) => {
    if (e.target === bioOverlay) closeBioOverlay();
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeProjectPanel();
      closeBioOverlay();
      stopAutopilot();
    }
    if (e.key === ' ' || e.key === 'p') {
      e.preventDefault();
      if (autopilotActive) stopAutopilot();
      else startAutopilot();
    }
    if (e.key === 'o') goOverview();
  });

  // Click globe to close panels
  map.on('click', () => {
    if (!isFlying && activePanelProject) {
      closeProjectPanel();
    }
  });
}

init();
