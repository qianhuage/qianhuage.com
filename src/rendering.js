import * as T from '../vendor/three.module.js';
import {Water} from '../vendor/addons/objects/Water2.js';
import {EffectComposer} from '../vendor/addons/postprocessing/EffectComposer.js';
import {RenderPass} from '../vendor/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from '../vendor/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from '../vendor/addons/postprocessing/OutputPass.js';

// Analytic wave gradients, encoded as tangent-space normal maps. No remote assets.
function waveNormals(phase){const n=256,data=new Uint8Array(n*n*4);for(let y=0;y<n;y++)for(let x=0;x<n;x++){const u=x/n*Math.PI*2,v=y/n*Math.PI*2;let dx=0,dy=0;for(let i=1;i<=5;i++){const a=u*(i*2)+v*(i%2?i:-i)+phase,weight=.14/i;dx+=Math.cos(a)*weight;dy+=Math.cos(a+Math.sin(v)*.8)*weight;}const k=(y*n+x)*4;data[k]=Math.round(128+dx*110);data[k+1]=Math.round(128+dy*110);data[k+2]=250;data[k+3]=255;}const t=new T.DataTexture(data,n,n);t.wrapS=t.wrapT=T.RepeatWrapping;t.needsUpdate=true;return t;}
const normals=[waveNormals(0),waveNormals(2.7)];
export function makeWater(w,d,{reduced=false,ocean=false}={}){const water=new Water(new T.PlaneGeometry(w,d),{color:ocean?'#a6d7cd':'#c0cec0',textureWidth:innerWidth<750?384:768,textureHeight:innerWidth<750?384:768,normalMap0:normals[0],normalMap1:normals[1],flowDirection:new T.Vector2(.35,.2),flowSpeed:reduced?0:.018,reflectivity:.09,scale:Math.max(w,d)/12});water.rotation.x=-Math.PI/2;return water;}
export function createPipeline(renderer,scene,camera){const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));const bloom=new UnrealBloomPass(new T.Vector2(innerWidth/2,innerHeight/2),.16,.45,1.25);composer.addPass(bloom);composer.addPass(new OutputPass());return composer;}
export function makeSurfaceNoise(){const size=128,data=new Uint8Array(size*size*4);let seed=3;for(let i=0;i<data.length;i+=4){seed=(seed*1664525+1013904223)>>>0;const n=110+(seed%90);data[i]=data[i+1]=data[i+2]=n;data[i+3]=255;}const texture=new T.DataTexture(data,size,size);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.needsUpdate=true;return texture;}
