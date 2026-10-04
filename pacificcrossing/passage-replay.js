import { trackPoints, trackMeta } from "./track.js";

// This archive never requests new fixes or follows the current clock.
const start = Date.parse("2026-09-13T00:00:00Z") / 1000;
const end = Date.parse("2026-09-30T00:00:00Z") / 1000;
export const passagePoints = trackPoints.filter(
  (point) => point[2] >= start && point[2] < end,
);

export function createPassageReplay(host) {
  if (!host || !passagePoints.length) return;
  host.innerHTML = `<div class="replay-topline"><span>ATALANTA · PASSAGE ARCHIVE</span><span>13—29 SEPTEMBER 2026</span></div>
    <svg class="replay-chart" viewBox="90 95 580 340" role="img" aria-labelledby="replay-title replay-description">
      <title id="replay-title">September 13–29, Honolulu to Monterey</title>
      <desc id="replay-description">Archived GPS positions recorded by PredictWind. Use the time slider or play button to retrace the crossing. Dashed lines mark missing recordings.</desc>
      <defs><pattern id="replay-grid" width="125" height="130" patternUnits="userSpaceOnUse"><path d="M125 0H0V130" fill="none" stroke="#97b5bb" stroke-opacity=".09" stroke-width=".6"/></pattern></defs>
      <rect x="90" y="95" width="580" height="340" fill="url(#replay-grid)"/>
      <image href="./coastline.svg" width="760" height="500" opacity=".6"/>
      <g class="replay-map-label"><text x="100" y="126">40° N</text><text x="100" y="256">30° N</text><text x="100" y="386">20° N</text><text x="135" y="430">160° W</text><text x="385" y="430">140° W</text><text x="625" y="430">120° W</text></g>
      <text class="replay-ocean" x="385" y="323" text-anchor="middle">NORTH PACIFIC</text>
      <path class="replay-route"/><path class="replay-gaps"/><path class="replay-traveled"/>
      <g class="replay-ports"><circle cx="152" cy="373" r="3"/><text x="152" y="392">HONOLULU</text><circle cx="601" cy="174" r="3"/><text x="601" y="159" text-anchor="middle">MONTEREY</text></g>
      <g class="replay-boat"><circle r="11" fill="#d4e8d6" opacity=".1"/><circle r="5" fill="none" stroke="#d9e9dc" stroke-opacity=".5"/><circle r="2.5" fill="#f0f5e9"/></g>
    </svg>
    <div class="replay-readout"><div><span class="replay-label">RECORDED FIX / UTC</span><output class="replay-date"></output></div><output class="replay-coordinates"></output></div>
    <div class="replay-controls"><button class="replay-play" type="button" aria-label="Play passage replay" aria-pressed="false">▶</button><div class="replay-timeline"><label class="sr-only" for="passage-time">Passage date and time</label><input id="passage-time" type="range" step="1"/><div class="replay-range"><span>13 SEP</span><span>21 SEP</span><span>29 SEP</span></div></div></div>`;
  const $ = (selector) => host.querySelector(selector);
  const projected = passagePoints.map(([lat, lon]) => [
    (lon + 170) * 12.5,
    (50 - lat) * 13,
  ]);
  const commands = [],
    gaps = [];
  projected.forEach(([x, y], i) => {
    const gap =
      i > 0 &&
      passagePoints[i][2] - passagePoints[i - 1][2] >
        trackMeta.gapThresholdSeconds;
    commands.push(
      `${i === 0 || gap ? "M" : "L"}${x.toFixed(3)},${y.toFixed(3)}`,
    );
    if (gap) gaps.push(`M${projected[i - 1].join(",")}L${x},${y}`);
  });
  $(".replay-route").setAttribute("d", commands.join(""));
  $(".replay-gaps").setAttribute("d", gaps.join(""));
  const slider = $("#passage-time"),
    button = $(".replay-play");
  slider.min = passagePoints[0][2];
  slider.max = passagePoints.at(-1)[2];
  slider.value = slider.max;
  const formatter = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    hourCycle: "h23",
  });
  let playing = false,
    frame = 0,
    previous = 0;
  function render() {
    const time = Number(slider.value);
    let low = 0,
      high = passagePoints.length - 1;
    while (low < high) {
      const mid = Math.ceil((low + high) / 2);
      if (passagePoints[mid][2] <= time) low = mid;
      else high = mid - 1;
    }
    const [lat, lon, timestamp] = passagePoints[low];
    $(".replay-traveled").setAttribute(
      "d",
      commands.slice(0, low + 1).join(""),
    );
    $(".replay-boat").setAttribute(
      "transform",
      `translate(${projected[low].join(" ")})`,
    );
    $(".replay-date").textContent = formatter.format(timestamp * 1000);
    $(".replay-coordinates").textContent =
      `${lat.toFixed(3)}° N · ${Math.abs(lon).toFixed(3)}° W`;
    slider.setAttribute(
      "aria-valuetext",
      `${formatter.format(timestamp * 1000)} UTC, last recorded position`,
    );
  }
  function pause() {
    playing = false;
    cancelAnimationFrame(frame);
    button.textContent = "▶";
    button.setAttribute("aria-label", "Play passage replay");
    button.setAttribute("aria-pressed", "false");
  }
  function tick(now) {
    if (!playing) return;
    const elapsed = Math.min(now - previous, 100);
    previous = now;
    slider.value = Math.min(
      Number(slider.max),
      Number(slider.value) +
        (elapsed * (Number(slider.max) - Number(slider.min))) / 60000,
    );
    render();
    if (Number(slider.value) >= Number(slider.max)) pause();
    else frame = requestAnimationFrame(tick);
  }
  button.addEventListener("click", () => {
    if (playing) return pause();
    if (Number(slider.value) >= Number(slider.max)) slider.value = slider.min;
    playing = true;
    button.textContent = "Ⅱ";
    button.setAttribute("aria-label", "Pause passage replay");
    button.setAttribute("aria-pressed", "true");
    previous = performance.now();
    render();
    frame = requestAnimationFrame(tick);
  });
  slider.addEventListener("input", () => {
    pause();
    render();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pause();
  });
  new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) pause();
  }).observe(host);
  render();
}
