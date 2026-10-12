from __future__ import annotations
import math
from key_charts import DATA, OTHER_C, _block, _dual, _e, _rl, _rows, _scale, _t
RED, PURPLE, ORANGE, GREEN, GRAY = "#DC2626", "#7C3AED", "#EA580C", "#16A34A", "#A8A29E"
def studies(chart):
    return [{**r, **{k: float(r[k]) if r[k] else None for k in ("value", "low", "high", "baseline")}} for r in _rows("psych_anger_studies.csv") if r["chart"] == chart]
def _whisk(X, lo, hi, y):
    return f'<line x1="{X(lo):.1f}" y1="{y}" x2="{X(hi):.1f}" y2="{y}" class="whisk"/><line x1="{X(lo):.1f}" y1="{y - 6}" x2="{X(lo):.1f}" y2="{y + 6}" class="whisk"/><line x1="{X(hi):.1f}" y1="{y - 6}" x2="{X(hi):.1f}" y2="{y + 6}" class="whisk"/>'
def _labels(y, r, m=False):
    return _rl(True, y, r["label"], r["detail"]) if m else [_t(8, y + 17, _e(r["label"]), style="font-weight:700;font-size:12px"), _t(8, y + 33, _e(r["detail"]), "tick")]
def _geo(m, n, desk, mob):
    (w, rh, L, R, T), dy = (mob, 30) if m else (desk, 0)
    return w, rh, L, R, T, dy, T + n * rh + 30
def ratio_chart(rows, aria, xmax=10, words=("LOWER ODDS", "1× = SAME AS COMPARISON · HIGHER ODDS"), m=False):
    w, rh, L, R, T, dy, h = _geo(m, len(rows), (860, 46, 330, 64, 30), (400, 70, 8, 52, 30))
    ticks = [t for t in ((1, 2, 5, 10, 20, 50) if m else (0.5, 1, 2, 3, 5, 10, 20, 50)) if t <= xmax]
    X = (lambda f: lambda v: f(math.log(max(min(v, xmax), 0.5))))(_scale(math.log(0.5), math.log(xmax), L, w - R))
    p = [f'<svg viewBox="0 0 {w} {h}" role="img" class="chart" aria-label="{_e(aria)}">']
    p += [f'<line x1="{X(t):.1f}" y1="{T - 8}" x2="{X(t):.1f}" y2="{h - 26}" class="{"axis" if t == 1 else "grid"}"/>' + _t(X(t), h - 9, f"{t:g}×", "tick", "middle") for t in ticks]
    p += [_t(X(1) + 6, T - 14, f"{words[1].split('·')[-1].strip()} →", "marklab")] if m else [_t(X(1) - 6, T - 14, f"← {words[0]}", "marklab", "end"), _t(X(1) + 6, T - 14, f"{words[1]} →", "marklab")]
    for i, r in enumerate(rows):
        y0, sig = T + i * rh, r["low"] is not None and r["low"] > 1
        y, col = y0 + dy, RED if sig else OTHER_C
        p += _labels(y0, r, m) + ([_whisk(X, r["low"], r["high"], y + 22)] if r["low"] is not None else [])
        p += [f'<circle cx="{X(r["value"]):.1f}" cy="{y + 22}" r="6.5" fill="{col}"/>', _t(X(r["high"] if r["high"] else r["value"]) + 8, y + 26, f"{r['value']:g}×" + ("" if sig else " ns" if m else " · not significant"), style=f"fill:{col};font-weight:800;font-size:13px")]
    return "".join(p) + "</svg>"
def pct_chart(rows, aria, color, xmax=100, m=False):
    w, rh, L, R, T, dy, h = _geo(m, len(rows), (860, 46, 330, 70, 10), (400, 70, 8, 56, 10))
    X = _scale(0, xmax, L, w - R)
    p = [f'<svg viewBox="0 0 {w} {h}" role="img" class="chart" aria-label="{_e(aria)}">']
    p += [f'<line x1="{X(t):.1f}" y1="{T - 4}" x2="{X(t):.1f}" y2="{h - 26}" class="{"axis" if t == 0 else "grid"}"/>' + _t(X(t), h - 9, f"{t}%", "tick", "middle") for t in range(0, xmax + 1, (20 if xmax <= 60 else 25) if m else (10 if xmax <= 60 else 25))]
    for i, r in enumerate(rows):
        y, (col, op) = T + i * rh + dy, color(r)
        p += _labels(y - dy, r, m) + [f'<rect x="{X(0):.1f}" y="{y + 10}" width="{X(r["value"]) - X(0):.1f}" height="24" rx="2" fill="{col}" fill-opacity="{op}"/>']
        p += [_whisk(X, r["low"], r["high"], y + 22)] if r["low"] is not None else []
        p.append(_t(X(r["high"] if r["high"] else r["value"]) + 8, y + 27, f"{r['value']:g}%" if "25–30" not in r["detail"] else "25–30%", style=f"fill:{col};font-weight:800;font-size:13px"))
    return "".join(p) + "</svg>"
