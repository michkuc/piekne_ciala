(() => {
  "use strict";

  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const clamp=n=>Math.max(0,Math.min(100,Math.round(n)));

  const questions=[
    {c:"CASE 01 · ELEVATOR",q:"Winda. Jesteście sami. Ona poprawia włosy i patrzy w twoją stronę.",a:[
      ["Patrzę na numer piętra. Intensywnie.",[10,5,1,2,5]],
      ["Patrzę raz. Potem jeszcze raz, żeby upewnić się, że nie patrzę.",[7,7,3,4,9]],
      ["W głowie jestem już w trzecim akcie filmu.",[3,10,6,6,8]],
      ["Zastanawiam się, czy kamera w windzie ma dźwięk.",[4,8,8,5,6]]
    ]},
    {c:"CASE 02 · BAR",q:"Barmanka ma odkryte plecy i tatuaż smoka. Żona siedzi trzy metry dalej.",a:[
      ["Zamawiam wodę. To bezpieczna infrastruktura.",[10,4,1,2,4]],
      ["Wysyłam kolegę po drinka.",[9,5,2,3,6]],
      ["Idę po drinka siódmy raz. Obsługa musi mieć ruch.",[2,7,10,8,8]],
      ["Udaję, że naprawdę interesuje mnie skład toniku.",[6,8,5,8,7]]
    ]},
    {c:"CASE 03 · HOTEL",q:"Delegacja. 23:14. W lobby siada obok kobieta, którą widziałeś rano na śniadaniu.",a:[
      ["Kończę maila i idę spać. Teoretycznie.",[9,5,2,3,5]],
      ["Pamiętam stolik, filiżankę i kolor marynarki. Przypadkiem.",[7,7,3,4,10]],
      ["To już ma muzykę w tle.",[3,10,6,6,7]],
      ["Zostaję jeszcze jeden drink. Dla logistyki.",[3,7,9,7,6]]
    ]},
    {c:"CASE 04 · GYM",q:"Na siłowni łapiecie kontakt wzrokowy przez lustro. Dwa razy.",a:[
      ["Zmiana ćwiczenia. Zbyt dużo danych wejściowych.",[10,4,2,2,5]],
      ["To nic. Ale sprawdzę, czy stanie się trzeci raz.",[7,7,4,5,10]],
      ["Trzeci raz jest już statystycznie znaczący.",[5,8,5,9,7]],
      ["Właśnie wymyśliłem historię od lustra do parkingu.",[2,10,7,7,7]]
    ]},
    {c:"CASE 05 · AIRPORT",q:"Lot opóźniony dwie godziny. Ona siada obok przy gniazdku i pyta, czy ładowarka jest wolna.",a:[
      ["Tak. I to jest pełna treść rozmowy.",[10,3,1,2,4]],
      ["Tak. Po 15 minutach wiem, dokąd leci i po co.",[6,8,5,8,8]],
      ["Po 15 minutach wiem też, że ma pieprzyk nad lewą brwią.",[6,7,4,5,10]],
      ["W mojej głowie boarding już nas rozdziela dramatycznie.",[3,10,6,6,8]]
    ]},
    {c:"CASE 06 · OFFICE",q:"Biuro prawie puste. Zostaliście tylko wy. Ona mówi: „jeszcze pięć minut i uciekam”.",a:[
      ["Odpowiadam: „jasne”. Kończę Excela.",[9,4,2,3,4]],
      ["Słowo „uciekam” brzmi zdecydowanie zbyt filmowo.",[3,10,5,5,6]],
      ["Zaczynam analizować ton głosu jak zapis z czarnej skrzynki.",[6,7,4,5,10]],
      ["Proponuję windę razem. Co może pójść nie tak.",[3,7,9,7,6]]
    ]},
    {c:"CASE 07 · RESTAURANT",q:"Podwójna randka z żonami. Kelnerka uśmiecha się do was obu. Kolega też to zauważył.",a:[
      ["Nikt nic nie mówi. Profesjonalizm zespołu.",[9,5,2,3,6]],
      ["Kontakt wzrokowy z kolegą potwierdza incydent.",[7,6,4,6,10]],
      ["Zamawiam deser. Nie wiem po co, ale potrzebujemy czasu.",[3,7,8,8,7]],
      ["To nie flirt. To świetna obsługa. Prawie w to wierzę.",[8,6,3,5,6]]
    ]},
    {c:"CASE 08 · BEACH",q:"Plaża. Miałeś czytać książkę. Od pięciu minut czytasz ten sam akapit.",a:[
      ["Odwracam leżak. Ergonomia.",[10,5,2,2,5]],
      ["Nie patrzę. Rejestruję peryferyjnie.",[7,7,3,5,10]],
      ["Książka przegrywa z kinem wewnętrznym.",[3,10,6,6,7]],
      ["Uznaję, że to po prostu bardzo słaby akapit.",[8,6,3,4,5]]
    ]},
    {c:"CASE 09 · MESSAGE",q:"Po spotkaniu dostajesz wiadomość: „Miło było pogadać :)”.",a:[
      ["Odpisuję: „wzajemnie”. Koniec transmisji.",[10,3,1,2,4]],
      ["Analizuję dwukropek, nawias i czas wysłania.",[6,8,4,6,10]],
      ["Uśmiech ma znaczenie. Oczywiście, że ma.",[4,8,6,10,7]],
      ["Piszę trzy wersje odpowiedzi i żadnej nie wysyłam.",[5,10,4,6,8]]
    ]},
    {c:"CASE 10 · PARTY",q:"Firmowa impreza. Tańczycie w grupie. Przez chwilę jej dłoń zostaje na twoim ramieniu.",a:[
      ["Przypadek. Wracam do rozmowy.",[9,4,2,3,4]],
      ["Przypadek, który pamiętam następnego dnia o 07:12.",[6,7,4,5,10]],
      ["Muzyka robi się nagle podejrzanie dobrze dobrana.",[4,9,6,9,7]],
      ["W głowie operator już robi slow motion.",[2,10,7,7,7]]
    ]},
    {c:"CASE 11 · STREET",q:"Mija cię na ulicy. Perfumy zostają sekundę dłużej niż ona.",a:[
      ["Idę dalej. To miasto.",[9,4,2,2,4]],
      ["Zapach wraca wieczorem bez pytania o zgodę.",[6,8,3,4,10]],
      ["To dokładnie scena otwierająca piosenkę.",[3,10,5,6,8]],
      ["Odwracam się. Tylko żeby sprawdzić kierunek wiatru.",[3,7,9,8,7]]
    ]},
    {c:"CASE 12 · SELF REPORT",q:"Najbardziej niebezpieczne zdanie, jakie możesz sobie powiedzieć?",a:[
      ["„Mam wszystko pod kontrolą.”",[10,6,3,5,5]],
      ["„To tylko spojrzenie.”",[7,7,4,5,10]],
      ["„Zobaczymy, co się wydarzy.”",[2,7,10,8,6]],
      ["„Może to coś znaczy.”",[4,9,7,10,8]]
    ]},
    {c:"CASE 13 · AGE",q:"Na siłowni 24-latek mówi do ciebie „proszę pana”.",a:[
      ["Przyjmuję informację. Technicznie ma rację.",[9,4,2,2,5]],
      ["Dokładam ciężar. Zupełnie bez związku.",[4,6,7,10,5]],
      ["Wieczorem kontroluję linię włosów i światło w łazience.",[6,6,4,8,9]],
      ["Przez chwilę próbuję ustalić, kiedy dokładnie to się wydarzyło.",[6,8,3,6,10]]
    ]},
    {c:"CASE 14 · ARCHIVE",q:"Znajdujesz zdjęcie siebie sprzed piętnastu lat.",a:[
      ["Uśmiecham się i odkładam telefon.",[8,5,2,3,8]],
      ["Porównuję włosy, brzuch i poziom bezczelności.",[5,6,4,9,9]],
      ["Pamiętam noc po tym zdjęciu lepiej niż zeszły wtorek.",[5,9,4,7,10]],
      ["Wysyłam kumplowi: „my naprawdę tak wyglądaliśmy?”",[7,7,3,5,8]]
    ]},
    {c:"CASE 15 · SILENCE",q:"Hotel. Obce miasto. 23:40. Tym razem naprawdę jesteś sam.",a:[
      ["Prysznic, sen, rano śniadanie. Koniec historii.",[10,4,1,2,5]],
      ["Stoję przy oknie trochę za długo. Miasto robi resztę.",[6,9,3,6,10]],
      ["Sprawdzam, kto jeszcze jest online. Czysto informacyjnie.",[4,8,8,8,8]],
      ["Nalewam coś do szklanki i pozwalam ciszy wygrać.",[8,7,2,4,9]]
    ]}
  ];

  const profiles={
    professor:{
      name:"Profesor Samokontroli",code:"CTRL-92",target:[82,60,28,42,75],
      desc:"Na zewnątrz nic się nie dzieje. W środku trwa pełne posiedzenie zarządu. Twoją specjalnością nie jest brak impulsu — tylko profesjonalne zarządzanie jego widocznością.",
      quote:"„Nic nie zrobiłem” jest technicznie prawdą. I bardzo niepełnym raportem.",
      habitat:"Winda, restauracja, każde miejsce z lustrem",danger:"Sytuacja, w której ktoś naprawdę odwzajemnia spojrzenie",procedure:"Patrz na numer piętra. Nie analizuj numeru piętra.",
      song:{title:"Mam Żonę",slug:"mam-zone",cover:"/assets/art/mam-zone-cover.webp",why:"Bo granica działa — tylko mózg lubi przy niej postać sekundę za długo."}
    },
    director:{
      name:"Reżyser",code:"CINEMA-40",target:[45,88,48,60,82],
      desc:"Jedno spojrzenie wystarcza, żeby powstały scena, dialog, światło, soundtrack i alternatywne zakończenie. Rzeczywistość dostarcza materiału. Resztę produkujesz sam.",
      quote:"Ona powiedziała „dzień dobry”. Ty masz już teaser, plakat i premierę.",
      habitat:"Hotel, lotnisko, nocne miasto",danger:"Dwie sekundy ciszy i dobre światło",procedure:"Oddziel materiał źródłowy od wersji reżyserskiej.",
      song:{title:"Po Północy",slug:"po-polnocy",cover:"/assets/art/po-polnocy-cover.webp",why:"Bo u ciebie prawdziwa historia zaczyna się zwykle wtedy, gdy oficjalna wersja wieczoru już śpi."}
    },
    observer:{
      name:"Obserwator",code:"MEM-99",target:[66,70,32,45,94],
      desc:"Teoretycznie niewinny. Praktycznie pamiętasz kolor sukienki, godzinę, zapach i po której stronie stała filiżanka. Niczego nie planujesz. Po prostu twój mózg prowadzi archiwum bez zgody administratora.",
      quote:"Nie patrzyłeś długo. Po prostu zapisałeś wszystko w 4K.",
      habitat:"Kawiarnia, siłownia, lobby, kolejka",danger:"Detal, który nie powinien być ważny",procedure:"Nie pytaj siebie, dlaczego pamiętasz. To tylko pogarsza sprawę.",
      song:{title:"Piękne Ciała · Na co dzień",slug:"na-co-dzien",cover:"/assets/art/na-co-dzien-cover.webp",why:"Bo twój radar nie potrzebuje hotelu ani klubu. Wystarczy zwykły wtorek."}
    },
    romantic:{
      name:"Romantyk Po Godzinach",code:"CHEM-74",target:[48,84,50,78,75],
      desc:"Twierdzisz, że nie chodzi o wygląd. Chodzi o energię, chemię, sposób mówienia i coś trudnego do nazwania. Dziwnym trafem chemia często ma odkryte plecy.",
      quote:"To nie pożądanie. To bardzo zaawansowana interpretacja atmosfery.",
      habitat:"Bar, podróż, rozmowa po północy",danger:"Uśmiech z niewyjaśnionym znaczeniem",procedure:"Nie nadawaj chemii numeru telefonu.",
      song:{title:"Dotyk Nocy",slug:"dotyk-nocy",cover:"/assets/art/dotyk-nocy-cover.webp",why:"Bo kilka centymetrów i jedna sekunda wystarczą ci do zbudowania całej teorii chemii."}
    },
    reasonable:{
      name:"Człowiek Rozsądny™",code:"SAFE-ish",target:[88,50,24,35,55],
      desc:"Praca, rodzina, rachunki, plan dnia. Wszystko działa. A potem coś drobnego przypomina, że dojrzałość nie wyłącza instynktu — tylko lepiej go opakowuje.",
      quote:"Rozsądek działa świetnie. Poza momentami, kiedy jest naprawdę potrzebny.",
      habitat:"Wszędzie tam, gdzie nic miało się nie wydarzyć",danger:"„Tylko szybka kawa”",procedure:"Kontynuuj życie. Nie czytaj logów systemowych.",
      song:{title:"Piękne Ciała",slug:"piekne-ciala",cover:"/assets/art/piekne-ciala-cover.webp",why:"Bo to profil najbliższy źródłowemu DNA: poker face na zewnątrz, pełny ruch w środku."}
    },
    disaster:{
      name:"Katastrofa Kontrolowana",code:"RISK-RED",target:[36,72,72,76,68],
      desc:"Wiesz, że to zły pomysł. Potrafisz nawet precyzyjnie wyjaśnić dlaczego. Informacja ta nie ma jednak zauważalnego wpływu na atrakcyjność pomysłu.",
      quote:"Ocena ryzyka: czerwona. Decyzja operacyjna: zobaczymy.",
      habitat:"Delegacja, bar, impreza, sytuacja bez świadków",danger:"Zdanie „co może pójść nie tak?”",procedure:"Jeśli właśnie to pomyślałeś — nie idź po kolejnego drinka.",
      song:{title:"Christmas Party",slug:"christmas-party",cover:"/assets/art/christmas-party-cover.webp",why:"Bo tam kultura organizacyjna też traci kontrolę dokładnie wtedy, gdy wszystko miało być profesjonalne."}
    }
  };

  const metricBounds=metricKeysFromQuestions();
  const profileCalibration={
    professor:{mean:3149.516,sd:1866.680},
    director:{mean:3067.572,sd:1816.857},
    observer:{mean:3191.294,sd:1159.471},
    romantic:{mean:3645.999,sd:2029.791},
    reasonable:{mean:7283.095,sd:3100.151},
    disaster:{mean:5919.782,sd:2521.409}
  };
  const calibrationBeta=.5;

  function metricKeysFromQuestions(){
    const min=[0,0,0,0,0],max=[0,0,0,0,0];
    questions.forEach(item=>{
      for(let i=0;i<5;i++){
        const values=item.a.map(option=>option[1][i]);
        min[i]+=Math.min(...values);
        max[i]+=Math.max(...values);
      }
    });
    const scale=questions.length*10;
    return {
      min:min.map(v=>v/scale*100),
      max:max.map(v=>v/scale*100)
    };
  }

  function normalizeMetrics(values){
    return values.map((value,i)=>{
      const lo=metricBounds.min[i],hi=metricBounds.max[i];
      return Math.max(0,Math.min(100,(value-lo)/(hi-lo)*100));
    });
  }

  const metricKeys=["control","imagination","risk","ego","memory"];
  let idx=0,sums=[0,0,0,0,0],lastResult=null;
  const intro=qs("[data-test-intro]"),question=qs("[data-test-question]"),result=qs("[data-test-result]");

  const resetState=()=>{idx=0;sums=[0,0,0,0,0];lastResult=null;};

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
      b.setAttribute("aria-label","Odpowiedź "+String.fromCharCode(65+n)+": "+opt[0]);
      b.innerHTML="<b aria-hidden=\"true\">"+String.fromCharCode(65+n)+"</b><span>"+opt[0]+"</span>";
      b.addEventListener("click",()=>choose(opt[1]));
      box.appendChild(b);
    });
    requestAnimationFrame(()=>question?.focus({preventScroll:true}));
  }

  function choose(axis){
    axis.forEach((v,i)=>sums[i]+=v);
    idx++;
    if(idx<questions.length){renderQuestion();return;}
    showResult();
  }

  function nearestProfile(values){
    const normalized=normalizeMetrics(values);
    return Object.entries(profiles)
      .map(([key,p])=>{
        const target=normalizeMetrics(p.target);
        const distance=target.reduce((sum,v,i)=>sum+Math.pow(normalized[i]-v,2),0);
        const calibration=profileCalibration[key];
        const standardized=(distance-calibration.mean)/calibration.sd;
        const score=standardized+calibrationBeta*(distance/10000);
        return {key,p,distance,score};
      })
      .sort((a,b)=>a.score-b.score)[0];
  }

  function showResult(){
    const values=sums.map(v=>clamp(v/(questions.length*10)*100));
    const match=nearestProfile(values);
    const p=match.p;
    lastResult={key:match.key,p,values};
    question.hidden=true;
    result.hidden=false;
    qs("[data-result-name]").textContent=p.name;
    qs("[data-result-code]").textContent=p.code;
    qs("[data-result-description]").textContent=p.desc;
    qs("[data-result-quote]").textContent=p.quote;
    qs("[data-result-habitat]").textContent=p.habitat;
    qs("[data-result-danger]").textContent=p.danger;
    qs("[data-result-procedure]").textContent=p.procedure;
    metricKeys.forEach((name,i)=>{
      qs('[data-metric="'+name+'"]').style.width=values[i]+"%";
      qs('[data-value="'+name+'"]').textContent=values[i]+"%";
    });
    const song=p.song;
    qs("[data-result-song-title]").textContent=song.title;
    qs("[data-result-song-copy]").textContent=song.why;
    qs("[data-result-song-cover]").src=song.cover;
    qs("[data-result-song-cover]").alt="Okładka utworu "+song.title;
    qs("[data-result-song-link]").href="/stories/"+song.slug;
    qs("[data-result-status]").textContent="";
    result.focus({preventScroll:true});
    result.scrollIntoView({behavior:"smooth",block:"center"});
  }

  qs("[data-test-start]")?.addEventListener("click",()=>{
    resetState();intro.hidden=true;question.hidden=false;result.hidden=true;renderQuestion();
  });
  qs("[data-test-reset]")?.addEventListener("click",()=>{
    resetState();result.hidden=true;question.hidden=true;intro.hidden=false;
    intro.scrollIntoView({behavior:"smooth",block:"center"});
    qs("[data-test-start]")?.focus({preventScroll:true});
  });

  const resultText=(withUrl=true)=>{
    if(!lastResult) return "";
    const v=lastResult.values,p=lastResult.p;
    const base="LAB 40+ — mój wynik: "+p.name+". Samokontrola "+v[0]+"%, wyobraźnia "+v[1]+"%, ryzyko "+v[2]+"%, ego "+v[3]+"%, pamięć szczegółów "+v[4]+"%. "+p.quote;
    return withUrl?base+" — "+location.origin+"/lab":base;
  };

  qs("[data-share-result]")?.addEventListener("click",async()=>{
    if(!lastResult)return;
    try{
      if(navigator.share) await navigator.share({title:"LAB 40+ — Piękne Ciała",text:resultText(false),url:location.origin+"/lab"});
      else {await navigator.clipboard.writeText(resultText(true));qs("[data-result-status]").textContent="Wynik skopiowany do schowka.";}
    }catch(e){if(e?.name!=="AbortError")qs("[data-result-status]").textContent="Nie udało się udostępnić. Użyj „Kopiuj opis”.";}
  });

  qs("[data-copy-result]")?.addEventListener("click",async()=>{
    try{await navigator.clipboard.writeText(resultText(true));qs("[data-result-status]").textContent="Opis wyniku skopiowany.";}
    catch{qs("[data-result-status]").textContent="Kopiowanie niedostępne w tej przeglądarce.";}
  });

  const brain={
    logic:["Kora przedczołowa","„Masz rodzinę. Zachowuj się normalnie.” Moduł działa poprawnie. Nie oznacza to, że ktoś go słucha."],
    limbic:["Układ limbiczny","Reakcja szybsza niż procedura. Oficjalny komunikat regionu: „Patrzyła.” Brak dodatkowych danych nie jest wymagany."],
    memory:["Pamięć długotrwała","Przechowuje dane o zaskakująco małej wartości operacyjnej: czerwona sukienka, lobby, 2019, 22:17."],
    rational:["Ośrodek racjonalizacji","Produkuje wersje zgodne z polityką wewnętrzną: „Przecież tylko rozmawialiśmy”, „to była zwykła uprzejmość”."],
    alarm:["System alarmowy","Aktywuje się błyskawicznie po wykryciu zdania: „Twoja żona właśnie idzie w tę stronę”."],
    denial:["Moduł samooszukiwania","Najbardziej stabilny komponent. Potrafi wygenerować raport końcowy: „Wcale na nią nie patrzyłem.”"]
  };

  function setBrain(key){
    const data=brain[key];if(!data)return;
    qsa("[data-brain]").forEach(x=>{
      const on=x.dataset.brain===key;
      x.classList.toggle("active",on);
      x.setAttribute("aria-pressed",on?"true":"false");
    });
    qs("[data-brain-title]").textContent=data[0];
    qs("[data-brain-copy]").textContent=data[1];
  }
  qsa("[data-brain]").forEach(btn=>btn.addEventListener("click",()=>setBrain(btn.dataset.brain)));

  const scenes={
    winda:{label:"WINDA",image:"/assets/site/about-elevator.webp",heroine:"kobieta stojąca pół kroku obok",head:"To miała być tylko winda.",rational:"Patrz na numer piętra.",internal:"„Czy ona właśnie…?”"},
    hotel:{label:"HOTEL",image:"/assets/site/about-hotel.webp",heroine:"kobieta z hotelowego lobby",head:"Miałeś tylko odebrać kartę do pokoju.",rational:"Weź kartę. Idź do pokoju.",internal:"„Dlaczego ona też jeszcze nie poszła?”"},
    bar:{label:"BAR",image:"/assets/art/ona-tanczy-hero.webp",heroine:"brunetka, której gest wygląda podejrzanie filmowo",head:"Miał być jeden drink.",rational:"Zamów i wróć do stolika.",internal:"„Może jednak wezmę jeszcze wodę.”"},
    lotnisko:{label:"AIRPORT",image:"/assets/art/american-girl-hero.webp",heroine:"kobieta z lotniskowego lounge",head:"Lot ma dwie godziny opóźnienia.",rational:"Naładuj telefon. Sprawdź gate.",internal:"„Dwie godziny to bardzo dużo czasu.”"},
    silownia:{label:"GYM",image:"/assets/art/silownia-i-lustra-hero.webp",heroine:"kobieta po drugiej stronie lustra",head:"Przyszedłeś zrobić trening.",rational:"Jeszcze trzy serie. Patrz przed siebie.",internal:"„Lustro nie liczy się jako patrzenie.”"},
    biuro:{label:"OFFICE",image:"/assets/site/about-apartment.webp",heroine:"kobieta, która też została po godzinach",head:"Zostało was dwoje i jedno światło.",rational:"Zamknij laptop. Jedź do domu.",internal:"„Jeszcze pięć minut brzmi podejrzanie długo.”"},
    plaza:{label:"BEACH",image:"https://drive.google.com/thumbnail?id=1GrhzgYVZr00YJ274F-KWWlbh3Qx4R0fV&sz=w1800",heroine:"kobieta mijana podczas rodzinnego dnia na plaży",head:"Miałeś odpoczywać.",rational:"Czytaj książkę. Buduj zamek.",internal:"„Który to był akapit?”"},
    miasto:{label:"CITY",image:"/assets/art/samotnosc-w-wielkim-miescie-hero.webp",heroine:"kobieta mijana w nocnym mieście",head:"Miasto robi z trzech sekund całą noc.",rational:"Idź dalej.",internal:"„Ten zapach już gdzieś znam.”"}
  };

  const form=qs("[data-moment-form]");
  const control=form?.elements.control,chaos=form?.elements.chaos;
  const updateRanges=()=>{
    if(control)qs("[data-control-output]").textContent=control.value;
    if(chaos)qs("[data-chaos-output]").textContent=chaos.value;
  };
  control?.addEventListener("input",updateRanges);
  chaos?.addEventListener("input",updateRanges);

  function buildMoment(){
    if(!form)return;
    const d=new FormData(form),place=d.get("place"),s=scenes[place]||scenes.winda;
    const detail=d.get("detail"),context=d.get("context");
    const ctrl=Number(d.get("control")),ch=Number(d.get("chaos"));
    const hh=String(20+Math.floor(ch/34)).padStart(2,"0");
    const mm=String((ctrl*7+ch*3)%60).padStart(2,"0");
    qs("[data-moment-image]").src=s.image;
    qs("[data-moment-image]").alt=s.heroine+" — kadr referencyjny "+s.label.toLowerCase();
    qs("[data-moment-location]").textContent=s.label+" · "+hh+":"+mm;
    qs("[data-moment-headline]").textContent=s.head;
    const opening="W kadrze: "+s.heroine+". "+detail+". "+context.charAt(0).toUpperCase()+context.slice(1)+".";
    const middle=ctrl>=75?" Na zewnątrz zachowujesz się wzorowo.":ctrl>=45?" Na zewnątrz nadal wygląda to całkiem normalnie.":" Na zewnątrz system zaczyna gubić logi.";
    const ending=ch>=75?" W głowie sytuacja ma już status czerwony i soundtrack.":ch>=45?" Mózg dopisuje kilka scen, o które nikt go nie prosił.":" Przez chwilę prawie udaje się niczego nie dopisać.";
    qs("[data-moment-text]").textContent=opening+middle+ending;
    qs("[data-moment-rational]").textContent=s.rational;
    qs("[data-moment-internal]").textContent=s.internal;
  }

  form?.addEventListener("submit",e=>{
    e.preventDefault();buildMoment();qs("[data-moment-output]").scrollIntoView({behavior:"smooth",block:"center"});
  });
  qs("[data-moment-random]")?.addEventListener("click",()=>{
    if(!form)return;
    qsa("select",form).forEach(sel=>sel.selectedIndex=Math.floor(Math.random()*sel.options.length));
    control.value=25+Math.floor(Math.random()*71);
    chaos.value=25+Math.floor(Math.random()*76);
    updateRanges();buildMoment();
  });
})();