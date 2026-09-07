import * as THREE from './vendor/three.module.js';
import {World} from './src/world.js';
import {PROJECTS} from './src/projects.js';
import {STOPS,SIDE_STOPS,ALL_STOPS,getStop,canMove,readProgress,findPath} from './src/journey.js';

const $=id=>document.getElementById(id);
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let storage;try{storage=localStorage;}catch{storage={getItem:()=>null,setItem:()=>{}};}
const progress=readProgress(storage);progress.discovered=progress.discovered.filter(id=>PROJECTS.some(p=>p.id===id));
let current=getStop(location.hash.slice(1)),world,renderer,entered=true,walking=false,nearest=null,guide=null,transit=null,activeProject=null,toastTimer,arrivalTimer;
let yaw=0,pitch=0,drag=null,last=performance.now(),elapsed=0,uiElapsed=0,audioCtx=null,audioGain=null;
const keys=new Set(),labels=[];
const dismissHint=()=>{$('control-hint').classList.add('dismissed');};
const markProgress=()=>{try{storage.setItem('qg-journey-v1',JSON.stringify(progress));}catch{}$('explored-count').textContent=`${progress.discovered.length} / ${PROJECTS.length} works discovered`;};
const toast=text=>{$('toast').textContent=text;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3500);};
function clearInputs(){keys.clear();drag=null;walking=false;}
function stopGuide(){guide=null;$('guide-button').textContent='Walk to departure ↗';}
function closeDialogs(){document.querySelectorAll('dialog[open]').forEach(d=>d.close());}
function openDialog(id){stopGuide();clearInputs();if(document.pointerLockElement)document.exitPointerLock();closeDialogs();$(id).showModal();}
function begin(){entered=true;dismissHint();}
function load(stop){
 current=stop;stopGuide();nearest=null;clearInputs();$('interact-button').hidden=true;
 if(world){world.load(stop,stop.projects.map(id=>PROJECTS.find(p=>p.id===id)));yaw=world.camera.rotation.y;pitch=world.camera.rotation.x;}
 $('city-name').textContent=stop.name;$('area').textContent=stop.id==='shanghai'?'The Bund':stop.area.split(' · ')[0];$('objective').textContent=stop.objective;$('guide-button').hidden=!stop.next;
 clearTimeout(arrivalTimer);$('arrival').classList.add('visible');arrivalTimer=setTimeout(()=>$('arrival').classList.remove('visible'),4500);
 history.replaceState(null,'',`#${stop.id}`);document.title=`${stop.name} — Qianhua Ge’s World`;
 if(entered&&!progress.visited.includes(stop.id)){progress.visited.push(stop.id);}markProgress();rebuildLabels();buildJournal();
}
function rebuildLabels(){labels.length=0;$('world-labels').replaceChildren();if(!world)return;for(const marker of world.markers){const el=document.createElement('div');el.className='world-label';$('world-labels').append(el);labels.push({el,marker});}}
function buildJournal(){
 $('journey-list').replaceChildren();for(const [i,stop]of STOPS.entries()){const b=document.createElement('button');b.className='stop-card'+(stop.id===current.id?' current':'');b.innerHTML=`<span class="stop-number">${String(i+1).padStart(2,'0')}</span><span><strong>${stop.name}</strong><small>${stop.id==='croatia'?'The open sea':stop.transport}</small></span><span class="stamp">${progress.visited.includes(stop.id)?'✓':'↗'}</span>`;if(stop.id===current.id)b.setAttribute('aria-current','location');b.onclick=()=>{closeDialogs();begin();if(stop.id!==current.id)travel(stop,'flight',true);};$('journey-list').append(b);}
 $('side-trips').replaceChildren();for(const stop of SIDE_STOPS){const b=document.createElement('button');b.textContent=stop.name+' ↗';b.onclick=()=>{closeDialogs();begin();travel(stop,'flight',true);};$('side-trips').append(b);}
}
function loadImage(img,src){img.hidden=false;img.onerror=()=>{img.hidden=true;};img.src=src;}
function buildWorks(){for(const p of PROJECTS){const b=document.createElement('button');b.className='work-card';const thumb=document.createElement('div');thumb.className='work-thumb';const title=document.createElement('span');title.textContent=p.title;const img=document.createElement('img');img.alt='';img.loading='lazy';loadImage(img,p.img);thumb.append(title,img);const name=document.createElement('strong');name.textContent=p.title;const city=document.createElement('small');city.textContent=p.city;b.append(thumb,name,city);b.onclick=()=>openProject(p);$('work-grid').append(b);}}
function openProject(p){
 activeProject=p;if(!progress.discovered.includes(p.id)){progress.discovered.push(p.id);markProgress();toast(`Discovered · ${p.title}`);}
 $('project-title').textContent=p.title;$('project-art-title').textContent=p.title;$('project-location').textContent=p.city.toUpperCase()+' / SELECTED WORK';$('project-image').alt=`${p.title} project artwork`;loadImage($('project-image'),p.img);
 $('project-link').hidden=!p.link;if(p.link)$('project-link').href=p.link;else $('project-link').removeAttribute('href');openDialog('project');
}
function interact(){if(!nearest||transit||document.querySelector('dialog[open]'))return;begin();if(nearest.kind==='project')openProject(nearest.project);else if(nearest.kind==='finish'){openDialog('about');toast('You’ve reached the Adriatic. More places await in your journey.');}else if(current.next)travel(getStop(current.next),current.mode);}
function travel(destination,mode,fast=false){
 if(transit)return;begin();closeDialogs();stopGuide();clearInputs();if(document.pointerLockElement)document.exitPointerLock();$('interact-button').hidden=true;labels.forEach(l=>l.el.hidden=true);
 const from=current;transit={destination,mode,start:elapsed,duration:reduced?.35:fast?4.5:mode==='flight'?9:7};
 $('transit-mode').textContent=fast?'A NEW DESTINATION':from.transport.toUpperCase();$('transit-from').textContent=from.name;$('transit-to').textContent=destination.name;
 $('transit').hidden=false;document.querySelectorAll('.arrival,.touch-controls,.crosshair,.topbar,.control-hint').forEach(el=>el.style.visibility='hidden');if(world){world.startTransit(mode);world.stop=null;}
}
function finishTravel(){if(!transit)return;const destination=transit.destination;transit=null;$('transit').hidden=true;document.querySelectorAll('.arrival,.touch-controls,.crosshair,.topbar,.control-hint').forEach(el=>el.style.visibility='');load(destination);}
function guideToGate(){closeDialogs();
 if(!world){openDialog('journal');return;}begin();if(guide){stopGuide();return;}const gate=world.markers.find(m=>m.kind==='gate');if(!gate)return;const path=findPath([world.camera.position.x,world.camera.position.z],[gate.x,gate.z+2],world.colliders,world.bounds);if(!path?.length){toast('You’re close to the station. Look for the boarding prompt.');return;}guide={points:path,index:0};$('guide-button').textContent='Stop walking ×';if(document.pointerLockElement)document.exitPointerLock();toast('Move to stop guidance.');
}
function move(dx,dz){const cam=world.camera;const nx=cam.position.x+dx,nz=cam.position.z+dz;if(canMove(nx,cam.position.z,world.colliders,world.bounds))cam.position.x=nx;if(canMove(cam.position.x,nz,world.colliders,world.bounds))cam.position.z=nz;}
function updatePlayer(dt){
 if(!world||transit||!entered||document.querySelector('dialog[open]'))return;const cam=world.camera;walking=false;
 if(guide){const target=guide.points[guide.index];const dx=target[0]-cam.position.x,dz=target[1]-cam.position.z,d=Math.hypot(dx,dz);if(d<.3){guide.index++;if(guide.index>=guide.points.length){stopGuide();toast('You’re here. Press E or tap the prompt to board.');}}else{const desired=Math.atan2(-dx,-dz);yaw+=Math.atan2(Math.sin(desired-yaw),Math.cos(desired-yaw))*Math.min(1,dt*4);pitch*=Math.max(0,1-dt*3);move(dx/d*Math.min(d,dt*5.8),dz/d*Math.min(d,dt*5.8));walking=true;}}
 else{let fw=Number(keys.has('w')||keys.has('arrowup'))-Number(keys.has('s')||keys.has('arrowdown'));let side=Number(keys.has('d'))-Number(keys.has('a'));if(keys.has('arrowleft'))yaw+=dt*1.5;if(keys.has('arrowright'))yaw-=dt*1.5;const len=Math.hypot(fw,side);if(len){dismissHint();const speed=keys.has('shift')?7.2:3.7;fw/=len;side/=len;move((-Math.sin(yaw)*fw+Math.cos(yaw)*side)*dt*speed,(-Math.cos(yaw)*fw-Math.sin(yaw)*side)*dt*speed);walking=true;}}
 cam.rotation.set(pitch,yaw,0,'YXZ');if(current.theme!=='yacht')cam.position.y=1.75+(!reduced&&walking?Math.sin(elapsed*11)*.028:0);
}
const projected=new THREE.Vector3();
function updateHUD(){
 if(!world||transit)return;const cam=world.camera;let distance=Infinity;nearest=null;
 for(const {el,marker}of labels){const d=Math.hypot(marker.x-cam.position.x,marker.z-cam.position.z);if(d<distance&&d<5.5){distance=d;nearest=marker;}projected.set(marker.x,marker.y,marker.z).project(cam);const visible=entered&&projected.z<1&&projected.z>-1&&Math.abs(projected.x)<.92&&Math.abs(projected.y)<.85&&d<16&&d>5.5;el.hidden=!visible;if(visible)el.style.transform=`translate(${(projected.x*.5+.5)*innerWidth}px,${(-projected.y*.5+.5)*innerHeight}px) translate(-50%,-100%) rotate(45deg)`;}
 $('interact-button').hidden=!nearest||!entered||!!document.querySelector('dialog[open]');if(nearest)$('interact-button').children[1].textContent=nearest.kind==='project'?`Discover ${nearest.title}`:nearest.kind==='gate'?`Board · ${current.transport}`:'Look toward the horizon';
}
function sound(){
 try{if(!audioCtx){audioCtx=new(window.AudioContext||window.webkitAudioContext)();const buffer=audioCtx.createBuffer(1,audioCtx.sampleRate*4,audioCtx.sampleRate);const data=buffer.getChannelData(0);let last=0;for(let i=0;i<data.length;i++){last=(last+Math.random()*.04-.02)/1.02;data[i]=last*3;}const noise=audioCtx.createBufferSource();noise.buffer=buffer;noise.loop=true;const filter=audioCtx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=500;audioGain=audioCtx.createGain();audioGain.gain.value=.1;noise.connect(filter).connect(audioGain).connect(audioCtx.destination);noise.start();}const isOn=$('sound-button').getAttribute('aria-pressed')==='true';audioCtx.resume();audioGain.gain.setTargetAtTime(isOn?0:.1,audioCtx.currentTime,.3);$('sound-button').setAttribute('aria-pressed',String(!isOn));$('sound-button').setAttribute('aria-label',isOn?'Enable ambient sound':'Mute ambient sound');$('sound-button').querySelector('span').textContent=isOn?'Off':'On';}catch{toast('Ambient audio is unavailable in this browser.');}
}
function enableLook(){closeDialogs();begin();if(!renderer)return;const promise=renderer.domElement.requestPointerLock?.();promise?.catch(()=>toast('Drag the scene to look around.'));}
function attachControls(){
 $('menu-button').onclick=()=>openDialog('menu');$('journal-button').onclick=()=>{buildJournal();openDialog('journal');};$('works-button').onclick=()=>openDialog('works');$('about-button').onclick=()=>openDialog('about');$('guide-button').onclick=guideToGate;$('interact-button').onclick=interact;$('skip-transit').onclick=finishTravel;$('look-button').onclick=enableLook;$('sound-button').onclick=sound;
 $('project-travel').onclick=()=>{const stop=ALL_STOPS.find(s=>s.projects.includes(activeProject.id));closeDialogs();begin();if(stop.id!==current.id)travel(stop,'flight',true);else toast('Find the project exhibit along the promenade.');};
 document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());document.querySelectorAll('dialog').forEach(d=>{d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});d.addEventListener('close',clearInputs);});
 window.addEventListener('keydown',e=>{const key=e.key.toLowerCase();if(['input','textarea','select'].includes(e.target.tagName.toLowerCase()))return;if(key==='escape'){stopGuide();clearInputs();if(!document.querySelector('dialog[open]')&&!document.pointerLockElement&&!transit){e.preventDefault();openDialog('menu');}return;}if(document.querySelector('dialog[open]'))return;if(transit){if(key==='enter')finishTravel();return;}if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift'].includes(key)){e.preventDefault();begin();stopGuide();keys.add(key);}if(!e.repeat&&key==='e'){e.preventDefault();interact();}if(!e.repeat&&key==='j'){buildJournal();openDialog('journal');}});
 window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{clearInputs();stopGuide();});document.addEventListener('visibilitychange',()=>{clearInputs();last=performance.now();if(document.hidden&&audioCtx)audioCtx.suspend();else if(audioCtx&&$('sound-button').getAttribute('aria-pressed')==='true')audioCtx.resume();});document.addEventListener('pointerlockchange',clearInputs);document.addEventListener('pointerlockerror',()=>toast('Use drag to look around in this browser.'));
 document.addEventListener('mousemove',e=>{if(document.pointerLockElement&&entered&&!transit&&!document.querySelector('dialog[open]')){yaw-=e.movementX*.0022;pitch=THREE.MathUtils.clamp(pitch-e.movementY*.0022,-1.1,1.1);}});
 if(renderer){const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label','3D world. WASD to move, drag to look, E to interact.');canvas.addEventListener('pointerdown',e=>{if(e.button!==0||transit)return;begin();stopGuide();drag={x:e.clientX,y:e.clientY,id:e.pointerId};canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId||document.pointerLockElement)return;yaw-=(e.clientX-drag.x)*.004;pitch=THREE.MathUtils.clamp(pitch-(e.clientY-drag.y)*.004,-1.1,1.1);drag={x:e.clientX,y:e.clientY,id:e.pointerId};});canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();clearInputs();toast('The 3D view was interrupted. Your works and journey are still available.');});canvas.addEventListener('webglcontextrestored',()=>{load(current);toast('The world is ready again.');});}
 for(const b of document.querySelectorAll('[data-move]')){b.addEventListener('pointerdown',e=>{e.preventDefault();if(transit)return;begin();stopGuide();keys.add(b.dataset.move);b.setPointerCapture(e.pointerId);});for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>keys.delete(b.dataset.move));}
 window.addEventListener('resize',()=>{if(renderer){renderer.setSize(innerWidth,innerHeight);world.pipeline.setSize(innerWidth,innerHeight);world.camera.aspect=innerWidth/innerHeight;world.camera.updateProjectionMatrix();}});
 window.addEventListener('hashchange',()=>{const stop=getStop(location.hash.slice(1));if(stop.id!==current.id&&!transit){closeDialogs();load(stop);}});
}
function animate(now){
 const dt=Math.min((now-last)/1000,.045);last=now;elapsed+=dt;
 if(!document.hidden){if(transit){const t=Math.min((elapsed-transit.start)/transit.duration,1);$('transit-progress').style.width=`${t*100}%`;if(world&&!reduced){world.camera.position.z-=dt*(transit.mode==='flight'?7:2);world.camera.position.x=transit.mode==='flight'?Math.sin(t*Math.PI)*3:Math.sin(elapsed)*.012;}if(t>=1)finishTravel();}else updatePlayer(dt);
 if(world){world.update(elapsed,dt,walking,reduced);world.pipeline.render();}uiElapsed+=dt;if(uiElapsed>.07){updateHUD();uiElapsed=0;}}
 requestAnimationFrame(animate);
}
function init(){let shown=false;const showWorld=()=>{if(shown)return;shown=true;$('loading')?.remove();setTimeout(dismissHint,7000);clearTimeout(arrivalTimer);$('arrival').classList.add('visible');arrivalTimer=setTimeout(()=>$('arrival').classList.remove('visible'),4500);};THREE.DefaultLoadingManager.onLoad=showWorld;setTimeout(showWorld,12000);buildWorks();if(matchMedia('(pointer: coarse)').matches)$('control-hint').textContent='Drag to look';try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<750?1.5:1.75));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.9;renderer.outputColorSpace=THREE.SRGBColorSpace;$('world').append(renderer.domElement);world=new World(renderer);}catch(error){console.error('3D world unavailable',error);document.body.classList.add('fallback');$('control-hint').textContent='3D unavailable. Open the menu to explore the work.';}
 load(current);attachControls();if(!world){showWorld();openDialog('works');}requestAnimationFrame(animate);}
init();
