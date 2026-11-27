import {readFile,writeFile} from 'node:fs/promises';
import {generateKeyPairSync} from 'node:crypto';
import {signKey,b64} from './partner.js';
const KF=new URL('./embed.dev-key.json',import.meta.url);
const [,,slug,tier,days='37',...origins]=process.argv;
const key=await readFile(KF,'utf8').then(JSON.parse).catch(async()=>{const {publicKey,privateKey}=generateKeyPairSync('ed25519');const k={priv:b64(privateKey.export({type:'pkcs8',format:'der'})),pub:b64(publicKey.export({type:'spki',format:'der'}).subarray(12))};await writeFile(KF,JSON.stringify(k),{mode:0o600});return k;});
slug?process.stdout.write(await signKey(key.priv,{v:1,slug,tier,origins,iat:Date.now(),exp:Date.now()+Number(days)*864e5})+'\n'):process.stdout.write(key.pub+'\n');
