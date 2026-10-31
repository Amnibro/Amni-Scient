// Test-only AMNIPRO2 signer: makes a throwaway root and leaf key so license checks can be exercised without real keys.
import {webcrypto as C} from 'node:crypto';
const b64=u=>Buffer.from(u).toString('base64url'),te=s=>new TextEncoder().encode(s);
const gen=()=>C.subtle.generateKey({name:'Ed25519'},true,['sign','verify']);
const raw=async k=>b64(new Uint8Array(await C.subtle.exportKey('raw',k.publicKey)));
const sign=async(k,s)=>b64(new Uint8Array(await C.subtle.sign({name:'Ed25519'},k.privateKey,te(s))));
export async function testRoot(id='test'){const root=await gen(),leaf=await gen(),now=Date.now(),cp=b64(te(JSON.stringify({r:id,k:await raw(leaf),nbf:now-864e5,exp:now+864e5*365})))
 ,crt=cp+'.'+await sign(root,'AMNICERT1.'+cp);
 return{keys:{roots:{[id]:await raw(root)},revoked:[]},async token(L){const p=b64(te(JSON.stringify({v:1,iat:Date.now(),crt,...L})));return'AMNIPRO2.'+p+'.'+await sign(leaf,'AMNIPRO2.'+p);}};}
