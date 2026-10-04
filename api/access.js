const {createHash, timingSafeEqual} = require("node:crypto");
const {COOKIE, TTL, createSession, validSession} = require("../lib/access-session");
const hash = value => createHash("sha256").update(value).digest();

module.exports = async function handler(request, response) {
  response.setHeader("Cache-Control", "private, no-store");
  response.setHeader("Vary", "Cookie");
  if (request.method === "GET") {
    return response.status(200).json({required:true, authenticated:validSession(request.headers.cookie)});
  }
  if (request.method !== "POST") {
    response.setHeader("Allow", "GET, POST");
    return response.status(405).json({ok:false});
  }
  const origin = request.headers.origin;
  const host = request.headers.host;
  if (!origin || origin !== "https://" + host) return response.status(403).json({ok:false});
  if (!process.env.SITE_PIN || !process.env.SITE_SESSION_SECRET) return response.status(503).json({ok:false});
  const supplied = request.body?.pin;
  if (typeof supplied !== "string" || supplied.length > 24) return response.status(401).json({ok:false});
  const ok = timingSafeEqual(hash(supplied.trim()), hash(process.env.SITE_PIN));
  if (!ok) return response.status(401).json({ok:false});
  const token = createSession();
  response.setHeader("Set-Cookie", COOKIE + "=" + token + "; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=" + TTL);
  return response.status(200).json({ok:true});
};
