(() => {
  "use strict";
  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));

  const nav=qs(".nav");
  const toggle=qs(".nav-toggle");
  toggle?.addEventListener("click",()=>{
    const open=nav?.classList.toggle("open");
    toggle.setAttribute("aria-expanded",open?"true":"false");
  });
  qsa(".nav a").forEach(link=>link.addEventListener("click",()=>{
    nav?.classList.remove("open");
    toggle?.setAttribute("aria-expanded","false");
  }));
  const page=document.body.dataset.page;
  qsa("[data-nav]").forEach(link=>link.classList.toggle("active",link.dataset.nav===page));

  const ensureAgeGate=async()=>{
    if(sessionStorage.getItem("pc-age-ok")) return;
    let pinRequired=false;
    try{
      const r=await fetch("/api/access",{headers:{Accept:"application/json"}});
      if(r.ok) pinRequired=Boolean((await r.json()).required);
    }catch{}
    const gate=document.createElement("div");
    gate.id="age-gate";
    gate.className="age-gate show";
    gate.setAttribute("role","dialog");
    gate.setAttribute("aria-modal","true");
    gate.setAttribute("aria-labelledby","age-title");
    gate.setAttribute("aria-describedby","age-description");
    gate.innerHTML=`<div class="age-box">
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
    document.body.classList.add("modal-open");
    const previousFocus=document.activeElement;
    const yes=qs("[data-age-yes]",gate);
    const no=qs("[data-age-no]",gate);
    let pinInput=null,pinError=null;
    if(pinRequired){
      const pinBox=document.createElement("div");
      pinBox.className="pin-box";
      pinBox.innerHTML='<label for="site-pin">PIN dostępu</label><input id="site-pin" type="password" inputmode="numeric" autocomplete="one-time-code" maxlength="24" aria-describedby="pin-error"><small id="pin-error" aria-live="polite"></small>';
      qs(".age-actions",gate)?.before(pinBox);
      pinInput=qs("input",pinBox);
      pinError=qs("#pin-error",pinBox);
      if(yes) yes.textContent="Sprawdź PIN · wchodzę";
    }
    const focusable=[pinInput,yes,no].filter(Boolean);
    (pinInput||yes)?.focus();
    const close=()=>{
      sessionStorage.setItem("pc-age-ok","1");
      gate.remove();
      document.body.classList.remove("modal-open");
      previousFocus?.focus?.();
    };
    yes?.addEventListener("click",async()=>{
      if(pinRequired){
        pinError.textContent="";
        try{
          const r=await fetch("/api/access",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({pin:pinInput.value})});
          if(!r.ok){pinError.textContent="Nieprawidłowy PIN.";pinInput.select();return;}
        }catch{pinError.textContent="Nie udało się sprawdzić PIN-u. Spróbuj ponownie.";return;}
      }
      close();
    });
    no?.addEventListener("click",()=>history.length>1?history.back():location.assign("about:blank"));
    gate.addEventListener("keydown",e=>{
      if(e.key==="Escape") return;
      if(e.key!=="Tab"||focusable.length<2) return;
      const i=focusable.indexOf(document.activeElement);
      if(e.shiftKey&&i<=0){e.preventDefault();focusable.at(-1).focus();}
      else if(!e.shiftKey&&i===focusable.length-1){e.preventDefault();focusable[0].focus();}
    });
  };
  ensureAgeGate();
})();