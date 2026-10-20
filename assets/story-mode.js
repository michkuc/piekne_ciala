/* Story Mode – fictional viewpoints based on the existing song archive. */
(() => {
  "use strict";
  const root = document.querySelector("#story-mode");
  if (!root || !window.PC || !window.PC_SONGS) return;
  const $ = s => root.querySelector(s);
  const $$ = s => Array.from(root.querySelectorAll(s));
  const cases = {
    "cieply-grzech": [
      {label:"01 · RZECZYWISTOŚĆ",heading:"Ona się uśmiechnęła.",text:"Bar, ciepłe światło i zwykła rozmowa. Po całym dniu ciszy pojawia się ktoś, przy kim nie musi już udawać obojętności.",image:"1igP6LowN0i49bCrd5u4M0N31mQ21En8v",position:"center 40%"},
      {label:"02 · W JEGO GŁOWIE",heading:"Wszystko wciąż jest możliwe.",text:"Z jednego spojrzenia robi się świt. Z kilku zdań — historia o tym, że pragnienie jednak nie zniknęło z wiekiem.",image:"1xRkRz2DqtgmA-J5RF2nlpxUDR1N9aM0F",position:"center"},
      {label:"03 · WERSJA OFICJALNA",heading:"„Po prostu pogadaliśmy”.",text:"Zdanie do raportu końcowego. Prawdziwy raport ma w tle jazz, ciepło jej dłoni i kilka wersji tego, co mogłoby wydarzyć się dalej.",image:"1igP6LowN0i49bCrd5u4M0N31mQ21En8v",position:"center 62%"},
      {label:"04 · PO WSZYSTKIM",heading:"Każdy święty ma w sobie diabła.",text:"Wraca sam. Miasto świeci jak wcześniej, ale on już wie: nie przestał czuć. Po prostu nauczył się lepiej z tym żyć.",image:"1PEBj9Oo9z-5PeBn_1MxL1mxq3QayzN4R",position:"center"}
    ],
    "po-godzinach": [
      {label:"01 · RZECZYWISTOŚĆ",heading:"Biuro miało być puste.",text:"Późna godzina, wyłączone ekrany, cisza. Dwoje ludzi kończy sprawy, których za dnia nie zdążyli załatwić.",image:"1AQp2beRd2HAnUH34nxvjTM1peRsR73FH",position:"center 25%"},
      {label:"02 · W JEGO GŁOWIE",heading:"Jedna rozmowa, za wiele scenariuszy.",text:"Gdy zostają sami, każde niepotrzebne słowo waży dwa razy więcej. On już słyszy napięcie w najzwyklejszym „jeszcze chwilę”.",image:"1WbuayngBy2bQFHAjtwxsvre3cpdrXiGJ",position:"center 32%"},
      {label:"03 · WERSJA OFICJALNA",heading:"„Kończyliśmy prezentację”.",text:"To bezpieczna odpowiedź. Prawie wiarygodna, gdyby nie ten korytarz i spojrzenie, którego żadna prezentacja nie wymagała.",image:"19xsFVlPg3hYKzY2hZJBpYQCuPqQ_kZhz",position:"center 35%"},
      {label:"04 · PO WSZYSTKIM",heading:"Koniec pracy. Początek ciszy.",text:"Jutro wszystko będzie wyglądało normalnie. Tylko pamięć zapisze ten wieczór pod zupełnie inną nazwą.",image:"1PEBj9Oo9z-5PeBn_1MxL1mxq3QayzN4R",position:"center"}
    ],
    "ona-tanczy": [
      {label:"01 · RZECZYWISTOŚĆ",heading:"Ona po prostu tańczy.",text:"Parkiet, światła, muzyka. Ona porusza się dla siebie. Nie musi niczego obiecywać ani nikomu tłumaczyć swojego uśmiechu.",image:"1ElFNRMSX0FCCYDp6WqQhD3Ghaj5wddEr",position:"center 30%"},
      {label:"02 · W JEGO GŁOWIE",heading:"„To na pewno jakiś sygnał”.",text:"Dwie sekundy spojrzenia i narrator już montuje teledysk, w którym każdy ruch ma znaczenie. W rolach głównych: jego ego i zbyt głośna wyobraźnia.",image:"1DRfywdUpmA0Z5l3FQKdz5nM7uvt4pAsR",position:"center"},
      {label:"03 · WERSJA OFICJALNA",heading:"„Podobała mi się muzyka”.",text:"Owszem. Najwyraźniej tak bardzo, że potrafi odtworzyć cały jej układ taneczny, ale nazwy utworu nie pamięta.",image:"1ElFNRMSX0FCCYDp6WqQhD3Ghaj5wddEr",position:"center 70%"},
      {label:"04 · PO WSZYSTKIM",heading:"Ona wyszła z klubu. Film został.",text:"Nie wiadomo, czy jeszcze się spotkają. On już ma jednak ścieżkę dźwiękową do historii, która mogła się nawet nie zacząć.",image:"1PEBj9Oo9z-5PeBn_1MxL1mxq3QayzN4R",position:"center"}
    ]
  };
  const selectors = ["cieply-grzech","po-godzinach","ona-tanczy"];
  const img = $("[data-story-image]");
  const label = $("[data-story-label]");
  const heading = $("[data-story-heading]");
  const copy = $("[data-story-copy]");
  const counter = $("[data-story-counter]");
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
    img.alt = scene.heading + " — kadr z historii " + currentSong().title;
    img.style.objectPosition = scene.position || "center";
    label.textContent = scene.label;
    heading.textContent = scene.heading;
    copy.textContent = scene.text;
    counter.textContent = String(step+1).padStart(2,"0") + " / 04";
    previous.disabled = step===0;
    next.textContent = step===3 ? "Od początku ↺" : "Następna scena →";
    for(const btn of steps){
      const active = Number(btn.dataset.storyStep) === step;
      if(active) btn.setAttribute("aria-current","step");
      else btn.removeAttribute("aria-current");
    }
    const target=new URL(location.href);
    target.searchParams.set("slug",slug);
    target.searchParams.set("scene",String(step+1));
    history.replaceState(null,"",target.pathname+target.search);
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
  chooser.forEach(button=>button.addEventListener("click",()=>choose(button.dataset.storyChoose)));
  steps.forEach(button=>button.addEventListener("click",()=>{step=Number(button.dataset.storyStep);show();}));
  previous.addEventListener("click",()=>{if(step>0){step--;show();}});
  next.addEventListener("click",()=>{step=(step+1)%4;show();});
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
    if(event.key==="ArrowRight"){step=(step+1)%4;show();}
    if(event.key==="ArrowLeft" && step>0){step--;show();}
  });
  const params=new URLSearchParams(location.search);
  const first=params.get("slug");
  if(selectors.includes(first))slug=first;
  const requested=Number(params.get("scene"));
  if(Number.isInteger(requested)&&requested>=1&&requested<=4)step=requested-1;
  choose(slug,false);
})();
