export async function onRequest(context) {
  const url = new URL(context.request.url);
  const v = url.searchParams.get("v");

  // If a specific version is requested, route directly to that release
  if (v && v !== "latest") {
    const tag = v.startsWith("v") ? v : `v${v}`;
    if (tag === "v8.2.3") {
      return Response.redirect(
        "https://github.com/Amnibro/Haven/releases/download/v8.2.3/Haven-v8.2.3-80203.apk",
        302
      );
    }
    if (tag === "v8.2.2") {
      return Response.redirect(
        "https://github.com/Amnibro/Haven/releases/download/v8.2.2/Haven-v8.2.2-80202.apk",
        302
      );
    }
    if (tag === "v8.2.5") {
      return Response.redirect(
        "https://github.com/Amnibro/Haven/releases/download/v8.2.5/Haven-v8.2.5-80205.apk",
        302
      );
    }
    return Response.redirect(
      `https://github.com/Amnibro/Haven/releases/tag/${tag}`,
      302
    );
  }

  // Dynamic discovery of latest APK from GitHub API with edge caching
  try {
    const res = await fetch("https://api.github.com/repos/Amnibro/Haven/releases/latest", {
      headers: {
        "User-Agent": "Amni-Scient-Downloader/1.0",
        "Accept": "application/vnd.github.v3+json"
      },
      cf: {
        cacheTtl: 300,
        cacheEverything: true
      }
    });

    if (res.ok) {
      const release = await res.json();
      const apkAsset = release.assets?.find(a =>
        a.name.endsWith(".apk") && !a.name.includes("-latest")
      ) || release.assets?.find(a => a.name.endsWith(".apk"));

      if (apkAsset && apkAsset.browser_download_url) {
        return Response.redirect(apkAsset.browser_download_url, 302);
      }
    }
  } catch (err) {
    // Graceful fallback to static direct redirect below
  }

  // High-reliability fallback to GitHub's latest release download endpoint
  return Response.redirect(
    "https://github.com/Amnibro/Haven/releases/latest/download/amni-haven-latest.apk",
    302
  );
}
