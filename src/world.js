import * as T from '../vendor/three.module.js';
import {makeWater,makeSurfaceNoise,createPipeline,setupEnvironment} from './rendering.js';
import {buildPudongSkyline} from './architecture.js';
import {buildBund} from './bund.js';
import {makePuddles,makeClouds,makeGoldenSky,GOLDEN_SUN} from './atmosphere.js';
import {projectPosition} from './journey.js';
import {buildPudongTerminal} from './airport.js';
import {MAIN_PLACES} from './places.js';
import {buildExhibit,buildMetro} from './exhibits.js';
import {buildTrainInterior,interiorLighting,updatePlatformTrain,updateTrainRide,arriveMetroTrain} from './metro.js';

const clamp=T.MathUtils.clamp;
const seeded=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};
export class World {
 constructor(renderer){
  this.renderer=renderer;this.scene=new T.Scene();this.scene.background=new T.Color('#90bdd9');this.scene.fog=new T.FogExp2('#a9bfd0',.0017);
  this.camera=new T.PerspectiveCamera(64,innerWidth/innerHeight,.1,650);this.camera.rotation.order='YXZ';
  this.root=new T.Group();this.scene.add(this.root);this.colliders=[];this.markers=[];this.batches=new Map();this.animated=[];
  this.geos={box:new T.BoxGeometry(1,1,1),cylinder:new T.CylinderGeometry(1,1,1,32),cone:new T.ConeGeometry(1,1,32),sphere:new T.SphereGeometry(1,20,14),pearl:new T.SphereGeometry(1,64,40)};
  this.materials=new Map();this.surfaceNoise=makeSurfaceNoise();this.foliageCards=[];this.surfaceMaps=[];this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;this.dummy=new T.Object3D();
  this.hemisphere=new T.HemisphereLight('#bed8f5','#67504a',.5);this.scene.add(this.hemisphere);this.sunOffset=new T.Vector3(76,35,55);
  this.sun=new T.DirectionalLight('#ffe0b5',2.7);this.sun.position.set(76,35,55);this.sun.castShadow=true;this.sun.shadow.mapSize.set(innerWidth<750?2048:4096,innerWidth<750?2048:4096);Object.assign(this.sun.shadow.camera,{left:-70,right:70,top:70,bottom:-70,near:1,far:220});this.sun.shadow.bias=-.0004;this.sun.shadow.normalBias=.025;this.scene.add(this.sun);this.scene.add(this.sun.target);
  this.sky=new T.Mesh(new T.SphereGeometry(550,32,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{top:{value:new T.Color('#729caf')},bottom:{value:new T.Color('#e1d9b8')},sun:{value:new T.Vector3(-.55,.4,-.55)}},vertexShader:'varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 v;uniform vec3 top;uniform vec3 bottom;uniform vec3 sun;void main(){vec3 d=normalize(v);float h=pow(max(d.y,0.),.55);vec3 c=mix(bottom,top,h);float s=max(dot(d,normalize(sun)),0.);c+=vec3(1.,.78,.4)*pow(s,90.)*.28;c+=vec3(1.,.92,.69)*smoothstep(.999,.9997,s)*1.8;gl_FragColor=vec4(c,1.);}'}));this.scene.add(this.sky);this.pipeline=renderer?createPipeline(renderer,this.scene,this.camera):null;this.setupTextureLibrary();this.sky.userData.noAO=true;this.clouds=makeClouds();this.scene.add(this.clouds);this.goldenSky=makeGoldenSky();this.goldenSky.visible=false;this.scene.add(this.goldenSky);setupEnvironment(renderer,this.scene,()=>{this.dayEnvironment=this.scene.environment;this.dayBackground=this.scene.background;this.applyLighting();});
 }
 applyLighting(){
  const interior=this.zone==='metro'||this.zone==='train',golden=this.stop?.theme==='shanghai'&&!interior;this.goldenSky.visible=golden;this.sky.visible=!golden&&!this.dayBackground;this.clouds.visible=!golden&&this.stop?.theme==='yacht';
  this.sunOffset.copy(golden?GOLDEN_SUN.clone().multiplyScalar(105):new T.Vector3(76,35,55));this.sun.color.set(golden?'#ffb657':'#ffe0b5');this.sun.intensity=golden?3.6:2.7;
  this.hemisphere.color.set(golden?'#ffc486':'#bed8f5');this.hemisphere.groundColor.set(golden?'#704349':'#67504a');this.hemisphere.intensity=golden?.62:this.stop?.theme==='airport'?1.2:.5;
  this.scene.fog.color.set(golden?'#d89a6f':this.stop?.theme==='stockholm'?'#b7c5cc':'#a9bfd0');this.scene.fog.density=golden?.0028:this.stop?.theme==='yacht'?.0008:.0017;
  if(golden){if(this.renderer&&!this.goldenEnvironment){const scene=new T.Scene();scene.add(makeGoldenSky());const generator=new T.PMREMGenerator(this.renderer);this.goldenEnvironment=generator.fromScene(scene,.015,.1,650);generator.dispose();scene.children[0].geometry.dispose();scene.children[0].material.dispose();}if(this.goldenEnvironment)this.scene.environment=this.goldenEnvironment.texture;this.scene.environmentIntensity=.7;this.scene.background=new T.Color('#e2a36a');}
  else{if(this.dayEnvironment)this.scene.environment=this.dayEnvironment;this.scene.background=this.dayBackground||new T.Color('#90bdd9');this.scene.environmentIntensity=.55;}
  if(interior){this.scene.background=new T.Color('#101718');this.sun.intensity=0;this.hemisphere.color.set('#ffffff');this.hemisphere.groundColor.set('#b6b6b6');this.hemisphere.intensity=.65;this.scene.fog.density=.001;interiorLighting(this);this.sky.visible=false;this.goldenSky.visible=false;this.clouds.visible=false;}this.sun.target.position.set(0,0,0);this.sun.position.copy(this.sunOffset);this.shadowAnchor=null;
 }
 setupTextureLibrary(){
  const loader=new T.TextureLoader();this.bundPaving={};for(const [key,suffix]of [['map','color'],['normalMap','normal'],['roughnessMap','roughness']]){const t=loader.load('./images/pbr/bund-stone-'+suffix+'.jpg');t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;if(key==='map')t.colorSpace=T.SRGBColorSpace;this.bundPaving[key]=t;}this.pavingTexture=loader.load('./images/pbr/paving-color.jpg');this.pavingNormal=loader.load('./images/pbr/paving-normal.jpg');this.pavingRoughness=loader.load('./images/pbr/paving-roughness.jpg');this.pavingAO=loader.load('./images/pbr/paving-ao.jpg');this.plasterTexture=loader.load('./images/materials/plaster.png');this.leafTexture=loader.load('./images/materials/foliage.png',()=>{if(this.renderer)this.renderer.shadowMap.needsUpdate=true;});
  for(const texture of [this.pavingNormal,this.pavingRoughness,this.pavingAO]){texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.anisotropy=8;}for(const texture of [this.pavingTexture,this.plasterTexture]){texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.anisotropy=8;}this.plasterTexture.repeat.set(3,4);this.leafTexture.colorSpace=T.SRGBColorSpace;
  this.foliageMaterial=new T.MeshStandardMaterial({map:this.leafTexture,alphaTest:.42,side:T.DoubleSide,color:'#e0e8ce',roughness:1});
  this.foliageMaterial.onBeforeCompile=shader=>{shader.uniforms.leafTime={value:0};shader.vertexShader='uniform float leafTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n transformed.x += sin(leafTime * 1.3 + instanceMatrix[3].x*.4 + instanceMatrix[3].z*.3) * .055 * (position.y + .5);');this.foliageMaterial.userData.shader=shader;};
 }
 addFoliage(){if(!this.foliageCards.length)return;const geometry=new T.PlaneGeometry(1,1);const mesh=new T.InstancedMesh(geometry,this.foliageMaterial,this.foliageCards.length);const dummy=new T.Object3D();this.foliageCards.forEach((p,i)=>{dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(p.rx,p.ry,0);dummy.scale.set(p.s,p.s,1);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});mesh.userData.noAO=true;mesh.castShadow=true;mesh.receiveShadow=true;mesh.customDepthMaterial=new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking,map:this.leafTexture,alphaTest:.42,side:T.DoubleSide});this.root.add(mesh);}
 mat(color){if(!this.materials.has(color)){const glass=['#739298','#a2b2aa','#91a5a2','#809d9e','#a7b0a4','#aeb6a9','#8da8ab','#92a8a8','#637a75','#6a7974','#677e8a','#456e72','#5c898a'].includes(color);this.materials.set(color,new T.MeshStandardMaterial({color,roughness:glass?.14:.8,metalness:glass?.68:.02,envMapIntensity:glass?1.25:.6,bumpMap:glass?null:this.surfaceNoise,bumpScale:.018}));}const m=this.materials.get(color);if(/^#(c6b|bfab|d2c|c2b|cdb|b3b|c6a|c7b|b585|c0a|d3c|cabe|c4be)/i.test(color)&&!m.map){m.map=this.plasterTexture;m.needsUpdate=true;}return m;}
 add(kind,x,y,z,sx,sy,sz,color,ry=0,rz=0){const key=kind+color;let batch=this.batches.get(key);if(!batch){batch={kind,color,items:[]};this.batches.set(key,batch);}batch.items.push({x,y,z,sx,sy,sz,ry,rz});}
 box(x,y,z,sx,sy,sz,color,ry=0){this.add('box',x,y,z,sx,sy,sz,color,ry);}
 cylinder(x,y,z,r,h,color){this.add('cylinder',x,y,z,r,h,r,color);}
 sphere(x,y,z,sx,sy,sz,color){this.add('sphere',x,y,z,sx,sy,sz,color);}
 flush(){for(const {kind,color,items} of this.batches.values()){const mesh=new T.InstancedMesh(this.geos[kind],this.mat(color),items.length);items.forEach((a,i)=>{this.dummy.position.set(a.x,a.y,a.z);this.dummy.scale.set(a.sx,a.sy,a.sz);this.dummy.rotation.set(0,a.ry,a.rz);this.dummy.updateMatrix();mesh.setMatrixAt(i,this.dummy.matrix);});mesh.castShadow=true;mesh.receiveShadow=true;this.root.add(mesh);}this.batches.clear();}
 clear(){const textures=new Set(),geometries=new Set(),materials=new Set();this.root.traverse(o=>{if(o.isMesh||o.isLine){if(o.geometry&&!Object.values(this.geos).includes(o.geometry))geometries.add(o.geometry);for(const m of (Array.isArray(o.material)?o.material:[o.material]))if(m&&m!==this.foliageMaterial&&!Array.from(this.materials.values()).includes(m)){materials.add(m);for(const texture of [m.map,m.bumpMap])if(texture&&![this.pavingTexture,this.pavingNormal,this.pavingRoughness,this.pavingAO,this.plasterTexture,this.leafTexture,this.surfaceNoise,...Object.values(this.bundPaving)].includes(texture))textures.add(texture);}if(o.customDepthMaterial)o.customDepthMaterial.dispose();if(o.isInstancedMesh)o.dispose();}});textures.forEach(t=>t.dispose());geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());if(this.water?.dispose)this.water.dispose();if(this.puddles)this.puddles.dispose();this.puddles=null;this.root.clear();this.landmarks=[];this.sceneKind=null;this.zone=null;this.metroArrival=null;this.trainRide=null;this.foliageCards=[];this.colliders=[];this.markers=[];this.animated=[];this.batches.clear();this.water=null;}
 label(text,x,y,z,width=5,bg='#253d32',fg='#eff3df',rotation=0){const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,1024,256);ctx.fillStyle=fg;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='500 65px sans-serif';ctx.fillText(text,512,132,930);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const mesh=new T.Mesh(new T.PlaneGeometry(width,width/4),new T.MeshStandardMaterial({map:tex,roughness:.8,side:T.DoubleSide}));mesh.position.set(x,y,z);mesh.rotation.y=rotation;this.root.add(mesh);return mesh;}
 pavement(x,z,w,d,color='#b1ad97',options={}){
  this.box(x,-.21,z,w,.4,d,color);
  const bund=this.stop?.theme==='shanghai',dry=options.dry,tile=bund||dry?5:2;const geo=new T.PlaneGeometry(w,d);const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*w/tile,uv.getY(i)*d/tile);geo.setAttribute('uv1',uv.clone());
  const mat=new T.MeshPhysicalMaterial(dry?{...this.bundPaving,color:'#ccc9bb',normalScale:new T.Vector2(.18,.18),roughness:.95,clearcoat:0}:bund?{...this.bundPaving,color:'#aaa396',normalScale:new T.Vector2(.35,.35),roughness:.65,clearcoat:.35,clearcoatRoughness:.2,envMapIntensity:1.2}:{map:this.pavingTexture,normalMap:this.pavingNormal,normalScale:new T.Vector2(.75,.75),roughnessMap:this.pavingRoughness,roughness:.85,aoMap:this.pavingAO,aoMapIntensity:.5,clearcoat:.18,clearcoatRoughness:.25});
  if(bund){mat.onBeforeCompile=shader=>{shader.vertexShader='varying vec3 vPaving;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vPaving=position;');shader.fragmentShader='varying vec3 vPaving;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\n float wet=smoothstep(.1,.65,sin(vPaving.x*.37+sin(vPaving.y*.21))*cos(vPaving.y*.31+sin(vPaving.x*.13)));roughnessFactor=mix(roughnessFactor,.075,wet*.8);');};}
  const mesh=new T.Mesh(geo,mat);mesh.rotation.x=-Math.PI/2;mesh.position.set(x,.005,z);mesh.receiveShadow=true;this.root.add(mesh);
 }
 waterPlane(x,z,w,d,color='#528b87'){
  const ocean=this.stop?.theme==='yacht';const water=makeWater(w,d,{reduced:this.reduced,ocean});water.position.set(x,-.38,z);this.root.add(water);this.water=water;
  this.box(x,-5,z,w,1,d,ocean?'#537f70':'#688675');
  // A shallow stone shelf under the waterfront gives the refraction something to reveal.
  if(!ocean){this.box(22,-1.8,0,10,.4,190,'#929680');const random=seeded(391);for(let i=0;i<560;i++){const rx=18+random()*9,rz=-90+random()*180,sz=.15+random()*.6;this.sphere(rx,-1.2-random()*.3,rz,sz,.15+sz*.35,sz*.8,['#90957e','#a6a88e','#778774','#b5b59a'][i%4]);}}
 }
 tree(x,z,size=1,pine=false){
  this.cylinder(x,2.5*size,z,.15*size,5*size,'#615c48');
  const random=seeded(Math.round((x+100)*31+(z+100)*17));
  for(let b=0;b<7;b++){const angle=b*2.4,length=(1.7+random()*.6)*size;this.add('cylinder',x-Math.cos(angle)*Math.sin(.6)*length*.5,(3.7+b*.18)*size+Math.cos(.6)*length*.5,z+Math.sin(angle)*Math.sin(.6)*length*.5,.055*size,length,.055*size,'#615c48',angle,.6);}
  if(pine){for(let i=0;i<4;i++)this.add('cone',x,(3+i*1.15)*size,z,(2.1-i*.34)*size,3*size,(2.1-i*.34)*size,'#4e7456');}
  // Intersecting foliage cards keep the silhouette open, with visible light between leaves.
  for(let i=0;i<(pine?18:36);i++){const a=random()*Math.PI*2,r=Math.sqrt(random())*2.3*size;const card={x:x+Math.cos(a)*r,y:(4.7+random()*2.6)*size,z:z+Math.sin(a)*r,s:(1.7+random()*.9)*size,ry:random()*Math.PI,rx:(random()-.5)*1.6};this.foliageCards.push(card);}
  this.colliders.push([x-.35,x+.35,z-.35,z+.35]);
 }
 lamp(x,z){this.cylinder(x,2.2,z,.065,4.4,'#394b46');this.box(x,4.42,z,.5,.12,.5,'#394b46');this.box(x,4.15,z,.28,.42,.28,'#ece1b7');this.add('cone',x,4.65,z,.38,.36,.38,'#394b46');this.box(x,4.05,z,.35,.07,.35,'#394b46');}
 bench(x,z,ry=0){const group=new T.Group();const wood=this.mat('#80664d');for(let i=0;i<5;i++){const m=new T.Mesh(this.geos.box,wood);m.scale.set(2.4,.08,.105);m.position.set(0,.5,i*.13-.25);group.add(m);}for(let i=0;i<3;i++){const m=new T.Mesh(this.geos.box,wood);m.scale.set(2.4,.12,.08);m.position.set(0,.72+i*.15,-.32);group.add(m);}for(const xx of [-.9,.9]){const m=new T.Mesh(this.geos.box,this.mat('#34463e'));m.scale.set(.09,.65,.5);m.position.set(xx,.25,0);group.add(m);}group.position.set(x,0,z);group.rotation.y=ry;this.root.add(group);this.colliders.push([x-1.25,x+1.25,z-.55,z+.55]);}
 building(x,z,w,d,h,color,style='classic',solid=true){
  this.box(x,h/2,z,w,h,d,color);if(solid)this.colliders.push([x-w/2,x+w/2,z-d/2,z+d/2]);
  const front=z+d/2+.04;const floors=Math.max(1,Math.floor(h/3.4));const cols=Math.max(2,Math.floor(w/2.5));
  if(style==='modern'){
   for(let i=0;i<=cols;i++)this.box(x-w/2+i*w/cols,h/2,front,.1,h,.1,'#adbbb5');
   for(let f=1;f<floors;f++)this.box(x,f*3.4,front,w,.1,.1,'#acb8b2');
   for(let i=0;i<cols;i++)for(let f=0;f<floors;f++)this.box(x-w/2+(i+.5)*w/cols,1.6+f*3.4,front+.02,w/cols-.22,2.6,.04,(i+f)%3?'#739298':'#a2b2aa');
   this.box(x,h+.2,z,w+.3,.4,d+.3,'#7d8d87');for(const sign of [-1,1]){const sx=x+sign*(w/2+.04);this.box(sx,h/2,z,.07,h-.5,d-.2,'#677e8a');for(let floor=1;floor<floors;floor++)this.box(sx+sign*.04,floor*3.4,z,.08,.1,d,'#adbbb5');for(let zz=z-d/2;zz<=z+d/2;zz+=2)this.box(sx+sign*.07,h/2,zz,.09,h,.09,'#82999f');}
  }else{
   for(let f=0;f<floors;f++){const yy=2+f*3.4;this.box(x,yy+1.45,front,w+.3,.13,.3,'#d4cdb4');for(let i=0;i<cols;i++){const xx=x-w/2+(i+.5)*w/cols;this.box(xx,yy,front,.98,1.8,.13,'#6a7974');this.box(xx,yy,front+.1,.07,1.8,.08,'#dcd4bd');this.box(xx,yy,front+.1,1,.07,.08,'#dcd4bd');this.box(xx,yy+1,front,1.3,.15,.3,'#e0d6bb');this.box(xx,yy-.95,front,1.3,.2,.38,'#c4bea6');}}
   this.box(x,h+.18,z,w+.7,.4,d+.7,'#d8d0b7');if(style==='classic'){const roof=new T.Mesh(new T.CylinderGeometry(.55,1,2.3,4),this.mat('#626769'));roof.rotation.y=Math.PI/4;roof.scale.set(w*.7,1,d*.7);roof.position.set(x,h+1.2,z);roof.castShadow=true;this.root.add(roof);for(let i=0;i<3;i++)this.box(x-w*.3+i*w*.3,h+2,z,1.1,1.5,1.1,'#797c73');}this.box(x,.45,front,w,.8,.3,'#b4ac93');this.sideFacade(x,z,w,d,h,color,style);this.sideFacade(x,z,w,d,h,color,style,-1);
   for(const xx of [x-w/2+.25,x+w/2-.25])this.box(xx,h/2,front,.45,h,.24,'#d2c6a8');
   if(style==='nordic'){const roof=new T.Mesh(new T.CylinderGeometry(0,1,1,4,1),this.mat('#76594a'));roof.position.set(x,h+1.65,z);roof.rotation.y=Math.PI/4;roof.scale.set(w*.75,3.3,d*.75);this.root.add(roof);}
  }
 }
 sideFacade(x,z,w,d,h,color,style,sign=1){
  const box=(xx,...args)=>this.box(x+sign*(xx-x),...args);
  const side=x+w/2+.04,cols=Math.max(2,Math.floor(d/2.7)),floors=Math.floor(h/3.4);
  for(let f=0;f<floors;f++){const yy=2+f*3.4;box(side,yy+1.5,z,.32,.17,d+.25,'#d4cbb1');for(let i=0;i<cols;i++){const zz=z-d/2+(i+.5)*d/cols;box(side,yy,zz,.15,1.85,1.1,'#637a75');box(side+.1,yy,zz,.07,1.85,.07,'#cfc8ae');box(side+.1,yy,zz,.07,.07,1.1,'#cfc8ae');box(side,yy+1,zz,.35,.17,1.45,'#d6c9ab');box(side,yy-.95,zz,.45,.17,1.4,'#b8b393');if(f===1&&i%2===0){box(side+.45,yy-.8,zz,.85,.14,1.7,'#8d9380');for(let bar=0;bar<6;bar++)box(side+.82,yy-.4,zz-.75+bar*.3,.04,.7,.04,'#526152');box(side+.82,yy,zz,.05,.05,1.6,'#526152');}}}
  box(side,.5,z,.3,.9,d,'#b4a889');
  if(style!=='nordic'){for(let i=0;i<cols;i++){const zz=z-d/2+(i+.5)*d/cols;box(side+.08,1.4,zz,.12,2.3,1.65,'#445e57');box(side+.65,2.75,zz,1.6,.12,2,'#6b7755');box(side+1.42,2.62,zz,.06,.25,2,'#6b7755');}}
 }
 streetDetails(){
  // A small, fully modeled vending machine, bottles, a book cart and utility lines.
  const x=-4.8,z=17;this.box(x,1.1,z,1.2,2.2,.8,'#a24f3c');this.box(x,1.43,z+.411,.91,1.17,.03,'#324b49');this.box(x,.45,z+.43,.67,.32,.03,'#213833');this.box(x+.46,.85,z+.44,.11,.5,.03,'#c4bba0');
  const colors=['#d4d3b3','#87a78c','#d1af65','#ad755a','#a9c1b0','#798eaa'];for(let row=0;row<3;row++){this.box(x,1.05+row*.34,z+.48,.93,.035,.12,'#c0b89e');for(let j=0;j<6;j++){const xx=x-.39+j*.154;this.cylinder(xx,1.18+row*.34,z+.47,.046,.22,colors[j]);this.cylinder(xx,1.32+row*.34,z+.47,.023,.05,'#c9d0bc');}}
  this.label('冷饮  /  REFRESH',x,2.02,z+.42,1.08,'#a24f3c');this.colliders.push([x-.65,x+.65,z-.45,z+.45]);
  this.box(-4.5,.6,12,1.8,1.2,.9,'#7a6950');this.box(-4.5,1.25,12,2,.14,1.1,'#c1b695');for(let i=0;i<9;i++)this.box(-5.2+i*.17,1.4,12,.12,.22,.6,['#819382','#c8b47f','#8e7264'][i%3]);this.label('城市漫步  CITY WALKS',-4.5,.85,12.46,1.7,'#66755a');this.colliders.push([-5.5,-3.5,11.5,12.5]);
  for(let z=-68;z<80;z+=25){this.cylinder(-25,5.5,z,.13,11,'#8d8971');this.box(-25,10.4,z,3,.13,.16,'#777d69');}
  const points=[];for(let i=0;i<=100;i++){const z=-68+i*1.5;points.push(new T.Vector3(-24,10.4-Math.sin((z+68)%25/25*Math.PI)*.7,z));}const cable=new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:'#59675b'}));this.root.add(cable);
  // Flower beds, grasses and leaf litter soften the paving edges.
  const random=seeded(818);for(let i=0;i<220;i++){const z=-75+random()*150,x=-8+random()*2;this.add('cone',x,.12+random()*.25,z,.045,.3+random()*.3,.045,['#7f9160','#9da274','#b1aa6b'][i%3],random()*6);}
  for(let i=0;i<70;i++){const x=-11+random()*22,z=-70+random()*140;this.add('sphere',x,.025,z,.04+random()*.04,.012,.07+random()*.05,['#a69763','#8d8e5a','#b7a777'][i%3],random()*6);}
 }
 rail(x,start,end){for(let z=start;z<=end;z+=4)this.box(x,.7,z,.12,1.4,.12,'#657266');this.box(x,1.35,(start+end)/2,.12,.1,end-start,'#929c86');this.box(x,.5,(start+end)/2,.08,.07,end-start,'#929c86');}
 boat(x,z,scale=1){const g=new T.Group();const hull=new T.Mesh(new T.CylinderGeometry(1, .6,1,6),this.mat('#e8e1cb'));hull.rotation.z=Math.PI/2;hull.scale.set(.7,5,1.1);g.add(hull);const deck=new T.Mesh(this.geos.box,this.mat('#eee9d9'));deck.scale.set(4,.7,1.4);deck.position.y=.6;g.add(deck);const window=new T.Mesh(this.geos.box,this.mat('#5c898a'));window.scale.set(3,.4,1.43);window.position.y=.65;g.add(window);g.position.set(x,.1,z);g.scale.setScalar(scale);this.root.add(g);this.animated.push({type:'boat',mesh:g,x,z});}
 shanghai(){
  buildBund(this);this.waterPlane(385,0,730,1200,'#69958e');buildPudongSkyline(this);this.puddles=makePuddles(this,27,304);this.puddles.position.set(3,.012,0);this.root.add(this.puddles);this.clouds.visible=false;
  this.boat(38,-18,1.1);this.boat(62,38,.8);
  this.station(-9,-30,'2   地铁  METRO →','#4b633c');
 }
 station(x,z,text,color){this.box(x,1.2,z,4.8,2.4,3.1,'#354b43');this.box(x,2.7,z,5.3,.25,3.6,'#bac3a8');this.label(text,x,2.15,z+1.57,4.6,color);this.box(x,.06,z+3,4.7,.1,3,'#8e9580');for(let i=0;i<7;i++)this.box(x,.07+i*.025,z+1.7+i*.21,4,.08,.14,'#cad0b7');this.colliders.push([x-2.5,x+2.5,z-1.6,z+1.6]);}
 exhibit(project,index){buildExhibit(this,project,index);}
 loadMetro(stop,projects){buildMetro(this,stop,projects);}
 load(stop,projects){this.clear();this.stop=stop;this.random=seeded(stop.id.split('').reduce((a,c)=>a+c.charCodeAt(0),1));this.bounds=[-48,16,-78,70];
  const cool=stop.theme==='stockholm';this.shadowAnchor=null;this.clouds.visible=stop.theme==='shanghai'||stop.theme==='yacht';this.scene.fog.color.set(stop.theme==='shanghai'?'#c1bbb6':cool?'#b7c5cc':'#a9bfd0');this.scene.fog.density=stop.theme==='yacht'?.0008:.0017;this.sky.material.uniforms.top.value.set(stop.theme==='yacht'?'#709eac':cool?'#8ba6ab':'#729caf');
  if(stop.theme==='shanghai')this.shanghai();else if(stop.theme==='airport')this.airport();else if(stop.theme==='yacht')this.yacht();else if(MAIN_PLACES[stop.id])MAIN_PLACES[stop.id](this);else this.city(stop);
  if(stop.id!=='shanghai')projects.forEach((p,i)=>this.exhibit(p,i));if(stop.next)this.markers.push({kind:stop.id==='shanghai'?'entrance':'gate',x:stop.gate[0],z:stop.gate[1]+3,y:4.5,title:stop.mode==='flight'?'Departures':stop.mode==='caltrain'?'Caltrain station':stop.mode==='bart'?'BART station':'Metro Line 2',subtitle:stop.transport.toUpperCase(),symbol:stop.mode==='flight'?'↗':'↓'});
  else this.markers.push({kind:'finish',x:0,z:-7,y:3,title:'The open sea',subtitle:'THE JOURNEY CONTINUES',symbol:'≈'});
  this.applyLighting();if(this.water?.material.uniforms.sunDirection)this.water.material.uniforms.sunDirection.value.copy(this.sunOffset).normalize();this.addFoliage();this.flush();this.camera.position.set(stop.spawn[0],1.75,stop.spawn[1]);this.camera.rotation.set(stop.theme==='shanghai'?.025:0,stop.theme==='shanghai'?.16:stop.theme==='yacht'?-.65:stop.theme==='sf'?-.2:0,0,'YXZ');if(this.renderer)this.renderer.shadowMap.needsUpdate=true;
 }
 city(stop){
  const nordic=stop.theme==='stockholm',campus=stop.theme==='campus'||stop.theme==='redwood';this.pavement(-20,0,76,180,nordic?'#b7b4a0':'#b9b49a');this.waterPlane(110,-10,180,300,nordic?'#689491':'#669c96');this.rail(17,-85,85);
  if(campus){this.box(-25,.03,-10,30,.04,130,'#8a9865');this.box(5,.03,-27,15,.04,38,'#94a173');this.pavement(0,-25,7,110,'#c8bea0');}
  for(let i=0;i<9;i++){const z=-80+i*20,color=nordic?['#c6aa79','#c7b489','#b58571','#c0a891'][i%4]:['#c2b393','#cdbf9f','#b3b194'][i%3];this.building(-30,z,nordic?10:19,14,nordic?13+(i%3)*2:10+(i%3)*3,color,nordic?'nordic':'classic');if(nordic)this.building(-43,z+3,12,16,17,color,'nordic');this.tree(-11,z+3,.9,stop.theme==='redwood');this.lamp(13,z+5);if(i%2===0)this.bench(12,z+9,-Math.PI/2);}
  if(stop.id==='berkeley'||stop.id==='paloalto'||stop.id==='sacramento'){
   this.building(0,-61,8,8,37,'#d3cbb0');this.box(0,38.4,-61,9,1,9,'#d3cbb0');this.add('cone',0,43,-61,5.8,8,5.8,'#a6ad96',Math.PI/4);this.label(stop.id==='berkeley'?'BERKELEY':'IDEAS TAKE ROOT',0,3,-56.94,7,'#586d50');
   for(let side of [-1,1])for(let i=0;i<5;i++)this.tree(side*10,-45-i*8,1.2,true);
   // Clock faces are geometric dials mounted on the campanile.
   const clock=new T.Mesh(new T.CircleGeometry(1.65,32),this.mat('#f0e7cd'));clock.position.set(0,32,-56.94);this.root.add(clock);this.box(0,32.4,-56.9,.08,.85,.03,'#536053');this.box(.45,32,-56.88,.9,.07,.03,'#536053');
  } else if(stop.theme==='sf'){
   for(const x of [55,110]){this.box(x,12,-72,2,24,3,'#b8795c');this.box(x,24,-72,7,1,3,'#b8795c');}
   this.box(83,6,-72,100,.6,5,'#a97961');for(let x=35;x<=130;x+=3){const y=8+15*Math.pow(Math.abs((x-83)/48),1.7);this.box(x,(y+6)/2,-70,.08,y-6,.08,'#c1906c');this.sphere(x,y,-70,.18,.18,.18,'#ae765a');}
   for(let i=0;i<25;i++)this.building(45+this.random()*70,-110+this.random()*75,6,8,12+this.random()*30,'#a5b5ab','modern',false);this.boat(45,5,1.5);
  }else if(nordic){for(let i=0;i<13;i++)this.building(45+i*6,-60,6,12,11+(i%4)*2,['#bb9674','#d0bb8c','#b2a78d'][i%3],'nordic',false);this.box(71,18,-66,5,36,5,'#bdac8b');this.add('cone',71,41,-66,4,11,4,'#668172');this.boat(31,-6,1.4);}
  else if(stop.theme==='modern'){for(let i=0;i<28;i++)this.building(50+this.random()*70,-100+this.random()*100,6,8,15+this.random()*42,'#9aafab','modern',false);}
  const text=stop.mode==='flight'?'AIRPORT CONNECTION  ↗':stop.mode==='caltrain'?'CALTRAIN  ·  SOUTHBOUND':stop.mode==='bart'?'BART  ·  BAY AREA':'DEPARTURES  ↗';this.station(-9,-30,text,stop.mode==='caltrain'?'#965b47':'#4c766c');
 }
 airport(){buildPudongTerminal(this);}
 airplane(x,z){const g=new T.Group();const body=new T.Mesh(new T.CylinderGeometry(1.5,1.5,26,20),this.mat('#e7e9df'));body.rotation.x=Math.PI/2;g.add(body);const nose=new T.Mesh(new T.SphereGeometry(1.5,16,8),this.mat('#e7e9df'));nose.position.z=13;nose.scale.z=2;g.add(nose);const wing=new T.Mesh(this.geos.box,this.mat('#c3d1cd'));wing.scale.set(31,.2,5);wing.position.z=-2;wing.rotation.y=.12;g.add(wing);const tail=new T.Mesh(this.geos.box,this.mat('#597669'));tail.scale.set(.3,7,5);tail.position.set(0,3,-11);g.add(tail);for(let i=-9;i<10;i+=1.3){for(const side of [-1,1]){const window=new T.Mesh(this.geos.box,this.mat('#5a898e'));window.scale.set(.05,.4,.55);window.position.set(side*1.48,.3,i);g.add(window);}}g.position.set(x,3,z);g.rotation.y=.25;this.root.add(g);return g;}
 yacht(){
  this.bounds=[-3.7,3.7,-15,14];this.waterPlane(0,0,650,650,'#3c8e90');this.box(0,-.21,0,8,.4,31,'#a5845d');
  for(let z=-15;z<16;z+=.28)this.box(0,.01,z,7.9,.025,.025,'#8c795e');this.box(0,1.1,-1,3.5,2.2,5,'#ede9da');this.box(0,2.28,-1,3.9,.25,5.5,'#f2efdf');this.box(0,1.35,1.52,3,.6,.03,'#456e72');this.colliders.push([-1.8,1.8,-3.5,1.5]);
  for(const x of [-3.85,3.85]){this.rail(x,-15,15);this.box(x,.18,0,.2,.36,31,'#ece9d8');}this.box(0,.6,-15,8,1.2,.18,'#e2e3d0');this.box(0,.6,15,8,1.2,.18,'#e2e3d0');this.cylinder(0,8.5,-5,.12,17,'#e2e6d5');
  const sail=new T.Shape();sail.moveTo(0,0);sail.lineTo(0,13);sail.lineTo(6,1);sail.closePath();const mesh=new T.Mesh(new T.ShapeGeometry(sail),new T.MeshStandardMaterial({color:'#f6efd7',side:T.DoubleSide,roughness:1}));mesh.position.set(.1,3,-5);mesh.rotation.y=-.4;this.root.add(mesh);
  for(let island=0;island<4;island++){const geo=new T.PlaneGeometry(130,85,40,28);geo.rotateX(-Math.PI/2);const pos=geo.attributes.position;for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i),edge=Math.max(0,1-Math.pow(x/65,2))*Math.max(0,1-Math.pow(z/42.5,2));const h=edge*(7+5*Math.sin(x*.07+island)*Math.cos(z*.085)+3*Math.sin(x*.18+z*.12));pos.setY(i,h-1);}geo.computeVertexNormals();const land=new T.Mesh(geo,this.mat('#60735e'));land.position.set(-170+island*130,0,-180-island%2*45);land.receiveShadow=true;this.root.add(land);if(island===1)for(let j=0;j<7;j++)this.building(-55+j*6,-153,4.5,5,3.5,'#d7cbb3','nordic',false);}
  this.label('THE JOURNEY CONTINUES',0,1.5,-14.87,5,'#436a61');this.boat(28,-30,1.3);
 }
 startTransit(mode){
  this.clear();this.stop=null;this.applyLighting();this.scene.fog.density=.0015;this.bounds=[-100,100,-100,100];this.camera.position.set(0,2,8);this.camera.rotation.set(.025,0,0,'YXZ');
  if(mode==='metro'){buildTrainInterior(this,mode);}
  else if(mode==='flight'){
   this.waterPlane(0,0,600,600,'#6c9eab');this.camera.position.set(0,55,8);this.camera.rotation.set(-.15,0,0,'YXZ');
   this.box(4,52,-6,22,.18,7,'#d5ddce',-.3);this.box(14,53,-9,.2,3,5,'#93aaa2');
   for(let i=0;i<55;i++){this.sphere(-180+this.random()*360,35+this.random()*16,-200+this.random()*360,10+this.random()*14,2+this.random()*4,6+this.random()*12,'#e4e6d8');}
  }else{
   this.box(0,-.1,0,4.2,.2,55,'#727e77');this.box(0,4,0,4.2,.2,55,'#c8c9b7');for(const side of [-2.2,2.2]){this.box(side,.6,0,.15,1.2,55,'#657a70');this.box(side,3.75,0,.15,.5,55,'#9aa999');}
   for(let z=-26;z<27;z+=4){for(const x of [-1.5,1.5]){this.box(x,.6,z,1,1.2,1.4,'#708f7b');this.box(x,1.7,z-.65,1,1.3,.15,'#75917d');this.box(x,2,z+1,.04,4,.04,'#bdcbbf');}this.box(0,3.86,z,.8,.04,2.3,'#f4f0d1');
    for(const x of [-2.2,2.2]){this.box(x,2.3,z+1.6,.15,2.5,.45,'#9fae9c');this.box(x,1.35,z,.2,.12,3,'#c7cdb7');}}
   this.label(mode==='metro'?'LINE 2  ·  PUDONG AIRPORT':mode==='bart'?'BART  ·  NEXT CHAPTER':'CALTRAIN  ·  REDWOOD CITY',0,3,-20,3.5,'#305441');
   this.flush();const childCount=this.root.children.length;for(let i=0;i<48;i++){const z=-240+i*12;for(const x of [-14,14]){if(mode==='metro'||mode==='bart'){this.box(x,3,z,1,8,12,'#586b66');this.box(x+(x<0?1:-1),3,z,.1,.3,2,'#dce6c6');}else this.building(x*1.4,z,5,6,6+this.random()*12,'#91a59a','modern',false);}}this.flush();const moving=new T.Group();for(const child of this.root.children.slice(childCount))moving.add(child);this.root.add(moving);this.animated.push({type:'rail',mesh:moving});this.camera.rotation.y=-.18;
  }this.flush();if(this.renderer)this.renderer.shadowMap.needsUpdate=true;
 }
 arriveMetro(){arriveMetroTrain(this);}
 update(t,dt,moving=false,reduced=false){updatePlatformTrain(this,dt,reduced);updateTrainRide(this,dt,reduced);this.clouds.material.uniforms.cloudTime.value=reduced?0:t;if(this.renderer&&this.stop&&(!this.shadowAnchor||this.camera.position.distanceTo(this.shadowAnchor)>12)){this.shadowAnchor=this.camera.position.clone();const x=this.camera.position.x,z=this.camera.position.z;this.sun.target.position.set(x,0,z);this.sun.position.copy(this.sunOffset).add(new T.Vector3(x,0,z));this.renderer.shadowMap.needsUpdate=true;}if(this.water?.material.uniforms.waterTime)this.water.material.uniforms.waterTime.value=reduced?0:t;if(this.foliageMaterial?.userData.shader)this.foliageMaterial.userData.shader.uniforms.leafTime.value=reduced?0:t;for(const item of this.animated){if(item.type==='rail'){item.start??=t;item.mesh.position.z=reduced?0:(t-item.start)*19;continue;}item.mesh.position.y=reduced?.1:.1+Math.sin(t*.7)*.07;item.mesh.position.z=item.z+(reduced?0:Math.sin(t*.025)*16);item.mesh.rotation.z=reduced?0:Math.sin(t*.6)*.025;}if(this.stop?.theme==='yacht'&&!reduced){this.camera.position.y=1.75+Math.sin(t*.6)*.035;}}
}
