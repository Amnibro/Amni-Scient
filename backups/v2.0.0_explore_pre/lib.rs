use wasm_bindgen::prelude::*;
use js_sys::{Float32Array, Uint8Array};
use serde::{Serialize, Deserialize};
const GR: f64 = 5000.0;
const SOL_X: f64 = 2600.0;
const SOL_Y: f64 = 2.0;
const SOL_Z: f64 = 0.0;
const ARMS: usize = 4;
fn fract(x: f64) -> f64 { x - x.floor() }
fn lp(a: f64, b: f64, t: f64) -> f64 { a + (b - a) * t }
fn clampf(v: f64, mn: f64, mx: f64) -> f64 { v.max(mn).min(mx) }
fn hash(n: f64) -> f64 { fract((n * 127.1 + 311.7).sin() * 43758.5453) }
fn noise3(x: f64, y: f64, z: f64) -> f64 {
    let ix = x.floor();
    let iy = y.floor();
    let iz = z.floor();
    let fx = x - ix;
    let fy = y - iy;
    let fz = z - iz;
    let sx = fx * fx * (3.0 - 2.0 * fx);
    let sy = fy * fy * (3.0 - 2.0 * fy);
    let sz = fz * fz * (3.0 - 2.0 * fz);
    let n = ix + iy * 157.0 + iz * 113.0;
    lp(
        lp(lp(hash(n), hash(n + 1.0), sx), lp(hash(n + 157.0), hash(n + 158.0), sx), sy),
        lp(lp(hash(n + 113.0), hash(n + 114.0), sx), lp(hash(n + 270.0), hash(n + 271.0), sx), sy),
        sz,
    )
}
fn fbm(x: f64, y: f64, z: f64, oct: u32) -> f64 {
    let (mut v, mut a, mut f) = (0.0, 0.5, 1.0);
    for _ in 0..oct {
        v += a * noise3(x * f, y * f, z * f);
        a *= 0.5;
        f *= 2.0;
    }
    v
}
struct Rng(u64);
impl Rng {
    fn new(seed: u64) -> Self { Self(seed) }
    fn next(&mut self) -> f64 {
        self.0 = self.0.wrapping_mul(6364136223846793005).wrapping_add(1442695040888963407);
        ((self.0 >> 33) as f64) / (2147483648.0)
    }
}
fn star_col(t: f64) -> [f64; 3] {
    if t < 3500.0 { [1.0, 0.31, 0.16] }
    else if t < 5000.0 { [1.0, 0.63, 0.2] }
    else if t < 7000.0 { [1.0, 0.94, 0.7] }
    else if t < 10000.0 { [0.78, 0.86, 1.0] }
    else { [0.39, 0.59, 1.0] }
}
fn star_cls(t: f64) -> &'static str {
    if t < 3500.0 { "M" }
    else if t < 5000.0 { "K" }
    else if t < 6000.0 { "G" }
    else if t < 7500.0 { "F" }
    else { "A" }
}
fn p_type(rade: f64, mass: f64, eqt: Option<f64>) -> &'static str {
    if rade > 8.0 {
        return match eqt {
            Some(e) if e > 800.0 => "Hot Jupiter",
            _ => "Gas Giant",
        };
    }
    if rade > 4.0 { return "Ice Giant"; }
    match eqt {
        Some(e) if e > 600.0 => "Lava World",
        Some(e) if e > 220.0 && e < 320.0 => "Temperate",
        Some(e) if e < 200.0 => "Ice World",
        _ => if mass > 5.0 { "Super Earth" } else { "Rocky" },
    }
}
fn p_color(ptype: &str) -> [[f64; 3]; 4] {
    match ptype {
        "Hot Jupiter" => [[0.85,0.4,0.15],[0.7,0.3,0.1],[0.95,0.7,0.3],[0.6,0.2,0.05]],
        "Gas Giant" => [[0.8,0.65,0.4],[0.9,0.8,0.6],[0.65,0.5,0.3],[1.0,0.9,0.7]],
        "Ice Giant" => [[0.3,0.5,0.8],[0.4,0.65,0.9],[0.2,0.4,0.7],[0.7,0.85,1.0]],
        "Lava World" => [[0.15,0.08,0.05],[0.1,0.05,0.03],[0.8,0.2,0.05],[0.6,0.1,0.02]],
        "Temperate" => [[0.1,0.3,0.7],[0.15,0.5,0.2],[0.65,0.55,0.35],[0.85,0.85,0.9]],
        "Ice World" => [[0.75,0.82,0.9],[0.85,0.9,0.95],[0.6,0.7,0.8],[0.95,0.97,1.0]],
        "Super Earth" => [[0.5,0.35,0.25],[0.4,0.5,0.3],[0.6,0.5,0.4],[0.7,0.65,0.55]],
        _ => [[0.45,0.38,0.32],[0.55,0.48,0.4],[0.35,0.3,0.25],[0.6,0.55,0.5]],
    }
}
#[wasm_bindgen]
pub fn gen_galaxy(particle_count: usize, seed: u32) -> Float32Array {
    let mut rng = Rng::new(seed as u64 ^ 0xDEADBEEF);
    let mut pos = vec![0.0f32; particle_count * 3];
    let mut col = vec![0.0f32; particle_count * 3];
    let mut idx = 0usize;
    let disk_h = 60.0;
    let bar_len = 1200.0;
    let bar_w = 300.0;
    let bar_ang = 0.45f64;
    let arms: [(f64, f64, f64); 4] = [
        (0.0, 350.0, 1.0),
        (std::f64::consts::PI, 350.0, 1.0),
        (std::f64::consts::PI * 0.5, 250.0, 0.55),
        (std::f64::consts::PI * 1.5, 250.0, 0.55),
    ];
    let p_major = (particle_count as f64 * 0.18) as usize;
    let p_minor = (particle_count as f64 * 0.1) as usize;
    for &(off, w, str_v) in &arms {
        let na = if str_v > 0.8 { p_major } else { p_minor };
        for _ in 0..na {
            if idx >= particle_count { break; }
            let t = rng.next();
            let r = t * GR * if str_v > 0.8 { 1.0 } else { 0.85 };
            let wind = t * 3.8 + if str_v > 0.8 { 0.0 } else { t * 0.3 };
            let angle = off + wind + (rng.next() - 0.5) * 0.35;
            let spread = w * (0.2 + t * 0.8) * (0.7 + rng.next() * 0.6);
            let x = r * angle.cos() + (rng.next() - 0.5) * spread;
            let z = r * angle.sin() + (rng.next() - 0.5) * spread;
            let y = (rng.next() - 0.5) * disk_h * (1.0 - t * 0.4);
            pos[idx * 3] = x as f32;
            pos[idx * 3 + 1] = y as f32;
            pos[idx * 3 + 2] = z as f32;
            let bright = 0.25 + rng.next() * 0.75;
            let tc: [f64; 3] = if t < 0.25 { [1.0, 0.88, 0.65] }
                else if t < 0.6 { [0.75, 0.8, 0.95] }
                else { [0.5, 0.6, 1.0] };
            col[idx * 3] = (tc[0] * bright) as f32;
            col[idx * 3 + 1] = (tc[1] * bright) as f32;
            col[idx * 3 + 2] = (tc[2] * bright) as f32;
            idx += 1;
        }
    }
    let bar_n = (particle_count as f64 * 0.08) as usize;
    for _ in 0..bar_n {
        if idx >= particle_count { break; }
        let bx = (rng.next() - 0.5) * bar_len * 2.0;
        let bz = (rng.next() - 0.5) * bar_w;
        let rx = bx * bar_ang.cos() - bz * bar_ang.sin();
        let rz_v = bx * bar_ang.sin() + bz * bar_ang.cos();
        let y = (rng.next() - 0.5) * 80.0;
        let fade = 1.0 - bx.abs() / bar_len;
        pos[idx * 3] = rx as f32;
        pos[idx * 3 + 1] = y as f32;
        pos[idx * 3 + 2] = rz_v as f32;
        let b = (0.5 + rng.next() * 0.5) * fade;
        col[idx * 3] = (1.0 * b) as f32;
        col[idx * 3 + 1] = (0.82 * b) as f32;
        col[idx * 3 + 2] = (0.55 * b) as f32;
        idx += 1;
    }
    let bulge_n = (particle_count as f64 * 0.12) as usize;
    for _ in 0..bulge_n {
        if idx >= particle_count { break; }
        let r = rng.next().powf(0.6) * GR * 0.2;
        let a = rng.next() * std::f64::consts::TAU;
        let h = (rng.next() - 0.5) * 120.0 * (1.0 - r / (GR * 0.2));
        pos[idx * 3] = (r * a.cos()) as f32;
        pos[idx * 3 + 1] = h as f32;
        pos[idx * 3 + 2] = (r * a.sin()) as f32;
        let b = 0.5 + rng.next() * 0.5;
        col[idx * 3] = (1.0 * b) as f32;
        col[idx * 3 + 1] = (0.82 * b) as f32;
        col[idx * 3 + 2] = (0.55 * b) as f32;
        idx += 1;
    }
    while idx < particle_count {
        let r = rng.next().powf(0.7) * GR;
        let a = rng.next() * std::f64::consts::TAU;
        let h = (rng.next() - 0.5) * 35.0;
        pos[idx * 3] = (r * a.cos()) as f32;
        pos[idx * 3 + 1] = h as f32;
        pos[idx * 3 + 2] = (r * a.sin()) as f32;
        let b = 0.08 + rng.next() * 0.18;
        col[idx * 3] = (b * 0.9) as f32;
        col[idx * 3 + 1] = (b * 0.85) as f32;
        col[idx * 3 + 2] = (b * 1.15) as f32;
        idx += 1;
    }
    let mut out = vec![0.0f32; particle_count * 6];
    for i in 0..particle_count {
        out[i * 6] = pos[i * 3];
        out[i * 6 + 1] = pos[i * 3 + 1];
        out[i * 6 + 2] = pos[i * 3 + 2];
        out[i * 6 + 3] = col[i * 3];
        out[i * 6 + 4] = col[i * 3 + 1];
        out[i * 6 + 5] = col[i * 3 + 2];
    }
    Float32Array::from(&out[..])
}
#[derive(Serialize, Deserialize)]
struct Planet {
    name: String,
    rade: f64,
    mass: f64,
    eqt: Option<f64>,
    orbit: Option<f64>,
    ptype: String,
    color: [[f64; 3]; 4],
}
#[derive(Serialize, Deserialize)]
struct StarSystem {
    name: String,
    host: String,
    temp: f64,
    planets: Vec<Planet>,
    pos: [f64; 3],
    sc: [f64; 3],
    src: String,
    cls: String,
}
#[derive(Deserialize)]
struct NasaRow {
    pl_name: Option<String>,
    hostname: Option<String>,
    pl_rade: Option<f64>,
    pl_bmasse: Option<f64>,
    st_teff: Option<f64>,
    pl_orbsmax: Option<f64>,
    pl_eqt: Option<f64>,
}
#[wasm_bindgen]
pub fn gen_systems(nasa_json: &str, proc_count: usize, seed: u32) -> JsValue {
    let mut rng = Rng::new(seed as u64 ^ 0xCAFEBABE);
    let mut all: Vec<StarSystem> = Vec::new();
    if let Ok(rows) = serde_json::from_str::<Vec<NasaRow>>(nasa_json) {
        let mut hosts: std::collections::HashMap<String, (f64, Vec<Planet>)> = std::collections::HashMap::new();
        for r in &rows {
            let pn = r.pl_name.clone().unwrap_or_default();
            let h = r.hostname.clone().unwrap_or_else(|| pn.split_whitespace().next().unwrap_or("").to_string());
            let temp = r.st_teff.unwrap_or(5000.0);
            let rade = r.pl_rade.unwrap_or(1.0);
            let mass = r.pl_bmasse.unwrap_or(1.0);
            let eqt = r.pl_eqt;
            let orbit = r.pl_orbsmax;
            let pt = p_type(rade, mass, eqt).to_string();
            let pc = p_color(&pt);
            let entry = hosts.entry(h.clone()).or_insert((temp, Vec::new()));
            entry.1.push(Planet { name: pn, rade, mass, eqt, orbit, ptype: pt, color: pc });
        }
        for (h, (temp, planets)) in hosts {
            let a = rng.next() * std::f64::consts::TAU;
            let r = rng.next() * 400.0;
            let px = SOL_X + a.cos() * r;
            let py = SOL_Y + (rng.next() - 0.5) * 20.0;
            let pz = SOL_Z + a.sin() * r;
            let sc = star_col(temp);
            let cls = star_cls(temp).to_string();
            all.push(StarSystem {
                name: format!("{} System", h),
                host: h,
                temp, planets,
                pos: [px, py, pz],
                sc, src: "NASA".into(), cls,
            });
        }
    }
    for i in 0..proc_count {
        let arm = (rng.next() * ARMS as f64).floor() as usize;
        let off = arm as f64 * (std::f64::consts::TAU / ARMS as f64);
        let t = 0.05 + rng.next() * 0.95;
        let r = t * GR;
        let angle = off + t * 4.0 + (rng.next() - 0.5) * 0.3;
        let spread = 300.0 * (0.3 + t * 0.7);
        let x = r * angle.cos() + (rng.next() - 0.5) * spread;
        let z = r * angle.sin() + (rng.next() - 0.5) * spread;
        let y = (rng.next() - 0.5) * 40.0;
        let temp = (2500.0 + rng.next() * 11000.0).round();
        let n_pl = 1 + (rng.next() * 6.0).floor() as usize;
        let mut pls = Vec::with_capacity(n_pl);
        for p in 0..n_pl {
            let rade = 0.3 + rng.next() * 15.0;
            let mass_raw = if rade < 2.0 { 0.1 + rng.next() * 8.0 } else { rade * rade * 0.5 + rng.next() * 100.0 };
            let mass = (mass_raw * 10.0).round() / 10.0;
            let orb_raw = 0.1 + p as f64 * 0.3 + rng.next() * 2.0;
            let orb = (orb_raw * 100.0).round() / 100.0;
            let eqt_raw = if temp > 5000.0 { 300.0 / (orb_raw + 0.5) } else { 150.0 / (orb_raw + 0.5) };
            let eqt = eqt_raw.round();
            let nm = format!("CALC-{:04} {}", i, (b'b' + p as u8) as char);
            let pt = p_type(rade, mass, Some(eqt)).to_string();
            let pc = p_color(&pt);
            pls.push(Planet { name: nm, rade, mass, eqt: Some(eqt), orbit: Some(orb), ptype: pt, color: pc });
        }
        let sc = star_col(temp);
        let cls = star_cls(temp).to_string();
        let nm = format!("CALC-{:04}", i);
        all.push(StarSystem {
            name: nm.clone(), host: nm, temp, planets: pls,
            pos: [x, y, z], sc, src: "PROC".into(), cls,
        });
    }
    JsValue::from_str(&serde_json::to_string(&all).unwrap_or_default())
}
#[wasm_bindgen]
pub fn gen_texture(ptype: &str, seed: f64, rade: f64, sz: usize) -> Uint8Array {
    let pal = p_color(ptype);
    let is_gas = rade > 4.0;
    let mut data = vec![0u8; sz * sz * 4];
    let szf = sz as f64;
    for j in 0..sz {
        for i in 0..sz {
            let u = i as f64 / szf;
            let v = j as f64 / szf;
            let th = u * std::f64::consts::TAU;
            let ph = v * std::f64::consts::PI;
            let px = ph.sin() * th.cos();
            let py = ph.sin() * th.sin();
            let pz = ph.cos();
            let (rv, gv, bv) = if is_gas {
                let lat = v;
                let band = (lat * (8.0 + hash(seed) * 12.0) * std::f64::consts::PI).sin() * 0.5 + 0.5;
                let storm = fbm(px * 4.0 + seed, py * 4.0 + seed, pz * 4.0 + seed, 4) * 0.3;
                let ci = clampf((band + storm) * pal.len() as f64, 0.0, (pal.len() - 1) as f64).floor() as usize;
                let c = pal[ci];
                let n = fbm(px * 6.0 + seed * 2.0, py * 6.0 + seed * 2.0, pz * 6.0 + seed * 2.0, 3) * 0.15;
                (clampf(c[0] + n, 0.0, 1.0), clampf(c[1] + n, 0.0, 1.0), clampf(c[2] + n, 0.0, 1.0))
            } else {
                let h = fbm(px * 2.0 + seed, py * 2.0 + seed, pz * 2.0 + seed, 6);
                let mo = fbm(px * 3.0 + seed + 50.0, py * 3.0 + seed + 50.0, pz * 3.0 + seed + 50.0, 4);
                let ci = if ptype == "Lava World" {
                    let crack = fbm(px * 8.0 + seed, py * 8.0 + seed, pz * 8.0 + seed, 5);
                    if crack > 0.55 { pal[2] } else if crack > 0.5 { pal[3] } else if h > 0.5 { pal[0] } else { pal[1] }
                } else if ptype == "Ice World" {
                    if h > 0.6 { pal[3] } else if h > 0.45 { pal[0] } else if h > 0.35 { pal[2] } else { pal[1] }
                } else {
                    if h < 0.38 { pal[0] }
                    else if h < 0.42 { [0.75, 0.7, 0.55] }
                    else if h < 0.58 { if mo > 0.5 { pal[1] } else { pal[2] } }
                    else if h < 0.72 { pal[2] }
                    else { pal[3] }
                };
                let det = fbm(px * 10.0 + seed * 3.0, py * 10.0 + seed * 3.0, pz * 10.0 + seed * 3.0, 3) * 0.08;
                (clampf(ci[0] + det, 0.0, 1.0), clampf(ci[1] + det, 0.0, 1.0), clampf(ci[2] + det, 0.0, 1.0))
            };
            let off = (j * sz + i) * 4;
            data[off] = (rv * 255.0) as u8;
            data[off + 1] = (gv * 255.0) as u8;
            data[off + 2] = (bv * 255.0) as u8;
            data[off + 3] = 255;
        }
    }
    Uint8Array::from(&data[..])
}
#[wasm_bindgen]
pub fn star_color(temp: f64) -> Float32Array {
    let c = star_col(temp);
    Float32Array::from(&[c[0] as f32, c[1] as f32, c[2] as f32][..])
}
#[wasm_bindgen]
pub fn star_class(temp: f64) -> String {
    star_cls(temp).to_string()
}
#[wasm_bindgen]
pub fn planet_type(rade: f64, mass: f64, eqt: f64) -> String {
    let e = if eqt <= 0.0 { None } else { Some(eqt) };
    p_type(rade, mass, e).to_string()
}
#[wasm_bindgen]
pub fn planet_color_palette(ptype: &str) -> JsValue {
    let pal = p_color(ptype);
    let flat: Vec<f64> = pal.iter().flat_map(|c| c.iter().copied()).collect();
    JsValue::from_str(&serde_json::to_string(&flat).unwrap_or_default())
}
