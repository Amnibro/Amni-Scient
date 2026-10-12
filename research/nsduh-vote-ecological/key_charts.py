from __future__ import annotations
import csv
import math
import re
from collections import defaultdict
from pathlib import Path
HERE = Path(__file__).resolve().parent
DATA, RESULTS = HERE / "data", HERE / "results"
NAEP = [("math", 8, "Math, grade 8", "#EA580C"), ("reading", 8, "Reading, grade 8", "#7C3AED"), ("math", 4, "Math, grade 4", "#8A6318"), ("reading", 4, "Reading, grade 4", "#2563EB")]
LEGAL_C, OTHER_C, DEM_C, REP_C, VOTER_C, NOREC_C, NOSIG_C = "#16A34A", "#78716C", "#2563EB", "#DC2626", "#A8A29E", "#C89B4E", "#7C3AED"
FONT = "font-family:var(--font-sans,Archivo,sans-serif)"
def _rows(name, base=DATA):
    return list(csv.DictReader((base / name).open()))
def _e(s):
    return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
def _s(v, d=1):
    return ("+" if v > 0 else "−" if v < 0 else "") + f"{abs(v):.{d}f}"
def _t(x, y, s, cls="lab", anchor="start", style=""):
    return f'<text x="{x:.1f}" y="{y:.1f}" text-anchor="{anchor}" class="{cls}"{f" style={chr(34)}{style}{chr(34)}" if style else ""}>{s}</text>'
def _scale(a0, a1, b0, b1):
    return lambda v: b0 + (float(v) - a0) / (a1 - a0) * (b1 - b0)
def legal_years():
    return {r["geo"]: int(r["year"]) for r in _rows("cannabis_adult_use.csv")}
def naep_series():
    out = defaultdict(dict)
    [out[(r["subject"], int(r["grade"]), r["geo"])].__setitem__(int(r["year"]), float(r["score"])) for r in _rows("naep_scores.csv")]
    return out
def naep_change_chart():
    s, w, h, L, R, T, B = naep_series(), 860, 380, 46, 132, 34, 30
    X, Y = _scale(2002.5, 2025, L, w - R), _scale(3, -14, T, h - B)
    p = [f'<svg viewBox="0 0 {w} {h}" role="img" class="chart" aria-label="NAEP national public scores, change from 2013">', f'<rect x="{X(2012.5):.1f}" y="{T}" width="{X(2025) - X(2012.5):.1f}" height="{h - B - T}" fill="{LEGAL_C}" fill-opacity="0.07"/>', _t(X(2012.5) + 6, T + 13, "ADULT-USE ERA · 2 STATES IN 2012, 24 + DC BY 2024", "marklab", style=f"fill:{LEGAL_C}")]
    for v in (2, 0, -4, -8, -12):
        p += [f'<line x1="{L}" y1="{Y(v):.1f}" x2="{w - R}" y2="{Y(v):.1f}" class="{"axis" if v == 0 else "grid"}"{chr(32) + "stroke-width=" + chr(34) + "1.4" + chr(34) if v == 0 else ""}/>', _t(L - 6, Y(v) + 3, _s(v, 0) if v else "0", "tick", "end")]
    p += [_t(X(y), h - 9, y, "tick", "middle") for y in (2003, 2007, 2011, 2015, 2019, 2024)]
    ends = []
    for subj, g, lab, col in NAEP:
        ser = s[(subj, g, "NP")]
        pts = [(y, ser[y] - ser[2013]) for y in sorted(ser) if y >= 2003]
        p.append(f'<polyline points="{" ".join(f"{X(y):.1f},{Y(v):.1f}" for y, v in pts)}" fill="none" stroke="{col}" stroke-width="{3 if g == 8 and subj == "math" else 2.2}" stroke-linejoin="round"/>')
        p += [f'<circle cx="{X(y):.1f}" cy="{Y(v):.1f}" r="{3 if y in (2013, 2024) else 2.2}" fill="{col}"/>' for y, v in pts]
        ends.append([Y(pts[-1][1]), lab, col, pts[-1][1]])
    ends.sort()
    for i in range(1, len(ends)):
        ends[i][0] = max(ends[i][0], ends[i - 1][0] + 15)
    p += [_t(X(2024) + 9, yy + 4, f"{_e(lab)} {_s(v)}", style=f"fill:{col};font-weight:700;font-size:12px") for yy, lab, col, v in ends]
    p.append(_t(X(2013), Y(0) - 8, "2013 high", "tick", "middle"))
    return "".join(p) + "</svg>"
