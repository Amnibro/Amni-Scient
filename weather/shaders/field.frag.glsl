precision highp float;
uniform sampler2D fieldTex;
uniform float vmin;
uniform float vmax;
uniform float opacity;
uniform float reverse;
uniform float pal;
varying vec2 vUv;
float clamp01(float x){return clamp(x,0.0,1.0);}
vec3 lerp3(vec3 a,vec3 b,float t){return a+(b-a)*t;}
vec3 pal_thermal(float t){
vec3 s0=vec3(0.05,0.05,0.35);vec3 s1=vec3(0.1,0.25,0.75);vec3 s2=vec3(0.2,0.7,0.95);
vec3 s3=vec3(0.95,0.95,0.55);vec3 s4=vec3(0.95,0.45,0.1);vec3 s5=vec3(0.7,0.05,0.05);
float x=t*5.0;float i=floor(x);float f=x-i;
if(i<1.0)return lerp3(s0,s1,f);if(i<2.0)return lerp3(s1,s2,f);if(i<3.0)return lerp3(s2,s3,f);
if(i<4.0)return lerp3(s3,s4,f);return lerp3(s4,s5,f);
}
vec3 pal_precip(float t){
return mix(mix(vec3(0.05,0.08,0.2),vec3(0.1,0.35,0.75),clamp01(t*2.0)),
mix(vec3(0.2,0.75,0.95),vec3(0.95,0.95,0.98),clamp01(t*2.0-1.0)),step(0.5,t));
}
vec3 pal_jet(float t){
float h=0.66-t*0.66;float h6=fract(h)*6.0;float x=1.0-abs(mod(h6,2.0)-1.0);vec3 c=vec3(1.0,x,0.0);
if(h6>=1.0&&h6<2.0)c=vec3(x,1.0,0.0);else if(h6>=2.0&&h6<3.0)c=vec3(0.0,1.0,x);
else if(h6>=3.0&&h6<4.0)c=vec3(0.0,x,1.0);else if(h6>=4.0&&h6<5.0)c=vec3(x,0.0,1.0);
else if(h6>=5.0)c=vec3(1.0,0.0,x);return c*0.85+0.1;
}
vec3 pal_turbo(float t){
vec3 s0=vec3(0.4,0.05,0.55);vec3 s1=vec3(0.1,0.35,0.85);vec3 s2=vec3(0.1,0.85,0.55);
vec3 s3=vec3(0.95,0.9,0.2);vec3 s4=vec3(0.95,0.25,0.1);
float x=t*4.0;float i=floor(x);float f=x-i;
if(i<1.0)return lerp3(s0,s1,f);if(i<2.0)return lerp3(s1,s2,f);if(i<3.0)return lerp3(s2,s3,f);return lerp3(s3,s4,f);
}
vec3 pal_inferno(float t){
vec3 s0=vec3(0.02,0.02,0.08);vec3 s1=vec3(0.15,0.05,0.45);vec3 s2=vec3(0.7,0.15,0.55);
vec3 s3=vec3(0.95,0.55,0.2);vec3 s4=vec3(1.0,0.95,0.7);
float x=t*4.0;float i=floor(x);float f=x-i;
if(i<1.0)return lerp3(s0,s1,f);if(i<2.0)return lerp3(s1,s2,f);if(i<3.0)return lerp3(s2,s3,f);return lerp3(s3,s4,f);
}
vec3 colorize(float tin){
float t=clamp01(tin);if(reverse>0.5)t=1.0-t;int p=int(pal+0.5);
if(p==1)return pal_precip(t);if(p==2)return pal_jet(t);if(p==5)return pal_turbo(t);
if(p==6)return vec3(t);if(p==7)return pal_inferno(t);return pal_thermal(t);
}
void main(){
float sample=texture2D(fieldTex,vUv).r;
float span=max(abs(vmax-vmin),1e-6);
float t=(sample-vmin)/span;
vec3 rgb=colorize(t);
gl_FragColor=vec4(rgb,opacity);
}
