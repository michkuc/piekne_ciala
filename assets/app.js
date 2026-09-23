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

  const ensureAgeGate = () => {
    if (localStorage.getItem("pc-age-ok")) return;
    let gate = qs("#age-gate");
    if (!gate) {
      gate = document.createElement("div");
      gate.id = "age-gate";
      gate.className = "age-gate";
      gate.setAttribute("role", "dialog");
      gate.setAttribute("aria-modal", "true");
      gate.setAttribute("aria-labelledby", "age-title");
      gate.innerHTML = `<div class="age-box">
        <span class="eyebrow">18+</span>
        <h2 id="age-title">Treści dla dorosłych</h2>
        <p>Projekt zawiera dojrzałe tematy, erotyczne napięcie i mocny język. Potwierdź pełnoletność.</p>
        <div class="age-actions">
          <button class="btn primary" data-age-yes>Jestem pełnoletni/a</button>
          <button class="btn ghost" data-age-no>Wyjdź</button>
        </div>
      </div>`;
      document.body.appendChild(gate);
    }
    gate.classList.add("show");
    document.body.classList.add("modal-open");
    const yes = gate.querySelector("[data-age-yes]");
    yes?.focus();
    yes?.addEventListener("click", () => {
      localStorage.setItem("pc-age-ok", "1");
      gate.classList.remove("show");
      document.body.classList.remove("modal-open");
    });
    gate.querySelector("[data-age-no]")?.addEventListener("click", () => {
      location.href = "https://www.google.com";
    });
  };

  ensureAgeGate();

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

  const renderCard = (song) => {
    const lyricsReady = song.lyrics === "verified";
    return `<a class="song-card reveal" href="${storyUrl(song)}" aria-label="${esc(song.title)}">
      <div class="song-cover">
        <img loading="lazy" referrerpolicy="no-referrer" src="${PC.drive(song.cover, 900)}" alt="Okładka ${esc(song.title)}">
        <span class="card-status">${lyricsReady ? "tekst 1:1" : "visual chapter"}</span>
      </div>
      <div class="song-meta">
        <span class="song-no">${String(song.n).padStart(2, "0")}</span>
        <div><h3>${esc(song.title)}</h3><p>${esc(song.version || song.tag)}</p></div>
      </div>
    </a>`;
  };

  const songGrid = qs("#song-grid");
  if (songGrid) songGrid.innerHTML = PC_SONGS.map(renderCard).join("");

  const stats = qs("#collection-stats");
  if (stats) {
    const verified = PC_SONGS.filter((song) => song.lyrics === "verified").length;
    stats.textContent = `${PC_SONGS.length} historii · ${verified} tekstów archiwalnych 1:1`;
  }

  const featured = qs("#featured-songs");
  if (featured) {
    const picks = [PC_SONGS[0], PC_SONGS[2], PC_SONGS[6], PC_SONGS[12]];
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
      <audio preload="metadata" src="${esc(song.audio)}" data-audio></audio>
    </div>`;
  };

  const initPlayer = (root) => {
    const audio = qs("[data-audio]", root);
    if (!audio) return;
    const toggleButton = qs("[data-audio-toggle]", root);
    const range = qs("[data-audio-range]", root);
    const time = qs("[data-audio-time]", root);
    const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
    toggleButton?.addEventListener("click", async () => {
      if (audio.paused) await audio.play(); else audio.pause();
    });
    audio.addEventListener("play", () => { toggleButton.textContent = "❚❚"; });
    audio.addEventListener("pause", () => { toggleButton.textContent = "▶"; });
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
    const song = PC.getSong(querySlug || routeSlug) || PC_SONGS[0];
    const lyric = window.PC_LYRICS?.[song.slug];
    const previous = PC_SONGS[(song.n - 2 + PC_SONGS.length) % PC_SONGS.length];
    const next = PC_SONGS[song.n % PC_SONGS.length];

    document.title = `${song.title} — Piękne Ciała`;
    qs('meta[name="description"]')?.setAttribute("content", song.story);

    songRoot.innerHTML = `
      <section class="song-art" style="--song-hero:url('${PC.drive(song.hero)}')">
        <div class="song-art-shade"></div>
        <div class="song-art-label wrap">
          <span>PIĘKNE CIAŁA · ${String(song.n).padStart(2, "0")}</span>
          <h1>${esc(song.title)}</h1>
          <p>${esc(song.version || song.tag)}</p>
        </div>
      </section>
      <section class="song-body wrap">
        <div class="cover-large reveal"><img referrerpolicy="no-referrer" src="${PC.drive(song.cover, 1200)}" alt="Okładka ${esc(song.title)}"></div>
        <div class="song-copy reveal">
          <span class="eyebrow">VISUAL CHAPTER · ${String(song.n).padStart(2, "0")}</span>
          <h2 class="song-title">${esc(song.title)}</h2>
          <p class="version">${esc(song.version || song.tag)}</p>
          <p>${esc(song.story)}</p>
          <div class="hero-actions">
            ${song.audio ? `<button class="btn primary" type="button" data-start-audio>Odtwórz utwór</button>` : `<span class="audio-pending">Audio · final master w przygotowaniu</span>`}
            <a class="btn ghost" href="/music.html">Wszystkie historie</a>
          </div>
          <div class="fact-line"><span>Klimat</span><strong>${esc(song.tag)}</strong></div>
          <div class="fact-line"><span>Wersja</span><strong>${esc(song.version || "Original")}</strong></div>
          <div class="fact-line"><span>Tekst</span><strong>${lyric ? "pełny zapis 1:1" : "do odzyskania z archiwum"}</strong></div>
        </div>
      </section>
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
          ${lyric ? `<div class="lyrics-head"><div><span class="eyebrow">FULL VERIFIED · ARCHIVE ${String(lyric.archiveNumber).padStart(2, "0")}</span><h2>${esc(lyric.archiveTitle)}</h2></div><p>Treść zachowana 1:1 z archiwum projektu.</p></div><div class="lyrics-text">${lyricsMarkup(lyric)}</div>` : `<div class="missing-copy"><span class="eyebrow">ARCHIVE STATUS</span><h2>Tekst czeka na odzyskanie.</h2><p>Pełna wersja 1:1 nie występuje w aktualnym archiwum. Nie rekonstruujemy jej z pamięci ani fragmentów.</p></div>`}
        </div>
        <div class="chapter-panel credits-panel" id="panel-credits" role="tabpanel" aria-labelledby="tab-credits" hidden>
          <span class="eyebrow">CREDITS</span>
          <h2>Jedna noc. Jeden narrator.</h2>
          <dl>
            <div><dt>Projekt</dt><dd>Piękne Ciała · Night Stories</dd></div>
            <div><dt>Narrator</dt><dd>Dojrzały męski głos · jeden bohater całej serii</dd></div>
            <div><dt>Rozdział</dt><dd>${String(song.n).padStart(2, "0")} / ${PC_SONGS.length}</dd></div>
            <div><dt>Wersja</dt><dd>${esc(song.version || "Original")}</dd></div>
            <div><dt>Status tekstu</dt><dd>${lyric ? "Zweryfikowany zapis 1:1" : "Do odzyskania 1:1"}</dd></div>
          </dl>
        </div>
      </section>
      <nav class="song-nav wrap" aria-label="Nawigacja między historiami">
        <a href="${storyUrl(previous)}"><span>← poprzednia historia</span><strong>${esc(previous.title)}</strong></a>
        <a href="${storyUrl(next)}" class="next"><span>następna historia →</span><strong>${esc(next.title)}</strong></a>
      </nav>
      ${renderPlayer(song)}`;

    initTabs(qs("[data-tabs]", songRoot));
    initPlayer(songRoot);
    qs("[data-start-audio]", songRoot)?.addEventListener("click", () => qs("[data-audio-toggle]", songRoot)?.click());
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
