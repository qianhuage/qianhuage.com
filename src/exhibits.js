import * as T from '../vendor/three.module.js';
import {stationArchitecture,metroWallAd} from './metro.js';
import {projectPosition} from './journey.js';

function artwork(w,p,x,y,z,width,height,rx=0){const texture=new T.TextureLoader().load(p.img);texture.colorSpace=T.SRGBColorSpace;const mesh=new T.Mesh(new T.PlaneGeometry(width,height),new T.MeshStandardMaterial({map:texture,roughness:.65,emissive:'#ffffff',emissiveMap:texture,emissiveIntensity:.12}));mesh.position.set(x,y,z);mesh.rotation.x=rx;w.root.add(mesh);}
export function exhibitPosition(stop,index,zone){if(stop.id==='shanghai'&&zone==='metro')return [-6.6,8];if(stop.id==='berkeley')return [index%2===0?-9:9,-1-Math.floor(index/2)*12];return projectPosition(index);}
export function buildExhibit(w,p,index){
 const [x,z]=exhibitPosition(w.stop,index,w.zone);let style;
 if(w.zone==='metro'){
  metroWallAd(w,p);return;
 }else if(w.stop.id==='berkeley'){
  style='campus-booth';for(const xx of [x-2.2,x+2.2])for(const zz of [z-1.4,z+1.4])w.cylinder(xx,1.65,zz,.04,3.3,'#c5c6c0');
  w.box(x,3.26,z,4.7,.16,3.4,'#f0eee4');w.box(x,3.02,z+1.7,4.7,.35,.07,'#192e46');w.label(p.title,x,3.04,z+1.75,3.8,'#192e46','#ffffff');
  w.box(x,.7,z+.35,3.8,1.4,.8,'#e9e6dd');artwork(w,p,x,1,z+.765,3.5,1.02);
  w.box(x,1.45,z+.3,4.1,.09,1.1,'#eae7df');for(const xx of [x-.95,x+.95]){w.box(xx,1.79,z+.2,.6,.6,.045,'#2c3033');w.box(xx,1.49,z+.3,.65,.04,.38,'#505457');}
  w.colliders.push([x-2.1,x+2.1,z-.2,z+.85]);
 }else if(w.stop.id==='oakland'){
  style='transit-shelter';w.box(x,2.9,z,4.2,.16,2.4,'#363a3d');for(const xx of [x-1.85,x+1.85])w.cylinder(xx,1.4,z-.9,.06,2.8,'#50565a');w.box(x,1.4,z-.92,3.9,2.7,.1,'#303a3b');artwork(w,p,x,1.55,z-.84,3.5,1.8);w.bench(x,z+.2);w.colliders.push([x-2,x+2,z-1.05,z-.7]);
 }else if(['redwood','paloalto','sacramento','dubai'].includes(w.stop.id)){
  style='studio';w.box(x,3,z,5.5,.22,3.5,'#59574e');for(const xx of [x-2.5,x+2.5])w.box(xx,1.5,z-.95,.1,3,.1,'#373d40');w.box(x,1.5,z-1,5,3,.15,'#d5d1c6');artwork(w,p,x,1.9,z-.9,3.7,1.8);w.box(x,.82,z+.2,4.2,.15,1.3,'#8d6d51');for(const xx of [x-1.7,x+1.7])w.box(xx,.4,z+.2,.09,.8,1,'#343a3e');w.colliders.push([x-2.3,x+2.3,z-.5,z+.95]);
 }else{
  style='shop-window';w.box(x,1.5,z,4.5,3,.9,'#d5d0c4');w.box(x,1.55,z+.47,3.8,2.25,.08,'#222a30');artwork(w,p,x,1.55,z+.52,3.55,1.95);w.box(x,3.05,z+.8,4.9,.18,2,'#454643');w.label(p.title,x,2.87,z+1.82,4,'#292929','#eeeeee');w.colliders.push([x-2.3,x+2.3,z-.5,z+1]);
 }
 w.markers.push({kind:'project',project:p,x,z,y:3.8,title:p.title,subtitle:'DISCOVER WORK',symbol:'◇',presentation:style});
}
export function buildMetro(w,stop,projects){
 w.clear();w.stop=stop;w.zone='metro';stationArchitecture(w);
 projects.forEach((p,i)=>buildExhibit(w,p,i));
 w.markers.push({kind:'gate',x:0,z:-20,y:2.8,title:'Enter train',subtitle:'',symbol:'↓'});
 w.markers.push({kind:'exit',x:0,z:20,y:2.8,title:'Return to the Bund',symbol:'↑'});
 w.applyLighting();w.flush();w.camera.position.set(0,1.75,17);w.camera.rotation.set(0,.28,0,'YXZ');if(w.renderer)w.renderer.shadowMap.needsUpdate=true;
}
