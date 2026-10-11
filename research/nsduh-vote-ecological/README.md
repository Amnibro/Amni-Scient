# Area-level association: substance use and 2024 Democratic vote share

The combined study page is [research/substance-use-vote-share.html](../substance-use-vote-share.html) (`https://amni-scient.com/research/substance-use-vote-share`). The earlier marijuana and alcohol notes redirect there.

Committed files in this directory: `run_regression.py`, `fit_extended.py`, `render_page.py`, `over_time.py`, `industry_donations_source.py`, `industry_spending.py`, `data/substate_outcomes_212223.csv`, `data/nsduh_sae_long.csv`, `data/naep_scores.csv`, `data/president_twoparty.csv`, `data/cannabis_adult_use.csv`, `data/fec_by_employer_2024.json`, `results/region_level.csv`, `results/results.json`, `results/extended.json`, `results/quintiles.csv`, `results/user_nonuser.csv`, `results/state_level.csv`, `results/state_changes.csv`, `results/over_time.json`, `results/industry_donations.csv`, `results/industry_spending_2024.csv`, `results/cannabis_ballot_2024.csv`, `results/industry_lobbying_clients_2024.csv`, `results/cannabis_fec_employers_2024.csv`, and `results/cannabis_fec_pacs_2024.csv`.

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

The study page draws each rate as region points on a 0–100 Democratic-share axis against the rate itself on a 0–100 axis, with one vote-weighted line. The density chart uses the same 0–100 share axis. The quintile table above is a bin summary. The line on the page is the vote-weighted fit with no other controls: marijuana +1.48 (SE 0.20), alcohol +1.10 (SE 0.11).

SAMHSA withdrew the 2018–2020 substate estimates (web interviews in late 2020 versus in-person interviews in 2018 and 2019). The 2016–2018 shapefile is still published. The 2021 small-area guide sets 2021 as the NSDUH baseline after multimode collection, and states redraw substate regions between cycles. The 2021–2023 file is one pooled period, so the page has no consumption change to set against the 2016–2024 or 2020–2024 vote swing. The fitted line is the rate of change in this cross-section.

Past-month alcohol, in the same density and age specification, has a coefficient of 0.66 vote-share points per percentage point of alcohol use (SE 0.09). Alcohol's regional spread is wider (weighted SD 6.1 points versus 4.0 for marijuana), so the two standardized associations are similar in size. Entered together, marijuana is 0.96 (SE 0.13) and alcohol is 0.49 (SE 0.08).

## What was joined

1. NSDUH 2021–2023 substate small-area estimates of past-month marijuana use, ages 12 or older, from the SAMHSA shapefile attribute `MRJMON` (393 mapped regions). Age-specific tables exist; the specified model uses the 12+ rate, with age structure as covariates.
2. 2024 presidential votes reallocated to ZCTAs by the land-cover method (Harvard Dataverse file `election-results-zcta-2024-landcover-method`, DOI 10.7910/DVN/Z8TSH3). Democratic two-party share is Democratic votes divided by Democratic plus Republican votes. The areal-method file is the sensitivity check.
3. ZCTA internal points from the Census 2020 Gazetteer, used to assign each ZCTA to the substate polygon that contains the point.
4. ACS 2019–2023 table-based summary file, tables B01001 (age) and B15003 (education), ZCTA rows only. Density is ZCTA population divided by land area from the vote file, then summed to the region before taking the log. Ages 12–14 are approximated as three-fifths of the 10–14 band, and age 25 as one-fifth of the 25–29 band. Replacing those with the exact bands 15–17 and 18–24 does not change the marijuana coefficient.

Region-level sums are the preferred regression. The use rate does not vary inside a substate region, so a ZCTA regression repeats the same exposure thousands of times.

## Coverage

The 2024 ZCTA vote file used here has no Alaska or Hawaii rows (highest ZCTA is 99403), so those two states drop out. Nebraska is in the shapefile: five regions, FIPS 31, polygon bounds about lon −104 to −95 and lat 40 to 43. The DBF `ST_NAME` on those polygons is “New Jersey”. Southern New Jersey (`Southern_34`, FIPS 34, about lon −75.6 to −74) is labeled `ST_NAME` “New York”. State fixed effects use `st_fips`, so Nebraska and New Jersey stay separate. `fit_extended.py` writes `st_name` from the FIPS code before it saves the CSVs. The estimation sample is 49 FIPS codes: 48 states plus the District of Columbia. DC (FIPS 11) has 8 regions. The joined file has 382 regions, 30,389 ZCTAs, and 150.1 million two-party votes.