def state_drop_stats():
    s, legal, out = naep_series(), legal_years(), []
    for subj, g, lab, col in NAEP:
        ch = {geo: v[2024] - v[2013] for (a, b, geo), v in s.items() if a == subj and b == g and geo not in ("NP", "NT") and 2013 in v and 2024 in v}
        lg, ot = [v for k, v in ch.items() if k in legal], [v for k, v in ch.items() if k not in legal]
        m = lambda a: sum(a) / len(a)
        var = lambda a: sum((x - m(a)) ** 2 for x in a) / (len(a) - 1)
        out.append(dict(subj=subj, grade=g, label=lab, color=col, legal=lg, other=ot, n=len(ch), down=sum(v < 0 for v in ch.values()), ml=m(lg), mo=m(ot), diff=m(lg) - m(ot), se=math.sqrt(var(lg) / len(lg) + var(ot) / len(ot))))
    return out
def state_drop_chart(stats):
    w, rh, L, R, T = 860, 25, 170, 120, 26
    h = T + len(stats) * (2 * rh + 16) + 26
    X = _scale(-22, 12, L, w - R)
    p = [f'<svg viewBox="0 0 {w} {h}" role="img" class="chart" aria-label="Change in NAEP scores 2013 to 2024 by state">']
    for v in (-20, -15, -10, -5, 0, 5, 10):
        p += [f'<line x1="{X(v):.1f}" y1="{T - 6}" x2="{X(v):.1f}" y2="{h - 24}" class="{"axis" if v == 0 else "grid"}"/>', _t(X(v), h - 8, _s(v, 0), "tick", "middle")]
    p += [_t(X(-22), T - 12, "FELL", "marklab"), _t(X(12), T - 12, "ROSE", "marklab", "end")]
    y = T
    for st in stats:
        p.append(_t(8, y + rh + 4, _e(st["label"]), style="font-weight:750;font-size:12.5px"))
        p.append(_t(8, y + rh + 19, f'{st["down"]} of {st["n"]} fell', "tick"))
        for key, mk, col, name in (("legal", "ml", LEGAL_C, "Adult use legal"), ("other", "mo", OTHER_C, "Not legal")):
            cy = y + rh / 2
            p.append(f'<rect x="{L}" y="{y + 2}" width="{w - R - L}" height="{rh - 4}" fill="{col}" fill-opacity="0.05"/>')
            p += [f'<circle cx="{X(v):.1f}" cy="{cy + (i % 3 - 1) * 3.5:.1f}" r="4" fill="{col}" fill-opacity="0.5"/>' for i, v in enumerate(sorted(st[key]))]
            p.append(f'<line x1="{X(st[mk]):.1f}" y1="{y + 1}" x2="{X(st[mk]):.1f}" y2="{y + rh - 1}" stroke="{col}" stroke-width="4"/>')
            p.append(_t(w - R + 8, cy + 4, f"{name} {_s(st[mk])}", style=f"fill:{col};font-weight:700;font-size:11.5px"))
            y += rh
        y += 16
    return "".join(p) + "</svg>"
