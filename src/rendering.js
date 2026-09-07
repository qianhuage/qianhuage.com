import * as T from '../vendor/three.module.js';
import {Water} from '../vendor/addons/objects/Water2.js';
import {RGBELoader} from '../vendor/addons/loaders/RGBELoader.js';
import {EffectComposer} from '../vendor/addons/postprocessing/EffectComposer.js';
import {RenderPass} from '../vendor/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from '../vendor/addons/postprocessing/UnrealBloomPass.js';
import {SSAOPass} from '../vendor/addons/postprocessing/SSAOPass.js';
import {OutputPass} from '../vendor/addons/postprocessing/OutputPass.js';

function waveNormals(phase){const n=256,data=new Uint8Array(n*n*4);for(let y=0;y<n;y++)for(let x=0;x<n;x++){const u=x/n*Math.PI*2,v=y/n*Math.PI*2;let dx=0,dy=0;for(let i=1;i<=6;i++){const a=u*(i*2)+v*(i%2?i:-i)+phase,weight=.09/i;dx+=Math.cos(a)*weight;dy+=Math.cos(a+Math.sin(v)*.8)*weight;}const k=(y*n+x)*4;data[k]=Math.round(128+dx*110);data[k+1]=Math.round(128+dy*110);data[k+2]=253;data[k+3]=255;}const t=new T.DataTexture(data,n,n);t.wrapS=t.wrapT=T.RepeatWrapping;t.minFilter=T.LinearMipMapLinearFilter;t.magFilter=T.LinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;}
const normals=[waveNormals(0),waveNormals(2.7)];
export function makeWater(w,d,{reduced=false,ocean=false}={}){
 const shader={...Water.WaterShader,uniforms:T.UniformsUtils.clone(Water.WaterShader.uniforms)};
 shader.uniforms.waterTime={value:0};shader.uniforms.deepColor={value:new T.Color(ocean?'#16483f':'#344c42')};shader.uniforms.ocean={value:ocean?1:0};
 shader.vertexShader=shader.vertexShader.replace('varying vec3 vToEye;','varying vec3 vToEye; varying vec3 vWorld;').replace('vToEye = cameraPosition - worldPosition.xyz;','vToEye = cameraPosition - worldPosition.xyz; vWorld = worldPosition.xyz;');
 shader.fragmentShader=shader.fragmentShader.replace('varying vec3 vToEye;',`varying vec3 vToEye; varying vec3 vWorld; uniform float waterTime; uniform vec3 deepColor; uniform float ocean;`)
 .replace('vec3 normal = normalize( vec3( normalColor.r * 2.0 - 1.0, normalColor.b,  normalColor.g * 2.0 - 1.0 ) );',`vec2 q=vWorld.xz;
  vec2 longWave=vec2(cos(q.x*.8+q.y*.36-waterTime*.75),sin(q.y*.65-q.x*.3+waterTime*.6))*.055;
  vec2 fineWave=vec2(normalColor.r*2.-1.,normalColor.g*2.-1.)*.65;
  vec3 normal=normalize(vec3(longWave.x+fineWave.x,1.,longWave.y+fineWave.y));`)
 .replace('normal.xz * 0.05','normal.xz * 0.012')
 .replace('gl_FragColor = vec4( color, 1.0 ) * mix( refractColor, reflectColor, reflectance );',`float depth=mix(clamp((vWorld.x-18.)*.19,.3,4.),4.,ocean);
  float absorption=1.-exp(-depth*.15);
  vec3 underwater=mix(refractColor.rgb,deepColor,absorption);
  vec3 result=mix(underwater,reflectColor.rgb,reflectance);
  vec3 sunDirection=normalize(vec3(.76,.35,.55));
  vec3 halfway=normalize(sunDirection+toEye);
  float glint=pow(max(dot(normal,halfway),0.),850.)*4.;
  result+=vec3(1.,.91,.73)*glint;
  gl_FragColor=vec4(result,1.);`);
 const water=new Water(new T.PlaneGeometry(w,d),{color:'#fff',textureWidth:innerWidth<750?512:1024,textureHeight:innerWidth<750?512:1024,normalMap0:normals[0],normalMap1:normals[1],flowDirection:new T.Vector2(.28,.17),flowSpeed:reduced?0:.013,reflectivity:.025,scale:Math.max(w,d)/10,shader});
 water.rotation.x=-Math.PI/2;water.userData.noAO=true;return water;
}
export function setupEnvironment(renderer,scene,onReady){
 if(!renderer)return;
 const loader=new RGBELoader();loader.load('./images/pbr/morning.hdr',texture=>{
  texture.mapping=T.EquirectangularReflectionMapping;const generator=new T.PMREMGenerator(renderer);const env=generator.fromEquirectangular(texture);scene.environment=env.texture;scene.environmentIntensity=.55;scene.background=texture;scene.backgroundIntensity=.65;scene.backgroundBlurriness=0;generator.dispose();onReady?.();
 },undefined,error=>console.warn('HDR sky unavailable; using the procedural daylight fallback.',error));
}
export function createPipeline(renderer,scene,camera){
 const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
 const ao=new SSAOPass(scene,camera,innerWidth*.6,innerHeight*.6,16);ao.kernelRadius=.65;ao.minDistance=.0001;ao.maxDistance=.018;
 const resize=ao.setSize.bind(ao);ao.setSize=(w,h)=>resize(Math.max(1,Math.floor(w*.6)),Math.max(1,Math.floor(h*.6)));
 const override=ao.overrideVisibility.bind(ao);ao.overrideVisibility=()=>{override();scene.traverse(o=>{if(o.userData.noAO)o.visible=false;});};composer.addPass(ao);
 composer.addPass(new UnrealBloomPass(new T.Vector2(innerWidth*.5,innerHeight*.5),.23,.5,1.25));composer.addPass(new OutputPass());return composer;
}
export function makeSurfaceNoise(){const size=128,data=new Uint8Array(size*size*4);let seed=3;for(let i=0;i<data.length;i+=4){seed=(seed*1664525+1013904223)>>>0;const n=110+(seed%90);data[i]=data[i+1]=data[i+2]=n;data[i+3]=255;}const texture=new T.DataTexture(data,size,size);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.minFilter=T.LinearMipMapLinearFilter;texture.magFilter=T.LinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;return texture;}
