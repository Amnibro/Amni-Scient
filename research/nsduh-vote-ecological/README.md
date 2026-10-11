# Area-level association: past-month marijuana use and 2024 Democratic vote share

Pages on this site:

- Past-month marijuana use, suggestibility, and IQ: [research/eighteen-points.html](../eighteen-points.html)
- Past-month alcohol use: [research/past-month-alcohol-vote-share.html](../past-month-alcohol-vote-share.html)

Committed files in this directory: `run_regression.py`, `results/region_level.csv` (columns include `mj` and `alc`), and `results/results.json` (marijuana models, plus `region_alcohol`, `region_mj_and_alcohol`, `zcta_alcohol_cluster`, and `zcta_mj_and_alcohol_cluster`).

This is the ecological regression requested at the end of the uploaded Grok thread. It joins public 2021–2023 NSDUH substate estimates to 2024 presidential votes reallocated to ZIP Code Tabulation Areas, with census age structure and density as controls.

The coefficient below is an area-level residual association. It is the quantity those seven steps produce. It is not an individual-level effect of residual cognitive change, psychosis, or suggestibility on the probability of voting for one party.

## Headline result

Vote-weighted least squares, 382 NSDUH substate regions:

**Democratic two-party share rises by 1.13 percentage points for each additional percentage point of past-month marijuana use (ages 12+).**

| | Percentage points of Democratic two-party share per 1 point of past-month use | SE | 95% CI | p |
|---|---:|---:|---:|---:|
| Use only | 1.48 | 0.20 | 1.09 to 1.86 | < 0.001 |
| Use + log density + age 18–25 + age 12–17 | **1.13** | **0.13** | **0.87 to 1.40** | < 0.001 |
| Same, exact age bands (18–24 and 15–17) | 1.12 | 0.14 | 0.86 to 1.39 | < 0.001 |
| Specified model + bachelor's share | 1.09 | 0.11 | 0.87 to 1.31 | < 0.001 |
| Specified model + state indicators | 0.99 | 0.26 | 0.48 to 1.50 | < 0.001 |
| State indicators + bachelor's share | 1.14 | 0.24 | 0.68 to 1.60 | < 0.001 |
| Areal vote allocation, specified model | 1.14 | 0.13 | 0.87 to 1.40 | < 0.001 |

The specified-model controls, on the same vote-share scale:

| Term | Coefficient | SE |
|---|---:|---:|
| Past-month marijuana use (percentage points) | +0.0113 | 0.0013 |
| Log population density (people per km²) | +0.0630 | 0.0032 |
| Percent ages 18–25 | +0.0139 | 0.0034 |
| Percent ages 12–17 | −0.0029 | 0.0053 |

N = 382 regions, covering 30,389 ZCTAs and 150.1 million allocated two-party votes. Weighted R² of the specified model is 0.66. Weights are two-party votes. Standard errors are HC1. The same specification estimated at ZCTA level, with standard errors clustered by substate region, gives 1.11 points (SE 0.13). Clustering is required at that level because every ZCTA in a region is assigned that region's single use rate.

Vote-weighted mean past-month use is 14.6%. The regional interquartile range is 11.4% to 18.2%. That 6.9-point gap corresponds to about 7.8 points of Democratic two-party share in the specified model.

Vote-weighted quintiles of regional past-month use, and the vote-weighted Democratic share in each bin:

| Past-month use | Regions | Mean use | Democratic two-party share | Log density | Bachelor's or higher |
|---|---:|---:|---:|---:|---:|
| 6.2–10.9% | 77 | 9.8% | 41.9% | 4.66 | 33.9% |
| 10.9–13.0% | 76 | 12.0% | 45.5% | 4.90 | 33.3% |
| 13.0–15.9% | 77 | 14.4% | 48.5% | 5.18 | 34.5% |
| 15.9–19.4% | 75 | 17.6% | 53.7% | 5.34 | 36.3% |
| 19.4–28.3% | 77 | 21.2% | 60.0% | 5.21 | 38.9% |

Vote-weighted correlations with Democratic two-party share: log density 0.73, bachelor's share 0.71, past-month alcohol 0.48, past-month marijuana 0.42.

Past-month alcohol, in the same density and age specification, has a coefficient of 0.66 vote-share points per percentage point of alcohol use (SE 0.09). Alcohol's regional spread is wider (weighted SD 6.1 points versus 4.0 for marijuana), so the two standardized associations are similar in size. Entered together, marijuana is 0.96 (SE 0.13) and alcohol is 0.49 (SE 0.08).

