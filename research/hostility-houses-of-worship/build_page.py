#!/usr/bin/env python3
"""Rebuild hostility-houses-of-worship.html from the CSVs and the page template.

Also writes hostility-houses-of-worship-standalone.html: one file, with the
theme, fonts, charts, and downloadable tables inside it.
"""

import base64
import csv
import json
import math
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent


def pearson(xs, ys):
    n = len(xs)
    mx = sum(xs) / n
    my = sum(ys) / n
    num = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    dx = math.sqrt(sum((x - mx) ** 2 for x in xs))
    dy = math.sqrt(sum((y - my) ** 2 for y in ys))
    return num / (dx * dy)


def fmt_r(v):
    return ("−" if v < 0 else "") + f"{abs(v):.2f}"


def load_csv(path):
    with path.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def main():
    incidents = load_csv(HERE / "frc_2024_incidents.csv")
    states = load_csv(HERE / "state_join.csv")
    for row in states:
        row["incidents"] = int(row["incidents"])
        row["population_2024"] = int(row["population_2024"])
        row["incidents_per_100k"] = float(row["incidents_per_100k"])
        row["poverty_percent_2024"] = float(row["poverty_percent_2024"])
        row["foreign_born_percent_2024"] = float(row["foreign_born_percent_2024"])
        row["dem_share_2024"] = float(row["dem_share_2024"])
        row["rep_share_2024"] = float(row["rep_share_2024"])

    if len(incidents) != 415:
        raise SystemExit(f"expected 415 incidents, got {len(incidents)}")
    marks = {k: sum(r[k] == "1" for r in incidents) for k in ("vandalism", "arson", "gun_related", "bomb_threat", "other")}
    if marks != {"vandalism": 284, "arson": 55, "gun_related": 28, "bomb_threat": 14, "other": 47}:
        raise SystemExit(f"category marks drifted: {marks}")
    churches = {(r["church"].lower(), r["city"].lower(), r["state"].lower()) for r in incidents}
    if len(churches) != 383:
        raise SystemExit(f"expected 383 churches, got {len(churches)}")
    if sum(s["incidents"] for s in states) != 415 or len(states) != 51:
        raise SystemExit("state join does not cover 415 incidents across 51 jurisdictions")

    counts = [s["incidents"] for s in states]
    rates = [s["incidents_per_100k"] for s in states]
    logs = [math.log(s["population_2024"]) for s in states]
    pov = [s["poverty_percent_2024"] for s in states]
    fb = [s["foreign_born_percent_2024"] for s in states]
    dem = [s["dem_share_2024"] for s in states]
    tokens = {
        "__R_LOGPOP__": fmt_r(pearson(logs, counts)),
        "__R_POV_RATE__": fmt_r(pearson(pov, rates)),
        "__R_FB_RATE__": fmt_r(pearson(fb, rates)),
        "__R_POV_COUNT__": fmt_r(pearson(pov, counts)),
        "__R_FB_COUNT__": fmt_r(pearson(fb, counts)),
        "__R_DEM_RATE__": fmt_r(pearson(dem, rates)),
        "__R_DEM_COUNT__": fmt_r(pearson(dem, counts)),
    }

    sibling = (ROOT / "substance-use-vote-share.html").read_text(encoding="utf-8")
    nav = "<nav>" + sibling.split("<nav>", 1)[1].split("</nav>", 1)[0] + "</nav>"
    html = (HERE / "page.template.html").read_text(encoding="utf-8")
    html = html.replace("__NAV__", nav)
    for key, value in tokens.items():
        html = html.replace(key, value)
    html = html.replace("__INC_JSON__", json.dumps(incidents, ensure_ascii=False).replace("<", "\\u003c"))
    html = html.replace("__STATE_JSON__", json.dumps(states, ensure_ascii=False).replace("<", "\\u003c"))
    if "__" in html.split("<script>", 1)[-1][:200]:
        pass
    if "__INC_JSON__" in html or "__NAV__" in html or "__R_" in html:
        raise SystemExit("unreplaced template token")
    out = ROOT / "hostility-houses-of-worship.html"
    out.write_text(html, encoding="utf-8")
    print(f"wrote {out} ({out.stat().st_size} bytes)")
    alone = ROOT / "hostility-houses-of-worship-standalone.html"
    alone.write_text(standalone(html), encoding="utf-8")
    print(f"wrote {alone} ({alone.stat().st_size} bytes)")
    print(" ".join(f"{k}={v}" for k, v in tokens.items()))


def font_face(family, path, weight, stretch=""):
    b64 = base64.b64encode(path.read_bytes()).decode("ascii")
    stretch_decl = f"font-stretch:{stretch};" if stretch else ""
    return (
        f"@font-face{{font-family:{family};font-style:normal;font-weight:{weight};"
        f"{stretch_decl}font-display:swap;src:url(data:font/woff2;base64,{b64}) format('woff2')}}"
    )


