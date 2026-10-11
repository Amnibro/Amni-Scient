#!/usr/bin/env python3
"""National and state series: NSDUH use, NAEP scores, presidential vote.

State NSDUH figures are SAMHSA small-area estimates, two-year pools.
The national line is the National row in the same files, ages 12 or older.
NAEP figures are NCES composite means for all students, public schools at
the state level and national public for the U.S. line. Presidential
two-party share is Democratic votes divided by Democratic plus Republican
votes. The ICAR35 result is the published Table 1 slope, stated beside
the NAEP chart. The paper does not print a year-by-year mean series.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd
import statsmodels.api as sm

HERE = Path(__file__).resolve().parent
DATA = HERE / "data"
RESULTS = HERE / "results"
NAEP_DIR = Path("/tmp/eco/overtime/naep")
SAS_OLD = Path("/tmp/eco/overtime/state_saes_99_19.sas7bdat")
SAS_NEW = Path("/tmp/eco/overtime/state_saes_21_24.sas7bdat")
PRES_SRC = Path(
    "/home/ubuntu/.cursor/projects/workspace/agent-tools/50d43849-7150-4b83-8a0e-807b9e3e86cf.txt"
)

# Stable series. codes are SAE outcome names. A new code starts a new segment
# so a definition change is not drawn as one line.
SERIES = [
    ("mj", "Marijuana, past month", "#16A34A", ["MRJMON"], False),
    ("mrjyr", "Marijuana, past year", "#15803D", ["MRJYR"], True),
    ("alc", "Alcohol, past month", "#2563EB", ["ALCMON"], False),
    ("binge", "Binge alcohol, past month", "#0891B2", ["BNGALC", "BNGDRK"], False),
    ("coc", "Cocaine, past year", "#EA580C", ["COCYR"], False),
    ("her", "Heroin, past year", "#78716C", ["HERYR"], False),
    ("iem", "Illicit drugs other than marijuana, past month", "#7C3AED", ["IEMMON", "ILLEMMON"], False),
    ("met", "Methamphetamine, past year", "#DB2777", ["METHAMYR"], False),
    ("hal", "Hallucinogens, past year", "#4F46E5", ["HALLUCYR"], False),
    ("pnr", "Pain reliever misuse, past year", "#65A30D", ["ANLYR", "PNRNMYR"], False),
    ("opin", "Opioid misuse, past year", "#0D9488", ["OPINMYR", "OPINMYR2"], False),
]
# Codes that must not be connected to the previous code (definition or questionnaire break).
BREAK_CODES = {"BNGDRK", "ILLEMMON", "PNRNMYR"}
FD_MEASURES = ["mj", "mrjyr", "alc", "coc"]
FD_EARLY = "2009-2010"
FD_LATE = "2018-2019"
NAEP_SUBJECTS = [
    ("math", 4, "Mathematics, grade 4", "#8A6318"),
    ("math", 8, "Mathematics, grade 8", "#EA580C"),
    ("reading", 4, "Reading, grade 4", "#2563EB"),
    ("reading", 8, "Reading, grade 8", "#7C3AED"),
]
# Adult-use year marked on the timeline. Notes quote the retrieved sources.
# Book of the States table 7.22, November 2023, except the two NCSL rows.
LEGAL = [
    ("CO", 2012, "Voters approved Amendment 64 in 2012. Retail sales began January 2014."),
    ("WA", 2012, "Voters approved Initiative 502 in 2012. Retail sales began July 2014."),
    ("AK", 2014, "Ballot Measure 2, 2014."),
    ("OR", 2014, "Voters approved Measure 91 in 2014. Retail sales began October 1, 2015."),
    ("DC", 2014, "Voters approved Initiative 71 in 2014."),
    ("CA", 2016, "Proposition 64. Personal use and home grow legal beginning November 2016."),
    ("MA", 2016, "Ballot Question 4, 2016."),
    ("NV", 2016, "Ballot Question 2, 2016. Retail sales began July 1, 2017."),
    ("ME", 2017, "Possession and home grow beginning January 30, 2017."),
    ("VT", 2018, "H.511 went into effect July 1, 2018."),
    ("MI", 2018, "Proposal 1, 2018. Retail sales began December 6, 2019."),
    ("IL", 2020, "Licensed dispensary sales starting January 1, 2020."),
    ("AZ", 2020, "Proposition 207 approved on the 2020 ballot."),
    ("MT", 2020, "I-190 approved on the 2020 ballot."),
    ("NJ", 2020, "Marijuana Legalization Amendment approved on the 2020 ballot."),
    ("CT", 2021, "Possession of up to 1.5 ounces began July 1, 2021."),
    ("NM", 2021, "HB 2. Retail sales beginning April 2022."),
    ("NY", 2021, "S.854. Retail sales began December 29, 2022."),
    ("VA", 2021, "Legal possession of one ounce or less beginning July 1, 2021."),
    ("RI", 2022, "Retail sales began December 1, 2022."),
    ("DE", 2023, "HB 1 and HB 2 enacted in 2023."),
    ("MD", 2023, "Question 4. Adult use starting July 2023."),
    ("MN", 2023, "Bill signed May 30, 2023."),
    ("MO", 2023, "Retail sales began February 3, 2023."),
    ("OH", 2023, "Issue 2 passed November 7, 2023. Retail sales began August 6, 2024."),
]
NCSL_STATES = {"VT", "DE"}
POSTAL = {
    "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR", "California": "CA",
    "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE", "District of Columbia": "DC",
    "Florida": "FL", "Georgia": "GA", "Hawaii": "HI", "Idaho": "ID", "Illinois": "IL",
    "Indiana": "IN", "Iowa": "IA", "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA",
    "Maine": "ME", "Maryland": "MD", "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN",
    "Mississippi": "MS", "Missouri": "MO", "Montana": "MT", "Nebraska": "NE", "Nevada": "NV",
    "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
    "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH", "Oklahoma": "OK", "Oregon": "OR",
    "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD",
    "Tennessee": "TN", "Texas": "TX", "Utah": "UT", "Vermont": "VT", "Virginia": "VA",
    "Washington": "WA", "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY",
}


def _dec(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    for c in out.columns:
        if out[c].dtype == object:
            out[c] = out[c].apply(lambda x: x.decode() if isinstance(x, (bytes, bytearray)) else x)
    return out


def _end_year(label: str) -> int | None:
    label = str(label).replace("(published)", "").replace("(updated)", "").strip()
    if "-" not in label:
        return None
    return int(label.split("-")[1][:4])


def extract_nsduh() -> pd.DataFrame:
    frames = []
    for path in (SAS_OLD, SAS_NEW):
        raw = _dec(pd.read_sas(path))
        raw = raw[(raw["agegrp"] == 0) & (raw["area"].isin([0, 2]))].copy()
        raw["pyearnm"] = raw["pyearnm"].astype(str).str.strip()
        raw = raw[~raw["pyearnm"].str.contains("published")]
        raw["year"] = raw["pyearnm"].map(_end_year)
        raw = raw[raw["year"].notna()]
        raw["geo"] = np.where(raw["stname"].eq("National"), "US", raw["stname"].map(POSTAL))
        raw = raw[raw["geo"].notna()]
        keep_codes = {code for _k, _l, _c, codes, _d in SERIES for code in codes}
        raw = raw[raw["outcome"].isin(keep_codes)]
        raw["pct"] = raw["BSAE"].astype(float) * 100.0
        frames.append(raw[["outcome", "pyearnm", "year", "geo", "stname", "pct", "pop"]])
    out = pd.concat(frames, ignore_index=True)
    out = out.drop_duplicates(["outcome", "pyearnm", "geo"], keep="last")
    DATA.mkdir(parents=True, exist_ok=True)
    out.to_csv(DATA / "nsduh_sae_long.csv", index=False)
    return out


def extract_naep() -> pd.DataFrame:
    rows = []
    for path in sorted(NAEP_DIR.glob("*.json")):
        obj = json.loads(path.read_text())
        for rec in obj.get("result") or []:
            val = rec.get("value")
            if val is None or rec.get("isStatDisplayable") != 1 or float(val) > 500:
                continue
            subj = "math" if rec.get("subject") == "MAT" else "reading"
            rows.append(
                {
                    "subject": subj,
                    "grade": int(rec["grade"]),
                    "year": int(rec["year"]),
                    "geo": rec["jurisdiction"],
                    "name": rec.get("jurisLabel"),
                    "score": float(val),
                }
            )
    out = pd.DataFrame(rows).drop_duplicates(["subject", "grade", "year", "geo"], keep="last")
    out.to_csv(DATA / "naep_scores.csv", index=False)
    return out


def extract_president() -> pd.DataFrame:
    raw = pd.read_csv(PRES_SRC)
    raw = raw[raw["year"].between(2004, 2024) & raw["party_simplified"].isin(["DEMOCRAT", "REPUBLICAN"])]
    rows = []
    for (year, po), g in raw.groupby(["year", "state_po"]):
        dem = float(g.loc[g["party_simplified"].eq("DEMOCRAT"), "candidatevotes"].sum())
        rep = float(g.loc[g["party_simplified"].eq("REPUBLICAN"), "candidatevotes"].sum())
        rows.append(
            {
                "year": int(year),
                "geo": po,
                "state": g["state"].iloc[0],
                "dem": dem,
                "rep": rep,
                "two_party": dem + rep,
                "dem2": dem / (dem + rep),
                "version": g["version"].iloc[0],
            }
        )
    out = pd.DataFrame(rows)
    out.to_csv(DATA / "president_twoparty.csv", index=False)
    return out


def extract_legal() -> pd.DataFrame:
    rows = []
    for po, year, note in LEGAL:
        src = (
            "NCSL, Cannabis Overview, updated June 20, 2024"
            if po in NCSL_STATES
            else "Council of State Governments, Book of the States, table 7.22, November 2023"
        )
        if po == "OH":
            src = (
                "Council of State Governments, Book of the States, table 7.22, November 2023; "
                "NCSL, Cannabis Overview, updated June 20, 2024"
            )
        rows.append({"geo": po, "year": year, "note": note, "source": src})
    out = pd.DataFrame(rows)
    out.to_csv(DATA / "cannabis_adult_use.csv", index=False)
    return out


def load_frames() -> dict[str, pd.DataFrame]:
    return {
        "nsduh": pd.read_csv(DATA / "nsduh_sae_long.csv"),
        "naep": pd.read_csv(DATA / "naep_scores.csv"),
        "vote": pd.read_csv(DATA / "president_twoparty.csv"),
        "legal": pd.read_csv(DATA / "cannabis_adult_use.csv") if (DATA / "cannabis_adult_use.csv").exists() else extract_legal(),
    }


def _segments(df: pd.DataFrame, codes: list[str]) -> list[list[tuple[int, float, str]]]:
    """Points as (end year, percent, pool label), split on gaps and new codes."""
    sub = df[df["outcome"].isin(codes)].sort_values("year")
    groups: list[list[tuple[int, float, str]]] = []
    cur: list[tuple[int, float, str]] = []
    prev_year = None
    prev_code = None
    for rec in sub.itertuples(index=False):
        code = rec.outcome
        year = int(rec.year)
        split = prev_year is not None and (year - prev_year > 2.5 or (code in BREAK_CODES and code != prev_code))
        if split and cur:
            groups.append(cur)
            cur = []
        cur.append((year, float(rec.pct), str(rec.pyearnm)))
        prev_year, prev_code = year, code
    if cur:
        groups.append(cur)
    return groups


def _fit_change(y, x, w) -> dict:
    res = sm.WLS(y, sm.add_constant(x), weights=w).fit(cov_type="HC1")
    return {
        "n": int(res.nobs),
        "intercept": float(res.params[0]),
        "coef": float(res.params[1]),
        "se": float(res.bse[1]),
        "p": float(res.pvalues[1]),
        "r2": float(res.rsquared),
    }


def state_changes(frames: dict[str, pd.DataFrame]) -> tuple[pd.DataFrame, list[dict]]:
    use = frames["nsduh"]
    naep = frames["naep"]
    vote = frames["vote"]
    code_of = {key: codes for key, _l, _c, codes, _d in SERIES}
    early = use[(use["pyearnm"] == FD_EARLY) & (use["geo"] != "US")]
    late = use[(use["pyearnm"] == FD_LATE) & (use["geo"] != "US")]
    v08 = vote[vote["year"] == 2008].set_index("geo")
    v20 = vote[vote["year"] == 2020].set_index("geo")
    rows = []
    geos = sorted(set(early["geo"]) & set(late["geo"]) & set(v08.index) & set(v20.index))
    for geo in geos:
        rec = {
            "geo": geo,
            "vote_2008": float(v08.loc[geo, "dem2"] * 100),
            "vote_2020": float(v20.loc[geo, "dem2"] * 100),
            "dvote": float(v20.loc[geo, "dem2"] * 100 - v08.loc[geo, "dem2"] * 100),
            "w": float(0.5 * (v08.loc[geo, "two_party"] + v20.loc[geo, "two_party"])),
        }
        for key in FD_MEASURES:
            codes = code_of[key]
            a = early[(early["geo"] == geo) & (early["outcome"].isin(codes))]
            b = late[(late["geo"] == geo) & (late["outcome"].isin(codes))]
            if len(a) == 1 and len(b) == 1 and a.iloc[0]["outcome"] == b.iloc[0]["outcome"]:
                rec[f"{key}_early"] = float(a.iloc[0]["pct"])
                rec[f"{key}_late"] = float(b.iloc[0]["pct"])
                rec[f"d_{key}"] = float(b.iloc[0]["pct"] - a.iloc[0]["pct"])
        for subj, grade, _lab, _col in NAEP_SUBJECTS:
            a = naep[(naep["geo"] == geo) & (naep["subject"] == subj) & (naep["grade"] == grade) & (naep["year"] == 2009)]
            b = naep[(naep["geo"] == geo) & (naep["subject"] == subj) & (naep["grade"] == grade) & (naep["year"] == 2019)]
            if len(a) == 1 and len(b) == 1:
                rec[f"naep_{subj}{grade}_2009"] = float(a.iloc[0]["score"])
                rec[f"naep_{subj}{grade}_2019"] = float(b.iloc[0]["score"])
                rec[f"d_naep_{subj}{grade}"] = float(b.iloc[0]["score"] - a.iloc[0]["score"])
        rows.append(rec)
    panel = pd.DataFrame(rows)
    panel.to_csv(RESULTS / "state_changes.csv", index=False)
    fits = []
    outcomes = [("naep_math8", "d_naep_math8", "NAEP mathematics, grade 8")]
    outcomes += [
        (f"naep_{s}{g}", f"d_naep_{s}{g}", lab) for s, g, lab, _c in NAEP_SUBJECTS if not (s == "math" and g == 8)
    ]
    outcomes.append(("vote", "dvote", "Democratic two-party share"))
    labels = {key: lab for key, lab, *_r in SERIES}
    for key in FD_MEASURES:
        for outcome, col, olab in outcomes:
            block = panel.dropna(subset=[f"d_{key}", col, "w"])
            fit = _fit_change(block[col].to_numpy(), block[f"d_{key}"].to_numpy(), block["w"].to_numpy())
            fit.update(
                {
                    "use": key,
                    "use_label": labels[key],
                    "outcome": outcome,
                    "outcome_label": olab,
                    "window_use": f"{FD_EARLY} to {FD_LATE}",
                    "window_outcome": "2019 minus 2009" if outcome.startswith("naep") else "2020 minus 2008",
                }
            )
            fits.append(fit)
    (RESULTS / "over_time.json").write_text(json.dumps({"fits": fits}, indent=2))
    return panel, fits


def _esc(s: str) -> str:
    return str(s).replace("&", "&amp;").replace("<", "&lt;")


def _num(x, d=2, sign=False):
    n = float(x)
    body = f"{abs(n):.{d}f}"
    if sign:
        return ("+" if n >= 0 else "−") + body
    return ("−" if n < 0 else "") + body


PARTY_COLOR = {
    "D": "#2563EB",
    "R": "#DC2626",
    "initiative": "#78716C",
    "mixed": "#7C3AED",
    "agency": "#C89B4E",
    "unrecorded": "#8A6318",
}


def load_acts() -> list[dict]:
    path = DATA / "legislative_acts.csv"
    rows = []
    import csv

    for rec in csv.DictReader(path.open()):
        year = int(rec["date"][:4])
        month = int(rec["date"][5:7])
        day = int(rec["date"][8:10])
        if rec["precision"] == "day":
            x = year + (month - 1) / 12 + (day - 1) / 365
        else:
            x = year + 0.45
        rec["x"] = x
        rec["year"] = year
        rows.append(rec)
    rows.sort(key=lambda r: (r["date"], r["jurisdiction"], r["bill"]))
    return rows


def _frame(w, h, x0, x1, y0, y1, xticks, yticks, y_right=None, right=None, top_extra=0):
    left, top, bottom = 46, 16 + top_extra, 28
    if right is None:
        right = 46 if y_right else 16
    pw, ph = w - left - right, h - top - bottom

    def X(v):
        return left + (float(v) - x0) / (x1 - x0) * pw

    def Y(v, lo=y0, hi=y1):
        return top + (hi - float(v)) / (hi - lo) * ph

    parts = [f'<svg viewBox="0 0 {w} {h}" role="img" class="chart">']
    # 2020-2021 web-mode band
    if x0 < 2021 and x1 > 2020:
        parts.append(
            f'<rect x="{X(2020):.1f}" y="{top}" width="{X(2021) - X(2020):.1f}" height="{ph}" fill="#C89B4E" fill-opacity="0.28"/>'
        )
        parts.append(
            f'<text x="{(X(2020) + X(2021)) / 2:.1f}" y="{top + 12}" text-anchor="middle" class="tick">2020–21</text>'
        )
    for t in yticks:
        parts.append(f'<line x1="{left}" y1="{Y(t):.1f}" x2="{w - right:.1f}" y2="{Y(t):.1f}" class="grid"/>')
        parts.append(f'<text x="{left - 6}" y="{Y(t) + 3:.1f}" text-anchor="end" class="tick">{t:g}</text>')
    if y_right:
        lo, hi, ticks = y_right
        for t in ticks:
            parts.append(f'<text x="{w - right + 6}" y="{Y(t, lo, hi) + 3:.1f}" class="tick">{t:g}</text>')
    for t in xticks:
        parts.append(f'<text x="{X(t):.1f}" y="{h - 8}" text-anchor="middle" class="tick">{t}</text>')
    parts.append(f'<line x1="{left}" y1="{top}" x2="{left}" y2="{h - bottom}" class="axis"/>')
    parts.append(f'<line x1="{left}" y1="{h - bottom}" x2="{w - right}" y2="{h - bottom}" class="axis"/>')
    return parts, X, Y, left, top, ph, w, right


def _polyline(parts, X, Y, pts, color, dash=False, ymap=None):
    if len(pts) < 1:
        return
    coords = []
    for year, val in pts:
        yy = Y(val) if ymap is None else ymap(val)
        coords.append(f"{X(year):.1f},{yy:.1f}")
    style = f'fill="none" stroke="{color}" stroke-width="2.2"'
    if dash:
        style += ' stroke-dasharray="5 3"'
    if len(coords) >= 2:
        parts.append(f'<polyline points="{" ".join(coords)}" {style}/>')
    for year, val in pts:
        yy = Y(val) if ymap is None else ymap(val)
        parts.append(f'<circle cx="{X(year):.1f}" cy="{yy:.1f}" r="2.3" fill="{color}"/>')


def _law_marks(parts, X, acts: list[dict], x0: float, x1: float) -> None:
    """Party-colored markers in the top band. Open squares are tighter access."""
    shown = [a for a in acts if x0 <= a["x"] <= x1]
    buckets: dict[int, list[dict]] = {}
    for act in shown:
        buckets.setdefault(int(act["year"]), []).append(act)
    for year, group in buckets.items():
        group = sorted(group, key=lambda a: (a["direction"] != "tighten", a["bill"]))
        draw = group[:8]
        for i, act in enumerate(draw):
            col = i % 4
            row = i // 4
            n_in_row = min(4, len(draw) - row * 4)
            cx = X(year + 0.45) + (col - (n_in_row - 1) / 2) * 7
            cy = 8 + row * 11
            color = PARTY_COLOR.get(act["sponsor_party"], "#8A6318")
            tip = _esc(f"{act['date'][:4] if act['precision']=='year' else act['date']} {act['jurisdiction']} {act['bill']}. {act['direction']}.")
            if act["direction"] == "tighten":
                parts.append(
                    f'<rect x="{cx - 3.2:.1f}" y="{cy - 3.2:.1f}" width="6.4" height="6.4" fill="none" stroke="{color}" stroke-width="1.6"><title>{tip}</title></rect>'
                )
            else:
                parts.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="3.2" fill="{color}" stroke="var(--bg)" stroke-width="0.6"><title>{tip}</title></circle>')
        extra = len(group) - len(draw)
        if extra:
            parts.append(
                f'<text x="{X(year + 0.45) + 16:.1f}" y="14" class="tick">+{extra}</text>'
            )


def law_legend() -> str:
    return (
        '<div class="legend law">'
        '<span><i style="background:#2563EB"></i>Democratic sponsor</span>'
        '<span><i style="background:#DC2626"></i>Republican sponsor</span>'
        '<span><i style="background:#78716C"></i>Citizen initiative</span>'
        '<span><i style="background:#7C3AED"></i>Bipartisan sponsors</span>'
        '<span><i style="background:#C89B4E"></i>Agency or department</span>'
        '<span><i style="background:#8A6318"></i>Legislature, sponsor not in the source</span>'
        '<span><i class="open"></i>Open square · tighter access</span>'
        "</div>"
    )


def use_charts(nsduh: pd.DataFrame, legal: pd.DataFrame, acts: list[dict] | None = None) -> str:
    nat = nsduh[nsduh["geo"] == "US"]
    blocks = [
        (
            "Past-month marijuana, past-year marijuana, alcohol, and binge",
            ["mj", "mrjyr", "alc", "binge"],
            0,
            60,
            (0, 20, 40, 60),
            True,
        ),
        (
            "Cocaine, heroin, and the other state estimates",
            ["coc", "her", "iem", "met", "hal", "pnr", "opin"],
            0,
            12,
            (0, 4, 8, 12),
            False,
        ),
    ]
    by_key = {k: (lab, col, codes, dash) for k, lab, col, codes, dash in SERIES}
    cards = []
    for i, (title, keys, y0, y1, yticks, _marks) in enumerate(blocks):
        parts, X, Y, left, top, ph, w, right = _frame(
            860, 332, 1996, 2027.2, y0, y1, (1998, 2004, 2010, 2016, 2022, 2026), yticks, top_extra=28
        )
        for key in keys:
            lab, col, codes, dash = by_key[key]
            for seg in _segments(nat[nat["outcome"].isin(codes)], codes):
                _polyline(parts, X, Y, [(a, b) for a, b, _p in seg], col, dash=dash)
        if acts:
            _law_marks(parts, X, acts, 1996, 2027.2)
        parts.append("</svg>")
        legend = "".join(
            f'<span><i style="background:{by_key[k][1]}"></i>{_esc(by_key[k][0])}</span>' for k in keys
        )
        cards.append(
            f'<p class="slope-k">{_esc(title)}</p><div class="legend">{legend}</div>'
            + (law_legend() if i == 0 else "")
            + f'<div class="chart-card"{ " id=\"use-law-chart\"" if i == 0 else ""}>{"".join(parts)}</div>'
            f'<p class="axis-name"><span>Y · Percent, ages 12+</span><span>X · Later year of the two-year pool</span></p>'
        )
    return "\n".join(cards)


def cognition_chart(naep: pd.DataFrame, acts: list[dict] | None = None) -> str:
    nat = naep[naep["geo"] == "NP"]
    y0, y1 = 205, 295
    parts, X, Y, left, top, ph, w, right = _frame(
        860, 352, 1996, 2027.2, y0, y1, (1998, 2004, 2010, 2016, 2022, 2026), (210, 230, 250, 270, 290), right=28, top_extra=28
    )
    shorts = {
        ("math", 4): "Math 4",
        ("math", 8): "Math 8",
        ("reading", 4): "Reading 4",
        ("reading", 8): "Reading 8",
    }
    ends = []
    for subj, grade, _lab, col in NAEP_SUBJECTS:
        pts = nat[(nat["subject"] == subj) & (nat["grade"] == grade)].sort_values("year")
        series = list(zip(pts["year"].astype(int), pts["score"].astype(float)))
        _polyline(parts, X, Y, series, col)
        year, val = series[-1]
        ends.append([Y(val), shorts[(subj, grade)], col, year])
    ends.sort(key=lambda row: row[0])
    for i in range(1, len(ends)):
        if ends[i][0] - ends[i - 1][0] < 14:
            ends[i][0] = ends[i - 1][0] + 14
    for yy, short, col, year in ends:
        parts.append(
            f'<text x="{X(year) + 8:.1f}" y="{yy + 4:.1f}" style="fill:{col};font-size:12px;font-weight:700;font-family:Archivo,sans-serif">{_esc(short)}</text>'
        )
    if acts:
        _law_marks(parts, X, acts, 1996, 2027.2)
    parts.append("</svg>")
    legend = "".join(
        f'<span><i style="background:{col}"></i>{_esc(lab)}</span>' for _s, _g, lab, col in NAEP_SUBJECTS
    )
    return (
        '<p class="slope-k">NAEP national public, mathematics and reading</p>'
        f'<div class="legend naep">{legend}</div>'
        f'<div class="chart-card" id="naep-chart">{"".join(parts)}</div>'
        '<p class="axis-name"><span>Y · NAEP composite, national public</span><span>X · Year</span></p>'
    )


def vote_chart(vote: pd.DataFrame, acts: list[dict] | None = None) -> str:
    nat_rows = []
    for year, g in vote.groupby("year"):
        dem = g["dem"].sum()
        rep = g["rep"].sum()
        nat_rows.append((int(year), 100 * dem / (dem + rep)))
    parts, X, Y, *_rest = _frame(860, 312, 2002, 2027.2, 0, 100, (2004, 2008, 2012, 2016, 2020, 2024), (0, 25, 50, 75, 100), top_extra=28)
    _polyline(parts, X, Y, nat_rows, "#8A6318")
    if acts:
        _law_marks(parts, X, acts, 2002, 2027.2)
    for year, val in nat_rows:
        parts.append(
            f'<text x="{X(year):.1f}" y="{Y(val) - 8:.1f}" text-anchor="middle" class="lab">{val:.1f}</text>'
        )
    parts.append("</svg>")
    return (
        '<p class="slope-k">Democratic two-party share of the national popular vote</p>'
        f'<div class="chart-card">{"".join(parts)}</div>'
        '<p class="axis-name"><span>Y · Democratic two-party share, 0–100%</span><span>X · Presidential election</span></p>'
    )


def _scatter(xs, ys, wts, color, a, b):
    x0, x1 = float(np.min(xs)) - 1, float(np.max(xs)) + 1
    y0, y1 = float(np.min(ys)) - 1, float(np.max(ys)) + 1
    left, right, top, bottom = 36, 10, 8, 22
    pw = ph = 200
    w, h = left + pw + right, top + ph + bottom

    def X(v):
        return left + (float(v) - x0) / (x1 - x0) * pw

    def Y(v):
        return top + (y1 - float(v)) / (y1 - y0) * ph

    parts = [f'<svg viewBox="0 0 {w} {h}" role="img" class="chart">']
    parts.append(f'<line x1="{left}" y1="{top}" x2="{left}" y2="{h - bottom}" class="axis"/>')
    parts.append(f'<line x1="{left}" y1="{h - bottom}" x2="{w - right}" y2="{h - bottom}" class="axis"/>')
    m = float(np.max(wts))
    for x, y, wt in zip(xs, ys, wts):
        rad = 2.2 + 4.5 * (float(wt) / m) ** 0.5
        parts.append(f'<circle cx="{X(x):.1f}" cy="{Y(y):.1f}" r="{rad:.2f}" fill="{color}" fill-opacity="0.75"/>')
    parts.append(
        f'<line x1="{X(x0):.1f}" y1="{Y(a + b * x0):.1f}" x2="{X(x1):.1f}" y2="{Y(a + b * x1):.1f}" stroke="{color}" stroke-width="2.2"/>'
    )
    parts.append("</svg>")
    return "".join(parts)


def change_panel(panel: pd.DataFrame, fits: list[dict]) -> str:
    want = {("mj", "naep_math8"), ("alc", "naep_math8"), ("coc", "naep_math8"), ("mrjyr", "naep_math8"),
            ("mj", "vote"), ("alc", "vote"), ("coc", "vote"), ("mrjyr", "vote")}
    fit_of = {(f["use"], f["outcome"]): f for f in fits}
    colors = {k: c for k, _l, c, _codes, _d in SERIES}
    labels = {k: lab for k, lab, *_r in SERIES}
    cards = []
    for key, outcome in [("mj", "naep_math8"), ("mj", "vote"), ("alc", "naep_math8"), ("alc", "vote"),
                         ("mrjyr", "naep_math8"), ("mrjyr", "vote"), ("coc", "naep_math8"), ("coc", "vote")]:
        f = fit_of[(key, outcome)]
        ycol = "d_naep_math8" if outcome == "naep_math8" else "dvote"
        block = panel.dropna(subset=[f"d_{key}", ycol])
        yname = "NAEP math, grade 8" if outcome == "naep_math8" else "Democratic share"
        svg = _scatter(block[f"d_{key}"], block[ycol], block["w"], colors[key], f["intercept"], f["coef"])
        cards.append(
            '<div class="slope-card">'
            f'<p class="slope-k"><i style="background:{colors[key]}"></i>{_esc(labels[key])} → {_esc(yname)}</p>'
            f'<p class="slope-v">{_num(f["coef"], sign=True)}<span>per point of use · SE {_num(f["se"])} · N {f["n"]}</span></p>'
            f"{svg}</div>"
        )
    return '<div class="slope-grid">' + "".join(cards) + "</div>"


def coef_table(fits: list[dict]) -> str:
    rows = []
    for f in fits:
        rows.append(
            "<tr>"
            f"<td>{_esc(f['use_label'])}</td>"
            f"<td>{_esc(f['outcome_label'])}</td>"
            f"<td>{_num(f['coef'], sign=True)}</td>"
            f"<td>{_num(f['se'])}</td>"
            f"<td>{f['n']}</td>"
            "</tr>"
        )
    return "\n".join(rows)


# Comprehensive medical programs. Year is the statute year NCSL prints.
# Low-THC programs are not in this list. Retrieved 2026-10-11 from
# NCSL, State Medical Cannabis Laws, updated September 2, 2026.
MEDICAL_YEAR = {
    "AL": 2021, "AK": 1998, "AZ": 2010, "AR": 2016, "CA": 1996, "CO": 2000,
    "CT": 2012, "DE": 2011, "DC": 2010, "FL": 2016, "GA": 2026, "HI": 2000,
    "IL": 2013, "KY": 2023, "LA": 2017, "ME": 1999, "MD": 2014, "MA": 2012,
    "MI": 2008, "MN": 2014, "MS": 2022, "MO": 2018, "MT": 2004, "NE": 2024,
    "NV": 2000, "NH": 2013, "NJ": 2010, "NM": 2007, "NY": 2014, "ND": 2016,
    "OH": 2016, "OK": 2018, "OR": 1998, "PA": 2016, "RI": 2007, "SD": 2020,
    "TX": 2025, "UT": 2018, "VT": 2004, "VA": 2020, "WA": 1998, "WV": 2017,
}
LAGS = (0, 2, 4, 6, 8, 10, 12, 14)
CHART_LAGS = (0, 2, 4, 6, 8)


def _code_map() -> dict[str, tuple[str, str, str]]:
    out = {}
    for key, label, _color, codes, _dash in SERIES:
        for code in codes:
            segment = code if code in BREAK_CODES else key
            out[code] = (key, label, segment)
    return out


def _use_state(nsduh: pd.DataFrame) -> pd.DataFrame:
    mapped = _code_map()
    st = nsduh[nsduh["geo"].isin(POSTAL.values())].copy()
    st["year"] = st["year"].astype(int)
    st["series"] = st["outcome"].map(lambda c: mapped.get(c, (None, None, None))[0])
    st["use_label"] = st["outcome"].map(lambda c: mapped.get(c, (None, None, None))[1])
    st["segment"] = st["outcome"].map(lambda c: mapped.get(c, (None, None, None))[2])
    st = st.dropna(subset=["series"])
    return st[["geo", "year", "series", "use_label", "segment", "pct"]]


def _twoway(df: pd.DataFrame, xnames: list[str]) -> list[dict] | None:
    d = df.dropna(subset=["y", *xnames, "geo", "year"]).copy()
    d["year"] = d["year"].astype(int)
    if d["geo"].nunique() < 20 or d["year"].nunique() < 3 or len(d) < 80:
        return None
    y = d["y"].to_numpy(dtype=float)
    xc = d[xnames].to_numpy(dtype=float)
    if np.any(xc.std(axis=0) < 1e-8):
        return None
    states = pd.get_dummies(d["geo"], drop_first=True, dtype=float)
    years = pd.get_dummies(d["year"], drop_first=True, dtype=float)
    extra = np.column_stack([states.to_numpy(), years.to_numpy()])
    keep_extra = extra.std(axis=0) > 1e-8
    X = sm.add_constant(np.column_stack([xc, extra[:, keep_extra]]), has_constant="add")
    try:
        res = sm.OLS(y, X).fit(cov_type="cluster", cov_kwds={"groups": d["geo"].to_numpy()})
    except (ValueError, np.linalg.LinAlgError):
        return None
    rows = []
    for i, name in enumerate(xnames):
        rows.append(
            {
                "term": name,
                "coef": float(res.params[i + 1]),
                "se": float(res.bse[i + 1]),
                "p": float(res.pvalues[i + 1]),
                "n": int(res.nobs),
                "n_states": int(d["geo"].nunique()),
                "n_years": int(d["year"].nunique()),
            }
        )
    return rows


def lag_fits(frames: dict[str, pd.DataFrame]) -> pd.DataFrame:
    """State and year fixed effects of scores and vote share on delayed use."""
    use = _use_state(frames["nsduh"])
    legal = {str(r.geo): int(r.year) for r in frames["legal"].itertuples(index=False)}
    med_rows = [{"geo": g, "year": y, "kind": "medical", "source": "NCSL State Medical Cannabis Laws, updated September 2, 2026"} for g, y in sorted(MEDICAL_YEAR.items())]
    pd.DataFrame(med_rows).to_csv(DATA / "cannabis_medical.csv", index=False)
    outcomes = []
    naep = frames["naep"]
    naep = naep[naep["geo"].isin(set(POSTAL.values()))]
    for subject, grade, label, _color in NAEP_SUBJECTS:
        sub = naep[(naep["subject"] == subject) & (naep["grade"] == grade)][["geo", "year", "score"]].copy()
        sub["year"] = sub["year"].astype(int)
        sub = sub.rename(columns={"score": "y"})
        outcomes.append((f"naep_{subject}{grade}", label, sub))
    vote = frames["vote"]
    vote = vote[vote["geo"].isin(set(POSTAL.values()))][["geo", "year", "dem2"]].copy()
    vote["year"] = vote["year"].astype(int)
    vote["y"] = vote["dem2"] * 100.0
    outcomes.append(("vote", "Democratic two-party share", vote[["geo", "year", "y"]]))

    specs = []
    series_keys = use.groupby(["series", "segment", "use_label"], as_index=False).size()
    for rec in series_keys.itertuples(index=False):
        u = use[(use["series"] == rec.series) & (use["segment"] == rec.segment)][["geo", "year", "pct"]]
        wide_lags = {}
        for k in LAGS:
            shifted = u.rename(columns={"year": "uyear", "pct": f"lag_{k}"})
            shifted["year"] = shifted["uyear"] + k
            wide_lags[k] = shifted[["geo", "year", f"lag_{k}"]]
        for okey, olabel, odf in outcomes:
            base = odf.merge(wide_lags[0], on=["geo", "year"], how="left")
            for k in LAGS:
                if k == 0:
                    continue
                base = base.merge(wide_lags[k], on=["geo", "year"], how="left")
            # Drop a lag when the use year sits on the other side of the 2021 break.
            for k in LAGS:
                use_year = base["year"] - k
                ok = ((base["year"] <= 2020) & (use_year <= 2019)) | ((base["year"] >= 2022) & (use_year >= 2022))
                base.loc[~ok, f"lag_{k}"] = np.nan
            base["years_medical"] = [
                0.0 if (MEDICAL_YEAR.get(g) is None or int(y) < MEDICAL_YEAR[g]) else float(int(y) - MEDICAL_YEAR[g])
                for g, y in zip(base["geo"], base["year"])
            ]
            base["years_recreational"] = [
                0.0 if (legal.get(g) is None or int(y) < legal[g]) else float(int(y) - legal[g])
                for g, y in zip(base["geo"], base["year"])
            ]
            # Cumulative exposure: window length times the mean of pools in the prior window.
            u_idx = u.set_index(["geo", "year"])["pct"]

            def cum_value(geo: str, year: int, window: int) -> float:
                years = range(int(year) - window, int(year))
                if int(year) <= 2020:
                    years = [t for t in years if t <= 2019]
                else:
                    years = [t for t in years if t >= 2022]
                vals = []
                for t in years:
                    key = (geo, t)
                    if key in u_idx.index:
                        vals.append(float(u_idx.loc[key]))
                need = 3 if window == 5 else 5
                if len(vals) < need:
                    return np.nan
                return float(window * np.mean(vals))

            pairs = list(zip(base["geo"], base["year"]))
            base["cum_5"] = [cum_value(g, y, 5) for g, y in pairs]
            base["cum_10"] = [cum_value(g, y, 10) for g, y in pairs]
            pre = base[base["year"] <= 2020]
            jobs = [("lag", f"lag_{k}", [f"lag_{k}"]) for k in LAGS]
            jobs.append(("distributed", "distributed", [f"lag_{k}" for k in CHART_LAGS]))
            jobs.append(("cumulative", "cum_5", ["cum_5"]))
            jobs.append(("cumulative", "cum_10", ["cum_10"]))
            jobs.append(("legalization", "years_medical", ["years_medical"]))
            jobs.append(("legalization", "years_recreational", ["years_recreational"]))
            jobs.append(("legalization", "years_both", ["years_medical", "years_recreational"]))
            for family, spec, cols in jobs:
                fitted = _twoway(pre, cols)
                if not fitted:
                    continue
                for row in fitted:
                    specs.append(
                        {
                            "use": rec.series,
                            "use_label": rec.use_label,
                            "segment": rec.segment,
                            "outcome": okey,
                            "outcome_label": olabel,
                            "family": family,
                            "spec": spec,
                            "sample": "through 2020, use through 2019",
                            **row,
                        }
                    )
    out = pd.DataFrame(specs)
    out.to_csv(RESULTS / "lag_specs.csv", index=False)
    return out


def _lag_chart(specs: pd.DataFrame) -> str:
    """Coefficient against lag for marijuana and alcohol, one panel per outcome."""
    outcomes = [
        ("naep_math4", "Grade 4 math"),
        ("naep_math8", "Grade 8 math"),
        ("naep_reading4", "Grade 4 reading"),
        ("naep_reading8", "Grade 8 reading"),
        ("vote", "Democratic share"),
    ]
    colors = {"mj": "#16A34A", "alc": "#2563EB"}
    cards = []
    for okey, title in outcomes:
        sub = specs[(specs["outcome"] == okey) & (specs["family"] == "lag") & (specs["use"].isin(["mj", "alc"]))]
        sub = sub[sub["segment"] == sub["use"]]
        if sub.empty:
            continue
        lags = list(CHART_LAGS)
        ys = []
        for lag in lags:
            for substance in ("mj", "alc"):
                hit = sub[(sub["use"] == substance) & (sub["term"] == f"lag_{lag}")]
                if len(hit):
                    coef = float(hit.iloc[0]["coef"])
                    se = float(hit.iloc[0]["se"])
                    ys.extend((coef - se, coef + se))
        if not ys:
            continue
        y_pad = max(0.05, (max(ys) - min(ys)) * 0.35)
        y0, y1 = min(ys) - y_pad, max(ys) + y_pad
        if y0 < 0 < y1:
            pass
        left, right, top, bottom = 46, 8, 16, 22
        plot_w, plot_h = 168, 120
        w, h = left + plot_w + right, top + plot_h + bottom

        def X(v, _lags=lags):
            return left + (v - _lags[0]) / (_lags[-1] - _lags[0]) * plot_w

        def Y(v):
            return top + (y1 - v) / (y1 - y0) * plot_h

        parts = [f'<svg viewBox="0 0 {w} {h}" role="img" class="chart">']
        parts.append(f'<line x1="{left}" y1="{Y(0):.1f}" x2="{left + plot_w}" y2="{Y(0):.1f}" class="grid"/>')
        for lag in lags:
            parts.append(f'<text x="{X(lag):.1f}" y="{h - 6}" text-anchor="middle" class="tick">{lag}</text>')
        def tick(v):
            body = f"{abs(v):.2f}"
            return ("−" + body) if v < 0 else body

        parts.append(f'<text x="{left - 4}" y="{Y(y1) + 9:.1f}" text-anchor="end" class="tick">{tick(y1)}</text>')
        parts.append(f'<text x="{left - 4}" y="{Y(y0):.1f}" text-anchor="end" class="tick">{tick(y0)}</text>')
        for substance in ("mj", "alc"):
            pts = []
            for lag in lags:
                hit = sub[(sub["use"] == substance) & (sub["term"] == f"lag_{lag}")]
                if hit.empty:
                    continue
                coef = float(hit.iloc[0]["coef"])
                se = float(hit.iloc[0]["se"])
                pts.append((lag, coef, se))
            if len(pts) >= 2:
                path = " ".join(f"{X(lag):.1f},{Y(coef):.1f}" for lag, coef, _se in pts)
                parts.append(f'<polyline points="{path}" fill="none" stroke="{colors[substance]}" stroke-width="2.2"/>')
            for lag, coef, se in pts:
                parts.append(
                    f'<line x1="{X(lag):.1f}" y1="{Y(coef - se):.1f}" x2="{X(lag):.1f}" y2="{Y(coef + se):.1f}" stroke="{colors[substance]}" stroke-width="1.4"/>'
                )
                parts.append(f'<circle cx="{X(lag):.1f}" cy="{Y(coef):.1f}" r="3.2" fill="{colors[substance]}"/>')
        parts.append("</svg>")
        cards.append(f'<div class="slope-card"><p class="slope-k">{_esc(title)}</p>{"".join(parts)}</div>')
    return '<div class="slope-grid">' + "".join(cards) + "</div>"


def _lag_table(specs: pd.DataFrame, uses: list[str] | None, families: list[str] | None) -> str:
    sub = specs
    if uses is not None:
        sub = sub[sub["use"].isin(uses)]
    if families is not None:
        sub = sub[sub["family"].isin(families)]
    # One row per reported coefficient. Distributed-lag terms stay.
    rows = []
    sub = sub.sort_values(["use", "outcome", "family", "spec", "term"])
    for rec in sub.itertuples(index=False):
        rows.append(
            "<tr>"
            f"<td>{_esc(rec.use_label)}</td>"
            f"<td>{_esc(rec.outcome_label)}</td>"
            f"<td>{_esc(rec.family)}</td>"
            f"<td>{_esc(rec.term)}</td>"
            f"<td>{_num(rec.coef, sign=True)}</td>"
            f"<td>{_num(rec.se)}</td>"
            f"<td>{rec.n}</td>"
            f"<td>{rec.n_states}</td>"
            "</tr>"
        )
    return "\n".join(rows)


def lag_section(frames: dict[str, pd.DataFrame]) -> str:
    specs = lag_fits(frames)
    if specs.empty:
        return ""
    chart = _lag_chart(specs)
    focus = specs[specs["use"].isin(["mj", "alc"])]
    others = specs[~specs["use"].isin(["mj", "alc"]) & specs["family"].isin(["lag", "cumulative", "legalization"])]
    # Lead with marijuana grade-8 math and the vote at lag 0 and lag 8.
    def grab(use, outcome, term):
        hit = specs[(specs["use"] == use) & (specs["outcome"] == outcome) & (specs["spec"] == f"lag_{term}") & (specs["term"] == f"lag_{term}")]
        return None if hit.empty else hit.iloc[0]

    m0 = grab("mj", "naep_math8", 0)
    m8 = grab("mj", "naep_math8", 8)
    v0 = grab("mj", "vote", 0)
    v8 = grab("mj", "vote", 8)
    a0 = grab("alc", "naep_math8", 0)
    a8 = grab("alc", "naep_math8", 8)
    c5 = specs[(specs["use"] == "mj") & (specs["outcome"] == "naep_math8") & (specs["term"] == "cum_5")]
    c10 = specs[(specs["use"] == "mj") & (specs["outcome"] == "naep_math8") & (specs["term"] == "cum_10")]
    bits = []
    if m0 is not None and m8 is not None:
        bits.append(
            f"Past-month marijuana and grade-8 mathematics: <strong>{_num(m0.coef, sign=True)}</strong> points per point of use at a lag of 0 years (SE {_num(m0.se)}) and <strong>{_num(m8.coef, sign=True)}</strong> at a lag of 8 years (SE {_num(m8.se)})."
        )
    if v0 is not None and v8 is not None:
        bits.append(
            f"The same lags on Democratic two-party share are <strong>{_num(v0.coef, sign=True)}</strong> (SE {_num(v0.se)}) and <strong>{_num(v8.coef, sign=True)}</strong> (SE {_num(v8.se)})."
        )
    if a0 is not None and a8 is not None:
        bits.append(
            f"Past-month alcohol and grade-8 mathematics: <strong>{_num(a0.coef, sign=True)}</strong> at lag 0 (SE {_num(a0.se)}) and <strong>{_num(a8.coef, sign=True)}</strong> at lag 8 (SE {_num(a8.se)})."
        )
    if len(c5) and len(c10):
        bits.append(
            f"A five-year sum of past-month marijuana lines up with <strong>{_num(c5.iloc[0].coef, sign=True)}</strong> grade-8 mathematics points per percentage-point-year (SE {_num(c5.iloc[0].se)}). The ten-year sum is <strong>{_num(c10.iloc[0].coef, sign=True)}</strong> (SE {_num(c10.iloc[0].se)})."
        )
    lead = " ".join(bits)
    return f"""
