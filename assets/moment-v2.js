(() => {
  "use strict";
  const gallery = document.querySelector("[data-moment-grid]");
  if (!gallery) return;
  const perspectives = [
    {mind:"Wyobraźnia zgłosiła: 97% szans na początek wielkiej historii. Dane wejściowe: jeden uśmiech.",verdict:"Raport końcowy: kupił mleko. Wspomnienie zapisane jako „chemia przy nabiale”."},
    {mind:"Zrozumiał to jako zagajenie rozmowy. W myślach zdążył już zaproponować wspólną podróż.",verdict:"Była uprzejma, a on ma już plan B, C i wspólny bilet miesięczny."},
    {mind:"Trzy sekundy kontaktu wzrokowego. W głowie — czołówka filmu, dramatyczne rozstanie i kontynuacja.",verdict:"Rzeczywistość: komunikat o opóźnieniu. Wyobraźnia: niedoszły romans stulecia."},
    {mind:"Najpierw wspólny popcorn, potem wielkie uczucie. Tak przynajmniej montuje to jego mózg.",verdict:"Kino trwało 110 minut. Historia, którą wymyślił — przynajmniej trzy sezony."},
    {mind:"Zapach wybrał. Ona potwierdziła. Narrator dopisał do tej chwili dwie kolejne randki.",verdict:"Perfumy trzymały się osiem godzin. Interpretacja sytuacji zdecydowanie dłużej."},
    {mind:"Wspólna piosenka stała się dla niego prywatnym hymnem relacji, o której nikt jeszcze nie rozmawiał.",verdict:"Numeru telefonu brak. Za to ma nową playlistę z bardzo konkretnym podtekstem."}
  ];
  const cards=Array.from(gallery.querySelectorAll("[data-moment-card]"));
  for(const [i,card] of cards.entries()){
    const paragraphs=card.querySelector("[data-moment-copy]");
    const label=card.querySelector("[data-moment-label]");
    const fact=paragraphs.textContent;
    const choices=Array.from(card.querySelectorAll("[data-moment-mode]"));
    for(const button of choices){
      button.addEventListener("click",()=>{
        const mode=button.dataset.momentMode;
        if(!["fact","mind","verdict"].includes(mode))return;
        paragraphs.textContent=mode==="fact"?fact:perspectives[i][mode];
        label.textContent={fact:"01 · FAKTY",mind:"02 · W JEGO GŁOWIE",verdict:"03 · BRUTALNA PUENTA"}[mode];
        choices.forEach(b=>b.setAttribute("aria-pressed",b===button?"true":"false"));
      });
    }
  }
})();