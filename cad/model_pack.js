/** Known CAD-trained pack. Digest and size are pinned. There is no download URL until a signed release exists. */
export const CAD_TRAINED={
  id:'cad-trained-3b',
  role:'cad-trained',
  status:'unavailable',
  bytes:3892652160,
  sha256:'199839613fbf80d775a0d30000dc0592c62f38f0cf83ef352f6069e823349613',
  url:null,
  runtime:null,
  arch:'granite',
  quant:'Q8_0',
  ollamaTag:'amni-cad-3b:latest',
  license:'Apache-2.0',
  licenseScope:'GGUF and base-model metadata only. Not a grant to publish the weights or the training data.',
  serve:{ctx:24576,parallel:1,batch:1024,ubatch:512,cacheK:'q8_0',cacheV:'q8_0'},
  note:'Identified by digest. No download link is published, so this page cannot install it.'
};
export const BONSAI_OPTIONAL={id:'bonsai-optional',role:'optional',status:'unreleased',bytes:null,sha256:null,url:null,runtime:null,note:'Optional and separate from the CAD-trained pack. It needs its own runtime and a proven adapter. It is not installed by this app.'};
export function builtinManifest(){return{cad:{...CAD_TRAINED},bonsai:{...BONSAI_OPTIONAL}};}
export function isCadTag(name){const n=String(name||'');return n==='amni-cad-3b'||n==='amni-cad-3b:latest'||n.startsWith('amni-cad-3b:');}
export function packStatus(m=CAD_TRAINED){const known=!!(m&&m.sha256&&m.bytes>0),ready=!!(m&&m.status==='ready'&&m.url&&m.sha256&&m.bytes>0&&m.runtime);return{ready,known,id:m&&m.id,bytes:known?m.bytes:null,sha256:known?m.sha256:null,ollamaTag:m&&m.ollamaTag||null,serve:m&&m.serve||null,reason:ready?'Ready to install with the native helper.':known?'Identified by digest. No download link is published, so this page cannot install it. If your local server already lists the tag, you can use that copy.':(m&&m.note)||'Not released'};}
export function assertFetchable(m){const s=packStatus(m);if(!s.ready){const e=new Error(s.reason);e.code='unreleased';throw e;}if(!/^https?:\/\//.test(m.url)){const e=new Error('The model URL must be http or https.');e.code='bad-url';throw e;}return m;}
