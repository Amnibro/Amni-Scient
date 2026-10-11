#!/usr/bin/env python3
"""Ecological WLS: 2024 ZCTA Democratic two-party share on NSDUH past-month marijuana use.

The exposure is measured at the 2021-2023 NSDUH substate region. ZCTA rows that
share a region share one use rate, so ZCTA-level standard errors are clustered
by region. The region-level regression is the specification whose standard
error matches the resolution of the exposure.

Inputs under ECO_DATA (default /tmp/eco):
  shp/SubstateRegionData212223.shp
    https://www.samhsa.gov/data/sites/default/files/reports/rpt56951/2023-sae-sub-region-shape-file/2023-substate-shapefile-metadata.zip
  2020_Gaz_zcta_national.txt
    https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2020_Gazetteer/2020_Gaz_zcta_national.zip
  acs/b01001_zcta.dat and acs/b15003_zcta.dat
    ZCTA rows (GEO_ID prefix 860) from the ACS 2023 5-year table-based files
    acsdt5y2023-b01001.dat and acsdt5y2023-b15003.dat
  zcta2024_lc.tab and zcta2024_areal.tab
    Harvard Dataverse doi:10.7910/DVN/Z8TSH3 files
    election-results-zcta-2024-landcover-method (datafile 14308844)
    election-results-zcta-2024-areal-method (datafile 14308842)
"""

from __future__ import annotations

import json
import os
from pathlib import Path

import numpy as np
import pandas as pd
import shapefile
import statsmodels.api as sm
from shapely.geometry import Point, shape
from shapely.strtree import STRtree

ROOT = Path(os.environ.get("ECO_DATA", "/tmp/eco"))
SHP = ROOT / "shp" / "SubstateRegionData212223.shp"
GAZ = ROOT / "2020_Gaz_zcta_national.txt"
ACS_AGE = ROOT / "acs" / "b01001_zcta.dat"
ACS_ED = ROOT / "acs" / "b15003_zcta.dat"
VOTE_LC = ROOT / "zcta2024_lc.tab"
VOTE_AR = ROOT / "zcta2024_areal.tab"
OUT = ROOT / "out"
OUT.mkdir(exist_ok=True)

# NSDUH 2021-2023 substate outcomes that are substance-use rates.
# short, shapefile field, label, age group, window.
# Nested or age-restricted rates stay in the alone models. They are
# not in the joint model or the combined index. See fit_extended.py.
USE_RATES = [
    ("mj", "MRJMON", "Past-month marijuana", "12+", "month"),
    ("alc", "ALCMON", "Past-month alcohol", "12+", "month"),
    ("binge", "BNGDRK", "Past-month binge alcohol", "12+", "month"),
    ("iem", "IEMMON", "Past-month illicit drugs other than marijuana", "12+", "month"),
    ("ill", "ILLMON", "Past-month illicit drugs", "12+", "month"),
    ("coc", "COCYR", "Past-year cocaine", "12+", "year"),
    ("hal", "HALLUYR", "Past-year hallucinogens", "12+", "year"),
    ("her", "HERYR", "Past-year heroin", "18+", "year"),
    ("met", "METAMYR", "Past-year methamphetamine", "12+", "year"),
    ("opin", "OPINMYR", "Past-year opioid misuse", "12+", "year"),
    ("pnr", "PNRNMYR", "Past-year pain reliever misuse", "12+", "year"),
    ("mrjyr", "MRJYR", "Past-year marijuana", "12+", "year"),
    ("ualc", "UALCMON", "Past-month underage alcohol", "12–20", "month"),
    ("ubinge", "UBNGDRK", "Past-month underage binge alcohol", "12–20", "month"),
]
DISORDER_RATES = [
    ("sud", "UD5IAAN", "Past-year substance use disorder", "12+"),
    ("dud", "UD5ILAN", "Past-year drug use disorder", "12+"),
    ("oud", "UD5OPAN", "Past-year opioid use disorder", "12+"),
    ("prud", "UD5PRAN", "Past-year pain reliever use disorder", "12+"),
    ("aud", "UDYR5AL", "Past-year alcohol use disorder", "12+"),
    ("uaud", "UUDYALC", "Past-year underage alcohol use disorder", "12–20"),
]
# Non-nested use rates. ill contains marijuana.
# binge is the heavy-drinking slice of alcohol. pnr is inside opioid misuse.
# mrjyr repeats marijuana. her is ages 18+, not 12+. Underage rates repeat
# the same substances on ages 12–20.
INDEX_COLS = ["mj", "alc", "iem", "coc", "opin", "met", "hal"]
CHART_COLS = ["mj", "alc", "binge", "iem", "coc", "opin", "pnr", "met", "hal", "her"]


