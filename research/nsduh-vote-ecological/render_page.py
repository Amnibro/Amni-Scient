#!/usr/bin/env python3
"""Write research/substance-use-vote-share.html from the fitted results."""

from __future__ import annotations

import csv
import json
import math
from pathlib import Path

import numpy as np
import statsmodels.api as sm

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
RESULTS = HERE / "results"
PAGE = ROOT / "research" / "substance-use-vote-share.html"

CHART = [
    ("mj", "Marijuana, past month", "#16A34A"),
    ("alc", "Alcohol, past month", "#2563EB"),
    ("binge", "Binge alcohol, past month", "#0891B2"),
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
.legend.naep i{width:22px;height:8px;border-radius:2px}
.legend i.open{background:transparent;border:2px solid var(--text);width:8px;height:8px;box-sizing:border-box}
#law-table th{cursor:pointer}
.table-scroll table#law-table{min-width:1180px}
#law-table td:last-child{min-width:15rem;text-align:left}
#law-table td:nth-child(5){min-width:7rem}
.corr-switch{display:flex;flex-wrap:wrap;gap:.5rem;margin:.2rem 0 .7rem}
.heat-table{border-collapse:separate;border-spacing:3px;width:max-content;max-width:100%}
.heat-table th{font-size:.72rem;text-align:center;white-space:nowrap}
.heat-table th.rowhead,.heat-table td.rowhead{text-align:left;white-space:nowrap;background:transparent;color:var(--text);font-weight:650}
.heat-table td.heat{text-align:center;min-width:5.4rem;padding:.38rem .3rem;line-height:1.15;white-space:nowrap}
.heat-table .hv{display:block;font-size:.95rem;font-weight:800;font-variant-numeric:tabular-nums}
.heat-table .hn,.heat-table .hs{display:block;margin-top:.12rem;font-size:.68rem;font-weight:650;font-variant-numeric:tabular-nums}
.mj-panel{display:none}
.mj-panel.on{display:block}
.r-set{display:none}
.r-set.on{display:block}
.r-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;max-width:860px;margin:.4rem 0 .6rem}
.r-card{background:var(--panel);border:1px solid var(--border);border-radius:4px;padding:.45rem .4rem .15rem}
.r-card h3{margin:0 0 .1rem;font-size:.78rem;font-weight:750;color:var(--text)}
.r-card .chart{width:100%}
details.secondary-block,details.methods-block{margin:1.5rem 0 1.8rem;max-width:860px}
details.secondary-block summary,details.methods-block summary{cursor:pointer;font-weight:750;color:var(--text);font-size:1.05rem}
details.secondary-block[open] summary,details.methods-block[open] summary{margin-bottom:.7rem}
details.methods-block{max-width:42rem}
.slope-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;max-width:860px;margin:.4rem 0 .6rem}
.slope-card{background:var(--panel);border:1px solid var(--border);border-radius:4px;padding:.6rem .55rem .35rem}
.slope-k{display:flex;align-items:center;gap:.45rem;margin:0;font-size:.74rem;font-weight:700;letter-spacing:.02em;color:var(--text);line-height:1.3}
.slope-k i{width:14px;height:3px;border-radius:1px;display:inline-block;flex:none}
.slope-v{margin:.2rem 0 .15rem;font-size:1.45rem;font-weight:800;letter-spacing:-.03em;line-height:1;color:var(--text)}
.slope-v span{display:block;margin-top:.28rem;font-size:.68rem;font-weight:650;letter-spacing:.04em;text-transform:uppercase;color:var(--dim);line-height:1.35}
.contour-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;max-width:860px;margin:.4rem 0 .2rem}
.contour-card{background:#F6F0E4;border:1px solid #E4D9C8;border-radius:4px;padding:.45rem .4rem .25rem}
.contour-card p{max-width:none;margin:0 0 .2rem;font-size:.74rem;font-weight:700;color:#120C03;line-height:1.3}
.contour-card .chart .tick{fill:#120C03}
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


def dollars(n):
    from decimal import Decimal

    d = Decimal(str(n))
    if d == d.to_integral():
        return f"${d:,.0f}"
    return f"${d:,.2f}"


def esc(s):
    return str(s).replace("&", "&amp;").replace("<", "&lt;")


def _span_ticks(lo, hi, step):
    start = np.ceil((lo - 1e-9) / step) * step
    ticks = []
    v = float(start)
    while v <= hi + 1e-9:
        ticks.append(int(round(v)))
        v += step
    return ticks


def fit_share(rows, xkey):
    """Vote-weighted WLS of Democratic two-party share (percent) on xkey. HC1 slope SE."""
    x = np.array([float(r[xkey]) for r in rows], dtype=float)
    y = np.array([float(r["dem2"]) * 100 for r in rows], dtype=float)
    w = np.array([float(r["two_party"]) for r in rows], dtype=float)
    res = sm.WLS(y, sm.add_constant(x), weights=w).fit(cov_type="HC1")
    return float(res.params[0]), float(res.params[1]), float(res.bse[1]), x, y, w


def _clip_line(a, b, x_lo, x_hi, y_lo, y_hi):
    pts = []

    def push(x, y):
        if x_lo - 1e-6 <= x <= x_hi + 1e-6 and y_lo - 1e-6 <= y <= y_hi + 1e-6:
            p = (min(x_hi, max(x_lo, x)), min(y_hi, max(y_lo, y)))
            if not any(abs(p[0] - q[0]) < 1e-6 and abs(p[1] - q[1]) < 1e-6 for q in pts):
                pts.append(p)

    for x in (x_lo, x_hi):
        push(x, a + b * x)
    if abs(b) > 1e-12:
        for y in (y_lo, y_hi):
            push((y - a) / b, y)
    if len(pts) < 2:
        return None
    pts.sort()
    return pts[0], pts[-1]


def _scatter(xs, ys, wts, color, x0, x1, y0, y1, xticks, yticks, a, b, square=False, opacity=0.34, r0=1.35, r1=5.0):
    left, right, top, bottom = 48, 14, 12, 28
    plot = None
    if square:
        plot = 248
        left, right, top, bottom = 36, 8, 8, 24
        w = left + plot + right
        h = top + plot + bottom
        pw = ph = plot
    else:
        w, h = 720, 360
        pw, ph = w - left - right, h - top - bottom
    def X(v):
        return left + (float(v) - x0) / (x1 - x0) * pw

    def Y(v):
        return top + (y1 - float(v)) / (y1 - y0) * ph

    parts = [f'<svg viewBox="0 0 {w} {h}" role="img" class="chart">']
    for t in yticks:
        parts.append(f'<line x1="{left}" y1="{Y(t):.1f}" x2="{w - right:.1f}" y2="{Y(t):.1f}" class="grid"/>')
        parts.append(f'<text x="{left - 6}" y="{Y(t) + 3:.1f}" text-anchor="end" class="tick">{t:g}</text>')
    for t in xticks:
        anchor = "start" if t == xticks[0] else ("end" if t == xticks[-1] else "middle")
        parts.append(f'<text x="{X(t):.1f}" y="{h - 8}" text-anchor="{anchor}" class="tick">{t:g}</text>')
    parts.append(f'<line x1="{left}" y1="{top}" x2="{left}" y2="{h - bottom}" class="axis"/>')
    parts.append(f'<line x1="{left}" y1="{h - bottom}" x2="{w - right}" y2="{h - bottom}" class="axis"/>')
    m = float(max(wts))
    order = np.argsort(np.asarray(wts))
    for i in order:
        rad = r0 + r1 * (float(wts[i]) / m) ** 0.5
        parts.append(
            f'<circle cx="{X(xs[i]):.1f}" cy="{Y(ys[i]):.1f}" r="{rad:.2f}" fill="{color}" fill-opacity="{opacity}"/>'
        )
    seg = _clip_line(a, b, float(np.min(xs)), float(np.max(xs)), y0, y1)
    if seg:
        (x_a, y_a), (x_b, y_b) = seg
        parts.append(
            f'<line x1="{X(x_a):.1f}" y1="{Y(y_a):.1f}" x2="{X(x_b):.1f}" y2="{Y(y_b):.1f}" stroke="{color}" stroke-width="2.4"/>'
        )
    parts.append("</svg>")
    return "\n".join(parts)


def rate_panels(regions):
    cards = []
    fits = {}
    for key, label, color in CHART:
        a, b, se, x, y, w = fit_share(regions, key)
        fits[key] = {"intercept": a, "slope": b, "se": se}
        svg = _scatter(
            x, y, w, color,
            0, 100, 0, 100,
            (0, 50, 100), (0, 50, 100),
            a, b, square=True,
        )
        cards.append(
            "<div class=\"slope-card\">"
            f'<p class="slope-k"><i style="background:{color}"></i>{esc(label)}</p>'
            f'<p class="slope-v">{num(b, sign=True)}<span>points of share per point of use · SE {num(se)}</span></p>'
            f"{svg}</div>"
        )
    return '<div class="slope-grid">' + "".join(cards) + "</div>", fits


def density_chart(regions):
    a, b, se, x, y, w = fit_share(regions, "ln_dens")
    x0, x1 = 0, 11
    svg = _scatter(x, y, w, "#2563EB", x0, x1, 0, 100, (0, 2, 4, 6, 8, 10), (0, 25, 50, 75, 100), a, b, opacity=0.32, r0=1.2, r1=4.6)
    return svg, a, b, se


DUMB_LABEL = {
    "mj": "Marijuana",
    "alc": "Alcohol",
    "binge": "Binge alcohol",
    "iem": "Other illicit",
    "coc": "Cocaine",
    "opin": "Opioid misuse",
    "pnr": "Pain relievers",
    "met": "Methamphetamine",
    "hal": "Hallucinogens",
    "her": "Heroin, 18+",
}


def _mix(c1, c2, t):
    t = max(0.0, min(1.0, float(t)))
    def rgb(c):
        return int(c[1:3], 16), int(c[3:5], 16), int(c[5:7], 16)
    r1, g1, b1 = rgb(c1)
    r2, g2, b2 = rgb(c2)
    return "#{:02X}{:02X}{:02X}".format(
        int(round(r1 + (r2 - r1) * t)),
        int(round(g1 + (g2 - g1) * t)),
        int(round(b1 + (b2 - b1) * t)),
    )


def share_color(share):
    """Diverging scale, 10 to 90, midpoint 50. Ink, paper, gold, deep gold."""
    t = (float(share) - 10.0) / 80.0
    t = max(0.0, min(1.0, t))
    ink, paper, gold, deep = "#120C03", "#F6F0E4", "#C89B4E", "#8A6318"
    if t <= 0.5:
        return _mix(ink, paper, t / 0.5)
    u = (t - 0.5) / 0.5
    if u <= 0.55:
        return _mix(paper, gold, u / 0.55)
    return _mix(gold, deep, (u - 0.55) / 0.45)


def dumbbell_chart(rows):
    """Bounded user and non-user shares on a 0–100 axis."""
    n = max(1, len(rows))
    row_h = 46
    top, bottom = 36, 32
    left, plot_w = 132, 420
    width = left + plot_w + 88
    height = top + n * row_h + bottom

    def X(v):
        return left + float(v) / 100.0 * plot_w

    parts = [
        f'<svg viewBox="0 0 {width} {height}" role="img" class="chart">',
        f'<text x="{left + plot_w + 12}" y="16" class="tick">Users</text>',
        f'<text x="{width - 8}" y="16" text-anchor="end" class="tick">Ratio</text>',
    ]
    for t in (0, 50, 100):
        parts.append(f'<line x1="{X(t):.1f}" y1="{top - 8}" x2="{X(t):.1f}" y2="{height - bottom}" class="grid"/>')
        parts.append(f'<text x="{X(t):.1f}" y="{height - 10}" text-anchor="middle" class="tick">{t}</text>')
    parts.append(f'<line x1="{X(0):.1f}" y1="{height - bottom}" x2="{X(100):.1f}" y2="{height - bottom}" class="axis"/>')
    for i, row in enumerate(rows):
        y = top + i * row_h + 16
        non = float(row["nonuser_share"])
        user = float(row["user_share"])
        nx, ux = X(non), X(user)
        parts.append(f'<text x="6" y="{y + 4:.1f}" class="lab">{esc(DUMB_LABEL.get(row["term"], row["term"]))}</text>')
        parts.append(f'<line x1="{nx:.1f}" y1="{y:.1f}" x2="{ux:.1f}" y2="{y:.1f}" class="link"/>')
        parts.append(
            f'<line x1="{X(row["nonuser_lo"]):.1f}" y1="{y:.1f}" x2="{X(row["nonuser_hi"]):.1f}" y2="{y:.1f}" class="whisk"/>'
        )
        parts.append(
            f'<line x1="{X(row["user_lo"]):.1f}" y1="{y:.1f}" x2="{X(row["user_hi"]):.1f}" y2="{y:.1f}" class="whisk"/>'
        )
        parts.append(f'<circle cx="{nx:.1f}" cy="{y:.1f}" r="5.5" class="dot"/>')
        parts.append(f'<circle cx="{ux:.1f}" cy="{y:.1f}" r="5.5" class="user"/>')
        parts.append(f'<text x="{left + plot_w + 12}" y="{y + 4:.1f}" class="lab">{num(user, 1)}</text>')
        parts.append(f'<text x="{width - 8}" y="{y + 4:.1f}" text-anchor="end" class="lab">{float(row["ratio"]):.2f}×</text>')
    parts.append("</svg>")
    return "\n".join(parts)


def percentile_chart(rows):
    """Predicted share at the 10th and 90th percentiles of observed use."""
    n = len(rows)
    row_h = 32
    top, bottom = 36, 28
    left, plot_w = 132, 420
    width = left + plot_w + 72
    height = top + n * row_h + bottom

    def X(v):
        return left + min(100.0, max(0.0, float(v))) / 100.0 * plot_w

    parts = [
        f'<svg viewBox="0 0 {width} {height}" role="img" class="chart">',
        f'<text x="{X(0):.1f}" y="16" class="tick">10th</text>',
        f'<text x="{width - 8}" y="16" text-anchor="end" class="tick">Ratio</text>',
    ]
    for t in (0, 50, 100):
        parts.append(f'<line x1="{X(t):.1f}" y1="{top - 8}" x2="{X(t):.1f}" y2="{height - bottom}" class="grid"/>')
        parts.append(f'<text x="{X(t):.1f}" y="{height - 10}" text-anchor="middle" class="tick">{t}</text>')
    parts.append(f'<line x1="{X(0):.1f}" y1="{height - bottom}" x2="{X(100):.1f}" y2="{height - bottom}" class="axis"/>')
    for i, row in enumerate(rows):
        y = top + i * row_h + row_h / 2
        a, b = float(row["p10_share"]), float(row["p90_share"])
        parts.append(f'<text x="6" y="{y + 4:.1f}" class="lab">{esc(DUMB_LABEL.get(row["term"], row["term"]))}</text>')
        parts.append(f'<line x1="{X(a):.1f}" y1="{y:.1f}" x2="{X(b):.1f}" y2="{y:.1f}" class="link"/>')
        parts.append(
            f'<line x1="{X(row["p10_lo"]):.1f}" y1="{y:.1f}" x2="{X(row["p10_hi"]):.1f}" y2="{y:.1f}" class="whisk"/>'
        )
        parts.append(
            f'<line x1="{X(row["p90_lo"]):.1f}" y1="{y:.1f}" x2="{X(row["p90_hi"]):.1f}" y2="{y:.1f}" class="whisk"/>'
        )
        parts.append(f'<circle cx="{X(a):.1f}" cy="{y:.1f}" r="4.5" class="dot"/>')
        parts.append(f'<circle cx="{X(b):.1f}" cy="{y:.1f}" r="4.5" class="user"/>')
        parts.append(f'<text x="{width - 8}" y="{y + 4:.1f}" text-anchor="end" class="lab">{float(row["ratio"]):.2f}×</text>')
    parts.append("</svg>")
    return "\n".join(parts)


def goodman_table(rows):
    body = []
    for row in rows:
        body.append(
            "<tr>"
            f"<td>{esc(row['label'])}</td>"
            f"<td>{num(row['nonuser_share'], 1)}</td>"
            f"<td>{num(row['nonuser_lo'], 1)}–{num(row['nonuser_hi'], 1)}</td>"
            f"<td>{num(row['user_share'], 1)}</td>"
            f"<td>{num(row['user_lo'], 1)}–{num(row['user_hi'], 1)}</td>"
            f"<td>{num(row['dem_majority_rate'], 2)}</td>"
            f"<td>{num(row['rep_majority_rate'], 2)}</td>"
            f"<td>{float(row['ratio']):.2f}×</td>"
            "</tr>"
        )
    return "\n".join(body)


def percentile_table(rows):
    body = []
    for row in rows:
        body.append(
            "<tr>"
            f"<td>{esc(row['label'])}</td>"
            f"<td>{num(row['p10_use'], 2)}</td>"
            f"<td>{num(row['p10_share'], 1)}</td>"
            f"<td>{num(row['p10_lo'], 1)}–{num(row['p10_hi'], 1)}</td>"
            f"<td>{num(row['p90_use'], 2)}</td>"
            f"<td>{num(row['p90_share'], 1)}</td>"
            f"<td>{num(row['p90_lo'], 1)}–{num(row['p90_hi'], 1)}</td>"
            f"<td>{float(row['ratio']):.2f}×</td>"
            "</tr>"
        )
    return "\n".join(body)


def _wquantile(values, weights, q):
    order = np.argsort(values)
    v = np.asarray(values, dtype=float)[order]
    w = np.asarray(weights, dtype=float)[order]
    cw = np.cumsum(w)
    return float(v[min(len(v) - 1, int(np.searchsorted(cw, q * w.sum(), side="left")))])


def _local_surface(x, y, z, w, gx, gy, span=0.45, min_n=12):
    sx = float(np.std(x)) or 1.0
    sy = float(np.std(y)) or 1.0
    dx = (gx[:, None] - x[None, :]) / sx
    dy = (gy[:, None] - y[None, :]) / sy
    dist = np.hypot(dx, dy)
    out = np.full(gx.shape[0], np.nan)
    target = span * float(w.sum())
    for i in range(gx.shape[0]):
        order = np.argsort(dist[i])
        cw = np.cumsum(w[order])
        k = int(np.searchsorted(cw, target)) + 1
        k = max(min_n, min(len(x), k))
        sel = order[:k]
        dmax = dist[i, sel[-1]]
        if dmax <= 1e-9:
            out[i] = float(np.average(z[sel], weights=w[sel]))
            continue
        u = dist[i, sel] / dmax
        tri = np.clip(1.0 - u ** 3, 0.0, None) ** 3
        ww = w[sel] * tri
        if float(ww.sum()) <= 0 or int(np.count_nonzero(ww)) < min_n:
            continue
        design = np.column_stack([np.ones(k), x[sel] - gx[i], y[sel] - gy[i]])
        sw = np.sqrt(ww)
        beta = np.linalg.lstsq(design * sw[:, None], z[sel] * sw, rcond=None)[0]
        out[i] = float(beta[0])
    return out


def contour_panels(regions):
    """Marijuana × alcohol surface of Democratic share, by density tercile."""
    mj = np.array([float(r["mj"]) for r in regions])
    alc = np.array([float(r["alc"]) for r in regions])
    share = np.array([float(r["dem2"]) * 100 for r in regions])
    ln = np.array([float(r["ln_dens"]) for r in regions])
    w = np.array([float(r["two_party"]) for r in regions])
    c1 = _wquantile(ln, w, 1 / 3)
    c2 = _wquantile(ln, w, 2 / 3)
    bands = [
        ("Low density", ln <= c1, 0.0, c1),
        ("Medium density", (ln > c1) & (ln <= c2), c1, c2),
        ("High density", ln > c2, c2, None),
    ]
    summaries = []
    for title, mask, lo, hi in bands:
        summaries.append(
            {
                "title": title,
                "ln_lo": float(lo),
                "ln_hi": None if hi is None else float(hi),
                "people_lo": float(np.exp(lo)),
                "people_hi": None if hi is None else float(np.exp(hi)),
                "n": int(mask.sum()),
                "votes": float(w[mask].sum()),
            }
        )
    return _contour_svgs(summaries, bands, mj, alc, share, w)


def _contour_svgs(summaries, bands, mj, alc, share, w):
    from scipy.spatial import ConvexHull

    x0, x1, y0, y1 = 0.0, 36.0, 0.0, 80.0
    nx, ny = 28, 36
    xs = np.linspace(x0, x1, nx)
    ys = np.linspace(y0, y1, ny)
    cards = []
    for (title, mask, _lo, _hi), s in zip(bands, summaries):
        x, y, z, ww = mj[mask], alc[mask], share[mask], w[mask]
        hull = ConvexHull(np.column_stack([x, y]))
        eq = hull.equations
        flat_x, flat_y = np.meshgrid(xs, ys, indexing="xy")
        flat_x, flat_y = flat_x.ravel(), flat_y.ravel()
        inside = np.all(eq[:, 0] * flat_x[:, None] + eq[:, 1] * flat_y[:, None] + eq[:, 2] <= 1e-8, axis=1)
        pred = np.full(flat_x.shape, np.nan)
        pred[inside] = _local_surface(x, y, z, ww, flat_x[inside], flat_y[inside])
        finite = pred[np.isfinite(pred)]
        s["share_min"] = float(np.min(finite))
        s["share_max"] = float(np.max(finite))
        pw, ph = 210, 250
        left, right, top, bottom = 32, 8, 8, 22
        W, H = left + pw + right, top + ph + bottom

        def X(v, left=left, pw=pw):
            return left + (float(v) - x0) / (x1 - x0) * pw

        def Y(v, top=top, ph=ph):
            return top + (y1 - float(v)) / (y1 - y0) * ph

        parts = [f'<svg viewBox="0 0 {W} {H}" role="img" class="chart">']
        parts.append(f'<rect x="0" y="0" width="{W}" height="{H}" fill="#F6F0E4"/>')
        cell_w = (X(xs[1]) - X(xs[0]))
        cell_h = (Y(ys[0]) - Y(ys[1]))
        for j in range(ny):
            for i in range(nx):
                val = pred[j * nx + i]
                if not np.isfinite(val):
                    continue
                parts.append(
                    f'<rect x="{X(xs[i]) - cell_w / 2:.2f}" y="{Y(ys[j]) - cell_h / 2:.2f}" '
                    f'width="{cell_w + 0.35:.2f}" height="{cell_h + 0.35:.2f}" fill="{share_color(val)}"/>'
                )
        for t in (0, 10, 20, 30):
            parts.append(f'<text x="{X(t):.1f}" y="{H - 6}" text-anchor="middle" class="tick">{t}</text>')
        for t in (0, 20, 40, 60, 80):
            parts.append(f'<text x="{left - 4}" y="{Y(t) + 3:.1f}" text-anchor="end" class="tick">{t}</text>')
        parts.append(f'<line x1="{left}" y1="{top}" x2="{left}" y2="{H - bottom}" stroke="#120C03" stroke-width="1"/>')
        parts.append(f'<line x1="{left}" y1="{H - bottom}" x2="{W - right}" y2="{H - bottom}" stroke="#120C03" stroke-width="1"/>')
        parts.append(f'<text x="{X(1.2):.1f}" y="{Y(7):.1f}" class="tick" font-weight="700">Non-users</text>')
        parts.append("</svg>")
        if s["people_hi"] is None:
            dens = f"above {s['people_lo']:.0f} people/km²"
        else:
            # first band starts at the sample minimum, labeled from the cut
            dens = f"up to {s['people_hi']:.0f} people/km²" if s["title"].startswith("Low") else f"{s['people_lo']:.0f}–{s['people_hi']:.0f} people/km²"
        cards.append(
            f'<div class="contour-card"><p>{esc(title)}</p>'
            f'<p style="font-weight:500;font-size:.68rem;letter-spacing:.02em">{esc(dens)} · {s["share_min"]:.0f}–{s["share_max"]:.0f}% share</p>'
            f'{"".join(parts)}</div>'
        )
    legend = _share_legend()
    return '<div class="contour-grid" id="contour-panels">' + "".join(cards) + "</div>" + legend, summaries


def _share_legend():
    stops = [share_color(v) for v in np.linspace(10, 90, 48)]
    rects = []
    width = 720
    for i, col in enumerate(stops):
        rects.append(f'<rect x="{i * (width / 48):.2f}" y="0" width="{width / 48 + 0.4:.2f}" height="14" fill="{col}"/>')
    ticks = []
    for v in (10, 30, 50, 70, 90):
        x = (v - 10) / 80 * width
        if v == 10:
            anchor, x = "start", 2
        elif v == 90:
            anchor, x = "end", width - 2
        else:
            anchor = "middle"
        ticks.append(f'<text x="{x:.1f}" y="28" text-anchor="{anchor}" fill="#120C03" font-size="11" font-family="Archivo,sans-serif">{v}</text>')
    return (
        f'<svg viewBox="0 0 {width} 36" role="img" class="chart" style="background:#F6F0E4;border-radius:4px;margin-top:8px">'
        + "".join(rects) + "".join(ticks) + "</svg>"
        '<p class="axis-name"><span>Color · Democratic two-party share. 50 is the midpoint. Ink is below 50. Gold is above 50.</span></p>'
    )


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


def category_chart(rows):
    order = [
        "Beer, Wine & Liquor",
        "Pharmaceuticals / Health Products",
        "Marijuana",
    ]
    cat_order = ["Federal contributions", "Federal lobbying", "State ballot support"]
    colors = {
        "Federal contributions": "#64748B",
        "Federal lobbying": "#0F766E",
        "State ballot support": "#16A34A",
    }
    panels = []
    w = 720
    bar_x = 200
    bar_max = 210
    for ind in order:
        sub = [r for r in rows if r["industry"] == ind and r["category"] in cat_order]
        sub.sort(key=lambda r: cat_order.index(r["category"]))
        ymax = max(float(r["amount"]) for r in sub)
        row_h = 40
        top = 28
        h = top + len(sub) * row_h + 10
        parts = [f'<svg viewBox="0 0 {w} {h}" role="img" class="chart">']
        parts.append(f'<text x="8" y="16" class="tick">{esc(ind)}</text>')
        for i, r in enumerate(sub):
            y = top + i * row_h
            amt = float(r["amount"])
            bw = 0 if ymax == 0 else amt / ymax * bar_max
            if amt > 0:
                bw = max(bw, 2)
            parts.append(f'<text x="8" y="{y + 18}" class="tick">{esc(r["category"])}</text>')
            parts.append(
                f'<rect x="{bar_x}" y="{y + 6}" width="{bw:.1f}" height="16" fill="{colors[r["category"]]}"/>'
            )
            if r["category"] == "Federal contributions":
                party = f'{float(r["pct_democrats"]):.2f}% D / {float(r["pct_republicans"]):.2f}% R'
            else:
                party = "no party"
            label = f"{dollars(r['amount'])} · {party}"
            parts.append(f'<text x="{bar_x + bw + 8:.1f}" y="{y + 18}" class="tick">{esc(label)}</text>')
        parts.append("</svg>")
        panels.append("\n".join(parts))
    legend = (
        '<div class="legend">'
        '<span><i style="background:#64748B;height:10px"></i>Federal contributions, party split of candidate and party money</span>'
        '<span><i style="background:#0F766E;height:10px"></i>Federal lobbying, no party</span>'
        '<span><i style="background:#16A34A;height:10px"></i>State ballot support, no party</span>'
        "</div>"
    )
    return legend + "\n" + "\n".join(f'<div class="chart-card">{p}</div>' for p in panels)


def spending_table(rows):
    body = []
    for r in rows:
        body.append(
            "<tr>"
            f"<td>{esc(r['industry'])}</td>"
            f"<td>{esc(r['category'])}</td>"
            f'<td class="num">{dollars(r["amount"])}</td>'
            f"<td>{esc(r['party'])}</td>"
            "</tr>"
        )
    return "\n".join(body)


def ballot_table():
    from industry_spending import BALLOT

    body = []
    for r in BALLOT:
        if r["counted"] != "yes":
            continue
        body.append(
            "<tr>"
            f"<td>{esc(r['state'])}</td>"
            f"<td>{esc(r['measure'])}</td>"
            f"<td>{esc(r['committee'])}</td>"
            f'<td class="num">{dollars(r["total"])}</td>'
            f"<td>no party</td>"
            "</tr>"
        )
    return "\n".join(body)


def compare_chart(alone, rows):
    vote = [
        ("Marijuana", alone["mj"]["pp_per_sd"]),
        ("Alcohol", alone["alc"]["pp_per_sd"]),
        ("Opioid misuse", alone["opin"]["pp_per_sd"]),
    ]
    ind_of = {
        "Marijuana": "Marijuana",
        "Alcohol": "Beer, Wine & Liquor",
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
        y = 70 + i * 60
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


# Published contrasts, standard-deviation units. Paul intervals are the published
# unstandardized interval times that row's published β/b. IQ rows are the
# published IQ-point difference divided by 15.
CHILD_EFFECTS = [
    {
        "study": "Paul et al. 2021",
        "doi": "10.1001/jamapsychiatry.2020.2902",
        "sample": "ABCD, 11,249 children, mean age 9.9",
        "exposure": "Prenatal cannabis, after knowledge vs none",
        "kind": "prenatal cannabis",
        "outcome": "NIH Toolbox cognition, unadjusted",
        "effect": -0.061,
        "lo": -5.1 * (0.061 / 3.89),
        "hi": -2.7 * (0.061 / 3.89),
        "iq": None,
        "note": "β −0.061; b −3.89 (−5.1 to −2.7)",
    },
    {
        "study": "Paul et al. 2021",
        "doi": "10.1001/jamapsychiatry.2020.2902",
        "sample": "ABCD, 11,249 children, mean age 9.9",
        "exposure": "Prenatal cannabis, before knowledge vs none",
        "kind": "prenatal cannabis",
        "outcome": "NIH Toolbox cognition, unadjusted",
        "effect": -0.022,
        "lo": -1.9 * (0.022 / 1.06),
        "hi": -0.17 * (0.022 / 1.06),
        "iq": None,
        "note": "β −0.022; b −1.06 (−1.9 to −0.17)",
    },
    {
        "study": "Paul et al. 2021",
        "doi": "10.1001/jamapsychiatry.2020.2902",
        "sample": "ABCD, 8,000 children with covariates",
        "exposure": "Prenatal cannabis, after knowledge vs none",
        "kind": "prenatal cannabis",
        "outcome": "NIH Toolbox cognition, adjusted",
        "effect": -0.011,
        "lo": -2.3 * (0.011 / 0.817),
        "hi": 0.65 * (0.011 / 0.817),
        "iq": None,
        "note": "β −0.011; b −0.817 (−2.3 to 0.65)",
    },
    {
        "study": "Paul et al. 2021",
        "doi": "10.1001/jamapsychiatry.2020.2902",
        "sample": "ABCD, 8,000 children with covariates",
        "exposure": "Prenatal cannabis, before knowledge vs none",
        "kind": "prenatal cannabis",
        "outcome": "NIH Toolbox cognition, adjusted",
        "effect": 0.019,
        "lo": -0.02 * (0.019 / 0.907),
        "hi": 1.8 * (0.019 / 0.907),
        "iq": None,
        "note": "β 0.019; b 0.907 (−0.02 to 1.8)",
    },
    {
        "study": "Paul et al. 2021",
        "doi": "10.1001/jamapsychiatry.2020.2902",
        "sample": "ABCD, 8,000 children with covariates",
        "exposure": "Prenatal cannabis, after vs before knowledge",
        "kind": "prenatal cannabis",
        "outcome": "NIH Toolbox cognition, adjusted",
        "effect": -0.023,
        "lo": -3.4 * (0.023 / 1.72),
        "hi": -0.06 * (0.023 / 1.72),
        "iq": None,
        "note": "β −0.023; b −1.72 (−3.4 to −0.06)",
    },
    {
        "study": "Flak et al. 2014",
        "doi": "10.1111/acer.12214",
        "sample": "8 studies, about 10,000 children, 6 months to 14 years",
        "exposure": "Prenatal alcohol, any binge vs none",
        "kind": "prenatal alcohol",
        "outcome": "Cognition, Cohen's d",
        "effect": -0.13,
        "lo": -0.21,
        "hi": -0.05,
        "iq": None,
        "note": "Cohen's d −0.13 (−0.21 to −0.05)",
    },
    {
        "study": "Flak et al. 2014",
        "doi": "10.1111/acer.12214",
        "sample": "Cohort studies in the same meta-analysis",
        "exposure": "Prenatal alcohol, mild to moderate vs none",
        "kind": "prenatal alcohol",
        "outcome": "Cognition, Cohen's d",
        "effect": 0.04,
        "lo": 0.00,
        "hi": 0.08,
        "iq": None,
        "note": "Cohen's d 0.04 (0.00 to 0.08)",
    },
    {
        "study": "Yang and Kramer 2012",
        "doi": "10.1093/ije/dys071",
        "sample": "Belarus PROBIT, 11,305 children, age 6.5, WASI",
        "exposure": "Household, father weekly moderate drinking vs light",
        "kind": "household alcohol",
        "outcome": "Full-scale IQ",
        "effect": -1.6 / 15,
        "lo": -2.5 / 15,
        "hi": -0.9 / 15,
        "iq": -1.6,
        "note": "−1.6 IQ points (−2.5 to −0.9)",
    },
    {
        "study": "Yang and Kramer 2012",
        "doi": "10.1093/ije/dys071",
        "sample": "Belarus PROBIT, 11,305 children, age 6.5, WASI",
        "exposure": "Household, father weekly heavy drinking vs light",
        "kind": "household alcohol",
        "outcome": "Full-scale IQ",
        "effect": -2.5 / 15,
        "lo": -3.4 / 15,
        "hi": -1.6 / 15,
        "iq": -2.5,
        "note": "−2.5 IQ points (−3.4 to −1.6)",
    },
    {
        "study": "Raman, Prasad, and Appaya 2010",
        "doi": "10.4103/0019-5545.74313",
        "sample": "India, 32 children, ages 5–9, Malin’s scale",
        "exposure": "Household, alcohol-dependent father vs not",
        "kind": "household alcohol",
        "outcome": "Full-scale IQ, difference of published means",
        "effect": (96.14 - 105.1) / 15,
        "lo": None,
        "hi": None,
        "iq": 96.14 - 105.1,
        "note": "Means 96.14 vs 105.1. No interval published.",
    },
]


def _child_lines(row) -> tuple[str, str]:
    outcome = row["outcome"].lower()
    tag = ""
    if "unadjusted" in outcome:
        tag = ", unadjusted"
    elif "adjusted" in outcome:
        tag = ", adjusted"
    return row["study"] + tag, row["sample"] + " · " + row["exposure"]


def child_chart(rows) -> str:
    n = len(rows)
    row_h = 46
    right, top, bottom = 22, 18, 24
    plot_w = 280
    labels = [_child_lines(row) for row in rows]
    # 11px labels measure about 4.9px per character in Archivo. Pad so the longest line stays inside the viewBox.
    left = int(max(len(line) * 5.15 for pair in labels for line in pair)) + 18
    width = left + plot_w + right
    height = top + n * row_h + bottom
    x0, x1 = -0.75, 0.20
    colors = {
        "prenatal cannabis": "#16A34A",
        "prenatal alcohol": "#2563EB",
        "household alcohol": "#8A6318",
    }

    def X(v):
        return left + (float(v) - x0) / (x1 - x0) * plot_w

    parts = [f'<svg viewBox="0 0 {width} {height}" role="img" class="chart">']
    parts.append(f'<line x1="{X(0):.1f}" y1="{top - 4}" x2="{X(0):.1f}" y2="{height - bottom}" class="axis"/>')
    for t in (-0.6, -0.4, -0.2, 0, 0.2):
        parts.append(f'<line x1="{X(t):.1f}" y1="{top - 2}" x2="{X(t):.1f}" y2="{height - bottom}" class="grid"/>')
        parts.append(f'<text x="{X(t):.1f}" y="{height - 6}" text-anchor="middle" class="tick">{t:.1f}</text>')
    for i, row in enumerate(rows):
        y = top + i * row_h + row_h / 2
        color = colors[row["kind"]]
        study, detail = labels[i]
        parts.append(f'<text x="{left - 10}" y="{y - 2:.1f}" text-anchor="end" class="lab">{esc(study)}</text>')
        parts.append(f'<text x="{left - 10}" y="{y + 12:.1f}" text-anchor="end" class="tick">{esc(detail)}</text>')
        if row["lo"] is not None:
            parts.append(
                f'<line x1="{X(row["lo"]):.1f}" y1="{y:.1f}" x2="{X(row["hi"]):.1f}" y2="{y:.1f}" stroke="{color}" stroke-width="1.6"/>'
            )
        parts.append(f'<circle cx="{X(row["effect"]):.1f}" cy="{y:.1f}" r="4.5" fill="{color}"/>')
    parts.append("</svg>")
    return "\n".join(parts)


def child_table(rows) -> str:
    body = []
    for row in rows:
        interval = "—" if row["lo"] is None else f"{row['lo']:.3f} to {row['hi']:.3f}"
        body.append(
            "<tr>"
            f"<td>{esc(row['study'])}</td>"
            f"<td>{esc(row['sample'])}</td>"
            f"<td>{esc(row['exposure'])}</td>"
            f"<td>{esc(row['outcome'])}</td>"
            f"<td>{row['effect']:.3f}</td>"
            f"<td>{interval}</td>"
            "</tr>"
        )
    return "\n".join(body)


def child_section() -> str:
    import pandas as pd

    pd.DataFrame(CHILD_EFFECTS).to_csv(RESULTS / "child_exposure.csv", index=False)
    return f"""
<h2 id="children">Children in homes where parents use</h2>
<p>Children whose mothers reported cannabis use after learning they were pregnant scored <strong>81.7</strong> on the NIH Toolbox. Children with no prenatal cannabis exposure scored <strong>86.5</strong>. Binge prenatal alcohol is Cohen’s d <strong>−0.13</strong>.</p>
<div class="chart-card" id="child-chart">{child_chart(CHILD_EFFECTS)}</div>
<p class="axis-name"><span>Y · Published contrast</span><span>X · Standard deviations, exposed minus unexposed</span></p>
<p class="fine cap">Green is prenatal cannabis. Blue is prenatal alcohol. Gold is household alcohol. The vertical line is zero.</p>
<div class="table-scroll">
<table class="cmp">
<thead><tr><th>Study</th><th>Sample</th><th>Exposure</th><th>Outcome</th><th>SD</th><th>Interval</th></tr></thead>
<tbody>
{child_table(CHILD_EFFECTS)}
</tbody>
</table>
</div>
<p class="fine">Paul et al., JAMA Psychiatry, 2021, <a href="https://doi.org/10.1001/jamapsychiatry.2020.2902">10.1001/jamapsychiatry.2020.2902</a>. Flak et al., Alcoholism: Clinical and Experimental Research, 2014, <a href="https://doi.org/10.1111/acer.12214">10.1111/acer.12214</a>. Yang and Kramer, International Journal of Epidemiology, 2012, <a href="https://doi.org/10.1093/ije/dys071">10.1093/ije/dys071</a>. Raman, Prasad, and Appaya, Indian Journal of Psychiatry, 2010, <a href="https://doi.org/10.4103/0019-5545.74313">10.4103/0019-5545.74313</a>. CSV: <a href="nsduh-vote-ecological/results/child_exposure.csv">child_exposure.csv</a>.</p>
"""


CORR_LABELS = {
    "dem2": "Democratic share",
    "ln_dens": "Log density",
    "pct_18_25": "Ages 18–25",
    "pct_12_17": "Ages 12–17",
    "pct_ba": "Bachelor's",
    "mj": "Marijuana",
    "hal": "Hallucinogens",
    "alc": "Alcohol",
    "coc": "Cocaine",
    "opin": "Opioid misuse",
    "pnr": "Pain relievers",
    "met": "Methamphetamine",
    "her": "Heroin",
    "binge": "Binge alcohol",
    "iem": "Other illicit",
    "ill": "Illicit drugs",
    "mrjyr": "Marijuana, year",
    "ualc": "Underage alcohol",
    "ubinge": "Underage binge",
}


def _rel_l(rgb: tuple[int, int, int]) -> float:
    def lin(c: int) -> float:
        x = c / 255.0
        return x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4

    return 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2])


def _contrast(bg: tuple[int, int, int], fg: tuple[int, int, int]) -> float:
    lighter, darker = sorted((_rel_l(bg), _rel_l(fg)), reverse=True)
    return (lighter + 0.05) / (darker + 0.05)


def _corr_rgb(r: float) -> tuple[int, int, int]:
    """Cream to brown or blue, stopped where #120C03 stays at 4.8:1."""
    t = min(1.0, abs(float(r)))
    cream = (246, 240, 228)
    end = (155, 122, 57) if r >= 0 else (103, 124, 193)
    return tuple(int(round(cream[i] + (end[i] - cream[i]) * t)) for i in range(3))


def _corr_ink(rgb: tuple[int, int, int]) -> str:
    dark = (18, 12, 3)
    white = (255, 255, 255)
    return "#120C03" if _contrast(rgb, dark) >= _contrast(rgb, white) else "#FFFFFF"


def _slope_svg(svg_id: str, rows: list, lo: float, hi: float, ticks: tuple[int, ...], title: str) -> str:
    n = len(rows)
    row_h = 40
    top, bottom = 28, 34
    left, plot_w, right = 188, 420, 72
    width = left + plot_w + right
    height = top + n * row_h + bottom

    def X(v):
        return left + (float(v) - lo) / (hi - lo) * plot_w

    parts = [f'<svg viewBox="0 0 {width} {height}" role="img" class="chart" id="{svg_id}">']
    parts.append(f'<text x="{left}" y="16" class="tick">{esc(title)}</text>')
    for t in ticks:
        parts.append(f'<line x1="{X(t):.1f}" y1="{top}" x2="{X(t):.1f}" y2="{height - bottom}" class="grid"/>')
        parts.append(f'<text x="{X(t):.1f}" y="{height - 12}" text-anchor="middle" class="tick">{t}</text>')
    parts.append(f'<line x1="{X(0):.1f}" y1="{top}" x2="{X(0):.1f}" y2="{height - bottom}" class="axis"/>')
    for i, (label, term, color) in enumerate(rows):
        y = top + i * row_h + 16
        if i == 3:
            parts.append(f'<line x1="8" y1="{y - 20:.1f}" x2="{width - 8}" y2="{y - 20:.1f}" class="grid"/>')
        parts.append(f'<text x="8" y="{y + 4:.1f}" class="lab">{esc(label)}</text>')
        x0, x1 = X(term["lo"]), X(term["hi"])
        parts.append(f'<line x1="{min(x0, x1):.1f}" y1="{y:.1f}" x2="{max(x0, x1):.1f}" y2="{y:.1f}" stroke="{color}" stroke-width="2.4"/>')
        parts.append(f'<line x1="{x0:.1f}" y1="{y - 5:.1f}" x2="{x0:.1f}" y2="{y + 5:.1f}" stroke="{color}" stroke-width="2"/>')
        parts.append(f'<line x1="{x1:.1f}" y1="{y - 5:.1f}" x2="{x1:.1f}" y2="{y + 5:.1f}" stroke="{color}" stroke-width="2"/>')
        parts.append(f'<circle cx="{X(term["coef"]):.1f}" cy="{y:.1f}" r="5.5" fill="{color}"/>')
        parts.append(
            f'<text x="{left + plot_w + 8}" y="{y + 4:.1f}" style="fill:{color};font-size:12px;font-weight:700;font-family:Archivo,sans-serif">{num(term["coef"], 2, sign=True)}</text>'
        )
    parts.append("</svg>")
    return "\n".join(parts)


def group_chart(groups: dict) -> str:
    omit = groups["heroin_omitted"]["terms"]
    inn = groups["heroin_in_b"]["terms"]
    heroin = groups["heroin_alone"]

    def pack(term, clustered=True):
        if clustered:
            return {"coef": term["coef"], "lo": term["lo_cluster"], "hi": term["hi_cluster"]}
        return {"coef": term["coef"], "lo": term["lo"], "hi": term["hi"]}

    pooled = [
        ("Group A", pack(omit["A"]), "#16A34A"),
        ("Group B", pack(omit["B"]), "#0D9488"),
        ("B − A", pack(omit["diff"]), "#8A6318"),
        ("Group A, heroin in B", pack(inn["A"]), "#16A34A"),
        ("Group B, heroin in B", pack(inn["B"]), "#0D9488"),
        ("B − A, heroin in B", pack(inn["diff"]), "#8A6318"),
    ]
    alone = [("Heroin alone", pack(heroin, clustered=False), "#78716C")]
    return (
        _slope_svg("group-slopes", pooled, -6, 2, (-6, -4, -2, 0, 2), "Groups, clustered 95% intervals")
        + _slope_svg("heroin-slope", alone, -2, 18, (0, 4, 8, 12, 16), "Heroin alone, HC1 interval, separate scale")
    )


def group_table(groups: dict) -> str:
    omit = groups["heroin_omitted"]
    inn = groups["heroin_in_b"]
    heroin = groups["heroin_alone"]
    specs = [
        ("Heroin omitted", omit, ("A", "Group A"), ("B", "Group B"), ("diff", "B − A")),
        ("Heroin in group B", inn, ("A", "Group A"), ("B", "Group B"), ("diff", "B − A")),
    ]
    lines = []
    for title, block, *terms in specs:
        for key, name in terms:
            t = block["terms"][key]
            lines.append(
                "<tr>"
                f"<td>{esc(title)}</td><td>{esc(name)}</td>"
                f"<td>{num(t['coef'], 2, sign=True)}</td>"
                f"<td>{num(t['se_cluster'])}</td>"
                f"<td>{num(t['lo_cluster'], 2, sign=True)} to {num(t['hi_cluster'], 2, sign=True)}</td>"
                f"<td>{num(t['se_hc1'])}</td>"
                f"<td>{num(t['p_cluster'], 3) if t['p_cluster'] >= 0.001 else '&lt;0.001'}</td>"
                "</tr>"
            )
    lines.append(
        "<tr>"
        "<td>Heroin alone</td><td>Heroin</td>"
        f"<td>{num(heroin['coef'], 2, sign=True)}</td>"
        "<td></td><td></td>"
        f"<td>{num(heroin['se_hc1'])}</td>"
        f"<td>{num(heroin['p_hc1'], 3) if heroin['p_hc1'] >= 0.001 else '&lt;0.001'}</td>"
        "</tr>"
    )
    return "\n".join(lines)


def _lag_when(lag) -> str:
    lag = int(lag)
    if lag == 0:
        return "in the year the exposure window ends"
    return f"{lag} years after the exposure window ends"


def _heat_td(rec, partial_known: bool) -> str:
    if rec is None:
        return (
            '<td class="heat heat-empty" style="background:#F6F0E4;color:#120C03">'
            '<span class="hv">—</span><span class="hn"></span><span class="hs"></span></td>'
        )
    rgb_r = _corr_rgb(rec.r)
    fill_r = "#{:02X}{:02X}{:02X}".format(*rgb_r)
    ink_r = _corr_ink(rgb_r)
    r_txt = num(rec.r, 2, sign=True)
    n_txt = str(int(rec.n))
    if partial_known and np.isfinite(rec.partial_r):
        rgb_p = _corr_rgb(rec.partial_r)
        fill_p = "#{:02X}{:02X}{:02X}".format(*rgb_p)
        ink_p = _corr_ink(rgb_p)
        p_txt = num(rec.partial_r, 2, sign=True)
        pn = str(int(rec.partial_n))
        secondary = f"partial {p_txt}"
    else:
        fill_p, ink_p, p_txt, pn = "#F6F0E4", "#120C03", "", ""
        secondary = "partial —"
    return (
        f'<td class="heat" style="background:{fill_r};color:{ink_r}" '
        f'data-r="{r_txt}" data-p="{p_txt}" data-nr="{n_txt}" data-np="{pn}" '
        f'data-fill-r="{fill_r}" data-ink-r="{ink_r}" data-fill-p="{fill_p}" data-ink-p="{ink_p}">'
        f'<span class="hv">{r_txt}</span><span class="hn">n={n_txt}</span><span class="hs">{secondary}</span></td>'
    )


def _mj_index(table):
    by = {}
    for rec in table.itertuples(index=False):
        lag = rec.lag
        if lag == "" or (isinstance(lag, float) and not np.isfinite(lag)):
            lag = ""
        else:
            lag = int(lag)
        by[(rec.kind, rec.measure, rec.window, lag, rec.outcome)] = rec
    return by


def _ytick(v: float) -> str:
    if abs(v) < 1e-9:
        return "0"
    av = abs(v)
    if abs(av * 10 - round(av * 10)) < 1e-6:
        body = f"{av:.1f}"
    else:
        body = f"{av:.2f}".rstrip("0").rstrip(".")
    return ("+" if v > 0 else "−") + body


def _sym_limit(values: list[float]) -> float:
    """Shared symmetric half-range: pad the largest |value| and round up to a tenth."""
    finite = [abs(float(v)) for v in values if np.isfinite(v)]
    m = max(finite) if finite else 0.2
    padded = m + max(0.08, m * 0.2)
    lim = math.ceil(padded * 10 - 1e-9) / 10
    return float(min(1.0, max(0.2, lim)))


def _sym_ticks(lim: float) -> list[float]:
    half = round(lim / 2, 2)
    return [-lim, -half, 0.0, half, lim]


def _line_svg(series, x_of, y_of, x_labels, ticks, width, height, left, bottom) -> str:
    """series: (color, list of (x, y, tip) or None). One solid line, the partial correlation."""
    right, top = 14, 18
    parts = [f'<svg viewBox="0 0 {width} {height}" role="img" class="chart">']
    plot_r = height - bottom
    for tick in ticks:
        y = y_of(tick)
        parts.append(f'<line x1="{left}" y1="{y:.1f}" x2="{width - right}" y2="{y:.1f}" class="grid"/>')
        parts.append(f'<text x="{left - 6}" y="{y + 3:.1f}" text-anchor="end" class="tick">{_ytick(tick)}</text>')
    zy = y_of(0)
    parts.append(f'<line x1="{left}" y1="{zy:.1f}" x2="{width - right}" y2="{zy:.1f}" class="axis" stroke-width="1.6"/>')
    parts.append(f'<line x1="{left}" y1="{top}" x2="{left}" y2="{plot_r}" class="axis"/>')
    for x, label in x_labels:
        parts.append(f'<text x="{x_of(x):.1f}" y="{height - 8}" text-anchor="middle" class="tick">{esc(label)}</text>')

    for color, pts in series:
        cur: list[tuple[float, float, str]] = []

        def flush(cur=cur, color=color):
            if len(cur) >= 2:
                coords = " ".join(f"{x_of(x):.1f},{y_of(y):.1f}" for x, y, _tip in cur)
                parts.append(
                    f'<polyline points="{coords}" fill="none" stroke="{color}" stroke-width="2.2" stroke-linejoin="round"/>'
                )
            for x, y, tip in cur:
                parts.append(
                    f'<circle cx="{x_of(x):.1f}" cy="{y_of(y):.1f}" r="3" fill="{color}"><title>{esc(tip)}</title></circle>'
                )

        for item in pts:
            if item is None:
                flush(cur)
                cur = []
            else:
                cur.append(item)
        flush(cur)
    parts.append("</svg>")
    return "\n".join(parts)


MJ_LINE_COLORS = (
    ("current", "#8A6318", "Current"),
    ("y1", "#0D9488", "Past 1 year"),
    ("y5", "#2563EB", "5-year mean"),
    ("y15", "#EA580C", "15-year mean"),
)


def _y_of(lim: float, height: int, bottom: int):
    top = 18

    def y_of(r):
        return top + (lim - r) / (2 * lim) * (height - bottom - top)

    return y_of


def _panel_svg(by, measure: str, outcome: str, lim: float) -> str:
    width, height, left, bottom = 400, 196, 46, 28
    y_of = _y_of(lim, height, bottom)

    def x_of(lag):
        return left + (lag / 10) * (width - left - 14)

    series = []
    for wkey, color, wlabel in MJ_LINE_COLORS:
        pts = []
        for lag in (0, 2, 4, 6, 8, 10):
            rec = by.get(("panel", measure, wkey, lag, outcome))
            if rec is None or not np.isfinite(getattr(rec, "partial_r", float("nan"))):
                pts.append(None)
                continue
            tip = (
                f"{wlabel}, {lag} years. Partial r {num(rec.partial_r, 2, sign=True)}, n={int(rec.partial_n)}."
            )
            pts.append((lag, float(rec.partial_r), tip))
        series.append((color, pts))
    labels = [(lag, str(lag)) for lag in (0, 2, 4, 6, 8, 10)]
    return _line_svg(series, x_of, y_of, labels, _sym_ticks(lim), width, height, left, bottom)


def _cohort_svg(by, lim: float) -> str:
    width, height, left, bottom = 640, 210, 46, 32
    outcomes = [("math8", "Math"), ("read8", "Reading"), ("comp8", "Composite")]
    colors = {"mj": "#16A34A", "mrjyr": "#8A6318"}
    labels_m = {"mj": "Past month", "mrjyr": "Past year"}
    y_of = _y_of(lim, height, bottom)

    def x_of(i):
        return left + (i / 2) * (width - left - 14)

    series = []
    for mkey, color in colors.items():
        pts = []
        for i, (okey, olabel) in enumerate(outcomes):
            rec = by.get(("cohort", mkey, "cohort", "", okey))
            if rec is None or not np.isfinite(getattr(rec, "partial_r", float("nan"))):
                pts.append(None)
                continue
            tip = (
                f"{labels_m[mkey]}, grade 8 {olabel.lower()}, birth to age 5. "
                f"Partial r {num(rec.partial_r, 2, sign=True)}, n={int(rec.partial_n)}."
            )
            pts.append((i, float(rec.partial_r), tip))
        series.append((color, pts))
    labels = [(i, lab) for i, (_k, lab) in enumerate(outcomes)]
    return _line_svg(series, x_of, y_of, labels, _sym_ticks(lim), width, height, left, bottom)


def mj_corr_section(table) -> str:
    from over_time import MJ_LAGS, MJ_MEASURES, MJ_OUTCOMES, MJ_WINDOW_DEFS

    by = _mj_index(table)
    panel = table[table["kind"] == "panel"].copy()
    cohort = table[table["kind"] == "cohort"].copy()
    pneg = panel.loc[panel["partial_r"].idxmin()]
    ppos = panel.loc[panel["partial_r"].idxmax()]
    cneg = cohort.loc[cohort["partial_r"].idxmin()]
    limits = {}
    for mkey, _code, _mlabel in MJ_MEASURES:
        vals = panel.loc[panel["measure"] == mkey, "partial_r"].tolist()
        limits[mkey] = _sym_limit(vals)
    cohort_lim = _sym_limit(cohort["partial_r"].tolist())
    chart_outcomes = (
        ("math4", "Grade 4 math"),
        ("read4", "Grade 4 reading"),
        ("math8", "Grade 8 math"),
        ("read8", "Grade 8 reading"),
        ("comp4", "Grade 4 composite"),
        ("comp8", "Grade 8 composite"),
    )
    sets = []
    for mkey, _code, mlabel in MJ_MEASURES:
        cards = []
        for okey, olabel in chart_outcomes:
            cards.append(f'<div class="r-card"><h3>{esc(olabel)}</h3>{_panel_svg(by, mkey, okey, limits[mkey])}</div>')
        on = mkey == "mrjyr"
        sets.append(
            f'<div class="r-set{" on" if on else ""}" data-measure="{mkey}">'
            f'<div class="r-grid">{"".join(cards)}</div></div>'
        )
    switches = []
    for mkey, _code, mlabel in MJ_MEASURES:
        on = mkey == "mrjyr"
        switches.append(
            f'<button type="button" class="{"btn btn-primary" if on else "btn btn-outline"}" '
            f'data-measure="{mkey}" aria-pressed="{"true" if on else "false"}">{esc(mlabel)}</button>'
        )
    legend = "".join(
        f'<span><i style="background:{color}"></i>{esc(label)}</span>' for _k, color, label in MJ_LINE_COLORS
    )

    def heat_table(outcome, table_id):
        rows = []
        for mkey, _code, mlabel in MJ_MEASURES:
            for i, (wkey, wlabel, _span) in enumerate(MJ_WINDOW_DEFS):
                span = f' rowspan="{len(MJ_WINDOW_DEFS)}"' if i == 0 else ""
                measure_cell = f'<td class="rowhead"{span}>{esc(mlabel)}</td>' if i == 0 else ""
                cells = "".join(
                    _heat_td(by.get(("panel", mkey, wkey, int(lag), outcome)), True) for lag in MJ_LAGS
                )
                rows.append(f"<tr>{measure_cell}<td class=\"rowhead\">{esc(wlabel)}</td>{cells}</tr>")
        heads = "".join(f"<th>{int(lag)}</th>" for lag in MJ_LAGS)
        return (
            f'<div class="table-scroll"><table class="cmp heat-table" id="{table_id}">'
            f"<thead><tr><th class=\"rowhead\">Marijuana</th><th class=\"rowhead\">Window</th>{heads}</tr></thead>"
            f"<tbody>{''.join(rows)}</tbody></table></div>"
        )

    heat_switches = []
    heat_panels = []
    for okey, olabel, _grade in MJ_OUTCOMES:
        on = okey == "math4"
        heat_switches.append(
            f'<button type="button" class="{"btn btn-primary" if on else "btn btn-outline"}" '
            f'data-outcome="{okey}" aria-pressed="{"true" if on else "false"}">{esc(olabel)}</button>'
        )
        heat_panels.append(
            f'<div class="mj-panel{" on" if on else ""}" data-outcome="{okey}">{heat_table(okey, "mj-table-" + okey)}</div>'
        )
    cohort_heads = "".join(f"<th>{esc(label)}</th>" for key, label, grade in MJ_OUTCOMES if grade == 8)
    cohort_rows = []
    for mkey, _code, mlabel in MJ_MEASURES:
        cells = "".join(
            _heat_td(by.get(("cohort", mkey, "cohort", "", okey)), True)
            for okey, _label, grade in MJ_OUTCOMES
            if grade == 8
        )
        cohort_rows.append(f'<tr><td class="rowhead">{esc(mlabel)}</td>{cells}</tr>')
    cohort_table = (
        '<div class="table-scroll"><table class="cmp heat-table" id="mj-cohort">'
        f'<thead><tr><th class="rowhead">Marijuana</th>{cohort_heads}</tr></thead>'
        f"<tbody>{''.join(cohort_rows)}</tbody></table></div>"
    )
    script = """
<script>
(function(){
  var root = document.getElementById('mj-corr');
  if (!root) return;
  var measureButtons = root.querySelectorAll('button[data-measure]');
  measureButtons.forEach(function(b){
    b.addEventListener('click', function(){
      var name = b.getAttribute('data-measure');
      measureButtons.forEach(function(btn){
        var on = btn.getAttribute('data-measure') === name;
        btn.className = on ? 'btn btn-primary' : 'btn btn-outline';
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      root.querySelectorAll('.r-set').forEach(function(panel){
        panel.classList.toggle('on', panel.getAttribute('data-measure') === name);
      });
    });
  });
  var heat = document.getElementById('mj-heat');
  if (!heat) return;
  var modeButtons = heat.querySelectorAll('button[data-mode]');
  var outcomeButtons = heat.querySelectorAll('button[data-outcome]');
  function paint(mode){
    modeButtons.forEach(function(b){
      var on = b.getAttribute('data-mode') === mode;
      b.className = on ? 'btn btn-primary' : 'btn btn-outline';
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    var primary = mode === 'partial' ? 'p' : 'r';
    var secondary = mode === 'partial' ? 'r' : 'p';
    var secondaryName = mode === 'partial' ? 'r' : 'partial';
    heat.querySelectorAll('td.heat').forEach(function(td){
      if (td.classList.contains('heat-empty')) return;
      td.style.background = td.getAttribute('data-fill-' + primary);
      td.style.color = td.getAttribute('data-ink-' + primary);
      var nAttr = primary === 'p' ? 'data-np' : 'data-nr';
      td.querySelector('.hv').textContent = td.getAttribute('data-' + primary);
      td.querySelector('.hn').textContent = 'n=' + td.getAttribute(nAttr);
      td.querySelector('.hs').textContent = secondaryName + ' ' + td.getAttribute('data-' + secondary);
    });
  }
  function show(name){
    outcomeButtons.forEach(function(b){
      var on = b.getAttribute('data-outcome') === name;
      b.className = on ? 'btn btn-primary' : 'btn btn-outline';
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    heat.querySelectorAll('.mj-panel').forEach(function(panel){
      panel.classList.toggle('on', panel.getAttribute('data-outcome') === name);
    });
  }
  modeButtons.forEach(function(b){
    b.addEventListener('click', function(){ paint(b.getAttribute('data-mode')); });
  });
  outcomeButtons.forEach(function(b){
    b.addEventListener('click', function(){ show(b.getAttribute('data-outcome')); });
  });
})();
</script>
"""
    return f"""
<h2 id="correlations">Marijuana and test scores</h2>
<p>The lines are partial correlations, holding log density, age, and education. The most negative is {esc(str(pneg.measure_label).lower())} marijuana, the {esc(str(pneg.window_label).lower())}, with {esc(str(pneg.outcome_label).lower())} {_lag_when(pneg.lag)}: <strong>{num(pneg.partial_r, 2, sign=True)}</strong> (n={int(pneg.partial_n)}). The strongest positive partial correlation is {esc(str(ppos.measure_label).lower())} marijuana, the {esc(str(ppos.window_label).lower())}, with {esc(str(ppos.outcome_label).lower())} {_lag_when(ppos.lag)}: <strong>{num(ppos.partial_r, 2, sign=True)}</strong> (n={int(ppos.partial_n)}).</p>
<div id="mj-corr">
<div class="corr-switch">
{''.join(switches)}
</div>
<div class="legend">{legend}</div>
{''.join(sets)}
<p class="axis-name"><span>Y · Partial r</span><span>X · Years after the exposure window ends</span></p>
<div class="r-card" id="mj-cohort-chart">
<h3>Birth to age 5, grade 8</h3>
{_cohort_svg(by, cohort_lim)}
</div>
<p>The partial correlation of {esc(str(cneg.measure_label).lower())} marijuana from birth to about age 5 with {esc(str(cneg.outcome_label).lower())} is <strong>{num(cneg.partial_r, 2, sign=True)}</strong> (n={int(cneg.partial_n)}). Green is past month. Gold is past year.</p>
<p class="axis-name"><span>Y · Partial r</span><span>X · Grade 8 score</span></p>
<details class="secondary-block">
<summary>Correlation table</summary>
<div id="mj-heat">
<div class="corr-switch">
{''.join(heat_switches)}
</div>
<div class="corr-switch">
<button type="button" class="btn btn-primary" data-mode="r" aria-pressed="true">Pearson r</button>
<button type="button" class="btn btn-outline" data-mode="partial" aria-pressed="false">Partial r</button>
</div>
{''.join(heat_panels)}
<h3>Birth to age 5</h3>
{cohort_table}
</div>
</details>
</div>
""" + script


def window_corr_section(table) -> str:
    from over_time import WINDOW_OUTCOMES

    outcomes = list(WINDOW_OUTCOMES)
    keys = []
    for rec in table.itertuples(index=False):
        key = (rec.substance, rec.window, rec.substance_label, rec.window_label)
        if key not in keys:
            keys.append(key)
    by = {(rec.substance, rec.window, rec.outcome): rec for rec in table.itertuples(index=False)}
    top = table.loc[table["r"].abs().idxmax()]
    ptop = table.loc[table["partial_r"].abs().idxmax()]
    lead = (
        f"The strongest Pearson correlation is {esc(top.substance_label)}, {esc(top.window_label)}, "
        f"with {esc(top.outcome_label)}: <strong>{num(top.r, 2, sign=True)}</strong> (n={int(top.n)}). "
        f"The partial correlation in that cell is <strong>{num(top.partial_r, 2, sign=True)}</strong> (n={int(top.partial_n)})."
    )
    if (ptop.substance, ptop.window, ptop.outcome) != (top.substance, top.window, top.outcome):
        lead += (
            f" The strongest partial correlation is {esc(ptop.substance_label)}, {esc(ptop.window_label)}, "
            f"with {esc(ptop.outcome_label)}: <strong>{num(ptop.partial_r, 2, sign=True)}</strong> (n={int(ptop.partial_n)})."
        )
    body = []
    for substance, window, slabel, wlabel in keys:
        cells = []
        for okey, _olabel in outcomes:
            rec = by[(substance, window, okey)]
            rgb_r = _corr_rgb(rec.r)
            rgb_p = _corr_rgb(rec.partial_r)
            fill_r = "#{:02X}{:02X}{:02X}".format(*rgb_r)
            fill_p = "#{:02X}{:02X}{:02X}".format(*rgb_p)
            ink_r = _corr_ink(rgb_r)
            ink_p = _corr_ink(rgb_p)
            cells.append(
                f'<td class="heat" style="background:{fill_r};color:{ink_r}" '
                f'data-r="{num(rec.r, 2, sign=True)}" data-p="{num(rec.partial_r, 2, sign=True)}" '
                f'data-nr="{int(rec.n)}" data-np="{int(rec.partial_n)}" '
                f'data-fill-r="{fill_r}" data-ink-r="{ink_r}" data-fill-p="{fill_p}" data-ink-p="{ink_p}">'
                f'<span class="hv">{num(rec.r, 2, sign=True)}</span>'
                f'<span class="hn">n={int(rec.n)}</span>'
                f'<span class="hs">partial {num(rec.partial_r, 2, sign=True)}</span></td>'
            )
        body.append(
            "<tr>"
            f'<td class="rowhead">{esc(slabel)}</td>'
            f'<td class="rowhead">{esc(wlabel)}</td>'
            + "".join(cells)
            + "</tr>"
        )
    heads = "".join(f"<th>{esc(label)}</th>" for _key, label in outcomes)
    n_r = int(table["n"].mode().iloc[0])
    n_p = int(table["partial_n"].mode().iloc[0])
    script = """
<script>
(function(){
  var root = document.getElementById('window-corr');
  if (!root) return;
  var buttons = root.querySelectorAll('button[data-mode]');
  function paint(mode){
    buttons.forEach(function(b){
      var on = b.getAttribute('data-mode') === mode;
      b.className = on ? 'btn btn-primary' : 'btn btn-outline';
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    var primary = mode === 'partial' ? 'p' : 'r';
    var secondary = mode === 'partial' ? 'r' : 'p';
    var secondaryName = mode === 'partial' ? 'r' : 'partial';
    root.querySelectorAll('td.heat').forEach(function(td){
      td.style.background = td.getAttribute('data-fill-' + primary);
      td.style.color = td.getAttribute('data-ink-' + primary);
      var nAttr = primary === 'p' ? 'data-np' : 'data-nr';
      td.querySelector('.hv').textContent = td.getAttribute('data-' + primary);
      td.querySelector('.hn').textContent = 'n=' + td.getAttribute(nAttr);
      td.querySelector('.hs').textContent = secondaryName + ' ' + td.getAttribute('data-' + secondary);
    });
  }
  buttons.forEach(function(b){
    b.addEventListener('click', function(){ paint(b.getAttribute('data-mode')); });
  });
})();
</script>
"""
    return f"""
<h3>State correlations</h3>
<p>{lead}</p>
<p>Brown is positive. Blue is negative. Cream is near zero. The large number is the correlation selected below. The small number is the other one. n is the state count for the large number.</p>
<div id="window-corr">
<div class="corr-switch">
<button type="button" class="btn btn-primary" data-mode="r" aria-pressed="true">Pearson r</button>
<button type="button" class="btn btn-outline" data-mode="partial" aria-pressed="false">Partial r</button>
</div>
<div class="table-scroll">
<table class="cmp heat-table" id="window-corr-table">
<thead><tr><th class="rowhead">Substance</th><th class="rowhead">Window</th>{heads}</tr></thead>
<tbody>
{''.join(body)}
</tbody>
</table>
</div>
</div>
<p class="fine">The outcome year is 2019, the latest NAEP year with a full 15-year run of interview-mode pools: the 15-year row is the mean of end years 2005–2019, the 5-year row is the mean of end years 2015–2019, and the latest-pool row is the 2018–2019 estimate, with the 2019–2020 pool absent and the 2021–2024 web-mode pools left out.</p>
<p class="fine">Scores are vote-weighted z-scores of the 2019 state means. The composite is the mean of those four z-scores. Democratic share is the 2020 two-party share. Weights are 2020 two-party votes. Partial r residualizes the exposure and the outcome on log density, percent ages 18–25, percent ages 12–17, and bachelor’s share, the vote-weighted region means. Median household income is not in the region file. Alaska and Hawaii are absent from that file, so partial r uses {n_p} states and Pearson r uses {n_r}. Hallucinogens and opioid misuse begin in the web-mode pools and are off this table. Binge alcohol, illicit drugs other than marijuana, methamphetamine, and pain-reliever misuse have four pre-break pools on the current questionnaire, so only the 2018–2019 row is filled. Heroin’s series starts in 2013–2014, so the 15-year row is omitted. CSV: <a href="nsduh-vote-ecological/results/state_window_correlations.csv">state_window_correlations.csv</a>.</p>
""" + script


def correlation_heatmap(study: dict) -> str:
    keys = study["keys"]
    matrix = study["matrix"]
    n = len(keys)
    cell = 36
    left, top = 138, 148
    width = left + n * cell + 16
    height = top + n * cell + 28
    parts = [f'<svg viewBox="0 0 {width} {height}" role="img" class="chart" id="corr-matrix">']
    for i, key in enumerate(keys):
        label = CORR_LABELS.get(key, key)
        x = left + i * cell + 2
        y = top - 8
        parts.append(
            f'<text x="{x:.1f}" y="{y:.1f}" text-anchor="start" transform="rotate(-58 {x:.1f} {y:.1f})" class="tick">{esc(label)}</text>'
        )
        parts.append(
            f'<text x="{left - 8}" y="{top + i * cell + cell / 2 + 3:.1f}" text-anchor="end" class="tick">{esc(label)}</text>'
        )
    for i in range(n):
        for j in range(n):
            r = float(matrix[i][j])
            rgb = _corr_rgb(r)
            fill = "#{:02X}{:02X}{:02X}".format(*rgb)
            ink = _corr_ink(rgb)
            x = left + j * cell
            y = top + i * cell
            parts.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{cell - 1}" height="{cell - 1}" fill="{fill}"/>')
            parts.append(
                f'<text x="{x + (cell - 1) / 2:.1f}" y="{y + cell / 2 + 3:.1f}" text-anchor="middle" style="fill:{ink};font-size:9px;font-family:Archivo,sans-serif">{num(r, 2)}</text>'
            )
    parts.append("</svg>")
    return "\n".join(parts)


def partial_chart(study: dict) -> str:
    order = ["mj", "hal", "alc", "coc", "opin", "pnr", "met", "her", "binge", "iem", "ill", "mrjyr", "ualc", "ubinge"]
    by = {row["term"]: row for row in study["partials"]}
    rows = [by[key] for key in order]
    n = len(rows)
    row_h = 28
    top, bottom = 16, 28
    left, plot_w, right = 148, 460, 64
    lo, hi = -0.15, 0.65
    width = left + plot_w + right
    height = top + n * row_h + bottom

    def X(v):
        return left + (float(v) - lo) / (hi - lo) * plot_w

    parts = [f'<svg viewBox="0 0 {width} {height}" role="img" class="chart" id="partial-bars">']
    parts.append(f'<line x1="{X(0):.1f}" y1="{top}" x2="{X(0):.1f}" y2="{height - bottom}" class="axis"/>')
    for t in (-0.0, 0.2, 0.4, 0.6):
        parts.append(f'<line x1="{X(t):.1f}" y1="{top}" x2="{X(t):.1f}" y2="{height - bottom}" class="grid"/>')
        parts.append(f'<text x="{X(t):.1f}" y="{height - 8}" text-anchor="middle" class="tick">{t:.1f}</text>')
    for i, row in enumerate(rows):
        y = top + i * row_h + 8
        r = float(row["partial_r"])
        color = "#8A6318" if r >= 0 else "#1E40AF"
        x0, x1 = X(0), X(r)
        parts.append(f'<text x="6" y="{y + 4:.1f}" class="lab">{esc(CORR_LABELS.get(row["term"], row["term"]))}</text>')
        parts.append(f'<line x1="{min(x0, x1):.1f}" y1="{y:.1f}" x2="{max(x0, x1):.1f}" y2="{y:.1f}" stroke="{color}" stroke-width="8" stroke-linecap="butt"/>')
        parts.append(
            f'<text x="{max(x0, x1) + 6:.1f}" y="{y + 4:.1f}" style="fill:{color};font-size:11px;font-weight:700;font-family:Archivo,sans-serif">{num(r, 2, sign=True)}</text>'
        )
    parts.append("</svg>")
    return "\n".join(parts)


def partial_table(study: dict) -> str:
    order = ["mj", "hal", "alc", "coc", "opin", "pnr", "met", "her", "binge", "iem", "ill", "mrjyr", "ualc", "ubinge"]
    by = {row["term"]: row for row in study["partials"]}
    lines = []
    for key in order:
        row = by[key]
        lines.append(
            "<tr>"
            f"<td>{esc(row['label'])}</td>"
            f"<td>{num(row['weighted_r'], 2, sign=True)}</td>"
            f"<td>{num(row['partial_r'], 2, sign=True)}</td>"
            "</tr>"
        )
    return "\n".join(lines)


def potency_html():
    return (HERE / "fragments" / "potency.html").read_text()


def nav():
    return (HERE / "fragments" / "nav.html").read_text().strip()


def main():
    ext = json.loads((RESULTS / "extended.json").read_text())
    regions = list(csv.DictReader((RESULTS / "region_level.csv").open()))
    from industry_donations_source import records, write_csv
    from industry_spending import category_rows, write_outputs

    write_csv(RESULTS / "industry_donations.csv")
    write_outputs(RESULTS)
    donations = records()
    spending = category_rows()
    alone = ext["alone"]
    panels, line_fits = rate_panels(regions)
    dens, _dens_a, dens_b, dens_se = density_chart(regions)
    goodman = ext["goodman"]["rows"]
    stable_rows = [r for r in goodman if r.get("stable") in (True, "True", "true")]
    dropped_rows = [r for r in goodman if r not in stable_rows]
    dumb = dumbbell_chart(stable_rows)
    gtab = goodman_table(stable_rows)
    pchart = percentile_chart(goodman)
    ptab = percentile_table(goodman)
    drop_labels = [DUMB_LABEL.get(r["term"], r["term"]) for r in dropped_rows]
    drop_names = ", ".join(drop_labels[:-1]) + ", and " + drop_labels[-1] if len(drop_labels) > 1 else (drop_labels[0] if drop_labels else "")
    contour, contour_sum = contour_panels(regions)
    by_term = {r["term"]: r for r in goodman}
    g_mj, g_alc = by_term["mj"], by_term["alc"]
    parties, party_legend = party_lines(donations)
    cats = category_chart(spending)
    spend_rows = spending_table(spending)
    ballot_rows_html = ballot_table()
    use_keys = ["mj", "alc", "binge", "iem", "ill", "coc", "hal", "her", "met", "opin", "pnr", "mrjyr", "ualc", "ubinge"]
    dis_keys = ["sud", "dud", "oud", "prud", "aud", "uaud"]
    def dget(industry, field):
        return next(r[field] for r in donations if r["industry"] == industry and int(r["cycle"]) == 2024)

    beer_total, beer_dem, beer_rep = dget("Beer, Wine & Liquor", "total"), dget("Beer, Wine & Liquor", "to_democrats"), dget("Beer, Wine & Liquor", "to_republicans")
    pharma_total = dget("Pharmaceuticals / Health Products", "total")
    mj_total = dget("Marijuana", "total")
    n_joint = len(ext["joint"]["terms"])
    low_s, high_s = contour_sum[0], contour_sum[2]
    groups = ext["groups"]
    omit = groups["heroin_omitted"]["terms"]
    inn = groups["heroin_in_b"]["terms"]
    heroin = groups["heroin_alone"]
    gchart = group_chart(groups)
    gtab_group = group_table(groups)
    from over_time import marijuana_score_correlations, section_html, state_window_correlations
    import key_charts
    key_html = key_charts.section_html()

    mj_html = mj_corr_section(marijuana_score_correlations())
    window_html = window_corr_section(state_window_correlations())

    ot_html = section_html()
    mj_line, alc_line = line_fits["mj"], line_fits["alc"]

    html = f"""<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="theme-color" content="#FBFAF8">
<title>Substance use and the 2024 vote | AMNI-SCIENT Research</title>
<meta name="description" content="Vote-weighted regressions of 2021–2023 NSDUH substate substance-use rates on 2024 Democratic two-party share across 382 regions, ecological user and non-user shares, laboratory results, and industry contributions, lobbying, and state ballot spending.">
<meta name="keywords" content="NSDUH,marijuana,alcohol,opioid,2024 presidential vote,ecological regression,OpenSecrets,Anthony Reffelt">
<meta property="og:title" content="Substance use and the 2024 vote — AMNI-SCIENT Research">
<meta property="og:description" content="NSDUH substate rates and 2024 Democratic two-party share. Measured vote results, laboratory results, and industry contributions, labeled separately.">
<meta property="og:type" content="article">
<meta property="og:url" content="https://amni-scient.com/research/substance-use-vote-share">
<meta property="og:image" content="https://amni-scient.com/assets/explore/og-explore.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Substance use and the 2024 vote">
<meta name="twitter:description" content="382 NSDUH regions. Marijuana +1.13 points of vote share per point of past-month use. Alcohol +0.66.">
<link rel="canonical" href="https://amni-scient.com/research/substance-use-vote-share">
<script type="application/ld+json">{{"@context":"https://schema.org","@type":"ScholarlyArticle","name":"Substance use and the 2024 vote","headline":"NSDUH substate substance use and 2024 Democratic two-party vote share","author":{{"@type":"Person","name":"Anthony Reffelt"}},"description":"Area-level associations of NSDUH 2021–2023 substate substance-use rates with 2024 Democratic two-party vote share, ecological user and non-user shares, laboratory suggestibility results, and OpenSecrets industry contributions.","url":"https://amni-scient.com/research/substance-use-vote-share","publisher":{{"@type":"Organization","name":"AMNI-SCIENT"}},"datePublished":"2026-10-11","dateModified":"2026-10-11"}}</script>
<link rel="stylesheet" href="../css/style.css?v=b261">
<script>
(function(){{var h=document.documentElement,s=localStorage.getItem('amni-theme')||'light';h.dataset.theme=s;function u(){{var b=document.getElementById('theme-toggle');if(b)b.textContent=h.dataset.theme==='dark'?'LIGHT':'DARK';var m=document.querySelector('meta[name=theme-color]');if(m)m.setAttribute('content',h.dataset.theme==='dark'?'#0A0B0E':'#FBFAF8');}}window.addEventListener('DOMContentLoaded',u);window.toggleTheme=function(){{var n=h.dataset.theme==='dark'?'light':'dark';h.dataset.theme=n;localStorage.setItem('amni-theme',n);u();}};}})();
</script>
<style>
.note-wrap{{max-width:none;width:100%;margin:0;padding:.4rem max(clamp(1.25rem,5vw,4rem),calc((100vw - 1240px)/2)) 3.5rem}}
.note-wrap p:not(.axis-name),.note-wrap h2,.note-wrap .src,.note-wrap li{{max-width:42rem}}
.note-wrap .stats,.note-wrap table.cmp,.note-wrap .chart-card,.note-wrap .legend,.note-wrap .axis-name,.note-wrap .slope-grid,.note-wrap .contour-grid,.note-wrap .r-grid{{max-width:860px}}
.note-wrap .slope-card p{{max-width:none}}
.table-scroll{{overflow-x:auto;max-width:100%}}
.heat-wrap{{max-width:860px}}
.table-scroll table.cmp{{min-width:680px}}
.crumb{{font-size:.7rem;letter-spacing:.18em;text-transform:uppercase;color:var(--dim);margin:0 0 .8rem}}
.crumb a{{color:var(--accent)}}
.hero .crumb{{position:relative;z-index:1;margin:0 0 .55rem;order:-2}}
.stats{{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:0 0 1.6rem}}
.stats.one{{grid-template-columns:minmax(0,32rem);margin:0.6rem 0 1rem}}
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
.chart .user{{fill:var(--accent);stroke:var(--accent)}}
.chart .link{{stroke:var(--accent);stroke-width:2}}
.chart .lab{{fill:var(--text);font-size:12px;font-family:var(--font-sans,Archivo,sans-serif)}}
.chart .mark{{stroke:var(--accent);stroke-opacity:.45;stroke-dasharray:2 3}}
.chart .marklab{{fill:var(--accent);font-size:10px;font-family:var(--font-sans,Archivo,sans-serif);letter-spacing:.04em}}
.axis-name{{display:flex;justify-content:space-between;font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;color:var(--dim);padding:0 .4rem .2rem}}
table.cmp{{width:100%;border-collapse:collapse;background:var(--panel);border:1px solid var(--border);font-size:.82rem;margin:.8rem 0}}
table.cmp th,table.cmp td{{padding:.45rem .55rem;text-align:right;border-bottom:1px solid var(--border)}}
table.cmp th:first-child,table.cmp td:first-child{{text-align:left}}
table.cmp th{{font-size:.62rem;letter-spacing:.08em;text-transform:uppercase;color:var(--dim);background:var(--panel2)}}
table.cmp tr:last-child td{{border-bottom:0}}
table.cmp tr.hot td{{background:var(--accent-dim);color:var(--text);font-weight:650}}
table.spend th,table.spend td{{text-align:left}}
table.spend td.num,table.spend th.num{{text-align:right;white-space:nowrap}}
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
{key_charts.CSS}
@media(max-width:720px){{
  .stats{{grid-template-columns:1fr}}
  table.cmp{{font-size:.72rem}}
  table.cmp th,table.cmp td{{padding:.35rem .3rem}}
  .axis-name{{flex-direction:column;align-items:flex-start;gap:.25rem}}
  .slope-grid{{grid-template-columns:1fr}}
  .contour-grid{{grid-template-columns:1fr}}
  .r-grid{{grid-template-columns:1fr}}
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
<p class="tagline">One point of past-month marijuana use lines up with {num(mj_line['slope'], sign=True)} points of Democratic two-party share on the vote-weighted fit. Alcohol’s fit is {num(alc_line['slope'], sign=True)} per point. After log density and age, marijuana is {num(alone['mj']['pp_per_pp'], sign=True)} and alcohol is {num(alone['alc']['pp_per_pp'], sign=True)}. At the 10th percentile of regional marijuana use the fitted share is {num(g_mj['p10_share'], 1)}%. At the 90th it is {num(g_mj['p90_share'], 1)}%.</p>
</section>
<main class="note-wrap">
<div class="data-top">
<h2>Data and method</h2>
<div class="dl-row">
<a class="btn btn-primary" href="nsduh-vote-ecological/results/region_level.csv" download>Region CSV</a>
<a class="btn btn-primary" href="nsduh-vote-ecological/results/results.json" download>Results JSON</a>
<a class="btn btn-primary" href="nsduh-vote-ecological/results/extended.json" download>Extended JSON</a>
<a class="btn btn-primary" href="nsduh-vote-ecological/results/quintiles.csv" download>Quintiles CSV</a>
<a class="btn btn-primary" href="nsduh-vote-ecological/results/user_nonuser.csv" download>Users and non-users CSV</a>
<a class="btn btn-primary" href="nsduh-vote-ecological/results/state_level.csv" download>State CSV</a>
<a class="btn btn-primary" href="nsduh-vote-ecological/results/industry_donations.csv" download>Federal contributions CSV</a>
<a class="btn btn-primary" href="nsduh-vote-ecological/results/industry_spending_2024.csv" download>2024 spending CSV</a>
<a class="btn btn-primary" href="nsduh-vote-ecological/results/cannabis_ballot_2024.csv" download>Ballot CSV</a>
<a class="btn btn-primary" href="nsduh-vote-ecological/results/industry_lobbying_clients_2024.csv" download>Lobbying clients CSV</a>
<a class="btn btn-primary" href="nsduh-vote-ecological/results/cannabis_fec_employers_2024.csv" download>FEC employers CSV</a>
<a class="btn btn-primary" href="nsduh-vote-ecological/results/cannabis_fec_pacs_2024.csv" download>FEC PACs CSV</a>
<a class="btn btn-primary" href="nsduh-vote-ecological/data/substate_outcomes_212223.csv" download>NSDUH outcomes CSV</a>
<a class="btn btn-outline" href="nsduh-vote-ecological/run_regression.py" download>Regression script</a>
<a class="btn btn-outline" href="nsduh-vote-ecological/fit_extended.py" download>Substance fit</a>
<a class="btn btn-primary" href="nsduh-vote-ecological/data/nsduh_sae_long.csv" download>NSDUH state series CSV</a>
<a class="btn btn-primary" href="nsduh-vote-ecological/data/naep_scores.csv" download>NAEP scores CSV</a>
<a class="btn btn-primary" href="nsduh-vote-ecological/data/president_twoparty.csv" download>Presidential vote CSV</a>
<a class="btn btn-primary" href="nsduh-vote-ecological/data/cannabis_adult_use.csv" download>Adult-use dates CSV</a>
<a class="btn btn-primary" href="nsduh-vote-ecological/results/state_changes.csv" download>State changes CSV</a>
<a class="btn btn-primary" href="nsduh-vote-ecological/results/lag_specs.csv" download>Lag specifications CSV</a>
<a class="btn btn-primary" href="nsduh-vote-ecological/data/cannabis_medical.csv" download>Medical dates CSV</a>
<a class="btn btn-primary" href="nsduh-vote-ecological/results/child_exposure.csv" download>Child exposure CSV</a>
<a class="btn btn-primary" href="nsduh-vote-ecological/results/group_slopes.csv" download>Group slopes CSV</a>
<a class="btn btn-primary" href="nsduh-vote-ecological/results/state_window_correlations.csv" download>State correlation CSV</a>
<a class="btn btn-primary" href="nsduh-vote-ecological/results/marijuana_score_correlations.csv" download>Marijuana score CSV</a>
<a class="btn btn-primary" href="nsduh-vote-ecological/data/legislative_acts.csv" download>Legislative timeline CSV</a>
<a class="btn btn-outline" href="nsduh-vote-ecological/over_time.py" download>Over-time script</a>
<a class="btn btn-outline" href="nsduh-vote-ecological/key_charts.py" download>Summary charts script</a>
<a class="btn btn-outline" href="nsduh-vote-ecological/industry_spending.py" download>Spending script</a>
<a class="btn btn-outline" href="nsduh-vote-ecological/README.md">Full method</a>
</div>
<p>N = 382 regions, 30,389 ZCTAs, and 150.1 million two-party votes. After log density and age, marijuana is <strong>{num(alone['mj']['pp_per_pp'], sign=True)}</strong> points of Democratic share per point of past-month use (SE {num(alone['mj']['se_pp'])}).</p>
<p class="cite">Reffelt, A. (2026). <em>Substance use and the 2024 vote.</em> AMNI-SCIENT Research. https://amni-scient.com/research/substance-use-vote-share</p>
</div>

<div class="stats">
<div class="stat lead"><span class="k">Marijuana, vote-weighted fit</span><span class="v">{num(mj_line['slope'], sign=True)}</span><span class="s">points of Democratic two-party share per point of past-month use. SE {num(mj_line['se'])}. Measured.</span></div>
<div class="stat"><span class="k">Alcohol, vote-weighted fit</span><span class="v">{num(alc_line['slope'], sign=True)}</span><span class="s">points of share per point of past-month use. SE {num(alc_line['se'])}. Measured.</span></div>
<div class="stat"><span class="k">After density and age</span><span class="v">{num(alone['mj']['pp_per_pp'], sign=True)}</span><span class="s">marijuana, vote-share points per point of past-month use. SE {num(alone['mj']['se_pp'])}.</span></div>
</div>
{key_html}
<h2>Each rate</h2>
<p>Each point is one of 382 regions. The line is points of 2024 Democratic two-party share per point of that rate.</p>
{panels}
<p class="axis-name"><span>Y · Democratic two-party share, 0–100%</span><span>X · NSDUH rate, 0–100%</span></p>
<p class="fine cap">Measured. The unit is the substate region. 382 regions. Both axes are percentage points on the same scale, so the angle of the line is the slope. The line runs from the lowest regional rate to the highest.</p>

<h2 id="rate-of-change">Rate of change</h2>
<p>After log density and age, one point of past-month marijuana use lines up with <strong>{num(alone['mj']['pp_per_pp'], sign=True)}</strong> points of Democratic two-party share (SE {num(alone['mj']['se_pp'])}). Past-month alcohol is <strong>{num(alone['alc']['pp_per_pp'], sign=True)}</strong> (SE {num(alone['alc']['se_pp'])}).</p>
<table class="cmp">
<thead><tr><th>Rate</th><th>Per point</th><th>SE</th><th>Per SD</th><th>State FE</th><th>SE</th><th>p</th></tr></thead>
<tbody>
{coef_table(alone, use_keys)}
</tbody>
</table>
<p class="fine">Per point: percentage points of Democratic two-party share per percentage point of the rate, with log density and age. N = 382. HC1.</p>
<table class="cmp">
<thead><tr><th>Marijuana specification</th><th>Slope</th><th>SE</th><th>Alcohol</th><th>SE</th></tr></thead>
<tbody>
<tr><td>Before density and age</td><td>+1.48</td><td>0.20</td><td></td><td></td></tr>
<tr><td>Bachelor’s share added</td><td>+1.09</td><td>0.11</td><td></td><td></td></tr>
<tr><td>State indicators</td><td>+0.99</td><td>0.26</td><td></td><td></td></tr>
<tr><td>State indicators and bachelor’s share</td><td>+1.14</td><td>0.24</td><td></td><td></td></tr>
<tr><td>Areal vote allocation</td><td>+1.14</td><td>0.13</td><td></td><td></td></tr>
<tr><td>With alcohol alone</td><td>+0.96</td><td>0.13</td><td>+0.49</td><td>0.08</td></tr>
<tr><td>Ages 15–17 and 18–24</td><td>+1.12</td><td></td><td></td><td></td></tr>
</tbody>
</table>

<h2>Disorder prevalence</h2>
<table class="cmp">
<thead><tr><th>Rate</th><th>Per point</th><th>SE</th><th>Per SD</th><th>State FE</th><th>SE</th><th>p</th></tr></thead>
<tbody>
{coef_table(alone, dis_keys)}
</tbody>
</table>
<p class="fine">Same specification. These rows are past-year disorder prevalence.</p>

<h2>Seven rates together</h2>
<p>Seven rates in one model with log density and age. Weighted R² is <strong>{ext['joint']['r2']:.2f}</strong>. With state indicators it is <strong>{ext['joint']['state_fe_r2']:.2f}</strong>.</p>
<table class="cmp">
<thead><tr><th>Rate</th><th>Per point</th><th>SE</th><th>State FE</th><th>SE</th><th>p</th></tr></thead>
<tbody>
{joint_table(ext['joint'])}
</tbody>
</table>
<p class="fine">Each row is that rate’s coefficient with the other {n_joint - 1} rates, log density, and age in the same model.</p>

<h2 id="groups">Perception and the vote slope</h2>
<p>Group A’s common slope is <strong>{num(omit['A']['coef'], 2, sign=True)}</strong> points of Democratic two-party share per point of the rate (clustered SE {num(omit['A']['se_cluster'])}). Group B’s is <strong>{num(omit['B']['coef'], 2, sign=True)}</strong> (SE {num(omit['B']['se_cluster'])}). The difference, group B minus group A, is <strong>{num(omit['diff']['coef'], 2, sign=True)}</strong> (SE {num(omit['diff']['se_cluster'])}).</p>
<p>With heroin in group B the difference is <strong>{num(inn['diff']['coef'], 2, sign=True)}</strong> (SE {num(inn['diff']['se_cluster'])}). Heroin alone is <strong>{num(heroin['coef'], 2, sign=True)}</strong> per point (HC1 SE {num(heroin['se_hc1'])}).</p>
<p>Green is group A. Teal is group B. Brown is the difference.</p>
<div class="chart-card" id="group-chart">{gchart}</div>
<p class="axis-name"><span>Y · Specification</span><span>X · Points of Democratic share per point of the rate</span></p>
<div class="table-scroll">
<table class="cmp">
<thead><tr><th>Pool</th><th>Term</th><th>Slope</th><th>Clustered SE</th><th>Clustered 95% CI</th><th>HC1 SE</th><th>p</th></tr></thead>
<tbody>
{gtab_group}
</tbody>
</table>
</div>
<p class="fine">N = 382 regions. CSV: <a href="nsduh-vote-ecological/results/group_slopes.csv">group_slopes.csv</a>.</p>

{mj_html}
<details class="secondary-block">
<summary>All substances at the 2019 scores and the 2020 vote</summary>
{window_html}
</details>

<h2 id="users">Users and non-users</h2>
<p>Among people who drank in the past month, Democratic two-party share is <strong>{num(g_alc['user_share'], 1)}%</strong>. Among people who did not, it is <strong>{num(g_alc['nonuser_share'], 1)}%</strong>. Binge alcohol is <strong>{num(by_term['binge']['user_share'], 1)}%</strong> among users and <strong>{num(by_term['binge']['nonuser_share'], 1)}%</strong> among non-users.</p>
<p>Open circles are non-users. Filled circles are users.</p>
<div class="chart-card" id="users-chart">{dumb}</div>
<p class="axis-name"><span>Y · Substance</span><span>X · Democratic two-party share, 0–100%</span></p>
<p class="fine cap">Measured. Bounded Goodman estimates from the vote-weighted regression with log density and age. 382 regions. {g_mj['n_dem_regions']} Democratic-majority regions, {g_mj['n_rep_regions']} Republican-majority regions.</p>
<div class="table-scroll">
<table class="cmp">
<thead><tr><th>Rate</th><th>Non-users</th><th>95% CI</th><th>Users</th><th>95% CI</th><th>Dem. maj.</th><th>Rep. maj.</th><th>Ratio</th></tr></thead>
<tbody>
{gtab}
</tbody>
</table>
</div>
<p class="fine">Shares are percentage points of Democratic two-party vote, inside 0–100. Dem. maj. and Rep. maj. are vote-weighted use rates, in percent, in regions above and at or below 50% Democratic two-party share.</p>
<h2 id="percentiles">Inside the observed rates</h2>
<p>At the 10th percentile of regional past-month marijuana use the fitted Democratic share is <strong>{num(g_mj['p10_share'], 1)}%</strong>. At the 90th it is <strong>{num(g_mj['p90_share'], 1)}%</strong>. Open circles are the 10th percentile. Filled circles are the 90th.</p>
<div class="chart-card" id="percentile-chart">{pchart}</div>
<p class="axis-name"><span>Y · Substance</span><span>X · Predicted Democratic two-party share, 0–100%</span></p>
<div class="table-scroll">
<table class="cmp">
<thead><tr><th>Rate</th><th>Use, 10th</th><th>Share</th><th>95% CI</th><th>Use, 90th</th><th>Share</th><th>95% CI</th><th>Ratio</th></tr></thead>
<tbody>
{ptab}
</tbody>
</table>
</div>
<p class="fine">Use is the vote-weighted percentile of the regional rate, in percent. Share is the fitted Democratic two-party share at that rate, with log density and age at their vote-weighted means. Intervals are 95% from the HC1 covariance. The ratio column is the same majority-use ratio as the table above.</p>

<h2 id="contour">Marijuana, alcohol, and the vote</h2>
<p>In the high-density tercile the fitted Democratic share runs from <strong>{high_s['share_min']:.0f}%</strong> to <strong>{high_s['share_max']:.0f}%</strong>. In the low-density tercile it runs from <strong>{low_s['share_min']:.0f}%</strong> to <strong>{low_s['share_max']:.0f}%</strong>.</p>
{contour}
<p class="axis-name"><span>Y · Past-month alcohol, %</span><span>X · Past-month marijuana, %</span></p>
<p class="fine cap">Measured. 382 regions. The color is Democratic two-party share. Gold is above 50. Ink is below 50.</p>

<h2>Democratic share and density</h2>
<p>Democratic two-party share rises <strong>{num(dens_b, sign=True)}</strong> points per log point of population density (SE {num(dens_se)}). The correlation is 0.73. Bachelor’s share correlates at 0.71.</p>
<div class="chart-card">{dens}</div>
<p class="axis-name"><span>Y · Democratic two-party share, 0–100%</span><span>X · Log population density, people per km²</span></p>
<p class="fine cap">Measured. The unit is the substate region. The vertical axis runs from 0 to 100.</p>

{ot_html}
{child_section()}

<h2>Laboratory results</h2>
<p>A suggested false detail was accepted <strong>19%</strong> of the time after THC and <strong>8%</strong> after placebo. Related-word false alarms were <strong>42%</strong> and <strong>27%</strong>. Misled responses were <strong>0.25</strong> after alcohol and <strong>0.319</strong> with no alcohol.</p>
<div class="chart-card">{lab_chart()}</div>
<p class="axis-name"><span>Y · Percent</span><span>Whiskers · Kloft, 1 SE in percentage points. Gawrylowicz, half the published 95% CI.</span></p>
<p class="fine cap">Laboratory data, not vote data. Kloft et al. 2020, immediate test, THC versus placebo. Gawrylowicz et al. 2017, alcohol, reverse placebo, and no alcohol.</p>

{potency_html()}

<h2>Published studies</h2>
<p>The laboratory chart is the Kloft contrast. The IQ chart is the Dunedin 8-point loss. The other published numbers sit in this table.</p>
<table class="cmp">
<thead><tr><th>Study</th><th>Result</th><th>DOI</th></tr></thead>
<tbody>
<tr><td>Kloft et al. 2020</td><td>Suggested detail 19% on THC, 8% on placebo</td><td><a href="https://doi.org/10.1073/pnas.1920162117">10.1073/pnas.1920162117</a></td></tr>
<tr><td>Meier et al. 2012</td><td>8 IQ points lost, adolescent-onset persistent cannabis, Dunedin</td><td><a href="https://doi.org/10.1073/pnas.1206820109">10.1073/pnas.1206820109</a></td></tr>
<tr><td>Topiwala et al. 2017</td><td>Odds ratio 5.8 for hippocampal atrophy above 30 units a week (1.8 to 18.6); 3.4 for 14–21 units (1.4 to 8.1)</td><td><a href="https://doi.org/10.1136/bmj.j2353">10.1136/bmj.j2353</a></td></tr>
<tr><td>Gawrylowicz et al. 2017</td><td>Misled responses 0.319 with no alcohol, 0.25 after alcohol, 0.22 reverse placebo</td><td><a href="https://doi.org/10.1007/s00213-017-4564-2">10.1007/s00213-017-4564-2</a></td></tr>
<tr><td>Assefi and Garry 2003</td><td>Told-vodka versus told-tonic, F(1, 115) = 4.20</td><td><a href="https://doi.org/10.1111/1467-9280.01422">10.1111/1467-9280.01422</a></td></tr>
<tr><td>Van Oorsouw et al. 2015</td><td>Mean BAC about 0.01%, 0.06%, and 0.16%</td><td><a href="https://doi.org/10.1002/acp.3129">10.1002/acp.3129</a></td></tr>
<tr><td>Flowe et al. 2019</td><td>People told they had alcohol reported fewer correct details</td><td><a href="https://doi.org/10.1002/acp.3531">10.1002/acp.3531</a></td></tr>
<tr><td>Denham 2019</td><td>Party affiliation predicted marijuana-legalization support after 2004</td><td><a href="https://doi.org/10.1016/j.drugpo.2019.06.007">10.1016/j.drugpo.2019.06.007</a></td></tr>
</tbody>
</table>

<h2>Industry money in 2024</h2>
<p>Cannabis money in 2024 is three filings: state ballot support <strong>$157,512,674.46</strong>, federal lobbying <strong>$5,248,000</strong>, and federal contributions <strong>$969,606</strong>. Of N09 money to candidates and parties, <strong>61.40%</strong> went to Democrats.</p>
<p class="fine">Each industry has its own horizontal scale. The party percentages on the federal bar are OpenSecrets’ shares of contributions to candidates and parties. Outside money is in the federal total and out of that split.</p>
{cats}
<table class="cmp spend">
<thead><tr><th>Industry</th><th>Category</th><th class="num">Amount</th><th>Party</th></tr></thead>
<tbody>
{spend_rows}
</tbody>
</table>
<table class="cmp spend">
<thead><tr><th>State</th><th>Measure</th><th>Support committee</th><th class="num">Contributions</th><th>Party</th></tr></thead>
<tbody>
{ballot_rows_html}
</tbody>
</table>
<p class="fine cap">Support committees only. Nebraska’s two initiatives share one committee, so $1,624,863.21 is one row. Retrieved 2026-10-11.</p>
<p>Named donors, opposition committees, and the FEC comparison are in the ballot, lobbying, and FEC downloads. Florida opposition sums to $33,610,084.06. Employer strings for the named cannabis firms sum to <strong>$277,316.66</strong>. Three PACs gave federal candidates <strong>$76,500</strong>.</p>

<h2>Federal contributions by cycle</h2>
<p>In 2024, beer, wine, and liquor gave <strong>{money(beer_total)}</strong>. Pharmaceuticals and health products gave <strong>{money(pharma_total)}</strong>. Marijuana gave <strong>{money(mj_total)}</strong>, with <strong>61.40%</strong> of candidate and party money to Democrats.</p>
<p class="fine">Gray is the cycle total. Blue is dollars to Democratic candidates and parties. Red is dollars to Republican candidates and parties. Each industry has its own vertical scale. The total includes outside spending. The party bars do not.</p>
{donation_totals(donations)}
<p class="fine cap">OpenSecrets industry totals, retrieved 2026-10-11 from the archive capture of 2026-07-16. Codes N02, H04, and N09.</p>
<div class="chart-card">{parties}</div>
{party_legend}
<p class="axis-name"><span>Y · Published percent of candidate and party money to Democrats</span><span>X · Election cycle</span></p>
<p class="fine cap">The published Democratic and Republican percentages need not sum to 100. Outside spending is excluded from this split.</p>

<h2>Vote share and the donation split</h2>
<p>Left, points of Democratic share per weighted standard deviation of the rate. Right, the 2024 split of federal contributions to candidates and parties. Blue is Democrats. Red is Republicans.</p>
<div class="chart-card">{compare_chart(alone, donations)}</div>
<p class="fine cap">This figure shows co-occurrence of area-level use with area-level vote share, and the published split of industry contributions to candidates and parties. It does not show intent, coordination, a deliberate strategy, or that substance use changes any individual’s vote.</p>

<details class="methods-block" id="methods">
<summary>Methods</summary>
<div class="src">
<p>I joined SAMHSA’s 2021–2023 NSDUH substate small-area estimates to 2024 presidential votes reallocated to ZCTAs by the land-cover method (Harvard Dataverse 10.7910/DVN/Z8TSH3), with ACS 2019–2023 age and education and Census 2020 ZCTA internal points. The unit is the substate region. Weights are two-party votes. Standard errors are HC1. The specified model is the rate, log population density, percent ages 18–25, and percent ages 12–17. Ages 12–14 are three-fifths of the ACS 10–14 band, and age 25 is one-fifth of the 25–29 band.</p>
<p>Alaska and Hawaii have no rows in the vote file. The shapefile has 393 regions. Nebraska is in it: five regions, FIPS 31. The file’s state name on those rows says New Jersey. One New Jersey region, Southern, FIPS 34, is labeled New York. State indicators use the FIPS code. The estimation sample is 49 jurisdictions: 48 states plus the District of Columbia.</p>
<p>The NSDUH rates are small-area estimates. No public file links one person’s use to that person’s ballot. The slope that remains after density and age is the residual association of the rate. Past-month cocaine, heroin, methamphetamine, hallucinogens, opioid misuse, and pain-reliever misuse are past-year rates in this file, and heroin is ages 18 or older. Binge alcohol is the intensity measure SAMHSA published. Mental-illness, suicide, and perceived-risk outcomes stay out of the vote regression.</p>
<p>SAMHSA withdrew the 2018–2020 substate estimates. The 2021 methodology guide sets 2021 as the baseline after the move to web and in-person collection. The 2021–2023 file is one pooled period. <a href="https://www.samhsa.gov/data/data-we-collect/nsduh-national-survey-drug-use-and-health/substate-releases/2018-2020">2018–2020 withdrawal</a>. <a href="https://www.samhsa.gov/data/sites/default/files/reports/rpt39464/2021NSDUHsaeMethodology111022/2021NSDUHsaeMethodology111022.htm">2021 methodology</a>.</p>
<p>User and non-user shares are the vote-weighted regression of Democratic two-party share on the rate, log density, and age, with density and age held at their vote-weighted means, then restricted to 0–100. A rate whose Duncan–Davis bounds run from 0 to 100 stays off that chart and remains on the slope panels. The contour is a vote-weighted local linear fit, tricube kernel, span 45% of the panel’s two-party votes, at least 12 regions. Low, medium, and high are vote-weighted terciles of log density.</p>
<p>Group A is marijuana, hallucinogens, alcohol, and cocaine. Group B is opioid misuse, pain-reliever misuse, and methamphetamine. Each region enters once per substance. The test is the interaction of the rate with group B. Controls are log density and the two age shares, centered at their vote-weighted means. Marijuana: Kloft and colleagues, 300 μg of THC per kilogram, suggested false detail 19% versus 8% on placebo. Hallucinogens: Nichols, Pharmacological Reviews, 2016, <a href="https://doi.org/10.1124/pr.115.011478">10.1124/pr.115.011478</a>. LSD: Carhart-Harris and colleagues, Psychopharmacology, 2015, <a href="https://doi.org/10.1007/s00213-014-3714-z">10.1007/s00213-014-3714-z</a>. Alcohol expectancy: Assefi and Garry, 2003; van Oorsouw, Merckelbach, and Smeets, 2015. Cocaine: Volkow and colleagues, Nature, 1997, <a href="https://doi.org/10.1038/386827a0">10.1038/386827a0</a>, 60–77% of dopamine transporter sites occupied at 0.3–0.6 mg/kg intravenous. Opioids: Pathan and Williams, British Journal of Pain, 2012, <a href="https://doi.org/10.1177/2049463712438493">10.1177/2049463712438493</a>. Methamphetamine: Cruickshank and Dyer, Addiction, 2009, <a href="https://doi.org/10.1111/j.1360-0443.2009.02564.x">10.1111/j.1360-0443.2009.02564.x</a>, arousal at 5–30 mg.</p>
<p>A marijuana window is dropped when it asks for a 2020 or 2021 pool or would average an interview-mode pool with a web-mode pool. NAEP years 2003 through 2024 stay in the score. Current is the pool ending when the exposure window ends. Past 1 year is the pool ending the year before that. At a lag of 0, current is the pool in the NAEP year. The 5-year and 15-year lines are means of the published overlapping two-year pools in that span. Scores are population-weighted z-scores within each NAEP year. Each grade’s composite is the mean of that grade’s mathematics and reading z-scores. Weights are the ages-12-or-older population in the NAEP year. Partial r residualizes the exposure and the score on log density, percent ages 18–25, percent ages 12–17, and bachelor’s share. Those controls do not change over time. Median household income is not in the region file. Alaska and Hawaii are absent from it. The birth-to-age-5 line is adult state use, ages 12 or older, over pool end years t−14 through t−9 for grade 8 students tested in year t. CSV: <a href="nsduh-vote-ecological/results/marijuana_score_correlations.csv">marijuana_score_correlations.csv</a>.</p>
<p>The suggestibility curve is linear on the logit between placebo and the Kloft dose, placed at 14% THC: half a gram of flower, 30% of the THC inhaled, 21 mg. Past that dose the band adds 35% uncertainty on the extra climb. The IQ curve multiplies the 8-point Dunedin loss by potency divided by 7.1%. Sampling error on the anchor is 2.5 points. Past 7.1% the band adds 50% uncertainty on the extra loss. Dots are measured. The rest of each curve is a prediction.</p>
<p>Child contrasts that publish a point difference are on the chart, in standard deviations. IQ-point results are the published points divided by 15. ABCD microdata are not used. Pittsburgh, Ottawa, and Generation R state a direction and do not state a point difference, so they are not on the chart. Paul et al., <a href="https://doi.org/10.1001/jamapsychiatry.2020.2902">10.1001/jamapsychiatry.2020.2902</a>. Flak et al., <a href="https://doi.org/10.1111/acer.12214">10.1111/acer.12214</a>. Yang and Kramer, <a href="https://doi.org/10.1093/ije/dys071">10.1093/ije/dys071</a>. Raman, Prasad, and Appaya, <a href="https://doi.org/10.4103/0019-5545.74313">10.4103/0019-5545.74313</a>.</p>
<p>Dworak, Revelle, and Condon, Intelligence, 2023, <a href="https://doi.org/10.1016/j.intell.2023.101734">10.1016/j.intell.2023.101734</a>. Table 1 publishes −0.023 SD per year. Figure 1 draws yearly means by education and does not print them. The supplement and <a href="https://osf.io/kmgx8">osf.io/kmgx8</a> do not print them either. Those means stay off the NAEP chart. The ICAR figure on this page is that published slope, not a correlation of use with a line drawn from it.</p>
<p>Vote join: NSDUH 2021–2023 substate small-area estimates, SAMHSA shapefile SubstateRegionData212223, and 2024 presidential votes reallocated to ZCTAs by land cover, Harvard Dataverse 10.7910/DVN/Z8TSH3, with age and education from the ACS 2019–2023 5-year file. Alaska and Hawaii are absent from the vote file.</p>
<p>Shapefile outcome list: <a href="https://www.samhsa.gov/data/sites/default/files/reports/rpt56951/2023-sae-sub-region-shape-file/2023-sae-sub-region-shape-file.htm">SAMHSA, 2021–2023 substate region shapefile description</a>. Thirty-nine outcomes. Use rates and disorder rates entered above are the ones in that list.</p>
<p>Suggestibility and IQ: Kloft et al., PNAS 2020, 10.1073/pnas.1920162117. Meier et al., PNAS 2012, 10.1073/pnas.1206820109. Potency series: NIDA / University of Mississippi analyses of DEA-seized cannabis, 1995–2022. The vote regression, the Kloft rates, the Gawrylowicz rates, and the Dunedin 8-point loss are measured. The two potency curves are predictions.</p>
<p>Federal contributions: OpenSecrets industry totals for Beer, Wine &amp; Liquor (N02), Pharmaceuticals / Health Products (H04), and Marijuana (N09). Archive capture 2026-07-16, and the live N09 page, both read 2026-10-11. The 2024 cycle is January 1, 2023 through December 31, 2024. FEC release dated February 6, 2025. CSV: <a href="nsduh-vote-ecological/results/industry_donations.csv">industry_donations.csv</a>.</p>
<p>Federal lobbying: OpenSecrets calculations from the Senate Office of Public Records, calendar 2024, January through December. Retrieved 2026-10-11. Marijuana <a href="https://www.opensecrets.org/federal-lobbying/industries/summary?cycle=2024&amp;id=N09">N09</a> $5,248,000. Beer, wine, and liquor <a href="https://www.opensecrets.org/federal-lobbying/industries/summary?cycle=2024&amp;id=N02">N02</a> $29,893,357. Pharmaceuticals and health products <a href="https://www.opensecrets.org/federal-lobbying/industries/summary?cycle=2024&amp;id=H04">H04</a> $391,572,500. Cresco Labs in-house LD-2 expenses, lda.gov filings for 2024 Q1–Q4, sum to the $1,150,000 client line. Client lines: <a href="nsduh-vote-ecological/results/industry_lobbying_clients_2024.csv">industry_lobbying_clients_2024.csv</a>.</p>
<p>State ballot support: Ballotpedia’s compilation of state reports, retrieved 2026-10-11. Florida Amendment 3, Smart &amp; Safe Florida, account 83475, reports through December 31, 2024, <a href="https://ballotpedia.org/Florida_Amendment_3,_Marijuana_Legalization_Initiative_(2024)">Ballotpedia</a>, committee page <a href="https://dos.elections.myflorida.com/committees/ComDetail.asp?account=83475">dos.elections.myflorida.com</a>. Nebraska Initiatives 437 and 438, Nebraskans for Medical Marijuana, reports through January 14, 2025. North Dakota Initiated Measure 5, New Economic Frontier, reports through January 31, 2025. South Dakota Initiated Measure 29, reports through December 31, 2024. CSV: <a href="nsduh-vote-ecological/results/cannabis_ballot_2024.csv">cannabis_ballot_2024.csv</a>. Category totals: <a href="nsduh-vote-ecological/results/industry_spending_2024.csv">industry_spending_2024.csv</a>.</p>
<p>FEC comparison, retrieved 2026-10-11: schedule A by employer, cycle 2024, and committee totals for C00771592, C00764571, C00849398, and C00528026. OpenSecrets marijuana PAC-to-candidate page, 2023–2024, $68,500. CSVs: <a href="nsduh-vote-ecological/results/cannabis_fec_employers_2024.csv">cannabis_fec_employers_2024.csv</a>, <a href="nsduh-vote-ecological/results/cannabis_fec_pacs_2024.csv">cannabis_fec_pacs_2024.csv</a>.</p>
<p>Use, scores, and the vote over time. NSDUH state and national small-area estimates, ages 12 or older, two-year pools from 1999–2000 through 2018–2019 and from 2021–2022 through 2023–2024: <a href="https://www.samhsa.gov/data/sites/default/files/NSDUH_99_19_state_saes_final.sas7bdat">1999–2019 SAE file</a> and <a href="https://www.samhsa.gov/data/sites/default/files/NSDUH_files/SAE/state_saes_final_2124.sas7bdat">2021–2024 SAE file</a>, retrieved 2026-10-11. The 2019–2020 pool was not produced. The gold band is the 2021 web-mode break. NAEP composite means, mathematics and reading, grades 4 and 8, all students: NCES Data Service, national public and state public, retrieved 2026-10-11. The service returned state mathematics from 1996 and state reading from 1998. The ICAR35 figure beside that chart is Table 1 in Dworak, Revelle, and Condon, Intelligence 98 (2023) 101734, <a href="https://doi.org/10.1016/j.intell.2023.101734">10.1016/j.intell.2023.101734</a>: −0.023 SD per year. Figure 1 draws yearly means by education and does not print them. The supplement and <a href="https://osf.io/kmgx8">osf.io/kmgx8</a> do not print them either. Presidential two-party share, 2004–2020: MIT Election Data and Science Lab, U.S. President 1976–2020, Harvard Dataverse <a href="https://doi.org/10.7910/DVN/42MVDX">10.7910/DVN/42MVDX</a>, file version 20210113. The 2024 rows use the same columns, file version 2025-11-20, retrieved 2026-10-11: Kamala D. Harris 75,017,613 and Donald J. Trump 77,302,580. Adult-use years: Council of State Governments, Book of the States, table 7.22, November 2023, and NCSL, Cannabis Overview, updated June 20, 2024, for Vermont and Delaware.</p>
<p>Group slopes and correlations. Group A is marijuana, hallucinogens, alcohol, and cocaine. Group B is opioid misuse, pain-reliever misuse, and methamphetamine. Heroin is estimated omitted and inside group B. Pharmacology: Kloft et al., PNAS 2020, 10.1073/pnas.1920162117. Nichols, Pharmacological Reviews 2016, 10.1124/pr.115.011478. Carhart-Harris et al., Psychopharmacology 2015, 10.1007/s00213-014-3714-z. Volkow et al., Nature 1997, 10.1038/386827a0. Pathan and Williams, British Journal of Pain 2012, 10.1177/2049463712438493. Cruickshank and Dyer, Addiction 2009, 10.1111/j.1360-0443.2009.02564.x. CSV: <a href="nsduh-vote-ecological/results/group_slopes.csv">group_slopes.csv</a>. The state correlation table is <a href="nsduh-vote-ecological/results/state_window_correlations.csv">state_window_correlations.csv</a>. The marijuana score grid is <a href="nsduh-vote-ecological/results/marijuana_score_correlations.csv">marijuana_score_correlations.csv</a>.</p>
<p>Files: <a href="nsduh-vote-ecological/results/region_level.csv">region_level.csv</a>, <a href="nsduh-vote-ecological/results/results.json">results.json</a>, <a href="nsduh-vote-ecological/results/extended.json">extended.json</a>, <a href="nsduh-vote-ecological/results/quintiles.csv">quintiles.csv</a>, <a href="nsduh-vote-ecological/results/user_nonuser.csv">user_nonuser.csv</a>, <a href="nsduh-vote-ecological/results/state_level.csv">state_level.csv</a>, <a href="nsduh-vote-ecological/data/nsduh_sae_long.csv">nsduh_sae_long.csv</a>, <a href="nsduh-vote-ecological/data/naep_scores.csv">naep_scores.csv</a>, <a href="nsduh-vote-ecological/data/president_twoparty.csv">president_twoparty.csv</a>, <a href="nsduh-vote-ecological/data/cannabis_adult_use.csv">cannabis_adult_use.csv</a>, <a href="nsduh-vote-ecological/results/state_changes.csv">state_changes.csv</a>, <a href="nsduh-vote-ecological/over_time.py">over_time.py</a>, <a href="nsduh-vote-ecological/data/substate_outcomes_212223.csv">substate_outcomes_212223.csv</a>, <a href="nsduh-vote-ecological/run_regression.py">run_regression.py</a>, <a href="nsduh-vote-ecological/fit_extended.py">fit_extended.py</a>, <a href="nsduh-vote-ecological/README.md">method note</a>.</p>
</div>
</details>
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
