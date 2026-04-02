#include<cmath>
#include<vector>
#include<emscripten/emscripten.h>
extern "C"{
EMSCRIPTEN_KEEPALIVE void step_master_equation(float*v,float*p,float*m,float*s,float*c,float*R,int N,float dt,float*k,float*eps,float*Reff){
for(int i=0;i<N;++i){
float sigma_ATR=(i>0)?std::abs(p[i]-p[i-1]):0.1f;m[i]=(sigma_ATR!=0.0f)?1.0f/sigma_ATR:10.0f;float F_PID=0.5f;float dv_dp=(i>0&&p[i]!=p[i-1])?(v[i]-v[i-1])/(p[i]-p[i-1]):0.0f;float std_rN=(i>0)?std::abs(v[i]-v[i-1]):0.1f;float mean_rN=(i>0)?(v[i]+v[i-1])*0.5f:0.1f;s[i]=(mean_rN!=0.0f)?std::max(0.0f,1.0f-std_rN/mean_rN):1.0f;c[i]=(i>1)?(p[i]-2.0f*p[i-1]+p[i-2])/(dt*dt):0.0f;float div_M=(i>0)?(m[i]*v[i]-m[i-1]*v[i-1]):0.0f;k[i]=std::max(0.0f,(1.0f-s[i])*div_M);eps[i]=(s[i]>0.05f)?std::max(0.01f,std::abs(c[i])*(1.0f-s[i])/s[i]):std::max(0.01f,std::abs(c[i])*(1.0f-s[i])/0.05f);float nu_t=0.09f*(k[i]*k[i])/eps[i];Reff[i]=R[i]+nu_t;float dReff_dp=(i>0&&p[i]!=p[i-1])?(Reff[i]-Reff[i-1])/(p[i]-p[i-1]):0.0f;float dv_dt=(F_PID/m[i])+v[i]*dv_dp-s[i]*c[i]-dReff_dp;v[i]+=dv_dt*dt;p[i]+=v[i]*dt;}}
}