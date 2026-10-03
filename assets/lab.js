(() => {
  "use strict";

  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const clamp=n=>Math.max(0,Math.min(100,Math.round(n)));

  const questions=[
    {c:"CASE 01 · ELEVATOR",q:"Winda. Jesteście sami. Ona poprawia włosy i patrzy w twoją stronę.",a:[
      ["Patrzę na numer piętra. Intensywnie.","professor",[10,5,1,2,5]],
      ["Patrzę raz. Potem jeszcze raz, żeby upewnić się, że nie patrzę.","observer",[7,7,3,4,9]],
      ["W głowie jestem już w trzecim akcie filmu.","director",[3,10,6,6,8]],
      ["Zastanawiam się, czy kamera w windzie ma dźwięk.","disaster",[4,8,8,5,6]]
    ]},
    {c:"CASE 02 · BAR",q:"Barmanka ma odkryte plecy i tatuaż smoka. Żona siedzi trzy metry dalej.",a:[
      ["Zamawiam wodę. To bezpieczna infrastruktura.","professor",[10,4,1,2,4]],
      ["Wysyłam kolegę po drinka.","reasonable",[9,5,2,3,6]],
      ["Idę po drinka siódmy raz. Obsługa musi mieć ruch.","disaster",[2,7,10,8,8]],
      ["Udaję, że naprawdę interesuje mnie skład toniku.","romantic",[6,8,5,8,7]]
    ]},
    {c:"CASE 03 · HOTEL",q:"Delegacja. 23:14. W lobby siada obok kobieta, którą widziałeś rano na śniadaniu.",a:[
      ["Kończę maila i idę spać. Teoretycznie.","reasonable",[9,5,2,3,5]],
      ["Pamiętam stolik, filiżankę i kolor marynarki. Przypadkiem.","observer",[7,7,3,4,10]],
      ["To już ma muzykę w tle.","director",[3,10,6,6,7]],
      ["Zostaję jeszcze jeden drink. Dla logistyki.","disaster",[3,7,9,7,6]]
    ]},
    {c:"CASE 04 · GYM",q:"Na siłowni łapiecie kontakt wzrokowy przez lustro. Dwa razy.",a:[
      ["Zmiana ćwiczenia. Zbyt dużo danych wejściowych.","professor",[10,4,2,2,5]],
      ["To nic. Ale sprawdzę, czy stanie się trzeci raz.","observer",[7,7,4,5,10]],
      ["Trzeci raz jest już statystycznie znaczący.","romantic",[5,8,5,9,7]],
      ["Właśnie wymyśliłem historię od lustra do parkingu.","director",[2,10,7,7,7]]
    ]},
    {c:"CASE 05 · AIRPORT",q:"Lot opóźniony dwie godziny. Ona siada obok przy gniazdku i pyta, czy ładowarka jest wolna.",a:[
      ["Tak. I to jest pełna treść rozmowy.","professor",[10,3,1,2,4]],
      ["Tak. Po 15 minutach wiem, dokąd leci i po co.","romantic",[6,8,5,8,8]],
      ["Po 15 minutach wiem też, że ma pieprzyk nad lewą brwią.","observer",[6,7,4,5,10]],
      ["W mojej głowie boarding już nas rozdziela dramatycznie.","director",[3,10,6,6,8]]
    ]},
    {c:"CASE 06 · OFFICE",q:"Biuro prawie puste. Zostaliście tylko wy. Ona mówi: „jeszcze pięć minut i uciekam”.",a:[
      ["Odpowiadam: „jasne”. Kończę Excela.","reasonable",[9,4,2,3,4]],
      ["Słowo „uciekam” brzmi zdecydowanie zbyt filmowo.","director",[3,10,5,5,6]],
      ["Zaczynam analizować ton głosu jak zapis z czarnej skrzynki.","observer",[6,7,4,5,10]],
      ["Proponuję windę razem. Co może pójść nie tak.","disaster",[3,7,9,7,6]]
    ]},
    {c:"CASE 07 · RESTAURANT",q:"Podwójna randka z żonami. Kelnerka uśmiecha się do was obu. Kolega też to zauważył.",a:[
      ["Nikt nic nie mówi. Profesjonalizm zespołu.","reasonable",[9,5,2,3,6]],
      ["Kontakt wzrokowy z kolegą potwierdza incydent.","observer",[7,6,4,6,10]],
      ["Zamawiam deser. Nie wiem po co, ale potrzebujemy czasu.","disaster",[3,7,8,8,7]],
      ["To nie flirt. To świetna obsługa. Prawie w to wierzę.","professor",[8,6,3,5,6]]
    ]},
    {c:"CASE 08 · BEACH",q:"Plaża. Miałeś czytać książkę. Od pięciu minut czytasz ten sam akapit.",a:[
      ["Odwracam leżak. Ergonomia.","professor",[10,5,2,2,5]],
      ["Nie patrzę. Rejestruję peryferyjnie.","observer",[7,7,3,5,10]],
      ["Książka przegrywa z kinem wewnętrznym.","director",[3,10,6,6,7]],
      ["Uznaję, że to po prostu bardzo słaby akapit.","reasonable",[8,6,3,4,5]]
    ]},
    {c:"CASE 09 · MESSAGE",q:"Po spotkaniu dostajesz wiadomość: „Miło było pogadać :)”.",a:[
      ["Odpisuję: „wzajemnie”. Koniec transmisji.","professor",[10,3,1,2,4]],
      ["Analizuję dwukropek, nawias i czas wysłania.","observer",[6,8,4,6,10]],
      ["Uśmiech ma znaczenie. Oczywiście, że ma.","romantic",[4,8,6,10,7]],
      ["Piszę trzy wersje odpowiedzi i żadnej nie wysyłam.","director",[5,10,4,6,8]]
    ]},
    {c:"CASE 10 · PARTY",q:"Firmowa impreza. Tańczycie w grupie. Przez chwilę jej dłoń zostaje na twoim ramieniu.",a:[
      ["Przypadek. Wracam do rozmowy.","reasonable",[9,4,2,3,4]],
      ["Przypadek, który pamiętam następnego dnia o 07:12.","observer",[6,7,4,5,10]],
      ["Muzyka robi się nagle podejrzanie dobrze dobrana.","romantic",[4,9,6,9,7]],
      ["W głowie operator już robi slow motion.","director",[2,10,7,7,7]]
    ]},
    {c:"CASE 11 · STREET",q:"Mija cię na ulicy. Perfumy zostają sekundę dłużej niż ona.",a:[
      ["Idę dalej. To miasto.","reasonable",[9,4,2,2,4]],
      ["Zapach wraca wieczorem bez pytania o zgodę.","observer",[6,8,3,4,10]],
      ["To dokładnie scena otwierająca piosenkę.","director",[3,10,5,6,8]],
      ["Odwracam się. Tylko żeby sprawdzić kierunek wiatru.","disaster",[3,7,9,8,7]]
    ]},
    {c:"CASE 12 · FINAL",q:"Najbardziej niebezpieczne zdanie, jakie możesz sobie powiedzieć?",a:[
      ["„Mam wszystko pod kontrolą.”","professor",[10,6,3,5,5]],
      ["„To tylko spojrzenie.”","observer",[7,7,4,5,10]],
      ["„Zobaczymy, co się wydarzy.”","disaster",[2,7,10,8,6]],
      ["„Może to coś znaczy.”","romantic",[4,9,7,10,8]]
    ]}
  ];

  const profiles={
    professor:{name:"Profesor Samokontroli",code:"CTRL-92",desc:"Na zewnątrz nic się nie dzieje. W środku trwa pełne posiedzenie zarządu. Twoją specjalnością nie jest brak impulsu — tylko profesjonalne zarządzanie jego widocznością.",quote:"„Nic nie zrobiłem” jest technicznie prawdą. I bardzo niepełnym raportem.",habitat:"Winda, restauracja, każde miejsce z lustrem",danger:"Sytuacja, w której ktoś naprawdę odwzajemnia spojrzenie",procedure:"Patrz na numer piętra. Nie analizuj numeru piętra."},
    director:{name:"Reżyser",code:"CINEMA-40",desc:"Jedno spojrzenie wystarcza, żeby powstały scena, dialog, światło, soundtrack i alternatywne zakończenie. Rzeczywistość dostarcza materiału. Resztę produkujesz sam.",quote:"Ona powiedziała „dzień dobry”. Ty masz już teaser, plakat i premierę.",habitat:"Hotel, lotnisko, nocne miasto",danger:"Dwie sekundy ciszy i dobre światło",procedure:"Oddziel materiał źródłowy od wersji reżyserskiej."},
    observer:{name:"Obserwator",code:"MEM-99",desc:"Teoretycznie niewinny. Praktycznie pamiętasz kolor sukienki, godzinę, zapach i po której stronie stała filiżanka. Niczego nie planujesz. Po prostu twój mózg prowadzi archiwum bez zgody administratora.",quote:"Nie patrzyłeś długo. Po prostu zapisałeś wszystko w 4K.",habitat:"Kawiarnia, siłownia, lobby, kolejka",danger:"Detal, który nie powinien być ważny",procedure:"Nie pytaj siebie, dlaczego pamiętasz. To tylko pogarsza sprawę."},
    romantic:{name:"Romantyk Po Godzinach",code:"CHEM-74",desc:"Twierdzisz, że nie chodzi o wygląd. Chodzi o energię, chemię, sposób mówienia i coś trudnego do nazwania. Dziwnym trafem chemia często ma odkryte plecy.",quote:"To nie pożądanie. To bardzo zaawansowana interpretacja atmosfery.",habitat:"Bar, podróż, rozmowa po północy",danger:"Uśmiech z niewyjaśnionym znaczeniem",procedure:"Nie nadawaj chemii numeru telefonu."},
    reasonable:{name:"Człowiek Rozsądny™",code:"SAFE-ish",desc:"Praca, rodzina, rachunki, plan dnia. Wszystko działa. A potem ktoś wchodzi do windy i system na trzy sekundy przestaje być zgodny z dokumentacją techniczną.",quote:"Rozsądek działa świetnie. Poza momentami, kiedy jest naprawdę potrzebny.",habitat:"Wszędzie tam, gdzie nic miało się nie wydarzyć",danger:"„Tylko szybka kawa”",procedure:"Kontynuuj życie. Nie czytaj logów systemowych."},
    disaster:{name:"Katastrofa Kontrolowana",code:"RISK-RED",desc:"Wiesz, że to zły pomysł. Potrafisz nawet precyzyjnie wyjaśnić dlaczego. Informacja ta nie ma jednak zauważalnego wpływu na atrakcyjność pomysłu.",quote:"Ocena ryzyka: czerwona. Decyzja operacyjna: zobaczymy.",habitat:"Delegacja, bar, impreza, sytuacja bez świadków",danger:"Zdanie „co może pójść nie tak?”",procedure:"Jeśli właśnie to pomyślałeś — nie idź po kolejnego drinka."}
  };

  let idx=0, tally={}, sums=[0,0,0,0,0], lastResult=null;
  const intro=qs("[data-test-intro]"), question=qs("[data-test-question]"), result=qs("[data-test-result]");
  const resetState=()=>{idx=0;tally={professor:0,director:0,observer:0,romantic:0,reasonable:0,disaster:0};sums=[0,0,0,0,0];lastResult=null;};

  function renderQuestion(){
    const item=questions[idx];
    qs("[data-test-counter]").textContent=String(idx+1).padStart(2,"0")+" / "+String(questions.length).padStart(2,"0");
    qs("[data-test-progress]").style.width=((idx/questions.length)*100)+"%";
    qs("[data-test-case]").textContent=item.c;
    qs("[data-test-title]").textContent=item.q;
    const box=qs("[data-test-options]");
    box.innerHTML="";
    item.a.forEach((opt,n)=>{
      const b=document.createElement("button");
      b.type="button";
      b.className="lab-option";
      b.innerHTML="<b>"+String.fromCharCode(65+n)+"</b><span>"+opt[0]+"</span>";
      b.addEventListener("click",()=>choose(opt));
      box.appendChild(b);
    });
  }
  function choose(opt){
    tally[opt[1]]=(tally[opt[1]]||0)+1;
    opt[2].forEach((v,i)=>sums[i]+=v);
    idx++;
    if(idx<questions.length){renderQuestion();return;}
    showResult();
  }
  function showResult(){
    const ranked=Object.entries(tally).sort((a,b)=>b[1]-a[1]);
    let key=ranked[0][0];
    const values=sums.map(v=>clamp(v/(questions.length*10)*100));
    if(ranked.length>1 && ranked[0][1]===ranked[1][1]){
      if(values[2]>=72) key="disaster";
      else if(values[1]>=78) key="director";
      else if(values[4]>=78) key="observer";
      else if(values[3]>=72) key="romantic";
      else if(values[0]>=78) key="professor";
      else key="reasonable";
    }
    const p=profiles[key];
    lastResult={key,p,values};
    question.hidden=true; result.hidden=false;
    qs("[data-result-name]").textContent=p.name;
    qs("[data-result-code]").textContent=p.code;
    qs("[data-result-description]").textContent=p.desc;
    qs("[data-result-quote]").textContent=p.quote;
    qs("[data-result-habitat]").textContent=p.habitat;
    qs("[data-result-danger]").textContent=p.danger;
    qs("[data-result-procedure]").textContent=p.procedure;
    ["control","imagination","risk","ego","memory"].forEach((name,i)=>{
      qs('[data-metric="'+name+'"]').style.width=values[i]+"%";
      qs('[data-value="'+name+'"]').textContent=values[i]+"%";
    });
    qs("[data-result-status]").textContent="";
    result.scrollIntoView({behavior:"smooth",block:"center"});
  }
  qs("[data-test-start]")?.addEventListener("click",()=>{resetState();intro.hidden=true;question.hidden=false;result.hidden=true;renderQuestion();});
  qs("[data-test-reset]")?.addEventListener("click",()=>{resetState();result.hidden=true;question.hidden=true;intro.hidden=false;intro.scrollIntoView({behavior:"smooth",block:"center"});});
  const resultText=()=>{
    if(!lastResult) return "";
    const v=lastResult.values,p=lastResult.p;
    return "LAB 40+ — mój wynik: "+p.name+". Samokontrola "+v[0]+"%, wyobraźnia "+v[1]+"%, ryzyko "+v[2]+"%, ego "+v[3]+"%, pamięć szczegółów "+v[4]+"%. "+p.quote+" — piekne-ciala.vercel.app/lab";
  };
  qs("[data-share-result]")?.addEventListener("click",async()=>{
    const text=resultText(); if(!text)return;
    try{
      if(navigator.share) await navigator.share({title:"LAB 40+ — Piękne Ciała",text,url:location.href});
      else {await navigator.clipboard.writeText(text);qs("[data-result-status]").textContent="Wynik skopiowany do schowka.";}
    }catch(e){ if(e?.name!=="AbortError") qs("[data-result-status]").textContent="Nie udało się udostępnić. Użyj „Kopiuj opis”."; }
  });
  qs("[data-copy-result]")?.addEventListener("click",async()=>{
    try{await navigator.clipboard.writeText(resultText());qs("[data-result-status]").textContent="Opis wyniku skopiowany.";}
    catch(e){qs("[data-result-status]").textContent="Kopiowanie niedostępne w tej przeglądarce.";}
  });

  const brain={
    logic:["Kora przedczołowa","„Masz rodzinę. Zachowuj się normalnie.” Moduł działa poprawnie. Nie oznacza to, że ktoś go słucha."],
    limbic:["Układ limbiczny","Reakcja szybsza niż procedura. Oficjalny komunikat regionu: „Patrzyła.” Brak dodatkowych danych nie jest wymagany."],
    memory:["Pamięć długotrwała","Przechowuje dane o zaskakująco małej wartości operacyjnej: czerwona sukienka, lobby, 2019, 22:17."],
    rational:["Ośrodek racjonalizacji","Produkuje wersje zgodne z polityką wewnętrzną: „Przecież tylko rozmawialiśmy”, „to była zwykła uprzejmość”."],
    alarm:["System alarmowy","Aktywuje się błyskawicznie po wykryciu zdania: „Twoja żona właśnie idzie w tę stronę”."],
    denial:["Moduł samooszukiwania","Najbardziej stabilny komponent. Potrafi wygenerować raport końcowy: „Wcale na nią nie patrzyłem.”"]
  };
  qsa("[data-brain]").forEach(btn=>btn.addEventListener("click",()=>{
    const key=btn.dataset.brain,data=brain[key]; if(!data)return;
    qsa("[data-brain]").forEach(x=>x.classList.toggle("active",x.dataset.brain===key));
    qs("[data-brain-title]").textContent=data[0];
    qs("[data-brain-copy]").textContent=data[1];
  }));

  const scene={
    winda:{label:"WINDA",image:"/assets/site/about-elevator.webp",head:"To miała być tylko winda.",rational:"Patrz na numer piętra.",internal:"„Czy ona właśnie…?”"},
    hotel:{label:"HOTEL",image:"/assets/site/about-hotel.webp",head:"Miałeś tylko odebrać kartę do pokoju.",rational:"Weź kartę. Idź do pokoju.",internal:"„Dlaczego ona też jeszcze nie poszła?”"},
    bar:{label:"BAR",image:"/assets/art/ona-tanczy-hero.webp",head:"Miał być jeden drink.",rational:"Zamów i wróć do stolika.",internal:"„Może jednak wezmę jeszcze wodę.”"},
    lotnisko:{label:"AIRPORT",image:"/assets/art/american-girl-hero.webp",head:"Lot ma dwie godziny opóźnienia.",rational:"Naładuj telefon. Sprawdź gate.",internal:"„Dwie godziny to bardzo dużo czasu.”"},
    silownia:{label:"GYM",image:"/assets/art/silownia-i-lustra-hero.webp",head:"Przyszedłeś zrobić trening.",rational:"Jeszcze trzy serie. Patrz przed siebie.",internal:"„Lustro nie liczy się jako patrzenie.”"},
    biuro:{label:"OFFICE",image:"/assets/site/about-apartment.webp",head:"Zostało was dwoje i jedno światło.",rational:"Zamknij laptop. Jedź do domu.",internal:"„Jeszcze pięć minut brzmi podejrzanie długo.”"},
    plaza:{label:"BEACH",image:"/assets/art/zamek-z-piasku-hero.webp",head:"Miałeś odpoczywać.",rational:"Czytaj książkę.",internal:"„Który to był akapit?”"},
    miasto:{label:"CITY",image:"/assets/art/samotnosc-w-wielkim-miescie-hero.webp",head:"Miasto robi z trzech sekund całą noc.",rational:"Idź dalej.",internal:"„Ten zapach już gdzieś znam.”"}
  };
  const form=qs("[data-moment-form]");
  const control=form?.elements.control, chaos=form?.elements.chaos;
  const updateRanges=()=>{qs("[data-control-output]").textContent=control.value;qs("[data-chaos-output]").textContent=chaos.value;};
  control?.addEventListener("input",updateRanges); chaos?.addEventListener("input",updateRanges);

  function buildMoment(){
    if(!form)return;
    const d=new FormData(form),place=d.get("place"),s=scene[place]||scene.winda;
    const woman=d.get("woman"),detail=d.get("detail"),context=d.get("context");
    const ctrl=Number(d.get("control")),ch=Number(d.get("chaos"));
    const hh=String(20+Math.floor(ch/34)).padStart(2,"0");
    const mm=String((ctrl*7+ch*3)%60).padStart(2,"0");
    qs("[data-moment-image]").src=s.image;
    qs("[data-moment-image]").alt=woman+" — wygenerowany kadr "+s.label.toLowerCase();
    qs("[data-moment-location]").textContent=s.label+" · "+hh+":"+mm;
    qs("[data-moment-headline]").textContent=s.head;
    let opening="Ona: "+woman+". "+detail+". "+context.charAt(0).toUpperCase()+context.slice(1)+".";
    let middle=ctrl>=75?" Na zewnątrz zachowujesz się wzorowo.":ctrl>=45?" Na zewnątrz nadal wygląda to całkiem normalnie.":" Na zewnątrz system zaczyna gubić logi.";
    let ending=ch>=75?" W głowie sytuacja ma już status czerwony i soundtrack.":ch>=45?" Mózg dopisuje kilka scen, o które nikt go nie prosił.":" Przez chwilę prawie udaje się niczego nie dopisać.";
    qs("[data-moment-text]").textContent=opening+middle+ending;
    qs("[data-moment-rational]").textContent=s.rational;
    qs("[data-moment-internal]").textContent=s.internal;
  }
  form?.addEventListener("submit",e=>{e.preventDefault();buildMoment();qs("[data-moment-output]").scrollIntoView({behavior:"smooth",block:"center"});});
  qs("[data-moment-random]")?.addEventListener("click",()=>{
    if(!form)return;
    qsa("select",form).forEach(sel=>sel.selectedIndex=Math.floor(Math.random()*sel.options.length));
    control.value=25+Math.floor(Math.random()*71); chaos.value=25+Math.floor(Math.random()*76);
    updateRanges(); buildMoment();
  });
})();