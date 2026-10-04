(() => {
  const panel=document.querySelector("#panic-panel"); if(!panel) return;
  const openers=[...document.querySelectorAll("[data-panic-open]")];
  const closer=panel.querySelector("[data-panic-close]");
  const count=panel.querySelector("#panic-count");
  const steps=[...panel.querySelectorAll("#panic-steps li")];
  const result=panel.querySelector("#panic-result");
  let timer=null,previousFocus=null;
  const reset=()=>{if(timer) clearInterval(timer);timer=null;count.textContent="5";result.textContent="SYSTEM W TRAKCIE RESTARTU…";result.classList.remove("ready");steps.forEach(s=>s.classList.remove("active","done"));};
  const close=()=>{reset();panel.classList.remove("show");panel.setAttribute("aria-hidden","true");document.body.classList.remove("modal-open");previousFocus?.focus?.();};
  const open=(trigger)=>{reset();previousFocus=trigger||document.activeElement;panel.classList.add("show");panel.setAttribute("aria-hidden","false");document.body.classList.add("modal-open");closer.focus();let tick=0;steps[0]?.classList.add("active");timer=setInterval(()=>{steps[tick]?.classList.remove("active");steps[tick]?.classList.add("done");tick+=1;count.textContent=String(Math.max(0,5-tick));if(tick<steps.length)steps[tick]?.classList.add("active");if(tick>=5){clearInterval(timer);timer=null;result.textContent="SYSTEM STABILNY · POWIEDZ „CZEŚĆ”.";result.classList.add("ready");}},900);};
  openers.forEach(b=>b.addEventListener("click",()=>open(b))); closer.addEventListener("click",close);
  panel.addEventListener("click",e=>{if(e.target===panel)close();});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&panel.classList.contains("show"))close();});
})();