def teen_chart(rows, m=False):
    w, rh, L, R, T, dy, h = _geo(m, len(rows), (860, 62, 330, 110, 10), (400, 84, 8, 132, 10))
    X = _scale(0, 25, L, w - R)
    p = ['<svg viewBox="0 0 {} {}" role="img" class="chart" aria-label="Past-month marijuana use among teens with and without violent behavior">'.format(w, h)]
    p += [f'<line x1="{X(t):.1f}" y1="{T - 4}" x2="{X(t):.1f}" y2="{h - 26}" class="{"axis" if t == 0 else "grid"}"/>' + _t(X(t), h - 9, f"{t}%", "tick", "middle") for t in (0, 5, 10, 15, 20, 25)]
    for i, r in enumerate(rows):
        y = T + i * rh + dy
        p += _labels(y - dy, r, m)
        p += [f'<rect x="{X(0):.1f}" y="{y + 6 + j * 22}" width="{X(v) - X(0):.1f}" height="18" rx="2" fill="{c}"/>' + _t(X(v) + 6, y + 19.5 + j * 22, f"{v:g}% {tag}", style=f"fill:{c};font-weight:750;font-size:12px") for j, (v, c, tag) in enumerate(((r["value"], RED, "did it"), (r["baseline"], GRAY, "did not")))]
        p.append(_t(w - 8, y + 30, f"{r['value'] / r['baseline']:.1f}×", "lab", "end", "font-weight:800;font-size:16px;fill:" + RED))
    return "".join(p) + "</svg>"
TIMELINE = [
    ("Withdrawal symptoms start", "Budney 2003 · 18 heavy users", [(1, 3, 0.9)], [], "days 1–3"),
    ("Symptoms peak, anger and irritability among them", "Budney 2003", [(2, 6, 0.9)], [], "days 2–6"),
    ("Most symptoms end", "Budney 2003 · lasted 4 to 14 days", [(1, 4, 0.9), (4, 14, 0.35)], [], "by days 4–14"),
    ("Aggression in a lab task", "Kouri 1999 · chronic users vs own baseline", [], [(3, "up"), (7, "up"), (28, "baseline")], "up days 3 and 7"),
    ("Brain CB1 receptors", "Hirvonen 2012 · ~20% fewer in daily users", [(0, 28, 0.3)], [(28, "normal")], "normal by ~4 weeks"),
]
def timeline_chart(m=False):
    w, rh, L, R, T, dy, h = _geo(m, len(TIMELINE), (860, 46, 330, 120, 26), (400, 66, 8, 12, 26))
    X = _scale(0, 30, L, w - R)
    p = [f'<svg viewBox="0 0 {w} {h}" role="img" class="chart" aria-label="Cannabis withdrawal time course">', _t(X(0) + 4, T - 12, "STOPPED USING →", "marklab")]
    p += [f'<line x1="{X(t):.1f}" y1="{T - 4}" x2="{X(t):.1f}" y2="{h - 26}" class="{"axis" if t == 0 else "grid"}"/>' + _t(X(t), h - 9, f"day {t}" if t else "0", "tick", "middle") for t in ((0, 7, 14, 21, 28) if m else (0, 3, 7, 14, 21, 28))]
    for i, (lab, src, bars, marks, say) in enumerate(TIMELINE):
        y = T + i * rh + dy
        p += _labels(y - dy, {"label": lab, "detail": f"{src} · {say}" if m else src}, m)
        p += [f'<rect x="{X(a):.1f}" y="{y + 12}" width="{X(b) - X(a):.1f}" height="20" rx="2" fill="{ORANGE if i < 4 else PURPLE}" fill-opacity="{o}"/>' for a, b, o in bars]
        p += [f'<circle cx="{X(d):.1f}" cy="{y + 22}" r="7" fill="{"none" if k in ("baseline", "normal") else RED}" stroke="{RED if i < 4 else PURPLE}" stroke-width="2"/>' for d, k in marks]
        p += [] if m else [_t(w - 8, y + 26, say, "lab", "end", "font-weight:750;font-size:12px")]
    return "".join(p) + "</svg>"
