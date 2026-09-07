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
