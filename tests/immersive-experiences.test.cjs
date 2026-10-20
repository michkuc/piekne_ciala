const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const read=p=>fs.readFileSync(path.resolve(__dirname,"..",p),"utf8");
const slugs=["cieply-grzech","po-godzinach","ona-tanczy"];

test("Story Mode is discoverable from home and three song stories",()=>{
 const home=read("index.html"),page=read("story-mode.html"),app=read("assets/app.js");
 assert.match(home,/id="home-story-title"/);
 assert.match(home,/href="\/story-mode\?slug=cieply-grzech"/);
 for(const slug of slugs)assert.match(page,new RegExp('data-story-choose="'+slug+'"'));
 assert.match(app,/includes\(song\.slug\).*Zobacz Story Mode/);
 assert.match(page,/src="\/assets\/story-mode\.js"/);
 assert.match(page,/data-story-audio preload="none"/);
 assert.match(read("sitemap.xml"),/https:\/\/piekne-ciala\.vercel\.app\/story-mode/);
});

test("Three storyboard arcs have four distinct, correctly titled steps and use existing audio",()=>{
 const js=read("assets/story-mode.js");
 for(const slug of slugs)assert.ok(js.includes('"'+slug+'"'),slug);
 for(const label of ["RZECZYWISTOŚĆ","W JEGO GŁOWIE","WERSJA OFICJALNA","PO WSZYSTKIM"])assert.ok(js.includes(label),label);
 assert.match(js,/const song=currentSong\(\)/);
 assert.match(js,/audio\.src=song\.audio/);
 assert.doesNotMatch(js,/audio\.autoplay|autoplay\s*=\s*true/);
 assert.match(js,/params\.get\("scene"\)/);
 assert.match(js,/history\.replaceState/);
 assert.match(read("assets/story-mode.css"),/prefers-reduced-motion/);
});

test("Six original Moment images are retained with three independent viewpoint selectors",()=>{
 const html=read("archive.html");
 const section=html.slice(html.indexOf('<section class="section wrap moment-section"'),html.indexOf('<section class="archive-closing wrap">'));
 const articles=[...section.matchAll(/<article class="moment-card moment-card-v2"[\s\S]*?<\/article>/g)].map(m=>m[0]);
 assert.equal(articles.length,6);
 const ids=["1UOKMdQwL0VJoD5KB078-hJMHhJld5XWN","15LzGdT1NlxIddZKCo2OLk5YpvODQEwzh","1BBR6k36tc69fFmFb4mRpc2jt8tYAQ5NP","18qgnWnjMKtJEmN6BE9LCRG31uhsQ4-VV","1w0fspMRWkAuGVSpxXsK8mu0T8jpoiNUV","1RNewaN2I4ipQfw4BSCG33FISeoA3YMFF"];
 for(let i=0;i<6;i++){
   assert.ok(articles[i].includes(ids[i]));
   assert.match(articles[i],/data-lightbox-group="moment"/);
   assert.match(articles[i],/data-moment-mode="fact" aria-pressed="true"/);
   assert.match(articles[i],/data-moment-mode="mind" aria-pressed="false"/);
   assert.match(articles[i],/data-moment-mode="verdict" aria-pressed="false"/);
   assert.match(articles[i],/data-moment-copy aria-live="polite"/);
 }
 assert.match(html,/src="\/assets\/moment-v2\.js"/);
});

test("Moment 2.0 switches one card without altering another card",()=>{
 const source=read("assets/moment-v2.js");
 const fakeCard=idx=>{
   const copy={textContent:"Fact "+idx};
   const label={textContent:"01 · FAKTY"};
   const modes=["fact","mind","verdict"].map(mode=>({
     dataset:{momentMode:mode},attribs:{},listeners:{},
     setAttribute(name,value){this.attribs[name]=value;},
     addEventListener(name,handler){this.listeners[name]=handler;},
     click(){this.listeners.click();}
   }));
   return {copy,label,modes,querySelector(s){return s.includes("copy")?copy:label;},querySelectorAll(){return modes;}};
 };
 const cards=Array.from({length:6},(_,i)=>fakeCard(i));
 const gallery={querySelectorAll:()=>cards};
 vm.runInNewContext(source,{document:{querySelector:()=>gallery}});
 cards[0].modes[1].click();
 assert.match(cards[0].copy.textContent,/97% szans/);
 assert.equal(cards[0].modes[1].attribs["aria-pressed"],"true");
 assert.equal(cards[1].copy.textContent,"Fact 1");
 cards[0].modes[2].click();
 assert.match(cards[0].copy.textContent,/Raport końcowy/);
 cards[0].modes[0].click();
 assert.equal(cards[0].copy.textContent,"Fact 0");
});

test("Brutal Truth has 12 original collapsible cards and four filter categories",()=>{
 const html=read("manual.html");
 const section=html.slice(html.indexOf('id="brutal-truth"'),html.indexOf('<section class="manual-rule40">'));
 const details=[...section.matchAll(/<details class="truth-card"[\s\S]*?<\/details>/g)].map(m=>m[0]);
 assert.equal(details.length,12);
 const counts={};
 for(const card of details){
   const category=card.match(/data-truth-category="([^"]+)"/)?.[1];
   counts[category]=(counts[category]||0)+1;
   assert.match(card,/<summary>/);
   assert.match(card,/ON MYŚLI/);
   assert.match(card,/BRUTAL TRUTH/);
 }
 assert.deepEqual(counts,{wyglad:3,rozmowa:3,digital:3,sytuacje:3});
 for(const category of ["all","wyglad","rozmowa","digital","sytuacje"])assert.ok(section.includes('data-truth-filter="'+category+'"'));
 assert.match(section,/data-truth-random/);
 assert.match(read("assets/manual.js"),/lastRandom/);
 assert.match(read("assets/manual.js"),/scrollIntoView/);
});

test("Existing creative pages, 70 archive images and 23 songs are untouched",()=>{
 const archive=read("archive.html"),man=read("about.html"),songs=read("assets/songs.js"),home=read("index.html");
 assert.equal((archive.match(/<button class="gallery-open\b/g)||[]).length,70);
 assert.equal((archive.match(/data-archive-selected="true"/g)||[]).length,15);
 assert.ok(man.includes('id="man-window-title"'));
 assert.equal((songs.match(/\{n:\d+,slug:/g)||[]).length,23);
 assert.ok(home.includes('href="/manual#brutal-truth"'));
 assert.ok(home.includes('href="/archive#moment-przed-po"'));
});

test("Mobile, navigation, focus, and safe non-autoplay media controls remain supported",()=>{
 const css=read("assets/story-mode.css"),moment=read("assets/styles.css"),manual=read("assets/manual.css");
 assert.match(css,/@media\(max-width:700px\)/);
 assert.match(css, /prefers-reduced-motion/);
 assert.match(moment,/\.moment-card-v2 \.moment-visual:focus-visible/);
 assert.match(manual,/\.truth-card summary:focus-visible/);
 assert.match(read("assets/story-mode.js"),/audio\.play\(\)/);
 assert.match(read("story-mode.html"),/data-story-play aria-label="Odtwórz muzykę"/);
});
