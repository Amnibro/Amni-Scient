#!/usr/bin/env python3
"""Write research/substance-use-vote-share.html from the fitted results."""

from __future__ import annotations

import csv
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
RESULTS = HERE / "results"
PAGE = ROOT / "research" / "substance-use-vote-share.html"

CHART = [
    ("mj", "Marijuana, past month", "#16A34A"),
    ("alc", "Alcohol, past month", "#2563EB"),
    ("binge", "Binge alcohol, past month", "#0891B2"),
    ("cig", "Cigarettes, past month", "#E11D48"),
    ("tob", "Tobacco products, past month", "#D97706"),
    ("iem", "Illicit drugs other than marijuana, past month", "#7C3AED"),
    ("coc", "Cocaine, past year", "#EA580C"),
    ("opin", "Opioid misuse, past year", "#0D9488"),
    ("pnr", "Pain reliever misuse, past year", "#65A30D"),
    ("met", "Methamphetamine, past year", "#DB2777"),
    ("hal", "Hallucinogens, past year", "#4F46E5"),
    ("her", "Heroin, past year, ages 18+", "#78716C"),
]

BTN_CSS = """
a.btn,button.btn{text-decoration:none}
a.btn::before,button.btn::before{display:none}
a.btn.btn-primary,button.btn.btn-primary{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}
a.btn.btn-primary:hover,a.btn.btn-primary:focus,a.btn.btn-primary:focus-visible,
button.btn.btn-primary:hover,button.btn.btn-primary:focus,button.btn.btn-primary:focus-visible{background:var(--text);color:var(--bg);border-color:var(--text)}
a.btn.btn-outline,button.btn.btn-outline{background:var(--panel);border-color:var(--text);color:var(--text)}
a.btn.btn-outline:hover,a.btn.btn-outline:focus,a.btn.btn-outline:focus-visible,
button.btn.btn-outline:hover,button.btn.btn-outline:focus,button.btn.btn-outline:focus-visible{background:var(--text);color:var(--bg);border-color:var(--text)}
button.theme-toggle{background:var(--panel);border-color:var(--border2);color:var(--text)}
button.theme-toggle:hover,button.theme-toggle:focus,button.theme-toggle:focus-visible{background:var(--text);color:var(--bg);border-color:var(--text)}
button.nav-dd-trigger,button.nav-dd-trigger:hover,button.nav-dd-trigger:focus,button.nav-dd-trigger:focus-visible{color:var(--text)}
.support-cta .support-link{background:var(--panel);border-color:var(--border2);color:var(--text)}
.support-cta .support-link strong{color:var(--text)}
.support-cta .support-link:hover,.support-cta .support-link:focus,.support-cta .support-link:focus-visible,
.support-cta .support-link:hover strong,.support-cta .support-link:focus strong,.support-cta .support-link:focus-visible strong{background:var(--text);color:var(--bg);border-color:var(--text)}
footer a.kofi-link,footer a.kofi-link:hover,footer a.kofi-link:focus,footer a.kofi-link:focus-visible{color:var(--text)!important}
.legend{display:flex;flex-wrap:wrap;gap:.35rem .9rem;max-width:860px;margin:.2rem 0 .8rem}
.legend span{display:inline-flex;align-items:center;gap:.4rem;font-size:.75rem;color:var(--text)}
.legend i{width:14px;height:3px;border-radius:1px;display:inline-block}
"""


def num(x, d=2, sign=False):
    n = float(x)
    body = f"{abs(n):.{d}f}"
    if sign:
        return ("+" if n >= 0 else "−") + body
    if n < 0:
        return "−" + body
    return body


def ptxt(p):
    p = float(p)
    if p < 0.001:
        return "<0.001"
    return f"{p:.3f}"


def money(n):
    n = float(n)
    if abs(n) >= 1e6:
        return f"${n/1e6:.1f} million"
    return f"${n:,.0f}"


def svg_frame(w, h, y0, y1, ticks, xlabels, ylab_x=46):
    left, right, top, bottom = 54, 16, 18, 36
    pw, ph = w - left - right, h - top - bottom

    def X(i, n):
        if n == 1:
            return left + pw / 2
        return left + i / (n - 1) * pw

    def Y(v):
        return top + (y1 - v) / (y1 - y0) * ph

    parts = [f'<svg viewBox="0 0 {w} {h}" role="img" class="chart">']
    for t in ticks:
        y = Y(t)
        parts.append(f'<line x1="{left}" y1="{y:.1f}" x2="{w-right}" y2="{y:.1f}" class="grid"/>')
        parts.append(f'<text x="{left-8}" y="{y+4:.1f}" text-anchor="end" class="tick">{t:g}</text>')
    parts.append(f'<line x1="{left}" y1="{top}" x2="{left}" y2="{h-bottom}" class="axis"/>')
    parts.append(f'<line x1="{left}" y1="{h-bottom}" x2="{w-right}" y2="{h-bottom}" class="axis"/>')
    for i, lab in enumerate(xlabels):
        parts.append(f'<text x="{X(i, len(xlabels)):.1f}" y="{h-14}" text-anchor="middle" class="tick">{lab}</text>')
    return parts, X, Y, left, h - bottom


def line_chart(quintiles):
    by = {}
    for row in quintiles:
        by.setdefault(row["measure"], []).append(row)
    parts, X, Y, left, base = svg_frame(720, 360, 28, 68, [30, 40, 50, 60], ["1", "2", "3", "4", "5"])
    for key, _label, color in CHART:
        rows = sorted(by[key], key=lambda r: int(r["quintile"]))
        pts = " ".join(f"{X(int(r['quintile'])-1, 5):.1f},{Y(float(r['dem2'])*100):.1f}" for r in rows)
        parts.append(f'<polyline points="{pts}" fill="none" stroke="{color}" stroke-width="2.4" stroke-linejoin="round"/>')
        for r in rows:
            parts.append(
                f'<circle cx="{X(int(r["quintile"])-1, 5):.1f}" cy="{Y(float(r["dem2"])*100):.1f}" r="3.2" fill="{color}"/>'
            )
    parts.append("</svg>")
    legend = '<div class="legend">' + "".join(
        f'<span><i style="background:{color}"></i>{label}</span>' for _k, label, color in CHART
    ) + "</div>"
    return "\n".join(parts), legend


def density_chart(bins):
    labels = [f"{b['people_per_km2']:.0f}/km²" for b in bins]
    vals = [b["combined"] for b in bins]
    parts, X, Y, left, base = svg_frame(720, 280, -3, 3, [-2, -1, 0, 1, 2], labels)
    # zero line
    parts.append(f'<line x1="54" y1="{Y(0):.1f}" x2="704" y2="{Y(0):.1f}" class="axis"/>')
    pts = " ".join(f"{X(i, 5):.1f},{Y(v):.1f}" for i, v in enumerate(vals))
    parts.append(f'<polyline points="{pts}" fill="none" stroke="#2563EB" stroke-width="2.4"/>')
    for i, v in enumerate(vals):
        parts.append(f'<circle cx="{X(i, 5):.1f}" cy="{Y(v):.1f}" r="4" fill="#2563EB"/>')
        parts.append(f'<text x="{X(i, 5):.1f}" y="{Y(v)-10:.1f}" text-anchor="middle" class="tick">{v:+.2f}</text>')
    parts.append("</svg>")
    return "\n".join(parts)


