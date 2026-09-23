(() => {
  const qs = (s, c=document) => c.querySelector(s);
  const qsa = (s, c=document) => [...c.querySelectorAll(s)];

  const ensureAgeGate = () => {
    if (localStorage.getItem("pc-age-ok")) return;
    let gate = qs("#age-gate");
    if (!gate) {
      gate = document.createElement("div");
      gate.id = "age-gate";
      gate.className = "age-gate";
      gate.setAttribute("role","dialog");
      gate.setAttribute("aria-modal","true");
      gate.setAttribute("aria-labelledby","age-title");
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
    const no = gate.querySelector("[data-age-no]");
    yes?.focus();
    yes?.addEventListener("click", () => {
      localStorage.setItem("pc-age-ok", "1");
      gate.classList.remove("show");
      document.body.classList.remove("modal-open");
    });
    no?.addEventListener("click", () => location.href = "https://www.google.com");
  };
  ensureAgeGate();

  const nav = qs(".nav");
  const toggle = qs(".nav-toggle");
  toggle?.addEventListener("click", () => {
    const open = nav?.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  const page = document.body.dataset.page;
  qsa("[data-nav]").forEach(a => {
    if (a.dataset.nav === page) a.classList.add("active");
  });

  qsa("[data-bg-id]").forEach(el => {
    el.style.backgroundImage = `linear-gradient(90deg,rgba(5,5,7,.94),rgba(5,5,7,.28) 48%,rgba(5,5,7,.36) 72%,rgba(5,5,7,.72)),url("${PC.drive(el.dataset.bgId)}")`;
  });

  const songGrid = qs("#song-grid");
  if (songGrid) {
    songGrid.innerHTML = PC_SONGS.map(s => `
      <a class="song-card reveal" href="/song/${s.slug}" aria-label="${s.title}">
        <div class="song-cover"><img loading="lazy" referrerpolicy="no-referrer" src="${PC.drive(s.cover, 900)}" alt="Okładka ${s.title}"></div>
        <div class="song-meta">
          <span class="song-no">${String(s.n).padStart(2,"0")}</span>
          <div><h3>${s.title}</h3><p>${s.version || s.tag}</p></div>
        </div>
      </a>`).join("");
  }

  const featured = qs("#featured-songs");
  if (featured) {
    const picks = [PC_SONGS[0], PC_SONGS[2], PC_SONGS[6], PC_SONGS[12]];
    featured.innerHTML = picks.map(s => {
      const art = s.heroFit === "contain" ? s.cover : s.hero;
      return `<a class="feature-tile reveal" href="/song/${s.slug}">
        <img loading="lazy" referrerpolicy="no-referrer" src="${PC.drive(art, 1200)}" alt="">
        <div><span>${String(s.n).padStart(2,"0")}</span><h3>${s.title}</h3><p>${s.version || s.tag}</p></div>
      </a>`;
    }).join("");
  }

  const songRoot = qs("#song-root");
  if (songRoot) {
    const path = location.pathname.split("/").filter(Boolean);
    const querySlug = new URLSearchParams(location.search).get("slug");
    const slug = querySlug || (path[0] === "song" ? path[path.length - 1] : "");
    const s = PC.getSong(slug) || PC_SONGS[0];
    document.title = `${s.title} — Piękne Ciała`;
    const prev = PC_SONGS[(s.n - 2 + PC_SONGS.length) % PC_SONGS.length];
    const next = PC_SONGS[s.n % PC_SONGS.length];
    const fitClass = s.heroFit === "contain" ? " portrait" : "";
    songRoot.innerHTML = `
      <section class="song-art${fitClass}" style="--song-hero:url('${PC.drive(s.hero)}')">
        <h1 class="sr-only">${s.title}</h1>
        <div class="song-art-index">PIĘKNE CIAŁA · ${String(s.n).padStart(2,"0")}</div>
      </section>
      <section class="song-body wrap">
        <div class="cover-large reveal"><img referrerpolicy="no-referrer" src="${PC.drive(s.cover, 1200)}" alt="Okładka ${s.title}"></div>
        <div class="song-copy reveal">
          <span class="eyebrow">PIĘKNE CIAŁA · ${String(s.n).padStart(2,"0")}</span>
          <h2 class="song-title">${s.title}</h2>
          <p class="version">${s.version || s.tag}</p>
          <p>${s.story}</p>
          <div class="hero-actions">
            <button class="btn primary" disabled>Audio w przygotowaniu</button>
            <a class="btn ghost" href="/music.html">Wszystkie utwory</a>
          </div>
          <div class="fact-line"><span>Klimat</span><strong>${s.tag}</strong></div>
          <div class="fact-line"><span>Wersja</span><strong>${s.version || "Original"}</strong></div>
        </div>
      </section>
      <nav class="song-nav wrap">
        <a href="/song/${prev.slug}"><span>← poprzedni</span><strong>${prev.title}</strong></a>
        <a href="/song/${next.slug}" class="next"><span>następny →</span><strong>${next.title}</strong></a>
      </nav>`;
  }

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add("in");
    }), {threshold:.08});
    qsa(".reveal").forEach(el => io.observe(el));
  } else {
    qsa(".reveal").forEach(el => el.classList.add("in"));
  }
})();