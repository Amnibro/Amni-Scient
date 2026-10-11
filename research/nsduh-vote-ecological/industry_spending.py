"""2024 industry money in three categories.

Federal contributions are the OpenSecrets industry totals (see
industry_donations_source.py). The 2024 N09 row was rechecked on the live
page on 2026-10-11 and matches the archive: $969,606 for January 1, 2023
through December 31, 2024.

Federal lobbying is OpenSecrets' calendar-2024 calculation from Senate
Office of Public Records filings. The profile note says the most recent
year, downloaded April 27, 2026, covers January 1 through March 31. Prior
years, including 2024, cover January through December. Cresco Labs' in-house
LD-2 expenses for 2024 (lda.gov, retrieved 2026-10-11) are $420,000 +
$400,000 + $160,000 + $170,000 = $1,150,000, the same figure as the
OpenSecrets client line. Outside-firm income on that client is a second
report of fees the in-house total can already include, so it is not added.

State ballot support is Ballotpedia's compilation of state committee reports,
retrieved 2026-10-11. Opposition committees stay in the detail file and out
of the support total. Nebraska Initiatives 437 and 438 share one committee,
counted once.

FEC schedule A by_employer totals are gifts to committees from people whose
employer string matched. That includes gifts to a company's own PAC, so those
dollars are not added to PAC disbursements or to the OpenSecrets total.
"""

from __future__ import annotations

import csv
import json
from decimal import Decimal
from pathlib import Path

HERE = Path(__file__).resolve().parent
RETRIEVED = "2026-10-11"

FEDERAL = [
    # industry, code, total, dem, rep, pct_dem, pct_rep
    ("Beer, Wine & Liquor", "N02", "27431159", "10260545", "9026205", "52.70", "46.36"),
    ("Tobacco", "A02", "36653972", "1416762", "3660732", "27.64", "71.41"),
    ("Pharmaceuticals / Health Products", "H04", "86521633", "40910749", "26710284", "60.04", "39.20"),
    ("Marijuana", "N09", "969606", "219379", "125482", "61.40", "35.12"),
]

LOBBYING = [
    ("Beer, Wine & Liquor", "N02", "29893357", 37),
    ("Tobacco", "A02", "32389841", 24),
    ("Pharmaceuticals / Health Products", "H04", "391572500", 665),
    ("Marijuana", "N09", "5248000", 22),
]

# Client lines whose dollar amounts sum to the industry lobbying total.
# Marijuana's profile counts 22 clients; 21 lines carry the dollars.
# Beer's profile counts 37 clients; these 36 lines carry the dollars.
MARIJUANA_LOBBY_CLIENTS = [
    ("Cresco Labs", "1150000"),
    ("National Cannabis Roundtable", "642000"),
    ("Coalition for Cannabis Policy, Edu & Regulation", "610000"),
    ("US Cannabis Council", "580000"),
    ("American Healthy Alternatives Assn", "250000"),
    ("Metrc LLC", "240000"),
    ("American Trade Assn for Cannabis & Hemp", "235000"),
    ("Coalition for Adult Beverage Alternatives", "220000"),
    ("FarmaceuticalRX", "180000"),
    ("3Chi Corp", "160000"),
    ("Trulieve", "150000"),
    ("Samson Extracts", "140000"),
    ("Green Thumb Industries", "110000"),
    ("Verano Holdings", "100000"),
    ("National Cannabis Industry Assn", "95000"),
    ("Mood Product Group", "80000"),
    ("Dutchie Inc", "75000"),
    ("Cannabis Freedom Alliance", "71000"),
    ("Hometown Hero", "70000"),
    ("Cronos Group", "50000"),
    ("TCM Enterprises (Michigan)", "40000"),
]

