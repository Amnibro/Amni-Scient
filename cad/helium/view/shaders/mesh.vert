#include "view.glsl"
layout(location = 0) in vec3 a_pos;
layout(location = 1) in vec3 a_nrm;
layout(location = 2) in vec2 a_uv;
layout(location = 3) in vec4 a_col;
layout(location = 4) in vec4 a_aux;
layout(location = 0) out vec3 v_wp;
layout(location = 1) out vec3 v_n;
layout(location = 2) out vec2 v_uv;
layout(location = 3) out vec4 v_col;
layout(location = 4) out vec4 v_aux;
void main() {
	vec3 p = a_pos + (dp.x != 0.0 && dot(a_nrm, a_nrm) > 0.0 ? normalize(a_nrm) * dp.x : vec3(0.0));
	vec4 w = model * vec4(p, 1.0);
	v_wp = w.xyz;
	vec3 m0 = model[0].xyz, m1 = model[1].xyz, m2 = model[2].xyz;
	v_n = (cross(m1, m2) * a_nrm.x + cross(m2, m0) * a_nrm.y + cross(m0, m1) * a_nrm.z) * (dot(m0, cross(m1, m2)) < 0.0 ? -1.0 : 1.0);
	v_uv = vec2(dot(uvx.xyz, vec3(a_uv, 1.0)), dot(uvy.xyz, vec3(a_uv, 1.0)));
	v_col = a_col;
	v_aux = a_aux;
	gl_Position = clipz(proj * (view * w));
}