IQ_ROWS = [("Dunedin, adolescent-onset persistent users, age 38", "Meier et al. 2012 · IQ vs. age 13", 8.0, None, "measured"), ("Dunedin, long-term users, age 45", "Meier et al. 2022 · IQ vs. childhood", 5.5, None, "measured"), ("2012 loss scaled to 2022 flower, 16.1% THC", "This page · potency model", 18.0, (3.0, 33.0), "predicted"), ("All U.S. adults, 2006–2018, any cause", "Dworak et al. 2023 · ICAR35 slope × 12 yrs", 0.023 * 12 * 15, (0.011 * 12 * 15, 0.035 * 12 * 15), "trend")]
def iq_chart():
    w, rh, L, R, T = 860, 52, 330, 60, 22
    h = T + len(IQ_ROWS) * rh + 30
    X = _scale(0, 35, L, w - R)
    p = [f'<svg viewBox="0 0 {w} {h}" role="img" class="chart" aria-label="IQ points lower, published and predicted">']
    for v in (0, 5, 10, 15, 20, 25, 30, 35):
        p += [f'<line x1="{X(v):.1f}" y1="{T - 6}" x2="{X(v):.1f}" y2="{h - 26}" class="{"axis" if v == 0 else "grid"}"/>', _t(X(v), h - 9, f"−{v}" if v else "0", "tick", "middle")]
    for i, (lab, src, v, ci, kind) in enumerate(IQ_ROWS):
        y = T + i * rh
        col = {"measured": "#DC2626", "predicted": "#DC2626", "trend": OTHER_C}[kind]
        p += [_t(8, y + 17, _e(lab), style="font-weight:700;font-size:12px"), _t(8, y + 33, f"{_e(src)} · {kind}", "tick")]
        p.append(f'<rect x="{X(0):.1f}" y="{y + 6}" width="{X(v) - X(0):.1f}" height="26" fill="{col}" fill-opacity="{0.85 if kind == "measured" else 0.28}" stroke="{col}" stroke-width="1.4"{" stroke-dasharray=" + chr(34) + "5 3" + chr(34) if kind == "predicted" else ""}/>')
        p += [f'<line x1="{X(ci[0]):.1f}" y1="{y + 19}" x2="{X(ci[1]):.1f}" y2="{y + 19}" class="whisk"/><line x1="{X(ci[0]):.1f}" y1="{y + 13}" x2="{X(ci[0]):.1f}" y2="{y + 25}" class="whisk"/><line x1="{X(ci[1]):.1f}" y1="{y + 13}" x2="{X(ci[1]):.1f}" y2="{y + 25}" class="whisk"/>'] if ci else []
        p.append(_t(max(X(v), X(ci[1]) if ci else 0) + 8, y + 24, f"−{v:.1f}" if v % 1 else f"−{v:.0f}", style="font-weight:800;font-size:14px"))
    return "".join(p) + "</svg>"
def quintile_chart():
    q = [r for r in _rows("quintiles.csv", RESULTS) if r["measure"] == "mj"]
    w, h, L, R, T, B = 860, 330, 46, 16, 20, 58
    bw = (w - L - R) / len(q)
    Y = _scale(0, 70, h - B, T)
    p = [f'<svg viewBox="0 0 {w} {h}" role="img" class="chart" aria-label="Democratic share by marijuana-use quintile">']
    for v in (0, 10, 20, 30, 40, 50, 60, 70):
        p += [f'<line x1="{L}" y1="{Y(v):.1f}" x2="{w - R}" y2="{Y(v):.1f}" class="{"axis" if v in (0, 50) else "grid"}"/>', _t(L - 6, Y(v) + 3, v, "tick", "end")]
    for i, r in enumerate(q):
        x, d = L + i * bw + bw * 0.18, 100 * float(r["dem2"])
        col = DEM_C if d > 50 else "#93A3BE"
        p += [f'<rect x="{x:.1f}" y="{Y(d):.1f}" width="{bw * 0.64:.1f}" height="{Y(0) - Y(d):.1f}" fill="{col}" rx="2"/>', _t(x + bw * 0.32, Y(d) - 8, f"{d:.1f}%", style="font-weight:800;font-size:15px", anchor="middle"), _t(x + bw * 0.32, h - B + 18, f'{float(r["use_min"]):.1f}–{float(r["use_max"]):.1f}%', "lab", "middle"), _t(x + bw * 0.32, h - B + 34, f'{r["n_regions"]} regions', "tick", "middle")]
    p.append(_t(L + 6, Y(50) - 6, "50% · majority", "tick"))
    return "".join(p) + "</svg>", q