def e_index(k: int) -> int:
    """Column index of estimate E00k in a table-based ACS file (GEO_ID at 0)."""
    return 1 + (k - 1) * 2


def load_regions():
    reader = shapefile.Reader(str(SHP))
    geoms = []
    rows = []
    for i, sr in enumerate(reader.iterShapeRecords()):
        geom = shape(sr.shape.__geo_interface__)
        if geom.is_empty:
            continue
        rec = sr.record.as_dict()
        geoms.append(geom)
        rows.append(
            {
                "region_idx": i,
                "st_fips": str(rec["ST_FIPS"]).zfill(2),
                "st_name": str(rec["ST_NAME"]).strip(),
                "sr_name": str(rec["SR_NAME"]).strip(),
                "reg_id": str(rec["REG_FIP"]).strip(),
                "mj": float(rec["MRJMON"]),
                "mj_lo": float(rec["MRJMON_LO"]),
                "mj_up": float(rec["MRJMON_UP"]),
                "alc": float(rec["ALCMON"]),
            }
        )
        for short, field, *_rest in USE_RATES:
            rows[-1][short] = float(rec[field])
        for short, field, *_rest in DISORDER_RATES:
            rows[-1][short] = float(rec[field])
    return geoms, pd.DataFrame(rows)


def assign_regions(geoms, regions: pd.DataFrame) -> pd.DataFrame:
    tree = STRtree(geoms)
    gaz = pd.read_csv(GAZ, sep="\t", dtype=str)
    gaz.columns = [c.strip() for c in gaz.columns]
    gaz["zcta"] = gaz["GEOID"].str.strip().str.zfill(5)
    gaz["lat"] = pd.to_numeric(gaz["INTPTLAT"])
    gaz["lon"] = pd.to_numeric(gaz["INTPTLONG"])
    assigned = []
    for zcta, lat, lon in zip(gaz["zcta"], gaz["lat"], gaz["lon"]):
        pt = Point(float(lon), float(lat))
        hits = tree.query(pt, predicate="intersects")
        if len(hits) == 0:
            continue
        # Prefer the polygon that actually contains the point if several touch.
        chosen = int(hits[0])
        for h in hits:
            if geoms[int(h)].covers(pt):
                chosen = int(h)
                break
        assigned.append((zcta, chosen))
    asg = pd.DataFrame(assigned, columns=["zcta", "region_idx"])
    return asg.merge(regions, on="region_idx", how="left")


def _acs_zcta(path: Path, cols: dict[str, int]) -> pd.DataFrame:
    raw = pd.read_csv(path, sep="|", header=None, skiprows=1, dtype=str, low_memory=False)
    out = pd.DataFrame({"zcta": raw.iloc[:, 0].str[-5:]})
    for name, k in cols.items():
        out[name] = pd.to_numeric(raw.iloc[:, e_index(k)], errors="coerce")
    return out


