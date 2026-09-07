import {readFile,writeFile,mkdir,cp} from 'node:fs/promises';
import {dirname,resolve,relative} from 'node:path';
const source=resolve('node_modules/three/examples/jsm'),destination=resolve('vendor/addons'),seen=new Set();
async function copy(file){file=resolve(source,file);if(seen.has(file))return;seen.add(file);const target=resolve(destination,relative(source,file));await mkdir(dirname(target),{recursive:true});let code=await readFile(file,'utf8');const deps=[...code.matchAll(/from\s+['"](\.[^'"]+)['"]/g)].map(m=>resolve(dirname(file),m[1]));let main=relative(dirname(target),resolve('vendor/three.module.js')).replaceAll('\\','/');if(!main.startsWith('.'))main='./'+main;code=code.replaceAll("from 'three'",`from '${main}'`);
if(file.endsWith('/objects/Water2.js'))code=code.replace('// functions','this.dispose = () => { reflector.dispose(); refractor.dispose(); this.material.dispose(); };\n\n\t\t// functions');
await writeFile(target,code);for(const dep of deps)await copy(dep);}
for(const f of ['objects/Water2.js','postprocessing/EffectComposer.js','postprocessing/RenderPass.js','postprocessing/UnrealBloomPass.js','postprocessing/OutputPass.js'])await copy(f);
await cp('node_modules/three/build/three.module.js','vendor/three.module.js');await cp('node_modules/three/LICENSE','vendor/THREE-LICENSE.txt');
console.log(`Vendored ${seen.size} official Three.js modules.`);
