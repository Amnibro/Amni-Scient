#include "frag.glsl"
layout(set = 2, binding = 0) uniform sampler2D t_map;
layout(location = 0) in vec4 v_col;
layout(location = 1) in vec3 v_wp;
layout(location = 2) in vec2 v_uv;
void main() {
	clip_test(v_wp);
	vec4 c = tint(color, v_col);
	if ((int(opt.z + 0.5) & 256) != 0) c *= texture(t_map, v_uv);
	if (c.a < opt.w) discard;
	o = outc(c.rgb, c.a);
}