## What was joined

1. NSDUH 2021–2023 substate small-area estimates of past-month marijuana use, ages 12 or older, from the SAMHSA shapefile attribute `MRJMON` (393 mapped regions). Age-specific tables exist; the specified model uses the 12+ rate, with age structure as covariates.
2. 2024 presidential votes reallocated to ZCTAs by the land-cover method (Harvard Dataverse file `election-results-zcta-2024-landcover-method`, DOI 10.7910/DVN/Z8TSH3). Democratic two-party share is Democratic votes divided by Democratic plus Republican votes. The areal-method file is the sensitivity check.
3. ZCTA internal points from the Census 2020 Gazetteer, used to assign each ZCTA to the substate polygon that contains the point.
4. ACS 2019–2023 table-based summary file, tables B01001 (age) and B15003 (education), ZCTA rows only. Density is ZCTA population divided by land area from the vote file, then summed to the region before taking the log. Ages 12–14 are approximated as three-fifths of the 10–14 band, and age 25 as one-fifth of the 25–29 band. Replacing those with the exact bands 15–17 and 18–24 does not change the marijuana coefficient.

Region-level sums are the preferred regression. The use rate does not vary inside a substate region, so a ZCTA regression repeats the same exposure thousands of times.

## Coverage

The 2024 ZCTA vote file used here has no Alaska or Hawaii rows (highest ZCTA is 99403). Nebraska's six mapped substate regions are in the NSDUH tables but not in the SAMHSA shapefile that was joined, so Nebraska's ZCTAs (about 0.6% of two-party votes in the file) are omitted. The estimation sample is 48 jurisdictions: 47 states plus the District of Columbia.

## Limits of the coefficient

- The unit is the substate region. The regression describes co-occurrence of area-level use and area-level vote share after density and age. It does not measure how one person's vote probability changes with residual cognitive scores, psychosis, or suggestibility.
- No public file links those individual outcomes to the same person's ballot. That coefficient was not estimated.
- NSDUH substate rates are small-area estimates with their own uncertainty. Classical measurement error in the use rate pulls the slope toward zero. No errors-in-variables correction was applied.
- State indicators absorb legalization status and other statewide factors. The within-state coefficient remains about 1 vote-share point per percentage point of use, with a wider standard error.
- Density and educational attainment are stronger area-level correlates of the 2024 Democratic share than marijuana use is. The marijuana coefficient that remains after those controls is still the residual association of the use rate, shared with whatever else varies with use inside these regions.

## Suggestibility and IQ, scaled from study potency

Those curves are on the research page `eighteen-points.html`, written for `research/eighteen-points.html` on amni-scient.com. They are predictions, labeled as such, and they are not vote-probability coefficients.

Suggestibility uses Kloft et al. (PNAS 2020): immediate acceptance of a planted eyewitness detail was 19% after 300 μg/kg THC (SE 0.04) and 8% on placebo (SE 0.02). That dose is placed at 14% flower THC under a 70 kg body weight, a 0.5 g session, and a 30% inhaled yield. The curve is linear on the logit between placebo and that dose. Past 14%, the band adds 35% extra uncertainty on the further climb. At 16.1% THC (2022 seized flower) the center is 21% acceptance, with a 95% band of 11–32.

Cognitive decline uses Meier et al. (PNAS 2012): adolescent-onset persistent users lost 8 IQ points. The study did not measure potency. DEA-seized flower averaged 7.1% THC over 1995–2010, and the loss is scaled linearly with potency. Sampling error on the anchor is taken as 2.5 points (within-group SD about 12, n = 23); that standard error is an assumption, not a published figure. Past 7.1%, the band adds 50% uncertainty on the extra loss. At 16.1% THC the center is 18 points, with a 95% band of 3–33. The band overlaps effects smaller than the published 8.

## Reproduce

```bash
export ECO_DATA=/tmp/eco
python3 research/nsduh-vote-ecological/run_regression.py
```

`ECO_DATA` must already contain the downloaded inputs used by `run_regression.py`: the NSDUH shapefile, the 2020 ZCTA gazetteer, the filtered ACS B01001 and B15003 ZCTA extracts, and the two 2024 ZCTA vote files. Source URLs are in the script header comments. Fitted objects are written to `$ECO_DATA/out/`. The committed copies are `research/nsduh-vote-ecological/results/region_level.csv` and `research/nsduh-vote-ecological/results/results.json`.