def load_acs() -> pd.DataFrame:
    age_cols = {
        "pop": 1,
        "m_10_14": 5,
        "m_15_17": 6,
        "m_18_19": 7,
        "m_20": 8,
        "m_21": 9,
        "m_22_24": 10,
        "m_25_29": 11,
        "f_10_14": 29,
        "f_15_17": 30,
        "f_18_19": 31,
        "f_20": 32,
        "f_21": 33,
        "f_22_24": 34,
        "f_25_29": 35,
    }
    ed_cols = {"ed_tot": 1, "ba": 22, "ma": 23, "prof": 24, "doc": 25}
    age = _acs_zcta(ACS_AGE, age_cols)
    ed = _acs_zcta(ACS_ED, ed_cols)
    df = age.merge(ed, on="zcta", how="left")
    age_18_24 = (
        df["m_18_19"]
        + df["m_20"]
        + df["m_21"]
        + df["m_22_24"]
        + df["f_18_19"]
        + df["f_20"]
        + df["f_21"]
        + df["f_22_24"]
    )
    age_15_17 = df["m_15_17"] + df["f_15_17"]
    # 10-14 is a 5-year band; 12-14 is approximated as 3/5 of that band.
    age_12_17 = 0.6 * (df["m_10_14"] + df["f_10_14"]) + age_15_17
    # 25-29 is a 5-year band; age 25 is approximated as 1/5 of that band.
    age_18_25 = age_18_24 + 0.2 * (df["m_25_29"] + df["f_25_29"])
    df["pct_18_24"] = 100.0 * age_18_24 / df["pop"]
    df["pct_15_17"] = 100.0 * age_15_17 / df["pop"]
    df["pct_18_25"] = 100.0 * age_18_25 / df["pop"]
    df["pct_12_17"] = 100.0 * age_12_17 / df["pop"]
    df["pct_ba"] = 100.0 * (df["ba"] + df["ma"] + df["prof"] + df["doc"]) / df["ed_tot"]
    keep = [
        "zcta",
        "pop",
        "m_10_14",
        "m_15_17",
        "m_18_19",
        "m_20",
        "m_21",
        "m_22_24",
        "m_25_29",
        "f_10_14",
        "f_15_17",
        "f_18_19",
        "f_20",
        "f_21",
        "f_22_24",
        "f_25_29",
        "ed_tot",
        "ba",
        "ma",
        "prof",
        "doc",
        "pct_18_24",
        "pct_15_17",
        "pct_18_25",
        "pct_12_17",
        "pct_ba",
    ]
    return df[keep]


def load_votes(path: Path) -> pd.DataFrame:
    v = pd.read_csv(path, sep="\t")
    v["zcta"] = v["zcta_GEOID"].astype(str).str.replace(r"\.0$", "", regex=True).str.zfill(5)
    for c in ["zcta_population", "zcta_land_area", "votes_dem", "votes_rep", "votes_total"]:
        v[c] = pd.to_numeric(v[c], errors="coerce")
    return v


def build_frame(assign: pd.DataFrame, acs: pd.DataFrame, votes: pd.DataFrame) -> pd.DataFrame:
    df = votes.merge(assign, on="zcta", how="inner").merge(acs, on="zcta", how="inner")
    df["two_party"] = df["votes_dem"] + df["votes_rep"]
    df["dem2"] = df["votes_dem"] / df["two_party"]
    df["ln_dens"] = np.log(df["zcta_population"] / (df["zcta_land_area"] / 1e6))
    df = df.replace([np.inf, -np.inf], np.nan)
    df = df.dropna(
        subset=[
            "dem2",
            "mj",
            "ln_dens",
            "pct_18_25",
            "pct_12_17",
            "pct_18_24",
            "pct_15_17",
            "pct_ba",
            "two_party",
            "pop",
        ]
    )
    df = df[(df["two_party"] >= 10) & (df["zcta_population"] >= 100) & (df["pop"] >= 100)]
    df = df[(df["dem2"] >= 0) & (df["dem2"] <= 1)]
    return df


def fit_wls(df: pd.DataFrame, xcols: list[str], cluster: str | None, weight: str = "two_party"):
    y = df["dem2"].to_numpy(dtype=float)
    X = sm.add_constant(df[xcols].astype(float), has_constant="add")
    w = df[weight].to_numpy(dtype=float)
    model = sm.WLS(y, X, weights=w)
    if cluster is None:
        res = model.fit(cov_type="HC1")
    else:
        res = model.fit(cov_type="cluster", cov_kwds={"groups": df[cluster].to_numpy()})
    rows = []
    for name in X.columns:
        rows.append(
            {
                "term": name,
                "coef": float(res.params[name]),
                "se": float(res.bse[name]),
                "t": float(res.tvalues[name]),
                "p": float(res.pvalues[name]),
                "ci_lo": float(res.conf_int().loc[name, 0]),
                "ci_hi": float(res.conf_int().loc[name, 1]),
            }
        )
    return {
        "n": int(res.nobs),
        "r2": float(res.rsquared),
        "weight": weight,
        "cluster": cluster,
        "terms": rows,
    }


