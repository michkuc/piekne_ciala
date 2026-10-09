const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const state = require("../assets/playlist-state.js");
const story = require("../api/story.js");
const root = path.resolve(__dirname,"..");
const read = name => fs.readFileSync(path.join(root,name),"utf8");
const songsSrc = read("assets/songs.js");
const catalog = [...songsSrc.matchAll(/^\s*\{n:\d+,slug:"([^"]+)",title:"((?:[^"\\]|\\.)*)"/gm)]
  .map(m=>({slug:m[1],title:JSON.parse('"'+m[2]+'"')}));
assert.equal(catalog.length,23);
const fakeStorage = () => {
  const map = new Map();
  return {getItem:key=>map.get(key)||null,setItem:(key,value)=>map.set(key,value),map};
};
const fakeResponse = () => ({
  headers:{},statusCode:200,data:"",
  setHeader(key,value){this.headers[key.toLowerCase()]=value;return this;},
  status(code){this.statusCode=code;return this;},
  end(body){this.data=body||"";this.ended=true;return this;}
});

test("Playlist slugs validate every one of 23 tracks in order",()=>{
  const list=catalog.map(x=>x.slug);
  assert.deepEqual(state.slugs(list,catalog),list);
  assert.deepEqual(state.slugs([list[0],"unknown",list[1],list[0],null],catalog),list.slice(0,2));
  assert.deepEqual(state.fromLink(list.join(","),catalog),list);
  assert.deepEqual(state.fromLink("unknown",catalog),[]);
  assert.deepEqual(state.fromLink("x".repeat(1700),catalog),[]);
  assert.equal(state.link(list,catalog),list.join(","));
});

test("Local playback queue persists repeat mode, order and progress",()=>{
  const db=fakeStorage();
  const list=[catalog[3].slug,catalog[0].slug,catalog[2].slug];
  assert.equal(state.load(db,catalog),null);
  assert.equal(state.save(db,{queue:list,current:list[1],repeat:"all",time:83.5},catalog),true);
  assert.deepEqual(state.load(db,catalog),{queue:list,current:list[1],repeat:"all",time:83.5});
  const raw=JSON.parse(db.getItem(state.KEY));
  assert.equal(raw.version,1);
  assert.deepEqual(Object.keys(raw).sort(),["current","queue","repeat","time","version"]);
  assert.ok(!JSON.stringify(raw).includes("api/audio"));
});

test("Malformed or obsolete storage never breaks playlist initialization",()=>{
  const db=fakeStorage();
  db.setItem(state.KEY,"{");
  assert.equal(state.load(db,catalog),null);
  db.setItem(state.KEY,JSON.stringify({version:99,queue:[catalog[0].slug]}));
  assert.equal(state.load(db,catalog),null);
  db.setItem(state.KEY,JSON.stringify({version:1,queue:[catalog[0].slug,"unknown"],current:"unknown",repeat:"bad",time:-10}));
  assert.deepEqual(state.load(db,catalog),{queue:[catalog[0].slug],current:null,repeat:"off",time:0});
  assert.equal(state.save({setItem(){throw Error("quota")}}, {queue:[],current:null,repeat:"off"},catalog),false);
});

test("Every song receives its own HTTP title, description, artwork and canonical URL",()=>{
  for(const song of catalog){
    const response=fakeResponse();
    story({method:"GET",query:{slug:song.slug}},response);
    assert.equal(response.statusCode,200,"status "+song.slug);
    assert.match(response.headers["content-type"],/text\/html/);
    assert.ok(response.data.includes("<title>"+song.title+" — Piękne Ciała</title>"),"title "+song.slug);
    assert.ok(response.data.includes('property="og:url" content="https://piekne-ciala.vercel.app/stories/'+song.slug+'"'),"url "+song.slug);
    assert.match(response.data,/property="og:image" content="https:\/\//);
    assert.match(response.data,/name="twitter:image"/);
    assert.ok(!response.data.includes("id=/assets/"),"invalid Drive image "+song.slug);
    assert.ok(response.data.includes('src="/assets/app.js"'),"story scripts "+song.slug);
  }
});

test("Share preview responses return 404 for unknown slugs and forbid POST",()=>{
  const unknown=fakeResponse();
  story({method:"GET",query:{slug:'"><script>alert(1)</script>'}},unknown);
  assert.equal(unknown.statusCode,404);
  assert.ok(!unknown.data.includes('"><script>alert(1)</script>'));
  const head=fakeResponse();
  story({method:"HEAD",query:{slug:catalog[0].slug}},head);
  assert.equal(head.statusCode,200);
  assert.equal(head.data,"");
  const post=fakeResponse();
  story({method:"POST",query:{slug:catalog[0].slug}},post);
  assert.equal(post.statusCode,405);
  assert.equal(post.headers.allow,"GET, HEAD");
});

test("Vercel rewrites retain clean story routes with HTTP metadata",()=>{
  const vercel=JSON.parse(read("vercel.json"));
  for(const route of ["/stories/:slug","/story/:slug","/song/:slug"]){
    assert.equal(vercel.rewrites.find(r=>r.source===route).destination,"/api/story?slug=:slug");
  }
});

test("Playlist UI has native share, resume and playback feedback wiring",()=>{
  const html=read("playlist.html"),script=read("assets/playlist-ui.js");
  assert.match(html,/src="\/assets\/playlist-state\.js"/);
  assert.match(html,/src="\/assets\/playlist-ui\.js"/);
  assert.match(html,/data-share-queue/);
  assert.match(html,/data-playlist-story/);
  assert.match(script,/addEventListener\("pagehide",persist\)/);
  assert.match(script,/const shared = params\.has\("list"\)/);
  assert.match(script,/selectTrack\(currentIndex,false,true\)/);
  assert.match(script,/navigator\.share/);
  assert.match(script,/navigator\.clipboard\.writeText/);
  assert.match(script,/audio\.addEventListener\("stalled"/);
  assert.match(read("assets/app.js"),/data-share-song/);
});
