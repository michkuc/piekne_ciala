const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

function fakeResponse() {
  const r = {
    statusCode: 200,
    headers: {},
    payload: undefined,
    setHeader(key, value) { this.headers[key.toLowerCase()] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.payload = value; return this; },
    end() { this.ended = true; return this; }
  };
  return r;
}

test("All 22 listed audio IDs are permitted by the server proxy", () => {
  const songs = read("assets/songs.js");
  const proxy = read("api/audio.js");
  const block = songs.split("const PC_AUDIO_IDS = {")[1].split("};")[0];
  const ids = [...block.matchAll(/^\s*\d+:\s*"([^"]+)"/gm)].map((match) => match[1]);
  const allowed = [...proxy.split("const AUDIO_IDS = new Set([")[1].split("]);")[0].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
  assert.equal(ids.length, 22);
  assert.equal(new Set(ids).size, 22);
  assert.deepEqual(new Set(ids), new Set(allowed));
});

test("Night Archive counters reflect the 65 actual cards", () => {
  const archive = read("archive.html");
  const app = read("assets/app.js");
  const cards = [...archive.matchAll(/<button class="gallery-open[^>]*?data-archive-category="([^"]+)"[^>]*?>/g)];
  assert.equal(cards.length, 65);
  assert.equal(cards.filter((match) => match[0].includes('data-archive-selected="true"')).length, 15);
  const actual = {};
  for (const card of cards) actual[card[1]] = (actual[card[1]] || 0) + 1;
  assert.deepEqual(actual, {night:10,travel:24,sport:11,city:7,"after-hours":7,everyday:6});
  assert.match(app, /const statusLabel = \(filter\)/);
  assert.match(app, /status\.textContent = statusLabel\(filter\)/);
  assert.doesNotMatch(app, /all:"61 kadrów"/);
});

test("Login H1 is styled and XML sitemap has no literal escaped newline", () => {
  assert.match(read("login.html"), /<h1 id="age-title">/);
  const css = read("assets/styles.css");
  assert.match(css, /\.age-box h1,\.age-box h2\{/);
  assert.doesNotMatch(read("sitemap.xml"), /\\n/);
  assert.equal((read("sitemap.xml").match(/<loc>/g) || []).length, 32);
});

test("Session signatures expire and resist tampering", () => {
  process.env.SITE_SESSION_SECRET = "stage-a-test-session-secret-must-be-at-least-32-bytes";
  const {COOKIE, TTL, createSession, validSession} = require("../lib/access-session.js");
  const now = Date.now();
  const token = createSession(now);
  assert.equal(validSession(COOKIE + "=" + token, now), true);
  assert.equal(validSession(COOKIE + "=" + token, now + (TTL + 1) * 1000), false);
  assert.equal(validSession(COOKIE + "=" + token + "f", now), false);
  assert.equal(validSession(COOKIE + "=" + createSession(now - (TTL + 1) * 1000), now), false);
});

test("PIN endpoint rejects bad PIN and wrong origin, allows signed session", async () => {
  process.env.SITE_PIN = "staging-test-pin";
  process.env.SITE_SESSION_SECRET = "stage-a-test-session-secret-must-be-at-least-32-bytes";
  const handler = require("../api/access.js");
  async function call(method, pin, origin, cookie = "") {
    const response = fakeResponse();
    await handler({method, headers:{host:"example.test",origin,cookie}, body:{pin}}, response);
    return response;
  }
  assert.equal((await call("POST", "bad", "https://example.test")).statusCode, 401);
  assert.equal((await call("POST", "staging-test-pin", "https://wrong.test")).statusCode, 403);
  const good = await call("POST", "staging-test-pin", "https://example.test");
  assert.equal(good.statusCode, 200);
  assert.match(good.headers["set-cookie"], /^__Host-pc-session=/);
  assert.match(good.headers["set-cookie"], /HttpOnly; Secure; SameSite=Strict/);
  const cookie = good.headers["set-cookie"].split(";")[0];
  const authenticated = await call("GET", "", "https://example.test", cookie);
  assert.equal(authenticated.payload.authenticated, true);
  const guest = await call("GET", "", "https://example.test");
  assert.equal(guest.payload.authenticated, false);
});

test("Video points at an existing, allow-listed production source", () => {
  const vercel = JSON.parse(read("vercel.json"));
  const video = vercel.rewrites.find((x) => x.source === "/media/mlode-boginie.mp4");
  assert.ok(video);
  assert.match(video.destination, /^https:\/\/drive\.usercontent\.google\.com\/download\?/);
  assert.match(read("assets/songs.js"), /video:"\/media\/mlode-boginie\.mp4"/);
});


test("Audio API blocks guests, unknown files and non-audio Google responses", async () => {
  process.env.SITE_SESSION_SECRET = "stage-a-test-session-secret-must-be-at-least-32-bytes";
  const {COOKIE, createSession} = require("../lib/access-session.js");
  const {default: handler} = await import("../api/audio.js");
  const validCookie = COOKIE + "=" + createSession();
  const firstAudioId = [...read("api/audio.js").matchAll(/"([A-Za-z0-9_-]{30,})"/g)][0][1];

  const guest = fakeResponse();
  await handler({method:"GET", headers:{cookie:""}, query:{id:firstAudioId}}, guest);
  assert.equal(guest.statusCode, 401);

  const missing = fakeResponse();
  await handler({method:"GET", headers:{cookie:validCookie}, query:{id:"not-allowed"}}, missing);
  assert.equal(missing.statusCode, 404);

  const wrongMethod = fakeResponse();
  await handler({method:"POST", headers:{cookie:validCookie}, query:{id:firstAudioId}}, wrongMethod);
  assert.equal(wrongMethod.statusCode, 405);
  assert.equal(wrongMethod.headers.allow, "GET, HEAD");

  const originalFetch = global.fetch;
  try {
    global.fetch = async () => ({
      ok:true,
      status:200,
      headers:{get(name) {return name === "content-type" ? "text/html; charset=utf-8" : null;}},
      body:null
    });
    const html = fakeResponse();
    await handler({method:"GET", headers:{cookie:validCookie}, query:{id:firstAudioId}}, html);
    assert.equal(html.statusCode, 502);
    assert.match(html.payload.error, /Audio source/);
  } finally {
    global.fetch = originalFetch;
  }
});

test("Audio API forwards Range and streams valid MP3 bytes", async () => {
  process.env.SITE_SESSION_SECRET = "stage-a-test-session-secret-must-be-at-least-32-bytes";
  const {COOKIE, createSession} = require("../lib/access-session.js");
  const {default: handler} = await import("../api/audio.js");
  const firstAudioId = [...read("api/audio.js").matchAll(/"([A-Za-z0-9_-]{30,})"/g)][0][1];
  const validCookie = COOKIE + "=" + createSession();
  const {PassThrough} = require("node:stream");
  const response = new PassThrough();
  response.statusCode = 200;
  response.headers = {};
  response.setHeader = (key,value) => {response.headers[key.toLowerCase()] = value; return response;};
  response.status = (code) => {response.statusCode = code; return response;};
  response.json = (value) => {response.payload = value; response.end(); return response;};
  const chunks = [];
  response.on("data", (chunk) => chunks.push(chunk));
  const finished = new Promise((resolve,reject)=>{response.on("end",resolve); response.on("error",reject);});
  const originalFetch = global.fetch;
  let sentRange = null;
  try {
    global.fetch = async (_url,options) => {
      sentRange = options.headers.Range;
      return {
        ok:true,
        status:206,
        headers:{get(name) {
          return ({"content-type":"audio/mpeg","content-length":"3","content-range":"bytes 0-2/100"}[name] || null);
        }},
        body:new ReadableStream({start(controller) {controller.enqueue(new Uint8Array([11,22,33]));controller.close();}})
      };
    };
    await handler({method:"GET", headers:{cookie:validCookie,range:"bytes=0-2"}, query:{id:firstAudioId}}, response);
    await finished;
    assert.equal(response.statusCode, 206);
    assert.equal(sentRange, "bytes=0-2");
    assert.equal(response.headers["content-type"], "audio/mpeg");
    assert.deepEqual(Buffer.concat(chunks), Buffer.from([11,22,33]));
  } finally {
    global.fetch = originalFetch;
  }
});
