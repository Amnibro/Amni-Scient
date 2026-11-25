layout(set = 3, binding = 0) uniform ClearU { vec4 rgba; };
layout(location = 0) out vec4 o;
void main() {
	o = rgba;
}
