// Browser side of Amni-Construct AI. Engines and the daily cap come from Amni-CAD.
import {Assistant, probeLocal, explainError, detectKey} from '../cad/ai.js';
import {meterView} from '../cad/ai_meter.js';
import {BANNER, TASKS, systemPrompt, userTurn, parseReport, needsServerHold, serverTurnPlan} from './ai_run.js';

const $ = id => document.getElementById(id);
const authHeaders = () => {
  const h = {'content-type': 'application/json'};
  try { const k = localStorage.getItem('amnicad.pro'); if (k) h.authorization = 'Bearer ' + k; } catch { /* private mode */ }
  return h;
};
const online = () => typeof navigator === 'undefined' || navigator.onLine !== false;

let quota = null;
let image = null;
let busy = false;

function paintMeter(kind) {
  const box = $('meter');
  if (!box) return;
  const cloud = kind === 'anthropic' || kind === 'openai' || kind === 'gemini' || kind === 'openrouter';
  const q = quota && quota.missing ? null : quota;
  const bits = meterView(q, cloud ? 'byok' : 'local').lines.map(x => x.text);
  if (quota && quota.missing) bits.push('Server allowance appears when the Amni-CAD prompt meter is on this site');
  box.textContent = bits.join(' · ');
}

async function refreshQuota() {
  if (location.protocol === 'file:' || !online()) { quota = {offline: true, localUnlimited: true}; paintMeter($('engine').value); return; }
  try {
    const r = await fetch('/api/ai/quota', {headers: authHeaders(), cache: 'no-store'});
    if (r.status === 404) { quota = {missing: true, localUnlimited: true}; }
    else if (!r.ok) { quota = null; }
    else quota = await r.json();
  } catch { quota = {offline: true}; }
  paintMeter($('engine').value);
}

async function serverComplete(ai, messages, kind) {
  if (!needsServerHold(kind, location.protocol === 'file:')) return ai.complete(messages);
  if (!online()) throw Object.assign(new Error('Server AI checks the daily limit when you are online. A model on this device still works.'), {kind: 'offline'});
  const r = await fetch('/api/ai/prompt', {method: 'POST', headers: authHeaders(), body: JSON.stringify({op: 'begin'})});
  const j = await r.json().catch(() => ({}));
  if (j.plan) quota = {...(quota || {}), ...j};
  const plan = !r.ok && r.status !== 429 ? {call: 'refuse', reason: j.need === 'signin' ? 'signin' : 'limit'} : serverTurnPlan(j);
  if (plan.call === 'refuse') {
    paintMeter(kind);
    throw Object.assign(new Error(plan.reason === 'signin' ? 'Sign in to use server AI.' : (j.error || 'No server prompts left today.')), {kind: plan.reason});
  }
  if (plan.call === 'direct') return ai.complete(messages);
  try {
    const raw = await ai.complete(messages);
    const c = await fetch('/api/ai/prompt', {method: 'POST', headers: authHeaders(), body: JSON.stringify({op: 'commit', hold: plan.hold})});
    const cj = await c.json().catch(() => ({}));
    if (cj.plan) quota = {...(quota || {}), ...cj};
    paintMeter(kind);
    return raw;
  } catch (e) {
    fetch('/api/ai/prompt', {method: 'POST', headers: authHeaders(), body: JSON.stringify({op: 'abort', hold: plan.hold}), keepalive: true}).catch(() => {});
    throw e;
  }
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
}

