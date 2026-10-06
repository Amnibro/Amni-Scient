import json, os, sys, numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap
INK, DIM, GOLD, RED, BLUE = "#141412", "#6B6864", "#C89B4E", "#B5462F", "#3A6EA5"
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, "..", "..", "assets", "research"))
W_GRAD, W_T, W_W, W_VAR, W_BND, WIN, RAMP = 0.4, 0.4, 0.2, 0.8, 0.2, 5, 8
def nmax(a): return a / a.max() if a.max() > 0 else a
def gauss(n, cx, cy, s):
    y, x = np.mgrid[0:n, 0:n]
    return np.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (2 * s * s))
def ridge(n, s=3.0):
    y, x = np.mgrid[0:n, 0:n]
    return 0.6 * np.exp(-((y - (0.35 * n + 0.3 * x)) ** 2) / (2 * s * s))
def frame(n, t):
    return gauss(n, 0.25 * n + 0.5 * n * t, 0.65 * n - 0.3 * n * t, 6.0) + ridge(n)
def stretch(f_now, f_prev):
    gx, gy = np.zeros_like(f_now), np.zeros_like(f_now)
    gx[:, :-1], gy[:-1, :] = np.diff(f_now, axis=1), np.diff(f_now, axis=0)
    grad = np.sqrt(gx * gx + gy * gy)
    T = np.abs(f_now - f_prev)
    dxgy, dygx = np.zeros_like(f_now), np.zeros_like(f_now)
    dxgy[:, 1:], dygx[1:, :] = np.diff(gy, axis=1), np.diff(gx, axis=0)
    W = np.abs(dxgy - dygx)
    return W_GRAD * nmax(grad) + W_T * nmax(T) + W_W * nmax(W), grad, T, W
def local_var(H, k=WIN):
    p = k // 2
    Hp = np.pad(H, p, mode="edge")
    win = np.lib.stride_tricks.sliding_window_view(Hp, (k, k))
    return win.var(axis=(-1, -2))
def boundary(n, ramp=RAMP):
    y, x = np.mgrid[0:n, 0:n]
    d = np.minimum.reduce([x, y, n - 1 - x, n - 1 - y])
    return np.clip(1 - d / ramp, 0, 1)
def resistance(H): return W_VAR * nmax(local_var(H)) + W_BND * boundary(H.shape[0])
def grad_field(R):
    gy, gx = np.gradient(R)
    return gx, gy
def bilinear(A, x, y):
    n = A.shape[0]
    x, y = np.clip(x, 0, n - 1.001), np.clip(y, 0, n - 1.001)
    i, j = y.astype(int), x.astype(int)
    fy, fx = y - i, x - j
    return (A[i, j] * (1 - fx) * (1 - fy) + A[i, j + 1] * fx * (1 - fy) + A[i + 1, j] * (1 - fx) * fy + A[i + 1, j + 1] * fx * fy)
def deposit(x, y, E, n):
    P = np.zeros((n, n))
    np.add.at(P, (np.clip(y.astype(int), 0, n - 1), np.clip(x.astype(int), 0, n - 1)), E)
    return P / E.sum()
def advect(R, n_p=4096, steps=400, gamma=0.99, alpha=5.0, dt=0.1, seed=0, S=None):
    n = R.shape[0]
    rng = np.random.default_rng(seed)
    x, y = rng.uniform(0, n - 1, n_p), rng.uniform(0, n - 1, n_p)
    vx, vy = np.zeros(n_p), np.zeros(n_p)
    E = rng.uniform(0.5, 1.0, n_p)
    Rx, Ry = grad_field(R)
    K, U, L, work = [], [], [], []
    loss = 0.0
    for _ in range(steps):
        fx, fy = -alpha * bilinear(Rx, x, y), -alpha * bilinear(Ry, x, y)
        fy = fy + (10.0 * bilinear(S, x, y) if S is not None else 0.0)
        ux, uy = vx + fx * dt, vy + fy * dt
        wk = (fx * vx + fy * vy) * dt + 0.5 * (fx * fx + fy * fy) * dt * dt
        Kt = 0.5 * (ux * ux + uy * uy)
        vx, vy = gamma * ux, gamma * uy
        loss += ((1 - gamma * gamma) * Kt).sum()
        x, y = np.clip(x + vx * dt, 0, n - 1), np.clip(y + vy * dt, 0, n - 1)
        K.append((0.5 * (vx * vx + vy * vy)).sum()); U.append((alpha * bilinear(R, x, y)).sum()); L.append(loss); work.append(wk.sum())
    P = deposit(x, y, E, n)
    ident = abs((K[-1] - K[-2]) - (work[-1] - (1 - gamma * gamma) * Kt.sum()))
    return dict(P=P, x=x, y=y, E=E, K=np.array(K), U=np.array(U), L=np.array(L), speed=float(np.sqrt(vx * vx + vy * vy).mean()), identity_residual=float(ident))
def top_frac(P, x, y, E, q=0.10):
    n = P.shape[0]
    k = int(round(q * P.size))
    mask = np.zeros(P.size, bool); mask[np.argsort(P.ravel())[::-1][:k]] = True
    mask = mask.reshape(P.shape)
    inside = mask[np.clip(y.astype(int), 0, n - 1), np.clip(x.astype(int), 0, n - 1)]
    return float(inside.mean()), float(E[inside].sum() / E.sum()), mask
