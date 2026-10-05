export async function onRequest(context) {
  const { request } = context;
  const cf = request.cf || {};
  const headers = request.headers;

  const edgeTelemetry = {
    colo: cf.colo || "LOCAL",
    country: cf.country || headers.get("cf-ipcountry") || "UNKNOWN",
    city: cf.city || "UNKNOWN",
    region: cf.region || "UNKNOWN",
    asn: cf.asn || null,
    asOrganization: cf.asOrganization || null,
    httpProtocol: cf.httpProtocol || "HTTP/2",
    tlsVersion: cf.tlsVersion || "TLS/1.3",
    tlsCipher: cf.tlsCipher || null,
    rayId: headers.get("cf-ray") || null
  };

  const clientTelemetry = {
    ip: headers.get("cf-connecting-ip") || "127.0.0.1",
    userAgent: headers.get("user-agent") || "UNKNOWN",
    referer: headers.get("referer") || null,
    language: headers.get("accept-language") || null,
    isObtainium: (headers.get("user-agent") || "").toLowerCase().includes("obtainium")
  };

  const softwareRegistry = [
    {
      id: "amni-haven",
      name: "Amni-Haven",
      platform: "Android",
      package: "com.havenapp.mobile",
      latestVersion: "8.2.5",
      versionCode: 80205,
      sizeBytes: 54290947,
      sizeHuman: "51.8 MB",
      sha256: "6ffce6601ee443700c833b1a11ea97fb876f772b43ddafa4813d7e9828ad065e",
      downloadUrl: "https://amni-scient.com/downloads/Haven-latest.apk",
      obtainiumUrl: "https://apps.obtainium.imranr.dev/redirect?r=obtainium%3A%2F%2Fadd%2Fhttps%3A%2F%2Famni-scient.com%2Fdownloads%2FHaven-latest.apk",
      gitHubReleases: "https://github.com/Amnibro/Haven/releases",
      status: "LIVE"
    },
    {
      id: "amni-browse",
      name: "Amni-Browse",
      platform: "Android",
      latestVersion: "0.16.9-android.0",
      versionCode: 10,
      sizeBytes: 798469,
      sizeHuman: "780 KB",
      sha256: "f72ea6d77c9a584504b19b743e858c1b17e6693f7ee732ebe90957b9b6d3e2eb",
      downloadUrl: "https://amni-scient.com/downloads/amni-browse.apk",
      status: "LIVE"
    },
    {
      id: "amni-type",
      name: "Amni-Type",
      platform: "Android",
      latestVersion: "0.10.0",
      versionCode: 31,
      sizeBytes: 3960723,
      sizeHuman: "3.8 MB",
      sha256: "94c49d161bfdc351f7181374fbe4697af32eb59943b69c0c1c1f853b1ec8a383",
      downloadUrl: "https://amni-scient.com/downloads/amni-type.apk",
      status: "LIVE"
    },
    {
      id: "symphony",
      name: "Symphony",
      platform: "Android",
      latestVersion: "6.7.0",
      versionCode: 690,
      sizeBytes: 66804009,
      sizeHuman: "63.7 MB",
      sha256: "f6acdc9bab836f48977c7ad13ea629b831102e63ba1fe38252bf125423c2c03c",
      downloadUrl: "https://amni-scient.com/symphony/symphony.apk",
      status: "LIVE"
    },
    {
      id: "grok-remote",
      name: "Grok-Remote",
      platform: "Windows Desktop",
      latestVersion: "1.9.6",
      sizeBytes: 10531840,
      sizeHuman: "10.5 MB",
      sha256: "29621676c8ecb7fdac245d7209fabe235d19d5b8559a77a61080ffae4a046e37",
      downloadUrl: "https://amni-scient.com/downloads/GrokRemote.exe",
      status: "LIVE"
    },
    {
      id: "braid-desktop",
      name: "Braid Desktop",
      platform: "Windows Desktop",
      latestVersion: "1.8",
      sizeBytes: 8057344,
      sizeHuman: "7.7 MB",
      sha256: "74ca0595d618962ad14d68b73789d4fc5588320b70fb6b1def3c3022bcfe752d",
      downloadUrl: "https://amni-scient.com/downloads/BraidDesktop.exe",
      status: "LIVE"
    },
    {
      id: "amni-os",
      name: "Amni OS",
      platform: "x86_64 ISO",
      latestVersion: "0.4.4",
      sizeBytes: 5921105920,
      sizeHuman: "5.92 GB",
      sha256: "8b796031a09775af4688c4defe5313a65ae9cd6ec85fd9479b518f572ac4db05",
      downloadUrl: "https://downloads.amni-scient.com/amni-os/amni-os-0.4.4-2026.09.08-x86_64.iso",
      status: "LIVE"
    }
  ];

  const payload = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    edgeTelemetry,
    clientTelemetry,
    softwareCount: softwareRegistry.length,
    software: softwareRegistry
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Telemetry-Source": "Amni-Scient-Cloudflare-Edge"
    }
  });
}