## Limits of the coefficient

- The unit is the substate region. The regression describes co-occurrence of area-level use and area-level vote share after density and age. It does not measure how one person's vote probability changes with residual cognitive scores, psychosis, or suggestibility.
- No public file links those individual outcomes to the same person's ballot. That coefficient was not estimated.
- NSDUH substate rates are small-area estimates with their own uncertainty. Classical measurement error in the use rate pulls the slope toward zero. No errors-in-variables correction was applied.
- State indicators absorb legalization status and other statewide factors. The within-state coefficient remains about 1 vote-share point per percentage point of use, with a wider standard error.
- Density and educational attainment are stronger area-level correlates of the 2024 Democratic share than marijuana use is. The marijuana coefficient that remains after those controls is still the residual association of the use rate, shared with whatever else varies with use inside these regions.

## Suggestibility and IQ, scaled from study potency

Those curves are on the combined study page, labeled as predictions.

Suggestibility uses Kloft et al. (PNAS 2020): immediate acceptance of a planted eyewitness detail was 19% after 300 μg/kg THC (SE 0.04) and 8% on placebo (SE 0.02). That dose is placed at 14% flower THC under a 70 kg body weight, a 0.5 g session, and a 30% inhaled yield. The curve is linear on the logit between placebo and that dose. Past 14%, the band adds 35% extra uncertainty on the further climb. At 16.1% THC (2022 seized flower) the center is 21% acceptance, with a 95% band of 11–32.

Cognitive decline uses Meier et al. (PNAS 2012): adolescent-onset persistent users lost 8 IQ points. The study did not measure potency. DEA-seized flower averaged 7.1% THC over 1995–2010, and the loss is scaled linearly with potency. Sampling error on the anchor is taken as 2.5 points (within-group SD about 12, n = 23); that standard error is an assumption, not a published figure. Past 7.1%, the band adds 50% uncertainty on the extra loss. At 16.1% THC the center is 18 points, with a 95% band of 3–33. The band overlaps effects smaller than the published 8.

## Other NSDUH substate rates

`fit_extended.py` merges the SAMHSA 2021–2023 substate DBF onto the committed 382-row region file and refits the same vote-weighted specification (log density, percent 18–25, percent 12–17, HC1). Run that path with:

```bash
python3 research/nsduh-vote-ecological/run_regression.py --from-committed
```

Outcomes entered as use rates: past-month marijuana (`MRJMON`), alcohol (`ALCMON`), binge alcohol (`BNGDRK`), and illicit drugs other than marijuana (`IEMMON`); past-year cocaine (`COCYR`), hallucinogens (`HALLUYR`), methamphetamine (`METAMYR`), opioid misuse (`OPINMYR`), and pain-reliever misuse (`PNRNMYR`); past-year marijuana (`MRJYR`); past-year heroin ages 18+ (`HERYR`); underage 12–20 past-month alcohol and binge. Illicit drugs including marijuana (`ILLMON`) is fit on its own and kept out of the joint model because it nests marijuana. Disorder rates are in a second table: `UD5IAAN`, `UD5ILAN`, `UD5OPAN`, `UD5PRAN`, `UDYR5AL`, `UUDYALC`.

The joint model enters seven non-nested rates together with log density and age: marijuana, alcohol, illicit-other-than-marijuana, cocaine, opioid misuse, methamphetamine, and hallucinogens. Nested or overlapping rates stay in the alone models: illicit-including-marijuana, binge, pain-reliever misuse, past-year marijuana, heroin (18+), and the underage repeats.

The user and non-user shares in `results/user_nonuser.csv` are a bounded Goodman split. The vote-weighted regression enters the use rate as a proportion, with log density and age centered at their vote-weighted means. The HC1 sampling distribution of the non-user share (the intercept) and the user share (intercept plus slope) is restricted to the unit square. Past-month alcohol is 17.3% among non-users (interval 9.1–25.8) and 83.3% among users (74.2–92.0). Past-month binge alcohol is 39.0% and 86.9%. Marijuana, heroin, methamphetamine, cocaine, opioids, pain relievers, hallucinogens, and other illicit drugs stay off that chart: Duncan–Davis bounds on the user share run from 0 to 100. The percentile columns read the same regression at the vote-weighted 10th and 90th percentiles of the observed regional rate. For marijuana those rates are 9.8% and 20.1%, and the fitted Democratic shares are 43.7% and 55.4%. Democratic-majority regions are those with Democratic two-party share above 50% (142 regions). The marijuana ratio of vote-weighted use, Democratic-majority over Republican-majority, is 1.21.

