#include "view.glsl"
layout(location = 0) in vec3 a_pos;
layout(location = 1) in vec4 a_col;
layout(location = 2) in float a_size;
layout(location = 0) out vec4 v_col;
layout(location = 1) out vec3 v_wp;
layout(location = 2) out vec2 v_uv;
void main() {
	int c = gl_VertexIndex;
	vec2 q = vec2((c == 1 || c == 2 || c == 4) ? 1.0 : -1.0, (c == 2 || c == 4 || c == 5) ? 1.0 : -1.0);
	vec2 u0 = q * 0.5 + 0.5;
	v_uv = vec2(dot(uvx.xyz, vec3(u0, 1.0)), dot(uvy.xyz, vec3(u0, 1.0)));
	v_col = a_col;
	if (sp.x > 0.5) {
		vec4 mv = view * (model * vec4(0.0, 0.0, 0.0, 1.0));
		vec2 sc = vec2(length(model[0].xyz), length(model[1].xyz));
		if (dp.w < 0.5 && port.w < 0.5) sc *= -mv.z;
		vec2 a = (q * 0.5 - (sp.yz - 0.5)) * sc;
		mv.xy += vec2(cos(sp.w) * a.x - sin(sp.w) * a.y, sin(sp.w) * a.x + cos(sp.w) * a.y);
		vec3 mq = mv.xyz - view[3].xyz;
		v_wp = vec3(dot(view[0].xyz, mq), dot(view[1].xyz, mq), dot(view[2].xyz, mq));
		gl_Position = clipz(proj * mv);
		return;
	}
	vec4 w = model * vec4(a_pos, 1.0), mv = view * w, cc = proj * mv;
	float s = dp.z * a_size;
	if (dp.w > 0.5 && port.w < 0.5) s *= port.y / port.z * 0.5 / -mv.z;
	cc.xy += q * s / port.xy * cc.w;
	v_wp = w.xyz;
	gl_Position = clipz(cc);
}