def event_study():
    p, legal = _rows("president_twoparty.csv"), legal_years()
    yrs = sorted({int(r["year"]) for r in p})
    tot = defaultdict(lambda: [0.0, 0.0])
    for r in p:
        tot[int(r["year"])][0] += float(r["dem"])
        tot[int(r["year"])][1] += float(r["two_party"])
    rel = {(r["geo"], int(r["year"])): 100 * (float(r["dem2"]) - tot[int(r["year"])][0] / tot[int(r["year"])][1]) for r in p}
    ev = defaultdict(list)
    for g, ly in legal.items():
        base = max(y for y in yrs if y <= ly)
        [ev[4 * (yrs.index(y) - yrs.index(base))].append(rel[(g, y)] - rel[(g, base)]) for y in yrs]
    out = []
    for k in sorted(ev):
        a = ev[k]
        m = sum(a) / len(a)
        se = math.sqrt(sum((x - m) ** 2 for x in a) / (len(a) - 1) / len(a)) if len(a) > 1 else 0
        out.append((k, m, se, len(a)))
    return out
def event_chart(ev):
    w, h, L, R, T, B = 860, 340, 46, 16, 22, 50
    X, Y = _scale(-17.5, 13.5, L, w - R), _scale(8, -3, T, h - B)
    p = [f'<svg viewBox="0 0 {w} {h}" role="img" class="chart" aria-label="Democratic share relative to the nation, before and after legalization">', f'<rect x="{X(0):.1f}" y="{T}" width="{X(13.5) - X(0):.1f}" height="{h - B - T}" fill="{DEM_C}" fill-opacity="0.06"/>']
    for v in (-2, 0, 2, 4, 6, 8):
        p += [f'<line x1="{L}" y1="{Y(v):.1f}" x2="{w - R}" y2="{Y(v):.1f}" class="{"axis" if v == 0 else "grid"}"/>', _t(L - 6, Y(v) + 3, _s(v, 0), "tick", "end")]
    p += [f'<line x1="{X(0):.1f}" y1="{T}" x2="{X(0):.1f}" y2="{h - B}" class="mark"/>', _t(X(0) + 6, T + 13, "ELECTION IN OR BEFORE THE LEGALIZATION YEAR", "marklab"), _t(X(-17), T + 13, "BEFORE", "marklab"), _t(X(13), T + 13, "AFTER", "marklab", "end")]
    pts = [(X(k), Y(m)) for k, m, _se, _n in ev]
    p.append(f'<polyline points="{" ".join(f"{a:.1f},{b:.1f}" for a, b in pts)}" fill="none" stroke="{DEM_C}" stroke-width="2.6"/>')
    for k, m, se, n in ev:
        p += [f'<line x1="{X(k):.1f}" y1="{Y(m - 1.96 * se):.1f}" x2="{X(k):.1f}" y2="{Y(m + 1.96 * se):.1f}" stroke="{DEM_C}" stroke-opacity="0.45" stroke-width="2"/>', f'<circle cx="{X(k):.1f}" cy="{Y(m):.1f}" r="5" fill="{DEM_C if k > 0 else "var(--panel)"}" stroke="{DEM_C}" stroke-width="2"/>', _t(X(k) + (10 if k else 0), Y(m) - (14 if k > 0 else 10), _s(m), style=f"fill:{DEM_C};font-weight:800;font-size:12.5px", anchor="start" if k else "middle"), _t(X(k), h - B + 18, f"{_s(k, 0) if k else 0} yrs", "tick", "middle"), _t(X(k), h - B + 33, f"{n} states", "tick", "middle")]
    return "".join(p) + "</svg>"
VOTE_RE = re.compile(r"House[a-z ]*?(\d+)–(\d+) \(D (\d+) yea, (\d+) nay; R (\d+) yea, (\d+) nay")
SHORT = {"H.R. 2": "Farm Bill, hemp", "H.R. 1595": "SAFE Banking Act", "H.R. 3884": "MORE Act, legalize", "H.R. 1996": "SAFE Banking Act", "H.R. 3617": "MORE Act, legalize"}
def acts():
    return sorted(_rows("legislative_acts.csv"), key=lambda r: r["date"])
def house_votes():
    return [(a, *map(int, m.groups())) for a in acts() if a["jurisdiction"] == "United States" and (m := VOTE_RE.search(a["vote"]))]
def house_rows(hv):
    return [(f'{a["date"][:4]} · {SHORT.get(a["bill"], a["bill"])}', f'{a["bill"]} · sponsor {a["sponsors"]} ({a["sponsor_party"]})', dy, dn, ry, rn) for a, _y, _n, dy, dn, ry, rn in hv]
