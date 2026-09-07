import * as T from '../vendor/three.module.js';

function mesh(world,geometry,material,x,y,z){const m=new T.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;world.root.add(m);return m;}
function lines(world,points,color){const m=new T.LineSegments(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color,transparent:true,opacity:.65}));world.root.add(m);}

// Continuous surfaces, modeled glazing and structural detail; no voxel geometry.
function pearlTower(w,x,z){
 const steel=new T.MeshStandardMaterial({color:'#b5b6ac',metalness:.65,roughness:.3});
 const glazing=new T.MeshPhysicalMaterial({color:'#9a5765',metalness:.72,roughness:.16,clearcoat:1,clearcoatRoughness:.12,envMapIntensity:1.5});
 const pods=[[22,5.2],[48,3.7],[58,1.45]];
 for(const [y,r]of pods){const sphere=mesh(w,new T.SphereGeometry(r,64,40),glazing,x,y,z);const points=[];for(let band=-7;band<=7;band++){const a=band*Math.PI/18,rr=Math.cos(a)*r,yy=Math.sin(a)*r;for(let i=0;i<96;i++){const t=i/96*Math.PI*2,t2=(i+1)/96*Math.PI*2;points.push(new T.Vector3(x+Math.cos(t)*rr,y+yy,z+Math.sin(t)*rr),new T.Vector3(x+Math.cos(t2)*rr,y+yy,z+Math.sin(t2)*rr));}}for(let rib=0;rib<32;rib++){const t=rib*Math.PI/16;for(let i=0;i<24;i++){const a=-Math.PI/2+i*Math.PI/24,b=a+Math.PI/24;points.push(new T.Vector3(x+Math.cos(t)*Math.cos(a)*r,y+Math.sin(a)*r,z+Math.sin(t)*Math.cos(a)*r),new T.Vector3(x+Math.cos(t)*Math.cos(b)*r,y+Math.sin(b)*r,z+Math.sin(t)*Math.cos(b)*r));}}lines(w,points,'#c8adb3');sphere.userData.landmark='Oriental Pearl Tower';}
 for(let i=0;i<3;i++){const a=i*Math.PI*2/3;mesh(w,new T.CylinderGeometry(.6,.85,43,24),steel,x+Math.cos(a)*1.15,23,z+Math.sin(a)*1.15);const foot=mesh(w,new T.CylinderGeometry(.5,.9,19,24),steel,x+Math.cos(a)*3,8,z+Math.sin(a)*3);foot.rotation.z=Math.cos(a)*-.2;foot.rotation.x=Math.sin(a)*.2;}
 mesh(w,new T.CylinderGeometry(.18,.4,23,24),steel,x,64,z);w.cylinder(x,1,z,7,2,'#888d8a');
}
function twistedTower(w,x,z,height,radius){
 const rows=70,cols=72,pos=[],uv=[],indices=[],seams=[];
 const point=(r,c)=>{const t=r/rows,a=c/cols*Math.PI*2+t*.9;const roundedTriangle=1+.075*Math.cos(3*a);const radiusAt=radius*(1-.48*Math.pow(t,1.65))*roundedTriangle;return new T.Vector3(x+Math.cos(a)*radiusAt,1+t*height,z+Math.sin(a)*radiusAt);};
 for(let r=0;r<=rows;r++)for(let c=0;c<=cols;c++){const p=point(r,c);pos.push(p.x,p.y,p.z);uv.push(c/cols,r/rows);if(r<rows&&c<cols){const a=r*(cols+1)+c,b=a+cols+1;indices.push(a,b,a+1,b,b+1,a+1);}if(c<cols&&r%2===0)seams.push(p,point(r,c+1));if(r<rows&&c%4===0)seams.push(p,point(r+1,c));}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();
 const m=mesh(w,geo,new T.MeshPhysicalMaterial({color:'#799eaf',metalness:.72,roughness:.15,clearcoat:.7,envMapIntensity:1.3,side:T.DoubleSide}),0,0,0);m.userData.landmark='Shanghai Tower';lines(w,seams,'#b7c1c5');
 w.cylinder(x,1,z,radius*1.12,2,'#9caaa9');
}
function financialCenter(w,x,z){
 w.building(x,z,9,7,76,'#677e8a','modern',false);
 const mat=new T.MeshStandardMaterial({color:'#bac7cf',metalness:.65,roughness:.2});
 const a=mesh(w,new T.BoxGeometry(1.1,11,7),mat,x-3.8,81.5,z),b=mesh(w,new T.BoxGeometry(1.1,11,7),mat,x+3.8,81.5,z);a.rotation.z=-.09;b.rotation.z=.09;mesh(w,new T.BoxGeometry(9.7,1.2,7),mat,x,87,z);
}
export function buildPudongSkyline(w){
 // The far shore supports the buildings and provides a continuous reflected skyline.
 w.box(172,-.7,-35,164,1.4,330,'#737d77');w.box(91,.7,-35,1.5,1.4,330,'#7b8582');
 const random=w.random;for(let i=0;i<38;i++){const x=108+random()*100,z=-165+random()*260;const h=8+random()*32;w.building(x,z,5+random()*9,8+random()*5,h,['#6a8490','#677e8a','#879da6','#9aa7a9'][i%4],'modern',false);}
 pearlTower(w,109,-50);twistedTower(w,149,-100,100,8.2);financialCenter(w,170,-119);
 // Jin Mao's setbacks and slender crown.
 for(let i=0;i<12;i++){const width=9.5-i*.58;w.box(132,3+i*4.7,-108,width,4.7,width,'#8e9da3');w.box(132,5.1+i*4.7,-108,width+.35,.25,width+.35,'#b3bec2');}
 w.add('cone',132,61,-108,2.1,9,2.1,'#a6b4b9');w.cylinder(132,68,-108,.12,10,'#c3ced1');
 for(let z=-150;z<130;z+=15){w.cylinder(96,2.5,z,.12,5,'#515a54');w.sphere(96,5.5,z,2,2.6,2,'#4f6a45');}
}
