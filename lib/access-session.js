const {createHmac, timingSafeEqual} = require("node:crypto");
const COOKIE = "__Host-pc-session";
const TTL = 8 * 60 * 60;
const sign = (value) => {
  const secret = process.env.SITE_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("Session secret unavailable");
  return createHmac("sha256", secret).update(value).digest("hex");
};
function createSession(now = Date.now()) {
  const expires = String(Math.floor(now / 1000) + TTL);
  return expires + "." + sign(expires);
}
function validSession(cookieHeader = "", now = Date.now()) {
  try {
    const token = cookieHeader.split(";").map(s => s.trim()).find(s => s.startsWith(COOKIE + "="))?.slice(COOKIE.length + 1);
    if (!token || !/^\d{10}\.[a-f0-9]{64}$/.test(token)) return false;
    const [expires, signature] = token.split(".");
    const seconds = Math.floor(now / 1000);
    if (Number(expires) <= seconds || Number(expires) > seconds + TTL) return false;
    return timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(sign(expires), "hex"));
  } catch { return false; }
}
module.exports = {COOKIE, TTL, createSession, validSession};