def within_chart(bins):
    labels = [str(b["quintile"]) for b in bins]
    vals = [b["dem2_within"] * 100 for b in bins]
    parts, X, Y, left, base = svg_frame(720, 280, -4, 6, [-4, -2, 0, 2, 4, 6], labels)
    parts.append(f'<line x1="54" y1="{Y(0):.1f}" x2="704" y2="{Y(0):.1f}" class="axis"/>')
    pts = " ".join(f"{X(i, 5):.1f},{Y(v):.1f}" for i, v in enumerate(vals))
    parts.append(f'<polyline points="{pts}" fill="none" stroke="#7C3AED" stroke-width="2.4"/>')
    for i, v in enumerate(vals):
        parts.append(f'<circle cx="{X(i, 5):.1f}" cy="{Y(v):.1f}" r="4" fill="#7C3AED"/>')
    parts.append("</svg>")
    return "\n".join(parts)


def between_chart(states):
    xs = [float(r["combined"]) for r in states]
    ys = [float(r["dem2"]) * 100 for r in states]
    wts = [float(r["two_party"]) for r in states]
    wmin, wmax = min(xs) - 1, max(xs) + 1
    # map x ourselves
    w, h = 720, 320
    left, right, top, bottom = 54, 16, 18, 36
    pw, ph = w - left - right, h - top - bottom
    y0, y1 = 20, 80

    def X(v):
        return left + (v - wmin) / (wmax - wmin) * pw

    def Y(v):
        return top + (y1 - v) / (y1 - y0) * ph

    parts = [f'<svg viewBox="0 0 {w} {h}" role="img" class="chart">']
    for t in (20, 40, 60, 80):
        parts.append(f'<line x1="{left}" y1="{Y(t):.1f}" x2="{w-right}" y2="{Y(t):.1f}" class="grid"/>')
        parts.append(f'<text x="{left-8}" y="{Y(t)+4:.1f}" text-anchor="end" class="tick">{t}</text>')
    parts.append(f'<line x1="{left}" y1="{top}" x2="{left}" y2="{h-bottom}" class="axis"/>')
    parts.append(f'<line x1="{left}" y1="{h-bottom}" x2="{w-right}" y2="{h-bottom}" class="axis"/>')
    for v in range(int(wmin), int(wmax) + 1, 4):
        parts.append(f'<text x="{X(v):.1f}" y="{h-14}" text-anchor="middle" class="tick">{v}</text>')
    m = max(wts)
    for x, y, wt in zip(xs, ys, wts):
        r = 3 + 7 * (wt / m) ** 0.5
        parts.append(f'<circle cx="{X(x):.1f}" cy="{Y(y):.1f}" r="{r:.1f}" fill="#2563EB" fill-opacity="0.75"/>')
    parts.append("</svg>")
    return "\n".join(parts)


def lab_chart():
    # Groups of bars. Values are percents. Errors are percentage points (1 SE), except Gawrylowicz uses the published CI half-width.
    groups = [
        ("Kloft eyewitness\nsuggested detail", [("Placebo", 8, 2.0), ("THC", 19, 4.0)]),
        ("Kloft related\nfalse alarms", [("Placebo", 27, 3.0), ("THC", 42, 3.0)]),
        ("Gawrylowicz\nmisled responses", [("Alcohol", 25.0, 5.2), ("Reverse placebo", 22.0, 5.1), ("No alcohol", 31.9, 5.25)]),
    ]
    # Gawrylowicz CIs: alcohol .196-.300 so half width from .25 is .054 -> 5.4 pp. Use 5.4, 4.6, 5.3
    groups[2] = ("Gawrylowicz\nmisled responses", [("Alcohol", 25.0, 5.4), ("Reverse placebo", 22.0, 5.6), ("No alcohol", 31.9, 5.3)])
    w, h = 720, 320
    left, right, top, bottom = 54, 16, 28, 62
    y0, y1 = 0, 55
    ph = h - top - bottom
    pw = w - left - right

    def Y(v):
        return top + (y1 - v) / (y1 - y0) * ph

    parts = [f'<svg viewBox="0 0 {w} {h}" role="img" class="chart">']
    for t in (0, 10, 20, 30, 40, 50):
        parts.append(f'<line x1="{left}" y1="{Y(t):.1f}" x2="{w-right}" y2="{Y(t):.1f}" class="grid"/>')
        parts.append(f'<text x="{left-8}" y="{Y(t)+4:.1f}" text-anchor="end" class="tick">{t}</text>')
    parts.append(f'<line x1="{left}" y1="{top}" x2="{left}" y2="{h-bottom}" class="axis"/>')
    parts.append(f'<line x1="{left}" y1="{h-bottom}" x2="{w-right}" y2="{h-bottom}" class="axis"/>')
    colors = ["#78716C", "#16A34A", "#2563EB"]
    n_g = len(groups)
    slot = pw / n_g
    for gi, (title, bars) in enumerate(groups):
        bw = min(36, (slot - 24) / len(bars))
        block = len(bars) * bw + (len(bars) - 1) * 8
        x0 = left + gi * slot + (slot - block) / 2
        cx = left + gi * slot + slot / 2
        for line_i, line in enumerate(title.split("\n")):
            parts.append(f'<text x="{cx:.1f}" y="{h-42 + line_i*12}" text-anchor="middle" class="tick">{line}</text>')
        for bi, (name, val, err) in enumerate(bars):
            x = x0 + bi * (bw + 8)
            y = Y(val)
            base = Y(0)
            parts.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{bw:.1f}" height="{base-y:.1f}" fill="{colors[bi % 3]}"/>')
            parts.append(f'<line x1="{x+bw/2:.1f}" y1="{Y(val-err):.1f}" x2="{x+bw/2:.1f}" y2="{Y(val+err):.1f}" class="whisk"/>')
            parts.append(f'<text x="{x+bw/2:.1f}" y="{h-16}" text-anchor="middle" class="tick">{name.split()[0]}</text>')
    parts.append("</svg>")
    return "\n".join(parts)


