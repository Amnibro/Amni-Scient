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
{key:'blob',name:'Blob',desc:'One sphere to sculpt from',text:`blob sphere 0,0,.75 r.75`}];