def aggregate_regions(df: pd.DataFrame) -> pd.DataFrame:
    def wavg(g, col, w):
        ww = g[w].to_numpy(dtype=float)
        return np.average(g[col].to_numpy(dtype=float), weights=ww)

    rows = []
    for reg, g in df.groupby("reg_id", sort=False):
        pop = g["zcta_population"].sum()
        land = g["zcta_land_area"].sum()
        two = g["two_party"].sum()
        # Age counts from ACS, summed, then converted to percents.
        a18_24 = (
            g["m_18_19"]
            + g["m_20"]
            + g["m_21"]
            + g["m_22_24"]
            + g["f_18_19"]
            + g["f_20"]
            + g["f_21"]
            + g["f_22_24"]
        ).sum()
        a15_17 = (g["m_15_17"] + g["f_15_17"]).sum()
        a12_17 = (0.6 * (g["m_10_14"] + g["f_10_14"]) + g["m_15_17"] + g["f_15_17"]).sum()
        a18_25 = a18_24 + 0.2 * (g["m_25_29"] + g["f_25_29"]).sum()
        pop_acs = g["pop"].sum()
        ba = (g["ba"] + g["ma"] + g["prof"] + g["doc"]).sum()
        ed = g["ed_tot"].sum()
        rows.append(
            {
                "reg_id": reg,
                "st_fips": g["st_fips"].iloc[0],
                "st_name": g["st_name"].iloc[0],
                "sr_name": g["sr_name"].iloc[0],
                "mj": float(g["mj"].iloc[0]),
                "alc": float(g["alc"].iloc[0]),
                **{short: float(g[short].iloc[0]) for short, *_rest in USE_RATES},
                **{short: float(g[short].iloc[0]) for short, *_rest in DISORDER_RATES},
                "dem2": g["votes_dem"].sum() / two,
                "two_party": two,
                "pop": pop,
                "n_zcta": int(len(g)),
                "ln_dens": float(np.log(pop / (land / 1e6))),
                "pct_18_25": 100.0 * a18_25 / pop_acs,
                "pct_12_17": 100.0 * a12_17 / pop_acs,
                "pct_18_24": 100.0 * a18_24 / pop_acs,
                "pct_15_17": 100.0 * a15_17 / pop_acs,
                "pct_ba": 100.0 * ba / ed,
            }
        )
    return pd.DataFrame(rows)


def add_state_fe(df: pd.DataFrame, cols: list[str]) -> tuple[pd.DataFrame, list[str]]:
    dummies = pd.get_dummies(df["st_fips"], prefix="st", drop_first=True, dtype=float)
    out = pd.concat([df.reset_index(drop=True), dummies.reset_index(drop=True)], axis=1)
    return out, cols + list(dummies.columns)


def term_row(result: dict, name: str) -> dict | None:
    for t in result["terms"]:
        if t["term"] == name:
            return t
    return None


def pp(coef: float) -> float:
    """Coefficient on a percent-scale regressor, expressed as percentage points of dem2."""
    return 100.0 * coef


