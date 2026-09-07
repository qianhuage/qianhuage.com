import * as T from '../vendor/three.module.js';
import {Reflector} from '../vendor/addons/objects/Reflector.js';
import {RoundedBoxGeometry} from '../vendor/addons/geometries/RoundedBoxGeometry.js';
import {RectAreaLightUniformsLib} from '../vendor/addons/lights/RectAreaLightUniformsLib.js';

// Original geometry guided by the station and carriage references supplied by Qianhua.
// No CGTrader meshes, textures, or preview images are distributed with the site.
export function transitMaterials(w){
 if(w.materials.has('metro-steel'))return;
 RectAreaLightUniformsLib.init();
 w.geos.metroRounded=new RoundedBoxGeometry(1,1,1,3,.075);w.geos.metroRing=new T.TorusGeometry(1,.045,8,48);
 const texture=(kind)=>{const n=256,data=new Uint8Array(n*n*4);for(let y=0;y<n;y++)for(let x=0;x<n;x++){const i=(y*n+x)*4,noise=((x*73856093^y*19349663)>>>0)%23;let c=kind==='marble'?45+Math.sin(x*.03+Math.sin(y*.027)*4)*7+noise*.35:kind==='rubber'?35+noise*.45:182+noise*.35;if(kind==='tiles'&&(x<2||y<2))c=125;data[i]=data[i+1]=data[i+2]=c;data[i+3]=255;}const t=new T.DataTexture(data,n,n);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.generateMipmaps=true;t.minFilter=T.LinearMipMapLinearFilter;t.anisotropy=8;t.needsUpdate=true;return t;};
 const specs={
 'metro-steel':{color:'#a8b0b1',metalness:.85,roughness:.3},
 'metro-dark':{color:'#24302e',map:texture('marble'),roughness:.24,metalness:.22},
 'metro-stone':{color:'#d5d3c8',roughness:.45,metalness:.05,bumpMap:w.surfaceNoise,bumpScale:.002},
 'metro-floor':{color:'#c9c8c2',map:texture('tiles'),roughness:.3,metalness:.1},
 'metro-rubber':{color:'#b3b3b3',map:texture('rubber'),roughness:.9},
 'metro-black':{color:'#151b1c',roughness:.37,metalness:.4},
 'metro-ivory':{color:'#d4d5ca',roughness:.47,metalness:.1},
 'metro-light':{color:'#fff8e8',emissive:'#fff4dd',emissiveIntensity:3.5,roughness:.3},
 'metro-glass':{color:'#223b3e',metalness:.6,roughness:.16},
 'metro-window':{color:'#738e91',metalness:.25,roughness:.2,transparent:true,opacity:.2,depthWrite:false},
 'metro-seat':{color:'#36586a',roughness:.3,metalness:.15},
 'metro-green':{color:'#3b6742',roughness:.5},
 'metro-tactile':{color:'#b99f56',roughness:.73}
 };for(const [key,props]of Object.entries(specs))w.materials.set(key,new T.MeshStandardMaterial(props));
}
function rounded(w,x,y,z,sx,sy,sz,mat,ry=0){w.add('metroRounded',x,y,z,sx,sy,sz,mat,ry);}
function tube(w,a,b,r=.025,mat='metro-steel'){
 const start=new T.Vector3(...a),end=new T.Vector3(...b),mesh=new T.Mesh(new T.CylinderGeometry(r,r,start.distanceTo(end),12),w.mat(mat));mesh.position.copy(start).add(end).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),end.sub(start).normalize());mesh.castShadow=true;w.root.add(mesh);
}
function area(w,x,y,z,width,height,intensity=5,down=true){const l=new T.RectAreaLight('#fff4e0',intensity,width,height);l.position.set(x,y,z);l.lookAt(x,down?0:y,down?z:z+1);w.root.add(l);}
function surface(w,width,depth,y,material,x=0,z=0,tile=1.2){const geo=new T.PlaneGeometry(width,depth);const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*width/tile,uv.getY(i)*depth/tile);const plane=new T.Mesh(geo,w.mat(material));plane.rotation.x=-Math.PI/2;plane.position.set(x,y,z);plane.receiveShadow=true;w.root.add(plane);}
function polishedFloor(w){
 const shader={uniforms:T.UniformsUtils.clone(Reflector.ReflectorShader.uniforms),vertexShader:Reflector.ReflectorShader.vertexShader,fragmentShader:`uniform sampler2D tDiffuse;varying vec4 vUv;void main(){vec2 uv=vUv.xy/vUv.w;vec3 c=texture2D(tDiffuse,uv).rgb*.4;c+=texture2D(tDiffuse,uv+vec2(.0014,0.)).rgb*.15;c+=texture2D(tDiffuse,uv-vec2(.0014,0.)).rgb*.15;c+=texture2D(tDiffuse,uv+vec2(0.,.0014)).rgb*.15;c+=texture2D(tDiffuse,uv-vec2(0.,.0014)).rgb*.15;gl_FragColor=vec4(c,.2);}`};
 const mirror=new Reflector(new T.PlaneGeometry(14,48),{textureWidth:innerWidth<750?512:1024,textureHeight:innerWidth<750?512:1024,multisample:0,shader});mirror.rotation.x=-Math.PI/2;mirror.position.y=.014;mirror.material.transparent=true;mirror.material.depthWrite=false;mirror.userData.noAO=true;mirror.renderOrder=1;w.root.add(mirror);w.puddles=mirror;
}
export function interiorLighting(w){
 if(!w.renderer)return;
 if(!w.transitEnvironment){const scene=new T.Scene();scene.background=new T.Color('#252b2c');const room=new T.Mesh(new T.BoxGeometry(16,5,40),new T.MeshBasicMaterial({color:'#555b59',side:T.BackSide}));room.position.y=2;scene.add(room);for(const x of [-3,3]){const strip=new T.Mesh(new T.BoxGeometry(1,.04,30),new T.MeshBasicMaterial({color:new T.Color(5,4.8,4.2)}));strip.position.set(x,4.2,0);scene.add(strip);}const gen=new T.PMREMGenerator(w.renderer);w.transitEnvironment=gen.fromScene(scene,.035,.1,100);gen.dispose();scene.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}
 w.scene.environment=w.transitEnvironment.texture;w.scene.environmentIntensity=.55;
}
function chandelier(w,z){
 w.cylinder(0,4.5,z,.035,1.3,'metro-steel');const ring=new T.Mesh(w.geos.metroRing,w.mat('metro-steel'));ring.rotation.x=Math.PI/2;ring.position.set(0,3.98,z);ring.scale.set(1.05,1.05,1.05);w.root.add(ring);
 for(let i=0;i<10;i++){const a=i*Math.PI/5,x=Math.cos(a)*1.05,zz=z+Math.sin(a)*1.05;w.cylinder(x,4.13,zz,.065,.35,'metro-steel');w.sphere(x,3.96,zz,.105,.15,.105,'metro-light');}area(w,0,3.88,z,2.5,2.5,8);
}
export function stationArchitecture(w){
 transitMaterials(w);w.bounds=[-6.9,6.9,-22.5,22.5];w.sceneKind='metro-station';
 // Compact human-scale concourse, dark stone colonnade, inset brass and ceramic walls.
 w.box(0,-.12,0,15,.24,48,'metro-stone');surface(w,14,48,.005,'metro-floor');
 for(const x of [-4.8,4.8]){w.box(x,.009,0,.38,.009,48,'metro-dark');w.box(x+.24,.012,0,.025,.01,48,'#9b8d62');}
 for(const side of [-1,1]){
  const x=side*7.25;w.box(x,2.35,0,.35,4.7,48,'metro-ivory');w.box(x-side*.2,.4,0,.12,.8,48,'metro-dark');w.box(x-side*.23,.84,0,.15,.06,48,'metro-steel');w.box(x-side*.18,3.65,0,.12,.12,48,'metro-dark');
  for(let z=-23.5;z<24;z+=.8)for(let y=1.1;y<3.6;y+=.4){w.box(x-side*.19,y,z+(Math.round(y/.4)%2)*.4,.06,.385,.785,'metro-stone');}
  for(let z=-20;z<=20;z+=8){w.box(side*6.3,4.55,z,1.1,.12,6.8,'metro-black');w.box(side*6.3,4.47,z,.65,.04,6.4,'metro-light');}
 }
 w.box(0,5.05,0,15,.25,48,'metro-dark');for(const x of [-4,4])w.box(x,4.85,0,1.25,.45,48,'metro-dark');
 for(let z=-20;z<=20;z+=8){for(const x of [-4,4]){w.box(x,.12,z,1.15,.24,1.15,'metro-dark');w.cylinder(x,2.45,z,.38,4.5,'metro-dark');w.cylinder(x,.31,z,.47,.15,'metro-steel');w.box(x,4.75,z,1.05,.25,1.05,'metro-dark');w.colliders.push([x-.58,x+.58,z-.58,z+.58]);}chandelier(w,z);}
 // Illuminated wall inscriptions and small wayfinding bands.
 for(const z of [-13,3,19]){w.label('南京东路  /  EAST NANJING ROAD',-7.01,3.37,z,5,'#232e2d','#e9e8df',Math.PI/2);w.label('2   站台 PLATFORM',7.01,3.37,z,4.5,'#345a3e','#eaece2',-Math.PI/2);}
 // Screen doors face a recessed track and a visible train, rather than a painted back wall.
 w.box(0,4.05,-23.6,15,2.3,.25,'metro-stone');w.box(0,3,-29.5,180,6,.3,'metro-dark');w.box(0,5,-26,180,.2,8,'metro-dark');w.box(0,-.55,-25,15,.3,5,'metro-black');for(const z of [-24.6,-26.1])w.box(0,-.26,z,15,.12,.08,'metro-steel');
 platformTrain(w);
 w.box(0,.02,-22.35,14,.025,.38,'metro-tactile');for(let x=-6.8;x<7;x+=.14)for(const z of [-22.48,-22.34,-22.2])w.cylinder(x,.043,z,.025,.027,'metro-tactile');
 w.colliders.push([-7.2,7.2,-24,-23]);
 // Rear exit, benches and bins give a complete view when turning around.
 w.box(0,2.4,24,15,4.8,.3,'metro-dark');w.label('↑  出口 EXIT  ·  外滩 THE BUND',0,3.5,23.78,5,'#28362c','#f3f0df');
 for(let i=0;i<9;i++)w.box(0,.09+i*.17,22+i*.23,3.7,.18,.27,'metro-stone');
 for(const side of [-1,1]){tube(w,[side*2,1.05,21.5],[side*2,2.5,24]);for(const z of [-5,15]){rounded(w,side*5.9,.53,z,.85,.16,2.8,'metro-steel');for(const zz of [z-1,z+1])w.box(side*5.9,.25,zz,.09,.5,.12,'metro-steel');w.colliders.push([side*5.9-.55,side*5.9+.55,z-1.5,z+1.5]);}rounded(w,side*5.9,.55,-18,.55,1.1,.55,'metro-steel');w.box(side*5.9,.99,-17.72,.34,.2,.03,'metro-black');}
 polishedFloor(w);
 w.landmarks.push('Dark stone colonnade','Wall lightbox','Platform screen doors','Recessed train');
}
export function metroWallAd(w,p){
 const x=-6.99,z=8,width=4.7,height=2.65;
 w.box(x+.05,2.1,z,.17,height+.17,width+.17,'metro-black');w.box(x+.15,2.1,z,.04,height+.05,width+.05,'metro-light');
 const texture=new T.TextureLoader().load(p.img);texture.colorSpace=T.SRGBColorSpace;
 const mesh=new T.Mesh(new T.PlaneGeometry(width,height),new T.MeshStandardMaterial({map:texture,emissiveMap:texture,emissive:'#ffffff',emissiveIntensity:.8,roughness:.48}));mesh.position.set(x+.18,2.1,z);mesh.rotation.y=Math.PI/2;mesh.userData.presentation='wall-lightbox';w.root.add(mesh);
 const light=new T.RectAreaLight('#ffffff',3,width,height);light.position.set(x+.22,2.1,z);light.lookAt(0,2.1,z);w.root.add(light);
 w.markers.push({kind:'project',project:p,x:-6.6,z,y:2.1,title:p.title,subtitle:'DISCOVER WORK',symbol:'◇',presentation:'wall-lightbox',approach:[-3,8]});
}
export function buildTrainInterior(w,mode){
 transitMaterials(w);w.zone='train';w.sceneKind='train-interior';w.trainRide={doors:[],elapsed:0,arrived:false};w.applyLighting();
 w.camera.position.set(.25,1.65,7.7);w.camera.rotation.set(.02,-.08,0,'YXZ');
 surface(w,3.55,24,.005,'metro-rubber',0,0,.6);w.box(0,-.12,0,3.7,.24,24,'metro-steel');
 // Curved shoulder panels connect walls to the shallow barrel ceiling.
 const curve=[];for(let i=0;i<=24;i++){const a=i*Math.PI/24;curve.push(new T.Vector2(Math.cos(a)*1.82,2.32+Math.sin(a)*.47));}
 for(let i=0;i<curve.length-1;i++){const a=curve[i],b=curve[i+1],geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute([a.x,a.y,-12,b.x,b.y,-12,a.x,a.y,12,b.x,b.y,-12,b.x,b.y,12,a.x,a.y,12],3));geo.computeVertexNormals();const mat=w.mat('metro-ivory');mat.side=T.DoubleSide;w.root.add(new T.Mesh(geo,mat));}
 for(const side of [-1,1]){
  const x=side*1.81;w.box(x,.47,0,.08,.94,24,'metro-steel');w.box(x,2.25,0,.08,.33,24,'metro-steel');w.box(x-side*.06,.13,0,.04,.2,24,'metro-black');
  for(let z=-9;z<=9;z+=6){
   // Double sliding doors: recessed windows, center seal, edge rails and handles.
   for(const dz of [-.37,.37]){const g=new T.Group();g.position.z=z+dz;w.root.add(g);component(w,g,x-side*.065,1.18,0,.065,2.25,.71,'metro-ivory',true);component(w,g,x-side*.11,1.58,0,.04,.8,.47,'metro-black',true);component(w,g,x-side*.14,1.6,0,.02,.65,.34,'metro-glass');w.trainRide.doors.push({mesh:g,home:g.position.z,sign:Math.sign(dz)});}
   w.box(x-side*.17,1.15,z,.015,2.28,.024,'metro-black');w.box(x-side*.2,2.34,z,.18,.16,1.72,'metro-black');w.label('请勿倚靠车门  /  KEEP CLEAR',x-side*.19,2.13,z,1.25,'#d3d7d1','#30383a',-side*Math.PI/2);
  }
  for(let z=-6;z<=6;z+=6){
   for(const yy of [1.14,2.15])w.box(x-side*.07,yy,z,.075,.07,3.55,'metro-black');for(const zz of [z-1.76,z+1.76])w.box(x-side*.07,1.65,zz,.075,1.06,.07,'metro-black');w.box(x-side*.11,1.65,z,.025,.94,3.43,'metro-window');
   for(let i=-2;i<=2;i++){const zz=z+i*.57;rounded(w,side*1.38,.47,zz,.64,.17,.54,'metro-seat');rounded(w,side*1.68,.79,zz,.14,.58,.54,'metro-seat');}
   w.box(side*1.4,.3,z,.5,.25,2.8,'metro-steel');for(const zz of [z-1.55,z+1.55]){tube(w,[side*1.02,.38,zz],[side*1.02,2.48,zz]);for(const yy of [.72,.92,1.12])tube(w,[side*1.02,yy,zz],[side*1.65,yy,zz]);}
   w.label(mode==='metro'?'2  南京东路  →  浦东国际机场':mode==='bart'?'BART  /  EAST BAY → SAN FRANCISCO':'CALTRAIN  /  SAN FRANCISCO → REDWOOD CITY',x-side*.14,2.36,z,3.6,'#e1e3da','#24482f',-side*Math.PI/2);
  }
  tube(w,[side*.87,2.46,-11],[side*.87,2.46,11]);for(let z=-10;z<=10;z+=1.6){tube(w,[side*.87,2.47,z],[side*.87,2.21,z],.014,'metro-black');const ring=new T.Mesh(w.geos.metroRing,w.mat('metro-ivory'));ring.position.set(side*.87,2.1,z);ring.scale.set(.105,.13,.105);w.root.add(ring);}
  w.box(side*1.2,2.62,0,.3,.055,23,'metro-light');for(let z=-8;z<=8;z+=8)area(w,side*1.13,2.56,z,.4,6,6);
 }
 for(const z of [-8,0,8])tube(w,[0,.02,z],[0,2.75,z],.027);
 for(const x of [-.55,.55])for(let z=-11;z<12;z+=.3)w.box(x,2.746,z,.38,.016,.06,'metro-steel');
 for(const z of [-12,12]){w.box(0,1.35,z,3.6,2.7,.15,'metro-steel');rounded(w,0,1.21,z+(z<0?.09:-.09),.88,2.34,.08,'metro-black');rounded(w,0,1.25,z+(z<0?.14:-.14),.72,2.2,.06,'metro-ivory');rounded(w,0,1.62,z+(z<0?.19:-.19),.52,.82,.04,'metro-glass');}
 w.label(mode==='metro'?'2   NEXT: PUDONG AIRPORT':mode==='bart'?'NEXT: SAN FRANCISCO':'NEXT: REDWOOD CITY',0,2.5,-11.88,2.6,'#151e1e','#cadca8');
 w.flush();const childCount=w.root.children.length;
 for(let z=-130;z<35;z+=5)for(const side of [-1,1]){w.box(side*3.1,1.4,z,.4,3.3,5,'metro-black');w.box(side*2.86,1.7,z,.015,.09,1.4,'metro-light');}
 w.flush();const tunnel=new T.Group();for(const child of w.root.children.slice(childCount))tunnel.add(child);w.root.add(tunnel);w.trainRide.tunnel=tunnel;
 const platform=new T.Group();platform.visible=false;w.root.add(platform);for(const side of [-1,1]){component(w,platform,side*4,-.08,0,4,.16,26,'metro-floor');component(w,platform,side*5.8,1.5,0,.2,3,26,'metro-ivory');component(w,platform,side*3.4,2.8,0,3,.08,26,'metro-light');const sign=w.label('浦东国际机场  /  PUDONG AIRPORT',side*5.6,1.7,7,6,'#253e2b','#ffffff',-side*Math.PI/2);platform.add(sign);}
 w.trainRide.platform=platform;
 w.landmarks.push('Sliding train doors','Longitudinal seating','Overhead handrails');
}

