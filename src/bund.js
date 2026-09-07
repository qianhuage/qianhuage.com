import * as T from '../vendor/three.module.js';

// A compressed, independently modeled interpretation of the Bund's heritage frontage.
// Local u runs along the façade, v points out toward the Huangpu; metres throughout.
class Facade {
 constructor(w,x,z,angle=Math.PI/2){Object.assign(this,{w,x,z,angle});}
 p(u,y,v){return [this.x+Math.cos(this.angle)*u+Math.sin(this.angle)*v,y,this.z-Math.sin(this.angle)*u+Math.cos(this.angle)*v];}
 add(kind,u,y,v,sx,sy,sz,mat,rotation=0){this.w.add(kind,...this.p(u,y,v),sx,sy,sz,mat,this.angle+rotation);}
 box(u,y,v,sx,sy,sz,mat){this.add('box',u,y,v,sx,sy,sz,mat);}
 cylinder(u,y,v,r,h,mat){this.add('cylinder',u,y,v,r,h,r,mat);}
 arch(u,y,v,width,height){
  this.add('bundArch',u,y,v,width,height,.1,'bund-recess');
  this.add('bundArch',u,y,v+.08,width*.85,height*.9,.1,'bund-glass');
  this.add('bundArchTrim',u,y,v+.16,width,height,.24,'bund-trim');
  this.box(u,y-.06*height,v+.2,.045,height*.79,.05,'bund-bronze');
  this.box(u,y-.1*height,v+.2,width*.84,.045,.05,'bund-bronze');
  this.box(u,y-height*.5,v+.15,width+.3,.15,.4,'bund-trim');
 }
 window(u,y,v,width=1.35,height=2.1,ornate=false){
  this.box(u,y,v,width+.22,height+.22,.15,'bund-recess');
  this.box(u,y,v+.09,width,height,.07,'bund-glass');
  for(const side of [-1,1])this.box(u+side*(width/2+.11),y,v+.22,.16,height+.3,.24,'bund-trim');
  for(const side of [-1,1])this.box(u,y+side*(height/2+.13),v+.2,width+.5,.16,.33,'bund-trim');
  this.box(u,y,v+.17,.052,height,.05,'bund-bronze');this.box(u,y+.14,v+.17,width,.052,.05,'bund-bronze');
  if(ornate){this.add('bundPediment',u,y+height/2+.55,v+.16,width+1,.57,.4,'bund-trim');this.box(u,y-height/2-.28,v+.31,width+.65,.18,.65,'bund-trim');}
 }
 cornice(y,width,depth){for(const [dy,out,h]of [[-.36,.22,.2],[-.16,.4,.13],[.03,.65,.2],[.2,.46,.1]])this.box(0,y+dy,0,width+out*2,h,depth+out*2,'bund-trim');for(let u=-width/2+.5;u<width/2;u+=.85)this.box(u,y-.45,depth/2+.15,.22,.27,.48,'bund-trim');}
 column(u,y,v,height){this.add('bundColumn',u,y,v,.58,height,.58,'bund-trim');this.box(u,y-height/2+.08,v,.88,.16,.88,'bund-trim');this.box(u,y+height/2-.1,v,1,.2,1,'bund-trim');}
 balustrade(y,width,v){this.box(0,y-.45,v,width,.13,.4,'bund-trim');this.box(0,y+.45,v,width,.16,.48,'bund-trim');for(let u=-width/2;u<width/2;u+=.55)this.add('bundBaluster',u,y,v,.22,.8,.22,'bund-trim');}
 body(width,depth,height,material){this.box(0,height/2,0,width,height,depth,material);const p=this.p(0,0,0),wx=Math.abs(Math.cos(this.angle))*width+Math.abs(Math.sin(this.angle))*depth,wz=Math.abs(Math.sin(this.angle))*width+Math.abs(Math.cos(this.angle))*depth;this.w.colliders.push([p[0]-wx/2,p[0]+wx/2,p[2]-wz/2,p[2]+wz/2]);this.cornice(height,width,depth);}
}
function geometryLibrary(w){
 if(w.geos.bundArch)return;
 const shape=new T.Shape();shape.moveTo(-.5,-.5);shape.lineTo(.5,-.5);shape.lineTo(.5,0);shape.absarc(0,0,.5,0,Math.PI,false);shape.closePath();w.geos.bundArch=new T.ShapeGeometry(shape,24);
 const outer=new T.Shape();outer.moveTo(-.6,-.5);outer.lineTo(-.6,0);outer.absarc(0,0,.6,Math.PI,0,true);outer.lineTo(.6,-.5);outer.lineTo(.5,-.5);outer.lineTo(.5,0);outer.absarc(0,0,.5,0,Math.PI,false);outer.lineTo(-.5,-.5);outer.closePath();w.geos.bundArchTrim=new T.ExtrudeGeometry(outer,{depth:1,bevelEnabled:false,curveSegments:24});
 const triangle=new T.Shape();triangle.moveTo(-.5,0);triangle.lineTo(.5,0);triangle.lineTo(0,1);triangle.closePath();w.geos.bundPediment=new T.ExtrudeGeometry(triangle,{depth:1,bevelEnabled:false});
 w.geos.bundColumn=new T.LatheGeometry([new T.Vector2(.7,-.5),new T.Vector2(.7,-.46),new T.Vector2(.5,-.43),new T.Vector2(.42,-.38),new T.Vector2(.36,.37),new T.Vector2(.47,.42),new T.Vector2(.7,.46),new T.Vector2(.7,.5)],32);
 w.geos.bundBaluster=new T.LatheGeometry([new T.Vector2(.5,-.5),new T.Vector2(.5,-.4),new T.Vector2(.3,-.32),new T.Vector2(.58,-.08),new T.Vector2(.35,.15),new T.Vector2(.23,.35),new T.Vector2(.5,.42),new T.Vector2(.5,.5)],16);
 const roof=new T.CylinderGeometry(.57,1,1,4,1);roof.rotateY(Math.PI/4);roof.scale(Math.SQRT1_2,1,Math.SQRT1_2);w.geos.bundMansard=roof;
 w.geos.bundDome=new T.SphereGeometry(1,48,24,0,Math.PI*2,0,Math.PI/2);
 w.geos.bundClock=new T.CircleGeometry(1,48);
 w.geos.bundClockRim=new T.TorusGeometry(1,.055,8,48);
}
function addMaterials(w){
 if(w.materials.has('bund-stone'))return;
 const loader=new T.TextureLoader();
 const surface=(name,color,roughness,files)=>{
  const params={color,roughness,metalness:0};
  if(files){for(const [key,suffix]of [['map','color'],['normalMap','normal'],['roughnessMap','roughness']]){const texture=loader.load(`./images/pbr/${files}-${suffix}.jpg`);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.anisotropy=8;if(key==='map')texture.colorSpace=T.SRGBColorSpace;params[key]=texture;}params.normalScale=new T.Vector2(.45,.45);}
  const material=new T.MeshStandardMaterial(params);
  // Box UVs are scaled by their instance dimensions, so bricks stay brick-sized.
  if(files){material.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>',`#include <uv_vertex>
#ifdef USE_INSTANCING
 vec3 size=vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz));
 vec3 n=abs(normal);vec2 metres=n.z>.5?size.xy:n.x>.5?size.zy:size.xz;
 vMapUv*=metres/2.;vNormalMapUv*=metres/2.;vRoughnessMapUv*=metres/2.;
#endif`);};material.customProgramCacheKey=()=>`bund-material-metres-${files}`;}
  w.materials.set(name,material);
 };
 surface('bund-brick','#ddd0c9',.85,'bund-brick');surface('bund-stone','#b9b9b5',.83,'bund-stone');surface('bund-trim','#cfc9b9',.68);surface('bund-base','#777976',.9);
 surface('bund-granite','#8a9199',.38,'bund-granite');
 surface('bund-recess','#151c22',.8);surface('bund-iron','#222e32',.5);surface('bund-road','#343a40',.95);surface('bund-bronze','#67605b',.35);
 const glass=new T.MeshPhysicalMaterial({color:'#294050',metalness:.6,roughness:.12,clearcoat:1,envMapIntensity:1.5});w.materials.set('bund-glass',glass);
 w.materials.set('bund-copper',new T.MeshStandardMaterial({color:'#367d72',roughness:.48,metalness:.5}));
 w.materials.set('bund-slate',new T.MeshStandardMaterial({color:'#354453',roughness:.6,metalness:.15}));
 w.materials.set('bund-lamp',new T.MeshStandardMaterial({color:'#fff0cf',emissive:'#ffd79a',emissiveIntensity:1.8,roughness:.28}));
 w.materials.set('bund-clock',new T.MeshStandardMaterial({color:'#ece6d9',emissive:'#ffe0a3',emissiveIntensity:.12,roughness:.75}));
}
function baseFloors(f,width,depth,floors,brick=false){
 const v=depth/2+.05,spacing=3.1,cols=Math.floor((width-2)/spacing);
 f.box(0,1.95,0,width+.15,3.9,depth+.15,'bund-stone');
 for(let i=0;i<cols;i++){const u=(i-(cols-1)/2)*spacing;f.arch(u,2,v+.12,1.6,2.9);}
 f.cornice(4.2,width,depth);
 for(let floor=1;floor<floors;floor++){const y=5.8+(floor-1)*3.2;for(let i=0;i<cols;i++){const u=(i-(cols-1)/2)*spacing;f.window(u,y,v,1.45,2,brick&&floor===1);}if(brick||floor%2===0)f.box(0,y+1.4,0,width+.2,.17,depth+.2,'bund-trim');}
 // The depth is visible from the promenade: give both return façades real openings.
 for(const sign of [-1,1]){const p=f.p(sign*width/2,0,0);const side=new Facade(f.w,p[0],p[2],f.angle+sign*Math.PI/2);for(let floor=0;floor<floors;floor++)for(let j=0;j<Math.floor(depth/3.1);j++)side.window((j-(Math.floor(depth/3.1)-1)/2)*3.1,2+floor*3.2,.08,1.3,2);}
 for(const u of [-width/2+.3,width/2-.3]){f.box(u,2,0,.7,4,depth+.3,'bund-trim');for(let y=4.5;y<floors*3.3;y+=.62)f.box(u,y,depth/2+.12,.74,.45,.35,'bund-trim');}
}
function palace(w,z){
 const f=new Facade(w,-43,z),width=29,depth=21,h=19.9;f.body(width,depth,h,'bund-brick');baseFloors(f,width,depth,6,true);
 f.add('bundMansard',0,h+1.7,0,width+1.2,3.4,depth+1.2,'bund-slate');
 for(const u of [-11,-5,1,7,12]){f.box(u,h+1.3,depth/2-1,2.2,2.1,2,'bund-stone');f.arch(u,h+1.4,depth/2+.02,1.15,1.5);f.add('bundPediment',u,h+2.3,depth/2-.1,2.5,1.1,.5,'bund-trim');}
 for(const u of [-12,12]){f.box(u,h+1.3,0,3.2,2.6,3.2,'bund-brick');f.add('bundDome',u,h+2.6,0,1.85,2.2,1.85,'bund-copper');f.cylinder(u,h+5.1,0,.07,1.1,'bund-bronze');}
 // Rounded red-brick corner bay with tall arched windows and a pale octagonal lantern.
 const bayU=-width/2+1.5,bayV=depth/2-.7;
 f.cylinder(bayU,10,bayV,2.25,20,'bund-brick');
 for(let floor=0;floor<6;floor++){const yy=2+floor*3.2;f.cylinder(bayU,yy+1.5,bayV,2.42,.2,'bund-trim');for(const a of [-.85,0,.85]){const p=f.p(bayU+Math.sin(a)*2.28,0,bayV+Math.cos(a)*2.28);const bay=new Facade(w,p[0],p[2],f.angle+a);bay.arch(0,yy,0,1.05,2.15);}}
 f.cylinder(bayU,21,bayV,2.55,.6,'bund-trim');f.cylinder(bayU,22.2,bayV,1.65,2.1,'bund-stone');
 for(let a=0;a<Math.PI*2;a+=Math.PI/4){const p=f.p(bayU+Math.sin(a)*1.7,0,bayV+Math.cos(a)*1.7);new Facade(w,p[0],p[2],f.angle+a).arch(0,22.2,0,.65,1.4);}
 f.add('bundDome',bayU,23.3,bayV,1.85,1.15,1.85,'bund-copper');f.cylinder(bayU,24.7,bayV,.04,1,'bund-bronze');
 f.balustrade(20.4,24,depth/2+.05);w.landmarks.push('Swatch Art Peace Hotel');
}
function customs(w,z){
 const f=new Facade(w,-44,z),width=28,depth=23,h=21;f.body(width,depth,h,'bund-stone');baseFloors(f,width,depth,6);
 for(let i=0;i<4;i++)f.column((i-1.5)*3.1,7.4,depth/2+.6,6.2);f.cornice(11,width,depth+1.2);
 f.box(0,27,0,8.2,12,9,'bund-stone');f.cornice(32.8,9.2,10);f.box(0,35.3,0,6.7,5,7.5,'bund-stone');
 for(let i=-1;i<=1;i++)f.arch(i*1.5,28.8,4.6,.9,3.4);
 for(const angle of [0,Math.PI/2,Math.PI,Math.PI*1.5]){const face=new Facade(w,-44,z,angle),v=angle%Math.PI===0?3.81:3.41;face.add('bundClock',0,35.1,v,1.72,1.72,1,'bund-clock');face.add('bundClockRim',0,35.1,v+.03,1.78,1.78,1,'bund-bronze');for(let i=0;i<12;i++){const a=i*Math.PI/6;face.box(Math.sin(a)*1.38,35.1+Math.cos(a)*1.38,v+.04,i%3===0?.08:.05,.15,.04,'bund-iron');}face.box(0,35.65,v+.07,.065,1.1,.04,'bund-iron');face.box(.44,35.1,v+.08,.88,.07,.04,'bund-iron');}
 f.cornice(38,7.6,8.4);f.box(0,39,0,5.5,1.8,6,'bund-stone');f.add('bundMansard',0,40.4,0,6.4,1.6,6.7,'bund-copper');f.cylinder(0,43,0,.045,4.5,'bund-bronze');w.landmarks.push('Customs House');
}
function bank(w,z){
 const f=new Facade(w,-45,z),width=35,depth=24,h=18.2;f.body(width,depth,h,'bund-stone');baseFloors(f,width,depth,5);
 for(let i=0;i<6;i++)f.column((i-2.5)*3.2,8.5,depth/2+1.1,8);f.cornice(13.3,26,depth+2.2);f.add('bundPediment',0,13.5,depth/2+.3,24,3,1.5,'bund-trim');
 f.cylinder(0,21.8,0,5.6,6.3,'bund-stone');for(let i=0;i<18;i++){const angle=i*Math.PI/9;f.column(Math.cos(angle)*5.7,21.5,Math.sin(angle)*5.7,4.5);}
 f.cylinder(0,25.1,0,6,.55,'bund-trim');f.add('bundDome',0,25.35,0,5.8,4.5,5.8,'bund-trim');
 for(let i=0;i<16;i++){const points=[];const angle=i*Math.PI/8;for(let j=0;j<=24;j++){const t=j/24*Math.PI/2,p=f.p(Math.cos(angle)*5.84*Math.sin(t),25.35+4.56*Math.cos(t),Math.sin(angle)*5.84*Math.sin(t));points.push(new T.Vector3(...p));}const line=new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:'#a09b8c'}));w.root.add(line);}
 f.cylinder(0,30.5,0,.48,1.8,'bund-stone');f.add('bundDome',0,31.4,0,.7,.8,.7,'bund-copper');w.landmarks.push('Former HSBC Building');
}
function peace(w,z){
 const f=new Facade(w,-44,z),width=28,depth=24,h=26;f.body(width,depth,h,'bund-stone');baseFloors(f,width,depth,8);
 for(let u=-12;u<=12;u+=3)f.box(u,15.2,depth/2+.3,.35,21.4,.45,'bund-trim');
 f.box(0,29.2,0,12,6.4,14,'bund-stone');f.cornice(32.6,13,15);f.box(0,34.3,0,8.5,3.4,10,'bund-stone');
 for(let u=-3;u<=3;u+=1.5)f.window(u,34.2,5.06,.75,2);
 if(!w.geos.bundPyramid)w.geos.bundPyramid=new T.ConeGeometry(1,1,4);f.add('bundPyramid',0,42,0,6.6,12,6.6,'bund-copper',Math.PI/4);
 f.cylinder(0,49,0,.05,3,'bund-bronze');w.landmarks.push('Fairmont Peace Hotel');
}
function brickHall(w,z){
 const f=new Facade(w,-41,z),width=19,depth=18,h=15.9;f.body(width,depth,h,'bund-brick');baseFloors(f,width,depth,5,true);
 f.add('bundMansard',0,17.5,0,20,3.1,19,'bund-slate');
 for(let i=-1;i<=1;i++){const u=i*6;f.box(u,16.5,depth/2-.8,3,3,2,'bund-brick');f.add('bundPediment',u,18,depth/2-.9,3.8,2.1,2,'bund-trim');f.arch(u,17,depth/2+.13,1.6,1.7);}
 for(const side of [-1,1]){f.box(side*7.5,19,-1,1,3.6,1.3,'bund-brick');f.box(side*7.5,20.8,-1,1.3,.24,1.5,'bund-trim');}w.landmarks.push('Red-brick Bund heritage frontage');
}
function gardenHouse(w,z){
 const f=new Facade(w,-48,z),width=26,depth=17,h=8.4;f.body(width,depth,h,'bund-stone');baseFloors(f,width,depth,2);
 for(let i=-4;i<=4;i++){f.column(i*2.7,2.35,depth/2+2,4.2);f.column(i*2.7,6.6,depth/2+2,4.1);}
 f.box(0,4.65,depth/2+1.3,width+1,.32,3.4,'bund-trim');f.add('bundMansard',0,h+2,0,width+2,4,depth+5,'bund-slate');
 f.balustrade(5.4,width,depth/2+2);w.tree(-30,z-7,1.4);w.tree(-29,z+8,1.2);w.landmarks.push('Former consulate garden interpretation');
}
function promenade(w){
 // Broad granite flags with wet patches, framed by thin darker joints.
 w.pavement(-31,0,98,310,'#7f8383');for(const x of [-9.6,15.2])w.box(x,.016,0,.5,.015,310,'bund-granite');w.box(-18,.022,0,12,.032,310,'bund-road');
 for(let z=-150;z<155;z+=9)w.box(-18,.044,z,.1,.012,3,'#b1b7b5');
 for(const x of [-24.5,-11.5])w.box(x,.1,0,.24,.2,310,'bund-trim');
 for(let z=-135;z<=140;z+=22){
  // Heritage lamp standards and actual shaped stone river balusters.
  w.add('bundColumn',13,2.2,z,.13,4.4,.13,'bund-iron');w.cylinder(13,.16,z,.2,.32,'bund-iron');
  for(const side of [-1,1]){w.box(13+side*.38,4.5,z,.8,.08,.08,'bund-iron');w.add('sphere',13+side*.65,4.6,z,.2,.3,.2,'bund-lamp');for(const dz of [-.16,.16])w.box(13+side*.65,4.6,z+dz,.035,.55,.035,'bund-iron');w.add('cone',13+side*.65,4.96,z,.23,.15,.23,'bund-iron');}
  w.add('sphere',13,4.98,z,.24,.34,.24,'bund-lamp');w.add('cone',13,5.37,z,.29,.22,.29,'bund-iron');
  w.bench(11,z+5,-Math.PI/2);
 }
 for(let z=-152;z<=152;z+=4){w.box(17,.62,z,.54,1.24,.54,'bund-base');w.box(17,1.29,z,.66,.13,.66,'bund-trim');}
 w.box(17,.24,0,.35,.26,306,'bund-base');w.box(17,1.08,0,.21,.16,306,'bund-bronze');for(let z=-151;z<152;z+=.7)w.add('bundBaluster',17,.66,z,.12,.8,.12,'bund-trim');
 // Plane-tree gardens are set away from the promenade; leave long views of the façades.
 for(const z of [-125,-85,-11,83,121]){w.box(-7,.15,z,3.7,.3,5,'bund-base');w.box(-7,.32,z,3.3,.07,4.6,'#414c3d');w.tree(-7,z,1.1);}
 // A restrained café terrace tucked into the northern garden, without blocking walking routes.
 for(let i=0;i<3;i++){const x=-30,z=-126+i*5;w.cylinder(x,.68,z,.04,1.35,'bund-iron');w.cylinder(x,1.36,z,.82,.07,'bund-bronze');for(const side of [-1,1])w.bench(x+side*1.3,z,Math.PI/2);}
}
export function buildBund(w){
 geometryLibrary(w);addMaterials(w);w.landmarks=[];promenade(w);
 bank(w,65);customs(w,29);brickHall(w,3);palace(w,-24);peace(w,-57);gardenHouse(w,-96);
 w.bounds=[-68,16,-140,137];
}
