#include "frag.glsl"
layout(set = 2, binding = 0) uniform sampler2D t_map;
layout(set = 2, binding = 1) uniform sampler2D t_nrm;
layout(set = 2, binding = 2) uniform sampler2D t_rgh;
layout(set = 2, binding = 3) uniform sampler2D t_mtl;
layout(set = 2, binding = 4) uniform sampler2D t_ems;
layout(set = 2, binding = 5) uniform sampler2DShadow t_shd;
layout(set = 2, binding = 6) uniform samplerCubeArray t_env;
layout(set = 2, binding = 7) uniform sampler3D t_fea;
layout(location = 0) in vec3 v_wp;
layout(location = 1) in vec3 v_n;
layout(location = 2) in vec2 v_uv;
layout(location = 3) in vec4 v_col;
layout(location = 4) in vec4 v_aux;
const float PI = 3.14159265;
float gridl(vec2 w, float s) { vec2 q = w / s; vec2 c = abs(fract(q - 0.5) - 0.5) / fwidth(q); return 1.0 - min(min(c.x, c.y), 1.0); }
vec3 ramp(float t) {
	t = clamp(t, 0.0, 1.0);
	vec3 c0 = vec3(0.169, 0.349, 0.765), c1 = vec3(0.169, 0.71, 0.765), c2 = vec3(0.247, 0.816, 0.478), c3 = vec3(0.949, 0.824, 0.18), c4 = vec3(0.949, 0.514, 0.18), c5 = vec3(0.878, 0.196, 0.18);
	vec3 c = t < 0.2 ? mix(c0, c1, t / 0.2) : t < 0.4 ? mix(c1, c2, (t - 0.2) / 0.2) : t < 0.6 ? mix(c2, c3, (t - 0.4) / 0.2) : t < 0.8 ? mix(c3, c4, (t - 0.6) / 0.2) : mix(c4, c5, (t - 0.8) / 0.2);
	return pow(c, vec3(2.2));
}
vec3 fresnel(vec3 f0, float vh) { float f = exp2((-5.55473 * vh - 6.98316) * vh); return f0 * (1.0 - f) + f; }
vec3 ggx(vec3 l, vec3 v, vec3 n, vec3 f0, float r) {
	float a2 = r * r * r * r;
	vec3 h = normalize(l + v);
	float nl = clamp(dot(n, l), 0.0, 1.0), nv = clamp(dot(n, v), 0.0, 1.0), nh = clamp(dot(n, h), 0.0, 1.0), vh = clamp(dot(v, h), 0.0, 1.0);
	float gv = nl * sqrt(a2 + (1.0 - a2) * nv * nv), gl = nv * sqrt(a2 + (1.0 - a2) * nl * nl), d = nh * nh * (a2 - 1.0) + 1.0;
	return fresnel(f0, vh) * (0.5 / max(gv + gl, 1e-6)) * (a2 / (PI * d * d));
}
vec2 dfg(float nv, float r) {
	vec4 q = r * vec4(-1.0, -0.0275, -0.572, 0.022) + vec4(1.0, 0.0425, 1.04, -0.04);
	float a = min(q.x * q.x, exp2(-9.28 * nv)) * q.x + q.y;
	return vec2(-1.04, 1.04) * a + q.zw;
}
vec3 envl(vec3 d, float lod) { return env.x > 0.0 ? textureLod(t_env, vec4(d, 0.0), lod).rgb * env.x : vec3(0.0); }
float shadow_at(vec3 p, vec3 n) {
	if (cnt.z < 0.5) return 1.0;
	vec4 c = svp * vec4(p + n * sp.y, 1.0);
	vec3 q = c.xyz / c.w;
	vec2 uv = vec2(q.x * 0.5 + 0.5, 0.5 - q.y * 0.5);
	float z = q.z * 0.5 + 0.5 + sp.x;
	if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0 || z > 1.0) return 1.0;
	float s = 0.0, t = sp.w * max(sp.z, 1.0);
	for (int i = -1; i <= 1; i++) for (int j = -1; j <= 1; j++) s += texture(t_shd, vec3(uv + vec2(float(i), float(j)) * t, z));
	return s / 9.0;
}
void main() {
	clip_test(v_wp);
	int f = int(opt.z + 0.5), k = int(opt.x + 0.5);
	if ((f & 32) != 0 && v_aux.x > 0.5) discard;
	if (k == 4) { o = vec4(0.0); return; }
	if (k == 3) {
		float g = max(gridl(v_wp.xy, xa.x) * 0.45, gridl(v_wp.xy, xa.x * 10.0)) * pow(clamp(1.0 - length(v_wp.xy - xa.zw) / xa.y, 0.0, 1.0), 1.6) * color.a;
		if (g < 0.004) discard;
		o = vec4(color.rgb, g);
		return;
	}
	vec4 base = tint(color, v_col);
	if ((f & 256) != 0) base *= texture(t_map, v_uv);
	if (fea0.x > -0.5) {
		vec2 fv = texture(t_fea, ((mat3(feam[0].xyz, feam[1].xyz, feam[2].xyz) * v_aux.yzw - fea1.xyz) / fea1.w + fea2.w) / fea2.xyz).rg;
		int m = int(fea0.x + 0.5);
		base.rgb = ramp(m == 0 ? fv.r / fea0.y : m == 1 ? fv.g / fea0.y : m == 2 ? 1.0 - min(3.0, fea0.w / max(fv.r, 1e-9)) / 3.0 : m == 3 ? (fv.r - fea0.z) / (fea0.y - fea0.z) : fv.g / fea0.y);
	}
	if (base.a < opt.w) discard;
	if (k == 2) { o = outc(color.rgb, color.a * (1.0 - shadow_at(v_wp, vec3(0.0)))); return; }
	if (k == 1) { o = outc(base.rgb, base.a); return; }
	vec3 V = fwd.w > 0.5 ? -fwd.xyz : normalize(eye.xyz - v_wp);
	vec3 n0 = (f & 16) != 0 ? normalize(cross(dFdx(v_wp), dFdy(v_wp))) : normalize(v_n) * (gl_FrontFacing ? 1.0 : -1.0);
	if ((f & 16) != 0 && dot(n0, V) < 0.0) n0 = -n0;
	vec3 n = n0;
	if ((f & 128) != 0) {
		vec3 q0 = dFdx(v_wp), q1 = dFdy(v_wp);
		vec2 s0 = dFdx(v_uv), s1 = dFdy(v_uv);
		vec3 q1p = cross(q1, n0), q0p = cross(n0, q0);
		vec3 T = q1p * s0.x + q0p * s1.x, B = q1p * s0.y + q0p * s1.y;
		float det = max(dot(T, T), dot(B, B)), sc = det == 0.0 ? 0.0 : inversesqrt(det);
		vec3 mn = texture(t_nrm, v_uv).xyz * 2.0 - 1.0;
		mn.xy *= opt2.xy;
		n = normalize(mat3(T * sc, B * sc, n0) * mn);
	}
	float met = pbr.x, rgh = pbr.y;
	if ((f & 512) != 0) rgh *= texture(t_rgh, v_uv).g;
	if ((f & 1024) != 0) met *= texture(t_mtl, v_uv).b;
	vec3 dxy = max(abs(dFdx(n0)), abs(dFdy(n0)));
	float gr = max(max(dxy.x, dxy.y), dxy.z), r = min(max(rgh, 0.0525) + gr, 1.0), cr = min(max(pbr.w, 0.0525) + gr, 1.0);
	vec3 dc = base.rgb * (1.0 - met), f0 = mix(vec3(0.04), base.rgb, met), dd = vec3(0.0), ds = vec3(0.0), cs = vec3(0.0);
	float sh = (f & 8) != 0 ? shadow_at(v_wp, n0) : 1.0;
	for (int i = 0; i < 4; i++) {
		if (i >= int(cnt.x + 0.5)) break;
		vec3 L = ldir[i].xyz, c = lcol[i].rgb * (ldir[i].w > 0.5 ? sh : 1.0) * clamp(dot(n, L), 0.0, 1.0);
		dd += c * dc / PI;
		ds += c * ggx(L, V, n, f0, r);
		if (pbr.z > 0.0) cs += lcol[i].rgb * (ldir[i].w > 0.5 ? sh : 1.0) * clamp(dot(n0, L), 0.0, 1.0) * ggx(L, V, n0, vec3(0.04), cr);
	}
	for (int i = 0; i < 4; i++) {
		if (i >= int(cnt.y + 0.5)) break;
		vec3 lv = ppos[i].xyz - v_wp, L = normalize(lv);
		float d = length(lv), a = 1.0 / max(pow(d, pcol[i].w), 0.01);
		if (ppos[i].w > 0.0) { float t = clamp(1.0 - pow(d / ppos[i].w, 4.0), 0.0, 1.0); a *= t * t; }
		vec3 c = pcol[i].rgb * a * clamp(dot(n, L), 0.0, 1.0);
		dd += c * dc / PI;
		ds += c * ggx(L, V, n, f0, r);
	}
	dd += (amb.rgb + mix(gnd.rgb, sky.rgb, 0.5 * dot(n, up.xyz) + 0.5)) * dc / PI;
	if (env.x > 0.0) {
		vec3 cwi = envl(n, env.z);
		vec2 ab = dfg(clamp(dot(n, V), 0.0, 1.0), r);
		vec3 fss = f0 * ab.x + ab.y, fav = f0 + (1.0 - f0) * 0.047619;
		float em = 1.0 - ab.x - ab.y;
		vec3 fms = fss * fav / (1.0 - em * fav), tot = fss + fms * em;
		ds += envl(normalize(mix(reflect(-V, n), n, r * r)), r * env.y) * fss + fms * em * cwi;
		dd += dc * (1.0 - max(max(tot.r, tot.g), tot.b)) * cwi;
		if (pbr.z > 0.0) { vec2 cb = dfg(clamp(dot(n0, V), 0.0, 1.0), cr); cs += envl(normalize(mix(reflect(-V, n0), n0, cr * cr)), cr * env.y) * (0.04 * cb.x + cb.y); }
	}
	vec3 ems = emis.rgb;
	if ((f & 2048) != 0) ems *= texture(t_ems, v_uv).rgb;
	vec3 col = dd + ds + ems;
	if (pbr.z > 0.0) col = col * (1.0 - pbr.z * fresnel(vec3(0.04), clamp(dot(n0, V), 0.0, 1.0))) + cs * pbr.z;
	o = outc(col, base.a);
}
