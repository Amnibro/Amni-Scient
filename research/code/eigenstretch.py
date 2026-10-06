import argparse, json, os, platform, sys, time
os.environ.setdefault("OPENBLAS_NUM_THREADS", "1"); os.environ.setdefault("OMP_NUM_THREADS", "1")
from multiprocessing import Pool
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from reffelt_constant import VERSION as RC_VERSION, graph, encode, reffelt
VERSION = "2.0.0"
HERE = os.path.dirname(os.path.abspath(__file__))
D, T, W, STEP, TAU, BURN, NA, MU, LAM, NR, MDRIFT, SIG_ID, RAMP = 10, 3000, 400, 100, 1700, 4, 768, 32, 64, 16, 0.15, 0.7, 800
def w1_matrix(curves, chunk=32):
    Q = np.sort(curves, 1)
    return np.vstack([np.abs(Q[i:i + chunk, None] - Q[None]).mean(2) for i in range(0, len(Q), chunk)])
def stretch(params, scores, curves, k=32, eps=0.1, n_modes=16, seed=0):
    M = w1_matrix(curves); pos = M[M > 0]; M = M / (np.median(pos) if pos.size else 1.0)
    return reffelt(params, scores, "unbiased", k=k, eps=eps, n_modes=n_modes, seed=seed, dist=M)
def stretch_v1(curves, k=64, rank=16):
    Z = (curves - curves.mean(1, keepdims=True)) / np.maximum(curves.std(1, keepdims=True), 1e-8)
    L1 = np.vstack([np.abs(Z[i:i + 32, None] - Z[None]).sum(2) for i in range(0, len(Z), 32)])
    n = len(Z); np.fill_diagonal(L1, np.inf); J = np.argpartition(L1, k - 1, 1)[:, :k]; G = np.zeros((n, n)); np.put_along_axis(G, J, 1.0, 1); G = (G + G.T) / 2
    return np.sort(np.abs(np.linalg.eigvalsh(G)))[::-1][:rank]
def drift(w, ref):
    w, ref = np.asarray(w, float), np.asarray(ref, float)
    return float(1 - np.corrcoef(w, ref)[0, 1]) if w.std() > 0 and ref.std() > 0 else 1.0
def market(rng, kind):
    t = np.arange(T); m = MDRIFT; r = np.clip((t - TAU) / RAMP, 0, 1); a = (t < TAU).astype(float)
    mu = {"control": [np.full(T, m), 0 * t, 0 * t], "swap": [m * a, m * (1 - a), 0 * t], "ramp": [m * (1 - r), m * r, 0 * t], "flip": [m * (2 * a - 1), 0 * t, 0 * t]}[kind]
    return np.stack(mu).astype(float) + rng.standard_normal((3, T))
def exposures(P, act): return np.stack([2 * P[:, act[0]] - 1, np.sin(np.pi * P[:, act[1]]) * (2 * P[:, act[2]] - 1), 2 * P[:, act[3]] - 1], 1)
def sharpe(inc, n): return inc.mean(1) / np.maximum(inc.std(1), 1e-12) * np.sqrt(n)
def simulate(args):
    seed, kind = args
    rng = np.random.default_rng(seed); act = rng.choice(D, 4, replace=False); F = market(rng, kind)
    P = rng.random((512, D)); NZ = rng.standard_normal((512, T)) * SIG_ID; cps = []
    for t in range(W, T + 1, STEP):
        inc = exposures(P, act) @ F[:, t - W:t] + NZ[:, t - W:t]; sc = sharpe(inc, W); o = np.argsort(-sc); el = o[:NA]; cur = np.cumsum(inc[el], 1)
        r = stretch(P[el], sc[el], cur, seed=seed + t); top = o[:16]
        oos = float(sharpe(exposures(P[top], act) @ F[:, t:t + STEP] + NZ[top, t:t + STEP], STEP).mean()) if t + STEP <= T else None
        cps.append(dict(t=t, w=[round(v, 5) for v in r["causal_weights"]], digits=r["constant"], ev_v1=[round(float(v), 5) for v in stretch_v1(cur)], elite=float(sc[top].mean()), oos=oos))
        par = P[o[:MU]]; C = par[rng.integers(MU, size=LAM)] + .08 * rng.standard_normal((LAM, D)); C = 1 - np.abs(1 - np.abs(C))
        P = np.vstack([P, C, rng.random((NR, D))]); NZ = np.vstack([NZ, rng.standard_normal((LAM + NR, T)) * SIG_ID])
    return dict(seed=seed, kind=kind, active=[int(a) for a in act], checkpoints=cps)
