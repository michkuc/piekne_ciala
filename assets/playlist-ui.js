/* Playlist controller: persistent queue, local resume and portable links. */
(() => {
  "use strict";
  const root = document.querySelector("#playlist-root");
  if (!root || !window.PC || !window.PC_QUEUE || !window.PC_SONGS) return;

  const qs = (selector) => root.querySelector(selector);
  const esc = (value) => String(value == null ? "" : value)
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const songs = window.PC_SONGS.filter(song => song.audio);
  const bySlug = new Map(songs.map(song => [song.slug, song]));
  const store = window.PC_QUEUE;
  const library = qs("[data-track-library]");
  const queueList = qs("[data-queue-list]");
  const emptyState = qs("[data-queue-empty]");
  const audio = qs("[data-playlist-audio]");
  const title = qs("[data-playlist-title]");
  const version = qs("[data-playlist-version]");
  const cover = qs("[data-playlist-cover]");
  const toggle = qs("[data-playlist-toggle]");
  const previous = qs("[data-playlist-prev]");
  const next = qs("[data-playlist-next]");
  const range = qs("[data-playlist-range]");
  const time = qs("[data-playlist-time]");
  const status = qs("[data-playlist-status]");
  const repeat = qs("[data-repeat-mode]");
  const shareButton = qs("[data-share-queue]");
  const storyLink = qs("[data-playlist-story]");
  const shuffle = qs("[data-shuffle-queue]");
  const addAll = qs("[data-add-all]");
  const clearAll = qs("[data-clear-queue]");
  let queue = [];
  let currentIndex = -1;
  let repeatMode = "off";
  let pendingSeek = null;
  let lastSavedSecond = -1;

  const formatTime = (value) => {
    const seconds = Number.isFinite(value) && value >= 0 ? value : 0;
    return Math.floor(seconds / 60) + ":" + String(Math.floor(seconds % 60)).padStart(2, "0");
  };
  const persist = () => {
    try {
      return store.save(window.localStorage, {
        queue:queue.map(song => song.slug),
        current:queue[currentIndex] ? queue[currentIndex].slug : null,
        repeat:repeatMode,
        time:pendingSeek === null ? audio.currentTime : pendingSeek
      }, songs);
    } catch { return false; }
  };
  const announce = (message) => { status.textContent = message; };
  const renderRepeat = () => {
    const labels = {off:"Powtarzanie: wył.",all:"Powtarzanie: całość",one:"Powtarzanie: utwór"};
    repeat.textContent = labels[repeatMode];
    repeat.setAttribute("aria-pressed", repeatMode === "off" ? "false" : "true");
  };
  const renderLibrary = () => {
    const added = new Set(queue.map(song => song.slug));
    library.innerHTML = songs.map((song) => {
      const isAdded = added.has(song.slug);
      return '<div class="track-row">' +
        '<img loading="lazy" referrerpolicy="no-referrer" src="' + esc(PC.drive(song.cover, 240)) + '" alt="">' +
        '<span class="track-number">' + String(song.n).padStart(2, "0") + '</span>' +
        '<div class="track-copy"><strong>' + esc(song.title) + '</strong><small>' + esc(song.version || song.tag) + '</small></div>' +
        '<button class="track-add" type="button" data-add-track="' + esc(song.slug) + '" aria-label="Dodaj ' +
        esc(song.title) + ' do playlisty" ' + (isAdded ? "disabled" : "") + '>' + (isAdded ? "✓" : "+") + '</button></div>';
    }).join("");
  };
  const renderQueue = () => {
    emptyState.hidden = queue.length !== 0;
    queueList.innerHTML = queue.map((song,index) =>
      '<li class="queue-item ' + (index === currentIndex ? 'is-current' : '') + '">' +
      '<span class="queue-index">' + String(index + 1).padStart(2, "0") + '</span>' +
      '<img loading="lazy" referrerpolicy="no-referrer" src="' + esc(PC.drive(song.cover, 240)) + '" alt="">' +
      '<button class="track-copy queue-play-copy" type="button" data-play-index="' + index +
      '" aria-label="Odtwórz ' + esc(song.title) + '"><strong>' + esc(song.title) + '</strong><small>' +
      esc(song.version || song.tag) + '</small></button>' +
      '<div class="queue-actions"><button class="queue-action" type="button" data-move-up="' + index +
      '" aria-label="Przesuń wyżej ' + esc(song.title) + '" ' + (index === 0 ? "disabled" : "") + '>↑</button>' +
      '<button class="queue-action" type="button" data-move-down="' + index + '" aria-label="Przesuń niżej ' +
      esc(song.title) + '" ' + (index === queue.length - 1 ? "disabled" : "") + '>↓</button>' +
      '<button class="queue-action" type="button" data-remove="' + index + '" aria-label="Usuń ' +
      esc(song.title) + ' z playlisty">×</button></div></li>'
    ).join("");
    const exists = queue.length > 0;
    toggle.disabled = !exists;
    previous.disabled = !exists || currentIndex <= 0;
    next.disabled = !exists || (currentIndex === queue.length - 1 && repeatMode !== "all");
    clearAll.disabled = !exists;
    addAll.disabled = queue.length >= songs.length;
    shuffle.disabled = queue.length < 2;
    shareButton.disabled = !exists;
  };
  const resetPlayer = () => {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    currentIndex = -1;
    pendingSeek = null;
    cover.hidden = true;
    cover.removeAttribute("src");
    storyLink.hidden = true;
    title.textContent = "Wybierz pierwszy utwór";
    version.textContent = "Playlista zapisana na tym urządzeniu";
    toggle.textContent = "▶";
    toggle.setAttribute("aria-label","Odtwórz playlistę");
    range.value = "0";
    time.textContent = "0:00 / 0:00";
    announce(queue.length ? queue.length + " utworów w kolejce." : "Kolejka jest pusta.");
    renderQueue();
    persist();
  };
  const selectTrack = async (index, autoplay = false, restoring = false) => {
    const song = queue[index];
    if (!song) return;
    if (!restoring) pendingSeek = null;
    currentIndex = index;
    if (audio.getAttribute("src") !== song.audio) {
      range.value = "0";
      time.textContent = "0:00 / 0:00";
      audio.src = song.audio;
      audio.load();
    }
    title.textContent = song.title;
    version.textContent = song.version || song.tag;
    cover.src = PC.drive(song.cover, 300);
    cover.alt = "Okładka " + song.title;
    cover.hidden = false;
    storyLink.href = "/stories/" + song.slug;
    storyLink.hidden = false;
    announce("Utwór " + (index + 1) + " z " + queue.length + ".");
    renderQueue();
    persist();
    if (autoplay) {
      try { await audio.play(); }
      catch { announce("Nie udało się rozpocząć odtwarzania. Spróbuj ponownie."); }
    }
  };
  const removeTrack = (index) => {
    if (!queue[index]) return;
    const wasPlaying = !audio.paused;
    const wasCurrent = index === currentIndex;
    queue.splice(index,1);
    if (!queue.length) resetPlayer();
    else if (wasCurrent) selectTrack(Math.min(index,queue.length - 1),wasPlaying);
    else {
      if (index < currentIndex) currentIndex -= 1;
      renderQueue();
      persist();
    }
    renderLibrary();
  };

  library.addEventListener("click",(event) => {
    const button = event.target.closest("[data-add-track]");
    if (!button) return;
    const song = bySlug.get(button.dataset.addTrack);
    if (!song || queue.some(item => item.slug === song.slug)) return;
    queue.push(song);
    announce(queue.length + " utworów w kolejce.");
    renderLibrary();
    renderQueue();
    persist();
  });
  queueList.addEventListener("click",(event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.hasAttribute("data-play-index")) {
      selectTrack(Number(button.dataset.playIndex),true);
      return;
    }
    if (button.hasAttribute("data-remove")) {
      removeTrack(Number(button.dataset.remove));
      return;
    }
    const up = button.hasAttribute("data-move-up");
    const down = button.hasAttribute("data-move-down");
    if (!up && !down) return;
    const from = Number(up ? button.dataset.moveUp : button.dataset.moveDown);
    const to = from + (up ? -1 : 1);
    if (!queue[to]) return;
    const currentSlug = queue[currentIndex] && queue[currentIndex].slug;
    [queue[from],queue[to]] = [queue[to],queue[from]];
    currentIndex = currentSlug ? queue.findIndex(song => song.slug === currentSlug) : -1;
    renderQueue();
    persist();
  });
  addAll.addEventListener("click",() => {
    const currentSlug = queue[currentIndex] && queue[currentIndex].slug;
    queue = [...songs];
    currentIndex = currentSlug ? queue.findIndex(song => song.slug === currentSlug) : -1;
    renderLibrary();
    renderQueue();
    announce(queue.length + " utworów w kolejce.");
    persist();
  });
  clearAll.addEventListener("click",() => {
    queue = [];
    resetPlayer();
    renderLibrary();
  });
  shuffle.addEventListener("click",() => {
    const currentSlug = queue[currentIndex] && queue[currentIndex].slug;
    for (let index = queue.length-1; index>0; index--) {
      const random = Math.floor(Math.random()*(index+1));
      [queue[index],queue[random]] = [queue[random],queue[index]];
    }
    currentIndex = currentSlug ? queue.findIndex(song => song.slug === currentSlug) : -1;
    renderQueue();
    persist();
    announce("Kolejność została wylosowana.");
  });
  repeat.addEventListener("click",() => {
    repeatMode = repeatMode === "off" ? "all" : repeatMode === "all" ? "one" : "off";
    renderRepeat();
    renderQueue();
    persist();
  });

  shareButton.addEventListener("click",async () => {
    if (!queue.length) return;
    const url = new URL("/playlist",location.origin);
    url.searchParams.set("list",store.link(queue.map(song => song.slug),songs));
    const title = "Moja playlista — Piękne Ciała";
    if (navigator.share) {
      try {
        await navigator.share({title,url:url.href,text:"Posłuchaj mojej kolejki"});
        announce("Playlista udostępniona.");
        return;
      } catch(e) {
        if (e && e.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url.href);
      announce("Link do playlisty skopiowany.");
    } catch { announce("Nie udało się skopiować linku do playlisty."); }
  });

  toggle.addEventListener("click",async () => {
    if (!queue.length) return;
    if (currentIndex === -1) await selectTrack(0,true);
    else if (audio.paused) {
      try { await audio.play(); }
      catch { announce("Nie udało się rozpocząć odtwarzania."); }
    } else audio.pause();
  });
  previous.addEventListener("click",() => {
    if (audio.currentTime > 4 || currentIndex <= 0) audio.currentTime = 0;
    else selectTrack(currentIndex-1,true);
    persist();
  });
  next.addEventListener("click",() => {
    if (currentIndex === -1 && queue.length) selectTrack(0,true);
    else if (currentIndex < queue.length-1) selectTrack(currentIndex+1,true);
    else if (repeatMode === "all" && queue.length) selectTrack(0,true);
  });
  range.addEventListener("input",() => {
    if (Number.isFinite(audio.duration) && audio.duration > 0)
      audio.currentTime = Number(range.value)/100*audio.duration;
    persist();
  });
  audio.addEventListener("play",() => {
    toggle.textContent = "❚❚";
    toggle.setAttribute("aria-label","Wstrzymaj playlistę");
  });
  audio.addEventListener("pause",() => {
    toggle.textContent = "▶";
    toggle.setAttribute("aria-label","Odtwórz playlistę");
    persist();
  });
  audio.addEventListener("timeupdate",() => {
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
    range.value = String(audio.currentTime/audio.duration*100);
    time.textContent = formatTime(audio.currentTime) + " / " + formatTime(audio.duration);
    const second = Math.floor(audio.currentTime);
    if (second !== lastSavedSecond && second % 10 === 0) {
      lastSavedSecond = second;
      persist();
    }
  });
  audio.addEventListener("loadedmetadata",() => {
    if (pendingSeek !== null && Number.isFinite(audio.duration) && audio.duration > 0) {
      audio.currentTime = Math.min(pendingSeek,Math.max(0,audio.duration-1));
      pendingSeek = null;
    }
    time.textContent = formatTime(audio.currentTime) + " / " + formatTime(audio.duration);
  });
  audio.addEventListener("waiting",() => { if (currentIndex !== -1) announce("Ładowanie utworu…"); });
  audio.addEventListener("playing",() => {
    if (currentIndex !== -1) announce("Odtwarzanie: " + queue[currentIndex].title);
  });
  audio.addEventListener("stalled",() => { announce("Połączenie jest wolne. Trwa buforowanie…"); });
  audio.addEventListener("error",() => {
    if (currentIndex !== -1) announce("Nie udało się wczytać utworu. Spróbuj ponownie lub wybierz następny.");
  });
  audio.addEventListener("ended",() => {
    if (repeatMode === "one") {
      audio.currentTime = 0;
      audio.play().catch(() => announce("Naciśnij play, aby powtórzyć utwór."));
    } else if (currentIndex < queue.length-1) selectTrack(currentIndex+1,true);
    else if (repeatMode === "all" && queue.length) selectTrack(0,true);
    else announce("Koniec playlisty.");
    persist();
  });

  const params = new URLSearchParams(location.search);
  const shared = params.has("list") ? store.fromLink(params.get("list"),songs) : null;
  let stored = null;
  try { stored = store.load(window.localStorage,songs); } catch {}
  if (shared && shared.length) {
    queue = shared.map(slug => bySlug.get(slug));
    announce("Zaimportowano " + queue.length + " utworów z linku.");
  } else if (stored) {
    queue = stored.queue.map(slug => bySlug.get(slug)).filter(Boolean);
    repeatMode = stored.repeat;
    currentIndex = queue.findIndex(song => song.slug === stored.current);
    pendingSeek = currentIndex >= 0 ? stored.time : null;
    announce(queue.length ? "Przywrócono " + queue.length + " utworów." : "Kolejka jest pusta.");
  }
  const addSlug = params.get("add");
  const addSong = bySlug.get(addSlug);
  if (addSong && !queue.some(song => song.slug === addSong.slug)) {
    queue.push(addSong);
    announce("Dodano „" + addSong.title + "” do playlisty.");
  }
  if (params.has("list") || params.has("add")) {
    history.replaceState({}, "", location.pathname + location.hash);
  }
  renderRepeat();
  renderLibrary();
  renderQueue();
  if (currentIndex >= 0) {
    selectTrack(currentIndex,false,true);
    announce("Przywrócono playlistę. Naciśnij ▶, aby kontynuować.");
  } else persist();
  window.addEventListener("pagehide",persist);
})();
