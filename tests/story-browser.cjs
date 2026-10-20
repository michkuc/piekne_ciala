"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),http=require("node:http"),path=require("node:path");
const {chromium}=require("playwright");
const root=path.resolve(__dirname,"..");
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".svg":"image/svg+xml",".png":"image/png",".webp":"image/webp"};
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,"http://localhost");
  if(url.pathname==="/api/access"){res.writeHead(200,{"Content-Type":"application/json"});return res.end('{"authenticated":true}');}
  if(url.pathname.startsWith("/api/")){res.writeHead(404);return res.end();}
  let name;try{name=decodeURIComponent(url.pathname);}catch{res.writeHead(400);return res.end();}
  if(name.includes("..")||name.includes("\\")){res.writeHead(400);return res.end();}
  const filename=path.join(root,name==="/"?"/index.html":name);
  const target=fs.existsSync(filename)&&fs.statSync(filename).isFile()?filename:filename+".html";
  if(!target.startsWith(root+path.sep)||!fs.existsSync(target)){res.writeHead(404);return res.end("Missing "+name);}
  res.writeHead(200,{"Content-Type":mime[path.extname(target)]||"application/octet-stream"});
  fs.createReadStream(target).pipe(res);
});
async function run(){
 await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  const host="http://127.0.0.1:"+server.address().port;
  for(const viewport of [{width:1366,height:850},{width:390,height:844}]){
   const page=await browser.newPage({viewport});
   const errors=[];
   page.on("pageerror",e=>errors.push(e.message));
   await page.route(/https:\/\/drive\.google\.com\/.*/,route=>route.fulfill({status:200,contentType:"image/svg+xml",body:'<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"></svg>'}));
   await page.addInitScript(()=>{
    HTMLMediaElement.prototype.play=function(){this.dispatchEvent(new Event("play"));return Promise.resolve();};
    HTMLMediaElement.prototype.pause=function(){this.dispatchEvent(new Event("pause"));};
    HTMLMediaElement.prototype.load=function(){};
   });
   const r=await page.goto(host+"/story-mode?slug=cieply-grzech",{waitUntil:"domcontentloaded"});
   assert.equal(r.status(),200,"Story route");
   await page.waitForTimeout(170);
   const heading=page.locator("[data-story-heading]");
   assert.match(await heading.innerText(),/Wszyscy śpią/,"Initial scene "+viewport.width);
   assert.match(await page.locator("[data-story-cue]").innerText(),/Patrzę na światła/);
   assert.match(await page.locator("[data-story-source]").innerText(),/ZWROTKA 1/);
   await page.locator("[data-story-next]").click();
   assert.match(await heading.innerText(),/Śmiech jak ogień/);
   assert.match(page.url(),/scene=2/);
   await page.locator('[data-story-choose="po-godzinach"]').click();
   assert.match(await heading.innerText(),/Ona została/);
   await page.locator("[data-story-next]").click();
   await page.locator("[data-story-next]").click();
   assert.match(await heading.innerText(),/Koszula opada/);
   await page.locator('[data-story-choose="ona-tanczy"]').click();
   assert.match(await page.locator("[data-story-notice]").innerText(),/Pełny tekst/);
   assert.match(await heading.innerText(),/Ona tańczy/);
   await page.locator("[data-story-play]").click();
   assert.match(await page.locator("[data-story-playback]").innerText(),/Trwa odtwarzanie/);
   assert.match(await page.locator("[data-story-audio]").getAttribute("src"),/\/api\/audio\?id=/);
   assert.deepEqual(errors,[],"Runtime errors at "+viewport.width+"px");
   console.log("PASS Chromium Story Mode "+viewport.width+"px, three songs, controls, audio and no JS errors");
   await page.close();
  }
 }finally{
   if(browser)await browser.close();
   await new Promise(resolve=>server.close(resolve));
 }
}
run().catch(e=>{console.error(e);process.exitCode=1;server.close();});