HORMONES = [
    ("Cortisol under stress", "No cortisol rise to a lab stressor in chronic users, and a smaller rise in felt stress", "Cuttler 2017, 40 users vs 42 non-users", "10.1007/s00213-017-4648-z", "Measured, one lab study"),
    ("Daily cortisol rhythm", "Blunted morning rise, flatter daily slope, higher afternoon cortisol", "Glodosky 2024, 39 users vs 43 non-users", "10.1007/s00213-024-06709-3", "Measured, one study"),
    ("Resting cortisol", "Higher in users in one study (p = 0.002); a 2018 review calls the resting evidence mixed", "King 2011; Cservenka 2018 review", "10.3389/fpsyt.2018.00472", "Mixed"),
    ("Brain CB1 receptors", "About 20% fewer in the cortex of daily smokers, back to normal after about 4 weeks without use", "Hirvonen 2012, PET, 30 users vs 28 controls", "10.1038/mp.2011.82", "Measured, reversible"),
    ("Serotonin", "More CB1–5-HT2A receptor pairs in nasal nerve cells of users, rising with amount used. In mice, these pairs carry THC’s memory effects", "Galindo 2018 (human cells); Viñals 2015 (mice)", "10.1007/s12035-017-0833-7", "Weak in humans, mostly animal"),
]
def hormone_table():
    rows = "".join(f'<tr><td>{_e(a)}</td><td>{_e(b)}</td><td>{_e(c)}, <a href="https://doi.org/{d}">{d}</a></td><td>{_e(e)}</td></tr>' for a, b, c, d, e in HORMONES)
    return f'<div class="table-scroll"><table class="cmp psych-table"><thead><tr><th>System</th><th>What was found</th><th>Study</th><th>Strength</th></tr></thead><tbody>{rows}</tbody></table></div>'
