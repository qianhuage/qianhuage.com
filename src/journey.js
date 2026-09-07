export const STOPS = [
 {id:'shanghai',name:'Shanghai',local:'上海',country:'China',area:'The Bund · Huangpu waterfront',coords:'31.2400° N / 121.4900° E',theme:'shanghai',projects:['nodeobjects'],next:'pudong',mode:'metro',transport:'Metro · Line 2',objective:'Take the subway to Pudong Airport',note:'Walk the Bund, enter the Line 2 station, and find Node Objects in an illuminated station wall display before boarding.',spawn:[8,76],gate:[-9,-30],accent:'#c8e5a0'},
 {id:'pudong',name:'Pudong Airport',local:'浦东国际机场',country:'China',area:'International departures · PVG',coords:'31.1443° N / 121.8083° E',theme:'airport',projects:[],next:'berkeley',mode:'flight',transport:'Flight · PVG → SFO',objective:'Board your flight to California',note:'A new chapter across the Pacific. Fly to San Francisco, then transfer to Berkeley.',spawn:[0,22],gate:[0,-28],accent:'#c8e5a0'},
 {id:'berkeley',name:'Berkeley',local:'UC Berkeley',country:'California',area:'Memorial Glade · UC Berkeley',coords:'37.8716° N / 122.2727° W',theme:'campus',projects:['markitai','mundus'],next:'oakland',mode:'bart',transport:'BART · East Bay',objective:'Find BART and head toward San Francisco',note:'Ideas take shape in Berkeley. Explore MarkitAI and Mundus around the campus before catching BART through Oakland.',spawn:[0,22],gate:[-9,-30],accent:'#dbcf92'},
 {id:'oakland',name:'Oakland',local:'East Bay',country:'California',area:'Downtown · BART connection',coords:'37.8044° N / 122.2712° W',theme:'bay',projects:['emochi'],next:'sanfrancisco',mode:'bart',transport:'BART · Transbay Tube',objective:'Ride BART under the bay to San Francisco',note:'An East Bay stop for Emochi. The next train takes you under the bay and into San Francisco.',spawn:[0,22],gate:[-9,-30],accent:'#e9b090'},
 {id:'sanfrancisco',name:'San Francisco',local:'The City',country:'California',area:'Embarcadero · Bay promenade',coords:'37.7749° N / 122.4194° W',theme:'sf',projects:['kaon','azulenelabs'],next:'redwood',mode:'caltrain',transport:'Caltrain · Peninsula',objective:'Catch Caltrain to Redwood City',note:'Meet Kaon and Azulene Labs by the bay. When you are ready, follow the tracks south to Redwood City.',spawn:[0,22],gate:[-9,-30],accent:'#e9b090'},
 {id:'redwood',name:'Redwood City',local:'The Peninsula',country:'California',area:'Design district · Station square',coords:'37.4852° N / 122.2364° W',theme:'redwood',projects:['collovlabs','collov'],next:'stockholm',mode:'flight',transport:'Flight · SFO → ARN',objective:'Travel to SFO and fly to Stockholm',note:'Explore CollovLabs and Collov. Then leave the Peninsula for a new chapter in Scandinavia.',spawn:[0,22],gate:[-9,-30],accent:'#c8e5a0'},
 {id:'stockholm',name:'Stockholm',local:'Gamla stan',country:'Sweden',area:'Old town · Baltic waterfront',coords:'59.3293° N / 18.0686° E',theme:'stockholm',projects:['divly'],next:'croatia',mode:'flight',transport:'Flight · ARN → SPU',objective:'Fly south to the Croatian coast',note:'Find Divly among the warm façades of the old town. Your next destination is the Adriatic.',spawn:[0,22],gate:[-9,-30],accent:'#e4cf9c'},
 {id:'croatia',name:'Croatia',local:'Adriatic Sea',country:'Croatia',area:'Split archipelago · Aboard the yacht',coords:'43.5081° N / 16.4402° E',theme:'yacht',projects:[],next:null,mode:'sail',transport:'Sailing · Adriatic',objective:'Explore the yacht and enjoy the horizon',note:'Beyond technology: an ASA-certified sailor. Take a breath on deck, then explore the side trips or revisit a favorite chapter.',spawn:[2.6,8],gate:[0,-8],accent:'#bddfe0'},
];
const sideTrips=[
 ['shenzhen','Shenzhen','深圳','China','modern',['cozyai']],
 ['taipei','Taipei','臺北','Taiwan','modern',['katakana']],
 ['washington','Washington','Seattle','United States','bay',['flowgpt']],
 ['paloalto','Palo Alto','Silicon Valley','California','campus',['substrate']],
 ['sacramento','Sacramento','River City','California','campus',['atlaslab']],
 ['dubai','Dubai','دبي','UAE','modern',['metaval']],
 ['newyork','New York City','Manhattan','United States','modern',['fabrique']],
 ['dublin','Dublin','Baile Átha Cliath','Ireland','stockholm',['opoplan']],
 ['rome','Rome','Roma','Italy','stockholm',['taormina']],
];
export const SIDE_STOPS=sideTrips.map(([id,name,local,country,theme,projects])=>({id,name,local,country,theme,projects,area:'Side trip · Portfolio collection',coords:'A place in the journey',next:'shanghai',mode:'flight',transport:'Return to the main journey',objective:'Explore the work, then return to Shanghai',note:'A side trip from the main itinerary. Discover the work connected to this place.',spawn:[0,22],gate:[-9,-30],accent:'#cedbb8',side:true}));
export const ALL_STOPS=[...STOPS,...SIDE_STOPS];
export const getStop=id=>ALL_STOPS.find(s=>s.id===id)||STOPS[0];
export const projectPosition=i=>[i%2===0?-7:7,8-Math.floor(i/2)*14];
export function canMove(x,z,colliders,bounds){return x>bounds[0]&&x<bounds[1]&&z>bounds[2]&&z<bounds[3]&&!colliders.some(b=>x>b[0]-.35&&x<b[1]+.35&&z>b[2]-.35&&z<b[3]+.35);}
export function readProgress(storage){try{const value=JSON.parse(storage.getItem('qg-journey-v1')||'{}');return {visited:Array.isArray(value.visited)?value.visited.filter(id=>ALL_STOPS.some(s=>s.id===id)):[],discovered:Array.isArray(value.discovered)?value.discovered.filter(id=>typeof id==='string'):[]};}catch{return {visited:[],discovered:[]};}}

