module.exports = async function handler(request, response) {
  const configuredPin = process.env.SITE_PIN || "";
  response.setHeader("Cache-Control", "no-store, max-age=0");
  if (request.method === "GET") {
    return response.status(200).json({required: Boolean(configuredPin)});
  }
  if (request.method !== "POST") return response.status(405).json({ok: false});
  if (!configuredPin) return response.status(200).json({ok: true});
  const suppliedPin = String(request.body?.pin || "");
  return response.status(suppliedPin === configuredPin ? 200 : 401).json({ok: suppliedPin === configuredPin});
};