<h2 id="lags">Cumulative and delayed exposure</h2>
<p>{lead}</p>
<p>Grade-4 students in the testing year are about 9 or 10 years old, so use ten years earlier lines up with the birth year. Grade-8 students are about 13 or 14, so use ten years earlier is about age 4 and use fourteen years earlier is the closer prenatal window. Those longer lags are in the table.</p>
<p>Each point is a separate regression of the outcome on use at that lag, with state and year fixed effects. The whisker is one standard error, clustered by state. Green is past-month marijuana. Blue is past-month alcohol. The horizontal line is zero.</p>
{chart}
<p class="axis-name"><span>Y · Points of the outcome per point of use</span><span>X · Lag, years</span></p>
<p class="fine cap">Outcome years run through 2020. Every use year in a row is from 2019 or earlier, so the 2021 web-mode break stays out of the slope. A sum is the window length times the mean of the two-year pools whose end year falls in the prior window. Years since medical or adult-use legalization are zero until the statute year. Medical years are the comprehensive-program statute years in NCSL, State Medical Cannabis Laws, updated September 2, 2026. Low-THC programs are not coded as medical legalization. Adult-use years are the same list as the timeline.</p>
<div class="table-scroll">
<table class="cmp">
<thead><tr><th>Use</th><th>Outcome</th><th>Specification</th><th>Term</th><th>Coefficient</th><th>SE</th><th>N</th><th>States</th></tr></thead>
<tbody>
{_lag_table(focus, None, None)}
{_lag_table(others, None, None)}
</tbody>
</table>
</div>
<p class="fine">State and year fixed effects. Standard errors are clustered by state. A lag term is use that many years before the outcome. The distributed specification enters lags 0, 2, 4, 6, and 8 together. Cumulative terms are percentage-point-years. Legalization terms are years since the statute. The full grid is <a href="nsduh-vote-ecological/results/lag_specs.csv">lag_specs.csv</a>.</p>
"""


def _party_label(code: str) -> str:
    return {
        "D": "Democratic",
        "R": "Republican",
        "initiative": "Citizen initiative",
        "mixed": "Bipartisan",
        "agency": "Agency",
        "unrecorded": "Not in the source",
    }.get(code, code)


def law_section(acts: list[dict]) -> str:
    body = []
    for act in acts:
        when = act["date"] if act["precision"] == "day" else act["date"][:4]
        direction = "Tighter access" if act["direction"] == "tighten" else "Easier access"
        sponsor = act["sponsors"] or "—"
        signer = act["signer"] or "—"
        if act["signer_party"] in ("D", "R"):
            signer = f"{signer} ({act['signer_party']})"
        vote = act["vote"] or "—"
        committee = act["committee"]
        passed = act["passage"]
        if passed == "citizen initiative" and committee:
            passed = f"Citizen initiative. {committee}"
        elif passed == "citizen initiative":
            passed = "Citizen initiative"
        body.append(
            "<tr>"
            f'<td data-sort="{_esc(act["date"])}">{_esc(when)}</td>'
            f"<td>{_esc(act['jurisdiction'])}</td>"
            f"<td>{_esc(act['substance'])}</td>"
            f'<td data-sort="{_esc(act["direction"])}">{direction}</td>'
            f"<td>{_esc(passed)}</td>"
            f"<td>{_esc(act['bill'])}</td>"
            f"<td>{_esc(sponsor)}</td>"
            f"<td>{_esc(_party_label(act['sponsor_party']))}</td>"
            f"<td>{_esc(signer)}</td>"
            f"<td>{_esc(vote)}</td>"
            "</tr>"
        )
    n_tight = sum(1 for a in acts if a["direction"] == "tighten")
    n_init = sum(1 for a in acts if a["passage"] == "citizen initiative")
    script = """
