struct Uni {
  vmin: f32,
  vmax: f32,
  opacity: f32,
  reverse: f32,
  pal: f32,
  pad0: f32,
  pad1: f32,
  pad2: f32,
}
@group(0) @binding(0) var fieldTex: texture_2d<f32>;
@group(0) @binding(1) var fieldSamp: sampler;
@group(0) @binding(2) var<uniform> u: Uni;
struct VsOut {
  @builtin(position) pos: vec4<f32>,
  @location(0) uv: vec2<f32>,
}
@vertex
fn vs_main(@location(0) p: vec2<f32>, @location(1) uv: vec2<f32>) -> VsOut {
  var o: VsOut;
  o.pos = vec4<f32>(p, 0.0, 1.0);
  o.uv = uv;
  return o;
}
fn clamp01(x: f32) -> f32 { return clamp(x, 0.0, 1.0); }
fn lerp3(a: vec3<f32>, b: vec3<f32>, t: f32) -> vec3<f32> { return a + (b - a) * t; }
fn pal_thermal(t: f32) -> vec3<f32> {
  let s0 = vec3<f32>(0.05, 0.05, 0.35);
  let s1 = vec3<f32>(0.1, 0.25, 0.75);
  let s2 = vec3<f32>(0.2, 0.7, 0.95);
  let s3 = vec3<f32>(0.95, 0.95, 0.55);
  let s4 = vec3<f32>(0.95, 0.45, 0.1);
  let s5 = vec3<f32>(0.7, 0.05, 0.05);
  let x = t * 5.0;
  let i = floor(x);
  let f = x - i;
  if (i < 1.0) { return lerp3(s0, s1, f); }
  if (i < 2.0) { return lerp3(s1, s2, f); }
  if (i < 3.0) { return lerp3(s2, s3, f); }
  if (i < 4.0) { return lerp3(s3, s4, f); }
  return lerp3(s4, s5, f);
}
fn pal_precip(t: f32) -> vec3<f32> {
  return lerp3(lerp3(vec3<f32>(0.05,0.08,0.2), vec3<f32>(0.1,0.35,0.75), clamp01(t*2.0)),
               lerp3(vec3<f32>(0.2,0.75,0.95), vec3<f32>(0.95,0.95,0.98), clamp01(t*2.0-1.0)),
               step(0.5, t));
}
fn pal_jet(t: f32) -> vec3<f32> {
  let h = 0.66 - t * 0.66;
  let h6 = fract(h) * 6.0;
  let x = 1.0 - abs(h6 % 2.0 - 1.0);
  var c = vec3<f32>(1.0, x, 0.0);
  if (h6 >= 1.0 && h6 < 2.0) { c = vec3<f32>(x, 1.0, 0.0); }
  else if (h6 >= 2.0 && h6 < 3.0) { c = vec3<f32>(0.0, 1.0, x); }
  else if (h6 >= 3.0 && h6 < 4.0) { c = vec3<f32>(0.0, x, 1.0); }
  else if (h6 >= 4.0 && h6 < 5.0) { c = vec3<f32>(x, 0.0, 1.0); }
  else if (h6 >= 5.0) { c = vec3<f32>(1.0, 0.0, x); }
  return c * 0.85 + 0.1;
}
fn pal_turbo(t: f32) -> vec3<f32> {
  let s0 = vec3<f32>(0.4, 0.05, 0.55);
  let s1 = vec3<f32>(0.1, 0.35, 0.85);
  let s2 = vec3<f32>(0.1, 0.85, 0.55);
  let s3 = vec3<f32>(0.95, 0.9, 0.2);
  let s4 = vec3<f32>(0.95, 0.25, 0.1);
  let x = t * 4.0;
  let i = floor(x);
  let f = x - i;
  if (i < 1.0) { return lerp3(s0, s1, f); }
  if (i < 2.0) { return lerp3(s1, s2, f); }
  if (i < 3.0) { return lerp3(s2, s3, f); }
  return lerp3(s3, s4, f);
}
fn pal_inferno(t: f32) -> vec3<f32> {
  let s0 = vec3<f32>(0.02, 0.02, 0.08);
  let s1 = vec3<f32>(0.15, 0.05, 0.45);
  let s2 = vec3<f32>(0.7, 0.15, 0.55);
  let s3 = vec3<f32>(0.95, 0.55, 0.2);
  let s4 = vec3<f32>(1.0, 0.95, 0.7);
  let x = t * 4.0;
  let i = floor(x);
  let f = x - i;
  if (i < 1.0) { return lerp3(s0, s1, f); }
  if (i < 2.0) { return lerp3(s1, s2, f); }
  if (i < 3.0) { return lerp3(s2, s3, f); }
  return lerp3(s3, s4, f);
}
fn colorize(t_in: f32) -> vec3<f32> {
  var t = clamp01(t_in);
  if (u.reverse > 0.5) { t = 1.0 - t; }
  let p = u32(u.pal + 0.5);
  if (p == 1u) { return pal_precip(t); }
  if (p == 2u) { return pal_jet(t); }
  if (p == 5u) { return pal_turbo(t); }
  if (p == 6u) { return vec3<f32>(t, t, t); }
  if (p == 7u) { return pal_inferno(t); }
  return pal_thermal(t);
}
@fragment
fn fs_main(inp: VsOut) -> @location(0) vec4<f32> {
  let sample = textureSample(fieldTex, fieldSamp, inp.uv).r;
  let span = max(abs(u.vmax - u.vmin), 1e-6);
  let t = (sample - u.vmin) / span;
  let rgb = colorize(t);
  return vec4<f32>(rgb, u.opacity);
}
