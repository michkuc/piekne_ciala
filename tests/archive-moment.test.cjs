const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const read = (file) => fs.readFileSync(path.join(__dirname,"..",file),"utf8");

const galleryIds = [
  "19xsFVlPg3hYKzY2hZJBpYQCuPqQ_kZhz",
  "1aBtH7KcnoNWY1KJvF2FxL6BpZewDbuJA",
  "1R74m9iqM9cPJSE6Mhgi18NOqmkBlRXcN",
  "1JMvd10p87M46uWeAMnQNUcWK3dL64o2C",
  "1WbuayngBy2bQFHAjtwxsvre3cpdrXiGJ"
];
const momentIds = [
  "1UOKMdQwL0VJoD5KB078-hJMHhJld5XWN",
  "15LzGdT1NlxIddZKCo2OLk5YpvODQEwzh",
  "1BBR6k36tc69fFmFb4mRpc2jt8tYAQ5NP",
  "18qgnWnjMKtJEmN6BE9LCRG31uhsQ4-VV",
  "1w0fspMRWkAuGVSpxXsK8mu0T8jpoiNUV",
  "1RNewaN2I4ipQfw4BSCG33FISeoA3YMFF"
];
const manId = "1PEBj9Oo9z-5PeBn_1MxL1mxq3QayzN4R";

test("Five new images extend main archive to 70 while preserving curated selection", () => {
  const html=read("archive.html");
  const cards=[...html.matchAll(/<button class="gallery-open[^>]*[\s\S]*?<\/button>/g)].map(m=>m[0]);
  assert.equal(cards.length,70);
  assert.equal(cards.filter(c=>c.includes('data-archive-selected="true"')).length,15);
  for(const id of galleryIds) assert.equal(cards.filter(card=>card.includes(id)).length,1,id);
  assert.ok(html.includes('VISUAL ARCHIVE · 70 KADRÓW'));
  assert.ok(html.includes('data-archive-filter="all" aria-pressed="false"><span>ALL</span><em>70</em>'));
  const counts={};for(const card of cards){const m=card.match(/data-archive-category="([^"]+)"/);assert.ok(m);counts[m[1]]=(counts[m[1]]||0)+1}
  assert.deepEqual(counts,{night:10,travel:24,sport:11,city:8,"after-hours":10,everyday:7});
});

test("Six unique Moment photos live in separate gallery with image captions and full resolution", () => {
  const html=read("archive.html");
  const section=html.split('id="moment-przed-po"')[1].split('class="archive-closing')[0];
  const cards=[...section.matchAll(/<button type="button" class="moment-card"[\s\S]*?<\/button>/g)].map(m=>m[0]);
  assert.equal(cards.length,6);
  for(const [index,id] of momentIds.entries()){
    const card=cards[index];
    assert.ok(card.includes(id),"correct order "+id);
    assert.ok(card.includes('data-lightbox-group="moment"'),"isolated gallery");
    assert.match(card,/data-lightbox-src="[^"]+w1800"/);
    assert.match(card,/srcset="[^"]+480w,[^"]+960w,[^"]+1600w"/);
    assert.match(card,/<small>[^<]+<\/small>/);
    assert.match(card,/alt="[^"]+"/);
  }
  assert.equal(new Set([...galleryIds,...momentIds,manId]).size,12);
});

test("The Man keeps original scenes and has exactly one additional skyline story", () => {
  const html=read("about.html");
  assert.ok(html.includes('data-bg-id="1nX_Lr3YJCGzYnEJnx-Wqht8TBl9TVY9z"'));
  assert.ok(html.includes('/assets/site/about-elevator.webp'));
  assert.ok(html.includes('/assets/art/samotnosc-w-wielkim-miescie-hero.webp'));
  assert.ok(html.includes(manId));
  assert.ok(html.includes('class="section wrap man-window-scene"'));
  assert.ok(html.includes('href="/archive#moment-przed-po"'));
});

test("Lightbox swipe and arrows navigate within the opened archive or micro-stories only", () => {
  const app=read("assets/app.js");
  assert.match(app,/let activeGroup = "archive"/);
  assert.match(app,/button\.dataset\.lightboxGroup \|\| "archive"/);
  assert.match(app,/activeGroup = button\.dataset\.lightboxGroup \|\| "archive"/);
  assert.match(app,/figure\.addEventListener\("touchend"/);
  assert.match(app,/previousFocus\?\.focus/);
});

test("Mobile editorial grids keep separate layouts and touch-friendly focus",()=>{
  const css=read("assets/styles.css");
  assert.match(css,/\.moment-grid\{display:grid;grid-template-columns:repeat\(3/);
  assert.match(css,/\.moment-card:focus-visible/);
  assert.match(css,/@media\(max-width:700px\)[\s\S]*\.moment-grid\{grid-template-columns:1fr/);
  assert.match(css,/\.man-window-scene\{display:grid/);
});
