export function setupWeatherLayers() {
  const tabs = [...document.querySelectorAll("[data-weather]")];
  const weather = document.querySelector("#weather-map");
  const replay = document.querySelector("#passage-replay");
  const frame = weather.querySelector("iframe");
  let layer = "Wind";
  function select(tab) {
    const next = tab.dataset.weather;
    tabs.forEach((button) => {
      button.setAttribute("aria-selected", String(button === tab));
      button.tabIndex = button === tab ? 0 : -1;
    });
    const isRoute = next === "route";
    weather.hidden = isRoute;
    replay.hidden = !isRoute;
    document.querySelector("#weather-note").hidden = isRoute;
    document.querySelector("#route-note").hidden = !isRoute;
    if (isRoute) return;
    const play = replay.querySelector('[aria-label="Pause passage replay"]');
    play?.click();
    weather.setAttribute("aria-labelledby", tab.id);
    if (next !== layer) {
      const url = new URL("https://www.predictwind.com/tracking/Atalanta1");
      url.search = new URLSearchParams({
        layer: next,
        symbol: "WindStreamlines",
        routing: "false",
      }).toString();
      frame.src = url.href;
      frame.title = `PredictWind ${next === "Current" ? "ocean current" : "wind"} map for Atalanta`;
      layer = next;
    }
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(tab));
    tab.addEventListener("keydown", (event) => {
      let index;
      if (event.key === "ArrowRight") index = (i + 1) % tabs.length;
      else if (event.key === "ArrowLeft")
        index = (i + tabs.length - 1) % tabs.length;
      else if (event.key === "Home") index = 0;
      else if (event.key === "End") index = tabs.length - 1;
      else return;
      event.preventDefault();
      tabs[index].focus();
      select(tabs[index]);
    });
  });
}
