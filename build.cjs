/* Kisan Setu build: node build.cjs
   Output: dist/index.html  (single self-contained file: React, CSS, JS, and any assets/ media all inlined) */
const fs=require('fs'), path=require('path');
const esbuild=require('esbuild');   // npm install
const NP=['node_modules'];
const rd=(d)=>fs.readdirSync(d).filter(f=>!f.startsWith('_')).sort().map(f=>fs.readFileSync(path.join(d,f),'utf8')).join('\n');
const css=rd('src/css'), jsx=rd('src/js');
const app=esbuild.transformSync(jsx,{loader:'jsx',jsx:'transform',jsxFactory:'h',jsxFragment:'Fragment',target:'es2019'}).code;
const react=esbuild.buildSync({stdin:{contents:"window.React=require('react');window.ReactDOM=Object.assign({},require('react-dom'),require('react-dom/client'));",resolveDir:process.cwd()},bundle:true,write:false,format:'iife',minify:true,target:'es2019',define:{'process.env.NODE_ENV':'"production"'},nodePaths:NP}).outputFiles[0].text;

// ---- inline any real media dropped into ./assets (see assets/README.md) ----
const MIME={'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.mp4':'video/mp4','.webm':'video/webm'};
const MAXKB=1536;
const assets={}; let assetBytes=0;
(function walk(dir,rel){
  if(!fs.existsSync(dir)) return;
  for(const f of fs.readdirSync(dir)){
    const full=path.join(dir,f), r=(rel?rel+'/':'')+f;
    if(fs.statSync(full).isDirectory()){ walk(full,r); continue; }
    const ext=path.extname(f).toLowerCase(); if(!MIME[ext]) continue;
    const buf=fs.readFileSync(full);
    if(buf.length > MAXKB*1024){ console.log('skip (too large, >'+MAXKB+'KB):','assets/'+r); continue; }
    assets['assets/'+r]='data:'+MIME[ext]+';base64,'+buf.toString('base64');
    assetBytes+=buf.length;
  }
})('assets','');
const assetsJs = 'window.__ASSETS__='+JSON.stringify(assets)+';';
const n=Object.keys(assets).length;
console.log(n? `inlined ${n} media file(s), ${(assetBytes/1024/1024).toFixed(1)}MB` : 'no media in ./assets — using illustrations (see assets/README.md)');

const safe=(s)=>s.replace(/<\/script/gi,'<\\/script');
const tpl=fs.readFileSync('src/template.html','utf8');
const html=tpl.replace('/*__CSS__*/',()=>css).replace('/*__REACT__*/',()=>'<script>'+safe(react)+'</script>').replace('/*__JS__*/',()=>safe(assetsJs+'\n'+app));
fs.mkdirSync('dist',{recursive:true}); fs.writeFileSync('dist/index.html',html);
console.log('built dist/index.html',(html.length/1024/1024).toFixed(2)+' MB');