def page_hinkley(x):
    ph, mn, cum = [], 0.0, 0.0
    for i in range(len(x)):
        cum += np.mean(x[:i + 1]) - x[i]; mn = min(mn, cum); ph.append(cum - mn)
    return ph
def compact(run):
    c = run["checkpoints"]; ref = np.mean([x["w"] for x in c[:BURN]], 0); ref1 = np.array(c[0]["ev_v1"]); a = run["active"]
    s2 = [drift(x["w"], ref) for x in c]; s2w = [drift(np.mean([y["w"] for y in c[i - 2:i + 1]], 0), np.mean([y["w"] for y in c[i - 5:i - 2]], 0)) if i >= 5 else 0.0 for i in range(len(c))]
    oos = [x["oos"] for x in c]; pho = [0.0] + page_hinkley([v for v in oos if v is not None])[:len(c) - 1]
    st = {"eigenstretch_v2": s2, "eigenstretch_v2_two_window": s2w, "holographic_v1": [drift(x["ev_v1"], ref1) for x in c], "page_hinkley_elite_score": page_hinkley([x["elite"] for x in c]), "page_hinkley_live_oos": pho}
    r4 = lambda v: [None if x is None else round(float(x), 4) for x in v]
    return dict(seed=run["seed"], kind=run["kind"], active=a, stats={k: r4(v) for k, v in st.items()}, oos=r4(oos), elite=r4([x["elite"] for x in c]), share_trend=r4([x["w"][a[0]] for x in c]), share_new=r4([x["w"][a[1]] + x["w"][a[2]] for x in c]))
