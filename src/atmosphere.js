import * as T from '../vendor/three.module.js';
import {Reflector} from '../vendor/addons/objects/Reflector.js';

// One planar capture shared across the promenade; fragments expose only shallow puddles.
export function makePuddles(world,width,depth){
 const shader={uniforms:T.UniformsUtils.clone(Reflector.ReflectorShader.uniforms),vertexShader:`
  uniform mat4 textureMatrix;varying vec4 vReflect;varying vec3 vWorld;
  void main(){vReflect=textureMatrix*vec4(position,1.);vWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}
 `,fragmentShader:`
  uniform sampler2D tDiffuse;uniform vec3 color;varying vec4 vReflect;varying vec3 vWorld;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
  void main(){
   vec2 p=vWorld.xz;float wet=noise(p*.29+noise(p*.11)*2.);float mask=smoothstep(.56,.72,wet);
   float distanceToEye=length(cameraPosition-vWorld);mask*=1.-smoothstep(55.,95.,distanceToEye);
   vec3 eye=normalize(cameraPosition-vWorld);float fresnel=.035+.78*pow(1.-max(eye.y,0.),4.);
   vec4 uv=vReflect;uv.xy+=vec2(sin(p.x*7.+p.y*3.),cos(p.y*5.))*uv.w*.00016;
   vec3 reflection=texture2DProj(tDiffuse,uv).rgb;
   gl_FragColor=vec4(reflection,mask*fresnel*.8);
  }
 `};
 const surface=new Reflector(new T.PlaneGeometry(width,depth),{textureWidth:innerWidth<750?512:1024,textureHeight:innerWidth<750?512:1024,multisample:0,shader,color:'#ffffff'});
 surface.rotation.x=-Math.PI/2;surface.material.transparent=true;surface.material.depthWrite=false;surface.userData.noAO=true;surface.userData.surface='rain puddles';surface.renderOrder=1;
 const capture=surface.onBeforeRender.bind(surface);surface.onBeforeRender=(renderer,scene,camera)=>{
  // Reflective surfaces never recursively capture each other.
  if(camera!==world.camera)return;const water=world.water,visible=water?.visible;if(water)water.visible=false;try{capture(renderer,scene,camera);}finally{if(water)water.visible=visible;}
 };
 return surface;
}

// Thin drifting cloud layers on a distant dome, with warm illuminated lower edges.
export function makeClouds(){
 const material=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.BackSide,uniforms:{cloudTime:{value:0}},vertexShader:'varying vec3 vDirection;void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`
  varying vec3 vDirection;uniform float cloudTime;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
  float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.03+vec2(5.7,2.3);a*=.5;}return v;}
  void main(){vec3 d=normalize(vDirection);float height=max(d.y,.035);vec2 p=d.xz/height*1.9+vec2(cloudTime*.002,0.);float cloud=fbm(p+fbm(p*.55)*2.);float alpha=smoothstep(.53,.7,cloud)*smoothstep(.015,.16,d.y)*.7;float rim=1.-smoothstep(.53,.62,cloud);vec3 lit=mix(vec3(.73,.79,.87),vec3(1.,.9,.76),rim);gl_FragColor=vec4(lit,alpha);}
 `});
 const clouds=new T.Mesh(new T.SphereGeometry(480,32,16),material);clouds.userData.noAO=true;clouds.renderOrder=-2;return clouds;
}

// This sky supplies both the visible backdrop and Shanghai's reflection environment.
export const GOLDEN_SUN=new T.Vector3(.82,.16,-.55).normalize();
export function makeGoldenSky(){
 const material=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{sunDirection:{value:GOLDEN_SUN.clone()}},vertexShader:'varying vec3 vDirection;void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`
 varying vec3 vDirection;uniform vec3 sunDirection;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
 float fbm(vec2 p){float a=.5,v=0.;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.04+vec2(1.7,9.2);a*=.5;}return v;}
 void main(){
  vec3 d=normalize(vDirection);float h=max(d.y,0.);float toward=max(dot(d,sunDirection),0.);
  vec3 horizon=vec3(1.05,.39,.105),zenith=vec3(.28,.29,.43);
  vec3 sky=mix(horizon,zenith,pow(clamp(h,0.,1.),.52));
  sky+=vec3(1.1,.46,.1)*pow(toward,12.)*.7;
  vec2 p=d.xz/max(h,.065)*1.15;float cloud=fbm(p+fbm(p*.6));float mask=smoothstep(.55,.71,cloud)*smoothstep(.04,.17,h);
  vec3 cloudColor=mix(vec3(.36,.21,.24),vec3(1.4,.71,.27),pow(toward,3.)*.7+(1.-smoothstep(.56,.63,cloud))*.3);
  sky=mix(sky,cloudColor,mask*.65);
  sky+=vec3(12.,7.,2.8)*smoothstep(.99965,.99992,toward);
  if(d.y<0.)sky=mix(vec3(.20,.105,.075),horizon,exp(d.y*12.));
  gl_FragColor=vec4(sky,1.);
 }
 `});const sky=new T.Mesh(new T.SphereGeometry(520,48,24),material);sky.userData.noAO=true;sky.renderOrder=-10;return sky;
}
