const COUNTER_URL = "https://counterapi.com/api/piekne-ciala.vercel.app/view/home";

module.exports = async function handler(request, response) {
  try {
    const readOnly = request.method !== "POST";
    const upstream = await fetch(`${COUNTER_URL}?readOnly=${readOnly ? "true" : "false"}`, {
      headers: {"Accept": "application/json"},
      signal: AbortSignal.timeout(4500)
    });
    if (!upstream.ok) throw new Error(`Counter returned ${upstream.status}`);
    const data = await upstream.json();
    response.setHeader("Cache-Control", "no-store, max-age=0");
    response.status(200).json({value: Number(data.value) || 0});
  } catch {
    response.status(503).json({value: null});
  }
};