def pair_chart(rows, aria):
    w, rh, L, R, T = 860, 58, 230, 140, 18
    h = T + len(rows) * rh + 28
    X = _scale(0, 100, L, w - R)
    p = [f'<svg viewBox="0 0 {w} {h}" role="img" class="chart" aria-label="{_e(aria)}">']
    for v in (0, 25, 50, 75, 100):
        p += [f'<line x1="{X(v):.1f}" y1="{T - 4}" x2="{X(v):.1f}" y2="{h - 24}" class="{"axis" if v in (0, 50) else "grid"}"/>', _t(X(v), h - 8, f"{v}%", "tick", "middle")]
    for i, (title, sub, dy, dn, ry, rn) in enumerate(rows):
        y = T + i * rh
        p += [_t(8, y + 18, _e(title), style="font-weight:750;font-size:12.5px"), _t(8, y + 34, _e(sub), "tick")]
        for j, (yes, no, col, tag) in enumerate(((dy, dn, DEM_C, "D"), (ry, rn, REP_C, "R"))):
            pct, by = 100 * yes / (yes + no), y + 6 + j * 22
            p += [f'<rect x="{X(0):.1f}" y="{by}" width="{X(pct) - X(0):.1f}" height="18" fill="{col}" rx="2"/>', _t(X(pct) + 6, by + 13.5, f"{tag} {pct:.0f}% · {yes:,}–{no:,}", style=f"fill:{col};font-weight:750;font-size:12px")]
    return "".join(p) + "</svg>"
ENACT = [("voters", "Voters, ballot initiative", VOTER_C), ("D", "Signed by a Democrat", DEM_C), ("R", "Signed by a Republican", REP_C), ("nosig", "Law without signature or over a veto", NOSIG_C), ("unrec", "Not recorded", NOREC_C)]
PUSH = [("D", "Democratic", DEM_C), ("R", "Republican", REP_C), ("split", "Bipartisan, committee, or split control", "#0D9488"), ("nosig", "Law without signature or over a veto", NOSIG_C), ("unrec", "Not recorded", NOREC_C)]
CHAMBER_RE = re.compile(r"\b(House|Senate|Assembly|Council)\s+(DFL|D|R)\b")
STATE_VOTE_RE = re.compile(r"\b(DFL|D|R)\s+(\d+)\s+yea,\s*(\d+)\s+nay")
def enact_key(a):
    sig = a["signer"].lower()
    return "voters" if a["passage"] == "citizen initiative" else "nosig" if ("without" in sig or "overrid" in sig) else a["signer_party"] if a["signer_party"] in ("D", "R") else "unrec"
def sponsor_key(a):
    return a["sponsor_party"] if a["sponsor_party"] in ("D", "R") else "split" if a["sponsor_party"] in ("mixed", "committee") else "unrec"
def control_key(a):
    c, n = {("D" if p == "DFL" else p) for _ch, p in CHAMBER_RE.findall(a["legislature_control"])}, len(re.findall(r"\b(House|Senate|Assembly|Council)\b", a["legislature_control"]))
    return "unrec" if not c else "split" if len(c) > 1 or len(CHAMBER_RE.findall(a["legislature_control"])) < n else c.pop()
def enact_groups():
    ok = [a for a in acts() if a["direction"] == "loosen" and a["passage"] in ("citizen initiative", "legislature", "agency rule", "executive guidance") and not (a["jurisdiction"] == "United States" and "Did not become law" in a["title"])]
    pick = lambda f: [a for a in ok if f(a)]
    return [("Medical cannabis", pick(lambda a: a["substance"] == "cannabis, medical")), ("Adult-use cannabis", pick(lambda a: a["substance"] == "cannabis, adult use")), ("Every law that eased access", ok)]
def state_leg():
    return [a for a in acts() if a["passage"] == "legislature" and a["direction"] == "loosen" and a["jurisdiction"] != "United States"]
def push_groups(leg):
    return [("Prime sponsor", sponsor_key), ("Signed by", enact_key), ("Legislature majority", control_key)]
