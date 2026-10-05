import { dayMedia, shoreMedia } from "./media.js?v=33";
import { createCivilizationMap } from "./civilization.js?v=19";
import { trackPoints, trackMeta } from "./track.js";
import { createPassageReplay } from "./passage-replay.js?v=12";
import { setupWeatherLayers } from "./weather-layers.js?v=14";
import { createSeaScore } from "./sea-score.js?v=40";
createPassageReplay(document.querySelector("#passage-replay"));
setupWeatherLayers();
const $ = (selector) => document.querySelector(selector);
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const dialog = $("#media-dialog");
let lastMediaTrigger;
let dialogItems = [],
  dialogIndex = 0;
function openMedia(item, trigger, collection = [item], index = 0) {
  dialogItems = collection;
  dialogIndex = index;
  lastMediaTrigger = trigger;
  const el = document.createElement(item.video ? "video" : "img");
  el.src = `./media/${item.file}.${item.video ? "mp4" : "jpg"}?v=11`;
  if (item.video) {
    el.controls = true;
    el.muted = Boolean(item.muted);
    el.defaultMuted = Boolean(item.muted);
    el.playsInline = true;
    el.loop = true;
    el.poster = `./media/${item.file}.jpg?v=11`;
    el.setAttribute("aria-label", item.alt);
  } else {
    el.alt = item.alt;
    if (item.cropSky) el.className = "media-crop-sky";
  }
  $("#media-stage").replaceChildren(el);
  $("#media-caption").textContent = item.caption;
  if (!dialog.open) {
    dialog.showModal();
    document.querySelectorAll("video").forEach((video) => {
      if (video !== el) video.pause();
    });
  }
  $("#media-previous").disabled = index === 0;
  $("#media-next").disabled = index === collection.length - 1;
  document.body.style.overflow = "hidden";
  if (item.video) el.play().catch(() => {});
}
function mediaButton(item, className, index = 0, collection = [item]) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `${className}${item.video ? " video" : ""}`;
  button.setAttribute(
    "aria-label",
    `${item.video ? "Watch" : "Enlarge"}: ${item.caption}`,
  );
  const img = document.createElement("img");
  img.src = `./media/${item.file}.jpg?v=11`;
  img.alt = item.alt;
  if (item.file === "moon") img.style.objectPosition = "50% 20%";
  img.loading = "lazy";
  img.decoding = "async";
  button.append(img);
  const caption = document.createElement("span");
  caption.textContent = item.caption;
  button.append(caption);
  button.addEventListener("click", () =>
    openMedia(item, button, collection, index),
  );
  return button;
}
$(".dialog-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) {
    const rect = dialog.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      dialog.close();
  }
});
dialog.addEventListener("close", () => {
  const video = dialog.querySelector("video");
  if (video) video.pause();
  $("#media-stage").replaceChildren();
  document.body.style.overflow = "";
  lastMediaTrigger?.focus({ preventScroll: true });
  resumeInlineVideos();
});

// Never fetch motion footage until motion is allowed; the poster is the fallback.
const hero = $("#hero-film");
const motionButton = $("#motion-toggle");
let motionWanted = !reducedMotion.matches && !navigator.connection?.saveData;
function loadHero() {
  const source = hero.querySelector("source");
  if (!source.hasAttribute("src")) {
    source.src = source.dataset.src;
    hero.load();
  }
}
function syncMotionButton() {
  motionButton.textContent = hero.paused ? "▶" : "Ⅱ";
  motionButton.setAttribute(
    "aria-label",
    hero.paused ? "Play background video" : "Pause background video",
  );
  motionButton.title = motionButton.getAttribute("aria-label");
  motionButton.setAttribute("aria-pressed", String(!hero.paused));
}
hero.addEventListener("play", syncMotionButton);
hero.addEventListener("pause", syncMotionButton);
motionButton.addEventListener("click", () => {
  motionWanted = hero.paused;
  if (motionWanted) {
    loadHero();
    hero.play().catch(syncMotionButton);
  } else hero.pause();
});
new IntersectionObserver(
  ([entry]) => {
    if (
      entry.isIntersecting &&
      motionWanted &&
      !document.hidden &&
      !dialog.open
    ) {
      loadHero();
      hero.play().catch(syncMotionButton);
    } else hero.pause();
  },
  { threshold: 0.05 },
).observe(hero);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) hero.pause();
  else if (
    motionWanted &&
    !dialog.open &&
    hero.getBoundingClientRect().bottom > 0
  )
    hero.play().catch(syncMotionButton);
});
reducedMotion.addEventListener("change", () => {
  if (reducedMotion.matches) {
    motionWanted = false;
    hero.pause();
  }
});

