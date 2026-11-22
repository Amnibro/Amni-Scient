#!/usr/bin/env python3
"""Rebuild hostility-houses-of-worship.html from the CSVs and the page template."""

import csv
import json
import math
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
        row["poverty_percent_2023"] = float(row["poverty_percent_2023"])
        row["foreign_born_percent_2023"] = float(row["foreign_born_percent_2023"])

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
    pov = [s["poverty_percent_2023"] for s in states]
    fb = [s["foreign_born_percent_2023"] for s in states]
    tokens = {
        "__R_LOGPOP__": fmt_r(pearson(logs, counts)),
        "__R_POV_RATE__": fmt_r(pearson(pov, rates)),
        "__R_FB_RATE__": fmt_r(pearson(fb, rates)),
        "__R_POV_COUNT__": fmt_r(pearson(pov, counts)),
        "__R_FB_COUNT__": fmt_r(pearson(fb, counts)),
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
    print(" ".join(f"{k}={v}" for k, v in tokens.items()))


if __name__ == "__main__":
    main()