def stack_chart(groups, cats, aria):
    w, rh, L, R, T = 860, 46, 190, 16, 8
    h = T + len(groups) * rh + 8
    X = _scale(0, 100, L, w - R)
    p = [f'<svg viewBox="0 0 {w} {h}" role="img" class="chart" aria-label="{_e(aria)}">']
    for i, (lab, rows, keyf) in enumerate(groups):
        y, x0 = T + i * rh, 0.0
        cnt = defaultdict(int)
        for a in rows:
            cnt[keyf(a)] += 1
        p += [_t(8, y + 19, _e(lab), style="font-weight:750;font-size:12.5px"), _t(8, y + 34, f"{len(rows)} laws", "tick")]
        for k, name, col in cats:
            if cnt[k]:
                wd = 100 * cnt[k] / len(rows)
                p.append(f'<rect x="{X(x0):.1f}" y="{y + 6}" width="{X(x0 + wd) - X(x0):.1f}" height="30" fill="{col}" stroke="var(--panel)" stroke-width="1.5"><title>{_e(name)}: {cnt[k]}</title></rect>')
                p += [_t((X(x0) + X(x0 + wd)) / 2, y + 26, cnt[k], anchor="middle", style="fill:#fff;font-weight:800;font-size:12.5px")] if X(x0 + wd) - X(x0) > 18 else []
                x0 += wd
    return "".join(p) + "</svg>"
def state_vote_totals(leg):
    t, n = {"D": [0, 0], "R": [0, 0]}, 0
    for a in leg:
        for pty, y, no in STATE_VOTE_RE.findall(a["vote"]):
            t["D" if pty == "DFL" else pty][0] += int(y)
            t["D" if pty == "DFL" else pty][1] += int(no)
            n += 1
    return t, n
def state_vote_rows(leg):
    out = []
    for lab, f in (("Medical cannabis laws", lambda a: a["substance"] == "cannabis, medical"), ("Adult-use cannabis laws", lambda a: a["substance"] == "cannabis, adult use"), ("Every state law in the table", lambda a: True)):
        sub = [a for a in leg if f(a)]
        t, n = state_vote_totals(sub)
        out.append((lab, f"{sum(bool(STATE_VOTE_RE.search(a['vote'])) for a in sub)} laws, every recorded party split", t["D"][0], t["D"][1], t["R"][0], t["R"][1]))
    return out
def _legend(items):
    return '<div class="legend">' + "".join(f'<span><i style="background:{c}"></i>{_e(n)}</span>' for n, c in items) + "</div>"
def _block(n, kicker, title, svg, axis, cap, legend=""):
    return f'<div class="kf" id="kf-{n}"><p class="kf-k">{n} · {kicker}</p><h3 class="kf-h">{title}</h3>{legend}<div class="chart-card">{svg}</div>{axis}<p class="fine cap">{cap}</p></div>'
