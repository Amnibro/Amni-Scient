#!/usr/bin/env python3
"""Vote-weighted WLS for every NSDUH substate substance-use rate.

The region frame is the 382-region join already built by run_regression.py
(log density, age, education, two-party votes). Substance rates that were
not in that file are merged from the shapefile attribute table, or from
data/substate_outcomes_212223.csv extracted from it.

Specified model, each rate alone: rate + log density + percent ages 18-25
+ percent ages 12-17. Weights are two-party votes. Covariance is HC1.

Joint model: the non-nested rates in INDEX_COLS, same controls.

King ecological inference: Democratic two-party share among users and
non-users from a bivariate normal truncated to the unit square, with
Duncan–Davis bounds as the tomography segment for each region.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd

import run_regression as rr

HERE = Path(__file__).resolve().parent
RESULTS = HERE / "results"
DATA = HERE / "data"
CONTROLS = ["ln_dens", "pct_18_25", "pct_12_17"]


def _label(short: str) -> str:
    for row in rr.USE_RATES + rr.DISORDER_RATES:
        if row[0] == short:
            return row[2]
    return short


def _meta(short: str) -> dict:
    for row in rr.USE_RATES:
        if row[0] == short:
            return {"field": row[1], "label": row[2], "age": row[3], "window": row[4], "kind": "use"}
    for row in rr.DISORDER_RATES:
        if row[0] == short:
            return {"field": row[1], "label": row[2], "age": row[3], "window": "year", "kind": "disorder"}
    raise KeyError(short)


def load_outcomes(dbf: Path | None = None) -> pd.DataFrame:
    csv_path = DATA / "substate_outcomes_212223.csv"
    if dbf is not None and dbf.exists():
        import shapefile

        reader = shapefile.Reader(str(dbf))
        fields = [short for short, *_r in rr.USE_RATES + rr.DISORDER_RATES]
        field_of = {short: meta_field for short, meta_field, *_r in rr.USE_RATES + rr.DISORDER_RATES}
        rows = []
        for rec in reader.iterRecords():
            d = rec.as_dict()
            row = {
                "reg_id": str(d["REG_FIP"]).strip(),
                "st_fips": str(d["ST_FIPS"]).zfill(2),
                "st_name": str(d["ST_NAME"]).strip(),
                "sr_name": str(d["SR_NAME"]).strip(),
            }
            for short in fields:
                row[short] = float(d[field_of[short]])
            rows.append(row)
        out = pd.DataFrame(rows)
        DATA.mkdir(exist_ok=True)
        out.to_csv(csv_path, index=False)
        return out
    if not csv_path.exists():
        raise FileNotFoundError(csv_path)
    out = pd.read_csv(csv_path, dtype={"reg_id": str, "st_fips": str, "sr_name": str})
    out["st_fips"] = out["st_fips"].str.zfill(2)
    extra = [c for c in ("cig", "tob", "ucig", "utob") if c in out.columns]
    if extra:
        out = out.drop(columns=extra)
        out.to_csv(csv_path, index=False)
    return out


def wmean(x, w) -> float:
    return float(np.average(np.asarray(x, dtype=float), weights=np.asarray(w, dtype=float)))


def wsd(x, w) -> float:
    x = np.asarray(x, dtype=float)
    w = np.asarray(w, dtype=float)
    mu = np.average(x, weights=w)
    return float(np.sqrt(np.average((x - mu) ** 2, weights=w)))


def wcorr(x, y, w) -> float:
    x = np.asarray(x, dtype=float)
    y = np.asarray(y, dtype=float)
    w = np.asarray(w, dtype=float)
    xz = (x - np.average(x, weights=w)) / np.sqrt(np.average((x - np.average(x, weights=w)) ** 2, weights=w))
    yz = (y - np.average(y, weights=w)) / np.sqrt(np.average((y - np.average(y, weights=w)) ** 2, weights=w))
    return float(np.average(xz * yz, weights=w))


def _duncan_davis(x: np.ndarray, t: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    t = np.clip(t, 1e-6, 1 - 1e-6)
    lo = np.maximum(0.0, (x - (1.0 - t)) / t)
    hi = np.minimum(1.0, x / t)
    lo = np.minimum(lo, 1.0)
    hi = np.maximum(hi, 0.0)
    swap = lo > hi
    return np.where(swap, hi, lo), np.where(swap, lo, hi)


def _trunc_shares(mean: np.ndarray, cov: np.ndarray) -> dict:
    """Mean and central 95% of a normal restricted to the unit square.

    The unrestricted mean is the Goodman split. Restricting the HC1 sampling
    distribution to [0, 1] x [0, 1] is the bounded Goodman estimate.
    """
    from scipy.stats import multivariate_normal

    grid = np.linspace(0.002, 0.998, 180)
    bw, bb = np.meshgrid(grid, grid, indexing="ij")
    pts = np.column_stack([bw.ravel(), bb.ravel()])
    rv = multivariate_normal(mean=mean, cov=cov, allow_singular=True)
    logp = rv.logpdf(pts)
    logp -= np.max(logp)
    weight = np.exp(logp)
    weight /= weight.sum()

    def pack(values: np.ndarray) -> tuple[float, float, float, float]:
        mu = float(np.sum(weight * values))
        var = float(np.sum(weight * (values - mu) ** 2))
        order = np.argsort(values)
        c = np.cumsum(weight[order])
        lo = float(values[order][min(len(values) - 1, int(np.searchsorted(c, 0.025)))])
        hi = float(values[order][min(len(values) - 1, int(np.searchsorted(c, 0.975)))])
        return mu, var, lo, hi

    non, non_var, non_lo, non_hi = pack(pts[:, 0])
    user, user_var, user_lo, user_hi = pack(pts[:, 1])
    return {
        "nonuser": non,
        "nonuser_var": non_var,
        "nonuser_lo": non_lo,
        "nonuser_hi": non_hi,
        "user": user,
        "user_var": user_var,
        "user_lo": user_lo,
        "user_hi": user_hi,
        "edge": float(weight[pts[:, 1] > 0.95].sum()),
    }


def _within_percentiles(reg: pd.DataFrame, col: str, w: np.ndarray, centered: np.ndarray) -> dict:
    """Democratic share at the 10th and 90th percentiles of observed use.

    Same vote-weighted regression as the ecological split, controls at their
    vote-weighted means, read inside the observed rates.
    """
    import statsmodels.api as sm

    rate = reg[col].to_numpy(dtype=float)
    y = reg["dem2"].to_numpy(dtype=float) * 100.0
    order = np.argsort(rate)
    v = rate[order]
    ww = w[order]
    cw = np.cumsum(ww)
    total = float(ww.sum())

    def q(prob: float) -> float:
        return float(v[min(len(v) - 1, int(np.searchsorted(cw, prob * total, side="left")))])

    p10, p90 = q(0.10), q(0.90)
    use = rate / 100.0
    res = sm.WLS(y, np.column_stack([np.ones(len(reg)), use, centered]), weights=w).fit(cov_type="HC1")
    b = np.asarray(res.params, dtype=float)
    V = np.asarray(res.cov_params(), dtype=float)

    def pred(pct: float) -> tuple[float, float]:
        gvec = np.zeros(len(b))
        gvec[0] = 1.0
        gvec[1] = pct / 100.0
        est = float(gvec @ b)
        se = float(np.sqrt(max(0.0, gvec @ V @ gvec)))
        return est, se

    s10, e10 = pred(p10)
    s90, e90 = pred(p90)
    return {
        "p10_use": p10,
        "p90_use": p90,
        "p10_share": s10,
        "p10_se": e10,
        "p10_lo": s10 - 1.96 * e10,
        "p10_hi": s10 + 1.96 * e10,
        "p90_share": s90,
        "p90_se": e90,
        "p90_lo": s90 - 1.96 * e90,
        "p90_hi": s90 + 1.96 * e90,
    }


def bounded_rows(reg: pd.DataFrame) -> list[dict]:
    """Bounded Goodman splits, plus shares at the 10th and 90th use percentiles.

    Precinct-level King maximum likelihood piles onto 0 or 100 when the
    Duncan–Davis bounds on the user share span the whole unit interval, which
    is what a low, narrow rate does. The split used here is the vote-weighted
    Goodman regression on the use rate, log density, and age, with the HC1
    sampling distribution restricted to the unit square. A rate stays on the
    users chart when that restricted interval sits inside 0–100 and is not
    piled on the boundary. The others stay on the slope panels.
    """
    import statsmodels.api as sm

    w = reg["two_party"].to_numpy(dtype=float)
    y = reg["dem2"].to_numpy(dtype=float)
    dem = y > 0.5
    rep = ~dem
    ctrl = reg[["ln_dens", "pct_18_25", "pct_12_17"]].to_numpy(dtype=float)
    centered = ctrl - np.array([wmean(ctrl[:, i], w) for i in range(ctrl.shape[1])])
    rows = []
    for col in rr.CHART_COLS:
        t = reg[col].to_numpy(dtype=float) / 100.0
        res = sm.WLS(y, np.column_stack([np.ones(len(reg)), t, centered]), weights=w).fit(cov_type="HC1")
        b = np.asarray(res.params, dtype=float)
        V = np.asarray(res.cov_params(), dtype=float)
        mean = np.array([b[0], b[0] + b[1]])
        jac = np.array([[1.0, 0.0], [1.0, 1.0]])
        cov = jac @ V[:2, :2] @ jac.T
        cov = cov + np.eye(2) * 1e-10
        fit = _trunc_shares(mean, cov)
        lo_b, hi_b = _duncan_davis(y, t)
        width = float(np.average(hi_b - lo_b, weights=w))
        non = fit["nonuser"] * 100.0
        user = fit["user"] * 100.0
        non_lo, non_hi = fit["nonuser_lo"] * 100.0, fit["nonuser_hi"] * 100.0
        user_lo, user_hi = fit["user_lo"] * 100.0, fit["user_hi"] * 100.0
        non_se = float(np.sqrt(fit["nonuser_var"]) * 100.0)
        user_se = float(np.sqrt(fit["user_var"]) * 100.0)
        mean_use = float(np.average(reg[col].to_numpy(dtype=float), weights=w))
        user_width = user_hi - user_lo
        non_width = non_hi - non_lo
        stable = (
            fit["edge"] < 0.30
            and 5.0 <= non <= 95.0
            and 5.0 <= user <= 95.0
            and user_width <= 45.0
            and non_width <= 25.0
            and non_lo >= 0.0
            and user_hi <= 100.0
        )
        reason = ""
        if not stable:
            reason = (
                "Duncan–Davis bounds on the user share run essentially from 0 to 100, "
                "and the bounded split piles on that edge or spans too wide an interval. "
                "The rate stays on the slope panels and in the within-data percentile companion."
            )
        dem_rate = wmean(reg.loc[dem, col], w[dem])
        rep_rate = wmean(reg.loc[rep, col], w[rep])
        pct = _within_percentiles(reg, col, w, centered)
        rows.append(
            {
                "term": col,
                "label": _label(col),
                "stable": stable,
                "drop_reason": reason,
                "nonuser_share": non,
                "nonuser_se": non_se,
                "nonuser_lo": non_lo,
                "nonuser_hi": non_hi,
                "user_share": user,
                "user_se": user_se,
                "user_lo": user_lo,
                "user_hi": user_hi,
                "bound_width_user": width,
                "edge_mass": fit["edge"],
                "mean_use": mean_use,
                "dem_majority_rate": dem_rate,
                "rep_majority_rate": rep_rate,
                "ratio": dem_rate / rep_rate,
                "n_dem_regions": int(dem.sum()),
                "n_rep_regions": int(rep.sum()),
                "observed_min": float(reg[col].min()),
                "observed_max": float(reg[col].max()),
                **pct,
            }
        )
        print(
            col,
            "stable" if stable else "drop",
            f"non {non:.1f} [{non_lo:.1f},{non_hi:.1f}]",
            f"user {user:.1f} [{user_lo:.1f},{user_hi:.1f}]",
            f"edge {fit['edge']:.2f}",
            f"p10 {pct['p10_use']:.2f}->{pct['p10_share']:.1f}",
            f"p90 {pct['p90_use']:.2f}->{pct['p90_share']:.1f}",
            flush=True,
        )
    return rows


def coef_pack(result: dict, name: str, scale_sd: float | None = None) -> dict:
    t = rr.term_row(result, name)
    if t is None:
        raise KeyError(name)
    out = {
        "term": name,
        "label": _label(name) if name in {r[0] for r in rr.USE_RATES + rr.DISORDER_RATES} else name,
        "pp_per_pp": rr.pp(t["coef"]),
        "se_pp": rr.pp(t["se"]),
        "p": t["p"],
        "ci95_pp": [rr.pp(t["ci_lo"]), rr.pp(t["ci_hi"])],
        "n": result["n"],
        "r2": result["r2"],
    }
    if scale_sd is not None:
        out["pp_per_sd"] = rr.pp(t["coef"]) * scale_sd
        out["se_per_sd"] = rr.pp(t["se"]) * scale_sd
        out["vote_weighted_sd"] = scale_sd
    return out


def quintiles(reg: pd.DataFrame, col: str) -> list[dict]:
    work = reg[["two_party", "dem2", col, "ln_dens", "pct_ba"]].copy()
    work["q"] = pd.qcut(work[col], 5, labels=False, duplicates="drop")
    rows = []
    for q, g in work.groupby("q"):
        w = g["two_party"]
        rows.append(
            {
                "measure": col,
                "label": _label(col),
                "quintile": int(q) + 1,
                "n_regions": int(len(g)),
                "use_min": float(g[col].min()),
                "use_max": float(g[col].max()),
                "mean_use": wmean(g[col], w),
                "dem2": wmean(g["dem2"], w),
                "ln_dens": wmean(g["ln_dens"], w),
                "pct_ba": wmean(g["pct_ba"], w),
                "two_party": float(w.sum()),
            }
        )
    return rows


def state_table(reg: pd.DataFrame) -> pd.DataFrame:
    rows = []
    for st, g in reg.groupby("st_fips"):
        w = g["two_party"]
        rows.append(
            {
                "st_fips": st,
                "st_name": g["st_name"].iloc[0],
                "n_regions": int(len(g)),
                "dem2": wmean(g["dem2"], w),
                "ln_dens": wmean(g["ln_dens"], w),
                "two_party": float(w.sum()),
                **{c: wmean(g[c], w) for c in rr.CHART_COLS},
            }
        )
    return pd.DataFrame(rows)


# Census FIPS names. The 2021–2023 shapefile mislabels Nebraska (FIPS 31)
# as New Jersey, and one New Jersey region (Southern, FIPS 34) as New York.
FIPS_NAME = {
    "01": "Alabama", "02": "Alaska", "04": "Arizona", "05": "Arkansas", "06": "California",
    "08": "Colorado", "09": "Connecticut", "10": "Delaware", "11": "District of Columbia",
    "12": "Florida", "13": "Georgia", "15": "Hawaii", "16": "Idaho", "17": "Illinois",
    "18": "Indiana", "19": "Iowa", "20": "Kansas", "21": "Kentucky", "22": "Louisiana",
    "23": "Maine", "24": "Maryland", "25": "Massachusetts", "26": "Michigan", "27": "Minnesota",
    "28": "Mississippi", "29": "Missouri", "30": "Montana", "31": "Nebraska", "32": "Nevada",
    "33": "New Hampshire", "34": "New Jersey", "35": "New Mexico", "36": "New York",
    "37": "North Carolina", "38": "North Dakota", "39": "Ohio", "40": "Oklahoma", "41": "Oregon",
    "42": "Pennsylvania", "44": "Rhode Island", "45": "South Carolina", "46": "South Dakota",
    "47": "Tennessee", "48": "Texas", "49": "Utah", "50": "Vermont", "51": "Virginia",
    "53": "Washington", "54": "West Virginia", "55": "Wisconsin", "56": "Wyoming",
}


def extend_results(reg: pd.DataFrame, out_dir: Path) -> dict:
    reg = reg.copy()
    reg["st_fips"] = reg["st_fips"].astype(str).str.zfill(2)
    reg["st_name"] = reg["st_fips"].map(FIPS_NAME).fillna(reg["st_name"])
    drop_extra = [c for c in reg.columns if c == "combined" or c == "combined_pc1" or c.startswith("z_")]
    if drop_extra:
        reg = reg.drop(columns=drop_extra)
    w = reg["two_party"].to_numpy(dtype=float)
    measures = [r[0] for r in rr.USE_RATES + rr.DISORDER_RATES]

    alone = {}
    for col in measures:
        sd = wsd(reg[col], w)
        spec = [col] + CONTROLS
        fit = rr.fit_wls(reg, spec, None)
        pack = coef_pack(fit, col, sd)
        fe_df, fe_cols = rr.add_state_fe(reg, spec)
        fit_fe = rr.fit_wls(fe_df, fe_cols, None)
        pack["state_fe_pp_per_pp"] = coef_pack(fit_fe, col, sd)["pp_per_pp"]
        pack["state_fe_se_pp"] = coef_pack(fit_fe, col, sd)["se_pp"]
        pack["state_fe_p"] = coef_pack(fit_fe, col, sd)["p"]
        pack["state_fe_pp_per_sd"] = coef_pack(fit_fe, col, sd)["pp_per_sd"]
        pack["state_fe_r2"] = fit_fe["r2"]
        pack["corr_dem2"] = wcorr(reg[col], reg["dem2"], w)
        alone[col] = pack

    joint_cols = list(rr.INDEX_COLS) + CONTROLS
    joint = rr.fit_wls(reg, joint_cols, None)
    joint_fe_df, joint_fe_cols = rr.add_state_fe(reg, joint_cols)
    joint_fe = rr.fit_wls(joint_fe_df, joint_fe_cols, None)
    joint_pack = {"n": joint["n"], "r2": joint["r2"], "state_fe_r2": joint_fe["r2"], "terms": {}}
    for col in rr.INDEX_COLS:
        sd = wsd(reg[col], w)
        joint_pack["terms"][col] = coef_pack(joint, col, sd)
        joint_pack["terms"][col]["state_fe_pp_per_pp"] = coef_pack(joint_fe, col, sd)["pp_per_pp"]
        joint_pack["terms"][col]["state_fe_se_pp"] = coef_pack(joint_fe, col, sd)["se_pp"]
        joint_pack["terms"][col]["state_fe_p"] = coef_pack(joint_fe, col, sd)["p"]

    between = state_table(reg)
    goodman = bounded_rows(reg)
    q_rows = []
    for col in rr.CHART_COLS:
        q_rows.extend(quintiles(reg, col))

    correlations = {
        col: wcorr(reg[col], reg["dem2"], w)
        for col in measures + ["ln_dens", "pct_ba"]
    }

    payload = {
        "alone": alone,
        "joint": joint_pack,
        "goodman": {
            "method": (
                "Bounded Goodman. Vote-weighted WLS of Democratic two-party share on "
                "the use rate as a proportion, log density, percent ages 18–25, and "
                "percent ages 12–17, controls centered at their vote-weighted means. "
                "The non-user share is the intercept and the user share is the intercept "
                "plus the slope. The HC1 sampling distribution of that pair is restricted "
                "to the unit square, which is the bounded Goodman estimate. A rate is "
                "omitted from the users chart when Duncan–Davis bounds on the user share "
                "span essentially 0–100 and the restricted estimate piles on that edge "
                "or the interval is too wide. The percentile companion reads the same "
                "regression at the vote-weighted 10th and 90th percentiles of the "
                "observed regional rate."
            ),
            "rows": goodman,
        },
        "correlations_dem2": correlations,
        "chart_quintiles": q_rows,
        "not_at_substate": [
            "Past-month cocaine. The substate file has past-year cocaine (COCYR) only.",
            "Past-month heroin. The substate file has past-year heroin (HERYR), ages 18 or older.",
            "Past-month methamphetamine. The substate file has past-year methamphetamine (METAMYR).",
            "Past-month hallucinogens. The substate file has past-year hallucinogens (HALLUYR).",
            "Past-month opioid misuse. The substate file has past-year opioid misuse (OPINMYR).",
            "Past-month pain reliever misuse. The substate file has past-year pain reliever misuse (PNRNMYR).",
            "Heavy alcohol use as its own field. Binge alcohol in the past month (BNGDRK) is the intensity measure SAMHSA published. There is no separate heavy-drinking column.",
            "Fentanyl, inhalants, LSD, PCP, and crack as their own substate rates. They are not among the 39 outcomes.",
        ],
    }

    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "extended.json").write_text(json.dumps(payload, indent=2))
    pd.DataFrame(q_rows).to_csv(out_dir / "quintiles.csv", index=False)
    pd.DataFrame(goodman).to_csv(out_dir / "user_nonuser.csv", index=False)
    between.to_csv(out_dir / "state_level.csv", index=False)
    keep = [
        "reg_id",
        "st_fips",
        "st_name",
        "sr_name",
        "dem2",
        "two_party",
        "pop",
        "n_zcta",
        "ln_dens",
        "pct_18_25",
        "pct_12_17",
        "pct_18_24",
        "pct_15_17",
        "pct_ba",
        *measures,
    ]
    reg[keep].to_csv(out_dir / "region_level.csv", index=False)
    return payload


def main_committed() -> None:
    dbf = Path("/tmp/eco/shp/SubstateRegionData212223.dbf")
    outcomes = load_outcomes(dbf if dbf.exists() else None)
    reg = pd.read_csv(RESULTS / "region_level.csv", dtype={"reg_id": str, "st_fips": str})
    reg["st_fips"] = reg["st_fips"].str.zfill(2)
    # Drop previously merged rate columns so the shapefile values replace them.
    rate_cols = [r[0] for r in rr.USE_RATES + rr.DISORDER_RATES]
    drop = [c for c in rate_cols + ["cig", "tob", "ucig", "utob"] if c in reg.columns]
    base_check = reg[["reg_id", "mj", "alc"]].copy()
    reg = reg.drop(columns=[c for c in drop if c != "reg_id"])
    merged = reg.merge(outcomes.drop(columns=["st_fips", "st_name", "sr_name"]), on="reg_id", how="left", indicator=True)
    if not (merged["_merge"] == "both").all():
        missing = merged.loc[merged["_merge"] != "both", "reg_id"].tolist()
        raise SystemExit(f"unmatched regions: {missing[:8]}")
    merged = merged.drop(columns=["_merge"])
    mj_gap = (merged["mj"] - base_check["mj"]).abs().max()
    alc_gap = (merged["alc"] - base_check["alc"]).abs().max()
    print(f"max abs gap vs committed mj {mj_gap:.6f} alc {alc_gap:.6f}")
    if mj_gap > 0.02 or alc_gap > 0.02:
        raise SystemExit("shapefile rates do not match the committed region file")
    payload = extend_results(merged, RESULTS)
    # Preserve the original ZCTA fits. Refresh the region headline block.
    old = json.loads((RESULTS / "results.json").read_text())
    headline = old.get("headline", {})
    mj = payload["alone"]["mj"]
    alc = payload["alone"]["alc"]
    headline["region_specified_rerun"] = {
        "mj_pp_per_pp": mj["pp_per_pp"],
        "mj_se_pp": mj["se_pp"],
        "alc_pp_per_pp": alc["pp_per_pp"],
        "alc_se_pp": alc["se_pp"],
    }
    old["headline"] = headline
    old["extended_file"] = "extended.json"
    (RESULTS / "results.json").write_text(json.dumps(old, indent=2))
    print("marijuana specified", round(mj["pp_per_pp"], 3), "se", round(mj["se_pp"], 3))
    print("alcohol specified", round(alc["pp_per_pp"], 3), "se", round(alc["se_pp"], 3))
    g = payload["goodman"]["rows"][0]
    print("marijuana nonuser", round(g["nonuser_share"], 1), "user", round(g["user_share"], 1))
    print("wrote", RESULTS)


if __name__ == "__main__":
    main_committed()