BEER_LOBBY_CLIENTS = [
    ("Anheuser-Busch InBev", "5080000"),
    ("Distilled Spirits Council", "3650000"),
    ("Beer Institute", "3410000"),
    ("Pernod Ricard", "3280000"),
    ("Molson Coors Brewing", "2200000"),
    ("National Beer Wholesalers Assn", "1680000"),
    ("Diageo PLC", "1570000"),
    ("Brown-Forman Corp", "1200000"),
    ("Suntory Holdings", "1090000"),
    ("Constellation Brands", "970000"),
    ("Sazerac Co", "690000"),
    ("Southern Glazer's Wine & Spirits", "650000"),
    ("Bacardi Ltd", "550000"),
    ("L'arche Green NV", "480000"),
    ("Foundation for Advancing Alcohol Responsibility", "479340"),
    ("Wine Institute", "410000"),
    ("Wine & Spirits Wholesalers of America", "409000"),
    ("Nau, John L III", "240000"),
    ("Jackson Family Enterprises", "200000"),
    ("Destileria Serralles", "200000"),
    ("California Assn of Winegrape Growers", "200000"),
    ("Committee Intrpof du Vin de Champagne", "200000"),
    ("US Wine Trade Alliance", "180000"),
    ("LVMH Moet Hennessy Louis Vuitton", "175000"),
    ("Fifth Generation Inc", "160000"),
    ("Boston Beer Co", "160000"),
    ("Brewers Assn", "100017"),
    ("American Distilled Spirits Assn", "80000"),
    ("Napa Valley Vintners Assn", "80000"),
    ("National Assn of American Wineries", "50000"),
    ("Braavos LLC", "40000"),
    ("American Craft Spirits Assn", "30000"),
    ("American Beverage Licensees", "0"),
    ("Kentucky Distillers Assn", "0"),
    ("Singani 63", "0"),
    ("Texas Distilled Spirits Assn", "0"),
]

