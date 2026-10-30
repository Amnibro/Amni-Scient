// Amni-Construct Pro billing config.
// PENDING DEPLOY: the amni-construct-pro worker (Stripe Checkout + signed license keys) is not
// deployed yet. This is the workers.dev URL it will get from `wrangler deploy -c wrangler.construct.toml`.
window.AMNI_CONSTRUCT_PRO_API = 'https://amni-construct-pro.amnibro7.workers.dev'
// PENDING KEYGEN: Ed25519 public key (base64url "x") of the Construct signing key whose private half is
// the worker's SIGNING_JWK secret. Empty = every key is rejected (fails closed) until it is filled in.
window.AMNI_CONSTRUCT_PUB = ''
window.AMNI_AFF = window.AMNI_AFF || { hd: '', lowes: '' }
