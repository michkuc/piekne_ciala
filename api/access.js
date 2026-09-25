const {createHash, timingSafeEqual} = require("node:crypto");
const FALLBACK_PIN_HASH = "b9496b78de9917a6b216f92a7d03419d93269dc26280a72173c5a7f93cf0da1b";
const hash = (value) => createHash("sha256").update(String(value)).digest();

module.exports = async function handler(request, response) {
  const configuredPin = process.env.SITE_PIN || "";
  const expectedHash = configuredPin ? hash(configuredPin) : Buffer.from(FALLBACK_PIN_HASH, "hex");
  response.setHeader("Cache-Control", "no-store, max-age=0");
  if (request.method === "GET") {
    return response.status(200).json({required: true});
  }
  if (request.method !== "POST") return response.status(405).json({ok: false});
  const suppliedPin = String(request.body?.pin || "");
  const suppliedHash = hash(suppliedPin);
  const ok = timingSafeEqual(suppliedHash, expectedHash);
  return response.status(ok ? 200 : 401).json({ok});
};