// Grid A* routes around solid objects, including when guidance starts off the promenade.
export function findPath(start,end,colliders,bounds){
 const step=1,key=(x,z)=>`${x},${z}`;
 const sx=Math.round(start[0]),sz=Math.round(start[1]),ex=Math.round(end[0]),ez=Math.round(end[1]);
 const queue=[{x:sx,z:sz,g:0,f:0}],scores=new Map([[key(sx,sz),0]]),parents=new Map();let found=null,visits=0;
 while(queue.length&&visits++<22000){queue.sort((a,b)=>b.f-a.f);const node=queue.pop(),id=key(node.x,node.z);if(node.g>scores.get(id))continue;if(Math.hypot(node.x-ex,node.z-ez)<1.1){found=id;break;}
  for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const x=node.x+dx*step,z=node.z+dz*step,k=key(x,z),g=node.g+1;if(!canMove(x,z,colliders,bounds)||!canMove(node.x+dx*.5,node.z+dz*.5,colliders,bounds)||g>=(scores.get(k)??Infinity))continue;scores.set(k,g);parents.set(k,id);queue.push({x,z,g,f:g+Math.hypot(x-ex,z-ez)});}
 }
 if(!found)return null;const path=[];while(found!==key(sx,sz)){path.unshift(found.split(',').map(Number));found=parents.get(found);if(!found)return null;}return path;
}
