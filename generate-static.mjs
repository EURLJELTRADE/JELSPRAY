import fs from 'node:fs';import path from 'node:path';
const html=fs.readFileSync('index.html','utf8');
const m=html.match(/var BASE="https:\/\/jelspray\.fr", MAP=(\{.*?\}), LD=(\{.*?\}), LBL=/s);
if(!m)throw new Error('SEO MAP/LD not found');
const MAP=JSON.parse(m[1]),LD=JSON.parse(m[2]);
const routes=Object.keys(MAP).filter(r=>r.startsWith('/produit/')||/^\/produits\/[^/]+$/.test(r));
const esc=(s='')=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
for(const route of routes){
 const [title,desc]=MAP[route],ld=LD[route],url='https://jelspray.fr'+route;
 let out=html.replace(/<title>.*?<\/title>/s,'<title>'+esc(title)+'</title>')
 .replace(/<meta name="description" content="[^"]*"\s*\/?\s*>/,'<meta name="description" content="'+esc(desc)+'" />')
 .replace(/<link rel="canonical" href="[^"]*"\s*\/?\s*>/,'<link rel="canonical" href="'+url+'" />')
 .replace(/<meta property="og:title" content="[^"]*"\s*\/?\s*>/,'<meta property="og:title" content="'+esc(title)+'" />')
 .replace(/<meta property="og:description" content="[^"]*"\s*\/?\s*>/,'<meta property="og:description" content="'+esc(desc)+'" />')
 .replace(/<meta property="og:url" content="[^"]*"\s*\/?\s*>/,'<meta property="og:url" content="'+url+'" />')
 .replace(/<meta name="twitter:title" content="[^"]*"\s*\/?\s*>/,'<meta name="twitter:title" content="'+esc(title)+'" />')
 .replace(/<meta name="twitter:description" content="[^"]*"\s*\/?\s*>/,'<meta name="twitter:description" content="'+esc(desc)+'" />');
 if(ld)out=out.replace('</head>','<script type="application/ld+json" id="jl-ld-static">'+JSON.stringify(ld).replaceAll('<','\\u003c')+'</script>\n</head>');
 const name=ld?.name||title.split(' | ')[0],extra=ld?.sku?'<p><strong>Référence :</strong> '+esc(ld.sku)+' · <strong>Marque :</strong> GRAFEN Professional</p>':'';
 const fb='<div id="jl-fallback"><header><a href="/"><strong>JELSPRAY</strong></a></header><main><nav><a href="/">Accueil</a> · <a href="/produits">Produits</a></nav><h1>'+esc(name)+'</h1><p>'+esc(ld?.description||desc)+'</p>'+extra+'</main></div>';
 out=out.replace(/<div id="jl-fallback">[\s\S]*?<\/div>\s*<\/div>\s*<script type="text\/babel"/,fb+'\n</div>\n<script type="text/babel"');
 const dir='.'+route;fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'index.html'),out);
}
console.log('Generated '+routes.length+' static SEO pages');
