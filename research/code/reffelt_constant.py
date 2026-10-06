import argparse, csv, json, math, os, platform, time
from statistics import NormalDist
import numpy as np
VERSION = "2.0.0"
HERE = os.path.dirname(os.path.abspath(__file__))
def minmax(X):
    lo, hi = X.min(0), X.max(0)
    return (X - lo) / np.where(hi - lo > 0, hi - lo, 1.0)
def euclid(Z):
    sq = (Z * Z).sum(1)
    return np.sqrt(np.maximum(sq[:, None] + sq[None] - 2 * Z @ Z.T, 0))
def graph(Dm, s, k=32, eps=0.1, unit=False):
    n = len(Dm); k = min(k, n - 1); Dm = Dm.copy(); np.fill_diagonal(Dm, np.inf)
    J = np.argpartition(Dm, k - 1, 1)[:, :k]; d = np.take_along_axis(Dm, J, 1)
    sig = s.std() if s.std() > 0 else 1.0
    w = np.ones_like(d) if unit else np.exp(-np.abs(s[:, None] - s[J]) / sig) / (d + eps)
    A = np.zeros((n, n)); np.put_along_axis(A, J, w, 1)
    return np.maximum(A, A.T)
def modes(A, m, tol=1e-9):
    n = len(A); deg = A.sum(1); di = 1 / np.sqrt(np.maximum(deg, 1e-300))
    L = np.eye(n) - di[:, None] * A * di[None]
    if n > 3000:
        try:
            from scipy.sparse import csr_matrix
            from scipy.sparse.linalg import eigsh
            lam, U = eigsh(csr_matrix(L), k=min(n - 2, m + 8), sigma=-1e-3, which="LM"); o = np.argsort(lam); lam, U = lam[o], U[:, o]
        except ImportError:
            lam, U = np.linalg.eigh(L)
    else:
        lam, U = np.linalg.eigh(L)
    z = int((lam < tol).sum()); lam, U = lam[z:z + m], U[:, z:z + m]
    return lam, U, U * di[:, None], deg, z
def xi(x, Y, rng):
    n = len(x); p = rng.permutation(n); o = p[np.argsort(x[p], kind="stable")]; Y = Y.reshape(n, -1); out = np.empty(Y.shape[1])
    for c in range(Y.shape[1]):
        y = Y[:, c]; ys = np.sort(y); r = np.searchsorted(ys, y, "right"); l = n - np.searchsorted(ys, y, "left"); den = 2 * (l * (n - l)).sum()
        out[c] = 1 - n * np.abs(np.diff(r[o])).sum() / den if den > 0 else 0.0
    return out
def xi_matrix(X, Y, rng): return np.stack([xi(X[:, d], Y, rng) for d in range(X.shape[1])])
def freedom(X, F, rng, pairs_rows=2000):
    n = len(F); P = rng.permutation(n)[:pairs_rows]; sq = (F * F).sum(1)
    Dp = np.sqrt(np.maximum(sq[P, None] + sq[None] - 2 * F[P] @ F.T, 0)); Dp[np.arange(len(P)), P] = np.nan
    mu = np.nanmean(Dp); s0 = np.nanstd(Dp) / mu / math.sqrt(n - 1); out = np.empty(X.shape[1])
    for d in range(X.shape[1]):
        p = rng.permutation(n); o = p[np.argsort(X[p, d], kind="stable")]; out[d] = 1 - np.linalg.norm(np.diff(F[o], axis=0), axis=1).mean() / mu
    return out, s0
def encode(w, keep):
    r = len(w) * np.asarray(w, float)
    d = np.clip(5 + np.floor(np.log2(np.maximum(r, 1e-300))), 1, 9).astype(int)
    return "".join(str(int(v)) for v in np.where(keep, d, 0))
