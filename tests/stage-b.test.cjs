const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const read = (name) => fs.readFileSync(path.resolve(__dirname,"..",name),"utf8");

test("Night Archive preserves 65 captions and full resolution lightbox images",()=>{
  const html=read("archive.html");
  const cards=[...html.matchAll(/<button class="gallery-open\b[\s\S]*?<\/button>/g)].map(match=>match[0]);
  assert.equal(cards.length,65);
  assert.equal(cards.filter(card=>card.includes('data-archive-selected="true"')).length,15);
  assert.equal(cards.filter(card=>card.includes('data-lightbox-src=')).length,65);
  assert.equal(cards.filter(card=>card.includes('&sz=w1800') || card.includes('&amp;sz=w1800')).length,61);
});

test("All 61 Google Drive gallery thumbnails have responsive candidates",()=>{
  const html=read("archive.html");
  const cards=[...html.matchAll(/<button class="gallery-open\b[\s\S]*?<\/button>/g)].map(match=>match[0]);
  const drive=cards.filter(card=>/src="https:\/\/drive\.google\.com\/thumbnail\?id=[^"]+w960"/.test(card));
  assert.equal(drive.length,61);
  for(const card of drive){
    assert.match(card,/srcset="[^"]+w480 480w,[^"]+w960 960w,[^"]+w1600 1600w"/);
    assert.match(card,/sizes="[^"]+"/);
    assert.match(card,/loading="lazy"/);
  }
  assert.equal((html.match(/&amp;sz=w1800/g)||[]).length <= 65,true);
});

test("Gallery supports touch swipes, keyboard focus trap and closing",()=>{
  const js=read("assets/app.js");
  assert.match(js,/figure\.addEventListener\("touchstart"/);
  assert.match(js,/figure\.addEventListener\("touchend"/);
  assert.match(js,/event\.key === "Tab"/);
  assert.match(js,/event\.key === "Escape"/);
  assert.match(js,/previousFocus\?\.focus/);
});

test("Mobile controls meet nominal 44px touch minimum",()=>{
  const css=read("assets/styles.css");
  assert.match(css,/\.archive-filter\{min-height:44px/);
  assert.match(css,/\.lightbox-close,\.lightbox-nav\{min-width:44px;min-height:44px/);
  assert.match(css,/\.track-add,\.queue-action\{min-width:44px;min-height:44px/);
});