def first_alarm(stat, h, ts, start, end=None): return next((t for t, v in zip(ts, stat) if t >= start and (end is None or t <= end) and v > h), None)
def evaluate(cal, test, ts, horizon=1000, target_far=0.05):
    t0 = ts[BURN]; out = {}; drop = {}; names = list(cal[0]["stats"]); win = lambda s, h: first_alarm(s, h, ts, TAU, TAU + horizon) is not None
    for k in test:
        mo = np.array([np.nanmean([np.nan if r["oos"][i] is None else r["oos"][i] for r in test[k]]) if any(r["oos"][i] is not None for r in test[k]) else np.nan for i in range(len(ts))])
        pre_m = np.nanmean(mo[[i for i, t in enumerate(ts) if t0 <= t and t + STEP <= TAU]]); post = [i for i, t in enumerate(ts) if t >= TAU and not np.isnan(mo[i])]; post_m = np.nanmean(mo[post[-6:]])
        hit = next((ts[i] + STEP for i in range(len(ts)) if ts[i] + STEP > TAU and not np.isnan(mo[i]) and mo[i] < (pre_m + post_m) / 2), None) if k != "control" else None
        drop[k] = dict(pre_mean_oos=round(float(pre_m), 4), late_mean_oos=round(float(post_m), 4), drop_time=hit, mean_oos_curve=[None if np.isnan(v) else round(float(v), 4) for v in mo])
    for name in names:
        mx = np.array([max(v for t, v in zip(ts, r["stats"][name]) if t >= t0) for r in cal]); h_cal = float(np.quantile(mx, 1 - target_far))
        allv = np.concatenate([np.array(r["stats"][name], float) for k in test for r in test[k]] + [mx]); sweep = np.unique(np.quantile(allv, np.linspace(0, 1, 101)))
        res = dict(threshold_calibrated=round(h_cal, 5), scenarios={}, roc={})
        for k in test:
            al = [first_alarm(r["stats"][name], h_cal, ts, t0) for r in test[k]]
            if k == "control":
                res["scenarios"][k] = dict(n=len(al), false_alarm_rate=float(np.mean([a is not None for a in al])), alarm_in_change_window=float(np.mean([win(r["stats"][name], h_cal) for r in test[k]])))
                continue
            ok = [a for a in al if a is not None and TAU <= a <= TAU + horizon]; dt = drop[k]["drop_time"]; q = lambda v, p: float(np.percentile(v, p))
            res["scenarios"][k] = dict(n=len(al), detection_rate=float(len(ok) / len(al)), alarm_before_change=float(np.mean([a is not None and a < TAU for a in al])), alarm_in_change_window=float(np.mean([win(r["stats"][name], h_cal) for r in test[k]])),
                                       delay_median=float(np.median([a - TAU for a in ok])) if ok else None, delay_iqr=[q([a - TAU for a in ok], 25), q([a - TAU for a in ok], 75)] if ok else None,
                                       lead_vs_score_drop_median=float(np.median([dt - a for a in ok])) if ok and dt else None, lead_vs_score_drop_iqr=[q([dt - a for a in ok], 25), q([dt - a for a in ok], 75)] if ok and dt else None, frac_alarms_before_drop=float(np.mean([a < dt for a in ok])) if ok and dt else None)
        for k in [x for x in test if x != "control"]:
            pts = sorted({(float(np.mean([win(r["stats"][name], h) for r in test["control"]])), float(np.mean([win(r["stats"][name], h) for r in test[k]]))) for h in sweep} | {(0.0, 0.0), (1.0, 1.0)})
            xs, ys = [p[0] for p in pts], [p[1] for p in pts]
            res["roc"][k] = dict(points=[[round(a, 4), round(b, 4)] for a, b in pts], auc=round(float(sum((xs[i + 1] - xs[i]) * (ys[i + 1] + ys[i]) / 2 for i in range(len(xs) - 1))), 4))
        out[name] = res
    curves = {k: {name: [round(float(np.mean([r["stats"][name][i] for r in test[k]])), 4) for i in range(len(ts))] for name in names} for k in test}
    share = {k: dict(weight_on_trend_dim=[round(float(np.mean([r["share_trend"][i] for r in test[k]])), 4) for i in range(len(ts))], weight_on_new_dims=[round(float(np.mean([r["share_new"][i] for r in test[k]])), 4) for i in range(len(ts))]) for k in test}
    hand = {k: dict(v2_alarm_rate_corr_below_0_7=float(np.mean([any(v > 0.3 for t, v in zip(ts, r["stats"]["eigenstretch_v2"]) if t >= t0) for r in test[k]])), v2_alarm_rate_corr_below_0_9=float(np.mean([any(v > 0.1 for t, v in zip(ts, r["stats"]["eigenstretch_v2"]) if t >= t0) for r in test[k]])), v1_alarm_rate_corr_below_0_9=float(np.mean([any(v > 0.1 for t, v in zip(ts, r["stats"]["holographic_v1"]) if t >= t0) for r in test[k]]))) for k in test}
    return dict(checkpoints=ts, burn_in_end=t0, change_time=TAU, horizon=horizon, target_false_alarm_rate=target_far, roc_definition="TPR = share of change runs with any alarm in [change, change + horizon]; FPR = share of paired control runs (same seeds) with any alarm in the same window", detectors=out, score_drop=drop, mean_statistic_curves=curves, stretch_weight_share=share, hand_thresholds=hand)
