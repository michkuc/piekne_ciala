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
    if (sessionStorage.getItem("pc-age-ok")) return;
    let pinRequired = false;
    try {
      const accessResponse = await fetch("/api/access", {headers: {"Accept": "application/json"}});
      if (accessResponse.ok) pinRequired = Boolean((await accessResponse.json()).required);
    } catch {}
    let gate = qs("#age-gate");
    if (!gate) {
      gate = document.createElement("div");
      gate.id = "age-gate";
      gate.className = "age-gate";
      gate.setAttribute("role", "dialog");
      gate.setAttribute("aria-modal", "true");
      gate.setAttribute("aria-labelledby", "age-title");
      gate.setAttribute("aria-describedby", "age-description");
      gate.innerHTML = `<div class="age-box">
        <span class="age-kicker">PRYWATNY KLUB · TREŚCI 18+</span>
        <h2 id="age-title">Piękne Ciała</h2>
        <strong>Wstęp 40+</strong>
        <p>Bo po czterdziestce wchodzi się już tylko z klasą.</p>
        <small id="age-description">Wstęp jest dla osób pełnoletnich. Projekt zawiera dojrzałe tematy, erotyczne napięcie i mocny język.</small>
        <div class="age-actions">
          <button class="btn primary" data-age-yes>Mam 18 lat · wchodzę</button>
          <button class="btn ghost" data-age-no>Nie mam 18 lat</button>
        </div>
      </div>`;
      document.body.appendChild(gate);
    }
    gate.classList.add("show");
    document.body.classList.add("modal-open");
    const previousFocus = document.activeElement;
    const yes = gate.querySelector("[data-age-yes]");
    const no = gate.querySelector("[data-age-no]");
    let pinInput = null;
    let pinError = null;
    if (pinRequired) {
      const pinBox = document.createElement("div");
      pinBox.className = "pin-box";
      pinBox.innerHTML = `<label for="site-pin">PIN dostępu</label><input id="site-pin" type="password" inputmode="numeric" autocomplete="one-time-code" maxlength="24" aria-describedby="pin-error"><small id="pin-error" aria-live="polite"></small>`;
      gate.querySelector(".age-actions")?.before(pinBox);
      pinInput = pinBox.querySelector("input");
      pinError = pinBox.querySelector("#pin-error");
      if (yes) yes.textContent = "Sprawdź PIN · wchodzę";
    }
    const focusable = [pinInput, yes, no].filter(Boolean);
    (pinInput || yes)?.focus();
    yes?.addEventListener("click", async () => {
      if (pinRequired) {
        pinError.textContent = "";
        try {
          const pinResponse = await fetch("/api/access", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({pin:pinInput.value})});
          if (!pinResponse.ok) {
            pinError.textContent = "Nieprawidłowy PIN.";
            pinInput.select();
            return;
          }
        } catch {
          pinError.textContent = "Nie udało się sprawdzić PIN-u. Spróbuj ponownie.";
          return;
        }
      }
      sessionStorage.setItem("pc-age-ok", "1");
      gate.classList.remove("show");
      document.body.classList.remove("modal-open");
      previousFocus?.focus?.();
    });
    no?.addEventListener("click", () => {
      if (history.length > 1) history.back();
      else location.href = "about:blank";
    });
    gate.addEventListener("keydown", (event) => {
      if (event.key !== "Tab" || focusable.length < 2) return;
      const index = focusable.indexOf(document.activeElement);
      if (event.shiftKey && index <= 0) {
        event.preventDefault();
        focusable.at(-1).focus();
      } else if (!event.shiftKey && index === focusable.length - 1) {
        event.preventDefault();
        focusable[0].focus();
      }
    });
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
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") showImage(activeIndex - 1);
      if (event.key === "ArrowRight") showImage(activeIndex + 1);
    });
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
    const shuffle = qs("[data-shuffle-queue]", playlistRoot);
    const repeat = qs("[data-repeat-mode]", playlistRoot);
    let queue = [];
    let currentIndex = -1;
    let repeatMode = "off";

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
      shuffle.disabled = queue.length < 2;
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
    shuffle.addEventListener("click", () => {
      const currentSlug = queue[currentIndex]?.slug;
      for (let index = queue.length - 1; index > 0; index -= 1) {
        const random = Math.floor(Math.random() * (index + 1));
        [queue[index], queue[random]] = [queue[random], queue[index]];
      }
      currentIndex = currentSlug ? queue.findIndex((song) => song.slug === currentSlug) : -1;
      status.textContent = "Kolejność została wylosowana.";
      renderQueue();
    });
    repeat.addEventListener("click", () => {
      repeatMode = repeatMode === "off" ? "all" : repeatMode === "all" ? "one" : "off";
      const labels = {off:"Powtarzanie: wył.",all:"Powtarzanie: całość",one:"Powtarzanie: utwór"};
      repeat.textContent = labels[repeatMode];
      repeat.setAttribute("aria-pressed", repeatMode === "off" ? "false" : "true");
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
    audio.addEventListener("play", () => {
      toggle.textContent = "❚❚";
      toggle.setAttribute("aria-label", "Wstrzymaj playlistę");
    });
    audio.addEventListener("pause", () => {
      toggle.textContent = "▶";
      toggle.setAttribute("aria-label", "Odtwórz playlistę");
    });
    audio.addEventListener("timeupdate", () => {
      if (!audio.duration) return;
      range.value = String((audio.currentTime / audio.duration) * 100);
      time.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
    });
    audio.addEventListener("loadedmetadata", () => {
      time.textContent = `0:00 / ${formatTime(audio.duration)}`;
    });
    audio.addEventListener("ended", () => {
      if (repeatMode === "one") {
        audio.currentTime = 0;
        audio.play();
      } else if (currentIndex < queue.length - 1) selectTrack(currentIndex + 1, true);
      else if (repeatMode === "all" && queue.length) selectTrack(0, true);
      else {
        toggle.textContent = "▶";
        status.textContent = "Koniec playlisty.";
      }
    });
    audio.addEventListener("error", () => {
      status.textContent = "Nie udało się wczytać tego utworu.";
    });

    const initialSlug = new URLSearchParams(location.search).get("add");
    const initialSong = availableSongs.find((song) => song.slug === initialSlug);
    if (initialSong) {
      queue.push(initialSong);
      history.replaceState({}, "", location.pathname);
      status.textContent = `Dodano „${initialSong.title}”. Kolejka nadal zniknie po odświeżeniu.`;
    }
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
    const labels = {
      selected:"15 wybranych kadrów",
      all:"61 kadrów",
      night:"NIGHT · 9 kadrów",
      city:"CITY · 5 kadrów",
      travel:"TRAVEL · 22 kadry",
      sport:"SPORT · 11 kadrów",
      everyday:"EVERYDAY · 7 kadrów",
      "after-hours":"AFTER HOURS · 7 kadrów"
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
      if (status) status.textContent = labels[filter] || labels.selected;
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
