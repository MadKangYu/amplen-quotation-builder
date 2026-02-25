export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) {
    res.status(400).json({ error: "url parameter required" });
    return;
  }

  try {
    const decoded = decodeURIComponent(url);
    const response = await fetch(decoded, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AMPLEN-Quotation/1.0)" },
    });

    if (!response.ok) {
      res.status(response.status).json({ error: "Upstream error" });
      return;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get("content-type") || "image/jpeg";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.send(buffer);
  } catch (e) {
    res.status(500).json({ error: "Failed to proxy image" });
  }
}