# Ballotpedia committee tables, retrieved 2026-10-11.
# counted=yes rows are the support total. Nebraska is one committee.
BALLOT = [
    {
        "state": "Florida",
        "measure": "Amendment 3",
        "committee": "Smart & Safe Florida",
        "account": "83475",
        "side": "support",
        "cash": "152473929.64",
        "in_kind": "1313103.25",
        "total": "153787032.89",
        "counted": "yes",
        "reports_through": "2024-12-31",
        "source": "Ballotpedia compilation of Florida Campaign Finance Database reports",
        "source_url": "https://ballotpedia.org/Florida_Amendment_3,_Marijuana_Legalization_Initiative_(2024)",
        "filing_url": "https://dos.elections.myflorida.com/committees/ComDetail.asp?account=83475",
        "notes": "Active PAC. Chair David Bellamy, treasurer Andrew Gay. Florida contrib.exe returned HTTP 502 on 2026-10-11.",
    },
    {
        "state": "Nebraska",
        "measure": "Initiatives 437 and 438",
        "committee": "Nebraskans for Medical Marijuana (NMM)",
        "account": "NMM",
        "side": "support",
        "cash": "1196213.73",
        "in_kind": "428649.48",
        "total": "1624863.21",
        "counted": "yes",
        "reports_through": "2025-01-14",
        "source": "Ballotpedia compilation of Nebraska Accountability and Disclosure Commission reports",
        "source_url": "https://ballotpedia.org/Nebraska_Initiative_437,_Medical_Marijuana_Legalization_Initiative_(2024)",
        "filing_url": "https://ballotpedia.org/Nebraska_Initiative_437,_Medical_Marijuana_Legalization_Initiative_(2024)",
        "notes": "One committee registered for both initiatives. Counted once.",
    },
    {
        "state": "North Dakota",
        "measure": "Initiated Measure 5",
        "committee": "New Economic Frontier",
        "account": "",
        "side": "support",
        "cash": "433249.40",
        "in_kind": "86309.10",
        "total": "519558.50",
        "counted": "yes",
        "reports_through": "2025-01-31",
        "source": "Ballotpedia compilation of North Dakota Campaign Finance Database reports",
        "source_url": "https://ballotpedia.org/North_Dakota_Initiated_Measure_5,_Marijuana_Legalization_Initiative_(2024)",
        "filing_url": "https://ballotpedia.org/North_Dakota_Initiated_Measure_5,_Marijuana_Legalization_Initiative_(2024)",
        "notes": "",
    },
    {
        "state": "South Dakota",
        "measure": "Initiated Measure 29",
        "committee": "South Dakotans for Better Marijuana Laws Inc.",
        "account": "",
        "side": "support",
        "cash": "901289.16",
        "in_kind": "224589.45",
        "total": "1125878.61",
        "counted": "yes",
        "reports_through": "2024-12-31",
        "source": "Ballotpedia compilation of South Dakota Secretary of State campaign finance reports",
        "source_url": "https://ballotpedia.org/South_Dakota_Initiated_Measure_29,_Marijuana_Legalization_Initiative_(2024)",
        "filing_url": "https://ballotpedia.org/South_Dakota_Initiated_Measure_29,_Marijuana_Legalization_Initiative_(2024)",
        "notes": "",
    },
    {
        "state": "South Dakota",
        "measure": "Initiated Measure 29",
        "committee": "Yes on 29",
        "account": "",
        "side": "support",
        "cash": "398563.00",
        "in_kind": "56778.25",
        "total": "455341.25",
        "counted": "yes",
        "reports_through": "2024-12-31",
        "source": "Ballotpedia compilation of South Dakota Secretary of State campaign finance reports",
        "source_url": "https://ballotpedia.org/South_Dakota_Initiated_Measure_29,_Marijuana_Legalization_Initiative_(2024)",
        "filing_url": "https://ballotpedia.org/South_Dakota_Initiated_Measure_29,_Marijuana_Legalization_Initiative_(2024)",
        "notes": "",
    },
    {
        "state": "Florida",
        "measure": "Amendment 3",
        "committee": "Keep Florida Clean",
        "account": "",
        "side": "oppose",
        "cash": "24990394.10",
        "in_kind": "0.00",
        "total": "24990394.10",
        "counted": "no",
        "reports_through": "2024-12-31",
        "source": "Ballotpedia compilation of Florida Campaign Finance Database reports",
        "source_url": "https://ballotpedia.org/Florida_Amendment_3,_Marijuana_Legalization_Initiative_(2024)",
        "filing_url": "https://dos.elections.myflorida.com/committees/ComDetail.asp?account=83475",
        "notes": "Opposition. Left out of the support total.",
    },
    {
        "state": "Florida",
        "measure": "Amendment 3",
        "committee": "Florida Freedom Fund",
        "account": "",
        "side": "oppose",
        "cash": "8615809.33",
        "in_kind": "80.63",
        "total": "8615889.96",
        "counted": "no",
        "reports_through": "2024-12-31",
        "source": "Ballotpedia compilation of Florida Campaign Finance Database reports",
        "source_url": "https://ballotpedia.org/Florida_Amendment_3,_Marijuana_Legalization_Initiative_(2024)",
        "filing_url": "https://ballotpedia.org/Florida_Amendment_3,_Marijuana_Legalization_Initiative_(2024)",
        "notes": "Opposition. The committee also registered against Amendment 4. Left out of the support total.",
    },
    {
        "state": "Florida",
        "measure": "Amendment 3",
        "committee": "Floridians Against Recreational Marijuana",
        "account": "",
        "side": "oppose",
        "cash": "3800.00",
        "in_kind": "0.00",
        "total": "3800.00",
        "counted": "no",
        "reports_through": "2024-12-31",
        "source": "Ballotpedia compilation of Florida Campaign Finance Database reports",
        "source_url": "https://ballotpedia.org/Florida_Amendment_3,_Marijuana_Legalization_Initiative_(2024)",
        "filing_url": "https://ballotpedia.org/Florida_Amendment_3,_Marijuana_Legalization_Initiative_(2024)",
        "notes": "Opposition. Left out of the support total.",
    },
    {
        "state": "South Dakota",
        "measure": "Initiated Measure 29",
        "committee": "Protecting SD Kids Ballot Question Committee",
        "account": "",
        "side": "oppose",
        "cash": "464881.40",
        "in_kind": "3120.00",
        "total": "468001.40",
        "counted": "no",
        "reports_through": "2024-12-31",
        "source": "Ballotpedia compilation of South Dakota Secretary of State campaign finance reports",
        "source_url": "https://ballotpedia.org/South_Dakota_Initiated_Measure_29,_Marijuana_Legalization_Initiative_(2024)",
        "filing_url": "https://ballotpedia.org/South_Dakota_Initiated_Measure_29,_Marijuana_Legalization_Initiative_(2024)",
        "notes": "Opposition. Left out of the support total.",
    },
    {
        "state": "South Dakota",
        "measure": "Initiated Measure 29",
        "committee": "Protecting SD Kids PAC",
        "account": "",
        "side": "oppose",
        "cash": "37832.23",
        "in_kind": "0.00",
        "total": "37832.23",
        "counted": "no",
        "reports_through": "2024-12-31",
        "source": "Ballotpedia compilation of South Dakota Secretary of State campaign finance reports",
        "source_url": "https://ballotpedia.org/South_Dakota_Initiated_Measure_29,_Marijuana_Legalization_Initiative_(2024)",
        "filing_url": "https://ballotpedia.org/South_Dakota_Initiated_Measure_29,_Marijuana_Legalization_Initiative_(2024)",
        "notes": "Opposition. Left out of the support total.",
    },
]

