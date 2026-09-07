import * as T from '../vendor/three.module.js';
import {transitMaterials} from './metro.js';

function brace(w,a,b,r=.08){const start=new T.Vector3(...a),end=new T.Vector3(...b),mesh=new T.Mesh(new T.CylinderGeometry(r,r,start.distanceTo(end),10),w.mat('metro-steel'));mesh.position.copy(start).add(end).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),end.sub(start).normalize());mesh.castShadow=true;w.root.add(mesh);}
export function buildPudongTerminal(w){
 transitMaterials(w);w.sceneKind='airport-terminal';w.bounds=[-27,27,-65,60];w.landmarks=['Pudong terminal roof','Glass departure hall','Jetways'];
 w.box(0,-.15,-10,64,.3,150,'metro-stone');
 const floor=new T.Mesh(new T.PlaneGeometry(60,150),w.mat('metro-floor'));floor.rotation.x=-Math.PI/2;floor.position.set(0,.01,-10);const uv=floor.geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*40,uv.getY(i)*100);floor.receiveShadow=true;w.root.add(floor);
 for(const x of [-8,8])w.box(x,.02,-10,.13,.01,140,'metro-steel');
 // Long-span, gently curved roof panels and exposed branching steelwork.
 const height=x=>12+4.7*Math.cos(x/33*Math.PI*.5);
 for(const side of [-1,1]){const verts=[];for(let i=0;i<24;i++){const a=side*(2+i*31/24),b=side*(2+(i+1)*31/24);verts.push(a,height(a),-85,b,height(b),-85,a,height(a),66,b,height(b),-85,b,height(b),66,a,height(a),66);}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.computeVertexNormals();const mat=new T.MeshStandardMaterial({color:'#d7e0df',roughness:.52,metalness:.22,side:T.DoubleSide});w.root.add(new T.Mesh(geo,mat));}
 for(let z=-78;z<=60;z+=10){for(const x of [-23,23]){w.cylinder(x,5.2,z,.19,10.4,'metro-steel');brace(w,[x,8,z],[x-6,height(x-6)-.3,z],.11);brace(w,[x,8,z],[x+6,height(x+6)-.3,z],.11);}for(let x=-32;x<32;x+=2){brace(w,[x,height(x)-.3,z],[x+2,height(x+2)-.3,z],.1);brace(w,[x,height(x)-.9,z],[x+2,height(x+2)-.9,z],.055);brace(w,[x,height(x)-.3,z],[x+2,height(x+2)-.9,z],.045);}w.box(0,16.78,z,4,.04,.11,'metro-steel');}
 for(const side of [-1,1]){const x=side*30;for(let z=-80;z<65;z+=3){w.box(x,5.5,z,.045,11,2.94,'metro-window');w.box(x,5.5,z-1.5,.12,11,.12,'metro-steel');}for(const y of [2,5,8,11])w.box(x,y,-10,.13,.1,150,'metro-steel');}
 for(const z of [-55,-20,15,50]){const light=new T.RectAreaLight('#f6f4eb',5,42,8);light.position.set(0,10,z);light.lookAt(0,0,z);w.root.add(light);const bounce=new T.RectAreaLight('#f3f1df',3,36,8);bounce.position.set(0,9,z);bounce.lookAt(0,17,z);w.root.add(bounce);}
 // Gate lounges, departure desks and visible aircraft beyond the glazing.
 for(let z=-50;z<=40;z+=18){for(const side of [-1,1])for(let row=0;row<2;row++){for(let i=0;i<5;i++){const x=side*(13+i*.8);w.add('metroRounded',x,.48,z+row*2.5,.69,.15,.62,'metro-seat');w.add('metroRounded',x,.88,z+row*2.5-.25,.69,.68,.1,'metro-seat');w.box(x,.24,z+row*2.5,.08,.48,.4,'metro-steel');}w.colliders.push([side>0?12.5:-16.8,side>0?16.8:-12.5,z+row*2.5-.65,z+row*2.5+.5]);}}
 w.box(0,.58,-31,9,1.16,1,'metro-ivory');w.box(0,1.2,-31,9.4,.12,1.2,'metro-steel');for(const x of [-3,0,3])w.box(x,1.52,-31,.65,.52,.08,'metro-black');w.label('GATE 08  /  SAN FRANCISCO',0,4.2,-32,9,'#152126','#f4f4ef');w.colliders.push([-4.8,4.8,-31.6,-30.4]);
 for(const side of [-1,1]){w.box(side*10,.6,10,4,1.2,1.6,'metro-ivory');w.box(side*10,1.26,10,4.2,.12,1.7,'metro-steel');for(const x of [side*10-1,side*10+1])w.box(x,1.62,10,.65,.6,.1,'metro-black');w.colliders.push([side*10-2.2,side*10+2.2,9,11]);w.box(side*20,.65,21,2,1.3,2,'metro-ivory');w.tree(side*20,21,.65);}
 w.label('浦东国际机场  SHANGHAI PUDONG',0,7,-63,16,'#253c46','#ffffff');
 w.box(0,2.5,62,58,5,.2,'metro-window');w.label('↑  DEPARTURES  /  国际出发',0,4.5,34,7,'#182e39','#f5f5ee');
 for(const z of [-42,5,45]){w.box(39,3.1,z,18,2.8,3.2,'metro-ivory');w.box(39,3.3,z+1.63,17,1.65,.025,'metro-window');for(let x=31;x<48;x+=1.5)w.box(x,3.3,z+1.66,.09,2,.07,'metro-steel');w.cylinder(44,1.5,z,.35,3,'metro-steel');w.airplane(57,z-10);}
 w.box(95,-.3,-15,130,.2,250,'#919a9b');for(let z=-100;z<100;z+=10)w.box(75,-.18,z,.18,.015,6,'#e1ce7e');
}
