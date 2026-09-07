import * as T from '../vendor/three.module.js';

// Reference-informed districts at game scale; these are not imported GIS models.
function block(w,x,z,width,depth,h,variant=0){
 const palette=['#bcb4a4','#9eaaa9','#b7b9b0','#a9917a','#95a4ad'];
 w.building(x,z,width,depth,h,palette[variant%palette.length],h>18?'modern':'classic',false);
 // Window rhythm continues around the block, including faces seen from campus.
 for(let y=2.8;y<h-1;y+=3){for(let u=-width/2+1.5;u<width/2-1;u+=2.7)w.box(x+u,y,z-depth/2-.035,1.1,1.6,.05,'#61747c');for(const side of [-1,1])for(let v=-depth/2+1.5;v<depth/2-1;v+=2.7)w.box(x+side*(width/2+.035),y,z+v,.05,1.6,1.1,'#61747c');}
 if(variant%3===0){w.box(x+width*.2,h+1,z-depth*.15,width*.3,2,depth*.4,'#838d8e');w.box(x-width*.3,h+.35,z+depth*.2,width*.18,.7,depth*.2,'#a6abab');}
 else if(variant%3===1){for(const side of [-1,1])w.box(x+side*(width/2-.15),h+.45,z,.25,.9,depth,'#a9aaa2');}
}
function district(w,{x,z,cols,rows,spacing=24,low=false}){
 w.box(x+(cols-1)*spacing/2,-.15,z+(rows-1)*spacing/2,cols*spacing,.28,rows*spacing,'#9fa396');
 for(let col=0;col<cols;col++)for(let row=0;row<rows;row++){const i=col*rows+row,xx=x+col*spacing,zz=z+row*spacing;block(w,xx,zz,12+i%3*2,14+i%2*3,low?5+i%4*2:9+i%5*5,i);if(i%3===0)w.tree(xx+9,zz+8,.6);}
 for(let col=0;col<=cols;col++){const xx=x-spacing*.5+col*spacing;w.box(xx,.015,z+(rows-1)*spacing/2,5,.025,rows*spacing,'#535d60');for(let zz=z-spacing*.4;zz<z+(rows-.5)*spacing;zz+=6)w.box(xx,.035,zz,.08,.013,2,'#d3cdb5');}
 for(let row=0;row<=rows;row++)w.box(x+(cols-1)*spacing/2,.02,z-spacing*.5+row*spacing,cols*spacing,.026,5,'#535d60');
}
function hill(w,x,z,width,depth,h,color){
 const geo=new T.PlaneGeometry(width,depth,48,24);geo.rotateX(-Math.PI/2);const p=geo.attributes.position;for(let i=0;i<p.count;i++){const xx=p.getX(i),zz=p.getZ(i),edge=Math.max(0,1-(xx/(width/2))**2)*Math.max(0,1-(zz/(depth/2))**2);p.setY(i,edge*(h+Math.sin(xx*.035)*h*.2+Math.sin(zz*.045+xx*.02)*h*.17)-.2);}geo.computeVertexNormals();const m=new T.Mesh(geo,new T.MeshStandardMaterial({color,roughness:1}));m.position.set(x,0,z);m.receiveShadow=true;w.root.add(m);
}
function meadow(w){
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute([-.04,0,0,.04,0,0,.015,.2,.025,0,0,-.04,0,0,.04,-.025,.16,.015],3));geo.computeVertexNormals();const mat=new T.MeshStandardMaterial({color:'#77934f',roughness:1,side:T.DoubleSide});const count=2600,mesh=new T.InstancedMesh(geo,mat,count),dummy=new T.Object3D();
 for(let i=0;i<count;i++){const x=(i%2?1:-1)*(6.4+w.random()*19),rawZ=-29+w.random()*57,z=rawZ>8&&rawZ<20?rawZ-13:rawZ;dummy.position.set(x,.014,z);dummy.rotation.y=w.random()*Math.PI;dummy.scale.setScalar(.55+w.random()*.7);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);mesh.setColorAt(i,new T.Color().setHSL(.22+w.random()*.035,.28,.24+w.random()*.14));}mesh.receiveShadow=true;w.root.add(mesh);
}
function salesforce(w,x,z){
 const height=84,profile=[];for(let i=0;i<=48;i++){const t=i/48,r=7.5*(1-.15*t)*Math.sqrt(Math.max(.001,1-Math.pow(Math.max(0,(t-.7)/.3),2)));profile.push(new T.Vector2(r,t*height));}
 const glass=new T.MeshPhysicalMaterial({color:'#7294a6',metalness:.73,roughness:.24,clearcoat:.4}),m=new T.Mesh(new T.LatheGeometry(profile,64),glass);m.position.set(x,0,z);m.castShadow=true;w.root.add(m);const points=[];
 for(let i=0;i<profile.length;i++){const p=profile[i];for(let k=0;k<64;k++){const a=k/64*Math.PI*2,b=(k+1)/64*Math.PI*2;points.push(new T.Vector3(x+Math.cos(a)*(p.x+.025),p.y,z+Math.sin(a)*(p.x+.025)),new T.Vector3(x+Math.cos(b)*(p.x+.025),p.y,z+Math.sin(b)*(p.x+.025)));}}
 for(let k=0;k<32;k++){const a=k/32*Math.PI*2;for(let i=0;i<profile.length-1;i++){const p=profile[i],q=profile[i+1];points.push(new T.Vector3(x+Math.cos(a)*p.x,p.y,z+Math.sin(a)*p.x),new T.Vector3(x+Math.cos(a)*q.x,q.y,z+Math.sin(a)*q.x));}}
 w.root.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:'#bbc7cb',transparent:true,opacity:.6})));w.landmarks.push('Salesforce Tower');
}
function transamerica(w,x,z){
 const h=65,shape=new T.ConeGeometry(10,h,4,1);shape.rotateY(Math.PI/4);const m=new T.Mesh(shape,new T.MeshStandardMaterial({color:'#d6d5cc',roughness:.64,metalness:.12}));m.position.set(x,h/2,z);m.castShadow=true;w.root.add(m);
 for(let y=3;y<52;y+=1.7){const half=7.07*(1-y/h);for(const side of [-1,1]){w.box(x,y,z+side*(half+.03),Math.max(.2,half*2-.2),.28,.03,'#626f73');w.box(x+side*(half+.03),y,z,.03,.28,Math.max(.2,half*2-.2),'#626f73');}}
 for(const side of [-1,1])w.box(x+side*4.1,22,z,1.8,20,3,'#d4d4ca');w.cylinder(x,67,z,.085,6,'#b8bdbe');w.landmarks.push('Transamerica Pyramid');
}
export function buildBayAreaContext(w,place){
 if(place==='berkeley'){
  district(w,{x:-146,z:-57,cols:3,rows:7,spacing:25});district(w,{x:-50,z:87,cols:6,rows:3,spacing:25,low:true});
  hill(w,0,-153,320,130,29,'#647856');hill(w,100,-179,280,130,37,'#5c7358');
  for(let i=0;i<26;i++)w.tree(-104+i*8,-83-(i%4)*8,.85+(i%3)*.25);meadow(w);w.landmarks.push('Downtown Berkeley district','Berkeley Hills');
 }else if(place==='sanfrancisco'){
  district(w,{x:-174,z:-157,cols:4,rows:9,spacing:28});salesforce(w,-79,-99);transamerica(w,-48,-147);hill(w,-250,-100,250,350,22,'#7a8978');
  for(const [x,z,h]of [[-105,-59,48],[-95,-155,37],[-143,-195,52],[-59,-192,42]])block(w,x,z,14,17,h,1);
  w.landmarks.push('Financial District');
 }else if(place==='oakland'){
  district(w,{x:-129,z:-86,cols:3,rows:7,spacing:27});district(w,{x:75,z:-90,cols:3,rows:7,spacing:27});hill(w,85,-220,420,170,30,'#7c8971');w.landmarks.push('East Bay street grid');
 }else if(place==='redwood'){
  district(w,{x:-110,z:-80,cols:3,rows:7,spacing:25,low:true});hill(w,-190,-115,220,330,25,'#80906c');w.landmarks.push('Peninsula neighborhoods');
 }
}
