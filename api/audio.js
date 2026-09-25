import { Readable } from "node:stream";

const AUDIO_IDS = new Set([
  "1SuXyUfOStEH5deRssh6F-WoHRTZCEHHo",
  "1OSiIajlPBnxQR06KHVsGcuKIrtHCwlX7",
  "1mRQOUDVFKZodTqoOk7OFyXa3Ahvj3na2",
  "1iMMWrQ2OD6kU4OWbgR7QxZRD6UIS2oJ3",
  "1VhCTqQfBfLRTIC9wFZrWCuIJtsNNnmY1",
  "1cWKxtd6zsibxbaTcVXFJMdiG9JSRPvZB",
  "1DEIHAVo476Pc5PRHHuckuhGC-nfz4ASD",
  "1g9mjeQicgNYrbpOt3C8crwxGfO567LsI",
  "19Xybz1qBIFBax8twfBfe2YtwXge7144I",
  "1MI6Ka3gBar0_8s8GcFO3jFxzmHKRPvWv",
  "1QpwpmUvRzYuLRrU2lSDmlQCu4E-G8MaU",
  "1Rr9mg9agoVqBSeHnV0ZKMYtNXG1CYAmh",
  "1YXbdD9AWnoMwkYmtBhpiJJWrqTs5SbNm",
  "1Xa-pik2YvJt4mrsxgdl-51ke1VbOmY1E",
  "13gqI1nOaNHv2GJTzCq9LG4Po-uGfK2_o",
  "1dqo862rBr9JK6ELZSuj-nb7FPd2R1vjh",
  "1bqXNrUNjBtAQ0pEgF_sS1aQRBs1Y88AJ",
  "19dNX7S6TNQkJSitblaWRS-Ul5Wj1P3tj"
]);

export default async function handler(request, response) {
  const id = typeof request.query.id === "string" ? request.query.id : "";
  if (!AUDIO_IDS.has(id)) {
    response.status(404).json({ error: "Audio not found" });
    return;
  }

  const headers = {};
  if (request.headers.range) headers.Range = request.headers.range;

  try {
    const upstream = await fetch(`https://drive.google.com/uc?export=download&id=${id}`, { headers });
    if (!upstream.ok && upstream.status !== 206) {
      response.status(502).json({ error: "Audio source unavailable" });
      return;
    }

    response.status(upstream.status);
    response.setHeader("Content-Type", upstream.headers.get("content-type") || "audio/mpeg");
    response.setHeader("Accept-Ranges", "bytes");
    response.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400");
    for (const header of ["content-length", "content-range", "etag", "last-modified"]) {
      const value = upstream.headers.get(header);
      if (value) response.setHeader(header, value);
    }

    if (request.method === "HEAD") {
      response.end();
      return;
    }

    if (!upstream.body) {
      response.status(502).end();
      return;
    }
    Readable.fromWeb(upstream.body).pipe(response);
  } catch {
    response.status(502).json({ error: "Audio stream failed" });
  }
}
