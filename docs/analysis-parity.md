# Amni-CAD analysis parity

Mechanical and thermal studies compared with COMSOL Multiphysics and ANSYS Mechanical. Status is have, partial, or missing. Error is against the analytical check run in `cad/tests/fea_bench.mjs` and `cad/tests/fea_suite_test.mjs`.

The linear solves, natural modes and heat systems run in the existing Helium modules `fea_grid` and `fea_mesh`. This environment has no Helium compiler, so the new study control and post-processing extend the existing JavaScript driver.

| Capability | COMSOL / ANSYS | Amni-CAD | Check |
|---|---|---|---|
| Linear static, hex and voxel | have | have | Cantilever tip deflection −1.23%. Support reaction 0.00% |
| von Mises, principal, Tresca | have | have | Outer-fiber path stress −8.09% vs My/I. End-face peak vs F/A +42.16% |
| Nodal displacement, probes, path plots, reactions | have | have | Probe and path on the cantilever. Reaction balances the load |
| Averaged and unaveraged nodal stress | have | partial | Averaged nodal values are what the contour and the path use |
| Prescribed displacement, spring, roller, compression stop | have | have | Existing static boundary conditions |
| Body-to-body contact | have | partial | Existing nonlinear contact study |
| Modal analysis | have | have | First cantilever bending frequency −1.89% |
| Harmonic response | have | have | Amplitude at 1 Hz vs static tip +1.20% |
| Transient structural | have | have | Undamped step-load dynamic factor −1.28% vs 2 |
| Linear buckling | have | partial | Euler cantilever load −21.67% |
| Steady conduction, convection, heat flux | have | have | 1D conduction heat flow −1.48% |
| Surface radiation | have | have | Radiating rod tip 0.00% |
| Transient conduction | have | have | Lumped cube, one time constant −2.57% |
| Thermal stress | have | have | Constrained bar midspan +4.17%. Free expansion +2.68% |
| Load-case superposition | have | have | Two axial cases summed. Peak vs nominal section stress +41.00% |
| S-N fatigue, Goodman, Gerber, Soderberg, Miner, rainflow | have | have | Life and safety factor 0.00% vs the hand calculation on the computed stress |
| Strain-life | have | have | Coffin-Manson inversion in the unit test |
| Fatigue life contour and safety factor | have | have | Contour uses the local alternating stress |
| Material k, cp, CTE, S-N | have | have | Library entries on the common metals. k, cp and CTE were already on the materials |
| Plate with a hole, Kt | have | partial | Net-section peak +10.57% vs Heywood |
| Geometric nonlinearity, plasticity, full contact pairs | have | missing | |
| Acoustics, electromagnetics, fluids coupled to stress | have | missing | |
| Submodeling, topology optimization, explicit dynamics | have | missing | |
