layout(set = 3, binding = 0) uniform FDraw { vec4 color; vec4 emis; vec4 pbr; vec4 opt; vec4 opt2; vec4 xa; vec4 cl; vec4 clip[4]; vec4 fea0; vec4 fea1; vec4 fea2; mat4 feam; };
layout(set = 3, binding = 1) uniform FView { vec4 amb; vec4 sky; vec4 gnd; vec4 up; vec4 ldir[4]; vec4 lcol[4]; vec4 ppos[4]; vec4 pcol[4]; vec4 env; vec4 cnt; mat4 svp; vec4 sp; vec4 eye; vec4 fwd; };
layout(location = 0) out vec4 o;
void clip_test(vec3 p) {
	int n = int(cl.x + 0.5);
	if (n == 0) return;
	bool all = true;
	for (int i = 0; i < 4; i++) {
		if (i >= n) break;
		bool out_ = dot(clip[i].xyz, p) + clip[i].w < 0.0;
		if (cl.y < 0.5 && out_) discard;
		if (!out_) all = false;
	}
	if (cl.y > 0.5 && all) discard;
}
vec3 aces(vec3 c) {
	c *= env.w / 0.6;
	c = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777)) * c;
	c = (c * (c + 0.0245786) - 0.000090537) / (c * (0.983729 * c + 0.4329510) + 0.238081);
	return clamp(mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602)) * c, 0.0, 1.0);
}
vec3 srgb(vec3 c) { return mix(pow(c, vec3(0.41666)) * 1.055 - 0.055, c * 12.92, step(c, vec3(0.0031308))); }
vec4 outc(vec3 c, float a) {
	int f = int(opt.z + 0.5);
	if ((f & 4) != 0) return vec4(c, a);
	if ((f & 2) != 0 && cnt.w > 0.5) c = aces(c);
	return vec4(srgb(max(c, vec3(0.0))), (f & 1) != 0 ? a : 1.0);
}
vec4 tint(vec4 c, vec4 vc) { int k = int(opt.y + 0.5); return k == 1 ? vec4(c.rgb * vc.rgb, c.a) : k == 2 ? c * vc : c; }
