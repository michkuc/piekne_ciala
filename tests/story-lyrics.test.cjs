const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const read=p=>fs.readFileSync(path.resolve(__dirname,"..",p),"utf8");
const cases=require("../assets/story-scenes.js");
const context={window:{}};
vm.runInNewContext(read("assets/lyrics.js"),context);
const lyrics=context.window.PC_LYRICS;

test("Ciepły Grzech follows original verse 1 → bar → lips → outro",()=>{
 const scenes=cases["cieply-grzech"];
 assert.equal(scenes.length,4);
 assert.deepEqual(scenes.map(s=>s.section),["ZWROTKA 1","ZWROTKA 2","ZWROTKA 2 / REFREN","OUTRO"]);
 const text=lyrics["cieply-grzech"].text;
 const offsets=scenes.map(scene=>text.indexOf(scene.cue));
 assert.ok(offsets.every(offset=>offset>=0),"each excerpt must occur in supplied song lyrics");
 assert.ok(offsets.every((value,i)=>!i || value>offsets[i-1]),"source excerpts follow the song in order");
 assert.match(scenes[1].text,/barze|bar/);
 assert.match(scenes[2].text,/usta|oddech|blisko/);
 assert.match(scenes[3].text,/diab/);
 assert.notEqual(scenes[0].image,scenes[1].image,"lonely apartment must not look like bar");
 assert.equal(scenes[1].image,scenes[2].image,"same bar protagonist between consecutive sensual beats");
});

test("Po Godzinach preserves female POV, the blouse detail and unresolved ending",()=>{
 const scenes=cases["po-godzinach"];
 assert.equal(scenes.length,4);
 const text=lyrics["po-godzinach"].text;
 const offsets=scenes.map(scene=>text.indexOf(scene.cue));
 assert.ok(offsets.every(offset=>offset>=0),"Po Godzinach cues are authentic song fragments");
 assert.ok(offsets.every((value,i)=>!i || value>offsets[i-1]),"song lines remain in original order");
 assert.match(scenes[0].text,/Ona mogła wyjść/);
 assert.match(scenes[2].text,/koszul/);
 assert.match(scenes[3].text,/jutro|Jutro/);
 assert.notEqual(scenes[1].image,scenes[2].image,"physical proximity is a distinct shot");
 assert.equal(scenes[2].image,scenes[3].image,"same woman between two close scenes");
});

test("Ona Tańczy is honestly marked as synopsis-based, not invented song lyrics",()=>{
 assert.equal(lyrics["ona-tanczy"],undefined);
 const scenes=cases["ona-tanczy"];
 assert.equal(scenes.length,4);
 assert.ok(scenes.every(scene=>scene.source==="synopsis"));
 assert.ok(scenes.every(scene=>scene.section==="OPIS UTWORU"));
 assert.ok(scenes.every(scene=>scene.cue.startsWith("Opis historii:")));
 assert.equal(scenes[0].image,scenes[1].image,"same dancer between first two views");
 assert.doesNotMatch(scenes.map(s=>s.text).join(" "),/ona wyszła|pocałowała go|poszli razem|wraca sam/i);
});

test("Story Mode shows source attribution, lyric cue and stage progression",()=>{
 const html=read("story-mode.html");
 const js=read("assets/story-mode.js");
 const css=read("assets/story-mode.css");
 assert.match(html,/src="\/assets\/story-scenes\.js(?:\?[^"]+)?"/);
 assert.ok(html.indexOf("/assets/story-scenes.js")<html.indexOf("/assets/story-mode.js"));
 assert.match(html,/data-story-cue/);
 assert.match(html,/data-story-notice/);
 assert.match(js,/scene\.source === "lyrics"/);
 assert.match(js,/scene\.stage\.toUpperCase\(\)/);
 assert.match(js,/caption\.textContent = selected\(\)\[i\]\.stage/);
 assert.match(js,/img\.style\.setProperty\("--story-zoom"/);
 assert.match(css,/var\(--story-zoom,1\)/);
 assert.match(css,/\.story-lyric-strip/);
});

test("No missing or foreign-source image references, and original player remains intact",()=>{
 const songs=read("assets/songs.js");
 const audioBlock=songs.split("const PC_AUDIO_IDS = {")[1].split("};")[0];
 const ids=[...audioBlock.matchAll(/^\s*\d+:\s*"([^"]+)"/gm)].map(m=>m[1]);
 assert.equal(ids.length,23);
 for(const [slug,scenes] of Object.entries(cases)){
   assert.equal(scenes.length,4,slug);
   for(const scene of scenes)assert.match(scene.image,/^[A-Za-z0-9_-]{25,}$/);
 }
 assert.match(read("assets/story-mode.js"),/audio\.play\(\)/);
 assert.doesNotMatch(read("assets/story-mode.js"),/autoplay\s*=\s*true/);
});
