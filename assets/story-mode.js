/* Story Mode – fictional viewpoints based on the existing song archive. */
(() => {
  "use strict";
  const root = document.querySelector("#story-mode");
  if (!root || !window.PC || !window.PC_SONGS) return;
  const $ = s => root.querySelector(s);
  const $$ = s => Array.from(root.querySelectorAll(s));
  const cases = window.PC_STORY_SCENES;
  if (!cases) return;
  const selectors = ["cieply-grzech","po-godzinach","ona-tanczy"];
  const img = $("[data-story-image]");
  const frame = $("[data-story-screen]");
  const framePrev = $("[data-story-frame-prev]");
  const frameNext = $("[data-story-frame-next]");
  const progress = Array.from(root.querySelectorAll("[data-story-progress]"));
  let ignoreTapUntil = 0;
  const label = $("[data-story-label]");
  const heading = $("[data-story-heading]");
  const copy = $("[data-story-copy]");
  const counter = $("[data-story-counter]");
  const cue = $("[data-story-cue]");
  const sourceLabel = $("[data-story-source]");
  const sourceNotice = $("[data-story-notice]");
  const audio = $("[data-story-audio]");
  const play = $("[data-story-play]");
  const playback = $("[data-story-playback]");
  const track = $("[data-story-track]");
  const previous = $("[data-story-prev]");
  const next = $("[data-story-next]");
  const original = $("[data-story-original]");
  const chooser = $$("[data-story-choose]");
  const steps = $$("[data-story-step]");
  let slug = "cieply-grzech";
  let step = 0;
  const currentSong = () => PC.getSong(slug);
  const selected = () => cases[slug];
  const show = () => {
    const scene = selected()[step];
    img.src = PC.drive(scene.image,1800);
    img.dataset.storyScene = String(step + 1);
    root.dataset.activeStory = slug;
    root.dataset.activeScene = String(step + 1);
    img.alt = scene.heading + " — kadr z historii " + currentSong().title;
    img.style.objectPosition = scene.position || "center";
    img.style.setProperty("--story-zoom", String(scene.zoom || 1));
    cue.textContent = scene.cue;
    sourceLabel.textContent = scene.section + (scene.source === "lyrics" ? " · SŁOWA Z TEKSTU" : " · OPIS UTWORU");
    sourceNotice.textContent = scene.source === "lyrics" ? "Kadr inspirowany tekstem. Przechodź między scenami ręcznie." : "Pełny tekst tego utworu nie jest dostępny w archiwum. Sceny to interpretacja zatwierdzonego opisu, nie cytaty z piosenki.";
    steps.forEach((btn,i)=>{ const caption = btn.querySelector("strong"); if(caption) caption.textContent = selected()[i].stage; });
    label.textContent = String(step + 1).padStart(2,"0") + " · " + scene.stage.toUpperCase();
    heading.textContent = scene.heading;
    copy.textContent = scene.text;
    counter.textContent = String(step+1).padStart(2,"0") + " / 04";
    previous.disabled = step===0;
    if (framePrev) framePrev.disabled = step === 0;
    if (frameNext) frameNext.setAttribute("aria-label", step === 3 ? "Od pierwszej sceny" : "Następna scena");
    progress.forEach((part,index)=>{
      part.classList.toggle("is-current", index === step);
      part.classList.toggle("is-complete", index < step);
    });
    next.textContent = step===3 ? "Od początku ↺" : "Następna scena →";
    for(const btn of steps){
      const active = Number(btn.dataset.storyStep) === step;
      if(active) btn.setAttribute("aria-current","step");
      else btn.removeAttribute("aria-current");
    }
    try {
      const target = new URL(location.href);
      target.searchParams.set("slug",slug);
      target.searchParams.set("scene",String(step+1));
      history.replaceState(null,"",target.pathname+target.search+target.hash);
    } catch {
      // Browser history is optional. Never interrupt interactive controls.
    }
  };
  const choose=(chosen,resetScene=true) => {
    if(!cases[chosen]) return;
    const change=chosen!==slug;
    slug=chosen;
    if(resetScene) step=0;
    if(change) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      play.textContent="▶";
      play.setAttribute("aria-label","Odtwórz muzykę");
      playback.textContent="Włącz muzykę, kiedy zechcesz.";
    }
    chooser.forEach(button=>button.setAttribute("aria-pressed",button.dataset.storyChoose===slug?"true":"false"));
    track.textContent=currentSong().title;
    original.href="/stories/"+slug;
    document.title=currentSong().title+" · Story Mode — Piękne Ciała";
    show();
  };
  const goToStep=(number)=>{
    step = (number + 4) % 4;
    show();
  };
  const goForward=()=>goToStep(step+1);
  const goBackward=()=>{if(step>0)goToStep(step-1);};
  chooser.forEach(button=>button.addEventListener("click",()=>choose(button.dataset.storyChoose)));
  steps.forEach(button=>button.addEventListener("click",()=>goToStep(Number(button.dataset.storyStep))));
  previous.addEventListener("click",goBackward);
  next.addEventListener("click",goForward);
  framePrev?.addEventListener("click",goBackward);
  frameNext?.addEventListener("click",goForward);
  // A visitor naturally taps the photo. Make that move the story forward, too.
  frame?.addEventListener("click",event=>{
    if(Date.now() < ignoreTapUntil) return;
    if(event.target.closest("button,a")) return;
    goForward();
  });
  // Swipes work over the actual picture rather than only on distant controls.
  let startTouch=null;
  frame?.addEventListener("touchstart",event=>{
    const touch=event.changedTouches?.[0];
    startTouch=touch?{x:touch.clientX,y:touch.clientY}:null;
  },{passive:true});
  frame?.addEventListener("touchend",event=>{
    const touch=event.changedTouches?.[0];
    if(!startTouch||!touch)return;
    const dx=touch.clientX-startTouch.x,dy=touch.clientY-startTouch.y;
    startTouch=null;
    if(Math.abs(dx)<50 || Math.abs(dx)<Math.abs(dy)*1.2)return;
    ignoreTapUntil=Date.now()+500;
    if(dx<0)goForward(); else goBackward();
  },{passive:true});
  frame?.addEventListener("touchcancel",()=>{startTouch=null;},{passive:true});
  play.addEventListener("click",async()=>{
    if(!audio.paused){audio.pause();return;}
    const song=currentSong();
    if(!song?.audio){playback.textContent="Brak pliku audio.";return;}
    if(!audio.getAttribute("src"))audio.src=song.audio;
    try {await audio.play();}
    catch {playback.textContent="Nie udało się rozpocząć odtwarzania. Spróbuj ponownie.";}
  });
  audio.addEventListener("play",()=>{play.textContent="❚❚";play.setAttribute("aria-label","Wstrzymaj muzykę");playback.textContent="Trwa odtwarzanie";});
  audio.addEventListener("pause",()=>{play.textContent="▶";play.setAttribute("aria-label","Odtwórz muzykę");if(audio.currentTime)playback.textContent="Wstrzymano";});
  audio.addEventListener("waiting",()=>{playback.textContent="Ładowanie utworu…";});
  audio.addEventListener("error",()=>{playback.textContent="Nie udało się wczytać utworu.";});
  audio.addEventListener("ended",()=>{playback.textContent="Koniec utworu. Możesz włączyć go ponownie.";});
  $("[data-story-share]").addEventListener("click",async event=>{
    const button=event.currentTarget;
    const url=location.href;
    const data={title:currentSong().title+" — Story Mode",text:"Cztery sceny z Pięknych Ciał",url};
    if(navigator.share){
      try{await navigator.share(data);return;}
      catch(error){if(error?.name==="AbortError")return;}
    }
    try{await navigator.clipboard.writeText(url);button.textContent="Link skopiowany ✓";}
    catch{button.textContent="Nie udało się skopiować linku";}
  });
  document.addEventListener("keydown",event=>{
    const target=event.target;
    if(target?.closest?.("button,a,input,textarea,select"))return;
    if(event.key==="ArrowRight"){goForward();}
    if(event.key==="ArrowLeft" && step>0){goBackward();}
  });
  const params=new URLSearchParams(location.search);
  const first=params.get("slug");
  if(selectors.includes(first))slug=first;
  const requested=Number(params.get("scene"));
  if(Number.isInteger(requested)&&requested>=1&&requested<=4)step=requested-1;
  choose(slug,false);
})();