def reffelt(X, s, reading="elite", k=32, eps=0.1, n_modes=16, alpha=0.05, seed=0, dist=None, unit=False):
    X, s = np.asarray(X, float), np.asarray(s, float); n, D = X.shape; rng = np.random.default_rng(seed)
    A = graph(euclid(minmax(X)) if dist is None else dist, s, k, eps, unit)
    lam, U, F, deg, z0 = modes(A, n_modes)
    st = np.sqrt(deg) * (s - (deg * s).sum() / deg.sum()); c = U.T @ st; energy = c * c / max((c * c).sum(), 1e-300)
    shat = F @ c; sig0 = math.sqrt(2 / (5 * n))
    if reading == "unbiased":
        g = xi_matrix(X, shat, rng)[:, 0]; zs = g / sig0; gp = np.clip(g, 0, None); w = gp / gp.sum() if gp.sum() > 0 else np.full(D, 1 / D)
    else:
        g, sig0 = freedom(X, F, rng); zs = g / sig0; imp = 1 / np.maximum(g, sig0); w = imp / imp.sum()
    keep = D * w >= 1 - 1e-9; zc = NormalDist().inv_cdf(1 - alpha / D)
    return dict(version=VERSION, reading=reading, constant=encode(w, keep), z_crit_bonferroni=zc, significant=(zs > zc).tolist(), causal_weights=w.tolist(), **{"xi" if reading == "unbiased" else "freedom": g.tolist()}, z=zs.tolist(), null_sd=sig0, keep=keep.tolist(), eigenvalues=lam.tolist(), mode_energy=energy.tolist(), lowpass_r2=float(np.corrcoef(shat, s)[0, 1] ** 2), zero_modes=z0, n=n, D=D, k=min(k, n - 1), eps=eps, n_modes=len(lam), unit_weights=unit)
def reffelt_v1(X, s, k=32, eps=0.1):
    X, s = np.asarray(X, float), np.asarray(s, float); n, D = X.shape
    lam, U, _, _, _ = modes(graph(euclid(minmax(X)), s, k, eps), min(8, n - 2, D), tol=-1)
    g = np.array([np.abs(np.diff(U[np.argsort(X[:, d])], axis=0)).mean() for d in range(D)]); w = g / g.sum()
    p = np.abs(lam * w[np.arange(len(lam)) % D])
    return dict(constant="".join(str(9 if 100 * q > 1 else min(8, max(1, int(800 * q) + 1))) for q in p), causal_weights=w.tolist(), eigenvalues=lam.tolist())
FUNCS = {"additive": 5, "sobol_g": 4, "ishigami": 3, "interaction": 4, "ridge": 4}
def problem(name, D, rng):
    a = rng.choice(D, FUNCS[name], replace=False); act = np.zeros(D, bool); act[a] = True; u = lambda X, i: 2 * np.pi * X[:, a[i]] - np.pi
    if name == "additive": f = lambda X: (2 * X[:, a[0]] - 1) + .8 * np.sin(2 * np.pi * X[:, a[1]]) + .6 * (2 * (2 * X[:, a[2]] - 1) ** 2 - 1) + .4 * np.abs(4 * X[:, a[3]] - 2) + .2 * (2 * X[:, a[4]] - 1)
    elif name == "sobol_g":
        c = np.full(D, 99.0); c[a] = [0, 1, 4.5, 9]; f = lambda X: np.prod((np.abs(4 * X - 2) + c) / (1 + c), 1)
    elif name == "ishigami": f = lambda X: np.sin(u(X, 0)) + 7 * np.sin(u(X, 1)) ** 2 + .1 * u(X, 2) ** 4 * np.sin(u(X, 0))
    elif name == "interaction": f = lambda X: (2 * X[:, a[0]] - 1) * (2 * X[:, a[1]] - 1) + .7 * (2 * X[:, a[2]] - 1) * (2 * X[:, a[3]] - 1)
    else:
        v = rng.standard_normal(4); v /= np.linalg.norm(v); f = lambda X: np.sin(3 * (X[:, a] - .5) @ v) + 2 * ((X[:, a] - .5) @ v) ** 2
    return f, act
def total_sobol(f, D, rng, n=4096):
    A, B = rng.random((n, D)), rng.random((n, D)); fA = f(A); v = fA.var(); T = np.empty(D)
    for d in range(D):
        C = A.copy(); C[:, d] = B[:, d]; T[d] = ((fA - f(C)) ** 2).mean() / (2 * v)
    return T, math.sqrt(v)
