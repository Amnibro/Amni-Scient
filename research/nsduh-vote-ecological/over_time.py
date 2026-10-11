#!/usr/bin/env python3
"""National and state series: NSDUH use, NAEP scores, presidential vote.

State NSDUH figures are SAMHSA small-area estimates, two-year pools.
The national line is the National row in the same files, ages 12 or older.
NAEP figures are NCES composite means for all students, public schools at
the state level and national public for the U.S. line. Presidential
two-party share is Democratic votes divided by Democratic plus Republican
votes. The cognitive national line is the published ICAR35 slope from
Dworak, Revelle, and Condon (2023), not a digitized yearly series.
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
    ("math", 4, "Mathematics, grade 4", "#C89B4E"),
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


def _frame(w, h, x0, x1, y0, y1, xticks, yticks, y_right=None):
    left, right, top, bottom = 46, 46 if y_right else 16, 16, 28
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


def use_charts(nsduh: pd.DataFrame, legal: pd.DataFrame) -> str:
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
    for title, keys, y0, y1, yticks, marks in blocks:
        parts, X, Y, left, top, ph, w, right = _frame(860, 300, 1999, 2025, y0, y1, (2002, 2008, 2014, 2020, 2024), yticks)
        if marks:
            for year, g in legal.groupby("year"):
                parts.append(
                    f'<line x1="{X(year):.1f}" y1="{top + ph - 8}" x2="{X(year):.1f}" y2="{top + ph}" stroke="#8A6318" stroke-width="2"/>'
                )
        for key in keys:
            lab, col, codes, dash = by_key[key]
            for seg in _segments(nat[nat["outcome"].isin(codes)], codes):
                _polyline(parts, X, Y, [(a, b) for a, b, _p in seg], col, dash=dash)
        parts.append("</svg>")
        legend = "".join(
            f'<span><i style="background:{by_key[k][1]}"></i>{_esc(by_key[k][0])}</span>' for k in keys
        )
        cards.append(
            f'<p class="slope-k">{_esc(title)}</p><div class="legend">{legend}</div>'
            f'<div class="chart-card">{"".join(parts)}</div>'
            f'<p class="axis-name"><span>Y · Percent, ages 12+</span><span>X · Later year of the two-year pool</span></p>'
        )
    return "\n".join(cards)


def cognition_chart(naep: pd.DataFrame) -> str:
    nat = naep[naep["geo"] == "NP"]
    y0, y1 = 205, 295
    # Dworak axis, SD from the 2006 anchor. Right side.
    parts, X, Y, left, top, ph, w, right = _frame(
        860, 300, 1996, 2025, y0, y1, (1998, 2004, 2010, 2016, 2022), (210, 230, 250, 270, 290), y_right=(-0.30, 0.05, (0, -0.1, -0.2, -0.3))
    )
    lo, hi = -0.30, 0.05

    def Yd(v):
        return top + (hi - float(v)) / (hi - lo) * ph

    for subj, grade, lab, col in NAEP_SUBJECTS:
        pts = nat[(nat["subject"] == subj) & (nat["grade"] == grade)].sort_values("year")
        _polyline(parts, X, Y, list(zip(pts["year"].astype(int), pts["score"])), col)
    years = np.arange(2006, 2019)
    band = []
    for y in years:
        band.append(f"{X(y):.1f},{Yd(-0.011 * (y - 2006)):.1f}")
    for y in years[::-1]:
        band.append(f"{X(y):.1f},{Yd(-0.035 * (y - 2006)):.1f}")
    parts.append(f'<polygon points="{" ".join(band)}" fill="#C89B4E" fill-opacity="0.35"/>')
    _polyline(parts, X, lambda v: Yd(v), [(int(y), -0.023 * (y - 2006)) for y in years], "#8A6318")
    parts.append("</svg>")
    legend = "".join(
        f'<span><i style="background:{col}"></i>{_esc(lab)}</span>' for _s, _g, lab, col in NAEP_SUBJECTS
    )
    legend += '<span><i style="background:#8A6318"></i>ICAR35 slope, −0.023 SD/year</span>'
    return (
        f'<p class="slope-k">NAEP national public, and the published ICAR35 slope</p>'
        f'<div class="legend">{legend}</div><div class="chart-card">{"".join(parts)}</div>'
        f'<p class="axis-name"><span>Left · NAEP composite, national public</span>'
        f'<span>Right · ICAR35, SD from 2006</span></p>'
    )


def vote_chart(vote: pd.DataFrame) -> str:
    nat_rows = []
    for year, g in vote.groupby("year"):
        dem = g["dem"].sum()
        rep = g["rep"].sum()
        nat_rows.append((int(year), 100 * dem / (dem + rep)))
    parts, X, Y, *_rest = _frame(860, 280, 2002, 2026, 0, 100, (2004, 2008, 2012, 2016, 2020, 2024), (0, 25, 50, 75, 100))
    _polyline(parts, X, Y, nat_rows, "#8A6318")
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
    legal_line = "; ".join(
        f"{int(year)} {' '.join(g['geo'].tolist())}" for year, g in frames["legal"].groupby("year")
    )
    return f"""
