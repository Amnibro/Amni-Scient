# Headless studies

Every study on the panel is one JSON job. Run it with `node cad/form_build.mjs job.json` or `POST /v1/stress`. The same fields are the `run_stress` tool on the local MCP bridge. Progress lines go to stderr. `"async":true` returns a job id; `POST /v1/stress/status` with `{"id":"..."}` reads it.

Lengths in the document are the document unit. Simulation inputs are SI: newtons, megapascals, seconds, degrees Celsius, watts. `res` is the target element count, or `quick` (12000), `standard` (30000), `fine` (80000).

## run_stress

| Field | Meaning |
|---|---|
| type | static, modal, harmonic, psd, transient, thermal, tstress, buckle, fatigue, combine |
| supports | `[{faces:{side:"-X"},type:"fixed"}]`. type is fixed, roller, disp, spring, or stop |
| loads | `[{faces:{side:"+X"},F:[0,0,-100]}]` |
| steps, dt | Time step count and size in seconds |
| method | newmark or hht |
| alpha | HHT parameter. 0 is Newmark. A negative value adds numerical damping |
| zeta | Damping ratio |
| curve | Load-time points `[{t,v}]`. Omitted means a step of 1 |
| adaptive | Shrink the step when a half-step disagrees |
| u0, v0 | Initial modal displacement and velocity |
| transient | Transient heat, coupled thermal-stress, or rainflow of a transient stress history |
| T0, Tuniform, Tref | Initial, uniform, and stress-free temperature |
| Qvol | Heat generation in watts |
| psd | Flat acceleration spectrum, (mm/s²)²/Hz |
| corr | goodman, gerber, soderberg, asme, morrow, none |
| hist | Load history as fractions of the static stress |
| probes | `[[x,y,z], ...]` in millimetres |
| path | `{a:[x,y,z],b:[x,y,z],n}` |
| cases | Combined cases `[{name,scale,loads}]` |
| keep | Maximum saved time samples |
| snaps | Temperature fields kept for coupled thermal-stress |

`query` on the job reads `{time}` (an index or `"peak"`), `{node}`, or `{element}`. `export` is `json`, `csv`, or `vtk`.

## query_results

`{time, node}` on the bridge reads the last study: one time row, one surface node, the probes and the path.

## export_results

`{format:"json"|"csv"|"vtk"}` writes the time history, or the surface table when the study is static.

## Examples

Static cantilever, reaction and a tip probe:

```json
{"doc":{"units":"mm","material":"steel1018","features":[{"id":"a","type":"box","w":100,"d":10,"h":10,"x":50}]},"sim":{"type":"static","res":16000,"supports":[{"faces":{"side":"-X"},"type":"fixed"}],"loads":[{"faces":{"side":"+X"},"F":[0,0,-100]}],"probes":[[100,0,10]]}}
```

Modal:

```json
{"doc":{"units":"mm","material":"steel1018","features":[{"id":"a","type":"box","w":100,"d":10,"h":10,"x":50}]},"sim":{"type":"modal","modes":3,"res":12000,"supports":[{"faces":{"side":"-X"},"type":"fixed"}]}}
```

Harmonic:

```json
{"sim":{"type":"harmonic","modes":3,"zeta":0.02,"f0":1,"f1":20,"at":1,"res":8000,"supports":[{"faces":{"side":"-X"},"type":"fixed"}],"loads":[{"faces":{"side":"+X"},"F":[0,0,-20]}]}}
```

Random vibration:

```json
{"sim":{"type":"psd","zeta":0.02,"psd":1,"res":12000,"supports":[{"faces":{"side":"-X"},"type":"fixed"}]}}
```

Transient structural, Newmark, with a load-time curve. `method` `hht` and `alpha` -0.1 add numerical damping. `adaptive` true checks each step against two half-steps.

```json
{"sim":{"type":"transient","method":"newmark","steps":40,"zeta":0,"curve":[{"t":0,"v":0},{"t":0.001,"v":1}],"res":8000,"supports":[{"faces":{"side":"-X"},"type":"fixed"}],"loads":[{"faces":{"side":"+X"},"F":[0,0,-20]}]}}
```

Heat, transient, with a temperature that changes in time:

```json
{"sim":{"type":"thermal","transient":true,"steps":8,"dt":2,"T0":20,"res":8000,"temps":[{"faces":{"side":"-X"},"curve":[{"t":0,"T":20},{"t":16,"T":100}]}]}}
```

Coupled transient thermal-stress:

```json
{"sim":{"type":"tstress","transient":true,"steps":7,"dt":1,"T0":120,"Tref":20,"snaps":7,"res":8000,"temps":[{"faces":{"side":"-X"},"T":120},{"faces":{"side":"+X"},"T":120}],"supports":[{"faces":{"side":"-X"},"type":"fixed"},{"faces":{"side":"+X"},"type":"fixed"}]}}
```

Buckling:

```json
{"sim":{"type":"buckle","res":14000,"supports":[{"faces":{"side":"-X"},"type":"fixed"}],"loads":[{"faces":{"side":"+X"},"F":[-1000,0,0]}]}}
```

Fatigue, including rainflow of a transient history when `transient` is true:

```json
{"sim":{"type":"fatigue","corr":"goodman","res":14000,"supports":[{"faces":{"side":"-X"},"type":"fixed"}],"loads":[{"faces":{"side":"+X"},"F":[25000,0,0]}]}}
```

Combined cases:

```json
{"sim":{"type":"combine","res":14000,"supports":[{"faces":{"side":"-X"},"type":"fixed"}],"probes":[[20,0,5]],"cases":[{"name":"A","scale":1,"loads":[{"faces":{"side":"+X"},"F":[4000,0,0]}]},{"name":"B","scale":1,"loads":[{"faces":{"side":"+X"},"F":[3000,0,0]}]}]}}
```

Pretension is a static axial load read at a midspan probe. Frictionless contact is a support of type `stop` with a `gap`.

Export and a long run:

```json
{"export":"csv","query":{"time":"peak"},"async":true,"sim":{"type":"transient","steps":70,"res":8000}}
```
