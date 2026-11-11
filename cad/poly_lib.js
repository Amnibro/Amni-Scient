// Cited polymer grades for the stress library and the injection-molding picker.
// Numbers are copied from the cited manufacturer tables. Empty fields are null. Accessed 2026-11-11.
// cost is the library relative index, not a datasheet price.
export const POLY_ACCESSED="2026-11-11";
export const POLY=[
{
    "id": "pcppsur5000",
    "n": "PPSU (Solvay Radel R-5000)",
    "aka": [
      "PPSU",
      "polyphenylsulfone",
      "Radel",
      "Radel R",
      "Radel R-5000",
      "R-5000",
    ],
    "E": 2340,
    "nu": 0.43,
    "rho": 1290,
    "sy": 69.6,
    "su": 69.6,
    "cost": 50,
    "k": 0.3,
    "cp": null,
    "cte": 56,
    "like": "pc",
    "q": 0,
    "look": {
      "kind": "plastic",
      "color": "#c7a368",
      "rough": 0.4,
      "metal": 0
    },
    "src": "PPSU Solvay Radel R-5000, single-point values unless noted. Accessed 2026-11-11. Tensile modulus 2340 MPa and tensile yield 69.6 MPa, ASTM D638, 3.18 mm, from the Syensqo/Solvay R-5000 technical data sheet (https://catalog.ides.com/Datasheet.aspx?CULTURE=en-US&E=1445&FMT=PDF&I=92041&U=0). Elongation at break is the range 60–120% on that sheet, so a single ultimate strength is not published; su is set equal to the yield. Design-guide Table 8 rounds tensile strength to 70 MPa and modulus to 2.34 GPa (https://www.solvay.com/sites/solvay_solvay/files/tridion/documents/Radel-PPSU-Veradel-PESU-Acudel-PPSU-Design-Guide_EN.pdf). Density 1.29 g/cm³ ASTM D792. CLTE 56 µm/m·°C (5.6×10^-5 cm/cm/°C) ASTM D696, flow, 3.18 mm, from the grade sheet; design-guide Table 8 lists 56 µm/m·°C by ASTM E831. Thermal conductivity 0.30 W/m·K, ASTM E1530, design-guide Table 8 (the R-5100 color sheet lists 0.35 W/m·K by ASTM C177; that value is not used for R-5000). Poisson's ratio 0.43, ASTM E132, design-guide Table 14 for neat Radel PPSU (the R-5100 sheet lists 0.42). Glass transition 220°C ASTM E1356. Mold shrinkage on the grade sheet is 0.70% ASTM D955; design-guide Table 41 gives the range 0.6–0.7% for R-5000/5100. Melt flow 17 g/10 min at 365°C/5.0 kg, design-guide Table 1, shared by R-5000/5100. Specific heat is not published as a single number (the design guide shows a curve only) and is left empty. cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Cross-WLF and Tait coefficients were not published as numbers (processing-guide curves are not digitized here).",
    "gaps": [
      "cp",
      "cross-wlf",
      "tait",
    ],
    "g": "Plastics"
  },
{
    "id": "pcpsup1700",
    "n": "PSU (Solvay Udel P-1700)",
    "aka": [
      "PSU",
      "polysulfone",
      "polysulphone",
      "Udel",
      "Udel P-1700",
      "P-1700",
    ],
    "E": 2480,
    "nu": 0.37,
    "rho": 1240,
    "sy": 70.3,
    "su": 70.3,
    "cost": 25,
    "k": 0.26,
    "cp": null,
    "cte": 56,
    "like": "pc",
    "q": 0,
    "look": {
      "kind": "plastic",
      "color": "#e3cf9e",
      "rough": 0.4,
      "metal": 0
    },
    "src": "PSU Solvay Udel P-1700, single-point values unless noted. Accessed 2026-11-11. Syensqo grade sheet revised 2023-09-29 (https://www.genesismedicalplastics.com/wp-content/uploads/2024/07/Udel_1700_Datasheet.pdf): density 1.24 ASTM D792, tensile modulus 2480 MPa ASTM D638, tensile strength 70.3 MPa ASTM D638, elongation at break the range 50–100% (no separate ultimate stress, so su equals the reported tensile strength), CLTE flow 5.6×10^-5 cm/cm/°C ASTM D696, mold shrinkage 0.70% ASTM D955, MFR 7.0 g/10 min at 343°C/2.16 kg ASTM D1238, HDT 174°C at 1.8 MPa unannealed ASTM D648. Udel design guide (https://www.solvay.com/sites/solvay_solvay/files/tridion/documents/Udel-PSU-Design-Guide_EN.pdf), dry as molded where the guide says so (Table 2 note 3, water absorption): Table 2 tensile modulus 2.48 GPa, tensile strength 70.3 MPa, specific gravity 1.24; Table 2 CLTE flow 57 ppm/°C ASTM E831 (not used; the grade sheet's ASTM D696 value 56×10^-6 1/K is stored); Table 6 / Table 14 Poisson's ratio 0.37 ASTM E132; Table 8 thermal conductivity 0.26 W/m·K. Table 41 molding start point: melt 350–390°C, mold 138–160°C, shrinkage 0.6–0.7%. Specific heat is not published as a single number (the design guide shows a curve only) and is left empty. cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Cross-WLF and Tait coefficients were not published as numbers. A specific-volume table in the design guide (Table 10) did not extract into a reliable grid, so it was not fitted.",
    "gaps": [
      "cp",
      "cross-wlf",
      "tait",
    ],
    "g": "Plastics"
  },
{
    "id": "pcpsugf110",
    "n": "PSU 10% glass (Solvay Udel GF-110)",
    "aka": [
      "PSU GF10",
      "Udel GF-110",
      "GF-110",
    ],
    "E": 3720,
    "nu": 0.43,
    "rho": 1330,
    "sy": 77.9,
    "su": 77.9,
    "cost": 28,
    "k": 0.19,
    "cp": null,
    "cte": 40,
    "like": "pc",
    "q": 0,
    "look": {
      "kind": "plastic",
      "color": "#d9c89a",
      "rough": 0.4,
      "metal": 0
    },
    "src": "PSU Solvay Udel GF-110, 10% glass, single-point values from the Udel design guide (https://www.solvay.com/sites/solvay_solvay/files/tridion/documents/Udel-PSU-Design-Guide_EN.pdf), accessed 2026-11-11. Table 2 (SI): tensile strength 77.9 MPa, tensile modulus 3.72 GPa, elongation at break 4% (brittle flag), specific gravity 1.33 ASTM D792 (US Table 3 lists 1.32), CLTE flow 40 ppm/°C ASTM E831, mold shrinkage 0.4% ASTM D955. Table 6 Poisson's ratio 0.43 ASTM E132. Table 8 thermal conductivity 0.19 W/m·K. Table 41: melt 360–390°C, mold 138–160°C, shrinkage 0.5% (the property table lists 0.4%; both are recorded, 0.4% is the ASTM D955 column and 0.5% is the molding start-point table). Specific heat is not published as a single number (the design guide shows a curve only) and is left empty. cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. No published Cross-WLF or Tait coefficients. Fiber orientation is not modeled.",
    "gaps": [
      "cp",
      "cross-wlf",
      "tait",
    ],
    "g": "Plastics",
    "brittle": 1
  },
{
    "id": "pcpsugf120",
    "n": "PSU 20% glass (Solvay Udel GF-120)",
    "aka": [
      "PSU GF20",
      "Udel GF-120",
      "GF-120",
    ],
    "E": 6000,
    "nu": 0.42,
    "rho": 1400,
    "sy": 96.5,
    "su": 96.5,
    "cost": 30,
    "k": 0.2,
    "cp": null,
    "cte": 23,
    "like": "pc",
    "q": 0,
    "look": {
      "kind": "plastic",
      "color": "#cbb98a",
      "rough": 0.4,
      "metal": 0
    },
    "src": "PSU Solvay Udel GF-120, 20% glass, Udel design guide (https://www.solvay.com/sites/solvay_solvay/files/tridion/documents/Udel-PSU-Design-Guide_EN.pdf), accessed 2026-11-11. Table 2 (SI): tensile strength 96.5 MPa, modulus 6.00 GPa, elongation at break 3%, specific gravity 1.40 (US Table 3 lists 1.39), CLTE flow 23 ppm/°C ASTM E831, mold shrinkage 0.3% ASTM D955. Table 6 Poisson's ratio 0.42 ASTM E132. Table 8 thermal conductivity 0.20 W/m·K. Table 41 melt 360–390°C, mold 138–160°C, shrinkage 0.4%. Specific heat is not published as a single number (the design guide shows a curve only) and is left empty. cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. No published Cross-WLF or Tait coefficients. Fiber orientation is not modeled.",
    "gaps": [
      "cp",
      "cross-wlf",
      "tait",
    ],
    "g": "Plastics",
    "brittle": 1
  },
{
    "id": "pcpsugf130",
    "n": "PSU 30% glass (Solvay Udel GF-130)",
    "aka": [
      "PSU GF30",
      "Udel GF-130",
      "GF-130",
    ],
    "E": 8690,
    "nu": 0.41,
    "rho": 1490,
    "sy": 107.6,
    "su": 107.6,
    "cost": 32,
    "k": 0.22,
    "cp": null,
    "cte": 19,
    "like": "pc",
    "q": 0,
    "look": {
      "kind": "plastic",
      "color": "#b7a67a",
      "rough": 0.4,
      "metal": 0
    },
    "src": "PSU Solvay Udel GF-130, 30% glass, Udel design guide (https://www.solvay.com/sites/solvay_solvay/files/tridion/documents/Udel-PSU-Design-Guide_EN.pdf), accessed 2026-11-11. Table 2 (SI): tensile strength 107.6 MPa, modulus 8.69 GPa, elongation at break 2%, specific gravity 1.49 (US Table 3 lists 1.48), CLTE flow 19 ppm/°C ASTM E831, mold shrinkage 0.2% ASTM D955. Table 6 Poisson's ratio 0.41 ASTM E132. Table 8 thermal conductivity 0.22 W/m·K. Table 41 melt 360–390°C, mold 138–160°C, shrinkage 0.3%. Specific heat is not published as a single number (the design guide shows a curve only) and is left empty. cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. No published Cross-WLF or Tait coefficients. Fiber orientation is not modeled.",
    "gaps": [
      "cp",
      "cross-wlf",
      "tait",
    ],
    "g": "Plastics",
    "brittle": 1
  },
{
    "id": "pcpesua301",
    "n": "PESU (Solvay Veradel A-301)",
    "aka": [
      "PESU",
      "PES",
      "polyethersulfone",
      "Veradel",
      "Veradel A-301",
      "A-301",
    ],
    "E": 2650,
    "nu": 0.41,
    "rho": 1370,
    "sy": 83,
    "su": 83,
    "cost": 40,
    "k": 0.24,
    "cp": null,
    "cte": 49,
    "like": "pc",
    "q": 0,
    "look": {
      "kind": "plastic",
      "color": "#c4b48a",
      "rough": 0.4,
      "metal": 0
    },
    "src": "PESU Solvay Veradel A-301. Design guide (https://www.solvay.com/sites/solvay_solvay/files/tridion/documents/Radel-PPSU-Veradel-PESU-Acudel-PPSU-Design-Guide_EN.pdf), accessed 2026-11-11. The guide states that mechanical, physical and thermal properties of neat Veradel grades are equivalent across melt viscosities except where noted, and Table 8 prints one unfilled column: tensile strength 83 MPa, modulus 2.65 GPa, elongation at yield 6.5%, elongation at break 25–75% (range; su set to the tensile strength), specific gravity 1.37, CLTE 49 µm/m·°C ASTM E831, thermal conductivity 0.24 W/m·K ASTM E1530, Tg 220°C. Table 14 Poisson's ratio 0.41 ASTM E132 for neat Veradel PESU. Table 1 MFR 30 g/10 min at 380°C/2.16 kg for A-301 (A-201 is 20 g/10 min in the same table). Table 41 A-301 melt 350–390°C, mold 138–160°C, shrinkage 0.6–0.7%. Specific heat is not published as a single number (the design guide shows a curve only) and is left empty. cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. No published Cross-WLF or Tait coefficients.",
    "gaps": [
      "cp",
      "cross-wlf",
      "tait",
    ],
    "g": "Plastics"
  },
{
    "id": "pcpesua201",
    "n": "PESU (Solvay Veradel A-201)",
    "aka": [
      "Veradel A-201",
      "A-201",
      "PESU",
    ],
    "E": 2650,
    "nu": 0.41,
    "rho": 1370,
    "sy": 83,
    "su": 83,
    "cost": 40,
    "k": 0.24,
    "cp": null,
    "cte": 49,
    "like": "pc",
    "q": 0,
    "look": {
      "kind": "plastic",
      "color": "#c4b48a",
      "rough": 0.4,
      "metal": 0
    },
    "src": "PESU Solvay Veradel A-201, higher-viscosity unfilled grade. Same solid-property column as A-301 because the design guide (https://www.solvay.com/sites/solvay_solvay/files/tridion/documents/Radel-PPSU-Veradel-PESU-Acudel-PPSU-Design-Guide_EN.pdf, accessed 2026-11-11) says neat Veradel mechanical, physical and thermal properties are equivalent across melt viscosities except where noted. Table 1 MFR is 20 g/10 min at 380°C/2.16 kg, not the A-301 value. Table 41 melt 365–390°C, mold 138–160°C, shrinkage 0.6–0.7%. Poisson's ratio 0.41 is Table 14 for neat Veradel, ASTM E132. Specific heat is not published as a single number (the design guide shows a curve only) and is left empty. cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. No published Cross-WLF or Tait coefficients.",
    "gaps": [
      "cp",
      "cross-wlf",
      "tait",
    ],
    "g": "Plastics"
  },
{
    "id": "pcpesuag320",
    "n": "PESU 20% glass (Solvay Veradel AG-320)",
    "aka": [
      "PESU GF20",
      "Veradel AG-320",
      "AG-320",
    ],
    "E": 5700,
    "nu": 0.42,
    "rho": 1510,
    "sy": 105,
    "su": 105,
    "cost": 42,
    "k": null,
    "cp": null,
    "cte": 31,
    "like": "pc",
    "q": 0,
    "look": {
      "kind": "plastic",
      "color": "#a89878",
      "rough": 0.4,
      "metal": 0
    },
    "src": "PESU Solvay Veradel AG-320, 20% glass. Design guide Table 8 (https://www.solvay.com/sites/solvay_solvay/files/tridion/documents/Radel-PPSU-Veradel-PESU-Acudel-PPSU-Design-Guide_EN.pdf, accessed 2026-11-11): tensile strength 105 MPa, modulus 5.70 GPa, elongation at break 3.2%, specific gravity 1.51, CLTE 31 µm/m·°C ASTM E831. Thermal conductivity cell in that column is blank and is left empty. Table 14 Poisson's ratio 0.42 ASTM E132 for Veradel AG-320/330. Table 2 MFR 14 g/10 min at 380°C/2.16 kg. Table 41 melt 360–390°C, mold 138–160°C, shrinkage 0.4%. Specific heat is not published as a single number (the design guide shows a curve only) and is left empty. cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. No published Cross-WLF or Tait coefficients. Fiber orientation is not modeled.",
    "gaps": [
      "k",
      "cp",
      "cross-wlf",
      "tait",
    ],
    "g": "Plastics",
    "brittle": 1
  },
{
    "id": "pcpesuag330",
    "n": "PESU 30% glass (Solvay Veradel AG-330)",
    "aka": [
      "PESU GF30",
      "Veradel AG-330",
      "AG-330",
    ],
    "E": 8620,
    "nu": 0.42,
    "rho": 1580,
    "sy": 126,
    "su": 126,
    "cost": 44,
    "k": 0.3,
    "cp": null,
    "cte": 31,
    "like": "pc",
    "q": 0,
    "look": {
      "kind": "plastic",
      "color": "#8f8068",
      "rough": 0.4,
      "metal": 0
    },
    "src": "PESU Solvay Veradel AG-330, 30% glass. Design guide Table 8 (https://www.solvay.com/sites/solvay_solvay/files/tridion/documents/Radel-PPSU-Veradel-PESU-Acudel-PPSU-Design-Guide_EN.pdf, accessed 2026-11-11): tensile strength 126 MPa, modulus 8.62 GPa, elongation at break 1.9%, specific gravity 1.58, CLTE 31 µm/m·°C, thermal conductivity 0.30 W/m·K ASTM E1530. Table 14 Poisson's ratio 0.42 ASTM E132. Table 2 MFR 12 g/10 min at 380°C/2.16 kg. Table 41 melt 360–390°C, mold 138–160°C, shrinkage 0.3%. Specific heat is not published as a single number (the design guide shows a curve only) and is left empty. cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. No published Cross-WLF or Tait coefficients. Fiber orientation is not modeled.",
    "gaps": [
      "cp",
      "cross-wlf",
      "tait",
    ],
    "g": "Plastics",
    "brittle": 1
  },
{
    "id": "pcppsurg5030",
    "n": "PPSU 30% glass (Solvay Radel RG-5030)",
    "aka": [
      "PPSU GF30",
      "Radel RG-5030",
      "RG-5030",
    ],
    "E": 9170,
    "nu": null,
    "rho": 1530,
    "sy": 120,
    "su": 120,
    "cost": 55,
    "k": null,
    "cp": null,
    "cte": 18,
    "like": "pc",
    "q": 0,
    "look": {
      "kind": "plastic",
      "color": "#8a6a3a",
      "rough": 0.4,
      "metal": 0
    },
    "src": "PPSU Solvay Radel RG-5030, 30% glass. Design guide Table 8 (https://www.solvay.com/sites/solvay_solvay/files/tridion/documents/Radel-PPSU-Veradel-PESU-Acudel-PPSU-Design-Guide_EN.pdf, accessed 2026-11-11): tensile strength 120 MPa, modulus 9.17 GPa, elongation at break 2.4%, specific gravity 1.53, CLTE 18 µm/m·°C ASTM E831. Thermal conductivity cell is blank. Poisson's ratio is not listed for RG-5030 (Table 14 gives 0.43 for neat Radel and 0.42 for Veradel glass, which are not this grade) and is left empty. Table 2 MFR 15 g/10 min at 365°C/5.0 kg. Specific heat is not published as a single number (the design guide shows a curve only) and is left empty. cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. No published Cross-WLF or Tait coefficients. Fiber orientation is not modeled.",
    "gaps": [
      "nu",
      "k",
      "cp",
      "cross-wlf",
      "tait",
    ],
    "g": "Plastics",
    "brittle": 1
  },
{
    "id": "pcacudel",
    "n": "PPSU modified (Solvay Acudel 22000)",
    "aka": [
      "Acudel",
      "Acudel 22000",
      "modified PPSU",
    ],
    "E": 2690,
    "nu": 0.41,
    "rho": 1280,
    "sy": 77,
    "su": 77,
    "cost": 35,
    "k": 0.24,
    "cp": null,
    "cte": 63,
    "like": "pc",
    "q": 0,
    "look": {
      "kind": "plastic",
      "color": "#d7c4a2",
      "rough": 0.4,
      "metal": 0
    },
    "src": "Solvay Acudel 22000 modified PPSU. Design guide (https://www.solvay.com/sites/solvay_solvay/files/tridion/documents/Radel-PPSU-Veradel-PESU-Acudel-PPSU-Design-Guide_EN.pdf, accessed 2026-11-11). The nomenclature text calls it unfilled modified polyphenylsulfone; Table 14 labels the Poisson row glass-filled. Stored Poisson's ratio is the published Table 14 value 0.41 ASTM E132. Table 8: tensile strength 77 MPa, modulus 2.69 GPa, elongation at yield 6.7%, elongation at break 25–75% (range), specific gravity 1.28, CLTE 63 µm/m·°C, thermal conductivity 0.24 W/m·K ASTM E1530, Tg shown as 220°C for the major component. Table 1 MFR 12 g/10 min at 380°C/2.16 kg. Table 41 melt 365–393°C, mold 150–163°C, shrinkage 0.6–0.7%. Specific heat is not published as a single number (the design guide shows a curve only) and is left empty. cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. No published Cross-WLF or Tait coefficients.",
    "gaps": [
      "cp",
      "cross-wlf",
      "tait",
    ],
    "g": "Plastics"
  },
{
    "id": "pcpeek450g",
    "n": "PEEK (Victrex 450G)",
    "aka": [
      "PEEK",
      "Victrex",
      "Victrex 450G",
      "450G",
      "polyetheretherketone",
    ],
    "E": 4000,
    "nu": null,
    "rho": 1300,
    "sy": 98,
    "su": 98,
    "cost": 100,
    "k": 0.29,
    "cp": null,
    "cte": 55,
    "like": "pc",
    "q": 0,
    "look": {
      "kind": "plastic",
      "color": "#c9b38a",
      "rough": 0.4,
      "metal": 0
    },
    "src": "Victrex PEEK 450G datasheet, revision March 2026 (https://www.victrex.com/-/media/downloads/datasheets/victrex_tds_450g.pdf), accessed 2026-11-11. Single-point values at 23°C where the sheet says 23°C. Tensile modulus 4000 MPa ISO 527-1 at 23°C. Tensile stress at yield 98.0 MPa ISO 527-2 at 23°C. Tensile strain at break 25% (no separate break stress, so su equals the yield). Density crystalline 1.30 g/cm³ ISO 1183. CLTE average below 143°C 55 ppm/K ISO 11359-2 (flow direction below Tg is 45 ppm/K; the average is stored). Thermal conductivity average at 23°C 0.29 W/m/K ISO 22007-4 (along flow 0.32). Melt viscosity 350 Pa·s at 400°C ISO 11443, shear rate not stated on the sheet, so it is not used as a viscosity model. Mold shrinkage flow 0.90% and across flow 1.3%, ISO 294-4, 375°C nozzle / 190°C tool. Mould temperature 170–200°C. Barrel settings rear 355°C to nozzle 375°C. Poisson's ratio and specific heat are not on this datasheet and are left empty. cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. The existing mold card 'peek' is a different, unnamed unfilled PEEK Cross-WLF fit and is not copied onto 450G.",
    "gaps": [
      "nu",
      "cp",
      "cross-wlf",
      "tait",
    ],
    "g": "Plastics"
  },
{
    "id": "pcultem1000",
    "n": "PEI (SABIC Ultem 1000 datasheet)",
    "aka": [
      "Ultem 1000",
      "ULTEM 1000",
      "PEI",
      "polyetherimide",
    ],
    "E": 3580,
    "nu": 0.36,
    "rho": 1270,
    "sy": 110,
    "su": 110,
    "cost": 40,
    "k": 0.22,
    "cp": null,
    "cte": 55.8,
    "like": "pc",
    "q": 0,
    "look": {
      "kind": "plastic",
      "color": "#c9862e",
      "rough": 0.4,
      "metal": 0
    },
    "src": "SABIC ULTEM Resin 1000 Americas technical data sheet hosted by Protolabs (https://www.protolabs.com/media/1020056/ultem-resin_1000_americas_technical_data_sheet.pdf), accessed 2026-11-11. ASTM column, single-point: tensile modulus 3580 MPa ASTM D638, 5 mm/min, Type I; tensile stress at yield 110 MPa, same method; tensile strain at break 60% (break stress not given, so su equals the yield); specific gravity 1.27 ASTM D792; Poisson's ratio 0.36 ASTM E132; thermal conductivity 0.22 W/m·°C ASTM C177; CTE flow 5.58×10^-5 1/°C ASTM E831 from -20°C to 150°C. A separate SABIC ISO sheet (material finder, revision 20260625, https://materialfinder.sabic-specialties.com/document-download/69d81a01-36d8-eb11-810a-005056857ef3) lists tensile modulus 3200 MPa ISO 527 at 1 mm/min and tensile stress at yield 110 MPa ISO 527. The stored modulus is the ASTM value, not an average of the two methods. Specific heat is not on the Americas sheet and is left empty. The pre-existing library entry PEI (Ultem 1000) is unchanged. cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. No published Cross-WLF or Tait coefficients were added for this grade.",
    "gaps": [
      "cp",
      "cross-wlf",
      "tait",
    ],
    "g": "Plastics"
  },
{
    "id": "pcensppsu",
    "n": "PPSU (Ensinger TECASON P MT)",
    "aka": [
      "PPSU",
      "polyphenylsulfone",
      "TECASON P",
      "TECASON P MT",
    ],
    "E": 2300,
    "nu": null,
    "rho": 1310,
    "sy": 81,
    "su": 81,
    "cost": 50,
    "k": 0.25,
    "cp": 1100,
    "cte": 60,
    "like": "pc",
    "q": 0,
    "look": {
      "kind": "plastic",
      "color": "#c7a368",
      "rough": 0.45,
      "metal": 0
    },
    "src": "PPSU (Ensinger TECASON P MT). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/ppsu-biocompatible-tecason-p-mt-grey. Chemical designation on the page: PPSU (Polyphenylsulfone). Density 1.31 g/cm3. Tensile modulus 2300 MPa. Yield 81 MPa; tensile strength 81 MPa. Elongation at break 50 %. Conductivity 0.25 W/(k*m). Specific heat 1.1 J/(g*K). CLTE rows (10^-5 1/K) 6, 6. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
    "gaps": [
      "nu",
      "cross-wlf",
      "tait",
    ],
    "g": "Plastics"
  },
{
    "id": "pcenspsu",
    "n": "PSU (Ensinger TECASON S)",
    "aka": [
      "PSU",
      "polysulfone",
      "polysulphone",
      "TECASON S",
    ],
    "E": 2700,
    "nu": null,
    "rho": 1240,
    "sy": 89,
    "su": 89,
    "cost": 25,
    "k": 0.21,
    "cp": 1200,
    "cte": 60,
    "like": "pc",
    "q": 0,
    "look": {
      "kind": "plastic",
      "color": "#e3cf9e",
      "rough": 0.45,
      "metal": 0
    },
    "src": "PSU (Ensinger TECASON S). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/tecason-s-natural-. Chemical designation on the page: PSU (Polysulfone). Density 1.24 g/cm3. Tensile modulus 2700 MPa. Yield 89 MPa; tensile strength 89 MPa. Elongation at break 15 %. Conductivity 0.21 W/(k*m). Specific heat 1.2 J/(g*K). CLTE rows (10^-5 1/K) 6, 6. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
    "gaps": [
      "nu",
      "cross-wlf",
      "tait",
    ],
    "g": "Plastics"
  },
{
    "id": "pcenspei",
    "n": "PEI (Ensinger TECAPEI)",
    "aka": [
      "PEI",
      "polyetherimide",
      "TECAPEI",
      "Ultem",
    ],
    "E": 3200,
    "nu": null,
    "rho": 1280,
    "sy": 127,
    "su": 127,
    "cost": 40,
    "k": 0.21,
    "cp": 1200,
    "cte": 50,
    "like": "pc",
    "q": 0,
    "look": {
      "kind": "plastic",
      "color": "#c9862e",
      "rough": 0.45,
      "metal": 0
    },
    "src": "PEI (Ensinger TECAPEI). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/tecapei-natural. Chemical designation on the page: PEI (Polyetherimide). Density 1.28 g/cm3. Tensile modulus 3200 MPa. Yield 127 MPa; tensile strength 127 MPa. Elongation at break 35 %. Conductivity 0.21 W/(k*m). Specific heat 1.2 J/(g*K). CLTE rows (10^-5 1/K) 5, 5, 6. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
    "gaps": [
      "nu",
      "cross-wlf",
      "tait",
    ],
    "g": "Plastics"
  },
{
    "id": "pcenspei30",
    "n": "PEI 30% glass (Ensinger TECAPEI GF30)",
    "aka": [
      "PEI GF30",
      "TECAPEI GF30",
      "Ultem 2300",
    ],
    "E": 5300,
    "nu": null,
    "rho": 1510,
    "sy": 135,
    "su": 135,
    "cost": 45,
    "k": null,
    "cp": null,
    "cte": 30,
    "like": "pc",
    "q": 0,
    "look": {
      "kind": "plastic",
      "color": "#8a6a3a",
      "rough": 0.45,
      "metal": 0
    },
    "src": "PEI 30% glass (Ensinger TECAPEI GF30). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/tecapei-gf30-natural. Chemical designation on the page: PEI (Polyetherimide). Density 1.51 g/cm3. Tensile modulus 5300 MPa. Yield 135 MPa; tensile strength 135 MPa. Elongation at break 4 %. Conductivity not listed. Specific heat not listed. CLTE rows (10^-5 1/K) 3, 3, 4. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
    "gaps": [
      "k",
      "cp",
      "nu",
      "cross-wlf",
      "tait",
    ],
    "g": "Plastics",
    "brittle": 1
  },
{
    "id": "pcenspeek",
    "n": "PEEK (Ensinger TECAPEEK natural)",
    "aka": [
      "PEEK",
      "polyetheretherketone",
      "TECAPEEK",
    ],
    "E": 4200,
    "nu": null,
    "rho": 1310,
    "sy": 116,
    "su": 116,
    "cost": 100,
    "k": 0.27,
    "cp": 1100,
    "cte": 50,
    "like": "pc",
    "q": 0,
    "look": {
      "kind": "plastic",
      "color": "#c9b38a",
      "rough": 0.45,
      "metal": 0
    },
    "src": "PEEK (Ensinger TECAPEEK natural). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/peek-tecapeek-natural. Chemical designation on the page: PEEK (Polyetheretherketone). Density 1.31 g/cm3. Tensile modulus 4200 MPa. Yield 116 MPa; tensile strength 116 MPa. Elongation at break 15 %. Conductivity 0.27 W/(k*m). Specific heat 1.1 J/(g*K). CLTE rows (10^-5 1/K) 5, 5, 7. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
    "gaps": [
      "nu",
      "cross-wlf",
      "tait",
    ],
    "g": "Plastics"
  },
{
    "id": "pcenspeek30",
    "n": "PEEK 30% glass (Ensinger TECAPEEK GF30)",
    "aka": [
      "PEEK GF30",
      "TECAPEEK GF30",
    ],
    "E": 6300,
    "nu": null,
    "rho": 1530,
    "sy": 113,
    "su": 113,
    "cost": 110,
    "k": 0.35,
    "cp": 1000,
    "cte": 40,
    "like": "pc",
    "q": 0,
    "look": {
      "kind": "plastic",
      "color": "#b9a06a",
      "rough": 0.45,
      "metal": 0
    },
    "src": "PEEK 30% glass (Ensinger TECAPEEK GF30). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/peek-tecapeek-gf30-natural. Chemical designation on the page: PEEK (Polyetheretherketone). Density 1.53 g/cm3. Tensile modulus 6300 MPa. Yield not listed; tensile strength 113 MPa. Only tensile strength is listed, so yield and ultimate are both that value. Elongation at break 5 %. Conductivity 0.35 W/(k*m). Specific heat 1.0 J/(g*K). CLTE rows (10^-5 1/K) 4, 4, 5. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
    "gaps": [
      "nu",
      "cross-wlf",
      "tait",
    ],
    "g": "Plastics",
    "brittle": 1
  },
{
    "id": "pcenspeekcf",
    "n": "PEEK 30% carbon (Ensinger TECAPEEK CF30)",
    "aka": [
      "PEEK CF30",
      "TECAPEEK CF30",
    ],
    "E": 6000,
    "nu": null,
    "rho": 1380,
    "sy": 112,
    "su": 112,
    "cost": 140,
    "k": 0.66,
    "cp": 1200,
    "cte": 40,
    "like": "pc",
    "q": 0,
    "look": {
      "kind": "plastic",
      "color": "#2a2a2a",
      "rough": 0.45,
      "metal": 0
    },
    "src": "PEEK 30% carbon (Ensinger TECAPEEK CF30). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/peek-tecapeek-cf30-black. Chemical designation on the page: PEEK (Polyetheretherketone). Density 1.38 g/cm3. Tensile modulus 6000 MPa. Yield not listed; tensile strength 112 MPa. Only tensile strength is listed, so yield and ultimate are both that value. Elongation at break 10 %. Conductivity 0.66 W/(k*m). Specific heat 1.2 J/(g*K). CLTE rows (10^-5 1/K) 4, 4, 6. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
    "gaps": [
      "nu",
      "cross-wlf",
      "tait",
    ],
    "g": "Plastics"
  },
{
    "id": "pcenspps40",
    "n": "PPS 40% glass (Ensinger TECATRON GF40)",
    "aka": [
      "PPS GF40",
      "TECATRON GF40",
      "polyphenylene sulfide",
    ],
    "E": 6500,
    "nu": null,
    "rho": 1630,
    "sy": 83,
    "su": 83,
    "cost": 22,
    "k": 0.35,
    "cp": 1000,
    "cte": 50,
    "like": "pc",
    "q": 0,
    "look": {
      "kind": "plastic",
      "color": "#3d3a36",
      "rough": 0.45,
      "metal": 0
    },
    "src": "PPS 40% glass (Ensinger TECATRON GF40). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/tecatron-gf40-natural. Chemical designation on the page: PPS (Polyphenylensulfide). Density 1.63 g/cm3. Tensile modulus 6500 MPa. Yield 83 MPa; tensile strength 83 MPa. Elongation at break 3 %. Conductivity 0.35 W/(k*m). Specific heat 1.0 J/(g*K). CLTE rows (10^-5 1/K) 4, 5, 10. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
    "gaps": [
      "nu",
      "cross-wlf",
      "tait",
    ],
    "g": "Plastics",
    "brittle": 1
  },
{
    "id": "pcensppsx",
    "n": "PPS (Ensinger TECATRON SX)",
    "aka": [
      "PPS",
      "polyphenylene sulfide",
      "TECATRON SX",
    ],
    "E": 4000,
    "nu": null,
    "rho": 1360,
    "sy": 100,
    "su": 102,
    "cost": 20,
    "k": 0.25,
    "cp": 1000,
    "cte": 70,
    "like": "pc",
    "q": 0,
    "look": {
      "kind": "plastic",
      "color": "#4a463f",
      "rough": 0.45,
      "metal": 0
    },
    "src": "PPS (Ensinger TECATRON SX). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/pps-tecatron-sx-natural. Chemical designation on the page: PPS (Polyphenylensulfide). Density 1.36 g/cm3. Tensile modulus 4000 MPa. Yield 100 MPa; tensile strength 102 MPa. Elongation at break 11 %. Conductivity 0.25 W/(k*m). Specific heat 1.0 J/(g*K). CLTE rows (10^-5 1/K) 6, 7, 12. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
    "gaps": [
      "nu",
      "cross-wlf",
      "tait",
    ],
    "g": "Plastics"
  },
{
    "id": "pcensppsc",
    "n": "PPS (Ensinger TECATRON CMP)",
    "aka": [
      "PPS",
      "TECATRON CMP",
      "polyphenylene sulfide",
    ],
    "E": 4100,
    "nu": null,
    "rho": 1360,
    "sy": 100,
    "su": 102,
    "cost": 20,
    "k": 0.25,
    "cp": 1000,
    "cte": 70,
    "like": "pc",
    "q": 0,
    "look": {
      "kind": "plastic",
      "color": "#4a463f",
      "rough": 0.45,
      "metal": 0
    },
    "src": "PPS (Ensinger TECATRON CMP). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/tecatron-cmp-natural. Chemical designation on the page: PPS (Polyphenylensulfide). Density 1.36 g/cm3. Tensile modulus 4100 MPa. Yield 100 MPa; tensile strength 102 MPa. Elongation at break 4 %. Conductivity 0.25 W/(k*m). Specific heat 1.0 J/(g*K). CLTE rows (10^-5 1/K) 6, 7, 12. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
    "gaps": [
      "nu",
      "cross-wlf",
      "tait",
    ],
    "g": "Plastics",
    "brittle": 1
  },
{
    "id": "pcenspi",
    "n": "PI (Ensinger TECASINT 1011)",
    "aka": [
      "PI",
      "polyimide",
      "TECASINT",
      "TECASINT 1011",
    ],
    "E": 3600,
    "nu": null,
    "rho": 1340,
    "sy": 116,
    "su": 116,
    "cost": 400,
    "k": 0.22,
    "cp": 1040,
    "cte": 53,
    "like": "pc",
    "q": 0,
    "look": {
      "kind": "plastic",
      "color": "#6b4b2f",
      "rough": 0.45,
      "metal": 0
    },
    "src": "PI (Ensinger TECASINT 1011). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/polyimide-tecasint-1011-natural. Chemical designation on the page: PI (Polyimide). Density 1.34 g/cm3. Tensile modulus 3600 MPa. Yield not listed; tensile strength 116 MPa. Only tensile strength is listed, so yield and ultimate are both that value. Elongation at break 3.8 %. Conductivity 0.22 W/(k*m). Specific heat 1.04 J/(g*K). CLTE rows (10^-5 1/K) 4.3, 5.3. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
    "gaps": [
      "nu",
      "cross-wlf",
      "tait",
    ],
    "g": "Plastics",
    "brittle": 1
  },
{
    "id": "pcenspomh",
    "n": "POM homopolymer (Ensinger TECAFORM AD)",
    "aka": [
      "POM",
      "POM-H",
      "acetal",
      "Delrin",
      "TECAFORM AD",
    ],
    "E": 3400,
    "nu": null,
    "rho": 1430,
    "sy": 79,
    "su": 79,
    "cost": 8,
    "k": 0.43,
    "cp": 1300,
    "cte": 130,
    "like": "pc",
    "q": 0,
    "look": {
      "kind": "plastic",
      "color": "#f3f1ea",
      "rough": 0.45,
      "metal": 0
    },
    "src": "POM homopolymer (Ensinger TECAFORM AD). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/acetal-tecaform-ad-natural-. Chemical designation on the page: POM-H (Polyacetal (Homopolymer)). Density 1.43 g/cm3. Tensile modulus 3400 MPa. Yield 79 MPa; tensile strength 79 MPa. Elongation at break 45 %. Conductivity 0.43 W/(k*m). Specific heat 1.3 J/(g*K). CLTE rows (10^-5 1/K) 12, 13. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
    "gaps": [
      "nu",
      "cross-wlf",
      "tait",
    ],
    "g": "Plastics"
  },
{
    "id": "pcenspomc",
    "n": "POM copolymer (Ensinger TECAFORM AH)",
    "aka": [
      "POM-C",
      "acetal copolymer",
      "Celcon",
      "TECAFORM AH",
    ],
    "E": 2800,
    "nu": null,
    "rho": 1410,
    "sy": 67,
    "su": 67,
    "cost": 8,
    "k": 0.39,
    "cp": 1400,
    "cte": 140,
    "like": "pc",
    "q": 0,
    "look": {
      "kind": "plastic",
      "color": "#f3f1ea",
      "rough": 0.45,
      "metal": 0
    },
    "src": "POM copolymer (Ensinger TECAFORM AH). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/acetal-tecaform-ah-natural. Chemical designation on the page: POM-C (Polyacetal (Copolymer)). Density 1.41 g/cm3. Tensile modulus 2800 MPa. Yield 67 MPa; tensile strength 67 MPa. Elongation at break 32 %. Conductivity 0.39 W/(k*m). Specific heat 1.4 J/(g*K). CLTE rows (10^-5 1/K) 13, 14. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
    "gaps": [
      "nu",
      "cross-wlf",
      "tait",
    ],
    "g": "Plastics"
  },
{
    "id": "pcenspomgf",
    "n": "POM copolymer 25% glass (Ensinger TECAFORM AH GF25)",
    "aka": [
      "POM GF25",
      "TECAFORM AH GF25",
    ],
    "E": 4200,
    "nu": null,
    "rho": 1590,
    "sy": 51,
    "su": 51,
    "cost": 9,
    "k": 0.47,
    "cp": 1200,
    "cte": 80,
    "like": "pc",
    "q": 0,
    "look": {
      "kind": "plastic",
      "color": "#d9d6cc",
      "rough": 0.45,
      "metal": 0
    },
    "src": "POM copolymer 25% glass (Ensinger TECAFORM AH GF25). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/glass-filled-acetal-tecaform-ah-gf25-natural. Chemical designation on the page: POM-C (Polyacetal (Copolymer)). Density 1.59 g/cm3. Tensile modulus 4200 MPa. Yield 51 MPa; tensile strength 51 MPa. Elongation at break 12 %. Conductivity 0.47 W/(k*m). Specific heat 1.2 J/(g*K). CLTE rows (10^-5 1/K) 8, 8. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
    "gaps": [
      "nu",
      "cross-wlf",
      "tait",
    ],
    "g": "Plastics"
  },
{
    "id": "pcenspa6",
    "n": "PA6 (Ensinger TECAMID 6)",
    "aka": [
      "PA6",
      "PA 6",
      "nylon 6",
      "TECAMID 6",
    ],
    "E": 3300,
    "nu": null,
    "rho": 1140,
    "sy": 78,
    "su": 79,
    "cost": 6,
    "k": 0.37,
    "cp": 1600,
    "cte": 130,
    "like": "pc",
    "q": 0,
    "look": {
      "kind": "plastic",
      "color": "#efe9d9",
      "rough": 0.45,
      "metal": 0
    },
    "src": "PA6 (Ensinger TECAMID 6). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/pa6-tecamid-6-natural. Chemical designation on the page: PA 6 (Polyamide 6). Density 1.14 g/cm3. Tensile modulus 3300 MPa. Yield 78 MPa; tensile strength 79 MPa. Elongation at break 130 %. Conductivity 0.37 W/(k*m). Specific heat 1.6 J/(g*K). CLTE rows (10^-5 1/K) 12, 13. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
    "gaps": [
      "nu",
      "cross-wlf",
      "tait",
    ],
    "g": "Plastics"
  },
{
    "id": "pcenspa6gf",
    "n": "PA6 30% glass (Ensinger TECAMID 6 GF30)",
    "aka": [
      "PA6 GF30",
      "nylon 6 GF30",
      "TECAMID 6 GF30",
    ],
    "E": 5700,
    "nu": null,
    "rho": 1360,
    "sy": 98,
    "su": 98,
    "cost": 8,
    "k": 0.41,
    "cp": 1300,
    "cte": 60,
    "like": "pc",
    "q": 0,
    "look": {
      "kind": "plastic",
      "color": "#2a2a2a",
      "rough": 0.45,
      "metal": 0
    },
    "src": "PA6 30% glass (Ensinger TECAMID 6 GF30). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/pa6-tecamid-6-gf30-black. Chemical designation on the page: PA 6 (Polyamide 6). Density 1.36 g/cm3. Tensile modulus 5700 MPa. Yield 98 MPa; tensile strength 98 MPa. Elongation at break 5 %. Conductivity 0.41 W/(k*m). Specific heat 1.3 J/(g*K). CLTE rows (10^-5 1/K) 6, 6. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
    "gaps": [
      "nu",
      "cross-wlf",
      "tait",
    ],
    "g": "Plastics",
    "brittle": 1
  },
{
    "id": "pcenspa12",
    "n": "PA12 (Ensinger TECAMID 12)",
    "aka": [
      "PA12",
      "PA 12",
      "nylon 12",
      "TECAMID 12",
    ],
    "E": 1800,
    "nu": null,
    "rho": 1020,
    "sy": 53,
    "su": 53,
    "cost": 12,
    "k": 0.3,
    "cp": 1800,
    "cte": 160,
    "like": "pc",
    "q": 0,
    "look": {
      "kind": "plastic",
      "color": "#efe9d9",
      "rough": 0.45,
      "metal": 0
    },
    "src": "PA12 (Ensinger TECAMID 12). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/pa12-tecamid-12-natural. Chemical designation on the page: PA 12 (Polyamide 12). Density 1.02 g/cm3. Tensile modulus 1800 MPa. Yield 53 MPa; tensile strength 53 MPa. Elongation at break 200 %. Conductivity 0.30 W/(k*m). Specific heat 1.8 J/(g*K). CLTE rows (10^-5 1/K) 15, 16. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
    "gaps": [
      "nu",
      "cross-wlf",
      "tait",
    ],
    "g": "Plastics"
  },
{
    "id": "pcenspa66",
    "n": "PA66 (Ensinger TECAMID 66)",
    "aka": [
      "PA66",
      "PA 66",
      "nylon 66",
      "nylon 6/6",
      "TECAMID 66",
    ],
    "E": 3500,
    "nu": null,
    "rho": 1150,
    "sy": 84,
    "su": 85,
    "cost": 6,
    "k": 0.36,
    "cp": 1500,
    "cte": 120,
    "like": "pc",
    "q": 0,
    "look": {
      "kind": "plastic",
      "color": "#efe9d9",
      "rough": 0.45,
      "metal": 0
    },
    "src": "PA66 (Ensinger TECAMID 66). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/pa66-tecamid-66-natural. Chemical designation on the page: PA 66 (Polyamide 66). Density 1.15 g/cm3. Tensile modulus 3500 MPa. Yield 84 MPa; tensile strength 85 MPa. Elongation at break 70 %. Conductivity 0.36 W/(k*m). Specific heat 1.5 J/(g*K). CLTE rows (10^-5 1/K) 11, 12. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
    "gaps": [
      "nu",
      "cross-wlf",
      "tait",
    ],
    "g": "Plastics"
  },
{
    "id": "pcenspa66gf",
    "n": "PA66 30% glass (Ensinger TECAMID 66 GF30)",
    "aka": [
      "PA66 GF30",
      "nylon 66 GF30",
      "TECAMID 66 GF30",
    ],
    "E": 5500,
    "nu": null,
    "rho": 1340,
    "sy": 91,
    "su": 91,
    "cost": 8,
    "k": 0.39,
    "cp": 1200,
    "cte": 50,
    "like": "pc",
    "q": 0,
    "look": {
      "kind": "plastic",
      "color": "#2a2a2a",
      "rough": 0.45,
      "metal": 0
    },
    "src": "PA66 30% glass (Ensinger TECAMID 66 GF30). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/pa66-tecamid-66-gf30-black. Chemical designation on the page: PA 66 (Polyamide 66). Density 1.34 g/cm3. Tensile modulus 5500 MPa. Yield 91 MPa; tensile strength 91 MPa. Elongation at break 14 %. Conductivity 0.39 W/(k*m). Specific heat 1.2 J/(g*K). CLTE rows (10^-5 1/K) 5, 5. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
    "gaps": [
      "nu",
      "cross-wlf",
      "tait",
    ],
    "g": "Plastics"
  },
{
    "id": "pcenspa66cf",
    "n": "PA66 20% carbon (Ensinger TECAMID 66 CF20)",
    "aka": [
      "PA66 CF20",
      "nylon 66 CF20",
      "TECAMID 66 CF20",
    ],
    "E": 5100,
    "nu": null,
    "rho": 1230,
    "sy": 104,
    "su": 104,
    "cost": 30,
    "k": 0.72,
    "cp": 1400,
    "cte": 100,
    "like": "pc",
    "q": 0,
    "look": {
      "kind": "plastic",
      "color": "#1c1c1c",
      "rough": 0.45,
      "metal": 0
    },
    "src": "PA66 20% carbon (Ensinger TECAMID 66 CF20). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/pa66-tecamid-66-cf20-black. Chemical designation on the page: PA 66 (Polyamide 66). Density 1.23 g/cm3. Tensile modulus 5100 MPa. Yield 104 MPa; tensile strength 104 MPa. Elongation at break 13 %. Conductivity 0.72 W/(k*m). Specific heat 1.4 J/(g*K). CLTE rows (10^-5 1/K) 9, 10. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
    "gaps": [
      "nu",
      "cross-wlf",
      "tait",
    ],
    "g": "Plastics"
  },
{
    "id": "pcenspet",
    "n": "PET (Ensinger TECADUR PET)",
    "aka": [
      "PET",
      "polyethylene terephthalate",
      "TECADUR PET",
    ],
    "E": 3300,
    "nu": null,
    "rho": 1390,
    "sy": 91,
    "su": 91,
    "cost": 10,
    "k": null,
    "cp": null,
    "cte": 100,
    "like": "pc",
    "q": 0,
    "look": {
      "kind": "plastic",
      "color": "#f2f2ee",
      "rough": 0.45,
      "metal": 0
    },
    "src": "PET (Ensinger TECADUR PET). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/polyester-tecadur-pet-natural. Chemical designation on the page: PET (Polyethylene terephthalate). Density 1.39 g/cm3. Tensile modulus 3300 MPa. Yield 91 MPa; tensile strength 91 MPa. Elongation at break 14 %. Conductivity not listed. Specific heat not listed. CLTE rows (10^-5 1/K) 8, 10. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
    "gaps": [
      "k",
      "cp",
      "nu",
      "cross-wlf",
      "tait",
    ],
    "g": "Plastics"
  },
{
    "id": "pcenspbt30",
    "n": "PBT 30% glass (Ensinger TECADUR PBT GF30)",
    "aka": [
      "PBT GF30",
      "TECADUR PBT GF30",
    ],
    "E": 3400,
    "nu": null,
    "rho": 1460,
    "sy": 46,
    "su": 46,
    "cost": 8,
    "k": 0.33,
    "cp": 1200,
    "cte": 100,
    "like": "pc",
    "q": 0,
    "look": {
      "kind": "plastic",
      "color": "#e4e0d4",
      "rough": 0.45,
      "metal": 0
    },
    "src": "PBT 30% glass (Ensinger TECADUR PBT GF30). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/tecadur-pbt-gf30-natural. Chemical designation on the page: PBT (Polybutylene terephthalate). Density 1.46 g/cm3. Tensile modulus 3400 MPa. Yield 46 MPa; tensile strength 46 MPa. Elongation at break 6 %. Conductivity 0.33 W/(k*m). Specific heat 1.2 J/(g*K). CLTE rows (10^-5 1/K) 8, 10. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
    "gaps": [
      "nu",
      "cross-wlf",
      "tait",
    ],
    "g": "Plastics"
  },
{
    "id": "pcenspc",
    "n": "PC (Ensinger TECANAT)",
    "aka": [
      "PC",
      "polycarbonate",
      "TECANAT",
    ],
    "E": 2200,
    "nu": null,
    "rho": 1190,
    "sy": 69,
    "su": 69,
    "cost": 25,
    "k": 0.25,
    "cp": 1300,
    "cte": 80,
    "like": "pc",
    "q": 0,
    "look": {
      "kind": "plastic",
      "color": "#eef3f8",
      "rough": 0.45,
      "metal": 0
    },
    "src": "PC (Ensinger TECANAT). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/polycarbonate-tecanat-natural. Chemical designation on the page: PC (Polycarbonate). Density 1.19 g/cm3. Tensile modulus 2200 MPa. Yield 69 MPa; tensile strength 69 MPa. Elongation at break 90 %. Conductivity 0.25 W/(k*m). Specific heat 1.3 J/(g*K). CLTE rows (10^-5 1/K) 8, 8. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
    "gaps": [
      "nu",
      "cross-wlf",
      "tait",
    ],
    "g": "Plastics"
  },
{
    "id": "pcenspc30",
    "n": "PC 30% glass (Ensinger TECANAT GF30)",
    "aka": [
      "PC GF30",
      "TECANAT GF30",
    ],
    "E": 4400,
    "nu": null,
    "rho": 1420,
    "sy": 87,
    "su": 87,
    "cost": 28,
    "k": 0.32,
    "cp": 1100,
    "cte": 50,
    "like": "pc",
    "q": 0,
    "look": {
      "kind": "plastic",
      "color": "#d5dde6",
      "rough": 0.45,
      "metal": 0
    },
    "src": "PC 30% glass (Ensinger TECANAT GF30). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/glass-filled-tecanat-gf30-natural. Chemical designation on the page: PC (Polycarbonate). Density 1.42 g/cm3. Tensile modulus 4400 MPa. Yield 87 MPa; tensile strength 85 MPa. The sheet also lists tensile strength 85 MPa, below the yield value, so ultimate is set to the yield and that lower figure is not used as su. Elongation at break 6 %. Conductivity 0.32 W/(k*m). Specific heat 1.1 J/(g*K). CLTE rows (10^-5 1/K) 5, 5. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
    "gaps": [
      "nu",
      "cross-wlf",
      "tait",
    ],
    "g": "Plastics"
  },
{
    "id": "pcensabs",
    "n": "ABS (Ensinger TECARAN)",
    "aka": [
      "ABS",
      "acrylonitrile butadiene styrene",
      "TECARAN",
    ],
    "E": 1700,
    "nu": null,
    "rho": 1040,
    "sy": 32,
    "su": 32,
    "cost": 4,
    "k": null,
    "cp": null,
    "cte": null,
    "like": "pc",
    "q": 0,
    "look": {
      "kind": "plastic",
      "color": "#8a8e93",
      "rough": 0.45,
      "metal": 0
    },
    "src": "ABS (Ensinger TECARAN). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/tecaran-abs-grey. Chemical designation on the page: ABS (Acrylnitrile-butadiene-styrene copolymer). Density 1.04 g/cm3. Tensile modulus 1700 MPa. Yield 32 MPa; tensile strength 32 MPa. Elongation at break 49 %. Conductivity not listed. Specific heat not listed. CLTE rows (10^-5 1/K) not listed. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
    "gaps": [
      "k",
      "cp",
      "cte",
      "nu",
      "cross-wlf",
      "tait",
    ],
    "g": "Plastics"
  },
{
    "id": "pcenspvdf",
    "n": "PVDF (Ensinger TECAFLON PVDF)",
    "aka": [
      "PVDF",
      "polyvinylidene fluoride",
      "Kynar",
      "TECAFLON PVDF",
    ],
    "E": 2200,
    "nu": null,
    "rho": 1780,
    "sy": 62,
    "su": 62,
    "cost": 20,
    "k": 0.25,
    "cp": 1300,
    "cte": 180,
    "like": "pc",
    "q": 0,
    "look": {
      "kind": "plastic",
      "color": "#efefe9",
      "rough": 0.45,
      "metal": 0
    },
    "src": "PVDF (Ensinger TECAFLON PVDF). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/tecaflon-pvdf-natural. Chemical designation on the page: PVDF (Polyvinylidene fluoride). Density 1.78 g/cm3. Tensile modulus 2200 MPa. Yield 62 MPa; tensile strength 62 MPa. Elongation at break 17 %. Conductivity 0.25 W/(k*m). Specific heat 1.3 J/(g*K). CLTE rows (10^-5 1/K) 16, 18. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
    "gaps": [
      "nu",
      "cross-wlf",
      "tait",
    ],
    "g": "Plastics"
  },
{
    "id": "pcenspp",
    "n": "PP (Ensinger TECAPRO MT)",
    "aka": [
      "PP",
      "polypropylene",
      "TECAPRO MT",
    ],
    "E": 2000,
    "nu": null,
    "rho": 930,
    "sy": 34,
    "su": 34,
    "cost": 4,
    "k": null,
    "cp": null,
    "cte": 140,
    "like": "pc",
    "q": 0,
    "look": {
      "kind": "plastic",
      "color": "#ece9e0",
      "rough": 0.45,
      "metal": 0
    },
    "src": "PP (Ensinger TECAPRO MT). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/pp-medical-tecapro-mt-white. Chemical designation on the page: PP (Polypropylene). Density 0.93 g/cm3. Tensile modulus 2000 MPa. Yield 34 MPa; tensile strength 34 MPa. Elongation at break 67 %. Conductivity not listed. Specific heat not listed. CLTE rows (10^-5 1/K) 13, 14. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
    "gaps": [
      "k",
      "cp",
      "nu",
      "cross-wlf",
      "tait",
    ],
    "g": "Plastics"
  },
{
    "id": "pcenspetw",
    "n": "PET (Ensinger TECAPET white)",
    "aka": [
      "PET",
      "TECAPET",
      "polyethylene terephthalate",
    ],
    "E": 3100,
    "nu": null,
    "rho": 1360,
    "sy": 79,
    "su": 79,
    "cost": 10,
    "k": 0.31,
    "cp": 1200,
    "cte": 100,
    "like": "pc",
    "q": 0,
    "look": {
      "kind": "plastic",
      "color": "#f7f7f4",
      "rough": 0.45,
      "metal": 0
    },
    "src": "PET (Ensinger TECAPET white). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/tecapet-white. Chemical designation on the page: PET (Polyethylene terephthalate). Density 1.36 g/cm3. Tensile modulus 3100 MPa. Yield 79 MPa; tensile strength 79 MPa. Elongation at break 10 %. Conductivity 0.31 W/(k*m). Specific heat 1.2 J/(g*K). CLTE rows (10^-5 1/K) 8, 10. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
    "gaps": [
      "nu",
      "cross-wlf",
      "tait",
    ],
    "g": "Plastics"
  },
];
const HHT="Commercial solver default heat transfer coefficient 5000 W/m\u00b2K, as stated in doi:10.3390/polym13183196 and doi:10.3390/polym15061568.";
const nodata=(name)=>name+' has no published Cross-WLF viscosity or two-domain Tait PVT coefficients, so mold flow cannot run on this card. Choose Custom material and paste the grade\'s coefficients, or pick a card that already has a viscosity model.';
export const POLY_MOLD={
  "ppsu": {
    name: "PPSU (Solvay Radel R-5000)",
    grade: "PPSU (Solvay Radel R-5000)",
    aka: [
      "PPSU",
      "polyphenylsulfone",
      "Radel",
      "Radel R",
      "Radel R-5000",
      "R-5000",
    ],
    kind: 'thermoplastic',
    noData: nodata("PPSU (Solvay Radel R-5000)"),
    rho: 1290,
    cp: null,
    k: 0.3,
    melt: [
  365,
  393,
  379,
],
    mold: [
  150,
  163,
  157,
],
    htc: 5000,
    src: {
      "solid": "PPSU Solvay Radel R-5000, single-point values unless noted. Accessed 2026-11-11. Tensile modulus 2340 MPa and tensile yield 69.6 MPa, ASTM D638, 3.18 mm, from the Syensqo/Solvay R-5000 technical data sheet (https://catalog.ides.com/Datasheet.aspx?CULTURE=en-US&E=1445&FMT=PDF&I=92041&U=0). Elongation at break is the range 60–120% on that sheet, so a single ultimate strength is not published; su is set equal to the yield. Design-guide Table 8 rounds tensile strength to 70 MPa and modulus to 2.34 GPa (https://www.solvay.com/sites/solvay_solvay/files/tridion/documents/Radel-PPSU-Veradel-PESU-Acudel-PPSU-Design-Guide_EN.pdf). Density 1.29 g/cm³ ASTM D792. CLTE 56 µm/m·°C (5.6×10^-5 cm/cm/°C) ASTM D696, flow, 3.18 mm, from the grade sheet; design-guide Table 8 lists 56 µm/m·°C by ASTM E831. Thermal conductivity 0.30 W/m·K, ASTM E1530, design-guide Table 8 (the R-5100 color sheet lists 0.35 W/m·K by ASTM C177; that value is not used for R-5000). Poisson's ratio 0.43, ASTM E132, design-guide Table 14 for neat Radel PPSU (the R-5100 sheet lists 0.42). Glass transition 220°C ASTM E1356. Mold shrinkage on the grade sheet is 0.70% ASTM D955; design-guide Table 41 gives the range 0.6–0.7% for R-5000/5100. Melt flow 17 g/10 min at 365°C/5.0 kg, design-guide Table 1, shared by R-5000/5100. Specific heat is not published as a single number (the design guide shows a curve only) and is left empty. cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Cross-WLF and Tait coefficients were not published as numbers (processing-guide curves are not digitized here).",
      "htc": "Commercial solver default heat transfer coefficient 5000 W/m²K, as stated in doi:10.3390/polym13183196 and doi:10.3390/polym15061568.",
      "process": "Solvay Radel/Veradel/Acudel design guide Table 41, R-5000/5100 . Accessed 2026-11-11.",
      "shrink": "0.6–0.7% (Table 41); grade sheet 0.70% ASTM D955 . This is molded linear shrinkage, not a Tait volumetric shrinkage."
    },
    rep: {
      "rho": "Melt density was not published. The number shown is the solid density from the same sheet.",
      "cp": "Specific heat was not published as a single value for this grade.",
      "visc": "No Cross-WLF, Cross, power-law or capillary table with a stated shear rate was published in a form that could be copied. Viscosity curves in Solvay processing guides were not digitized."
    }
  },
  "psu": {
    name: "PSU (Solvay Udel P-1700)",
    grade: "PSU (Solvay Udel P-1700)",
    aka: [
      "PSU",
      "polysulfone",
      "polysulphone",
      "Udel",
      "Udel P-1700",
      "P-1700",
    ],
    kind: 'thermoplastic',
    noData: nodata("PSU (Solvay Udel P-1700)"),
    rho: 1240,
    cp: null,
    k: 0.26,
    melt: [
  350,
  390,
  370,
],
    mold: [
  138,
  160,
  149,
],
    htc: 5000,
    src: {
      "solid": "PSU Solvay Udel P-1700, single-point values unless noted. Accessed 2026-11-11. Syensqo grade sheet revised 2023-09-29 (https://www.genesismedicalplastics.com/wp-content/uploads/2024/07/Udel_1700_Datasheet.pdf): density 1.24 ASTM D792, tensile modulus 2480 MPa ASTM D638, tensile strength 70.3 MPa ASTM D638, elongation at break the range 50–100% (no separate ultimate stress, so su equals the reported tensile strength), CLTE flow 5.6×10^-5 cm/cm/°C ASTM D696, mold shrinkage 0.70% ASTM D955, MFR 7.0 g/10 min at 343°C/2.16 kg ASTM D1238, HDT 174°C at 1.8 MPa unannealed ASTM D648. Udel design guide (https://www.solvay.com/sites/solvay_solvay/files/tridion/documents/Udel-PSU-Design-Guide_EN.pdf), dry as molded where the guide says so (Table 2 note 3, water absorption): Table 2 tensile modulus 2.48 GPa, tensile strength 70.3 MPa, specific gravity 1.24; Table 2 CLTE flow 57 ppm/°C ASTM E831 (not used; the grade sheet's ASTM D696 value 56×10^-6 1/K is stored); Table 6 / Table 14 Poisson's ratio 0.37 ASTM E132; Table 8 thermal conductivity 0.26 W/m·K. Table 41 molding start point: melt 350–390°C, mold 138–160°C, shrinkage 0.6–0.7%. Specific heat is not published as a single number (the design guide shows a curve only) and is left empty. cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Cross-WLF and Tait coefficients were not published as numbers. A specific-volume table in the design guide (Table 10) did not extract into a reliable grid, so it was not fitted.",
      "htc": "Commercial solver default heat transfer coefficient 5000 W/m²K, as stated in doi:10.3390/polym13183196 and doi:10.3390/polym15061568.",
      "process": "Solvay Udel design guide Table 41, P-1700 . Accessed 2026-11-11.",
      "shrink": "0.6–0.7% Table 41; grade sheet 0.70% ASTM D955 . This is molded linear shrinkage, not a Tait volumetric shrinkage."
    },
    rep: {
      "rho": "Melt density was not published. The number shown is the solid density from the same sheet.",
      "cp": "Specific heat was not published as a single value for this grade.",
      "visc": "No Cross-WLF, Cross, power-law or capillary table with a stated shear rate was published in a form that could be copied. Viscosity curves in Solvay processing guides were not digitized."
    }
  },
  "psugf110": {
    name: "PSU 10% glass (Solvay Udel GF-110)",
    grade: "PSU 10% glass (Solvay Udel GF-110)",
    aka: [
      "PSU GF10",
      "Udel GF-110",
      "GF-110",
    ],
    kind: 'thermoplastic',
    noData: nodata("PSU 10% glass (Solvay Udel GF-110)"),
    rho: 1330,
    cp: null,
    k: 0.19,
    melt: [
  360,
  390,
  375,
],
    mold: [
  138,
  160,
  149,
],
    htc: 5000,
    src: {
      "solid": "PSU Solvay Udel GF-110, 10% glass, single-point values from the Udel design guide (https://www.solvay.com/sites/solvay_solvay/files/tridion/documents/Udel-PSU-Design-Guide_EN.pdf), accessed 2026-11-11. Table 2 (SI): tensile strength 77.9 MPa, tensile modulus 3.72 GPa, elongation at break 4% (brittle flag), specific gravity 1.33 ASTM D792 (US Table 3 lists 1.32), CLTE flow 40 ppm/°C ASTM E831, mold shrinkage 0.4% ASTM D955. Table 6 Poisson's ratio 0.43 ASTM E132. Table 8 thermal conductivity 0.19 W/m·K. Table 41: melt 360–390°C, mold 138–160°C, shrinkage 0.5% (the property table lists 0.4%; both are recorded, 0.4% is the ASTM D955 column and 0.5% is the molding start-point table). Specific heat is not published as a single number (the design guide shows a curve only) and is left empty. cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. No published Cross-WLF or Tait coefficients. Fiber orientation is not modeled.",
      "htc": "Commercial solver default heat transfer coefficient 5000 W/m²K, as stated in doi:10.3390/polym13183196 and doi:10.3390/polym15061568.",
      "process": "Solvay Udel design guide Table 41, GF-110 . Accessed 2026-11-11.",
      "shrink": "Table 41 0.5%; Table 2 ASTM D955 0.4% . This is molded linear shrinkage, not a Tait volumetric shrinkage."
    },
    rep: {
      "rho": "Melt density was not published. The number shown is the solid density from the same sheet.",
      "cp": "Specific heat was not published as a single value for this grade.",
      "visc": "No Cross-WLF, Cross, power-law or capillary table with a stated shear rate was published in a form that could be copied. Viscosity curves in Solvay processing guides were not digitized."
    }
  },
  "psugf120": {
    name: "PSU 20% glass (Solvay Udel GF-120)",
    grade: "PSU 20% glass (Solvay Udel GF-120)",
    aka: [
      "PSU GF20",
      "Udel GF-120",
      "GF-120",
    ],
    kind: 'thermoplastic',
    noData: nodata("PSU 20% glass (Solvay Udel GF-120)"),
    rho: 1400,
    cp: null,
    k: 0.2,
    melt: [
  360,
  390,
  375,
],
    mold: [
  138,
  160,
  149,
],
    htc: 5000,
    src: {
      "solid": "PSU Solvay Udel GF-120, 20% glass, Udel design guide (https://www.solvay.com/sites/solvay_solvay/files/tridion/documents/Udel-PSU-Design-Guide_EN.pdf), accessed 2026-11-11. Table 2 (SI): tensile strength 96.5 MPa, modulus 6.00 GPa, elongation at break 3%, specific gravity 1.40 (US Table 3 lists 1.39), CLTE flow 23 ppm/°C ASTM E831, mold shrinkage 0.3% ASTM D955. Table 6 Poisson's ratio 0.42 ASTM E132. Table 8 thermal conductivity 0.20 W/m·K. Table 41 melt 360–390°C, mold 138–160°C, shrinkage 0.4%. Specific heat is not published as a single number (the design guide shows a curve only) and is left empty. cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. No published Cross-WLF or Tait coefficients. Fiber orientation is not modeled.",
      "htc": "Commercial solver default heat transfer coefficient 5000 W/m²K, as stated in doi:10.3390/polym13183196 and doi:10.3390/polym15061568.",
      "process": "Solvay Udel design guide Table 41, GF-120 . Accessed 2026-11-11.",
      "shrink": "Table 41 0.4%; Table 2 ASTM D955 0.3% . This is molded linear shrinkage, not a Tait volumetric shrinkage."
    },
    rep: {
      "rho": "Melt density was not published. The number shown is the solid density from the same sheet.",
      "cp": "Specific heat was not published as a single value for this grade.",
      "visc": "No Cross-WLF, Cross, power-law or capillary table with a stated shear rate was published in a form that could be copied. Viscosity curves in Solvay processing guides were not digitized."
    }
  },
  "psugf130": {
    name: "PSU 30% glass (Solvay Udel GF-130)",
    grade: "PSU 30% glass (Solvay Udel GF-130)",
    aka: [
      "PSU GF30",
      "Udel GF-130",
      "GF-130",
    ],
    kind: 'thermoplastic',
    noData: nodata("PSU 30% glass (Solvay Udel GF-130)"),
    rho: 1490,
    cp: null,
    k: 0.22,
    melt: [
  360,
  390,
  375,
],
    mold: [
  138,
  160,
  149,
],
    htc: 5000,
    src: {
      "solid": "PSU Solvay Udel GF-130, 30% glass, Udel design guide (https://www.solvay.com/sites/solvay_solvay/files/tridion/documents/Udel-PSU-Design-Guide_EN.pdf), accessed 2026-11-11. Table 2 (SI): tensile strength 107.6 MPa, modulus 8.69 GPa, elongation at break 2%, specific gravity 1.49 (US Table 3 lists 1.48), CLTE flow 19 ppm/°C ASTM E831, mold shrinkage 0.2% ASTM D955. Table 6 Poisson's ratio 0.41 ASTM E132. Table 8 thermal conductivity 0.22 W/m·K. Table 41 melt 360–390°C, mold 138–160°C, shrinkage 0.3%. Specific heat is not published as a single number (the design guide shows a curve only) and is left empty. cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. No published Cross-WLF or Tait coefficients. Fiber orientation is not modeled.",
      "htc": "Commercial solver default heat transfer coefficient 5000 W/m²K, as stated in doi:10.3390/polym13183196 and doi:10.3390/polym15061568.",
      "process": "Solvay Udel design guide Table 41, GF-130 . Accessed 2026-11-11.",
      "shrink": "Table 41 0.3%; Table 2 ASTM D955 0.2% . This is molded linear shrinkage, not a Tait volumetric shrinkage."
    },
    rep: {
      "rho": "Melt density was not published. The number shown is the solid density from the same sheet.",
      "cp": "Specific heat was not published as a single value for this grade.",
      "visc": "No Cross-WLF, Cross, power-law or capillary table with a stated shear rate was published in a form that could be copied. Viscosity curves in Solvay processing guides were not digitized."
    }
  },
  "pesu": {
    name: "PESU (Solvay Veradel A-301)",
    grade: "PESU (Solvay Veradel A-301)",
    aka: [
      "PESU",
      "PES",
      "polyethersulfone",
      "Veradel",
      "Veradel A-301",
      "A-301",
    ],
    kind: 'thermoplastic',
    noData: nodata("PESU (Solvay Veradel A-301)"),
    rho: 1370,
    cp: null,
    k: 0.24,
    melt: [
  350,
  390,
  370,
],
    mold: [
  138,
  160,
  149,
],
    htc: 5000,
    src: {
      "solid": "PESU Solvay Veradel A-301. Design guide (https://www.solvay.com/sites/solvay_solvay/files/tridion/documents/Radel-PPSU-Veradel-PESU-Acudel-PPSU-Design-Guide_EN.pdf), accessed 2026-11-11. The guide states that mechanical, physical and thermal properties of neat Veradel grades are equivalent across melt viscosities except where noted, and Table 8 prints one unfilled column: tensile strength 83 MPa, modulus 2.65 GPa, elongation at yield 6.5%, elongation at break 25–75% (range; su set to the tensile strength), specific gravity 1.37, CLTE 49 µm/m·°C ASTM E831, thermal conductivity 0.24 W/m·K ASTM E1530, Tg 220°C. Table 14 Poisson's ratio 0.41 ASTM E132 for neat Veradel PESU. Table 1 MFR 30 g/10 min at 380°C/2.16 kg for A-301 (A-201 is 20 g/10 min in the same table). Table 41 A-301 melt 350–390°C, mold 138–160°C, shrinkage 0.6–0.7%. Specific heat is not published as a single number (the design guide shows a curve only) and is left empty. cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. No published Cross-WLF or Tait coefficients.",
      "htc": "Commercial solver default heat transfer coefficient 5000 W/m²K, as stated in doi:10.3390/polym13183196 and doi:10.3390/polym15061568.",
      "process": "Solvay design guide Table 41, Veradel A-301 . Accessed 2026-11-11.",
      "shrink": "0.6–0.7% . This is molded linear shrinkage, not a Tait volumetric shrinkage."
    },
    rep: {
      "rho": "Melt density was not published. The number shown is the solid density from the same sheet.",
      "cp": "Specific heat was not published as a single value for this grade.",
      "visc": "No Cross-WLF, Cross, power-law or capillary table with a stated shear rate was published in a form that could be copied. Viscosity curves in Solvay processing guides were not digitized."
    }
  },
  "pesua201": {
    name: "PESU (Solvay Veradel A-201)",
    grade: "PESU (Solvay Veradel A-201)",
    aka: [
      "Veradel A-201",
      "A-201",
      "PESU",
    ],
    kind: 'thermoplastic',
    noData: nodata("PESU (Solvay Veradel A-201)"),
    rho: 1370,
    cp: null,
    k: 0.24,
    melt: [
  365,
  390,
  378,
],
    mold: [
  138,
  160,
  149,
],
    htc: 5000,
    src: {
      "solid": "PESU Solvay Veradel A-201, higher-viscosity unfilled grade. Same solid-property column as A-301 because the design guide (https://www.solvay.com/sites/solvay_solvay/files/tridion/documents/Radel-PPSU-Veradel-PESU-Acudel-PPSU-Design-Guide_EN.pdf, accessed 2026-11-11) says neat Veradel mechanical, physical and thermal properties are equivalent across melt viscosities except where noted. Table 1 MFR is 20 g/10 min at 380°C/2.16 kg, not the A-301 value. Table 41 melt 365–390°C, mold 138–160°C, shrinkage 0.6–0.7%. Poisson's ratio 0.41 is Table 14 for neat Veradel, ASTM E132. Specific heat is not published as a single number (the design guide shows a curve only) and is left empty. cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. No published Cross-WLF or Tait coefficients.",
      "htc": "Commercial solver default heat transfer coefficient 5000 W/m²K, as stated in doi:10.3390/polym13183196 and doi:10.3390/polym15061568.",
      "process": "Solvay design guide Table 41, Veradel A-201 . Accessed 2026-11-11.",
      "shrink": "0.6–0.7% . This is molded linear shrinkage, not a Tait volumetric shrinkage."
    },
    rep: {
      "rho": "Melt density was not published. The number shown is the solid density from the same sheet.",
      "cp": "Specific heat was not published as a single value for this grade.",
      "visc": "No Cross-WLF, Cross, power-law or capillary table with a stated shear rate was published in a form that could be copied. Viscosity curves in Solvay processing guides were not digitized."
    }
  },
  "pesugf20": {
    name: "PESU 20% glass (Solvay Veradel AG-320)",
    grade: "PESU 20% glass (Solvay Veradel AG-320)",
    aka: [
      "PESU GF20",
      "Veradel AG-320",
      "AG-320",
    ],
    kind: 'thermoplastic',
    noData: nodata("PESU 20% glass (Solvay Veradel AG-320)"),
    rho: 1510,
    cp: null,
    k: null,
    melt: [
  360,
  390,
  375,
],
    mold: [
  138,
  160,
  149,
],
    htc: 5000,
    src: {
      "solid": "PESU Solvay Veradel AG-320, 20% glass. Design guide Table 8 (https://www.solvay.com/sites/solvay_solvay/files/tridion/documents/Radel-PPSU-Veradel-PESU-Acudel-PPSU-Design-Guide_EN.pdf, accessed 2026-11-11): tensile strength 105 MPa, modulus 5.70 GPa, elongation at break 3.2%, specific gravity 1.51, CLTE 31 µm/m·°C ASTM E831. Thermal conductivity cell in that column is blank and is left empty. Table 14 Poisson's ratio 0.42 ASTM E132 for Veradel AG-320/330. Table 2 MFR 14 g/10 min at 380°C/2.16 kg. Table 41 melt 360–390°C, mold 138–160°C, shrinkage 0.4%. Specific heat is not published as a single number (the design guide shows a curve only) and is left empty. cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. No published Cross-WLF or Tait coefficients. Fiber orientation is not modeled.",
      "htc": "Commercial solver default heat transfer coefficient 5000 W/m²K, as stated in doi:10.3390/polym13183196 and doi:10.3390/polym15061568.",
      "process": "Solvay design guide Table 41, Veradel AG-320 . Accessed 2026-11-11.",
      "shrink": "0.4% . This is molded linear shrinkage, not a Tait volumetric shrinkage."
    },
    rep: {
      "rho": "Melt density was not published. The number shown is the solid density from the same sheet.",
      "cp": "Specific heat was not published as a single value for this grade.",
      "visc": "No Cross-WLF, Cross, power-law or capillary table with a stated shear rate was published in a form that could be copied. Viscosity curves in Solvay processing guides were not digitized."
    }
  },
  "pesugf30": {
    name: "PESU 30% glass (Solvay Veradel AG-330)",
    grade: "PESU 30% glass (Solvay Veradel AG-330)",
    aka: [
      "PESU GF30",
      "Veradel AG-330",
      "AG-330",
    ],
    kind: 'thermoplastic',
    noData: nodata("PESU 30% glass (Solvay Veradel AG-330)"),
    rho: 1580,
    cp: null,
    k: 0.3,
    melt: [
  360,
  390,
  375,
],
    mold: [
  138,
  160,
  149,
],
    htc: 5000,
    src: {
      "solid": "PESU Solvay Veradel AG-330, 30% glass. Design guide Table 8 (https://www.solvay.com/sites/solvay_solvay/files/tridion/documents/Radel-PPSU-Veradel-PESU-Acudel-PPSU-Design-Guide_EN.pdf, accessed 2026-11-11): tensile strength 126 MPa, modulus 8.62 GPa, elongation at break 1.9%, specific gravity 1.58, CLTE 31 µm/m·°C, thermal conductivity 0.30 W/m·K ASTM E1530. Table 14 Poisson's ratio 0.42 ASTM E132. Table 2 MFR 12 g/10 min at 380°C/2.16 kg. Table 41 melt 360–390°C, mold 138–160°C, shrinkage 0.3%. Specific heat is not published as a single number (the design guide shows a curve only) and is left empty. cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. No published Cross-WLF or Tait coefficients. Fiber orientation is not modeled.",
      "htc": "Commercial solver default heat transfer coefficient 5000 W/m²K, as stated in doi:10.3390/polym13183196 and doi:10.3390/polym15061568.",
      "process": "Solvay design guide Table 41, Veradel AG-330 . Accessed 2026-11-11.",
      "shrink": "0.3% . This is molded linear shrinkage, not a Tait volumetric shrinkage."
    },
    rep: {
      "rho": "Melt density was not published. The number shown is the solid density from the same sheet.",
      "cp": "Specific heat was not published as a single value for this grade.",
      "visc": "No Cross-WLF, Cross, power-law or capillary table with a stated shear rate was published in a form that could be copied. Viscosity curves in Solvay processing guides were not digitized."
    }
  },
  "ppsugf30": {
    name: "PPSU 30% glass (Solvay Radel RG-5030)",
    grade: "PPSU 30% glass (Solvay Radel RG-5030)",
    aka: [
      "PPSU GF30",
      "Radel RG-5030",
      "RG-5030",
    ],
    kind: 'thermoplastic',
    noData: nodata("PPSU 30% glass (Solvay Radel RG-5030)"),
    rho: 1530,
    cp: null,
    k: null,
    htc: 5000,
    src: {
      "solid": "PPSU Solvay Radel RG-5030, 30% glass. Design guide Table 8 (https://www.solvay.com/sites/solvay_solvay/files/tridion/documents/Radel-PPSU-Veradel-PESU-Acudel-PPSU-Design-Guide_EN.pdf, accessed 2026-11-11): tensile strength 120 MPa, modulus 9.17 GPa, elongation at break 2.4%, specific gravity 1.53, CLTE 18 µm/m·°C ASTM E831. Thermal conductivity cell is blank. Poisson's ratio is not listed for RG-5030 (Table 14 gives 0.43 for neat Radel and 0.42 for Veradel glass, which are not this grade) and is left empty. Table 2 MFR 15 g/10 min at 365°C/5.0 kg. Specific heat is not published as a single number (the design guide shows a curve only) and is left empty. cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. No published Cross-WLF or Tait coefficients. Fiber orientation is not modeled.",
      "htc": "Commercial solver default heat transfer coefficient 5000 W/m²K, as stated in doi:10.3390/polym13183196 and doi:10.3390/polym15061568."
    },
    rep: {
      "rho": "Melt density was not published. The number shown is the solid density from the same sheet.",
      "cp": "Specific heat was not published as a single value for this grade.",
      "visc": "No Cross-WLF, Cross, power-law or capillary table with a stated shear rate was published in a form that could be copied. Viscosity curves in Solvay processing guides were not digitized."
    }
  },
  "acudel": {
    name: "PPSU modified (Solvay Acudel 22000)",
    grade: "PPSU modified (Solvay Acudel 22000)",
    aka: [
      "Acudel",
      "Acudel 22000",
      "modified PPSU",
    ],
    kind: 'thermoplastic',
    noData: nodata("PPSU modified (Solvay Acudel 22000)"),
    rho: 1280,
    cp: null,
    k: 0.24,
    melt: [
  365,
  393,
  379,
],
    mold: [
  150,
  163,
  157,
],
    htc: 5000,
    src: {
      "solid": "Solvay Acudel 22000 modified PPSU. Design guide (https://www.solvay.com/sites/solvay_solvay/files/tridion/documents/Radel-PPSU-Veradel-PESU-Acudel-PPSU-Design-Guide_EN.pdf, accessed 2026-11-11). The nomenclature text calls it unfilled modified polyphenylsulfone; Table 14 labels the Poisson row glass-filled. Stored Poisson's ratio is the published Table 14 value 0.41 ASTM E132. Table 8: tensile strength 77 MPa, modulus 2.69 GPa, elongation at yield 6.7%, elongation at break 25–75% (range), specific gravity 1.28, CLTE 63 µm/m·°C, thermal conductivity 0.24 W/m·K ASTM E1530, Tg shown as 220°C for the major component. Table 1 MFR 12 g/10 min at 380°C/2.16 kg. Table 41 melt 365–393°C, mold 150–163°C, shrinkage 0.6–0.7%. Specific heat is not published as a single number (the design guide shows a curve only) and is left empty. cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. No published Cross-WLF or Tait coefficients.",
      "htc": "Commercial solver default heat transfer coefficient 5000 W/m²K, as stated in doi:10.3390/polym13183196 and doi:10.3390/polym15061568.",
      "process": "Solvay design guide Table 41, Acudel 22000 . Accessed 2026-11-11.",
      "shrink": "0.6–0.7% . This is molded linear shrinkage, not a Tait volumetric shrinkage."
    },
    rep: {
      "rho": "Melt density was not published. The number shown is the solid density from the same sheet.",
      "cp": "Specific heat was not published as a single value for this grade.",
      "visc": "No Cross-WLF, Cross, power-law or capillary table with a stated shear rate was published in a form that could be copied. Viscosity curves in Solvay processing guides were not digitized."
    }
  },
  "peek450g": {
    name: "PEEK (Victrex 450G)",
    grade: "PEEK (Victrex 450G)",
    aka: [
      "PEEK",
      "Victrex",
      "Victrex 450G",
      "450G",
      "polyetheretherketone",
    ],
    kind: 'thermoplastic',
    noData: nodata("PEEK (Victrex 450G)"),
    rho: 1300,
    cp: null,
    k: 0.29,
    melt: [
  355,
  375,
  365,
],
    mold: [
  170,
  200,
  185,
],
    htc: 5000,
    src: {
      "solid": "Victrex PEEK 450G datasheet, revision March 2026 (https://www.victrex.com/-/media/downloads/datasheets/victrex_tds_450g.pdf), accessed 2026-11-11. Single-point values at 23°C where the sheet says 23°C. Tensile modulus 4000 MPa ISO 527-1 at 23°C. Tensile stress at yield 98.0 MPa ISO 527-2 at 23°C. Tensile strain at break 25% (no separate break stress, so su equals the yield). Density crystalline 1.30 g/cm³ ISO 1183. CLTE average below 143°C 55 ppm/K ISO 11359-2 (flow direction below Tg is 45 ppm/K; the average is stored). Thermal conductivity average at 23°C 0.29 W/m/K ISO 22007-4 (along flow 0.32). Melt viscosity 350 Pa·s at 400°C ISO 11443, shear rate not stated on the sheet, so it is not used as a viscosity model. Mold shrinkage flow 0.90% and across flow 1.3%, ISO 294-4, 375°C nozzle / 190°C tool. Mould temperature 170–200°C. Barrel settings rear 355°C to nozzle 375°C. Poisson's ratio and specific heat are not on this datasheet and are left empty. cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. The existing mold card 'peek' is a different, unnamed unfilled PEEK Cross-WLF fit and is not copied onto 450G.",
      "htc": "Commercial solver default heat transfer coefficient 5000 W/m²K, as stated in doi:10.3390/polym13183196 and doi:10.3390/polym15061568.",
      "process": "Victrex 450G datasheet, March 2026, barrel rear 355°C to nozzle 375°C, mould 170–200°C . Accessed 2026-11-11.",
      "shrink": "flow 0.90%, across flow 1.3%, ISO 294-4 . This is molded linear shrinkage, not a Tait volumetric shrinkage."
    },
    rep: {
      "rho": "Melt density was not published. The number shown is the solid density from the same sheet.",
      "cp": "Specific heat was not published as a single value for this grade.",
      "visc": "Victrex reports 350 Pa·s at 400°C (ISO 11443) without a shear rate, so that single point is not used as a flow model."
    }
  },
  "ultem1000": {
    name: "PEI (SABIC Ultem 1000 datasheet)",
    grade: "PEI (SABIC Ultem 1000 datasheet)",
    aka: [
      "Ultem 1000",
      "ULTEM 1000",
      "PEI",
      "polyetherimide",
    ],
    kind: 'thermoplastic',
    noData: nodata("PEI (SABIC Ultem 1000 datasheet)"),
    rho: 1270,
    cp: null,
    k: 0.22,
    htc: 5000,
    src: {
      "solid": "SABIC ULTEM Resin 1000 Americas technical data sheet hosted by Protolabs (https://www.protolabs.com/media/1020056/ultem-resin_1000_americas_technical_data_sheet.pdf), accessed 2026-11-11. ASTM column, single-point: tensile modulus 3580 MPa ASTM D638, 5 mm/min, Type I; tensile stress at yield 110 MPa, same method; tensile strain at break 60% (break stress not given, so su equals the yield); specific gravity 1.27 ASTM D792; Poisson's ratio 0.36 ASTM E132; thermal conductivity 0.22 W/m·°C ASTM C177; CTE flow 5.58×10^-5 1/°C ASTM E831 from -20°C to 150°C. A separate SABIC ISO sheet (material finder, revision 20260625, https://materialfinder.sabic-specialties.com/document-download/69d81a01-36d8-eb11-810a-005056857ef3) lists tensile modulus 3200 MPa ISO 527 at 1 mm/min and tensile stress at yield 110 MPa ISO 527. The stored modulus is the ASTM value, not an average of the two methods. Specific heat is not on the Americas sheet and is left empty. The pre-existing library entry PEI (Ultem 1000) is unchanged. cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. No published Cross-WLF or Tait coefficients were added for this grade.",
      "htc": "Commercial solver default heat transfer coefficient 5000 W/m²K, as stated in doi:10.3390/polym13183196 and doi:10.3390/polym15061568."
    },
    rep: {
      "rho": "Melt density was not published. The number shown is the solid density from the same sheet.",
      "cp": "Specific heat was not published as a single value for this grade.",
      "visc": "No Cross-WLF, Cross, power-law or capillary table with a stated shear rate was published in a form that could be copied. Viscosity curves in Solvay processing guides were not digitized."
    }
  },
  "ensppsu": {
    name: "PPSU (Ensinger TECASON P MT)",
    grade: "PPSU (Ensinger TECASON P MT)",
    aka: [
      "PPSU",
      "polyphenylsulfone",
      "TECASON P",
      "TECASON P MT",
    ],
    kind: 'thermoplastic',
    noData: nodata("PPSU (Ensinger TECASON P MT)"),
    rho: 1310,
    cp: 1100,
    k: 0.25,
    htc: 5000,
    src: {
      "solid": "PPSU (Ensinger TECASON P MT). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/ppsu-biocompatible-tecason-p-mt-grey. Chemical designation on the page: PPSU (Polyphenylsulfone). Density 1.31 g/cm3. Tensile modulus 2300 MPa. Yield 81 MPa; tensile strength 81 MPa. Elongation at break 50 %. Conductivity 0.25 W/(k*m). Specific heat 1.1 J/(g*K). CLTE rows (10^-5 1/K) 6, 6. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
      "htc": "Commercial solver default heat transfer coefficient 5000 W/m²K, as stated in doi:10.3390/polym13183196 and doi:10.3390/polym15061568."
    },
    rep: {
      "rho": "Melt density was not published. The number shown is the solid density from the same sheet.",
      "visc": "No Cross-WLF, Cross, power-law or capillary table with a stated shear rate was published in a form that could be copied. Viscosity curves in Solvay processing guides were not digitized."
    }
  },
  "enspsu": {
    name: "PSU (Ensinger TECASON S)",
    grade: "PSU (Ensinger TECASON S)",
    aka: [
      "PSU",
      "polysulfone",
      "polysulphone",
      "TECASON S",
    ],
    kind: 'thermoplastic',
    noData: nodata("PSU (Ensinger TECASON S)"),
    rho: 1240,
    cp: 1200,
    k: 0.21,
    htc: 5000,
    src: {
      "solid": "PSU (Ensinger TECASON S). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/tecason-s-natural-. Chemical designation on the page: PSU (Polysulfone). Density 1.24 g/cm3. Tensile modulus 2700 MPa. Yield 89 MPa; tensile strength 89 MPa. Elongation at break 15 %. Conductivity 0.21 W/(k*m). Specific heat 1.2 J/(g*K). CLTE rows (10^-5 1/K) 6, 6. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
      "htc": "Commercial solver default heat transfer coefficient 5000 W/m²K, as stated in doi:10.3390/polym13183196 and doi:10.3390/polym15061568."
    },
    rep: {
      "rho": "Melt density was not published. The number shown is the solid density from the same sheet.",
      "visc": "No Cross-WLF, Cross, power-law or capillary table with a stated shear rate was published in a form that could be copied. Viscosity curves in Solvay processing guides were not digitized."
    }
  },
  "enspei": {
    name: "PEI (Ensinger TECAPEI)",
    grade: "PEI (Ensinger TECAPEI)",
    aka: [
      "PEI",
      "polyetherimide",
      "TECAPEI",
      "Ultem",
    ],
    kind: 'thermoplastic',
    noData: nodata("PEI (Ensinger TECAPEI)"),
    rho: 1280,
    cp: 1200,
    k: 0.21,
    htc: 5000,
    src: {
      "solid": "PEI (Ensinger TECAPEI). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/tecapei-natural. Chemical designation on the page: PEI (Polyetherimide). Density 1.28 g/cm3. Tensile modulus 3200 MPa. Yield 127 MPa; tensile strength 127 MPa. Elongation at break 35 %. Conductivity 0.21 W/(k*m). Specific heat 1.2 J/(g*K). CLTE rows (10^-5 1/K) 5, 5, 6. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
      "htc": "Commercial solver default heat transfer coefficient 5000 W/m²K, as stated in doi:10.3390/polym13183196 and doi:10.3390/polym15061568."
    },
    rep: {
      "rho": "Melt density was not published. The number shown is the solid density from the same sheet.",
      "visc": "No Cross-WLF, Cross, power-law or capillary table with a stated shear rate was published in a form that could be copied. Viscosity curves in Solvay processing guides were not digitized."
    }
  },
  "enspei30": {
    name: "PEI 30% glass (Ensinger TECAPEI GF30)",
    grade: "PEI 30% glass (Ensinger TECAPEI GF30)",
    aka: [
      "PEI GF30",
      "TECAPEI GF30",
      "Ultem 2300",
    ],
    kind: 'thermoplastic',
    noData: nodata("PEI 30% glass (Ensinger TECAPEI GF30)"),
    rho: 1510,
    cp: null,
    k: null,
    htc: 5000,
    src: {
      "solid": "PEI 30% glass (Ensinger TECAPEI GF30). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/tecapei-gf30-natural. Chemical designation on the page: PEI (Polyetherimide). Density 1.51 g/cm3. Tensile modulus 5300 MPa. Yield 135 MPa; tensile strength 135 MPa. Elongation at break 4 %. Conductivity not listed. Specific heat not listed. CLTE rows (10^-5 1/K) 3, 3, 4. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
      "htc": "Commercial solver default heat transfer coefficient 5000 W/m²K, as stated in doi:10.3390/polym13183196 and doi:10.3390/polym15061568."
    },
    rep: {
      "rho": "Melt density was not published. The number shown is the solid density from the same sheet.",
      "cp": "Specific heat was not published as a single value for this grade.",
      "visc": "No Cross-WLF, Cross, power-law or capillary table with a stated shear rate was published in a form that could be copied. Viscosity curves in Solvay processing guides were not digitized."
    }
  },
  "enspeek": {
    name: "PEEK (Ensinger TECAPEEK natural)",
    grade: "PEEK (Ensinger TECAPEEK natural)",
    aka: [
      "PEEK",
      "polyetheretherketone",
      "TECAPEEK",
    ],
    kind: 'thermoplastic',
    noData: nodata("PEEK (Ensinger TECAPEEK natural)"),
    rho: 1310,
    cp: 1100,
    k: 0.27,
    htc: 5000,
    src: {
      "solid": "PEEK (Ensinger TECAPEEK natural). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/peek-tecapeek-natural. Chemical designation on the page: PEEK (Polyetheretherketone). Density 1.31 g/cm3. Tensile modulus 4200 MPa. Yield 116 MPa; tensile strength 116 MPa. Elongation at break 15 %. Conductivity 0.27 W/(k*m). Specific heat 1.1 J/(g*K). CLTE rows (10^-5 1/K) 5, 5, 7. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
      "htc": "Commercial solver default heat transfer coefficient 5000 W/m²K, as stated in doi:10.3390/polym13183196 and doi:10.3390/polym15061568."
    },
    rep: {
      "rho": "Melt density was not published. The number shown is the solid density from the same sheet.",
      "visc": "No Cross-WLF, Cross, power-law or capillary table with a stated shear rate was published in a form that could be copied. Viscosity curves in Solvay processing guides were not digitized."
    }
  },
  "enspeek30": {
    name: "PEEK 30% glass (Ensinger TECAPEEK GF30)",
    grade: "PEEK 30% glass (Ensinger TECAPEEK GF30)",
    aka: [
      "PEEK GF30",
      "TECAPEEK GF30",
    ],
    kind: 'thermoplastic',
    noData: nodata("PEEK 30% glass (Ensinger TECAPEEK GF30)"),
    rho: 1530,
    cp: 1000,
    k: 0.35,
    htc: 5000,
    src: {
      "solid": "PEEK 30% glass (Ensinger TECAPEEK GF30). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/peek-tecapeek-gf30-natural. Chemical designation on the page: PEEK (Polyetheretherketone). Density 1.53 g/cm3. Tensile modulus 6300 MPa. Yield not listed; tensile strength 113 MPa. Only tensile strength is listed, so yield and ultimate are both that value. Elongation at break 5 %. Conductivity 0.35 W/(k*m). Specific heat 1.0 J/(g*K). CLTE rows (10^-5 1/K) 4, 4, 5. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
      "htc": "Commercial solver default heat transfer coefficient 5000 W/m²K, as stated in doi:10.3390/polym13183196 and doi:10.3390/polym15061568."
    },
    rep: {
      "rho": "Melt density was not published. The number shown is the solid density from the same sheet.",
      "visc": "No Cross-WLF, Cross, power-law or capillary table with a stated shear rate was published in a form that could be copied. Viscosity curves in Solvay processing guides were not digitized."
    }
  },
  "enspeekcf": {
    name: "PEEK 30% carbon (Ensinger TECAPEEK CF30)",
    grade: "PEEK 30% carbon (Ensinger TECAPEEK CF30)",
    aka: [
      "PEEK CF30",
      "TECAPEEK CF30",
    ],
    kind: 'thermoplastic',
    noData: nodata("PEEK 30% carbon (Ensinger TECAPEEK CF30)"),
    rho: 1380,
    cp: 1200,
    k: 0.66,
    htc: 5000,
    src: {
      "solid": "PEEK 30% carbon (Ensinger TECAPEEK CF30). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/peek-tecapeek-cf30-black. Chemical designation on the page: PEEK (Polyetheretherketone). Density 1.38 g/cm3. Tensile modulus 6000 MPa. Yield not listed; tensile strength 112 MPa. Only tensile strength is listed, so yield and ultimate are both that value. Elongation at break 10 %. Conductivity 0.66 W/(k*m). Specific heat 1.2 J/(g*K). CLTE rows (10^-5 1/K) 4, 4, 6. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
      "htc": "Commercial solver default heat transfer coefficient 5000 W/m²K, as stated in doi:10.3390/polym13183196 and doi:10.3390/polym15061568."
    },
    rep: {
      "rho": "Melt density was not published. The number shown is the solid density from the same sheet.",
      "visc": "No Cross-WLF, Cross, power-law or capillary table with a stated shear rate was published in a form that could be copied. Viscosity curves in Solvay processing guides were not digitized."
    }
  },
  "enspps40": {
    name: "PPS 40% glass (Ensinger TECATRON GF40)",
    grade: "PPS 40% glass (Ensinger TECATRON GF40)",
    aka: [
      "PPS GF40",
      "TECATRON GF40",
      "polyphenylene sulfide",
    ],
    kind: 'thermoplastic',
    noData: nodata("PPS 40% glass (Ensinger TECATRON GF40)"),
    rho: 1630,
    cp: 1000,
    k: 0.35,
    htc: 5000,
    src: {
      "solid": "PPS 40% glass (Ensinger TECATRON GF40). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/tecatron-gf40-natural. Chemical designation on the page: PPS (Polyphenylensulfide). Density 1.63 g/cm3. Tensile modulus 6500 MPa. Yield 83 MPa; tensile strength 83 MPa. Elongation at break 3 %. Conductivity 0.35 W/(k*m). Specific heat 1.0 J/(g*K). CLTE rows (10^-5 1/K) 4, 5, 10. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
      "htc": "Commercial solver default heat transfer coefficient 5000 W/m²K, as stated in doi:10.3390/polym13183196 and doi:10.3390/polym15061568."
    },
    rep: {
      "rho": "Melt density was not published. The number shown is the solid density from the same sheet.",
      "visc": "No Cross-WLF, Cross, power-law or capillary table with a stated shear rate was published in a form that could be copied. Viscosity curves in Solvay processing guides were not digitized."
    }
  },
  "enspps": {
    name: "PPS (Ensinger TECATRON SX)",
    grade: "PPS (Ensinger TECATRON SX)",
    aka: [
      "PPS",
      "polyphenylene sulfide",
      "TECATRON SX",
    ],
    kind: 'thermoplastic',
    noData: nodata("PPS (Ensinger TECATRON SX)"),
    rho: 1360,
    cp: 1000,
    k: 0.25,
    htc: 5000,
    src: {
      "solid": "PPS (Ensinger TECATRON SX). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/pps-tecatron-sx-natural. Chemical designation on the page: PPS (Polyphenylensulfide). Density 1.36 g/cm3. Tensile modulus 4000 MPa. Yield 100 MPa; tensile strength 102 MPa. Elongation at break 11 %. Conductivity 0.25 W/(k*m). Specific heat 1.0 J/(g*K). CLTE rows (10^-5 1/K) 6, 7, 12. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
      "htc": "Commercial solver default heat transfer coefficient 5000 W/m²K, as stated in doi:10.3390/polym13183196 and doi:10.3390/polym15061568."
    },
    rep: {
      "rho": "Melt density was not published. The number shown is the solid density from the same sheet.",
      "visc": "No Cross-WLF, Cross, power-law or capillary table with a stated shear rate was published in a form that could be copied. Viscosity curves in Solvay processing guides were not digitized."
    }
  },
  "ensppsc": {
    name: "PPS (Ensinger TECATRON CMP)",
    grade: "PPS (Ensinger TECATRON CMP)",
    aka: [
      "PPS",
      "TECATRON CMP",
      "polyphenylene sulfide",
    ],
    kind: 'thermoplastic',
    noData: nodata("PPS (Ensinger TECATRON CMP)"),
    rho: 1360,
    cp: 1000,
    k: 0.25,
    htc: 5000,
    src: {
      "solid": "PPS (Ensinger TECATRON CMP). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/tecatron-cmp-natural. Chemical designation on the page: PPS (Polyphenylensulfide). Density 1.36 g/cm3. Tensile modulus 4100 MPa. Yield 100 MPa; tensile strength 102 MPa. Elongation at break 4 %. Conductivity 0.25 W/(k*m). Specific heat 1.0 J/(g*K). CLTE rows (10^-5 1/K) 6, 7, 12. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
      "htc": "Commercial solver default heat transfer coefficient 5000 W/m²K, as stated in doi:10.3390/polym13183196 and doi:10.3390/polym15061568."
    },
    rep: {
      "rho": "Melt density was not published. The number shown is the solid density from the same sheet.",
      "visc": "No Cross-WLF, Cross, power-law or capillary table with a stated shear rate was published in a form that could be copied. Viscosity curves in Solvay processing guides were not digitized."
    }
  },
  "enspi": {
    name: "PI (Ensinger TECASINT 1011)",
    grade: "PI (Ensinger TECASINT 1011)",
    aka: [
      "PI",
      "polyimide",
      "TECASINT",
      "TECASINT 1011",
    ],
    kind: 'thermoplastic',
    noData: nodata("PI (Ensinger TECASINT 1011)"),
    rho: 1340,
    cp: 1040,
    k: 0.22,
    htc: 5000,
    src: {
      "solid": "PI (Ensinger TECASINT 1011). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/polyimide-tecasint-1011-natural. Chemical designation on the page: PI (Polyimide). Density 1.34 g/cm3. Tensile modulus 3600 MPa. Yield not listed; tensile strength 116 MPa. Only tensile strength is listed, so yield and ultimate are both that value. Elongation at break 3.8 %. Conductivity 0.22 W/(k*m). Specific heat 1.04 J/(g*K). CLTE rows (10^-5 1/K) 4.3, 5.3. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
      "htc": "Commercial solver default heat transfer coefficient 5000 W/m²K, as stated in doi:10.3390/polym13183196 and doi:10.3390/polym15061568."
    },
    rep: {
      "rho": "Melt density was not published. The number shown is the solid density from the same sheet.",
      "visc": "No Cross-WLF, Cross, power-law or capillary table with a stated shear rate was published in a form that could be copied. Viscosity curves in Solvay processing guides were not digitized."
    }
  },
  "enspomh": {
    name: "POM homopolymer (Ensinger TECAFORM AD)",
    grade: "POM homopolymer (Ensinger TECAFORM AD)",
    aka: [
      "POM",
      "POM-H",
      "acetal",
      "Delrin",
      "TECAFORM AD",
    ],
    kind: 'thermoplastic',
    noData: nodata("POM homopolymer (Ensinger TECAFORM AD)"),
    rho: 1430,
    cp: 1300,
    k: 0.43,
    htc: 5000,
    src: {
      "solid": "POM homopolymer (Ensinger TECAFORM AD). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/acetal-tecaform-ad-natural-. Chemical designation on the page: POM-H (Polyacetal (Homopolymer)). Density 1.43 g/cm3. Tensile modulus 3400 MPa. Yield 79 MPa; tensile strength 79 MPa. Elongation at break 45 %. Conductivity 0.43 W/(k*m). Specific heat 1.3 J/(g*K). CLTE rows (10^-5 1/K) 12, 13. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
      "htc": "Commercial solver default heat transfer coefficient 5000 W/m²K, as stated in doi:10.3390/polym13183196 and doi:10.3390/polym15061568."
    },
    rep: {
      "rho": "Melt density was not published. The number shown is the solid density from the same sheet.",
      "visc": "No Cross-WLF, Cross, power-law or capillary table with a stated shear rate was published in a form that could be copied. Viscosity curves in Solvay processing guides were not digitized."
    }
  },
  "enspomc": {
    name: "POM copolymer (Ensinger TECAFORM AH)",
    grade: "POM copolymer (Ensinger TECAFORM AH)",
    aka: [
      "POM-C",
      "acetal copolymer",
      "Celcon",
      "TECAFORM AH",
    ],
    kind: 'thermoplastic',
    noData: nodata("POM copolymer (Ensinger TECAFORM AH)"),
    rho: 1410,
    cp: 1400,
    k: 0.39,
    htc: 5000,
    src: {
      "solid": "POM copolymer (Ensinger TECAFORM AH). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/acetal-tecaform-ah-natural. Chemical designation on the page: POM-C (Polyacetal (Copolymer)). Density 1.41 g/cm3. Tensile modulus 2800 MPa. Yield 67 MPa; tensile strength 67 MPa. Elongation at break 32 %. Conductivity 0.39 W/(k*m). Specific heat 1.4 J/(g*K). CLTE rows (10^-5 1/K) 13, 14. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
      "htc": "Commercial solver default heat transfer coefficient 5000 W/m²K, as stated in doi:10.3390/polym13183196 and doi:10.3390/polym15061568."
    },
    rep: {
      "rho": "Melt density was not published. The number shown is the solid density from the same sheet.",
      "visc": "No Cross-WLF, Cross, power-law or capillary table with a stated shear rate was published in a form that could be copied. Viscosity curves in Solvay processing guides were not digitized."
    }
  },
  "enspomgf": {
    name: "POM copolymer 25% glass (Ensinger TECAFORM AH GF25)",
    grade: "POM copolymer 25% glass (Ensinger TECAFORM AH GF25)",
    aka: [
      "POM GF25",
      "TECAFORM AH GF25",
    ],
    kind: 'thermoplastic',
    noData: nodata("POM copolymer 25% glass (Ensinger TECAFORM AH GF25)"),
    rho: 1590,
    cp: 1200,
    k: 0.47,
    htc: 5000,
    src: {
      "solid": "POM copolymer 25% glass (Ensinger TECAFORM AH GF25). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/glass-filled-acetal-tecaform-ah-gf25-natural. Chemical designation on the page: POM-C (Polyacetal (Copolymer)). Density 1.59 g/cm3. Tensile modulus 4200 MPa. Yield 51 MPa; tensile strength 51 MPa. Elongation at break 12 %. Conductivity 0.47 W/(k*m). Specific heat 1.2 J/(g*K). CLTE rows (10^-5 1/K) 8, 8. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
      "htc": "Commercial solver default heat transfer coefficient 5000 W/m²K, as stated in doi:10.3390/polym13183196 and doi:10.3390/polym15061568."
    },
    rep: {
      "rho": "Melt density was not published. The number shown is the solid density from the same sheet.",
      "visc": "No Cross-WLF, Cross, power-law or capillary table with a stated shear rate was published in a form that could be copied. Viscosity curves in Solvay processing guides were not digitized."
    }
  },
  "enspa6": {
    name: "PA6 (Ensinger TECAMID 6)",
    grade: "PA6 (Ensinger TECAMID 6)",
    aka: [
      "PA6",
      "PA 6",
      "nylon 6",
      "TECAMID 6",
    ],
    kind: 'thermoplastic',
    noData: nodata("PA6 (Ensinger TECAMID 6)"),
    rho: 1140,
    cp: 1600,
    k: 0.37,
    htc: 5000,
    src: {
      "solid": "PA6 (Ensinger TECAMID 6). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/pa6-tecamid-6-natural. Chemical designation on the page: PA 6 (Polyamide 6). Density 1.14 g/cm3. Tensile modulus 3300 MPa. Yield 78 MPa; tensile strength 79 MPa. Elongation at break 130 %. Conductivity 0.37 W/(k*m). Specific heat 1.6 J/(g*K). CLTE rows (10^-5 1/K) 12, 13. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
      "htc": "Commercial solver default heat transfer coefficient 5000 W/m²K, as stated in doi:10.3390/polym13183196 and doi:10.3390/polym15061568."
    },
    rep: {
      "rho": "Melt density was not published. The number shown is the solid density from the same sheet.",
      "visc": "No Cross-WLF, Cross, power-law or capillary table with a stated shear rate was published in a form that could be copied. Viscosity curves in Solvay processing guides were not digitized."
    }
  },
  "enspa6gf": {
    name: "PA6 30% glass (Ensinger TECAMID 6 GF30)",
    grade: "PA6 30% glass (Ensinger TECAMID 6 GF30)",
    aka: [
      "PA6 GF30",
      "nylon 6 GF30",
      "TECAMID 6 GF30",
    ],
    kind: 'thermoplastic',
    noData: nodata("PA6 30% glass (Ensinger TECAMID 6 GF30)"),
    rho: 1360,
    cp: 1300,
    k: 0.41,
    htc: 5000,
    src: {
      "solid": "PA6 30% glass (Ensinger TECAMID 6 GF30). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/pa6-tecamid-6-gf30-black. Chemical designation on the page: PA 6 (Polyamide 6). Density 1.36 g/cm3. Tensile modulus 5700 MPa. Yield 98 MPa; tensile strength 98 MPa. Elongation at break 5 %. Conductivity 0.41 W/(k*m). Specific heat 1.3 J/(g*K). CLTE rows (10^-5 1/K) 6, 6. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
      "htc": "Commercial solver default heat transfer coefficient 5000 W/m²K, as stated in doi:10.3390/polym13183196 and doi:10.3390/polym15061568."
    },
    rep: {
      "rho": "Melt density was not published. The number shown is the solid density from the same sheet.",
      "visc": "No Cross-WLF, Cross, power-law or capillary table with a stated shear rate was published in a form that could be copied. Viscosity curves in Solvay processing guides were not digitized."
    }
  },
  "enspa12": {
    name: "PA12 (Ensinger TECAMID 12)",
    grade: "PA12 (Ensinger TECAMID 12)",
    aka: [
      "PA12",
      "PA 12",
      "nylon 12",
      "TECAMID 12",
    ],
    kind: 'thermoplastic',
    noData: nodata("PA12 (Ensinger TECAMID 12)"),
    rho: 1020,
    cp: 1800,
    k: 0.3,
    htc: 5000,
    src: {
      "solid": "PA12 (Ensinger TECAMID 12). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/pa12-tecamid-12-natural. Chemical designation on the page: PA 12 (Polyamide 12). Density 1.02 g/cm3. Tensile modulus 1800 MPa. Yield 53 MPa; tensile strength 53 MPa. Elongation at break 200 %. Conductivity 0.30 W/(k*m). Specific heat 1.8 J/(g*K). CLTE rows (10^-5 1/K) 15, 16. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
      "htc": "Commercial solver default heat transfer coefficient 5000 W/m²K, as stated in doi:10.3390/polym13183196 and doi:10.3390/polym15061568."
    },
    rep: {
      "rho": "Melt density was not published. The number shown is the solid density from the same sheet.",
      "visc": "No Cross-WLF, Cross, power-law or capillary table with a stated shear rate was published in a form that could be copied. Viscosity curves in Solvay processing guides were not digitized."
    }
  },
  "enspa66": {
    name: "PA66 (Ensinger TECAMID 66)",
    grade: "PA66 (Ensinger TECAMID 66)",
    aka: [
      "PA66",
      "PA 66",
      "nylon 66",
      "nylon 6/6",
      "TECAMID 66",
    ],
    kind: 'thermoplastic',
    noData: nodata("PA66 (Ensinger TECAMID 66)"),
    rho: 1150,
    cp: 1500,
    k: 0.36,
    htc: 5000,
    src: {
      "solid": "PA66 (Ensinger TECAMID 66). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/pa66-tecamid-66-natural. Chemical designation on the page: PA 66 (Polyamide 66). Density 1.15 g/cm3. Tensile modulus 3500 MPa. Yield 84 MPa; tensile strength 85 MPa. Elongation at break 70 %. Conductivity 0.36 W/(k*m). Specific heat 1.5 J/(g*K). CLTE rows (10^-5 1/K) 11, 12. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
      "htc": "Commercial solver default heat transfer coefficient 5000 W/m²K, as stated in doi:10.3390/polym13183196 and doi:10.3390/polym15061568."
    },
    rep: {
      "rho": "Melt density was not published. The number shown is the solid density from the same sheet.",
      "visc": "No Cross-WLF, Cross, power-law or capillary table with a stated shear rate was published in a form that could be copied. Viscosity curves in Solvay processing guides were not digitized."
    }
  },
  "enspa66gf": {
    name: "PA66 30% glass (Ensinger TECAMID 66 GF30)",
    grade: "PA66 30% glass (Ensinger TECAMID 66 GF30)",
    aka: [
      "PA66 GF30",
      "nylon 66 GF30",
      "TECAMID 66 GF30",
    ],
    kind: 'thermoplastic',
    noData: nodata("PA66 30% glass (Ensinger TECAMID 66 GF30)"),
    rho: 1340,
    cp: 1200,
    k: 0.39,
    htc: 5000,
    src: {
      "solid": "PA66 30% glass (Ensinger TECAMID 66 GF30). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/pa66-tecamid-66-gf30-black. Chemical designation on the page: PA 66 (Polyamide 66). Density 1.34 g/cm3. Tensile modulus 5500 MPa. Yield 91 MPa; tensile strength 91 MPa. Elongation at break 14 %. Conductivity 0.39 W/(k*m). Specific heat 1.2 J/(g*K). CLTE rows (10^-5 1/K) 5, 5. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
      "htc": "Commercial solver default heat transfer coefficient 5000 W/m²K, as stated in doi:10.3390/polym13183196 and doi:10.3390/polym15061568."
    },
    rep: {
      "rho": "Melt density was not published. The number shown is the solid density from the same sheet.",
      "visc": "No Cross-WLF, Cross, power-law or capillary table with a stated shear rate was published in a form that could be copied. Viscosity curves in Solvay processing guides were not digitized."
    }
  },
  "enspa66cf": {
    name: "PA66 20% carbon (Ensinger TECAMID 66 CF20)",
    grade: "PA66 20% carbon (Ensinger TECAMID 66 CF20)",
    aka: [
      "PA66 CF20",
      "nylon 66 CF20",
      "TECAMID 66 CF20",
    ],
    kind: 'thermoplastic',
    noData: nodata("PA66 20% carbon (Ensinger TECAMID 66 CF20)"),
    rho: 1230,
    cp: 1400,
    k: 0.72,
    htc: 5000,
    src: {
      "solid": "PA66 20% carbon (Ensinger TECAMID 66 CF20). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/pa66-tecamid-66-cf20-black. Chemical designation on the page: PA 66 (Polyamide 66). Density 1.23 g/cm3. Tensile modulus 5100 MPa. Yield 104 MPa; tensile strength 104 MPa. Elongation at break 13 %. Conductivity 0.72 W/(k*m). Specific heat 1.4 J/(g*K). CLTE rows (10^-5 1/K) 9, 10. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
      "htc": "Commercial solver default heat transfer coefficient 5000 W/m²K, as stated in doi:10.3390/polym13183196 and doi:10.3390/polym15061568."
    },
    rep: {
      "rho": "Melt density was not published. The number shown is the solid density from the same sheet.",
      "visc": "No Cross-WLF, Cross, power-law or capillary table with a stated shear rate was published in a form that could be copied. Viscosity curves in Solvay processing guides were not digitized."
    }
  },
  "enspet": {
    name: "PET (Ensinger TECADUR PET)",
    grade: "PET (Ensinger TECADUR PET)",
    aka: [
      "PET",
      "polyethylene terephthalate",
      "TECADUR PET",
    ],
    kind: 'thermoplastic',
    noData: nodata("PET (Ensinger TECADUR PET)"),
    rho: 1390,
    cp: null,
    k: null,
    htc: 5000,
    src: {
      "solid": "PET (Ensinger TECADUR PET). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/polyester-tecadur-pet-natural. Chemical designation on the page: PET (Polyethylene terephthalate). Density 1.39 g/cm3. Tensile modulus 3300 MPa. Yield 91 MPa; tensile strength 91 MPa. Elongation at break 14 %. Conductivity not listed. Specific heat not listed. CLTE rows (10^-5 1/K) 8, 10. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
      "htc": "Commercial solver default heat transfer coefficient 5000 W/m²K, as stated in doi:10.3390/polym13183196 and doi:10.3390/polym15061568."
    },
    rep: {
      "rho": "Melt density was not published. The number shown is the solid density from the same sheet.",
      "cp": "Specific heat was not published as a single value for this grade.",
      "visc": "No Cross-WLF, Cross, power-law or capillary table with a stated shear rate was published in a form that could be copied. Viscosity curves in Solvay processing guides were not digitized."
    }
  },
  "enspbt30": {
    name: "PBT 30% glass (Ensinger TECADUR PBT GF30)",
    grade: "PBT 30% glass (Ensinger TECADUR PBT GF30)",
    aka: [
      "PBT GF30",
      "TECADUR PBT GF30",
    ],
    kind: 'thermoplastic',
    noData: nodata("PBT 30% glass (Ensinger TECADUR PBT GF30)"),
    rho: 1460,
    cp: 1200,
    k: 0.33,
    htc: 5000,
    src: {
      "solid": "PBT 30% glass (Ensinger TECADUR PBT GF30). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/tecadur-pbt-gf30-natural. Chemical designation on the page: PBT (Polybutylene terephthalate). Density 1.46 g/cm3. Tensile modulus 3400 MPa. Yield 46 MPa; tensile strength 46 MPa. Elongation at break 6 %. Conductivity 0.33 W/(k*m). Specific heat 1.2 J/(g*K). CLTE rows (10^-5 1/K) 8, 10. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
      "htc": "Commercial solver default heat transfer coefficient 5000 W/m²K, as stated in doi:10.3390/polym13183196 and doi:10.3390/polym15061568."
    },
    rep: {
      "rho": "Melt density was not published. The number shown is the solid density from the same sheet.",
      "visc": "No Cross-WLF, Cross, power-law or capillary table with a stated shear rate was published in a form that could be copied. Viscosity curves in Solvay processing guides were not digitized."
    }
  },
  "enspc": {
    name: "PC (Ensinger TECANAT)",
    grade: "PC (Ensinger TECANAT)",
    aka: [
      "PC",
      "polycarbonate",
      "TECANAT",
    ],
    kind: 'thermoplastic',
    noData: nodata("PC (Ensinger TECANAT)"),
    rho: 1190,
    cp: 1300,
    k: 0.25,
    htc: 5000,
    src: {
      "solid": "PC (Ensinger TECANAT). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/polycarbonate-tecanat-natural. Chemical designation on the page: PC (Polycarbonate). Density 1.19 g/cm3. Tensile modulus 2200 MPa. Yield 69 MPa; tensile strength 69 MPa. Elongation at break 90 %. Conductivity 0.25 W/(k*m). Specific heat 1.3 J/(g*K). CLTE rows (10^-5 1/K) 8, 8. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
      "htc": "Commercial solver default heat transfer coefficient 5000 W/m²K, as stated in doi:10.3390/polym13183196 and doi:10.3390/polym15061568."
    },
    rep: {
      "rho": "Melt density was not published. The number shown is the solid density from the same sheet.",
      "visc": "No Cross-WLF, Cross, power-law or capillary table with a stated shear rate was published in a form that could be copied. Viscosity curves in Solvay processing guides were not digitized."
    }
  },
  "enspc30": {
    name: "PC 30% glass (Ensinger TECANAT GF30)",
    grade: "PC 30% glass (Ensinger TECANAT GF30)",
    aka: [
      "PC GF30",
      "TECANAT GF30",
    ],
    kind: 'thermoplastic',
    noData: nodata("PC 30% glass (Ensinger TECANAT GF30)"),
    rho: 1420,
    cp: 1100,
    k: 0.32,
    htc: 5000,
    src: {
      "solid": "PC 30% glass (Ensinger TECANAT GF30). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/glass-filled-tecanat-gf30-natural. Chemical designation on the page: PC (Polycarbonate). Density 1.42 g/cm3. Tensile modulus 4400 MPa. Yield 87 MPa; tensile strength 85 MPa. The sheet also lists tensile strength 85 MPa, below the yield value, so ultimate is set to the yield and that lower figure is not used as su. Elongation at break 6 %. Conductivity 0.32 W/(k*m). Specific heat 1.1 J/(g*K). CLTE rows (10^-5 1/K) 5, 5. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
      "htc": "Commercial solver default heat transfer coefficient 5000 W/m²K, as stated in doi:10.3390/polym13183196 and doi:10.3390/polym15061568."
    },
    rep: {
      "rho": "Melt density was not published. The number shown is the solid density from the same sheet.",
      "visc": "No Cross-WLF, Cross, power-law or capillary table with a stated shear rate was published in a form that could be copied. Viscosity curves in Solvay processing guides were not digitized."
    }
  },
  "ensabs": {
    name: "ABS (Ensinger TECARAN)",
    grade: "ABS (Ensinger TECARAN)",
    aka: [
      "ABS",
      "acrylonitrile butadiene styrene",
      "TECARAN",
    ],
    kind: 'thermoplastic',
    noData: nodata("ABS (Ensinger TECARAN)"),
    rho: 1040,
    cp: null,
    k: null,
    htc: 5000,
    src: {
      "solid": "ABS (Ensinger TECARAN). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/tecaran-abs-grey. Chemical designation on the page: ABS (Acrylnitrile-butadiene-styrene copolymer). Density 1.04 g/cm3. Tensile modulus 1700 MPa. Yield 32 MPa; tensile strength 32 MPa. Elongation at break 49 %. Conductivity not listed. Specific heat not listed. CLTE rows (10^-5 1/K) not listed. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
      "htc": "Commercial solver default heat transfer coefficient 5000 W/m²K, as stated in doi:10.3390/polym13183196 and doi:10.3390/polym15061568."
    },
    rep: {
      "rho": "Melt density was not published. The number shown is the solid density from the same sheet.",
      "cp": "Specific heat was not published as a single value for this grade.",
      "visc": "No Cross-WLF, Cross, power-law or capillary table with a stated shear rate was published in a form that could be copied. Viscosity curves in Solvay processing guides were not digitized."
    }
  },
  "enspvdf": {
    name: "PVDF (Ensinger TECAFLON PVDF)",
    grade: "PVDF (Ensinger TECAFLON PVDF)",
    aka: [
      "PVDF",
      "polyvinylidene fluoride",
      "Kynar",
      "TECAFLON PVDF",
    ],
    kind: 'thermoplastic',
    noData: nodata("PVDF (Ensinger TECAFLON PVDF)"),
    rho: 1780,
    cp: 1300,
    k: 0.25,
    htc: 5000,
    src: {
      "solid": "PVDF (Ensinger TECAFLON PVDF). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/tecaflon-pvdf-natural. Chemical designation on the page: PVDF (Polyvinylidene fluoride). Density 1.78 g/cm3. Tensile modulus 2200 MPa. Yield 62 MPa; tensile strength 62 MPa. Elongation at break 17 %. Conductivity 0.25 W/(k*m). Specific heat 1.3 J/(g*K). CLTE rows (10^-5 1/K) 16, 18. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
      "htc": "Commercial solver default heat transfer coefficient 5000 W/m²K, as stated in doi:10.3390/polym13183196 and doi:10.3390/polym15061568."
    },
    rep: {
      "rho": "Melt density was not published. The number shown is the solid density from the same sheet.",
      "visc": "No Cross-WLF, Cross, power-law or capillary table with a stated shear rate was published in a form that could be copied. Viscosity curves in Solvay processing guides were not digitized."
    }
  },
  "enspp": {
    name: "PP (Ensinger TECAPRO MT)",
    grade: "PP (Ensinger TECAPRO MT)",
    aka: [
      "PP",
      "polypropylene",
      "TECAPRO MT",
    ],
    kind: 'thermoplastic',
    noData: nodata("PP (Ensinger TECAPRO MT)"),
    rho: 930,
    cp: null,
    k: null,
    htc: 5000,
    src: {
      "solid": "PP (Ensinger TECAPRO MT). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/pp-medical-tecapro-mt-white. Chemical designation on the page: PP (Polypropylene). Density 0.93 g/cm3. Tensile modulus 2000 MPa. Yield 34 MPa; tensile strength 34 MPa. Elongation at break 67 %. Conductivity not listed. Specific heat not listed. CLTE rows (10^-5 1/K) 13, 14. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
      "htc": "Commercial solver default heat transfer coefficient 5000 W/m²K, as stated in doi:10.3390/polym13183196 and doi:10.3390/polym15061568."
    },
    rep: {
      "rho": "Melt density was not published. The number shown is the solid density from the same sheet.",
      "cp": "Specific heat was not published as a single value for this grade.",
      "visc": "No Cross-WLF, Cross, power-law or capillary table with a stated shear rate was published in a form that could be copied. Viscosity curves in Solvay processing guides were not digitized."
    }
  },
  "enspetw": {
    name: "PET (Ensinger TECAPET white)",
    grade: "PET (Ensinger TECAPET white)",
    aka: [
      "PET",
      "TECAPET",
      "polyethylene terephthalate",
    ],
    kind: 'thermoplastic',
    noData: nodata("PET (Ensinger TECAPET white)"),
    rho: 1360,
    cp: 1200,
    k: 0.31,
    htc: 5000,
    src: {
      "solid": "PET (Ensinger TECAPET white). Ensinger stock-shape technical table, accessed 2026-11-11. Tensile modulus is the Modulus of elasticity (tensile test) row, DIN EN ISO 527-2, 1 mm/min. Tensile strength at yield, when listed, is DIN EN ISO 527-2 at 50 mm/min. The sheet does not print 23°C on these rows. CLTE is the 23–100°C longitudinal row: Ensinger lists 23–60°C, then 23–100°C, then 100–150°C when a third row exists (confirmed on TECAPEEK natural and TECASON P MT; the same order is used for the other Ensinger sheets here). Units: modulus and strength MPa, density g/cm³ converted to kg/m³, specific heat J/(g·K) converted to J/(kg·K), CLTE 10^-5 1/K converted to 10^-6 1/K, conductivity W/(K·m). cost is this library's relative index, on the same scale as the existing plastics, not a datasheet price. Poisson's ratio is not on the Ensinger sheet and is left empty. Source: https://www.ensingerplastics.com/en/shapes/tecapet-white. Chemical designation on the page: PET (Polyethylene terephthalate). Density 1.36 g/cm3. Tensile modulus 3100 MPa. Yield 79 MPa; tensile strength 79 MPa. Elongation at break 10 %. Conductivity 0.31 W/(k*m). Specific heat 1.2 J/(g*K). CLTE rows (10^-5 1/K) 8, 10. Single-point values except where the sheet prints a range. Cross-WLF viscosity and Tait PVT were not published on this stock-shape page.",
      "htc": "Commercial solver default heat transfer coefficient 5000 W/m²K, as stated in doi:10.3390/polym13183196 and doi:10.3390/polym15061568."
    },
    rep: {
      "rho": "Melt density was not published. The number shown is the solid density from the same sheet.",
      "visc": "No Cross-WLF, Cross, power-law or capillary table with a stated shear rate was published in a form that could be copied. Viscosity curves in Solvay processing guides were not digitized."
    }
  },
};
