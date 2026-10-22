let W=null,n=0;const Q=new Map(),hid=()=>typeof document!=='undefined'&&document.visibilityState==='hidden',wk=()=>W||(W=new Worker(URL.createObjectURL(new Blob(['onmessage=e=>setTimeout(()=>postMessage(e.data[0]),e.data[1])'],{type:'text/javascript'}))),W.onmessage=e=>{const f=Q.get(e.data);Q.delete(e.data);f&&f();},W);
export const later=(fn,ms=0)=>{if(!hid())return setTimeout(fn,ms);try{const id=++n;Q.set(id,fn);wk().postMessage([id,ms]);return-id;}catch{return setTimeout(fn,ms);}};
export const unlater=t=>t<0?Q.delete(-t):clearTimeout(t);
export const sleep=ms=>new Promise(r=>later(r,ms));
