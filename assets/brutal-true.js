(()=> {
 const panels=[...document.querySelectorAll("[data-bt-series]")];
 const links=[...document.querySelectorAll("[data-bt-series-link]")];
 if(!panels.length)return;
 let active=panels[0], last=null;
 const getCards=p=>[...p.querySelectorAll("[data-bt-card]")];
 const visible=p=>getCards(p).filter(c=>!c.hidden);
 const apply=(p,cat)=>{
  p.querySelectorAll("[data-bt-filter]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.btFilter===cat)));
  getCards(p).forEach(c=>{c.hidden=cat!=="all"&&c.dataset.btCategory!==cat;if(c.hidden)c.open=false;});
  const n=visible(p).length, count=p.querySelector("[data-bt-count]");
  if(count)count.textContent=n+" "+(n===1?"historia":n%10>=2&&n%10<=4&&!(n%100>=12&&n%100<=14)?"historie":"historii")+" do odkrycia";
 };
 const activate=(id)=>{
  const next=panels.find(p=>p.dataset.btSeries===id)||panels[0];
  if(next!==active)last=null;
  active=next;
  panels.forEach(p=>{p.hidden=p!==active;if(p.hidden)getCards(p).forEach(c=>c.open=false);});
  links.forEach(a=>{if(a.dataset.btSeriesLink===active.dataset.btSeries)a.setAttribute("aria-current","true");else a.removeAttribute("aria-current");});
 };
 const sync=()=>{if(location.hash==="#randka")activate("02");else if(location.hash==="#cases"||!location.hash)activate("01");};
 panels.forEach(p=>{
  p.querySelectorAll("[data-bt-filter]").forEach(b=>b.addEventListener("click",()=>apply(p,b.dataset.btFilter)));
  const cs=getCards(p);
  cs.forEach(c=>c.addEventListener("toggle",()=>{if(c.open)cs.forEach(other=>{if(other!==c&&other.open)other.open=false;});}));
  apply(p,"all");
 });
 links.forEach(a=>a.addEventListener("click",()=>activate(a.dataset.btSeriesLink)));
 window.addEventListener("hashchange",sync);
 sync();
 document.querySelectorAll("[data-bt-random]").forEach(b=>b.addEventListener("click",()=>{
  const pool=visible(active);if(!pool.length)return;
  const choices=pool.length>1?pool.filter(c=>c!==last):pool;
  const c=choices[Math.floor(Math.random()*choices.length)];last=c;
  getCards(active).forEach(other=>{other.classList.remove("flash");if(other!==c)other.open=false;});
  c.open=true;void c.offsetWidth;c.classList.add("flash");
  c.querySelector("summary")?.focus({preventScroll:true});
  c.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"center"});
 }));
})();