import * as T from '../vendor/three.module.js';

function mesh(world,geometry,material,x,y,z){const m=new T.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;world.root.add(m);return m;}
function lines(world,points,color){const m=new T.LineSegments(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color,transparent:true,opacity:.27}));world.root.add(m);}

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
 const rows=118,cols=96,pos=[],uv=[],indices=[],seams=[];
 const point=(r,c)=>{const t=r/rows,theta=c/cols*Math.PI*2,a=theta+t*Math.PI*2/3;const roundedTriangle=1+.12*Math.cos(3*theta);const radiusAt=radius*(1-.47*Math.pow(t,1.3))*roundedTriangle;const crown=Math.max(0,(t-.94)/.06)*2.3*Math.cos(theta-.4);return new T.Vector3(x+Math.cos(a)*radiusAt,1+t*height+crown,z+Math.sin(a)*radiusAt);};
 for(let r=0;r<=rows;r++)for(let c=0;c<=cols;c++){const p=point(r,c);pos.push(p.x,p.y,p.z);uv.push(c/cols,r/rows);if(r<rows&&c<cols){const a=r*(cols+1)+c,b=a+cols+1;indices.push(a,b,a+1,b,b+1,a+1);}if(c<cols&&r%1===0)seams.push(p,point(r,c+1));if(r<rows&&c%3===0)seams.push(p,point(r+1,c));}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();
 const m=mesh(w,geo,new T.MeshPhysicalMaterial({color:'#7696a0',metalness:.76,roughness:.22,clearcoat:.5,envMapIntensity:1.45,side:T.DoubleSide}),0,0,0);m.userData.landmark='Shanghai Tower';lines(w,seams,'#b7c1c5');
 w.cylinder(x,1,z,radius*1.15,2,'#9caaa9');mesh(w,new T.CylinderGeometry(radius*.38,radius*.44,10,64),new T.MeshStandardMaterial({color:'#3c535c',metalness:.65,roughness:.3}),x,height-6,z);w.landmarks.push('Shanghai Tower');
}
function financialCenter(w,x,z){
 const material=new T.MeshPhysicalMaterial({color:'#6e8e9d',metalness:.78,roughness:.24,clearcoat:.45}),trim=new T.MeshStandardMaterial({color:'#bfc9ce',metalness:.8,roughness:.24});
 // Tapered shaft and a real trapezoidal opening, open through both broad faces.
 const shape=new T.Shape();shape.moveTo(-6,0);shape.lineTo(6,0);shape.lineTo(4.2,87);shape.lineTo(-4.2,87);shape.closePath();const hole=new T.Path();hole.moveTo(-2.65,77.5);hole.lineTo(-3.08,84.8);hole.lineTo(3.08,84.8);hole.lineTo(2.65,77.5);hole.closePath();shape.holes.push(hole);
 mesh(w,new T.ExtrudeGeometry(shape,{depth:6.7,bevelEnabled:true,bevelSize:.06,bevelThickness:.06,bevelSegments:1,steps:1}),material,x,0,z-3.35);
 const p=[];for(let y=1;y<76;y+=.8){const half=6-1.8*y/87;p.push(new T.Vector3(x-half,y,z+3.42),new T.Vector3(x+half,y,z+3.42),new T.Vector3(x-half,y,z-3.42),new T.Vector3(x+half,y,z-3.42));}for(let i=-5;i<=5;i++){const xx=i; p.push(new T.Vector3(x+xx,0,z+3.43),new T.Vector3(x+xx*.74,76,z+3.43));}lines(w,p,'#afbec5');
 for(const sign of [-1,1]){const beam=mesh(w,new T.BoxGeometry(.23,86,6.85),trim,x+sign*5.1,43,z);beam.rotation.z=sign*.0207;}
 w.box(x,.8,z,15,1.6,11,'#aeb8b4');w.landmarks.push('Shanghai World Financial Center');
}
function jinMao(w,x,z){
 const steel=new T.MeshStandardMaterial({color:'#99a6ab',metalness:.64,roughness:.34});
 for(let i=0;i<18;i++){const radius=6.5*Math.pow(1-i/23,.72),y=i*3.2;mesh(w,new T.CylinderGeometry(radius*.97,radius,3.25,8),steel,x,y+1.6,z).rotation.y=Math.PI/8;mesh(w,new T.CylinderGeometry(radius*1.055,radius*1.055,.18,8),steel,x,y+3.1,z).rotation.y=Math.PI/8;for(let k=0;k<8;k++){const a=k*Math.PI/4;w.box(x+Math.cos(a)*radius*.91,y+1.5,z+Math.sin(a)*radius*.91,.2,3,.2,'#c7ced0');}}
 for(let i=0;i<5;i++)mesh(w,new T.CylinderGeometry(2.1-i*.35,2.5-i*.35,2,8),steel,x,59+i*2,z).rotation.y=Math.PI/8;w.cylinder(x,72,z,.12,9,'#c3ced1');w.landmarks.push('Jin Mao Tower');
}
function riversidePodium(w,x,z,width,depth,h){w.building(x,z,width,depth,h,'#a8aeac','modern',false);for(let u=-width/2;u<=width/2;u+=1.2)w.box(x+u,h*.5,z+depth/2+.1,.12,h,.2,'#c1c4bc');w.box(x,h+.15,z,width+1,.3,depth+1,'#c2c4b9');}
export function buildPudongSkyline(w){
 // The far shore supports the buildings and provides a continuous reflected skyline.
 w.box(172,-.7,-35,164,1.4,430,'#737d77');w.box(91,.7,-35,1.5,1.4,430,'#7b8582');
 // Buildings sit in blocks around the landmark cluster, with lower riverfront podiums.
 const random=w.random;for(let ix=0;ix<6;ix++)for(let iz=0;iz<10;iz++){const x=112+ix*24,z=-207+iz*35;if(Math.hypot(x-149,z+90)<45||Math.hypot(x-109,z+7)<22||Math.hypot(x-158,z+150)<28)continue;const height=ix===0?10+random()*15:18+random()*31;w.building(x,z,9+random()*8,10+random()*7,height,['#697f8a','#657c88','#8b969c','#a0a6a4'][iz%4],'modern',false);if(iz%3===0)w.box(x,height+.7,z,5,1.4,5,'#8e989a');}
 pearlTower(w,109,-7);w.landmarks.push('Oriental Pearl Tower');twistedTower(w,149,-88,100,8.2);financialCenter(w,174,-146);jinMao(w,137,-160);
 for(const [x,z,ww,dd,h]of [[111,2,20,22,8],[114,-93,18,20,13],[151,-38,25,17,15],[187,-71,20,19,19],[139,42,22,20,11]])riversidePodium(w,x,z,ww,dd,h);
 // IFC-style twin glazed towers and a rounded riverfront tower enrich the silhouette.
 for(const [x,z,h]of [[144,-3,40],[169,8,44]]){w.building(x,z,10,11,h,'#80949c','modern',false);w.box(x,h+.3,z,10.5,.6,11.5,'#aebabb');}
 mesh(w,new T.CylinderGeometry(4.5,5,28,48),new T.MeshPhysicalMaterial({color:'#889ea3',metalness:.72,roughness:.24}),108,14,57);for(let y=1;y<29;y+=.7)mesh(w,new T.TorusGeometry(4.85,.035,4,48),w.mat('#bcc5c4'),108,y,57).rotation.x=Math.PI/2;
 for(const z of [-178,-143,-8,27,92])w.box(171,.035,z,150,.05,5,'#555f61');for(const x of [126,198,222])w.box(x,.04,-30,5,.05,330,'#555f61');
}
