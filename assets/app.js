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
    const status = song.audio ? "audio dostępne" : (lyricsReady ? "tekst 1:1" : "visual chapter");
    return `<a class="song-card reveal" href="${storyUrl(song)}" aria-label="${esc(song.title)}">
      <div class="song-cover">
        <img loading="lazy" referrerpolicy="no-referrer" src="${PC.drive(song.cover, 900)}" alt="Okładka ${esc(song.title)}">
        <span class="card-status">${status}</span>
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
    const withAudio = PC_SONGS.filter((song) => song.audio).length;
    stats.textContent = `${PC_SONGS.length} historii · ${withAudio} nagrań · ${verified} tekstów archiwalnych 1:1`;
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

  const playlistRoot = qs("#playlist-root");
  if (playlistRoot) {
    const availableSongs = PC_SONGS.filter((song) => song.audio);
    const library = qs("[data-track-library]", playlistRoot);
    const queueList = qs("[data-queue-list]", playlistRoot);
    const emptyState = qs("[data-queue-empty]", playlistRoot);
    const audio = qs("[data-playlist-audio]", playlistRoot);
    const title = qs("[data-playlist-title]", playlistRoot);
    const version = qs("[data-playlist-version]", playlistRoot);
    const cover = qs("[data-playlist-cover]", playlistRoot);
    const toggle = qs("[data-playlist-toggle]", playlistRoot);
    const previous = qs("[data-playlist-prev]", playlistRoot);
    const next = qs("[data-playlist-next]", playlistRoot);
    const range = qs("[data-playlist-range]", playlistRoot);
    const time = qs("[data-playlist-time]", playlistRoot);
    const status = qs("[data-playlist-status]", playlistRoot);
    let queue = [];
    let currentIndex = -1;

    const formatTime = (seconds) => {
      const safe = Number.isFinite(seconds) ? seconds : 0;
      return `${Math.floor(safe / 60)}:${String(Math.floor(safe % 60)).padStart(2, "0")}`;
    };

    const renderLibrary = () => {
      library.innerHTML = availableSongs.map((song) => {
        const added = queue.some((item) => item.slug === song.slug);
        return `<div class="track-row">
          <img loading="lazy" referrerpolicy="no-referrer" src="${PC.drive(song.cover, 240)}" alt="">
          <span class="track-number">${String(song.n).padStart(2, "0")}</span>
          <div class="track-copy"><strong>${esc(song.title)}</strong><small>${esc(song.version || song.tag)}</small></div>
          <button class="track-add" type="button" data-add-track="${esc(song.slug)}" aria-label="Dodaj ${esc(song.title)} do playlisty" ${added ? "disabled" : ""}>${added ? "✓" : "+"}</button>
        </div>`;
      }).join("");
    };

    const updateControls = () => {
      const hasQueue = queue.length > 0;
      toggle.disabled = !hasQueue;
      previous.disabled = !hasQueue || currentIndex <= 0;
      next.disabled = !hasQueue || (currentIndex >= queue.length - 1 && currentIndex !== -1);
      qs("[data-clear-queue]", playlistRoot).disabled = !hasQueue;
      qs("[data-add-all]", playlistRoot).disabled = queue.length === availableSongs.length;
    };

    const renderQueue = () => {
      emptyState.hidden = queue.length > 0;
      queueList.innerHTML = queue.map((song, index) => `<li class="queue-item ${index === currentIndex ? "is-current" : ""}">
        <span class="queue-index">${String(index + 1).padStart(2, "0")}</span>
        <img referrerpolicy="no-referrer" src="${PC.drive(song.cover, 240)}" alt="">
        <button class="track-copy queue-play-copy" type="button" data-play-index="${index}" aria-label="Odtwórz ${esc(song.title)}"><strong>${esc(song.title)}</strong><small>${esc(song.version || song.tag)}</small></button>
        <div class="queue-actions">
          <button class="queue-action" type="button" data-move-up="${index}" aria-label="Przesuń ${esc(song.title)} wyżej" ${index === 0 ? "disabled" : ""}>↑</button>
          <button class="queue-action" type="button" data-move-down="${index}" aria-label="Przesuń ${esc(song.title)} niżej" ${index === queue.length - 1 ? "disabled" : ""}>↓</button>
          <button class="queue-action" type="button" data-remove="${index}" aria-label="Usuń ${esc(song.title)} z playlisty">×</button>
        </div>
      </li>`).join("");
      updateControls();
    };

    const resetPlayer = () => {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      currentIndex = -1;
      title.textContent = "Wybierz pierwszy utwór";
      version.textContent = "Playlista tymczasowa";
      cover.hidden = true;
      cover.removeAttribute("src");
      toggle.textContent = "▶";
      range.value = "0";
      time.textContent = "0:00 / 0:00";
      status.textContent = queue.length ? `${queue.length} utworów w kolejce.` : "Kolejka jest pusta.";
      renderQueue();
    };

    const selectTrack = async (index, autoplay = false) => {
      const song = queue[index];
      if (!song) return;
      currentIndex = index;
      if (audio.getAttribute("src") !== song.audio) {
        audio.src = song.audio;
        audio.load();
      }
      title.textContent = song.title;
      version.textContent = song.version || song.tag;
      cover.src = PC.drive(song.cover, 300);
      cover.alt = `Okładka ${song.title}`;
      cover.hidden = false;
      status.textContent = `Utwór ${index + 1} z ${queue.length}`;
      renderQueue();
      if (autoplay) {
        try {
          await audio.play();
        } catch {
          status.textContent = "Dotknij przycisku play, aby rozpocząć odtwarzanie.";
        }
      }
    };

    const removeTrack = (index) => {
      const removingCurrent = index === currentIndex;
      const wasPlaying = !audio.paused;
      queue.splice(index, 1);
      if (!queue.length) {
        resetPlayer();
      } else if (removingCurrent) {
        selectTrack(Math.min(index, queue.length - 1), wasPlaying);
      } else {
        if (index < currentIndex) currentIndex -= 1;
        renderQueue();
      }
      renderLibrary();
    };

    library.addEventListener("click", (event) => {
      const button = event.target.closest("[data-add-track]");
      if (!button) return;
      const song = availableSongs.find((item) => item.slug === button.dataset.addTrack);
      if (!song || queue.some((item) => item.slug === song.slug)) return;
      queue.push(song);
      status.textContent = `${queue.length} utworów w kolejce.`;
      renderLibrary();
      renderQueue();
    });

    queueList.addEventListener("click", (event) => {
      const play = event.target.closest("[data-play-index]");
      const remove = event.target.closest("[data-remove]");
      const up = event.target.closest("[data-move-up]");
      const down = event.target.closest("[data-move-down]");
      if (play) selectTrack(Number(play.dataset.playIndex), true);
      if (remove) removeTrack(Number(remove.dataset.remove));
      const move = up || down;
      if (!move) return;
      const from = Number(up ? up.dataset.moveUp : down.dataset.moveDown);
      const to = from + (up ? -1 : 1);
      if (!queue[to]) return;
      const currentSlug = queue[currentIndex]?.slug;
      [queue[from], queue[to]] = [queue[to], queue[from]];
      currentIndex = currentSlug ? queue.findIndex((song) => song.slug === currentSlug) : -1;
      renderQueue();
    });

    qs("[data-add-all]", playlistRoot).addEventListener("click", () => {
      queue = [...availableSongs];
      status.textContent = `${queue.length} utworów w kolejce.`;
      renderLibrary();
      renderQueue();
    });
    qs("[data-clear-queue]", playlistRoot).addEventListener("click", () => {
      queue = [];
      resetPlayer();
      renderLibrary();
    });

    toggle.addEventListener("click", async () => {
      if (!queue.length) return;
      if (currentIndex === -1) {
        await selectTrack(0, true);
      } else if (audio.paused) {
        try { await audio.play(); } catch { status.textContent = "Nie udało się uruchomić odtwarzania."; }
      } else {
        audio.pause();
      }
    });
    previous.addEventListener("click", () => {
      if (audio.currentTime > 4 || currentIndex <= 0) audio.currentTime = 0;
      else selectTrack(currentIndex - 1, true);
    });
    next.addEventListener("click", () => {
      if (currentIndex === -1 && queue.length) selectTrack(0, true);
      else if (currentIndex < queue.length - 1) selectTrack(currentIndex + 1, true);
    });
    range.addEventListener("input", () => {
      if (audio.duration) audio.currentTime = (Number(range.value) / 100) * audio.duration;
    });
    audio.addEventListener("play", () => { toggle.textContent = "❚❚"; });
    audio.addEventListener("pause", () => { toggle.textContent = "▶"; });
    audio.addEventListener("timeupdate", () => {
      if (!audio.duration) return;
      range.value = String((audio.currentTime / audio.duration) * 100);
      time.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
    });
    audio.addEventListener("loadedmetadata", () => {
      time.textContent = `0:00 / ${formatTime(audio.duration)}`;
    });
    audio.addEventListener("ended", () => {
      if (currentIndex < queue.length - 1) selectTrack(currentIndex + 1, true);
      else {
        toggle.textContent = "▶";
        status.textContent = "Koniec playlisty.";
      }
    });
    audio.addEventListener("error", () => {
      status.textContent = "Nie udało się wczytać tego utworu.";
    });

    renderLibrary();
    renderQueue();
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