BALLOT_DONORS = [
    ("Florida", "Amendment 3", "Smart & Safe Florida", "Trulieve", "143775000.00", "817173.61", "144592173.61"),
    ("Florida", "Amendment 3", "Smart & Safe Florida", "Verano Holdings", "3500000.00", "9470.00", "3509470.00"),
    ("Florida", "Amendment 3", "Smart & Safe Florida", "CuraLeaf", "3000000.00", "0.00", "3000000.00"),
    ("Florida", "Amendment 3", "Smart & Safe Florida", "Green Thumb Industries", "2250000.00", "9470.00", "2259470.00"),
    ("South Dakota", "Initiated Measure 29", "support committees", "GLP SD LLC", "230000.00", "0.00", "230000.00"),
    ("South Dakota", "Initiated Measure 29", "support committees", "Genesis Farms LLC", "140000.00", "0.00", "140000.00"),
    ("South Dakota", "Initiated Measure 29", "support committees", "Besame Wellness SD LLC", "110000.00", "0.00", "110000.00"),
    ("Nebraska", "Initiatives 437 and 438", "Nebraskans for Medical Marijuana (NMM)", "Nebraska Families 4 Medical Cannabis", "435000.00", "303256.53", "738256.53"),
    ("North Dakota", "Initiated Measure 5", "New Economic Frontier", "GR Holdings OH-ND, LLC", "261050.00", "0.00", "261050.00"),
    ("North Dakota", "Initiated Measure 5", "New Economic Frontier", "Pure Dakota", "0.00", "86309.10", "86309.10"),
    ("North Dakota", "Initiated Measure 5", "New Economic Frontier", "Pure Dakota Health of Bismarck", "75000.00", "0.00", "75000.00"),
    ("North Dakota", "Initiated Measure 5", "New Economic Frontier", "Pure Dakota Health of Fargo", "75000.00", "0.00", "75000.00"),
]

# FEC committee totals, cycle 2024, api.open.fec.gov, retrieved 2026-10-11.
FEC_PACS = [
    {
        "committee_id": "C00771592",
        "name": "CANOPY GROWTH USA LLC EMPLOYEES POLITICAL FORUM",
        "fed_candidate_contributions": "37500.00",
        "receipts": "4133.22",
        "coverage_end": "2023-08-31",
        "last_report": "TERMINATION REPORT",
        "opensecrets_to_candidates": "32500",
        "opensecrets_dem": "7500",
        "opensecrets_rep": "25000",
    },
    {
        "committee_id": "C00764571",
        "name": "CRONOS USA HOLDINGS INC. POLITICAL ACTION COMMITTEE",
        "fed_candidate_contributions": "23500.00",
        "receipts": "40867.00",
        "coverage_end": "2024-12-31",
        "last_report": "YEAR-END",
        "opensecrets_to_candidates": "21500",
        "opensecrets_dem": "5000",
        "opensecrets_rep": "16500",
    },
    {
        "committee_id": "C00849398",
        "name": "COURIER PLUS, INC. D/B/A DUTCHIE POLITICAL ACTION COMMITTEE",
        "fed_candidate_contributions": "15500.00",
        "receipts": "75975.33",
        "coverage_end": "2024-12-31",
        "last_report": "YEAR-END",
        "opensecrets_to_candidates": "14500",
        "opensecrets_dem": "6500",
        "opensecrets_rep": "8000",
    },
    {
        "committee_id": "C00528026",
        "name": "NATIONAL CANNABIS INDUSTRY ASSOCIATION PAC",
        "fed_candidate_contributions": "0.00",
        "receipts": "8000.00",
        "coverage_end": "2024-12-31",
        "last_report": "YEAR-END",
        "opensecrets_to_candidates": "",
        "opensecrets_dem": "",
        "opensecrets_rep": "",
    },
]