<h2 id="over-time">Use, scores, and the vote over time</h2>
<p>National past-month marijuana, ages 12 or older, is <strong>{pre['pct']:.1f}%</strong> in the {pre['pyearnm']} pool and <strong>{post['pct']:.1f}%</strong> in the {post['pyearnm']} pool. The gold band is the 2020–2021 web-mode break. Lines stop at that band. From 2009–2010 to 2018–2019, one point of additional past-month marijuana use lines up with <strong>{_num(mj_n['coef'], sign=True)}</strong> points of grade-8 mathematics (SE {_num(mj_n['se'])}) and <strong>{_num(mj_v['coef'], sign=True)}</strong> points of Democratic two-party share (SE {_num(mj_v['se'])}).</p>
<p>Alcohol’s first difference over the same window is <strong>{_num(alc_n['coef'], sign=True)}</strong> NAEP grade-8 mathematics points per point of past-month use (SE {_num(alc_n['se'])}) and <strong>{_num(alc_v['coef'], sign=True)}</strong> points of Democratic share (SE {_num(alc_v['se'])}). Grade-4 mathematics is <strong>{_num(fit_of[('alc', 'naep_math4')]['coef'], sign=True)}</strong> per point of past-month alcohol (SE {_num(fit_of[('alc', 'naep_math4')]['se'])}) and <strong>{_num(fit_of[('mrjyr', 'naep_math4')]['coef'], sign=True)}</strong> per point of past-year marijuana (SE {_num(fit_of[('mrjyr', 'naep_math4')]['se'])}).</p>
{use_charts(frames['nsduh'], frames['legal'])}
<p class="fine cap">Measured. SAMHSA small-area estimates, ages 12 or older. The point is the later year of a two-year pool. Binge alcohol, illicit drugs other than marijuana, and pain-reliever misuse change code in 2015 and are drawn as separate segments. The 2010–2011 point is the updated estimate. Gold ticks are years when a state legalized adult-use cannabis: { _esc(legal_line) }.</p>
{cognition_chart(frames['naep'])}
<p class="fine cap">NAEP composite means, all students, national public schools, NCES Data Service, retrieved 2026-10-11. The gold line is the Table 1 mean slope for the ICAR35 composite, ages 18 to 60, adjusted for education and gender: −0.023 SD per year from 2006 to 2018, 95% interval −0.035 to −0.011. The band is that interval on the slope. The line is the published slope, anchored at zero in 2006. Dworak, Revelle, and Condon, Intelligence, 2023, 10.1016/j.intell.2023.101734.</p>
{vote_chart(frames['vote'])}
<p class="fine cap">Democratic votes divided by Democratic plus Republican votes, summed across the 50 states and the District of Columbia. Elections 2004 through 2024. The vertical axis runs from 0 to 100.</p>
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
