export const FORM_TEMPLATES=[
{key:'mascot',name:'Mascot',desc:'Rigged character that waves',text:`body capsule 0,0,.55 0,0,1.15 r.38 #7cc4ff
belly ellipsoid 0,-.24,.78 .25,.1,.3 ~.1 #e6f3ff
head sphere 0,0,1.6 r.37 ~.2 #7cc4ff
eyeL sphere .14,-.31,1.68 r.075 #1b2330
smile crease r.1 s.7 -.11,-.35,1.5 0,-.375,1.47 .11,-.35,1.5
earL capsule .19,0,1.88 .32,.03,2.2 r.075 e.035 ~.09 #7cc4ff
armL capsule .36,0,1.13 .72,0,.84 r.09 e.075 ~.1 @armL #7cc4ff
handL sphere .75,0,.8 r.1 ~.05 @armL #7cc4ff
legL capsule .17,0,.36 .19,0,.05 r.13 ~.08 @legL #7cc4ff
footL ellipsoid .2,-.07,.06 .13,.19,.07 ~.05 @legL #5aa8e6
spine bone 0,0,.32 0,0,1.4
head bone 0,0,1.35 0,0,2 ^spine
armL bone .34,0,1.13 .75,0,.8 ^spine
legL bone .17,0,.42 .19,0,0
armL.rot anim 0:0,0,0 .4:0,-80,0 .7:0,-58,0 1:0,-80,0 1.3:0,-58,0 1.7:0,0,0
head.rot anim 0:0,0,0 .85:0,6,0 1.7:0,0,0
spine.rot anim 0:0,0,0 .85:0,3,0 1.7:0,0,0
@mirror x
@len 1.7`},
{key:'fish',name:'Fish',desc:'Swimming fish with a three-bone tail',text:`body ellipsoid 0,0,0 .34,1,.45 #ff9f43
tail ellipsoid 0,.95,0 .18,.38,.3 ~.14 @tail #ff9f43
fin ellipsoid 0,1.38,0 .04,.3,.4 ~.1 @fin #ffc078
dorsal ellipsoid 0,.05,.46 .04,.38,.2 ~.1 #ffc078
finL ellipsoid .33,-.2,-.14 .22,.12,.03 rot0,25,-20 ~.07 #ffc078
eyeL sphere .23,-.62,.13 r.075 #1b2330
mouth crease r.09 s.8 -.09,-.99,-.07 0,-1.01,-.08 .09,-.99,-.07
spine bone 0,-.7,0 0,.6,0
tail bone 0,.6,0 0,1.1,0 ^spine
fin bone 0,1.1,0 0,1.6,0 ^tail
spine.rot anim 0:0,0,4 .5:0,0,-4 1:0,0,4
tail.rot anim 0:0,0,-16 .5:0,0,16 1:0,0,-16
fin.rot anim 0:0,0,0 .25:0,0,24 .75:0,0,-24 1:0,0,0
@mirror x
@len 1`},
{key:'tree',name:'Tree',desc:'Stylized tree swaying in the wind',text:`trunk capsule 0,0,0 0,0,1.55 r.16 e.08 #8b5a2b
rootA capsule 0,0,.12 .32,.05,0 r.08 e.03 ~.08 #8b5a2b
rootB capsule 0,0,.12 -.2,.26,0 r.08 e.03 ~.08 #8b5a2b
rootC capsule 0,0,.12 -.15,-.3,0 r.08 e.03 ~.08 #8b5a2b
branch capsule 0,0,1.05 .45,.05,1.5 r.07 e.04 ~.06 #8b5a2b
leafA sphere 0,0,2 r.5 ~.18 #5cb85c
leafB sphere .45,.1,1.72 r.36 ~.22 #6cc070
leafC sphere -.4,-.15,1.78 r.38 ~.22 #4fae4f
leafD sphere .05,.38,1.78 r.33 ~.22 #5cb85c
trunk bone 0,0,0 0,0,1.2
top bone 0,0,1.2 0,0,2.4 ^trunk
trunk.rot anim 0:0,0,0 1:3,2,0 2:0,0,0
top.rot anim 0:0,0,0 1:6,4,0 2:0,0,0
@len 2`},
{key:'grip',name:'Ergonomic grip',desc:'Sculpted handle with finger grooves',text:`grip capsule 0,0,0 0,0,4 r.55 e.5 #2b3442
capT cyl 0,0,3.9 0,0,4.25 r.72 ~.15 #2b3442
capB cyl 0,0,-.3 0,0,.05 r.68 ~.15 #2b3442
f1 dent r.34 s.55 -.42,-.48,3.25 0,-.6,3.25 .42,-.48,3.25
f2 dent r.34 s.55 -.44,-.5,2.45 0,-.62,2.45 .44,-.5,2.45
f3 dent r.34 s.55 -.45,-.5,1.65 0,-.63,1.65 .45,-.5,1.65
f4 dent r.32 s.5 -.44,-.5,.85 0,-.6,.85 .44,-.5,.85
thumb flatten r.6 s.45 n0,1,0 0,.6,2.6
bore cyl 0,0,-1 0,0,5 r.2 -`},
{key:'vase',name:'Ceramic vase',desc:'Lathe profile, hollow shell, fluting and glaze noise',text:`vase lathe 0,0,0 0,0 1.2,0 1.35,.25 2.1,1.6 2.3,2.6 1.9,4 1.05,5.2 .8,6 1.05,6.75 1.13,6.95 1,7.05 .7,7 0,7 curve sh.24 nz.012:.6 m:ceramic #24557e
mouth cyl 0,0,6.7 0,0,7.4 r.8 - ~.1
flute tube 1.9,0,1.2 2.25,0,2 2.29,0,2.8 2.07,0,3.6 1.9,0,4 r.085 - ~.04 ra20
beads sphere 1.6,0,4.5 r.11 ~.07 ra22 m:ceramic #efe6d2
foot torus 0,0,.06 R1.24 r.08 ~.04 m:ceramic #efe6d2`},
{key:'robot',name:'Robot arm',desc:'Chrome joints, rubber cable and bellows, painted links',text:`base lathe 0,0,0 0,0 1.5,0 1.56,.06 1.56,.3 1.46,.4 0,.4 m:brushed:.38 #a9aeb5
bolt prism 1.24,0,.38 1.24,0,.5 r.09 n6 b.015 ra8 m:chrome
turret cyl 0,0,.4 0,0,1 r.85 ~.06 m:metal:.35 #2d3239
boot torus 0,0,1.06 R.62 r.08 ~.03 a3:0,0,.13 m:rubber
yoke box 0,0,1.5 1.14,.8,.12 r.04 ~.02 m:metal:.3 #e89a2c
plate box .5,0,1.98 .14,.8,1 r.05 ~.04 mx m:metal:.3 #e89a2c
shoulder cyl -.62,0,1.95 .62,0,1.95 r.3 m:chrome
upper capsule 0,0,1.95 0,1.1,3.6 r.24 e.2 ~.04 m:metal:.3 #e89a2c
elbow cyl -.32,1.1,3.6 .32,1.1,3.6 r.26 m:chrome
fore capsule 0,1.1,3.6 0,2.9,3.1 r.17 e.13 ~.04 m:metal:.3 #e89a2c
wrist cyl 0,2.9,3.1 0,3.26,3 r.17 m:chrome
palm box 0,3.38,2.98 .5,.18,.32 r.04 ~.02 m:metal #2d3239
finger box .17,3.68,2.98 .08,.5,.18 r.03 mx m:rubber
cable tube .32,.35,1.25 .45,.6,2.4 .38,1.05,3.3 .34,1.7,3.62 .28,2.45,3.4 .18,2.95,3.25 r.06 m:rubber`},
{key:'ring',name:'Gemstone ring',desc:'Gold band, prong setting and a ring of glass stones',text:`band lathe 0,0,1 .81,0 .82,-.15 .9,-.18 1,-.11 1.04,0 1,.11 .9,.18 .82,.15 .81,0 curve rot90,0,0 m:gold
channel torus 0,0,1 R1.04 r.05 rot90,0,0 - ~.025
pave sphere 0,0,2.03 r.055 ra26y:0,0,1 m:glass
seat cone 0,0,1.9 0,0,2.18 r.16 e.3 ~.04 m:gold
prong capsule .26,0,2.02 .3,0,2.42 r.035 e.025 ~.02 ra6:0,0,0 m:gold
gem lathe 0,0,2.27 0,-.3 .33,-.02 .33,.03 .21,.15 0,.15 n16 m:glass #4f7fe0`},
{key:'tail',name:'Dragon tail',desc:'Tapered spline tube with scaly noise skin, spikes and a twisted blade',text:`tail tube -3.2,-2.6,.62,.62 -2,-2.5,.58,.58 0,-2.5,.57,.57 1.31,-1.83,.48,.48 1.92,-.66,.4,.4 1.75,.52,.33,.33 1.01,1.29,.28,.28 .06,1.47,.24,.24 -.73,1.11,.2,.2 -1.11,.43,.17,.17 -1.04,-.26,.14,.14 -.63,-.74,.12,.12 r.05 nz.03:.16 m:skin #3e6b3c
belly tube -3.2,-2.75,.3,.45 -2,-2.62,.28,.42 0,-2.6,.26,.4 1.25,-1.95,.22,.34 1.82,-.8,.18,.28 r.1 ~.12 nz.01:.08 m:skin #c9b77e
spike1 cone -2.27,-2.51,1.02 -2.56,-2.53,1.55 r.25 ~.09 m:ceramic #e6dcc2
spike2 cone -1.28,-2.52,1.01 -1.56,-2.51,1.53 r.24 ~.08 m:ceramic #e6dcc2
spike3 cone -.34,-2.54,1.01 -.63,-2.56,1.53 r.24 ~.08 m:ceramic #e6dcc2
spike4 cone .48,-2.36,.96 .23,-2.46,1.45 r.23 ~.08 m:ceramic #e6dcc2
spike5 cone 1.25,-1.89,.84 1.07,-2.05,1.28 r.2 ~.07 m:ceramic #e6dcc2
spike6 cone 1.7,-1.28,.76 1.61,-1.47,1.16 r.18 ~.06 m:ceramic #e6dcc2
spike7 cone 1.92,-.66,.7 1.88,-.85,1.06 r.17 ~.06 m:ceramic #e6dcc2
spike8 cone 1.9,.03,.63 1.94,-.14,.96 r.15 ~.05 m:ceramic #e6dcc2
spike9 cone 1.72,.58,.58 1.79,.44,.88 r.14 ~.05 m:ceramic #e6dcc2
spike10 cone 1.43,.97,.54 1.53,.86,.81 r.13 ~.05 m:ceramic #e6dcc2
spike11 cone 1.01,1.29,.49 1.13,1.23,.75 r.12 ~.04 m:ceramic #e6dcc2
spike12 cone .54,1.46,.45 .66,1.43,.68 r.11 ~.04 m:ceramic #e6dcc2
spike13 cone .06,1.47,.41 .18,1.49,.63 r.1 ~.03 m:ceramic #e6dcc2
blade extrude -.18,-1.2,.3 -.75,0 -.3,.36 .38,.28 .8,0 .38,-.28 -.3,-.36 h.13 b.05 curve rot90,-45,0 tw50x ~.08 m:ceramic #e6dcc2`},
{key:'blob',name:'Blob',desc:'One sphere to sculpt from',text:`blob sphere 0,0,.75 r.75`}];
