#include "view.glsl"
layout(location = 0) in vec3 a_p0;
layout(location = 1) in vec3 a_p1;
layout(location = 2) in vec4 a_c0;
layout(location = 3) in vec4 a_c1;
layout(location = 4) in vec2 a_d;
layout(location = 0) out vec4 v_col;
layout(location = 1) out vec3 v_wp;
layout(location = 2) out float v_dist;
void main() {
	int c = gl_VertexIndex;
	float e = (c == 1 || c == 2 || c == 4) ? 1.0 : 0.0, s = (c == 2 || c == 4 || c == 5) ? 1.0 : -1.0;
	vec4 w0 = model * vec4(a_p0, 1.0), w1 = model * vec4(a_p1, 1.0), e0 = view * w0, e1 = view * w1;
	if (port.w < 0.5) {
		float ne = -0.5 * proj[3][2] / proj[2][2];
		if (e0.z > ne && e1.z <= ne) e0.xyz = mix(e0.xyz, e1.xyz, (ne - e0.z) / (e1.z - e0.z));
		else if (e1.z > ne && e0.z <= ne) e1.xyz = mix(e1.xyz, e0.xyz, (ne - e1.z) / (e0.z - e1.z));
	}
	vec4 c0 = proj * e0, c1 = proj * e1;
	vec2 d = (c1.xy / c1.w - c0.xy / c0.w) * port.xy;
	d = dot(d, d) > 1e-12 ? normalize(d) : vec2(1.0, 0.0);
	float hw = max(dp.y, 1.0) * 0.5;
	vec4 cc = e > 0.5 ? c1 : c0;
	cc.xy += (vec2(-d.y, d.x) * s + d * (e * 2.0 - 1.0)) * hw * 2.0 / port.xy * cc.w;
	gl_Position = clipz(cc);
	v_col = mix(a_c0, a_c1, e);
	v_dist = mix(a_d.x, a_d.y, e);
	v_wp = mix(w0.xyz, w1.xyz, e);
}