<script>
(function(){
  var table = document.getElementById('law-table');
  if (!table) return;
  var headers = table.querySelectorAll('th');
  headers.forEach(function(th, i){
    th.addEventListener('click', function(){
      var tbody = table.tBodies[0];
      var rows = Array.prototype.slice.call(tbody.rows);
      var dir = th.getAttribute('data-dir') === 'asc' ? 'desc' : 'asc';
      headers.forEach(function(h){ h.removeAttribute('data-dir'); });
      th.setAttribute('data-dir', dir);
      rows.sort(function(a, b){
        var x = (a.cells[i].getAttribute('data-sort') || a.cells[i].textContent).toLowerCase();
        var y = (b.cells[i].getAttribute('data-sort') || b.cells[i].textContent).toLowerCase();
        if (x < y) return dir === 'asc' ? -1 : 1;
        if (x > y) return dir === 'asc' ? 1 : -1;
        return 0;
      });
      rows.forEach(function(r){ tbody.appendChild(r); });
    });
  });
})();
</script>
"""
    return f"""
<h2 id="laws">Laws on the timeline</h2>
<p>The markers are {len(acts)} acts. {n_init} are citizen initiatives. {n_tight} tightened access: the January 4, 2018 Sessions memorandum, and Oregon HB 4002, signed April 1, 2024. Filled circles made the substance easier to obtain or less criminal. Open squares tightened access. Color is the sponsor’s party. Initiatives have no sponsoring party.</p>
<p>Click a column heading to sort the table.</p>
<div class="table-scroll">
<table class="cmp" id="law-table">
<thead><tr><th>Date</th><th>Jurisdiction</th><th>Substance</th><th>Direction</th><th>How it passed</th><th>Bill</th><th>Sponsor</th><th>Sponsor party</th><th>Signed by</th><th>Vote</th></tr></thead>
<tbody>
{''.join(body)}
</tbody>
</table>
</div>
<p class="fine">State medical and adult-use rows are the comprehensive programs in NCSL, State Medical Cannabis Laws, updated September 2, 2026. A year with no day is the NCSL year, placed at mid-year on the chart. Sponsor, party, and the roll call are filled when Congress.gov, the House Clerk, the Senate, a legislature journal, Ballotpedia, or the enrolled act records them. A cell that says “Not in the source” is a blank in that record. Citizen initiatives are labeled with the vote and the sponsoring committee when Ballotpedia records them. Territories on the NCSL table are not in this file. CSV: <a href="nsduh-vote-ecological/data/legislative_acts.csv">legislative_acts.csv</a>.</p>
{script}
"""


def section_html(frames: dict | None = None) -> str:
    frames = frames or load_frames()
    panel, fits = state_changes(frames)
    fit_of = {(f["use"], f["outcome"]): f for f in fits}
    mj_n = fit_of[("mj", "naep_math8")]
    mj_v = fit_of[("mj", "vote")]
    alc_n = fit_of[("alc", "naep_math8")]
    alc_v = fit_of[("alc", "vote")]
    # Latest pre-break and post-break national marijuana, for the lead sentence.
    nat = frames["nsduh"]
    mj = nat[(nat["geo"] == "US") & (nat["outcome"] == "MRJMON")].sort_values("year")
    pre = mj[mj["year"] <= 2019].iloc[-1]
    post = mj[mj["year"] >= 2021].iloc[-1]
    acts = load_acts()
    return f"""
