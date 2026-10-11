"""OpenSecrets industry totals, cycles 2016–2024.

Live pages returned HTTP 403 (Cloudflare) on 2026-10-11. The rows below are
the Totals-by-Election-Cycle table from the Internet Archive capture
20260716031036 of each OpenSecrets industry totals page, retrieved that day.

Party percentages are OpenSecrets' published shares of contributions to
candidates and parties. Outside spending is included in `total` and is
excluded from the party split, which is why the two party percentages need
not sum to 100.

This script does not re-sum raw FEC itemized filings. OpenSecrets codes
those filings into industries.
"""

from __future__ import annotations

import csv
from pathlib import Path

ROWS = [
    # industry, code, cycle, total, individuals, pacs, soft_outside, dem, rep, pct_dem, pct_rep
    ("Beer, Wine & Liquor", "N02", 2024, 27431159, 13492024, 5844122, 8095013, 10260545, 9026205, 52.70, 46.36),
    ("Beer, Wine & Liquor", "N02", 2022, 19706973, 9740556, 6211127, 3755290, 7913869, 8074160, 49.44, 50.44),
    ("Beer, Wine & Liquor", "N02", 2020, 28633569, 17545678, 6113681, 4974210, 12678879, 10968742, 53.48, 46.26),
    ("Beer, Wine & Liquor", "N02", 2018, 18996494, 10797136, 6704151, 1495207, 8604189, 9058024, 48.67, 51.23),
    ("Beer, Wine & Liquor", "N02", 2016, 23906709, 14141515, 6819523, 2945671, 10054967, 10940392, 47.84, 52.06),
    ("Tobacco", "A02", 2024, 36653972, 2680980, 1833262, 32139730, 1416762, 3660732, 27.64, 71.41),
    ("Tobacco", "A02", 2022, 8209303, 1058537, 1476731, 5674035, 854036, 1697557, 33.47, 66.52),
    ("Tobacco", "A02", 2020, 8586434, 2162098, 1821805, 4602531, 1241251, 2774399, 30.88, 69.01),
    ("Tobacco", "A02", 2018, 5862880, 1425220, 1942932, 2494728, 764915, 2621007, 22.58, 77.36),
    ("Tobacco", "A02", 2016, 5408865, 1745905, 2014150, 1648810, 633261, 3148326, 16.74, 83.24),
    ("Pharmaceuticals / Health Products", "H04", 2024, 86521633, 48549058, 19008485, 18964090, 40910749, 26710284, 60.04, 39.20),
    ("Pharmaceuticals / Health Products", "H04", 2022, 49798365, 25261433, 15984335, 8552597, 24860686, 16757360, 59.52, 40.12),
    ("Pharmaceuticals / Health Products", "H04", 2020, 103513939, 63397698, 18332143, 21784098, 51215807, 30340915, 62.56, 37.06),
    ("Pharmaceuticals / Health Products", "H04", 2018, 47099862, 21810981, 19960606, 5328275, 21122655, 20730008, 50.36, 49.43),
    ("Pharmaceuticals / Health Products", "H04", 2016, 67722833, 26321705, 21153317, 20247811, 22702976, 24783033, 47.68, 52.05),
    ("Marijuana", "N09", 2024, 969606, 245993, 65500, 658113, 219379, 125482, 61.40, 35.12),
    ("Marijuana", "N09", 2022, 583753, 497778, 65500, 20475, 445290, 137428, 76.34, 23.56),
    ("Marijuana", "N09", 2020, 660616, 568728, 59900, 31988, 514283, 134503, 79.24, 20.72),
    ("Marijuana", "N09", 2018, 608391, 321891, 101500, 185000, 173656, 249244, 41.02, 58.87),
    ("Marijuana", "N09", 2016, 235538, 177788, 57750, 0, 128540, 105300, 54.57, 44.71),
]

FIELDS = [
    "industry",
    "opensecrets_code",
    "cycle",
    "total",
    "from_individuals",
    "from_pacs",
    "soft_outside",
    "to_democrats",
    "to_republicans",
    "pct_democrats",
    "pct_republicans",
    "source_url",
    "archive_url",
    "archive_captured",
    "retrieved",
]


def records():
    out = []
    for industry, code, cycle, total, indiv, pacs, soft, dem, rep, pdm, prep in ROWS:
        out.append(
            {
                "industry": industry,
                "opensecrets_code": code,
                "cycle": cycle,
                "total": total,
                "from_individuals": indiv,
                "from_pacs": pacs,
                "soft_outside": soft,
                "to_democrats": dem,
                "to_republicans": rep,
                "pct_democrats": pdm,
                "pct_republicans": prep,
                "source_url": f"https://www.opensecrets.org/industries/totals?cycle=2024&ind={code}",
                "archive_url": f"https://web.archive.org/web/20260716031036/https://www.opensecrets.org/industries/totals?cycle=2024&ind={code}",
                "archive_captured": "2026-07-16",
                "retrieved": "2026-10-11",
            }
        )
    return out


def write_csv(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS)
        w.writeheader()
        w.writerows(records())


if __name__ == "__main__":
    dest = Path(__file__).resolve().parent / "results" / "industry_donations.csv"
    write_csv(dest)
    print(dest)