def main():
    print("loading regions")
    geoms, regions = load_regions()
    print(f"regions {len(regions)}")
    print("assigning ZCTAs")
    assign = assign_regions(geoms, regions)
    print(f"assigned {len(assign)}")
    print("loading ACS and votes")
    acs = load_acs()
    votes_lc = load_votes(VOTE_LC)
    votes_ar = load_votes(VOTE_AR)
    zcta = build_frame(assign, acs, votes_lc)
    zcta_ar = build_frame(assign, acs, votes_ar)
    print(f"zcta analysis rows landcover {len(zcta)} regions {zcta['reg_id'].nunique()}")
    reg = aggregate_regions(zcta)
    reg_ar = aggregate_regions(zcta_ar)
    print(f"region rows {len(reg)}")

    spec = ["mj", "ln_dens", "pct_18_25", "pct_12_17"]
    spec_exact = ["mj", "ln_dens", "pct_18_24", "pct_15_17"]
    spec_ed = spec + ["pct_ba"]
    spec_alc = ["alc", "ln_dens", "pct_18_25", "pct_12_17"]
    spec_both = ["mj", "alc", "ln_dens", "pct_18_25", "pct_12_17"]

    z_fe, spec_fe = add_state_fe(zcta, spec)
    r_fe, spec_fe_r = add_state_fe(reg, spec)
    r_fe_ed, spec_fe_ed = add_state_fe(reg, spec_ed)

    models = {
        "zcta_bivariate_cluster": fit_wls(zcta, ["mj"], "reg_id"),
        "zcta_specified_cluster": fit_wls(zcta, spec, "reg_id"),
        "zcta_exact_age_cluster": fit_wls(zcta, spec_exact, "reg_id"),
        "zcta_plus_ba_cluster": fit_wls(zcta, spec_ed, "reg_id"),
        "zcta_state_fe_cluster": fit_wls(z_fe, spec_fe, "reg_id"),
        "zcta_alcohol_cluster": fit_wls(zcta, spec_alc, "reg_id"),
        "zcta_mj_and_alcohol_cluster": fit_wls(zcta, spec_both, "reg_id"),
        "region_bivariate": fit_wls(reg, ["mj"], None),
        "region_specified": fit_wls(reg, spec, None),
        "region_exact_age": fit_wls(reg, spec_exact, None),
        "region_plus_ba": fit_wls(reg, spec_ed, None),
        "region_state_fe": fit_wls(r_fe, spec_fe_r, None),
        "region_state_fe_plus_ba": fit_wls(r_fe_ed, spec_fe_ed, None),
        "region_alcohol": fit_wls(reg, spec_alc, None),
        "region_mj_and_alcohol": fit_wls(reg, spec_both, None),
        "region_areal_specified": fit_wls(reg_ar, spec, None),
    }

    # Weighted descriptive moments at the region level (vote-weighted).
    w = reg["two_party"].to_numpy(dtype=float)
    desc = {
        "n_zcta": int(len(zcta)),
        "n_regions": int(len(reg)),
        "vote_weighted_mean_dem2": float(np.average(reg["dem2"], weights=w)),
        "vote_weighted_mean_mj": float(np.average(reg["mj"], weights=w)),
        "mj_min": float(reg["mj"].min()),
        "mj_max": float(reg["mj"].max()),
        "mj_p25": float(reg["mj"].quantile(0.25)),
        "mj_p75": float(reg["mj"].quantile(0.75)),
        "two_party_votes": float(reg["two_party"].sum()),
    }

    summary = {}
    for name, res in models.items():
        entry = {"n": res["n"], "r2": res["r2"], "cluster": res["cluster"]}
        m = term_row(res, "mj")
        if m is not None:
            entry.update(
                {
                    "mj_coef_on_share": m["coef"],
                    "mj_se_on_share": m["se"],
                    "mj_pp_per_pp": pp(m["coef"]),
                    "mj_se_pp": pp(m["se"]),
                    "mj_p": m["p"],
                    "mj_ci95_pp": [pp(m["ci_lo"]), pp(m["ci_hi"])],
                }
            )
        alc = term_row(res, "alc")
        if alc is not None:
            entry.update(
                {
                    "alc_pp_per_pp": pp(alc["coef"]),
                    "alc_se_pp": pp(alc["se"]),
                    "alc_p": alc["p"],
                    "alc_ci95_pp": [pp(alc["ci_lo"]), pp(alc["ci_hi"])],
                }
            )
        summary[name] = entry

    payload = {"descriptives": desc, "models": models, "headline": summary}
    (OUT / "results.json").write_text(json.dumps(payload, indent=2))
    reg.to_csv(OUT / "region_level.csv", index=False)
    # Compact ZCTA file for audit, not every ACS count.
    zcta[
        [
            "zcta",
            "st_fips",
            "st_name",
            "sr_name",
            "reg_id",
            "dem2",
            "two_party",
            "mj",
            "alc",
            "ln_dens",
            "pct_18_25",
            "pct_12_17",
            "pct_18_24",
            "pct_15_17",
            "pct_ba",
            "zcta_population",
        ]
    ].to_csv(OUT / "zcta_level.csv", index=False)
    print(json.dumps({"descriptives": desc, "headline": summary}, indent=2))
    from fit_extended import extend_results

    extend_results(reg, OUT)


if __name__ == "__main__":
    import sys

    if "--from-committed" in sys.argv:
        from fit_extended import main_committed

        main_committed()
    else:
        main()