function closeMobileChart() {
  if (innerWidth > 700) return;
  $(".chart-panel").classList.remove("map-open");
  $("#chart-toggle").setAttribute("aria-expanded", "false");
  $("#chart-toggle").textContent = "View chart ↗";
}
async function buildJournal() {
  const response = await fetch("./entries.json?v=36");
  if (!response.ok) throw new Error("Could not load the journal");
  const manuscript = await response.json();
  const essayResponse = await fetch("./civilization-essay.json?v=21");
  if (!essayResponse.ok) throw new Error("Could not load the essay");
  const civilization = await essayResponse.json();
  const entries = manuscript.filter((entry) => entry.day !== 28);
  const shoreResponse = await fetch("./after-landfall.json?v=24");
  if (shoreResponse.ok) {
    const shore = await shoreResponse.json();
    $("#homeward-title").textContent = shore.title;
    const shoreCopy = $("#homeward-copy");
    shoreCopy.replaceChildren();
    for (const paragraph of shore.paragraphs) {
      const p = document.createElement("p");
      p.textContent = paragraph;
      shoreCopy.append(p);
    }
  }
  const shoreGallery = createDailyGallery(shoreMedia, "shore");
  shoreGallery.setAttribute("aria-label", "After landfall film");
  $("#homeward").append(shoreGallery);
  if (civilization) {
    $("#civilization-map").replaceChildren(createCivilizationMap(civilization));
  }
  const container = $("#entries");
  container.replaceChildren();
  const course = $("#course");
  const traveled = $("#course-traveled");
  const projected = trackPoints.map(([lat, lng]) => ({
    x: (lng + 170) * 12.5,
    y: (50 - lat) * 13,
  }));
  const cumulative = [0];
  let path = "",
    gaps = "";
  projected.forEach((point, i) => {
    const gap =
      i > 0 &&
      trackPoints[i][2] - trackPoints[i - 1][2] > trackMeta.gapThresholdSeconds;
    path += `${i === 0 || gap ? "M" : "L"}${point.x},${point.y}`;
    if (i > 0) {
      const previous = projected[i - 1];
      cumulative.push(
        cumulative[i - 1] +
          (gap ? 0 : Math.hypot(point.x - previous.x, point.y - previous.y)),
      );
      if (gap) gaps += `M${previous.x},${previous.y}L${point.x},${point.y}`;
    }
  });
  course.setAttribute("d", path);
  course.removeAttribute("stroke-dasharray");
  traveled.setAttribute("d", path);
  $("#course-gaps").setAttribute("d", gaps);
  const dailyFixes = {};
  trackPoints.forEach((point, i) => {
    const day = new Date((point[2] - 10 * 3600) * 1000).getUTCDate();
    dailyFixes[day] = i;
  });
  const length = course.getTotalLength();
  traveled.style.strokeDasharray = `${length} ${length}`;
  const articles = [],
    dateLinks = [],
    chartLinks = [];
  entries.forEach((entry, index) => {
    const article = document.createElement("article");
    article.className = "entry";
    article.id = `day-${entry.day}`;
    article.setAttribute("aria-labelledby", `title-${entry.day}`);
    const top = document.createElement("div");
    top.className = "entry-top";
    top.innerHTML = `<span>SEPTEMBER ${entry.day}, 2026</span><span>LOG ${String(index + 1).padStart(2, "0")}</span>`;
    const title = document.createElement("h2");
    title.id = `title-${entry.day}`;
    title.textContent = entry.title;
    const place = document.createElement("div");
    place.className = "entry-location";
    place.textContent = entry.location;
    const copy = document.createElement("div");
    copy.className = "entry-copy";
    if (entry.language) {
      title.lang = entry.language;
      copy.lang = entry.language;
    }
    entry.paragraphs.forEach((paragraph) => {
      const p = document.createElement("p");
      let cursor = 0;
      for (const match of paragraph.matchAll(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g)) {
        p.append(paragraph.slice(cursor, match.index));
        const reference = document.createElement("a");
        reference.textContent = match[1];
        reference.href = match[2];
        p.append(reference);
        cursor = match.index + match[0].length;
      }
      p.append(paragraph.slice(cursor));
      copy.append(p);
    });
    article.append(top, title, place, copy);
    if (entry.day === 17) article.append(createSeaScore());
    if (dayMedia[entry.day]?.length)
      article.append(createDailyGallery(dayMedia[entry.day], entry.day));
    container.append(article);
    articles.push(article);
    const link = document.createElement("a");
    link.href = `#day-${entry.day}`;
    link.textContent = entry.day;
    link.setAttribute("aria-label", `September ${entry.day}: ${entry.title}`);
    link.addEventListener("click", closeMobileChart);
    $("#date-nav").append(link);
    dateLinks.push(link);
    // Last recorded position on this calendar day in Hawaiʻi time (UTC−10).
    const point = projected[dailyFixes[entry.day] ?? trackPoints.length - 1];
    const svgLink = document.createElementNS("http://www.w3.org/2000/svg", "a");
    svgLink.setAttribute("href", `#day-${entry.day}`);
    svgLink.setAttribute(
      "aria-label",
      `Read September ${entry.day}: ${entry.title}`,
    );
    const dot = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle",
    );
    dot.setAttribute("cx", point.x);
    dot.setAttribute("cy", point.y);
    dot.setAttribute("r", "10");
    dot.setAttribute("fill", "transparent");
    const visibleDot = dot.cloneNode();
    visibleDot.setAttribute("r", "2");
    visibleDot.setAttribute("fill", "#a9b6b5");
    svgLink.addEventListener("click", closeMobileChart);
    svgLink.append(dot, visibleDot);
    $("#day-points").append(svgLink);
    chartLinks.push(svgLink);
  });
  let active = -1;
  function setActive(index) {
    if (index === active) return;
    active = index;
    const entry = entries[index];
    dateLinks.forEach((link, i) =>
      link.setAttribute("aria-current", String(i === active)),
    );
    chartLinks.forEach((link, i) =>
      link.setAttribute("aria-current", String(i === active)),
    );
    if (innerWidth <= 700) {
      const nav = $("#date-nav"),
        link = dateLinks[index];
      nav.scrollLeft +=
        link.getBoundingClientRect().left -
        nav.getBoundingClientRect().left -
        nav.clientWidth / 2 +
        link.clientWidth / 2;
    }
    $("#entry-count").textContent =
      `${String(index + 1).padStart(2, "0")} / ${entries.length}`;
    $("#chart-day").textContent = `${entry.day} september`;
    $("#chart-place").textContent = entry.location.split("\n")[0];
    const fixIndex = dailyFixes[entry.day] ?? trackPoints.length - 1;
    const fix = trackPoints[fixIndex];
    const distance = cumulative[fixIndex];
    const point = projected[fixIndex];
    const fixDate = new Date((fix[2] - 10 * 3600) * 1000);
    const fixTime = `${String(fixDate.getUTCHours()).padStart(2, "0")}:${String(fixDate.getUTCMinutes()).padStart(2, "0")}`;
    $("#chart-fix").textContent =
      `${fix[0].toFixed(3)}° N · ${Math.abs(fix[1]).toFixed(3)}° W\nLAST FIX · ${fixTime} HST (UTC−10)`;
    if (entry.day === 29)
      $("#chart-fix").textContent =
        `${fix[0].toFixed(3)}° N · ${Math.abs(fix[1]).toFixed(3)}° W\nARRIVAL FIX · 29 SEP 07:27 UTC`;
    traveled.style.strokeDashoffset = String(length - distance);
    $("#vessel").setAttribute("transform", `translate(${point.x} ${point.y})`);
    $("#previous-day").disabled = index === 0;
    $("#next-day").disabled = index === entries.length - 1;
  }
  function updateFromScroll() {
    const threshold =
      innerWidth <= 700
        ? $(".chart-panel").getBoundingClientRect().height + 100
        : innerHeight * 0.4;
    let index = 0;
    for (let i = 0; i < articles.length; i++) {
      if (articles[i].getBoundingClientRect().top <= threshold) index = i;
    }
    setActive(index);
  }
  let pending = false;
  window.addEventListener(
    "scroll",
    () => {
      if (!pending) {
        pending = true;
        requestAnimationFrame(() => {
          updateFromScroll();
          pending = false;
        });
      }
    },
    { passive: true },
  );
  window.addEventListener("resize", updateFromScroll);
  $("#previous-day").addEventListener("click", () => {
    if (active > 0) location.hash = `day-${entries[active - 1].day}`;
  });
  $("#next-day").addEventListener("click", () => {
    if (active < entries.length - 1)
      location.hash = `day-${entries[active + 1].day}`;
  });
  setActive(0);
  window.addEventListener("hashchange", () => {
    if (location.hash !== "#day-28") return;
    history.replaceState(null, "", "#civilization");
    $("#civilization").scrollIntoView({ behavior: "instant" });
  });
  if (location.hash === "#day-28")
    history.replaceState(null, "", "#civilization");
  if (
    /^#(?:day-\d+|sea-score|homeward|tracking|civilization(?:-atlas)?)$/.test(
      location.hash,
    )
  )
    document
      .getElementById(location.hash.slice(1))
      ?.scrollIntoView({ behavior: "instant" });
  updateFromScroll();
}
buildJournal().catch(() => {
  $("#entries").innerHTML =
    '<p class="loading-note">The logbook could not open. <a href="./journal.txt">Read the complete journal →</a></p>';
});