def bench(n_seeds, n_cal, jobs, out_path, seed0):
    t0 = time.time(); kinds = ["control", "swap", "ramp", "flip"]
    tasks = [(seed0 + 10000 + i, "control") for i in range(n_cal)] + [(seed0 + i, k) for k in kinds for i in range(n_seeds)]
    with Pool(jobs) as p: runs = p.map(simulate, tasks, chunksize=1)
    ts = [x["t"] for x in runs[0]["checkpoints"]]; ex = next(r for r in runs if r["kind"] == "swap" and r["seed"] == seed0); recs = [compact(r) for r in runs]
    cal = recs[:n_cal]; test = {k: [r for r in recs[n_cal:] if r["kind"] == k] for k in kinds}
    res = dict(name="Eigenstretch v2 benchmark", version=VERSION, reffelt_version=RC_VERSION, date=time.strftime("%Y-%m-%d"), python=platform.python_version(), numpy=np.__version__, runtime_s=round(time.time() - t0, 1),
               config=dict(D=D, bars=T, window=W, checkpoint_every=STEP, change_time=TAU, ramp_bars=RAMP, burn_in_checkpoints=BURN, archive_top_n=NA, es_mu=MU, es_lambda=LAM, random_restarts=NR, factor_drift=MDRIFT, idio_sd=SIG_ID, k=32, eps=0.1, n_modes=16, reading="unbiased", seeds_test=[seed0, seed0 + n_seeds - 1], seeds_calibration=[seed0 + 10000, seed0 + 10000 + n_cal - 1], scenarios=dict(control="factor 1 drifts throughout", swap="drift moves from factor 1 to factor 2 at the change", ramp="drift moves linearly from factor 1 to factor 2 over 800 bars from the change", flip="factor 1 drift changes sign at the change")),
               evaluation=evaluate(cal, test, ts), example_run=dict(seed=ex["seed"], kind="swap", active=ex["active"], digits=[x["digits"] for x in ex["checkpoints"]], weights=[x["w"] for x in ex["checkpoints"]]), runs=recs)
    json.dump(res, open(out_path, "w"), separators=(",", ":"))
    return res
def reevaluate(path):
    r = json.load(open(path)); n_cal = r["config"]["seeds_calibration"][1] - r["config"]["seeds_calibration"][0] + 1; recs = r["runs"]
    return evaluate(recs[:n_cal], {k: [x for x in recs[n_cal:] if x["kind"] == k] for k in ["control", "swap", "ramp", "flip"]}, r["evaluation"]["checkpoints"]) == r["evaluation"]
def main():
    ap = argparse.ArgumentParser(description="Eigenstretch v2: the Reffelt v2 stretch vector on a W1 output-curve graph, recomputed per checkpoint, with a drift statistic calibrated on stationary runs.")
    sp = ap.add_subparsers(dest="cmd", required=True)
    b = sp.add_parser("bench", help="simulated searches with and without a regime change; writes ../eigenstretch_results.json")
    b.add_argument("--seeds", type=int, default=30); b.add_argument("--cal", type=int, default=30); b.add_argument("--jobs", type=int, default=4); b.add_argument("--seed0", type=int, default=0)
    b.add_argument("--out", default=os.path.normpath(os.path.join(HERE, "..", "eigenstretch_results.json")))
    v = sp.add_parser("check", help="recompute the evaluation from the per-run traces stored in a results JSON and compare")
    v.add_argument("path", nargs="?", default=os.path.normpath(os.path.join(HERE, "..", "eigenstretch_results.json")))
    d = sp.add_parser("demo", help="one simulated run, prints digits and drift per checkpoint")
    d.add_argument("--kind", default="swap", choices=["control", "swap", "ramp", "flip"]); d.add_argument("--seed", type=int, default=0)
    a = ap.parse_args()
    if a.cmd == "bench":
        r = bench(a.seeds, a.cal, a.jobs, a.out, a.seed0); ev = r["evaluation"]["detectors"]
        for n, v in ev.items(): print(n, json.dumps({k: {kk: vv for kk, vv in s.items() if kk in ("false_alarm_rate", "detection_rate", "delay_median", "lead_vs_score_drop_median")} for k, s in v["scenarios"].items()}), {k: x["auc"] for k, x in v["roc"].items()})
        print("wrote", a.out, "in", r["runtime_s"], "s")
    elif a.cmd == "check":
        print("evaluation reproduced from stored traces:", reevaluate(a.path))
    else:
        r = simulate((a.seed, a.kind)); st = compact(r)["stats"]
        print("active dims", r["active"], "change at bar", TAU if a.kind != "control" else None)
        for x, dv in zip(r["checkpoints"], st["eigenstretch_v2"]): print(x["t"], x["digits"], "drift=%.3f" % dv, "elite=%.2f" % x["elite"])
if __name__ == "__main__": main()
