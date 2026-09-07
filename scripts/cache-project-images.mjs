import {PROJECTS} from '../src/projects.js';
import {writeFile,readFile,mkdir} from 'node:fs/promises';
await mkdir('images/projects',{recursive:true});
const result=await Promise.allSettled(PROJECTS.filter(p=>p.img.startsWith('http')).map(async p=>{const r=await fetch(p.img,{signal:AbortSignal.timeout(20000)});if(!r.ok||!r.headers.get('content-type')?.startsWith('image/'))throw Error(`${p.id}: unavailable (${r.status})`);const bytes=Buffer.from(await r.arrayBuffer());await writeFile(`images/projects/${p.id}.png`,bytes);p.img=`./images/projects/${p.id}.png`;return `${p.id}: saved`;}));
for(const r of result)console.log(r.status==='fulfilled'?r.value:r.reason.message);
await writeFile('src/projects.js','// Original portfolio records, with local artwork where available.\nexport const PROJECTS = '+JSON.stringify(PROJECTS,null,2)+';\n');
