import * as THREE from './vendor/three.module.js';
import {World} from './src/world.js';
import {PROJECTS} from './src/projects.js';
import {STOPS,SIDE_STOPS,ALL_STOPS,getStop,canMove,readProgress,findPath} from './src/journey.js';

const $=id=>document.getElementById(id);
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let storage;try{storage=localStorage;}catch{storage={getItem:()=>null,setItem:()=>{}};}
const progress=readProgress(storage);progress.discovered=progress.discovered.filter(id=>PROJECTS.some(p=>p.id===id));
let current=getStop(location.hash.slice(1)),world,renderer,entered=false,walking=false,nearest=null,guide=null,transit=null,activeProject=null,toastTimer;
let yaw=0,pitch=0,drag=null,last=performance.now(),elapsed=0,uiElapsed=0,audioCtx=null,audioGain=null;
const keys=new Set(),labels=[];
const markProgress=()=>{try{storage.setItem('qg-journey-v1',JSON.stringify(progress));}catch{}$('explored-count').textContent=`${progress.discovered.length} / ${PROJECTS.length} works discovered`;};
const toast=text=>{$('toast').textContent=text;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3500);};
function clearInputs(){keys.clear();drag=null;walking=false;}
function stopGuide(){guide=null;$('guide-button').innerHTML='Guide me there <span>↗</span>';}
function closeDialogs(){document.querySelectorAll('dialog[open]').forEach(d=>d.close());}
function openDialog(id){stopGuide();clearInputs();if(document.pointerLockElement)document.exitPointerLock();closeDialogs();$(id).showModal();}
function begin(){if(entered)return;entered=true;document.body.classList.remove('intro');$('welcome').hidden=true;if(!progress.visited.includes(current.id))progress.visited.push(current.id);markProgress();toast('WASD to move · Drag to look · E to interact');}
function load(stop){
 current=stop;stopGuide();nearest=null;clearInputs();$('interact-button').hidden=true;
 if(world){world.load(stop,stop.projects.map(id=>PROJECTS.find(p=>p.id===id)));yaw=world.camera.rotation.y;pitch=world.camera.rotation.x;}
 const index=STOPS.findIndex(s=>s.id===stop.id);$('chapter-number').textContent=index<0?'OFF THE BEATEN PATH':`CHAPTER ${String(index+1).padStart(2,'0')} / 08`;$('country').textContent=stop.country.toUpperCase();
 $('city-name').replaceChildren(document.createTextNode(stop.name),Object.assign(document.createElement('span'),{textContent:stop.local}));$('area').textContent=stop.area;$('coordinates').textContent=stop.coords;$('objective').textContent=stop.objective;$('quest-index').textContent=index<0?'↗':String(index+1).padStart(2,'0');$('quest-detail').textContent=stop.id==='shanghai'?'Follow the waterfront to Metro Line 2.':stop.projects.length?`${stop.projects.length} works to discover in this chapter.`:'Take your time. There is more to explore.';
 $('map-caption').textContent=stop.id==='shanghai'?'THE BUND':stop.id==='croatia'?'ADRIATIC SEA':stop.name.toUpperCase();document.documentElement.style.setProperty('--accent',stop.accent);$('guide-button').hidden=!stop.next;
 history.replaceState(null,'',`#${stop.id}`);document.title=`${stop.name} — Qianhua Ge’s World`;
 if(entered&&!progress.visited.includes(stop.id)){progress.visited.push(stop.id);toast(`New chapter · ${stop.name}`);}markProgress();rebuildLabels();buildJournal();
}
function rebuildLabels(){labels.length=0;$('world-labels').replaceChildren();if(!world)return;for(const marker of world.markers){const el=document.createElement('div');el.className='world-label';const symbol=document.createElement('span');symbol.className='marker';symbol.textContent=marker.symbol;const text=document.createElement('span');text.append(document.createTextNode(marker.title));const sub=document.createElement('small');sub.textContent=marker.subtitle;text.append(sub);el.append(symbol,text);$('world-labels').append(el);labels.push({el,marker});}}
function buildJournal(){
 $('journey-list').replaceChildren();for(const [i,stop]of STOPS.entries()){const b=document.createElement('button');b.className='stop-card'+(stop.id===current.id?' current':'');b.innerHTML=`<span class="stop-number">${String(i+1).padStart(2,'0')}</span><span><strong>${stop.name}</strong><small>${stop.id==='croatia'?'The open sea':stop.transport}</small></span><span class="stamp">${progress.visited.includes(stop.id)?'✓':'↗'}</span>`;if(stop.id===current.id)b.setAttribute('aria-current','location');b.onclick=()=>{closeDialogs();begin();if(stop.id!==current.id)travel(stop,'flight',true);};$('journey-list').append(b);}
 $('side-trips').replaceChildren();for(const stop of SIDE_STOPS){const b=document.createElement('button');b.textContent=stop.name+' ↗';b.onclick=()=>{closeDialogs();begin();travel(stop,'flight',true);};$('side-trips').append(b);}
}
function loadImage(img,src){img.hidden=false;img.onerror=()=>{img.hidden=true;};img.src=src;}
function buildWorks(){for(const p of PROJECTS){const b=document.createElement('button');b.className='work-card';const thumb=document.createElement('div');thumb.className='work-thumb';const title=document.createElement('span');title.textContent=p.title;const img=document.createElement('img');img.alt='';img.loading='lazy';loadImage(img,p.img);thumb.append(title,img);const name=document.createElement('strong');name.textContent=p.title;const city=document.createElement('small');city.textContent=p.city;b.append(thumb,name,city);b.onclick=()=>openProject(p);$('work-grid').append(b);}}
function openProject(p){
 activeProject=p;if(!progress.discovered.includes(p.id)){progress.discovered.push(p.id);markProgress();toast(`Discovered · ${p.title}`);}
 $('project-title').textContent=p.title;$('project-art-title').textContent=p.title;$('project-location').textContent=p.city.toUpperCase()+' / SELECTED WORK';$('project-status').textContent=p.link?'LAUNCHED PROJECT':'IN DEVELOPMENT';$('project-copy').textContent=`Part of Qianhua Ge’s portfolio, connected to ${p.city}. ${p.link?'Explore the live project to learn more.':'This project has not launched publicly yet.'}`;$('project-image').alt=`${p.title} project artwork`;loadImage($('project-image'),p.img);
 $('project-link').hidden=!p.link;if(p.link)$('project-link').href=p.link;else $('project-link').removeAttribute('href');openDialog('project');
}
function interact(){if(!nearest||transit||document.querySelector('dialog[open]'))return;begin();if(nearest.kind==='project')openProject(nearest.project);else if(nearest.kind==='finish'){openDialog('about');toast('You’ve reached the Adriatic. More places await in your journey.');}else if(current.next)travel(getStop(current.next),current.mode);}
function travel(destination,mode,fast=false){
 if(transit)return;begin();closeDialogs();stopGuide();clearInputs();if(document.pointerLockElement)document.exitPointerLock();$('interact-button').hidden=true;labels.forEach(l=>l.el.hidden=true);
 const from=current;transit={destination,mode,start:elapsed,duration:reduced?.35:fast?4.5:mode==='flight'?9:7};
 $('transit-mode').textContent=fast?'A NEW DESTINATION':from.transport.toUpperCase();$('transit-from').textContent=from.name;$('transit-to').textContent=destination.name;
 $('transit-note').textContent=fast?'Taking the scenic route.':from.id==='pudong'?'Across the Pacific to SFO, then onward to Berkeley.':from.id==='redwood'?'Airport transfer to SFO, then across the Atlantic to Stockholm.':mode==='bart'?'The Bay Area, one station at a time.':mode==='metro'?'Line 2 · From the city to Pudong International Airport.':destination.id==='croatia'?'Arrive in Split. Your yacht is waiting on the Adriatic.':'Watch the world go by.';
 $('transit').hidden=false;document.querySelectorAll('.chapter,.quest,.bottom-left,.bottom-bar,.touch-controls,.crosshair,.topbar').forEach(el=>el.style.visibility='hidden');if(world){world.startTransit(mode);world.stop=null;}
}
function finishTravel(){if(!transit)return;const destination=transit.destination;transit=null;$('transit').hidden=true;document.querySelectorAll('.chapter,.quest,.bottom-left,.bottom-bar,.touch-controls,.crosshair,.topbar').forEach(el=>el.style.visibility='');load(destination);}
function guideToGate(){
 if(!world){openDialog('journal');return;}begin();if(guide){stopGuide();return;}const gate=world.markers.find(m=>m.kind==='gate');if(!gate)return;const path=findPath([world.camera.position.x,world.camera.position.z],[gate.x,gate.z+2],world.colliders,world.bounds);if(!path?.length){toast('You’re close to the station. Look for the boarding prompt.');return;}guide={points:path,index:0};$('guide-button').innerHTML='Stop walking <span>×</span>';if(document.pointerLockElement)document.exitPointerLock();toast('Following the route. Move or press Escape to stop.');
}
function move(dx,dz){const cam=world.camera;const nx=cam.position.x+dx,nz=cam.position.z+dz;if(canMove(nx,cam.position.z,world.colliders,world.bounds))cam.position.x=nx;if(canMove(cam.position.x,nz,world.colliders,world.bounds))cam.position.z=nz;}
function updatePlayer(dt){
 if(!world||transit||!entered||document.querySelector('dialog[open]'))return;const cam=world.camera;walking=false;
 if(guide){const target=guide.points[guide.index];const dx=target[0]-cam.position.x,dz=target[1]-cam.position.z,d=Math.hypot(dx,dz);if(d<.3){guide.index++;if(guide.index>=guide.points.length){stopGuide();toast('You’re here. Press E or tap the prompt to board.');}}else{const desired=Math.atan2(-dx,-dz);yaw+=Math.atan2(Math.sin(desired-yaw),Math.cos(desired-yaw))*Math.min(1,dt*4);pitch*=Math.max(0,1-dt*3);move(dx/d*Math.min(d,dt*5.8),dz/d*Math.min(d,dt*5.8));walking=true;}}
 else{let fw=Number(keys.has('w')||keys.has('arrowup'))-Number(keys.has('s')||keys.has('arrowdown'));let side=Number(keys.has('d'))-Number(keys.has('a'));if(keys.has('arrowleft'))yaw+=dt*1.5;if(keys.has('arrowright'))yaw-=dt*1.5;const len=Math.hypot(fw,side);if(len){const speed=keys.has('shift')?7.2:3.7;fw/=len;side/=len;move((-Math.sin(yaw)*fw+Math.cos(yaw)*side)*dt*speed,(-Math.cos(yaw)*fw-Math.sin(yaw)*side)*dt*speed);walking=true;}}
 cam.rotation.set(pitch,yaw,0,'YXZ');if(current.theme!=='yacht')cam.position.y=1.75+(!reduced&&walking?Math.sin(elapsed*11)*.028:0);
}
const projected=new THREE.Vector3();
function updateHUD(){
 if(!world||transit)return;const cam=world.camera;let distance=Infinity;nearest=null;
 for(const {el,marker}of labels){const d=Math.hypot(marker.x-cam.position.x,marker.z-cam.position.z);if(d<distance&&d<5.5){distance=d;nearest=marker;}projected.set(marker.x,marker.y,marker.z).project(cam);const visible=entered&&projected.z<1&&projected.z>-1&&Math.abs(projected.x)<.92&&Math.abs(projected.y)<.85&&d<90;el.hidden=!visible;if(visible)el.style.transform=`translate(${(projected.x*.5+.5)*innerWidth}px,${(-projected.y*.5+.5)*innerHeight}px) translate(-50%,-100%)`;}
 $('interact-button').hidden=!nearest||!entered||!!document.querySelector('dialog[open]');if(nearest)$('interact-button').children[1].textContent=nearest.kind==='project'?`Discover ${nearest.title}`:nearest.kind==='gate'?`Board · ${current.transport}`:'Look toward the horizon';
 const bearing=(((-yaw*180/Math.PI)%360)+360)%360;const compass=['N','NE','E','SE','S','SW','W','NW'];$('bearing').textContent=compass[Math.round(bearing/45)%8]+' '+String(Math.round(bearing)).padStart(3,'0')+'°';drawMap();
}
function drawMap(){
 const ctx=$('minimap').getContext('2d');const w=240,h=190;ctx.clearRect(0,0,w,h);ctx.fillStyle='#233c35';ctx.fillRect(0,0,w,h);ctx.fillStyle='#344f47';ctx.fillRect(155,0,85,h);
 ctx.strokeStyle='#62745a';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(153,0);ctx.lineTo(153,h);ctx.stroke();ctx.strokeStyle='#8b987344';for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(28+i*29,0);ctx.lineTo(28+i*29,h);ctx.stroke();}for(let y=0;y<h;y+=31){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(155,y);ctx.stroke();}ctx.fillStyle='#88997a4a';for(let y=10;y<h;y+=31){ctx.fillRect(10,y,33,19);ctx.fillRect(54,y,32,19);}
 if(!world)return;const pos=world.camera.position;const map=(x,z)=>[125+(x-pos.x)*2.1,110+(z-pos.z)*1.55];
 for(const m of world.markers){const [x,y]=map(m.x,m.z);if(x<5||x>235||y<5||y>185)continue;ctx.fillStyle=m.kind==='project'?'#d9e4bd':'#eff5d2';ctx.beginPath();ctx.arc(x,y,m.kind==='gate'?4:3,0,Math.PI*2);ctx.fill();}ctx.save();ctx.translate(125,110);ctx.rotate(-yaw);ctx.fillStyle='#d8ecb7';ctx.beginPath();ctx.moveTo(0,-7);ctx.lineTo(5,5);ctx.lineTo(0,2);ctx.lineTo(-5,5);ctx.closePath();ctx.fill();ctx.restore();
}
function sound(){
 try{if(!audioCtx){audioCtx=new(window.AudioContext||window.webkitAudioContext)();const buffer=audioCtx.createBuffer(1,audioCtx.sampleRate*4,audioCtx.sampleRate);const data=buffer.getChannelData(0);let last=0;for(let i=0;i<data.length;i++){last=(last+Math.random()*.04-.02)/1.02;data[i]=last*3;}const noise=audioCtx.createBufferSource();noise.buffer=buffer;noise.loop=true;const filter=audioCtx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=500;audioGain=audioCtx.createGain();audioGain.gain.value=.1;noise.connect(filter).connect(audioGain).connect(audioCtx.destination);noise.start();}const isOn=$('sound-button').getAttribute('aria-pressed')==='true';audioCtx.resume();audioGain.gain.setTargetAtTime(isOn?0:.1,audioCtx.currentTime,.3);$('sound-button').setAttribute('aria-pressed',String(!isOn));$('sound-button').setAttribute('aria-label',isOn?'Enable ambient sound':'Mute ambient sound');$('sound-button').querySelector('span').hidden=!isOn;}catch{toast('Ambient audio is unavailable in this browser.');}
}
function enableLook(){begin();if(!renderer)return;const promise=renderer.domElement.requestPointerLock?.();promise?.catch(()=>toast('Drag the scene to look around.'));}
function attachControls(){
 $('explore-button').onclick=begin;$('journal-button').onclick=$('map-button').onclick=()=>{buildJournal();openDialog('journal');};$('works-button').onclick=()=>openDialog('works');$('about-button').onclick=()=>openDialog('about');$('guide-button').onclick=guideToGate;$('interact-button').onclick=interact;$('skip-transit').onclick=finishTravel;$('look-button').onclick=enableLook;$('sound-button').onclick=sound;
 $('project-travel').onclick=()=>{const stop=ALL_STOPS.find(s=>s.projects.includes(activeProject.id));closeDialogs();begin();if(stop.id!==current.id)travel(stop,'flight',true);else toast('Find the project exhibit along the promenade.');};
 document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());document.querySelectorAll('dialog').forEach(d=>{d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});d.addEventListener('close',clearInputs);});
 window.addEventListener('keydown',e=>{const key=e.key.toLowerCase();if(['input','textarea','select'].includes(e.target.tagName.toLowerCase()))return;if(key==='escape'){stopGuide();clearInputs();return;}if(document.querySelector('dialog[open]'))return;if(transit){if(key==='enter')finishTravel();return;}if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift'].includes(key)){e.preventDefault();begin();stopGuide();keys.add(key);}if(!e.repeat&&key==='e'){e.preventDefault();interact();}if(!e.repeat&&key==='j'){buildJournal();openDialog('journal');}});
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
function init(){document.body.classList.add('intro');buildWorks();try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<750?1.5:1.75));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.outputColorSpace=THREE.SRGBColorSpace;$('world').append(renderer.domElement);world=new World(renderer);}catch(error){console.error('3D world unavailable',error);document.body.classList.add('fallback');$('welcome').querySelector('h2').textContent='A world of work.';$('welcome').querySelector('p').textContent='Explore every project and destination in the journey. The 3D view is unavailable in this browser.';$('explore-button').textContent='Browse the work ↗';}
 load(current);attachControls();if(!world)$('explore-button').onclick=()=>openDialog('works');$('loading').remove();requestAnimationFrame(animate);}
init();
