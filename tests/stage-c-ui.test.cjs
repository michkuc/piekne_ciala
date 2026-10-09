const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const path = require("node:path");
const script = fs.readFileSync(path.resolve(__dirname,"../assets/playlist-ui.js"),"utf8");
const queueState = require("../assets/playlist-state.js");
const songs = [
  {n:1,slug:"piekne-ciala",title:"Piękne Ciała",version:"Original",tag:"Noir",cover:"cover1",audio:"/api/audio?id=one"},
  {n:2,slug:"mlode-boginie",title:"Młode Boginie",version:"Hard Cut",tag:"Night",cover:"cover2",audio:"/api/audio?id=two"},
  {n:3,slug:"po-polnocy",title:"Po Północy",version:"Noir",tag:"Night",cover:"cover3",audio:"/api/audio?id=three"}
];
function memoryStorage(){
  const values = new Map();
  return {
    getItem:key=>values.get(key)||null,
    setItem:(key,value)=>values.set(key,value),
    values
  };
}
function element(){
  const callbacks = new Map();
  return {
    innerHTML:"",hidden:false,disabled:false,textContent:"",value:"0",href:"",dataset:{},style:{},
    callbacks,
    addEventListener(name,callback){callbacks.set(name,callback);},
    fire(name,event){return callbacks.get(name)?.(event);},
    setAttribute(name,value){this[name]=value;},
    removeAttribute(name){delete this[name];},
    getAttribute(name){return this[name]||null;}
  };
}
function start(options={}){
  const storage=options.storage||memoryStorage();
  const selectorList=[
    "[data-track-library]","[data-queue-list]","[data-queue-empty]","[data-playlist-audio]",
    "[data-playlist-title]","[data-playlist-version]","[data-playlist-cover]",
    "[data-playlist-toggle]","[data-playlist-prev]","[data-playlist-next]",
    "[data-playlist-range]","[data-playlist-time]","[data-playlist-status]",
    "[data-repeat-mode]","[data-share-queue]","[data-playlist-story]",
    "[data-shuffle-queue]","[data-add-all]","[data-clear-queue]"
  ];
  const elements=Object.fromEntries(selectorList.map(key=>[key,element()]));
  elements["[data-playlist-story]"].hidden=true;
  elements["[data-playlist-cover]"].hidden=true;
  const audio=elements["[data-playlist-audio]"];
  audio.paused=true;
  audio.duration=180;
  audio.currentTime=0;
  audio.load=function(){this.paused=true;};
  audio.pause=function(){this.paused=true;this.fire("pause");};
  audio.play=async function(){this.paused=false;this.fire("play");this.fire("playing");};
  const root={querySelector:(selector)=>elements[selector]||null};
  const calls={copy:[],history:[],pages:[]};
  const location={pathname:"/playlist",hash:"",origin:"https://piekne-ciala.vercel.app",search:options.search||""};
  const window={
    PC_SONGS:songs,PC:{drive:(id)=>id},PC_QUEUE:queueState,localStorage:storage,
    addEventListener:(event,fn)=>{if(event==="pagehide")calls.pages.push(fn);}
  };
  const navigator={clipboard:{writeText:async (value)=>{calls.copy.push(value);}}};
  const sandbox={
    document:{querySelector:(selector)=>selector==="#playlist-root"?root:null},
    window,location,navigator,PC:window.PC,
    URL,URLSearchParams,history:{replaceState:(...args)=>calls.history.push(args)},
    Math,Number,Array,Set,Map,String,console
  };
  vm.runInNewContext(script,sandbox);
  const get=name=>elements["[data-"+name+"]"];
  return {get,storage,calls,audio,elements};
}
const clickLibrary=(ui,slug)=>ui.get("track-library").fire("click",{
  target:{closest:(selector)=>selector==="[data-add-track]"?{dataset:{addTrack:slug}}:null}
});
const clickQueue=(ui,action,index)=>ui.get("queue-list").fire("click",{
  target:{closest:(selector)=>selector==="button"?{
    dataset:{[action]:String(index)},
    hasAttribute:(name)=>name==="data-"+action.replace(/[A-Z]/g,char=>"-"+char.toLowerCase())
  }:null}
});

test("Real playlist UI stores additions and restores selection without autoplay",async()=>{
  const storage=memoryStorage();
  const ui=start({storage});
  clickLibrary(ui,songs[1].slug);
  clickLibrary(ui,songs[0].slug);
  assert.match(ui.get("queue-list").innerHTML,/Młode Boginie/);
  const entry=JSON.parse(storage.getItem(queueState.KEY));
  assert.deepEqual(entry.queue,[songs[1].slug,songs[0].slug]);
  assert.equal(ui.get("share-queue").disabled,false);
  clickQueue(ui,"playIndex",0);
  await Promise.resolve();
  assert.equal(ui.audio.paused,false);
  ui.audio.currentTime=44;
  ui.audio.fire("pause");
  const saved=JSON.parse(storage.getItem(queueState.KEY));
  assert.equal(saved.current,songs[1].slug);
  assert.equal(saved.time,44);
  const restored=start({storage});
  assert.equal(restored.audio.paused,true);
  assert.equal(restored.get("playlist-title").textContent,songs[1].title);
  assert.equal(restored.get("playlist-story").href,"/stories/"+songs[1].slug);
  restored.audio.fire("loadedmetadata");
  assert.equal(restored.audio.currentTime,44);
});

test("Playlist can export and import a portable link in identical order",async()=>{
  const base=start();
  clickLibrary(base,songs[2].slug);
  clickLibrary(base,songs[0].slug);
  await base.get("share-queue").fire("click");
  assert.equal(base.calls.copy.length,1);
  const url=new URL(base.calls.copy[0]);
  assert.equal(url.pathname,"/playlist");
  assert.deepEqual(url.searchParams.get("list").split(","),[songs[2].slug,songs[0].slug]);
  const imported=start({search:url.search});
  const saved=JSON.parse(imported.storage.getItem(queueState.KEY));
  assert.deepEqual(saved.queue,[songs[2].slug,songs[0].slug]);
  assert.equal(imported.calls.history.length,1);
  assert.equal(imported.get("playlist-story").hidden,true);
});

test("Reorder, removal and clearing do not preserve stale track state",()=>{
  const ui=start();
  clickLibrary(ui,songs[0].slug);
  clickLibrary(ui,songs[1].slug);
  clickQueue(ui,"moveDown",0);
  let saved=JSON.parse(ui.storage.getItem(queueState.KEY));
  assert.deepEqual(saved.queue,[songs[1].slug,songs[0].slug]);
  clickQueue(ui,"remove",1);
  saved=JSON.parse(ui.storage.getItem(queueState.KEY));
  assert.deepEqual(saved.queue,[songs[1].slug]);
  ui.get("clear-queue").fire("click");
  saved=JSON.parse(ui.storage.getItem(queueState.KEY));
  assert.deepEqual(saved.queue,[]);
  assert.equal(ui.get("share-queue").disabled,true);
  assert.equal(ui.get("playlist-story").hidden,true);
});
