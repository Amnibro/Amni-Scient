# Amni-CAD analysis parity

Mechanical and thermal studies in Amni-CAD, checked against closed-form results in `cad/tests/fea_bench.mjs` and `cad/tests/fea_suite_test.mjs`. The linear solve, modes and heat system are the Helium modules `fea_grid` and `fea_mesh`. Stress criteria, S-N life, the mean-stress factors, the Miles equation and the harmonic gain are compiled from `cad/he/fea_suite.amni` with the Helium compiler and called from the study driver.

| Capability | Check |
|---|---|
| Linear static | Cantilever tip deflection −1.23%. Support reaction 0.00% |
| Outer-fiber stress | Path stress near the root +0.37% vs My/I, extrapolated one element to the surface |
| Section stress and bolt pretension | Midspan stress −0.95% vs F/A |
| Nodal results | Displacement, von Mises, equivalent strain and safety factor export with the data report. Probes, path plots and support reactions are on the study |
| Averaged and unaveraged stress | The contour is the nodal average. The result panel reports the unaveraged element peak beside it |
| Modal | First cantilever frequency −1.89% |
| Harmonic | Amplitude at 1 Hz vs the static tip +1.20% |
| Random vibration | Miles RMS from the computed first frequency +2.90% |
| Transient structural | Undamped step-load dynamic factor −1.28% vs 2 |
| Buckling | Euler cantilever load +2.75% at 16,270 elements. Mesh sweep: 8,986 elements +2.58%, 16,270 elements +2.75%, 31,948 elements +4.36% |
| Plate with a hole | Kt at the hole surface +2.60% vs Heywood |
| Steady conduction | 1D heat flow −1.48% |
| Heat generation | Midspan temperature +3.54% vs qL²/8k |
| Convection, transient | Lumped cube, one time constant −2.57% |
| Radiation | Radiating rod tip 0.00% |
| Thermal stress | Constrained bar, sampled clear of the grips, +1.54%. Free expansion +1.01% |
| Load cases | Combined section stress −0.95% vs F/A. Sum of the two cases matches one solve of the total load, 0.00% |
| Frictionless contact | Compression stop holds the tip at the gap, +1.22% |
| S-N, Goodman, Gerber, Soderberg, ASME-elliptic | Life and each safety factor 0.00% vs the hand calculation |
| Rainflow and Miner | Inner cycle range 0.00%. Two fully reversed cycles, Miner damage 0.00% |
| Strain life | Coffin-Manson, Morrow and SWT each invert to the generating life |
| Materials | Conductivity, specific heat, expansion and S-N data on the common metals |