def section_html():
    odds, share, conv, dep, vio, teens, pol = (studies(k) for k in ("odds", "share", "convert", "depend", "violence", "teens", "policy"))
    on = {r["label"]: r for r in share}
    place = lambda r: ((RED if "Ontario" in r["label"] else PURPLE if "Denmark" in r["label"] else ORANGE), 0.4 if ("before" in r["label"] or "1995" in r["label"]) else 0.9)
    leg = lambda items: '<div class="legend">' + "".join(f'<span><i style="background:{c};height:10px"></i>{_e(t)}</span>' for t, c in items) + "</div>"
    ax = lambda y, x: f'<p class="axis-name"><span>Y · {y}</span><span>X · {x}</span></p>'
    blocks = [
        _block("A", "Psychosis risk", f"People who used high-potency cannabis every day had {odds[-1]['value']:g} times the odds of a first psychotic episode", _dual(ratio_chart, odds, "Odds of psychotic disorder by cannabis use pattern", 10), ax("Use pattern", "Adjusted odds ratio, log scale"), "Measured. Di Forti 2019 compared 901 patients with a first psychotic episode against 1,237 population controls at 11 sites in Europe and Brazil, 2010–2015. Ratios are fully adjusted; the unadjusted ratio for daily use was 6.2. Marconi 2016 pools earlier studies. Red intervals exclude 1×. Odds ratios show association; people prone to psychosis may also be drawn to cannabis.", leg((("Interval excludes 1×", RED), ("Interval includes 1×", OTHER_C)))),
        _block("B", "Share of cases", f"In Ontario, the share of new schizophrenia cases tied to cannabis use disorder rose from {on['Ontario, before legalization']['value']:g}% before legalization to {on['Ontario, after legalization']['value']:g}% after it", _dual(pct_chart, share, "Share of schizophrenia or psychosis cases attributable to cannabis", place, 70), ax("Place and period", "Share of new cases attributable to cannabis, %"), "Measured inputs, modeled share. A population-attributable fraction is the share of cases that would not occur if the exposure were causal and removed. Ontario’s total schizophrenia rate stayed stable over the period, while psychosis not otherwise specified rose 83.7% after legalization (Myran 2025). Denmark’s since-2010 bar is the midpoint of the published 6–8% range.", leg((("Ontario", RED), ("Denmark", PURPLE), ("European sites, high-potency use", ORANGE), ("Lighter bar = earlier period", GRAY)))),
        _block("C", "Lasting illness", f"About {conv[0]['value']:.0f}% of people treated for cannabis-induced psychosis in Denmark were later diagnosed with schizophrenia or bipolar disorder", _dual(pct_chart, conv, "Share of substance-induced psychosis converting to schizophrenia or bipolar disorder", lambda r: (OTHER_C if "Any" in r["label"] else RED, 0.9), 60), ax("Starting diagnosis", "Later diagnosed, %"), "Measured. Danish national registers followed people after a hospital diagnosis of substance-induced psychosis. The rate after cannabis was the highest of any substance in Starzer 2018. Murrie 2020 pools six studies."),
        _block("D", "Dependence and withdrawal", f"About 1 in 5 people who use cannabis has a use disorder, and {dep[-1]['value']:g}% of frequent users in withdrawal report hostility", _dual(pct_chart, dep, "Cannabis use disorder, withdrawal, and anger symptoms", lambda r: (RED if r["label"].startswith(("Became", "Hostility")) else PURPLE if "Withdrawal" in r["label"] else ORANGE, 0.9)), ax("Measure", "Percent"), "Measured. Meta-analyses and US national surveys. The first criterion for cannabis withdrawal in DSM-5 is irritability, anger, or aggression. Withdrawal is more common the heavier the use: 17% of regular users in the general population, 87% of inpatients.", leg((("Use disorder", ORANGE), ("Withdrawal", PURPLE), ("Anger symptoms in withdrawal", RED)))),
        _block("E", "Anger after stopping", "Withdrawal irritability and aggression start within 1–3 days of stopping, peak by day 6, and fade within about 4 weeks", _dual(timeline_chart), ax("Measure", "Days since last use"), "Measured. Budney 2003 tracked symptoms daily through 45 days of abstinence. Kouri 1999 measured aggressive responding in a laboratory task, which rose on days 3 and 7 and returned to the pre-withdrawal level by day 28. Hirvonen 2012 imaged brain CB1 receptors. Small samples."),
        _block("F", "Violence", "Across studies, people who used cannabis had about 2 to 9 times the odds of violence", _dual(ratio_chart, vio, "Odds of violence by cannabis use", 50), ax("Study and group", "Odds ratio, log scale"), "Measured. Schoeler 2016 followed 411 South London men; continued use from 18 to 48 predicted later violence, and earlier violence also predicted use, so the link runs both ways. The meta-analyses include studies with and without adjustment; the adjusted-only estimate is shown separately.", leg((("Interval excludes 1×", RED), ("Interval includes 1×", OTHER_C)))),
        _block("G", "US teens", f"Teens who attacked someone to seriously hurt them were {teens[0]['value'] / teens[0]['baseline']:.1f} times as likely to have used marijuana in the past month", _dual(teen_chart, teens), ax("Behavior in the past year", "Used marijuana in the past month, %"), "Measured. NSDUH 2012 detailed table 3.23B, ages 12–17. The table gives marijuana use among teens who did or did not do each thing; it does not show which came first."),
        _block("H", "After legalization", "Whole-population studies after legalization found smaller, mixed changes: two significant rises in psychosis visits, and no significant change in psychosis diagnoses or assault injuries", _dual(ratio_chart, pol, "Psychosis and assault outcomes after cannabis legalization", 3, ("FELL", "1× = NO CHANGE · ROSE")), ax("Outcome and study", "Rate ratio after vs before, log scale"), "Measured. Elser 2023 and Matthay 2021 use US commercial and Medicare Advantage claims, where 77% of Elser’s follow-up time was people 65 and older, the group least likely to use. Wang 2022 is per added recreational dispensary per 10,000 residents in Colorado counties. Myran 2023 compares Ontario’s commercial-store period with before legalization; for ages 19–24 the ratio was 1.63. Matthay 2021’s only significant change was in self-harm injuries among men under 40.", leg((("Interval excludes 1×", RED), ("Interval includes 1×", OTHER_C)))),
    ]
    return ('<h2 id="psychosis">Psychosis, dependence, and anger</h2><p>Published studies, not the state data above. Each number is from the paper cited in its row of <a href="nsduh-vote-ecological/data/psych_anger_studies.csv">psych_anger_studies.csv</a>, with the sentence it comes from. Almost all of it is observational: heavy use goes with psychosis and violence, and part of that runs the other way, from early illness or temperament to use.</p>'
        + "".join(blocks) + '<h3 class="kf-h">Stress hormones, serotonin, and receptors</h3><p>Cortisol and CB1 receptor changes are measured in human users. Serotonin changes in humans rest on one small cell study, with the mechanism shown in mice.</p>' + hormone_table())