function table(heads, rows) {
  if (!rows.length) return '';
  return '<table><thead><tr>' + heads.map(h => '<th>' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' +
    rows.map(r => '<tr>' + r.map(c => '<td>' + esc(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table>';
}

function render(rep) {
  const out = $('out');
  out.hidden = false;
  const q = rep.qty;
  const qty = q ? '<p class="qty">From the footprint: <b>' + esc(q.area_sqft) + ' sq ft</b>, perimeter <b>' + esc(q.perimeter_ft) + ' ft</b>' +
    (q.concrete_yd3 != null ? ', concrete with waste <b>' + esc(q.concrete_yd3) + ' yd³</b>' : '') +
    '. Order area with the ' + esc(q.waste) + ' waste adder: <b>' + esc(q.order_area_sqft) + ' sq ft</b>. These numbers are computed here from the corners the model reported.</p>' : '';
  out.innerHTML = '<p class="banner">' + esc(rep.banner || BANNER) + '</p>' +
    (rep.say ? '<p class="say">' + esc(rep.say) + '</p>' : '') +
    (rep.layout ? '<h2>' + esc(rep.layout.name || 'Layout') + '</h2><p class="meta">' + esc(rep.layout.trade) + (rep.layout.notes ? ' · ' + esc(rep.layout.notes) : '') + '</p>' : '') +
    qty +
    table(['Item', 'Qty', 'Unit', 'Note'], rep.takeoff.map(r => [r.item, r.qty, r.unit, r.note])) +
    table(['Item', 'Qty', 'Unit', 'Each', 'Note'], rep.estimate.map(r => [r.item, r.qty, r.unit, r.unit_cost ? '$' + r.unit_cost : '', r.note])) +
    table(['Phase', 'Days', 'Note'], rep.schedule.map(r => [r.phase, r.days, r.note])) +
    table(['Issue', 'Where', 'Why', 'Severity'], rep.review.map(r => [r.issue, r.where, r.why, r.severity])) +
    (rep.safety.length ? '<ul class="safe">' + rep.safety.map(r => '<li>' + esc(r.item) + '</li>').join('') + '</ul>' : '') +
    (rep.ok ? '' : '<p class="meta">The model did not return JSON. Nothing above was applied as a layout.</p>');
  $('open-trade').hidden = !(rep.layout && rep.layout.trade);
  if (rep.layout && rep.layout.trade) {
    const t = rep.layout.trade;
    const href = ['deck', 'patio', 'pool', 'floor', 'roof', 'frame', 'plumb', 'elec', 'hvac', 'plan', 'garden'].includes(t) ? '../' + (t === 'plumb' ? 'plumb' : t) + '/' : './';
    $('open-trade').href = href;
    $('open-trade').textContent = 'Open the ' + t + ' estimator';
    try { sessionStorage.setItem('amni.construct.ai', JSON.stringify(rep)); } catch { /* ignore */ }
  }
}

async function fileToImage(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const scale = Math.min(1, 1280 / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale)), h = Math.max(1, Math.round(img.height * scale));
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d').drawImage(img, 0, 0, w, h);
    const data = c.toDataURL('image/jpeg', 0.85);
    const comma = data.indexOf(',');
    return {mime: 'image/jpeg', b64: data.slice(comma + 1), name: file.name};
  } finally { URL.revokeObjectURL(url); }
}

async function connect(kind) {
  const ai = new Assistant(t => { $('status').textContent = t; });
  const cfg = {};
  if (kind === 'local') {
    const found = await probeLocal();
    if (!found.length) throw new Error('No Ollama or LM Studio on this computer. Start one, or pick another engine.');
    cfg.base = found[0].base;
    cfg.model = found[0].models[0];
  } else if (kind === 'browser') {
    cfg.model = 'Qwen3.5-4B-Q4_K_M';
  } else if (ENGINES[kind]) {
    cfg.key = $('key').value.trim();
    if (!cfg.key) throw Object.assign(new Error('Paste an API key first.'), {status: 401});
    const guessed = detectKey(cfg.key);
    if (guessed && guessed !== kind && kind !== 'openrouter') kind = guessed;
  }
  await ai.connect(kind, cfg);
  return ai;
}

async function run() {
  if (busy) return;
  const kind = $('engine').value;
  const task = $('task').value;
  const notes = $('notes').value.trim();
  const job = TASKS[task];
  $('err').textContent = '';
  if (job.needImage && !image && kind !== 'paste') { $('err').textContent = 'Add a photo, sketch, or plan first, or describe it in the notes and switch the job.'; return; }
  busy = true;
  $('go').disabled = true;
  try {
    const messages = [{role: 'system', content: systemPrompt(task)}, {role: 'user', content: userTurn(task, notes, image && image.name), images: image ? [image] : undefined}];
    let raw;
    if (kind === 'paste') {
      $('paste-box').hidden = false;
      $('paste-prompt').value = messages.map(m => m.content).join('\n\n');
      $('status').textContent = 'Copy the prompt into your chat, paste the JSON reply below, then press Apply reply.';
      return;
    }
    const ai = await connect(kind);
    if (image && !ai.vision) $('status').textContent = 'This model does not see pictures. The notes still go through. A vision model can read the photo.';
    raw = await serverComplete(ai, messages, kind);
    render(parseReport(raw));
    $('status').textContent = 'Done. ' + BANNER;
  } catch (e) {
    const x = explainError(e, kind, false);
    $('err').textContent = (x.title ? x.title + '. ' : '') + (x.detail || e.message || 'The request failed.');
  } finally {
    busy = false;
    $('go').disabled = false;
    paintMeter(kind);
  }
}

function init() {
  const task = $('task'), engine = $('engine');
  task.innerHTML = Object.entries(TASKS).map(([k, v]) => '<option value="' + k + '">' + v.title + '</option>').join('');
  engine.addEventListener('change', () => {
    const k = engine.value;
    $('key-row').hidden = !['anthropic', 'openai', 'gemini', 'openrouter'].includes(k);
    $('paste-box').hidden = k !== 'paste';
    paintMeter(k);
  });
  $('file').addEventListener('change', async () => {
    const f = $('file').files && $('file').files[0];
    image = null;
    $('file-name').textContent = '';
    if (!f) return;
    try { image = await fileToImage(f); $('file-name').textContent = f.name; }
    catch { $('err').textContent = 'That image could not be read.'; }
  });
  $('go').addEventListener('click', run);
  $('apply-paste').addEventListener('click', () => { render(parseReport($('paste-reply').value)); $('status').textContent = 'Applied the pasted reply. ' + BANNER; });
  $('engine').dispatchEvent(new Event('change'));
  probeLocal().then(found => { if (found.length) $('status').textContent = 'Found ' + found[0].name + ' on this computer. On-device AI is unlimited.'; }).catch(() => {});
  refreshQuota();
}

init();
