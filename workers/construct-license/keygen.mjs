// Prints a Construct Pro signing keypair and checks that it round-trips.
// The private JWK is a wrangler secret. Do not commit it.
//   node workers/construct-license/keygen.mjs

const pair = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])
const priv = await crypto.subtle.exportKey('jwk', pair.privateKey)
const pub = await crypto.subtle.exportKey('jwk', pair.publicKey)
const message = new TextEncoder().encode('construct-pro-self-test')
const signature = await crypto.subtle.sign('Ed25519', pair.privateKey, message)
const ok = await crypto.subtle.verify('Ed25519', pair.publicKey, signature, message)
const flipped = new Uint8Array(signature)
flipped[0] ^= 0xff
const tampered = await crypto.subtle.verify('Ed25519', pair.publicKey, flipped, message)
if (!ok || tampered) {
  console.error('self-test failed')
  process.exit(1)
}
const publicJwk = { kty: pub.kty, crv: pub.crv, x: pub.x }
console.log('SELF-TEST OK')
console.log('')
console.log('SIGNING_JWK  (private — wrangler secret put SIGNING_JWK, never commit)')
console.log(JSON.stringify(priv))
console.log('')
console.log('AMNI_LICENSE_PUBKEY  (public — paste into _shared/pro-config.js)')
console.log(JSON.stringify(publicJwk))
