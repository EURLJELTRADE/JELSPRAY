import fs from 'node:fs';
import path from 'node:path';

const dir='content/blog';
const files=fs.readdirSync(dir).filter(f=>f.endsWith('.json'));
const seen=new Set();
let errors=0;

const fail=(file,msg)=>{ console.error('[BLOG] '+file+': '+msg); errors++; };
const textOf=(v)=>Array.isArray(v)?v.map(textOf).join(' '):typeof v==='string'?v:(v&&typeof v==='object'?Object.values(v).map(textOf).join(' '):'');

for(const file of files){
 let post;
 try{ post=JSON.parse(fs.readFileSync(path.join(dir,file),'utf8')); }
 catch(e){ fail(file,'JSON invalide: '+e.message); continue; }

 for(const key of ['slug','title','cat','date','read','excerpt','related','body']){
  if(post[key]===undefined||post[key]===null||post[key]==='') fail(file,'champ obligatoire manquant: '+key);
 }
 if(post.slug){
  if(seen.has(post.slug)) fail(file,'slug dupliqué: '+post.slug);
  seen.add(post.slug);
  if(file!==post.slug+'.json') fail(file,'le nom du fichier doit être '+post.slug+'.json');
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug)) fail(file,'slug non conforme');
 }
 if(post.title&&post.title.length>90) fail(file,'titre trop long ('+post.title.length+' caractères)');
 const meta=post.metaDescription||post.excerpt||'';
 if(meta.length<80) fail(file,'meta/excerpt trop court ('+meta.length+' caractères)');
 if(meta.length>300) console.warn('[BLOG] '+file+': excerpt long; la meta sera tronquée au build');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(post.date||'')) fail(file,'date attendue au format YYYY-MM-DD');
 if(!Array.isArray(post.related)) fail(file,'related doit être un tableau');
 if(!Array.isArray(post.body)||post.body.length<3) fail(file,'body doit contenir au moins 3 sections');
 const words=textOf(post.body).trim().split(/\s+/).filter(Boolean).length;
 if(words<300) console.warn('[BLOG] '+file+': article court ('+words+' mots)');
}
if(errors){ console.error('\n'+errors+' erreur(s) blog.'); process.exit(1); }
console.log('Blog validation OK: '+files.length+' article(s).');