The contour is a vote-weighted local linear surface of Democratic two-party share on past-month marijuana and past-month alcohol, drawn separately in three vote-weighted terciles of log population density. The kernel is tricube, the span is 45% of the panel’s two-party votes, and the fill stops at the convex hull of that panel. The origin is the non-user corner.

## Use, scores, and the vote over time

`over_time.py` writes the state and national series. NSDUH figures are the ages-12-or-older small-area estimates in SAMHSA’s 1999–2019 and 2021–2024 state files. The national line is the National row of those files. Pools are two-year. The 2019–2020 pool was not produced. Lines stop across 2020–2021.

NAEP figures are NCES composite means for all students: state public schools, and national public for the U.S. line. The Data Service returned state mathematics from 1996 and state reading from 1998, through 2024. Law markers sit on the national use, NAEP, and vote charts. Filled circles eased access. Open squares tightened it. Color is the sponsor’s party. Citizen initiatives are stone, with no sponsoring party. The file is `data/legislative_acts.csv`. State cannabis rows are the comprehensive programs in NCSL, State Medical Cannabis Laws, updated September 2, 2026. Sponsor, party, and roll call are filled when Congress.gov, the House Clerk, the Senate, a legislature journal, Ballotpedia, or the enrolled act records them.

The ICAR35 result sits beside that chart as the published Table 1 mean slope in Dworak, Revelle, and Condon, Intelligence 98 (2023) 101734: −0.023 SD per year, ages 18 to 60, adjusted for education and gender, 2006–2018, 95% interval −0.035 to −0.011. Figure 1 draws yearly means by education level and does not print them. The supplementary tables and the OSF preregistration at osf.io/kmgx8 do not print a year-by-year mean series, so those means are not drawn on the NAEP chart.

The group test stacks region-by-substance rows. Group A is marijuana, hallucinogens, alcohol, and cocaine. Group B is opioid misuse, pain-reliever misuse, and methamphetamine. Substance indicators absorb each rate’s level. The coefficient of interest is the interaction of the rate with group B. Controls are log density and the two age shares, centered at their vote-weighted means. Weights are two-party votes. Standard errors are reported both HC1 and clustered by region. Heroin is fit omitted from the pool and again inside group B, and its own controlled slope is reported beside both. With heroin omitted, group A is +0.76 points of Democratic share per point of the rate (clustered SE 0.08) and group B is −2.04 (SE 1.03). The difference is −2.80 (SE 1.04).

The correlation matrix is the vote-weighted Pearson correlation across the use rates, Democratic share, log density, the two age shares, and bachelor’s share. Median income is not in the region file. Partial correlations residualize each rate and Democratic share on log density, age, and bachelor’s share, then apply the same weights. Marijuana’s partial correlation is +0.48. Methamphetamine’s weighted correlation is −0.47 and its partial correlation is +0.04.

Presidential two-party share is Democratic votes divided by Democratic plus Republican votes. 2004–2020 are MIT Election Data and Science Lab, Harvard Dataverse 10.7910/DVN/42MVDX, version 20210113. The 2024 rows are the same columns, file version 2025-11-20: Harris 75,017,613 and Trump 77,302,580.

The first difference uses 2018–2019 minus 2009–2010 for past-month marijuana, past-year marijuana, past-month alcohol, and past-year cocaine. NAEP is 2019 minus 2009. The vote is 2020 minus 2008. Weights are the average of the 2008 and 2020 two-party votes. Standard errors are HC1. With two periods, the first difference is the state fixed-effects estimator. One point of additional past-month marijuana use lines up with +0.41 grade-8 mathematics points (SE 0.52) and +0.10 points of Democratic two-party share (SE 0.44). Past-year marijuana and grade-4 mathematics is −0.39 (SE 0.18). Past-month alcohol and grade-4 mathematics is +0.61 (SE 0.28).

SAMHSA does not publish these as substate rates: past-month cocaine, heroin, methamphetamine, hallucinogens, opioid misuse, or pain-reliever misuse (those six are past-year, and heroin is 18+); a separate heavy-drinking field (binge is the intensity measure); fentanyl, inhalants, LSD, PCP, or crack as separate rates. Mental illness, suicide, and perceived-risk fields are in the shapefile and are left out of the vote regression.