def donation_totals(rows):
    industries = []
    for r in rows:
        if r["industry"] not in industries:
            industries.append(r["industry"])
    colors = {"total": "#2563EB", "to_democrats": "#1D4ED8", "to_republicans": "#E11D48"}
    # Actually dem blue and rep red is a convention readers expect for this chart. Keep it literal.
    panels = []
    w, h = 720, 168
    for ind in industries:
        sub = [r for r in rows if r["industry"] == ind]
        sub = sorted(sub, key=lambda r: int(r["cycle"]))
        ymax = max(float(r["total"]) for r in sub) * 1.15
        left, right, top, bottom = 78, 12, 22, 28
        pw, ph = w - left - right, h - top - bottom
        n = len(sub)
        slot = pw / n

        def Y(v):
            return top + (ymax - v) / ymax * ph

        base = Y(0)
        parts = [f'<svg viewBox="0 0 {w} {h}" role="img" class="chart">']
        parts.append(f'<text x="{left}" y="14" class="tick">{ind}</text>')
        parts.append(f'<line x1="{left}" y1="{base:.1f}" x2="{w-right}" y2="{base:.1f}" class="axis"/>')
        for i, r in enumerate(sub):
            vals = [
                ("Total", float(r["total"]), "#64748B"),
                ("Dem", float(r["to_democrats"]), "#2563EB"),
                ("Rep", float(r["to_republicans"]), "#DC2626"),
            ]
            bw = 14
            block = 3 * bw + 6
            x0 = left + i * slot + (slot - block) / 2
            for j, (_n, v, col) in enumerate(vals):
                x = x0 + j * (bw + 3)
                y = Y(v)
                parts.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{bw}" height="{max(0, base-y):.1f}" fill="{col}"/>')
            parts.append(f'<text x="{left + i*slot + slot/2:.1f}" y="{h-8}" text-anchor="middle" class="tick">{r["cycle"]}</text>')
        parts.append("</svg>")
        panels.append("\n".join(parts))
    legend = '<div class="legend"><span><i style="background:#64748B;height:10px"></i>Total</span><span><i style="background:#2563EB;height:10px"></i>To Democrats</span><span><i style="background:#DC2626;height:10px"></i>To Republicans</span></div>'
    return legend + "\n".join(f'<div class="chart-card">{p}</div>' for p in panels)


def party_lines(rows):
    industries = []
    for r in rows:
        if r["industry"] not in industries:
            industries.append(r["industry"])
    colors = {
        "Beer, Wine & Liquor": "#2563EB",
        "Tobacco": "#D97706",
        "Pharmaceuticals / Health Products": "#7C3AED",
        "Marijuana": "#16A34A",
    }
    cycles = [2016, 2018, 2020, 2022, 2024]
    w, h = 720, 300
    left, right, top, bottom = 54, 16, 18, 36
    pw, ph = w - left - right, h - top - bottom

    def X(i):
        return left + i / 4 * pw

    def Y(v):
        return top + (100 - v) / 100 * ph

    parts = [f'<svg viewBox="0 0 {w} {h}" role="img" class="chart">']
    for t in (0, 25, 50, 75, 100):
        parts.append(f'<line x1="{left}" y1="{Y(t):.1f}" x2="{w-right}" y2="{Y(t):.1f}" class="grid"/>')
        parts.append(f'<text x="{left-8}" y="{Y(t)+4:.1f}" text-anchor="end" class="tick">{t}</text>')
    parts.append(f'<line x1="{left}" y1="{top}" x2="{left}" y2="{h-bottom}" class="axis"/>')
    parts.append(f'<line x1="{left}" y1="{h-bottom}" x2="{w-right}" y2="{h-bottom}" class="axis"/>')
    for i, c in enumerate(cycles):
        parts.append(f'<text x="{X(i):.1f}" y="{h-14}" text-anchor="middle" class="tick">{c}</text>')
    for ind in industries:
        sub = {int(r["cycle"]): r for r in rows if r["industry"] == ind}
        pts = " ".join(f"{X(i):.1f},{Y(float(sub[c]['pct_democrats'])):.1f}" for i, c in enumerate(cycles))
        parts.append(f'<polyline points="{pts}" fill="none" stroke="{colors[ind]}" stroke-width="2.4"/>')
        for i, c in enumerate(cycles):
            parts.append(f'<circle cx="{X(i):.1f}" cy="{Y(float(sub[c]["pct_democrats"])):.1f}" r="3.2" fill="{colors[ind]}"/>')
    parts.append("</svg>")
    legend = '<div class="legend">' + "".join(
        f'<span><i style="background:{colors[ind]}"></i>{ind}, percent to Democrats</span>' for ind in industries
    ) + "</div>"
    return "\n".join(parts), legend


def compare_chart(alone, rows):
    # Four paired rows.
    vote = [
        ("Marijuana", alone["mj"]["pp_per_sd"]),
        ("Alcohol", alone["alc"]["pp_per_sd"]),
        ("Cigarettes", alone["cig"]["pp_per_sd"]),
        ("Opioid misuse", alone["opin"]["pp_per_sd"]),
    ]
    ind_of = {
        "Marijuana": "Marijuana",
        "Alcohol": "Beer, Wine & Liquor",
        "Cigarettes": "Tobacco",
        "Opioid misuse": "Pharmaceuticals / Health Products",
    }
    y2024 = {r["industry"]: r for r in rows if int(r["cycle"]) == 2024}
    w, h = 720, 280
    parts = [f'<svg viewBox="0 0 {w} {h}" role="img" class="chart">']
    parts.append('<text x="188" y="18" text-anchor="middle" class="tick">Vote share, points per 1 SD</text>')
    parts.append('<text x="520" y="18" text-anchor="middle" class="tick">2024 party split, percent</text>')
    parts.append('<line x1="360" y1="28" x2="360" y2="268" class="axis"/>')
    # vote axis -6 to +6 centered at x=188
    def XV(v):
        return 188 + v / 6 * 140

    parts.append(f'<line x1="{XV(0):.1f}" y1="32" x2="{XV(0):.1f}" y2="250" class="grid"/>')
    for t in (-4, 0, 4):
        parts.append(f'<text x="{XV(t):.1f}" y="266" text-anchor="middle" class="tick">{t:+d}</text>')
    # party axis 0-100 at x=430 to 680
    def XP(v):
        return 410 + v / 100 * 280

    for t in (0, 50, 100):
        parts.append(f'<text x="{XP(t):.1f}" y="266" text-anchor="middle" class="tick">{t}</text>')
    for i, (name, val) in enumerate(vote):
        y = 48 + i * 52
        parts.append(f'<text x="8" y="{y-14}" class="tick">{name}</text>')
        x0, x1 = XV(0), XV(val)
        parts.append(f'<rect x="{min(x0,x1):.1f}" y="{y-8}" width="{abs(x1-x0):.1f}" height="16" fill="#2563EB"/>')
        anchor = "start" if val >= 0 else "end"
        nudge = 8 if val >= 0 else -8
        parts.append(
            f'<text x="{XV(val)+nudge:.1f}" y="{y+4}" text-anchor="{anchor}" class="tick">{val:+.2f}</text>'
        )
        rec = y2024[ind_of[name]]
        pdm, prep = float(rec["pct_democrats"]), float(rec["pct_republicans"])
        parts.append(f'<rect x="{XP(0):.1f}" y="{y-10}" width="{(XP(pdm)-XP(0)):.1f}" height="8" fill="#2563EB"/>')
        parts.append(f'<rect x="{XP(0):.1f}" y="{y+2}" width="{(XP(prep)-XP(0)):.1f}" height="8" fill="#DC2626"/>')
        parts.append(f'<text x="{XP(max(pdm, prep))+6:.1f}" y="{y+4}" class="tick">{pdm:.0f} / {prep:.0f}</text>')
    parts.append("</svg>")
    return "\n".join(parts)


