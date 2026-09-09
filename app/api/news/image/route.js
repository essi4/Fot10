const ALLOWED_HOSTS = ["varzesh3.com", "tasnimnews.ir", "tasnimnews.com", "footbaliran.com"];

function isAllowedHost(hostname) {
  const host = String(hostname || "").toLowerCase();
  return ALLOWED_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
}

export async function GET(request) {
  try {
    const raw = new URL(request.url).searchParams.get("url");
    if (!raw) return new Response("Missing image URL", { status: 400 });

    const target = new URL(raw);
    if (!["http:", "https:"].includes(target.protocol) || !isAllowedHost(target.hostname)) {
      return new Response("Image host not allowed", { status: 403 });
    }

    const response = await fetch(target.toString(), {
      headers: { "User-Agent": "Mozilla/5.0 FOT10-News/2.0", Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8" },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });

    if (!response.ok) return new Response("Image unavailable", { status: response.status });
    const contentType = response.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) return new Response("Not an image", { status: 415 });

    return new Response(response.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch {
    return new Response("Image proxy error", { status: 502 });
  }
}