INCLUDE = {
    "Trulieve": {"TRULIEVE", "TRULIEVE INC", "TRULIEVE CANNABIS", "TRULIEVE INC.", "TRULIEVE, INC."},
    "Curaleaf": {"CURALEAF", "CURALEAF, INC", "CURALEAF INC", "CURALEAF INC.", "CURALEAF LLC", "CURALEAF HOLDING", "CURALEAF.INC"},
    "Green Thumb Industries": {
        "GREEN THUMB INDUSTRIES",
        "GREEN THUMB INDUSTRIES, INC.",
        "GREEN THUMB INDUSTRIES, LLC",
        "GREEN THUMB INDUSTRIES/RISE",
    },
    "Verano": {"VERANO", "VERANO HOLDINGS", "VERANO LLC", "VERANO HOLDINGS LLC", "VERANO HOLDINGS CORP", "ZENLEAF VERANO"},
    "Cresco Labs": {"CRESCO LABS", "CRESCOLABS", "CRESCO LABS LLC", "CRESCO SUNNYSIDE"},
    "Ayr Wellness": {"AYR WELLNESS", "AYR WELLNESS, INC.", "AYR WELLNESS INC.", "AYR WELLNESS DAYTON"},
    "Tilray": {"TILRAY BRANDS", "TILRAY", "TILRAY BRANDS INC."},
    "Canopy Growth": {"CANOPY GROWTH USA LLC", "CANOPY GROWTH CORPORATION", "CANOPY GROWTH"},
    "Marijuana Policy Project": {"MARIJUANA POLICY PROJECT"},
    "National Cannabis Industry Association": {"NATIONAL CANNABIS INDUSTRY ASSOCIATION"},
    "National Cannabis Roundtable": {"NATIONAL CANNABIS ROUNDTABLE"},
}

QUERY_KEY = {
    "Trulieve": "Trulieve",
    "Curaleaf": "Curaleaf",
    "Green Thumb Industries": "Green Thumb",
    "Verano": "Verano",
    "Cresco Labs": "Cresco",
    "Ayr Wellness": "Ayr Wellness",
    "Tilray": "Tilray",
    "Canopy Growth": "Canopy Growth",
    "Marijuana Policy Project": "Marijuana Policy Project",
    "National Cannabis Industry Association": "National Cannabis",
    "National Cannabis Roundtable": "National Cannabis",
}


def D(value) -> Decimal:
    return Decimal(str(value))


def money_label(value) -> str:
    n = D(value)
    if n == n.to_integral():
        return f"${n:,.0f}"
    return f"${n:,.2f}"


