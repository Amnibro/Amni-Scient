layout(set = 1, binding = 0) uniform VView { mat4 view; mat4 proj; vec4 eye; vec4 port; };
layout(set = 1, binding = 1) uniform VDraw { mat4 model; vec4 uvx; vec4 uvy; vec4 dp; vec4 sp; };
vec4 clipz(vec4 c) { c.z = (c.z + c.w) * 0.5; return c; }
