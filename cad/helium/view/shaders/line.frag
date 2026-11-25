#include "frag.glsl"
layout(location = 0) in vec4 v_col;
layout(location = 1) in vec3 v_wp;
layout(location = 2) in float v_dist;
void main() {
	clip_test(v_wp);
	if ((int(opt.z + 0.5) & 64) != 0 && mod(v_dist * xa.z, xa.x + xa.y) > xa.x) discard;
	vec4 c = tint(color, v_col);
	if (c.a < opt.w) discard;
	o = outc(c.rgb, c.a);
}
