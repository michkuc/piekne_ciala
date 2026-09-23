(() => {
  const qs = (s, c=document) => c.querySelector(s);
  const qsa = (s, c=document) => [...c.querySelectorAll(s)];

  const age = localStorage.getItem("pc-age-ok");
  const gate = qs("#age-gate");
  if (gate && !age) gate.classList.add("show");
  qsa("[data-age-yes]").forEach(b => b.addEventListener("click", () => {
    localStorage.setItem("pc-age-ok", "1");
    gate?.classList.remove("show");
  }));
  qsa("[data-age-no]").forEach(b => b.addEventListener("click", () => {
    location.href = "https://www.google.com";
  }));

  const nav = qs(".nav");
  const toggle = qs(".nav-toggle");
  toggle?.addEventListener("click", () => nav?.classList.toggle("open"));

  const page = document.body.dataset.page;
  qsa("[data-nav]").forEach(a => {
    if (a.dataset.nav === page) a.classList.add("active");
  });

  qsa("[data-bg-id]").forEach(el => {
    el.style.backgroundImage = `linear-gradient(90deg,rgba(5,5,7,.92),rgba(5,5,7,.25) 55%,rgba(5,5,7,.78)),url("${PC.drive(el.dataset.bgId)}")`;
  });

  const songGrid = qs("#song-grid");
  if (songGrid) {
    songGrid.innerHTML = PC_SONGS.map(s => `
      <a class="song-card reveal" href="/song/${s.slug}" aria-label="${s.title}">
        <div class="song-cover"><img loading="lazy" src="${PC.drive(s.cover, 900)}" alt=""></div>
        <div class="song-meta">
          <span class="song-no">${String(s.n).padStart(2,"0")}</span>
          <div><h3>${s.title}</h3><p>${s.version || s.tag}</p></div>
        </div>
      </a>`).join("");
  }

  const featured = qs("#featured-songs");
  if (featured) {
    const picks = [PC_SONGS[0], PC_SONGS[2], PC_SONGS[6], PC_SONGS[12]];
    featured.innerHTML = picks.map(s => `
      <a class="feature-tile reveal" href="/song/${s.slug}">
        <img loading="lazy" src="${PC.drive(s.hero, 1200)}" alt="">
        <div><span>0${s.n}</span><h3>${s.title}</h3><p>${s.version}</p></div>
      </a>`).join("");
  }

  const songRoot = qs("#song-root");
  if (songRoot) {
    const path = location.pathname.split("/").filter(Boolean);
    const slug = path[path.length - 1] || new URLSearchParams(location.search).get("slug");
    const s = PC.getSong(slug) || PC_SONGS[0];
    document.title = `${s.title} — Piękne Ciała`;
    const prev = PC_SONGS[(s.n - 2 + PC_SONGS.length) % PC_SONGS.length];
    const next = PC_SONGS[s.n % PC_SONGS.length];
    songRoot.innerHTML = `
      <section class="song-hero" style="background-image:linear-gradient(90deg,rgba(5,5,7,.90),rgba(5,5,7,.18) 58%,rgba(5,5,7,.70)),url('${PC.drive(s.hero)}')">
        <div class="song-hero-copy">
          <span class="eyebrow">PIĘKNE CIAŁA · ${String(s.n).padStart(2,"0")}</span>
          <h1>${s.title}</h1>
          <p class="version">${s.version || s.tag}</p>
          <p class="lede">${s.story}</p>
          <div class="hero-actions">
            <button class="btn primary" disabled>Audio w przygotowaniu</button>
            <a class="btn ghost" href="/music.html">Wszystkie utwory</a>
          </div>
        </div>
      </section>
      <section class="song-body wrap">
        <div class="cover-large reveal"><img src="${PC.drive(s.cover, 1200)}" alt="Okładka ${s.title}"></div>
        <div class="song-copy reveal">
          <span class="eyebrow">HISTORIA</span>
          <h2>O czym jest ten numer</h2>
          <p>${s.story}</p>
          <div class="fact-line"><span>Klimat</span><strong>${s.tag}</strong></div>
          <div class="fact-line"><span>Wersja</span><strong>${s.version || "Original"}</strong></div>
          <div class="fact-line"><span>Tekst archiwalny</span><strong>${s.lyrics === "verified" ? "zweryfikowany w archiwum projektu" : "do odzyskania 1:1 z wcześniejszych rozmów"}</strong></div>
          <p class="muted">Pełne teksty i wersje produkcyjne pozostają w archiwum projektu. Na stronie publikujemy tylko zatwierdzoną wersję danego utworu.</p>
        </div>
      </section>
      <nav class="song-nav wrap">
        <a href="/song/${prev.slug}"><span>← poprzedni</span><strong>${prev.title}</strong></a>
        <a href="/song/${next.slug}" class="next"><span>następny →</span><strong>${next.title}</strong></a>
      </nav>`;
  }

  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add("in");
  }), {threshold:.08});
  qsa(".reveal").forEach(el => io.observe(el));
})();