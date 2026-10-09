const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname,"..");
const read = (name) => fs.readFileSync(path.join(root,name),"utf8");

function loadCatalog() {
  const context = {window:{}};
  vm.runInNewContext(read("assets/songs.js"),context);
  vm.runInNewContext(read("assets/lyrics.js"),context);
  return context.window;
}

test("New 23rd track is unique, indexed and available for playback", () => {
  const data = loadCatalog();
  const songs = data.PC_SONGS;
  assert.equal(songs.length,23);
  assert.deepEqual(songs.map(s => s.n),Array.from({length:23},(_,i)=>i+1));
  assert.equal(new Set(songs.map(s=>s.slug)).size,23);
  assert.equal(new Set(songs.map(s=>s.audio)).size,23);
  const song = data.PC.getSong("cieply-grzech");
  assert.ok(song);
  assert.equal(song.n,23);
  assert.equal(song.title,"Ciepły Grzech");
  assert.equal(song.series,"main");
  assert.equal(song.audio,"/api/audio?id=1WDM5vw1I_VMWQ0PJZb5OLXdZcDUidT-u");
  assert.equal(song.cover,"1igP6LowN0i49bCrd5u4M0N31mQ21En8v");
  assert.equal(song.hero,song.cover);
  assert.equal(song.externalArt,true);
});

test("Ciepły Grzech lyrics preserve author text without cosmetic rewrites",()=>{
  const lyrics=loadCatalog().PC_LYRICS["cieply-grzech"];
  assert.ok(lyrics);
  assert.equal(lyrics.archiveTitle,"CIEPŁY GRZECH");
  assert.equal(lyrics.archiveNumber,31);
  assert.match(lyrics.text,/W nocy pachnie dymem i winem/);
  assert.match(lyrics.text,/spojrzenie jak katar/);
  assert.match(lyrics.text,/Ona i ja, nikt więcej w ciepły grzech/);
  assert.match(lyrics.text,/Każdy święty ma w sobie diabła/);
  assert.match(lyrics.text,/Ja po prostu się z nim dogadałem$/);
  assert.equal((lyrics.text.match(/\[Chorus\]/g)||[]).length,3);
});

test("Server allows track 23 and publishes distinct song metadata",()=>{
  const server=read("api/audio.js");
  assert.ok(server.includes('"1WDM5vw1I_VMWQ0PJZb5OLXdZcDUidT-u"'));
  const page=require("../api/story.js");
  const response={
    headers:{},code:200,body:"",
    setHeader(k,v){this.headers[k.toLowerCase()]=v;return this;},
    status(code){this.code=code;return this;},
    end(body){this.body=body||"";return this;}
  };
  page({method:"GET",query:{slug:"cieply-grzech"}},response);
  assert.equal(response.code,200);
  assert.match(response.body,/<title>Ciepły Grzech — Piękne Ciała<\/title>/);
  assert.match(response.body,/og:image/);
  assert.match(response.body,/1igP6LowN0i49bCrd5u4M0N31mQ21En8v/);
  assert.match(read("sitemap.xml"),/stories\/cieply-grzech/);
});