STANDALONE_CSS = """
:root{
--bg:#08090B;--bg2:#0D0F12;--panel:#111418;--panel2:#161A20;--border:#20242B;--border2:#2E343D;
--accent:#C89B4E;--accent-soft:#E2BC7C;--accent-dim:rgba(200,155,78,.10);--accent-ink:#120C03;
--text:#EDEFF2;--text-soft:#A7ADB6;--dim:#6D747D;
--font-sans:Archivo,"Segoe UI",system-ui,sans-serif;
--font-serif:"Source Serif 4",Georgia,serif;
--elev-2:0 8px 24px -12px rgba(0,0,0,.45);
color-scheme:dark}
[data-theme="light"]{
--bg:#F3F2EF;--bg2:#EAE9E4;--panel:#FFFFFF;--panel2:#F8F7F4;--border:#E0DED8;--border2:#CBC7BE;
--accent:#8A6318;--accent-soft:#A2762A;--accent-dim:rgba(138,99,24,.09);--accent-ink:#FFFFFF;
--text:#101216;--text-soft:#454A52;--dim:#767B84;
--elev-2:0 8px 24px -12px rgba(20,22,26,.14);
color-scheme:light}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--text);font-family:var(--font-sans);font-size:16px;line-height:1.62}
a{color:var(--accent)}
.top{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.9rem max(clamp(1.25rem,5vw,4rem),calc((100vw - 1240px)/2));border-bottom:1px solid var(--border);background:var(--bg)}
.logo{font-weight:700;letter-spacing:.14em;font-size:.95rem}
.logo span{color:var(--dim);font-weight:500}
.hero{display:flex;flex-direction:column;align-items:flex-start;text-align:left;padding:2rem max(clamp(1.25rem,5vw,4rem),calc((100vw - 1240px)/2)) .4rem}
.hero h1{margin:.15rem 0 .35rem;font-size:clamp(2.2rem,6vw,3.8rem);font-weight:800;letter-spacing:-.03em;line-height:.96;text-transform:uppercase;max-width:12em;color:var(--text)}
.hero .subtitle{order:-1;display:flex;align-items:center;gap:.7rem;margin:0 0 .85rem;font-size:.7rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--accent)}
.hero .subtitle::before{content:"";width:26px;height:1px;background:currentColor;flex:0 0 26px}
.hero .tagline{font-family:var(--font-serif);font-size:1.05rem;color:var(--text-soft);max-width:44rem;margin:.35rem 0 0}
.btn{font:inherit;display:inline-flex;align-items:center;padding:.55rem .9rem;border-radius:2px;font-size:.72rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;cursor:pointer}
footer.plain{padding:1.4rem max(clamp(1.25rem,5vw,4rem),calc((100vw - 1240px)/2)) 2.4rem;color:var(--dim);font-size:.8rem;border-top:1px solid var(--border)}
"""


def standalone(html):
    fonts = ROOT.parent / "assets" / "fonts"
    faces = "\n".join([
        font_face("Archivo", fonts / "archivo-var.woff2", "100 900", "62% 125%"),
        font_face('"Source Serif 4"', fonts / "sourceserif4-var.woff2", "200 900"),
    ])
    html = html.replace('<link rel="stylesheet" href="../css/style.css?v=b268">\n', "")
    html = html.replace('<script type="module" src="/offline-app/start.js"></script>\n', "")
    html = html.replace('<div class="grid-bg"></div>\n<div class="scanlines"></div>\n', "")
    html = re.sub(
        r"<nav>.*?</nav>",
        '<header class="top"><span class="logo">AMNI<span>-SCIENT</span></span>'
        '<button class="theme-toggle" id="theme-toggle" type="button" onclick="toggleTheme()">LIGHT</button></header>',
        html,
        count=1,
        flags=re.S,
    )
    html = html.replace(
        '<p class="crumb"><a href="/research.html">Research</a> · Houses of worship</p>',
        '<p class="crumb">AMNI-SCIENT Research</p>',
    )
    html = html.replace(
        '<a class="btn btn-outline" href="hostility-houses-of-worship/fbi_2026_ytd.csv">2026 year-to-date CSV</a>',
        '<button type="button" class="btn btn-outline" id="dl-ytd">2026 year-to-date CSV</button>',
    )
    html = html.replace(
        '<a class="btn btn-outline" href="hostility-houses-of-worship/frc_2024_incidents.csv">2024 incident CSV</a>',
        '<button type="button" class="btn btn-outline" id="dl-frc">2024 incident CSV</button>',
    )
    html = html.replace(
        '<a class="btn btn-outline" href="hostility-houses-of-worship/state_join.csv">State join CSV</a>',
        '<button type="button" class="btn btn-outline" id="dl-state">State join CSV</button>',
    )
    html = re.sub(
        r'<aside class="support-cta".*?</footer>',
        '<footer class="plain">AMNI-SCIENT Research. This file is self-contained. Open it in a browser.</footer>',
        html,
        count=1,
        flags=re.S,
    )
    files = {
        "fbi_2026_ytd.csv": (HERE / "fbi_2026_ytd.csv").read_text(encoding="utf-8"),
        "frc_2024_incidents.csv": (HERE / "frc_2024_incidents.csv").read_text(encoding="utf-8"),
        "state_join.csv": (HERE / "state_join.csv").read_text(encoding="utf-8"),
    }
    payload = (
        "const FILES=" + json.dumps(files).replace("<", "\\u003c") + ";\n"
        "function saveFile(name){const a=document.createElement('a');"
        "a.href=URL.createObjectURL(new Blob([FILES[name]],{type:'text/csv'}));"
        "a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}\n"
    )
    html = html.replace("<script>\nconst INC", "<script>\n" + payload + "const INC", 1)
    html = html.replace(
        "function init(){",
        "function init(){\n"
        "  document.getElementById('dl-ytd').onclick=()=>saveFile('fbi_2026_ytd.csv');\n"
        "  document.getElementById('dl-frc').onclick=()=>saveFile('frc_2024_incidents.csv');\n"
        "  document.getElementById('dl-state').onclick=()=>saveFile('state_join.csv');\n",
        1,
    )
    html = html.replace("<style>\n", "<style>\n" + faces + "\n" + STANDALONE_CSS + "\n", 1)
    if "<nav>" in html or "style.css" in html or "offline-app" in html:
        raise SystemExit("standalone file still depends on the site")
    return html


if __name__ == "__main__":
    main()