def category_rows():
    rows = []
    for industry, code, total, dem, rep, pdm, prep in FEDERAL:
        rows.append(
            {
                "industry": industry,
                "opensecrets_code": code,
                "category": "Federal contributions",
                "amount": total,
                "to_democrats": dem,
                "to_republicans": rep,
                "pct_democrats": pdm,
                "pct_republicans": prep,
                "party": f"{pdm}% Democrats / {prep}% Republicans",
                "source": "OpenSecrets industry totals, FEC filings coded by OpenSecrets",
                "source_url": f"https://www.opensecrets.org/industries/totals?cycle=2024&ind={code}",
                "retrieved": RETRIEVED,
                "notes": "Cycle is January 1, 2023 through December 31, 2024. Party percentages are shares of contributions to candidates and parties. Outside money is in the total and out of the split.",
            }
        )
    for industry, code, total, n_clients in LOBBYING:
        rows.append(
            {
                "industry": industry,
                "opensecrets_code": code,
                "category": "Federal lobbying",
                "amount": total,
                "to_democrats": "",
                "to_republicans": "",
                "pct_democrats": "",
                "pct_republicans": "",
                "party": "no party",
                "source": "OpenSecrets calculation from Senate Office of Public Records",
                "source_url": f"https://www.opensecrets.org/federal-lobbying/industries/summary?cycle=2024&id={code}",
                "retrieved": RETRIEVED,
                "notes": f"Calendar 2024, January through December. Profile client count {n_clients}.",
            }
        )
    support = sum(D(r["total"]) for r in BALLOT if r["counted"] == "yes")
    rows.append(
        {
            "industry": "Marijuana",
            "opensecrets_code": "N09",
            "category": "State ballot support",
            "amount": f"{support:.2f}",
            "to_democrats": "",
            "to_republicans": "",
            "pct_democrats": "",
            "pct_republicans": "",
            "party": "no party",
            "source": "Ballotpedia compilation of state committee reports",
            "source_url": "https://ballotpedia.org/Results_for_marijuana_and_psychedelics_ballot_measures,_2024",
            "retrieved": RETRIEVED,
            "notes": "Florida Amendment 3, Nebraska Initiatives 437 and 438 counted once, North Dakota Measure 5, South Dakota Measure 29. Opposition excluded.",
        }
    )
    return rows


def ballot_rows():
    out = []
    for r in BALLOT:
        out.append({**r, "row_type": "committee", "donor": "", "retrieved": RETRIEVED})
    for state, measure, committee, donor, cash, kind, total in BALLOT_DONORS:
        out.append(
            {
                "state": state,
                "measure": measure,
                "committee": committee,
                "account": "",
                "side": "support",
                "cash": cash,
                "in_kind": kind,
                "total": total,
                "counted": "donor",
                "reports_through": "",
                "source": "Ballotpedia top-donor table",
                "source_url": "",
                "filing_url": "",
                "notes": "Named donor inside a support committee. Already inside that committee's total.",
                "row_type": "donor",
                "donor": donor,
                "retrieved": RETRIEVED,
            }
        )
    return out


def lobbying_client_rows():
    rows = []
    for client, amount in MARIJUANA_LOBBY_CLIENTS:
        rows.append(
            {
                "industry": "Marijuana",
                "opensecrets_code": "N09",
                "client": client,
                "amount": amount,
                "source_url": "https://www.opensecrets.org/federal-lobbying/industries/summary?cycle=2024&id=N09",
                "retrieved": RETRIEVED,
            }
        )
    for client, amount in BEER_LOBBY_CLIENTS:
        rows.append(
            {
                "industry": "Beer, Wine & Liquor",
                "opensecrets_code": "N02",
                "client": client,
                "amount": amount,
                "source_url": "https://www.opensecrets.org/federal-lobbying/industries/summary?cycle=2024&id=N02",
                "retrieved": RETRIEVED,
            }
        )
    return rows


def employer_rows():
    raw = json.loads((HERE / "data" / "fec_by_employer_2024.json").read_text())
    rows = []
    for group, names in INCLUDE.items():
        key = QUERY_KEY[group]
        for rec in raw[key]:
            employer = rec["employer"]
            included = employer in names
            rows.append(
                {
                    "group": group,
                    "employer": employer,
                    "committee_id": rec["committee_id"],
                    "count": rec["count"],
                    "total": f"{D(rec['total']):.2f}",
                    "included": "yes" if included else "no",
                    "cycle": rec["cycle"],
                    "endpoint": "https://api.open.fec.gov/v1/schedules/schedule_a/by_employer/",
                    "retrieved": RETRIEVED,
                }
            )
    # Ayrloom returned an empty result set.
    rows.append(
        {
            "group": "Ayrloom",
            "employer": "",
            "committee_id": "",
            "count": 0,
            "total": "0.00",
            "included": "yes",
            "cycle": 2024,
            "endpoint": "https://api.open.fec.gov/v1/schedules/schedule_a/by_employer/",
            "retrieved": RETRIEVED,
        }
    )
    return rows


