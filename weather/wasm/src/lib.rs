use wasm_bindgen::prelude::*;
#[wasm_bindgen]
pub fn version() -> String {"1.0.0".into()}
fn clamp01(x: f32) -> f32 {x.max(0.0).min(1.0)}
fn lerp(a: f32, b: f32, t: f32) -> f32 {a+(b-a)*t}
fn hue_rgb(h: f32) -> (f32, f32, f32) {
let h6 = (h.fract()*6.0).rem_euclid(6.0);
let x = 1.0-(h6%2.0-1.0).abs();
match h6 as i32 {
0 => (1.0,x,0.0),1 => (x,1.0,0.0),2 => (0.0,1.0,x),3 => (0.0,x,1.0),4 => (x,0.0,1.0),_ => (1.0,0.0,x)
}
}
fn palette_rgb(id: u32, t: f32) -> (u8, u8, u8) {
let t = clamp01(t);
let (r,g,b) = match id {
0 => {
let stops = [(-0.05f32,0.05,0.35),(0.1,0.25,0.75),(0.2,0.7,0.95),(0.95,0.95,0.55),(0.95,0.45,0.1),(0.7,0.05,0.05)];
let n = stops.len()-1;
let x = t*(n as f32);
let i = (x.floor() as usize).min(n-1);
let f = x-i as f32;
let a = stops[i];let b = stops[i+1];
(lerp(a.0,b.0,f),lerp(a.1,b.1,f),lerp(a.2,b.2,f))
},
1 => {
let stops = [(0.05f32,0.08,0.2),(0.1,0.35,0.75),(0.2,0.75,0.95),(0.95,0.95,0.98)];
let n = stops.len()-1;
let x = t*(n as f32);
let i = (x.floor() as usize).min(n-1);
let f = x-i as f32;
let a = stops[i];let b = stops[i+1];
(lerp(a.0,b.0,f),lerp(a.1,b.1,f),lerp(a.2,b.2,f))
},
2 => {
let (hr,hg,hb) = hue_rgb(0.66-t*0.66);
(hr*0.85+0.1,hg*0.85+0.1,hb*0.85+0.1)
},
3 => {
let stops = [(0.15f32,0.12,0.1),(0.55,0.35,0.15),(0.9,0.75,0.25),(0.95,0.95,0.9)];
let n = stops.len()-1;
let x = t*(n as f32);
let i = (x.floor() as usize).min(n-1);
let f = x-i as f32;
let a = stops[i];let b = stops[i+1];
(lerp(a.0,b.0,f),lerp(a.1,b.1,f),lerp(a.2,b.2,f))
},
4 => {
let v = t;
(v*0.15+0.05,v*0.55+0.1,v*0.25+0.08)
},
5 => {
let stops = [(0.4f32,0.05,0.55),(0.1,0.35,0.85),(0.1,0.85,0.55),(0.95,0.9,0.2),(0.95,0.25,0.1)];
let n = stops.len()-1;
let x = t*(n as f32);
let i = (x.floor() as usize).min(n-1);
let f = x-i as f32;
let a = stops[i];let b = stops[i+1];
(lerp(a.0,b.0,f),lerp(a.1,b.1,f),lerp(a.2,b.2,f))
},
6 => {
let g = t;
(g,g,g)
},
7 => {
let stops = [(0.02f32,0.02,0.08),(0.15,0.05,0.45),(0.7,0.15,0.55),(0.95,0.55,0.2),(1.0,0.95,0.7)];
let n = stops.len()-1;
let x = t*(n as f32);
let i = (x.floor() as usize).min(n-1);
let f = x-i as f32;
let a = stops[i];let b = stops[i+1];
(lerp(a.0,b.0,f),lerp(a.1,b.1,f),lerp(a.2,b.2,f))
},
_ => (t,t,t)
};
((r*255.0) as u8,(g*255.0) as u8,(b*255.0) as u8)
}
#[wasm_bindgen]
pub fn palette_count() -> u32 {8}
#[wasm_bindgen]
pub fn palette_name(id: u32) -> String {
match id {
0 => "Thermal".into(),
1 => "Precipitation".into(),
2 => "Jet".into(),
3 => "Dust".into(),
4 => "Chlorophyll".into(),
5 => "Turbo".into(),
6 => "Grayscale".into(),
7 => "Inferno".into(),
_ => "Thermal".into()
}
}
#[wasm_bindgen]
pub fn render_field(values: &[f32], w: u32, h: u32, vmin: f32, vmax: f32, palette_id: u32, reverse: bool, alpha: f32) -> Vec<u8> {
let n = (w*h) as usize;
let mut out = vec![0u8; n*4];
let span = (vmax-vmin).abs().max(1e-6);
let a = (clamp01(alpha)*255.0) as u8;
for i in 0..n {
let mut t = (values.get(i).copied().unwrap_or(vmin)-vmin)/span;
if reverse {t = 1.0-t;}
t = clamp01(t);
let (r,g,b) = palette_rgb(palette_id,t);
let o = i*4;
out[o]=r;out[o+1]=g;out[o+2]=b;out[o+3]=a;
}
out
}
#[wasm_bindgen]
pub fn sample_bilinear(values: &[f32], w: u32, h: u32, u: f32, v: f32) -> f32 {
if w==0||h==0||values.is_empty() {return 0.0;}
let x = clamp01(u)*(w as f32-1.0);
let y = clamp01(v)*(h as f32-1.0);
let x0 = x.floor() as u32;
let y0 = y.floor() as u32;
let x1 = (x0+1).min(w-1);
let y1 = (y0+1).min(h-1);
let fx = x-x0 as f32;
let fy = y-y0 as f32;
let i = |xx: u32, yy: u32| values[(yy*w+xx) as usize];
lerp(lerp(i(x0,y0),i(x1,y0),fx),lerp(i(x0,y1),i(x1,y1),fx),fy)
}
#[wasm_bindgen]
pub fn smooth_box(values: &[f32], w: u32, h: u32, radius: u32) -> Vec<f32> {
let r = radius.max(0);
let mut out = vec![0f32;(w*h) as usize];
if r==0 {out.copy_from_slice(values);return out;}
for y in 0..h {
for x in 0..w {
let x0 = x.saturating_sub(r);
let y0 = y.saturating_sub(r);
let x1 = (x+r).min(w-1);
let y1 = (y+r).min(h-1);
let mut s = 0f32;
let mut c = 0f32;
for yy in y0..=y1 {
for xx in x0..=x1 {
s += values[(yy*w+xx) as usize];
c += 1.0;
}
}
out[(y*w+x) as usize] = s/c.max(1.0);
}
}
out
}
#[wasm_bindgen]
pub fn idw_grid(lats: &[f32], lons: &[f32], vals: &[f32], gw: u32, gh: u32, lat0: f32, lat1: f32, lon0: f32, lon1: f32, power: f32) -> Vec<f32> {
let n = lats.len().min(lons.len()).min(vals.len());
let mut out = vec![0f32;(gw*gh) as usize];
if n==0||gw==0||gh==0 {return out;}
let p = power.max(0.5);
for y in 0..gh {
let v = if gh>1 {y as f32/(gh as f32-1.0)} else {0.0};
let lat = lerp(lat1,lat0,v);
for x in 0..gw {
let u = if gw>1 {x as f32/(gw as f32-1.0)} else {0.0};
let lon = lerp(lon0,lon1,u);
let mut num = 0f32;
let mut den = 0f32;
let mut exact = None;
for i in 0..n {
let dlat = lats[i]-lat;
let dlon = (lons[i]-lon)*((lat*0.01745329252).cos().abs().max(0.2));
let d2 = dlat*dlat+dlon*dlon;
if d2 < 1e-12 {exact = Some(vals[i]);break;}
let w = 1.0/d2.powf(p*0.5);
num += w*vals[i];
den += w;
}
out[(y*gw+x) as usize] = exact.unwrap_or_else(|| if den>0.0 {num/den} else {0.0});
}
}
out
}
#[wasm_bindgen]
pub fn upsample_bilinear(src: &[f32], sw: u32, sh: u32, dw: u32, dh: u32) -> Vec<f32> {
let mut out = vec![0f32;(dw*dh) as usize];
if sw==0||sh==0||dw==0||dh==0 {return out;}
for y in 0..dh {
let v = if dh>1 {y as f32/(dh as f32-1.0)} else {0.0};
for x in 0..dw {
let u = if dw>1 {x as f32/(dw as f32-1.0)} else {0.0};
out[(y*dw+x) as usize] = sample_bilinear(src,sw,sh,u,v);
}
}
out
}
#[wasm_bindgen]
pub fn wind_speed(u: &[f32], v: &[f32]) -> Vec<f32> {
let n = u.len().min(v.len());
(0..n).map(|i| (u[i]*u[i]+v[i]*v[i]).sqrt()).collect()
}
#[wasm_bindgen]
pub fn wind_dir_deg(u: &[f32], v: &[f32]) -> Vec<f32> {
let n = u.len().min(v.len());
(0..n).map(|i| {
let d = v[i].atan2(u[i])*57.2957795;
(270.0-d).rem_euclid(360.0)
}).collect()
}
#[wasm_bindgen]
pub fn heat_index_c(t_c: f32, rh: f32) -> f32 {
let t = t_c*9.0/5.0+32.0;
let r = rh.clamp(0.0,100.0);
if t < 80.0 {return t_c;}
let hi = -42.379+2.04901523*t+10.14333127*r-0.22475541*t*r-6.83783e-3*t*t-5.481717e-2*r*r+1.22874e-3*t*t*r+8.5282e-4*t*r*r-1.99e-6*t*t*r*r;
(hi-32.0)*5.0/9.0
}
#[wasm_bindgen]
pub fn wind_chill_c(t_c: f32, wind_kmh: f32) -> f32 {
let t = t_c*9.0/5.0+32.0;
let v = wind_kmh*0.621371;
if t > 50.0 || v < 3.0 {return t_c;}
let wc = 35.74+0.6215*t-35.75*v.powf(0.16)+0.4275*t*v.powf(0.16);
(wc-32.0)*5.0/9.0
}
#[wasm_bindgen]
pub fn dewpoint_c(t_c: f32, rh: f32) -> f32 {
let a = 17.27f32;
let b = 237.7f32;
let r = (rh.clamp(1.0,100.0)/100.0).ln()+(a*t_c)/(b+t_c);
b*r/(a-r)
}
#[wasm_bindgen]
pub fn convert_temp(v: f32, to_f: bool) -> f32 {if to_f {v*9.0/5.0+32.0} else {v}}
#[wasm_bindgen]
pub fn convert_speed(v_ms: f32, unit: u32) -> f32 {
match unit {1 => v_ms*3.6,2 => v_ms*2.236936,3 => v_ms*1.943844,_ => v_ms}
}
#[wasm_bindgen]
pub fn convert_precip(v_mm: f32, to_in: bool) -> f32 {if to_in {v_mm/25.4} else {v_mm}}
#[wasm_bindgen]
pub fn convert_pressure(v_hpa: f32, unit: u32) -> f32 {
match unit {1 => v_hpa*0.02953,2 => v_hpa*0.75006,_ => v_hpa}
}
#[wasm_bindgen]
pub fn field_stats(values: &[f32]) -> Vec<f32> {
if values.is_empty() {return vec![0.0,0.0,0.0];}
let mut mn = f32::INFINITY;
let mut mx = f32::NEG_INFINITY;
let mut s = 0f32;
for &v in values {
if v.is_finite() {mn=mn.min(v);mx=mx.max(v);s+=v;}
}
if !mn.is_finite() {return vec![0.0,0.0,0.0];}
vec![mn,mx,s/values.len() as f32]
}
#[wasm_bindgen]
pub fn synthetic_field(kind: u32, w: u32, h: u32, t: f32, _lat0: f32, _lon0: f32) -> Vec<f32> {
let mut out = vec![0f32;(w*h) as usize];
let tw = t*0.01745329252;
for y in 0..h {
let v = if h>1 {y as f32/(h as f32-1.0)} else {0.0};
let lat = 85.0-v*170.0;
for x in 0..w {
let u = if w>1 {x as f32/(w as f32-1.0)} else {0.0};
let lon = -180.0+u*360.0;
let n1 = ((lat*0.11+tw).sin()*(lon*0.08-tw*0.6).cos())*0.5+0.5;
let n2 = ((lat*0.28-tw*0.35).sin()+(lon*0.22+tw).cos())*0.25+0.5;
let n = (n1*0.65+n2*0.35).clamp(0.0,1.0);
let base_lat = (lat/90.0).clamp(-1.0,1.0);
let jet = (-((lat-45.0)*(lat-45.0))/180.0).exp()+(-((lat+40.0)*(lat+40.0))/220.0).exp();
let val = match kind {
0 => 28.0-base_lat.abs()*36.0+(n-0.5)*14.0+jet*6.0+tw.sin()*2.0,
1 => n.powf(2.1)*10.0*jet,
2 => 3.0+n*14.0+jet*8.0,
3 => 35.0+n*50.0,
4 => 1008.0+n*22.0-base_lat.abs()*6.0,
5 => n.powf(0.85)*95.0,
6 => n.powf(2.4)*6.0*(if lat>40.0 {1.0} else {0.2}),
7 => (1.0-n)*38000.0+n*4000.0,
8 => n*850.0,
9 => n.powf(1.5)*2200.0*jet,
10 => 4.0+n*28.0,
11 => n*10.0,
12 => 10.0-base_lat.abs()*20.0+(n-0.5)*7.0,
13 => 8.0+n*28.0,
14 => 26.0-base_lat.abs()*34.0+(n-0.5)*12.0,
_ => n*100.0
};
out[(y*w+x) as usize] = val;
}
}
out
}
#[wasm_bindgen]
pub fn default_range(kind: u32) -> Vec<f32> {
match kind {
0 => vec![-40.0,45.0],
1 => vec![0.0,15.0],
2 => vec![0.0,30.0],
3 => vec![0.0,100.0],
4 => vec![980.0,1040.0],
5 => vec![0.0,100.0],
6 => vec![0.0,10.0],
7 => vec![0.0,50000.0],
8 => vec![0.0,1000.0],
9 => vec![0.0,3000.0],
10 => vec![0.0,50.0],
11 => vec![0.0,12.0],
12 => vec![-30.0,35.0],
13 => vec![0.0,40.0],
14 => vec![-40.0,50.0],
_ => vec![0.0,1.0]
}
}
#[wasm_bindgen]
pub fn default_palette(kind: u32) -> u32 {
match kind {
0|12|14 => 0,
1|6 => 1,
2|10 => 2,
3|5 => 5,
4 => 2,
7 => 6,
8|11 => 7,
9 => 7,
13 => 3,
_ => 5
}
}