def coef_table(alone, keys):
    rows = []
    for k in keys:
        v = alone[k]
        rows.append(
            "<tr>"
            f"<td>{v['label']}</td>"
            f"<td>{num(v['pp_per_pp'], sign=True)}</td>"
            f"<td>{num(v['se_pp'])}</td>"
            f"<td>{num(v['pp_per_sd'], sign=True)}</td>"
            f"<td>{num(v['state_fe_pp_per_pp'], sign=True)}</td>"
            f"<td>{num(v['state_fe_se_pp'])}</td>"
            f"<td>{ptxt(v['p'])}</td>"
            "</tr>"
        )
    return "\n".join(rows)


def joint_table(joint):
    rows = []
    for k, v in joint["terms"].items():
        rows.append(
            "<tr>"
            f"<td>{v['label']}</td>"
            f"<td>{num(v['pp_per_pp'], sign=True)}</td>"
            f"<td>{num(v['se_pp'])}</td>"
            f"<td>{num(v['state_fe_pp_per_pp'], sign=True)}</td>"
            f"<td>{num(v['state_fe_se_pp'])}</td>"
            f"<td>{ptxt(v['p'])}</td>"
            "</tr>"
        )
    return "\n".join(rows)


def potency_html():
    text = (ROOT / "research" / "eighteen-points.html").read_text()
    start = text.index("<h2>Suggestibility</h2>")
    end = text.index("<h2>For X</h2>")
    block = text[start:end]
    block = block.replace("<h2>Suggestibility</h2>", "<h2>Suggestibility, predicted from the lab dose</h2>", 1)
    block = block.replace(
        "<h2>Cognitive decline, study potency versus current potency</h2>",
        "<h2>IQ, predicted from study potency</h2>",
        1,
    )
    return block


def nav():
    return (ROOT / "research" / "past-month-alcohol-vote-share.html").read_text().split("<nav>", 1)[1].split("</nav>", 1)[0]