function component(w,group,x,y,z,sx,sy,sz,mat,roundedShape=false){const m=new T.Mesh(w.geos[roundedShape?'metroRounded':'box'],w.mat(mat));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;}
export function platformTrain(w){
 const train=new T.Group(),doors=[],screens=[];train.position.set(-58,0,-26.15);w.root.add(train);
 component(w,train,0,.25,0,37,.45,2.8,'metro-steel',true);component(w,train,0,3.14,0,37,.36,3,'metro-ivory',true);component(w,train,0,1.65,-1.37,36,2.7,.09,'metro-steel');
 for(const x of [-18.2,18.2]){component(w,train,x,1.65,0,.65,2.9,2.8,'metro-steel',true);component(w,train,x,.65,1.44,.35,.2,.08,'metro-light');}
 for(let x=-16.5;x<=16.5;x+=3){if(Math.abs(x)<1.6||Math.abs(Math.abs(x)-12)<1.6)continue;component(w,train,x,1.15,1.39,2.8,1.6,.08,'metro-steel');component(w,train,x,2.55,1.39,2.8,.95,.08,'metro-steel');component(w,train,x,1.95,1.43,2.45,.92,.03,'metro-glass',true);component(w,train,x,.69,1.45,2.8,.15,.03,'metro-green');component(w,train,x,.57,-.9,2.2,.17,.5,'metro-seat');}
 for(const center of [-12,0,12])for(const sign of [-1,1]){const g=new T.Group();g.position.x=center+sign*.39;train.add(g);component(w,g,0,1.56,1.42,.76,2.8,.07,'metro-steel',true);component(w,g,0,1.95,1.47,.54,1.1,.035,'metro-black',true);component(w,g,0,1.95,1.495,.43,.95,.02,'metro-glass');doors.push({mesh:g,home:g.position.x,sign});}
 for(const center of [-12,0,12]){component(w,train,center,2.82,0,2.2,.03,1.6,'metro-light');component(w,train,center,.45,0,2,.08,2.7,'metro-rubber');}
 // Only the boarding pair opens; the rest of the platform barrier remains continuous.
 for(let x=-6.4;x<=6.4;x+=1.6){if(Math.abs(x)<1)continue;w.box(x,1.35,-23.35,.08,2.7,.12,'metro-steel');w.box(x,1.42,-23.37,1.48,2.38,.035,'metro-window');w.box(x,.28,-23.29,1.48,.4,.08,'metro-steel');}
 for(const sign of [-1,1]){const g=new T.Group();g.position.set(sign*.4,0,-23.35);w.root.add(g);component(w,g,0,1.35,0,.78,2.7,.045,'metro-window');component(w,g,sign*.35,1.35,.025,.055,2.7,.09,'metro-steel');component(w,g,0,.28,.03,.78,.4,.08,'metro-steel');screens.push({mesh:g,home:g.position.x,sign});}
 w.box(0,2.8,-23.35,14,.18,.2,'metro-black');w.metroArrival={train,doors,screens,phase:'waiting',elapsed:0};
}
export function metroArrivalFrame(time,reduced=false){const t=reduced?10:time;return {x:t>=8?0:-58*Math.pow(1-Math.min(t/8,1),3),doors:T.MathUtils.smoothstep(t,8.3,10),phase:t<8?'approaching':t<10?'opening':'boarding'};}
export function updatePlatformTrain(w,dt,reduced){const a=w.metroArrival;if(!a)return;if(a.phase==='waiting'){if(w.camera.position.z>-7)return;a.phase='approaching';}a.elapsed+=dt;const f=metroArrivalFrame(a.elapsed,reduced);a.phase=f.phase;a.train.position.x=f.x;for(const door of [...a.doors,...a.screens])door.mesh.position.x=door.home+door.sign*f.doors*.78;}
export function arriveMetroTrain(w){if(!w.trainRide)return;w.trainRide.arrived=true;w.trainRide.platform.visible=true;w.trainRide.tunnel.visible=false;}

export function updateTrainRide(w,dt,reduced){const r=w.trainRide;if(!r)return;r.elapsed+=dt;const opening=r.arrived?Math.min(1,(r.openTime=(r.openTime||0)+dt)/1.7):1-T.MathUtils.smoothstep(r.elapsed,.5,2.5);for(const d of r.doors)d.mesh.position.z=d.home+d.sign*opening*.72;if(!r.arrived&&!reduced)r.tunnel.position.z=Math.max(0,r.elapsed-2.5)*7;}
