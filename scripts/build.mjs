import './vendor.mjs';
import {cp,mkdir,rm} from 'node:fs/promises';
await mkdir('vendor',{recursive:true});
await cp('node_modules/three/build/three.module.js','vendor/three.module.js');
await cp('node_modules/three/LICENSE','vendor/THREE-LICENSE.txt');
await rm('dist',{recursive:true,force:true});
await mkdir('dist');
for(const file of ['index.html','styles.css','script.js','src','images','vendor']) await cp(file,`dist/${file}`,{recursive:true});
console.log('Built static portfolio to dist/');
