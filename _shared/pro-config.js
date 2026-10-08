// Anthony fills the three empty strings after deploy. Checkout stays on
// "opening soon" until AMNI_BUY_URL is an https Stripe Payment Link.
window.AMNI_BUY_URL = ''
window.AMNI_LICENSE_URL = ''
window.AMNI_LICENSE_PUBKEY = ''
window.AMNI_AFF = window.AMNI_AFF || { hd: '', lowes: '' }

// TODO(anthony): confirm before launch. Suggested values only.
// Set AMNI_PRO_ANNUAL_USD to 0 to drop the annual line.
window.AMNI_PRO_ANNUAL_USD = 190
// TODO(anthony): confirm the first-payment refund window, in days.
window.AMNI_PRO_REFUND_DAYS = 30
// TODO(anthony): confirm devices per licence. The worker MAX_DEVICES env must match.
window.AMNI_PRO_MAX_DEVICES = 3
// Offline window between licence checks. The worker signs exp at most this far out.
window.AMNI_PRO_OFFLINE_DAYS = 7