def employer_included_total() -> Decimal:
    return sum(D(r["total"]) for r in employer_rows() if r["included"] == "yes" and r["employer"])


def support_total() -> Decimal:
    return sum(D(r["total"]) for r in BALLOT if r["counted"] == "yes")


def check():
    mj_clients = sum(D(a) for _, a in MARIJUANA_LOBBY_CLIENTS)
    if mj_clients != D("5248000"):
        raise SystemExit(f"marijuana lobbying clients {mj_clients}")
    beer_clients = sum(D(a) for _, a in BEER_LOBBY_CLIENTS)
    if beer_clients != D("29893357"):
        raise SystemExit(f"beer lobbying clients {beer_clients}")
    support = support_total()
    if support != D("157512674.46"):
        raise SystemExit(f"ballot support {support}")
    fl = D("153787032.89")
    fl_donors = sum(D(row[6]) for row in BALLOT_DONORS if row[0] == "Florida")
    if fl_donors != D("153361113.61"):
        raise SystemExit(f"florida donors {fl_donors}")
    if fl - fl_donors != D("425919.28"):
        raise SystemExit("florida remainder")
    pacs = sum(D(r["fed_candidate_contributions"]) for r in FEC_PACS if r["committee_id"] != "C00528026")
    if pacs != D("76500.00"):
        raise SystemExit(f"fec pacs {pacs}")
    os_pacs = sum(D(r["opensecrets_to_candidates"]) for r in FEC_PACS if r["opensecrets_to_candidates"])
    if os_pacs != D("68500"):
        raise SystemExit(f"os pacs {os_pacs}")
    included = employer_included_total()
    if included != D("277316.66"):
        raise SystemExit(f"employers {included}")
    cresco_house = D(420000) + D(400000) + D(160000) + D(170000)
    if cresco_house != D(1150000):
        raise SystemExit("cresco lda")


def write_outputs(results: Path) -> None:
    check()
    results.mkdir(parents=True, exist_ok=True)

    cat_fields = [
        "industry", "opensecrets_code", "category", "amount", "to_democrats", "to_republicans",
        "pct_democrats", "pct_republicans", "party", "source", "source_url", "retrieved", "notes",
    ]
    with (results / "industry_spending_2024.csv").open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=cat_fields)
        w.writeheader()
        w.writerows(category_rows())

    ballot_fields = [
        "row_type", "state", "measure", "committee", "donor", "account", "side", "cash", "in_kind",
        "total", "counted", "reports_through", "source", "source_url", "filing_url", "notes", "retrieved",
    ]
    with (results / "cannabis_ballot_2024.csv").open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=ballot_fields)
        w.writeheader()
        w.writerows(ballot_rows())

    lob_fields = ["industry", "opensecrets_code", "client", "amount", "source_url", "retrieved"]
    with (results / "industry_lobbying_clients_2024.csv").open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=lob_fields)
        w.writeheader()
        w.writerows(lobbying_client_rows())

    emp_fields = ["group", "employer", "committee_id", "count", "total", "included", "cycle", "endpoint", "retrieved"]
    with (results / "cannabis_fec_employers_2024.csv").open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=emp_fields)
        w.writeheader()
        w.writerows(employer_rows())

    pac_fields = list(FEC_PACS[0].keys()) + ["retrieved"]
    with (results / "cannabis_fec_pacs_2024.csv").open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=pac_fields)
        w.writeheader()
        for row in FEC_PACS:
            w.writerow({**row, "retrieved": RETRIEVED})


if __name__ == "__main__":
    dest = HERE / "results"
    write_outputs(dest)
    print("support", support_total())
    print("employers", employer_included_total())
    print(dest)
