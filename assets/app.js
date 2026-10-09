(() => {
  const qs = (selector, context = document) => context.querySelector(selector);
  const qsa = (selector, context = document) => [...context.querySelectorAll(selector)];
  const esc = (value = "") => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
  const storyUrl = (song) => `/stories/${song.slug}`;
  const setPageMeta = ({title, description, canonical, image, type = "website"}) => {
    if (title) document.title = title;
    const upsertMeta = (selector, attributes) => {
      let element = qs(selector);
      if (!element) {
        element = document.createElement("meta");
        document.head.appendChild(element);
      }
      Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    };
    if (description) upsertMeta('meta[name="description"]', {name:"description", content:description});
    if (title) upsertMeta('meta[property="og:title"]', {property:"og:title", content:title});
    if (description) upsertMeta('meta[property="og:description"]', {property:"og:description", content:description});
    upsertMeta('meta[property="og:type"]', {property:"og:type", content:type});
    if (canonical) {
      const absoluteCanonical = canonical.startsWith("http") ? canonical : `${location.origin}${canonical}`;
      let link = qs('link[rel="canonical"]');
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = absoluteCanonical;
      upsertMeta('meta[property="og:url"]', {property:"og:url", content:absoluteCanonical});
    }
    if (image) {
      const absoluteImage = image.startsWith("http") ? image : `${location.origin}${image}`;
      upsertMeta('meta[property="og:image"]', {property:"og:image", content:absoluteImage});
    }
  };

  const ensureAgeGate = async () => {
    try {
      const response = await fetch("/api/access", {cache:"no-store", credentials:"same-origin", headers:{"Accept":"application/json"}});
      if (response.ok && (await response.json()).authenticated) return;
    } catch {}
    location.replace("/login?next=" + encodeURIComponent(location.pathname + location.search + location.hash));
  };

  ensureAgeGate();

  const visitorCount = qs("[data-visitor-count]");
  if (visitorCount) {
    const alreadyCounted = sessionStorage.getItem("pc-visit-counted") === "1";
    fetch("/api/visits", {method: alreadyCounted ? "GET" : "POST", headers:{"Accept":"application/json"}})
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => {
        if (Number.isFinite(data.value)) visitorCount.textContent = new Intl.NumberFormat("pl-PL").format(data.value);
        if (!alreadyCounted) sessionStorage.setItem("pc-visit-counted", "1");
      })
      .catch(() => { visitorCount.textContent = "—"; });
  }

  const lightboxButtons = qsa("[data-lightbox-src]");
  if (lightboxButtons.length) {
    const lightbox = document.createElement("div");
    lightbox.className = "lightbox";
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-modal", "true");
    lightbox.setAttribute("aria-label", "Pełnoekranowy podgląd zdjęcia");
    lightbox.innerHTML = `<button class="lightbox-close" type="button" aria-label="Zamknij podgląd">×</button><div class="lightbox-counter" aria-live="polite"></div><button class="lightbox-nav prev" type="button" aria-label="Poprzednie zdjęcie">‹</button><figure><img alt=""><figcaption></figcaption></figure><button class="lightbox-nav next" type="button" aria-label="Następne zdjęcie">›</button>`;
    document.body.appendChild(lightbox);
    const fullImage = qs("img", lightbox);
    const caption = qs("figcaption", lightbox);
    const counter = qs(".lightbox-counter", lightbox);
    const visibleButtons = () => lightboxButtons.filter((button) => !button.hidden);
    let activeIndex = 0;
    let previousFocus = null;
    const showImage = (index) => {
      const buttons = visibleButtons();
      if (!buttons.length) return;
      activeIndex = (index + buttons.length) % buttons.length;
      const button = buttons[activeIndex];
      fullImage.src = button.dataset.lightboxSrc;
      fullImage.alt = qs("img", button)?.alt || "Zdjęcie z Night Archive";
      caption.textContent = button.dataset.lightboxCaption || "";
      if (counter) counter.textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(buttons.length).padStart(2, "0")}`;
      [activeIndex - 1, activeIndex + 1].forEach((nearIndex) => {
        const nearby = buttons[(nearIndex + buttons.length) % buttons.length];
        const src = nearby?.dataset?.lightboxSrc;
        if (src) { const preload = new Image(); preload.src = src; }
      });
    };
    const openLightbox = (button) => {
      const buttons = visibleButtons();
      const index = buttons.indexOf(button);
      if (index < 0) return;
      previousFocus = document.activeElement;
      showImage(index);
      lightbox.classList.add("show");
      document.body.classList.add("modal-open");
      qs(".lightbox-close", lightbox).focus();
    };
    const closeLightbox = () => {
      lightbox.classList.remove("show");
      document.body.classList.remove("modal-open");
      fullImage.removeAttribute("src");
      previousFocus?.focus?.();
    };
    lightboxButtons.forEach((button) => button.addEventListener("click", () => openLightbox(button)));
    qs(".lightbox-close", lightbox).addEventListener("click", closeLightbox);
    qs(".lightbox-nav.prev", lightbox).addEventListener("click", () => showImage(activeIndex - 1));
    qs(".lightbox-nav.next", lightbox).addEventListener("click", () => showImage(activeIndex + 1));
    lightbox.addEventListener("click", (event) => { if (event.target === lightbox) closeLightbox(); });
    lightbox.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeLightbox();
      }
      if (event.key === "ArrowLeft") showImage(activeIndex - 1);
      if (event.key === "ArrowRight") showImage(activeIndex + 1);
      // Keep keyboard focus inside the fullscreen gallery dialog.
      if (event.key === "Tab") {
        const controls = qsa("button:not([disabled])", lightbox);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    });
    // Swipe photos on phones; ignore vertical scrolling and multi-touch zoom.
    let touchStart = null;
    const figure = qs("figure", lightbox);
    figure.addEventListener("touchstart", (event) => {
      touchStart = event.touches.length === 1
        ? {x:event.touches[0].clientX, y:event.touches[0].clientY}
        : null;
    }, {passive:true});
    figure.addEventListener("touchend", (event) => {
      if (!touchStart || event.changedTouches.length !== 1) return;
      const dx = event.changedTouches[0].clientX - touchStart.x;
      const dy = event.changedTouches[0].clientY - touchStart.y;
      touchStart = null;
      if (Math.abs(dx) < 55 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
      showImage(activeIndex + (dx < 0 ? 1 : -1));
    }, {passive:true});
    figure.addEventListener("touchcancel", () => { touchStart = null; });
  }

  const nav = qs(".nav");
  const toggle = qs(".nav-toggle");
  toggle?.addEventListener("click", () => {
    const open = nav?.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  qsa(".nav a").forEach((link) => link.addEventListener("click", () => {
    nav?.classList.remove("open");
    toggle?.setAttribute("aria-expanded", "false");
  }));

  const page = document.body.dataset.page;
  qsa("[data-nav]").forEach((link) => {
    if (link.dataset.nav === page) link.classList.add("active");
  });

  qsa("[data-bg-id]").forEach((element) => {
    const overlay = element.classList.contains("archive-card")
      ? "linear-gradient(180deg,rgba(5,5,7,.02),rgba(5,5,7,.12) 45%,rgba(5,5,7,.94))"
      : "linear-gradient(90deg,rgba(5,5,7,.94),rgba(5,5,7,.28) 48%,rgba(5,5,7,.36) 72%,rgba(5,5,7,.72))";
    element.style.backgroundImage = `${overlay},url("${PC.drive(element.dataset.bgId)}")`;
  });
  qsa("[data-song-hero]").forEach((element) => {
    const song = PC.getSong(element.dataset.songHero);
    if (!song) return;
    const overlay = "linear-gradient(180deg,rgba(5,5,7,.02),rgba(5,5,7,.12) 45%,rgba(5,5,7,.94))";
    element.style.backgroundImage = `${overlay},url("${PC.drive(song.hero)}")`;
    if (song.artFocus) element.style.backgroundPosition = song.artFocus;
  });

  const renderCard = (song) => {
    const lyricsReady = song.lyrics === "verified";
    const status = song.video ? "TELEDYSK · AUDIO" : song.audio ? "audio dostępne" : (lyricsReady ? "pełny tekst" : "visual chapter");
    return `<a class="song-card reveal" href="${storyUrl(song)}" aria-label="${esc(song.title)}">
      <div class="song-cover">
        <img loading="lazy" referrerpolicy="no-referrer" src="${PC.drive(song.cover, 900)}" style="${song.artFocus ? `object-position:${esc(song.artFocus)}` : ""}" alt="Okładka ${esc(song.title)}">
        <span class="card-status">${status}</span>
        ${song.artFallback ? `<span class="art-note">grafika serii</span>` : ""}
      </div>
      <div class="song-meta">
        <span class="song-no">${String(song.n).padStart(2, "0")}</span>
        <div><h3>${esc(song.title)}</h3><p>${esc(song.version || song.tag)}</p></div>
      </div>
    </a>`;
  };

  const songGrid = qs("#song-grid");
  if (songGrid) songGrid.innerHTML = PC_SONGS.map(renderCard).join("");

  qsa("[data-series-grid]").forEach((grid) => {
    grid.innerHTML = PC_SONGS.filter((song) => song.series === grid.dataset.seriesGrid).map(renderCard).join("");
  });

  const seriesRoot = qs("#series-root");
  if (seriesRoot) {
    const requestedSeries = new URLSearchParams(location.search).get("series");
    const key = location.pathname.includes("za-blisko") || requestedSeries === "close" ? "close" : location.pathname.includes("w-podrozy") || requestedSeries === "travel" ? "travel" : "main";
    const series = PC.series[key];
    const songs = PC_SONGS.filter((song) => song.series === key);
    const heroSlug = key === "close" ? "za-malo-miejsca" : key === "travel" ? "american-girl" : "piekne-ciala";
    const hero = series.hero || PC.getSong(heroSlug).hero;
    const signatures = {
      main:["GROTESKA","EGO","INSTYNKT"],
      travel:["MIASTA","HOTELE","LUKSUS"],
      close:["CISZA","DYSTANS","NAPIĘCIE"]
    };
    const temperatures = {
      main:"DARK GOLD / BURGUND",
      travel:"MIDNIGHT BLUE / HOTEL GOLD",
      close:"STEEL / COLD LIGHT"
    };
    document.body.dataset.series = key;
    seriesRoot.className = `series-page series-page--${key}`;
    setPageMeta({title:`${series.name} — Piękne Ciała`, description:series.description, canonical:series.url, image:PC.drive(hero), type:"website"});
    seriesRoot.innerHTML = `<section class="page-hero series-hero" style="background-image:url('${PC.drive(hero)}')"><div class="series-hero-shade"></div><div class="wrap"><span class="eyebrow">${series.label}</span><h1>${esc(series.name)}</h1><p>${esc(series.description)}</p><div class="series-signature-strip"><span>${temperatures[key]}</span>${signatures[key].map((item)=>`<b>${item}</b>`).join("")}</div></div></section><section class="section wrap series-page-catalog"><div class="section-head"><div><span class="eyebrow">${songs.length} HISTORII</span><h2>Utwory serii</h2></div><a class="btn ghost" href="/music">Cały katalog</a></div><div class="song-grid">${songs.map(renderCard).join("")}</div></section>`;
  }

  const stats = qs("#collection-stats");
  if (stats) {
    const verified = PC_SONGS.filter((song) => song.lyrics === "verified").length;
    const withAudio = PC_SONGS.filter((song) => song.audio).length;
    stats.textContent = `${PC_SONGS.length} historii · ${withAudio} nagrań · ${verified} pełnych tekstów`;
  }

  const featured = qs("#featured-songs");
  if (featured) {
    const picks = [PC_SONGS[0], PC_SONGS[3], PC_SONGS[6], PC_SONGS[19]];
    featured.innerHTML = picks.map((song) => `
      <a class="feature-tile reveal" href="${storyUrl(song)}">
        <img loading="lazy" referrerpolicy="no-referrer" src="${PC.drive(song.hero, 1400)}" alt="Visual chapter ${esc(song.title)}">
        <div><span>${String(song.n).padStart(2, "0")}</span><h3>${esc(song.title)}</h3><p>${esc(song.version || song.tag)}</p></div>
      </a>`).join("");
  }

  const lyricsMarkup = (record) => {
    if (!record?.text) return "";
    return record.text.split(/\n{2,}/).map((block) => {
      const clean = block.trim();
      if (!clean) return "";
      if (clean.startsWith("[") && clean.endsWith("]")) return `<h3>${esc(clean)}</h3>`;
      return `<p>${clean.split("\n").map(esc).join("<br>")}</p>`;
    }).join("");
  };

  const initTabs = (root) => {
    const tabs = qsa("[role=tab]", root);
    const panels = qsa("[role=tabpanel]", root);
    const activate = (tab) => {
      tabs.forEach((item) => {
        const selected = item === tab;
        item.setAttribute("aria-selected", selected ? "true" : "false");
        item.tabIndex = selected ? 0 : -1;
      });
      panels.forEach((panel) => {
        panel.hidden = panel.id !== tab.getAttribute("aria-controls");
      });
    };
    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => activate(tab));
      tab.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
        event.preventDefault();
        const direction = event.key === "ArrowRight" ? 1 : -1;
        const next = tabs[(index + direction + tabs.length) % tabs.length];
        activate(next);
        next.focus();
      });
    });
  };

  const renderPlayer = (song) => {
    if (!song.audio) return "";
    return `<div class="audio-dock" data-audio-dock>
      <button class="audio-toggle" type="button" aria-label="Odtwórz ${esc(song.title)}" data-audio-toggle>▶</button>
      <div class="audio-id"><span>NOW PLAYING</span><strong>${esc(song.title)}</strong></div>
      <input class="audio-range" type="range" min="0" max="100" value="0" aria-label="Postęp utworu" data-audio-range>
      <time data-audio-time>0:00</time>
      <span class="audio-status" data-audio-status aria-live="polite"></span>
      <audio preload="metadata" src="${esc(song.audio)}" data-audio></audio>
    </div>`;
  };

  const initPlayer = (root, song) => {
    const audio = qs("[data-audio]", root);
    if (!audio) return;
    const toggleButton = qs("[data-audio-toggle]", root);
    const range = qs("[data-audio-range]", root);
    const time = qs("[data-audio-time]", root);
    const status = qs("[data-audio-status]", root);
    const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
    toggleButton?.addEventListener("click", async () => {
      if (!audio.paused) {
        audio.pause();
        return;
      }
      if (status) status.textContent = "Ładowanie…";
      try {
        await audio.play();
      } catch {
        if (status) status.textContent = "Nie udało się uruchomić utworu. Spróbuj ponownie.";
      }
    });
    audio.addEventListener("play", () => {
      toggleButton.textContent = "❚❚";
      toggleButton.setAttribute("aria-label", `Wstrzymaj ${song.title}`);
    });
    audio.addEventListener("pause", () => {
      toggleButton.textContent = "▶";
      toggleButton.setAttribute("aria-label", `Odtwórz ${song.title}`);
    });
    audio.addEventListener("waiting", () => { if (status) status.textContent = "Ładowanie…"; });
    audio.addEventListener("canplay", () => { if (status) status.textContent = ""; });
    audio.addEventListener("playing", () => { if (status) status.textContent = ""; });
    audio.addEventListener("error", () => {
      toggleButton.textContent = "▶";
      if (status) status.textContent = "Nie udało się wczytać utworu. Sprawdź połączenie i spróbuj ponownie.";
    });
    audio.addEventListener("timeupdate", () => {
      if (!audio.duration) return;
      range.value = String((audio.currentTime / audio.duration) * 100);
      time.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
    });
    range?.addEventListener("input", () => {
      if (audio.duration) audio.currentTime = (Number(range.value) / 100) * audio.duration;
    });
  };

  const songRoot = qs("#song-root");
  if (songRoot) {
    const path = location.pathname.split("/").filter(Boolean);
    const querySlug = new URLSearchParams(location.search).get("slug");
    const routeSlug = ["song", "story", "stories"].includes(path[0]) ? path[path.length - 1] : "";
    const requestedSlug = querySlug || routeSlug;
    const song = PC.getSong(requestedSlug);
    if (!song) {
      setPageMeta({title:"Nie znaleziono — Piękne Ciała", description:"Ta historia nie istnieje.", canonical:location.pathname});
      songRoot.innerHTML = `<section class="page-hero missing-story"><div class="wrap"><span class="eyebrow">404 · ZŁA NOC</span><h1>Nie ta historia.</h1><p>Ten utwór nie istnieje albo zmienił adres.</p><div class="hero-actions"><a class="btn primary" href="/music">Wróć do muzyki</a><a class="btn ghost" href="/">Strona główna</a></div></div></section>`;
      return;
    }
    const lyric = window.PC_LYRICS?.[song.slug];
    const seriesSongs = PC_SONGS.filter((item) => item.series === song.series);
    const seriesIndex = seriesSongs.findIndex((item) => item.slug === song.slug);
    const previous = seriesSongs[(seriesIndex - 1 + seriesSongs.length) % seriesSongs.length];
    const next = seriesSongs[(seriesIndex + 1) % seriesSongs.length];
    const series = PC.series[song.series];

    setPageMeta({title:`${song.title} — Piękne Ciała`, description:song.story, canonical:storyUrl(song), image:PC.drive(song.hero), type:"article"});

    songRoot.innerHTML = `
      <section class="song-art" style="--song-hero:url('${PC.drive(song.hero)}');${song.artFocus ? `background-position:${esc(song.artFocus)}` : ""}">
        <div class="song-art-shade"></div>
        <div class="song-art-label wrap">
          <span>${esc(series.name)} · ${String(song.n).padStart(2, "0")}</span>
          <h1>${esc(song.title)}</h1>
          <p>${esc(song.version || song.tag)}</p>
          ${song.video ? `<a class="btn primary video-hero-link" href="#teledysk">Obejrzyj teledysk ↓</a>` : ""}
        </div>
      </section>
      <section class="song-body wrap">
        <div class="cover-large reveal"><img referrerpolicy="no-referrer" src="${PC.drive(song.cover, 1200)}" style="${song.artFocus ? `object-position:${esc(song.artFocus)}` : ""}" alt="Okładka ${esc(song.title)}"></div>
        <div class="song-copy reveal">
          <span class="eyebrow">${esc(series.label)} · ${String(song.n).padStart(2, "0")}</span>
          <h2 class="song-title">${esc(song.title)}</h2>
          <p class="version">${esc(song.version || song.tag)}</p>
          <p>${esc(song.story)}</p>
          <div class="hero-actions">
            ${song.audio ? `<button class="btn primary" type="button" data-start-audio>Odtwórz utwór</button>` : `<span class="audio-pending">Audio · final master w przygotowaniu</span>`}
            ${song.audio ? `<a class="btn ghost" href="/playlist?add=${esc(song.slug)}">Dodaj do playlisty</a>` : ""}
            <a class="btn ghost" href="${series.url}">${esc(series.name)}</a>
          </div>
          <div class="fact-line"><span>Klimat</span><strong>${esc(song.tag)}</strong></div>
          <div class="fact-line"><span>Seria</span><strong>${esc(series.name)}</strong></div>
          ${song.artFallback ? `<div class="fact-line"><span>Grafika</span><strong>tymczasowa identyfikacja serii</strong></div>` : ""}
          <div class="fact-line"><span>Wersja</span><strong>${esc(song.version || "Original")}</strong></div>
          <div class="fact-line"><span>Tekst</span><strong>${lyric ? "pełny tekst archiwalny" : "do odzyskania z archiwum"}</strong></div>
        </div>
      </section>
      ${song.video ? `<section class="song-video wrap reveal" id="teledysk" aria-label="Teledysk ${esc(song.title)}"><div class="section-head"><div><span class="eyebrow">OFICJALNY TELEDYSK</span><h2>${esc(song.title)}</h2></div></div><div class="song-video-frame"><video class="song-video-player" controls controlsList="nodownload noremoteplayback" disablePictureInPicture playsinline preload="metadata" poster="${PC.drive(song.hero, 1800)}" aria-label="Teledysk ${esc(song.title)}"><source src="${esc(song.video)}" type="video/mp4">Twoja przeglądarka nie obsługuje odtwarzania wideo.</video></div></section>` : ""}
      <section class="chapter wrap reveal" data-tabs>
        <div class="chapter-tabs" role="tablist" aria-label="Materiały do utworu">
          <button id="tab-story" role="tab" aria-selected="true" aria-controls="panel-story">Historia</button>
          <button id="tab-lyrics" role="tab" aria-selected="false" aria-controls="panel-lyrics" tabindex="-1">Tekst</button>
          <button id="tab-credits" role="tab" aria-selected="false" aria-controls="panel-credits" tabindex="-1">Credits</button>
        </div>
        <div class="chapter-panel" id="panel-story" role="tabpanel" aria-labelledby="tab-story">
          <span class="eyebrow">THE STORY</span>
          <h2>${esc(song.chapterTitle || song.title)}</h2>
          <p>${esc(song.storyLong || song.story)}</p>
        </div>
        <div class="chapter-panel lyrics-panel" id="panel-lyrics" role="tabpanel" aria-labelledby="tab-lyrics" hidden>
          ${lyric ? `<div class="lyrics-head"><div><span class="eyebrow">PEŁNY TEKST · ARCHIWUM ${String(lyric.archiveNumber).padStart(2, "0")}</span><h2>${esc(lyric.archiveTitle)}</h2></div><p>Oryginalna treść zachowana w archiwum projektu.</p></div><div class="lyrics-text">${lyricsMarkup(lyric)}</div>` : `<div class="missing-copy"><span class="eyebrow">STATUS ARCHIWUM</span><h2>Tekst czeka na odzyskanie.</h2><p>Pełnej wersji nie ma w aktualnym archiwum. Nie rekonstruujemy jej z pamięci ani fragmentów.</p></div>`}
        </div>
        <div class="chapter-panel credits-panel" id="panel-credits" role="tabpanel" aria-labelledby="tab-credits" hidden>
          <span class="eyebrow">CREDITS</span>
          <h2>Jedna noc. Jeden narrator.</h2>
          <dl>
            <div><dt>Projekt</dt><dd>${esc(series.name)} · Night Stories</dd></div>
            <div><dt>Narrator</dt><dd>Dojrzały męski głos · jeden bohater całej serii</dd></div>
            <div><dt>Rozdział serii</dt><dd>${String(seriesIndex + 1).padStart(2, "0")} / ${seriesSongs.length}</dd></div>
            <div><dt>Wersja</dt><dd>${esc(song.version || "Original")}</dd></div>
            <div><dt>Status tekstu</dt><dd>${lyric ? "Pełny tekst archiwalny" : "Do odzyskania"}</dd></div>
          </dl>
        </div>
      </section>
      <nav class="song-nav wrap" aria-label="Nawigacja między historiami">
        <a href="${storyUrl(previous)}"><span>← poprzednia historia</span><strong>${esc(previous.title)}</strong></a>
        <a href="${storyUrl(next)}" class="next"><span>następna historia →</span><strong>${esc(next.title)}</strong></a>
      </nav>
      ${renderPlayer(song)}`;

    if (song.audio) document.body.classList.add("has-audio-dock");

    initTabs(qs("[data-tabs]", songRoot));
    initPlayer(songRoot, song);
    qs(".song-video-player", songRoot)?.addEventListener("contextmenu", (event) => event.preventDefault());
    qs("[data-start-audio]", songRoot)?.addEventListener("click", () => qs("[data-audio-toggle]", songRoot)?.click());
  }

  const archiveGrid = qs("[data-archive-grid]");
  const archiveFilterButtons = qsa("[data-archive-filter]");
  if (archiveGrid && archiveFilterButtons.length) {
    const archiveCards = qsa("[data-archive-category]", archiveGrid);
    const status = qs("[data-archive-status]");
    const countLabel = (count) => {
      if (count === 1) return "kadr";
      const lastTwo = count % 100;
      return count % 10 >= 2 && count % 10 <= 4 && (lastTwo < 12 || lastTwo > 14) ? "kadry" : "kadrów";
    };
    const statusLabel = (filter) => {
      const count = archiveCards.filter((card) =>
        filter === "all" || (filter === "selected" ? card.dataset.archiveSelected === "true" : card.dataset.archiveCategory === filter)
      ).length;
      if (filter === "selected") return `${count} wybranych ${countLabel(count)}`;
      if (filter === "all") return `${count} ${countLabel(count)}`;
      return `${filter.replaceAll("-", " ").toUpperCase()} · ${count} ${countLabel(count)}`;
    };
    const hashes = {
      selected:"#gallery",
      all:"#gallery-all",
      night:"#gallery-night",
      city:"#gallery-city",
      travel:"#gallery-travel",
      sport:"#gallery-sport",
      everyday:"#gallery-everyday",
      "after-hours":"#gallery-after-hours"
    };
    const legacy = {
      "archive-night":"night",
      "archive-city":"city",
      "archive-travel":"travel",
      "archive-sport":"sport",
      "archive-everyday":"everyday",
      "archive-after-hours":"after-hours"
    };
    const applyFilter = (filter, {updateHash=true, scroll=false} = {}) => {
      archiveCards.forEach((card) => {
        const visible = filter === "all"
          || (filter === "selected" && card.dataset.archiveSelected === "true")
          || card.dataset.archiveCategory === filter;
        card.hidden = !visible;
      });
      archiveFilterButtons.forEach((button) => {
        const active = button.dataset.archiveFilter === filter;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
      });
      if (status) status.textContent = statusLabel(filter);
      if (updateHash && hashes[filter]) history.replaceState(null, "", hashes[filter]);
      if (scroll) qs("#gallery")?.scrollIntoView({behavior:"smooth", block:"start"});
    };
    archiveFilterButtons.forEach((button) => button.addEventListener("click", () => {
      applyFilter(button.dataset.archiveFilter || "selected", {updateHash:true, scroll:false});
    }));
    const rawHash = location.hash.replace(/^#/, "");
    const fromHash = legacy[rawHash]
      || Object.entries(hashes).find(([,hash]) => hash.slice(1) === rawHash)?.[0]
      || "selected";
    applyFilter(fromHash, {updateHash:false, scroll:false});
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        observer.unobserve(entry.target);
      }
    }), { threshold: 0.08 });
    qsa(".reveal").forEach((element) => observer.observe(element));
  } else {
    qsa(".reveal").forEach((element) => element.classList.add("in"));
  }
})();
