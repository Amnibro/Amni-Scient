const src=await(await fetch(new URL('index.html',import.meta.url))).text();
const doc=new DOMParser().parseFromString(src,'text/html');
for(const n of[...doc.head.children]){if(n.tagName==='TITLE'||n.tagName==='SCRIPT'&&n.textContent&&(n.textContent.includes('Content-Security-Policy')||n.type==='importmap'&&document.querySelector('script[type=importmap]')))continue;document.head.append(n.cloneNode(true));}
const body=doc.body.cloneNode(true);
for(const s of body.querySelectorAll('script'))s.remove();
document.body.replaceWith(body);
await import('./app.js');
await import('/offline-app/start.js');
await import('./embed.js');