def main():
    ext = json.loads((RESULTS / "extended.json").read_text())
    quint = list(csv.DictReader((RESULTS / "quintiles.csv").open()))
    states = list(csv.DictReader((RESULTS / "state_level.csv").open()))
    from industry_donations_source import records, write_csv

    write_csv(RESULTS / "industry_donations.csv")
    donations = records()
    alone = ext["alone"]
    lines, legend = line_chart(quint)
    dens = density_chart(ext["combined_vs_density"]["bins"])
    within = within_chart(ext["combined_vs_state"]["within_bins"])
    between = between_chart(states)
    parties, party_legend = party_lines(donations)
    use_keys = ["mj", "alc", "binge", "cig", "tob", "iem", "ill", "coc", "hal", "her", "met", "opin", "pnr", "mrjyr", "ualc", "ubinge", "ucig", "utob"]
    dis_keys = ["sud", "dud", "oud", "prud", "aud", "uaud"]
    c = alone["combined"]
    pc = alone["combined_pc1"]
    within_c = ext["combined_vs_state"]["within_specified"]
    between_c = ext["combined_vs_state"]["between_with_log_density"]
    between_a = ext["combined_vs_state"]["between_alone"]
    def dget(industry, field):
        return next(r[field] for r in donations if r["industry"] == industry and int(r["cycle"]) == 2024)

    beer_total, beer_dem, beer_rep = dget("Beer, Wine & Liquor", "total"), dget("Beer, Wine & Liquor", "to_democrats"), dget("Beer, Wine & Liquor", "to_republicans")
    tob_total = dget("Tobacco", "total")
    pharma_total = dget("Pharmaceuticals / Health Products", "total")
    mj_total = dget("Marijuana", "total")
    mj_q = [r for r in quint if r["measure"] == "mj"]
    cig_q = [r for r in quint if r["measure"] == "cig"]
    alc_q = [r for r in quint if r["measure"] == "alc"]

    def qdem(rows, q):
        r = next(x for x in rows if int(x["quintile"]) == q)
        return float(r["dem2"]) * 100

    html = f"""<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="theme-color" content="#FBFAF8">
<title>Substance use and the 2024 vote | AMNI-SCIENT Research</title>
<meta name="description" content="Vote-weighted regressions of 2021–2023 NSDUH substate substance-use rates on 2024 Democratic two-party share across 382 regions, plus a combined index, laboratory results, and OpenSecrets industry contributions.">
<meta name="keywords" content="NSDUH,marijuana,alcohol,cigarettes,opioid,2024 presidential vote,ecological regression,OpenSecrets,Anthony Reffelt">
<meta property="og:title" content="Substance use and the 2024 vote — AMNI-SCIENT Research">
<meta property="og:description" content="NSDUH substate rates and 2024 Democratic two-party share. Measured vote results, laboratory results, and industry contributions, labeled separately.">
<meta property="og:type" content="article">
<meta property="og:url" content="https://amni-scient.com/research/substance-use-vote-share">
<meta property="og:image" content="https://amni-scient.com/assets/explore/og-explore.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Substance use and the 2024 vote">
<meta name="twitter:description" content="382 NSDUH regions. Marijuana +1.13 points of vote share per point of past-month use. Cigarettes −0.97.">
<link rel="canonical" href="https://amni-scient.com/research/substance-use-vote-share">
<script type="application/ld+json">{{"@context":"https://schema.org","@type":"ScholarlyArticle","name":"Substance use and the 2024 vote","headline":"NSDUH substate substance use and 2024 Democratic two-party vote share","author":{{"@type":"Person","name":"Anthony Reffelt"}},"description":"Area-level associations of NSDUH 2021–2023 substate substance-use rates with 2024 Democratic two-party vote share, a combined use index, laboratory suggestibility results, and OpenSecrets industry contributions.","url":"https://amni-scient.com/research/substance-use-vote-share","publisher":{{"@type":"Organization","name":"AMNI-SCIENT"}},"datePublished":"2026-10-11","dateModified":"2026-10-11"}}</script>
<link rel="stylesheet" href="../css/style.css?v=b261">
<script>
(function(){{var h=document.documentElement,s=localStorage.getItem('amni-theme')||'light';h.dataset.theme=s;function u(){{var b=document.getElementById('theme-toggle');if(b)b.textContent=h.dataset.theme==='dark'?'LIGHT':'DARK';var m=document.querySelector('meta[name=theme-color]');if(m)m.setAttribute('content',h.dataset.theme==='dark'?'#0A0B0E':'#FBFAF8');}}window.addEventListener('DOMContentLoaded',u);window.toggleTheme=function(){{var n=h.dataset.theme==='dark'?'light':'dark';h.dataset.theme=n;localStorage.setItem('amni-theme',n);u();}};}})();
</script>
<style>
.note-wrap{{max-width:none;width:100%;margin:0;padding:.4rem max(clamp(1.25rem,5vw,4rem),calc((100vw - 1240px)/2)) 3.5rem}}
.note-wrap p:not(.axis-name),.note-wrap h2,.note-wrap .src,.note-wrap li{{max-width:42rem}}
.note-wrap .stats,.note-wrap table.cmp,.note-wrap .chart-card,.note-wrap .legend,.note-wrap .axis-name{{max-width:860px}}
.crumb{{font-size:.7rem;letter-spacing:.18em;text-transform:uppercase;color:var(--dim);margin:0 0 .8rem}}
.crumb a{{color:var(--accent)}}
.hero .crumb{{position:relative;z-index:1;margin:0 0 .55rem;order:-2}}
.stats{{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:0 0 1.6rem}}
.stat{{background:var(--panel);border:1px solid var(--border);border-radius:4px;padding:1rem 1rem .95rem}}
.stat .k{{display:block;font-size:.62rem;font-weight:700;font-stretch:80%;letter-spacing:.14em;text-transform:uppercase;color:var(--dim)}}
.stat .v{{display:block;margin-top:.3rem;font-size:1.85rem;font-weight:800;letter-spacing:-.03em;line-height:1}}
.stat .s{{display:block;margin-top:.4rem;font-size:.8rem;color:var(--text-soft);line-height:1.35}}
.stat.lead{{border-color:color-mix(in srgb,var(--accent) 50%,var(--border));background:linear-gradient(180deg,var(--accent-dim),var(--panel) 48%)}}
.stat.lead .v{{color:var(--accent)}}
.note-wrap h2{{text-align:left;margin:2.2rem 0 .6rem;font-size:1.25rem}}
.note-wrap p,.note-wrap li{{color:var(--text-soft);font-size:.95rem;line-height:1.65}}
.note-wrap ul,.note-wrap ol{{max-width:42rem;padding-left:1.2rem;margin:.4rem 0 1rem}}
.note-wrap a:not(.btn),.src a:not(.btn),.data-top a:not(.btn){{color:var(--accent)}}
.note-wrap strong{{color:var(--text)}}
.fine{{font-size:.8rem;color:var(--dim)}}
.chart-card{{background:var(--panel);border:1px solid var(--border);border-radius:4px;padding:.4rem .4rem .2rem;margin:.7rem 0 .4rem}}
.chart{{width:100%;height:auto;display:block}}
.chart .grid{{stroke:var(--border);stroke-dasharray:3 4}}
.chart .axis{{stroke:var(--border2)}}
.chart .tick{{fill:var(--text-soft);font-size:11px;font-family:var(--font-sans,Archivo,sans-serif)}}
.chart .whisk{{stroke:var(--text);stroke-width:1.5}}
.chart .band{{fill:var(--accent);fill-opacity:.18}}
.chart .line{{fill:none;stroke:var(--accent);stroke-width:2.4}}
.chart .dot{{fill:var(--panel);stroke:var(--text);stroke-width:2}}
.chart .mark{{stroke:var(--accent);stroke-opacity:.45;stroke-dasharray:2 3}}
.chart .marklab{{fill:var(--accent);font-size:10px;font-family:var(--font-sans,Archivo,sans-serif);letter-spacing:.04em}}
.axis-name{{display:flex;justify-content:space-between;font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;color:var(--dim);padding:0 .4rem .2rem}}
table.cmp{{width:100%;border-collapse:collapse;background:var(--panel);border:1px solid var(--border);font-size:.82rem;margin:.8rem 0}}
table.cmp th,table.cmp td{{padding:.45rem .55rem;text-align:right;border-bottom:1px solid var(--border)}}
table.cmp th:first-child,table.cmp td:first-child{{text-align:left}}
table.cmp th{{font-size:.62rem;letter-spacing:.08em;text-transform:uppercase;color:var(--dim);background:var(--panel2)}}
table.cmp tr:last-child td{{border-bottom:0}}
table.cmp tr.hot td{{background:var(--accent-dim);color:var(--text);font-weight:650}}
.src{{margin-top:1.6rem;padding-top:1rem;border-top:1px solid var(--border);font-size:.82rem;color:var(--dim)}}
.data-top{{padding-top:0}}
.data-top h2{{text-align:left;font-size:1.15rem;letter-spacing:.08em}}
.dl-row{{display:flex;flex-wrap:wrap;gap:.6rem;margin:1rem 0 1.2rem}}
.dl-row .btn{{text-decoration:none}}
.cite{{max-width:42rem;font-family:'JetBrains Mono',monospace;font-size:.75rem;line-height:1.7;background:var(--panel);border:1px solid var(--border);border-radius:4px;padding:1rem 1.2rem;color:var(--text);margin:0}}
.hero .tagline{{max-width:42rem}}
body.pp .hero h1{{max-width:22ch}}
.cap{{max-width:42rem}}
{BTN_CSS}
@media(max-width:720px){{
  .stats{{grid-template-columns:1fr}}
  table.cmp{{font-size:.72rem}}
  table.cmp th,table.cmp td{{padding:.35rem .3rem}}
  .axis-name{{flex-direction:column;align-items:flex-start;gap:.25rem}}
}}
</style>
</head>
<body class="pp">
<div class="grid-bg"></div>
<div class="scanlines"></div>
<nav>{nav()}</nav>
<section class="hero">
<p class="crumb"><a href="../research.html">Research</a> / Substance use and the 2024 vote</p>
<h1>Substance use and the 2024 vote</h1>
<p class="subtitle">NSDUH substate rates · one regression</p>
<p class="tagline">The lowest fifth of regions on past-month marijuana use cast {qdem(mj_q,1):.1f}% of its two-party vote for the Democrat. The highest fifth cast {qdem(mj_q,5):.1f}%. Cigarettes run the other way: {qdem(cig_q,1):.1f}% in the lowest fifth, {qdem(cig_q,5):.1f}% in the highest. Alcohol runs with marijuana: {qdem(alc_q,1):.1f}% to {qdem(alc_q,5):.1f}%.</p>
</section>
<main class="note-wrap">
<div class="data-top">
<h2>Data and method</h2>
<div class="dl-row">
<a class="btn btn-primary" href="nsduh-vote-ecological/results/region_level.csv" download>Region CSV</a>
<a class="btn btn-primary" href="nsduh-vote-ecological/results/results.json" download>Results JSON</a>
<a class="btn btn-primary" href="nsduh-vote-ecological/results/extended.json" download>Extended JSON</a>
<a class="btn btn-primary" href="nsduh-vote-ecological/results/quintiles.csv" download>Quintiles CSV</a>
<a class="btn btn-primary" href="nsduh-vote-ecological/results/state_level.csv" download>State CSV</a>
<a class="btn btn-primary" href="nsduh-vote-ecological/results/industry_donations.csv" download>Donations CSV</a>
<a class="btn btn-primary" href="nsduh-vote-ecological/data/substate_outcomes_212223.csv" download>NSDUH outcomes CSV</a>
<a class="btn btn-outline" href="nsduh-vote-ecological/run_regression.py" download>Regression script</a>
<a class="btn btn-outline" href="nsduh-vote-ecological/fit_extended.py" download>Substance fit</a>
<a class="btn btn-outline" href="nsduh-vote-ecological/README.md">Full method</a>
</div>
<p>I joined SAMHSA’s 2021–2023 NSDUH substate small-area estimates to 2024 presidential votes reallocated to ZCTAs by the land-cover method (Harvard Dataverse 10.7910/DVN/Z8TSH3), with ACS 2019–2023 age and education and Census 2020 ZCTA internal points. The unit is the substate region. N = 382 regions, 30,389 ZCTAs, 150.1 million allocated two-party votes. Weights are two-party votes. Standard errors are HC1. The specified model is the rate, log population density, percent ages 18–25, and percent ages 12–17. Ages 12–14 are three-fifths of the ACS 10–14 band, and age 25 is one-fifth of the 25–29 band. Replacing those with ages 15–17 and 18–24 leaves the marijuana slope at 1.12.</p>
<p>Alaska and Hawaii have no rows in the vote file. The shapefile has 393 regions. Nebraska is in it: five regions, FIPS 31, polygons between 104°W and 95°W. The file’s state name on those rows says New Jersey. One New Jersey region, Southern, FIPS 34, is labeled New York. State indicators use the FIPS code. The estimation sample is 49 jurisdictions: 48 states plus the District of Columbia.</p>
<p>The NSDUH rates are small-area estimates. I applied no errors-in-variables correction. No public file links one person’s use to that person’s ballot. Density’s correlation with Democratic two-party share is 0.73. Bachelor’s share is 0.71. The slope that remains after density and age is the residual association of the rate.</p>
<p>Past-month cocaine, heroin, methamphetamine, hallucinogens, opioid misuse, and pain-reliever misuse are not in the substate file. Those six are past-year rates, and heroin is ages 18 or older. There is no separate heavy-drinking field. Binge alcohol in the past month is the intensity measure SAMHSA published. Nicotine vaping is not its own outcome. Tobacco product use in the past month is the tobacco field. Fentanyl, inhalants, LSD, PCP, and crack are not separate substate rates. The file also carries mental-illness, suicide, and perceived-risk outcomes. I left those out of the vote regression. Substance-use disorder rates are in the second table. They are disorder prevalence, not use.</p>
<p>The combined index is the sum of eight vote-weighted z-scores: past-month marijuana, past-month alcohol, past-month cigarettes, past-month illicit drugs other than marijuana, past-year cocaine, past-year opioid misuse, past-year methamphetamine, and past-year hallucinogens. A region at the vote-weighted mean on every rate scores 0. One standard deviation above on all eight scores 8. I left out rates that repeat another rate: illicit drugs including marijuana, tobacco products including cigarettes, binge alcohol, pain-reliever misuse inside opioid misuse, past-year marijuana, heroin at ages 18 or older, and the underage rates.</p>
<p>The laboratory chart is laboratory data. The potency curves are predictions. OpenSecrets industry totals were retrieved 2026-10-11 from the Internet Archive capture of 2026-07-16, after the live pages returned HTTP 403. Party percentages are OpenSecrets’ shares of contributions to candidates and parties. Outside spending is in the total and is left out of the party split. I did not re-sum raw FEC itemized filings.</p>
<p class="cite">Reffelt, A. (2026). <em>Substance use and the 2024 vote.</em> AMNI-SCIENT Research. https://amni-scient.com/research/substance-use-vote-share</p>
</div>

<div class="stats">
<div class="stat lead"><span class="k">Marijuana, lowest fifth to highest</span><span class="v">+18.1</span><span class="s">points of Democratic two-party share, {qdem(mj_q,1):.1f}% to {qdem(mj_q,5):.1f}%. Measured.</span></div>
<div class="stat"><span class="k">Cigarettes, lowest fifth to highest</span><span class="v">−26.7</span><span class="s">points, {qdem(cig_q,1):.1f}% to {qdem(cig_q,5):.1f}%. Measured.</span></div>
<div class="stat"><span class="k">After density and age</span><span class="v">{num(alone['mj']['pp_per_pp'], sign=True)}</span><span class="s">marijuana, vote-share points per point of past-month use. SE {num(alone['mj']['se_pp'])}.</span></div>
</div>

<h2>Each rate</h2>
<p>Vote-weighted fifths. The vertical axis is the 2024 Democratic vote divided by Democratic plus Republican votes. Each line is one NSDUH rate, cut into its own fifths.</p>
<div class="chart-card">{lines}</div>
<p class="axis-name"><span>Y · Democratic two-party share, %</span><span>X · Quintile of that rate, low to high</span></p>
{legend}
<p class="fine cap">Measured. The unit is the substate region. 382 regions.</p>
<p>After log density and age, one point of past-month marijuana use lines up with <strong>{num(alone['mj']['pp_per_pp'], sign=True)}</strong> points of Democratic two-party share (SE {num(alone['mj']['se_pp'])}). One point of past-month cigarettes lines up with <strong>{num(alone['cig']['pp_per_pp'], sign=True)}</strong> (SE {num(alone['cig']['se_pp'])}). Past-month alcohol is <strong>{num(alone['alc']['pp_per_pp'], sign=True)}</strong> (SE {num(alone['alc']['se_pp'])}). Past-month tobacco products are <strong>{num(alone['tob']['pp_per_pp'], sign=True)}</strong> (SE {num(alone['tob']['se_pp'])}).</p>
<p>A point of cocaine is a large coefficient because the regional rate only moves about half a point: <strong>{num(alone['coc']['pp_per_pp'], sign=True)}</strong> per point of past-year cocaine use (SE {num(alone['coc']['se_pp'])}), which is <strong>{num(alone['coc']['pp_per_sd'], sign=True)}</strong> points of share per weighted standard deviation. Hallucinogens are <strong>{num(alone['hal']['pp_per_sd'], sign=True)}</strong> per SD. Opioid misuse is <strong>{num(alone['opin']['pp_per_sd'], sign=True)}</strong> per SD (SE {num(alone['opin']['se_per_sd'])}). Methamphetamine is <strong>{num(alone['met']['pp_per_sd'], sign=True)}</strong> per SD.</p>
<table class="cmp">
<thead><tr><th>Rate</th><th>Per point</th><th>SE</th><th>Per SD</th><th>State FE</th><th>SE</th><th>p</th></tr></thead>
<tbody>
{coef_table(alone, use_keys)}
</tbody>
</table>
<p class="fine">Per point: percentage points of Democratic two-party share per percentage point of the rate, with log density and age. Per SD: the same slope times the vote-weighted standard deviation of the rate. State FE adds state indicators. p is for the density-and-age slope. N = 382. HC1.</p>
<p>Marijuana on its own, before density and age, is 1.48 (SE 0.20). Adding a bachelor’s degree leaves 1.09 (SE 0.11). State indicators leave 0.99 (SE 0.26). State indicators and a bachelor’s degree leave 1.14 (SE 0.24). The areal vote allocation leaves 1.14 (SE 0.13). Entered with alcohol alone, marijuana is 0.96 (SE 0.13) and alcohol is 0.49 (SE 0.08).</p>

<h2>Disorder prevalence</h2>
<table class="cmp">
<thead><tr><th>Rate</th><th>Per point</th><th>SE</th><th>Per SD</th><th>State FE</th><th>SE</th><th>p</th></tr></thead>
<tbody>
{coef_table(alone, dis_keys)}
</tbody>
</table>
<p class="fine">Same specification. These rows are past-year disorder prevalence.</p>

<h2>Eight rates together</h2>
<p>The joint model puts the eight index rates in one regression with log density and age. Weighted R² is {ext['joint']['r2']:.2f}. With state indicators it is {ext['joint']['state_fe_r2']:.2f}.</p>
<table class="cmp">
<thead><tr><th>Rate</th><th>Per point</th><th>SE</th><th>State FE</th><th>SE</th><th>p</th></tr></thead>
<tbody>
{joint_table(ext['joint'])}
</tbody>
</table>
<p class="fine">Each row is that rate’s coefficient with the other seven rates, log density, and age in the same model.</p>

<h2>Combined index</h2>
<p>One SD of the sum lines up with <strong>{num(c['pp_per_sd'], sign=True)}</strong> points of Democratic two-party share (SE {num(c['se_per_sd'])}). The correlation of the sum with the vote is {ext['correlations_dem2']['combined']:.2f}. The first principal component of the same eight z-scores correlates {ext['index']['corr_sum_vs_pc1']:.2f} with the sum. Its cigarette loading is {ext['index']['pc1_loadings']['cig']:+.2f}. One SD of the component lines up with <strong>{num(pc['pp_per_sd'], sign=True)}</strong> points of share (SE {num(pc['se_per_sd'])}). The component’s correlation with the vote is {ext['correlations_dem2']['combined_pc1']:.2f}. It accounts for {ext['index']['pc1_variance_share']*100:.0f}% of the weighted covariance of the eight z-scores.</p>
<p>Inside the same state, one point of the sum lines up with <strong>{num(within_c['pp_per_pp'], sign=True)}</strong> points of share (SE {num(within_c['se_pp'])}). Between states, with log density, the slope is <strong>{num(between_c['pp_per_pp'], sign=True)}</strong> (SE {num(between_c['se_pp'])}, {ext['combined_vs_state']['n_states']} jurisdictions). Between states, the sum alone is {num(between_a['pp_per_pp'], sign=True)} (SE {num(between_a['se_pp'])}). The sum’s correlation with log density is {ext['combined_vs_density']['corr']:.2f}.</p>
<h2>Combined index and the state</h2>
<p>Each point is a state, or the District of Columbia. The area of the point is two-party votes. The horizontal axis is the vote-weighted mean of the sum inside that jurisdiction.</p>
<div class="chart-card">{between}</div>
<p class="axis-name"><span>Y · Democratic two-party share, %</span><span>X · Combined index, state mean</span></p>
<p class="fine cap">Measured. State means of the substate-region index.</p>
<p>The next chart is the same sum after subtracting each state’s vote-weighted mean. The vertical axis is the region’s Democratic share minus the state’s, in percentage points. Fifths are fifths of that within-state index.</p>
<div class="chart-card">{within}</div>
<p class="axis-name"><span>Y · Democratic share minus the state mean, points</span><span>X · Within-state quintile of the index</span></p>
<p class="fine cap">Measured. The unit is the substate region, demeaned by state.</p>

<h2>Combined index and density</h2>
<p>Fifths of regional log density. The index in those fifths is {ext['combined_vs_density']['bins'][0]['combined']:+.2f}, {ext['combined_vs_density']['bins'][1]['combined']:+.2f}, {ext['combined_vs_density']['bins'][2]['combined']:+.2f}, {ext['combined_vs_density']['bins'][3]['combined']:+.2f}, {ext['combined_vs_density']['bins'][4]['combined']:+.2f}. Democratic share in the same fifths runs from {ext['combined_vs_density']['bins'][0]['dem2']*100:.1f}% to {ext['combined_vs_density']['bins'][4]['dem2']*100:.1f}%.</p>
<div class="chart-card">{dens}</div>
<p class="axis-name"><span>Y · Combined index</span><span>X · People per km², vote-weighted mean of the fifth</span></p>
<p class="fine cap">Measured. The unit is the substate region.</p>

<h2>Laboratory results</h2>
<p>Kloft and colleagues (PNAS, 2020) vaporized 300 μg of THC per kilogram. On the immediate test, a suggested false detail in the eyewitness scene was accepted <strong>19%</strong> of the time after THC (SE 0.04) and <strong>8%</strong> after placebo (SE 0.02). Related-word false alarms were <strong>42%</strong> (SE 0.03) and <strong>27%</strong> (SE 0.03). Gawrylowicz and colleagues (Psychopharmacology, 2017) gave alcohol in the lab after a filmed crime and before the misleading narrative. The marginal mean proportion of misled responses was <strong>0.25</strong> after alcohol (95% CI 0.196 to 0.300), <strong>0.22</strong> in the reverse-placebo arm (0.174 to 0.276), and <strong>0.319</strong> with no alcohol (0.266 to 0.371).</p>
<div class="chart-card">{lab_chart()}</div>
<p class="axis-name"><span>Y · Percent</span><span>Whiskers · Kloft, 1 SE in percentage points. Gawrylowicz, half the published 95% CI.</span></p>
<p class="fine cap">Laboratory data, not vote data. Kloft et al. 2020, immediate test, THC versus placebo. Gawrylowicz et al. 2017, alcohol, reverse placebo, and no alcohol.</p>

{potency_html()}

<h2>Published studies</h2>
<p>Kloft, Otgaar, Blokland, Monds, Toennes, Loftus, and Ramaekers, PNAS 2020, <a href="https://doi.org/10.1073/pnas.1920162117">10.1073/pnas.1920162117</a>. Double-blind, placebo-controlled, 64 volunteers. Immediate eyewitness suggested-detail acceptance, 19% on THC and 8% on placebo.</p>
<p>Meier, Caspi, Ambler, Harrington, Houts, Keefe, McDonald, Ward, Poulton, and Moffitt, PNAS 2012, <a href="https://doi.org/10.1073/pnas.1206820109">10.1073/pnas.1206820109</a>. Dunedin birth cohort. Adolescent-onset persistent cannabis users lost 8 IQ points from childhood to age 38.</p>
<p>Topiwala, Allan, Valkanova, and colleagues, BMJ 2017, <a href="https://doi.org/10.1136/bmj.j2353">10.1136/bmj.j2353</a>. Whitehall II imaging. More than 30 units of alcohol a week, odds ratio 5.8 for hippocampal atrophy versus abstainers (95% CI 1.8 to 18.6). Fourteen to 21 units a week, odds ratio 3.4 for right hippocampal atrophy (1.4 to 8.1). Lexical fluency declined faster above 7 units a week.</p>
<p>Sabia, Elbaz, Dugravot, Head, Shipley, Hagger-Johnson, Kivimaki, and Singh-Manoux, Archives of General Psychiatry 2012, <a href="https://doi.org/10.1001/archgenpsychiatry.2011.2016">10.1001/archgenpsychiatry.2011.2016</a>. Whitehall II. In men, current smokers’ extra 10-year decline in global cognition was −0.09 SD versus never smokers (95% CI −0.15 to −0.03).</p>
<p>Gawrylowicz, Ridley, Albery, Barnoth, and Young, Psychopharmacology 2017, <a href="https://doi.org/10.1007/s00213-017-4564-2">10.1007/s00213-017-4564-2</a>. Alcohol after the witnessed event, before the misinformation. The no-alcohol arm reported more misled responses than the alcohol and reverse-placebo arms.</p>
<p>Assefi and Garry, Psychological Science 2003, <a href="https://doi.org/10.1111/1467-9280.01422">10.1111/1467-9280.01422</a>. Everyone drank tonic. People told the drink was vodka were more swayed by misleading postevent information than people told it was tonic, F(1, 115) = 4.20.</p>
<p>Van Oorsouw, Merckelbach, and Smeets, Applied Cognitive Psychology 2015, <a href="https://doi.org/10.1002/acp.3129">10.1002/acp.3129</a>. Field study in bars, not a placebo arm. Mean BAC about 0.01%, 0.06%, and 0.16%. Severely intoxicated participants went along with suggestive cues more than sober participants.</p>
<p>Flowe, Humphries, Takarangi, Zelek, Karoğlu, Gabbert, and Hope, Applied Cognitive Psychology 2019, <a href="https://doi.org/10.1002/acp.3531">10.1002/acp.3531</a>. Alcohol versus tonic, crossed with what people were told they drank. People told they had alcohol reported fewer correct details. The paper reports they were no more likely to report misleading information.</p>
<p>Kannan and Veazie, Preventive Medicine 2018, <a href="https://doi.org/10.1016/j.ypmed.2018.06.011">10.1016/j.ypmed.2018.06.011</a>. Annenberg National Health Communication Survey, 2005–2012. Democrats and liberals had higher odds of cigarette smoking and excessive drinking than Republicans and conservatives.</p>
<p>Denham, International Journal of Drug Policy 2019, <a href="https://doi.org/10.1016/j.drugpo.2019.06.007">10.1016/j.drugpo.2019.06.007</a>. General Social Survey, 1986–2016. Party affiliation became a consistent predictor of support for marijuana legalization after 2004. That paper is about legalization attitudes.</p>

<h2>Industry contributions</h2>
<p>OpenSecrets totals, cycles 2016 through 2024. In 2024, beer, wine, and liquor gave <strong>{money(beer_total)}</strong>, of which <strong>{money(beer_dem)}</strong> went to Democrats and <strong>{money(beer_rep)}</strong> to Republicans. Tobacco’s 2024 total was <strong>{money(tob_total)}</strong>, with <strong>27.64%</strong> of candidate and party money to Democrats and <strong>71.41%</strong> to Republicans. Pharmaceuticals and health products: <strong>{money(pharma_total)}</strong>, <strong>60.04%</strong> to Democrats. Marijuana: <strong>{money(mj_total)}</strong>, <strong>61.40%</strong> to Democrats and <strong>35.12%</strong> to Republicans.</p>
<p class="fine">Gray is the cycle total. Blue is dollars to Democratic candidates and parties. Red is dollars to Republican candidates and parties. Each industry has its own vertical scale. The total includes outside spending. The party bars do not.</p>
{donation_totals(donations)}
<p class="fine cap">OpenSecrets industry totals, retrieved 2026-10-11 from the archive capture of 2026-07-16. Codes N02, A02, H04, and N09.</p>
<div class="chart-card">{parties}</div>
{party_legend}
<p class="axis-name"><span>Y · Published percent of candidate and party money to Democrats</span><span>X · Election cycle</span></p>
<p class="fine cap">The published Democratic and Republican percentages need not sum to 100. Outside spending is excluded from this split.</p>

<h2>Vote share and the donation split</h2>
<p>Left side, the density-and-age slope in points of Democratic two-party share per weighted standard deviation of the rate. Right side, the 2024 OpenSecrets split for the matching industry. Blue is the percent to Democrats. Red is the percent to Republicans. The opioid row uses Pharmaceuticals / Health Products, OpenSecrets code H04.</p>
<div class="chart-card">{compare_chart(alone, donations)}</div>
<p class="fine cap">This figure shows co-occurrence of area-level use with area-level vote share, and the published split of industry contributions to candidates and parties. It does not show intent, coordination, a deliberate strategy, or that substance use changes any individual’s vote.</p>

<div class="src">
<p>Vote join: NSDUH 2021–2023 substate small-area estimates, SAMHSA shapefile SubstateRegionData212223, and 2024 presidential votes reallocated to ZCTAs by land cover, Harvard Dataverse 10.7910/DVN/Z8TSH3, with age and education from the ACS 2019–2023 5-year file. Alaska and Hawaii are absent from the vote file.</p>
<p>Shapefile outcome list: <a href="https://www.samhsa.gov/data/sites/default/files/reports/rpt56951/2023-sae-sub-region-shape-file/2023-sae-sub-region-shape-file.htm">SAMHSA, 2021–2023 substate region shapefile description</a>. Thirty-nine outcomes. Use rates and disorder rates entered above are the ones in that list.</p>
<p>Suggestibility and IQ: Kloft et al., PNAS 2020, 10.1073/pnas.1920162117. Meier et al., PNAS 2012, 10.1073/pnas.1206820109. Potency series: NIDA / University of Mississippi analyses of DEA-seized cannabis, 1995–2022. The vote regression, the Kloft rates, the Gawrylowicz rates, and the Dunedin 8-point loss are measured. The two potency curves are predictions.</p>
<p>Contributions: OpenSecrets industry totals for Beer, Wine &amp; Liquor (N02), Tobacco (A02), Pharmaceuticals / Health Products (H04), and Marijuana (N09). Archive capture 2026-07-16, retrieved 2026-10-11. Underlying reports are Federal Election Commission filings as coded by OpenSecrets. CSV: <a href="nsduh-vote-ecological/results/industry_donations.csv">industry_donations.csv</a>.</p>
<p>Files: <a href="nsduh-vote-ecological/results/region_level.csv">region_level.csv</a>, <a href="nsduh-vote-ecological/results/results.json">results.json</a>, <a href="nsduh-vote-ecological/results/extended.json">extended.json</a>, <a href="nsduh-vote-ecological/results/quintiles.csv">quintiles.csv</a>, <a href="nsduh-vote-ecological/results/state_level.csv">state_level.csv</a>, <a href="nsduh-vote-ecological/data/substate_outcomes_212223.csv">substate_outcomes_212223.csv</a>, <a href="nsduh-vote-ecological/run_regression.py">run_regression.py</a>, <a href="nsduh-vote-ecological/fit_extended.py">fit_extended.py</a>, <a href="nsduh-vote-ecological/README.md">method note</a>.</p>
</div>
</main>
<aside class="support-cta" aria-label="Support"><a href="https://ko-fi.com/amnibro" target="_blank" rel="noopener noreferrer" class="support-link"><span class="support-ico">&#9749;</span><span>Enjoying this? <strong>Support on Ko-fi</strong></span></a></aside>
<footer>
<div class="footer-links">
<a href="../about.html">ABOUT</a>
<a href="../faq.html">FAQ</a>
<a href="../privacy.html">PRIVACY</a>
<a href="../terms.html">TERMS</a>
<a href="/contact.html">CONTACT</a>
<a href="https://ko-fi.com/amnibro" target="_blank" rel="noopener noreferrer" class="kofi-link">&#9749; SUPPORT</a>
</div>
<p>&copy; 2025-2026 Amniscient, LLC. All rights reserved.</p>
</footer>
</body>
</html>
"""
    # The f-string doubled braces for JS and CSS. The potency HTML and nav are inserted raw.
    PAGE.write_text(html)
    print("wrote", PAGE, "bytes", PAGE.stat().st_size)


if __name__ == "__main__":
    main()