$("#chart-toggle").addEventListener("click", () => {
  const expanded = $(".chart-panel").classList.toggle("map-open");
  $("#chart-toggle").setAttribute("aria-expanded", String(expanded));
  $("#chart-toggle").textContent = expanded ? "Hide chart ↙" : "View chart ↗";
});

const visibleInlineVideos = new Set();
function playInlineVideo(video) {
  if (
    document.hidden ||
    dialog.open ||
    reducedMotion.matches ||
    navigator.connection?.saveData
  )
    return;
  video.muted = true;
  video.play().catch(() => {});
}
function resumeInlineVideos() {
  visibleInlineVideos.forEach(playInlineVideo);
}
const inlineVideoObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      const video = entry.target;
      if (entry.isIntersecting && entry.intersectionRatio >= 0.2) {
        if (!visibleInlineVideos.has(video)) {
          visibleInlineVideos.add(video);
          playInlineVideo(video);
        }
      } else {
        visibleInlineVideos.delete(video);
        video.pause();
      }
    }
  },
  { threshold: [0, 0.2] },
);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) visibleInlineVideos.forEach((video) => video.pause());
  else resumeInlineVideos();
});
reducedMotion.addEventListener("change", () => {
  if (reducedMotion.matches)
    visibleInlineVideos.forEach((video) => video.pause());
  else resumeInlineVideos();
});
window.addEventListener("pagehide", () => {
  visibleInlineVideos.forEach((video) => video.pause());
});
function createDailyGallery(items, day) {
  const gallery = document.createElement("section");
  gallery.className = "daily-gallery";
  gallery.setAttribute("aria-label", `September ${day} photographs and films`);
  gallery.innerHTML =
    '<div class="gallery-stage" aria-live="polite"></div><div class="gallery-controls"><button type="button" aria-label="Previous photograph or film">←</button><button type="button" aria-label="Next photograph or film">→</button></div>';
  const stage = gallery.querySelector(".gallery-stage");
  const [previous, next] = gallery.querySelectorAll(".gallery-controls button");
  let current = 0;
  function select(index) {
    const oldVideo = stage.querySelector("video");
    if (oldVideo) {
      oldVideo.pause();
      inlineVideoObserver.unobserve(oldVideo);
      visibleInlineVideos.delete(oldVideo);
      oldVideo.removeAttribute("src");
      oldVideo.load();
    }
    current = index;
    const item = items[index];
    gallery.dataset.cover = String(index === 0);
    gallery.style.setProperty(
      "--cover-position",
      item.coverPosition || "50% 50%",
    );
    if (item.video) {
      const figure = document.createElement("figure");
      figure.className = "inline-film";
      const video = document.createElement("video");
      video.src = `./media/${item.file}.mp4?v=11`;
      video.poster = `./media/${item.file}.jpg?v=11`;
      video.controls = true;
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.preload = "none";
      video.loop = true;
      video.setAttribute("aria-label", item.alt);
      const expand = document.createElement("button");
      expand.type = "button";
      expand.className = "film-expand";
      expand.textContent = "↗";
      expand.setAttribute("aria-label", `Expand film: ${item.caption}`);
      expand.addEventListener("click", () => {
        video.pause();
        openMedia(item, expand, items, index);
      });
      const caption = document.createElement("figcaption");
      caption.textContent = item.caption;
      figure.append(video, expand, caption);
      stage.replaceChildren(figure);
      inlineVideoObserver.observe(video);
    } else
      stage.replaceChildren(mediaButton(item, "entry-media", index, items));
    gallery.dataset.file = item.file;
    previous.disabled = index === 0;
    next.disabled = index === items.length - 1;
    if (items.length === 1) {
      previous.hidden = true;
      next.hidden = true;
    }
  }
  previous.addEventListener("click", () => select(current - 1));
  next.addEventListener("click", () => select(current + 1));
  gallery.addEventListener("keydown", (event) => {
    if (event.target.tagName === "VIDEO") return;
    if (event.key === "ArrowRight" && current < items.length - 1) {
      event.preventDefault();
      select(current + 1);
    }
    if (event.key === "ArrowLeft" && current > 0) {
      event.preventDefault();
      select(current - 1);
    }
  });
  select(0);
  return gallery;
}

function stepDialog(direction) {
  const index = dialogIndex + direction;
  if (index < 0 || index >= dialogItems.length) return;
  dialog.querySelector("video")?.pause();
  openMedia(dialogItems[index], lastMediaTrigger, dialogItems, index);
}
$("#media-previous").addEventListener("click", () => stepDialog(-1));
$("#media-next").addEventListener("click", () => stepDialog(1));
dialog.addEventListener("keydown", (event) => {
  if (event.target.tagName === "VIDEO") return;
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    stepDialog(-1);
  }
  if (event.key === "ArrowRight") {
    event.preventDefault();
    stepDialog(1);
  }
});