The lag table in `results/lag_specs.csv` is state and year fixed effects, standard errors clustered by state. Each lag from 0 through 14 years is its own regression. The distributed-lag rows enter lags 0, 2, 4, 6, and 8 together. The cumulative rows are the mean of the overlapping two-year pools whose end year falls in the prior 5 or 10 years, multiplied by the window length, in percentage-point-years. Years since medical legalization use the NCSL comprehensive-program years in `data/cannabis_medical.csv` (page updated September 2, 2026, retrieved 2026-10-11). Years since adult-use legalization use the existing statute list. The sample stops at outcome year 2020 and use year 2019, so the 2021 web-mode break stays out. Past-month marijuana and grade-8 mathematics are −0.02 points per point of use at lag 0 (SE 0.30) and −0.14 at lag 8 (SE 0.30). The same lags on Democratic two-party share are +0.65 (SE 0.26) and +0.10 (SE 0.34). The five-year and ten-year marijuana sums on grade-8 mathematics are −0.01 (SE 0.09) and −0.02 (SE 0.07).

`results/child_exposure.csv` is the published child-cognition contrasts drawn on the page, in standard deviations. ABCD microdata are in the NIMH Data Archive under controlled access and are not used. IQ-point results are the published points divided by 15. Paul and colleagues, JAMA Psychiatry, 2021, 10.1001/jamapsychiatry.2020.2902: unadjusted cognition β −0.061 after knowledge of pregnancy versus none, and −0.011 after covariates. Flak and colleagues, 2014, 10.1111/acer.12214: binge prenatal alcohol, Cohen’s d −0.13. Yang and Kramer, 2012, 10.1093/ije/dys071: −1.6 and −2.5 full-scale IQ points for weekly moderate and heavy paternal drinking. Raman, Prasad, and Appaya, 2010, 10.4103/0019-5545.74313: full-scale means 96.14 versus 105.1. The Pittsburgh, Ottawa, and Generation R papers cited on the page state a direction and do not state a point difference, so they are not on the chart.

## Industry money

`industry_donations_source.py` writes `results/industry_donations.csv`. Rows are OpenSecrets federal contribution totals for 2016–2024, codes N02 Beer/Wine/Liquor, H04 Pharmaceuticals/Health Products, and N09 Marijuana. A direct fetch of the live site returned HTTP 403 on 2026-10-11. The cycle table was taken from Internet Archive capture `20260716031036` (captured 2026-07-16). The live N09 page, read the same day, shows the same 2024 row: $969,606. That cycle is January 1, 2023 through December 31, 2024. OpenSecrets dates the underlying FEC release February 6, 2025. Party percentages are shares of contributions to candidates and parties. Outside money is in the total and is excluded from the party split.

`industry_spending.py` writes the 2024 category file and the detail files. Federal lobbying is OpenSecrets’ calendar-2024 total from Senate Office of Public Records filings (January through December): N09 $5,248,000, N02 $29,893,357, H04 $391,572,500. Lobbying has no party. Cresco Labs’ four 2024 in-house LD-2 expense reports sum to $1,150,000, the OpenSecrets client line. Outside-firm income on that client is not added.

State ballot support for the 2024 cannabis measures is $157,512,674.46, with no party. Florida Amendment 3, Smart & Safe Florida, account 83475, is $153,787,032.89 of that (reports through December 31, 2024). Trulieve’s gifts to that committee are $144,592,173.61. Nebraska Initiatives 437 and 438 share one committee and are counted once. Opposition committees are in `cannabis_ballot_2024.csv` and out of the support total.

FEC schedule A by_employer totals for the included cannabis employer strings sum to $277,316.66. Those gifts go to committees, including company PACs, so they are not added to the OpenSecrets industry total. Canopy, Cronos, and Dutchie PACs’ FEC contributions to federal candidates sum to $76,500. OpenSecrets’ PAC-to-candidate page for N09 is $68,500.

## Reproduce

```bash
export ECO_DATA=/tmp/eco
python3 research/nsduh-vote-ecological/run_regression.py
```

`ECO_DATA` must already contain the downloaded inputs used by `run_regression.py`: the NSDUH shapefile, the 2020 ZCTA gazetteer, the filtered ACS B01001 and B15003 ZCTA extracts, and the two 2024 ZCTA vote files. Source URLs are in the script header comments. Fitted objects are written to `$ECO_DATA/out/`. The full `main()` calls `extend_results` after the region file is built. Without those inputs, refit from the committed region file:

```bash
python3 research/nsduh-vote-ecological/run_regression.py --from-committed
python3 research/nsduh-vote-ecological/render_page.py
```

The page generator also rewrites `results/industry_donations.csv`.