def hit_rate(P, px, py, q=0.10):
    n = P.shape[0]
    k = int(round(q * P.size))
    mask = np.zeros(P.size, bool); mask[np.argsort(P.ravel())[::-1][:k]] = True
    mask = mask.reshape(P.shape)
    return float(mask[np.clip(np.asarray(py).astype(int), 0, n - 1), np.clip(np.asarray(px).astype(int), 0, n - 1)].mean())
def figure(R, res, sens, path):
    cmap = LinearSegmentedColormap.from_list("ink", ["#FFFFFF", BLUE, INK])
    fig, ax = plt.subplots(1, 3, figsize=(13, 4.4), facecolor="white")
    im = ax[0].imshow(res["P"], cmap=cmap, origin="lower", vmax=np.percentile(res["P"], 99.5))
    ax[0].contour(R, levels=6, colors=GOLD, linewidths=0.6, alpha=0.9)
    ax[0].set_title("Density map P, R contours in gold", color=INK, fontsize=10); ax[0].set_xlabel("x (cell)"); ax[0].set_ylabel("y (cell)")
    fig.colorbar(im, ax=ax[0], fraction=0.046, pad=0.03).set_label("P per cell")
    t = np.arange(1, len(res["K"]) + 1)
    ax[1].plot(t, res["K"], color=BLUE, lw=1.4, label="kinetic K")
    ax[1].plot(t, res["U"], color=GOLD, lw=1.4, label="potential U = alpha sum R")
    ax[1].plot(t, res["K"] + res["U"], color=INK, lw=1.2, label="K + U")
    ax[1].plot(t, res["L"], color=RED, lw=1.2, ls="--", label="cumulative damping loss")
    ax[1].set_xlabel("step"); ax[1].set_ylabel("energy (grid units)"); ax[1].set_title("Energy trace, gamma = 0.99", color=INK, fontsize=10)
    ax[1].legend(loc="upper center", bbox_to_anchor=(0.5, -0.22), ncol=2, frameon=False, fontsize=8)
    g = [s["gamma"] for s in sens]
    ax[2].plot(g, [s["top10_fraction"] for s in sens], "o-", color=INK, lw=1.4, label="fraction in top-10% cells")
    ax[2].plot(g, [s["mean_speed"] for s in sens], "s--", color=RED, lw=1.2, label="mean final speed (cell/step)")
    ax[2].set_xlabel("gamma"); ax[2].set_title("Sensitivity to gamma", color=INK, fontsize=10); ax[2].set_ylim(0, 1.05)
    ax[2].legend(loc="upper center", bbox_to_anchor=(0.5, -0.22), ncol=1, frameon=False, fontsize=8)
    for a in ax:
        a.tick_params(colors=DIM, labelsize=8); [s.set_color(DIM) for s in a.spines.values()]
    fig.tight_layout(); fig.savefig(path, format=path.rsplit(".", 1)[-1], facecolor="white", dpi=110); plt.close(fig)
def main():
    n, steps, alpha, dt = 128, 400, 5.0, 0.1
    f_prev, f_now, f_next = frame(n, 0.0), frame(n, 0.05), frame(n, 0.10)
    H, grad, T, W = stretch(f_now, f_prev)
    R = resistance(H)
    out = dict(grid=n, particles=4096, steps=steps, alpha=alpha, dt=dt, seed=0, weights=dict(M1=[W_GRAD, W_T, W_W], M2=[W_VAR, W_BND], window=WIN, ramp=RAMP), steering="S = 0",
               field=dict(f_max=float(f_now.max()), H_max=float(H.max()), H_mean=float(H.mean()), R_min=float(R.min()), R_max=float(R.max()), R_mean=float(R.mean()), W_raw_max=float(W.max()), T_raw_max=float(T.max())))
    res = advect(R, steps=steps, gamma=0.99, alpha=alpha, dt=dt)
    frac, efrac, mask = top_frac(res["P"], res["x"], res["y"], res["E"])
    ny, nx = np.nonzero(f_next >= 0.5 * f_next.max())
    out["gamma_0.99"] = dict(sum_P=float(res["P"].sum()), occupied_cells=int((res["P"] > 0).sum()), top10_fraction=frac, top10_energy_fraction=efrac, P_max=float(res["P"].max()),
                             K_start=float(res["K"][0]), K_peak=float(res["K"].max()), K_peak_step=int(res["K"].argmax() + 1), K_end=float(res["K"][-1]), U_start=float(res["U"][0]), U_end=float(res["U"][-1]),
                             damping_loss_total=float(res["L"][-1]), mean_speed=res["speed"], identity_residual=res["identity_residual"], synthetic_next_bump_hit_rate=hit_rate(res["P"], nx, ny))
    sens = []
    for gm in (0.97, 0.99, 0.995):
        r2 = res if gm == 0.99 else advect(R, steps=steps, gamma=gm, alpha=alpha, dt=dt)
        fr, ef, _ = top_frac(r2["P"], r2["x"], r2["y"], r2["E"])
        sens.append(dict(gamma=gm, top10_fraction=fr, top10_energy_fraction=ef, K_end=float(r2["K"][-1]), mean_speed=r2["speed"], occupied_cells=int((r2["P"] > 0).sum()), decay_per_step=1 - gm, continuous_rate=float(-np.log(gm) / dt)))
    out["sensitivity"] = sens
    os.makedirs(OUT, exist_ok=True)
    svg, js = os.path.join(OUT, "holographic-membrane-example.svg"), os.path.join(OUT, "holographic-membrane-example.json")
    figure(R, res, sens, svg)
    json.dump(out, open(js, "w"), indent=1)
    print(json.dumps(out, indent=1)); print("wrote", svg, js)
if __name__ == "__main__": main()