<h2 id="over-time">Use, scores, and the vote over time</h2>
<p>National past-month marijuana, ages 12 or older, is <strong>{pre['pct']:.1f}%</strong> in the {pre['pyearnm']} pool and <strong>{post['pct']:.1f}%</strong> in the {post['pyearnm']} pool. The gold band is the 2020–2021 web-mode break. Lines stop at that band. From 2009–2010 to 2018–2019, one point of additional past-month marijuana use lines up with <strong>{_num(mj_n['coef'], sign=True)}</strong> points of grade-8 mathematics (SE {_num(mj_n['se'])}) and <strong>{_num(mj_v['coef'], sign=True)}</strong> points of Democratic two-party share (SE {_num(mj_v['se'])}).</p>
<p>Alcohol’s first difference over the same window is <strong>{_num(alc_n['coef'], sign=True)}</strong> NAEP grade-8 mathematics points per point of past-month use (SE {_num(alc_n['se'])}) and <strong>{_num(alc_v['coef'], sign=True)}</strong> points of Democratic share (SE {_num(alc_v['se'])}). Grade-4 mathematics is <strong>{_num(fit_of[('alc', 'naep_math4')]['coef'], sign=True)}</strong> per point of past-month alcohol (SE {_num(fit_of[('alc', 'naep_math4')]['se'])}) and <strong>{_num(fit_of[('mrjyr', 'naep_math4')]['coef'], sign=True)}</strong> per point of past-year marijuana (SE {_num(fit_of[('mrjyr', 'naep_math4')]['se'])}).</p>
{use_charts(frames['nsduh'], frames['legal'], acts)}
<p class="fine cap">Measured. SAMHSA small-area estimates, ages 12 or older. The point is the later year of a two-year pool. Binge alcohol, illicit drugs other than marijuana, and pain-reliever misuse change code in 2015 and are drawn as separate segments. The 2010–2011 point is the updated estimate. The markers along the top are laws. Filled circles eased access. Open squares tightened it. Color is the sponsor’s party, stone is a citizen initiative, and brown is a legislature whose sponsor is not in the source.</p>
{cognition_chart(frames['naep'], acts)}
<p class="fine cap">NAEP composite means, all students, national public schools, NCES Data Service, retrieved 2026-10-11. Mathematics grade 4 is brown. Mathematics grade 8 is orange. Reading grade 4 is blue. Reading grade 8 is purple. The gold band is the 2020–2021 web-mode break on the calendar, the same band as the use charts.</p>
<div class="stats one" id="icar-stat">
<div class="stat lead"><span class="k">ICAR35, Table 1</span><span class="v">−0.023</span><span class="s">SD per year, ages 18 to 60, 2006–2018, adjusted for education and gender. 95% interval −0.035 to −0.011.</span></div>
</div>
<p class="fine">Dworak, Revelle, and Condon, Intelligence, 2023, <a href="https://doi.org/10.1016/j.intell.2023.101734">10.1016/j.intell.2023.101734</a>. Table 1 publishes that slope. Figure 1 draws yearly means by education level and does not print them as numbers. The supplementary tables are slopes and sample counts. The OSF node <a href="https://osf.io/kmgx8">osf.io/kmgx8</a> is the preregistration. Those means stay off the NAEP chart.</p>
{vote_chart(frames['vote'], acts)}
<p class="fine cap">Democratic votes divided by Democratic plus Republican votes, summed across the 50 states and the District of Columbia. Elections 2004 through 2024. The vertical axis runs from 0 to 100. The same law markers sit on this chart.</p>
{law_section(acts)}
<h2>Fifty states, first difference</h2>
<p>Each point is a state or the District of Columbia. The change in use is the 2018–2019 small-area estimate minus the 2009–2010 estimate, in percentage points, ages 12 or older. The NAEP change is the 2019 state mean minus the 2009 state mean. The vote change is the 2020 Democratic two-party share minus the 2008 share, in percentage points. The line is weighted least squares. Weights are the average of 2008 and 2020 two-party votes. Standard errors are HC1. With two periods, this first difference is the state fixed-effects estimator.</p>
{change_panel(panel, fits)}
<p class="axis-name"><span>Y · Change in the score or in Democratic share</span><span>X · Change in the use rate, percentage points</span></p>
<p class="fine cap">The 2009–2010 and 2018–2019 pools both sit before the 2021 web-mode break. Binge alcohol, methamphetamine, pain-reliever misuse, and illicit drugs other than marijuana are not the same series across the 2015 questionnaire redesign, so they stay on the timeline and out of this difference.</p>
<div class="table-scroll">
<table class="cmp">
<thead><tr><th>Use</th><th>Change in</th><th>Per point of use</th><th>SE</th><th>N</th></tr></thead>
<tbody>
{coef_table(fits)}
</tbody>
</table>
</div>
<p class="fine">Percentage points of the outcome per percentage point of use. NAEP rows are score points. The vote row is points of Democratic two-party share. Window for use: 2009–2010 to 2018–2019. NAEP: 2009 to 2019. Vote: 2008 to 2020.</p>
{lag_section(frames)}
"""


def main() -> None:
    RESULTS.mkdir(parents=True, exist_ok=True)
    if SAS_OLD.exists() and SAS_NEW.exists():
        extract_nsduh()
    if NAEP_DIR.exists() and any(NAEP_DIR.glob("*.json")):
        extract_naep()
    if PRES_SRC.exists():
        extract_president()
    extract_legal()
    frames = load_frames()
    _panel, fits = state_changes(frames)
    mj = next(f for f in fits if f["use"] == "mj" and f["outcome"] == "naep_math8")
    mv = next(f for f in fits if f["use"] == "mj" and f["outcome"] == "vote")
    print("marijuana NAEP g8", round(mj["coef"], 3), "se", round(mj["se"], 3), "n", mj["n"])
    print("marijuana vote", round(mv["coef"], 3), "se", round(mv["se"], 3), "n", mv["n"])
    print("wrote", DATA, RESULTS)


if __name__ == "__main__":
    main()
