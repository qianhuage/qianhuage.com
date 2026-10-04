import {
  concepts,
  relations,
  facets,
  imagesByConcept,
} from "./civilization-data.js?v=19";

// Positions are genuinely spatial. Perspective, depth sorting and camera rotation
// are calculated here, while the canvas keeps this small scene dependency-free.
export function createCivilizationMap(entry) {
  const section = document.createElement("section");
  section.id = "civilization-atlas";
  section.className = "civilization-atlas";
  section.setAttribute(
    "aria-label",
    "Spatial atlas of the threshold civilization",
  );
  section.innerHTML = `<div class="atlas-toolbar"><div class="atlas-filters" aria-label="Explore a layer"><button type="button" data-layer="all" aria-pressed="true">the whole</button><button type="button" data-layer="origins" aria-pressed="false">origins</button><button type="button" data-layer="institutions" aria-pressed="false">institutions</button><button type="button" data-layer="culture" aria-pressed="false">culture</button><button type="button" data-layer="tensions" aria-pressed="false">fault lines</button></div><button type="button" class="atlas-expand" aria-label="Expand civilization atlas">↗</button></div><div class="atlas-space"><canvas tabindex="0" role="img" aria-label="Rotatable three-dimensional network of civilization concepts and photographs. Drag to orbit. Selecting a point takes you to its passage in the essay."></canvas><div class="atlas-space-heading"><span class="atlas-node-count">12 CLUSTERS / 96 IDEAS</span></div><div class="atlas-tooltip" hidden></div><div class="atlas-camera"><button type="button" data-action="out" aria-label="Zoom out">−</button><button type="button" data-action="in" aria-label="Zoom in">+</button><button type="button" data-action="reset" aria-label="Reset atlas view">↺</button><button type="button" data-action="motion" aria-label="Pause atlas rotation" aria-pressed="true">Ⅱ</button></div><div class="atlas-hint">DRAG TO ORBIT <span>SELECT A POINT TO READ</span></div></div><div class="atlas-explorer"><label class="atlas-chapter-select">CHAPTER<select aria-label="Select essay chapter"></select></label><div class="atlas-reading" tabindex="0" role="region" aria-label="Complete Threshold Civilization essay"></div></div>`;
  const canvas = section.querySelector("canvas"),
    ctx = canvas.getContext("2d");
  const select = section.querySelector("select"),
    tooltip = section.querySelector(".atlas-tooltip");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const chapters = entry.chapters;
  const chapterFor = (group) =>
    chapters.find((chapter) => chapter.nodes.includes(group));
  const reading = section.querySelector(".atlas-reading");
  let readingPosition = 0;
  const chapterElements = new Map();
  chapters.forEach((chapter, i) => {
    const option = document.createElement("option");
    option.value = chapter.id;
    option.textContent = `${String(i + 1).padStart(2, "0")} / ${chapter.title}`;
    select.append(option);
    const article = document.createElement("section");
    article.className = "atlas-chapter";
    article.dataset.concept = chapter.id;
    const title = document.createElement("h3");
    title.textContent = chapter.title;
    article.append(title);
    for (const text of chapter.paragraphs) {
      const paragraph = document.createElement("p");
      paragraph.textContent = text;
      article.append(paragraph);
    }
    reading.append(article);
    chapterElements.set(chapter.id, article);
  });
  let width = 540,
    height = 570,
    yaw = 0.18,
    pitch = -0.14,
    zoom = 1,
    layer = "all",
    selected = "geography",
    hover = null,
    visible = false,
    rotating = !reduced.matches,
    frame = 0,
    previousTime = 0,
    drag = null,
    moved = false;
  let focused = [0, 0, 0],
    targetFocus = [0, 0, 0],
    hitAreas = [];
  const positions = [
    [-285, -155, -100],
    [-135, -70, 145],
    [-20, 5, -45],
    [155, -105, -110],
    [285, 10, 120],
    [60, 225, -90],
    [-240, 165, 100],
    [5, -245, 175],
    [235, -215, -155],
    [-85, 255, 195],
    [330, 195, -125],
    [-320, 20, -230],
  ];
  const groups = {
    origins: ["geography", "worldview", "method"],
    institutions: ["power", "economy", "education"],
    culture: ["love", "art", "belief"],
    tensions: ["conflict", "apex", "question"],
  };
  const colors = {
    origins: [153, 189, 210],
    institutions: [184, 205, 186],
    culture: [224, 192, 154],
    tensions: [195, 166, 183],
  };
  const groupFor = (id) =>
    Object.keys(groups).find((g) => groups[g].includes(id));
  let seed = 28401;
  function random() {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  const nodes = [],
    edges = [],
    textures = new Map();
  concepts.forEach((concept, i) => {
    const point = {
      ...concept,
      id: concept.id,
      group: concept.id,
      tier: 0,
      position: positions[i],
      size: 46,
      image: imagesByConcept[concept.id][0],
    };
    nodes.push(point);
    facets[concept.id].forEach((title, j) => {
      const angle = (j / 8) * Math.PI * 2 + random() * 0.6,
        radius = 65 + random() * 86;
      const position = [
        point.position[0] + Math.cos(angle) * radius,
        point.position[1] + Math.sin(angle) * radius * 0.78,
        point.position[2] + (random() - 0.5) * 245,
      ];
      const words = chapterFor(concept.id)?.paragraphs || [];
      const phrase = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
      const quote =
        words.find((p) =>
          ` ${p
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, " ")
            .trim()} `.includes(` ${phrase} `),
        ) || "";
      const leaf = {
        id: `${concept.id}-${j}`,
        group: concept.id,
        tier: 1,
        title,
        body: concept.body,
        sub: concept.sub,
        quote,
        position,
        size: 14 + random() * 15,
        image: imagesByConcept[concept.id][j % 4],
      };
      nodes.push(leaf);
      edges.push([point.id, leaf.id]);
      if (j > 0) edges.push([`${concept.id}-${j - 1}`, leaf.id]);
      // Local ties join ideas within the same passage, beyond the parent links.
      edges.push([`${concept.id}-${(j + 3) % 8}`, leaf.id]);
    });
  });
  relations.forEach((edge) => edges.push(edge));
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const dust = Array.from({ length: 240 }, () => {
    const hub = positions[Math.floor(random() * positions.length)];
    return [
      hub[0] + (random() - 0.5) * 290,
      hub[1] + (random() - 0.5) * 220,
      hub[2] + (random() - 0.5) * 420,
    ];
  });
  function requestFrame() {
    if (!frame) frame = requestAnimationFrame(render);
  }
  function texture(file) {
    if (textures.has(file)) return textures.get(file);
    const image = new Image();
    image.decoding = "async";
    image.src = `./media/atlas/${file}.jpg`;
    image.onload = requestFrame;
    const item = { image };
    textures.set(file, item);
    return item;
  }
  function project(position) {
    const x = position[0] - focused[0],
      y = position[1] - focused[1],
      z = position[2] - focused[2];
    const rx = x * Math.cos(yaw) + z * Math.sin(yaw),
      rz = -x * Math.sin(yaw) + z * Math.cos(yaw);
    const ry = y * Math.cos(pitch) - rz * Math.sin(pitch),
      depth = y * Math.sin(pitch) + rz * Math.cos(pitch);
    const perspective = 900 / (1100 + depth);
    const scale = Math.min(width, height) * 0.00115 * zoom * perspective;
    return {
      x: width * 0.5 + rx * scale,
      y: height * 0.5 + ry * scale,
      z: depth,
      scale,
    };
  }
  function opacity(node, p) {
    const match = layer === "all" || groups[layer].includes(node.group);
    return Math.max(0.1, Math.min(1, 0.87 - p.z / 1050)) * (match ? 1 : 0.1);
  }
  function render(time) {
    frame = 0;
    if (!ctx) return;
    const delta = previousTime ? Math.min(40, time - previousTime) : 16;
    previousTime = time;
    if (visible && rotating && !drag && !document.hidden)
      yaw += delta * 0.000035;
    focused = focused.map(
      (v, i) => v + (targetFocus[i] - v) * (reduced.matches ? 1 : 0.08),
    );
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#05080a";
    ctx.fillRect(0, 0, width, height);
    const glow = ctx.createRadialGradient(
      width * 0.5,
      height * 0.5,
      10,
      width * 0.5,
      height * 0.5,
      width * 0.6,
    );
    glow.addColorStop(0, "#12202a55");
    glow.addColorStop(1, "#05080a00");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
    for (const point of dust) {
      const p = project(point);
      ctx.fillStyle = `rgba(158,182,190,${Math.max(0.035, 0.2 - p.z / 2300)})`;
      ctx.fillRect(p.x, p.y, 1, 1);
    }
    const projected = new Map(nodes.map((n) => [n.id, project(n.position)]));
    const activeGroup = byId.get(hover || selected)?.group;
    for (const [from, to] of edges) {
      const a = byId.get(from),
        b = byId.get(to),
        pa = projected.get(from),
        pb = projected.get(to);
      const active = a.group === activeGroup && b.group === activeGroup;
      const alpha =
        Math.min(opacity(a, pa), opacity(b, pb)) * (active ? 0.52 : 0.26);
      ctx.strokeStyle = `rgba(${active ? "207,218,210" : "139,157,169"},${alpha})`;
      ctx.lineWidth = active ? 0.75 : 0.55;
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
    }
    hitAreas = [];
    const ordered = [...nodes].sort(
      (a, b) => projected.get(b.id).z - projected.get(a.id).z,
    );
    for (const node of ordered) {
      const p = projected.get(node.id),
        a = opacity(node, p),
        size = Math.max(node.tier ? 5 : 16, node.size * p.scale);
      if (p.x < -50 || p.x > width + 50 || p.y < -50 || p.y > height + 50)
        continue;
      ctx.globalAlpha = a;
      const image = texture(node.image).image;
      const selectedNode = node.id === selected || node.id === hover;
      const color = colors[groupFor(node.group)];
      if (selectedNode) {
        ctx.shadowColor = `rgb(${color})`;
        ctx.shadowBlur = 18;
        ctx.fillStyle = `rgba(${color},.3)`;
        ctx.fillRect(
          p.x - size * 0.5 - 3,
          p.y - size * 0.36 - 3,
          size + 6,
          size * 0.72 + 6,
        );
        ctx.shadowBlur = 0;
      }
      if (image.complete && image.naturalWidth) {
        ctx.drawImage(
          image,
          p.x - size * 0.5,
          p.y - size * 0.36,
          size,
          size * 0.72,
        );
      } else {
        ctx.fillStyle = `rgb(${color})`;
        ctx.fillRect(p.x - size * 0.5, p.y - size * 0.36, size, size * 0.72);
      }
      ctx.strokeStyle = selectedNode ? "#e1e8dc" : `rgba(${color},.5)`;
      ctx.lineWidth = selectedNode ? 1 : 0.5;
      ctx.strokeRect(p.x - size * 0.5, p.y - size * 0.36, size, size * 0.72);
      if (a > 0.25)
        hitAreas.push({ node, x: p.x, y: p.y, r: Math.max(size * 0.65, 9) });
      if (
        node.tier === 0 &&
        (layer === "all" || groups[layer].includes(node.group))
      ) {
        const text = node.sub.toLowerCase(),
          font = Math.max(8, Math.min(11, 10 * p.scale + 0.7));
        ctx.font = `${font}px "Space Mono",monospace`;
        const tw = ctx.measureText(text).width;
        ctx.fillStyle = "rgba(5,8,10,.85)";
        ctx.fillRect(
          p.x - tw / 2 - 5,
          p.y + size * 0.36 + 5,
          tw + 10,
          font + 7,
        );
        ctx.fillStyle = `rgb(${color})`;
        ctx.textAlign = "center";
        ctx.fillText(text, p.x, p.y + size * 0.36 + font + 6);
      }
      ctx.globalAlpha = 1;
    }
    ctx.font = '8px "Space Mono",monospace';
    ctx.fillStyle = "#768b9766";
    ctx.textAlign = "left";
    ctx.fillText(`DEPTH / ${zoom.toFixed(2)}×`, 18, height - 42);
    const moving = focused.some((v, i) => Math.abs(v - targetFocus[i]) > 0.1);
    if (visible && !document.hidden && (rotating || moving)) requestFrame();
  }
  function choose(id, focus = false) {
    const node = byId.get(id);
    if (!node) return;
    selected = id;
    const chapter = chapterFor(node.group);
    select.value = chapter.id;
    const article = chapterElements.get(chapter.id);
    const target = node.quote
      ? [...article.querySelectorAll("p")].find(
          (p) => p.textContent === node.quote,
        )
      : article;
    reading
      .querySelectorAll(".is-reading-focus")
      .forEach((p) => p.classList.remove("is-reading-focus"));
    chapterElements.forEach(
      (el, id) => (el.dataset.current = String(id === chapter.id)),
    );
    if (node.quote && target) target.classList.add("is-reading-focus");
    if (target) {
      reading.scrollTop +=
        target.getBoundingClientRect().top -
        reading.getBoundingClientRect().top -
        12;
      readingPosition = reading.scrollTop;
    }
    if (focus) {
      targetFocus = node.position.map((v) => v * 0.55);
      zoom = Math.max(zoom, 1.35);
    }
    requestFrame();
  }
  function syncReading() {
    if (!reading.clientHeight) return;
    readingPosition = reading.scrollTop;
    const threshold = reading.getBoundingClientRect().top + 80;
    let active = chapters[0].id;
    chapterElements.forEach((el, id) => {
      if (el.getBoundingClientRect().top <= threshold) active = id;
    });
    select.value = active;
    if (chapterFor(byId.get(selected).group).id !== active) selected = active;
    chapterElements.forEach(
      (el, id) => (el.dataset.current = String(id === active)),
    );
    requestFrame();
  }
  reading.addEventListener("scroll", syncReading, { passive: true });
  new ResizeObserver(syncReading).observe(reading);
  function size() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width || 540;
    height = rect.height || 570;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    requestFrame();
  }
  new ResizeObserver(size).observe(canvas);
  new IntersectionObserver(
    ([e]) => {
      visible = e.isIntersecting;
      if (visible) requestFrame();
      // Allow a pending resize paint to finish; the renderer itself stops
      // animation off screen. Cancelling here could leave a cleared canvas.
    },
    { threshold: 0.03 },
  ).observe(canvas);
  function hit(event) {
    const rect = canvas.getBoundingClientRect(),
      x = event.clientX - rect.left,
      y = event.clientY - rect.top;
    return [...hitAreas]
      .reverse()
      .find((p) => Math.hypot(p.x - x, p.y - y) < p.r)?.node;
  }
  canvas.addEventListener("pointerdown", (event) => {
    drag = {
      x: event.clientX,
      y: event.clientY,
      startX: event.clientX,
      startY: event.clientY,
      id: event.pointerId,
    };
    moved = false;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (drag) {
      const dx = event.clientX - drag.x,
        dy = event.clientY - drag.y;
      if (
        Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 5
      )
        moved = true;
      yaw += dx * 0.006;
      pitch = Math.max(-1.15, Math.min(1.15, pitch + dy * 0.005));
      drag.x = event.clientX;
      drag.y = event.clientY;
      tooltip.hidden = true;
      requestFrame();
      return;
    }
    const node = hit(event);
    hover = node?.id || null;
    canvas.style.cursor = node ? "pointer" : "grab";
    tooltip.hidden = !node;
    if (node) {
      tooltip.textContent = node.title;
      tooltip.style.left =
        Math.max(10, Math.min(width - 180, event.offsetX + 12)) + "px";
      tooltip.style.top = Math.max(40, event.offsetY - 36) + "px";
    }
    requestFrame();
  });
  canvas.addEventListener("pointerup", (event) => {
    if (drag && !moved) {
      const node = hit(event);
      if (node) choose(node.id);
    }
    drag = null;
  });
  canvas.addEventListener("pointercancel", () => {
    drag = null;
  });
  canvas.addEventListener("pointerleave", () => {
    hover = null;
    tooltip.hidden = true;
  });
  canvas.addEventListener("keydown", (event) => {
    const actions = {
      ArrowLeft: () => (yaw -= 0.15),
      ArrowRight: () => (yaw += 0.15),
      ArrowUp: () => (pitch -= 0.12),
      ArrowDown: () => (pitch += 0.12),
      "+": () => (zoom = Math.min(2.8, zoom + 0.2)),
      "-": () => (zoom = Math.max(0.55, zoom - 0.2)),
    };
    if (actions[event.key]) {
      event.preventDefault();
      actions[event.key]();
      requestFrame();
    }
  });
  select.addEventListener("change", () => choose(select.value, true));
  section.querySelectorAll("[data-layer]").forEach((button) =>
    button.addEventListener("click", () => {
      layer = button.dataset.layer;
      section
        .querySelectorAll("[data-layer]")
        .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
      targetFocus = [0, 0, 0];
      zoom = layer === "all" ? 1 : 1.15;
      if (layer !== "all") choose(groups[layer][0]);
      requestFrame();
    }),
  );
  function syncMotion() {
    const b = section.querySelector("[data-action=motion]");
    b.textContent = rotating ? "Ⅱ" : "▶";
    b.setAttribute("aria-pressed", String(rotating));
    b.setAttribute(
      "aria-label",
      rotating ? "Pause atlas rotation" : "Rotate atlas",
    );
  }
  section.querySelectorAll("[data-action]").forEach((button) =>
    button.addEventListener("click", () => {
      switch (button.dataset.action) {
        case "in":
          zoom = Math.min(2.8, zoom + 0.25);
          break;
        case "out":
          zoom = Math.max(0.55, zoom - 0.25);
          break;
        case "reset":
          yaw = 0.18;
          pitch = -0.14;
          zoom = 1;
          targetFocus = [0, 0, 0];
          break;
        case "motion":
          rotating = !rotating;
          syncMotion();
          break;
      }
      requestFrame();
    }),
  );
  reduced.addEventListener("change", () => {
    if (reduced.matches) rotating = false;
    syncMotion();
    requestFrame();
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) requestFrame();
  });
  const dialog = document.createElement("dialog");
  dialog.className = "atlas-dialog";
  dialog.setAttribute("aria-label", "Expanded civilization atlas");
  const close = document.createElement("button");
  close.type = "button";
  close.className = "atlas-close";
  close.textContent = "Close ×";
  dialog.append(close);
  document.body.append(dialog);
  let marker;
  section.querySelector(".atlas-expand").addEventListener("click", () => {
    readingPosition = reading.scrollTop;
    marker = document.createComment("atlas location");
    section.replaceWith(marker);
    dialog.append(section);
    section.classList.add("expanded");
    document.body.style.overflow = "hidden";
    dialog.showModal();
    size();
    reading.scrollTop = readingPosition;
  });
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    if (marker) {
      marker.replaceWith(section);
      section.classList.remove("expanded");
      document.body.style.overflow = "";
      size();
      reading.scrollTop = readingPosition;
      section.querySelector(".atlas-expand").focus({ preventScroll: true });
    }
  });
  choose("geography");
  syncMotion();
  return section;
}
