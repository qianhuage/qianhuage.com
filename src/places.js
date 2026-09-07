import * as T from '../vendor/three.module.js';
import {buildBayAreaContext} from './city-context.js';

// Shared construction pieces; each destination below has its own ground plan.
function kit(w){
 if(w.geos.cityArch)return;
 const arch=new T.Shape();arch.moveTo(-.5,-.5);arch.lineTo(.5,-.5);arch.lineTo(.5,0);arch.absarc(0,0,.5,0,Math.PI);arch.closePath();w.geos.cityArch=new T.ShapeGeometry(arch,24);
 w.geos.cityArcRing=new T.RingGeometry(.82,1,24,1,0,Math.PI);w.geos.cityPyramid=new T.ConeGeometry(1,1,4);w.geos.cityClock=new T.CircleGeometry(1,48);
 const ped=new T.Shape();ped.moveTo(-.5,0);ped.lineTo(.5,0);ped.lineTo(0,1);ped.closePath();w.geos.cityPediment=new T.ExtrudeGeometry(ped,{depth:1,bevelEnabled:false});
 for(const [key,color,roughness]of [['campus-marble','#deddd4',.82],['campus-trim','#eeece1',.7],['campus-metal','#3c7469',.5],['campus-glass','#344654',.2],['campus-terracotta','#985d41',.8],['campus-iron','#252e32',.6]])w.materials.set(key,new T.MeshStandardMaterial({color,roughness,metalness:key.includes('glass')?.5:0,bumpMap:key.includes('marble')?w.surfaceNoise:null,bumpScale:.009}));
}
function clock(w,x,y,z,r=1.2,angle=0){w.add('cityClock',x,y,z,r,r,1,'campus-trim',angle);for(let i=0;i<12;i++){const a=i*Math.PI/6;w.box(x+Math.cos(angle)*Math.sin(a)*r*.78,y+Math.cos(a)*r*.78,z-Math.sin(angle)*Math.sin(a)*r*.78,.045,.15,.035,'campus-iron',angle);}w.box(x,y+r*.23,z,.055,r*.6,.04,'campus-iron',angle);w.box(x+Math.cos(angle)*r*.2,y,z-Math.sin(angle)*r*.2,r*.45,.055,.04,'campus-iron',angle);}
function lawn(w,x,z,width,depth){w.box(x,-.09,z,width,.18,depth,'#536b36');const mat=new T.MeshStandardMaterial({color:'#6f873e',roughness:1,bumpMap:w.surfaceNoise,bumpScale:.06});const plane=new T.Mesh(new T.PlaneGeometry(width,depth),mat);plane.rotation.x=-Math.PI/2;plane.position.set(x,.002,z);plane.receiveShadow=true;w.root.add(plane);}
function border(w,x,z,width,depth){w.box(x,.43,z,width,.86,depth,'campus-marble');w.colliders.push([x-width/2,x+width/2,z-depth/2,z+depth/2]);}
function paths(w,x,z,width,depth){w.pavement(x,z,width,depth,'#b6b5a9',{dry:true});}
function archWindow(w,x,y,z,width,height,angle=0){w.add('cityArch',x,y,z,width+.28,height+.25,1,'campus-trim',angle);w.add('cityArch',x+Math.sin(angle)*.025,y,z+Math.cos(angle)*.025,width,height,1,'campus-glass',angle);w.box(x+Math.sin(angle)*.05,y,z+Math.cos(angle)*.05,.06,height,.06,'campus-trim',angle);}
function campusHall(w,x,z,width,depth,height,name){
 w.box(x,height/2,z,width,height,depth,'campus-marble');w.colliders.push([x-width/2,x+width/2,z-depth/2,z+depth/2]);
 const front=z+depth/2+.03;for(let y=1;y<height;y+=3.3){w.box(x,y+1.75,z,width+.4,.18,depth+.4,'campus-trim');for(let u=-width/2+2;u<width/2;u+=3.1)archWindow(w,x+u,y+.65,front,1.55,2.2);}
 for(const side of [-1,1])for(let zz=z-depth/2+2;zz<z+depth/2;zz+=3.2)for(let y=2;y<height;y+=3.3)archWindow(w,x+side*(width/2+.04),y,zz,1.4,2.2,side*Math.PI/2);
 w.box(x,height+.2,z,width+1,.5,depth+1,'campus-trim');
 for(let i=-4;i<=4;i++){const xx=x+i*2.3;w.cylinder(xx,5,front+1,.29,8,'campus-trim');w.box(xx,1,front+1,.75,.25,.75,'campus-trim');w.box(xx,9,front+1,.85,.4,.85,'campus-trim');}
 w.box(x,9.5,front+.5,23,.6,2.7,'campus-trim');w.add('cityPediment',x,9.8,front-.1,24,3,2.9,'campus-trim');
 if(name)w.label(name,x,1.2,front+2.02,5,'#d3d0c5','#363b3b');
}
function campanile(w,x,z){
 w.box(x,.5,z,8.5,1,8.5,'campus-trim');w.box(x,18.2,z,6.2,35.4,6.2,'campus-marble');
 // Subtle stone courses, narrow recessed shaft panels and uncluttered clock faces.
 for(let y=1.3;y<34.5;y+=.75){w.box(x,y,z,6.25,.025,6.25,'#b8bab5');}
 for(const side of [-1,1]){w.box(x+side*3.14,15,z,.04,25,3.8,'campus-trim');w.box(x,15,z+side*3.14,3.8,25,.04,'campus-trim');}
 for(const [dx,dz,angle]of [[0,3.16,0],[3.16,0,Math.PI/2],[0,-3.16,Math.PI],[-3.16,0,-Math.PI/2]])clock(w,x+dx,31,z+dz,1.5,angle);
 w.box(x,35.6,z,7.2,.5,7.2,'campus-trim');
 // Open belfry: separate corner piers and slender columns, with bells visible inside.
 for(const dx of [-2.75,2.75])for(const dz of [-2.75,2.75]){w.box(x+dx,39.5,z+dz,.72,7.4,.72,'campus-marble');}
 for(const angle of [0,Math.PI/2,Math.PI,Math.PI*1.5])for(const offset of [-.95,.95]){const xx=x+Math.sin(angle)*2.9+Math.cos(angle)*offset,zz=z+Math.cos(angle)*2.9-Math.sin(angle)*offset;w.cylinder(xx,39.5,zz,.16,7.3,'campus-trim');w.box(xx,43,zz,.42,.25,.42,'campus-trim');}
 for(const angle of [0,Math.PI/2,Math.PI,Math.PI*1.5])for(const offset of [-1.9,0,1.9])w.add('cityArcRing',x+Math.sin(angle)*3.14+Math.cos(angle)*offset,41.65,z+Math.cos(angle)*3.14-Math.sin(angle)*offset,.94,1.05,1,'campus-trim',angle);
 for(let i=-1;i<=1;i++){w.cylinder(x+i*1.3,38.4,z,.35,.65,'#635943');w.add('sphere',x+i*1.3,38.65,z,.31,.35,.31,'#635943');}
 for(const y of [43,43.5,44.2])w.box(x,y,z,7.3,.25,7.3,'campus-trim');
 w.box(x,45,z,5.9,1.6,5.9,'campus-marble');w.add('cityPyramid',x,50.9,z,4.5,10.2,4.5,'#a2aaa5',Math.PI/4);
 for(const dx of [-3.1,3.1])for(const dz of [-3.1,3.1]){w.box(x+dx,44.9,z+dz,.55,1.2,.55,'campus-trim');w.add('cityPyramid',x+dx,46,z+dz,.4,1.5,.4,'campus-trim',Math.PI/4);}
 w.cylinder(x,57,z,.04,2.1,'#827751');w.add('sphere',x,56.3,z,.19,.28,.19,'#b4a068');
 w.colliders.push([x-4.3,x+4.3,z-4.3,z+4.3]);w.landmarks.push('Campanile');
}
function doeLibrary(w,x,z){
 const width=56,depth=23,h=14,front=z+depth/2;
 w.box(x,h/2,z,width,h,depth,'campus-marble');w.colliders.push([x-width/2,x+width/2,z-depth/2,z+depth/2]);
 for(let i=-5;i<=5;i++){const xx=x+i*4.5;w.box(xx,8.2,front+.03,3.1,8.4,.12,'campus-glass');w.box(xx,8.2,front+.14,.08,8.4,.09,'#8f8c78');w.box(xx,8.4,front+.14,3.1,.07,.09,'#8f8c78');}
 for(let i=-6;i<=6;i++){const xx=x+i*4.5;w.cylinder(xx,8.2,front+.6,.35,9.2,'campus-trim');w.box(xx,3.6,front+.6,1,.4,1,'campus-trim');w.box(xx,12.9,front+.6,1.2,.5,1.1,'campus-trim');}
 for(const yy of [3.2,13.2,13.8,14.25])w.box(x,yy,z,width+.8,.3,depth+1,'campus-trim');
 for(let xx=x-27;xx<x+28;xx+=.65)w.box(xx,13.55,front+.55,.21,.22,.35,'campus-trim');
 const roof=new T.BufferGeometry();roof.setAttribute('position',new T.Float32BufferAttribute([-28,0,-12,28,0,-12,-25,3,0,28,0,-12,25,3,0,-25,3,0,-28,0,12,-25,3,0,28,0,12,28,0,12,-25,3,0,25,3,0,-28,0,-12,-25,3,0,-28,0,12,28,0,-12,28,0,12,25,3,0],3));roof.computeVertexNormals();const mesh=new T.Mesh(roof,w.mat('campus-terracotta'));mesh.position.set(x,14.4,z);mesh.castShadow=true;w.root.add(mesh);
 for(let xx=x-27;xx<x+28;xx+=.25){w.box(xx,14.48,z+11.9,.075,.1,.15,'#b26d4b');}
 w.label('THE UNIVERSITY LIBRARY',x,13.6,front+.72,9,'#d8d7cb','#5d605a');w.label('DOE LIBRARY',x,1.3,front+1.02,4.2,'#d8d7cb','#555a59');
 // Glade-side terrace remains beyond the walking boundary, with visible steps.
 for(let i=0;i<4;i++)w.box(x,.12+i*.16,front+1.8-i*.35,9,.25,.5,'campus-trim');
 w.landmarks.push('Doe Library');
}
function satherGate(w,z){
 for(const x of [-7.5,7.5]){w.box(x,2,z,1.35,4,1.35,'campus-marble');w.box(x,4.25,z,1.65,.5,1.65,'campus-trim');w.cylinder(x,5.1,z,.22,1.3,'campus-metal');w.colliders.push([x-.8,x+.8,z-.8,z+.8]);}
 w.box(0,5.7,z,16,.6,.48,'campus-metal');w.box(0,6.15,z,16,.2,.64,'campus-metal');
 for(let x=-7.4;x<=7.4;x+=.42){const y=6.35+.65*Math.cos(x/7.5*Math.PI/2);w.box(x,y,z,.055,.45,.14,'campus-metal');}w.label('SATHER GATE',0,5.75,z+.25,4.1,'#3c7469','#e4d7af');
 for(const side of [-1,1]){w.box(side*13,2,z,9,.1,.13,'campus-metal');for(let x=8.5;x<18;x+=.48)w.box(side*x,1.65,z,.045,3.3,.06,'campus-metal');}
 w.landmarks.push('Sather Gate');
}
function grove(w){for(const [x,z,size]of [[-29,29,1.6],[29,25,1.8],[-31,-15,1.5],[30,-18,1.55],[-34,-48,1.75],[36,-54,1.5],[-15,38,1.25],[15,38,1.5]])w.tree(x,z,size);}
export function buildBerkeley(w){
 kit(w);w.sceneKind='campus';w.landmarks=[];lawn(w,0,-14,240,230);paths(w,0,-7,11,86);paths(w,0,14,53,10);paths(w,0,-34,55,8);
 // Separate lawns and footpaths, framed by academic buildings and wooded hills.
 doeLibrary(w,10,-53);campusHall(w,-49,4,23,31,17,'');campusHall(w,53,7,25,30,16,'');campanile(w,-28,-67);satherGate(w,31);
 for(const x of [-18,18]){w.bench(x,16,x<0?Math.PI/2:-Math.PI/2);w.lamp(x,-9);}
 grove(w);buildBayAreaContext(w,'berkeley');
 // BART is represented as a downtown transfer at the campus exit.
 w.station(-9,-30,'DOWNTOWN BERKELEY · BART','#233f63');
 border(w,0,44,74,1.3);border(w,0,-65,30,1.4);border(w,-36,-7,1.2,102);border(w,36,-7,1.2,102);
 w.bounds=[-35,35,-63.5,42.5];w.landmarks.push('Memorial Glade');
}
function civicWindows(w,x,z,width,height,step=3){
 for(let yy=3;yy<height-1;yy+=3.1)for(let xx=-width/2+1.6;xx<width/2;xx+=step){w.box(x+xx,yy,z,1.1,1.9,.08,'campus-glass');w.box(x+xx,yy-1,z+.08,1.5,.12,.25,'campus-trim');}
}
function oaklandHall(w){
 // A stepped Beaux-Arts office tower rises above a broad rusticated base.
 for(const [width,depth,base,h]of [[36,22,0,13],[21,17,13,9],[9,10,22,20],[6.5,7,42,5]]){w.box(0,base+h/2,-86,width,h,depth,'#b7ac91');civicWindows(w,0,-86+depth/2+.05,width,base+h);w.box(0,base+h,-86,width+1,.55,depth+1,'campus-trim');}
 for(let xx=-15;xx<=15;xx+=3)archWindow(w,xx,2.5,-74.9,1.7,3.8);
 clock(w,0,44,-82.45,1.2);w.add('cityPyramid',0,49,-86,4.7,5,4.7,'#788b79',Math.PI/4);w.cylinder(0,52.7,-86,.045,3,'#86734e');
 w.colliders.push([-18,18,-97,-75]);
}
function courthouse(w){
 w.box(0,6.7,-77,36,13.4,22,'#b7a889');civicWindows(w,0,-65.9,36,13,3.3);
 for(const x of [-7.5,-2.5,2.5,7.5]){w.cylinder(x,6.9,-63.8,.55,10,'#d9cbae');w.box(x,1.8,-63.8,1.5,.45,1.5,'campus-trim');w.box(x,12,-63.8,1.7,.5,1.7,'campus-trim');}
 w.box(0,12.6,-64,21,.6,4,'campus-trim');w.add('cityPediment',0,12.9,-65.6,22,4,4,'#cbbd9e');
 w.cylinder(0,16.8,-77,5,6,'#b9ae93');for(let i=0;i<12;i++){let a=i*Math.PI/6;w.cylinder(Math.cos(a)*4.8,17,-77+Math.sin(a)*4.8,.22,5,'campus-trim');}
 const dome=new T.Mesh(new T.SphereGeometry(5.4,40,20,0,Math.PI*2,0,Math.PI/2),w.mat('campus-metal'));dome.position.set(0,19.8,-77);w.root.add(dome);w.cylinder(0,26,-77,.45,2,'#5b6b59');w.sphere(0,27.3,-77,.55,.65,.55,'#62735c');w.colliders.push([-18,18,-88,-62]);
}
function ferryBuilding(w){
 w.box(0,5.8,-82,62,11.6,16,'#a8b4ba');
 for(let x=-28;x<=28;x+=4){archWindow(w,x,2.7,-73.96,2.7,4.1);for(const y of [7.1,9.6]){w.box(x,y,-73.92,2.15,1.6,.1,'campus-glass');w.box(x,y-.9,-73.8,2.5,.12,.2,'campus-trim');}w.box(x+1.6,6,-73.8,.22,10,.35,'campus-trim');}
 for(const y of [5,11.4,12])w.box(0,y,-82,63,.3,17,'campus-trim');w.box(0,12.6,-82,60,1.1,14,'#6e817f');
 w.box(0,21,-82,7.2,24,7.2,'#aeb8b9');for(const yy of [14,23,28.5,33])w.box(0,yy,-82,8,.4,8,'campus-trim');for(const x of [-2.6,2.6])w.box(x,21,-78.3,.3,14,.4,'campus-trim');
 for(const x of [-1.65,0,1.65])archWindow(w,x,31.1,-78.33,1.05,2.1);clock(w,0,26,-78.32,1.7);w.add('cityPyramid',0,36.8,-82,5.4,7,5.4,'#456e69',Math.PI/4);w.cylinder(0,41,-82,.06,2,'#526e62');w.label('FERRY BUILDING',0,13.1,-73.42,6,'#a8b4ba','#35434a');w.colliders.push([-31,31,-90,-73]);
}
export function buildOakland(w){
 kit(w);w.sceneKind='downtown';w.landmarks=[];buildBayAreaContext(w,'oakland');paths(w,0,-10,80,150);w.box(0,.015,-8,10,.025,140,'#484b4d');paths(w,0,8,26,22);
 for(const side of [-1,1])for(let i=0;i<5;i++){const z=-62+i*27;w.building(side*(27+(i%2)*3),z,19,20,13+(i%3)*8,['#8b644f','#b9ada0','#9ca5a0'][i%3],i%2?'modern':'classic');}
 oaklandHall(w);
 for(const x of [-14,14])for(let z=-40;z<55;z+=30){w.tree(x,z,.9);w.lamp(x-2,z+6);}
 w.station(-9,-30,'12TH ST / OAKLAND CITY CENTER · BART','#233f63');border(w,0,62,46,1);border(w,0,-66,20,1);w.bounds=[-15,15,-64,60];w.landmarks.push('Oakland City Hall','Downtown BART');
}
export function buildRedwood(w){
 kit(w);w.sceneKind='station-square';w.landmarks=[];buildBayAreaContext(w,'redwood');paths(w,0,-4,110,165);lawn(w,28,-2,18,100);
 courthouse(w);
 for(let i=0;i<5;i++){const z=-44+i*23;w.building(-32,z,20,17,6+(i%2)*3,['#b78566','#c3b49d','#a49a89'][i%3]);w.tree(22,z,1.3);}
 // Parallel rails and a platform replace the inherited river.
 for(const x of [38,40,46,48])w.box(x,.06,0,.085,.12,170,'#656b70');for(let z=-80;z<80;z+=.7){w.box(39,-.01,z,4,.1,.16,'#5e5148');w.box(47,-.01,z,4,.1,.16,'#5e5148');}
 w.box(31,.18,0,7,.36,150,'#a8a496');w.box(33,3,-20,5,.25,34,'#9d5b42');for(let z=-34;z<0;z+=8)w.cylinder(33,1.5,z,.1,3,'#604d41');
 w.station(-9,-30,'SFO AIRPORT CONNECTION','#3e474d');for(let z=-40;z<50;z+=25){w.tree(-14,z,1.2);w.bench(12,z);}
 border(w,0,61,49,1);border(w,0,-58,22,1);border(w,24,1,1,119);w.bounds=[-20,23,-56,59];w.landmarks.push('Courthouse Square','Caltrain tracks');
}
export function buildSanFrancisco(w){
 kit(w);w.sceneKind='bayfront';w.landmarks=[];buildBayAreaContext(w,'sanfrancisco');paths(w,-15,0,70,160);w.waterPlane(235,0,420,850);w.rail(19,-100,100);
 // Ferry Building sits on the Embarcadero; the Bay Bridge is the distant bridge here.
 ferryBuilding(w);
 for(let i=0;i<7;i++)w.building(-43,-85+i*28,23,20,10+(i%4)*4,['#9ba9af','#748e9b','#a6acac'][i%3],'modern');
 for(const x of [70,145]){w.box(x,24,105,1.7,48,3,'#8f9799');w.box(x,43,105,11,1.2,3,'#8f9799');}
 w.box(100,13,105,210,.8,7,'#8c9293');for(let x=0;x<205;x+=3){const span=x<110?70:145,y=16+28*Math.pow(Math.min(1,Math.abs(x-span)/40),2);w.box(x,(y+13)/2,102,.04,y-13,.04,'#a4aaaa');}
 for(let z=-50;z<60;z+=23){w.lamp(15,z);w.tree(-16,z,1.1);w.bench(12,z+6,-Math.PI/2);}w.boat(45,-15,1.8);w.station(-9,-30,'CALTRAIN · 4TH & KING CONNECTION','#762f31');
 border(w,0,65,36,1);w.bounds=[-22,18,-60,63];w.landmarks.push('Ferry Building','Bay Bridge');
}
export function buildStockholm(w){
 kit(w);w.sceneKind='old-town';w.landmarks=[];w.pavement(0,-10,80,150,'#aaa392');
 // An enclosed old-town street opens onto the quay ahead, not a river beside every scene.
 for(const side of [-1,1])for(let i=0;i<6;i++){const z=-52+i*20,color=['#c49859','#be7651','#c2ae80','#986d58'][i%4];w.building(side*23,z,13,18,14+(i%3)*2,color,'nordic');}
 w.waterPlane(0,-210,550,280);w.box(0,.03,-65,62,.18,3,'#a29b8c');for(let x=-35;x<36;x+=3){w.box(x,.7,-66,.1,1.4,.1,'#414945');}w.box(0,1.3,-66,72,.1,.1,'#414945');
 for(let i=0;i<12;i++)w.building(-80+i*14,-170,12,15,14+(i%4)*3,['#b98b56','#ceba86','#b78667'][i%3],'nordic',false);
 w.box(-64,22,-171,8,44,8,'#a88963');w.add('cityPyramid',-64,49,-171,5.7,12,5.7,'campus-metal',Math.PI/4);w.boat(16,-90,1.5);
 for(const z of [-18,24,48]){w.lamp(-13,z);w.lamp(13,z);}w.station(-9,-30,'ARLANDA AIRPORT CONNECTION','#444a47');border(w,0,66,34,1);w.bounds=[-15,15,-62,64];w.landmarks.push('Gamla stan street','Baltic quay');
}
export const MAIN_PLACES={berkeley:buildBerkeley,oakland:buildOakland,redwood:buildRedwood,sanfrancisco:buildSanFrancisco,stockholm:buildStockholm};