def sample(f, D, rng, how, sd, noise, n=512, n0=256, gens=15, lam=128, mu=32):
    y = lambda X: f(X) + noise * sd * rng.standard_normal(len(X))
    if how == "random":
        X = rng.random((n, D)); return X, y(X)
    X = rng.random((n0, D)); s = y(X)
    for g in range(gens):
        P = X[np.argsort(-s)[:mu]]; C = P[rng.integers(mu, size=lam)] + .2 * .25 ** (g / (gens - 1)) * rng.standard_normal((lam, D)); C = 1 - np.abs(1 - np.abs(C))
        X, s = np.vstack([X, C]), np.r_[s, y(C)]
    o = np.argsort(-s)[:n]; return X[o], s[o]
def rank(v): return np.argsort(np.argsort(v, 0, kind="stable"), 0).astype(float)
def abs_spearman(X, s):
    R, r = rank(X), rank(s); R -= R.mean(0); r -= r.mean(); return np.abs(R.T @ r) / np.maximum(np.linalg.norm(R, axis=0) * np.linalg.norm(r), 1e-300)
def sobol1_binned(X, s, B=16):
    n, D = X.shape; out = np.empty(D)
    for d in range(D):
        b = np.minimum((rank(X[:, d]).astype(int) * B) // n, B - 1); cnt = np.bincount(b, None, B); mu = np.bincount(b, s, B) / np.maximum(cnt, 1)
        out[d] = (cnt * (mu - s.mean()) ** 2).sum() / n / s.var()
    return out
def knn_permutation(X, s, rng, k=10, reps=2):
    n, D = X.shape; Z = minmax(X); p = rng.permutation(n); te, tr = p[: n // 4], p[n // 4:]; Zt = Z[tr]
    pred = lambda Q: s[tr][np.argpartition((Q * Q).sum(1)[:, None] + (Zt * Zt).sum(1)[None] - 2 * Q @ Zt.T, k, 1)[:, :k]].mean(1)
    base = ((pred(Z[te]) - s[te]) ** 2).mean(); out = np.zeros(D)
    for d in range(D):
        for _ in range(reps):
            Q = Z[te].copy(); Q[:, d] = rng.permutation(Q[:, d]); out[d] += ((pred(Q) - s[te]) ** 2).mean() - base
    return np.clip(out / reps, 0, None)
def scores_of(w, act, T):
    w = np.asarray(w, float); m = int(act.sum()); prec = float(act[np.argsort(-w, kind="stable")[:m]].mean()); pos, neg = w[act], w[~act]
    auc = float((pos[:, None] > neg[None]).mean() + .5 * (pos[:, None] == neg[None]).mean())
    sp = float(np.corrcoef(rank(w), rank(T))[0, 1]) if w.std() > 0 else 0.0
    return dict(precision_at_k=prec, auc=auc, spearman_vs_total_sobol=sp)
METHODS = ["reffelt_v2_elite", "reffelt_v2_unbiased", "reffelt_v2_elite_unitgraph", "reffelt_v1", "abs_spearman", "chatterjee_xi_raw_score", "sobol1_binned", "knn_permutation"]
def cell(name, D, how, noise, seed):
    rng = np.random.default_rng(seed); f, act = problem(name, D, rng); T, sd = total_sobol(f, D, rng); X, s = sample(f, D, rng, how, sd, noise)
    rd = "elite" if how == "elite" else "unbiased"; r2, ru = reffelt(X, s, "elite", seed=seed), reffelt(X, s, "unbiased", seed=seed); r1 = reffelt_v1(X, s); rm = r2 if rd == "elite" else ru
    W = {"reffelt_v2_elite": r2["causal_weights"], "reffelt_v2_unbiased": ru["causal_weights"], "reffelt_v2_elite_unitgraph": reffelt(X, s, "elite", seed=seed, unit=True)["causal_weights"], "reffelt_v1": r1["causal_weights"],
         "abs_spearman": abs_spearman(X, s), "chatterjee_xi_raw_score": np.clip(xi_matrix(X, s, rng)[:, 0], 0, None), "sobol1_binned": sobol1_binned(X, s), "knn_permutation": knn_permutation(X, s, rng)}
    X2, s2 = sample(f, D, np.random.default_rng(seed + 7919), how, sd, noise); c2, c1b = reffelt(X2, s2, rd, seed=seed)["constant"], reffelt_v1(X2, s2)["constant"]
    keep = np.array(rm["keep"])
    return dict(metrics={m: scores_of(W[m], act, T) for m in METHODS}, reading=rd, v2_constant=rm["constant"], v2_retest=c2, v1_constant=r1["constant"], v1_retest=c1b, active=np.flatnonzero(act).tolist(), total_sobol=[round(float(t), 5) for t in T],
                freeze=dict(active_kept=float(keep[act].mean()), inactive_frozen=float((~keep[~act]).mean())), retest=dict(v2_digit_agreement=float(np.mean([a == b for a, b in zip(rm["constant"], c2)])), v2_mean_abs_digit_change=float(np.mean([abs(int(a) - int(b)) for a, b in zip(rm["constant"], c2)])), v1_digit_agreement=float(np.mean([a == b for a, b in zip(r1["constant"], c1b)]))), lowpass_r2=ru["lowpass_r2"])
def summarize(vals): a = np.array(vals, float); return dict(mean=round(float(a.mean()), 4), sd=round(float(a.std(ddof=1)), 4) if len(a) > 1 else 0.0, min=round(float(a.min()), 4), max=round(float(a.max()), 4))
def bench(seeds, out_path, quick=False):
    t0 = time.time(); grid = [(f, D, h, 0.2) for f in FUNCS for D in ((10,) if quick else (10, 20, 50)) for h in ("random", "elite")] + ([] if quick else [(f, 20, h, 1.0) for f in FUNCS for h in ("random", "elite")])
    cells = []
    for f, D, h, nz in grid:
        runs = [cell(f, D, h, nz, s) for s in range(seeds)]
        cells.append(dict(function=f, D=D, sampler=h, noise=nz, seeds=list(range(seeds)), active_count=FUNCS[f],
                          metrics={m: {k: summarize([r["metrics"][m][k] for r in runs]) for k in ("precision_at_k", "auc", "spearman_vs_total_sobol")} for m in METHODS},
                          auc_per_seed={m: [round(r["metrics"][m]["auc"], 4) for r in runs] for m in METHODS},
                          freeze={k: summarize([r["freeze"][k] for r in runs]) for k in ("active_kept", "inactive_frozen")}, retest={k: summarize([r["retest"][k] for r in runs]) for k in ("v2_digit_agreement", "v2_mean_abs_digit_change", "v1_digit_agreement")},
                          v1_digits_8_or_9=round(float(np.mean([np.mean([c in "89" for c in r["v1_constant"]]) for r in runs])), 4), lowpass_r2=summarize([r["lowpass_r2"] for r in runs]),
                          example=dict(seed=0, active=runs[0]["active"], v2_constant=runs[0]["v2_constant"], v2_retest=runs[0]["v2_retest"], v1_constant=runs[0]["v1_constant"], total_sobol=runs[0]["total_sobol"])))
        print(f, D, h, nz, " ".join(f"{m}={cells[-1]['metrics'][m]['auc']['mean']:.2f}" for m in METHODS), flush=True)
    pooled = {}
    for h in ("random", "elite"):
        cs = [c for c in cells if c["sampler"] == h and c["noise"] == 0.2]
        pooled[h] = {m: {k: summarize([c["metrics"][m][k]["mean"] for c in cs]) for k in ("precision_at_k", "auc", "spearman_vs_total_sobol")} for m in METHODS}
        best = [max((c["metrics"][m]["auc"]["mean"], m) for m in METHODS if not m.startswith("reffelt"))[1] for c in cs]; mine = "reffelt_v2_elite" if h == "elite" else "reffelt_v2_unbiased"
        pooled[h]["v2_vs_best_baseline_auc"] = dict(reading=mine, cells=len(cs), v2_beats_best_baseline=int(sum(c["metrics"][mine]["auc"]["mean"] > c["metrics"][b]["auc"]["mean"] for c, b in zip(cs, best))), v2_within_0_02_or_better=int(sum(c["metrics"][mine]["auc"]["mean"] >= c["metrics"][b]["auc"]["mean"] - 0.02 for c, b in zip(cs, best))), v2_beats_each_baseline={m: int(sum(c["metrics"][mine]["auc"]["mean"] > c["metrics"][m]["auc"]["mean"] for c in cs)) for m in METHODS if not m.startswith("reffelt")}, best_baseline_counts={b: best.count(b) for b in sorted(set(best))})
    res = dict(name="Reffelt Constant v2 benchmark", version=VERSION, date=time.strftime("%Y-%m-%d"), python=platform.python_version(), numpy=np.__version__, runtime_s=round(time.time() - t0, 1),
               config=dict(n_archive=512, k=32, eps=0.1, n_modes=16, alpha=0.05, noise_sd_fraction=[0.2, 1.0], random_search_n=512, elite=dict(initial=256, generations=15, lam=128, mu=32, sigma="0.2 to 0.05", keep_top=512), total_sobol_mc=4096, retest_seed_offset=7919, dims=[10, 20, 50], functions=FUNCS, dev_seeds_used_while_designing="1000-1003", reported_seeds=[0, seeds - 1]),
               readings=dict(elite="freedom M_d = 1 - mean ||F(pi_d(i+1)) - F(pi_d(i))|| / mean ||F_a - F_b|| over the retained-mode embedding F = D^-1/2 psi; importance w_d proportional to 1/max(M_d, s0), s0 = sd/mean of pair distances / sqrt(n-1)", unbiased="w_d proportional to max(xi(x_d -> graph low-pass of score), 0)"), digit_rule="r_d = D * w_d; digit 0 (freeze candidate) if r_d < 1, else min(9, 5 + floor(log2 r_d))", sampler_to_reading=dict(random="unbiased", elite="elite"), cells=cells, pooled=pooled)
    json.dump(res, open(out_path, "w"), indent=1)
    return res
def main():
    ap = argparse.ArgumentParser(description="Reffelt Constant v2: per-dimension sensitivity digits from a score-weighted k-NN graph Laplacian.")
    sp = ap.add_subparsers(dest="cmd", required=True)
    r = sp.add_parser("run", help="compute the constant for a CSV: one row per evaluated config, parameter columns then a score column (higher is better)")
    r.add_argument("csv"); r.add_argument("--score-col", default=None, help="score column name (default: last column)"); r.add_argument("--reading", default="elite", choices=["elite", "unbiased"], help="elite: the rows are the winners of a search (default); unbiased: the rows are a random or space-filling sample"); r.add_argument("--k", type=int, default=32); r.add_argument("--modes", type=int, default=16); r.add_argument("--seed", type=int, default=0); r.add_argument("--v1", action="store_true", help="also print the old v1 string")
    b = sp.add_parser("bench", help="synthetic benchmark against baselines; writes ../reffelt_results.json")
    b.add_argument("--seeds", type=int, default=10); b.add_argument("--quick", action="store_true"); b.add_argument("--out", default=os.path.normpath(os.path.join(HERE, "..", "reffelt_results.json")))
    a = ap.parse_args()
    if a.cmd == "bench":
        res = bench(a.seeds, a.out, a.quick); print(json.dumps(res["pooled"], indent=1)); print("wrote", a.out, "in", res["runtime_s"], "s")
    else:
        rows = list(csv.DictReader(open(a.csv))); cols = list(rows[0]); sc = a.score_col or cols[-1]; pc = [c for c in cols if c != sc]
        X = np.array([[float(r[c]) for c in pc] for r in rows]); s = np.array([float(r[sc]) for r in rows]); res = reffelt(X, s, a.reading, k=a.k, n_modes=a.modes, seed=a.seed)
        print("constant", res["constant"]); [print(f"{c:>20s} digit={d} weight={w:.4f} {'xi' if a.reading == 'unbiased' else 'freedom'}={x:.4f}{'' if kp else '  (freeze candidate)'}") for c, d, w, x, kp in zip(pc, res["constant"], res["causal_weights"], res.get("xi", res.get("freedom")), res["keep"])]
        if a.v1: print("v1 constant", reffelt_v1(X, s, k=a.k)["constant"])
if __name__ == "__main__": main()
