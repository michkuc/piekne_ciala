/* Local-only playlist state. Never stores access tokens or media URLs. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.PC_QUEUE = api;
})(typeof window === "undefined" ? null : window, function () {
  "use strict";
  const KEY = "pc-playlist-v1";

  const slugs = (entries, catalog) => {
    const valid = new Set(catalog.map(song => song.slug));
    const seen = new Set();
    if (!Array.isArray(entries)) return [];
    return entries.filter((slug) => {
      if (typeof slug !== "string" || !valid.has(slug) || seen.has(slug)) return false;
      seen.add(slug);
      return true;
    }).slice(0, catalog.length);
  };

  const load = (storage, catalog) => {
    try {
      const stored = JSON.parse(storage.getItem(KEY));
      if (!stored || stored.version !== 1) return null;
      const saved = slugs(stored.queue, catalog);
      const selected = saved.includes(stored.current) ? stored.current : null;
      return {
        queue: saved,
        current: selected,
        repeat: ["off", "all", "one"].includes(stored.repeat) ? stored.repeat : "off",
        time: selected && Number.isFinite(stored.time) && stored.time >= 0 && stored.time < 43200 ? stored.time : 0
      };
    } catch { return null; }
  };

  const save = (storage, state, catalog) => {
    try {
      const queue = slugs(state.queue, catalog);
      storage.setItem(KEY, JSON.stringify({
        version: 1,
        queue,
        current: queue.includes(state.current) ? state.current : null,
        repeat: ["off", "all", "one"].includes(state.repeat) ? state.repeat : "off",
        time: Number.isFinite(state.time) && state.time >= 0 ? Math.min(43199, state.time) : 0
      }));
      return true;
    } catch { return false; }
  };

  const fromLink = (value, catalog) => {
    if (typeof value !== "string" || value.length > 1600) return [];
    return slugs(value.split(","), catalog);
  };

  const link = (queue, catalog) => slugs(queue, catalog).join(",");

  return {KEY, slugs, load, save, fromLink, link};
});