def section_html():
    st, (qsvg, q), ev, hv, eg = state_drop_stats(), quintile_chart(), event_study(), house_votes(), enact_groups()
    m8 = next(s for s in st if s["subj"] == "math" and s["grade"] == 8)
    ser = naep_series()
    d = {(a, g): ser[(a, g, "NP")][2024] - ser[(a, g, "NP")][2013] for a, g, *_ in NAEP}
    after = [e for e in ev if e[0] > 0]
    pre = [e for e in ev if e[0] < 0]
    mr = [r for r in hv if r[0]["bill"] in ("H.R. 3884", "H.R. 3617")]
    dp, rp = [100 * r[3] / (r[3] + r[4]) for r in mr], [100 * r[5] / (r[5] + r[6]) for r in mr]
    more = (min(dp), max(dp), min(rp), max(rp))
    allg = eg[-1][1]
    ck = defaultdict(int)
    for a in allg:
        ck[enact_key(a)] += 1
    leg = state_leg()
    pk = {name: defaultdict(int) for name, _f in push_groups(leg)}
    for name, f in push_groups(leg):
        for a in leg:
            pk[name][f(a)] += 1
    svr = state_vote_rows(leg)
    dpct, rpct = 100 * svr[-1][2] / (svr[-1][2] + svr[-1][3]), 100 * svr[-1][4] / (svr[-1][4] + svr[-1][5])
    blocks = [
        _block(1, "Test scores", f"Grade 8 math is down {abs(d[('math', 8)]):.1f} points from its 2013 high, and every NAEP series is lower in 2024", naep_change_chart(), '<p class="axis-name"><span>Y · NAEP points vs. the 2013 national score</span><span>X · Test year</span></p>', f"Measured. NAEP national public composite means, NCES. Change from 2013: math 8 {_s(d[('math', 8)])}, reading 8 {_s(d[('reading', 8)])}, reading 4 {_s(d[('reading', 4)])}, math 4 {_s(d[('math', 4)])}. The green band is the period in which states began legalizing adult use. The decline started before the 2020 school closures and deepened after them. <a href=\"#over-time\">Raw scores and the law timeline</a>."),
        _block(2, "Every state", f"Grade 8 math fell in {m8['down']} of {m8['n']} jurisdictions. States with legal adult use fell further on all four tests", state_drop_chart(st), '<p class="axis-name"><span>Y · Test and adult-use status in 2024</span><span>X · NAEP points, 2024 minus 2013</span></p>', "Measured. Each dot is a state or DC; the bar is the unweighted average. Differences, legal minus not legal: " + "; ".join(f"{s['label'].lower()} {_s(s['diff'])} (SE {s['se']:.1f})" for s in st) + ". Legal states also differ in other ways, including how long schools stayed remote in 2020–21, so this is a comparison, not an effect estimate. The within-state first difference is <a href=\"#fd\">further down</a>.", _legend([(f"Adult use legal by 2024 ({len(m8['legal'])})", LEGAL_C), (f"Not legal ({len(m8['other'])})", OTHER_C)])),
        _block(3, "IQ", "Persistent users lost IQ points, and the loss was still there at 38 and at 45", iq_chart(), '<p class="axis-name"><span>Y · Study and population</span><span>X · IQ points lower</span></p>', "The two Dunedin bars are measured in the same people, compared with their own childhood IQ (n = 1,037 cohort; 86 long-term users at 45). Meier 2012: cessation “did not fully restore” functioning among adolescent-onset users. Meier 2022: deficits were absent or smaller among those who quit. The dashed bar is this page’s potency prediction, not a measurement (<a href=\"#iq-model\">model</a>). The grey bar is the published ICAR35 slope for all U.S. adults, any cause, at 15 IQ points per SD. Meier et al., PNAS 2012, <a href=\"https://doi.org/10.1073/pnas.1206820109\">10.1073/pnas.1206820109</a>; Meier et al., Am J Psychiatry 2022, <a href=\"https://doi.org/10.1176/appi.ajp.2021.21060664\">10.1176/appi.ajp.2021.21060664</a>; Dworak et al., Intelligence 2023, <a href=\"https://doi.org/10.1016/j.intell.2023.101734\">10.1016/j.intell.2023.101734</a>.", _legend([("Measured, Dunedin", "#DC2626"), ("Predicted from potency", "rgba(220,38,38,.35)"), ("All U.S. adults, any cause", OTHER_C)])),
        _block(4, "The vote", f"The Democratic share climbs from {100 * float(q[0]['dem2']):.1f}% to {100 * float(q[-1]['dem2']):.1f}% across marijuana-use quintiles", qsvg, '<p class="axis-name"><span>Y · 2024 Democratic two-party share, %</span><span>X · Past-month marijuana use, quintile of 382 regions</span></p>', "Measured. Vote-weighted mean share in each fifth of NSDUH 2021–2023 substate regions, about 30 million two-party votes per bar. Density and education also rise across the quintiles; after density and age the slope is +1.13 points of share per point of use (<a href=\"#rate-of-change\">table</a>). This is an area-level association, not individual voters."),
        _block(5, "Over time", f"After legalization, states shifted toward Democrats: {_s(after[0][1])} points one election later, {_s(after[-1][1])} points {after[-1][0] // 4} elections later", event_chart(ev), '<p class="axis-name"><span>Y · State minus national Democratic share, change in points</span><span>X · Years from the election in or before the legalization year</span></p>', f"Measured. Presidential two-party share 2004–2024 for the {ev[[e[0] for e in ev].index(0)][3]} adult-use jurisdictions, each relative to the national share and to its own value at the election in or before its legalization year. Before legalization the line stays within {max(abs(e[1]) for e in pre):.1f} points of zero. Later points cover fewer states, led by the 2012–2014 legalizers (Colorado, Washington, Alaska, Oregon, DC); whiskers are 95% intervals across states. The shift is consistent with legalization changing who lives and votes there, and also with states that were already trending Democratic choosing to legalize."),
        _block(6, "Who passed it", f"To end federal marijuana prohibition, {more[0]:.0f}–{more[1]:.0f}% of House Democrats voted yes. Republicans: {more[2]:.0f}–{more[3]:.0f}%", pair_chart(house_rows(hv), "Share of each party voting yes on federal marijuana bills"), '<p class="axis-name"><span>Y · House passage vote</span><span>X · Share of the party’s members voting yes</span></p>', f"Measured. House Clerk roll calls; members not voting are left out. The 2018 Farm Bill is the only one of these to become law. Both MORE Act votes would have removed marijuana from the Controlled Substances Act, and drew {mr[0][5]} Republican yes votes in {mr[0][0]['date'][:4]} and {mr[1][5]} in {mr[1][0]['date'][:4]}. <a href=\"#laws\">Every act and its roll call</a>.", _legend([("Democrats", DEM_C), ("Republicans", REP_C)])),
        _block(7, "Who enacted it", f"Voters passed {ck['voters']} of the {len(allg)} laws that eased access. Democratic signers enacted {ck['D']}, Republican signers {ck['R']}", stack_chart([(lab, rows, enact_key) for lab, rows in eg], ENACT, "Who enacted each law"), '<p class="axis-name"><span>Y · Kind of law</span><span>X · Share of laws, count on the bar</span></p>', "Measured. Laws in force that eased access: state medical and adult-use programs, the federal hemp law, and federal executive actions. Signers are governors, the DC mayor, or the administration that issued the action. Bills that never became law are left out. <a href=\"#laws\">The full table</a> lists each signer and vote.", _legend([(n, c) for _k, n, c in ENACT])),
        _block(8, "State legislatures", f"Democratic state legislators voted yes {dpct:.0f}% of the time, Republicans {rpct:.0f}%. On adult use, {100 * svr[1][4] / (svr[1][4] + svr[1][5]):.0f}% of Republican votes were yes", stack_chart([(lab, leg, f) for lab, f in push_groups(leg)], PUSH, "Party of the sponsor, signer, and legislature for state laws") + "</div><div class=\"chart-card\">" + pair_chart(svr, "Share of state legislators voting yes, by party"), '<p class="axis-name"><span>Y · Who and which laws</span><span>X · Share of laws, then share of votes cast yes</span></p>', f"Measured. Of {len(leg)} state laws passed by a legislature that eased access, Democrats were the prime sponsor of {pk['Prime sponsor']['D']} and Republicans of {pk['Prime sponsor']['R']}; Democratic governors signed {pk['Signed by']['D']} and Republican governors {pk['Signed by']['R']}. Sponsor, signer, chamber majorities, and roll calls come from legislature journals and vote records. The vote bars add every party tally printed for a law, so a legislator who voted on passage and again on a conference report counts twice. Democratic legislators cast {svr[-1][2]:,} yes and {svr[-1][3]:,} no votes; Republicans {svr[-1][4]:,} and {svr[-1][5]:,}. Several Republican-majority legislatures passed medical programs, which is where most Republican yes votes are. <a href=\"#laws\">Each law, sponsor, signer, and vote</a>.", _legend([(n, c) for _k, n, c in PUSH])),
    ]
    return '<h2 id="at-a-glance">The study in eight charts</h2><p>Scores, IQ, the vote, and the laws, each from the data files on this page. Every chart is labeled measured or predicted, and the detailed sections follow.</p>' + "".join(blocks)
CSS = """
.kf{max-width:860px;margin:1.4rem 0 2.2rem}
.kf-k{margin:0;font-size:.66rem!important;font-weight:750;letter-spacing:.16em;text-transform:uppercase;color:var(--accent)!important}
.note-wrap h3.kf-h{margin:.2rem 0 .3rem;max-width:42rem;font-size:1.22rem;line-height:1.3;font-weight:800;letter-spacing:-.01em;color:var(--text)}
.kf .legend{margin:.3rem 0 .1rem}
@media(max-width:720px){.kf .chart-card{overflow-x:auto}.kf .chart{min-width:640px}.note-wrap h3.kf-h{font-size:1.08rem}}
"""
